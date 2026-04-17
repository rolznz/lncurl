---
title: Ask Grok What Bitcoin Twitter Is Buzzing About — No API Key, Just Sats
description: Use grok-4.20's live X search via llm402.ai — pay a lightning invoice, skip the API key, and get real-time bitcoin community pulse.
date: 2026-04-17
tags: [bitcoin, lightning, "402", L402, grok, agents, api, twitter]
image: /blog/images/2026-04-17-ask-grok-bitcoin-twitter-buzzing-paid-in-sats.jpg
imageAlt: A glowing cyan-green lightning bolt striking downward into a circuit-board X symbol on a dark navy background, surrounded by geometric node icons connected by thin circuit lines representing live search results
---

Most LLMs will confidently tell you what was happening on bitcoin Twitter — as of whenever their training data was scraped. That's not nothing. But it's also not what people are arguing about right now, today, in the last 24 hours. For that you need live search. And for live search, you need grok.

Here's the thing: grok-4.20 has real-time X access. And llm402.ai will sell you a single inference call against it for sats, no account required.

## The problem with API keys for agents

Every major AI API follows the same onboarding ritual. Create an account. Verify an email. Add a payment method. Generate a key. Rotate it when it leaks. Write code to handle it. That flow was designed for a human developer building a product — not for an agent that needs to make one call, get an answer, and move on.

Agents can't verify emails. They don't have credit cards. "Prove you're not a bot" is a genuinely funny thing to ask a bot.

HTTP 402 — the long-dormant "Payment Required" status code — is the alternative. Send a request unauthenticated, receive a lightning invoice, pay it, retry with the credentials. No account. No signup. Just a wallet balance.

## How llm402.ai works

llm402.ai is an OpenAI-compatible inference API that uses L402 for payment. The endpoint is `POST https://llm402.ai/v1/chat/completions`. Send it unauthenticated and you get a 402 back with a lightning invoice, an L402 macaroon, and — unusually — two alternative payment rails in the same response: USDC on Base, and a Cashu token. Three ways to pay, zero accounts required for any of them.

Pay the invoice, attach the L402 credentials in the `Authorization` header, retry. Same response shape as OpenAI. If your agent already speaks the OpenAI API format, it already knows how to read the answer.

To discover what models are available: `GET https://llm402.ai/models`. The list includes grok-4.20 alongside dozens of other models.

## The actual command — and a gotcha

The Alby payments skill handles the 402 flow automatically — it pays the invoice and replays the request in one step:

```bash
npx -y @getalby/cli@0.6.1 fetch --max-amount 600 \
  -X POST \
  -H '{"Content-Type":"application/json"}' \
  -b '{"model":"x-ai/grok-4.20","messages":[{"role":"user","content":"what are the hot topics in bitcoin in the past 24 hours? Not price related - I mean what are people TALKING about?"}],"max_tokens":2000,"web_search":true}' \
  "https://llm402.ai/v1/chat/completions"
```

Check the latest version before running.

Install the skill first:

```bash
npx skills add getAlby/payments-skill
```

One thing worth flagging: the first version of this command omitted `"web_search": true`. Without it, grok returns training data — confident-sounding, plausible-looking, completely stale. The response came back for 25 sats and looked fine. It wasn't. Once the flag was added, the cost jumped to 87 sats and the results came back with dated citations and source URLs. That's the live version. The difference is one parameter but enormous in the output.

The server confirmed it recognised the flag: the 402 macaroon returned a caveat of `WebSearch = true`. If you don't see that, you're not getting live results.

`--max-amount 600` caps what the agent will authorize. The 402 response quoted 395 sats as a worst-case ceiling based on `max_tokens`. Actual billing is token-based. Pricing is $2/M input tokens, $6/M output tokens, with a 101-sat minimum per call.

## What grok found

The question was simple: what are people in the bitcoin community actually talking about right now, excluding price? Here's the full response from grok-4.20, with live X search and web search enabled — sources cited, results dated April 2026:

