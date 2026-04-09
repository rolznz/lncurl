import type { FastifyInstance } from "fastify";
import { prisma } from "../db.js";

export async function graveyardRoutes(fastify: FastifyInstance) {
  fastify.get("/api/graveyard", async (request) => {
    const query = request.query as { sort?: string; offset?: string; limit?: string };
    const sort = query.sort === "oldest" ? "oldest" : "recent";
    const offset = Math.max(0, parseInt(query.offset || "0", 10) || 0);
    const limit = Math.min(100, Math.max(1, parseInt(query.limit || "100", 10) || 100));

    type RawGrave = {
      name: string;
      created_at: number;
      deleted_at: number;
      cause_of_death: string;
      cause_of_death_flavor: string | null;
      total_charged: number;
      epitaph: string | null;
      flowers: number;
    };

    const [rawGraves, total] = await Promise.all([
      sort === "oldest"
        ? prisma.$queryRaw<RawGrave[]>`
            SELECT * FROM graveyard
            ORDER BY (deleted_at - created_at) DESC
            LIMIT ${limit} OFFSET ${offset}
          `
        : prisma.graveyard.findMany({
            orderBy: [{ deletedAt: "desc" as const }],
            skip: offset,
            take: limit,
          }).then((rows) =>
            rows.map((g) => ({
              name: g.name,
              created_at: g.createdAt,
              deleted_at: g.deletedAt,
              cause_of_death: g.causeOfDeath,
              cause_of_death_flavor: g.causeOfDeathFlavor,
              total_charged: g.totalCharged,
              epitaph: g.epitaph,
              flowers: g.flowers,
            }))
          ),
      prisma.graveyard.count(),
    ]);

    return {
      total,
      graves: rawGraves.map((g) => ({
        name: g.name,
        createdAt: g.created_at,
        deletedAt: g.deleted_at,
        ageSeconds: g.deleted_at - g.created_at,
        causeOfDeath: g.cause_of_death,
        causeOfDeathFlavor: g.cause_of_death_flavor,
        totalCharged: g.total_charged,
        epitaph: g.epitaph,
        flowers: g.flowers,
      })),
    };
  });
}
