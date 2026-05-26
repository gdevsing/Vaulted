import { NextResponse } from "next/server";
import { getMockResponse } from "@/lib/mock-data";

const PUBLIC = ["/login", "/api/login", "/api/logout", "/api/verify-password"];

export function middleware(request) {
  const { pathname, searchParams } = request.nextUrl;

  if (PUBLIC.some(p => pathname.startsWith(p))) {
    return NextResponse.next();
  }

  const auth = request.cookies.get("vaulted_auth");
  if (!auth) {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
    }
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // Mock mode — intercept all API calls before they reach route handlers or the DB
  if (auth.value === "mock" && pathname.startsWith("/api/")) {
    return NextResponse.json(getMockResponse(pathname, request.method, searchParams));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|public).*)"],
};
