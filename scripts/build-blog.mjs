#!/usr/bin/env node
/**
 * Generates the blog's Vite source pages from content/posts/*.md.
 *
 * Runs as the npm `prebuild`/`predev` hook, because Vite reads
 * rollupOptions.input when it loads its config — the generated blog/ folder has
 * to exist before `vite build` or `vite` starts.
 *
 *   blog/index.html          ->  /blog/
 *   blog/<slug>/index.html   ->  /blog/<slug>/
 *
 * Going through Vite rather than emitting final HTML is what buys the shared
 * design and the content-hashed output: the pages link src/styles/blog.scss,
 * which imports the portfolio's _settings.scss, and reference images out of
 * content/images/, which Vite hashes into /assets under the deployment's
 * existing immutable cache policy.
 *
 * Everything this writes is build output. blog/ is gitignored; the three files
 * under public/ that Vite copies verbatim (the feed, the sitemap, robots.txt)
 * are gitignored individually.
 */
import { existsSync } from 'node:fs';
import { cp, mkdir, readFile, readdir, rm, writeFile } from 'node:fs/promises';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';

import matter from 'gray-matter';
import MarkdownIt from 'markdown-it';
import { createHighlighter } from 'shiki';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const POSTS_DIR = path.join(ROOT, 'content', 'posts');
const CONTENT_IMAGES_DIR = path.join(ROOT, 'content', 'images');
const OUT_DIR = path.join(ROOT, 'blog');
const PUBLIC_DIR = path.join(ROOT, 'public');
const DATA_DIR = path.join(ROOT, 'src', 'data');

const SITE = 'https://shanehobson.me';
const AUTHOR = 'Shane Hobson';
const BLOG_TITLE = 'Shane Hobson Software Engineering Blog';
const BLOG_DESCRIPTION = `Articles by ${AUTHOR} on software architecture, rendering internals, AI, and building production systems.`;
// Stable, non-hashed image under the images/ prefix — social scrapers need an
// absolute URL, and Vite only rewrites <img src>, never <meta content>.
const SOCIAL_IMAGE = `${SITE}/images/og-image.jpg`;
const SOCIAL_IMAGE_ALT = 'Shane Hobson, software engineer';

// The same three node ids the homepage's @graph uses (index.html). Structured
// data is read per document, so each page carries its own copy of the Person,
// the site and the blog rather than a bare reference — but reusing the ids
// across every page is what makes them one entity to a consumer that crawls
// more than one of them.
const PERSON_ID = `${SITE}/#person`;
const WEBSITE_ID = `${SITE}/#website`;
const BLOG_ID = `${SITE}/blog/#blog`;

const personNode = () => ({
  '@type': 'Person',
  '@id': PERSON_ID,
  name: AUTHOR,
  url: `${SITE}/`,
  image: `${SITE}/images/shane.webp`,
  jobTitle: 'Software Engineer',
  sameAs: [
    'https://www.linkedin.com/in/shane-hobson-1a979158/',
    'https://github.com/shanehobson',
    'https://medium.com/@shanehobson1',
  ],
});

const websiteNode = () => ({
  '@type': 'WebSite',
  '@id': WEBSITE_ID,
  url: `${SITE}/`,
  name: AUTHOR,
  inLanguage: 'en-US',
  publisher: { '@id': PERSON_ID },
});

const blogNode = () => ({
  '@type': 'Blog',
  '@id': BLOG_ID,
  url: `${SITE}/blog/`,
  name: BLOG_TITLE,
  description: BLOG_DESCRIPTION,
  inLanguage: 'en-US',
  isPartOf: { '@id': WEBSITE_ID },
  author: { '@id': PERSON_ID },
  publisher: { '@id': PERSON_ID },
});

const socialImageNode = () => ({
  '@type': 'ImageObject',
  url: SOCIAL_IMAGE,
  width: 1200,
  height: 630,
  caption: SOCIAL_IMAGE_ALT,
});

/** Home > Blog > (page), as the itemListElement Google reads. */
const breadcrumbNode = (id, trail) => ({
  '@type': 'BreadcrumbList',
  '@id': id,
  itemListElement: trail.map(({ name, item }, i) => ({
    '@type': 'ListItem',
    position: i + 1,
    name,
    // The page you are already on is the last crumb and carries no link,
    // which is the shape Google's documentation asks for.
    ...(item ? { item } : {}),
  })),
});

