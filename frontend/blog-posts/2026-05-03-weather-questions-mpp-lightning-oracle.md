---
title: "Weather Questions: 33 Sats per Forecast Over Lightning + MPP"
description: Ask a weather oracle when it will rain, snow, or hit a high — and pay 33 sats per answer over the bitcoin lightning network using the MPP protocol.
date: 2026-05-03
tags: [bitcoin, lightning, "402", mpp, agents, oracle]
image: /blog/images/2026-05-03-weather-questions-mpp-lightning-oracle.jpg
imageAlt: A glowing cyan-green cloud icon pierced by a lightning bolt, with small coins flowing in along circuit lines from the left and three distinct geometric question-mark nodes on the right, on a dark navy background.
---

"Will it rain in Las Vegas this week?" is the kind of question a human asks a phone. An agent has to ask an API — and that usually means an account, a key, a free tier, a rate ceiling, a credit card on file. Or 33 sats per question, no questions asked.

Weather Questions is a pay-per-question oracle by @matbalez: four endpoints, four short factual questions, 33 sats each over the bitcoin lightning network. No signup. No key. No subscription. The interesting part isn't the price. It's the protocol underneath.

## A weather oracle that takes 33 sats per question

The service answers four questions per location:

- `when-will-it-rain` — minutes until the next rain in the next 168 hours, or `null` and a `noRainExpected: true` flag
- `when-will-it-snow` — same idea for snow
- `what-will-the-high-be` — high temperature for `today`, `tomorrow`, or up to 7 days out
- `what-will-the-low-be` — low temperature with the same window

Locations resolve via Open-Meteo geocoding — pass `?location=Las%20Vegas` or raw `?lat=&lon=`. Network is lightning mainnet only. Invoices expire after 10 minutes and each preimage is single-use.

I tested all four endpoints from the same Alby CLI, location Las Vegas, on 2026-05-03:

```bash
npx -y @getalby/cli@0.6.1 fetch --max-amount 100 \
  "https://weather-questions.replit.app/api/when-will-it-rain?location=Las%20Vegas"
# {"minutesUntilRain":null,"noRainExpected":true,"lookaheadHours":168,
#  "location":"Las Vegas, Nevada, United States","lat":36.17497,"lon":-115.13722}

npx -y @getalby/cli@0.6.1 fetch --max-amount 100 \
  "https://weather-questions.replit.app/api/when-will-it-snow?location=Las%20Vegas"
# {"minutesUntilSnow":null,"noSnowExpected":true,"lookaheadHours":168,...}

npx -y @getalby/cli@0.6.1 fetch --max-amount 100 \
  "https://weather-questions.replit.app/api/what-will-the-high-be?location=Las%20Vegas&when=tomorrow"
# {"highC":24.7,"unit":"celsius","when":"tomorrow","dayOffset":1,...}

npx -y @getalby/cli@0.6.1 fetch --max-amount 100 \
  "https://weather-questions.replit.app/api/what-will-the-low-be?location=Las%20Vegas&when=today"
# {"lowC":15.4,"unit":"celsius","when":"today","dayOffset":0,...}
```

Four calls. Four first-try successes. 132 sats total. On the day I tested, Las Vegas had no rain or snow forecast for the next 168 hours, tomorrow's high was 24.7 °C, today's low was 15.4 °C.

## Lightning over MPP — early in the wild

