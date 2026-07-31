-- AlterTable
ALTER TABLE "wallets" ADD COLUMN "wallet_pubkey" TEXT NOT NULL DEFAULT '';
ALTER TABLE "wallets" ADD COLUMN "relays_json" TEXT NOT NULL DEFAULT '[]';

-- AlterTable
ALTER TABLE "graveyard" ADD COLUMN "wallet_pubkey" TEXT;
ALTER TABLE "graveyard" ADD COLUMN "closure_event_id" TEXT;

-- CreateTable
CREATE TABLE "nostr_publishes" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "kind" INTEGER NOT NULL,
    "event_json" TEXT NOT NULL,
    "relays_json" TEXT NOT NULL,
    "published_relays_json" TEXT NOT NULL DEFAULT '[]',
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "created_at" INTEGER NOT NULL,
    "last_attempt_at" INTEGER,
    "last_error" TEXT
);

-- CreateIndex
CREATE INDEX "nostr_publishes_kind_idx" ON "nostr_publishes"("kind");
