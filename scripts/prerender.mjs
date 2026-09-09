// Prerenders the homepage into dist/index.html, and writes the two files that
// mirror the site as plain text: dist/index.md and dist/llms-full.txt.
//
// Runs last in `npm run build`, after the client build (dist/) and the SSR
// build of src/entry-server.jsx (dist-ssr/). It renders <App /> once to a
// string, drops it into the empty #root the client build emitted, and inlines
// the main stylesheet in place of its <link> so the first paint needs nothing
// but this one document. The CSS file stays in dist/assets; nothing else
// references it, and it is harmless there.
//
// The same render is the source of index.md, which is why this is the script
// that writes it: the homepage's prose lives in JSX across half a dozen
// components, so converting what React actually rendered is the only version
// that cannot drift from the page. The articles' mirrors are written straight
// from their source Markdown by scripts/build-blog.mjs; this script only
// gathers them, because it is the one that runs after everything exists.
import { readFile, readdir, writeFile, rm } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

import TurndownService from 'turndown'

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

// ------------------------------------------------------ the plain-text mirrors

const SITE = 'https://shanehobson.me'

const turndown = new TurndownService({
  headingStyle: 'atx',
  codeBlockStyle: 'fenced',
  bulletListMarker: '-',
})

// Everything aria-hidden is scenery: the ghosted name behind the portrait, the
// rules, the arrows, the year on the bottom rail. It is hidden from a screen
// reader for the same reason it should not be in a text mirror — it repeats
// what the real content already says, or says nothing at all.
turndown.addRule('decorative', {
  filter: (node) => node.getAttribute?.('aria-hidden') === 'true',
  replacement: () => '',
})

// Layout that carries nothing a reader of this file needs: the scroll cue and
// the skip link (navigation for a pointer and a keyboard), the hero's contact
// card and wordmark (the Contact section at the foot gives the same address in
// full), the section eyebrows and the project numbers (the headings and the
// order of the file already say both).
const CHROME = [
  'hero-scroll',
  'skip-link',
  'hero-cards',
  'hero-name',
  'eyebrow',
  'project-index',
]
turndown.addRule('chrome', {
  filter: (node) => CHROME.some((c) => node.classList?.contains(c)),
  replacement: () => '',
})

// <br> appears in this page only inside a heading, to break a title across two
// lines. A hard line break inside a Markdown heading ends the heading, which
// turns "About Me" into an <h2> and a stray paragraph.
turndown.addRule('lineBreak', { filter: 'br', replacement: () => ' ' })

// A silent looping screenshot. The aria-label is the description written for
// someone who cannot watch it, which makes it the right line here too.
turndown.addRule('video', {
  filter: 'video',
  replacement: (_content, node) => {
    const label = node.getAttribute('aria-label')
    const src = node.getAttribute('src')
    return label ? `\n\n[Video: ${label}](${SITE}${src})\n\n` : ''
  },
})

const main = app.match(/<main id="content">([\s\S]*)<\/main>/)
if (!main) {
  throw new Error('prerender: <main id="content"> not found in the render')
}

const indexMd = `${turndown
  // React renders sibling links with nothing between them, and Markdown would
  // run the two into one unreadable `[a](x)[b](y)`.
  .turndown(main[1].replace(/<\/a>\s*<a /g, '</a> <a '))
  // Turndown leaves the gaps where the stripped nodes were.
  .replace(/\n{3,}/g, '\n\n')
  // This file is read detached from the site, so a root-relative path has
  // nothing to be relative to.
  .replace(/\]\((\/[^)]*)\)/g, `](${SITE}$1)`)
  .trim()}\n`

const indexMdPath = resolve(dist, 'index.md')
await writeFile(
  indexMdPath,
  `<!-- ${SITE}/ as Markdown. Generated from the same render as index.html. -->\n\n${indexMd}`,
)

// One fetch for everything, as https://llmstxt.org describes it: the homepage
// followed by every article, in the order llms.txt lists them — which is the
// order the blog index and the feed use, newest first.
const blogDir = resolve(dist, 'blog')
const mirrors = (await readdir(blogDir)).filter((f) => f.endsWith('.md'))
const articles = await Promise.all(
  mirrors.map(async (file) => {
    const text = await readFile(resolve(blogDir, file), 'utf8')
    const published = /^- Published: (.+)$/m.exec(text)?.[1] ?? ''
    return { date: Date.parse(published), text }
  }),
)
articles.sort((a, b) => b.date - a.date)

const full = [
  `# ${SITE}`,
  '',
  'The complete text of this site: the homepage, then every article, newest',
  'first. See /llms.txt for the same material as a list of links.',
  '',
  '---',
  '',
  indexMd,
  ...articles.map(({ text }) => `\n---\n\n${text}`),
].join('\n')

const fullPath = resolve(dist, 'llms-full.txt')
await writeFile(fullPath, full)

console.log(
  `prerender: dist/index.html — ${(app.length / 1024).toFixed(1)} kB of markup, ` +
    `${(css.length / 1024).toFixed(1)} kB of CSS inlined`,
)
console.log(
  `mirrors: dist/index.md — ${(indexMd.length / 1024).toFixed(1)} kB, ` +
    `dist/llms-full.txt — ${(full.length / 1024).toFixed(1)} kB from ` +
    `${articles.length} article(s)`,
)
