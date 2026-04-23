---
title: "Jamie Pull Agent: Multi-Tool Podcast Search for $0.10 a Call"
description: Pull That Up Jamie wrapped its L402 podcast-search primitives in an agent. One plain-English request, one lightning payment, and it plans and calls the primitives for you.
date: 2026-04-23
tags: [bitcoin, lightning, "L402", podcast, agents, orchestration]
image: /blog/images/2026-04-23-jamie-pull-agent-multi-tool-podcast-search.jpg
imageAlt: A glowing cyan speech bubble feeds a hexagonal orchestrator node marked with a lightning bolt, which fans out through circuit lines to four podcast-search tool icons — a magnifying glass, a chapter list, a microphone waveform, and a radar sweep — on a dark navy background.
---

Ask the agent a question in plain English. It picks the tools, calls them, clusters the results, and hands back a readable answer with inline clips you can play. One payment, one response.

Two weeks ago we [tested Pull That Up Jamie's podcast-search primitives](/blog/2026-04-12-search-4m-podcasts-powered-by-lightning) — discovery, quote search, chapter search, on-demand transcription, each metered per call. They have now built an agent on top of those primitives. The new endpoint is `POST /api/pull`. Flat $0.10 per call, paid over L402.

## One prompt, one payment, one answer

We sent it a research query:

```bash
curl -s -D- -X POST \
  -H "Content-Type: application/json" \
  -d '{"message":"Find recent mentions of Alby Hub in podcasts"}' \
  "https://www.pullthatupjamie.ai/api/pull"
```

That probe returns a 402 challenge with a default invoice of 148 sats.

Pay and retry using the Alby CLI:

```bash
npx -y @getalby/cli@0.6.1 fetch --max-amount 200 \
  -X POST \
  -H '{"Content-Type":"application/json"}' \
  -b '{"message":"Find recent mentions of Alby Hub in podcasts"}' \
  "https://www.pullthatupjamie.ai/api/pull"
```

One note on the CLI: `alby fetch` wraps the upstream body as `{"content": "<json-string>"}`. Unwrap and `JSON.parse()` the inner field to get the response.

The wire delta came in at 150 sats — the 148-sat invoice plus 2 sats of routing. At 77,908 USD/BTC that is ~$0.115 paid, $0.10 of which was consumed by the call itself.

The response, unwrapped:

```json
{
  "sessionId": "agent-1776950225809-ynfwvz",
  "text": "... markdown answer with {{clip:<pineconeId>}} tokens ...",
  "suggestedActions": [],
  "session": null
}
```

## Three clips, two shows, one synthesis

The agent returned three clips from two different shows, clustered thematically with contextual prose between them. This cross-show synthesis is the value the agent layer adds on top of the raw primitives — you get a curated answer, not a result list.

### 1. LINUX Unplugged — February

The first clip — token `{{clip:61d01c70-0ce3-499a-8605-784dabcaadb0_p177}}` ([open clip](https://cascdr-chads-stay-winning.nyc3.cdn.digitaloceanspaces.com/575694/61d01c70-0ce3-499a-8605-784dabcaadb0.mp3#t=4605) · [open JSON](https://www.pullthatupjamie.ai/api/get-hierarchy?paragraphId=61d01c70-0ce3-499a-8605-784dabcaadb0_p177)) — is a show host pitching Alby Hub as the self-hosted path:

> "If you would like to boost the show, Fountain FM makes it really easy. They're making it easier and easier with every single release. They host the entire infrastructure for you. Or, like our baller, you can go get Albie Hub and plumb the self-hosted way yourself and use the entire free software stack from end to end."

### 2. LINUX Unplugged episode 659 — March 23

The second clip — token `{{clip:9ccfe1b0-8b6f-4ac7-b50a-477842808697_p174}}` ([open clip](https://cascdr-chads-stay-winning.nyc3.cdn.digitaloceanspaces.com/575694/9ccfe1b0-8b6f-4ac7-b50a-477842808697.mp3#t=2479.995) · [open JSON](https://www.pullthatupjamie.ai/api/get-hierarchy?paragraphId=9ccfe1b0-8b6f-4ac7-b50a-477842808697_p174)) — is the same show a month later, congratulating a listener:

> "By the way. Congratulations on self hosting in Albi Hub. It's a big step, and we're proud of you."

### 3. Trust Revolution — March

The third clip — token `{{clip:6c22583d-7678-488e-b907-461a737d294a_p45}}` ([open clip](https://cascdr-chads-stay-winning.nyc3.cdn.digitaloceanspaces.com/7246395/6c22583d-7678-488e-b907-461a737d294a.mp3#t=1507.187) · [open JSON](https://www.pullthatupjamie.ai/api/get-hierarchy?paragraphId=6c22583d-7678-488e-b907-461a737d294a_p45)) — is the meatiest. The speaker is me, on the Trust Revolution podcast, walking through the actual friction points:

> "Maybe getting AlbiHub up and running is a lot less painful than KYC for a lot of people. The main points we have right now is one, you have to self-host, and we have a cloud hosting solution, which is super easy like deploy with one click but it comes with a monthly fee. Either way that's one barrier and the other one is opening your first channel which so we have different options like if you buy a yearly hosted plan we'll open your first channel for free but if you self-host normally you have to pay to open the channel."

Notice the phonetic variants: "Albie Hub", "Albi Hub", "AlbiHub". The transcripts preserved how the hosts actually said the name, and the agent didn't over-correct them on the way out. That is the right call. If you are building a quote surface you want the spoken word, not a sanitised version of it. An agent that silently rewrites "Albi Hub" to "Alby Hub" is an agent that will eventually rewrite the thing you actually care about.

The two links beside each clip above are how we turned the agent's `{{clip:<pineconeId>}}` tokens into something a reader can click. Take the id inside the token — e.g. `61d01c70-0ce3-499a-8605-784dabcaadb0_p177` — and drop it into the unauthenticated hierarchy endpoint:

```text
https://www.pullthatupjamie.ai/api/get-hierarchy?paragraphId=<pineconeId>
```

That returns `{hierarchy: {paragraph, episode, feed}}` — the full paragraph text with `start_time` / `end_time`, the chapter it sits inside, the episode title, audio URL and listen link, and the feed metadata. That is the **open JSON** link.

From the same response, the **open clip** link is just `audioUrl` with a media-fragment timestamp appended:

```text
<paragraph.metadata.audioUrl>#t=<paragraph.metadata.start_time>
```

Browsers interpret `#t=<seconds>` as a playback offset on audio and video, so the reader lands mid-episode right on the quote. Two links, no paid calls, no extra UI — just the hierarchy endpoint and a media fragment.

Read the full specs at the [Jamie Pull Agent dev guide](https://www.pullthatupjamie.ai/JamiePullAgentClientDevGuide.md) and the [OpenAPI spec](https://www.pullthatupjamie.ai/api/openapi.json). The reference UI lives at [pullthatupjamie.ai/app?view=agent](https://www.pullthatupjamie.ai/app?view=agent).

## Pricing and credentials

Flat $0.10 per call. The pricing block is published in every 402 challenge, alongside the primitive prices: `search-quotes` at $0.004, `chapter-search` at $0.008, `discover-podcasts` at $0.005, `make-clip` at $0.05, `submit-on-demand-run` at $0.45.

The default invoice is 148 sats — one call plus a thin buffer. Pay, get your answer, move on.

## Conclusion

The primitive owner built the orchestration layer. One endpoint, one payment, plain English in, three clips clustered across two shows — all for a dime.

Ship your agent against `POST /api/pull`, resolve the `{{clip:...}}` tokens, and you have a podcast-research loop that pays its own bills.

---

## Get started

Need a Lightning wallet for your agent? Create one in one command — no sign-up, no KYC:

```bash
curl -X POST https://lncurl.lol
```

You'll get back a Nostr Wallet Connect URI. Fund it with a few sats and your agent can pay for APIs, services, and tools autonomously.

Or give your agent the [lncurl skill](https://lncurl.lol/SKILL.md) directly.
