# Feedback Round 2 Implementation Plan

## Context

Second round of feedback on lncurl.lol. Six items: fix app naming after wallet creation, fetch real balances for funds/bounties via NWC, consolidate env vars, rename leaderboard column, add About/FAQ page, and add 3 new bounty entries.

---

## 1. Rename leaderboard column "Title" → "Tier"

**File:** `frontend/src/components/leaderboard-table.tsx:27`

- Change `<TableHead>Title</TableHead>` to `<TableHead>Tier</TableHead>`

---

## 2. Update Hub app name after LN address creation

**Files:** `src/hub.ts`, `src/routes/wallet.ts`

- Add `updateAppName(appId, name)` to `src/hub.ts` — PATCH `/api/apps/{appId}` with `{ name }`
- Non-critical: wrap in try/catch, log error but don't throw (wallet still works if this fails)
- Call it in `src/routes/wallet.ts` after `createLightningAddress()` succeeds, using the wallet name

---

## 3. About/FAQ page with custody warning

**Files:** `frontend/src/pages/About.tsx` (new), `frontend/src/App.tsx`

- New `/about` route with page containing:
  - Prominent custody warning card (border-danger styling): custodial service, single Hub, designed for agents/quick tests, link to Alby Hub for serious use
  - "How it works" section (create → fund → use → charged hourly → dies if broke)
  - FAQ section (what is NWC, how to fund, rate limits, what happens on death, can I recover)
  - Funding links (boltz.exchange, swap.lendasat.com, ff.io)
- Add "About" link to Nav bar (after Graveyard)
- Add `<Route path="/about">` before catch-all

---

## 4. Consolidate fund/bounty env vars + fetch real balances + add new bounties

This is the biggest change — items 2, 3, and 6 from the feedback are intertwined.

### 4a. New env var structure (`.env.example`)

Replace the 7 separate fund/bounty vars with single NWC URLs (each containing `&lud16=...`):

```
# Community funding sub-wallets (NWC URLs with &lud16=address@getalby.com)
NWC_FUND_CHANNELS=""
NWC_FUND_HOSTING=""
CHANNEL_FUNDING_TARGET_SATS=500000
MONTHLY_COSTS_TARGET_SATS=2400

# Feature bounty sub-wallets (NWC URLs with &lud16=address@getalby.com)
NWC_BOUNTY_L402=""
NWC_BOUNTY_TOPUP=""
NWC_BOUNTY_ROUTING_REWARDS=""
NWC_BOUNTY_NWC_APP_STORE=""
```

Remove old vars: `NWC_DAILY_CHARGES`, `NWC_CHANNEL_TIPJAR`, `NWC_COSTS_TIPJAR`, `COMMUNITY_FUND_ADDRESS_CHANNELS`, `COMMUNITY_FUND_ADDRESS_HOSTING`, `BOUNTY_ADDRESS_L402`

### 4b. Add `@getalby/sdk` dependency

`yarn add @getalby/sdk` — provides `nwc.NWCClient` for NWC protocol balance queries.

### 4c. New balance service: `src/nwc-balances.ts`

- `parseLud16(nwcUrl)` — extract `lud16` query param from NWC URL
- `loadFundConfigs()` — build fund/bounty config arrays from env vars
- `getFundBalances()` — for each configured NWC URL, connect via `NWCClient.getBalance()`, return `{ communityFunds, bounties }` with real `balanceSats`
- 60-second cache to avoid hammering Hub on every stats poll
- Bounties without NWC URL still appear with `balanceSats: 0` and no lud16

Bounty definitions (hardcoded labels + targets):
| Key | Label | Target |
|-----|-------|--------|
| `l402` | L402 Rate Bypass | 210,000 |
| `topup` | Direct Topup (Lendasat + Fixed Float) | 500,000 |
| `routing_rewards` | Routing Earnings Rewards | 500,000 |
| `nwc_app_store` | NWC App Store | 210,000 |

### 4d. Update stats API: `src/routes/stats.ts`

Replace `communityFundAddresses` + `bountyAddresses` with call to `getFundBalances()`:

```
communityFunds: Array<{ key, label, lud16, balanceSats, targetSats }>
bounties: Array<{ key, label, lud16, balanceSats, targetSats }>
```

### 4e. Update frontend API types: `frontend/src/lib/api.ts`

Replace `communityFundAddresses`/`bountyAddresses` fields in `Stats` with `communityFunds`/`bounties` arrays using new `FundEntry` interface.

### 4f. Rewrite FundingBars: `frontend/src/components/funding-bars.tsx`

- Remove hardcoded `communityFunds` and `bounties` arrays
- Map over `stats.communityFunds` and `stats.bounties` from API
- Use `balanceSats` for progress bar current value, `targetSats` for target
- Use `lud16` for the payment link (show only when non-empty)

---

## Files Changed Summary

| File                                            | Type           | Items |
| ----------------------------------------------- | -------------- | ----- |
| `frontend/src/components/leaderboard-table.tsx` | Edit           | 1     |
| `src/hub.ts`                                    | Edit           | 2     |
| `src/routes/wallet.ts`                          | Edit           | 2     |
| `frontend/src/pages/About.tsx`                  | New            | 3     |
| `frontend/src/App.tsx`                          | Edit           | 3     |
| `.env.example`                                  | Edit           | 4     |
| `package.json`                                  | Edit (add dep) | 4     |
| `src/nwc-balances.ts`                           | New            | 4     |
| `src/routes/stats.ts`                           | Edit           | 4     |
| `frontend/src/lib/api.ts`                       | Edit           | 4     |
| `frontend/src/components/funding-bars.tsx`      | Edit           | 4     |

## Verification

1. `yarn build` — check both backend and frontend compile
2. `yarn typecheck` — no TS errors
3. `yarn dev` — verify locally:
   - Create a wallet → check Hub app name matches wallet name
   - Visit `/about` → custody warning visible, FAQ readable
   - Visit `/leaderboard` → column says "Tier"
   - Homepage funding bars show bounty entries (0 balance without NWC URLs configured, real balances with them)
