import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import matter from "gray-matter";
import { marked } from "marked";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.join(__dirname, ".."); // frontend/
const DIST = path.join(ROOT, "dist");
const BLOG_POSTS_DIR = path.join(ROOT, "blog-posts");
const TEMPLATE_PATH = path.join(ROOT, "blog-template.html");
const MANIFEST_PATH = path.join(DIST, ".vite", "manifest.json");
const PUBLIC_DIR = path.join(ROOT, "public");
const SITE_URL = "https://lncurl.lol";

interface PostMeta {
  slug: string;
  title: string;
  description: string;
  date: string; // YYYY-MM-DD
  isoDate: string;
  displayDate: string;
  tags: string[];
  image?: string;
  imageAlt?: string;
}

interface Post extends PostMeta {
  html: string;
  raw: string;
}

function getCssFile(): string {
  try {
    const manifest = JSON.parse(
      fs.readFileSync(MANIFEST_PATH, "utf-8"),
    ) as Record<string, { file?: string; css?: string[]; isEntry?: boolean }>;
    // Find the entry point
    for (const entry of Object.values(manifest)) {
      if (entry.isEntry && entry.css?.[0]) {
        return entry.css[0];
      }
    }
  } catch {
    // fall through to glob
  }
  // Fallback: find the CSS file in assets/
  const assets = fs.readdirSync(path.join(DIST, "assets"));
  const cssFile = assets.find((f) => f.endsWith(".css"));
  if (!cssFile) throw new Error("Could not find CSS file in dist/assets/");
  return `assets/${cssFile}`;
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00Z");
  return d.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: "UTC",
  });
}

function toRssDate(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00Z");
  return d.toUTCString();
}

function loadPosts(): Post[] {
  if (!fs.existsSync(BLOG_POSTS_DIR)) return [];

  const files = fs
    .readdirSync(BLOG_POSTS_DIR)
    .filter((f) => f.endsWith(".md") && f !== "README.md")
    .sort()
    .reverse(); // newest first by filename (YYYY-MM-DD prefix convention)

  const posts: Post[] = [];

  for (const file of files) {
    const raw = fs.readFileSync(path.join(BLOG_POSTS_DIR, file), "utf-8");
    const { data, content } = matter(raw);

    const slug = file.replace(/\.md$/, "");
    const rawDate = data.date;
    const dateStr =
      rawDate instanceof Date
        ? rawDate.toISOString().slice(0, 10)
        : String(rawDate ?? "").slice(0, 10) ||
          new Date().toISOString().slice(0, 10);
    const html = marked.parse(content) as string;

    posts.push({
      slug,
      title: String(data.title ?? slug),
      description: String(data.description ?? ""),
      date: dateStr,
      isoDate: dateStr + "T00:00:00Z",
      displayDate: formatDate(dateStr),
      tags: Array.isArray(data.tags) ? (data.tags as string[]) : [],
      image: data.image ? String(data.image) : undefined,
      imageAlt: data.imageAlt ? String(data.imageAlt) : undefined,
      html,
      raw,
    });
  }

  // Sort by date descending
  posts.sort((a, b) => b.date.localeCompare(a.date));
  return posts;
}