const SHIKI_THEME = 'github-dark-default';
const SHIKI_LANGS = ['javascript', 'typescript', 'jsx', 'tsx', 'json', 'bash', 'html', 'css', 'python'];

// ------------------------------------------------------------------- markdown

function markdownRenderer(highlighter) {
  const md = new MarkdownIt({
    // The articles quote tag names like <h1> as literal prose. Escaping raw
    // HTML renders those as text, which is what they are, and keeps imported
    // content from injecting markup into the page.
    html: false,
    linkify: true,
    highlight(code, lang) {
      const language = SHIKI_LANGS.includes(lang) ? lang : 'plaintext';
      const html = highlighter.codeToHtml(code, {
        lang: language,
        theme: SHIKI_THEME,
        structure: 'classic',
      });
      // The stylesheet owns the frame; Shiki only colours the tokens. Its
      // inline background on <pre> would otherwise beat the stylesheet.
      return html.replace(/(<pre [^>]*style=")background-color:[^;"]*;?/, '$1');
    },
  });

  // Images live at content/images/<slug>/ and are referenced from the Markdown
  // as ../images/<slug>/n.webp. Rewrite that to a path relative to the
  // generated blog/<slug>/index.html so Vite picks the file up and hashes it.
  const defaultImage = md.renderer.rules.image;
  md.renderer.rules.image = (tokens, idx, options, env, self) => {
    const token = tokens[idx];
    const src = token.attrGet('src') ?? '';
    // Article images are diagrams that carry the explanation, so an empty alt
    // is a bug, not a decorative image. The build fails on missing front
    // matter for the same reason: the next import cannot regress it silently.
    if (!token.content.trim()) {
      throw new Error(`${env.slug}: image ${src} has no alt text`);
    }
    if (src.startsWith('../images/')) {
      token.attrSet('src', `../../content/images/${src.slice('../images/'.length)}`);
    }
    token.attrSet('loading', 'lazy');
    token.attrSet('decoding', 'async');
    return defaultImage(tokens, idx, options, env, self);
  };

  // The post's title is the page's <h1>, so the top heading level inside the
  // body has to be <h2> or the outline skips a level. The imported Markdown
  // uses ### throughout; demoting here rather than rewriting the files means
  // `npm run import:medium` cannot undo it.
  md.core.ruler.push('demote_headings', (state) => {
    const levels = state.tokens
      .filter((t) => t.type === 'heading_open')
      .map((t) => Number(t.tag.slice(1)));
    if (levels.length === 0) return;
    const shift = 2 - Math.min(...levels);
    if (shift === 0) return;
    for (const token of state.tokens) {
      if (token.type !== 'heading_open' && token.type !== 'heading_close') continue;
      token.tag = `h${Math.min(6, Number(token.tag.slice(1)) + shift)}`;
    }
  });

  // Medium links and any other off-site link should not keep the reader's tab.
  const defaultLinkOpen = md.renderer.rules.link_open ?? ((t, i, o, e, s) => s.renderToken(t, i, o));
  md.renderer.rules.link_open = (tokens, idx, options, env, self) => {
    const href = tokens[idx].attrGet('href') ?? '';
    if (/^https?:\/\//.test(href) && !href.startsWith(SITE)) {
      tokens[idx].attrSet('target', '_blank');
      tokens[idx].attrSet('rel', 'noopener noreferrer');
    }
    return defaultLinkOpen(tokens, idx, options, env, self);
  };

  return md;
}

// --------------------------------------------------------------------- helpers

const escapeHtml = (s) =>
  String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

const escapeXml = (s) => escapeHtml(s).replace(/'/g, '&apos;');

function wordCount(markdown) {
  // Alt text is not read by the people the estimate below is for, and a long
  // diagram description would otherwise add a minute to the figure.
  const prose = markdown.replace(/!\[[^\]]*\]/g, '![]');
  return prose.split(/\s+/).filter(Boolean).length;
}

const readingTime = (words) => Math.max(1, Math.round(words / 200));

