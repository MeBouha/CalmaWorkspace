import { AgentsManager } from "@/components/AgentsManager";
import { PageHeader } from "@/components/ui";
import { prisma } from "@/lib/prisma";
import { AGENT_ROLES } from "@/lib/roles";
import { toUserDTO } from "@/lib/users";

export const metadata = { title: "Agents · Calma WorkSpace" };

export default async function AgentsPage() {
  const agents = await prisma.user.findMany({
    where: { role: { in: [...AGENT_ROLES] } },
    orderBy: { createdAt: "desc" },
  });
  return (
    <>
      <PageHeader title="Agents" subtitle="Gérez les comptes des agents de suivi et de paiement." />
      <AgentsManager initialAgents={agents.map(toUserDTO)} />
    </>
  );
}
