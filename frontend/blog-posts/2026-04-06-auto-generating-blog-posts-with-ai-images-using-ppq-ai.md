---
title: Auto-Generating Blog Posts with AI Images Using PPQ.ai
description: How we built a Claude Code skill that writes blog posts and generates cover images automatically using PPQ.ai's image generation API.
date: 2026-04-06
tags: [ai, agents, claude, ppq, images]
image: /blog/images/2026-04-06-auto-generating-blog-posts-with-ai-images-using-ppq-ai.jpg
imageAlt: A glowing cyan pipeline diagram showing a document flowing into a robot brain then into a photograph, connected by green arrows on a dark navy background
---

Publishing a blog post used to mean sitting down to write, then separately hunting for an image, then manually resizing it, then running the build. With a single Claude Code skill, we collapsed that entire workflow into one prompt.

## What the skill does

The `blog-post` skill for lncurl.lol handles the full pipeline when you ask Claude to write a post:

1. Gather the title, description, and tags from you
2. Write a full, structured article in Markdown
3. Craft an image prompt *based on the finished article*
4. Call [PPQ.ai](https://ppq.ai)'s image generation API to create a cover image
5. Crop and resize the image to exactly 1200×630 pixels (the OG image standard)
6. Run `yarn build` to regenerate all static outputs
7. Report the live URL

You supply a topic. The agent does the rest.

## Why generate the image prompt last

The key design decision was to generate the image prompt *after* writing the article, not before.

When you ask for an image prompt upfront, you're working from a title — an abstraction. The result tends toward generic visuals: a bitcoin symbol, a lightning bolt, a generic "AI" graphic. These are fine but forgettable.

When the image prompt is derived from the finished article, the agent has full context: the specific angle, the code examples used, the metaphors employed, the conclusion drawn. It can produce a prompt like:

> *"Dark terminal screen showing a glowing cyan pipeline — a document icon feeding into a robot brain icon, then into a stylised JPEG image — dark navy background, minimal flat design, no text"*

That's a prompt that reflects the article's actual structure. The image feels like it belongs to the post rather than being stock art pasted on top.

## How it works under the hood

The skill is a `SKILL.md` file at `.claude/skills/blog-post/SKILL.md` in the project. Claude Code loads it automatically and triggers it whenever you ask about writing a blog post.

**Image generation** uses PPQ.ai's `gpt-image-1.5` model:

```bash
RESPONSE=$(curl -s -X POST https://api.ppq.ai/v1/images/generations \
  -H "Authorization: Bearer $PPQ_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"model":"gpt-image-1.5","prompt":"YOUR_PROMPT","quality":"medium","n":1}')

IMAGE_URL=$(echo "$RESPONSE" | jq -r '.data[0].url')
```

The API returns a URL. We download the image, then process it with `ffmpeg` to fit the OG image spec:

```bash
ffmpeg -y -i /tmp/blog-cover-raw.jpg \
  -vf "crop=iw:iw/1.9048,scale=1200:630" \
  frontend/public/blog/images/SLUG.jpg
```

The `crop=iw:iw/1.9048` filter keeps the full width and derives the height to match the 1.91:1 aspect ratio, center-cropping automatically. `scale=1200:630` then resizes to the exact target. No squishing, no letterboxing — a clean 1200×630 crop every time.

**Security:** The `PPQ_API_KEY` is sourced from `.env` using `set -a && source .env && set +a`. The agent never reads or echoes the key — it just passes it through the shell environment to `curl`.

## Applying this pattern to your own site

The pattern generalises to any statically-built site:

1. Write a `SKILL.md` that describes your blog's frontmatter schema and build command
2. Point it at an image generation API (PPQ.ai, OpenAI, Replicate, etc.)
3. Instruct the agent to derive the image prompt from the finished article
4. Add the crop-and-resize step to match your OG image spec

The build step is the glue — because we run `yarn build` as part of the skill, the agent can verify its own output. If the build fails, it diagnoses and fixes before reporting success. The whole loop is self-contained.

## Funding PPQ.ai with a Lightning wallet

PPQ.ai accepts Lightning payments, which means you can top up your image generation balance directly from an lncurl.lol wallet. Create a wallet with one `curl`, fund it with a few hundred sats, and your agent has everything it needs — code execution, image generation credits, and a payment method — without touching a credit card.

## Conclusion

AI-assisted writing tools often stop at the text. This skill goes further: it treats the entire publishing pipeline — article, image, SEO metadata, static build — as a single atomic operation. The result is a blog post that's ready to deploy, not just ready to edit.

If you're running a statically-built site and want to adopt the same approach, the full skill source is available at `/blog/auto-generating-blog-posts-with-ai-images-using-ppq-ai.md`.

---

## Get started

Need a Lightning wallet for your agent? Create one in one command — no sign-up, no KYC:

```bash
curl -X POST https://lncurl.lol/api/wallet
```

You'll get back a Nostr Wallet Connect URI. Fund it with a few sats and your agent can pay for APIs, services, and tools — including PPQ.ai image credits — autonomously.
