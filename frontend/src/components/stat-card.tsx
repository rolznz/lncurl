import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { Stats } from "@/lib/api";

interface StatCardProps {
  stats: Stats | null;
}

export function StatCard({ stats }: StatCardProps) {
  if (!stats) return null;

  const items = [
    { label: "Alive", value: stats.stats.currentAlive, color: "text-terminal" },
    { label: "Dead", value: stats.stats.totalWalletsDied, color: "text-danger" },
    { label: "Peak", value: stats.stats.peakConcurrentWallets, color: "text-foreground" },
    { label: "Total Created", value: stats.stats.totalWalletsCreated, color: "text-foreground" },
    { label: "Charges Collected", value: stats.stats.totalChargesCollected, color: "text-foreground" },
  ];

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-mono text-muted-foreground">
          STATS
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {items.map((item) => (
          <div key={item.label} className="flex justify-between text-sm">
            <span className="text-muted-foreground">{item.label}</span>
            <span className={`font-mono font-bold ${item.color}`}>
              {item.value.toLocaleString()}
            </span>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
