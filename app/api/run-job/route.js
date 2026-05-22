export const dynamic = "force-dynamic";

// POST /api/run-job
// Body: { job: "backup" | "fx" | "notify" }
// Triggers a cron job immediately and records the result in cron history.

import { NextResponse } from "next/server";
import { getDb, initDb, getSetting } from "@/lib/db";
import path from "path";

async function recordRun(type, ok, message) {
  const db = getDb();
  const key = `cron_${type}_history`;
  const existing = await getSetting(key);
  const history = existing ? JSON.parse(existing) : [];
  history.unshift({ time: new Date().toISOString(), ok, message });
  await db.execute({
    sql: "INSERT OR REPLACE INTO settings (key, value) VALUES (?,?)",
    args: [key, JSON.stringify(history.slice(0, 3))],
  });
}

// ─── FX — call frankfurter.app directly, cache in DB ─────────────────────────
async function runFx() {
  const db       = getDb();
  const from     = "USD";
  const to       = "AUD";
  const cacheKey = `fx_${from}_${to}`;

  const res = await fetch(`https://api.frankfurter.app/latest?from=${from}&to=${to}`);
  if (!res.ok) throw new Error("frankfurter.app error");
  const data = await res.json();
  const rate = data.rates[to];

  await db.execute({
    sql: "INSERT OR REPLACE INTO settings (key, value) VALUES (?,?), (?,?)",
    args: [cacheKey, String(rate), `${cacheKey}_ts`, new Date().toISOString()],
  });

  const msg = `1 USD = ${rate} AUD`;
  await recordRun("fx", true, msg);
  return { ok: true, message: msg };
}

// ─── Notify — send ntfy.sh notification directly ─────────────────────────────
async function runNotify() {
  const db       = getDb();
  const topic    = await getSetting("ntfy_topic");
  const server   = (await getSetting("ntfy_server")) || "https://ntfy.sh";
  const password = await getSetting("ntfy_password");

  if (!topic) {
    const msg = "ntfy_topic not configured";
    await recordRun("notify", false, msg);
    return { ok: false, message: msg };
  }

  const { rows: nw } = await db.execute(
    "SELECT SUM(balance) as total FROM accounts WHERE active = 1"
  );
  const total = nw[0]?.total || 0;

  const { rows: accounts } = await db.execute(
    "SELECT name, frequency, updated FROM accounts WHERE active = 1"
  );
  const due = accounts.filter(a => {
    const days = Math.floor((Date.now() - new Date(a.updated)) / 86400000);
    return days >= ({ weekly: 8, fortnightly: 16, monthly: 33 }[a.frequency] || 33);
  });

  const totalStr = "$" + Math.round(total).toLocaleString("en-AU");
  const dueStr   = due.length > 0
    ? `${due.length} account${due.length > 1 ? "s" : ""} to update`
    : "All accounts up to date";
  const message  = `Net worth: ${totalStr} · ${dueStr}`;
  const title    = "Time to sync your vault";

  const headers = {
    "Content-Type": "text/plain",
    "Title":    title,
    "Priority": due.length > 0 ? "high" : "default",
    "Tags":     "money_with_wings",
  };
  if (password) headers["Authorization"] = "Bearer " + password;

  const ntfyRes = await fetch(`${server}/${topic}`, {
    method: "POST", headers, body: message,
  });

  if (!ntfyRes.ok) {
    const detail = await ntfyRes.text();
    const msg = `ntfy error: ${detail}`;
    await recordRun("notify", false, msg);
    return { ok: false, message: msg };
  }

  await db.execute({
    sql: "INSERT OR REPLACE INTO settings (key, value) VALUES (?,?)",
    args: ["last_notified", new Date().toISOString()],
  });

  await recordRun("notify", true, message);
  return { ok: true, message };
}

// ─── Backup — upload DB to Google Cloud Storage ──────────────────────────────
async function runBackup() {
  const token      = await getSetting("gdrive_token");
  const bucketName = await getSetting("gdrive_folder_id");

  if (!token || !bucketName) {
    const msg = "Cloud Storage not configured";
    await recordRun("backup", false, msg);
    return { ok: false, message: msg };
  }

  const { readFile }   = await import("fs/promises");
  const { createSign } = await import("crypto");

  const dbPath   = path.join(process.cwd(), "vaulted.db");
  const dbBuffer = await readFile(dbPath);
  const filename = "vaulted-backup.db";

  const sa  = JSON.parse(token);
  const now = Math.floor(Date.now() / 1000);
  const hdr = Buffer.from(JSON.stringify({ alg: "RS256", typ: "JWT" })).toString("base64url");
  const pld = Buffer.from(JSON.stringify({
    iss: sa.client_email,
    scope: "https://www.googleapis.com/auth/devstorage.read_write",
    aud: "https://oauth2.googleapis.com/token",
    iat: now, exp: now + 3600,
  })).toString("base64url");
  const sign = createSign("RSA-SHA256");
  sign.update(`${hdr}.${pld}`);
  const jwt = `${hdr}.${pld}.${sign.sign(sa.private_key, "base64url")}`;

  const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer", assertion: jwt }),
  });
  const { access_token } = await tokenRes.json();

  // GCS overwrites the object automatically — no search or PATCH needed
  const uploadRes = await fetch(
    `https://storage.googleapis.com/upload/storage/v1/b/${encodeURIComponent(bucketName)}/o?uploadType=media&name=${encodeURIComponent(filename)}`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${access_token}`,
        "Content-Type": "application/octet-stream",
      },
      body: dbBuffer,
    }
  );

  if (uploadRes.ok) {
    const msg = `${filename} → gs://${bucketName}`;
    await recordRun("backup", true, msg);
    return { ok: true, message: msg };
  } else {
    const errText = await uploadRes.text();
    console.log(`[run-job] GCS upload failed ${uploadRes.status}: ${errText}`);
    let errMsg = errText;
    try { errMsg = JSON.parse(errText)?.error?.message || errText; } catch {}
    await recordRun("backup", false, errMsg);
    return { ok: false, message: errMsg };
  }
}

// ─── Handler ──────────────────────────────────────────────────────────────────
export async function POST(request) {
  try {
    await initDb();
    const { job } = await request.json();

    if (job === "backup") {
      const result = await runBackup();
      return NextResponse.json(result, { status: result.ok ? 200 : 502 });
    }
    if (job === "fx") {
      const result = await runFx();
      return NextResponse.json(result, { status: result.ok ? 200 : 502 });
    }
    if (job === "notify") {
      const result = await runNotify();
      return NextResponse.json(result, { status: result.ok ? 200 : 502 });
    }

    return NextResponse.json({ error: "Unknown job" }, { status: 400 });
  } catch (err) {
    console.error("POST /api/run-job:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
