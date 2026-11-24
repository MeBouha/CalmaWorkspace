import { NextRequest } from "next/server";
import type { Role } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/password";
import { SESSION_COOKIE, signSession } from "@/lib/session";

export async function resetDb() {
  await prisma.booking.deleteMany();
  await prisma.room.deleteMany();
  await prisma.user.deleteMany();
  await prisma.centerSettings.deleteMany();
}

let counter = 0;
export async function createUser(role: Role, overrides: { email?: string; password?: string; active?: boolean } = {}) {
  counter += 1;
  return prisma.user.create({
    data: {
      email: overrides.email ?? `${role.toLowerCase()}${counter}@test.tn`,
      fullName: `${role} ${counter}`,
      role,
      clientType: role === "CLIENT" ? "STUDENT" : null,
      active: overrides.active ?? true,
      passwordHash: await hashPassword(overrides.password ?? "Password1"),
    },
  });
}

export async function tokenFor(user: { id: string; role: Role; fullName: string }) {
  return signSession({ sub: user.id, role: user.role, name: user.fullName });
}

type ReqOptions = { method?: string; body?: unknown; user?: { id: string; role: Role; fullName: string } };

/** Builds a NextRequest, optionally authenticated as `user`. */
export async function makeRequest(path: string, { method = "GET", body, user }: ReqOptions = {}) {
  const headers: Record<string, string> = { "content-type": "application/json" };
  if (user) headers.cookie = `${SESSION_COOKIE}=${await tokenFor(user)}`;
  return new NextRequest(new URL(path, "http://localhost"), {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
  });
}

export const idParams = (id: string) => ({ params: Promise.resolve({ id }) });

export async function disconnect() {
  await prisma.$disconnect();
}
