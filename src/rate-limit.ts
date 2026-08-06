import { getRuntimeSettings } from "./settings.js";

const WINDOW_MS = 60 * 60 * 1000; // 1 hour

const ipTimestamps = new Map<string, number[]>();
let cleanupTimer: ReturnType<typeof setTimeout> | null = null;

export function checkRateLimit(ip: string): { allowed: boolean; remaining: number } {
  const maxWallets = getRuntimeSettings().rateLimitPerHour;
  const now = Date.now();
  const cutoff = now - WINDOW_MS;

  let timestamps = ipTimestamps.get(ip) || [];
  timestamps = timestamps.filter((t) => t > cutoff);

  if (timestamps.length >= maxWallets) {
    ipTimestamps.set(ip, timestamps);
    return { allowed: false, remaining: 0 };
  }

  timestamps.push(now);
  ipTimestamps.set(ip, timestamps);
  return { allowed: true, remaining: maxWallets - timestamps.length };
}

function cleanupStaleEntries() {
  const now = Date.now();
  const cutoff = now - WINDOW_MS;

  for (const [ip, timestamps] of ipTimestamps) {
    const active = timestamps.filter((t) => t > cutoff);
    if (active.length === 0) {
      ipTimestamps.delete(ip);
    } else {
      ipTimestamps.set(ip, active);
    }
  }
}

function scheduleCleanup() {
  cleanupTimer = setTimeout(() => {
    cleanupStaleEntries();
    scheduleCleanup();
  }, getRuntimeSettings().rateLimitCleanupMs);
}

export function rescheduleRateLimitCleanup() {
  if (cleanupTimer) clearTimeout(cleanupTimer);
  scheduleCleanup();
}
