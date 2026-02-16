const BASE = "";

export async function createWallet(message?: string): Promise<string> {
  const res = await fetch(`${BASE}/api/wallet`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: message ? `message=${encodeURIComponent(message)}` : undefined,
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || `HTTP ${res.status}`);
  }
  return res.text();
}

export interface FundEntry {
  key: string;
  label: string;
  lud16: string | null;
  balanceSats: number;
  targetSats: number;
}

export interface Stats {
  stats: {
    totalWalletsCreated: number;
    totalWalletsDied: number;
    totalChargesCollected: number;
    peakConcurrentWallets: number;
    currentAlive: number;
  };
  achievements: {
    id: string;
    title: string;
    unlockedAt: number;
    walletName: string | null;
  }[];
  nextChargeAt: number | null;
  walletsAtRisk: { name: string; balance: number; age: string }[];
  tps: number;
  vps: number;
  liquidity: { available: number; used: number; channels: number };
  totalSpendable: number;
  onchainBalance: number;
  routing: { totalForwarded: number; forwardsCount: number };
  nodeAlias: string | null;
  nodePubkey: string | null;
  communityFunds: FundEntry[];
  bounties: FundEntry[];
}

export async function fetchStats(): Promise<Stats> {
  const res = await fetch(`${BASE}/api/stats`);
  return res.json();
}

export interface LeaderboardEntry {
  rank: number;
  name: string;
  age: string;
  ageSeconds: number;
  title: string;
  tier: number;
  balance: number;
  totalCharged: number;
}

export async function fetchLeaderboard(): Promise<{ leaderboard: LeaderboardEntry[] }> {
  const res = await fetch(`${BASE}/api/leaderboard`);
  return res.json();
}

export interface GraveEntry {
  name: string;
  createdAt: number;
  deletedAt: number;
  ageSeconds: number;
  causeOfDeath: string;
  causeOfDeathFlavor: string | null;
  totalCharged: number;
  epitaph: string | null;
  flowers: number;
}

export async function fetchGraveyard(
  sort: "recent" | "oldest" = "recent",
  offset = 0,
  limit = 100,
): Promise<{ total: number; graves: GraveEntry[] }> {
  const res = await fetch(
    `${BASE}/api/graveyard?sort=${sort}&offset=${offset}&limit=${limit}`,
  );
  return res.json();
}

export interface ActivityEvent {
  id: number;
  type: string;
  walletName: string | null;
  amountSats: number | null;
  message: string | null;
  createdAt: number;
}