/**
 * The same demotion the rendered HTML gets, applied to the text instead: in the
 * published .md the post's title is the `#`, so the body has to start at `##`
 * or the outline skips a level there too. Fenced code can contain a line that
 * looks like a heading, so the fences are tracked rather than assumed away.
 */
function demoteHeadings(markdown) {
  const lines = markdown.split('\n');
  let fenced = false;
  const levels = [];
  for (const line of lines) {
    if (/^\s{0,3}(```|~~~)/.test(line)) fenced = !fenced;
    else if (!fenced) {
      const m = /^(#{1,6})\s/.exec(line);
      if (m) levels.push(m[1].length);
    }
  }
  if (levels.length === 0) return markdown;
  const shift = 2 - Math.min(...levels);
  if (shift === 0) return markdown;

  fenced = false;
  return lines
    .map((line) => {
      if (/^\s{0,3}(```|~~~)/.test(line)) {
        fenced = !fenced;
        return line;
      }
      if (fenced) return line;
      return line.replace(/^(#{1,6})(\s)/, (_, hashes, space) =>
        '#'.repeat(Math.min(6, hashes.length + shift)) + space
      );
    })
    .join('\n');
}

/**
 * The post as a standalone Markdown document, published beside its HTML at
 * /blog/<slug>.md and linked from the page's <head> and from llms.txt.
 *
 * This exists for the crawlers that feed language models: they get the article
 * without a stylesheet, a sidebar and a nav around it, from a URL they can
 * guess from the page's own. The header carries the things the HTML says in
 * <meta> and JSON-LD, which do not survive a conversion to text.
 */
function postMarkdown(post) {
  const header = [
    `# ${post.title}`,
    '',
    `> ${post.description}`,
    '',
    `- Author: ${AUTHOR} (${SITE}/)`,
    `- Published: ${formatDate(post.date)}`,
    `- Reading time: ${post.readingTime} min`,
    `- Topics: ${post.keywords.join(', ')}`,
    `- Canonical URL: ${post.url}`,
  ];
  if (post.mediumUrl) header.push(`- Originally published on Medium: ${post.mediumUrl}`);
  header.push('', '---', '', '');

  // The Markdown points at ../images/<slug>/, which is where the files sit in
  // the repo and nowhere the reader of this file can reach. Vite hashes those
  // same files into /assets for the HTML page, under names that are not known
  // until after this script has run, so the mirror gets its own plain copy
  // under /blog/media/ and absolute URLs to it — this file is read detached
  // from the site, so a relative path would not resolve anyway.
  const body = demoteHeadings(post.markdown.trim()).replace(
    /\]\(\.\.\/images\//g,
    `](${SITE}/blog/media/`
  );

  return `${header.join('\n')}${body}\n`;
}

/**
 * https://llmstxt.org — an index of the site in the shape a language model can
 * consume in one fetch: what this site is, then every page worth reading with
 * a link to its Markdown rather than its HTML.
 */
function llmsTxt(posts) {
  const articles = posts
    .map((post) => `- [${post.title}](${SITE}/blog/${post.slug}.md): ${post.description}`)
    .join('\n');

  return `# ${AUTHOR}

> Software engineer with a decade of experience building applications for the
> web, spanning frontend, backend, and cloud infrastructure. Formerly a
> litigation and trial attorney, and still licensed. This is his portfolio and
> his writing on software engineering.

Every link below is Markdown, not HTML: the same content the pages carry,
without the layout around it. The HTML page for any article is the same URL
with the trailing \`.md\` dropped and a slash added — ${SITE}/blog/<slug>/.

## Portfolio

- [${AUTHOR} - Software Engineer](${SITE}/index.md): The homepage as Markdown - the biography, the certificates and the core stack, the writing, and every project with the technology behind it.

## Writing

- [${BLOG_TITLE}](${SITE}/blog/): Index of all articles, newest first.
${articles}

## Optional

- [Everything, in one file](${SITE}/llms-full.txt): The homepage and the full text of every article concatenated. Skip it if the pages above are enough.
- [RSS feed](${SITE}/blog/feed.xml): New articles.
`;
}

