# Lncurl NWC Connection Closure Event

## Motivation

An NWC client normally discovers that a wallet is gone only after publishing a
request and waiting for a response that never arrives. Lncurl publishes a
durable, issuer-signed event when a wallet enters the graveyard so clients can
fail locally before sending a request.

The event is an attestation by lncurl. It is not signed by Alby Hub or by the
NWC wallet-service key. Clients must first identify and pin lncurl's signing key
through the root-domain NIP-05 identifier `_@lncurl.lol`.

## Event

Kind `3194` is a regular, immutable `NWC Connection Closed` event:

```json
{
  "kind": 3194,
  "pubkey": "<lncurl lowercase hex public key>",
  "created_at": 1785528000,
  "tags": [
    ["p", "<NWC wallet-service pubkey>"],
    ["status", "closed"],
    ["reason", "expired"]
  ],
  "content": "Lived fast, died broke",
  "id": "<event id>",
  "sig": "<lncurl signature>"
}
```

The event MUST contain exactly one tag of each type shown above. The `p` value
MUST be the wallet-service pubkey in the base of the NWC URI. The author MUST be
the pubkey resolved and pinned from `_@lncurl.lol`. Content MUST contain the
wallet's last words (the same epitaph stored in the graveyard), and the event
MUST NOT contain an `expiration` tag.

Supported reasons are:

- `expired`: the connection ended under lncurl's lifecycle policy, including a
  wallet that could not pay its maintenance charge.
- `revoked`: lncurl explicitly withdrew the connection.

Closure is final. A connection cannot be reopened under the same wallet-service
pubkey, and clients that have accepted a closure MUST cache it permanently.

## Publication

The graveyard pipeline creates and signs the event once, stores the exact event
JSON, and publishes those same bytes to every relay from the wallet's NWC URI.
Failed relay publications are retried without regenerating the event. Alby Hub
deletion is independent and never receives the lncurl private key.

The public event intentionally reveals that the tagged NWC wallet-service
pubkey was issued by lncurl and is closed, together with the wallet's public
last words. It does not include the wallet name, balance, IP address, lifetime,
or charge history.

## Client lookup

At NWC session start or relay reconnection, a lncurl-aware client resolves
`_@lncurl.lol`, verifies its kind `0` profile, pins the hex pubkey to the stored
connection, and queries every relay in the NWC URI:

```json
{
  "kinds": [3194],
  "authors": ["<pinned lncurl hex public key>"],
  "#p": ["<NWC wallet-service pubkey>"],
  "limit": 1
}
```

The client MUST verify the event ID and signature, author, matching `p` tag,
`status=closed`, and a recognized reason. A valid closure from any relay is
enough to stop kind `23194` requests. No event, an unreachable relay, or failed
NIP-05 resolution means availability is unknown rather than confirmed closed.

NIP-05 is used to establish and display the lncurl identity. Clients retain the
pinned public key for an existing connection and MUST NOT silently replace it
if the `_@lncurl.lol` mapping changes later.
