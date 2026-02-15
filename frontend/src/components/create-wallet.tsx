import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createWallet } from "@/lib/api";
import { WalletQR } from "./wallet-qr";
import { WhatsNext } from "./whats-next";

export function CreateWallet() {
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

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

  return (
    <div className="space-y-4">
      {/* Curl command display */}
      <Card className="border-terminal/20">
        <CardContent className="p-4">
          <code className="font-mono text-terminal text-sm">
            <span className="text-muted-foreground">$ </span>
            curl -X POST https://lncurl.lol
          </code>
        </CardContent>
      </Card>

      {/* Create form */}
      <div className="space-y-3">
        <Input
          className="font-mono text-sm bg-secondary border-border"
          placeholder="Last words for your wallet... (optional, 140 chars)"
          maxLength={140}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
        />
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
