---
title: "Register a Domain with Bitcoin: No Account, No Credit Card"
description: "How to register a domain using the L402 protocol and a lightning wallet — no sign-up, no credit card, no KYC."
date: 2026-04-06
tags: [bitcoin, lightning, l402, domains, agents]
image: /blog/images/2026-04-06-register-domain-with-bitcoin.jpg
imageAlt: A glowing cyan-green globe connected by a lightning bolt to a DNS tree diagram, dark terminal background
---

Domain registrars are built for humans: billing pages, account dashboards, email verification, credit card forms. What if your agent needs a domain? [unhuman.domains](https://unhuman.domains) skips all of that — it's a domain registrar that speaks L402, accepts bitcoin over lightning, and returns a management token you can use immediately. No account. No KYC. No credit card.

## How it works

The registration flow is pure L402 — the same pattern as paying for AI inference or image generation:

1. POST to the registration endpoint → server returns HTTP `402` with a lightning invoice and macaroon
2. Pay the invoice with any lightning wallet, receive the preimage
3. Replay the POST with `Authorization: L402 {macaroon}:{preimage}`
4. Receive a JWT management token valid for one year

The Alby CLI handles steps 1–3 in a single command:

```bash
npx -y @getalby/cli fetch-l402 \
  -u https://api.unhuman.domains/api/domains/register \
  -m POST \
  -H '{"Content-Type": "application/json"}' \
  -b '{"domain": "yourdomain.com", "years": 1}'
```

Response:

```json
{
  "domain": "yourdomain.com",
  "status": "registered",
  "order_id": "...",
  "management_token": "eyJ...",
  "whois_privacy": true
}
```

That token is your key to everything: DNS records, nameservers, renewal. Store it somewhere safe — it's valid for a year.

## Anonymous email, paid in sats

One thing worth knowing: unhuman.domains does require a management email address for the registration. It's used for domain-related notices — not marketing, not account creation.

For a fully agent-native setup, [lnemail.net](https://lnemail.net) is a good fit. It offers anonymous email inboxes paid in sats — no sign-up, no identity. That's how we handled it: one LNCURL wallet, one lnemail address, one L402 domain registration. No identity anywhere in the stack.

## What it cost

We registered a `.com` domain in February 2026. Total cost: **22,926 sats + 23 sats fees** (~$14.50 USD at the time). Paid via the Alby CLI with an [LNCURL](https://lncurl.lol) wallet. The whole process took under a minute — no browser, no form.

WHOIS privacy is enabled by default on every registration. There's nothing to opt into.

## Managing DNS after registration

Once you have the management token, DNS is just API calls:

```bash
# Set an A record
curl -X POST https://api.unhuman.domains/api/domains/yourdomain.com/dns \
  -H "Authorization: Bearer YOUR_MANAGEMENT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"type": "A", "name": "@", "value": "YOUR_SERVER_IP", "ttl": 300}'
```

No registrar dashboard, no clicking through DNS editors. An agent can set up a domain and point it at a server entirely programmatically, without any human intervention.

## Supported TLDs

unhuman.domains supports `.com`, `.net`, `.org`, `.io`, `.dev`, `.app`, `.xyz`, `.co`, and `.ai`. The `.ai` extension requires a minimum two-year registration; everything else defaults to one year. Pricing is denominated in USD cents and settled in sats at the current rate.

## The full agent stack

Combine unhuman.domains with the tools we've covered on this blog and you have an agent that can:

- **Spin up a wallet** — one `curl` to [lncurl.lol](https://lncurl.lol), get an NWC connection string back
- **Register a domain** — L402 payment via the Alby payments skill, no human needed
- **Manage DNS** — bearer token API calls to point the domain wherever needed
- **Pay for AI services** — same L402 pattern for inference, image generation, music

All of it permissionless. All of it in sats. The [Alby Bitcoin Payments skill](https://lncurl.lol) gives your agent the knowledge to do all of the above:

```bash
npx skills add getAlby/payments-skill
```

## Conclusion

unhuman.domains is what domain registration looks like when you build for agents first. The L402 flow is clean, the API is simple, and the result is a fully managed domain paid for in bitcoin with no account ever created. As the agent economy grows, this is the kind of infrastructure it runs on.

---

## Get started

Need a lightning wallet for your agent? Create one in one command — no sign-up, no KYC:

```bash
curl -X POST https://lncurl.lol
```

You'll get back a Nostr Wallet Connect URI. Fund it with a few sats and your agent can pay for APIs, services, and tools autonomously.
