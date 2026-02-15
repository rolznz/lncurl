# Plan: Replace better-sqlite3 with Prisma + Fix Fly.io Persistence

## Context

The DETAILED_PLAN.md has critical gaps around database persistence and migrations:

- No Fly.io volume mount (SQLite data lost on every deploy)
- No migration strategy (just "SQLite setup + all tables")
- `min_machines_running = 0` but the charge loop needs to stay alive
- `better-sqlite3` has no built-in migration tooling

The user is familiar with Prisma and wants to use it. This plan updates the project to use Prisma ORM with SQLite, adds proper Fly.io volume configuration, and ensures seamless deployments with automatic migrations.

---

## Changes

### 1. Update `docs/DETAILED_PLAN.md` — Database Section

Replace all references to `better-sqlite3` with Prisma:

**Architecture Overview** — Change:

- `SQLite via better-sqlite3` → `SQLite via Prisma ORM`

**File Structure** — Change:

- Remove `db.ts` (Prisma replaces it)
- Add `prisma/schema.prisma` and `prisma/migrations/` directory
- Add `src/db.ts` as a thin Prisma client singleton (standard pattern)

**Database Schema** — Replace raw SQL with Prisma schema:

```prisma
datasource db {
  provider = "sqlite"
  url      = env("DATABASE_URL")
}

generator client {
  provider = "prisma-client-js"
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

**Environment Variables** — Change:

- Remove `DB_PATH="./data/lncurl.db"`
- Add `DATABASE_URL="file:./data/lncurl.db"` (dev) / `DATABASE_URL="file:/data/lncurl.db"` (production)

**Implementation Order — Phase 1** — Change step 3:

- Old: `db.ts — SQLite setup with all tables from schema`
- New: `prisma/schema.prisma — Define all models. Run prisma migrate dev to create initial migration. src/db.ts — Prisma client singleton.`

**Dependencies** — Change:

- Remove: `better-sqlite3`, `@types/better-sqlite3`
- Add: `prisma` (devDep), `@prisma/client` (dep)

### 2. Update `docs/DETAILED_PLAN.md` — Fly.io Deployment Section

Add a new section after Environment Variables:

**Database & Deployment**

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
5. If a migration fails, the container crashes → Fly.io does not swap the old machine out → zero downtime on bad migrations

### 3. Update `fly.toml`

```toml
app = 'lncurl'
primary_region = 'fra'

[build]

[env]
  BASE_URL = "https://lncurl.lol"
  DATABASE_URL = "file:/data/lncurl.db"

[http_service]
  internal_port = 3000
  force_https = true
  auto_stop_machines = 'stop'
  auto_start_machines = true
  min_machines_running = 1        # charge loop must stay alive
  processes = ['app']

[mounts]
  source = "lncurl_data"
  destination = "/data"

[[vm]]
  memory = '512mb'
  cpus = 1
```

Before first deploy: `fly volumes create lncurl_data --size 1 --region fra`

### 4. Update `Dockerfile`

```dockerfile
# syntax = docker/dockerfile:1
ARG NODE_VERSION=22.17.0
FROM node:${NODE_VERSION}-slim AS base

LABEL fly_launch_runtime="Node.js"
WORKDIR /app
ENV NODE_ENV="production"
ARG YARN_VERSION=1.22.22
RUN npm install -g yarn@$YARN_VERSION --force

# Build stage
FROM base AS build
RUN apt-get update -qq && \
    apt-get install --no-install-recommends -y build-essential node-gyp pkg-config python-is-python3

COPY package.json yarn.lock ./
RUN yarn install --frozen-lockfile --production=false

COPY . .
RUN npx prisma generate
RUN yarn run build
RUN yarn install --production=true

# Final stage
FROM base
COPY --from=build /app /app

EXPOSE 3000
CMD ["sh", "-c", "npx prisma migrate deploy && yarn run start"]
```

Key points:

- `prisma generate` runs during build (generates the client code)
- `prisma migrate deploy` runs at container start (applies pending migrations)
- Production `yarn install` keeps `@prisma/client` but strips `prisma` CLI... actually we need `prisma` available at runtime for `migrate deploy`. Two options:
  - Keep prisma as a regular dependency (not devDep) — simplest
  - Or copy the prisma binary from build stage

Simplest: make `prisma` a regular dependency so it's available at runtime.

### 5. Update `package.json` dependencies

```json
{
  "dependencies": {
    "@fastify/cors": "^11.2.0",
    "@fastify/formbody": "^8.0.2",
    "@fastify/static": "^9.0.0",
    "@prisma/client": "^6.0.0",
    "dotenv": "^17.2.3",
    "fastify": "^5.6.2",
    "prisma": "^6.0.0"
  }
}
```

Note: `prisma` is in `dependencies` (not devDependencies) so `prisma migrate deploy` works in the production container.

### 6. Add `src/db.ts` — Prisma Client Singleton

```typescript
import { PrismaClient } from "@prisma/client";

export const prisma = new PrismaClient();
```

This replaces the old `db.ts` that would have done raw SQLite setup.

---

## Files to Modify

| File                    | Action                                                           |
| ----------------------- | ---------------------------------------------------------------- |
| `docs/DETAILED_PLAN.md` | Update database references, add deployment section               |
| `fly.toml`              | Add `[mounts]`, set `min_machines_running = 1`, update env       |
| `Dockerfile`            | Add `prisma generate` build step, `prisma migrate deploy` in CMD |
| `package.json`          | Add prisma + @prisma/client, remove better-sqlite3               |
| `prisma/schema.prisma`  | New file — Prisma schema definition                              |
| `src/db.ts`             | New file — Prisma client singleton                               |

---

## Verification

1. `npx prisma migrate dev --name init` — creates initial migration, applies it, generates client
2. `npx prisma studio` — opens browser UI to inspect the database
3. `yarn dev` — server starts with working Prisma client
4. `docker build -t lncurl .` — build succeeds with prisma generate
5. `fly deploy` — deploys, runs `prisma migrate deploy`, starts server with persistent volume
6. After a schema change: `npx prisma migrate dev --name add-xyz` locally, then `fly deploy` automatically applies it in production
