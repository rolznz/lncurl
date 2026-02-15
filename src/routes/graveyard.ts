import type { FastifyInstance } from "fastify";
import { prisma } from "../db.js";

export async function graveyardRoutes(fastify: FastifyInstance) {
  fastify.get("/api/graveyard", async (request) => {
    const query = request.query as { sort?: string; offset?: string; limit?: string };
    const sort = query.sort === "oldest" ? "oldest" : "recent";
    const offset = Math.max(0, parseInt(query.offset || "0", 10) || 0);
    const limit = Math.min(100, Math.max(1, parseInt(query.limit || "100", 10) || 100));

    const orderBy =
      sort === "oldest"
        ? [{ deletedAt: "asc" as const }]
        : [{ deletedAt: "desc" as const }];

    const [graves, total] = await Promise.all([
      prisma.graveyard.findMany({
        orderBy,
        skip: offset,
        take: limit,
      }),
      prisma.graveyard.count(),
    ]);

    return {
      total,
      graves: graves.map((g) => ({
        name: g.name,
        createdAt: g.createdAt,
        deletedAt: g.deletedAt,
        ageSeconds: g.deletedAt - g.createdAt,
        causeOfDeath: g.causeOfDeath,
        causeOfDeathFlavor: g.causeOfDeathFlavor,
        totalCharged: g.totalCharged,
        epitaph: g.epitaph,
        flowers: g.flowers,
      })),
    };
  });
}
