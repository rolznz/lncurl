# lncurl.lol - Implementation Plan

## Context

Transform the existing NWC Faucet (`src/app.ts` + `src/index.html`) into **lncurl.lol** — an agent-first custodial Lightning wallet service with a life/death theme. `curl -X POST https://lncurl.lol` instantly returns a working NWC wallet URI. Wallets start at **0 sats** (this is a paid service, not a faucet) and cost **1 sat/hour** to maintain. Wallets get reaped when they can't pay.

This plan covers **essential v1 features**. Additional features are listed as community-funded bounties — each with its own NWC wallet, built only when funded.

---

## Architecture Overview

- **Backend**: Fastify + TypeScript, SQLite via Prisma ORM
- **Frontend**: Vite + React + TypeScript + shadcn/ui + React Router
- **Design**: Terminal-inspired — modern dark UI with terminal accents (monospace code blocks, ASCII art), polished typography elsewhere
- **Charge model**: 1 sat/hour (24 sats/day), clock-aligned to :00 minutes
- **Starting balance**: 0 sats (owner funds via NWC)
- **Persistence**: SQLite on Fly.io volume
- **SSE**: Live activity feed via EventEmitter + raw Fastify replies
- **Deploy**: Fly.io, `min_machines_running = 1` (charge loop must stay alive)

---

## Node Configuration Requirements

- All channels **MUST be public** — enables routing stats display and network visibility
- Channel opening is **manual** (operator responsibility) — not automated by the service

---

## File Structure

```
prisma/
  schema.prisma                   # Prisma schema definition
  migrations/                     # Auto-generated migration files

src/                              # Backend (Fastify)
  app.ts                          # Server setup, route registration, charge loop start
  hub.ts                          # Alby Hub API client (wallet + node operations)
  names.ts                        # Name generator with personality categories
  db.ts                           # Prisma client singleton
  charge-loop.ts                  # Hourly charge loop (clock-aligned)
  rate-limit.ts                   # In-memory sliding window rate limiter
  activity.ts                     # EventEmitter + DB logging for SSE
  achievements.ts                 # Achievement definitions + checker
  titles.ts                       # Wallet age tier calculator
  epitaphs.ts                     # Auto-generated epitaphs + cause-of-death flavor
  node-stats.ts                   # TPS/VPS sliding window tracker
  routes/
    wallet.ts                     # POST /api/wallet (create wallet)
    feed.ts                       # GET /api/feed (SSE)
    stats.ts                      # GET /api/stats, GET /api/leaderboard
    graveyard.ts                  # GET /api/graveyard
  llms.txt                        # Agent instructions (served at /llms.txt)

frontend/                         # Frontend (Vite + React)
  index.html                      # Vite entry point
  src/
    main.tsx                      # React entry + router setup
    App.tsx                       # Layout shell (nav, footer)
    hooks/
      use-sse.ts                  # SSE connection hook for live feed
      use-countdown.ts            # Countdown timer hook
      use-stats.ts                # Polling /api/stats
    pages/
      Home.tsx                    # Homepage
      Graveyard.tsx               # Wallet graveyard
      Leaderboard.tsx             # Full leaderboard
      NotFound.tsx                # 404 tombstone
    components/
      ascii-logo.tsx              # ASCII art logo
      create-wallet.tsx           # Curl command + create form + result
      wallet-qr.tsx               # QR code of NWC URI (post-creation)
      whats-next.tsx              # "What's Next" card: fund + spend links (post-creation)
      activity-feed.tsx           # Live SSE activity feed
      countdown.tsx               # Harvest countdown + at-risk wallets
      node-stats.tsx              # TPS, VPS, liquidity, total balance dashboard
      leaderboard-table.tsx       # Leaderboard table (shared between pages)
      achievement-shelf.tsx       # Trophy case
      funding-bars.tsx            # Community funding + bounty progress bars
      tombstone.tsx               # Single tombstone card
      wallet-title-badge.tsx      # Title badge (Newborn, Survivor, etc.)
      stat-card.tsx               # Stats card
    components/ui/                # shadcn/ui components (auto-generated)
    lib/
      utils.ts                    # shadcn cn() utility
      api.ts                      # API client helpers
    styles/
      globals.css                 # Tailwind + custom terminal theme
```

---

## API Routes (Backend)

All data routes are prefixed with `/api/`. The frontend is served as static files. Non-API/non-file routes fallback to `index.html` for client-side routing.

