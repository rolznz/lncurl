import { Relay, verifyEvent, type Event } from "nostr-tools";
import { prisma } from "./db.js";
import {
  createLncurlMetadataEvent,
  getConfiguredRelayUrls,
  getNostrIdentity,
  normalizeRelayUrls,
} from "./nostr-events.js";

const RETRY_INTERVAL_MS = parseInt(
  process.env.NOSTR_PUBLISH_RETRY_MS || "60000",
  10,
);

const activePublishes = new Map<string, Promise<void>>();
let publishLoopRunning = false;
let retryTimer: ReturnType<typeof setTimeout> | null = null;

export function parseRelayList(value: string): string[] {
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed)
      ? parsed.filter((item): item is string => typeof item === "string")
      : [];
  } catch {
    return [];
  }
}

export function makeNostrPublishData(event: Event, relayUrls: string[]) {
  const relays = normalizeRelayUrls(relayUrls);
  if (relays.length === 0) {
    throw new Error("Cannot queue a Nostr event without a relay");
  }

  return {
    id: event.id,
    kind: event.kind,
    eventJson: JSON.stringify(event),
    relaysJson: JSON.stringify(relays),
    publishedRelaysJson: "[]",
    createdAt: event.created_at,
  };
}

async function publishToRelay(relayUrl: string, event: Event): Promise<void> {
  const relay = await Relay.connect(relayUrl);
  relay.publishTimeout = 10_000;
  try {
    await relay.publish(event);
  } finally {
    relay.close();
  }
}

async function doPublishStoredNostrEvent(id: string): Promise<void> {
  const record = await prisma.nostrPublish.findUnique({ where: { id } });
  if (!record) return;

  let event: Event;
  try {
    event = JSON.parse(record.eventJson) as Event;
  } catch {
    await prisma.nostrPublish.update({
      where: { id },
      data: {
        attempts: { increment: 1 },
        lastAttemptAt: Math.floor(Date.now() / 1000),
        lastError: "Stored event is not valid JSON",
      },
    });
    return;
  }

  if (!verifyEvent(event) || event.id !== id) {
    await prisma.nostrPublish.update({
      where: { id },
      data: {
        attempts: { increment: 1 },
        lastAttemptAt: Math.floor(Date.now() / 1000),
        lastError: "Stored event failed signature verification",
      },
    });
    return;
  }

  const relayUrls = parseRelayList(record.relaysJson);
  const publishedRelays = new Set(parseRelayList(record.publishedRelaysJson));
  const pendingRelays = relayUrls.filter((relay) => !publishedRelays.has(relay));
  if (pendingRelays.length === 0) return;

  const results = await Promise.allSettled(
    pendingRelays.map(async (relayUrl) => {
      await publishToRelay(relayUrl, event);
      return relayUrl;
    }),
  );

  const errors: string[] = [];
  results.forEach((result, index) => {
    const relayUrl = pendingRelays[index];
    if (result.status === "fulfilled") {
      publishedRelays.add(result.value);
    } else {
      const message =
        result.reason instanceof Error
          ? result.reason.message
          : String(result.reason);
      errors.push(`${relayUrl}: ${message}`);
    }
  });

  await prisma.nostrPublish.update({
    where: { id },
    data: {
      publishedRelaysJson: JSON.stringify([...publishedRelays]),
      attempts: { increment: 1 },
      lastAttemptAt: Math.floor(Date.now() / 1000),
      lastError: errors.length > 0 ? errors.join("; ") : null,
    },
  });

  if (errors.length > 0) {
    console.error(`[nostr] Event ${id} was not accepted by every relay:`, errors);
  } else {
    console.log(`[nostr] Published event ${id} to all configured relays`);
  }
}

export function publishStoredNostrEvent(id: string): Promise<void> {
  const existing = activePublishes.get(id);
  if (existing) return existing;

  const publish = doPublishStoredNostrEvent(id).finally(() => {
    activePublishes.delete(id);
  });
  activePublishes.set(id, publish);
  return publish;
}

export async function getKnownNostrRelays(): Promise<string[]> {
  const [wallets, publishes] = await Promise.all([
    prisma.wallet.findMany({ select: { relaysJson: true } }),
    prisma.nostrPublish.findMany({ select: { relaysJson: true } }),
  ]);

  return normalizeRelayUrls([
    ...getConfiguredRelayUrls(),
    ...wallets.flatMap((wallet) => parseRelayList(wallet.relaysJson)),
    ...publishes.flatMap((publish) => parseRelayList(publish.relaysJson)),
  ]);
}

export async function ensureLncurlMetadataEvent(
  relayUrls: string[],
): Promise<string | null> {
  const relays = normalizeRelayUrls(relayUrls);
  if (relays.length === 0) return null;

  const identity = getNostrIdentity();
  const existing = await prisma.nostrPublish.findFirst({
    where: { kind: 0 },
    orderBy: { createdAt: "desc" },
  });

  if (existing) {
    const event = JSON.parse(existing.eventJson) as Event;
    if (event.pubkey === identity.publicKey) {
      const mergedRelays = normalizeRelayUrls([
        ...parseRelayList(existing.relaysJson),
        ...relays,
      ]);
      if (mergedRelays.length !== parseRelayList(existing.relaysJson).length) {
        await prisma.nostrPublish.update({
          where: { id: existing.id },
          data: { relaysJson: JSON.stringify(mergedRelays) },
        });
      }
      return existing.id;
    }
  }

  const event = createLncurlMetadataEvent(identity);
  await prisma.nostrPublish.create({
    data: makeNostrPublishData(event, relays),
  });
  return event.id;
}

async function runPublishLoop(): Promise<void> {
  if (publishLoopRunning) return;
  publishLoopRunning = true;
  try {
    const records = await prisma.nostrPublish.findMany({
      orderBy: { createdAt: "asc" },
    });
    for (const record of records) {
      const relayCount = parseRelayList(record.relaysJson).length;
      const publishedCount = parseRelayList(record.publishedRelaysJson).length;
      if (publishedCount < relayCount) {
        await publishStoredNostrEvent(record.id);
      }
    }
  } catch (err) {
    console.error("[nostr] Publish loop failed:", err);
  } finally {
    publishLoopRunning = false;
  }
}

function scheduleRetry(): void {
  retryTimer = setTimeout(async () => {
    await runPublishLoop();
    scheduleRetry();
  }, RETRY_INTERVAL_MS);
  retryTimer.unref?.();
}

export async function startNostrPublisher(): Promise<void> {
  const identity = getNostrIdentity();
  console.log(`[nostr] Lncurl identity: ${identity.npub} (${identity.publicKey})`);

  const relayUrls = await getKnownNostrRelays();
  const metadataEventId = await ensureLncurlMetadataEvent(relayUrls);
  if (metadataEventId) {
    void publishStoredNostrEvent(metadataEventId);
  }
  void runPublishLoop();
  scheduleRetry();
}

export function kickNostrPublisher(): void {
  void runPublishLoop();
}

export function stopNostrPublisher(): void {
  if (retryTimer) {
    clearTimeout(retryTimer);
    retryTimer = null;
  }
}
