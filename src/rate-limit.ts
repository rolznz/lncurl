const MAX_WALLETS_PER_HOUR = 10;
const WINDOW_MS = 60 * 60 * 1000; // 1 hour
const CLEANUP_INTERVAL_MS = 10 * 60 * 1000; // 10 minutes

const ipTimestamps = new Map<string, number[]>();

export function checkRateLimit(ip: string): { allowed: boolean; remaining: number } {
  const now = Date.now();
  const cutoff = now - WINDOW_MS;

  let timestamps = ipTimestamps.get(ip) || [];
  timestamps = timestamps.filter((t) => t > cutoff);

  if (timestamps.length >= MAX_WALLETS_PER_HOUR) {
    ipTimestamps.set(ip, timestamps);
    return { allowed: false, remaining: 0 };
  }

  timestamps.push(now);
  ipTimestamps.set(ip, timestamps);
  return { allowed: true, remaining: MAX_WALLETS_PER_HOUR - timestamps.length };
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

// Start cleanup interval
setInterval(cleanupStaleEntries, CLEANUP_INTERVAL_MS);
