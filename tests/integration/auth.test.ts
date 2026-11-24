import { POST as register } from "@/app/api/auth/register/route";
import { POST as login } from "@/app/api/auth/login/route";
import { POST as logout } from "@/app/api/auth/logout/route";
import { GET as me } from "@/app/api/auth/me/route";
import { prisma } from "@/lib/prisma";
import { SESSION_COOKIE } from "@/lib/session";
import { createUser, disconnect, makeRequest, resetDb } from "../helpers";

const valid = {
  fullName: "Amira Ben Salah",
  email: "Amira@Example.tn",
  password: "Motdepasse1",
  confirmPassword: "Motdepasse1",
  clientType: "DEVELOPER",
};

beforeEach(resetDb);
afterAll(disconnect);

describe("US-01 register", () => {
  it("creates a CLIENT account, hashes the password and opens a session", async () => {
    const res = await register(await makeRequest("/api/auth/register", { method: "POST", body: valid }));
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.user).toMatchObject({ email: "amira@example.tn", role: "CLIENT", clientType: "DEVELOPER" });
    expect(body.user.passwordHash).toBeUndefined();
    expect(body.redirectTo).toBe("/client/availability");
    expect(res.cookies.get(SESSION_COOKIE)?.value).toBeTruthy();

    const stored = await prisma.user.findUniqueOrThrow({ where: { email: "amira@example.tn" } });
    expect(stored.passwordHash).not.toBe(valid.password);
  });

  it("ignores attempts to self-register as MANAGER", async () => {
    const res = await register(await makeRequest("/api/auth/register", { method: "POST", body: { ...valid, role: "MANAGER" } }));
    expect((await res.json()).user.role).toBe("CLIENT");
  });

  it("rejects duplicate emails (case-insensitive) with 409", async () => {
    await register(await makeRequest("/api/auth/register", { method: "POST", body: valid }));
    const res = await register(
      await makeRequest("/api/auth/register", { method: "POST", body: { ...valid, email: "amira@example.tn" } }),
    );
    expect(res.status).toBe(409);
    expect((await res.json()).fieldErrors.email).toMatch(/existe déjà/);
  });

  it.each([
    [{ email: "not-an-email" }, "email"],
    [{ password: "short", confirmPassword: "short" }, "password"],
    [{ password: "alllowercase1", confirmPassword: "alllowercase1" }, "password"],
    [{ confirmPassword: "Different1" }, "confirmPassword"],
    [{ clientType: "ALIEN" }, "clientType"],
    [{ fullName: "" }, "fullName"],
  ])("rejects invalid input %j", async (patch, field) => {
    const res = await register(await makeRequest("/api/auth/register", { method: "POST", body: { ...valid, ...patch } }));
    expect(res.status).toBe(400);
    expect((await res.json()).fieldErrors[field]).toBeDefined();
  });
});

describe("US-02 login / logout / role redirect", () => {
  it.each([
    ["CLIENT", "/client/availability"],
    ["MANAGER", "/manager"],
    ["FOLLOW_UP_AGENT", "/agent/planning"],
    ["PAYMENT_AGENT", "/agent/payments"],
  ] as const)("logs in a %s and redirects to %s", async (role, redirectTo) => {
    const user = await createUser(role, { password: "Password1" });
    const res = await login(await makeRequest("/api/auth/login", { method: "POST", body: { email: user.email, password: "Password1" } }));
    expect(res.status).toBe(200);
    expect((await res.json()).redirectTo).toBe(redirectTo);
    const cookie = res.headers.get("set-cookie") ?? "";
    expect(cookie).toMatch(/HttpOnly/i);
    expect(cookie).toMatch(/SameSite=lax/i);
  });

  it("rejects a wrong password and an unknown email with the same message", async () => {
    const user = await createUser("CLIENT");
    const wrong = await login(await makeRequest("/api/auth/login", { method: "POST", body: { email: user.email, password: "Nope1234" } }));
    const unknown = await login(await makeRequest("/api/auth/login", { method: "POST", body: { email: "x@y.tn", password: "Nope1234" } }));
    expect(wrong.status).toBe(401);
    expect(unknown.status).toBe(401);
    expect((await wrong.json()).error).toEqual((await unknown.json()).error);
  });

  it("refuses inactive accounts", async () => {
    const user = await createUser("FOLLOW_UP_AGENT", { active: false });
    const res = await login(await makeRequest("/api/auth/login", { method: "POST", body: { email: user.email, password: "Password1" } }));
    expect(res.status).toBe(403);
    expect((await res.json()).error).toMatch(/désactivé/);
  });

  it("logout clears the cookie", async () => {
    const res = await logout();
    expect(res.headers.get("set-cookie")).toMatch(new RegExp(`${SESSION_COOKIE}=;.*Max-Age=0`, "i"));
  });

  it("/api/auth/me returns the user without password hash, 401 otherwise", async () => {
    const user = await createUser("CLIENT");
    const ok = await me(await makeRequest("/api/auth/me", { user }));
    const body = await ok.json();
    expect(body.user).toMatchObject({ id: user.id, role: "CLIENT" });
    expect(body.user.passwordHash).toBeUndefined();
    expect((await me(await makeRequest("/api/auth/me"))).status).toBe(401);
  });

  it("a still-valid token stops working once the account is deactivated", async () => {
    const user = await createUser("CLIENT");
    await prisma.user.update({ where: { id: user.id }, data: { active: false } });
    expect((await me(await makeRequest("/api/auth/me", { user }))).status).toBe(401);
  });
});
