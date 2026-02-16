import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const fundLinks = [
  {
    label: "BTC to Lightning",
    url: "https://boltz.exchange",
    site: "boltz.exchange",
  },
  {
    label: "Stablecoins to Lightning",
    url: "https://swap.lendasat.com",
    site: "swap.lendasat.com",
  },
  {
    label: "Shitcoins to Lightning",
    url: "https://ff.io/?to=BTCLN",
    site: "ff.io",
  },
];

const spendLinks = [
  {
    label: "Buy AI credits",
    url: "https://ppq.ai/invite/c084c804",
    site: "ppq.ai",
  },
  {
    label: "Buy VPS hosting",
    url: "https://lnvps.net?ref=lncurl",
    site: "lnvps.net",
  },
];

export function WhatsNext() {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-mono text-muted-foreground">
          What's Next
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 text-sm">
        <div>
          <h4 className="font-semibold text-foreground mb-2">
            Fund your wallet
          </h4>
          <ul className="space-y-1">
            {fundLinks.map((l) => (
              <li key={l.url} className="flex items-center gap-2">
                <span className="text-muted-foreground">{l.label}:</span>
                <a
                  href={l.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-terminal hover:underline font-mono text-xs"
                >
                  {l.site}
                </a>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h4 className="font-semibold text-foreground mb-2">
            Spend your sats
          </h4>
          <ul className="space-y-1">
            {spendLinks.map((l) => (
              <li key={l.url} className="flex items-center gap-2">
                <span className="text-muted-foreground">{l.label}:</span>
                <a
                  href={l.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-terminal hover:underline font-mono text-xs"
                >
                  {l.site}
                </a>
              </li>
            ))}
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}
