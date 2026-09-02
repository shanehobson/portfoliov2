#!/usr/bin/env bash
#
# Puts the MP4s in public/video/ into shape for the web. Idempotent: each step
# checks the file first and only touches the ones that need it, so re-running
# it after a new video lands does not rewrite the others (and does not make
# `npm run media:push` re-upload them).
#
# 1. faststart — an MP4 whose `moov` atom trails the `mdat` cannot start
#    playing until the browser has fetched the end of the file. Remuxing is
#    lossless and takes a second per file.
# 2. downscale — the Stella loop was captured at 2560px wide but renders in
#    the same ~650px panel as the screenshots, so it is encoded at 1300 (DPR 2)
#    from the master in images-src/, the same arrangement as the images.
#
# public/video/ is not in git; it is hosted in the S3 media bucket and
# `npm run media:push` publishes what this writes. Requires: ffmpeg, ffprobe.
#
set -euo pipefail

root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
video="$root/public/video"
masters="$root/images-src"

for tool in ffmpeg ffprobe; do
  command -v "$tool" >/dev/null || { echo "error: $tool not found on PATH" >&2; exit 1; }
done
[ -d "$video" ] || { echo "error: $video not found (run npm run media:pull first)" >&2; exit 1; }

tmp="$(mktemp -d)"
trap 'rm -rf "$tmp"' EXIT

# The first top-level atom of interest, 'moov' or 'mdat'.
first_atom() {
  ffprobe -v trace -i "$1" 2>&1 | grep -m1 -o "type:'m\(oov\|dat\)'" | tr -d "'" | cut -d: -f2
}

width_of() {
  ffprobe -v error -select_streams v:0 -show_entries stream=width -of csv=p=0 "$1"
}

kb() { echo $(( ($(stat -f%z "$1") + 1023) / 1024 )); }

# ---------------------------------------------------------------- downscale
# name|max width. Encoded from images-src/<name> when that master exists;
# otherwise the copy in public/video is re-encoded in place (once — after
# that it is already at the target width and is skipped).
downscale=(
  "Stella_Demo.mp4|1300"
)

echo "Downscale:"
for entry in "${downscale[@]}"; do
  name="${entry%%|*}"; max="${entry##*|}"
  target="$video/$name"
  source="$masters/$name"
  [ -f "$source" ] || source="$target"
  if [ ! -f "$source" ]; then
    echo "  $name: missing, skipped"; continue
  fi
  if [ "$(width_of "$target" 2>/dev/null || echo 0)" -le "$max" ] && [ -f "$target" ]; then
    echo "  $name: already ≤ ${max}px wide, skipped"; continue
  fi
  before="$(kb "$source")"
  ffmpeg -loglevel error -y -i "$source" \
    -vf "scale=${max}:-2" -c:v libx264 -crf 23 -preset slow -pix_fmt yuv420p \
    -an -movflags +faststart "$tmp/$name"
  mv "$tmp/$name" "$target"
  printf '  %-28s %6s KB -> %6s KB (%spx)\n' "$name" "$before" "$(kb "$target")" "$max"
done

# ---------------------------------------------------------------- faststart
echo "faststart:"
for f in "$video"/*.mp4; do
  name="$(basename "$f")"
  if [ "$(first_atom "$f")" = "moov" ]; then
    echo "  $name: ok"; continue
  fi
  ffmpeg -loglevel error -y -i "$f" -c copy -movflags +faststart "$tmp/$name"
  mv "$tmp/$name" "$f"
  echo "  $name: remuxed (moov moved to the front)"
done

echo "Done."
