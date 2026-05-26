export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { initDb, getSetting } from "@/lib/db";
import { verifyPassword } from "@/lib/password";

export async function POST(request) {
  try {
    await initDb();
    const { password } = await request.json();

    if (!password) {
      return NextResponse.json({ error: "Password required" }, { status: 400 });
    }

    const stored     = await getSetting("app_password");
    const mockStored = await getSetting("app_password_mock");

    // No password set — allow through as real
    if (!stored) {
      const res = NextResponse.json({ ok: true });
      res.cookies.set("vaulted_auth", "real", { httpOnly: true, secure: true, path: "/", sameSite: "lax", maxAge: 60 * 60 * 24 * 7 });
      return res;
    }

    const valid     = await verifyPassword(password, stored);
    const mockValid = mockStored ? await verifyPassword(password, mockStored) : false;

    if (!valid && !mockValid) {
      return NextResponse.json({ error: "Incorrect password" }, { status: 401 });
    }

    // Real password takes precedence if both match
    const mode = valid ? "real" : "mock";
    const res = NextResponse.json({ ok: true });
    res.cookies.set("vaulted_auth", mode, { httpOnly: true, secure: true, path: "/", sameSite: "lax", maxAge: 60 * 60 * 24 * 7 });
    return res;
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
