// Edge-safe JWT session helpers (used by middleware and server code).
import { SignJWT, jwtVerify } from "jose";
import { ROLES, type RoleName } from "./roles";

export const SESSION_COOKIE = "calma_session";
export const SESSION_TTL_SECONDS = 8 * 60 * 60; // 8h

export type SessionPayload = {
  sub: string; // user id
  role: RoleName;
  name: string;
};

function secretKey(): Uint8Array {
  const secret = process.env.JWT_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error("JWT_SECRET manquant ou trop court (32 caractères minimum).");
  }
  return new TextEncoder().encode(secret);
}

export async function signSession(payload: SessionPayload): Promise<string> {
  return new SignJWT({ role: payload.role, name: payload.name })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(payload.sub)
    .setIssuedAt()
    .setExpirationTime(`${SESSION_TTL_SECONDS}s`)
    .sign(secretKey());
}

export async function verifySession(token: string | undefined | null): Promise<SessionPayload | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secretKey(), { algorithms: ["HS256"] });
    const role = payload.role as RoleName;
    if (!payload.sub || !ROLES.includes(role) || typeof payload.name !== "string") return null;
    return { sub: payload.sub, role, name: payload.name };
  } catch {
    return null;
  }
}

export const sessionCookieOptions = {
  httpOnly: true,
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
  path: "/",
  maxAge: SESSION_TTL_SECONDS,
};
