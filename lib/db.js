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

  // Migration: fix snapshots FK pointing to accounts_v1 (SQLite cascade-renamed it during accounts migration)
  const snapshotsSql = await db.execute(
    "SELECT sql FROM sqlite_master WHERE type='table' AND name='snapshots'"
  );
  if (snapshotsSql.rows[0]?.sql?.includes("accounts_v1")) {
    await db.execute("PRAGMA foreign_keys = OFF");
    await db.execute("ALTER TABLE snapshots RENAME TO snapshots_old");
    await db.execute(`
      CREATE TABLE snapshots (
        id         INTEGER PRIMARY KEY AUTOINCREMENT,
        account_id INTEGER NOT NULL REFERENCES accounts(id),
        balance    REAL NOT NULL,
        note       TEXT,
        fx_rate    REAL,
        method     TEXT DEFAULT 'manual',
        created_at TEXT NOT NULL DEFAULT (datetime('now'))
      )
    `);
    await db.execute("INSERT INTO snapshots SELECT * FROM snapshots_old");
    await db.execute("DROP TABLE snapshots_old");
    await db.execute("PRAGMA foreign_keys = ON");
  }

  // Migration: update deprecated Gemini preview model to stable GA name
  await db.execute(`
    UPDATE settings SET value = 'gemini-2.5-flash'
    WHERE key = 'gemini_model' AND value = 'gemini-2.5-flash-preview-04-17'
  `);

  // All configurable settings — INSERT OR IGNORE so existing values are preserved
  await db.execute(`
    INSERT OR IGNORE INTO settings (key, value) VALUES
      -- Migration flags (schema already correct in CREATE TABLE above)
      ('migration_v2_owner_j', 'done'),
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
      ('app_public_url',    ''),
      ('app_password',      'vaulted'),
      -- Owner labels (H/W/J keys are fixed; only labels and active state are configurable)
      ('owner_H_label',  'Husband'),
      ('owner_H_active', '1'),
      ('owner_W_label',  'Wife'),
      ('owner_W_active', '1'),
      ('owner_J_label',  'Joint'),
      ('owner_J_active', '1')
  `);
}

export async function seedIfEmpty() {
  const db = getDb();

  // Seed accounts only if none exist
  const { rows } = await db.execute("SELECT COUNT(*) as n FROM accounts");
  if (rows[0].n === 0) {
    const accounts = [
      ["Cash Account 1",  "Bank A",       "H", "cash",   "AUD", "weekly",      null,       8200,  null],
      ["Cash Account 2",  "Bank B",       "H", "cash",   "AUD", "weekly",      null,       6400,  null],
      ["Cash Account 3",  "Bank C",       "H", "cash",   "AUD", "weekly",      null,       7100,  null],
      ["Cash Account 4",  "Bank D",       "H", "cash",   "AUD", "weekly",      null,       6500,  null],
      ["Shares AUD",      "Broker A",     "H", "shares", "AUD", "fortnightly", "Broker A", 9800,  null],
      ["Shares USD",      "Broker A",     "H", "shares", "USD", "fortnightly", "Broker A", 13220, 8530],
      ["Shares Managed",  "Broker B",     "H", "shares", "AUD", "monthly",     null,       9080,  null],
      ["Crypto",          "Exchange A",   "H", "crypto", "AUD", "weekly",      null,       8950,  null],
      ["Super 1",         "Super Fund A", "H", "super",  "AUD", "monthly",     null,       5100,  null],
      ["Super 2",         "Super Fund B", "W", "super",  "AUD", "monthly",     null,       4100,  null],
    ];

    for (const [name, institution, owner, asset, currency, frequency, grp, balance, native_balance] of accounts) {
      await db.execute({
        sql: `INSERT INTO accounts (name, institution, owner, asset, currency, frequency, grp, balance, native_balance, updated)
              VALUES (?,?,?,?,?,?,?,?,?,date('now','-3 days'))`,
        args: [name, institution, owner, asset, currency, frequency, grp, balance, native_balance],
      });
    }
  }

  // Seed snapshot history independently — gives Trends page data in local dev.
  // On production this guard fires immediately (real snapshots already exist).
  const { rows: snapRows } = await db.execute("SELECT COUNT(*) as n FROM snapshots");
  if (snapRows[0].n > 0) return;

  const SEED_DATES = [
    "2026-03-29", "2026-04-05", "2026-04-12", "2026-04-19",
    "2026-04-26", "2026-05-03", "2026-05-10", "2026-05-17", "2026-05-24",
  ];
  const SEED_TOTALS = {
    cash:   [27800, 27900, 28100, 27900, 28200, 28000, 28100, 28200, 28200],
    shares: [30500, 31000, 31200, 31500, 31600, 32000, 32300, 32500, 32100],
    crypto: [8600,  8700,  8750,  8800,  8750,  8850,  8900,  8950,  8950 ],
    super:  [6600,  6600,  6750,  7200,  7250,  7550,  7800,  8150,  9200 ],
  };

  const { rows: accs } = await db.execute(
    "SELECT id, asset, balance FROM accounts WHERE active = 1 ORDER BY id"
  );

  const byAsset = {};
  for (const a of accs) {
    if (!byAsset[a.asset]) byAsset[a.asset] = [];
    byAsset[a.asset].push(a);
  }

  for (const asset of ["cash", "shares", "crypto", "super"]) {
    const group = byAsset[asset] || [];
    if (!group.length) continue;
    const currentTotal = group.reduce((s, a) => s + (a.balance || 0), 0);

    for (let i = 0; i < SEED_DATES.length; i++) {
      const target = SEED_TOTALS[asset][i];
      const dt = SEED_DATES[i] + " 12:00:00";
      for (const acc of group) {
        const ratio = currentTotal > 0 ? acc.balance / currentTotal : 1 / group.length;
        const bal = Math.round(target * ratio * 100) / 100;
        await db.execute({
          sql: "INSERT INTO snapshots (account_id, balance, created_at) VALUES (?, ?, ?)",
          args: [acc.id, bal, dt],
        });
      }
    }
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
