// Prerenders the homepage into dist/index.html.
//
// Runs last in `npm run build`, after the client build (dist/) and the SSR
// build of src/entry-server.jsx (dist-ssr/). It renders <App /> once to a
// string, drops it into the empty #root the client build emitted, and inlines
// the main stylesheet in place of its <link> so the first paint needs nothing
// but this one document. The CSS file stays in dist/assets; nothing else
// references it, and it is harmless there.
import { readFile, writeFile, rm } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const dist = resolve(root, 'dist')
const ssrDir = resolve(root, 'dist-ssr')
const indexPath = resolve(dist, 'index.html')

const { render } = await import(
  pathToFileURL(resolve(ssrDir, 'entry-server.js')).href
)
const app = render()

let html = await readFile(indexPath, 'utf8')

const rootTag = '<div id="root"></div>'
if (!html.includes(rootTag)) {
  throw new Error(`prerender: ${rootTag} not found in dist/index.html`)
}
html = html.replace(rootTag, () => `<div id="root">${app}</div>`)

const linkTag = /<link rel="stylesheet"[^>]*href="\/(assets\/main-[^"]+\.css)"[^>]*>/
const link = html.match(linkTag)
if (!link) {
  throw new Error('prerender: main stylesheet <link> not found in dist/index.html')
}
const css = await readFile(resolve(dist, link[1]), 'utf8')
html = html.replace(link[0], () => `<style>${css.trim()}</style>`)

await writeFile(indexPath, html)
await rm(ssrDir, { recursive: true, force: true })

console.log(
  `prerender: dist/index.html — ${(app.length / 1024).toFixed(1)} kB of markup, ` +
    `${(css.length / 1024).toFixed(1)} kB of CSS inlined`,
)