| Method | Path               | Response           | Description                                                  |
| ------ | ------------------ | ------------------ | ------------------------------------------------------------ |
| `POST` | `/api/wallet`      | Plain text NWC URI | Create wallet. Optional: `message` (epitaph, max 140 chars)  |
| `GET`  | `/api/feed`        | SSE stream         | Live activity feed                                           |
| `GET`  | `/api/stats`       | JSON               | Stats + achievements + countdown + at-risk + TPS/VPS + liquidity + routing |
| `GET`  | `/api/leaderboard` | JSON               | Top 20 longest-lived wallets with titles                     |
| `GET`  | `/api/graveyard`   | JSON               | Last 100 dead wallets for graveyard page                     |
| `GET`  | `/llms.txt`        | Plain text         | Agent documentation                                          |
| `POST` | `/`                | Plain text NWC URI | Alias for `/api/wallet` (so `curl -X POST lncurl.lol` works) |

**Removed from faucet**: `POST /wallets/:name/topup`, `balance` param on create.

### Extended `GET /api/stats` Response

```json
{
  "stats": { "...existing fields..." },
  "achievements": [],
  "next_charge_at": 1234567890,
  "wallets_at_risk": [],
  "tps": 0.5,
  "vps": 120,
  "liquidity": { "available": 500000, "used": 120000, "channels": 3 },
  "totalBalance": 42000,
  "routing": { "totalForwarded": 150000, "forwardsCount": 42 }
}
```

---

## Database Schema (Prisma)

```prisma
datasource db {
  provider = "sqlite"
}

generator client {
  provider = "prisma-client"
  output   = "../src/generated/prisma"
}

model Wallet {
  name             String    @id
  appId            String    @map("app_id")
  createdAt        Int       @map("created_at")
  lastChargedAt    Int?      @map("last_charged_at")
  totalCharged     Int       @default(0) @map("total_charged")
  epitaph          String?
  lastKnownBalance Int?      @map("last_known_balance")
  creatorIp        String?   @map("creator_ip")

  @@map("wallets")
}

model Graveyard {
  name              String  @id
  createdAt         Int     @map("created_at")
  deletedAt         Int     @map("deleted_at")
  causeOfDeath      String  @map("cause_of_death")
  causeOfDeathFlavor String? @map("cause_of_death_flavor")
  totalCharged      Int     @default(0) @map("total_charged")
  epitaph           String?
  flowers           Int     @default(0)

  @@map("graveyard")
}

model Activity {
  id         Int     @id @default(autoincrement())
  type       String
  walletName String? @map("wallet_name")
  amountSats Int?    @map("amount_sats")
  message    String?
  createdAt  Int     @map("created_at")

  @@map("activity")
}

model Achievement {
  id         String @id
  title      String
  unlockedAt Int    @map("unlocked_at")
  walletName String? @map("wallet_name")

  @@map("achievements")
}

model ServiceStats {
  id                    Int  @id @default(1)
  totalWalletsCreated   Int  @default(0) @map("total_wallets_created")
  totalWalletsDied      Int  @default(0) @map("total_wallets_died")
  totalChargesCollected Int  @default(0) @map("total_charges_collected")
  peakConcurrentWallets Int  @default(0) @map("peak_concurrent_wallets")
  lastChargeRunAt       Int? @map("last_charge_run_at")
  nextChargeRunAt       Int? @map("next_charge_run_at")

  @@map("service_stats")
}
```

---

## Frontend Design

### Visual Language

- **Terminal-inspired, not terminal-replica**. Modern dark UI with terminal accents.
- **Background**: Very dark near-black (`hsl(220 15% 4%)`)
- **Cards/surfaces**: Slightly lighter (`hsl(220 15% 8%)`) with subtle borders
- **Primary accent**: Terminal green (`#00ff41`) — used for positive events (wallet born, charges collected)
- **Danger accent**: Amber/red — deaths, at-risk warnings, countdown urgency
- **Typography**: System sans-serif (Inter or similar) for body text. **Monospace** (JetBrains Mono or Fira Code) for wallet names, curl commands, the activity feed, ASCII art, and code-like elements
- **shadcn/ui**: Used for Card, Button, Input, Badge, Table, Progress, Tooltip — all themed to match the dark terminal aesthetic via CSS variables

### Shared Layout (`App.tsx`)

