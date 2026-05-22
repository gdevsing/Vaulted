export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { getDb, initDb } from "@/lib/db";

export async function GET() {
  try {
    await initDb();
    const db = getDb();

    const keys = ["cron_notify_history", "cron_fx_history", "cron_backup_history"];
    const { rows } = await db.execute(
      `SELECT key, value FROM settings WHERE key IN ('${keys.join("','")}')`
    );

    const result = { notify: [], fx: [], backup: [] };
    for (const { key, value } of rows) {
      const type = key.replace("cron_", "").replace("_history", "");
      result[type] = JSON.parse(value || "[]");
    }

    return NextResponse.json(result);
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
