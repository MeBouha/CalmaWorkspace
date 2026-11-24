// Server-side guards for pages / layouts (Server Components).
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "./prisma";
import { SESSION_COOKIE, verifySession } from "./session";
import type { RoleName } from "./roles";

export async function getCurrentUser() {
  const store = await cookies();
  const session = await verifySession(store.get(SESSION_COOKIE)?.value);
  if (!session) return null;
  const user = await prisma.user.findUnique({
    where: { id: session.sub },
    select: { id: true, email: true, fullName: true, role: true, clientType: true, active: true },
  });
  return user && user.active ? user : null;
}

/** Redirects to /login or /unauthorized unless the current user has one of the roles. */
export async function requirePageRole(roles: readonly RoleName[]) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (!roles.includes(user.role)) redirect("/unauthorized");
  return user;
}
