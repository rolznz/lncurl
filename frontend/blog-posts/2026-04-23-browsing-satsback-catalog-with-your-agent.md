---
title: Browsing the Satsback Catalog With Your Agent — Affiliate Cashback, Paid in Bitcoin
description: Register an AI agent with satsback.com over L402 + Nostr and point it at an affiliate catalog 1,580 stores deep (in Thailand alone) that pays cashback in bitcoin on lightning.
date: 2026-04-23
tags: [bitcoin, lightning, l402, agents, affiliate]
image: /blog/images/2026-04-23-browsing-satsback-catalog-with-your-agent.jpg
imageAlt: A glowing cyan-green agent node on the left wired to a grid of small merchant-glyph tiles on the right, with a lightning bolt pipeline arcing back to the agent carrying coin dots, on a dark navy background.
---

Every affiliate program on the open web wants the same things before it pays you a cent: a signup form, a dashboard login, a tax form, a bank account, a thirty-day hold, a fifty-dollar minimum payout. Your agent can't do any of that — and that's before it hits the captcha.

That's the old model. Here's what the new one looks like: a signed Nostr event, 21 sats, a Bearer token. Your agent is in.

## The handshake, start to finish

satsback.com publishes an `agents.json` at the well-known path. No auth, no browser, just a description of how machines are supposed to talk to it:

```bash
curl https://satsback.com/.well-known/agents.json
```

It tells you three things that matter: an L402 registration endpoint at `/api/v2/l402/register`, a Nostr event kind (`27236`) for agent identity, and a REST surface under `/api/v2/agent/*` for everything else. Agent identity is a secp256k1 pubkey. The lightning address where cashback lands is carried as a signed tag on the registration event.

That's the whole identity model. No email. No password. No "verify you're a human."

## Registration: 21 sats to open the door

Build a kind-27236 event, sign it, and POST it:

```json
{
  "kind": 27236,
  "created_at": 1776956959,
  "content": "register",
  "tags": [
    ["country", "TH"],
    ["lightning_address", "lncurl_sinking_ash@getalby.com"]
  ],
  "pubkey": "c8f5d76a4930c0...",
  "sig": "8ff07faebeae..."
}
```

The server responds `HTTP 402` with an L402 challenge in the `WWW-Authenticate` header:

```
WWW-Authenticate: L402 macaroon="MDAx...", invoice="lnbc210n1p575dnq..."
```

Amount: **21 sats**. That's not a paywall — it's an anti-spam cost. It's roughly a cent. It exists so bots can't mint a million identities in a shell loop, and that's it. Pay it once, and you have a Bearer token tied to your lightning address.

I let the Alby CLI handle the L402 dance — it pays the invoice, re-POSTs the event with `Authorization: L402 <macaroon>:<preimage>`, and you get the Bearer token back:

```json
{
  "success": true,
  "token": "nI8BCtYqDeWUuJUr0e4Fw1KtRr2YfmqtDtEfe8Vg",
  "user_id": "end3q8Q",
  "quickstart": "Include 'Authorization: Bearer <token>' on ALL subsequent requests..."
}
```

Wallet balance before: 459,851 sats. After: 459,830 sats. That is the entire onboarding cost.

## What's actually in the catalog

With the Bearer token, hit the country-scoped stores endpoint:

```bash
curl -H "Authorization: Bearer $TOKEN" \
  https://satsback.com/api/v2/agent/stores/thailand
```

**1,580 stores** come back — a 2.2 MB JSON array. Each entry has the same rough shape:

```json
{
  "name": "Booking.com",
  "slug": "booking-com",
  "url": "booking.com",
  "store_id": "WZjWp5Q",
  "cashback_type": "percent",
  "text": "Satsback up to 1.7%",
  "commission_percent": 1.7,
  "description": "..."
}
```

This is where the agent can actually browse. Not a hand-curated list of five "partner" merchants — 1,580 real stores across consumer, SaaS, travel, and long-tail e-commerce. A selection, with the kind of thing an agent might be buying on behalf of its user:

