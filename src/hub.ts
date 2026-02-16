const APP_NAME_PREFIX = "lncurl";

function removeTrailingSlash(url: string): string {
  return url.replace(/\/$/, "");
}

function getHeaders() {
  return {
    Authorization: `Bearer ${process.env.AUTH_TOKEN}`,
    "AlbyHub-Name": process.env.ALBY_HUB_NAME || "",
    "AlbyHub-Region": process.env.ALBY_HUB_REGION || "",
    "Content-Type": "application/json",
    Accept: "application/json",
  };
}

function getAlbyHubUrl() {
  const albyHubUrl = process.env.ALBY_HUB_URL;
  if (!albyHubUrl) {
    throw new Error("No ALBY_HUB_URL set");
  }
  return removeTrailingSlash(albyHubUrl);
}

// --- Wallet operations ---

export async function createApp() {
  const newAppResponse = await fetch(new URL("/api/apps", getAlbyHubUrl()), {
    method: "POST",
    body: JSON.stringify({
      name: APP_NAME_PREFIX + "-" + Math.floor(Date.now() / 1000),
      pubkey: "",
      budgetRenewal: "monthly",
      maxAmount: 0,
      scopes: [
        "get_info",
        "pay_invoice",
        "get_balance",
        "make_invoice",
        "lookup_invoice",
        "list_transactions",
        "notifications",
      ],
      returnTo: "",
      isolated: true,
      metadata: {
        app_store_app_id: "uncle-jim",
      },
    }),
    headers: getHeaders(),
  });

  if (!newAppResponse.ok) {
    throw new Error("Failed to create app: " + (await newAppResponse.text()));
  }

  const newApp = (await newAppResponse.json()) as {
    pairingUri: string;
    pairingPublicKey: string;
    id: number;
    name: string;
  };

  if (!newApp.pairingUri) {
    throw new Error("No pairing URI in create app response");
  }

  return newApp;
}

export async function listApps() {
  const response = await fetch(new URL("/api/apps", getAlbyHubUrl()), {
    headers: getHeaders(),
  });

  if (!response.ok) {
    throw new Error("Failed to list apps: " + (await response.text()));
  }

  return (await response.json()) as {
    apps: { id: number; name: string }[];
  };
}

export async function updateAppName(
  appPubkey: string,
  name: string,
): Promise<void> {
  try {
    const response = await fetch(
      new URL(`/api/apps/${appPubkey}`, getAlbyHubUrl()),
      {
        method: "PATCH",
        headers: getHeaders(),
        body: JSON.stringify({ name }),
      },
    );
    if (!response.ok) {
      console.error(`Failed to update app name: ${await response.text()}`);
    }
  } catch (err) {
    console.error("Failed to update app name:", err);
  }
}

export async function deleteApp(appPubkey: string): Promise<void> {
  const response = await fetch(
    new URL(`/api/apps/${appPubkey}`, getAlbyHubUrl()),
    {
      method: "DELETE",
      headers: getHeaders(),
    },
  );

  if (!response.ok) {
    throw new Error("Failed to delete app: " + (await response.text()));
  }
}

export async function transferFromApp(
  appId: number,
  amountSat: number,
): Promise<void> {
  const response = await fetch(new URL("/api/transfers", getAlbyHubUrl()), {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify({
      fromAppId: appId,
      amountSat,
    }),
  });

  if (!response.ok) {
    throw new Error("Failed to transfer from app: " + (await response.text()));
  }
}

export async function getAppBalance(
  appPubkey: string,
): Promise<{ balance: number }> {
  const response = await fetch(
    new URL(`/api/apps/${appPubkey}`, getAlbyHubUrl()),
    {
      headers: getHeaders(),
    },
  );

  if (!response.ok) {
    throw new Error("Failed to get app balance: " + (await response.text()));
  }

  const app = (await response.json()) as { balance: number };
  return app;
}

export async function createLightningAddress(
  appId: number,
  address: string,
): Promise<void> {
  const response = await fetch(
    new URL("/api/lightning-addresses", getAlbyHubUrl()),
    {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify({
        address,
        appId,
      }),
    },
  );

  if (!response.ok) {
    throw new Error(
      "Failed to create lightning address: " + (await response.text()),
    );
  }
}

// --- Node operations ---

export async function listChannels() {
  const response = await fetch(new URL("/api/channels", getAlbyHubUrl()), {
    headers: getHeaders(),
  });

  if (!response.ok) {
    throw new Error("Failed to list channels: " + (await response.text()));
  }

  return (await response.json()) as {
    localBalance: number;
    remoteBalance: number;
    id: string;
    active: boolean;
    public: boolean;
  }[];
}

export async function getNodeInfo() {
  const [infoRes, connRes, channelsRes] = await Promise.all([
    fetch(new URL("/api/info", getAlbyHubUrl()), { headers: getHeaders() }),
    fetch(new URL("/api/node/connection-info", getAlbyHubUrl()), {
      headers: getHeaders(),
    }),
    fetch(new URL("/api/channels", getAlbyHubUrl()), {
      headers: getHeaders(),
    }),
  ]);

  if (!infoRes.ok) {
    throw new Error("Failed to get node info: " + (await infoRes.text()));
  }
  if (!connRes.ok) {
    throw new Error("Failed to get connection info: " + (await connRes.text()));
  }
  if (!channelsRes.ok) {
    throw new Error("Failed to list channels: " + (await channelsRes.text()));
  }

  const info = (await infoRes.json()) as { nodeAlias: string };
  const conn = (await connRes.json()) as { pubkey: string };
  const channels = (await channelsRes.json()) as unknown[];

  return {
    alias: info.nodeAlias,
    pubkey: conn.pubkey,
    channelCount: channels.length,
  };
}

export async function getNodeBalance() {
  const response = await fetch(new URL("/api/balances", getAlbyHubUrl()), {
    headers: getHeaders(),
  });

  if (!response.ok) {
    throw new Error("Failed to get node balance: " + (await response.text()));
  }

  const data = (await response.json()) as {
    lightning: { totalSpendable: number; totalReceivable: number };
    onchain: { total: number };
  };

  // AlbyHub returns millisats for lightning — convert to sats
  return {
    totalSpendable: Math.floor((data.lightning?.totalSpendable ?? 0) / 1000),
    totalReceivable: Math.floor((data.lightning?.totalReceivable ?? 0) / 1000),
    onchainTotal: data.onchain?.total ?? 0,
  };
}
