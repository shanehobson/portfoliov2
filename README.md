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
`public/video/`. `scripts/optimize-videos.sh` puts the MP4s in `public/video/`
in shape (faststart, and the autoplay loop downscaled from its master in
`images-src/`); both are idempotent.

## Building

`npm run build` is three steps: the client build, an SSR build of
`src/entry-server.jsx`, and `scripts/prerender.mjs`, which renders the
homepage into `dist/index.html` and inlines its stylesheet. The browser gets
the whole page in the first response and React only hydrates it. If the
console shows a hydration warning on `npm run preview`, something rendered
differently on the server than in the browser; fix it rather than ignoring it.

## Plain-text mirrors

Every page is published a second time as Markdown, for the crawlers that feed
language models — they get the content without a layout around it, and the
`<head>` of each page points at its own mirror.

| URL | Written by | From |
| --- | --- | --- |
| `/llms.txt` | `build-blog.mjs` | An index of the whole site, per [llmstxt.org](https://llmstxt.org) |
| `/index.md` | `prerender.mjs` | The same SSR render as `index.html`, converted with `turndown` |
| `/blog/<slug>.md` | `build-blog.mjs` | The post's source Markdown, with its figures copied to `/blog/media/` |
| `/llms-full.txt` | `prerender.mjs` | The above concatenated, newest article first |

The homepage's prose lives in JSX across half a dozen components, which is why
`/index.md` is converted from what React rendered rather than kept alongside
it: there is no second copy to drift. Articles are the other way round —
`content/posts/` is already Markdown, so the mirror is the source.

Anything that only exists in the HTML — the `<meta>` tags, the JSON-LD — is
restated as a short header at the top of each mirror.

## Deploying

```sh
npm run deploy   # npm run build, then cdk deploy
```

The infrastructure is a CDK app in `cdk/`; setup and details are in its README.
