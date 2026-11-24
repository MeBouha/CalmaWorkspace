import { addDays, format } from "date-fns";
import { GET as availability } from "@/app/api/availability/route";
import { prisma } from "@/lib/prisma";
import { buildSlot } from "@/lib/availability";
import { createUser, disconnect, makeRequest, resetDb } from "../helpers";

const DAY = format(addDays(new Date(), 5), "yyyy-MM-dd");

async function seedRooms() {
  const mk = (name: string, type: "INDIVIDUAL" | "MULTI_PERSON" | "MEETING" | "TRAINING", capacity: number, active = true) =>
    prisma.room.create({ data: { name, type, capacity, active, equipment: JSON.stringify(["Wi-Fi"]) } });
  const solo = await mk("Solo", "INDIVIDUAL", 1);
  const duo = await mk("Duo", "MULTI_PERSON", 2);
  const meeting = await mk("Réunion", "MEETING", 8);
  const training = await mk("Formation", "TRAINING", 20);
  await mk("Fermée", "TRAINING", 30, false);
  // Réunion busy 10:00–12:00
  await prisma.booking.create({ data: { roomId: meeting.id, participants: 6, ...buildSlot(DAY, "10:00", 120) } });
  // Cancelled bookings never block a room
  await prisma.booking.create({ data: { roomId: training.id, participants: 6, status: "CANCELLED", ...buildSlot(DAY, "10:00", 120) } });
  return { solo, duo, meeting, training };
}

async function search(params: Record<string, string | number>, role: "CLIENT" | "MANAGER" = "CLIENT") {
  const user = await createUser(role);
  const qs = new URLSearchParams(Object.entries(params).map(([k, v]) => [k, String(v)]));
  return availability(await makeRequest(`/api/availability?${qs}`, { user }));
}

const names = async (res: Response) => ((await res.json()).rooms as { name: string }[]).map((r) => r.name);

beforeEach(async () => {
  await resetDb();
  await seedRooms();
});
afterAll(disconnect);

describe("US-06 client searches free rooms", () => {
  it("filters by capacity and excludes inactive rooms", async () => {
    const res = await search({ date: DAY, startTime: "15:00", durationMinutes: 60, participants: 2 });
    expect(res.status).toBe(200);
    expect(await names(res)).toEqual(["Duo", "Réunion", "Formation"]);
  });

  it("excludes a room with an overlapping booking", async () => {
    const res = await search({ date: DAY, startTime: "11:00", durationMinutes: 60, participants: 5 });
    expect(await names(res)).toEqual(["Formation"]);
  });

  it("applies the buffer around existing bookings", async () => {
    // Booking ends 12:00, buffer 15 → 12:10 conflicts, 12:15 is free.
    expect(await names(await search({ date: DAY, startTime: "12:10", durationMinutes: 30, participants: 5 }))).toEqual(["Formation"]);
    expect(await names(await search({ date: DAY, startTime: "12:15", durationMinutes: 30, participants: 5 }))).toEqual([
      "Réunion",
      "Formation",
    ]);
  });

  it("returns an empty list when nothing fits", async () => {
    const res = await search({ date: DAY, startTime: "10:00", durationMinutes: 60, participants: 25 });
    expect((await res.json()).rooms).toEqual([]);
  });

  it("returns room details with parsed equipment", async () => {
    const res = await search({ date: DAY, startTime: "15:00", durationMinutes: 60, participants: 20 });
    expect((await res.json()).rooms[0]).toMatchObject({ name: "Formation", type: "TRAINING", capacity: 20, equipment: ["Wi-Fi"] });
  });

  it.each([
    [{ startTime: "07:00", durationMinutes: 60 }, /entre 08:00 et 20:00/],
    [{ startTime: "19:30", durationMinutes: 60 }, /entre 08:00 et 20:00/],
    [{ startTime: "08:00", durationMinutes: 300 }, /240 minutes/],
  ])("rejects slots that break center rules %j", async (patch, message) => {
    const res = await search({ date: DAY, participants: 1, ...patch });
    expect(res.status).toBe(400);
    expect((await res.json()).error).toMatch(message);
  });

  it("validates query parameters", async () => {
    const res = await search({ date: "demain", startTime: "10:00", durationMinutes: 0, participants: -1 });
    expect(res.status).toBe(400);
    const { fieldErrors } = await res.json();
    expect(Object.keys(fieldErrors).sort()).toEqual(["date", "durationMinutes", "participants"]);
  });

  it("is reserved to clients", async () => {
    const res = await search({ date: DAY, startTime: "10:00", durationMinutes: 60, participants: 1 }, "MANAGER");
    expect(res.status).toBe(403);
  });
});
