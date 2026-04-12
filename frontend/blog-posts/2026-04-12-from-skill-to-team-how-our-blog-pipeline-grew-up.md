---
title: "From Skill to Team: How Our Blog Pipeline Grew Up"
description: We replaced a single do-everything SKILL.md with a team of specialist agents — researcher, writer, designer, lead. Here's what changed and why it matters.
date: 2026-04-12
tags: [agents, ai, pipeline, claude-code, blog]
image: /blog/images/2026-04-12-from-skill-to-team-how-our-blog-pipeline-grew-up.jpg
imageAlt: A single large glowing cyan-green block on the left connects via a branching pipeline to four distinct specialist nodes on the right, each a different geometric shape, set against a dark navy background.
---

The single-skill pipeline worked. It followed instructions. It produced publishable posts. The problem was that it would only do what you told it to do each time — and the things you most needed it to do consistently were the things most likely to get dropped when you forgot to say them.

## What the Old Skill Actually Did

One file, one agent, every step in sequence. Research, write, design, deploy. The instructions were there; the agent followed them. But nothing was baked in. If you wanted the researcher to reach for Alby lightning tools rather than account-based API options, you had to say so. If you wanted it to prefer L402-gated endpoints over alternatives that required a signup, you had to specify that too. Every run started from scratch. The priorities weren't permanent — they were parameters.

That's a subtle problem. The skill worked well enough that the gap wasn't obvious. But a single agent doing everything produces averaged-out output at every stage. It can't go deep on research and deep on voice and deep on visual identity simultaneously. Something gets less attention, and over many posts, it shows.

## What Specialisation Actually Changes

**The researcher** now has priorities baked in permanently. It always uses Alby tools. It always prefers L402 endpoints over account-based alternatives. You don't specify this per run — it's in the agent's instructions and stays there. The result is that the research reflects what the blog is actually about: agents paying for access autonomously, without accounts or KYC. That wasn't guaranteed before.

**The writer** went from no style guidance at all — the old skill said something like "write a blog post" — to a defined voice with concrete rules. How to open. Sentence rhythm. How to frame things. When to name a rough edge instead of smoothing it over. The voice now has a point of view and instructions for how to execute it consistently. That's not something you can get from a single general-purpose prompt.

**The designer** is new, and it's untested. What it has that didn't exist before is a visual identity: specific iconography, a defined palette, constraints on what to avoid, a method for translating an article into a scene. Whether that produces consistent output across posts is something we'll find out. The instructions are there; the track record isn't yet.

## The Real Point: Permanent vs. Per-Run

The shift isn't about having more agents. It's about where the instructions live.

When priorities are specified per run, they're only as reliable as whoever is running the pipeline that day. When they're baked into an agent's permanent instructions, they compound. The researcher's bias toward lightning-native tools doesn't have to be re-established every time. The writer's voice doesn't have to be re-specified. The constraints accumulate rather than evaporate between runs.

This is the same thing that makes a skilled team member more valuable than a capable contractor: the context doesn't have to be rebuilt at the start of every engagement. The understanding is already there.

## What This Means Beyond the Blog

We cover services that make this argument about APIs: general-purpose endpoints that do everything are convenient until your requirements get specific. The pattern here is the same. A monolith is faster to start. Specialists are faster to run once the domain gets complex enough.

The interesting question isn't whether to specialise — it's when. The answer, probably, is earlier than you think. The cost of re-specifying priorities on every run is invisible until you notice all the times they didn't get specified and the output was quietly worse for it.

---

## Get started

Need a Lightning wallet for your agent? Create one in one command — no sign-up, no KYC:

```bash
curl -X POST https://lncurl.lol
```

You'll get back a Nostr Wallet Connect URI. Fund it with a few sats and your agent can pay for APIs, services, and tools autonomously.

Or give your agent the [lncurl skill](https://lncurl.lol/SKILL.md) directly.
