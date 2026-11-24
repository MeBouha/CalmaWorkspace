import { GET as getSettings, PATCH as patchSettings } from "@/app/api/manager/settings/route";
import { createUser, disconnect, makeRequest, resetDb } from "../helpers";

beforeEach(resetDb);
afterAll(disconnect);

const valid = { openingTime: "09:00", closingTime: "18:00", maxDurationMinutes: 180, bufferMinutes: 10 };

describe("US-05 manager defines booking rules", () => {
  it("returns defaults then saves new settings", async () => {
    const manager = await createUser("MANAGER");
    const initial = await (await getSettings(await makeRequest("/api/manager/settings", { user: manager }))).json();
    expect(initial.settings).toMatchObject({ openingTime: "08:00", closingTime: "20:00", maxDurationMinutes: 240, bufferMinutes: 15 });

    const res = await patchSettings(await makeRequest("/api/manager/settings", { method: "PATCH", body: valid, user: manager }));
    expect(res.status).toBe(200);
    expect((await res.json()).settings).toMatchObject(valid);
  });

  it.each([
    [{ openingTime: "18:00", closingTime: "09:00" }, "closingTime"],
    [{ openingTime: "10:00", closingTime: "10:00" }, "closingTime"],
    [{ openingTime: "8h" }, "openingTime"],
    [{ maxDurationMinutes: 0 }, "maxDurationMinutes"],
    [{ maxDurationMinutes: -60 }, "maxDurationMinutes"],
    [{ bufferMinutes: -5 }, "bufferMinutes"],
  ])("rejects %j", async (patch, field) => {
    const manager = await createUser("MANAGER");
    const res = await patchSettings(await makeRequest("/api/manager/settings", { method: "PATCH", body: { ...valid, ...patch }, user: manager }));
    expect(res.status).toBe(400);
    expect((await res.json()).fieldErrors[field]).toBeDefined();
  });

  it("is forbidden for agents", async () => {
    const agent = await createUser("FOLLOW_UP_AGENT");
    expect((await patchSettings(await makeRequest("/api/manager/settings", { method: "PATCH", body: valid, user: agent }))).status).toBe(403);
  });
});
