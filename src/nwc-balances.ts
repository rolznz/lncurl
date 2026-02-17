import { NWCClient } from "@getalby/sdk/nwc";

export interface FundEntry {
  key: string;
  label: string;
  lud16: string | null;
  balanceSats: number;
  targetSats: number;
}

interface FundConfig {
  key: string;
  label: string;
  nwcUrl: string | null;
  targetSats: number;
}

// --- Parse lud16 from NWC URL ---

function parseLud16(nwcUrl: string): string | null {
  try {
    // NWC URLs use nostr+walletconnect:// scheme; lud16 is appended as a query param
    const url = new URL(
      nwcUrl.replace("nostr+walletconnect://", "https://placeholder/"),
    );
    return url.searchParams.get("lud16") || null;
  } catch {
    return null;
  }
}

// --- Build config arrays from env vars ---

function loadFundConfigs(): {
  communityFunds: FundConfig[];
  bounties: FundConfig[];
} {
  const communityFunds: FundConfig[] = [
    {
      key: "channels",
      label: "Channel Fund",
      nwcUrl: process.env.NWC_FUND_CHANNELS || null,
      targetSats: parseInt(
        process.env.CHANNEL_FUNDING_TARGET_SATS || "500000",
        10,
      ),
    },
    {
      key: "hosting",
      label: "Hosting Costs",
      nwcUrl: process.env.NWC_FUND_HOSTING || null,
      targetSats: parseInt(
        process.env.MONTHLY_COSTS_TARGET_SATS || "120000",
        10,
      ),
    },
  ];

  const bounties: FundConfig[] = [
    {
      key: "l402",
      label: "L402 Rate Bypass",
      nwcUrl: process.env.NWC_BOUNTY_L402 || null,
      targetSats: 210_000,
    },
    {
      key: "topup_lendasat",
      label: "Direct Topup - Lendasat",
      nwcUrl: process.env.NWC_BOUNTY_TOPUP_LENDASAT || null,
      targetSats: 250_000,
    },
    {
      key: "topup_fixedfloat",
      label: "Direct Topup - Fixed Float",
      nwcUrl: process.env.NWC_BOUNTY_TOPUP_FIXEDFLOAT || null,
      targetSats: 250_000,
    },
    {
      key: "routing_rewards",
      label: "Routing Earnings Rewards",
      nwcUrl: process.env.NWC_BOUNTY_ROUTING_REWARDS || null,
      targetSats: 500_000,
    },
    {
      key: "nwc_app_store",
      label: "NWC App Store",
      nwcUrl: process.env.NWC_BOUNTY_NWC_APP_STORE || null,
      targetSats: 210_000,
    },
  ];

  return { communityFunds, bounties };
}

// --- Background balance polling ---

let cache: { communityFunds: FundEntry[]; bounties: FundEntry[] } | null = null;

async function fetchBalance(nwcUrl: string): Promise<number> {
  const client = new NWCClient({ nostrWalletConnectUrl: nwcUrl });
  try {
    const { balance } = await client.getBalance();
    // NWC returns balance in msats
    return Math.floor(balance / 1000);
  } finally {
    client.close();
  }
}

function toEntry(config: FundConfig, balanceSats: number): FundEntry {
  return {
    key: config.key,
    label: config.label,
    lud16: config.nwcUrl ? parseLud16(config.nwcUrl) : null,
    balanceSats,
    targetSats: config.targetSats,
  };
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Map of fund key -> last known balance
const lastKnownBalances = new Map<string, number>();

async function refreshBalances(): Promise<void> {
  const { communityFunds, bounties } = loadFundConfigs();
  const allConfigs = [...communityFunds, ...bounties];

  for (const config of allConfigs) {
    if (!config.nwcUrl) continue;
    try {
      const sats = await fetchBalance(config.nwcUrl);
      lastKnownBalances.set(config.key, sats);
    } catch (err) {
      console.error(`Failed to fetch balance for ${config.key}:`, err);
      // keep last known value (or 0 if never fetched)
    }
  }

  cache = {
    communityFunds: communityFunds.map((c) =>
      toEntry(c, lastKnownBalances.get(c.key) ?? 0),
    ),
    bounties: bounties.map((c) =>
      toEntry(c, lastKnownBalances.get(c.key) ?? 0),
    ),
  };
}

export function startFundBalanceLoop(): void {
  (async () => {
    while (true) {
      await refreshBalances();
      await sleep(60_000);
    }
  })();
}

export function getFundBalances(): {
  communityFunds: FundEntry[];
  bounties: FundEntry[];
} {
  if (cache) return cache;

  // Return defaults with 0 balances if loop hasn't completed yet
  const { communityFunds, bounties } = loadFundConfigs();
  return {
    communityFunds: communityFunds.map((c) => toEntry(c, 0)),
    bounties: bounties.map((c) => toEntry(c, 0)),
  };
}