// Front matter carries the tags as slugs, because that is the shape Medium
// exported them in and the shape the chips are styled around. Structured data
// and og:article:tag want the words.
const humanizeTag = (tag) =>
  tag
    .replace(/-/g, ' ')
    .replace(/\b(ai|llm|api|aws|css|html)\b/gi, (m) => m.toUpperCase());

function formatDate(iso) {
  return new Date(`${iso}T12:00:00Z`).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    timeZone: 'UTC',
  });
}

// ------------------------------------------------------------------ templates

/**
 * One @graph per page rather than several loose blocks. Nothing references a
 * node it does not also carry: a consumer parses each document on its own, and
 * a bare {"@id"} pointing at a node that only exists on another page is a
 * dangling reference.
 */
function jsonLdScript(graph) {
  const json = JSON.stringify({ '@context': 'https://schema.org', '@graph': graph }, null, 2)
    .split('\n')
    .map((line) => `      ${line}`)
    .join('\n');
  return `    <script type="application/ld+json">\n${json}\n    </script>`;
}

/**
 * A static sidebar rather than the React NavBar: blog pages are separate
 * documents, so react-scroll's in-page links would not work, and a partial
 * keeps the pages zero-JavaScript. Every route it points at is a plain anchor
 * back into the portfolio's single page.
 */
function sidebar(posts, currentSlug) {
  const articles = posts
    .map((post) => {
      const current = post.slug === currentSlug;
      // The class is the visual cue; aria-current is the one a screen reader
      // reads, and the sidebar is repeated on every page.
      return `<li><a class="${current ? 'is-current' : ''}"${
        current ? ' aria-current="page"' : ''
      } href="${post.path}">${escapeHtml(post.title)}</a></li>`;
    })
    .join('\n          ');

  return `<aside class="blog-sidebar">
      <a class="blog-sidebar__title" href="/blog/">Shane Hobson<span>Software Engineering Blog</span></a>

      <div class="blog-sidebar__host">
        <img
          class="blog-sidebar__photo"
          src="/images/shane.webp"
          width="600"
          height="645"
          alt="Shane Hobson"
          decoding="async"
        />
        <p class="blog-sidebar__bio">
          I'm Shane Hobson, a software engineer. I write about architecture,
          scalability, AI, and real-world lessons from building production
          systems. <a href="/#about">More about me.</a>
        </p>
      </div>

      <div class="blog-sidebar__links">
        <nav class="blog-sidebar__articles" aria-label="Articles">
          <p class="blog-sidebar__label">Articles</p>
          <ul class="blog-sidebar__nav">
            ${articles}
          </ul>
        </nav>

        <nav class="blog-sidebar__site" aria-label="Portfolio">
          <p class="blog-sidebar__label">Portfolio</p>
          <ul class="blog-sidebar__nav">
            <li><a href="/">Home</a></li>
            <li><a href="/#about">About</a></li>
            <li><a href="/#writing">Writing</a></li>
            <li><a href="/#work">Work</a></li>
            <li><a href="/#contact">Contact</a></li>
          </ul>
        </nav>
      </div>
    </aside>`;
}

function page({ title, description, canonical, head = '', sidebarFor, posts, body }) {
  return `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <link rel="icon" type="image/png" href="/images/favicon.png" />
    <title>${escapeHtml(title)}</title>
    <meta name="description" content="${escapeHtml(description)}" />
    <meta name="author" content="${escapeHtml(AUTHOR)}" />
    <!-- index,follow is the default; max-image-preview is what this is for. -->
    <meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1" />
    <link rel="canonical" href="${escapeHtml(canonical)}" />
    <link rel="alternate" type="application/rss+xml" title="${escapeHtml(AUTHOR)}" href="/blog/feed.xml" />
    <link rel="preload" as="font" type="font/woff2" href="/fonts/inter-latin-var.woff2" crossorigin />
    <link rel="stylesheet" href="/src/styles/blog.scss" />
${head}  </head>
  <body>
    <a class="skip-link" href="#content">Skip to content</a>
    <div class="blog-layout">
    ${sidebar(posts, sidebarFor)}
      <div class="blog-content">
${body}
      </div>
    </div>
  </body>
</html>
`;
}

