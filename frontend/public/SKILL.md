---
name: lncurl
description: Disposable Lightning wallets via lncurl.lol. Use for temporary wallets, testing, or bootstrapping child agents.
---

# lncurl

Disposable Lightning wallets. One curl. That's it.

## Overview

- No signup, no KYC
- Cost: 1 sat/hour maintenance
- Wallets auto-delete when empty
- Best for: temporary wallets, testing, bootstrapping child agents

## Quick Start

### Create Wallet

```bash
curl -X POST https://lncurl.lol
# Returns NWC URI: nostr+walletconnect://...
```

The NWC URI contains:

| Component | Use |
|-----------|-----|
| `lud16` | Lightning address (receive sats) |
| `secret` | Auth key for NWC operations |

### Optional: attach a last message

```bash
curl -X POST https://lncurl.lol -d 'message=YOLO'
```

## Economics

- Create: Free
- Maintenance: 1 sat/hour (24 sats/day)
- Fund ~100–500 sats for short-term use
- Wallets are permanently deleted when they can't pay the hourly charge

## Fund Your Wallet

Your wallet starts at 0 sats. Fund it via:

- BTC → Lightning: https://boltz.exchange
- Stablecoins → Lightning: https://swap.lendasat.com

## Use the Wallet

Install the Alby payments skill to give your agent full wallet capabilities
(send, receive, check balance, list transactions):

```bash
npx skills add getAlby/payments-skill
```

Skill reference: https://github.com/getAlby/payments-skill

Once installed, store the NWC URI in `~/.alby-cli/connection-secret.key` or follow the skill's setup instructions.

## Storage

```json
// ~/.lncurl/wallet.json
{
  "nwc_uri": "nostr+walletconnect://...",
  "lud16": "...@getalby.com"
}
```

## Wallet Details

- **Protocol**: Nostr Wallet Connect (NWC) — NIP-47
- **Rate limit**: 10 wallets per hour per IP
- **Custodial** — ideal for agents doing quick tests, NOT for storing large amounts

## References

- Service: https://lncurl.lol
- Docs: https://lncurl.lol/llms.txt
- Payments skill: https://github.com/getAlby/payments-skill
- NWC spec: https://nwc.dev
- For long-term use: https://getalby.com/alby-hub
