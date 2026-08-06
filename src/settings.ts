import {
  createCipheriv,
  createDecipheriv,
  createHash,
  randomBytes,
} from "node:crypto";
import { prisma } from "./db.js";

const ALBY_TOKEN_KEY = "alby.authToken";
const RUNTIME_SETTINGS_KEY = "runtime.settings";

export type RuntimeSettings = {
  chargeAmountSats: number;
  chargeIntervalMs: number;
  gracePeriodSeconds: number;
  rateLimitPerHour: number;
  rateLimitCleanupMs: number;
};

function envInteger(name: string, fallback: number): number {
  const raw = process.env[name]?.trim();
  if (!raw) return fallback;
  const value = Number(raw);
  return Number.isInteger(value) ? value : fallback;
}

const runtimeDefaults: RuntimeSettings = {
  chargeAmountSats: envInteger("CHARGE_AMOUNT_SATS", 1),
  chargeIntervalMs: envInteger("CHARGE_INTERVAL_MS", 3_600_000),
  gracePeriodSeconds: envInteger("GRACE_PERIOD_SECS", 3_600),
  rateLimitPerHour: envInteger("RATE_LIMIT_PER_HOUR", 10),
  rateLimitCleanupMs: envInteger("RATE_LIMIT_CLEANUP_MS", 600_000),
};

let runtimeSettings = runtimeDefaults;

export type TokenSource = "environment" | "database" | "none";

function encryptionKey(): Buffer {
  const secret = process.env.LNCURL_ENCRYPTION_SECRET?.trim();
  if (!secret) throw new Error("LNCURL_ENCRYPTION_SECRET is required");
  return createHash("sha256").update(secret).digest();
}

function encrypt(key: string, value: string): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", encryptionKey(), iv);
  cipher.setAAD(Buffer.from(key));
  const encrypted = Buffer.concat([cipher.update(value, "utf8"), cipher.final()]);
  return [iv, cipher.getAuthTag(), encrypted]
    .map((part) => part.toString("base64url"))
    .join(".");
}

function decrypt(key: string, value: string): string {
  const [iv, tag, encrypted] = value
    .split(".")
    .map((part) => Buffer.from(part, "base64url"));
  const decipher = createDecipheriv("aes-256-gcm", encryptionKey(), iv);
  decipher.setAAD(Buffer.from(key));
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(encrypted), decipher.final()]).toString("utf8");
}

export async function getAlbyToken(): Promise<{
  token: string | null;
  source: TokenSource;
}> {
  const environmentToken = process.env.AUTH_TOKEN?.trim();
  if (environmentToken) return { token: environmentToken, source: "environment" };

  const setting = await prisma.setting.findUnique({
    where: { key: ALBY_TOKEN_KEY },
  });
  if (!setting) return { token: null, source: "none" };
  return { token: decrypt(ALBY_TOKEN_KEY, setting.encryptedValue), source: "database" };
}

export async function saveAlbyToken(token: string): Promise<void> {
  if (process.env.AUTH_TOKEN?.trim()) {
    throw new Error("The Alby Hub token is managed by the environment.");
  }
  const now = Math.floor(Date.now() / 1000);
  const encryptedValue = encrypt(ALBY_TOKEN_KEY, token);
  await prisma.setting.upsert({
    where: { key: ALBY_TOKEN_KEY },
    create: { key: ALBY_TOKEN_KEY, encryptedValue, createdAt: now, updatedAt: now },
    update: { encryptedValue, updatedAt: now },
  });
}

function boundedInteger(
  value: unknown,
  name: string,
  min: number,
  max: number,
): number {
  if (!Number.isInteger(value) || (value as number) < min || (value as number) > max) {
    throw new Error(`${name} must be an integer between ${min} and ${max}.`);
  }
  return value as number;
}

export function validateRuntimeSettings(value: unknown): RuntimeSettings {
  const settings = value as Partial<RuntimeSettings> | null;
  if (!settings || typeof settings !== "object") {
    throw new Error("Invalid settings payload.");
  }
  return {
    chargeAmountSats: boundedInteger(settings.chargeAmountSats, "Charge amount", 1, 1_000_000),
    chargeIntervalMs: boundedInteger(settings.chargeIntervalMs, "Charge interval", 60_000, 2_592_000_000),
    gracePeriodSeconds: boundedInteger(settings.gracePeriodSeconds, "Grace period", 0, 2_592_000),
    rateLimitPerHour: boundedInteger(settings.rateLimitPerHour, "Rate limit", 1, 10_000),
    rateLimitCleanupMs: boundedInteger(settings.rateLimitCleanupMs, "Rate-limit cleanup", 60_000, 86_400_000),
  };
}

export function getRuntimeSettings(): RuntimeSettings {
  return runtimeSettings;
}

export async function loadRuntimeSettings(): Promise<RuntimeSettings> {
  const setting = await prisma.setting.findUnique({ where: { key: RUNTIME_SETTINGS_KEY } });
  runtimeSettings = setting
    ? validateRuntimeSettings(JSON.parse(decrypt(RUNTIME_SETTINGS_KEY, setting.encryptedValue)))
    : validateRuntimeSettings(runtimeDefaults);
  return runtimeSettings;
}

export async function saveRuntimeSettings(value: unknown): Promise<RuntimeSettings> {
  const settings = validateRuntimeSettings(value);
  const now = Math.floor(Date.now() / 1000);
  const encryptedValue = encrypt(RUNTIME_SETTINGS_KEY, JSON.stringify(settings));
  await prisma.setting.upsert({
    where: { key: RUNTIME_SETTINGS_KEY },
    create: { key: RUNTIME_SETTINGS_KEY, encryptedValue, createdAt: now, updatedAt: now },
    update: { encryptedValue, updatedAt: now },
  });
  runtimeSettings = settings;
  return settings;
}
