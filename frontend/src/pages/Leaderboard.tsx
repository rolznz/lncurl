import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LeaderboardTable } from "@/components/leaderboard-table";
import { fetchLeaderboard, type LeaderboardEntry } from "@/lib/api";

export function Leaderboard() {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);

  useEffect(() => {
    fetchLeaderboard().then((d) => setEntries(d.leaderboard)).catch(() => {});
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Hall of Fame</h1>
        <p className="text-muted-foreground">
          The longest-lived wallets on lncurl.lol
        </p>
      </div>

      <Card>
        <CardContent className="p-0">
          <LeaderboardTable entries={entries} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-mono text-muted-foreground">
            TITLE TIERS
          </CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground font-mono">
          Newborn (0d) &rarr; Survivor (7d) &rarr; Elder (30d) &rarr; Immortal
          (100d) &rarr; ??? (1y)
        </CardContent>
      </Card>
    </div>
  );
}
