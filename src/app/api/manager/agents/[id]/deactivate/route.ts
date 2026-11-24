import type { NextRequest } from "next/server";
import { setAgentActive } from "@/lib/agent-status";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  return setAgentActive(req, (await params).id, false);
}
