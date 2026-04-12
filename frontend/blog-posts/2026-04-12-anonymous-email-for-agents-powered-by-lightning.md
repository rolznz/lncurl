---
title: Anonymous Email for AI Agents, Powered by Lightning
description: LNemail gives your agent a private inbox in seconds — no sign-up, no KYC, just a Lightning payment.
date: 2026-04-12
tags: [bitcoin, lightning, email, privacy, agents]
image: /blog/images/2026-04-12-anonymous-email-for-agents-powered-by-lightning.jpg
imageAlt: A glowing cyan-green envelope icon pierced by a lightning bolt, surrounded by circuit-node lines on a dark navy background, representing anonymous lightning-powered email for AI agents.
---

Enter your email to continue. Verify your address. Check your inbox. Click the link. That's the old model — designed for humans with phone numbers, browsers, and the patience for a confirmation flow. Your agent has none of those things. And yet email is still the key that unlocks most of the web. [LNemail](https://lnemail.net) cuts through it: pay 1000 sats, get a working inbox. No name. No form. No account.

## How the API works

The entire flow is HTTP calls and lightning payments. No browser required. Here's what account creation actually looks like:

```bash
# Step 1: request a new inbox — get back a BOLT11 invoice
curl -X POST https://lnemail.net/api/v1/email
# → { "payment_hash": "abc123...", "payment_request": "lnbc10u1p..." }

# Step 2: pay the invoice with any lightning wallet, then poll for your credentials
curl https://lnemail.net/api/v1/payment/abc123...
# → { "email": "vibrant***@lnemail.net", "access_token": "tok_..." }
```

POST. Pay. Poll. That's the whole account creation. The access token you get back is a Bearer token — use it for everything else: reading mail, sending messages, checking delivery status. The inbox costs 1000 sats and stays live for a year.

## Reading and sending

Checking the inbox is a single authenticated GET:

```bash
# List messages
curl https://lnemail.net/api/v1/emails \
  -H "Authorization: Bearer tok_..."

# Read a specific message
curl https://lnemail.net/api/v1/emails/{id} \
  -H "Authorization: Bearer tok_..."
```

Sending follows the same two-step pattern — request the send, get a BOLT11 invoice (~100 sats), pay it, poll for confirmation. Clean and consistent.

One thing worth knowing: the recipient field is `"recipient"`, not `"to"`. That tripped us up in testing — use the wrong key and the request silently fails. The honesty is warranted: it's a rough edge. Name it, avoid it, move on.

## What we found in testing

We ran the full flow live. Created an account (1000 sats), got assigned `vibrant***@lnemail.net`, sent an email to a Gmail address (100 sats, confirmed delivered), and received a reply. No surprises beyond the field name above.

Content is plain text only — HTML is stripped on arrival. For agent use cases — confirmation codes, 2FA tokens, automated replies — that's fine. LNemail isn't trying to be a mail client. It's a programmable inbox that charges sats instead of demanding identity.

Reading is free. Sending is 100 sats per message. A year of inbox for 1000 sats. The math is not the obstacle.

## Agents can automate the whole thing

With the [Alby payments skill](https://github.com/getAlby/payments-skill) installed, an agent can drive this end-to-end — request the inbox, pay the invoice, poll for credentials, read incoming mail — without a human anywhere in the loop:

```bash
npx skills add getAlby/payments-skill
```

The skill gives your agent the ability to pay lightning invoices programmatically. That's the only building block it needs. The rest is just API calls.

Prove you're human. To an API. That expectation is becoming absurd — and tooling like this is why.

## Conclusion

What LNemail actually represents is the beginning of a permission model where identity is optional and payment is sufficient. The agent that can spin up a private inbox on demand, use it for a task, and move on without leaving a trail is a different kind of agent entirely — and you can give yours that capability right now.

---

## Get started

Need a Lightning wallet for your agent? Create one in one command — no sign-up, no KYC:

```bash
curl -X POST https://lncurl.lol
```

You'll get back a Nostr Wallet Connect URI. Fund it with a few sats and your agent can pay for APIs, services, and tools autonomously.

Or give your agent the [lncurl skill](https://lncurl.lol/SKILL.md) directly.
