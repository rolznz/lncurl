-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_wallets" (
    "name" TEXT NOT NULL PRIMARY KEY,
    "app_id" INTEGER NOT NULL,
    "app_pubkey" TEXT NOT NULL DEFAULT '',
    "created_at" INTEGER NOT NULL,
    "last_charged_at" INTEGER,
    "total_charged" INTEGER NOT NULL DEFAULT 0,
    "epitaph" TEXT,
    "last_known_balance" INTEGER,
    "creator_ip" TEXT
);
INSERT INTO "new_wallets" ("app_id", "created_at", "creator_ip", "epitaph", "last_charged_at", "last_known_balance", "name", "total_charged") SELECT "app_id", "created_at", "creator_ip", "epitaph", "last_charged_at", "last_known_balance", "name", "total_charged" FROM "wallets";
DROP TABLE "wallets";
ALTER TABLE "new_wallets" RENAME TO "wallets";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
