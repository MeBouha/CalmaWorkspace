import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";
import { jsonError, validationError } from "@/lib/api";
import { availabilityQuerySchema } from "@/lib/validation";
import { getCenterSettings } from "@/lib/settings";
import { buildSlot, filterFreeRooms, validateSlot } from "@/lib/availability";
import { toRoomDTO } from "@/lib/rooms";
import { addMinutes } from "date-fns";

// US-06: read-only search of free rooms. No booking is created here.
export async function GET(req: NextRequest) {
  const guard = await requireRole(req, ["CLIENT"]);
  if (guard.response) return guard.response;

  const parsed = availabilityQuerySchema.safeParse(Object.fromEntries(req.nextUrl.searchParams));
  if (!parsed.success) return validationError(parsed.error);
  const query = parsed.data;

  const rules = await getCenterSettings();
  const ruleError = validateSlot(query, rules);
  if (ruleError) return jsonError(400, ruleError);

  const slot = buildSlot(query.date, query.startTime, query.durationMinutes);
  const windowStart = addMinutes(slot.startAt, -rules.bufferMinutes);
  const windowEnd = addMinutes(slot.endAt, rules.bufferMinutes);

  const rooms = await prisma.room.findMany({
    where: { active: true, capacity: { gte: query.participants } },
    include: {
      bookings: {
        where: { status: { not: "CANCELLED" }, startAt: { lt: windowEnd }, endAt: { gt: windowStart } },
        select: { startAt: true, endAt: true },
      },
    },
    orderBy: [{ capacity: "asc" }, { name: "asc" }],
  });

  const free = filterFreeRooms(rooms, slot, query.participants, rules.bufferMinutes);
  return NextResponse.json({
    slot: { startAt: slot.startAt.toISOString(), endAt: slot.endAt.toISOString() },
    rooms: free.map(({ bookings: _bookings, ...room }) => toRoomDTO(room)),
  });
}
