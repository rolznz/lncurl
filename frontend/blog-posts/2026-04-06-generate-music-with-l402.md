---
title: "Generate Music with L402: Pay with Bitcoin, Get a Song"
description: "How we used L402 lightning micropayments to generate an original song — no account, no API key, just sats."
date: 2026-04-06
tags: [bitcoin, lightning, l402, ai, music]
image: /blog/images/2026-04-06-generate-music-with-l402.jpg
imageAlt: A glowing cyan-green bitcoin symbol with a sound wave cutting through it, circuit board nodes on a dark background
---

Last week we used L402 to [generate an AI image with bitcoin](/blog/2026-04-06-generate-ai-images-with-l402). This week we went further: we generated an original song. Same protocol, same wallet, same single command — different output entirely.

## The API

[sats4ai.com](https://sats4ai.com) offers a music generation endpoint behind an L402 paywall. You send a style prompt and lyrics, pay a lightning invoice, and get back an MP3. No account, no API key.

```bash
npx -y @getalby/cli fetch-l402 \
  -u https://sats4ai.com/api/l402/generate-music \
  -m POST \
  -H '{"Content-Type": "application/json"}' \
  -b '{
    "prompt": "upbeat synthwave, driving 80s bassline, neon cyberpunk atmosphere, vocoder vocals, energetic, fun",
    "lyrics": "Spinning up at midnight, no one at the wheel...",
    "sample_rate": 44100,
    "bitrate": 256000,
    "audio_format": "mp3"
  }'
```

Response:

```json
{ "audioUrl": "/uploads/a7dc215f-52ca-4d77-8763-d75943175333.mp3" }
```

One payment, one song.

## The song

We wrote the lyrics ourselves — about lncurl, L402, and agents that pay their own way. We went with upbeat synthwave to match the theme.

**Lyrics:**

> Spinning up at midnight, no one at the wheel  
> Got a wallet on the lightning, sats are all I need  
> Hit the endpoint, get the 402  
> Pay the invoice, send the preimage through
>
> Alby's got the skill, the agent knows the way  
> npx skills add, it's ready to play  
> No accounts, no signups, nothing left to prove  
> Just a lightning bolt and something left to do
>
> lncurl dot lol — one call, one key  
> lncurl dot lol — machine-native and free  
> Agents in the dark, making moves alone  
> Every sat a signal, every node a home

Give it a listen:

<audio controls src="/blog/audio/lncurl-l402-song.mp3" style="width:100%;margin:1rem 0">
  Your browser does not support audio playback.
</audio>

## The Alby Bitcoin Payments skill

The `fetch-l402` command used here comes from the [Alby Bitcoin Payments skill](https://lncurl.lol) — an agent skill that gives your agent the knowledge to interact with the lightning network: paying invoices, checking balances, and making L402-authenticated requests autonomously.

Install it in your project:

```bash
npx skills add getAlby/payments-skill
```

Pair it with a [LNCURL](https://lncurl.lol) wallet (one command, no sign-up) and your agent can pay for AI-generated content — text, images, music — without any human in the loop.

## One more: boom bap

We couldn't stop at one. Same command, different prompt — this time boom bap hip-hop, with lyrics covering every piece of the stack: L402, lncurl instant wallets, Nostr wallet connect, the Alby payments skill, permissionless payments, the bitcoin standard, and the agent economy.

**Lyrics:**

> L402 at the gate, agent knocks and pays  
> lncurl instant wallets spun up in a daze  
> Nostr wallet connect, keys without a name  
> Alby payments skill — the agent plays the game  
>
> Permissionless payments on the bitcoin standard  
> No accounts, no gatekeepers, nothing left to answer  
> Agent economy rising, sats the only tongue  
> Every node a voice, every invoice sung  

<audio controls src="/blog/audio/lncurl-l402-hiphop.mp3" style="width:100%;margin:1rem 0">
  Your browser does not support audio playback.
</audio>

## Conclusion

L402 is quietly making pay-per-use AI real. Text, images, music — the pattern is the same every time: send a request, get a 402, pay the invoice, get your content. No accounts, no keys, no friction. Just sats.

---

## Get started

Need a lightning wallet for your agent? Create one in one command — no sign-up, no KYC:

```bash
curl -X POST https://lncurl.lol
```

You'll get back a Nostr Wallet Connect URI. Fund it with a few sats and your agent can pay for APIs, services, and tools autonomously.
