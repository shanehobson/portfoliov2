#!/usr/bin/env node
/**
 * Imports articles from the Medium RSS feed into content/posts/<slug>.md.
 *
 * Medium stays the authoring surface, so this is a durable tool rather than a
 * one-shot: it runs again every time a new article is published. It keys on
 * slug and by default skips any post whose Markdown already exists, so the
 * hand-edits made after import (language tags, mainly) survive a re-run.
 *
 *   npm run import:medium              import anything new
 *   npm run import:medium -- --force <slug>   re-import one post, diff first
 *   npm run import:medium -- --dry-run        report what would change
 *
 * Standing constraint: the feed only ever returns the 10 most recent posts, so
 * run this before a new article is more than nine posts old, or it falls off
 * the feed and has to be recovered by hand from the article page.
 */
import { execFileSync } from 'node:child_process';
import { mkdir, mkdtemp, readdir, rm, writeFile } from 'node:fs/promises';
import { existsSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';

import TurndownService from 'turndown';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const POSTS_DIR = path.join(ROOT, 'content', 'posts');
const IMAGES_DIR = path.join(ROOT, 'content', 'images');
const ENCODE = path.join(ROOT, 'scripts', 'encode-image.sh');

const FEED_URL = 'https://medium.com/feed/@shanehobson1';

// Blog images render at most 650px wide, the same as the portfolio
// screenshots, so 1300 covers DPR-2 displays. One rule for all of them.
const IMAGE_GEOMETRY = '1300x>';
const IMAGE_QUALITY = '78';

// ---------------------------------------------------------------- feed parsing

const CDATA = (s) => s.replace(/^\s*<!\[CDATA\[([\s\S]*)\]\]>\s*$/, '$1');

function tagText(xml, tag) {
  const m = xml.match(new RegExp(`<${tag}(?:\\s[^>]*)?>([\\s\\S]*?)</${tag}>`));
  return m ? CDATA(m[1]).trim() : '';
}

function tagTextAll(xml, tag) {
  const out = [];
  for (const m of xml.matchAll(new RegExp(`<${tag}(?:\\s[^>]*)?>([\\s\\S]*?)</${tag}>`, 'g'))) {
    out.push(CDATA(m[1]).trim());
  }
  return out;
}

/** Slug is the Medium URL path with the trailing id hash and query stripped. */
function slugFromLink(link) {
  const last = new URL(link).pathname.split('/').filter(Boolean).pop() ?? '';
  return last.replace(/-[0-9a-f]{8,}$/i, '');
}

function parseFeed(xml) {
  return (xml.match(/<item>[\s\S]*?<\/item>/g) ?? []).map((item) => {
    const link = tagText(item, 'link').split('?')[0];
    return {
      title: decodeEntities(tagText(item, 'title')),
      link,
      slug: slugFromLink(link),
      date: new Date(tagText(item, 'pubDate')).toISOString().slice(0, 10),
      tags: tagTextAll(item, 'category'),
      html: tagText(item, 'content:encoded'),
    };
  });
}

// ------------------------------------------------------------------ html bits

const ENTITIES = {
  amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ',
  hellip: '…', mdash: '—', ndash: '–',
  lsquo: '‘', rsquo: '’', ldquo: '“', rdquo: '”',
};

function decodeEntities(s) {
  return s
    .replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(Number(d)))
    .replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCodePoint(parseInt(h, 16)))
    .replace(/&([a-z]+);/gi, (m, name) => ENTITIES[name.toLowerCase()] ?? m);
}

/**
 * Medium ships code as <pre> with <br> for newlines and HTML-escaped entities.
 * Turning that back into text has to happen before the DOM parser sees it, so
 * the blocks are lifted out to placeholders and re-inserted as fences after the
 * Markdown conversion.
 */
function liftCodeBlocks(html) {
  const blocks = [];
  const lifted = html.replace(/<pre[^>]*>([\s\S]*?)<\/pre>/g, (_, inner) => {
    const code = decodeEntities(
      inner
        .replace(/<br\s*\/?>/gi, '\n')
        .replace(/<\/?[a-z][^>]*>/gi, '')
    ).replace(/\s+$/, '');
    blocks.push(code);
    return `<p>@@CODEBLOCK${blocks.length - 1}@@</p>`;
  });
  return { html: lifted, blocks };
}

/**
 * No article carries a language hint, so each fence gets an inferred tag that
 * Shiki resolves at build time. Anything guessed wrong is a one-word fix in the
 * Markdown, and the guess is never made again for that post — the importer
 * skips files that already exist.
 */
