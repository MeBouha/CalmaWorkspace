import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "./prisma";
import { requireRole } from "./auth";
import { jsonError } from "./api";
import { AGENT_ROLES } from "./roles";
import { publicUserSelect } from "./users";

/** Shared logic for PATCH /api/manager/agents/:id/(de|re)activate. */
export async function setAgentActive(req: NextRequest, id: string, active: boolean) {
  const guard = await requireRole(req, ["MANAGER"]);
  if (guard.response) return guard.response;

  if (id === guard.user.id) return jsonError(400, "Vous ne pouvez pas modifier votre propre compte.");

  const agent = await prisma.$transaction(async (tx) => {
    const target = await tx.user.findUnique({ where: { id }, select: { role: true } });
    if (!target) return { error: jsonError(404, "Compte introuvable.") };
    if (!(AGENT_ROLES as readonly string[]).includes(target.role)) {
      return { error: jsonError(403, "Seuls les comptes agents peuvent être activés ou désactivés.") };
    }
    return { user: await tx.user.update({ where: { id }, data: { active }, select: publicUserSelect }) };
  });

  if (agent.error) return agent.error;
  return NextResponse.json({ agent: agent.user });
}
