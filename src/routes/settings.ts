import { lookup } from "node:dns/promises";
import type { FastifyInstance, FastifyRequest } from "fastify";
import { rescheduleChargeLoop } from "../charge-loop.js";
import { rescheduleRateLimitCleanup } from "../rate-limit.js";
import {
  getRuntimeSettings,
  saveRuntimeSettings,
  type RuntimeSettings,
} from "../settings.js";
import { isSameOrigin } from "./setup.js";

export function unsafePublicSettingsEnabled(): boolean {
  return process.env.UNSAFE_PUBLIC_SETTINGS === "true";
}

function normalizeAddress(address: string): string {
  return address.replace(/^::ffff:/, "");
}

export async function isFromUmbrelAppProxy(request: FastifyRequest): Promise<boolean> {
  const host = process.env.UMBREL_APP_PROXY_HOST?.trim();
  if (!unsafePublicSettingsEnabled() || !host) return false;
  try {
    const addresses = await lookup(host, { all: true });
    return addresses.some(
      ({ address }) => normalizeAddress(address) === normalizeAddress(request.ip),
    );
  } catch {
    return false;
  }
}

export async function configRoutes(fastify: FastifyInstance) {
  fastify.get("/api/config", async () => ({
    unsafePublicSettings: unsafePublicSettingsEnabled(),
  }));
}

export async function settingsRoutes(fastify: FastifyInstance) {
  fastify.addHook("preHandler", async (request, reply) => {
    if (!(await isFromUmbrelAppProxy(request))) {
      return reply.status(403).send({ error: "Umbrel app proxy required." });
    }
  });

  fastify.get("/api/settings", async (_request, reply) => {
    reply.header("Cache-Control", "no-store");
    return getRuntimeSettings();
  });

  fastify.put<{ Body: RuntimeSettings }>("/api/settings", async (request, reply) => {
    reply.header("Cache-Control", "no-store");
    if (!isSameOrigin(request)) {
      return reply.status(403).send({ error: "Same-origin request required." });
    }
    try {
      const settings = await saveRuntimeSettings(request.body);
      rescheduleRateLimitCleanup();
      await rescheduleChargeLoop();
      return settings;
    } catch (error) {
      return reply.status(400).send({
        error: error instanceof Error ? error.message : "Unable to save settings.",
      });
    }
  });
}
