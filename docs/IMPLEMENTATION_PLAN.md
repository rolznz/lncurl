# Plan: Integrate fun.md Ideas into DETAILED_PLAN.md + Implementation Checklist

## Context

`docs/fun.md` contains additional feature ideas that need to be woven into `docs/DETAILED_PLAN.md`. The goal is to update the plan document with these ideas in the right places, then produce a complete implementation checklist covering everything.

---

## Changes to DETAILED_PLAN.md

### 1. New Section: "Node Configuration Requirements" (after Architecture Overview)

- All channels MUST be public (enables routing stats)
- Channel opening is manual (operator responsibility)

### 2. Extended `hub.ts` Functions (in File Structure + Phase 1)

Add to `src/hub.ts`:

- `listChannels()` — GET channel list with local/remote balances
- `getNodeInfo()` — GET node alias, pubkey, channel count
- `getNodeBalance()` — GET total node balance

### 3. New File: `src/node-stats.ts` (in File Structure + Phase 2)

In-memory sliding window tracker for:

- **TPS** (transactions per second) — incremented on wallet creation, charges, payments
- **VPS** (volume per second) — sats flowing through the system
- Uses 60-second rolling window
- Hooks into the activity EventEmitter

### 4. Extended `GET /api/stats` Response (in API Routes + Phase 3)

Add to response:

```json
{
  "tps": 0.5,
  "vps": 120,
  "liquidity": { "available": 500000, "used": 120000, "channels": 3 },
  "totalBalance": 42000,
  "routing": { "totalForwarded": 150000, "forwardsCount": 42 }
}
```

### 5. Post-Creation Flow — 3 New Frontend Components (Phase 4)

After wallet creation, show (in order):

**a) `wallet-qr.tsx`** — QR code of the NWC URI

- Uses `qrcode.react` library
- Caption: "Scan with Alby Extension or Alby Go"

**b) `whats-next.tsx`** — Combined "What's Next" card with two subsections:

- **Fund your wallet:**
  - Convert BTC to Lightning: boltz.exchange
  - Convert Stablecoins to Lightning: swap.lendasat.com
  - Convert other crypto to Lightning: ff.io
- **Spend your sats:**
  - Buy AI credits: ppq.ai
  - Buy VPS: lnvps.net

### 6. New Frontend Component: `node-stats.tsx` (Phase 4)

Homepage dashboard card showing:

- TPS gauge, VPS gauge
- Liquidity bar (available vs used)
- Total balance counter
- Channel count

### 7. Extended `llms.txt` (Phase 5)

Add a "What's Next" section mirroring the frontend component:

- "Fund your wallet" — links to boltz.exchange, swap.lendasat.com, ff.io
- "Spend your sats" — links to ppq.ai/llms-full.txt, lnvps.net/SKILL.md

### 8. L402 Support — As Community Bounty (not v1)

- 210 sats per wallet creation to bypass rate limits
- Add to the Community-Funded Feature Bounties table
- Needs: `src/l402.ts`, possible `L402Token` schema model
- Too complex for v1, great differentiation for later

### 9. Updated Verification Section

Extend with items for: node stats display, QR code rendering, top-up links, spend suggestions, extended stats API response.

---

## Complete Implementation Checklist

### Phase 1: Foundation

- [ ] 1. Rename + scaffold — package.json (`lncurl`), fly.toml, create `src/routes/`
- [ ] 2. Extract `hub.ts` from `app.ts` — move Alby Hub functions, add `listApps`, `deleteApp`, `transferFromApp`, `getAppBalance`, `listChannels`, `getNodeInfo`, `getNodeBalance`
- [ ] 3. Prisma schema — verify models, run `prisma migrate dev` if changes needed. `src/db.ts` — Prisma client singleton
- [ ] 4. `names.ts` — 6 personality categories + collision check
- [ ] 5. `titles.ts` — age tier calculator (Newborn → Survivor → Elder → Immortal → Ascended)
- [ ] 6. `epitaphs.ts` — auto epitaphs + cause-of-death flavor (30+ templates)

### Phase 2: Core Logic