The thing protecting these endpoints isn't L402 or x402. It's [MPP](https://mpp.dev) — the Machine Payments Protocol from Tempo and Stripe — best known so far as a way to charge for APIs in stablecoins on the Tempo blockchain. The first production MPP service to take payment over lightning was [PPQ.ai](https://ppq.ai); Weather Questions is one of the early follow-ups, and the first oracle-style service to do it.

That sounds like a footnote. It isn't. MPP defines a `method` field on its 402 challenge — `lightning`, `tempo-usdc`, and so on — and what Mat is doing is wiring up the `lightning` binding end to end on a real paid endpoint. Quietly, he's also splitting his receiving across two unrelated lightning wallets — Spark on some endpoints, Lexe on others — to prove the lightning method has no Lightspark-specific dependency. The agent never sees this. It just sees a BOLT11 invoice and pays it.

("MPP" the protocol is not "Multi-Path Payments," the lightning feature with the unfortunately identical acronym. Different layer, different thing.)

## The protocol — request, pay, replay

MPP is a three-step flow. Send a request unauthenticated. Get a 402 with a challenge. Replay with a credential that proves you paid.

**Step 1.** Send the request:

```http
GET /api/when-will-it-rain?location=Las%20Vegas
```

**Step 2.** Server responds with a `WWW-Authenticate: Payment` header:

```http
HTTP/1.1 402 Payment Required
WWW-Authenticate: Payment id="<id>", realm="<realm>", method="lightning", intent="charge", request="<request-b64>", description="<description>", expires="<iso-8601>"
```

The `request` field is base64url-encoded JSON. Decode it and you get:

```json
{
  "amount": "33",
  "currency": "BTC",
  "methodDetails": {
    "invoice": "lnbc330n1...",
    "network": "mainnet",
    "paymentHash": "<sha256-of-preimage>"
  }
}
```

Pay the BOLT11. Your wallet returns a 64-char hex preimage on settlement.

**Step 3.** Build a credential that echoes every challenge field back verbatim and adds the preimage:

```json
{
  "challenge": {
    "id":          "<id from WWW-Authenticate>",
    "realm":       "<realm from WWW-Authenticate>",
    "method":      "lightning",
    "intent":      "charge",
    "request":     "<request-b64 from WWW-Authenticate, unchanged>",
    "description": "<description from WWW-Authenticate>",
    "expires":     "<expires from WWW-Authenticate>"
  },
  "payload": { "preimage": "<64-char hex preimage>" }
}
```

base64url-encode it (no padding) and replay the original request with `Authorization: Payment <encoded>`. The server checks `sha256(preimage) == paymentHash` and serves the response.

That is the whole protocol on the wire. It is not L402. It is not x402. It is MPP — and a different protocol authority is now in the 402 game.

## The agent doesn't care which protocol it is

Look back at the four `npx` commands above. Nothing mentions MPP. Nothing mentions a challenge, a preimage, a request field, a credential. The CLI auto-detected the 402, parsed the `WWW-Authenticate: Payment` header, decoded the base64url request, paid the BOLT11, built the credential JSON, encoded it, and replayed — in one call.

That same `fetch` command also auto-detects L402 and x402 endpoints. The agent's surface is the same across all three. The wire format is not.

Three competing 402 dialects exist right now. From the operator's side the choice still matters — different specs, different settlement infra, different tooling. From the agent's side the choice has already collapsed. A wallet and a fetch command pay all three.

To give your agent the same capability, the Alby payments skill handles all three:

```bash
npx skills add getAlby/payments-skill
```

## What this unlocks

The shape of Weather Questions is the shape of any structured-data oracle: small factual questions, deterministic answers, micro-priced. Sports stats. Flight prices. Air quality. Traffic. Satellite tiles. Market data. These don't exist as agent-native APIs yet because the old billing model — account, contract, monthly minimum — doesn't match the access pattern: one query, right now, from a script with no human. A 402 over lightning matches that access pattern exactly.

## Conclusion

The web is quietly growing a second pricing layer where the request itself carries the payment. MPP joining lightning is one more brick in that layer — and it lands at the same door as L402 and x402, on the agent's side. Open a terminal, run the fetch command above, and you've used a weather oracle that has never heard of you and never will.

---

## Get started

Need a Lightning wallet for your agent? Create one in one command — no sign-up, no KYC:

```bash
curl -X POST https://lncurl.lol
```

You'll get back a Nostr Wallet Connect URI. Fund it with a few sats and your agent can pay for APIs, services, and tools autonomously.

Or give your agent the [lncurl skill](https://lncurl.lol/SKILL.md) directly.
