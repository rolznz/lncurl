import { useSSE } from "@/hooks/use-sse";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function ActivityFeed() {
  const events = useSSE(30);

  return (
    <Card className="h-full">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-mono text-muted-foreground flex items-center gap-2">
          <span className="inline-block w-2 h-2 rounded-full bg-terminal animate-pulse" />
          LIVE FEED
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4 pt-0">
        <div className="space-y-1 max-h-64 overflow-y-auto font-mono text-xs">
          {events.length === 0 && (
            <p className="text-muted-foreground">Waiting for events...</p>
          )}
          {events.map((e) => (
            <div key={e.id} className="flex gap-2">
              <span className="text-terminal shrink-0">&gt;</span>
              <span
                className={
                  e.type === "wallet_died"
                    ? "text-danger"
                    : e.type === "achievement_unlocked"
                      ? "text-chart-4"
                      : "text-foreground"
                }
              >
                {e.message}
              </span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
