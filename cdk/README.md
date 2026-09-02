# portfolio cdk

CDK app for the shanehobson.me static site and its hosted media.

## One-time setup

```bash
cd cdk
cp config.example.ts config.local.ts   # then edit with real account / profile
npm install
```

`config.local.ts` is gitignored — it holds the AWS account ID and the local
AWS profile name. See `config.example.ts` for the schema. The account is
already CDK-bootstrapped in `us-east-2`.

`profile` is read automatically by the scripts under `scripts/` — the media
sync and `npm run deploy`, which source it in `scripts/_common.sh`. The CDK app
itself never reads `config.local.ts` for credentials — it takes only `account`
from there, and resolves credentials the way any AWS SDK client does. So a bare
`npx cdk` command needs the profile in the environment; see below.

## Deploy

From the repo root:

```bash
npm run deploy                # vite build -> dist/, then cdk deploy
```

That runs `scripts/deploy.sh`, which exports the profile from
`config.local.ts` and calls `cdk deploy --require-approval never`. To review
first, or to run any other `cdk` command, export the profile yourself:

```bash
cd cdk
export AWS_PROFILE="$(sed -n 's/.*profile: *"\([^"]*\)".*/\1/p' config.local.ts)"
npx cdk diff
```

Without `AWS_PROFILE` (or a `--profile` flag), `cdk` fails before it reaches the
stack:

```
Need to perform AWS calls for account <account>, but no credentials have been configured
```

That is expected rather than a broken setup — unlike the scripts, `cdk` does
not read the profile out of `config.local.ts`.

The deploy uploads `dist/` to the site bucket in three prefix-scoped
deployments (hashed `assets/`, the blog's HTML, and everything left at the
root), then invalidates `/index.html` and `/blog/*`.

A content-only release — new or changed pages, no infrastructure edits — shows
up in `cdk diff` as changed `SourceObjectKeys` hashes on the `DeploySite*`
custom resources, and nothing else. Anything touching the distribution or the
buckets means the stack itself changed, so read it carefully before deploying.

## Stack

`PortfolioDeployStack` in `us-east-2`:

- **`SiteBucket`** — `shanehobson.me`, referenced by name, not owned. Holds
  the Vite build.
- **`MediaBucket`** — private, owned by the stack, holds images and video (see
  below)
- **CloudFront distribution** `EEN9EO2INB4OB`, adopted with `cdk import`. OAC
  on both buckets, aliased to `shanehobson.me` and `www.shanehobson.me`.
  `/images/*` and `/video/*` route to the media bucket; everything else to the
  site bucket.
- **CloudFront Function** rewriting the blog's pretty URLs to `/index.html`
- **ACM certificate** in `us-east-1`, referenced by ARN

The media bucket and the distribution are `RETAIN` — `cdk destroy` leaves them
behind, so a teardown never silently deletes the media.

## Media

Images and video are **not** in git. They live in the media bucket and are
served through the same distribution as the site, on the `/images/*` and
`/video/*` behaviours. Because it is the same origin, `src/data/projects.jsx`,
`index.html` and the blog templates keep using plain `/images/x.webp` and
`/video/x.mp4` paths — there is no media hostname to configure and no CORS to
get wrong.

`public/images/` and `public/video/` are gitignored but still the working
directories for media: Vite serves them in dev, `scripts/optimize-images.sh`
writes into `public/images/`, and the site deployment excludes both so the
bytes are not duplicated into the site bucket.

```bash
npm run media:pull   # S3 -> public/images, public/video   (do this after a fresh clone)
npm run media:push   # public/images, public/video -> S3, then invalidate /images/* and /video/*
```

`media:push` syncs with `--delete`, so each prefix in the bucket ends up
mirroring its local directory exactly. Objects are uploaded with a one-week
max-age rather than `immutable`, because filenames are stable — a re-encoded
poster keeps its name, and a browser holding the old copy should refresh within
the week rather than never. The invalidation is what makes a replaced file
visible on CloudFront right away.

Both scripts read the AWS profile from `config.local.ts` unless `AWS_PROFILE`
is already set, and resolve the bucket and distribution from the stack's
CloudFormation outputs — so there is nothing to keep in sync by hand.

### First-time migration

The media bucket only exists once the stack has been deployed, and the deploy
also switches the `/images/*` and `/video/*` behaviours over to it. So the
order is:

```bash
npm run deploy        # creates the bucket, repoints the two behaviours
npm run media:push    # fills it; media 403s until this finishes
```

The copies the old per-prefix deployments left under `images/` and `video/` in
the site bucket are no longer served by anything. They are harmless, and can be
removed with `aws s3 rm --recursive` on those two prefixes once the media bucket
is populated.
