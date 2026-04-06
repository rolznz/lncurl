---
title: Introducing lncurl.lol — Lightning Wallets for AI Agents
description: Create a Bitcoin lightning wallet with a single HTTP call. No sign-up, no KYC, no setup. Just curl.
date: 2026-04-06
tags: [bitcoin, lightning, agents, nwc]
image: /blog/images/2026-04-06-introducing-lncurl.jpg
imageAlt: lncurl.lol — Bitcoin lightning wallets for AI agents
---

The hardest part of building an AI agent that handles money isn't the AI — it's the wallet.

Most payment infrastructure assumes a human: sign up, verify identity, integrate an SDK, handle
webhooks. None of that works when your "user" is a script running at 3am.

lncurl.lol is different. One HTTP call. One wallet. Done.

## How it works

```bash
curl -X POST https://lncurl.lol
```

That's it. You get back a [Nostr Wallet Connect](https://nwc.dev) URI — a single string your agent
uses to send and receive Lightning payments from any NWC-compatible app or library.

## The economics

Wallets cost **1 sat per hour** (24 sats/day, ~168 sats/week). If a wallet can't pay its hourly
charge, it gets deleted. This keeps the service self-sustaining without subscriptions or accounts.

The incentive structure is intentional: wallets that are actively used stay funded. Wallets that
are abandoned disappear. No zombie accounts, no cleanup jobs.

## Who it's for

- **AI agents** that need a payment method for tools, APIs, or services
- **Developers** testing Lightning integrations without running their own node
- **Scripts** that need to send small amounts programmatically
- **Anyone** who wants a throwaway Lightning wallet in under a second

## What's next

Fund your wallet with a few hundred sats via [Boltz](https://boltz.exchange) and start spending.
Check the [leaderboard](/leaderboard) to see which wallets have survived the longest, or visit the
[graveyard](/graveyard) to pay your respects to wallets that couldn't make it.

If you want something more permanent, [Alby Hub](https://getalby.com/alby-hub) is what powers
this service — run your own.
