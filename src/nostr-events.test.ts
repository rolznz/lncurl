import assert from "node:assert/strict";
import test from "node:test";
import { nip19, verifyEvent } from "nostr-tools";
import {
  buildNip05Document,
  createLncurlMetadataEvent,
  createNostrIdentity,
  createNwcClosureEvent,
  LNCURL_NIP05,
  NWC_CLOSURE_EVENT_KIND,
  parseNwcConnectionInfo,
} from "./nostr-events.js";

const PRIVATE_KEY = "0".repeat(63) + "1";

test("creates the root-domain NIP-05 identity", () => {
  const identity = createNostrIdentity(PRIVATE_KEY);
  assert.equal(identity.publicKey.length, 64);
  assert.equal(nip19.decode(identity.npub).data, identity.publicKey);

  const document = buildNip05Document(identity, [
    "wss://relay.example.com",
    "wss://relay.example.com",
  ]);
  assert.deepEqual(document, {
    names: { _: identity.publicKey },
    relays: {
      [identity.publicKey]: ["wss://relay.example.com"],
    },
  });
});

test("accepts an nsec signing key", () => {
  const fromHex = createNostrIdentity(PRIVATE_KEY);
  const fromNsec = createNostrIdentity(nip19.nsecEncode(fromHex.secretKey));
  assert.equal(fromNsec.publicKey, fromHex.publicKey);
  assert.equal(fromNsec.npub, fromHex.npub);
});

test("signs an immutable expired NWC closure with a p tag", () => {
  const identity = createNostrIdentity(PRIVATE_KEY);
  const walletPubkey = "2".repeat(64);
  const event = createNwcClosureEvent(
    identity,
    walletPubkey,
    "expired",
    1_785_528_000,
  );

  assert.equal(verifyEvent(event), true);
  assert.equal(event.kind, NWC_CLOSURE_EVENT_KIND);
  assert.equal(event.pubkey, identity.publicKey);
  assert.equal(event.created_at, 1_785_528_000);
  assert.equal(event.content, "");
  assert.deepEqual(event.tags, [
    ["p", walletPubkey],
    ["status", "closed"],
    ["reason", "expired"],
  ]);
  assert.equal(JSON.stringify(event).includes("expiration"), false);
});

test("supports revoked closures and rejects malformed wallet pubkeys", () => {
  const identity = createNostrIdentity(PRIVATE_KEY);
  const event = createNwcClosureEvent(
    identity,
    "3".repeat(64),
    "revoked",
    1,
  );
  assert.deepEqual(event.tags[2], ["reason", "revoked"]);
  assert.throws(
    () => createNwcClosureEvent(identity, "not-a-pubkey", "expired"),
    /wallet-service pubkey/,
  );
});

test("signs matching kind 0 metadata", () => {
  const identity = createNostrIdentity(PRIVATE_KEY);
  const event = createLncurlMetadataEvent(identity, 2);
  assert.equal(verifyEvent(event), true);
  assert.equal(event.kind, 0);
  assert.equal(event.pubkey, identity.publicKey);
  assert.deepEqual(JSON.parse(event.content), {
    name: "lncurl.lol",
    nip05: LNCURL_NIP05,
  });
});

test("extracts the wallet pubkey and every relay from an NWC URI", () => {
  const walletPubkey = "a".repeat(64);
  const connection = parseNwcConnectionInfo(
    `nostr+walletconnect://${walletPubkey}?relay=${encodeURIComponent("wss://one.example")}&relay=${encodeURIComponent("wss://two.example/path")}&secret=${"b".repeat(64)}`,
  );
  assert.deepEqual(connection, {
    walletPubkey,
    relayUrls: ["wss://one.example", "wss://two.example/path"],
  });
});
