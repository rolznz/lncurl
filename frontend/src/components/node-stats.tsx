import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import type { Stats } from "@/lib/api";

interface NodeStatsProps {
  stats: Stats | null;
}

export function NodeStats({ stats }: NodeStatsProps) {
  if (!stats) return null;

  const liquidity = stats.liquidity ?? { available: 0, used: 0, channels: 0 };
  const tps = stats.tps ?? 0;
  const vps = stats.vps ?? 0;
  const totalSpendable = stats.totalSpendable ?? 0;
  const onchainBalance = stats.onchainBalance ?? 0;

  const totalLiquidity = liquidity.available + liquidity.used;
  const liquidityPercent =
    totalLiquidity > 0
      ? Math.round((liquidity.available / totalLiquidity) * 100)
      : 0;

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-mono text-muted-foreground flex items-center justify-between">
          <span>NODE STATS</span>
          {stats.nodePubkey && (
            <a
              href={`https://amboss.space/node/${stats.nodePubkey}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-terminal hover:underline text-xs"
            >
              View on Amboss &rarr;
            </a>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div />
        <div className="grid grid-cols-2 gap-3 text-sm">
          {/* <TooltipProvider>
            <div>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="text-muted-foreground text-xs cursor-help w-fit">
                    TPS
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  Transactions Per Second across the node
                </TooltipContent>
              </Tooltip>
              <div className="font-mono text-terminal font-bold">
                {tps.toFixed(2)}
              </div>
            </div>
            <div>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="text-muted-foreground text-xs cursor-help w-fit">
                    VPS
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  Value Per Second — sats flowing through the node
                </TooltipContent>
              </Tooltip>
              <div className="font-mono text-terminal font-bold">
                {vps.toFixed(0)} sats/s
              </div>
            </div>
          </TooltipProvider> */}
          <div>
            <div className="text-muted-foreground text-xs">
              Lightning balance
            </div>
            <div className="font-mono text-foreground font-bold">
              {totalSpendable.toLocaleString()} sats
            </div>
          </div>
          <div className="text-end">
            <div className="text-muted-foreground text-xs">
              On-chain balance
            </div>
            <div className="font-mono text-foreground font-bold">
              {onchainBalance.toLocaleString()} sats
            </div>
          </div>
        </div>
        <div>
          <div className="flex justify-between text-xs text-muted-foreground mb-1">
            <span>Liquidity ({liquidity.channels} channels)</span>
            <span>
              {liquidity.available.toLocaleString()} /{" "}
              {totalLiquidity.toLocaleString()} sats
            </span>
          </div>
          <Progress value={liquidityPercent} className="h-2" />
        </div>
      </CardContent>
    </Card>
  );
}
