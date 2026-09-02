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
import { mkdir, readFile, readdir, rm, writeFile } from 'node:fs/promises';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';

import matter from 'gray-matter';
import MarkdownIt from 'markdown-it';
import { createHighlighter } from 'shiki';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const POSTS_DIR = path.join(ROOT, 'content', 'posts');
const OUT_DIR = path.join(ROOT, 'blog');
const PUBLIC_DIR = path.join(ROOT, 'public');
const DATA_DIR = path.join(ROOT, 'src', 'data');

const SITE = 'https://shanehobson.me';
const AUTHOR = 'Shane Hobson';
const BLOG_TITLE = 'Shane Hobson Software Engineering Blog';
// Stable, non-hashed image under the images/ prefix — social scrapers need an
// absolute URL, and Vite only rewrites <img src>, never <meta content>.
const SOCIAL_IMAGE = `${SITE}/images/og-image.jpg`;

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
    if (src.startsWith('../images/')) {
      token.attrSet('src', `../../content/images/${src.slice('../images/'.length)}`);
    }
    token.attrSet('loading', 'lazy');
    token.attrSet('decoding', 'async');
    return defaultImage(tokens, idx, options, env, self);
  };

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

function readingTime(markdown) {
  const words = markdown.split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / 200));
}

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
 * A static sidebar rather than the React NavBar: blog pages are separate
 * documents, so react-scroll's in-page links would not work, and a partial
 * keeps the pages zero-JavaScript. Every route it points at is a plain anchor
 * back into the portfolio's single page.
 */
function sidebar(posts, currentSlug) {
  const articles = posts
    .map(
      (post) =>
        `<li><a class="${post.slug === currentSlug ? 'is-current' : ''}" href="${post.path}">${escapeHtml(
          post.title
        )}</a></li>`
    )
    .join('\n          ');

  return `<aside class="blog-sidebar">
      <a class="blog-sidebar__title" href="/blog/">Shane Hobson<span>Software Engineering Blog</span></a>

      <div class="blog-sidebar__host">
        <p class="blog-sidebar__label">Your host</p>
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
        <div class="blog-sidebar__articles">
          <p class="blog-sidebar__label">Articles</p>
          <ul class="blog-sidebar__nav">
            ${articles}
          </ul>
        </div>

        <div class="blog-sidebar__site">
          <p class="blog-sidebar__label">Portfolio</p>
          <ul class="blog-sidebar__nav">
            <li><a href="/">Home</a></li>
            <li><a href="/#about">About</a></li>
            <li><a href="/#writing">Writing</a></li>
            <li><a href="/#work">Work</a></li>
            <li><a href="/#contact">Contact</a></li>
          </ul>
        </div>
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
    <link rel="canonical" href="${escapeHtml(canonical)}" />
    <link rel="alternate" type="application/rss+xml" title="${escapeHtml(AUTHOR)}" href="/blog/feed.xml" />
    <link rel="stylesheet" href="/src/styles/blog.scss" />
${head}  </head>
  <body>
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
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: post.title,
    description: post.excerpt,
    datePublished: post.date,
    author: { '@type': 'Person', name: AUTHOR, url: SITE },
    publisher: { '@type': 'Person', name: AUTHOR, url: SITE },
    mainEntityOfPage: { '@type': 'WebPage', '@id': post.url },
    url: post.url,
    image: SOCIAL_IMAGE,
    keywords: post.tags.join(', '),
  };
  return `    <meta property="og:type" content="article" />
    <meta property="og:title" content="${escapeHtml(post.title)}" />
    <meta property="og:description" content="${escapeHtml(post.excerpt)}" />
    <meta property="og:url" content="${escapeHtml(post.url)}" />
    <meta property="og:image" content="${SOCIAL_IMAGE}" />
    <meta property="og:image:width" content="1200" />
    <meta property="og:image:height" content="630" />
    <meta property="og:site_name" content="${escapeHtml(AUTHOR)}" />
    <meta property="article:published_time" content="${post.date}" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${escapeHtml(post.title)}" />
    <meta name="twitter:description" content="${escapeHtml(post.excerpt)}" />
    <meta name="twitter:image" content="${SOCIAL_IMAGE}" />
    <script type="application/ld+json">
${JSON.stringify(jsonLd, null, 2)
  .split('\n')
  .map((l) => `      ${l}`)
  .join('\n')}
    </script>
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
    title: `${post.title} — ${BLOG_TITLE}`,
    description: post.excerpt,
    canonical: post.url,
    head: postHead(post),
    posts,
    sidebarFor: post.slug,
    body: `    <main class="blog-wrap">
      <article>
        <header class="blog-post__header">
          <h1 class="blog-post__title">${escapeHtml(post.title)}</h1>
          <p class="blog-post__meta">
            <time datetime="${post.date}">${formatDate(post.date)}</time> · ${post.readingTime} min read
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
        <nav class="blog-post__nav">
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

  return page({
    title: BLOG_TITLE,
    description: `Articles by ${AUTHOR} on software architecture, rendering internals, AI, and building production systems.`,
    canonical: `${SITE}/blog/`,
    posts,
    head: `    <meta property="og:type" content="website" />
    <meta property="og:title" content="${escapeHtml(BLOG_TITLE)}" />
    <meta property="og:url" content="${SITE}/blog/" />
    <meta property="og:image" content="${SOCIAL_IMAGE}" />
    <meta property="og:image:width" content="1200" />
    <meta property="og:image:height" content="630" />
    <meta name="twitter:card" content="summary_large_image" />
`,
    body: `    <main class="blog-wrap">
      <h1 class="blog-index__title">Recent Posts</h1>
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
  const urls = [
    { loc: `${SITE}/`, priority: '1.0' },
    { loc: `${SITE}/blog/`, priority: '0.8' },
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

const robotsTxt = () => `User-agent: *
Allow: /

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
    posts.push({
      slug,
      title: data.title,
      date: data.date,
      tags: data.tags ?? [],
      mediumUrl: data.mediumUrl ?? '',
      excerpt: data.excerpt ?? '',
      markdown: content,
      readingTime: readingTime(content),
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
    post.html = md.render(post.markdown);
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

  // Vite copies public/ verbatim into dist, which puts the feed under the blog
  // prefix and the sitemap and robots.txt at the root.
  await mkdir(path.join(PUBLIC_DIR, 'blog'), { recursive: true });
  await writeFile(path.join(PUBLIC_DIR, 'blog', 'feed.xml'), feedXml(posts));
  await writeFile(path.join(PUBLIC_DIR, 'sitemap.xml'), sitemapXml(posts));
  await writeFile(path.join(PUBLIC_DIR, 'robots.txt'), robotsTxt());

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

  console.log(`Blog: ${posts.length} post(s) -> blog/index.html + ${posts.length} page(s), feed, sitemap.`);
}

main().catch((err) => {
  console.error(`error: ${err.message}`);
  process.exit(1);
});
