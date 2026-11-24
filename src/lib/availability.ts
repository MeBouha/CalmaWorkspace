import { addMinutes, format, parse, startOfDay } from "date-fns";
import type { AvailabilityQuery } from "./validation";

export type CenterRules = {
  openingTime: string;
  closingTime: string;
  maxDurationMinutes: number;
  bufferMinutes: number;
};

export type Interval = { startAt: Date; endAt: Date };

export function timeToMinutes(hhmm: string): number {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
}

/** Builds the requested slot in server local time. */
export function buildSlot(date: string, startTime: string, durationMinutes: number): Interval {
  const startAt = parse(`${date} ${startTime}`, "yyyy-MM-dd HH:mm", new Date());
  return { startAt, endAt: addMinutes(startAt, durationMinutes) };
}

/**
 * Business-rule validation of a requested slot against the center rules.
 * Returns a French error message, or null when the slot is acceptable.
 */
export function validateSlot(
  query: Pick<AvailabilityQuery, "date" | "startTime" | "durationMinutes" | "participants">,
  rules: CenterRules,
  now: Date = new Date(),
): string | null {
  if (query.durationMinutes <= 0) return "La durée doit être supérieure à 0.";
  if (query.participants <= 0) return "Le nombre de personnes doit être supérieur à 0.";
  if (query.durationMinutes > rules.maxDurationMinutes) {
    return `La durée maximale d'une réservation est de ${rules.maxDurationMinutes} minutes.`;
  }
  const start = timeToMinutes(query.startTime);
  const end = start + query.durationMinutes;
  if (start < timeToMinutes(rules.openingTime) || end > timeToMinutes(rules.closingTime)) {
    return `Le créneau doit être compris entre ${rules.openingTime} et ${rules.closingTime}.`;
  }
  if (query.date < format(startOfDay(now), "yyyy-MM-dd")) {
    return "Impossible de rechercher une date passée.";
  }
  return null;
}

/**
 * True when the new slot conflicts with an existing booking, taking the buffer
 * into account on both sides of the existing booking.
 */
export function overlapsWithBuffer(slot: Interval, existing: Interval, bufferMinutes: number): boolean {
  const bufferedStart = addMinutes(existing.startAt, -bufferMinutes);
  const bufferedEnd = addMinutes(existing.endAt, bufferMinutes);
  return slot.startAt < bufferedEnd && slot.endAt > bufferedStart;
}

export type RoomWithBookings<R> = R & { capacity: number; active: boolean; bookings: Interval[] };

/** Pure filter: active rooms with enough capacity and no buffered overlap. */
export function filterFreeRooms<R>(
  rooms: RoomWithBookings<R>[],
  slot: Interval,
  participants: number,
  bufferMinutes: number,
): RoomWithBookings<R>[] {
  return rooms.filter(
    (room) =>
      room.active &&
      room.capacity >= participants &&
      !room.bookings.some((b) => overlapsWithBuffer(slot, b, bufferMinutes)),
  );
}
