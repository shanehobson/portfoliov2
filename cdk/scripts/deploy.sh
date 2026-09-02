#!/usr/bin/env bash
# Deploy the stack with the profile from config.local.ts. `cdk` itself never
# reads that file for credentials, so this is what puts AWS_PROFILE in its
# environment. Extra arguments are passed through to `cdk deploy`.
source "$(dirname "${BASH_SOURCE[0]}")/_common.sh"

cd "$CDK_DIR"
exec npx cdk deploy --require-approval never "$@"
