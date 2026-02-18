import type { FastifyInstance } from "fastify";
import { createApp, createLightningAddress, updateAppName } from "../hub.js";
import { generateWalletName } from "../names.js";
import { sanitizeEpitaph, getRandomEpitaph } from "../epitaphs.js";
import { checkRateLimit } from "../rate-limit.js";
import { prisma } from "../db.js";
import { emitActivity } from "../activity.js";

export async function walletRoutes(fastify: FastifyInstance) {
  async function handleCreateWallet(request: any, reply: any) {
    const ip =
      (request.headers["x-forwarded-for"] as string)?.split(",")[0]?.trim() ||
      request.ip;

    const { allowed, remaining } = checkRateLimit(ip);
    if (!allowed) {
      reply.status(429).send("Rate limit exceeded. Max 10 wallets per hour.");
      return;
    }

    const body = request.body as { message?: string } | undefined;
    const epitaph = body?.message
      ? sanitizeEpitaph(body.message)
      : getRandomEpitaph();

    const newApp = await createApp();

    // Try names until one is accepted by getalby.com
    let name: string | null = null;
    for (let attempt = 0; attempt < 10; attempt++) {
      const candidate = await generateWalletName(attempt);
      try {
        await createLightningAddress(newApp.id, candidate);
        name = candidate;
        break;
      } catch (err) {
        console.error(`[wallet] Failed to reserve lightning address "${candidate}" (attempt ${attempt + 1}):`, err);
      }
    }
    if (!name) {
      reply.status(503).send("Could not reserve a lightning address. Try again.");
      return;
    }

    // Best-effort: rename the Hub app to match the wallet name
    await updateAppName(newApp.pairingPublicKey, name);

    const now = Math.floor(Date.now() / 1000);

    await prisma.wallet.create({
      data: {
        name,
        appId: newApp.id,
        appPubkey: newApp.pairingPublicKey,
        createdAt: now,
        epitaph,
        lastKnownBalance: 0,
        creatorIp: ip,
      },
    });

    // Update service stats
    await prisma.serviceStats.upsert({
      where: { id: 1 },
      create: { id: 1, totalWalletsCreated: 1 },
      update: { totalWalletsCreated: { increment: 1 } },
    });

    // Check peak concurrent
    const aliveCount = await prisma.wallet.count();
    const stats = await prisma.serviceStats.findUnique({ where: { id: 1 } });
    if (stats && aliveCount > stats.peakConcurrentWallets) {
      await prisma.serviceStats.update({
        where: { id: 1 },
        data: { peakConcurrentWallets: aliveCount },
      });
    }

    await emitActivity("wallet_created", name, undefined, `${name} was born`);

    const nwcUri = `${newApp.pairingUri}&lud16=${name}@getalby.com`;

    reply.header("X-RateLimit-Remaining", remaining);
    reply.type("text/plain").send(nwcUri);
  }

  fastify.post("/api/wallet", handleCreateWallet);
  fastify.post("/", handleCreateWallet);
}
