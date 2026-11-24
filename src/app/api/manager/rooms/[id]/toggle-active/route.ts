import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";
import { jsonError } from "@/lib/api";
import { toRoomDTO } from "@/lib/rooms";

// US-04: deactivate / reactivate a room (rooms are never hard-deleted).
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const guard = await requireRole(req, ["MANAGER"]);
  if (guard.response) return guard.response;
  const { id } = await params;

  const room = await prisma.$transaction(async (tx) => {
    const current = await tx.room.findUnique({ where: { id }, select: { active: true } });
    if (!current) return null;
    return tx.room.update({ where: { id }, data: { active: !current.active } });
  });
  if (!room) return jsonError(404, "Salle introuvable.");
  return NextResponse.json({ room: toRoomDTO(room) });
}
