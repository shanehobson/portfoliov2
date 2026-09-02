# shanehobson.me

Personal portfolio and blog. A React + Vite single page, plus a statically
generated blog built from Markdown in `content/`.

## Running it

```sh
npm install
npm run media:pull   # after a fresh clone — see below
npm run dev          # http://localhost:5173
npm run build        # -> dist/
npm run preview      # serve the built output
```

`npm run dev` and `npm run build` first regenerate the blog's HTML entry points
from `content/posts/` (`scripts/build-blog.mjs`).

The contact form posts to a Lambda behind CloudFront. To exercise it in dev,
copy `.env.example` to `.env` and fill in the stack's `ContactFunctionUrl`
output; see [`cdk/README.md`](cdk/README.md). Without it the form's submit
fails locally and everything else works.

## Media

`public/images/` and `public/video/` hold the project posters, portraits and
demo videos. They are deliberately kept out of git — the files are served from
an S3 media bucket via CloudFront, on the same origin as the site, so markup
keeps using plain `/images/...` and `/video/...` paths. After a fresh clone run
`npm run media:pull` to get a local copy for `vite`; after changing a file run
`npm run media:push`. See [`cdk/README.md`](cdk/README.md).

`scripts/optimize-images.sh` re-encodes the originals in `images-src/` (also
gitignored) into `public/images/`, and cuts poster frames from
`public/video/`.

## Deploying

```sh
npm run deploy   # vite build, then cdk deploy
```

The infrastructure is a CDK app in `cdk/`; setup and details are in its README.
