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
    id: string;
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
    apps: { id: string; name: string }[];
  };
}

export async function deleteApp(appId: string): Promise<void> {
  const response = await fetch(
    new URL(`/api/apps/${appId}`, getAlbyHubUrl()),
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
  appId: string,
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
    throw new Error(
      "Failed to transfer from app: " + (await response.text()),
    );
  }
}

export async function getAppBalance(
  appId: string,
): Promise<{ balance: number }> {
  const response = await fetch(
    new URL(`/api/apps/${appId}`, getAlbyHubUrl()),
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
  appId: string,
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
    channels: {
      localBalance: number;
      remoteBalance: number;
      id: string;
      active: boolean;
      public: boolean;
    }[];
  };
}

export async function getNodeInfo() {
  const response = await fetch(new URL("/api/node", getAlbyHubUrl()), {
    headers: getHeaders(),
  });

  if (!response.ok) {
    throw new Error("Failed to get node info: " + (await response.text()));
  }

  return (await response.json()) as {
    alias: string;
    pubkey: string;
    channelCount: number;
  };
}

export async function getNodeBalance() {
  const response = await fetch(new URL("/api/balances", getAlbyHubUrl()), {
    headers: getHeaders(),
  });

  if (!response.ok) {
    throw new Error("Failed to get node balance: " + (await response.text()));
  }

  return (await response.json()) as {
    totalBalance: number;
  };
}
