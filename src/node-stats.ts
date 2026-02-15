import { activityEmitter, type ActivityEvent } from "./activity.js";
import { listChannels, getNodeBalance } from "./hub.js";

const WINDOW_MS = 60_000; // 60-second rolling window

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

export async function getLiquidity(): Promise<{
  available: number;
  used: number;
  channels: number;
}> {
  try {
    const { channels } = await listChannels();
    let available = 0;
    let used = 0;
    for (const ch of channels) {
      available += ch.remoteBalance;
      used += ch.localBalance;
    }
    return { available, used, channels: channels.length };
  } catch {
    return { available: 0, used: 0, channels: 0 };
  }
}

export async function getTotalBalance(): Promise<number> {
  try {
    const { totalBalance } = await getNodeBalance();
    return totalBalance;
  } catch {
    return 0;
  }
}

export function initNodeStats() {
  activityEmitter.on("activity", (event: ActivityEvent) => {
    const sats = event.amountSats ?? (event.type === "wallet_created" ? 0 : 1);
    events.push({ time: Date.now(), sats });
  });
}