function postHead(post) {
  const graph = [
    personNode(),
    websiteNode(),
    blogNode(),
    {
      '@type': 'WebPage',
      '@id': `${post.url}#webpage`,
      url: post.url,
      name: post.title,
      description: post.description,
      isPartOf: { '@id': WEBSITE_ID },
      primaryImageOfPage: { '@id': `${post.url}#primaryimage` },
      breadcrumb: { '@id': `${post.url}#breadcrumb` },
      inLanguage: 'en-US',
    },
    { ...socialImageNode(), '@id': `${post.url}#primaryimage` },
    breadcrumbNode(`${post.url}#breadcrumb`, [
      { name: 'Home', item: `${SITE}/` },
      { name: 'Blog', item: `${SITE}/blog/` },
      { name: post.title },
    ]),
    {
      // BlogPosting rather than Article: same treatment from Google, and it is
      // the accurate type, which is what a consumer other than Google reads.
      '@type': 'BlogPosting',
      '@id': `${post.url}#article`,
      headline: post.title,
      description: post.description,
      url: post.url,
      // No dateModified is worse than one equal to datePublished: without it
      // the field is simply unknown, and these are imported articles that do
      // not change after publication.
      datePublished: post.date,
      dateModified: post.date,
      author: { '@id': PERSON_ID },
      publisher: { '@id': PERSON_ID },
      mainEntityOfPage: { '@id': `${post.url}#webpage` },
      isPartOf: { '@id': BLOG_ID },
      image: { '@id': `${post.url}#primaryimage` },
      keywords: post.keywords,
      articleSection: post.keywords,
      wordCount: post.wordCount,
      timeRequired: `PT${post.readingTime}M`,
      inLanguage: 'en-US',
    },
  ];

  return `    <meta property="og:type" content="article" />
    <meta property="og:locale" content="en_US" />
    <meta property="og:title" content="${escapeHtml(post.title)}" />
    <meta property="og:description" content="${escapeHtml(post.description)}" />
    <meta property="og:url" content="${escapeHtml(post.url)}" />
    <meta property="og:image" content="${SOCIAL_IMAGE}" />
    <meta property="og:image:type" content="image/jpeg" />
    <meta property="og:image:width" content="1200" />
    <meta property="og:image:height" content="630" />
    <meta property="og:image:alt" content="${escapeHtml(SOCIAL_IMAGE_ALT)}" />
    <meta property="og:site_name" content="${escapeHtml(AUTHOR)}" />
    <meta property="article:published_time" content="${post.date}" />
    <meta property="article:modified_time" content="${post.date}" />
    <meta property="article:author" content="${SITE}/" />
${post.keywords.map((tag) => `    <meta property="article:tag" content="${escapeHtml(tag)}" />`).join('\n')}
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${escapeHtml(post.title)}" />
    <meta name="twitter:description" content="${escapeHtml(post.description)}" />
    <meta name="twitter:image" content="${SOCIAL_IMAGE}" />
    <meta name="twitter:image:alt" content="${escapeHtml(SOCIAL_IMAGE_ALT)}" />
    <!--
      The same article as Markdown, for anything that would rather not unpick
      this page's markup. Advertised here as well as in llms.txt so it is
      discoverable from the page a crawler actually landed on.
    -->
    <link rel="alternate" type="text/markdown" href="/blog/${post.slug}.md" title="${escapeHtml(post.title)} (Markdown)" />
${jsonLdScript(graph)}
`;
}

function postPage(post, posts, { newer, older }) {
  const nav = [
    newer
      ? `<a class="blog-post__nav-link" href="${newer.path}"><span>Newer</span>${escapeHtml(newer.title)}</a>`
      : '<span></span>',
    older
      ? `<a class="blog-post__nav-link" href="${older.path}"><span>Older</span>${escapeHtml(older.title)}</a>`
      : '<span></span>',
  ].join('\n        ');

  return page({
    title: `${post.title} — ${AUTHOR}`,
    description: post.description,
    canonical: post.url,
    head: postHead(post),
    posts,
    sidebarFor: post.slug,
    body: `    <main class="blog-wrap" id="content">
      <article>
        <header class="blog-post__header">
          <h1 class="blog-post__title">${escapeHtml(post.title)}</h1>
          <p class="blog-post__meta">
            By ${escapeHtml(AUTHOR)} · <time datetime="${post.date}">${formatDate(post.date)}</time> · ${post.readingTime} min read
          </p>
          <div class="blog-post__tags">
            ${post.tags.map((t) => `<span class="blog-tag">${escapeHtml(t)}</span>`).join('\n            ')}
          </div>
        </header>
        <div class="blog-post__body">
${post.html}
        </div>
        <p class="blog-post__origin">
          Originally published on <a href="${escapeHtml(post.mediumUrl)}" target="_blank" rel="noopener noreferrer">Medium</a>.
        </p>
        <nav class="blog-post__nav" aria-label="More articles">
        ${nav}
        </nav>
      </article>
    </main>`,
  });
}

