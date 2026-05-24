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

    const stored = await getSetting("app_password");

    // No password set — allow through
    if (!stored) {
      const res = NextResponse.json({ ok: true });
      res.cookies.set("vaulted_auth", "1", { httpOnly: true, path: "/", sameSite: "lax" });
      return res;
    }

    const valid = await verifyPassword(password, stored);

    if (!valid) {
      return NextResponse.json({ error: "Incorrect password" }, { status: 401 });
    }

    const res = NextResponse.json({ ok: true });
    res.cookies.set("vaulted_auth", "1", { httpOnly: true, path: "/", sameSite: "lax" });
    return res;
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