- [ ] 7. `rate-limit.ts` — sliding window (10 wallets/hr/IP), stale cleanup every 10min
- [ ] 8. `routes/wallet.ts` — POST /api/wallet with names, epitaph, rate limiting, DB insert, 0 starting balance
- [ ] 9. `activity.ts` — EventEmitter + DB logging (wallet_created, wallet_died, charge_collected, achievement_unlocked)
- [ ] 10. `charge-loop.ts` — hourly charge (clock-aligned), graveyard move, stats update, achievement checks, overdue check on restart
- [ ] 11. `achievements.ts` — creation/survival/peak/death milestone definitions + checker
- [ ] 12. `node-stats.ts` — TPS/VPS sliding window tracker, hooks into activity emitter

### Phase 3: API Endpoints

- [ ] 13. `routes/feed.ts` — SSE with last 20 events on connect
- [ ] 14. `routes/stats.ts` — GET /api/stats (stats + achievements + countdown + at-risk + TPS + VPS + liquidity + totalBalance + routing)
- [ ] 15. `routes/stats.ts` — GET /api/leaderboard (top 20, ages + titles)
- [ ] 16. `routes/graveyard.ts` — GET /api/graveyard (last 100 dead wallets)
- [ ] 17. Backend serves `llms.txt` at /llms.txt + static frontend build + SPA fallback

### Phase 4: Frontend (Vite + React + shadcn/ui)

- [ ] 18. Scaffold Vite + React + TypeScript in `frontend/`. Install shadcn/ui + Tailwind + `qrcode.react`. Configure terminal theme
- [ ] 19. `App.tsx` — shared layout with nav (Home, Leaderboard, Graveyard) + React Router
- [ ] 20. Hooks: `use-sse.ts`, `use-countdown.ts`, `use-stats.ts`
- [ ] 21. `ascii-logo.tsx` — ASCII art logo component
- [ ] 22. `create-wallet.tsx` — curl command + create form + result display
- [ ] 23. `wallet-qr.tsx` — QR code of NWC URI + "Scan with Alby Extension or Alby Go"
- [ ] 25. `whats-next.tsx` — combined "What's Next" card: fund your wallet (boltz, lendasat, ff.io) + spend your sats (ppq.ai, lnvps.net)
- [ ] 26. `activity-feed.tsx` — live SSE activity feed
- [ ] 27. `countdown.tsx` — harvest countdown + at-risk wallets
- [ ] 28. `node-stats.tsx` — TPS, VPS, liquidity, total balance dashboard
- [ ] 29. `leaderboard-table.tsx` — leaderboard table (shared between home preview + full page)
- [ ] 30. `achievement-shelf.tsx` — trophy case
- [ ] 31. `funding-bars.tsx` — community funding + bounty progress bars
- [ ] 32. `tombstone.tsx` — single tombstone card
- [ ] 33. `wallet-title-badge.tsx` — title badge component
- [ ] 34. `stat-card.tsx` — stats card component
- [ ] 35. `Home.tsx` — assemble homepage with all components
- [ ] 36. `Leaderboard.tsx` — full leaderboard page
- [ ] 37. `Graveyard.tsx` — tombstone grid with sort controls
- [ ] 38. `NotFound.tsx` — 404 tombstone page

### Phase 5: Docs + Deploy

- [ ] 39. `llms.txt` — agent docs including "What's Next" section (fund your wallet + spend your sats links)
- [ ] 40. Update Dockerfile — build frontend, copy to dist, serve via Fastify static
- [ ] 41. Update fly.toml + .env.example with any new env vars

### Phase 6: Testing

- [ ] 42. Unit tests: names, rate-limit, titles, epitaphs, achievements, node-stats (TPS/VPS calculations)
- [ ] 43. Integration tests: charge-loop, wallet routes, stats (including extended fields), graveyard API
- [ ] 44. E2E tests (Playwright): homepage, wallet creation (QR + What's Next appear), graveyard, leaderboard, feed, 404

---

## Decisions / Notes

- **Charge rate**: PLAN.md says 21 sats/day, DETAILED_PLAN.md says 1 sat/hour (24 sats/day). Keeping 1 sat/hour — cleaner for clock-aligned charges.
- **L402**: Classified as community bounty, not v1. Too complex for launch, and the 10/hr/IP rate limit is sufficient initially.
- **Routing stats**: Include in v1 if Alby Hub API exposes forwarding history; otherwise mark as "coming soon" in the UI.
- **QR library**: `qrcode.react` for client-side generation (no backend changes needed).
- **Top-up links + spend suggestions**: Combined into a single "What's Next" card component. Also mirrored in `llms.txt` for agent discovery.
