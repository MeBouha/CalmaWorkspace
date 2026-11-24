import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";
import { readJson, validationError } from "@/lib/api";
import { settingsSchema } from "@/lib/validation";
import { getCenterSettings } from "@/lib/settings";

export async function GET(req: NextRequest) {
  const guard = await requireRole(req, ["MANAGER"]);
  if (guard.response) return guard.response;
  return NextResponse.json({ settings: await getCenterSettings() });
}

// US-05: opening hours, max duration, buffer.
export async function PATCH(req: NextRequest) {
  const guard = await requireRole(req, ["MANAGER"]);
  if (guard.response) return guard.response;

  const parsed = settingsSchema.safeParse(await readJson(req));
  if (!parsed.success) return validationError(parsed.error);

  const settings = await prisma.centerSettings.upsert({
    where: { id: "singleton" },
    update: parsed.data,
    create: { id: "singleton", ...parsed.data },
  });
  return NextResponse.json({ settings });
}
