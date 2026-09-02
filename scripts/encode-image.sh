#!/usr/bin/env bash
#
# Re-encodes one image to WebP: magick resize -> cwebp.
#
# Usage: encode-image.sh <input> <output.webp> <geometry> <quality> [extra magick args...]
#
# Geometry is a magick resize spec; callers end it in `>` so an original that is
# already smaller than the target is left at its own size rather than upscaled.
#
# Two callers share this: optimize-images.sh (the hand-tuned portfolio images)
# and scripts/import-medium.mjs (blog images, one rule for all of them).
#
set -euo pipefail

if [ "$#" -lt 4 ]; then
  echo "usage: $(basename "$0") <input> <output.webp> <geometry> <quality> [magick args...]" >&2
  exit 2
fi

input="$1" output="$2" geometry="$3" quality="$4"; shift 4

for tool in magick cwebp; do
  command -v "$tool" >/dev/null || { echo "error: $tool not found on PATH" >&2; exit 1; }
done

stage="$(mktemp -t encode-image).png"
trap 'rm -f "$stage"' EXIT

mkdir -p "$(dirname "$output")"
magick "$input" -resize "$geometry" "$@" -strip "$stage"
cwebp -quiet -q "$quality" "$stage" -o "$output"
