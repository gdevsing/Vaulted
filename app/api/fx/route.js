export const dynamic = "force-dynamic";
// GET /api/fx?from=USD&to=AUD  → live FX rate via frankfurter.app
// Cached in settings table for 24h to avoid hammering the API

import { NextResponse } from "next/server";
import { getDb, initDb } from "@/lib/db";

export async function GET(request) {
  try {
    await initDb();
    const db = getDb();
    const { searchParams } = new URL(request.url);
    const from = searchParams.get("from") || "USD";
    const to   = searchParams.get("to")   || "AUD";

    const cacheKey = `fx_${from}_${to}`;

    // Check cache
    const { rows: cached } = await db.execute({
      sql: "SELECT value, key FROM settings WHERE key = ? OR key = ?",
      args: [cacheKey, `${cacheKey}_ts`],
    });

    const rateRow = cached.find(r => r.key === cacheKey);
    const tsRow   = cached.find(r => r.key === `${cacheKey}_ts`);

    const cacheAge = tsRow
      ? (Date.now() - new Date(tsRow.value).getTime()) / 3600000
      : 999;

    if (rateRow && cacheAge < 24) {
      return NextResponse.json({ rate: parseFloat(rateRow.value), cached: true });
    }

    // Fetch fresh
    const res = await fetch(`https://api.frankfurter.app/latest?from=${from}&to=${to}`);
    if (!res.ok) throw new Error("frankfurter.app error");
    const data = await res.json();
    const rate = data.rates[to];

    // Cache it
    await db.execute({
      sql: "INSERT OR REPLACE INTO settings (key, value) VALUES (?,?), (?,?)",
      args: [cacheKey, String(rate), `${cacheKey}_ts`, new Date().toISOString()],
    });

    return NextResponse.json({ rate, cached: false });
  } catch (err) {
    // Fallback to last known rate
    console.error("GET /api/fx:", err);
    return NextResponse.json({ rate: 0.645, cached: true, fallback: true });
  }
}
