// ─── Vaulted Database ─────────────────────────────────────────────────────────
// Uses @libsql/client (pure-JS SQLite, works on Oracle VPS without native deps)
// On the VPS, swap the url to "file:./vaulted.db" for a local file.

import { createClient } from "@libsql/client";
import path from "path";

let _db;

export function getDb() {
  if (_db) return _db;
  _db = createClient({
    url: "file:" + path.join(process.cwd(), "vaulted.db"),
  });
  return _db;
}

// ─── Schema ───────────────────────────────────────────────────────────────────
export async function initDb() {
  const db = getDb();

  await db.execute(`
    CREATE TABLE IF NOT EXISTS accounts (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      name        TEXT NOT NULL,
      institution TEXT NOT NULL,
      owner       TEXT NOT NULL CHECK(owner IN ('H','W')),
      asset       TEXT NOT NULL CHECK(asset IN ('cash','shares','crypto','super')),
      currency    TEXT NOT NULL DEFAULT 'AUD',
      frequency   TEXT NOT NULL DEFAULT 'weekly',
      grp         TEXT,
      balance     REAL NOT NULL DEFAULT 0,
      native_balance REAL,
      updated     TEXT NOT NULL DEFAULT (date('now')),
      active      INTEGER NOT NULL DEFAULT 1
    )
  `);

  await db.execute(`
    CREATE TABLE IF NOT EXISTS snapshots (
      id         INTEGER PRIMARY KEY AUTOINCREMENT,
      account_id INTEGER NOT NULL REFERENCES accounts(id),
      balance    REAL NOT NULL,
      note       TEXT,
      fx_rate    REAL,
      method     TEXT DEFAULT 'manual',
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    )
  `);

  await db.execute(`
    CREATE TABLE IF NOT EXISTS settings (
      key   TEXT PRIMARY KEY,
      value TEXT NOT NULL
    )
  `);

  // Seed default settings if empty
  await db.execute(`
    INSERT OR IGNORE INTO settings (key, value) VALUES
      ('notify_day',   'sunday'),
      ('ntfy_topic',   'vaulted-sync'),
      ('gemini_model', 'gemini-2.5-flash'),
      ('fx_base',      'AUD')
  `);
}

// ─── Seed demo accounts (only if table is empty) ──────────────────────────────
export async function seedIfEmpty() {
  const db = getDb();
  const { rows } = await db.execute("SELECT COUNT(*) as n FROM accounts");
  if (rows[0].n > 0) return;

  const accounts = [
    ["Up Bank",       "Up",              "H", "cash",   "AUD", "weekly",      null,    8200,  null],
    ["NAB Everyday",  "NAB",             "H", "cash",   "AUD", "weekly",      null,    6400,  null],
    ["ANZ Savings",   "ANZ",             "H", "cash",   "AUD", "weekly",      null,    7100,  null],
    ["ING Orange",    "ING",             "H", "cash",   "AUD", "weekly",      null,    6500,  null],
    ["Stake ASX",     "Stake",           "H", "shares", "AUD", "fortnightly", "Stake", 9800,  null],
    ["Stake Wall St", "Stake",           "H", "shares", "USD", "fortnightly", "Stake", 13220, 8530],
    ["Spaceship",     "Spaceship",       "H", "shares", "AUD", "monthly",     null,    9080,  null],
    ["Swyftx",        "Swyftx",          "H", "crypto", "AUD", "weekly",      null,    8950,  null],
    ["Husband Super", "AustralianSuper", "H", "super",  "AUD", "monthly",     null,    5100,  null],
    ["Wife Super",    "Hostplus",        "W", "super",  "AUD", "monthly",     null,    4100,  null],
  ];

  for (const [name, institution, owner, asset, currency, frequency, grp, balance, native_balance] of accounts) {
    await db.execute({
      sql: `INSERT INTO accounts (name, institution, owner, asset, currency, frequency, grp, balance, native_balance, updated)
            VALUES (?,?,?,?,?,?,?,?,?,date('now','-3 days'))`,
      args: [name, institution, owner, asset, currency, frequency, grp, balance, native_balance],
    });
  }
}

// ─── Helper: read a single setting ────────────────────────────────────────────
export async function getSetting(key) {
  const db = getDb();
  const { rows } = await db.execute({
    sql: "SELECT value FROM settings WHERE key = ?",
    args: [key],
  });
  return rows[0]?.value || null;
}
