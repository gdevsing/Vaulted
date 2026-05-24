export const dynamic = "force-dynamic";

// POST /api/verify-password
// Body: { password: string }
// Returns: { valid: true } or { valid: false }
// Used by admin panel to confirm current password before saving credentials

import { NextResponse } from "next/server";
import { getDb, initDb, getSetting } from "@/lib/db";

export async function POST(request) {
  try {
    await initDb();
    const { password } = await request.json();
    if (!password) return NextResponse.json({ valid: false }, { status: 400 });

    const stored = await getSetting("app_password");
    return NextResponse.json({ valid: password === stored });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
