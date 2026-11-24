import { NextResponse, type NextRequest } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";
import { hashPassword } from "@/lib/password";
import { jsonError, readJson, validationError } from "@/lib/api";
import { createAgentSchema } from "@/lib/validation";
import { AGENT_ROLES } from "@/lib/roles";
import { publicUserSelect } from "@/lib/users";

const DUPLICATE = "Un compte existe déjà avec cet email.";

export async function GET(req: NextRequest) {
  const guard = await requireRole(req, ["MANAGER"]);
  if (guard.response) return guard.response;
  const agents = await prisma.user.findMany({
    where: { role: { in: [...AGENT_ROLES] } },
    select: publicUserSelect,
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json({ agents });
}

// US-03: create a follow-up or payment agent with a temporary password.
export async function POST(req: NextRequest) {
  const guard = await requireRole(req, ["MANAGER"]);
  if (guard.response) return guard.response;

  const parsed = createAgentSchema.safeParse(await readJson(req));
  if (!parsed.success) return validationError(parsed.error);
  const { fullName, email, role, temporaryPassword } = parsed.data;

  try {
    const agent = await prisma.user.create({
      data: { fullName, email, role, passwordHash: await hashPassword(temporaryPassword) },
      select: publicUserSelect,
    });
    return NextResponse.json({ agent }, { status: 201 });
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
      return jsonError(409, DUPLICATE, { email: DUPLICATE });
    }
    throw e;
  }
}
