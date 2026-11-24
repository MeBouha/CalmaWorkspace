import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";
import { jsonError, readJson, validationError } from "@/lib/api";
import { roomUpdateSchema } from "@/lib/validation";
import { toRoomDTO } from "@/lib/rooms";

// US-04: edit a room.
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const guard = await requireRole(req, ["MANAGER"]);
  if (guard.response) return guard.response;
  const { id } = await params;

  const parsed = roomUpdateSchema.safeParse(await readJson(req) ?? {});
  if (!parsed.success) return validationError(parsed.error);
  const { equipment, ...rest } = parsed.data;

  const exists = await prisma.room.findUnique({ where: { id }, select: { id: true } });
  if (!exists) return jsonError(404, "Salle introuvable.");

  const room = await prisma.room.update({
    where: { id },
    data: { ...rest, ...(equipment !== undefined ? { equipment: JSON.stringify(equipment) } : {}) },
  });
  return NextResponse.json({ room: toRoomDTO(room) });
}