function inferLanguage(code) {
  const has = (re) => re.test(code);

  // Diagrams drawn with box characters are prose, not code — check first, or
  // the JavaScript fallback below claims them.
  if (has(/[│├└─┌┐┘┬┴┼]/)) return 'text';

  if (has(/^\s*[[{][\s\S]*[\]}]\s*$/) && has(/"[^"]+"\s*:/) && !has(/\bfunction\b|=>|\/\//)) return 'json';
  if (has(/^\s*(npm|npx|yarn|pnpm|git|cd|curl|aws|sudo|bash|docker)\s/m) && !has(/[;{}]\s*$/m)) return 'bash';
  if (has(/^\s*(@Component|@Injectable|@NgModule|@Input|@Output)\s*\(/m)) return 'typescript';
  if (has(/<[A-Z][A-Za-z]*[\s/>]/) && has(/\b(return|const|function|=>)\b/)) return 'jsx';
  if (has(/\binterface\s+\w+\s*{|:\s*(string|number|boolean|void|any)\b|\bas\s+\w+;/)) return 'typescript';
  if (has(/^\s*(def|class)\s+\w+\([^)]*\)\s*:\s*$/m) || has(/^\s*(if|for|while)\b[^:\n]*:\s*$/m)) return 'python';
  if (has(/^\s*<!?[a-z][^>]*>/m) && !has(/\b(const|let|function|=>)\b/)) return 'html';
  if (has(/^\s*[.#]?[\w-]+\s*{[^}]*:[^};]*;/m) && !has(/\b(const|let|function|return|=>)\b/)) return 'css';

  if (has(/\b(const|let|var|function|=>|class|import|export|await|new)\b/)) return 'javascript';
  // Most of these articles quote fragments — a call, a member expression, an
  // object literal — that carry no declaration keyword but are still JS.
  if (
    has(/\w\s*\([^)]*\)\s*[;{]?\s*$/m) ||
    has(/^\s*[\w$.[\]'"]+\s*[:=]\s*\S/m) ||
    has(/[;{}]\s*$/m) ||
    has(/\/\*[\s\S]*?\*\/|(^|\s)\/\/ /)
  ) {
    return 'javascript';
  }
  return 'text';
}

const TRACKING_PIXEL = /medium\.com\/_\/stat\?/;

/** Collect real images in document order and rewrite them to local paths. */
function rewriteImages(html, slug) {
  const images = [];
  const rewritten = html.replace(/<img\b[^>]*>/gi, (tag) => {
    const src = (tag.match(/\bsrc\s*=\s*["']([^"']+)["']/i) ?? [])[1];
    if (!src || TRACKING_PIXEL.test(src)) return '';
    const alt = decodeEntities((tag.match(/\balt\s*=\s*["']([^"']*)["']/i) ?? [])[1] ?? '');
    const n = images.length + 1;
    const local = `../images/${slug}/${n}.webp`;
    images.push({ src, local, n });
    return `<img src="${local}" alt="${alt.replace(/"/g, '&quot;')}" />`;
  });
  // A <figure> that held nothing but a tracking pixel is now empty.
  return { html: rewritten.replace(/<figure>\s*<\/figure>/g, ''), images };
}

function buildTurndown() {
  const td = new TurndownService({
    headingStyle: 'atx',
    bulletListMarker: '-',
    codeBlockStyle: 'fenced',
    emDelimiter: '_',
  });
  // Medium wraps images in <figure> with an optional <figcaption>. Keep the
  // caption as its own emphasised line under the image.
  td.addRule('figure', {
    filter: 'figure',
    replacement: (content) => `\n\n${content.trim()}\n\n`,
  });
  td.addRule('figcaption', {
    filter: 'figcaption',
    replacement: (content) => {
      const text = content.trim();
      return text ? `\n_${text}_\n` : '';
    },
  });
  return td;
}

// ------------------------------------------------------------------ rendering

function yamlString(s) {
  return `"${String(s).replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"`;
}

function excerptFrom(markdown) {
  const para = markdown
    .split('\n\n')
    .map((b) => b.trim())
    .find((b) => b && !b.startsWith('#') && !b.startsWith('!') && !b.startsWith('```'));
  if (!para) return '';
  const text = para.replace(/[*_`]/g, '').replace(/\[([^\]]*)\]\([^)]*\)/g, '$1').replace(/\s+/g, ' ');
  if (text.length <= 200) return text;
  return `${text.slice(0, 200).replace(/\s+\S*$/, '')}…`;
}

function renderPost(item, markdown) {
  const excerpt = excerptFrom(markdown);
  const front = [
    '---',
    `title: ${yamlString(item.title)}`,
    `date: ${yamlString(item.date)}`,
    `slug: ${yamlString(item.slug)}`,
    `tags: [${item.tags.map(yamlString).join(', ')}]`,
    `mediumUrl: ${yamlString(item.link)}`,
    `excerpt: ${yamlString(excerpt)}`,
    '---',
    '',
  ].join('\n');
  return `${front}${markdown.trim()}\n`;
}

// --------------------------------------------------------------------- images

/**
 * Medium's feed hands back a 1024px-wide rendition. The CDN serves the same
 * image at any width, so ask for one large enough to survive the downscale to
 * 1300, and fall back to the URL as given if that size is not available.
 */
async function fetchImage(src) {
  const upscaled = src.replace(/\/max\/\d+\//, '/max/2600/');
  for (const url of upscaled === src ? [src] : [upscaled, src]) {
    const res = await fetch(url);
    if (res.ok) return { buffer: Buffer.from(await res.arrayBuffer()), url };
  }
  throw new Error(`could not download ${src}`);
}

async function downloadImages(slug, images) {
  if (images.length === 0) return;
  const outDir = path.join(IMAGES_DIR, slug);
  await mkdir(outDir, { recursive: true });
  const staging = await mkdtemp(path.join(tmpdir(), 'medium-images-'));
  try {
    for (const image of images) {
      const { buffer, url } = await fetchImage(image.src);
      const ext = path.extname(new URL(url).pathname) || '.png';
      const staged = path.join(staging, `${image.n}${ext}`);
      await writeFile(staged, buffer);
      const out = path.join(outDir, `${image.n}.webp`);
      execFileSync('bash', [ENCODE, staged, out, IMAGE_GEOMETRY, IMAGE_QUALITY], {
        stdio: ['ignore', 'ignore', 'inherit'],
      });
      console.log(`    image ${image.n}.webp`);
    }
  } finally {
    await rm(staging, { recursive: true, force: true });
  }
}

// ----------------------------------------------------------------------- main

function convert(item) {
  const { html: withoutCode, blocks } = liftCodeBlocks(item.html);
  const { html, images } = rewriteImages(withoutCode, item.slug);
  let markdown = buildTurndown().turndown(html);
  markdown = markdown.replace(/@@CODEBLOCK(\d+)@@/g, (_, i) => {
    const code = blocks[Number(i)];
    return `\`\`\`${inferLanguage(code)}\n${code}\n\`\`\``;
  });
  return { markdown: renderPost(item, markdown.replace(/\n{3,}/g, '\n\n')), images };
}

function parseArgs(argv) {
  const opts = { force: null, dryRun: false };
  for (let i = 0; i < argv.length; i += 1) {
    if (argv[i] === '--force') opts.force = argv[i + 1] ?? '';
    else if (argv[i] === '--dry-run') opts.dryRun = true;
  }
  if (opts.force === '') {
    console.error('error: --force needs a slug');
    process.exit(2);
  }
  return opts;
}

function printDiff(existingPath, next) {
  const tmp = path.join(tmpdir(), `medium-force-${path.basename(existingPath)}`);
  try {
    writeFileSync(tmp, next);
    execFileSync('diff', ['-u', existingPath, tmp], { stdio: 'inherit' });
    console.log('    (no change)');
  } catch {
    /* diff exits non-zero when the files differ, which is the normal case */
  }
}

async function main() {
  const opts = parseArgs(process.argv.slice(2));

  const res = await fetch(FEED_URL);
  if (!res.ok) throw new Error(`feed returned ${res.status}`);
  const items = parseFeed(await res.text());
  if (items.length === 0) throw new Error('feed returned no items');
  console.log(`Feed: ${items.length} article(s)`);

  if (opts.force && !items.some((i) => i.slug === opts.force)) {
    console.error(`error: ${opts.force} is not on the feed — it may have aged off it`);
    process.exit(1);
  }

  await mkdir(POSTS_DIR, { recursive: true });

  let written = 0;
  for (const item of items) {
    const file = path.join(POSTS_DIR, `${item.slug}.md`);
    const exists = existsSync(file);
    const forced = opts.force === item.slug;

    if (exists && !forced) {
      console.log(`  skip   ${item.slug}`);
      continue;
    }

    console.log(`  ${forced ? 'force' : 'write'}  ${item.slug}`);
    const { markdown, images } = convert(item);

    if (forced && exists) printDiff(file, markdown);
    if (opts.dryRun) continue;

    await downloadImages(item.slug, images);
    await writeFile(file, markdown);
    written += 1;
  }

  const onDisk = (await readdir(POSTS_DIR)).filter((f) => f.endsWith('.md'));
  console.log(`${opts.dryRun ? 'Dry run: ' : ''}${written} written, ${onDisk.length} post(s) in content/posts.`);
}

main().catch((err) => {
  console.error(`error: ${err.message}`);
  process.exit(1);
});
