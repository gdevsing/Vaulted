export const dynamic = "force-dynamic";

// GET   /api/settings        → all settings (secrets masked)
// PATCH /api/settings        → update one or more settings

import { NextResponse } from "next/server";
import { getDb, initDb } from "@/lib/db";

const SECRET_KEYS = ["gemini_api_key", "ntfy_password", "gdrive_token"];

export async function GET(request) {
  try {
    await initDb();
    const db = getDb();
    const { searchParams } = new URL(request.url);
    const reveal = searchParams.get("reveal") === "1";

    const { rows } = await db.execute("SELECT key, value FROM settings ORDER BY key");
    const settings = {};
    for (const { key, value } of rows) {
      if (!reveal && SECRET_KEYS.includes(key) && value) {
        settings[key] = "••••••••" + value.slice(-4);
      } else {
        settings[key] = value;
      }
    }
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
      if (typeof value === "string" && value.startsWith("••••")) continue;
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
