export const dynamic = "force-dynamic";
// GET /api/networth          → current total + per-asset breakdown
// GET /api/networth?history  → weekly net worth history for charts
//                               (totals, per-asset and per-account, with each
//                               account's last known balance carried forward)

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
      return NextResponse.json(await buildHistory(db, owner));
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

// ─── History helpers ──────────────────────────────────────────────────────────

const TZ = "Australia/Sydney";
const DAY = 86400000;

// "YYYY-MM-DD HH:MM:SS" (UTC, as stored by SQLite) → Sydney calendar date at UTC midnight
function toLocalDay(createdAt) {
  const utc = new Date(String(createdAt).replace(" ", "T") + "Z");
  const ymd = new Intl.DateTimeFormat("en-CA", { timeZone: TZ, year: "numeric", month: "2-digit", day: "2-digit" }).format(utc);
  return new Date(ymd + "T00:00:00Z");
}

// Monday of the week containing d (weeks run Monday → Sunday)
function weekStart(d) {
  const dow = (d.getUTCDay() + 6) % 7; // Mon=0 … Sun=6
  return new Date(d.getTime() - dow * DAY);
}

const isoDate = (d) => d.toISOString().slice(0, 10);

// Same format as SQLite strftime('%Y-%W') so existing consumers keep working
function weekKey(monday) {
  const year  = monday.getUTCFullYear();
  const yday  = Math.floor((monday - Date.UTC(year, 0, 1)) / DAY);
  const wday  = monday.getUTCDay();
  const wk    = Math.floor((yday + 7 - ((wday + 6) % 7)) / 7);
  return `${year}-${String(wk).padStart(2, "0")}`;
}

async function buildHistory(db, owner) {
  const ownerOk = owner && ["H", "W", "J"].includes(owner);

  const { rows: accounts } = await db.execute({
    sql: `SELECT id, name, institution, owner, asset, currency FROM accounts
          WHERE active = 1${ownerOk ? " AND owner = ?" : ""} ORDER BY id`,
    args: ownerOk ? [owner] : [],
  });
  if (!accounts.length) return { history: [], accounts: [] };

  const ids = accounts.map(a => Number(a.id));
  const { rows: snaps } = await db.execute({
    sql: `SELECT account_id, balance, created_at FROM snapshots
          WHERE account_id IN (${ids.map(() => "?").join(",")})
          ORDER BY created_at ASC, id ASC`,
    args: ids,
  });
  if (!snaps.length) return { history: [], accounts: accounts.map(shapeAccount) };

  // Latest balance per account per week (snaps are ascending, so later ones overwrite)
  const byWeek = new Map(); // weekStartISO → Map(accountId → balance)
  for (const s of snaps) {
    const wk = isoDate(weekStart(toLocalDay(s.created_at)));
    if (!byWeek.has(wk)) byWeek.set(wk, new Map());
    byWeek.get(wk).set(Number(s.account_id), Number(s.balance));
  }

  const assetOf = new Map(accounts.map(a => [Number(a.id), a.asset]));
  const weeks   = [...byWeek.keys()].sort();
  const first   = new Date(weeks[0] + "T00:00:00Z");
  const last    = new Date(weeks[weeks.length - 1] + "T00:00:00Z");

  // Walk every week from first to last, carrying each account's last known balance forward
  const current = new Map();
  const history = [];
  for (let t = first.getTime(); t <= last.getTime(); t += 7 * DAY) {
    const monday = new Date(t);
    const updates = byWeek.get(isoDate(monday));
    if (updates) for (const [id, bal] of updates) current.set(id, bal);

    const row = {
      week:     weekKey(monday),
      week_end: isoDate(new Date(t + 6 * DAY)), // Sunday
      total: 0, cash: 0, shares: 0, crypto: 0, super: 0,
      synced: updates ? updates.size : 0,
    };
    for (const id of ids) {
      const bal = current.get(id);
      row[`a_${id}`] = bal ?? null;  // null until the account's first snapshot
      if (bal == null) continue;
      row.total += bal;
      row[assetOf.get(id)] += bal;
    }
    for (const k of ["total", "cash", "shares", "crypto", "super"]) row[k] = Math.round(row[k] * 100) / 100;
    history.push(row);
  }

  return { history, accounts: accounts.map(shapeAccount) };
}

function shapeAccount(a) {
  return {
    id: Number(a.id), name: a.name, institution: a.institution,
    owner: a.owner, asset: a.asset, currency: a.currency, key: `a_${a.id}`,
  };
}
