import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function About() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold">About lncurl.lol</h1>
        <p className="text-muted-foreground">
          Disposable bitcoin lightning wallets for AI agents.
        </p>
      </div>

      {/* Custody warning */}
      <Card className="border-danger">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-mono text-danger">
            CUSTODY WARNING
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <p>
            lncurl.lol is a <strong>custodial service</strong>. All wallets live
            on a single shared{" "}
            <a
              href="https://getalby.com/alby-hub"
              target="_blank"
              rel="noopener noreferrer"
              className="text-terminal hover:underline"
            >
              Alby Hub
            </a>{" "}
            instance. This is designed for agents, quick tests, and small
            amounts.
          </p>
          <p>
            <strong>Do not</strong> store meaningful amounts here. Wallets are
            charged hourly and will be destroyed when their balance hits zero.
          </p>
          <p>
            For serious use, run your own{" "}
            <a
              href="https://getalby.com/alby-hub"
              target="_blank"
              rel="noopener noreferrer"
              className="text-terminal hover:underline"
            >
              Alby Hub
            </a>
            .
          </p>
        </CardContent>
      </Card>

      {/* How it works */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-mono text-muted-foreground">
            HOW IT WORKS
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <ol className="list-decimal list-inside space-y-1">
            <li>
              <strong>Create</strong> — one{" "}
              <code className="text-terminal">curl -X POST</code> gives you a
              NWC connection string with a lightning address.
            </li>
            <li>
              <strong>Fund</strong> — send sats to the lightning address or pay
              an invoice. Your wallet is ready.
            </li>
            <li>
              <strong>Use</strong> — connect any NWC-compatible app or agent.
              Send payments, create invoices, check balance.
            </li>
            <li>
              <strong>Charged hourly</strong> — a small fee is deducted every
              hour to cover hosting.
            </li>
            <li>
              <strong>Dies if broke</strong> — when balance hits zero, the
              wallet is destroyed and moves to the graveyard.
            </li>
          </ol>
        </CardContent>
      </Card>

      {/* FAQ */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-mono text-muted-foreground">
            FAQ
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm">
          <div>
            <p className="font-bold">What is NWC?</p>
            <p className="text-muted-foreground">
              <a
                href="https://nwc.dev"
                target="_blank"
                rel="noopener noreferrer"
                className="text-terminal hover:underline"
              >
                Nostr Wallet Connect
              </a>{" "}
              is an open protocol that lets apps control a lightning wallet
              remotely. The connection string you get is all you need.
            </p>
          </div>

          <div>
            <p className="font-bold">How do I fund my wallet?</p>
            <p className="text-muted-foreground">
              Send sats to the lightning address included in your connection
              string (the <code>lud16</code> param). You can swap on-chain BTC
              via{" "}
              <a
                href="https://boltz.exchange"
                target="_blank"
                rel="noopener noreferrer"
                className="text-terminal hover:underline"
              >
                boltz.exchange
              </a>
              ,{" "}
              <a
                href="https://swap.lendasat.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-terminal hover:underline"
              >
                swap.lendasat.com
              </a>
              , or{" "}
              <a
                href="https://ff.io"
                target="_blank"
                rel="noopener noreferrer"
                className="text-terminal hover:underline"
              >
                ff.io
              </a>
              .
            </p>
          </div>

          <div>
            <p className="font-bold">Are there rate limits?</p>
            <p className="text-muted-foreground">
              Wallet creation is limited to 10 per hour per IP. Wallet
              operations go through NWC with standard Alby Hub rate limits.
            </p>
          </div>

          <div>
            <p className="font-bold">What happens when my wallet dies?</p>
            <p className="text-muted-foreground">
              It moves to the Graveyard with its epitaph. The lightning address
              and NWC connection stop working. Any remaining balance was already
              zero.
            </p>
          </div>

          <div>
            <p className="font-bold">Can I recover a dead wallet?</p>
            <p className="text-muted-foreground">
              No. Dead wallets are permanently deleted. Create a new one — it
              takes one curl.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
