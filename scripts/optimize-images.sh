#!/usr/bin/env bash
#
# Re-encodes the full-size originals in images-src/ into web-sized WebP files
# in public/images/, and generates video poster frames from public/video/.
#
# Everything this writes is committed; images-src/ is gitignored, so this only
# needs to run when an original changes. Requires: magick, cwebp, ffmpeg.
#
set -euo pipefail

root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
src="$root/images-src"
video="$root/public/video"
out="$root/public/images"

for tool in magick cwebp ffmpeg; do
  command -v "$tool" >/dev/null || { echo "error: $tool not found on PATH" >&2; exit 1; }
done

[ -d "$src" ] || { echo "error: $src not found (it is gitignored — restore the originals first)" >&2; exit 1; }

mkdir -p "$out"
tmp="$(mktemp -d)"
trap 'rm -rf "$tmp"' EXIT

# encode <input> <output-name> <geometry> <quality> [extra magick args...]
#
# Names an output in public/images/ and reports the saving; the encode itself
# lives in encode-image.sh, which the blog importer shares.
encode() {
  local input="$1" name="$2" geometry="$3" quality="$4"; shift 4
  bash "$root/scripts/encode-image.sh" "$input" "$out/$name.webp" "$geometry" "$quality" "$@"
  printf '  %-24s %6s KB -> %6s KB\n' "$name.webp" \
    "$(( ($(stat -f%z "$input") + 1023) / 1024 ))" \
    "$(( ($(stat -f%z "$out/$name.webp") + 1023) / 1024 ))"
}

# Portfolio screenshots render at most 650px wide; 1300 covers DPR-2 displays.
screenshots=(
  blinds-tracker
  contract-generator
  knecht-insurance
  loader-gallery
  odyssey-hero
)

echo "Screenshots (1300w, q78):"
for name in "${screenshots[@]}"; do
  encode "$src/$name.png" "$name" "1300x>" 78
done

echo "Other images:"
# The hero has no photograph any more — it is type on a ruled grid — so bg.jpg
# is no longer encoded. shane.png is now the About portrait and the avatar on
# the hero's contact card.
encode "$src/shane.png"         shane          "600x>" 82
encode "$src/blog.png"          blog          "1300x>" 80
encode "$src/stella-poster.jpg" stella-poster "1300x>" 78
# Book.png is 509x346 and renders at most a card wide, so there is nothing to
# downsize — keep the quality high and just change codec.
encode "$src/Book.png"          Book          "1300x>" 90

# Video posters: a frame from one second in, sized like the screenshots since
# videos sit in the same panel. The homak.dev walkthroughs (zaera, max-manicure,
# nightingale-nails, science-of-dance, odyssey, vault, lumina, hobson-electric)
# are copied from ../homak/public/videos and replace the old screenshots for
# those projects. Stella has a hand-picked poster in images-src, handled above.
echo "Video posters (1300w, q78):"
posters=(
  "zaera.mp4|zaera-poster"
  "odyssey.mp4|odyssey-poster"
  "vault.mp4|vault-poster"
  "workout-tracker-video.mp4|workout-tracker-poster"
  "app-demo-1.mp4|pitching-theory-poster"
  "Invoice_Generator.mp4|invoice-generator-poster"
  "max-manicure.mp4|max-manicure-poster"
  "nightingale-nails.mp4|nightingale-nails-poster"
  "science-of-dance.mp4|science-of-dance-poster"
  "hobson-electric.mp4|hobson-electric-poster"
  "lumina.mp4|lumina-poster"
)
for entry in "${posters[@]}"; do
  file="${entry%%|*}"; name="${entry##*|}"
  frame="$tmp/$name-frame.png"
  ffmpeg -loglevel error -y -ss 1 -i "$video/$file" -frames:v 1 "$frame"
  encode "$frame" "$name" "1300x>" 78
done

echo "Done."