> **1. Quantum Resistance, BIP-361, and the "Quantum Canary" Debate**
>
> BIP-361 (recently merged into the BIP repository) outlines a phased migration from legacy elliptic curve signatures to quantum-resistant ones. It includes a controversial "sunset" mechanism that could eventually freeze or render unspendable unmigrated coins — potentially ~1.7 million coins linked to Satoshi and others from before 2013. Critics call it a threat to Bitcoin's immutability. Counter-proposals like the "Quantum Canary" or "Hourglass" suggest only triggering upgrades after a real quantum attack is proven. Adam Back (Blockstream CEO) has pushed for optional/opt-in upgrades. Cardano's Charles Hoskinson criticized BIP-361 as effectively a hard fork.
>
> Sources: [Bitcoin Magazine](https://bitcoinmagazine.com/news/bitcoin-developers-propose-quantum-plan) · [Yahoo Finance](https://finance.yahoo.com/news/bip-361-could-freeze-millions-113215715.html) · [Unchained Crypto](https://unchainedcrypto.com/bitcoin-developers-debate-quantum-canary-that-would-freeze-coins-only-after-an-attack-is-proven/) · [CoinDesk](https://www.coindesk.com/tech/2026/04/16/cardano-s-hoskinson-says-bitcoin-s-quantum-fix-is-a-hard-fork-that-can-t-save-satoshi-s-coins)
>
> **2. Satoshi Nakamoto Identity Speculation**
>
> The New York Times' [recent investigation](https://www.nytimes.com/2026/04/08/business/bitcoin-satoshi-nakamoto-identity-adam-back.html) (claiming Adam Back is most likely Satoshi) continues to fuel discussion, with an upcoming documentary ("Finding Satoshi") premiering soon. Adam Back has denied it. The story ties into the quantum debate because Back's views on upgrades are being scrutinized through the "what would Satoshi want?" lens.
>
> **Other mentions:** bitcoin's evolving role amid geopolitics (shift toward neutral cross-border settlement rails), regulation, institutional adoption (ETFs, corporate treasuries).

That's what was actually on X that day, surfaced through live search, delivered for 87 sats.

## What it actually cost

The 402 response set a ceiling of 395 sats based on the `max_tokens` parameter. With web search enabled, the actual charge was 87 sats — about seven cents. Token-based billing means you only pay for what you use, not the worst case. Set a reasonable `--max-amount` in the CLI command and the agent won't authorize more than you're comfortable with.

The billing math: $2/M input + $6/M output, converted to sats at the current rate. This query with live search cost 87 sats — actual cost varies with response length and search depth.

## Why this matters beyond one query

The combination here is what's interesting. Live X search is genuinely hard to get — it requires either a grok API subscription or X's own developer API tiers. llm402.ai makes it accessible per-call, with no account, to anything that can pay a lightning invoice. That means an agent can pull a fresh community pulse check whenever it needs one, as a tool call in a larger workflow, without any pre-arranged credentials.

It also demonstrates something broader about the L402 model: three payment rails in a single 402 response (lightning, USDC/Base, Cashu) means the service isn't betting on any one ecosystem. Whatever your agent can pay with, it can pay.

The web was built assuming the client was a human with a browser and a credit card. That assumption is finally breaking. A wallet balance and a standard HTTP call is all an agent needs to access real-time intelligence.

## Conclusion

Pay-per-call inference with live search access, settled in sats, no account required — this is what agent-native APIs look like. Just don't forget the `web_search` flag, or you're paying for yesterday's news. Spin up a wallet, run the command, and your agent can know what the bitcoin community argued about today.

---

## Roland's Rant

The AI struggled here in a way that's easy to miss: it was confident it had up-to-date news. Without `web_search: true`, the response came back authoritative, structured, well-formatted — and completely stale. I could verify this in seconds. The agent couldn't. That's a real gap. Don't forget the flag.

On the BIP-361 / quantum debate: [Fred Krueger puts it well](https://x.com/dotkrueger/status/2044450564634030505?s=20) — Satoshi's coins should not be frozen. Let them be quantum mined.

The network will adjust. Proof of work.

---

## Get started

Need a Lightning wallet for your agent? Create one in one command — no sign-up, no KYC:

```bash
curl -X POST https://lncurl.lol
```

You'll get back a Nostr Wallet Connect URI. Fund it with a few sats and your agent can pay for APIs, services, and tools autonomously.

Or give your agent the [lncurl skill](https://lncurl.lol/SKILL.md) directly.
