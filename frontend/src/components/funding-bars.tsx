import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Zap } from "lucide-react";
import type { Stats, FundEntry } from "@/lib/api";

function FundBar({ entry }: { entry: FundEntry }) {
  const pct = Math.min(100, Math.round((entry.balanceSats / entry.targetSats) * 100));
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs">
        <span className="text-foreground">{entry.label}</span>
        <span className="text-muted-foreground font-mono">
          {(entry.balanceSats / 1000).toFixed(1)}K /{" "}
          {(entry.targetSats / 1000).toFixed(0)}K sats
        </span>
      </div>
      <Progress value={pct} className="h-2" />
      {entry.lud16 && (
        <a
          href={`https://www.lnurlpay.com/${entry.lud16}`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-xs text-terminal font-mono hover:underline cursor-pointer"
        >
          <Zap className="h-3 w-3" />
          {entry.lud16}
        </a>
      )}
    </div>
  );
}

interface FundingBarsProps {
  stats: Stats | null;
}

export function FundingBars({ stats }: FundingBarsProps) {
  const communityFunds = stats?.communityFunds ?? [];
  const bounties = stats?.bounties ?? [];

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-mono text-muted-foreground">
            COMMUNITY FUNDING
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {communityFunds.map((f) => (
            <FundBar key={f.key} entry={f} />
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-mono text-muted-foreground">
            FEATURE BOUNTIES — Fund to unlock!
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {bounties.map((f) => (
            <FundBar key={f.key} entry={f} />
          ))}
          <p className="text-xs text-muted-foreground mt-2">
            Each feature has its own wallet. Pay into it. We build when it's
            funded.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
