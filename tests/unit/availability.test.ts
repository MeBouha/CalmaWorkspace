import { addDays, format } from "date-fns";
import { buildSlot, filterFreeRooms, overlapsWithBuffer, timeToMinutes, validateSlot } from "@/lib/availability";
import { availabilityQuerySchema, roomSchema, settingsSchema } from "@/lib/validation";

const RULES = { openingTime: "08:00", closingTime: "20:00", maxDurationMinutes: 240, bufferMinutes: 15 };
const FUTURE = format(addDays(new Date(), 3), "yyyy-MM-dd");
const q = (startTime: string, durationMinutes: number, participants = 1, date = FUTURE) => ({
  date,
  startTime,
  durationMinutes,
  participants,
});

describe("validateSlot", () => {
  it("accepts a slot inside opening hours", () => {
    expect(validateSlot(q("08:00", 60), RULES)).toBeNull();
    expect(validateSlot(q("16:00", 240), RULES)).toBeNull(); // ends exactly at closing
  });

  it("rejects non-positive duration or participants", () => {
    expect(validateSlot(q("10:00", 0), RULES)).toMatch(/durée/);
    expect(validateSlot(q("10:00", 60, 0), RULES)).toMatch(/personnes/);
  });

  it("rejects duration above the maximum", () => {
    expect(validateSlot(q("08:00", 241), RULES)).toMatch(/240 minutes/);
  });

  it("rejects slots outside opening hours", () => {
    expect(validateSlot(q("07:30", 60), RULES)).toMatch(/08:00 et 20:00/);
    expect(validateSlot(q("19:30", 60), RULES)).toMatch(/08:00 et 20:00/);
  });

  it("rejects past dates", () => {
    const past = format(addDays(new Date(), -1), "yyyy-MM-dd");
    expect(validateSlot(q("10:00", 60, 1, past), RULES)).toMatch(/passée/);
  });
});

describe("overlapsWithBuffer", () => {
  const existing = buildSlot(FUTURE, "10:00", 120); // 10:00–12:00

  it.each([
    ["09:00", 60, 0, false], // ends exactly when existing starts, no buffer
    ["09:00", 60, 15, true], // ends 10:00 but buffer starts 09:45
    ["08:00", 105, 15, false], // ends 09:45 = buffered start → no overlap
    ["12:15", 60, 15, false], // starts exactly at buffered end
    ["12:10", 60, 15, true], // inside the buffer after
    ["11:00", 30, 0, true], // fully inside
    ["09:00", 240, 0, true], // fully covering
  ])("start %s for %i min with buffer %i → %s", (start, duration, buffer, expected) => {
    expect(overlapsWithBuffer(buildSlot(FUTURE, start, duration), existing, buffer)).toBe(expected);
  });
});

describe("filterFreeRooms", () => {
  const slot = buildSlot(FUTURE, "10:00", 60);
  const rooms = [
    { id: "small", capacity: 1, active: true, bookings: [] },
    { id: "busy", capacity: 8, active: true, bookings: [buildSlot(FUTURE, "10:30", 60)] },
    { id: "inactive", capacity: 20, active: false, bookings: [] },
    { id: "free", capacity: 20, active: true, bookings: [buildSlot(FUTURE, "14:00", 60)] },
  ];

  it("keeps only active rooms with enough capacity and no conflict", () => {
    expect(filterFreeRooms(rooms, slot, 2, 15).map((r) => r.id)).toEqual(["free"]);
    expect(filterFreeRooms(rooms, slot, 1, 15).map((r) => r.id)).toEqual(["small", "free"]);
  });
});

describe("validation schemas", () => {
  it("parses availability query strings", () => {
    const r = availabilityQuerySchema.safeParse({ date: FUTURE, startTime: "10:00", durationMinutes: "60", participants: "2" });
    expect(r.success && r.data).toMatchObject({ durationMinutes: 60, participants: 2 });
  });

  it("rejects bad availability inputs", () => {
    for (const bad of [
      { date: "2026-02-30", startTime: "10:00", durationMinutes: "60", participants: "1" },
      { date: FUTURE, startTime: "25:00", durationMinutes: "60", participants: "1" },
      { date: FUTURE, startTime: "10:00", durationMinutes: "-5", participants: "1" },
      { date: FUTURE, startTime: "10:00", durationMinutes: "60", participants: "0" },
      { date: FUTURE, startTime: "10:00", durationMinutes: "abc", participants: "1" },
    ]) {
      expect(availabilityQuerySchema.safeParse(bad).success).toBe(false);
    }
  });

  it("validates settings: opening before closing, positive max, buffer >= 0", () => {
    const ok = { openingTime: "08:00", closingTime: "20:00", maxDurationMinutes: 240, bufferMinutes: 0 };
    expect(settingsSchema.safeParse(ok).success).toBe(true);
    expect(settingsSchema.safeParse({ ...ok, openingTime: "20:00", closingTime: "08:00" }).success).toBe(false);
    expect(settingsSchema.safeParse({ ...ok, maxDurationMinutes: 0 }).success).toBe(false);
    expect(settingsSchema.safeParse({ ...ok, bufferMinutes: -1 }).success).toBe(false);
  });

  it("normalizes room equipment from a comma-separated string", () => {
    const r = roomSchema.parse({ name: "Salle", type: "MEETING", capacity: "4", equipment: " Wi-Fi, projecteur, ,Wi-Fi" });
    expect(r).toMatchObject({ capacity: 4, equipment: ["Wi-Fi", "projecteur"] });
  });

  it("converts times to minutes", () => {
    expect(timeToMinutes("08:30")).toBe(510);
  });
});
