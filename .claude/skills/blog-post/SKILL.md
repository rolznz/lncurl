---
name: blog-post
description: Create a new blog post for lncurl.lol — writes the markdown file, generates an AI cover image via PPQ API (1200×630 OG format), and triggers a full site rebuild. Use this skill whenever the user wants to write, publish, add, or draft a new blog post, article, or update to the lncurl.lol blog, even if they don't say "blog post" explicitly.
---

# Create a Blog Post for lncurl.lol

You are the **team lead** for a blog post creation workflow. Your job is to coordinate four specialist teammates — a researcher, a writer, an editor, and a designer — each defined as a reusable subagent role.

The entry point is a URL or service to test: `"Test <url> and write a blog post about it"`

**Workflow: researcher → writer → designer → build → report**

---

## Step 1: Spawn the researcher

Spawn a teammate using the `blog-researcher` agent type, named `researcher`.

Give it:
- The URL or service to test
- Any context the user provided (e.g. what the service does, specific features to explore)

Create a task on the shared task list:
- **Task 1**: Research `{url}` — assigned to `researcher`

Wait for the researcher to complete and send back a research brief.

---

## Step 2: Derive metadata from the brief

From the researcher's brief, extract or confirm:
- **title** — use the researcher's suggestion, or refine it
- **description** — one sentence for the meta description
- **tags** — short keywords; purely numeric tags must be quoted (e.g. `["402", bitcoin]`)

Run to get today's date:

```bash
date +%Y-%m-%d
```

Slug rules: lowercase letters and hyphens only, derived from the title.
- "How NWC Works" → `how-nwc-works`
- "Why AI Agents Need Bitcoin" → `why-ai-agents-need-bitcoin`

Filename: `YYYY-MM-DD-{slug}.md` in `frontend/blog-posts/`
Image filename: `YYYY-MM-DD-{slug}.jpg`

---

## Step 2b: Ask about a rant

Before spawning the writer, ask the user:

> "Would you like to add a **Roland's Rant** section — an honest, opinionated take on what was frustrating, broken, or surprising about the service? If yes, tell me what to include and I'll pass it to the writer."

If the user provides rant content, include it in the brief to the writer. If they decline, proceed without it.

---

## Step 3: Spawn the writer

Spawn a teammate using the `blog-writer` agent type, named `writer`.

Give it the full research brief plus:
- Confirmed title, description, tags
- Slug and date
- Target file path: `frontend/blog-posts/YYYY-MM-DD-{slug}.md`

Create a task on the shared task list:
- **Task 2**: Write post `{slug}` — assigned to `writer` (depends on Task 1)

Wait for the writer to finish.

---

## Step 4: Spawn the editor

Spawn a teammate using the `blog-editor` agent type, named `editor`.

Give it:
- The post file path: `frontend/blog-posts/YYYY-MM-DD-{slug}.md`
- The full research brief (or the brief you provided to the writer)

Create a task on the shared task list:
- **Task 3**: Edit post `{slug}` — assigned to `editor` (depends on Task 2)

Wait for the editor to respond.

**If the editor approves:** proceed to Step 5.

**If the editor returns issues:** send the post back to the writer with the specific issue list. Wait for the writer to fix, then ask the editor to review again. Repeat until approved. Update task status accordingly.

---

## Step 5: Spawn the designer

Spawn a teammate using the `blog-designer` agent type, named `designer`.

Give it:
- The post file path: `frontend/blog-posts/YYYY-MM-DD-{slug}.md`
- The target image path: `frontend/public/blog/images/YYYY-MM-DD-{slug}.jpg`

Create a task on the shared task list:
- **Task 4**: Generate cover image for `{slug}` — assigned to `designer` (depends on Task 3)

Wait for the designer to finish. The designer will update `imageAlt` in the post file directly.

---

## Step 7: Build

```bash
cd /home/roland/dev/alby/hacks/lncurl/frontend && yarn build
```

Watch for errors. If the build fails, diagnose and fix before reporting success.

---

## Step 8: Review

Report to the user and wait for their feedback before proceeding:

- **Local preview**: run `yarn preview` from `frontend/`, then visit `http://localhost:4173/blog/YYYY-MM-DD-{slug}`
- **Raw markdown**: `frontend/blog-posts/YYYY-MM-DD-{slug}.md`

Ask the user to review the post and image, and whether they'd like any changes. If they provide feedback, delegate revisions to the appropriate teammate (writer for content, designer for the image) and rebuild before asking again. Repeat until the user is happy.

## Step 9: Clean up and report

Once the user approves, clean up the team and report:

- **Live URL** (after deploy): `https://lncurl.lol/blog/YYYY-MM-DD-{slug}`
- **Raw markdown**: `https://lncurl.lol/blog/YYYY-MM-DD-{slug}.md`
