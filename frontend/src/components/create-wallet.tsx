import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createWallet } from "@/lib/api";
import { WalletQR } from "./wallet-qr";
import { WhatsNext } from "./whats-next";
import { Copy, Check, Dices } from "lucide-react";

const randomEpitaphs = [
  "Lived fast, died broke",
  "Should have hodled",
  "Gone but not forgotten... actually, probably forgotten",
  "Here lies a wallet that believed in zero fees",
  "Dust to dust, sats to void",
  "One sat short of survival",
  "The mempool doesn't care about your feelings",
  "Not your keys, not your sats, not your problem",
  "Born on-chain, died off-chain",
  "F in the chat",
  "It was a good run... was it though?",
  "I came, I saw, I got reaped",
  "Another one bites the dust",
  "404: Balance not found",
  "This wallet has left the Lightning network",
  "Farewell cruel blockchain",
  "Ran out of sats and patience",
  "The charge loop claims another soul",
  "Insufficient funds for existence",
  "It's not a bug, it's a feature: death",
  "Couldn't even afford to die with dignity",
  "Last seen: desperately looking for inbound liquidity",
  "Died doing what it loved: nothing",
  "Too stubborn to top up, too broke to live",
  "A moment of silence for this empty wallet",
  "The reaper waits for no wallet",
  "Balance: 0. Hope: also 0",
  "Gone to the great mempool in the sky",
  "This wallet made poor life choices",
  "RIP in sats",
  "The hourly charge was too much to bear",
  "Born free, died fee'd",
];

export function CreateWallet() {
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [curlCopied, setCurlCopied] = useState(false);

  const curlCommand = message
    ? `curl -X POST https://lncurl.lol -d "message=${message}"`
    : "curl -X POST https://lncurl.lol";

  async function handleCreate() {
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const nwcUri = await createWallet(message || undefined);
      setResult(nwcUri);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to create wallet");
    } finally {
      setLoading(false);
    }
  }

  function handleCopy() {
    if (result) {
      navigator.clipboard.writeText(result);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }

  function handleCurlCopy() {
    navigator.clipboard.writeText(curlCommand);
    setCurlCopied(true);
    setTimeout(() => setCurlCopied(false), 2000);
  }

  function handleRandomEpitaph() {
    const epitaph =
      randomEpitaphs[Math.floor(Math.random() * randomEpitaphs.length)];
    setMessage(epitaph);
  }

  return (
    <div className="space-y-4">
      {/* Curl command display */}
      <Card className="border-terminal/20">
        <CardContent className="px-4 py-0">
          <div className="flex items-center justify-between gap-2">
            <code className="font-mono text-terminal text-sm">
              <span className="text-muted-foreground select-none">$ </span>
              {curlCommand}
            </code>
            <Button
              variant="ghost"
              size="icon"
              className="shrink-0 h-8 w-8 cursor-pointer text-muted-foreground hover:text-terminal"
              onClick={handleCurlCopy}
            >
              {curlCopied ? (
                <Check className="h-4 w-4" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Create form */}
      <div className="space-y-3">
        <div className="relative">
          <Input
            className="font-mono text-sm bg-secondary border-border pr-10"
            placeholder="Last words for your wallet... (optional, 140 chars)"
            maxLength={140}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
          />
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8 cursor-pointer text-muted-foreground hover:text-terminal"
            onClick={handleRandomEpitaph}
            title="Random epitaph"
          >
            <Dices className="h-4 w-4" />
          </Button>
        </div>
        <Button
          className="w-full text-lg font-semibold py-6 cursor-pointer"
          onClick={handleCreate}
          disabled={loading}
        >
          {loading ? "Creating..." : "Create Wallet"}
        </Button>
      </div>

      {/* Error */}
      {error && (
        <Card className="border-destructive/50 bg-destructive/10">
          <CardContent className="p-4 text-sm text-destructive">
            {error}
          </CardContent>
        </Card>
      )}

      {/* Result */}
      {result && (
        <div className="space-y-4">
          <Card className="border-terminal/30">
            <CardContent className="p-4">
              <div className="flex items-start justify-between gap-2">
                <code className="font-mono text-xs text-terminal break-all flex-1">
                  {result}
                </code>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCopy}
                  className="shrink-0 cursor-pointer"
                >
                  {copied ? "Copied!" : "Copy"}
                </Button>
              </div>
            </CardContent>
          </Card>

          <WalletQR uri={result} />
          <WhatsNext />
        </div>
      )}
    </div>
  );
}
