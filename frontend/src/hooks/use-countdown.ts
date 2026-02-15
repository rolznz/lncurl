import { useEffect, useState } from "react";

export function useCountdown(targetTimestamp: number | null) {
  const [remaining, setRemaining] = useState("");

  useEffect(() => {
    if (!targetTimestamp) {
      setRemaining("--:--");
      return;
    }

    function tick() {
      const now = Math.floor(Date.now() / 1000);
      const diff = (targetTimestamp as number) - now;
      if (diff <= 0) {
        setRemaining("NOW");
        return;
      }
      const m = Math.floor(diff / 60);
      const s = diff % 60;
      setRemaining(`${m}m ${String(s).padStart(2, "0")}s`);
    }

    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [targetTimestamp]);

  return remaining;
}
