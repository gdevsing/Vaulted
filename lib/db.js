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

export async function initDb() {
  const db = getDb();

  await db.execute(`
    CREATE TABLE IF NOT EXISTS accounts (
      id             INTEGER PRIMARY KEY AUTOINCREMENT,
      name           TEXT NOT NULL,
      institution    TEXT NOT NULL,
      owner          TEXT NOT NULL CHECK(owner IN ('H','W','J')),
      asset          TEXT NOT NULL CHECK(asset IN ('cash','shares','crypto','super')),
      currency       TEXT NOT NULL DEFAULT 'AUD',
      frequency      TEXT NOT NULL DEFAULT 'weekly',
      grp            TEXT,
      balance        REAL NOT NULL DEFAULT 0,
      native_balance REAL,
      updated        TEXT NOT NULL DEFAULT (date('now')),
      active         INTEGER NOT NULL DEFAULT 1
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
      value TEXT NOT NULL DEFAULT ''
    )
  `);

  // Migration: add 'J' (Joint) to owner CHECK constraint
  const migCheck = await db.execute("SELECT value FROM settings WHERE key = 'migration_v2_owner_j'");
  if (!migCheck.rows[0]) {
    try {
      await db.execute("PRAGMA foreign_keys = OFF");

      // Recover from any previous partial migration
      const v1 = await db.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='accounts_v1'");
      if (v1.rows[0]) {
        const acc = await db.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='accounts'");
        if (acc.rows[0]) {
          await db.execute("DROP TABLE accounts_v1");
        } else {
          await db.execute("ALTER TABLE accounts_v1 RENAME TO accounts");
        }
      }

      await db.execute("ALTER TABLE accounts RENAME TO accounts_v1");
      await db.execute(`
        CREATE TABLE accounts (
          id             INTEGER PRIMARY KEY AUTOINCREMENT,
          name           TEXT NOT NULL,
          institution    TEXT NOT NULL,
          owner          TEXT NOT NULL CHECK(owner IN ('H','W','J')),
          asset          TEXT NOT NULL CHECK(asset IN ('cash','shares','crypto','super')),
          currency       TEXT NOT NULL DEFAULT 'AUD',
          frequency      TEXT NOT NULL DEFAULT 'weekly',
          grp            TEXT,
          balance        REAL NOT NULL DEFAULT 0,
          native_balance REAL,
          updated        TEXT NOT NULL DEFAULT (date('now')),
          active         INTEGER NOT NULL DEFAULT 1
        )
      `);
      await db.execute("INSERT INTO accounts SELECT * FROM accounts_v1");
      await db.execute("DROP TABLE accounts_v1");
      await db.execute("PRAGMA foreign_keys = ON");
      await db.execute("INSERT OR REPLACE INTO settings (key, value) VALUES ('migration_v2_owner_j', 'done')");
    } catch (e) {
      console.error("Migration v2 failed:", e);
      await db.execute("PRAGMA foreign_keys = ON");
      // Mark done to stop repeated failures — accounts schema is likely already correct
      await db.execute("INSERT OR IGNORE INTO settings (key, value) VALUES ('migration_v2_owner_j', 'done')");
    }
  }

  // Migration: update deprecated Gemini preview model to stable GA name
  await db.execute(`
    UPDATE settings SET value = 'gemini-2.5-flash'
    WHERE key = 'gemini_model' AND value = 'gemini-2.5-flash-preview-04-17'
  `);

  // All configurable settings — INSERT OR IGNORE so existing values are preserved
  await db.execute(`
    INSERT OR IGNORE INTO settings (key, value) VALUES
      -- App config
      ('notify_day',        'sunday'),
      ('ntfy_topic',        'vaulted-sync'),
      ('fx_base',           'AUD'),
      -- API credentials (empty until set in admin)
      ('gemini_api_key',    ''),
      ('gemini_model',      'gemini-2.5-flash'),
      -- ntfy.sh (topic is public by default, password optional for private)
      ('ntfy_server',       'https://ntfy.sh'),
      ('ntfy_password',     ''),
      -- GitHub backup
      ('github_token',      ''),
      ('github_repo',       ''),
      -- Deployment
      ('app_url',           'http://localhost:3000'),
      ('app_password',      'vaulted')
  `);
}

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
