import { prisma } from "./db.js";
import { emitActivity } from "./activity.js";

interface AchievementDef {
  id: string;
  title: string;
  check: () => Promise<{ unlocked: boolean; walletName?: string }>;
}

const HOUR = 3600;

const definitions: AchievementDef[] = [
  // Creation milestones
  {
    id: "wallets_100",
    title: "Century Club — 100 wallets created",
    check: async () => {
      const stats = await prisma.serviceStats.findUnique({ where: { id: 1 } });
      return { unlocked: (stats?.totalWalletsCreated ?? 0) >= 100 };
    },
  },
  {
    id: "wallets_1000",
    title: "Millennial Madness — 1,000 wallets created",
    check: async () => {
      const stats = await prisma.serviceStats.findUnique({ where: { id: 1 } });
      return { unlocked: (stats?.totalWalletsCreated ?? 0) >= 1000 };
    },
  },
  {
    id: "wallets_10000",
    title: "Ten Thousand Souls — 10,000 wallets created",
    check: async () => {
      const stats = await prisma.serviceStats.findUnique({ where: { id: 1 } });
      return { unlocked: (stats?.totalWalletsCreated ?? 0) >= 10000 };
    },
  },
  // Survival milestones
  {
    id: "survive_7d",
    title: "First Survivor — a wallet lived 7 days",
    check: async () => {
      const cutoff = Math.floor(Date.now() / 1000) - 7 * 24 * HOUR;
      const wallet = await prisma.wallet.findFirst({
        where: { createdAt: { lte: cutoff } },
        orderBy: { createdAt: "asc" },
      });
      return { unlocked: !!wallet, walletName: wallet?.name };
    },
  },
  {
    id: "survive_30d",
    title: "Elder Emerges — a wallet lived 30 days",
    check: async () => {
      const cutoff = Math.floor(Date.now() / 1000) - 30 * 24 * HOUR;
      const wallet = await prisma.wallet.findFirst({
        where: { createdAt: { lte: cutoff } },
        orderBy: { createdAt: "asc" },
      });
      return { unlocked: !!wallet, walletName: wallet?.name };
    },
  },
  {
    id: "survive_100d",
    title: "Immortal Rises — a wallet lived 100 days",
    check: async () => {
      const cutoff = Math.floor(Date.now() / 1000) - 100 * 24 * HOUR;
      const wallet = await prisma.wallet.findFirst({
        where: { createdAt: { lte: cutoff } },
        orderBy: { createdAt: "asc" },
      });
      return { unlocked: !!wallet, walletName: wallet?.name };
    },
  },
  {
    id: "survive_365d",
    title: "Ascension — a wallet lived 365 days",
    check: async () => {
      const cutoff = Math.floor(Date.now() / 1000) - 365 * 24 * HOUR;
      const wallet = await prisma.wallet.findFirst({
        where: { createdAt: { lte: cutoff } },
        orderBy: { createdAt: "asc" },
      });
      return { unlocked: !!wallet, walletName: wallet?.name };
    },
  },
  // Peak milestones
  {
    id: "peak_10",
    title: "Getting Crowded — 10 concurrent wallets",
    check: async () => {
      const stats = await prisma.serviceStats.findUnique({ where: { id: 1 } });
      return { unlocked: (stats?.peakConcurrentWallets ?? 0) >= 10 };
    },
  },
  {
    id: "peak_50",
    title: "Bustling — 50 concurrent wallets",
    check: async () => {
      const stats = await prisma.serviceStats.findUnique({ where: { id: 1 } });
      return { unlocked: (stats?.peakConcurrentWallets ?? 0) >= 50 };
    },
  },
  {
    id: "peak_100",
    title: "Packed House — 100 concurrent wallets",
    check: async () => {
      const stats = await prisma.serviceStats.findUnique({ where: { id: 1 } });
      return { unlocked: (stats?.peakConcurrentWallets ?? 0) >= 100 };
    },
  },
  // Death milestones
  {
    id: "deaths_100",
    title: "Graveyard Filling — 100 wallets in the graveyard",
    check: async () => {
      const stats = await prisma.serviceStats.findUnique({ where: { id: 1 } });
      return { unlocked: (stats?.totalWalletsDied ?? 0) >= 100 };
    },
  },
  {
    id: "deaths_1000",
    title: "Mass Grave — 1,000 wallets in the graveyard",
    check: async () => {
      const stats = await prisma.serviceStats.findUnique({ where: { id: 1 } });
      return { unlocked: (stats?.totalWalletsDied ?? 0) >= 1000 };
    },
  },
];

export async function checkAchievements(): Promise<void> {
  for (const def of definitions) {
    const existing = await prisma.achievement.findUnique({
      where: { id: def.id },
    });
    if (existing) continue;

    const result = await def.check();
    if (result.unlocked) {
      await prisma.achievement.create({
        data: {
          id: def.id,
          title: def.title,
          unlockedAt: Math.floor(Date.now() / 1000),
          walletName: result.walletName ?? null,
        },
      });

      await emitActivity(
        "achievement_unlocked",
        result.walletName,
        undefined,
        def.title,
      );
    }
  }
}
