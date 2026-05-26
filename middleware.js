import { NextResponse } from "next/server";

// Public routes — no auth required
const PUBLIC_PATHS = [
  "/login",
  "/api/login",
  "/api/logout",
  "/api/verify-password",
];

// Public static assets — PWA files must be accessible without auth
const PUBLIC_PREFIXES = [
  "/_next",
  "/favicon",
  "/icons/",
  "/manifest.json",
];

export function middleware(request) {
  const { pathname } = request.nextUrl;

  // Allow public static assets
  if (PUBLIC_PREFIXES.some(p => pathname.startsWith(p))) {
    return NextResponse.next();
  }

  // Allow public routes
  if (PUBLIC_PATHS.some(p => pathname === p || pathname.startsWith(p + "/"))) {
    return NextResponse.next();
  }

  // Everything else requires auth cookie
  const auth = request.cookies.get("vaulted_auth");
  if (!auth) {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
    }
    return NextResponse.redirect(new URL("/login", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|public).*)"],
};
