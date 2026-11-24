import type { Room } from "@prisma/client";

export function parseEquipment(raw: string): string[] {
  try {
    const v = JSON.parse(raw);
    return Array.isArray(v) ? v.filter((x): x is string => typeof x === "string") : [];
  } catch {
    return raw.split(",").map((s) => s.trim()).filter(Boolean);
  }
}

export type RoomDTO = Omit<Room, "equipment" | "createdAt" | "updatedAt"> & {
  equipment: string[];
  createdAt: string;
  updatedAt: string;
};

export function toRoomDTO(room: Room): RoomDTO {
  return {
    ...room,
    equipment: parseEquipment(room.equipment),
    createdAt: room.createdAt.toISOString(),
    updatedAt: room.updatedAt.toISOString(),
  };
}
