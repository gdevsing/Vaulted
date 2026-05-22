import { NextResponse } from "next/server";

const PUBLIC = ["/login", "/api/login"];

export function middleware(request) {
  const { pathname } = request.nextUrl;

  if (PUBLIC.some(p => pathname.startsWith(p))) {
    return NextResponse.next();
  }

  const auth = request.cookies.get("vaulted_auth");
  if (!auth) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|public).*)"],
};
