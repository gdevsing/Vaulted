export const dynamic = "force-dynamic";
// GET   /api/settings        → all settings
// PATCH /api/settings        → update one or more settings

import { NextResponse } from "next/server";
import { getDb, initDb } from "@/lib/db";

export async function GET() {
  try {
    await initDb();
    const db = getDb();
    const { rows } = await db.execute("SELECT key, value FROM settings");
    const settings = Object.fromEntries(rows.map(r => [r.key, r.value]));
    return NextResponse.json({ settings });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PATCH(request) {
  try {
    await initDb();
    const db = getDb();
    const body = await request.json();

    for (const [key, value] of Object.entries(body)) {
      await db.execute({
        sql: "INSERT OR REPLACE INTO settings (key, value) VALUES (?,?)",
        args: [key, String(value)],
      });
    }

    return NextResponse.json({ updated: true });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
