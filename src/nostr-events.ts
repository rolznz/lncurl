import {
  finalizeEvent,
  getPublicKey,
  nip19,
  type VerifiedEvent,
} from "nostr-tools";

export const NWC_CLOSURE_EVENT_KIND = 3194;
export const LNCURL_NIP05 = "_@lncurl.lol";

export type NwcClosureReason = "revoked" | "expired";

export interface NostrIdentity {
  secretKey: Uint8Array;
  publicKey: string;
  npub: string;
}

export interface NwcConnectionInfo {
  walletPubkey: string;
  relayUrls: string[];
}

let cachedIdentity: NostrIdentity | null = null;

function isHexKey(value: string): boolean {
  return /^[0-9a-f]{64}$/.test(value);
}

export function createNostrIdentity(rawPrivateKey: string): NostrIdentity {
  const value = rawPrivateKey.trim();
  let secretKey: Uint8Array;

  if (/^[0-9a-fA-F]{64}$/.test(value)) {
    secretKey = Uint8Array.from(Buffer.from(value, "hex"));
  } else if (value.startsWith("nsec1")) {
    const decoded = nip19.decode(value);
    if (decoded.type !== "nsec") {
      throw new Error("NOSTR_PRIVATE_KEY must be a hex private key or nsec");
    }
    secretKey = decoded.data;
  } else {
    throw new Error("NOSTR_PRIVATE_KEY must be a hex private key or nsec");
  }

  const publicKey = getPublicKey(secretKey).toLowerCase();
  return {
    secretKey,
    publicKey,
    npub: nip19.npubEncode(publicKey),
  };
}

export function getNostrIdentity(): NostrIdentity {
  if (cachedIdentity) return cachedIdentity;

  const privateKey = process.env.NOSTR_PRIVATE_KEY;
  if (!privateKey) {
    throw new Error(
      "NOSTR_PRIVATE_KEY is required to sign NWC closure events and publish _@lncurl.lol",
    );
  }

  cachedIdentity = createNostrIdentity(privateKey);
  return cachedIdentity;
}

export function normalizeRelayUrls(relayUrls: string[]): string[] {
  const unique = new Set<string>();

  for (const value of relayUrls) {
    const relayUrl = value.trim();
    if (!relayUrl) continue;

    const parsed = new URL(relayUrl);
    if (parsed.protocol !== "ws:" && parsed.protocol !== "wss:") {
      throw new Error(`Invalid Nostr relay URL: ${relayUrl}`);
    }
    unique.add(relayUrl);
  }

  return [...unique];
}

export function getConfiguredRelayUrls(): string[] {
  return normalizeRelayUrls((process.env.NOSTR_RELAYS || "").split(","));
}

export function parseNwcConnectionInfo(nwcUri: string): NwcConnectionInfo {
  const parsed = new URL(nwcUri);
  if (parsed.protocol !== "nostr+walletconnect:") {
    throw new Error("Invalid NWC connection URI");
  }

  const walletPubkey = parsed.hostname.toLowerCase();
  if (!isHexKey(walletPubkey)) {
    throw new Error("NWC URI does not contain a valid wallet-service pubkey");
  }

  const relayUrls = normalizeRelayUrls(parsed.searchParams.getAll("relay"));
  if (relayUrls.length === 0) {
    throw new Error("NWC URI does not contain a relay");
  }

  return { walletPubkey, relayUrls };
}

export function createNwcClosureEvent(
  identity: NostrIdentity,
  walletPubkey: string,
  reason: NwcClosureReason,
  lastWords: string,
  createdAt = Math.floor(Date.now() / 1000),
): VerifiedEvent {
  const normalizedWalletPubkey = walletPubkey.toLowerCase();
  if (!isHexKey(normalizedWalletPubkey)) {
    throw new Error("Cannot close an NWC connection without a valid wallet-service pubkey");
  }

  return finalizeEvent(
    {
      kind: NWC_CLOSURE_EVENT_KIND,
      created_at: createdAt,
      tags: [
        ["p", normalizedWalletPubkey],
        ["status", "closed"],
        ["reason", reason],
      ],
      content: lastWords,
    },
    identity.secretKey,
  );
}

export function createLncurlMetadataEvent(
  identity: NostrIdentity,
  createdAt = Math.floor(Date.now() / 1000),
): VerifiedEvent {
  return finalizeEvent(
    {
      kind: 0,
      created_at: createdAt,
      tags: [],
      content: JSON.stringify({
        name: "lncurl.lol",
        nip05: LNCURL_NIP05,
      }),
    },
    identity.secretKey,
  );
}

export function buildNip05Document(
  identity: NostrIdentity,
  relayUrls: string[],
) {
  const relays = normalizeRelayUrls(relayUrls);
  return {
    names: { _: identity.publicKey },
    ...(relays.length > 0
      ? { relays: { [identity.publicKey]: relays } }
      : {}),
  };
}
