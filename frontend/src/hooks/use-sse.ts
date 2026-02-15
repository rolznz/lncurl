import { useEffect, useRef, useState } from "react";
import type { ActivityEvent } from "@/lib/api";

export function useSSE(maxEvents = 50) {
  const [events, setEvents] = useState<ActivityEvent[]>([]);
  const esRef = useRef<EventSource | null>(null);

  useEffect(() => {
    const es = new EventSource("/api/feed");
    esRef.current = es;

    es.onmessage = (e) => {
      try {
        const event: ActivityEvent = JSON.parse(e.data);
        setEvents((prev) => [event, ...prev].slice(0, maxEvents));
      } catch {
        // ignore
      }
    };

    return () => {
      es.close();
      esRef.current = null;
    };
  }, [maxEvents]);

  return events;
}
