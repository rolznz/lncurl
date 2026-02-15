import type { FastifyInstance } from "fastify";
import {
  activityEmitter,
  getRecentActivities,
  type ActivityEvent,
} from "../activity.js";

export async function feedRoutes(fastify: FastifyInstance) {
  fastify.get("/api/feed", async (request, reply) => {
    reply.raw.writeHead(200, {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
      "Access-Control-Allow-Origin": "*",
    });

    // Send last 20 events on connect
    const recent = await getRecentActivities(20);
    for (const event of recent.reverse()) {
      reply.raw.write(`data: ${JSON.stringify(event)}\n\n`);
    }

    const onActivity = (event: ActivityEvent) => {
      reply.raw.write(`data: ${JSON.stringify(event)}\n\n`);
    };

    activityEmitter.on("activity", onActivity);

    // Keep alive ping every 30s
    const keepAlive = setInterval(() => {
      reply.raw.write(": keepalive\n\n");
    }, 30_000);

    request.raw.on("close", () => {
      activityEmitter.off("activity", onActivity);
      clearInterval(keepAlive);
    });
  });
}
