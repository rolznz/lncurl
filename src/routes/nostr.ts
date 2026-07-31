import type { FastifyInstance } from "fastify";
import {
  buildNip05Document,
  getNostrIdentity,
  LNCURL_NIP05,
  NWC_CLOSURE_EVENT_KIND,
} from "../nostr-events.js";
import { getKnownNostrRelays } from "../nostr-publisher.js";

export async function nostrRoutes(fastify: FastifyInstance) {
  fastify.get("/.well-known/nostr.json", async (request, reply) => {
    const { name } = request.query as { name?: string };
    reply.header("Access-Control-Allow-Origin", "*");
    reply.header("Cache-Control", "public, max-age=300");
    reply.type("application/json");

    if (name !== "_") {
      return { names: {} };
    }

    const identity = getNostrIdentity();
    const relayUrls = await getKnownNostrRelays();
    return buildNip05Document(identity, relayUrls);
  });

  fastify.get("/api/nostr", async () => {
    const identity = getNostrIdentity();
    return {
      nip05: LNCURL_NIP05,
      npub: identity.npub,
      pubkey: identity.publicKey,
      closureEventKind: NWC_CLOSURE_EVENT_KIND,
    };
  });
}
