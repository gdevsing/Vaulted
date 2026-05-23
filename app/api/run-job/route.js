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

  const { rows: accounts } = await db.execute(
    "SELECT name, frequency, updated FROM accounts WHERE active = 1"
  );
  const due = accounts.filter(a => {
    const days = Math.floor((Date.now() - new Date(a.updated)) / 86400000);
    return days >= ({ weekly: 8, fortnightly: 16, monthly: 33 }[a.frequency] || 33);
  });

  const dueStr  = due.length > 0
    ? `${due.length} account${due.length > 1 ? "s" : ""} to update`
    : "All accounts up to date";
  const message = dueStr;
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

// ─── Backup — push DB to GitHub private repo ─────────────────────────────────
async function runBackup() {
  const ghToken = await getSetting("github_token");
  const ghRepo  = await getSetting("github_repo");

  if (!ghToken || !ghRepo) {
    const msg = "GitHub backup not configured";
    await recordRun("backup", false, msg);
    return { ok: false, message: msg };
  }

  const { readFile } = await import("fs/promises");
  const dbBuffer = await readFile(path.join(process.cwd(), "vaulted.db"));
  const content  = dbBuffer.toString("base64");
  const filepath = "vaulted-backup.db";
  const ghHeaders = {
    Authorization: `token ${ghToken}`,
    "Content-Type": "application/json",
    "User-Agent":   "Vaulted",
  };

  // Get existing file SHA (required by GitHub API to update an existing file)
  const shaRes  = await fetch(`https://api.github.com/repos/${ghRepo}/contents/${filepath}`, { headers: ghHeaders });
  const shaData = shaRes.ok ? await shaRes.json() : null;

  const body = {
    message: `backup: ${new Date().toISOString().split("T")[0]}`,
    content,
    ...(shaData?.sha ? { sha: shaData.sha } : {}),
  };

  const uploadRes = await fetch(
    `https://api.github.com/repos/${ghRepo}/contents/${filepath}`,
    { method: "PUT", headers: ghHeaders, body: JSON.stringify(body) }
  );

  if (uploadRes.ok) {
    const msg = `vaulted-backup.db → ${ghRepo}`;
    await recordRun("backup", true, msg);
    return { ok: true, message: msg };
  } else {
    const errData = await uploadRes.json().catch(() => ({}));
    const errMsg  = errData.message || "GitHub upload failed";
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
