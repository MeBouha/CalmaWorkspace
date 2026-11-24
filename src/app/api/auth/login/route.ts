import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashPassword, verifyPassword } from "@/lib/password";
import { jsonError, readJson, validationError } from "@/lib/api";
import { loginSchema } from "@/lib/validation";
import { SESSION_COOKIE, sessionCookieOptions, signSession } from "@/lib/session";
import { ROLE_HOME } from "@/lib/roles";

// Hash compared against when the email is unknown, so both cases take the same time
// (prevents discovering registered emails by timing).
let dummyHash: Promise<string> | undefined;
const getDummyHash = () => (dummyHash ??= hashPassword("calma-dummy-password"));

export async function POST(req: NextRequest) {
  const parsed = loginSchema.safeParse(await readJson(req));
  if (!parsed.success) return validationError(parsed.error);
  const { email, password } = parsed.data;

  const user = await prisma.user.findUnique({ where: { email } });
  const ok = await verifyPassword(password, user?.passwordHash ?? (await getDummyHash()));
  if (!user || !ok) return jsonError(401, "Email ou mot de passe incorrect.");
  if (!user.active) return jsonError(403, "Ce compte est désactivé. Contactez le gérant.");

  const token = await signSession({ sub: user.id, role: user.role, name: user.fullName });
  const res = NextResponse.json({
    user: { id: user.id, email: user.email, fullName: user.fullName, role: user.role },
    redirectTo: ROLE_HOME[user.role],
  });
  res.cookies.set(SESSION_COOKIE, token, sessionCookieOptions);
  return res;
}
