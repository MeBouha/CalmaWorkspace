// Server-side guards for API route handlers.
import type { NextRequest } from "next/server";
import { prisma } from "./prisma";
import { jsonError } from "./api";
import { SESSION_COOKIE, verifySession } from "./session";
import type { RoleName } from "./roles";

export type AuthedUser = { id: string; email: string; fullName: string; role: RoleName };

/** Reads the session cookie and re-checks that the user still exists and is active. */
export async function getUserFromRequest(req: NextRequest): Promise<AuthedUser | null> {
  const session = await verifySession(req.cookies.get(SESSION_COOKIE)?.value);
  if (!session) return null;
  const user = await prisma.user.findUnique({
    where: { id: session.sub },
    select: { id: true, email: true, fullName: true, role: true, active: true },
  });
  if (!user || !user.active) return null;
  return { id: user.id, email: user.email, fullName: user.fullName, role: user.role };
}

type GuardResult = { user: AuthedUser; response?: never } | { user?: never; response: Response };

/** Returns the user, or a 401/403 JSON response to return directly. */
export async function requireRole(req: NextRequest, roles: readonly RoleName[]): Promise<GuardResult> {
  const user = await getUserFromRequest(req);
  if (!user) return { response: jsonError(401, "Vous devez être connecté.") };
  if (!roles.includes(user.role)) return { response: jsonError(403, "Accès refusé pour votre rôle.") };
  return { user };
}
