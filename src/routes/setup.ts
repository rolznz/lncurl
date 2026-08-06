import type { FastifyInstance, FastifyRequest } from "fastify";
import { validateAlbyToken } from "../hub.js";
import { getAlbyToken, saveAlbyToken } from "../settings.js";

export function isSameOrigin(request: FastifyRequest): boolean {
  const origin = request.headers.origin;
  if (!origin || !request.headers.host) return false;
  try {
    return new URL(origin).host === request.headers.host;
  } catch {
    return false;
  }
}

export async function setupRoutes(fastify: FastifyInstance) {
  fastify.get("/api/setup/status", async (_request, reply) => {
    reply.header("Cache-Control", "no-store");
    const { token, source } = await getAlbyToken();
    return { configured: Boolean(token), source };
  });

  fastify.put<{ Body: { token?: string } }>(
    "/api/setup/alby-token",
    async (request, reply) => {
      reply.header("Cache-Control", "no-store");
      if (!isSameOrigin(request)) {
        return reply.status(403).send({ error: "Same-origin request required." });
      }

      const token = request.body?.token?.trim();
      if (!token || token.length > 8192) {
        return reply.status(400).send({ error: "A valid Alby Hub token is required." });
      }

      try {
        await validateAlbyToken(token);
        await saveAlbyToken(token);
        return { configured: true, source: "database" };
      } catch (error) {
        return reply.status(422).send({
          error: error instanceof Error ? error.message : "Unable to save the token.",
        });
      }
    },
  );
}