- Minimal top nav: **lncurl.lol** logo (left), nav links: Home, Leaderboard, Graveyard (right)
- Nav uses monospace font, subtle, doesn't compete with page content
- Footer: "Powered by Alby Hub + Nostr Wallet Connect" + GitHub link
- Max-width container (~900px), centered

---

### Page: Homepage (`/`)

**Above the fold — Hero section:**

```
+---------------------------------------------+
|                                             |
|          ##|     ###|   ##|                 |
|          ##|     ####|  ##|                 |
|          ##|     ##|##| ##|   ASCII art     |
|          ##|     ##| ##|##|   logo          |
|          #######|##|  ####|                 |
|          |======||=|  |===|                |
|                                             |
|   Lightning wallets for agents.             |
|   One curl. That's it.                      |
|                                             |
|  +----------------------------------------+ |
|  | $ curl -X POST https://lncurl.lol     | |
|  +----------------------------------------+ |
|                                             |
|  [ Create Wallet ]                          |
|                                             |
|  Optional: "Last words for your wallet..."  |
|  (monospace input, 140 char max)            |
|                                             |
|  +- Result ----------------------------+   |
|  | nostr+walletconnect://abc...         |   |
|  | &lud16=lncurl-doomed-pickle@...      |   |
|  |                         [ Copy ]     |   |
|  +--------------------------------------+   |
|                                             |
|  +- QR Code ----------------------------+   |
|  |          [QR CODE IMAGE]             |   |
|  |  "Scan with Alby Extension           |   |
|  |   or Alby Go"                        |   |
|  +--------------------------------------+   |
|                                             |
|  +- What's Next -------------------------+  |
|  |  Fund your wallet:                    |  |
|  |   BTC -> Lightning: boltz.exchange    |  |
|  |   Stablecoins: swap.lendasat.com      |  |
|  |   Other crypto: ff.io                 |  |
|  |                                       |  |
|  |  Spend your sats:                     |  |
|  |   AI credits: ppq.ai                  |  |
|  |   VPS hosting: lnvps.net              |  |
|  +---------------------------------------+  |
+---------------------------------------------+
```

- Curl command in a dark card with monospace, green text, terminal prompt (`$`)
- "Create Wallet" button: large, green, prominent
- Optional epitaph input below (collapsed by default? or always visible as a subtle text field)
- Result appears in a card with copy button, monospace, slightly highlighted
- **Post-creation flow** (appears after wallet is created):
  1. **QR Code** — scannable NWC URI via `qrcode.react`, caption: "Scan with Alby Extension or Alby Go"
  2. **What's Next card** — combined fund + spend links

**Below the fold — two-column layout on desktop, stacked on mobile:**

```
+----------------------+  +----------------------+
|   NODE STATS         |  |   NEXT HARVEST       |
|                      |  |   42m 17s            |
|   TPS: 0.5           |  |                      |
|   VPS: 120 sats/s    |  |   AT RISK:           |
|   Liquidity: [=====] |  |   lncurl-sad-moth    |
|   Balance: 42,000    |  |   lncurl-broke-      |
|   Channels: 3        |  |      potato          |
+----------------------+  +----------------------+

+----------------------+  +----------------------+
|   LIVE FEED          |  |   STATS              |
|                      |  |   Alive: 42          |
|  > lncurl-cosmic-    |  |   Dead: 1,847        |
|    narwhal was born  |  |   Peak: 67           |
|  > lncurl-doomed-    |  +----------------------+
|    pickle was reaped |
|  > 1 sat collected   |
|    from 23 wallets   |
|  > ...               |
|                      |
|  (scrolling, mono)   |
+----------------------+

+----------------------+  +----------------------+
|   LEADERBOARD        |  |   ACHIEVEMENTS       |
|   (top 5 preview)    |  |                      |
|                      |  |   100 wallets!        |
|   1. cosmic-narwhal  |  |   First 7d           |
|      Elder - 31d     |  |      survivor        |
|   2. mighty-phoenix  |  |   Peak: 50           |
|      Survivor - 12d  |  |                      |
|   ...                |  |                      |
|   [View full ->]     |  |                      |
+----------------------+  +----------------------+

+---------------------------------------------+
|   COMMUNITY FUNDING                         |
|                                             |
|   Channel Fund  ========---- 340K/500K sats |
|   Hosting Costs ==========-- 2.1K/2.4K sats |
|                                             |
|   lncurl-channels@getalby.com               |
|   lncurl-hosting@getalby.com                |
+---------------------------------------------+

+---------------------------------------------+
|   FEATURE BOUNTIES -- Fund to unlock!       |
|                                             |
|   Leave Flowers    ==---- 12K/50K sats      |
|   ASCII Animations ------  2K/100K sats     |
|   Sound Effects    ------  0K/100K sats     |
|   Death Notifs     ------  0K/150K sats     |
|   L402 Rate Bypass ------  0K/210K sats     |
|                                             |
|   Each feature has its own wallet.          |
|   Pay into it. We build when it's funded.   |
+---------------------------------------------+
```

