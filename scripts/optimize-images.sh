#!/usr/bin/env bash
#
# Re-encodes the full-size originals in images-src/ into web-sized WebP files
# in public/images/, and generates video poster frames from public/video/.
#
# Neither directory is in git: images-src/ is gitignored, and public/images/
# is hosted in the S3 media bucket (`npm run media:push` publishes what this
# writes). So this only needs to run when an original changes.
# Requires: magick, cwebp, ffmpeg.
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
)

echo "Screenshots (1300w, q78):"
for name in "${screenshots[@]}"; do
  encode "$src/$name.png" "$name" "1300x>" 78
done

echo "Other images:"
# The hero has no photograph any more — it is type on a ruled grid — so bg.jpg
# is no longer encoded. shane.png is the About portrait.
encode "$src/shane.png"         shane          "600x>" 82
encode "$src/blog.png"          blog          "1300x>" 80
encode "$src/stella-poster.jpg" stella-poster "1300x>" 78
# Book.png is 509x346 and renders at most a card wide, so there is nothing to
# downsize — keep the quality high and just change codec.
encode "$src/Book.png"          Book          "1300x>" 90

# The hero. Every one of these is above the fold and competes with the portrait
# for bandwidth, so each is cut to the size its slot actually renders at:
#   - the portrait is 320px wide on a phone, up to ~763px on a desktop, and
#     the master is only 931px, so there is no DPR-2 desktop variant to make;
#   - the contact card's avatar is a 46px circle (144 covers DPR 3).
# Hero.jsx's srcset/sizes and the preload in index.html list the same files.
echo "Hero (portrait 480/640/931 q80, avatar 144 q82):"
encode "$src/shane-cutout.png"  shane-cutout-480  "480x>" 80
encode "$src/shane-cutout.png"  shane-cutout-640  "640x>" 80
encode "$src/shane-cutout.png"  shane-cutout      "931x>" 80
encode "$src/shane.png"         shane-avatar   "144x144^" 82 -gravity center -extent 144x144

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
