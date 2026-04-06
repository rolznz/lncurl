---
title: The 3 Best Bitcoin Lightning Wallets for AI Agents
description: If your agent needs to pay for APIs, credits, or services autonomously, here are the three best Lightning wallets to give it — ranked.
date: 2026-04-06
tags: [bitcoin, lightning, agents, wallets, nwc]
image: /blog/images/2026-04-06-best-bitcoin-lightning-wallets-for-ai-agents.jpg
imageAlt: Three glowing cyan wallet icons on a ranked podium connected by lightning bolt symbols on a dark navy background
---

Your agent can reason, plan, and act — but the moment it needs to pay for something, most infrastructure falls apart. Credit cards need a human. Stripe needs a sign-up form. PayPal needs a browser. Bitcoin Lightning needs none of that. It's programmable money: send a payment with a shell command, receive one with an HTTP request, no account required.

Here are the three best Lightning wallets for agents that need to pay for stuff.

## What makes a good agent wallet

Before the rankings, the criteria:

- **Programmatic access** — you should be able to create and use the wallet from a script, with no human clicking through a UI
- **Open protocol** — [NWC (Nostr Wallet Connect / NIP-47)](https://nwc.dev) is the emerging standard. Think of it as "USB-C for your agent": one connection string, any compatible app or framework
- **Budget controls** — agents can go rogue. A good wallet lets you cap how much any single agent can spend
- **Framework compatibility** — works with the tools you're already using: Claude MCP, LangChain, n8n, custom scripts

---

## #1 — Alby Hub

**Best for:** Production agents, full infrastructure control, multi-agent setups

**Website:** [getalby.com/alby-hub](https://getalby.com/alby-hub)

Alby Hub is the most complete Lightning wallet solution for agents. It's open source (MIT), self-custodial, and built around NWC as its primary interface. You run it yourself on any hardware — or pay Alby $12.90/month to host it in the cloud and have it ready in under a minute.

The standout feature for agent builders is **sub-wallets**: each agent gets its own isolated Lightning wallet with its own spending limits, permissions, and balance — all funded from your main Hub. An agent that goes haywire can't drain more than its capped budget. An agent you're testing doesn't touch production funds.

**For Claude Code and other modern agent frameworks, the [Alby Payments Skill](https://github.com/getAlby/payments-skill) is the fastest integration path** — often easier than an MCP server. One command installs it:

```bash
npx skills add getAlby/payments-skill
```

The skill wraps the [`@getalby/cli`](https://github.com/getAlby/cli) tool and exposes all wallet operations — send, receive, check balance, create invoices, fetch L402 — as natural language commands your agent can invoke via bash. Point it at any NWC connection string via `~/.alby-cli/connection-secret.key` or the `NWC_URL` environment variable. It works with Alby Hub, lncurl.lol, or any other NWC wallet.

The **[Alby MCP Server](https://github.com/getAlby/mcp)** remains the right choice for MCP-native frameworks (Cursor, Cline, n8n). Both ultimately talk NWC to your Hub.

There's also **PaidMCP**: tooling that lets you charge _other_ agents per tool call in sats. If you're building an agentic service and want to monetise it natively, Alby Hub is your infrastructure.

**In short:** Alby Hub is the reference implementation. Most mature, largest ecosystem, most control. The right choice when you're building something serious.

---

## #2 — lncurl.lol _(disclosure: we built this)_

**Best for:** Instant wallets, zero-friction testing, throwaway agent identities

**Website:** [lncurl.lol](https://lncurl.lol)

We built lncurl.lol, so take this with appropriate skepticism — but we built it because we needed it.

```bash
curl -X POST https://lncurl.lol
```

That's it. One HTTP call returns a NWC connection string. Your agent has a fully functional Lightning wallet with no sign-up, no KYC, no browser, no configuration. Fund it with a few sats via [Boltz](https://boltz.exchange) and it's ready to spend.

Wallets cost **1 sat per hour** — a flat time-based fee with no channel fees and no per-transaction fees. If the wallet runs out of funds and can't pay, it gets deleted. If it stays funded, it lives indefinitely.

**The testing cost argument is worth making explicitly.** Self-custodial wallets like Alby Hub and MDK require opening Lightning channels via on-chain Bitcoin transactions. Channel opens cost real money — typically thousands of sats in on-chain fees — and closing a channel costs again. If you're spinning up wallets frequently during development, testing different agent behaviours, or running CI that needs Lightning payments, those channel fees add up fast. lncurl.lol has none of that overhead. It's 1 sat/hour, period.

Since lncurl.lol returns a standard NWC connection string, it works directly with the [Alby Payments Skill](https://github.com/getAlby/payments-skill) — the skill even lists lncurl.lol as a recommended test wallet in its own docs. So the full stack for a Claude Code agent can be as simple as:

```bash
# Get a wallet
NWC_URL=$(curl -s -X POST https://lncurl.lol/api/wallet)

# Install the payments skill
npx skills add getAlby/payments-skill
```

Your agent now has a funded Lightning wallet and all the tools to use it.

The trade-off is custody: we hold your funds. Keep amounts small (a few thousand sats at most), and it's a fine deal. Don't put your savings here.

**In short:** The fastest path from zero to a working agent wallet. Ideal for testing, prototyping, and any workflow where frictionless provisioning matters more than key ownership.

---

## #3 — MDK Agent Wallet

**Best for:** L402 pay-per-API-call flows

**Website:** [moneydevkit.com](https://moneydevkit.com)

MDK (moneydevkit) is a Lightning-native developer toolkit in public beta. Its Agent Wallet is a self-custodial CLI tool with JSON stdout output — designed explicitly for scripts and agents to parse programmatically. Keys live locally (`~/.mdk-wallet/`), controlled by a mnemonic. A lightweight LDK daemon runs in the background; no external Lightning node required.

The feature that makes MDK distinct is **L402 support**. L402 is a protocol that lets APIs gate responses behind a Lightning payment: your agent hits an endpoint, gets back a payment request, pays it, receives a token, and retries with the token to get the actual response. The whole flow happens inline with no human intervention. If you're building agents that consume pay-per-call APIs — and more APIs are moving this direction — MDK has the best native tooling for it.

MDK also supports BOLT11, BOLT12, LNURL, and Lightning Addresses, giving it broader payment compatibility than lncurl.lol's NWC-only approach.

**Caveats to know:** MDK is in public beta — production readiness is unclear. The merchant checkout product charges 2% per transaction; the Agent Wallet CLI's fee structure is less documented but may follow similar terms. Worth checking [their docs](https://docs.moneydevkit.com/agent-wallet) before committing.

**In short:** The right choice if L402 pay-per-call is central to your agent's workflow. Watch the beta status.

---

## Quick comparison

|                       | Alby Hub                   | lncurl.lol                 | MDK                    |
| --------------------- | -------------------------- | -------------------------- | ---------------------- |
| **Custody**           | Self                       | Custodial                  | Self                   |
| **Setup**             | ~1 min (cloud) / self-host | One `curl` command         | CLI install            |
| **Protocol**          | NWC, WebLN, LNURL          | NWC                        | BOLT11/12, LNURL, L402 |
| **Agent integration** | MCP server built-in        | Any NWC client             | CLI + JSON             |
| **Cost**              | Free / $12.90/mo           | 1 sat/hr (no channel fees) | 2% (checkout product)  |
| **Status**            | Production                 | Production                 | Public beta            |

---

## Conclusion

**Alby Hub** if you're building production infrastructure and need per-agent budget controls, MCP integration, and full key ownership. **lncurl.lol** if you want a wallet in one command — especially for testing, where avoiding channel fees matters. **MDK** if your agents are consuming L402-gated APIs and you need the inline payment flow.

All three speak Lightning natively. Pick the one that matches where your agent actually runs.

---

## Get started

Need a Lightning wallet for your agent? Create one in one command — no sign-up, no KYC:

```bash
curl -X POST https://lncurl.lol
```

You'll get back a Nostr Wallet Connect URI. Fund it with a few sats and your agent can pay for APIs, services, and tools autonomously.
