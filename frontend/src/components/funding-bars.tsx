import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

interface FundItem {
  label: string;
  current: number;
  target: number;
  address?: string;
}

const communityFunds: FundItem[] = [
  { label: "Channel Fund", current: 0, target: 500000, address: "lncurl-channels@getalby.com" },
  { label: "Hosting Costs", current: 0, target: 2400, address: "lncurl-hosting@getalby.com" },
];

const bounties: FundItem[] = [
  { label: "Leave Flowers", current: 0, target: 50000 },
  { label: "ASCII Animations", current: 0, target: 100000 },
  { label: "Sound Effects", current: 0, target: 100000 },
  { label: "Death Notifs", current: 0, target: 150000 },
  { label: "L402 Rate Bypass", current: 0, target: 210000 },
];

function FundBar({ item }: { item: FundItem }) {
  const pct = Math.min(100, Math.round((item.current / item.target) * 100));
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs">
        <span className="text-foreground">{item.label}</span>
        <span className="text-muted-foreground font-mono">
          {(item.current / 1000).toFixed(1)}K / {(item.target / 1000).toFixed(0)}K sats
        </span>
      </div>
      <Progress value={pct} className="h-2" />
      {item.address && (
        <div className="text-xs text-terminal font-mono">{item.address}</div>
      )}
    </div>
  );
}

export function FundingBars() {
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
            Each feature has its own wallet. Pay into it. We build when it's funded.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
