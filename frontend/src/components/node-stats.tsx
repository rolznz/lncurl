import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import type { Stats } from "@/lib/api";

interface NodeStatsProps {
  stats: Stats | null;
}

export function NodeStats({ stats }: NodeStatsProps) {
  if (!stats) return null;

  const totalLiquidity = stats.liquidity.available + stats.liquidity.used;
  const liquidityPercent =
    totalLiquidity > 0
      ? Math.round((stats.liquidity.available / totalLiquidity) * 100)
      : 0;

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-mono text-muted-foreground">
          NODE STATS
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <div className="text-muted-foreground text-xs">TPS</div>
            <div className="font-mono text-terminal font-bold">
              {stats.tps.toFixed(2)}
            </div>
          </div>
          <div>
            <div className="text-muted-foreground text-xs">VPS</div>
            <div className="font-mono text-terminal font-bold">
              {stats.vps.toFixed(0)} sats/s
            </div>
          </div>
          <div>
            <div className="text-muted-foreground text-xs">Balance</div>
            <div className="font-mono text-foreground font-bold">
              {stats.totalBalance.toLocaleString()} sats
            </div>
          </div>
          <div>
            <div className="text-muted-foreground text-xs">Channels</div>
            <div className="font-mono text-foreground font-bold">
              {stats.liquidity.channels}
            </div>
          </div>
        </div>
        <div>
          <div className="flex justify-between text-xs text-muted-foreground mb-1">
            <span>Liquidity</span>
            <span>
              {stats.liquidity.available.toLocaleString()} /{" "}
              {totalLiquidity.toLocaleString()} sats
            </span>
          </div>
          <Progress value={liquidityPercent} className="h-2" />
        </div>
      </CardContent>
    </Card>
  );
}
