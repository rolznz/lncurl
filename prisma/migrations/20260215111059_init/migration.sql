-- CreateTable
CREATE TABLE "wallets" (
    "name" TEXT NOT NULL PRIMARY KEY,
    "app_id" TEXT NOT NULL,
    "created_at" INTEGER NOT NULL,
    "last_charged_at" INTEGER,
    "total_charged" INTEGER NOT NULL DEFAULT 0,
    "epitaph" TEXT,
    "last_known_balance" INTEGER,
    "creator_ip" TEXT
);

-- CreateTable
CREATE TABLE "graveyard" (
    "name" TEXT NOT NULL PRIMARY KEY,
    "created_at" INTEGER NOT NULL,
    "deleted_at" INTEGER NOT NULL,
    "cause_of_death" TEXT NOT NULL,
    "cause_of_death_flavor" TEXT,
    "total_charged" INTEGER NOT NULL DEFAULT 0,
    "epitaph" TEXT,
    "flowers" INTEGER NOT NULL DEFAULT 0
);

-- CreateTable
CREATE TABLE "activity" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "type" TEXT NOT NULL,
    "wallet_name" TEXT,
    "amount_sats" INTEGER,
    "message" TEXT,
    "created_at" INTEGER NOT NULL
);

-- CreateTable
CREATE TABLE "achievements" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "unlocked_at" INTEGER NOT NULL,
    "wallet_name" TEXT
);

-- CreateTable
CREATE TABLE "service_stats" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT DEFAULT 1,
    "total_wallets_created" INTEGER NOT NULL DEFAULT 0,
    "total_wallets_died" INTEGER NOT NULL DEFAULT 0,
    "total_charges_collected" INTEGER NOT NULL DEFAULT 0,
    "peak_concurrent_wallets" INTEGER NOT NULL DEFAULT 0,
    "last_charge_run_at" INTEGER,
    "next_charge_run_at" INTEGER
);
