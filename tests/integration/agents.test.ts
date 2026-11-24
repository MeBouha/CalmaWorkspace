import { GET as listAgents, POST as createAgent } from "@/app/api/manager/agents/route";
import { PATCH as deactivate } from "@/app/api/manager/agents/[id]/deactivate/route";
import { PATCH as reactivate } from "@/app/api/manager/agents/[id]/reactivate/route";
import { POST as login } from "@/app/api/auth/login/route";
import { createUser, disconnect, idParams, makeRequest, resetDb } from "../helpers";

beforeEach(resetDb);
afterAll(disconnect);

const newAgent = { fullName: "Sana Suivi", email: "sana@calma.tn", role: "FOLLOW_UP_AGENT", temporaryPassword: "Temp1234" };

describe("US-03 manager manages agents", () => {
  it("manager creates an agent who can then log in with the temporary password", async () => {
    const manager = await createUser("MANAGER");
    const res = await createAgent(await makeRequest("/api/manager/agents", { method: "POST", body: newAgent, user: manager }));
    expect(res.status).toBe(201);
    const { agent } = await res.json();
    expect(agent).toMatchObject({ email: "sana@calma.tn", role: "FOLLOW_UP_AGENT", active: true });
    expect(agent.passwordHash).toBeUndefined();

    const loginRes = await login(await makeRequest("/api/auth/login", { method: "POST", body: { email: "sana@calma.tn", password: "Temp1234" } }));
    expect((await loginRes.json()).redirectTo).toBe("/agent/planning");

    const list = await (await listAgents(await makeRequest("/api/manager/agents", { user: manager }))).json();
    expect(list.agents).toHaveLength(1);
  });

  it("cannot create a MANAGER or CLIENT through the agents endpoint", async () => {
    const manager = await createUser("MANAGER");
    for (const role of ["MANAGER", "CLIENT"]) {
      const res = await createAgent(await makeRequest("/api/manager/agents", { method: "POST", body: { ...newAgent, role }, user: manager }));
      expect(res.status).toBe(400);
    }
  });

  it("rejects duplicate emails", async () => {
    const manager = await createUser("MANAGER");
    await createUser("CLIENT", { email: "sana@calma.tn" });
    const res = await createAgent(await makeRequest("/api/manager/agents", { method: "POST", body: newAgent, user: manager }));
    expect(res.status).toBe(409);
  });

  it("deactivates an agent (login refused) and reactivates them", async () => {
    const manager = await createUser("MANAGER");
    const agent = await createUser("PAYMENT_AGENT");

    const off = await deactivate(await makeRequest("x", { method: "PATCH", user: manager }), idParams(agent.id));
    expect((await off.json()).agent.active).toBe(false);
    const refused = await login(await makeRequest("/api/auth/login", { method: "POST", body: { email: agent.email, password: "Password1" } }));
    expect(refused.status).toBe(403);

    const on = await reactivate(await makeRequest("x", { method: "PATCH", user: manager }), idParams(agent.id));
    expect((await on.json()).agent.active).toBe(true);
  });

  it("manager cannot deactivate self, another manager or a client", async () => {
    const manager = await createUser("MANAGER");
    const other = await createUser("MANAGER");
    const client = await createUser("CLIENT");
    expect((await deactivate(await makeRequest("x", { method: "PATCH", user: manager }), idParams(manager.id))).status).toBe(400);
    expect((await deactivate(await makeRequest("x", { method: "PATCH", user: manager }), idParams(other.id))).status).toBe(403);
    expect((await deactivate(await makeRequest("x", { method: "PATCH", user: manager }), idParams(client.id))).status).toBe(403);
    expect((await deactivate(await makeRequest("x", { method: "PATCH", user: manager }), idParams("nope"))).status).toBe(404);
  });

  it.each(["CLIENT", "FOLLOW_UP_AGENT", "PAYMENT_AGENT"] as const)("%s is forbidden (403)", async (role) => {
    const user = await createUser(role);
    expect((await listAgents(await makeRequest("/api/manager/agents", { user }))).status).toBe(403);
    expect((await createAgent(await makeRequest("/api/manager/agents", { method: "POST", body: newAgent, user }))).status).toBe(403);
  });

  it("anonymous users get 401", async () => {
    expect((await listAgents(await makeRequest("/api/manager/agents"))).status).toBe(401);
  });
});