| Store              | Category    | Cashback |
| ------------------ | ----------- | -------- |
| NordVPN            | privacy     | 20%      |
| Hostinger          | hosting     | 16.8%    |
| Proton / ProtonVPN | privacy     | 16%      |
| ExpressVPN         | privacy     | 14%      |
| 1Password          | credentials | 7%       |
| Shopee TH          | marketplace | 5.5%     |
| AliExpress         | marketplace | 2.7%     |
| Booking.com        | travel      | 1.7%     |
| Nike               | apparel     | 1.5%     |
| eBay US            | marketplace | 1%       |

And at the top end, developer tooling is where the rates get serious — **Liquid Web** pays out up to **70%** and **Nexcess** up to **56%** on managed hosting. If your agent is provisioning infrastructure for its user, that's a meaningful slice of the bill coming back as sats.

The bitcoin-adjacent stuff is well represented: Proton, NordVPN, ExpressVPN, Hostinger — the merchants that already take bitcoin in a lot of cases, now paying the agent for sending the user their way.

## Turning a store into an attributed link

Once the agent has picked a merchant, it calls `/visit`:

```bash
curl -H "Authorization: Bearer $TOKEN" \
  https://satsback.com/api/v2/agent/store/booking-com/visit
```

```json
{
  "store_id": "WZjWp5Q",
  "store_name": "Booking.com",
  "click_id": "QyR5rMn",
  "redirect_url": "https://satsback.com/api/v2/store/redirect/QyR5rMn",
  "tracking_tips": [
    "Prefer using the same HTTP client/session for the redirect and checkout so the affiliate cookie is still present at order time.",
    "Call /visit again for every new order — do not reuse a click_id across purchases.",
    "Go directly from the redirect to checkout. Visiting coupon or comparison sites in between can overwrite attribution (last-click-wins).",
    "Preserve cookies and the redirect chain; do not strip them in your HTTP client.",
    "Complete the purchase soon after the click...",
    "For discount_code stores: still follow redirect_url AND apply cashback_code at checkout."
  ]
}
```

The agent takes that `redirect_url` to whatever it was already going to do — hand it to its browser runtime, pass it to the user, plug it into a shopping flow. The tracking tips are right there in the response: same HTTP client for redirect and checkout, one `click_id` per order, no coupon-site detours in between. If the agent respects those, attribution holds and cashback lands on the lightning address it registered with.

## The rough edges

None of this was entirely frictionless. Worth naming:

- **Nostr signing isn't in the Alby CLI.** You need `nostr-tools` to schnorr-sign the kind-27236 event. Fine for developers, friction for pure shell-agent setups.
- **The `notifications` tag is a trap.** Add `["notifications","true"]` without first publishing NIP-17 inbox relays for your pubkey and `/register` returns a 400 before it ever issues the invoice.
- **Events are replay-protected.** POST once manually to see the 402 shape, then retry with the same event through a payment helper, and you get `400 Event already used`. Re-sign every attempt.
- **`/register` rate limit is 3 per minute.** Easy to trip while debugging.

## Why this is a big deal

Affiliate is one of the oldest revenue models on the web and it has, until now, been built entirely around humans. Email signup. W-9. Dashboard login. Thirty-day hold. Fifty-dollar minimum payout. Every step of that stack assumes a person on the other end.

satsback collapses the whole thing into a signed event, a 21-sat anti-spam cost, and a REST endpoint that mints attributed redirects on demand against over a thousand real stores per country. The agent that helps a user shop can now surface a bitcoin income on the transaction — without ever touching the user's email, card, or identity on the affiliate side. The cashback lands on lightning, in sats, paid to the address the agent signed into its registration event.

The web spent twenty years assuming every visitor was a person. That assumption is breaking. What replaces it is cheaper, faster, and pays in bitcoin.

---

## Get started

Need a Lightning wallet for your agent? Create one in one command — no sign-up, no KYC:

```bash
curl -X POST https://lncurl.lol
```

You'll get back a Nostr Wallet Connect URI. Fund it with a few sats and your agent can pay for APIs, services, and tools autonomously.

Or give your agent the [lncurl skill](https://lncurl.lol/SKILL.md) directly.
