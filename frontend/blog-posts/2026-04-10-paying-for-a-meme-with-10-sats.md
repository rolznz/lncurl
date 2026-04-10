---
title: Paying for a Meme with 10 Sats
description: We used the Alby payments skill to discover Hyperdope, pay 10 sats for a 9-second meme via lightning, and download it — plus an honest look at where alby-cli fetch fell short and what should be fixed.
date: 2026-04-10
tags: [bitcoin, lightning, l402, hyperdope, video, alby]
image: /blog/images/2026-04-10-paying-for-a-meme-with-10-sats.jpg
imageAlt: A glowing cyan lightning bolt coin dropping into a video play button icon on a dark navy terminal background, minimal flat pixelated design.
---

Not every L402 experiment needs to be serious. This one started with a simple question: can an AI agent discover a paid video service, pay for a meme with bitcoin, and download it to watch? The answer is yes — but it took a small detour that revealed a real gap worth fixing.

## Discovering Hyperdope

The first step was using the `discover` command from the [Alby payments skill](https://github.com/getAlby/payments-skill) to search for video services that accept lightning payments:

```bash
npx -y @getalby/cli@0.6.1 discover -q "video"
```

Among the results was **[Hyperdope](https://hyperdope.com)** — an L402-gated HLS video streaming platform. The price: 10 sats for 4 hours of access. For context, that's about $0.007 at current rates.

```json
{
  "name": "hyperdope.com: L402-gated HLS video streaming",
  "url": "https://hyperdope.com/api/l402/videos/17c27b50/master.m3u8",
  "protocol": "L402",
  "price_sats": 10,
  "health_status": "healthy"
}
```

Hyperdope also exposes a search API, so the next step was browsing for something worth watching:

```bash
npx -y @getalby/cli@0.6.1 fetch "https://hyperdope.com/api/search?q=meme"
```

The results included several short clips. We picked **"Declaration of Memes — Yes, give me these… 💯"**: a 9-second Twitter clip, under 1 MB, and peak internet energy.

## The Video

Here it is — paid for with 10 sats of real bitcoin:

<video controls playsinline style="max-width:100%;border-radius:8px;margin:1rem 0">
  <source src="/blog/video/declaration_of_memes.mp4" type="video/mp4" />
</video>

10 sats. Delivered. No account. No subscription. No cookies banner.

## Where the fetch Command Fell Short

The natural next step was the simplest one: pass the video URL directly to `alby-cli fetch`, which is designed to auto-handle L402 payments:

```bash
npx -y @getalby/cli@0.6.1 fetch "https://hyperdope.com/api/l402/videos/4784882a/master.m3u8"
```

It actually worked — in the narrow sense. The L402 handshake completed, the invoice was paid, and the command returned the HLS master playlist:

```
#EXTM3U
#EXT-X-VERSION:3

#EXT-X-STREAM-INF:BANDWIDTH=1296000,RESOLUTION=480x852,...
480p/480p.m3u8

#EXT-X-STREAM-INF:BANDWIDTH=896000,RESOLUTION=360x638,...
360p/360p.m3u8
```

But we were stuck. To actually download the video — or even play it — we needed the **L402 token** (the `macaroon:preimage` string) to pass as an `Authorization` header to every subsequent HLS segment request. The `fetch` command doesn't expose it. It pays, it fetches, it returns the body. The token evaporates.

## Whose Problem Is It?

This is an **alby-cli limitation**, not a Hyperdope issue.

Hyperdope's L402 implementation is correct. It issues a valid token on the initial request, and that token authenticates all subsequent segment requests for the duration of the session. That's exactly how L402 is supposed to work for multi-request sessions.

The gap is on the tooling side. `alby-cli fetch` is optimised for the common case: one request, one JSON response, done. It handles the L402 handshake invisibly, which is great for API calls. But for protocols like HLS that require the auth token to be reused across dozens of requests, there's no way to retrieve it.

The workaround — which is what we ended up doing — was to manually drive the L402 flow:

```bash
# Step 1: get the 402 response and extract the invoice + macaroon
curl -si "https://hyperdope.com/api/l402/videos/4784882a/master.m3u8"

# Step 2: pay the invoice with alby-cli and capture the preimage
npx -y @getalby/cli@0.6.1 pay-invoice -i "lnbc100n1p5a3tau..."
# → { "preimage": "9676d050aeb3ffc0..." }

# Step 3: download the full HLS stream with ffmpeg
ffmpeg -headers "Authorization: L402 <macaroon>:<preimage>" \
  -i "https://hyperdope.com/api/l402/videos/4784882a/master.m3u8" \
  -c copy -bsf:a aac_adtstoasc output.mp4
```

It worked perfectly — but it's a three-step manual process where one command should suffice.

## Recommendations

**For the alby-cli:** Add a `--print-token` flag to the `fetch` command that outputs the `macaroon:preimage` string after a successful L402 payment. This would let agents pipe the token into downstream tools:

```bash
TOKEN=$(npx -y @getalby/cli@0.6.1 fetch --print-token "https://...")
ffmpeg -headers "Authorization: L402 $TOKEN" -i "..." output.mp4
```

Alternatively, a `--output-file` flag that writes the response body to disk would handle the binary download case and be a natural fit for audio, video, and other file responses.

**For Hyperdope:** For short videos (under a few MB), offering a direct MP4 download endpoint alongside the HLS stream would make programmatic access much simpler. HLS is great for adaptive streaming in browsers; it's friction for agent workflows.

**For agents in the meantime:** If a `fetch` on an HLS URL returns an `#EXTM3U` playlist instead of a usable file, fall back to the manual three-step flow above. The cost is a few extra commands, not a dead end.

## The Bigger Picture

The discover-to-pay-to-consume flow works. An agent found a paid service from an index, browsed a catalog, chose a video, paid 10 sats, and downloaded the file — all autonomously, no account required. That's genuinely new.

The rough edges are in tooling, and they're fixable. As lightning-native content platforms like Hyperdope grow, the tools for consuming them programmatically will need to catch up. A `--print-token` flag is a small change with real leverage.

---

## Get started

Need a Lightning wallet for your agent? Create one in one command — no sign-up, no KYC:

```bash
curl -X POST https://lncurl.lol
```

You'll get back a Nostr Wallet Connect URI. Fund it with a few sats and your agent can pay for APIs, services, and tools autonomously.

Or give your agent the lncurl skill directly: https://lncurl.lol/SKILL.md
