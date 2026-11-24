import { NextResponse, type NextRequest } from "next/server";
import { getUserFromRequest } from "@/lib/auth";
import { jsonError } from "@/lib/api";

export async function GET(req: NextRequest) {
  const user = await getUserFromRequest(req);
  if (!user) return jsonError(401, "Vous devez être connecté.");
  return NextResponse.json({ user });
}
