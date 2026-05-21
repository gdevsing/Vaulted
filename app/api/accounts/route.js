export const dynamic = "force-dynamic";
// GET  /api/accounts        → list all active accounts
// POST /api/accounts        → create new account

import { NextResponse } from "next/server";
import { getDb, initDb, seedIfEmpty } from "@/lib/db";

async function ensureReady() {
  await initDb();
  await seedIfEmpty();
}

export async function GET(request) {
  try {
    await ensureReady();
    const db = getDb();
    const { searchParams } = new URL(request.url);
    const owner = searchParams.get("owner"); // "H" | "W" | null

    let sql = "SELECT * FROM accounts WHERE active = 1";
    const args = [];
    if (owner && ["H","W"].includes(owner)) {
      sql += " AND owner = ?";
      args.push(owner);
    }
    sql += " ORDER BY asset, name";

    const { rows } = await db.execute({ sql, args });
    return NextResponse.json({ accounts: rows });
  } catch (err) {
    console.error("GET /api/accounts:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    await ensureReady();
    const db = getDb();
    const body = await request.json();
    const { name, institution, owner, asset, currency, frequency, group } = body;

    if (!name || !institution || !owner || !asset) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const result = await db.execute({
      sql: `INSERT INTO accounts (name, institution, owner, asset, currency, frequency, grp, balance, updated)
            VALUES (?,?,?,?,?,?,?,0,date('now'))`,
      args: [name, institution, owner, asset, currency || "AUD", frequency || "weekly", group || null],
    });

    const { rows } = await db.execute({
      sql: "SELECT * FROM accounts WHERE id = ?",
      args: [result.lastInsertRowid],
    });

    return NextResponse.json({ account: rows[0] }, { status: 201 });
  } catch (err) {
    console.error("POST /api/accounts:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
