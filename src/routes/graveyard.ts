import type { FastifyInstance } from "fastify";
import { prisma } from "../db.js";

export async function graveyardRoutes(fastify: FastifyInstance) {
  fastify.get("/api/graveyard/:name/nostr-event", async (request, reply) => {
    const { name } = request.params as { name: string };
    const grave = await prisma.graveyard.findUnique({
      where: { name },
      select: { closureEventId: true },
    });

    if (!grave?.closureEventId) {
      return reply.status(404).send({ error: "No Nostr closure event found" });
    }

    const publication = await prisma.nostrPublish.findUnique({
      where: { id: grave.closureEventId },
      select: { eventJson: true },
    });

    if (!publication) {
      return reply.status(404).send({ error: "Nostr closure event is unavailable" });
    }

    try {
      return JSON.parse(publication.eventJson);
    } catch {
      return reply.status(500).send({ error: "Stored Nostr closure event is invalid" });
    }
  });

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
      closure_event_id: string | null;
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
              closure_event_id: g.closureEventId,
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
        closureEventId: g.closure_event_id,
      })),
    };
  });
}