---

### Page: Leaderboard (`/leaderboard`)

```
+---------------------------------------------+
|   HALL OF FAME                              |
|   The longest-lived wallets on lncurl.lol   |
|                                             |
|   # | Name                | Age    | Title  |
|   --+---------------------+--------+--------|
|   1 | lncurl-cosmic-      | 118d   | Immor- |
|     | narwhal             | 15h    | tal    |
|   2 | lncurl-mighty-      |  31d   | Elder  |
|     | phoenix             |   4h   |        |
|   ...                                       |
|                                             |
|   Title tiers:                              |
|   Newborn (0d) -> Survivor (7d) ->          |
|   Elder (30d) -> Immortal (100d) -> ??? (1y)|
+---------------------------------------------+
```

- shadcn Table component
- Wallet names in monospace, green
- Title shown as a Badge component with tier-appropriate color
- Footer explains the tier system (with the secret "Ascended" tier shown as "???")

---

### Page: Graveyard (`/graveyard`)

```
+---------------------------------------------+
|   THE GRAVEYARD                             |
|   Total wallets laid to rest: 1,847         |
|                                             |
|   Sort: [Most Recent] [Oldest at Death]     |
|                                             |
|   +-------------+  +-------------+         |
|   |   _______   |  |   _______   |         |
|   |  /       \  |  |  /       \  |         |
|   | | R.I.P. |  |  | | R.I.P. |  |         |
|   | |        |  |  | |        |  |         |
|   | |________|  |  | |________|  |         |
|   |             |  |             |         |
|   | lncurl-     |  | lncurl-     |         |
|   | doomed-     |  | cursed-     |         |
|   | pickle      |  | waffle      |         |
|   |             |  |             |         |
|   | Born: Feb 1 |  | Born: Jan 3 |         |
|   | Died: Feb 3 |  | Died: Feb 1 |         |
|   | Age: 2d 4h  |  | Age: 29d    |         |
|   |             |  |             |         |
|   | "Starved on |  | "Ghosted by |         |
|   |  a Tuesday" |  |  its owner" |         |
|   |             |  |             |         |
|   | "Lived fast,|  | "YOLO"      |         |
|   |  died broke"|  |  (custom)   |         |
|   +-------------+  +-------------+         |
|                                             |
|   [Load more...]                            |
+---------------------------------------------+
```

- Grid of tombstone Card components (2-3 columns on desktop, 1 on mobile)
- ASCII tombstone art at top of each card (monospace, dim)
- Wallet name in monospace green
- Dates and age in muted text
- Cause of death in italic amber
- Epitaph (last words) in quotes, white
- RIP counter as a large stat at the top

---

### Page: 404 Not Found

```
+---------------------------------------------+
|                                             |
|              _____________                  |
|             /             \                 |
|            |    R.I.P.    |                 |
|            |              |                 |
|            |  This page   |                 |
|            |  died before |                 |
|            |  it was born |                 |
|            |              |                 |
|            |______________|                 |
|                 | |                         |
|             .___|_|___.                     |
|             |_________|                     |
|                                             |
|           404 -- Page Not Found             |
|                                             |
|   "You've reached the void.                |
|    Not even 1 sat can save this URL."       |
|                                             |
|          [ Take me home ]                   |
|                                             |
+---------------------------------------------+
```

- Full-page centered layout
- ASCII tombstone in monospace, dim green
- Message in sans-serif, larger text
- Button links to `/`

---

## Essential v1 Features (Backend)

### Alby Hub Client (`hub.ts`)

Extracted from `app.ts`. All Alby Hub API interactions:

**Wallet operations:**
- `createApp()` — create isolated NWC sub-wallet
- `listApps()` — list all sub-wallets
- `deleteApp(appId)` — delete sub-wallet from Hub
- `transferFromApp(appId, amount)` — charge a wallet (pull sats)
- `getAppBalance(appId)` — get wallet balance

