import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const LAST_UPDATED = "July 31, 2026";

export function Privacy() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Privacy Policy</h1>
        <p className="text-muted-foreground">
          What lncurl.lol collects, and what it doesn't.
        </p>
        <p className="text-sm mt-1 text-muted-foreground font-mono">
          Last updated: {LAST_UPDATED}
        </p>
      </div>

      {/* TL;DR */}
      <Card className="border-terminal">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-mono text-terminal">
            TL;DR
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <p>
            There are no accounts and no sign-up. We don't ask for your name,
            email, or any personal information. Wallets are created with a single
            HTTP call and identified only by their connection secret, which we
            cannot recover for you.
          </p>
          <p>
            The little data we do touch exists to run the service, stop abuse,
            and keep the lights on. We don't sell it.
          </p>
        </CardContent>
      </Card>

      {/* What we collect */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-mono text-muted-foreground">
            WHAT WE COLLECT
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm">
          <div>
            <p className="font-bold">IP addresses</p>
            <p className="text-muted-foreground">
              When you create a wallet we temporarily process your IP address to
              enforce rate limits (wallet creation is capped per IP per hour). It
              is not tied to a profile and is not used to identify you beyond
              abuse prevention.
            </p>
          </div>

          <div>
            <p className="font-bold">Wallet metadata</p>
            <p className="text-muted-foreground">
              We store the operational data needed to run each wallet: its
              lightning address, creation time, balance, and lifecycle status
              (alive or dead). Wallets are custodial and live on a single shared{" "}
              <a
                href="https://getalby.com/alby-hub?ref=lncurl"
                target="_blank"
                rel="noopener noreferrer"
                className="text-terminal hover:underline"
              >
                Alby Hub
              </a>{" "}
              instance.
            </p>
          </div>

          <div>
            <p className="font-bold">Epitaphs and public stats</p>
            <p className="text-muted-foreground">
              If you attach an epitaph (a "last words" message) when creating a
              wallet, that message is{" "}
              <strong>public</strong>. It is displayed on the{" "}
              <Link to="/graveyard" className="text-terminal hover:underline">
                Graveyard
              </Link>{" "}
              when the wallet dies, along with the wallet's generated name and
              how long it survived. Do not put anything sensitive or personal in
              an epitaph.
            </p>
          </div>

          <div>
            <p className="font-bold">Nostr closure events</p>
            <p className="text-muted-foreground">
              When a wallet dies, lncurl publishes a signed event to its NWC
              relay. The event publicly associates lncurl with that wallet's
              NWC wallet-service public key and says whether the connection
              expired or was revoked. It does not include the wallet's balance,
              epitaph, IP address, or transaction history.
            </p>
          </div>

          <div>
            <p className="font-bold">Analytics</p>
            <p className="text-muted-foreground">
              We use{" "}
              <a
                href="https://umami.is"
                target="_blank"
                rel="noopener noreferrer"
                className="text-terminal hover:underline"
              >
                Umami
              </a>
              , a privacy-friendly, cookieless analytics tool, to count page
              views and understand which pages get traffic. It does not use
              cookies and does not collect personal information or build a
              cross-site profile of you.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* What we don't collect */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-mono text-muted-foreground">
            WHAT WE DON'T DO
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <ul className="list-disc list-inside space-y-1 text-muted-foreground">
            <li>No accounts, no passwords, no email collection.</li>
            <li>No tracking cookies and no advertising networks.</li>
            <li>No selling or renting of any data to third parties.</li>
            <li>No KYC and no identity verification.</li>
          </ul>
        </CardContent>
      </Card>

      {/* Third parties */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-mono text-muted-foreground">
            THIRD PARTIES
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <p className="text-muted-foreground">
            Running a custodial lightning wallet means some data necessarily
            passes through infrastructure we don't control:
          </p>
          <ul className="list-disc list-inside space-y-1 text-muted-foreground">
            <li>
              <a
                href="https://getalby.com/alby-hub?ref=lncurl"
                target="_blank"
                rel="noopener noreferrer"
                className="text-terminal hover:underline"
              >
                Alby Hub
              </a>{" "}
              and the{" "}
              <a
                href="https://nwc.dev"
                target="_blank"
                rel="noopener noreferrer"
                className="text-terminal hover:underline"
              >
                Nostr Wallet Connect
              </a>{" "}
              relays handle wallet operations and connection strings.
            </li>
            <li>
              The bitcoin lightning network is a public payment network. Payment
              routing data is shared with other nodes by design and is outside
              our control.
            </li>
            <li>
              Our hosting provider processes requests in order to serve the site.
            </li>
          </ul>
        </CardContent>
      </Card>

      {/* Retention */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-mono text-muted-foreground">
            DATA RETENTION
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <p className="text-muted-foreground">
            When a wallet runs out of sats it is destroyed and its connection
            stops working. A record of the dead wallet — its name, epitaph, and
            lifespan — is kept on the public Graveyard for posterity. We retain
            aggregate, non-identifying service statistics indefinitely. The
            corresponding Nostr closure event is intended to remain available
            permanently, subject to each relay's retention policy.
          </p>
        </CardContent>
      </Card>

      {/* Contact */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-mono text-muted-foreground">
            QUESTIONS
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <p className="text-muted-foreground">
            This is a small, experimental service. If you have a question about
            privacy, open an issue on{" "}
            <a
              href="https://github.com/rolznz/lncurl"
              target="_blank"
              rel="noopener noreferrer"
              className="text-terminal hover:underline"
            >
              GitHub
            </a>
            . See also our{" "}
            <Link to="/terms" className="text-terminal hover:underline">
              Terms of Use
            </Link>
            .
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
