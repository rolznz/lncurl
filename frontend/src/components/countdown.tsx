import { useCountdown } from "@/hooks/use-countdown";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { Stats } from "@/lib/api";

interface CountdownProps {
  stats: Stats | null;
}

export function Countdown({ stats }: CountdownProps) {
  const remaining = useCountdown(stats?.nextChargeAt ?? null);

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-mono text-muted-foreground">
          NEXT HARVEST
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="text-3xl font-mono font-bold text-danger">
          {remaining}
        </div>
        {stats?.walletsAtRisk && stats.walletsAtRisk.length > 0 && (
          <div>
            <p className="text-xs text-muted-foreground mb-1">AT RISK:</p>
            <div className="space-y-1">
              {stats.walletsAtRisk.map((w) => (
                <div
                  key={w.name}
                  className="font-mono text-xs text-danger flex items-center gap-1"
                >
                  <span>&#x2620;</span>
                  <span>{w.name}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
