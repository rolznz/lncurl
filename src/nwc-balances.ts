import { getAppById } from "./hub.js";

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
  appId: number | null;
  targetSats: number;
}

// --- Build config arrays from env vars ---

function loadFundConfigs(): {
  communityFunds: FundConfig[];
  bounties: FundConfig[];
} {
  const parseAppId = (val: string | undefined): number | null => {
    if (!val) return null;
    const n = parseInt(val, 10);
    return isNaN(n) ? null : n;
  };

  const communityFunds: FundConfig[] = [
    {
      key: "channels",
      label: "Channel Fund",
      appId: parseAppId(process.env.APP_ID_FUND_CHANNELS),
      targetSats: parseInt(
        process.env.CHANNEL_FUNDING_TARGET_SATS || "500000",
        10,
      ),
    },
    {
      key: "hosting",
      label: "Hosting Costs",
      appId: parseAppId(process.env.APP_ID_FUND_HOSTING),
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
      appId: parseAppId(process.env.APP_ID_BOUNTY_L402),
      targetSats: 210_000,
    },
    {
      key: "topup_lendasat",
      label: "Direct Topup - Lendasat",
      appId: parseAppId(process.env.APP_ID_BOUNTY_TOPUP_LENDASAT),
      targetSats: 250_000,
    },
    {
      key: "topup_fixedfloat",
      label: "Direct Topup - Fixed Float",
      appId: parseAppId(process.env.APP_ID_BOUNTY_TOPUP_FIXEDFLOAT),
      targetSats: 250_000,
    },
    {
      key: "routing_rewards",
      label: "Routing Earnings Rewards",
      appId: parseAppId(process.env.APP_ID_BOUNTY_ROUTING_REWARDS),
      targetSats: 500_000,
    },
    {
      key: "nwc_app_store",
      label: "NWC App Store",
      appId: parseAppId(process.env.APP_ID_BOUNTY_NWC_APP_STORE),
      targetSats: 210_000,
    },
  ];

  return { communityFunds, bounties };
}

// --- Background balance polling ---

let cache: { communityFunds: FundEntry[]; bounties: FundEntry[] } | null = null;

function toEntry(
  config: FundConfig,
  data: { balanceSats: number; lud16: string | null },
): FundEntry {
  return {
    key: config.key,
    label: config.label,
    lud16: data.lud16,
    balanceSats: data.balanceSats,
    targetSats: config.targetSats,
  };
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Map of fund key -> last known data
const lastKnownData = new Map<string, { balanceSats: number; lud16: string | null }>();

async function refreshBalances(): Promise<void> {
  const { communityFunds, bounties } = loadFundConfigs();
  const allConfigs = [...communityFunds, ...bounties];

  for (const config of allConfigs) {
    if (config.appId === null) continue;
    try {
      const data = await getAppById(config.appId);
      lastKnownData.set(config.key, data);
    } catch (err) {
      console.error(`[nwc-balances] Failed to fetch balance for ${config.key}:`, err);
      // keep last known value (or default if never fetched)
    }
  }

  const defaultData = { balanceSats: 0, lud16: null };
  cache = {
    communityFunds: communityFunds.map((c) =>
      toEntry(c, lastKnownData.get(c.key) ?? defaultData),
    ),
    bounties: bounties.map((c) =>
      toEntry(c, lastKnownData.get(c.key) ?? defaultData),
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
  const defaultData = { balanceSats: 0, lud16: null };
  return {
    communityFunds: communityFunds.map((c) => toEntry(c, defaultData)),
    bounties: bounties.map((c) => toEntry(c, defaultData)),
  };
}
