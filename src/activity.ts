import { EventEmitter } from "events";
import { prisma } from "./db.js";

export const activityEmitter = new EventEmitter();
activityEmitter.setMaxListeners(100);

export type ActivityType =
  | "wallet_created"
  | "wallet_died"
  | "charge_collected"
  | "achievement_unlocked";

export interface ActivityEvent {
  id: number;
  type: ActivityType;
  walletName: string | null;
  amountSats: number | null;
  message: string | null;
  createdAt: number;
}

export async function emitActivity(
  type: ActivityType,
  walletName?: string,
  amountSats?: number,
  message?: string,
): Promise<ActivityEvent> {
  const now = Math.floor(Date.now() / 1000);

  const record = await prisma.activity.create({
    data: {
      type,
      walletName: walletName ?? null,
      amountSats: amountSats ?? null,
      message: message ?? null,
      createdAt: now,
    },
  });

  const event: ActivityEvent = {
    id: record.id,
    type: type as ActivityType,
    walletName: record.walletName,
    amountSats: record.amountSats,
    message: record.message,
    createdAt: record.createdAt,
  };

  activityEmitter.emit("activity", event);
  return event;
}

export async function getRecentActivities(
  limit: number = 20,
): Promise<ActivityEvent[]> {
  const records = await prisma.activity.findMany({
    orderBy: { id: "desc" },
    take: limit,
  });

  return records.map((r) => ({
    id: r.id,
    type: r.type as ActivityType,
    walletName: r.walletName,
    amountSats: r.amountSats,
    message: r.message,
    createdAt: r.createdAt,
  }));
}
