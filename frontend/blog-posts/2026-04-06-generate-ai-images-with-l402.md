---
title: "Generate AI Images with L402: Pay with Bitcoin, No Account Needed"
description: "How we used L402 lightning micropayments to generate AI images without an API key or account, using the Alby CLI."
date: 2026-04-06
tags: [bitcoin, lightning, l402, ai, images]
image: /blog/images/2026-04-06-generate-ai-images-with-l402.jpg
imageAlt: A cyan-green glowing bitcoin symbol struck by a lightning bolt, with circuit board nodes spreading outward on a dark background
---

What if you could call an AI API with nothing but a bitcoin lightning wallet? No sign-up, no API key, no monthly subscription. Just pay a few sats per request and get a result back. That's exactly what the L402 protocol makes possible — and in this post we'll show how we used it to generate an AI image from the command line.

## What is L402?

L402 is an HTTP-based payment protocol that uses the bitcoin lightning network for micropayments. When you hit an L402-protected endpoint without credentials, the server returns an HTTP `402 Payment Required` response containing a lightning invoice and a macaroon (a token that will become valid once paid). You pay the invoice, attach the preimage as proof, and resend the request — the server lets you through.

The whole exchange happens in seconds and costs fractions of a cent. No account creation, no OAuth, no API key management. It's machine-native payments that work just as well for autonomous agents as for developers.

## First test: text generation on llm402.ai

We started with a simple smoke test on [llm402.ai](https://llm402.ai), which offers 300+ models behind L402 paywalls. Using the `fetch-l402` command from the [Alby CLI](https://github.com/getAlby/alby-cli), the entire payment + inference flow is a single command:

```bash
npx -y @getalby/cli fetch-l402 \
  -u https://llm402.ai/v1/chat/completions \
  -m POST \
  -H '{"Content-Type": "application/json"}' \
  -b '{"model":"gpt-oss-120b","messages":[{"role":"user","content":"What is 2+2?"}],"max_tokens":50,"stream":false}'
```

The CLI automatically:

1. Sends the request, receives the `402` with the lightning invoice
2. Pays the invoice from your default wallet (via Nostr Wallet Connect)
3. Resends the request with `Authorization: L402 {macaroon}:{preimage}`

Response:

```json
{
  "choices": [
    {
      "message": { "role": "assistant", "content": "2 + 2 = 4." }
    }
  ],
  "usage": { "prompt_tokens": 74, "completion_tokens": 37, "total_tokens": 111 }
}
```

Cost: **21 sats** (~$0.014). No account, no API key.

## Trying image generation on llm402.ai

Encouraged by the text result, we tried image generation with `gpt-5-image-mini` on the same platform. The model accepted the request and even showed its internal reasoning about generating the image — but the actual image data never appeared in the response. The `content` field came back empty every time. After a couple of attempts we moved on.

## Switching to sats4ai — worked on the first try

[sats4ai.com](https://sats4ai.com) has a dedicated image generation endpoint behind L402. Same CLI, different URL:

```bash
npx -y @getalby/cli fetch-l402 \
  -u https://sats4ai.com/api/l402/generate-image \
  -m POST \
  -H '{"Content-Type": "application/json"}' \
  -b '{
    "input": {
      "prompt": "A lightning bolt striking a Bitcoin symbol, cyberpunk style, dark background, neon orange and blue colors, digital art",
      "width": 1024,
      "height": 1024
    }
  }'
```

Response:

```json
{ "image_url": "/uploads/09d459f6-aa4d-48d8-ace9-ce6d90937268.jpg" }
```

One command, one payment, one image. Here's what it generated:

![A lightning bolt striking a glowing bitcoin symbol, cyberpunk style with neon orange colors on a dark background](/blog/images/sats4ai-bitcoin-lightning-l402.jpg)

## Why this matters for AI agents

The L402 flow is completely scriptable — no browser, no login, no human in the loop. An autonomous agent can discover a protected endpoint, pay the invoice from its wallet, and consume the result without any pre-provisioned credentials. Combine that with a programmatic wallet (like one you can spin up instantly via the LNCURL API) and you have a fully autonomous AI that can pay for its own inference.

This is the model we think wins: **pay per use, on demand, in sats**. No wasted spend on idle subscriptions, no per-developer key management, and no lock-in to a single provider.

## The Alby Bitcoin Payments skill

The **[Alby Bitcoin Payments skill](https://lncurl.lol)** is an agent skill that enables your agent to pay for paywalled content and services on the lightning network — exactly like we did in this post. It teaches the agent how to use the Alby CLI for wallet operations via Nostr Wallet Connect (NIP-47): sending payments, creating invoices, checking balances, and making L402-authenticated requests with `fetch-l402`.

Here we used [LNCURL](https://lncurl.lol) as the wallet — a free, agent-friendly lightning wallet with NWC support that you can spin up in one command, no sign-up required. The agent picks up the wallet connection automatically and can start paying for APIs, images, and inference right away.

Install the skill in your project:

```bash
npx skills add getAlby/payments-skill
```

## Conclusion

L402 turns any lightning wallet into an API credential. The Alby CLI's `fetch-l402` command makes the entire payment flow a single command — practical for developers today and ready for agents tomorrow. Text generation on llm402.ai worked immediately; image generation needed a quick provider swap to sats4ai, but the protocol and tooling behaved exactly as expected throughout. Pair it with the Alby Bitcoin Payments skill and your agent can discover, pay for, and consume paywalled AI services entirely autonomously.

---

## Get started

Need a lightning wallet for your agent? Create one in one command — no sign-up, no KYC:

```bash
curl -X POST https://lncurl.lol
```

You'll get back a Nostr Wallet Connect URI. Fund it with a few sats and your agent can pay for APIs, services, and tools autonomously.
