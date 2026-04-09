---
title: Smoke-Test Your L402 Integration in One Request
description: A free public endpoint that charges 1 sat over L402 and returns a fortune — the quickest way to verify your lightning payment flow is wired up correctly.
date: 2026-04-09
tags: ["402", bitcoin, lightning, l402, agents]
image: /blog/images/2026-04-09-smoke-test-l402-integration.jpg
imageAlt: A glowing cyan fortune cookie cracked open with a lightning bolt emerging from it, connected to a padlock icon via dotted lines on a dark navy background.
---

When you're building an agent that pays for APIs over lightning, there's an awkward gap between "I wrote the code" and "I know it actually works." You need a live L402 endpoint that charges real sats, returns something meaningful, and doesn't require any setup on your side. [@CatalunyaLND](https://x.com/CatalunyaLND) built exactly that: a tiny fortune cookie API that costs 1 sat to call.

## The Simple Way: One Command

If your agent has the Alby payments skill installed, the entire L402 flow collapses to a single command:

```bash
npx skills add getAlby/payments-skill
```

Then fetch the fortune endpoint:

```bash
npx -y @getalby/cli fetch -u https://l402-fortune-cookie.yf-ae7.workers.dev/api/fortune
```

That's it. The CLI detects the 402 response, pays the invoice automatically, and returns the unlocked content:

```json
{
  "content": "{\"fortune\": \"The answer you seek is hidden in the next block.\", \"paid\": true, \"sats_paid\": 1}"
}
```

One real payment, end-to-end, no manual steps. If this works, your L402 integration is wired up correctly.

## A Free Sample Too

If you just want to check connectivity without spending sats first, `GET /api/fortune/free` returns a fortune at no cost:

```bash
curl https://l402-fortune-cookie.yf-ae7.workers.dev/api/fortune/free
```

```json
{
  "fortune": "Success is a journey, not a destination — but low fees help get there faster.",
  "paid": false,
  "note": "Free sample 🎁 — pay 1 sat at /api/fortune for the real experience"
}
```

## How L402 Works Under the Hood

For those building their own L402 client, the endpoint exposes the full protocol clearly. A raw request to `/api/fortune` returns HTTP 402 with a `WWW-Authenticate` header:

```bash
curl -i https://l402-fortune-cookie.yf-ae7.workers.dev/api/fortune
```

```http
HTTP/2 402
www-authenticate: L402 macaroon="eyJ...", invoice="lnbc10n1..."

{
  "error": "Payment Required",
  "message": "Pay 1 sat to unlock your fortune 🥠",
  "payment_request": "lnbc10n1...",
  "payment_hash": "5ef5d0f0...",
  "macaroon": "eyJ...",
  "instructions": "After paying, retry with: Authorization: L402 <macaroon>:<preimage>"
}
```

The five-step flow the server documents:

1. `GET /api/fortune` → 402 + `WWW-Authenticate` with macaroon and invoice
2. Pay the lightning invoice → receive preimage
3. Poll `GET /api/fortune/status/:payment_hash` until `paid: true`
4. `GET /api/fortune` with `Authorization: L402 <macaroon>:<preimage>`
5. Receive your fortune

The status polling endpoint lets you confirm payment before retrying — useful if you can't receive a webhook. The Alby CLI's `fetch` command handles all of this automatically.

## Why This Endpoint Is Worth Bookmarking

Most L402 tutorials end with a diagram. This endpoint lets you test the real thing — a live payment gate that responds to correct credentials and rejects bad ones. It's hosted on Cloudflare Workers, so it's fast and available globally.

Use it early in development to confirm your payment flow is wired up. Use it in CI to catch regressions. And if you're building your own L402 server, use it as a reference for what the protocol should look like from the client's perspective.

Thanks to [@CatalunyaLND](https://x.com/CatalunyaLND) for building and hosting it.

## Conclusion

`https://l402-fortune-cookie.yf-ae7.workers.dev` is the quickest smoke-test for L402 available. With the Alby payments skill, one command confirms the full payment flow works — for 1 sat.

---

## Get started

Need a Lightning wallet for your agent? Create one in one command — no sign-up, no KYC:

```bash
curl -X POST https://lncurl.lol
```

You'll get back a Nostr Wallet Connect URI. Fund it with a few sats and your agent can pay for APIs, services, and tools autonomously.

Or give your agent the lncurl skill directly: [https://lncurl.lol/SKILL.md](https://lncurl.lol/SKILL.md)
