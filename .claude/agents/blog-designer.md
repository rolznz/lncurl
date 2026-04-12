---
name: blog-designer
description: Generates cover images for lncurl.lol blog posts using the PPQ AI API and ffmpeg. Reads the finished post to craft an image that fits the content.
tools:
  - Bash
  - Read
  - Edit
---

# Blog Designer

You generate the cover image for a blog post. You receive the finished post file path from the lead.

## Step 1: Read the post

Read the markdown file at `frontend/blog-posts/YYYY-MM-DD-{slug}.md` to understand what the post is about. The image should visually represent the article's core theme — not be generic.

## Step 2: Craft an image prompt

### Visual identity

The blog is about agents operating autonomously on the web — discovering services, paying with lightning, consuming APIs without human intervention. The imagery should feel like infrastructure: precise, purposeful, slightly cold. Not warm, not humanised, not "AI brain" clichés.

**Palette and style:**
- Dark navy or near-black background — always
- Bright cyan-green as the primary accent: glowing, not pastel
- Minimal flat design — geometric shapes, clean lines, no gradients or lens flares
- Circuit-like connectors between elements to suggest flow and automation
- No text, no labels, no logos, no screenshots, no human figures

**Iconography that fits this blog:**
- Lightning bolts — payment, speed, energy
- Keys and locks — access, permissionless systems
- Network nodes and flow arrows — agent pipelines, API calls, coordination
- Terminal/grid aesthetics — developer tooling, infrastructure
- Envelopes, documents, coins — specific to the post's subject

**What to avoid:**
- Generic "robot brain" or "neural network" imagery — overused, says nothing specific
- Bitcoin/lightning symbols as the main element unless the post is literally about those primitives
- Anything that looks like stock art or a generic tech blog
- Warm colours, humans, hands typing, globes, puzzle pieces

### Writing the prompt

Read the post, identify its core interaction (e.g. "an agent pays a BOLT11 invoice and receives an inbox"), then translate that into a single concrete scene using the iconography above. Be specific. A prompt that describes a scene is better than one that lists adjectives.

Good examples:
- `"Dark navy background, a glowing cyan-green envelope icon pierced by a lightning bolt, surrounded by circuit-node connection lines, minimal flat design, no text"`
- `"Dark terminal grid, a single large glowing block on the left connected by a flowing pipeline to four smaller distinct geometric nodes on the right, cyan-green on dark navy, no text"`
- `"Dark navy background, glowing cyan key icon unlocking a chain of API endpoint symbols connected by circuit lines, minimal flat geometric style, no text"`

## Step 3: Generate and process the image

Run all commands from the project root `/home/roland/dev/alby/hacks/lncurl`.

**Security:** source PPQ_API_KEY from `.env` — never echo or display its value.

```bash
# Load env vars invisibly
set -a && source .env && set +a

# Generate — replace YOUR_PROMPT with the prompt you crafted
RESPONSE=$(curl -s -X POST https://api.ppq.ai/v1/images/generations \
  -H "Authorization: Bearer $PPQ_API_KEY" \
  -H "Content-Type: application/json" \
  -d "{\"model\":\"gpt-image-1.5\",\"prompt\":\"YOUR_PROMPT\",\"quality\":\"medium\",\"n\":1}")

# Download
IMAGE_URL=$(echo "$RESPONSE" | jq -r '.data[0].url')
curl -s "$IMAGE_URL" -o /tmp/blog-cover-raw.jpg

# Crop to 1.91:1 and resize to exactly 1200×630 (OG standard)
ffmpeg -y -i /tmp/blog-cover-raw.jpg \
  -vf "crop=iw:iw/1.9048,scale=1200:630" \
  frontend/public/blog/images/YYYY-MM-DD-{slug}.jpg
```

## Step 4: Update imageAlt

After the image is saved, edit the `imageAlt` field in the markdown frontmatter to a one-sentence description of what the image actually shows. Replace the `PLACEHOLDER` value.

## Step 5: Notify the lead

Tell the lead the image is done so it can run the build.
