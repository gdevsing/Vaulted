// GET    /api/accounts/:id  → single account
// PATCH  /api/accounts/:id  → update account fields
// DELETE /api/accounts/:id  → soft-delete account

import { NextResponse } from "next/server";
import { getDb, initDb } from "@/lib/db";

export async function GET(request, { params }) {
  try {
    await initDb();
    const db = getDb();
    const { rows } = await db.execute({
      sql: "SELECT * FROM accounts WHERE id = ? AND active = 1",
      args: [params.id],
    });
    if (!rows.length) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json({ account: rows[0] });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PATCH(request, { params }) {
  try {
    await initDb();
    const db = getDb();
    const body = await request.json();

    const allowed = ["name","institution","owner","asset","currency","frequency","grp","balance","native_balance"];
    const fields  = Object.keys(body).filter(k => allowed.includes(k));
    if (!fields.length) return NextResponse.json({ error: "No valid fields" }, { status: 400 });

    const setClauses = fields.map(f => `${f} = ?`).join(", ");
    const args       = [...fields.map(f => body[f]), params.id];

    await db.execute({
      sql: `UPDATE accounts SET ${setClauses}, updated = date('now') WHERE id = ?`,
      args,
    });

    const { rows } = await db.execute({
      sql: "SELECT * FROM accounts WHERE id = ?",
      args: [params.id],
    });
    return NextResponse.json({ account: rows[0] });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    await initDb();
    const db = getDb();
    await db.execute({
      sql: "UPDATE accounts SET active = 0 WHERE id = ?",
      args: [params.id],
    });
    return NextResponse.json({ deleted: true });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
