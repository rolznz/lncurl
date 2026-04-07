---
name: blog-post
description: Create a new blog post for lncurl.lol — writes the markdown file, generates an AI cover image via PPQ API (1200×630 OG format), and triggers a full site rebuild. Use this skill whenever the user wants to write, publish, add, or draft a new blog post, article, or update to the lncurl.lol blog, even if they don't say "blog post" explicitly.
---

# Create a Blog Post for lncurl.lol

You are creating a new SEO-optimised blog post. The workflow has five steps:
**gather info → write post → generate image from article → build → report**

## Step 1: Gather post details

Ask the user for anything not already provided:

- **title** — the post title (required)
- **description** — one sentence: appears in meta description, post list, and OG tags
- **tags** — array of short keywords, e.g. `[bitcoin, lightning, nwc]`. Tags that are purely numeric must be quoted (YAML parses bare numbers as integers, which breaks the build), e.g. `["402", bitcoin, lightning]`

Do not ask for an image prompt — you will craft it yourself after writing the article.

## Step 2: Determine slug and filename

Run to get today's date:

```bash
date +%Y-%m-%d
```

Slug rules: lowercase letters and hyphens only, derived from the title.

- "How NWC Works" → `how-nwc-works`
- "Why AI Agents Need Bitcoin" → `why-ai-agents-need-bitcoin`

Filename: `YYYY-MM-DD-{slug}.md` placed in `frontend/blog-posts/`
Image filename: `YYYY-MM-DD-{slug}.jpg`

## Step 3: Write the markdown file

Create `frontend/blog-posts/YYYY-MM-DD-{slug}.md`. Leave `image` and `imageAlt` as placeholders for now — you'll fill them in after generating the image.

````markdown
---
title: { title }
description: { description }
date: YYYY-MM-DD
tags: [{ tag1 }, { tag2 }]
image: /blog/images/YYYY-MM-DD-{slug}.jpg
imageAlt: PLACEHOLDER
---

{intro paragraph — hook the reader, 2-3 sentences}

## {First section heading}

{content}

## {More sections as needed}

{content — aim for 400–800 words total, use code blocks where relevant}

## Conclusion

{wrap up with a clear takeaway or call to action}

---

## Get started

Need a Lightning wallet for your agent? Create one in one command — no sign-up, no KYC:

```bash
curl -X POST https://lncurl.lol
```
````

You'll get back a Nostr Wallet Connect URI. Fund it with a few sats and your agent can pay for APIs, services, and tools autonomously.

````

The CTA block above must appear at the end of every post, verbatim. It is both human-readable and agent-friendly — agents can parse the `curl` command directly to acquire a wallet.

Write substantive, accurate content that matches the title. Use `bash` or `typescript` fenced code blocks where useful.

**Style:** Write in an agent-agnostic style — avoid referencing Claude, ChatGPT, or any specific AI by name. Use "agent", "AI agent", or "your agent" instead. When referencing the Alby Bitcoin Payments skill, use: `npx skills add getAlby/payments-skill`. Write "bitcoin" and "lightning" in lowercase, same as "the internet" — only capitalise at the start of a sentence or in a title.

## Step 4: Generate the cover image

Now that the article is written, craft an image prompt that visually represents its core theme. A good prompt is specific to the article's subject, not generic. It should follow the site's terminal aesthetic:
- Dark navy/black background
- Bright cyan-green symbolic elements (icons, diagrams, shapes — not screenshots)
- Minimal flat design
- **No text or words in the image**

Example for an article about NWC:
> `"Dark terminal screen with a glowing green key icon connected to a lightning bolt symbol, dark navy background, minimal flat design, no text"`

**Security:** Source PPQ_API_KEY from the project `.env` — never echo or display its value.

Run all commands from the project root `/home/roland/dev/alby/hacks/lncurl`:

```bash
# Load env vars (key stays invisible)
set -a && source .env && set +a

# Generate image — substitute YOUR_PROMPT with the prompt you crafted
RESPONSE=$(curl -s -X POST https://api.ppq.ai/v1/images/generations \
  -H "Authorization: Bearer $PPQ_API_KEY" \
  -H "Content-Type: application/json" \
  -d "{\"model\":\"gpt-image-1.5\",\"prompt\":\"YOUR_PROMPT\",\"quality\":\"medium\",\"n\":1}")

# Extract URL and download
IMAGE_URL=$(echo "$RESPONSE" | jq -r '.data[0].url')
curl -s "$IMAGE_URL" -o /tmp/blog-cover-raw.jpg

# Crop to 1.91:1 aspect ratio and resize to exactly 1200×630 (OG standard)
# Uses ffmpeg: crops to full width with matching height, then scales to target
ffmpeg -y -i /tmp/blog-cover-raw.jpg \
  -vf "crop=iw:iw/1.9048,scale=1200:630" \
  frontend/public/blog/images/YYYY-MM-DD-SLUG.jpg
````

Verify the output file exists. Then update the `imageAlt` frontmatter field in the markdown file with a one-sentence description of what the image shows.

## Step 5: Build

```bash
cd /home/roland/dev/alby/hacks/lncurl/frontend && yarn build
```

Watch for errors. If the build fails, diagnose and fix before reporting success.

## Step 6: Report to user

- Live URL (after deploy): `https://lncurl.lol/blog/YYYY-MM-DD-{slug}`
- Raw markdown: `https://lncurl.lol/blog/YYYY-MM-DD-{slug}.md`
- Local preview: run `yarn preview` from `frontend/`, then visit `http://localhost:4173/blog/YYYY-MM-DD-{slug}`
