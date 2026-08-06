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

## Umbrel

`umbrel/lncurl` is the canonical Umbrel package. It depends on Alby Hub and
keeps LNCurl data under its own app directory; it does not mount Alby Hub data.
The Umbrel-proxy-only settings page exposes charge, grace-period, and rate-limit
controls when `UNSAFE_PUBLIC_SETTINGS=true`.

### Publish an official image

After merging the Umbrel integration into `rolznz/lncurl`, publish the initial
package image with `v0.1.0` (then use later version tags for updates):

```bash
git tag v0.1.0
git push origin v0.1.0
```

The existing `Publish container image` workflow publishes `linux/amd64` and
`linux/arm64` images to `ghcr.io/rolznz/lncurl`. Copy the digest shown in that
workflow into `umbrel/lncurl/docker-compose.yml` as
`ghcr.io/rolznz/lncurl:X.Y.Z@sha256:…`, bump `umbrel-app.yml`'s version, and
submit that package to the official Umbrel App Store. The LaWallet store is a
temporary test deployment and is not the canonical publisher.
