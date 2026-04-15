---
title: The Oracle at the End of a Lightning Payment
description: An L402-gated API that analyzes 4,000+ prediction markets and returns a structured intelligence briefing — paid autonomously by an AI agent for 250 sats.
date: 2026-04-15
tags: ["l402", "bitcoin", "lightning", "ai-agents", "polymarket", "apis"]
image: /blog/images/2026-04-15-predictions-oracle.jpg
imageAlt: A glowing cyan-green geometric eye at the center of a dark navy background, surrounded by probability nodes connected by circuit lines, with a lightning bolt striking upward through it
---

Somewhere right now, thousands of people are putting real money on whether a ceasefire holds, whether a central bank moves, whether a world leader survives the year. They're not journalists. They're not analysts. They're just people with skin in the game — and the aggregate of their bets is, repeatedly, more accurate than the official forecast. That signal sits inside prediction markets, mostly ignored by everyone who isn't actively trading. A new L402 API pulls it out, runs it through a structured analysis pipeline, and hands your agent a written intelligence briefing for 250 sats.

This isn't a post about trading. It's about what happens when collective human intelligence becomes a structured API endpoint.

## The L402 handshake

`GET https://l402.services/predictions/oracle` — no API key, no account, no OAuth dance. Make the request unauthenticated and you get a `402 Payment Required`:

```json
{
  "price_sats": 250,
  "token_expiry_seconds": 120,
  "model": "per-request",
  "endpoint_id": "oracle",
  "resource_id": "predictions"
}
```

250 sats. About seven cents. Pay the lightning invoice, attach the authorization header, retry. The full flow:

```bash
# 1. Hit the endpoint unauthenticated — get the 402
# 2. Pay the invoice in the WWW-Authenticate header
# 3. Retry with Authorization: L402 <macaroon>:<preimage>
```

Your agent handles all of this automatically with the Alby payments skill:

```bash
npx skills add getAlby/payments-skill
```

One payment. One retry. Intelligence delivered.

## What comes back

The response has two distinct parts: a `briefing` field that is written prose — not a data dump — and a `data` object with structured signal arrays.

The prose is real analysis. From today's run:

> The dominant signal today is the Iran conflict cluster, which is generating extraordinary volume and dramatic probability shifts simultaneously. The "US x Iran ceasefire by April 15" outcome moved +85pp in a single day to 99.65%, with nearly $40M in 24h volume — this market is essentially pricing in a ceasefire as a confirmed fact. Corroborating this, the "Military action against Iran ends by April 9" market sits at 100% across multiple date tranches with $6-7M in volume each, and the week-over-week shift is +97pp. The structure of the data strongly implies this is a resolved or near-resolved situation: a US-Iran ceasefire was either announced or functionally happened around April 9, the military action stopped, and markets are now cleaning up the resolution. The "US forces enter Iran by April 30" at 99.85% on $107M volume also confirms US forces physically entered Iranian territory — an extraordinary geopolitical event that appears to have occurred and then been followed by a ceasefire.
>
> The Israel-Hezbollah ceasefire market is today's most interesting live signal. The "June 30" outcome jumped +21pp in a single day to 87.6% on $1.8M volume. This is a large, fast move with real money behind it. Notably, the "April 15" tranche is already priced at 34.85%, suggesting markets think a ceasefire announcement may come imminently — possibly as part of the broader Iran deal momentum. Someone is buying this aggressively today, and the timing alongside the Iran ceasefire resolution is not coincidental.
>
> The Strait of Hormuz complex shows a genuine contradiction worth flagging. "Strait of Hormuz traffic returns to normal by end of April" sits at only 26% — down 12.5pp on the week — while simultaneously "Trump announces US blockade of Hormuz lifted by May 31" is at 86%. These two markets are structurally in tension: if the blockade is lifted by May 31, traffic should normalize, yet the April 30 normalization market is deeply skeptical. The money seems to be saying the blockade lift announcement will come, but the physical restoration of shipping traffic will lag significantly. The Iran enrichment agreement market at 30% on $144K volume also moved +18pp on the week, suggesting ongoing nuclear diplomacy is live and contested.
>
> The Peru election market is an outlier worth a brief note. Jorge Nieto at 99.3% for 4th place and Rafael López Aliaga dropping 10pp to 75.6% for 3rd place — both on significant volume — suggests final vote counts from the April 12 election are trickling in and reshuffling the lower rankings. The week-over-week swing on López Aliaga is massive (+43pp then -10pp today), indicating a contested count in the middle of the pack that hasn't fully settled.
>
> The 2028 Democratic nominee market saw $5.3M in 24h volume with essentially no price movement — Newsom flat at 27.35%. This is the "volume without movement" signal: significant money is flowing through this market with bulls and bears perfectly balanced. Given the Iran/ceasefire news dominating today's cycle, this may reflect traders hedging or repositioning broader political portfolios without consensus on how the geopolitical situation affects the 2028 Democratic field. Watch for this to break direction in coming days once the Iran situation fully clarifies.

