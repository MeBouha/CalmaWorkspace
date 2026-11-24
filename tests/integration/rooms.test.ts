import { GET as listRooms, POST as createRoom } from "@/app/api/manager/rooms/route";
import { PATCH as editRoom } from "@/app/api/manager/rooms/[id]/route";
import { PATCH as toggleRoom } from "@/app/api/manager/rooms/[id]/toggle-active/route";
import { createUser, disconnect, idParams, makeRequest, resetDb } from "../helpers";

beforeEach(resetDb);
afterAll(disconnect);

const room = { name: "Salle Test", type: "MEETING", capacity: 6, equipment: ["projecteur", "Wi-Fi"] };

describe("US-04 manager manages rooms", () => {
  it("creates, lists, edits and toggles a room", async () => {
    const manager = await createUser("MANAGER");
    const created = await createRoom(await makeRequest("/api/manager/rooms", { method: "POST", body: room, user: manager }));
    expect(created.status).toBe(201);
    const { room: r } = await created.json();
    expect(r).toMatchObject({ name: "Salle Test", capacity: 6, equipment: ["projecteur", "Wi-Fi"], active: true });

    const edited = await editRoom(
      await makeRequest("x", { method: "PATCH", body: { capacity: 10, equipment: "tableau blanc, visio" }, user: manager }),
      idParams(r.id),
    );
    expect((await edited.json()).room).toMatchObject({ name: "Salle Test", capacity: 10, equipment: ["tableau blanc", "visio"] });

    const off = await toggleRoom(await makeRequest("x", { method: "PATCH", user: manager }), idParams(r.id));
    expect((await off.json()).room.active).toBe(false);
    const on = await toggleRoom(await makeRequest("x", { method: "PATCH", user: manager }), idParams(r.id));
    expect((await on.json()).room.active).toBe(true);

    const list = await (await listRooms(await makeRequest("/api/manager/rooms", { user: manager }))).json();
    expect(list.rooms).toHaveLength(1);
  });

  it.each([0, -3, 2.5, "abc", 501])("rejects invalid capacity %p", async (capacity) => {
    const manager = await createUser("MANAGER");
    const res = await createRoom(await makeRequest("/api/manager/rooms", { method: "POST", body: { ...room, capacity }, user: manager }));
    expect(res.status).toBe(400);
    expect((await res.json()).fieldErrors.capacity).toBeDefined();
  });

  it("rejects an invalid type and missing name", async () => {
    const manager = await createUser("MANAGER");
    const res = await createRoom(await makeRequest("/api/manager/rooms", { method: "POST", body: { ...room, type: "CAVE", name: "" }, user: manager }));
    const body = await res.json();
    expect(body.fieldErrors.type).toBeDefined();
    expect(body.fieldErrors.name).toBeDefined();
  });

  it("returns 404 for unknown rooms", async () => {
    const manager = await createUser("MANAGER");
    expect((await editRoom(await makeRequest("x", { method: "PATCH", body: { capacity: 3 }, user: manager }), idParams("nope"))).status).toBe(404);
    expect((await toggleRoom(await makeRequest("x", { method: "PATCH", user: manager }), idParams("nope"))).status).toBe(404);
  });

  it("is forbidden for clients", async () => {
    const client = await createUser("CLIENT");
    expect((await createRoom(await makeRequest("/api/manager/rooms", { method: "POST", body: room, user: client }))).status).toBe(403);
  });
});
