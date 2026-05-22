export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { initDb, getSetting } from "@/lib/db";

export async function POST(request) {
  try {
    await initDb();
    const { password } = await request.json();

    if (!password) {
      return NextResponse.json({ error: "Password required" }, { status: 400 });
    }

    const stored = await getSetting("app_password");

    if (!stored) {
      const res = NextResponse.json({ ok: true });
      res.cookies.set("vaulted_auth", "1", { httpOnly: true, path: "/", sameSite: "lax" });
      return res;
    }

    if (password !== stored) {
      return NextResponse.json({ error: "Incorrect password" }, { status: 401 });
    }

    const res = NextResponse.json({ ok: true });
    res.cookies.set("vaulted_auth", "1", { httpOnly: true, path: "/", sameSite: "lax" });
    return res;
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
