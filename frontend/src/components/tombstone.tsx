import { Card, CardContent } from "@/components/ui/card";
import type { GraveEntry } from "@/lib/api";

function formatAge(seconds: number): string {
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  if (days > 0) return `${days}d ${hours}h`;
  const minutes = Math.floor((seconds % 3600) / 60);
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
}

function formatDate(ts: number): string {
  return new Date(ts * 1000).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

interface TombstoneProps {
  grave: GraveEntry;
}

export function Tombstone({ grave }: TombstoneProps) {
  return (
    <Card className="overflow-hidden">
      <CardContent className="p-4 space-y-2">
        <pre className="text-terminal-dim font-mono text-[10px] leading-tight select-none text-center">
{`   _______
  /       \\
 | R.I.P. |
 |        |
 |________|`}
        </pre>

        <div className="text-center">
          <div className="font-mono text-terminal text-sm font-bold">
            {grave.name}
          </div>
        </div>

        <div className="text-xs text-muted-foreground space-y-0.5 text-center">
          <div>Born: {formatDate(grave.createdAt)}</div>
          <div>Died: {formatDate(grave.deletedAt)}</div>
          <div>Age: {formatAge(grave.ageSeconds)}</div>
        </div>

        {grave.causeOfDeathFlavor && (
          <p className="text-xs text-danger italic text-center">
            "{grave.causeOfDeathFlavor}"
          </p>
        )}

        {grave.epitaph && (
          <p className="text-xs text-foreground text-center">
            "{grave.epitaph}"
          </p>
        )}
      </CardContent>
    </Card>
  );
}
