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
      return NextResponse.json({ ok: true });
    }

    if (password !== stored) {
      return NextResponse.json({ error: "Incorrect password" }, { status: 401 });
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
