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

// --- Cached balance fetch ---

let cache: { communityFunds: FundEntry[]; bounties: FundEntry[] } | null = null;
let cacheTime = 0;
const CACHE_TTL_MS = 60_000;

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

async function resolveEntry(config: FundConfig): Promise<FundEntry> {
  let balanceSats = 0;
  let lud16: string | null = null;

  if (config.nwcUrl) {
    lud16 = parseLud16(config.nwcUrl);
    try {
      balanceSats = await fetchBalance(config.nwcUrl);
    } catch (err) {
      console.error(`Failed to fetch balance for ${config.key}:`, err);
    }
  }

  return {
    key: config.key,
    label: config.label,
    lud16,
    balanceSats,
    targetSats: config.targetSats,
  };
}

export async function getFundBalances(): Promise<{
  communityFunds: FundEntry[];
  bounties: FundEntry[];
}> {
  const now = Date.now();
  if (cache && now - cacheTime < CACHE_TTL_MS) {
    return cache;
  }

  const { communityFunds, bounties } = loadFundConfigs();

  const [resolvedFunds, resolvedBounties] = await Promise.all([
    Promise.all(communityFunds.map(resolveEntry)),
    Promise.all(bounties.map(resolveEntry)),
  ]);

  cache = { communityFunds: resolvedFunds, bounties: resolvedBounties };
  cacheTime = now;
  return cache;
}
