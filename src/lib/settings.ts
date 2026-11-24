import { prisma } from "./prisma";

export const DEFAULT_SETTINGS = {
  openingTime: "08:00",
  closingTime: "20:00",
  maxDurationMinutes: 240,
  bufferMinutes: 15,
};

/** Returns the singleton center settings, creating defaults if missing. */
export async function getCenterSettings() {
  return prisma.centerSettings.upsert({
    where: { id: "singleton" },
    update: {},
    create: { id: "singleton", ...DEFAULT_SETTINGS },
  });
}