function renderPost(post: Post, template: string, cssFile: string): string {
  const tagsHtml =
    post.tags.length > 0
      ? post.tags
          .map((t) => `<span class="blog-tag">${escapeHtml(t)}</span>`)
          .join(" ")
      : "";

  const heroImageHtml = post.image
    ? `<img src="${escapeHtml(post.image)}" alt="${escapeHtml(post.imageAlt ?? post.title)}" class="blog-hero-image" width="1200" height="630" />`
    : "";

  const ogImageTags = post.image
    ? `<meta property="og:image" content="${SITE_URL}${post.image}" />\n    <meta property="og:image:width" content="1200" />\n    <meta property="og:image:height" content="630" />\n    <meta property="og:image:alt" content="${escapeHtml(post.imageAlt ?? post.title)}" />`
    : `<meta property="og:image" content="${SITE_URL}/og-default.jpg" />\n    <meta property="og:image:width" content="1200" />\n    <meta property="og:image:height" content="630" />`;

  const twitterCardTag = post.image
    ? `<meta name="twitter:card" content="summary_large_image" />`
    : `<meta name="twitter:card" content="summary" />`;

  const twitterImageTag = post.image
    ? `<meta name="twitter:image" content="${SITE_URL}${post.image}" />`
    : `<meta name="twitter:image" content="${SITE_URL}/og-default.jpg" />`;

  return template
    .replace(/\{\{TITLE\}\}/g, escapeHtml(post.title))
    .replace(/\{\{DESCRIPTION\}\}/g, escapeHtml(post.description))
    .replace(/\{\{SLUG\}\}/g, post.slug)
    .replace(/\{\{ISO_DATE\}\}/g, post.isoDate)
    .replace(/\{\{DISPLAY_DATE\}\}/g, escapeHtml(post.displayDate))
    .replace(/\{\{CSS_FILE\}\}/g, cssFile)
    .replace(/\{\{OG_IMAGE_TAGS\}\}/g, ogImageTags)
    .replace(/\{\{TWITTER_CARD_TAG\}\}/g, twitterCardTag)
    .replace(/\{\{TWITTER_IMAGE_TAG\}\}/g, twitterImageTag)
    .replace(/\{\{HERO_IMAGE\}\}/g, heroImageHtml)
    .replace(/\{\{TAGS_HTML\}\}/g, tagsHtml)
    .replace(/\{\{CONTENT\}\}/g, post.html);
}

