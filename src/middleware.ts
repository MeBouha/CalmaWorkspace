import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE, verifySession } from "@/lib/session";
import { ROLE_HOME, allowedRolesFor } from "@/lib/roles";

// First line of defense. Every API route and page ALSO checks the role server-side
// (and re-checks in the database that the account is still active).
export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const session = await verifySession(req.cookies.get(SESSION_COOKIE)?.value);
  const isApi = pathname.startsWith("/api/");

  if ((pathname === "/login" || pathname === "/register") && session) {
    return NextResponse.redirect(new URL(ROLE_HOME[session.role], req.url));
  }

  const roles = allowedRolesFor(pathname);
  if (!roles) return NextResponse.next();

  if (!session) {
    if (isApi) return NextResponse.json({ error: "Vous devez être connecté." }, { status: 401 });
    const url = new URL("/login", req.url);
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  if (!roles.includes(session.role)) {
    if (isApi) return NextResponse.json({ error: "Accès refusé pour votre rôle." }, { status: 403 });
    return NextResponse.redirect(new URL("/unauthorized", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/login", "/register", "/client/:path*", "/manager/:path*", "/agent/:path*", "/api/manager/:path*", "/api/availability"],
};
