import assert from "node:assert/strict";
import test from "node:test";
import Fastify from "fastify";
import { validateRuntimeSettings } from "../src/settings.js";
import {
  configRoutes,
  settingsRoutes,
  unsafePublicSettingsEnabled,
} from "../src/routes/settings.js";

const valid = {
  chargeAmountSats: 1,
  chargeIntervalMs: 3_600_000,
  gracePeriodSeconds: 3_600,
  rateLimitPerHour: 10,
  rateLimitCleanupMs: 600_000,
};

test("runtime settings accept safe integers and reject unsafe values", () => {
  assert.deepEqual(validateRuntimeSettings(valid), valid);
  assert.throws(() => validateRuntimeSettings({ ...valid, chargeAmountSats: 0 }));
  assert.throws(() => validateRuntimeSettings({ ...valid, chargeIntervalMs: 1_000 }));
  assert.throws(() => validateRuntimeSettings({ ...valid, rateLimitPerHour: 1.5 }));
});

test("public settings default to disabled", () => {
  delete process.env.UNSAFE_PUBLIC_SETTINGS;
  assert.equal(unsafePublicSettingsEnabled(), false);
  process.env.UNSAFE_PUBLIC_SETTINGS = "true";
  assert.equal(unsafePublicSettingsEnabled(), true);
  delete process.env.UNSAFE_PUBLIC_SETTINGS;
});

test("public config exposes only the settings feature flag", async () => {
  delete process.env.UNSAFE_PUBLIC_SETTINGS;
  const app = Fastify();
  await app.register(configRoutes);
  assert.deepEqual((await app.inject({ url: "/api/config" })).json(), {
    unsafePublicSettings: false,
  });
  process.env.UNSAFE_PUBLIC_SETTINGS = "true";
  assert.deepEqual((await app.inject({ url: "/api/config" })).json(), {
    unsafePublicSettings: true,
  });
  await app.close();
  delete process.env.UNSAFE_PUBLIC_SETTINGS;
});

test("settings API only accepts the configured Umbrel proxy", async () => {
  process.env.UNSAFE_PUBLIC_SETTINGS = "true";
  process.env.UMBREL_APP_PROXY_HOST = "127.0.0.1";
  const app = Fastify();
  await app.register(settingsRoutes);

  assert.equal((await app.inject({ url: "/api/settings" })).statusCode, 200);
  assert.equal(
    (await app.inject({ url: "/api/settings", remoteAddress: "127.0.0.2" })).statusCode,
    403,
  );

  await app.close();
  delete process.env.UNSAFE_PUBLIC_SETTINGS;
  delete process.env.UMBREL_APP_PROXY_HOST;
});
