import { useEffect, useState } from "react";
import { fetchStats, type Stats } from "@/lib/api";

export function useStats(pollInterval = 15_000) {
  const [stats, setStats] = useState<Stats | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const data = await fetchStats();
        if (!cancelled) setStats(data);
      } catch {
        // ignore
      }
    }

    load();
    const interval = setInterval(load, pollInterval);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [pollInterval]);

  return stats;
}