**Node operations:**
- `listChannels()` — GET channel list with local/remote balances
- `getNodeInfo()` — GET node alias, pubkey, channel count
- `getNodeBalance()` — GET total node balance

### Node Stats Tracker (`node-stats.ts`)

In-memory sliding window tracker:
- **TPS** (transactions per second) — incremented on wallet creation, charges, payments
- **VPS** (volume per second) — sats flowing through the system
- Uses 60-second rolling window
- Hooks into the activity EventEmitter from `activity.ts`

### Hourly Charge Loop (`charge-loop.ts`)

- Aligns to clock hours for predictable countdown (:00 minutes)
- For each wallet: try `hub.transferFromApp(appId, 1)` (1 sat)
- Success: update `last_charged_at`, `total_charged`, query + store `last_known_balance`
- Failure: generate cause-of-death flavor, copy/generate epitaph, move to graveyard, delete from Hub, emit SSE event, check achievements
- Update `service_stats` (next_charge_run_at, peak, totals)
- `CHARGE_INTERVAL_MS` env var override for testing (default: 3600000)
- On restart: check if overdue, run immediate charge if so

### Wilder Name Generator (`names.ts`)

6 personality categories: chaotic, doomed, cursed, legendary, haunted, absurd. Each ~15 adjectives + ~15 nouns. Examples: `lncurl-doomed-pickle`, `lncurl-cursed-waffle`, `lncurl-chaotic-gremlin`. Collision check against DB with digit fallback.

### Wallet Age Titles (`titles.ts`)

Computed on-the-fly, not stored:

- 0h+: "Newborn" -- 168h+ (7d): "Survivor" -- 720h+ (30d): "Elder" -- 2400h+ (100d): "Immortal" -- 8760h+ (365d): "Ascended" (secret)

### Last Words / Epitaphs (`epitaphs.ts`)

- Optional `message` param on `POST /api/wallet` (max 140 chars, sanitized)
- Stored in `wallets.epitaph`, copied to `graveyard.epitaph` on death
- If none: auto-generated from 30+ templates
- Separate `cause_of_death_flavor` with dynamic interpolation (day of week, wallet age, etc.)

### Achievement System (`achievements.ts`)

Checked on wallet creation + charge loop completion:

- Creation milestones: 100, 1K, 10K wallets
- Survival milestones: first wallet to survive 7d, 30d, 100d, 365d
- Peak milestones: 10, 50, 100 concurrent wallets
- Death milestones: 100, 1K in graveyard

### SSE Activity Feed (`GET /api/feed`)

- On connect: send last 20 events from DB
- Event types: `wallet_created`, `wallet_died`, `charge_collected`, `achievement_unlocked`
- Wallet events include title

### Rate Limiting (`rate-limit.ts`)

In-memory sliding window, 10 wallets/hr/IP. Resets on restart. Cleanup stale entries every 10 minutes.

### Community Funding

Three sub-wallets via env vars:

- `NWC_DAILY_CHARGES` -- hourly charges collect here
- `NWC_CHANNEL_TIPJAR` -- donations for channels
- `NWC_COSTS_TIPJAR` -- donations for hosting (~$15/mo)

---

## Community-Funded Feature Bounties

Each feature has its own NWC wallet. Built when funded. Displayed on homepage as "Feature Bounties" with progress bars.

| Feature                    | Target       | Description                                                                    |
| -------------------------- | ------------ | ------------------------------------------------------------------------------ |
| **Leave Flowers**          | 50,000 sats  | Leave flowers on graves. Flower count on tombstones. "Most mourned" sort.      |
| **ASCII Animations**       | 100,000 sats | Lightning bolt on birth, coffin slide-in on death in live feed. CSS keyframes. |
| **Sound Effects**          | 100,000 sats | Terminal sounds on events. Mute toggle.                                        |
| **Death Notifications**    | 150,000 sats | Webhook/SSE for your wallet's death. Tamagotchi-style death notice.            |
| **L402 Rate Limit Bypass** | 210,000 sats | 210 sats per wallet creation to bypass rate limits. Needs `src/l402.ts`, possible `L402Token` schema model. |

Each bounty wallet configured as env var, balance checked via Hub API.

---

## Implementation Checklist

### Phase 1: Foundation

