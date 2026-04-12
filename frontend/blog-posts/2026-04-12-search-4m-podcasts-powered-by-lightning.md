---
title: "Search 4M Podcasts for Any Person, Topic, or Show — Powered by Lightning"
description: Pull That Up Jamie's podcast intelligence API lets an agent search 4M+ shows by natural language query for 7 sats, with an LLM router that classifies intent and fans out to the right backend.
date: 2026-04-12
tags: [bitcoin, lightning, L402, podcast, search, agents]
image: /blog/images/2026-04-12-search-4m-podcasts-powered-by-lightning.jpg
imageAlt: A cyan-green lightning bolt radiates outward on a dark navy background, branching into a constellation of interconnected microphone and audio waveform nodes representing a vast podcast network.
---

We searched the word "LNCURL" across 4 million podcasts. One result came back from a Bitcoin Audible episode recorded in March 2026, where the host literally spells it out: "l n c u r l dot l o l." The share link opened a clip player at exactly that moment. The listen link led to the full episode page. The full episode page had the complete transcript. The transcript had the full paragraph — including everything said about lncurl.lol, in context. One 6-sat search query unlocked that entire chain.

That is what [Pull That Up Jamie](https://www.pullthatupjamie.ai) can do — surface exact spoken moments from inside audio files that no standard search index can reach, then hand your agent everything it needs to go deeper.

## What Pull That Up Jamie actually is

This is podcast intelligence as an API. Behind a single L402-gated endpoint sits a pipeline that classifies free-text queries, routes them to different search backends, and returns structured results including episode metadata, transcription availability, and routing decisions. You do not configure which search mode to use — the router decides.

The name is a reference to the Joe Rogan running gag. The pitch is accurate: your agent can pull that up, now.

## The three-layer architecture: discover, transcribe, search

There are four endpoints, each handling a different layer of the pipeline:

```bash
# Discover podcasts by topic, person, or show name (7 sats)
npx -y @getalby/cli@0.6.1 fetch \
  -X POST \
  -b '{"query":"bitcoin privacy"}' \
  "https://www.pullthatupjamie.ai/api/discover-podcasts"
# → {
#     "query": "bitcoin privacy",
#     "routing": {"intent": "topic", "topicHints": ["bitcoin", "privacy"], ...},
#     "results": [/* up to 10 podcast feeds */],
#     "total": 10,
#     "transcribedCount": 0,
#     "metadata": {"llmLatencyMs": 1732, "totalLatencyMs": 6149}
#   }

# Search across transcribed moments (6 sats)
# POST /api/search-quotes

# Search across chapter metadata (11 sats)
# POST /api/search-chapters

# Submit an episode for transcription and indexing (644 sats)
# POST /api/on-demand/submitOnDemandRun
```

The four endpoints are priced separately: discovery at 7 sats, quote search at 6 sats, chapter search at 11 sats, and on-demand transcription at 644 sats.

## Skip discover-podcasts. Use search-quotes.

We tried `discover-podcasts` first — it felt like the natural starting point. Don't make the same mistake. Here's what it returned for "Alby":

```bash
curl -s -X POST \
  -H "Content-Type: application/json" \
  -H "X-Free-Tier: true" \
  -d '{"query": "Alby"}' \
  "https://www.pullthatupjamie.ai/api/discover-podcasts"
```

```json
{
  "query": "Alby",
  "routing": {
    "intent": "topic",
    "topicHints": ["crypto", "bitcoin"]
  },
  "results": [
    { "title": "Discover Crypto", "transcriptAvailable": false },
    {
      "title": "Thinking Crypto News & Interviews",
      "transcriptAvailable": false
    }
  ],
  "total": 10,
  "transcribedCount": 0,
  "untranscribedCount": 10,
  "metadata": {
    "llmLatencyMs": 1682,
    "totalLatencyMs": 6472,
    "backendsQueried": ["topic_hint:\"crypto\"", "topic_hint:\"bitcoin\""]
  }
}
```

10 generic bitcoin podcasts. None specifically about Alby. None with transcribed episodes. The routing isn't wrong — Alby is a bitcoin product, so `["crypto", "bitcoin"]` are technically valid hints. But the results are useless for finding actual Alby content.

We already know Bitcoin Audible has an episode where the host spends a full paragraph on lncurl.lol and AlbyHub. It doesn't appear here. Because `discover-podcasts` searches feed metadata — show titles, RSS descriptions, category tags. It can tell you which shows broadly cover bitcoin. It cannot tell you which episodes mentioned something specific.

If you're looking for a product, person, or idea that was spoken about in a podcast: skip this endpoint. Go straight to `search-quotes`.

## Searching inside podcast audio

`/api/discover-podcasts` finds shows and feeds. `/api/search-quotes` goes deeper — inside the audio itself. It returns exact timestamped quotes from transcribed episodes, each with a share URL that opens a clip player, a listen link to the original episode, and an audio URL pointing directly to the MP3.

The endpoint supports a free tier. Pass `X-Free-Tier: true` to skip the L402 handshake for prototyping. Paid calls cost 6 sats.

```bash
curl -s -X POST \
  -H "Content-Type: application/json" \
  -H "X-Free-Tier: true" \
  -d '{"query": "LNCURL"}' \
  "https://www.pullthatupjamie.ai/api/search-quotes"
```

The query returned 5 results. One was signal:

```json
{
  "quote": "I haven't actually used this, but one of the really promising features of this is essentially a plug and play networking system. This is why we are using it. Then another one that I thought was pretty cool, this was run with AlbiHub and Nostra Wallet Connect is l n curl. It's l n curl dot loll. So l n c u r l dot l o l.",
  "episode": "Roundtable_018 - Everything is Fake and Gay",
  "creator": "Bitcoin Audible",
  "date": "2026-03-05T11:00:00.000Z",
  "shareUrl": "https://pullthatupjamie.ai/share?clip=https___permalink_castos_com_podcast_59707_episode_2382411_p348",
  "listenLink": "https://bitcoin-audible.castos.com/episodes/roundtable-018-everything-is-fake-and-gay",
  "timeContext": { "start_time": 7830.195, "end_time": 7856.325 }
}
```

The other four:

- **Plebchain Radio** — "Keysend versus LNURL" — a discussion of LNURL the lightning protocol, not lncurl.lol the service. The semantic model conflated the two. Close miss, wrong target.
- **Lex Fridman Podcast** — ThePrimeagen episode discussing the `curl` command-line tool and LLM-generated CVEs. Matched on "CURL". Nothing to do with lightning.
- **Bitcoin And** × 2 — single-word quote: "CNBC". No idea.

One genuine hit out of five. The `total` field tells your agent how many came back — and reading the quotes, an agent can filter the noise trivially.

## The discovery chain

This is where it gets interesting. Each field in that result is a door.

The `shareUrl` opens a clip player on the Pull That Up Jamie site — [listen to the exact moment](https://pullthatupjamie.ai/share?clip=https___permalink_castos_com_podcast_59707_episode_2382411_p348) the host starts talking about lncurl.lol. Or listen here directly:

<audio controls style="width:100%;margin:1rem 0">
  <source src="/blog/audio/roundtable018-lncurl-clip.mp3" type="audio/mpeg" />
</audio>

The `listenLink` goes to the [full Bitcoin Audible episode](https://bitcoin-audible.castos.com/episodes/roundtable-018-everything-is-fake-and-gay). The episode page has the complete transcript. From the transcript, the full context of the lncurl.lol mention:

> _"Then another one that I thought was pretty cool — this was run with AlbyHub and Nostr Wallet Connect — is lncurl. It's lncurl.lol. So l n c u r l dot lol. This is a custodial lightning wallet service, but it's designed for agents where you can just create a wallet with an HTTP call and it costs a sat per hour to keep it live and then it can just be deleted or easily booted up, used for some span of time and then closed back out. I think just the way they've built it and the way I use my agent really kind of lends itself to see how fast and ephemeral how much this stuff might move in such short spans of time."_
>
> — Guy Swan, Bitcoin Audible, Roundtable_018 (March 2026, ~2:10:30)

One 6-sat query unlocked: the exact quote, the clip player, the full episode, the full transcript, and the extended context. An agent can follow every one of those links without a human in the loop.

The response also includes a `relatedEndpoints` field pointing toward `/api/discover-podcasts` and `/api/search-chapters`. The API describes itself — an agent can follow those hints to continue research without hardcoded routing logic.

## One payment handshake, four endpoints

The L402 flow happens once. After the first paid request, the macaroon issued by the payment handshake is reused across all four endpoints. There is no per-endpoint credential — your agent authenticates once and the token covers discovery, quote search, chapter search, and on-demand transcription alike.

This is the right design for agentic use. An agent building a podcast research pipeline does not want to manage four separate auth flows. One lightning payment buys a shared balance; calls are billed against it as you go.

## What agents can build with this

The practical use cases are research-heavy tasks that currently require a human to scrub through podcast apps manually:

- **Topic monitoring**: run a daily discover query against a news topic, flag new shows that appeared since the last check
- **Expert finding**: query a named person and let the router classify the intent — though as covered above, named entities can drift to generic topic results
- **Quote and chapter search**: the `/api/search-quotes` and `/api/search-chapters` endpoints exist for deeper search once you have discovered relevant shows (6 sats and 11 sats respectively)
- **On-demand transcription**: submit an episode URL, pay the 644 sats, and the content becomes searchable

An agent with the [Alby payments skill](https://github.com/getAlby/payments-skill) can run all of this autonomously — authenticate with L402, pay per call from its wallet, and return structured results without a human touching the API credentials:

```bash
npx skills add getAlby/payments-skill
```

## Roland's Rant

The agent really struggled here. We burned through thousands of sats getting nowhere — no useful results for Alby, a product mentioned on plenty of podcasts.

[402index.io](https://402index.io/) is part of the problem. It lists endpoints but doesn't tell an agent how to call them. No request format, no parameters, no example. It's a directory that assumes you already know everything you need to know.

[pullthatupjamie.ai](https://www.pullthatupjamie.ai) defaulting to 1000 sats per request while quietly supporting `?amountSats=10` feels like a rug pull — especially when the `discover-podcasts` endpoint is this limited. If you don't know to check the 402 response body before paying, you're paying 100× more than you need to. That information should be surfaced, not buried.

The idea is great. Semantic search inside podcast audio, unified L402 credentials, self-describing API responses — these are exactly the right design choices. But the agent experience needs work. We got there in the end, and the magic moment — finding lncurl.lol spelled out letter by letter on Bitcoin Audible — was genuinely surprising. It just took longer to get there than it should have.

## Conclusion

Pull That Up Jamie is one of the more complete agentic API designs we have tested: metered per call, unified credentials across endpoints, and honest about what each layer costs. The LLM routing layer has real limits — named entity queries can silently collapse to generic topic results — but the architecture around it is sound. And the `search-quotes` endpoint delivers on the headline promise: exact spoken moments from inside audio, with timestamps and clip links your agent can hand directly to a user. The fact that one of those moments is a Bitcoin Audible host spelling out `lncurl.lol` letter by letter is, frankly, a reasonable way to end a test run.

---

## Get started

Need a Lightning wallet for your agent? Create one in one command — no sign-up, no KYC:

```bash
curl -X POST https://lncurl.lol
```

You'll get back a Nostr Wallet Connect URI. Fund it with a few sats and your agent can pay for APIs, services, and tools autonomously.

Or give your agent the [lncurl skill](https://lncurl.lol/SKILL.md) directly.
