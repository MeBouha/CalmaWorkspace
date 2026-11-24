import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";
import { readJson, validationError } from "@/lib/api";
import { roomSchema } from "@/lib/validation";
import { toRoomDTO } from "@/lib/rooms";

export async function GET(req: NextRequest) {
  const guard = await requireRole(req, ["MANAGER"]);
  if (guard.response) return guard.response;
  const rooms = await prisma.room.findMany({ orderBy: [{ active: "desc" }, { name: "asc" }] });
  return NextResponse.json({ rooms: rooms.map(toRoomDTO) });
}

// US-04: add a room.
export async function POST(req: NextRequest) {
  const guard = await requireRole(req, ["MANAGER"]);
  if (guard.response) return guard.response;

  const parsed = roomSchema.safeParse(await readJson(req));
  if (!parsed.success) return validationError(parsed.error);
  const { equipment, ...rest } = parsed.data;

  const room = await prisma.room.create({ data: { ...rest, equipment: JSON.stringify(equipment) } });
  return NextResponse.json({ room: toRoomDTO(room) }, { status: 201 });
}