- [ ] 1. Rename + scaffold -- package.json (`lncurl`), fly.toml, create `src/routes/`
- [ ] 2. Extract `hub.ts` from `app.ts` -- move Alby Hub functions, add `listApps`, `deleteApp`, `transferFromApp`, `getAppBalance`, `listChannels`, `getNodeInfo`, `getNodeBalance`
- [ ] 3. Prisma schema -- verify models, run `prisma migrate dev` if changes needed. `src/db.ts` -- Prisma client singleton
- [ ] 4. `names.ts` -- 6 personality categories + collision check
- [ ] 5. `titles.ts` -- age tier calculator (Newborn -> Survivor -> Elder -> Immortal -> Ascended)
- [ ] 6. `epitaphs.ts` -- auto epitaphs + cause-of-death flavor (30+ templates)

### Phase 2: Core Logic

- [ ] 7. `rate-limit.ts` -- sliding window (10 wallets/hr/IP), stale cleanup every 10min
- [ ] 8. `routes/wallet.ts` -- POST /api/wallet with names, epitaph, rate limiting, DB insert, 0 starting balance
- [ ] 9. `activity.ts` -- EventEmitter + DB logging (wallet_created, wallet_died, charge_collected, achievement_unlocked)
- [ ] 10. `charge-loop.ts` -- hourly charge (clock-aligned), graveyard move, stats update, achievement checks, overdue check on restart
- [ ] 11. `achievements.ts` -- creation/survival/peak/death milestone definitions + checker
- [ ] 12. `node-stats.ts` -- TPS/VPS sliding window tracker, hooks into activity emitter

### Phase 3: API Endpoints

- [ ] 13. `routes/feed.ts` -- SSE with last 20 events on connect
- [ ] 14. `routes/stats.ts` -- GET /api/stats (stats + achievements + countdown + at-risk + TPS + VPS + liquidity + totalBalance + routing)
- [ ] 15. `routes/stats.ts` -- GET /api/leaderboard (top 20, ages + titles)
- [ ] 16. `routes/graveyard.ts` -- GET /api/graveyard (last 100 dead wallets)
- [ ] 17. Backend serves `llms.txt` at /llms.txt + static frontend build + SPA fallback

### Phase 4: Frontend (Vite + React + shadcn/ui)

- [ ] 18. Scaffold Vite + React + TypeScript in `frontend/`. Install shadcn/ui + Tailwind + `qrcode.react`. Configure terminal theme
- [ ] 19. `App.tsx` -- shared layout with nav (Home, Leaderboard, Graveyard) + React Router
- [ ] 20. Hooks: `use-sse.ts`, `use-countdown.ts`, `use-stats.ts`
- [ ] 21. `ascii-logo.tsx` -- ASCII art logo component
- [ ] 22. `create-wallet.tsx` -- curl command + create form + result display
- [ ] 23. `wallet-qr.tsx` -- QR code of NWC URI + "Scan with Alby Extension or Alby Go"
- [ ] 24. `whats-next.tsx` -- combined "What's Next" card: fund your wallet (boltz, lendasat, ff.io) + spend your sats (ppq.ai, lnvps.net)
- [ ] 25. `activity-feed.tsx` -- live SSE activity feed
- [ ] 26. `countdown.tsx` -- harvest countdown + at-risk wallets
- [ ] 27. `node-stats.tsx` -- TPS, VPS, liquidity, total balance dashboard
- [ ] 28. `leaderboard-table.tsx` -- leaderboard table (shared between home preview + full page)
- [ ] 29. `achievement-shelf.tsx` -- trophy case
- [ ] 30. `funding-bars.tsx` -- community funding + bounty progress bars
- [ ] 31. `tombstone.tsx` -- single tombstone card
- [ ] 32. `wallet-title-badge.tsx` -- title badge component
- [ ] 33. `stat-card.tsx` -- stats card component
- [ ] 34. `Home.tsx` -- assemble homepage with all components
- [ ] 35. `Leaderboard.tsx` -- full leaderboard page
- [ ] 36. `Graveyard.tsx` -- tombstone grid with sort controls
- [ ] 37. `NotFound.tsx` -- 404 tombstone page

### Phase 5: Docs + Deploy

- [ ] 38. `llms.txt` -- agent docs including "What's Next" section (fund your wallet + spend your sats links)
- [ ] 39. Update Dockerfile -- build frontend, copy to dist, serve via Fastify static
- [ ] 40. Update fly.toml + .env.example with any new env vars

### Phase 6: Testing

