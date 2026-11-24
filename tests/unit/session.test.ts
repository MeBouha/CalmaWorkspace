import { SignJWT } from "jose";
import { SESSION_TTL_SECONDS, signSession, verifySession, sessionCookieOptions } from "@/lib/session";

describe("JWT session helpers", () => {
  it("round-trips a session payload", async () => {
    const token = await signSession({ sub: "u1", role: "MANAGER", name: "Gérant" });
    await expect(verifySession(token)).resolves.toEqual({ sub: "u1", role: "MANAGER", name: "Gérant" });
  });

  it("rejects missing, malformed and tampered tokens", async () => {
    const token = await signSession({ sub: "u1", role: "CLIENT", name: "A" });
    await expect(verifySession(undefined)).resolves.toBeNull();
    await expect(verifySession("not-a-jwt")).resolves.toBeNull();
    await expect(verifySession(token.slice(0, -2) + "xx")).resolves.toBeNull();
  });

  it("rejects tokens signed with another secret", async () => {
    const forged = await new SignJWT({ role: "MANAGER", name: "Hacker" })
      .setProtectedHeader({ alg: "HS256" })
      .setSubject("u1")
      .setExpirationTime("1h")
      .sign(new TextEncoder().encode("another-secret-another-secret-another"));
    await expect(verifySession(forged)).resolves.toBeNull();
  });

  it("rejects expired tokens and unknown roles", async () => {
    const key = new TextEncoder().encode(process.env.JWT_SECRET);
    const expired = await new SignJWT({ role: "CLIENT", name: "A" })
      .setProtectedHeader({ alg: "HS256" })
      .setSubject("u1")
      .setExpirationTime(Math.floor(Date.now() / 1000) - 10)
      .sign(key);
    const badRole = await new SignJWT({ role: "ADMIN", name: "A" })
      .setProtectedHeader({ alg: "HS256" })
      .setSubject("u1")
      .setExpirationTime("1h")
      .sign(key);
    await expect(verifySession(expired)).resolves.toBeNull();
    await expect(verifySession(badRole)).resolves.toBeNull();
  });

  it("uses an 8h httpOnly lax cookie", () => {
    expect(SESSION_TTL_SECONDS).toBe(8 * 3600);
    expect(sessionCookieOptions).toMatchObject({ httpOnly: true, sameSite: "lax", maxAge: 8 * 3600 });
  });
});
