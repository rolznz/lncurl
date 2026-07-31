import { useState } from "react";
import { Check, Copy, Radio, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  fetchGraveClosureEvent,
  type GraveEntry,
  type NostrEvent,
} from "@/lib/api";

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
  const [event, setEvent] = useState<NostrEvent | null>(null);
  const [eventError, setEventError] = useState<string | null>(null);
  const [showEvent, setShowEvent] = useState(false);
  const [copied, setCopied] = useState(false);

  async function openClosureEvent() {
    setShowEvent(true);
    setEvent(null);
    setEventError(null);
    try {
      setEvent(await fetchGraveClosureEvent(grave.name));
    } catch {
      setEventError("The signed Nostr closure event could not be loaded.");
    }
  }

  async function copyEvent() {
    if (!event) return;
    try {
      await navigator.clipboard.writeText(JSON.stringify(event, null, 2));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setEventError("Could not copy the event to the clipboard.");
    }
  }

  return (
    <Card className="relative overflow-hidden">
      {grave.closureEventId && (
        <Button
          variant="ghost"
          size="icon-xs"
          className="absolute right-2 top-2 z-10 cursor-pointer text-terminal hover:text-terminal"
          aria-label={`View signed Nostr closure event for ${grave.name}`}
          title="View signed Nostr closure event"
          onClick={openClosureEvent}
        >
          <Radio />
        </Button>
      )}
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

      {showEvent && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby={`nostr-event-title-${grave.name}`}
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setShowEvent(false);
          }}
        >
          <div className="relative w-full max-w-2xl rounded-xl border border-terminal bg-card p-5 shadow-xl">
            <Button
              variant="ghost"
              size="icon-xs"
              className="absolute right-3 top-3 cursor-pointer"
              aria-label="Close Nostr event"
              onClick={() => setShowEvent(false)}
            >
              <X />
            </Button>

            <h2 id={`nostr-event-title-${grave.name}`} className="font-mono font-bold text-terminal">
              Signed Nostr closure event
            </h2>
            <p className="mt-1 pr-8 text-xs text-muted-foreground">
              The exact kind 3194 event lncurl signed for {grave.name}.
            </p>

            {eventError && (
              <p className="mt-4 text-sm text-danger">{eventError}</p>
            )}

            {!event && !eventError && (
              <p className="mt-4 text-sm text-muted-foreground">Loading event…</p>
            )}

            {event && (
              <>
                <div className="mt-4 flex justify-end">
                  <Button variant="outline" size="sm" className="cursor-pointer" onClick={copyEvent}>
                    {copied ? <Check /> : <Copy />}
                    {copied ? "Copied" : "Copy event"}
                  </Button>
                </div>
                <pre className="mt-2 max-h-[60vh] overflow-auto rounded-md border bg-background p-3 font-mono text-xs leading-relaxed whitespace-pre-wrap break-all">
                  {JSON.stringify(event, null, 2)}
                </pre>
              </>
            )}
          </div>
        </div>
      )}
    </Card>
  );
}
