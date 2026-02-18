import { activityEmitter, type ActivityEvent } from "./activity.js";
import { listChannels, getNodeBalance } from "./hub.js";

const WINDOW_MS = 60_000; // 60-second rolling window
const STATS_CACHE_TTL_MS = 30_000; // 30-second cache for Hub API calls

interface TimestampedEvent {
  time: number;
  sats: number;
}

const events: TimestampedEvent[] = [];

function pruneOldEvents() {
  const cutoff = Date.now() - WINDOW_MS;
  while (events.length > 0 && events[0].time < cutoff) {
    events.shift();
  }
}

export function getTPS(): number {
  pruneOldEvents();
  return events.length / (WINDOW_MS / 1000);
}

export function getVPS(): number {
  pruneOldEvents();
  const totalSats = events.reduce((sum, e) => sum + e.sats, 0);
  return totalSats / (WINDOW_MS / 1000);
}

type Cached<T> = { value: T; timestamp: number };

let liquidityCache: Cached<{ available: number; used: number; channels: number }> | null = null;
let balancesCache: Cached<{ totalSpendable: number; onchainTotal: number }> | null = null;

export async function getLiquidity(): Promise<{
  available: number;
  used: number;
  channels: number;
}> {
  if (liquidityCache && Date.now() - liquidityCache.timestamp < STATS_CACHE_TTL_MS) {
    return liquidityCache.value;
  }
  try {
    const channels = await listChannels();
    let available = 0;
    let used = 0;
    for (const ch of channels) {
      // AlbyHub returns millisats — convert to sats
      available += Math.floor(ch.remoteBalance / 1000);
      used += Math.floor(ch.localBalance / 1000);
    }
    const value = { available, used, channels: channels.length };
    liquidityCache = { value, timestamp: Date.now() };
    return value;
  } catch (err) {
    console.error("[node-stats] Failed to fetch liquidity:", err);
    return liquidityCache?.value ?? { available: 0, used: 0, channels: 0 };
  }
}

export async function getBalances(): Promise<{ totalSpendable: number; onchainTotal: number }> {
  if (balancesCache && Date.now() - balancesCache.timestamp < STATS_CACHE_TTL_MS) {
    return balancesCache.value;
  }
  try {
    const { totalSpendable, onchainTotal } = await getNodeBalance();
    const value = { totalSpendable: totalSpendable ?? 0, onchainTotal: onchainTotal ?? 0 };
    balancesCache = { value, timestamp: Date.now() };
    return value;
  } catch (err) {
    console.error("[node-stats] Failed to fetch balances:", err);
    return balancesCache?.value ?? { totalSpendable: 0, onchainTotal: 0 };
  }
}

export function initNodeStats() {
  activityEmitter.on("activity", (event: ActivityEvent) => {
    const sats = event.amountSats ?? (event.type === "wallet_created" ? 0 : 1);
    events.push({ time: Date.now(), sats });
  });
}
