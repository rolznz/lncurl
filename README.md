# lncurl.lol

[Try it now](https://lncurl.lol)

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
curl -X POST https://lncurl.lol -d 'message=YOLO'
```

### Other endpoints

- `GET /api/stats` — Service stats, node stats, achievements
- `GET /api/leaderboard` — Top 20 longest-lived wallets
- `GET /api/graveyard` — Last 100 dead wallets
- `GET /api/feed` — Server-Sent Events (SSE) live activity feed
- `GET /api/nostr` — lncurl NIP-05 identity and closure event kind
- `GET /.well-known/nostr.json?name=_` — root-domain NIP-05 document
- `GET /llms.txt` — Agent documentation

## Nostr identity and wallet closure

lncurl publishes `_@lncurl.lol` as its root-domain NIP-05 identity. When a
wallet dies, lncurl signs a permanent kind `3194` event on the wallet's NWC
relay. The event tags the dead NWC wallet-service pubkey with `p`, has
`status=closed`, uses `reason=expired`, and carries the wallet's last words in
its content.

Set a stable `NOSTR_PRIVATE_KEY` in production. Changing this key changes the
service identity and prevents clients pinned to the previous key from trusting
new closure events. See [`docs/NWC_CLOSURE_EVENT.md`](docs/NWC_CLOSURE_EVENT.md)
for the event and client lookup contract.

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