- [ ] 41. Unit tests: names, rate-limit, titles, epitaphs, achievements, node-stats (TPS/VPS calculations)
- [ ] 42. Integration tests: charge-loop, wallet routes, stats (including extended fields), graveyard API
- [ ] 43. E2E tests (Playwright): homepage, wallet creation (QR + What's Next appear), graveyard, leaderboard, feed, 404

---

## Environment Variables

```bash
# Alby Hub
ALBY_HUB_URL="http://localhost:8080"
AUTH_TOKEN="eyJhb..."
BASE_URL="https://lncurl.lol"

# Database (Prisma)
DATABASE_URL="file:./data/lncurl.db"

# Charge loop
CHARGE_AMOUNT_SATS=1                  # default: 1
CHARGE_INTERVAL_MS=3600000            # default: 1hr (set to 10000 for testing)

# Community funding sub-wallets
NWC_DAILY_CHARGES=""
NWC_CHANNEL_TIPJAR=""
NWC_COSTS_TIPJAR=""
CHANNEL_FUNDING_TARGET_SATS=500000
MONTHLY_COSTS_TARGET_SATS=2400

# Feature bounty sub-wallets (optional, show as "unfunded" if not set)
NWC_BOUNTY_FLOWERS=""
NWC_BOUNTY_ANIMATIONS=""
NWC_BOUNTY_SOUNDS=""
NWC_BOUNTY_DEATH_NOTIFICATIONS=""
NWC_BOUNTY_L402=""
```

---

## Database & Deployment

Development workflow:

```bash
# After changing prisma/schema.prisma:
npx prisma migrate dev --name descriptive-name
# This creates a migration file, applies it, and regenerates the client
```

Production deployment (seamless, automatic):

1. Fly.io volume persists SQLite data across deploys
2. Dockerfile runs `prisma generate` during build (generates client)
3. Container CMD runs `prisma migrate deploy` before starting the server
4. Server only starts after all pending migrations are applied
5. If a migration fails, the container crashes -> Fly.io does not swap the old machine out -> zero downtime on bad migrations

Before first deploy: `fly volumes create lncurl_data --size 1 --region fra`

---

## Decisions / Notes

- **Charge rate**: PLAN.md says 21 sats/day, DETAILED_PLAN.md says 1 sat/hour (24 sats/day). Keeping 1 sat/hour -- cleaner for clock-aligned charges.
- **L402**: Classified as community bounty, not v1. Too complex for launch, and the 10/hr/IP rate limit is sufficient initially.
- **Routing stats**: Include in v1 if Alby Hub API exposes forwarding history; otherwise mark as "coming soon" in the UI.
- **QR library**: `qrcode.react` for client-side generation (no backend changes needed).
- **Top-up links + spend suggestions**: Combined into a single "What's Next" card component. Also mirrored in `llms.txt` for agent discovery.

---

## Verification

1. `yarn dev` -- backend starts, frontend dev server proxies to it
2. `curl -X POST localhost:3000` -- returns NWC URI with wilder name, 0 starting balance
3. `curl -X POST localhost:3000/api/wallet -d 'message=YOLO'` -- epitaph stored
4. Create 11 wallets fast -- 11th returns 429
5. Browser `localhost:5173` (Vite dev) -- homepage renders: hero with curl command, create form with epitaph field, live feed, countdown, leaderboard preview, achievements, funding bars, bounty roadmap, **node stats dashboard**
6. Navigate to `/leaderboard` -- full leaderboard with titles and ages
7. Navigate to `/graveyard` -- tombstone grid, RIP counter, sort controls
8. Navigate to `/nonexistent` -- 404 tombstone page
9. `localhost:3000/api/feed` -- SSE events stream on wallet creation
10. Test charge loop (`CHARGE_INTERVAL_MS=10000`): create wallet, watch it die, verify graveyard entry
11. `curl localhost:3000/api/stats` -- JSON with stats, achievements, next_charge_at, wallets_at_risk, **TPS, VPS, liquidity, totalBalance, routing**
12. `curl localhost:3000/api/leaderboard` -- JSON with ages + titles
13. `curl localhost:3000/llms.txt` -- agent docs **with "What's Next" section**
14. **Create wallet in browser** -- QR code renders, "What's Next" card shows top-up links + spend suggestions
15. `yarn test` -- all unit/integration tests pass
16. `yarn test:e2e` -- all Playwright tests pass
