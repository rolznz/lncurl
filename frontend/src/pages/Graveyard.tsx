import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Tombstone } from "@/components/tombstone";
import { fetchGraveyard, type GraveEntry } from "@/lib/api";

export function Graveyard() {
  const [graves, setGraves] = useState<GraveEntry[]>([]);
  const [total, setTotal] = useState(0);
  const [sort, setSort] = useState<"recent" | "oldest">("recent");

  useEffect(() => {
    fetchGraveyard(sort)
      .then((d) => {
        setGraves(d.graves);
        setTotal(d.total);
      })
      .catch(() => {});
  }, [sort]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">The Graveyard</h1>
        <p className="text-muted-foreground">
          Total wallets laid to rest:{" "}
          <span className="text-danger font-mono font-bold">
            {total.toLocaleString()}
          </span>
        </p>
      </div>

      <div className="flex gap-2">
        <Button
          variant={sort === "recent" ? "default" : "outline"}
          size="sm"
          onClick={() => setSort("recent")}
          className="cursor-pointer"
        >
          Most Recent
        </Button>
        <Button
          variant={sort === "oldest" ? "default" : "outline"}
          size="sm"
          onClick={() => setSort("oldest")}
          className="cursor-pointer"
        >
          Oldest at Death
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {graves.map((g) => (
          <Tombstone key={g.name} grave={g} />
        ))}
      </div>

      {graves.length === 0 && (
        <p className="text-center text-muted-foreground py-8">
          No graves yet. The reaper waits...
        </p>
      )}
    </div>
  );
}