function renderBlogIndexHtml(posts: PostMeta[], cssFile: string): string {
  const postItems = posts
    .map((p) => {
      const img = p.image
        ? `<img src="${escapeHtml(p.image)}" alt="${escapeHtml(p.imageAlt ?? p.title)}" class="blog-index-thumb" width="400" height="210" />`
        : "";
      const tags = p.tags
        .map((t) => `<span class="blog-tag">${escapeHtml(t)}</span>`)
        .join(" ");
      return `
    <article class="blog-index-item">
      ${img}
      <div class="blog-index-body">
        <h2><a href="/blog/${p.slug}">${escapeHtml(p.title)}</a></h2>
        <div class="blog-post-meta">
          <time datetime="${p.isoDate}">${escapeHtml(p.displayDate)}</time>
          ${tags}
        </div>
        <p>${escapeHtml(p.description)}</p>
        <a href="/blog/${p.slug}" class="blog-read-more">Read more →</a>
      </div>
    </article>`;
    })
    .join("\n");

  const empty =
    posts.length === 0
      ? `<p style="color: var(--muted-foreground); font-family: 'JetBrains Mono', monospace;">No posts yet.</p>`
      : "";

  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Blog — lncurl.lol</title>
    <meta name="description" content="Articles about Bitcoin lightning, Nostr Wallet Connect, and AI agents." />
    <link rel="canonical" href="${SITE_URL}/blog" />
    <meta property="og:title" content="Blog — lncurl.lol" />
    <meta property="og:description" content="Articles about Bitcoin lightning, Nostr Wallet Connect, and AI agents." />
    <meta property="og:type" content="website" />
    <meta property="og:url" content="${SITE_URL}/blog" />
    <meta property="og:image" content="${SITE_URL}/og-default.jpg" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:image" content="${SITE_URL}/og-default.jpg" />
    <link rel="alternate" type="application/rss+xml" title="lncurl.lol Blog" href="/feed.xml" />
    <link rel="icon" type="image/png" href="/icon.png" />
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;700&display=swap" rel="stylesheet" />
    <link rel="stylesheet" href="/${cssFile}" />
    <style>
      :root {
        --background: oklch(0.13 0.01 250); --foreground: oklch(0.93 0 0);
        --card: oklch(0.17 0.01 250); --border: oklch(1 0 0 / 10%);
        --muted-foreground: oklch(0.6 0 0); --terminal: oklch(0.85 0.18 142);
        --terminal-dim: oklch(0.55 0.12 142);
      }
      *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
      html { background: var(--background); color: var(--foreground); }
      body { background: var(--background); color: var(--foreground); font-family: "Inter", system-ui, sans-serif; min-height: 100vh; display: flex; flex-direction: column; }
      a { color: var(--terminal); text-decoration: none; }
      a:hover { text-decoration: underline; }
      .blog-nav { border-bottom: 1px solid var(--border); padding: 0.75rem 1rem; }
      .blog-nav-inner { max-width: 56rem; margin: 0 auto; display: flex; align-items: center; justify-content: space-between; gap: 1rem; flex-wrap: wrap; font-family: "JetBrains Mono", monospace; font-size: 0.875rem; }
      .blog-nav-brand { font-size: 1.125rem; font-weight: 700; }
      .blog-nav-links { display: flex; gap: 1rem; color: var(--muted-foreground); }
      .blog-nav-links a { color: var(--muted-foreground); }
      .blog-nav-links a:hover { color: var(--foreground); text-decoration: none; }
      .blog-main { flex: 1; max-width: 56rem; margin: 0 auto; width: 100%; padding: 2rem 1rem; }
      .blog-footer { border-top: 1px solid var(--border); padding: 1.5rem; text-align: center; font-size: 0.875rem; color: var(--muted-foreground); }
    </style>
    <style>
      .blog-index-heading { font-family: "JetBrains Mono", monospace; font-size: 2rem; font-weight: 700; margin-bottom: 0.5rem; }
      .blog-index-subheading { color: var(--muted-foreground); margin-bottom: 2rem; }
      .blog-index-list { display: flex; flex-direction: column; gap: 2rem; }
      .blog-index-item { border: 1px solid var(--border); border-radius: 0.5rem; background: var(--card); overflow: hidden; }
      .blog-index-thumb { width: 100%; aspect-ratio: 1200/630; object-fit: cover; display: block; }
      .blog-index-body { padding: 1.25rem; }
      .blog-index-body h2 { font-family: "JetBrains Mono", monospace; font-size: 1.25rem; font-weight: 700; margin-bottom: 0.5rem; }
      .blog-index-body h2 a { color: var(--foreground); }
      .blog-index-body h2 a:hover { color: var(--terminal); text-decoration: none; }
      .blog-index-body p { margin: 0.75rem 0; color: var(--muted-foreground); line-height: 1.6; }
      .blog-read-more { font-family: "JetBrains Mono", monospace; font-size: 0.875rem; }
    </style>
  </head>
  <body>
    <nav class="blog-nav">
      <div class="blog-nav-inner">
        <a href="/" class="blog-nav-brand">lncurl.lol</a>
        <div class="blog-nav-links">
          <a href="/">Home</a>
          <a href="/leaderboard">Leaderboard</a>
          <a href="/graveyard">Graveyard</a>
          <a href="/about">About</a>
          <a href="/blog">Blog</a>
        </div>
      </div>
    </nav>
    <main class="blog-main">
      <h1 class="blog-index-heading">Blog</h1>
      <p class="blog-index-subheading">Articles about Bitcoin lightning, NWC, and AI agents.</p>
      <div class="blog-index-list">
        ${postItems || empty}
      </div>
    </main>
    <footer class="blog-footer">
      Powered by <a href="https://getalby.com/alby-hub?ref=lncurl" target="_blank" rel="noopener noreferrer">Alby Hub</a>
      + <a href="https://nwc.dev" target="_blank" rel="noopener noreferrer">Nostr Wallet Connect</a>
    </footer>
  </body>
</html>`;
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function escapeXml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function renderRss(posts: Post[]): string {
  const items = posts
    .map(
      (p) => `
  <item>
    <title>${escapeXml(p.title)}</title>
    <link>${SITE_URL}/blog/${p.slug}</link>
    <description>${escapeXml(p.description)}</description>
    <pubDate>${toRssDate(p.date)}</pubDate>
    <guid isPermaLink="true">${SITE_URL}/blog/${p.slug}</guid>
    <content:encoded><![CDATA[${p.html}]]></content:encoded>
  </item>`,
    )
    .join("\n");

  const lastBuildDate =
    posts.length > 0 ? toRssDate(posts[0].date) : new Date().toUTCString();

  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0"
  xmlns:content="http://purl.org/rss/1.0/modules/content/"
  xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>lncurl.lol Blog</title>
    <link>${SITE_URL}/blog</link>
    <description>Articles about Bitcoin lightning, Nostr Wallet Connect, and AI agents.</description>
    <language>en</language>
    <lastBuildDate>${lastBuildDate}</lastBuildDate>
    <atom:link href="${SITE_URL}/feed.xml" rel="self" type="application/rss+xml" />
${items}
  </channel>
</rss>`;
}

