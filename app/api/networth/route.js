export const dynamic = "force-dynamic";
// GET /api/networth          → current total + per-asset breakdown
// GET /api/networth?history  → weekly net worth history for charts

import { NextResponse } from "next/server";
import { getDb, initDb, seedIfEmpty } from "@/lib/db";

export async function GET(request) {
  try {
    await initDb();
    await seedIfEmpty();
    const db = getDb();
    const { searchParams } = new URL(request.url);
    const owner = searchParams.get("owner");
    const history = searchParams.has("history");

    if (history) {
      // Weekly snapshots aggregated — one row per week per asset
      // For now, return the most recent balance per account grouped by week
      const ownerClause = owner && ["H","W","J"].includes(owner)
        ? `AND a.owner = '${owner}'` : "";

      const { rows } = await db.execute(`
        WITH latest AS (
          SELECT
            s.account_id,
            s.balance,
            a.asset,
            strftime('%Y-%W', s.created_at) as week,
            ROW_NUMBER() OVER (
              PARTITION BY s.account_id, strftime('%Y-%W', s.created_at)
              ORDER BY s.created_at DESC
            ) as rn
          FROM snapshots s
          JOIN accounts a ON a.id = s.account_id
          WHERE a.active = 1 ${ownerClause}
        )
        SELECT
          week,
          SUM(balance)                                              as total,
          SUM(CASE WHEN asset = 'cash'   THEN balance ELSE 0 END)  as cash,
          SUM(CASE WHEN asset = 'shares' THEN balance ELSE 0 END)  as shares,
          SUM(CASE WHEN asset = 'crypto' THEN balance ELSE 0 END)  as crypto,
          SUM(CASE WHEN asset = 'super'  THEN balance ELSE 0 END)  as super
        FROM latest
        WHERE rn = 1
        GROUP BY week
        ORDER BY week ASC
        LIMIT 52
      `);
      return NextResponse.json({ history: rows });
    }

    // Current totals — convert non-AUD accounts using today's cached FX rate
    const ownerFilter = owner && ["H","W","J"].includes(owner);
    const { rows: accounts } = await db.execute({
      sql: `SELECT balance, native_balance, currency, asset FROM accounts WHERE active = 1${ownerFilter ? " AND owner = ?" : ""}`,
      args: ownerFilter ? [owner] : [],
    });

    // Pull every cached FX rate from settings (keys like fx_USD_AUD)
    const { rows: fxRows } = await db.execute(
      "SELECT key, value FROM settings WHERE key LIKE 'fx_%' AND key NOT LIKE '%_ts'"
    );
    const fxRates = {};
    for (const r of fxRows) {
      const parts = r.key.split("_"); // ["fx", "USD", "AUD"]
      if (parts.length === 3) fxRates[parts[1]] = parseFloat(r.value);
    }

    let total = 0, cash = 0, shares = 0, crypto = 0, superAmt = 0;
    for (const a of accounts) {
      // Use native_balance * live rate if available, otherwise fall back to stored AUD balance
      const aud = (a.currency !== "AUD" && a.native_balance != null && fxRates[a.currency])
        ? a.native_balance * fxRates[a.currency]
        : (a.balance || 0);
      total  += aud;
      if (a.asset === "cash")   cash     += aud;
      if (a.asset === "shares") shares   += aud;
      if (a.asset === "crypto") crypto   += aud;
      if (a.asset === "super")  superAmt += aud;
    }

    return NextResponse.json({ networth: { total, cash, shares, crypto, super: superAmt } });
  } catch (err) {
    console.error("GET /api/networth:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
