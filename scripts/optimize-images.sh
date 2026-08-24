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
# Geometry is a magick resize spec. Every call ends in `>` so an original that is
# already smaller than the target is left at its own size rather than upscaled.
encode() {
  local input="$1" name="$2" geometry="$3" quality="$4"; shift 4
  local stage="$tmp/$name.png"
  magick "$input" -resize "$geometry" "$@" -strip "$stage"
  cwebp -quiet -q "$quality" "$stage" -o "$out/$name.webp"
  printf '  %-24s %6s KB -> %6s KB\n' "$name.webp" \
    "$(( ($(stat -f%z "$input") + 1023) / 1024 ))" \
    "$(( ($(stat -f%z "$out/$name.webp") + 1023) / 1024 ))"
}

# Portfolio screenshots render at most 650px wide; 1300 covers DPR-2 displays.
screenshots=(
  blinds-tracker
  contract-generator
  hobson-electric
  knecht-insurance
  loader-gallery
  lumina
  max-manicure
  nadia
  nightingale-nails
  zaera
)

echo "Screenshots (1300w, q78):"
for name in "${screenshots[@]}"; do
  encode "$src/$name.png" "$name" "1300x>" 78
done

echo "Other images:"
# The hero is a grainy 12MP phone photo sitting under a dark overlay at
# background-size: cover — a slight blur before encoding buys ~25% and is
# invisible through the overlay.
encode "$src/bg.jpg"            bg            "1920x>" 62 -blur 0x0.6
encode "$src/bg.jpg"            bg-mobile     "1000x>" 55 -blur 0x0.6
encode "$src/shane.png"         shane          "600x>" 82
encode "$src/medium.png"        medium        "1120x>" 78
encode "$src/stella-poster.jpg" stella-poster "1300x>" 78
# Book.png is only 291x439 and already renders upscaled to 351x530, so there is
# nothing to downsize — keep the quality high and just change codec.
encode "$src/Book.png"          Book          "1300x>" 90

# Video posters: the demo videos render at height 300, so 600 covers DPR-2.
# Stella has a hand-picked poster in images-src and is handled above.
echo "Video posters (600h, q78):"
posters=(
  "app-demo-1.mp4|pitching-theory-poster"
  "Vault_Demo.mp4|vault-poster"
  "Odyssey_video.mp4|odyssey-poster"
  "Invoice_Generator.mp4|invoice-generator-poster"
  "workout-tracker-video.mp4|workout-tracker-poster"
)
for entry in "${posters[@]}"; do
  file="${entry%%|*}"; name="${entry##*|}"
  frame="$tmp/$name-frame.png"
  ffmpeg -loglevel error -y -ss 1 -i "$video/$file" -frames:v 1 "$frame"
  encode "$frame" "$name" "x600>" 78
done

echo "Done."
