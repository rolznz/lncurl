# Blog Post Authoring Guide

## Recommended: use the agent skill

The easiest way to create a new post is to ask Claude Code:

> "Create a blog post about [your topic]"

The `blog-post` skill handles everything — writing the content, generating a cover image
via AI, processing it to OG spec (1200×630), and running the build. You only need to
supply the title, description, and tags.

---

## Manual workflow

### Creating a new post

1. Create a new `.md` file in this directory: `YYYY-MM-DD-your-post-slug.md`
   - Use the date prefix for automatic chronological sorting
   - The slug (filename without `.md`) becomes the URL: `/blog/2026-04-01-my-post`
   - Alternatively, use a plain slug without a date prefix: `how-nwc-works.md` → `/blog/how-nwc-works`

2. Add YAML frontmatter at the top of the file (see template below)

3. Write your content in Markdown

4. Run `yarn build` from the `frontend/` directory (or the project root build command)

5. Preview at `http://localhost:4173/blog/your-slug` after `yarn preview`

---

## Frontmatter fields

```yaml
---
title: Your Post Title # required — shown in <title>, OG, and post heading
description: One sentence. # required — shown in meta description, post list, OG
date: 2026-04-06 # required — YYYY-MM-DD format
tags: [bitcoin, nwc, agents] # optional — shown as badges
image: /blog/images/my-post.jpg # optional but recommended — 1200×630 JPEG for OG sharing
imageAlt: Alt text for image # optional — used in og:image:alt and <img alt>
---
```

Only `title`, `description`, and `date` are required. Adding an `image` significantly improves
how the post looks when shared on Twitter/X, LinkedIn, iMessage, Slack, etc.

---

## Post template

Copy this to start a new post:

````markdown
---
title: Your Post Title
description: A one-sentence description of what this post covers.
date: 2026-04-06
tags: [bitcoin, lightning, nwc]
image: /blog/images/your-slug.jpg
imageAlt: Description of the image
---

Your introduction paragraph here. Keep it short and hook the reader.

## First Section

Content here. Standard Markdown works: **bold**, _italic_, `inline code`, [links](https://example.com).

## Code Example

    ```bash
    curl -X POST https://lncurl.lol
    ```

## Conclusion

Wrap up the post here.
````

---

## Images

- **Dimensions:** 1200 × 630 px (universal OG standard)
- **Format:** JPEG at ~85% quality
- **Size:** Keep under 300 KB
- **Style:** Dark background, bright cyan/green accents — matches the terminal theme
- **Where to save:** `frontend/public/blog/images/your-slug.jpg`
  - This becomes `/blog/images/your-slug.jpg` on the live site
- **Reference in frontmatter:** `image: /blog/images/your-slug.jpg`

Generate images with an AI tool (Midjourney, DALL-E, Ideogram, etc.) using a prompt like:

> "Dark terminal aesthetic, black background, bright green monospace code, [your topic], 1200x630, minimal, no text"

You also need a default site OG image at `frontend/public/og-default.jpg` (1200×630) used for
the home page and any post without a custom image. Create this once and commit it.

---

## What the build script generates

For each `.md` file in this directory, the build script creates:

| Output                          | URL                         | Purpose                            |
| ------------------------------- | --------------------------- | ---------------------------------- |
| `dist/blog/{slug}/index.html`   | `/blog/{slug}`              | Pre-rendered SEO HTML              |
| `dist/blog/{slug}/content.json` | `/blog/{slug}/content.json` | JSON for client-side React nav     |
| `dist/blog/{slug}.md`           | `/blog/{slug}.md`           | Raw markdown for LLMs / curl       |
| `dist/blog/index.html`          | `/blog`                     | Pre-rendered blog index            |
| `dist/blog-manifest.json`       | `/blog-manifest.json`       | Post list for React Blog component |
| `dist/blog.md`                  | `/blog.md`                  | Markdown index for LLMs            |
| `dist/feed.xml`                 | `/feed.xml`                 | RSS 2.0 feed                       |
| `dist/sitemap.xml`              | `/sitemap.xml`              | Sitemap for crawlers               |

The build script also updates `src/llms.txt` with a blog section listing all posts.

---

## Slug naming convention

- Recommended: `YYYY-MM-DD-descriptive-slug.md` — sorts chronologically by filename
- Also fine: `descriptive-slug.md` — sorted by `date` frontmatter field instead
- Use lowercase, hyphens only — no spaces, no uppercase
- Keep slugs stable once published (changing a slug breaks existing links)
