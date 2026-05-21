export const dynamic = "force-dynamic";
// POST /api/snapshots  → record a new balance snapshot + update account balance
// GET  /api/snapshots  → get history for an account

import { NextResponse } from "next/server";
import { getDb, initDb } from "@/lib/db";

export async function GET(request) {
  try {
    await initDb();
    const db = getDb();
    const { searchParams } = new URL(request.url);
    const accountId = searchParams.get("account_id");
    const limit     = parseInt(searchParams.get("limit") || "52");

    if (!accountId) return NextResponse.json({ error: "account_id required" }, { status: 400 });

    const { rows } = await db.execute({
      sql: `SELECT * FROM snapshots WHERE account_id = ?
            ORDER BY created_at DESC LIMIT ?`,
      args: [accountId, limit],
    });
    return NextResponse.json({ snapshots: rows });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    await initDb();
    const db = getDb();
    const body = await request.json();
    const { account_id, balance, note, fx_rate, method } = body;

    if (!account_id || balance === undefined) {
      return NextResponse.json({ error: "account_id and balance required" }, { status: 400 });
    }

    // Save snapshot
    await db.execute({
      sql: `INSERT INTO snapshots (account_id, balance, note, fx_rate, method)
            VALUES (?,?,?,?,?)`,
      args: [account_id, balance, note || null, fx_rate || null, method || "manual"],
    });

    // Update account's current balance + updated date
    await db.execute({
      sql: "UPDATE accounts SET balance = ?, updated = date('now') WHERE id = ?",
      args: [balance, account_id],
    });

    // Also update native_balance if USD account
    if (fx_rate) {
      const audBalance = balance; // balance is always stored in AUD
      await db.execute({
        sql: "UPDATE accounts SET native_balance = ? WHERE id = ?",
        args: [Math.round(balance * fx_rate * 100) / 100, account_id],
      });
    }

    return NextResponse.json({ saved: true }, { status: 201 });
  } catch (err) {
    console.error("POST /api/snapshots:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
