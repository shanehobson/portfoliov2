#!/usr/bin/env bash
# Fetch the hosted images and video into public/ so `vite` can serve them.
# Those directories are gitignored; this is how a fresh clone gets the media.
source "$(dirname "${BASH_SOURCE[0]}")/_common.sh"
require_stack

for prefix in "${MEDIA_PREFIXES[@]}"; do
  local_dir="$REPO_DIR/public/$prefix"
  mkdir -p "$local_dir"
  echo "Pulling s3://$MEDIA_BUCKET/$prefix/ -> $local_dir (profile: $AWS_PROFILE)"
  aws s3 sync "s3://$MEDIA_BUCKET/$prefix/" "$local_dir" --region "$REGION"
done
echo "Done."
