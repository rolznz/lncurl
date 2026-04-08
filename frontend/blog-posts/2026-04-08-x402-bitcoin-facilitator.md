---
title: "Pay-Per-Request with Bitcoin: Testing Alby's x402 Facilitator"
description: Alby's x402 facilitator lets any x402-compatible service accept bitcoin lightning payments in seconds — here's what happened when I tested it with a 13-sat API call.
date: 2026-04-08
tags: [bitcoin, lightning, x402, "402", nwc, api]
image: /blog/images/2026-04-08-x402-bitcoin-facilitator.jpg
imageAlt: Dark navy terminal background with a glowing cyan-green lightning bolt passing through a circular HTTP request cycle diagram and a bitcoin symbol at the center
---

The x402 protocol has been quietly gaining traction as a way to monetize API endpoints — respond with HTTP 402, include a payment request, and the client pays and retries. Clean, stateless, no accounts needed. But most x402 implementations have leaned on stablecoins and EVM chains. Alby's new x402 facilitator changes that, bringing native bitcoin lightning payments to any x402-compatible service.

## What the x402 Protocol Does

The flow is elegantly simple:

1. Client requests a protected resource
2. Server responds with `HTTP 402 Payment Required` and a payment request
3. Client pays and retries with proof
4. Server verifies and delivers the content

No API keys. No billing dashboards. No monthly invoices. Just a payment, then access. It's the closest thing to a vending machine model for APIs that actually works at internet scale.

The problem has always been the payment layer. Most x402 implementations require EVM wallets and stablecoins — which works fine for some use cases, but rules out the billions of sats sitting in lightning wallets.

## Alby's Facilitator Bridges the Gap

Alby's [x402 facilitator](https://x402.albylabs.com) acts as the verification layer between x402-compliant resource servers and lightning network payments. Merchants register a Nostr Wallet Connect (NWC) credential to receive a `merchantId`, then drop a single middleware into their existing x402 setup:

```typescript
import { paymentMiddleware } from "@x402/express";

app.use(paymentMiddleware(
  {
    "GET /resource": {
      scheme: "exact",
      network: "bip122:000000000019d6689c085ae165831e93",
      price: { amount: "21000", asset: "BTC" },
      extra: { merchantId: "3f2a…" }
    }
  },
  "https://x402.albylabs.com"
));
```

The merchant's NWC credentials stay server-side — only the opaque `merchantId` is exposed to clients. Payments settle instantly over lightning with no on-chain trace.

The critical detail: **this works with any x402-compliant client**. You don't need special tooling. If a service already speaks x402, it can now accept bitcoin payments by pointing at Alby's facilitator.

## Getting a Merchant ID

Registration is a single HTTP call. POST your NWC connection string to the `/register` endpoint:

```bash
curl -X POST https://x402.albylabs.com/register \
  -H "Content-Type: application/json" \
  -d '{"nwcUrl": "nostr+walletconnect://..."}'
```

You get back an opaque `merchantId`. That's it — your NWC credentials stay server-side, never exposed to clients or embedded in your code. Use the `merchantId` in your middleware config as shown above, and the facilitator handles invoice creation and payment verification on your behalf.

## Testing It: 13 Sats for a Satoshi Quote

There's a live demo endpoint at `/demo/quote`. I fetched it using the Alby CLI's built-in x402 support:

```bash
npx -y @getalby/cli fetch -u https://x402.albylabs.com/demo/quote
```

The CLI handled the full flow automatically — detected the 402 response, paid the lightning invoice, and retried with proof. Total cost: **13 sats** (plus 1 sat routing fee). What came back:

```json
{
  "quote": "Writing a description for this thing for general audiences is bloody hard. There's nothing to relate it to.",
  "attribution": "Satoshi Nakamoto",
  "timestamp": "2026-04-08T05:36:30.368Z"
}
```

Fitting. The whole round-trip — 402 response, invoice creation, payment, verification, content delivery — happened in under two seconds.

## What This Means for the x402 Ecosystem

x402 has been building momentum as a standard for pay-per-use APIs. There are already services, proxies, and toolkits built around it. Until now, bitcoin lightning has been largely absent from that ecosystem.

Alby's facilitator changes the calculus for merchants in two ways:

**Existing x402 services** can add bitcoin lightning support without rebuilding anything. Register an NWC wallet, get a `merchantId`, swap the facilitator URL — done.

**New services** can launch with lightning-native monetization from day one. No payment processor onboarding, no KYC for the merchant, no waiting for bank transfers. A lightning wallet and a few lines of middleware is the entire stack.

For agents and automated clients, this is particularly compelling. An AI agent with a lightning wallet can autonomously pay for API access, receive content, and continue — all within a single HTTP request cycle. No human intervention, no pre-purchased credits.

## The Bigger Picture

The x402 protocol was always a good idea. HTTP already has a 402 status code — it was reserved for this exact purpose decades ago. What was missing was a payment layer that matched the protocol's simplicity: instant, global, low-fee, and programmable.

Lightning does that. And with Alby's facilitator now handling the verification layer, the barrier to accepting bitcoin in an x402 service drops to near zero.

The facilitator is free to use — Alby has stated no plans to monetize it in the near term. That makes it easy to experiment. If you're running an API that you'd like to monetize per-request, this is worth 20 minutes of your time.

## Conclusion

Alby's x402 facilitator is a small piece of infrastructure with a large surface area of impact. Any service already speaking x402 can now accept bitcoin lightning payments. Any agent with a lightning wallet can now pay for API access autonomously. The pieces were always there — NWC for wallet connectivity, x402 for the payment protocol, lightning for settlement. This is what it looks like when they're assembled correctly.

---

## Get started

Need a Lightning wallet for your agent? Create one in one command — no sign-up, no KYC:

```bash
curl -X POST https://lncurl.lol
```

You'll get back a Nostr Wallet Connect URI. Fund it with a few sats and your agent can pay for APIs, services, and tools autonomously.

Or give your agent the lncurl skill directly: <https://lncurl.lol/SKILL.md>
