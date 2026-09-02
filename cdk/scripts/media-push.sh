#!/usr/bin/env bash
# Upload public/images and public/video to the media bucket and invalidate the
# CDN copies.
source "$(dirname "${BASH_SOURCE[0]}")/_common.sh"
require_stack

for prefix in "${MEDIA_PREFIXES[@]}"; do
  if [[ ! -d "$REPO_DIR/public/$prefix" ]]; then
    echo "No local media directory at $REPO_DIR/public/$prefix — nothing to push." >&2
    echo "Run media:pull first if this is a fresh clone." >&2
    exit 1
  fi
done

# Filenames are stable (a re-encoded poster keeps its name), so the objects get
# a long-but-finite max-age rather than `immutable`: the invalidation below
# refreshes CloudFront right away, and a browser holding an old copy refreshes
# within the week instead of never.
for prefix in "${MEDIA_PREFIXES[@]}"; do
  local_dir="$REPO_DIR/public/$prefix"
  echo "Pushing $local_dir -> s3://$MEDIA_BUCKET/$prefix/ (profile: $AWS_PROFILE)"
  aws s3 sync "$local_dir" "s3://$MEDIA_BUCKET/$prefix/" \
    --region "$REGION" \
    --delete \
    --exclude ".DS_Store" \
    --cache-control "public, max-age=604800"
done

DIST_ID="$(stack_output DistributionId)"
if [[ -n "$DIST_ID" && "$DIST_ID" != "None" ]]; then
  paths=()
  for prefix in "${MEDIA_PREFIXES[@]}"; do paths+=("/$prefix/*"); done
  echo "Invalidating ${paths[*]} on $DIST_ID"
  aws cloudfront create-invalidation \
    --distribution-id "$DIST_ID" --paths "${paths[@]}" \
    --query 'Invalidation.Id' --output text
fi

echo "Done."
