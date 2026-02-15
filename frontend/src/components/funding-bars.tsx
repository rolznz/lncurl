import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Zap } from "lucide-react";
import type { Stats } from "@/lib/api";

interface FundItem {
  label: string;
  current: number;
  target: number;
  address?: string;
}

function FundBar({ item }: { item: FundItem }) {
  const pct = Math.min(100, Math.round((item.current / item.target) * 100));
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs">
        <span className="text-foreground">{item.label}</span>
        <span className="text-muted-foreground font-mono">
          {(item.current / 1000).toFixed(1)}K /{" "}
          {(item.target / 1000).toFixed(0)}K sats
        </span>
      </div>
      <Progress value={pct} className="h-2" />
      {item.address && (
        <a
          href={`https://www.lnurlpay.com/${item.address}`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-xs text-terminal font-mono hover:underline cursor-pointer"
        >
          <Zap className="h-3 w-3" />
          {item.address}
        </a>
      )}
    </div>
  );
}

interface FundingBarsProps {
  stats: Stats | null;
}

export function FundingBars({ stats }: FundingBarsProps) {
  const communityFunds: FundItem[] = [
    {
      label: "Channel Fund",
      current: 0,
      target: 100_000,
      address: stats?.communityFundAddresses?.channels || undefined,
    },
    {
      label: "Hosting Costs",
      current: 0,
      target: 120_000,
      address: stats?.communityFundAddresses?.hosting || undefined,
    },
  ];

  const bounties: FundItem[] = [
    {
      label: "L402 Rate Bypass",
      current: 0,
      target: 210_000,
      address: stats?.bountyAddresses?.l402 || undefined,
    },
  ];

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
            <FundBar key={f.label} item={f} />
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
            <FundBar key={f.label} item={f} />
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
