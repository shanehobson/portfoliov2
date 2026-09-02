# portfolio cdk

CDK app for the shanehobson.me static site and its hosted media.

## One-time setup

```bash
cd cdk
cp config.example.ts config.local.ts   # then edit with real account / profile
npm install
```

`config.local.ts` is gitignored — it holds the AWS account ID, the Route 53
hosted zone ID, the local AWS profile name, and the contact form's mail
settings (`sendingDomain`, `fromEmail`, `toEmails`). See `config.example.ts`
for the schema. The account is already CDK-bootstrapped in `us-east-2`.

The recipient addresses are personal inboxes and deliberately live only there,
never in tracked source — grepping the repo for the mail provider's domain
should turn up nothing.

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
custom resources, and nothing else. Anything touching the distribution, the
DNS records, or the buckets means the stack itself changed, so read it
carefully before deploying.

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
- **`SiteEmailIdentity`** — SES domain identity for `shanehobson.me`, with a
  `mail.shanehobson.me` custom MAIL FROM, plus a `_dmarc` TXT record, all in
  the Route 53 hosted zone (referenced by ID, not owned)
- **`ContactRateLimitTable`** — DynamoDB, per-IP submission counter, TTL'd
- **`ContactFunction`** — Node 20 Lambda behind a Function URL, reached only
  through the `/api/contact` CloudFront behaviour (so the browser call is
  same-origin and there is no CORS config, and the Function URL never has to
  be committed)

The media bucket and the distribution are `RETAIN` — `cdk destroy` leaves them
behind, so a teardown never silently deletes the media.

## Contact form

The "Connect with me" modal POSTs JSON to `/api/contact`. CloudFront routes
that path to the Lambda, which validates the payload, checks a per-IP rate
limit (5 per 10 minutes) and a honeypot field, then sends one SES mail with
the sender's address as `Reply-To`.

**The SES account is in the sandbox** (`aws sesv2 get-account` reports
`ProductionAccessEnabled: false`), which means mail is only delivered to
*verified* identities. Every address in `toEmails` must therefore already be a
verified SES identity in `us-east-2`. Adding a recipient that is not verified
makes the send fail with a 502 from the Lambda — either verify it first
(`aws sesv2 create-email-identity --email-identity <address> --region us-east-2`,
then click the link in the mail it sends), or request production access.

For local dev, take the `ContactFunctionUrl` stack output and put it in a
`.env` at the repo root:

```bash
CONTACT_FN_URL=https://<id>.lambda-url.us-east-2.on.aws/
```

`vite.config.js` proxies `/api/contact` there in dev, so the same fetch works
against the real Lambda without CORS. Without the variable there is no proxy
and submissions fail in dev only. `.env` is gitignored; see `.env.example`.

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
