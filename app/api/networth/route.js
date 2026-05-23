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

    // Current totals
    const ownerClause = owner && ["H","W","J"].includes(owner)
      ? `WHERE owner = '${owner}' AND active = 1`
      : "WHERE active = 1";

    const { rows: totals } = await db.execute(`
      SELECT
        SUM(balance) as total,
        SUM(CASE WHEN asset = 'cash'   THEN balance ELSE 0 END) as cash,
        SUM(CASE WHEN asset = 'shares' THEN balance ELSE 0 END) as shares,
        SUM(CASE WHEN asset = 'crypto' THEN balance ELSE 0 END) as crypto,
        SUM(CASE WHEN asset = 'super'  THEN balance ELSE 0 END) as super
      FROM accounts ${ownerClause}
    `);

    return NextResponse.json({ networth: totals[0] });
  } catch (err) {
    console.error("GET /api/networth:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
