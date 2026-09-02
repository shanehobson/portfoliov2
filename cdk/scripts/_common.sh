# Shared helpers for the media and deploy scripts. Sourced, not executed.
set -euo pipefail

CDK_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
REPO_DIR="$(cd "$CDK_DIR/.." && pwd)"
STACK_NAME="PortfolioDeployStack"
REGION="us-east-2"
# Each of these is a directory under public/ and a prefix in the media bucket,
# so the layout in S3 mirrors the layout the site links against.
MEDIA_PREFIXES=(images video)

# Profile comes from config.local.ts unless the environment already set one.
if [[ -z "${AWS_PROFILE:-}" ]]; then
  AWS_PROFILE="$(sed -n 's/.*profile: *"\([^"]*\)".*/\1/p' "$CDK_DIR/config.local.ts")"
  if [[ -z "$AWS_PROFILE" ]]; then
    echo "Could not read 'profile' from cdk/config.local.ts, and AWS_PROFILE is unset." >&2
    exit 1
  fi
fi
export AWS_PROFILE

stack_output() {
  aws cloudformation describe-stacks \
    --stack-name "$STACK_NAME" --region "$REGION" \
    --query "Stacks[0].Outputs[?OutputKey=='$1'].OutputValue" --output text
}

require_stack() {
  # `|| true` so a missing stack reports the hint below rather than the raw
  # CloudFormation error that `set -e` would otherwise exit on.
  MEDIA_BUCKET="$(stack_output MediaBucketName 2>/dev/null || true)"
  if [[ -z "$MEDIA_BUCKET" || "$MEDIA_BUCKET" == "None" ]]; then
    echo "Could not read MediaBucketName from stack '$STACK_NAME' in $REGION." >&2
    echo "Deploy the stack first:  cd $CDK_DIR && npm run deploy" >&2
    exit 1
  fi
}
