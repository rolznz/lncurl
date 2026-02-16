import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AsciiLogo } from "@/components/ascii-logo";
import { CreateWallet } from "@/components/create-wallet";
import { ActivityFeed } from "@/components/activity-feed";
import { Countdown } from "@/components/countdown";
import { NodeStats } from "@/components/node-stats";
import { StatCard } from "@/components/stat-card";
import { LeaderboardTable } from "@/components/leaderboard-table";
import { AchievementShelf } from "@/components/achievement-shelf";
import { FundingBars } from "@/components/funding-bars";
import { useStats } from "@/hooks/use-stats";
import { fetchLeaderboard, type LeaderboardEntry } from "@/lib/api";

export function Home() {
  const stats = useStats();
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);

  useEffect(() => {
    fetchLeaderboard()
      .then((d) => setLeaderboard(d.leaderboard))
      .catch(() => {});
  }, []);

  return (
    <div className="space-y-8">
      {/* Hero */}
      <section className="text-center space-y-4">
        <AsciiLogo />
        <h1 className="text-2xl font-bold">
          Bitcoin lightning wallets for agents.
        </h1>
        <p className="text-muted-foreground">One curl. That's it.</p>
      </section>

      {/* Create wallet */}
      <section className="max-w-lg mx-auto">
        <CreateWallet />
      </section>

      {/* Below the fold */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <NodeStats stats={stats} />
        <Countdown stats={stats} />
      </section>

      <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <ActivityFeed />
        <StatCard stats={stats} />
      </section>

      <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-mono text-muted-foreground flex items-center justify-between">
              <span>LEADERBOARD</span>
              <Link
                to="/leaderboard"
                className="text-terminal hover:underline text-xs"
              >
                View full &rarr;
              </Link>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <LeaderboardTable entries={leaderboard} preview />
          </CardContent>
        </Card>
        <AchievementShelf stats={stats} />
      </section>

      <section>
        <FundingBars stats={stats} />
      </section>
    </div>
  );
}
