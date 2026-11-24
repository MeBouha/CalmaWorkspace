import { NextRequest } from "next/server";
import { middleware } from "@/middleware";
import { ROLE_HOME, allowedRolesFor, canAccess } from "@/lib/roles";
import { SESSION_COOKIE, signSession } from "@/lib/session";
import type { RoleName } from "@/lib/roles";

describe("RBAC rules", () => {
  it.each([
    ["/client/availability", "CLIENT", true],
    ["/client/availability", "MANAGER", false],
    ["/manager/rooms", "MANAGER", true],
    ["/manager/rooms", "CLIENT", false],
    ["/manager/rooms", "PAYMENT_AGENT", false],
    ["/api/manager/agents", "FOLLOW_UP_AGENT", false],
    ["/agent/planning", "FOLLOW_UP_AGENT", true],
    ["/agent/planning", "PAYMENT_AGENT", false],
    ["/agent/payments", "PAYMENT_AGENT", true],
    ["/api/availability", "CLIENT", true],
    ["/api/availability", "MANAGER", false],
  ] as const)("%s for %s → %s", (path, role, expected) => {
    expect(canAccess(path, role)).toBe(expected);
  });

  it("treats public pages as public and protected pages as closed to anonymous users", () => {
    expect(allowedRolesFor("/")).toBeNull();
    expect(canAccess("/login", null)).toBe(true);
    expect(canAccess("/manager", null)).toBe(false);
    // prefix must match a whole segment
    expect(allowedRolesFor("/managerial")).toBeNull();
  });
});

async function run(path: string, role?: RoleName) {
  const headers: Record<string, string> = {};
  if (role) headers.cookie = `${SESSION_COOKIE}=${await signSession({ sub: "u", role, name: "U" })}`;
  return middleware(new NextRequest(new URL(path, "http://localhost"), { headers }));
}

describe("middleware", () => {
  it("redirects anonymous users to /login with next param", async () => {
    const res = await run("/manager/rooms");
    expect(res.status).toBe(307);
    expect(res.headers.get("location")).toBe("http://localhost/login?next=%2Fmanager%2Frooms");
  });

  it("returns 401 JSON for anonymous API calls", async () => {
    expect((await run("/api/manager/rooms")).status).toBe(401);
  });

  it("redirects wrong roles to /unauthorized and returns 403 for APIs", async () => {
    const page = await run("/manager", "CLIENT");
    expect(page.headers.get("location")).toBe("http://localhost/unauthorized");
    expect((await run("/api/manager/settings", "PAYMENT_AGENT")).status).toBe(403);
  });

  it("lets the right role through", async () => {
    const res = await run("/manager/agents", "MANAGER");
    expect(res.headers.get("x-middleware-next")).toBe("1");
  });

  it.each(Object.entries(ROLE_HOME))("sends a logged-in %s away from /login to %s", async (role, home) => {
    const res = await run("/login", role as RoleName);
    expect(res.headers.get("location")).toBe(`http://localhost${home}`);
  });
});