function indexPage(posts) {
  const items = posts
    .map(
      (post) => `        <li class="blog-index__item">
          <a href="${post.path}">
            <h2 class="blog-index__item-title">${escapeHtml(post.title)}</h2>
          </a>
          <p class="blog-post__meta">
            <time datetime="${post.date}">${formatDate(post.date)}</time> · ${post.readingTime} min read
          </p>
          <p class="blog-index__item-excerpt">${escapeHtml(post.excerpt)}</p>
        </li>`
    )
    .join('\n');

  const graph = [
    personNode(),
    websiteNode(),
    {
      ...blogNode(),
      blogPost: posts.map((post) => ({ '@id': `${post.url}#article` })),
    },
    {
      '@type': 'CollectionPage',
      '@id': `${SITE}/blog/#webpage`,
      url: `${SITE}/blog/`,
      name: BLOG_TITLE,
      description: BLOG_DESCRIPTION,
      isPartOf: { '@id': WEBSITE_ID },
      about: { '@id': BLOG_ID },
      breadcrumb: { '@id': `${SITE}/blog/#breadcrumb` },
      inLanguage: 'en-US',
    },
    breadcrumbNode(`${SITE}/blog/#breadcrumb`, [
      { name: 'Home', item: `${SITE}/` },
      { name: 'Blog' },
    ]),
    // Stubs, not references: blogPost above points at ids that live on the
    // post pages, so the listing has to carry enough of each one to stand on
    // its own in this document.
    ...posts.map((post) => ({
      '@type': 'BlogPosting',
      '@id': `${post.url}#article`,
      headline: post.title,
      description: post.description,
      url: post.url,
      datePublished: post.date,
      dateModified: post.date,
      author: { '@id': PERSON_ID },
      publisher: { '@id': PERSON_ID },
      mainEntityOfPage: { '@id': `${post.url}#webpage` },
      isPartOf: { '@id': BLOG_ID },
      image: SOCIAL_IMAGE,
      keywords: post.keywords,
      inLanguage: 'en-US',
    })),
  ];

  return page({
    title: BLOG_TITLE,
    description: BLOG_DESCRIPTION,
    canonical: `${SITE}/blog/`,
    posts,
    head: `    <meta property="og:type" content="website" />
    <meta property="og:locale" content="en_US" />
    <meta property="og:site_name" content="${escapeHtml(AUTHOR)}" />
    <meta property="og:title" content="${escapeHtml(BLOG_TITLE)}" />
    <meta property="og:description" content="${escapeHtml(BLOG_DESCRIPTION)}" />
    <meta property="og:url" content="${SITE}/blog/" />
    <meta property="og:image" content="${SOCIAL_IMAGE}" />
    <meta property="og:image:type" content="image/jpeg" />
    <meta property="og:image:width" content="1200" />
    <meta property="og:image:height" content="630" />
    <meta property="og:image:alt" content="${escapeHtml(SOCIAL_IMAGE_ALT)}" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${escapeHtml(BLOG_TITLE)}" />
    <meta name="twitter:description" content="${escapeHtml(BLOG_DESCRIPTION)}" />
    <meta name="twitter:image" content="${SOCIAL_IMAGE}" />
    <meta name="twitter:image:alt" content="${escapeHtml(SOCIAL_IMAGE_ALT)}" />
    <link rel="alternate" type="text/markdown" href="/llms.txt" title="${escapeHtml(AUTHOR)} (Markdown index)" />
${jsonLdScript(graph)}
`,
    // The <h1> used to read "Recent Posts", which describes the list rather
    // than the page and says nothing about what the page is about.
    body: `    <main class="blog-wrap" id="content">
      <h1 class="blog-index__title">Articles on Software Engineering</h1>
      <ul class="blog-index__list">
${items}
      </ul>
    </main>`,
  });
}

