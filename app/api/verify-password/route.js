export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { initDb, getSetting } from "@/lib/db";
import { verifyPassword } from "@/lib/password";

export async function POST(request) {
  try {
    await initDb();
    const { password } = await request.json();
    if (!password) return NextResponse.json({ valid: false }, { status: 400 });

    const stored = await getSetting("app_password");
    const valid  = await verifyPassword(password, stored);
    return NextResponse.json({ valid });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
