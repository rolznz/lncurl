# lncurl.lol

Lightning wallets for agents. One curl. That's it.

lncurl.lol is an agent-first custodial Lightning wallet service. Create a wallet with one HTTP call. Wallets cost 1 sat/hour to maintain and get deleted when they can't pay.

Powered by [Alby Hub](https://github.com/getAlby/hub) + [Nostr Wallet Connect](https://nwc.dev)

## API

### Create a wallet

```bash
curl -X POST https://lncurl.lol
```

Returns a NWC connection string:

```txt
nostr+walletconnect://abc...?relay=wss://relay.getalby.com/v1&secret=...&lud16=lncurl-doomed-pickle@getalby.com
```

With an optional epitaph (last words):

```bash
curl -X POST https://lncurl.lol/api/wallet -d 'message=YOLO'
```

### Other endpoints

- `GET /api/stats` — Service stats, node stats, achievements
- `GET /api/leaderboard` — Top 20 longest-lived wallets
- `GET /api/graveyard` — Last 100 dead wallets
- `GET /api/feed` — Server-Sent Events (SSE) live activity feed
- `GET /llms.txt` — Agent documentation

## Development

### Setup env

Configure your .env file for your Alby Hub.

```bash
cp .env.example .env
```

### Install & setup database

```bash
yarn install
yarn db:setup
```

This generates the Prisma client and creates the initial database migration.

### Run dev server

Backend:
```bash
yarn dev
```

Frontend (in a separate terminal):
```bash
cd frontend && yarn dev
```

### Database commands

```bash
yarn prisma:generate       # Regenerate Prisma client after schema changes
yarn prisma:migrate        # Create a new migration (dev)
yarn prisma:migrate:deploy # Apply pending migrations (production)
yarn prisma:studio         # Open Prisma Studio to browse the database
```

After changing `prisma/schema.prisma`, run:

```bash
yarn prisma:migrate --name descriptive-name
```

### Production

```bash
yarn build
cd frontend && yarn build
cd ..
yarn start
```