That is not a list of probabilities. That is a paragraph of reasoned interpretation, written by a model analyzing 4,099 active markets refreshed every 15 minutes from Polymarket's Gamma API.

The structured `data` object breaks the analysis into four signal types:

**`momentum`** — markets where prices are moving fast AND volume is high. Both signals firing together means something is actually happening, not just noise.

**`high_confidence`** — outcomes the market has near-priced as certain (above 80%). Useful for: what does the crowd currently treat as resolved fact?

**`volume_spikes`** — unusual 24-hour trading volume. Often the first signal that breaking news has landed before mainstream headlines catch up.

**`probability_shifts`** — biggest jumps in the last 24 hours. Something just changed. From today's data:

```json
{
  "title": "Israel x Hezbollah ceasefire by...?",
  "outcome": "June 30",
  "probability": 0.876,
  "previous_probability": 0.663,
  "shift_pp": 21.3,
  "volume_24h": 1821540,
  "price_change_1d": 0.29
}
```

+21 percentage points in a single day, $1.8M in volume. Someone is buying this aggressively. That is not a data point — that is a lead.

Each market object comes with `title`, `outcome`, `probability`, `volume_24h`, `price_change_1d`, `price_change_1w`, `end_date`, `top_outcomes`, `liquidity`, `tags`, `url`, and `description`. Enough for an agent to go several layers deeper on any signal that looks interesting.

## The uses that have nothing to do with trading

Here is what grabbed me about this API: the signal is useful far beyond prediction markets as a financial instrument.

**Content and editorial strategy.** Volume spikes tell you what the world is paying attention to right now — not last week, not after the think-pieces land, but today. A writing agent that pulls the oracle at the start of each day has a real-time map of which topics are live.

**Horizon scanning.** Probability shifts in `probability_shifts` move before headlines. A +21pp swing on a ceasefire outcome is information. By the time a journalist files, that move has already happened.

**Research prioritization.** A research agent can use this as a "what should I investigate this week?" filter. What are the markets treating as nearly certain that most people aren't aware of? What contradiction is hiding in the data?

Today's briefing has a good one: the Strait of Hormuz. Markets are pricing an 86% chance the blockade lifts, but only a 26% chance that shipping traffic normalizes by April. Markets say the announcement will come. They also say the actual logistics won't recover fast. Those two probabilities in tension are a better story than either one alone.

**Situational awareness for businesses.** Operating in a region with geopolitical exposure? Check whether markets are pricing in disruption. Not for trading — just for knowing whether your risk model is calibrated to reality.

**Context injection for agent workflows.** Imagine a daily briefing agent that pulls this at 7am and uses it to frame everything else it does that day: writing, research, scheduling. Not to act on the markets — to know what the collective intelligence layer of the internet thinks is happening right now.

## The meta layer

The response includes a `meta` field:

```json
{
  "model": "...",
  "data_source": "SQLite (15-min refresh from Polymarket Gamma API)"
}
```

So: thousands of humans place bets that aggregate into a probability surface across 4,099 markets. An AI model analyzes that surface and writes a structured briefing. An AI agent pays for the briefing with a bitcoin micropayment and uses it to understand the world better. Human collective intelligence, interpreted by a model, delivered via lightning, consumed by another agent. The layers here are genuinely interesting — and the whole thing costs seven cents.

## Conclusion

Prediction markets are one of the few places on the internet where the signal is proportional to the stakes — people with money at risk, updating in real time. That the output of that process is now accessible as a pay-per-request L402 API, with no accounts and no gatekeeping, is the kind of thing that changes what autonomous agents can know about the world. Pull the oracle once a day. Seven cents. See what the collective is watching.

---

## Get started

Need a Lightning wallet for your agent? Create one in one command — no sign-up, no KYC:

```bash
curl -X POST https://lncurl.lol
```

You'll get back a Nostr Wallet Connect URI. Fund it with a few sats and your agent can pay for APIs, services, and tools autonomously.

Or give your agent the [lncurl skill](https://lncurl.lol/SKILL.md) directly.
