import { prisma } from "./db.js";
import { transferFromApp, getAppBalance, deleteApp } from "./hub.js";
import { emitActivity } from "./activity.js";
import { getRandomEpitaph, generateCauseOfDeathFlavor } from "./epitaphs.js";
import { checkAchievements } from "./achievements.js";
import { getRuntimeSettings } from "./settings.js";

let chargeTimer: ReturnType<typeof setTimeout> | null = null;
let isRunning = false;

function getNextAlignedTime(): number {
  const intervalMs = getRuntimeSettings().chargeIntervalMs;
  if (intervalMs < 60000) {
    // For testing with short intervals, don't align
    return Date.now() + intervalMs;
  }
  return Math.ceil((Date.now() + 1) / intervalMs) * intervalMs;
}

async function runChargeLoop() {
  if (isRunning) {
    console.warn("[charge-loop] Already running, skipping overlapping run");
    return;
  }
  isRunning = true;
  try {
    await doChargeLoop();
  } catch (err) {
    console.error("[charge-loop] Charge run failed:", err);
  } finally {
    isRunning = false;
  }
}

async function doChargeLoop() {
  console.log("[charge-loop] Starting charge run...");
  const settings = getRuntimeSettings();
  const wallets = await prisma.wallet.findMany();
  let charged = 0;
  let died = 0;

  for (const wallet of wallets) {
    // Skip wallets still in their grace period
    const ageSeconds = Math.floor(Date.now() / 1000) - wallet.createdAt;
    if (ageSeconds < settings.gracePeriodSeconds) {
      console.log(`[charge-loop] Wallet ${wallet.name} is ${ageSeconds}s old, still in grace period, skipping`);
      continue;
    }

    // Check balance first to decide if the wallet should die
    let balance: number;
    try {
      const appInfo = await getAppBalance(wallet.appPubkey);
      balance = Math.floor(appInfo.balance / 1000); // convert msat → sat
    } catch (err) {
      console.error(
        `[charge-loop] Failed to get balance for ${wallet.name}, skipping:`,
        err,
      );
      continue;
    }

    await prisma.wallet.update({
      where: { name: wallet.name },
      data: { lastKnownBalance: balance },
    });

    if (balance < settings.chargeAmountSats) {
      // Wallet is empty — reap it
      console.log(
        `[charge-loop] Wallet ${wallet.name} has 0 balance, reaping...`,
      );

      const causeOfDeathFlavor = generateCauseOfDeathFlavor(
        wallet.createdAt,
        wallet.totalCharged,
      );

      await prisma.graveyard.create({
        data: {
          name: wallet.name,
          createdAt: wallet.createdAt,
          deletedAt: Math.floor(Date.now() / 1000),
          causeOfDeath: "insufficient_funds",
          causeOfDeathFlavor,
          totalCharged: wallet.totalCharged,
          epitaph: wallet.epitaph || getRandomEpitaph(),
        },
      });

      await prisma.wallet.delete({ where: { name: wallet.name } });

      try {
        await deleteApp(wallet.appPubkey);
      } catch (e) {
        console.error(`[charge-loop] Failed to delete app ${wallet.appPubkey}:`, e);
      }

      await emitActivity(
        "wallet_died",
        wallet.name,
        undefined,
        `${wallet.name} was reaped — ${causeOfDeathFlavor}`,
      );

      await prisma.serviceStats.upsert({
        where: { id: 1 },
        create: { id: 1, totalWalletsDied: 1 },
        update: { totalWalletsDied: { increment: 1 } },
      });

      died++;
      continue;
    }

    // Wallet has funds — charge it
    try {
      await transferFromApp(wallet.appId, settings.chargeAmountSats);

      await prisma.wallet.update({
        where: { name: wallet.name },
        data: {
          lastChargedAt: Math.floor(Date.now() / 1000),
          totalCharged: { increment: settings.chargeAmountSats },
          lastKnownBalance: balance - settings.chargeAmountSats,
        },
      });
      charged++;
    } catch (err) {
      console.error(
        `[charge-loop] Failed to charge ${wallet.name}, skipping:`,
        err,
      );
    }
  }

  if (charged > 0) {
    await emitActivity(
      "charge_collected",
      undefined,
      charged * settings.chargeAmountSats,
      `${settings.chargeAmountSats} sat collected from ${charged} wallets`,
    );

    await prisma.serviceStats.upsert({
      where: { id: 1 },
      create: { id: 1, totalChargesCollected: charged * settings.chargeAmountSats },
      update: {
        totalChargesCollected: { increment: charged * settings.chargeAmountSats },
      },
    });
  }

  const nextRun = getNextAlignedTime();
  await prisma.serviceStats.upsert({
    where: { id: 1 },
    create: {
      id: 1,
      lastChargeRunAt: Math.floor(Date.now() / 1000),
      nextChargeRunAt: Math.floor(nextRun / 1000),
    },
    update: {
      lastChargeRunAt: Math.floor(Date.now() / 1000),
      nextChargeRunAt: Math.floor(nextRun / 1000),
    },
  });

  console.log(
    `[charge-loop] Done. Charged: ${charged}, Died: ${died}. Next run: ${new Date(nextRun).toISOString()}`,
  );

  await checkAchievements();

  scheduleNext(nextRun);
}

function scheduleNext(nextRunTime: number) {
  const delay = Math.max(nextRunTime - Date.now(), 1000);
  chargeTimer = setTimeout(runChargeLoop, delay);
}

export async function startChargeLoop() {
  // Check if overdue on startup
  const stats = await prisma.serviceStats.findUnique({ where: { id: 1 } });
  const now = Math.floor(Date.now() / 1000);

  if (stats?.nextChargeRunAt && stats.nextChargeRunAt <= now) {
    console.log(
      "[charge-loop] Overdue charge detected, running immediately...",
    );
    await runChargeLoop();
  } else {
    const nextRun = stats?.nextChargeRunAt
      ? stats.nextChargeRunAt * 1000
      : getNextAlignedTime();
    console.log(
      `[charge-loop] Next run scheduled: ${new Date(nextRun).toISOString()}`,
    );
    scheduleNext(nextRun);
  }
}

export function stopChargeLoop() {
  if (chargeTimer) {
    clearTimeout(chargeTimer);
    chargeTimer = null;
  }
}

export async function rescheduleChargeLoop() {
  stopChargeLoop();
  if (isRunning) return;
  const nextRun = getNextAlignedTime();
  await prisma.serviceStats.upsert({
    where: { id: 1 },
    create: { id: 1, nextChargeRunAt: Math.floor(nextRun / 1000) },
    update: { nextChargeRunAt: Math.floor(nextRun / 1000) },
  });
  scheduleNext(nextRun);
}