function renderSitemap(posts: PostMeta[]): string {
  const appUrls = ["/", "/leaderboard", "/graveyard", "/about", "/blog"]
    .map(
      (u) => `
  <url>
    <loc>${SITE_URL}${u}</loc>
    <changefreq>${u === "/" ? "daily" : "weekly"}</changefreq>
    <priority>${u === "/" ? "1.0" : "0.8"}</priority>
  </url>`,
    )
    .join("");

  const postUrls = posts
    .map(
      (p) => `
  <url>
    <loc>${SITE_URL}/blog/${p.slug}</loc>
    <lastmod>${p.date}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.7</priority>
  </url>`,
    )
    .join("");

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${appUrls}
${postUrls}
</urlset>`;
}

function renderBlogMd(posts: PostMeta[]): string {
  const lines = posts.map(
    (p) => `- [${p.title}](/blog/${p.slug}.md) — ${p.description} (${p.date})`,
  );

  return `# lncurl.lol Blog

Articles about Bitcoin lightning, Nostr Wallet Connect, and AI agents.

## Posts

${lines.length > 0 ? lines.join("\n") : "_No posts yet._"}

---

Each post is available as:
- HTML: \`/blog/{slug}\`
- Markdown: \`/blog/{slug}.md\`
- JSON (frontmatter + rendered HTML): \`/blog/{slug}/content.json\`

RSS feed: \`/feed.xml\`
`;
}

// ── Main ─────────────────────────────────────────────────────────────────────

const posts = loadPosts();
const template = fs.readFileSync(TEMPLATE_PATH, "utf-8");
const cssFile = getCssFile();

console.log(`[blog] Building ${posts.length} post(s)...`);

// Ensure dist/blog/ exists
fs.mkdirSync(path.join(DIST, "blog"), { recursive: true });

for (const post of posts) {
  const postDir = path.join(DIST, "blog", post.slug);
  fs.mkdirSync(postDir, { recursive: true });

  // Static HTML
  const html = renderPost(post, template, cssFile);
  fs.writeFileSync(path.join(postDir, "index.html"), html, "utf-8");

  // content.json for client-side React navigation
  fs.writeFileSync(
    path.join(postDir, "content.json"),
    JSON.stringify({
      html: post.html,
      frontmatter: {
        title: post.title,
        description: post.description,
        date: post.date,
        tags: post.tags,
        image: post.image,
        imageAlt: post.imageAlt,
      },
    }),
    "utf-8",
  );

  // Raw markdown (served at /blog/{slug}.md)
  fs.writeFileSync(
    path.join(DIST, "blog", `${post.slug}.md`),
    post.raw,
    "utf-8",
  );

  console.log(`  ✓ /blog/${post.slug}`);
}

// Blog index HTML
const indexHtml = renderBlogIndexHtml(posts, cssFile);
fs.writeFileSync(path.join(DIST, "blog", "index.html"), indexHtml, "utf-8");
console.log("  ✓ /blog/index.html");

// blog-manifest.json — used by React Blog.tsx component
const manifest = posts.map(
  ({
    slug,
    title,
    description,
    date,
    isoDate,
    displayDate,
    tags,
    image,
    imageAlt,
  }) => ({
    slug,
    title,
    description,
    date,
    isoDate,
    displayDate,
    tags,
    image,
    imageAlt,
  }),
);
const manifestJson = JSON.stringify(manifest, null, 2);
fs.writeFileSync(path.join(DIST, "blog-manifest.json"), manifestJson, "utf-8");
fs.writeFileSync(
  path.join(PUBLIC_DIR, "blog-manifest.json"),
  manifestJson,
  "utf-8",
);
console.log("  ✓ /blog-manifest.json");

// /blog.md — markdown index for LLMs
const blogMd = renderBlogMd(posts);
fs.writeFileSync(path.join(DIST, "blog.md"), blogMd, "utf-8");
console.log("  ✓ /blog.md");

// feed.xml
const rss = renderRss(posts);
fs.writeFileSync(path.join(DIST, "feed.xml"), rss, "utf-8");
console.log("  ✓ /feed.xml");

// sitemap.xml
const sitemap = renderSitemap(posts);
fs.writeFileSync(path.join(DIST, "sitemap.xml"), sitemap, "utf-8");
console.log("  ✓ /sitemap.xml");

console.log(`[blog] Done.`);