function feedXml(posts) {
  const items = posts
    .map(
      (post) => `    <item>
      <title>${escapeXml(post.title)}</title>
      <link>${post.url}</link>
      <guid isPermaLink="true">${post.url}</guid>
      <pubDate>${new Date(`${post.date}T12:00:00Z`).toUTCString()}</pubDate>
      <description>${escapeXml(post.excerpt)}</description>
${post.tags.map((t) => `      <category>${escapeXml(t)}</category>`).join('\n')}
    </item>`
    )
    .join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${escapeXml(AUTHOR)}</title>
    <link>${SITE}/blog/</link>
    <atom:link href="${SITE}/blog/feed.xml" rel="self" type="application/rss+xml" />
    <description>Articles on software architecture, rendering internals, AI, and building production systems.</description>
    <language>en-us</language>
    <!-- Derived from the newest post, not the clock: a build-time stamp would
         change the blog bundle's hash on every build and re-upload every page. -->
    <lastBuildDate>${new Date(`${posts[0].date}T12:00:00Z`).toUTCString()}</lastBuildDate>
${items}
  </channel>
</rss>
`;
}

function sitemapXml(posts) {
  // The newest post's date, not the clock: the homepage lists the three most
  // recent posts and the blog index lists all of them, so that is genuinely
  // when either last changed — and a build-time stamp would claim every page
  // changed on every deploy, which is the fastest way to have lastmod ignored.
  const newest = posts[0].date;
  const urls = [
    { loc: `${SITE}/`, lastmod: newest, priority: '1.0' },
    { loc: `${SITE}/blog/`, lastmod: newest, priority: '0.8' },
    ...posts.map((post) => ({ loc: post.url, lastmod: post.date, priority: '0.7' })),
  ];
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls
  .map(
    (u) => `  <url>
    <loc>${u.loc}</loc>${u.lastmod ? `\n    <lastmod>${u.lastmod}</lastmod>` : ''}
    <priority>${u.priority}</priority>
  </url>`
  )
  .join('\n')}
</urlset>
`;
}

// The wildcard record already allows everything, so the named ones below grant
// nothing new. They are here because a crawler that finds a record for its own
// user-agent stops reading the wildcard, and several of these publish their
// name precisely so a site can say yes or no deliberately — silence reads as
// "nobody thought about it". This site wants to be read by them: the whole
// point of the Markdown mirrors and llms.txt is to be quotable and attributable.
//
// Removing a name from this list does not block that crawler; it falls back to
// the wildcard. Blocking one means giving it its own `Disallow: /`.
const AI_AGENTS = [
  // Training and retrieval crawlers
  'GPTBot',
  'ClaudeBot',
  'Google-Extended',
  'Applebot-Extended',
  'PerplexityBot',
  'CCBot',
  'Amazonbot',
  'meta-externalagent',
  // Search-time and user-initiated fetches, which is where a citation comes from
  'OAI-SearchBot',
  'ChatGPT-User',
  'Claude-User',
  'Claude-SearchBot',
  'Perplexity-User',
];

const robotsTxt = () => `User-agent: *
Allow: /

${AI_AGENTS.map((agent) => `User-agent: ${agent}`).join('\n')}
Allow: /

# A map of this site written for language models, per https://llmstxt.org.
# Every article is also published as Markdown at /blog/<slug>.md.
# ${SITE}/llms.txt

Sitemap: ${SITE}/sitemap.xml
`;

// ----------------------------------------------------------------------- main

