import type { FastifyInstance } from "fastify";
import { prisma } from "../db.js";
import { getTitle, formatAge } from "../titles.js";
import { getTPS, getVPS, getLiquidity, getBalances } from "../node-stats.js";
import { getNodeInfo } from "../hub.js";
import { getFundBalances } from "../nwc-balances.js";

let nodeAlias: string | null = null;
let nodePubkey: string | null = null;

export async function statsRoutes(fastify: FastifyInstance) {
  // GET /api/stats
  fastify.get("/api/stats", async () => {
    const stats = await prisma.serviceStats.findUnique({ where: { id: 1 } });
    const achievements = await prisma.achievement.findMany({
      orderBy: { unlockedAt: "desc" },
    });
    const aliveCount = await prisma.wallet.count();

    // At-risk wallets: those with lowest balance
    const atRisk = await prisma.wallet.findMany({
      where: { lastKnownBalance: { lte: 1 } },
      orderBy: { lastKnownBalance: "asc" },
      take: 10,
      select: { name: true, lastKnownBalance: true, createdAt: true },
    });

    const now = Math.floor(Date.now() / 1000);

    const tps = getTPS();
    const vps = getVPS();
    const liquidity = await getLiquidity();
    const { totalSpendable, onchainTotal } = await getBalances();

    if (!nodeAlias || !nodePubkey) {
      try {
        const nodeInfo = await getNodeInfo();
        nodeAlias = nodeInfo.alias;
        nodePubkey = nodeInfo.pubkey;
      } catch (err) {
        console.error("[stats] Failed to fetch node info:", err);
      }
    }

    return {
      stats: {
        totalWalletsCreated: stats?.totalWalletsCreated ?? 0,
        totalWalletsDied: stats?.totalWalletsDied ?? 0,
        totalChargesCollected: stats?.totalChargesCollected ?? 0,
        peakConcurrentWallets: stats?.peakConcurrentWallets ?? 0,
        currentAlive: aliveCount,
      },
      achievements: achievements.map((a) => ({
        id: a.id,
        title: a.title,
        unlockedAt: a.unlockedAt,
        walletName: a.walletName,
      })),
      nextChargeAt: stats?.nextChargeRunAt ?? null,
      walletsAtRisk: atRisk.map((w) => ({
        name: w.name,
        balance: w.lastKnownBalance ?? 0,
        age: formatAge(w.createdAt, now),
      })),
      tps,
      vps,
      liquidity,
      totalSpendable,
      onchainBalance: onchainTotal,
      routing: { totalForwarded: 0, forwardsCount: 0 }, // TODO: populate when Hub API supports it
      nodeAlias,
      nodePubkey,
      ...getFundBalances(),
    };
  });

  // GET /api/leaderboard
  fastify.get("/api/leaderboard", async () => {
    const wallets = await prisma.wallet.findMany({
      orderBy: { createdAt: "asc" },
      take: 20,
      select: { name: true, createdAt: true, lastKnownBalance: true, totalCharged: true },
    });

    const now = Math.floor(Date.now() / 1000);

    return {
      leaderboard: wallets.map((w, i) => {
        const { title, tier } = getTitle(w.createdAt, now);
        return {
          rank: i + 1,
          name: w.name,
          age: formatAge(w.createdAt, now),
          ageSeconds: now - w.createdAt,
          title,
          tier,
          balance: w.lastKnownBalance ?? 0,
          totalCharged: w.totalCharged,
        };
      }),
    };
  });
}
