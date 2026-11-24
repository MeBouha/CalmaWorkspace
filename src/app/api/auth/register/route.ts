import { NextResponse, type NextRequest } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/password";
import { jsonError, readJson, validationError } from "@/lib/api";
import { registerSchema } from "@/lib/validation";
import { SESSION_COOKIE, sessionCookieOptions, signSession } from "@/lib/session";
import { ROLE_HOME } from "@/lib/roles";
import { publicUserSelect } from "@/lib/users";

const DUPLICATE = "Un compte existe déjà avec cet email.";

// US-01: public registration always creates a CLIENT account.
export async function POST(req: NextRequest) {
  const parsed = registerSchema.safeParse(await readJson(req));
  if (!parsed.success) return validationError(parsed.error);
  const { fullName, email, password, clientType } = parsed.data;

  if (await prisma.user.findUnique({ where: { email }, select: { id: true } })) {
    return jsonError(409, DUPLICATE, { email: DUPLICATE });
  }

  try {
    const user = await prisma.user.create({
      data: { fullName, email, passwordHash: await hashPassword(password), role: "CLIENT", clientType },
      select: publicUserSelect,
    });
    const token = await signSession({ sub: user.id, role: user.role, name: user.fullName });
    const res = NextResponse.json({ user, redirectTo: ROLE_HOME.CLIENT }, { status: 201 });
    res.cookies.set(SESSION_COOKIE, token, sessionCookieOptions);
    return res;
  } catch (e) {
    // Race between the check above and the insert.
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
      return jsonError(409, DUPLICATE, { email: DUPLICATE });
    }
    throw e;
  }
}