async function loadPosts() {
  let files;
  try {
    files = (await readdir(POSTS_DIR)).filter((f) => f.endsWith('.md'));
  } catch {
    throw new Error(`no content/posts directory — run \`npm run import:medium\` first`);
  }
  if (files.length === 0) throw new Error('content/posts is empty — run `npm run import:medium` first');

  const posts = [];
  for (const file of files) {
    const { data, content } = matter(await readFile(path.join(POSTS_DIR, file), 'utf8'));
    const slug = data.slug ?? path.basename(file, '.md');
    for (const required of ['title', 'date']) {
      if (!data[required]) throw new Error(`${file}: missing "${required}" in front matter`);
    }
    if (!data.description) {
      console.warn(
        `warning: ${file} has no "description" — falling back to the excerpt, ` +
          'which Medium cut mid-sentence. Write one for the search result.'
      );
    }
    const tags = data.tags ?? [];
    const words = wordCount(content);
    posts.push({
      slug,
      title: data.title,
      date: data.date,
      tags,
      keywords: tags.map(humanizeTag),
      mediumUrl: data.mediumUrl ?? '',
      excerpt: data.excerpt ?? '',
      // The excerpt is the imported first paragraph, cut mid-sentence by
      // Medium; it reads fine as a card on the index and badly as the sentence
      // Google prints under the result. `description` is the one written for
      // that job, and falls back to the excerpt when a post has none.
      description: data.description || data.excerpt || '',
      markdown: content,
      wordCount: words,
      readingTime: readingTime(words),
      path: `/blog/${slug}/`,
      url: `${SITE}/blog/${slug}/`,
    });
  }
  // Reverse-chronological everywhere: the index, the feed, and prev/next.
  return posts.sort((a, b) => b.date.localeCompare(a.date));
}

async function main() {
  const posts = await loadPosts();
  const highlighter = await createHighlighter({ themes: [SHIKI_THEME], langs: SHIKI_LANGS });
  const md = markdownRenderer(highlighter);

  for (const post of posts) {
    post.html = md.render(post.markdown, { slug: post.slug });
  }

  await rm(OUT_DIR, { recursive: true, force: true });
  await mkdir(OUT_DIR, { recursive: true });

  await writeFile(path.join(OUT_DIR, 'index.html'), indexPage(posts));
  for (const [i, post] of posts.entries()) {
    await mkdir(path.join(OUT_DIR, post.slug), { recursive: true });
    await writeFile(
      path.join(OUT_DIR, post.slug, 'index.html'),
      postPage(post, posts, { newer: posts[i - 1], older: posts[i + 1] })
    );
  }

  // Vite copies public/ verbatim into dist, which puts the feed and the
  // Markdown mirrors under the blog prefix and the rest at the root.
  const publicBlog = path.join(PUBLIC_DIR, 'blog');
  await rm(publicBlog, { recursive: true, force: true });
  await mkdir(publicBlog, { recursive: true });
  await writeFile(path.join(publicBlog, 'feed.xml'), feedXml(posts));
  await writeFile(path.join(PUBLIC_DIR, 'sitemap.xml'), sitemapXml(posts));
  await writeFile(path.join(PUBLIC_DIR, 'robots.txt'), robotsTxt());
  await writeFile(path.join(PUBLIC_DIR, 'llms.txt'), llmsTxt(posts));

  // /blog/<slug>.md beside /blog/<slug>/, and the figures the Markdown points
  // at. `cp` on a slug with no images would throw, so only the ones that have
  // a directory are copied.
  for (const post of posts) {
    await writeFile(path.join(publicBlog, `${post.slug}.md`), postMarkdown(post));
    const images = path.join(CONTENT_IMAGES_DIR, post.slug);
    if (existsSync(images)) {
      await cp(images, path.join(publicBlog, 'media', post.slug), { recursive: true });
    }
  }

  // The portfolio's Writing section reads this, so the three titles it shows
  // can never drift from what is actually published.
  await mkdir(DATA_DIR, { recursive: true });
  await writeFile(
    path.join(DATA_DIR, 'recent-posts.json'),
    `${JSON.stringify(
      posts.slice(0, 3).map(({ title, date, path: href, readingTime: minutes }) => ({
        title,
        date,
        path: href,
        readingTime: minutes,
      })),
      null,
      2
    )}\n`
  );

  console.log(
    `Blog: ${posts.length} post(s) -> blog/index.html + ${posts.length} page(s), ` +
      `${posts.length} Markdown mirror(s), feed, sitemap, llms.txt.`
  );
}

main().catch((err) => {
  console.error(`error: ${err.message}`);
  process.exit(1);
});
