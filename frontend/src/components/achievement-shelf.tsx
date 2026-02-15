import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { Stats } from "@/lib/api";

interface AchievementShelfProps {
  stats: Stats | null;
}

export function AchievementShelf({ stats }: AchievementShelfProps) {
  if (!stats || stats.achievements.length === 0) return null;

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-mono text-muted-foreground">
          ACHIEVEMENTS
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {stats.achievements.map((a) => (
          <div key={a.id} className="flex items-start gap-2 text-sm">
            <span className="text-chart-4 shrink-0">&#x1F3C6;</span>
            <div>
              <div className="text-foreground">{a.title}</div>
              {a.walletName && (
                <div className="text-xs text-muted-foreground font-mono">
                  {a.walletName}
                </div>
              )}
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
