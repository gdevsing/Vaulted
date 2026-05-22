#!/usr/bin/env node
/**
 * Vaulted cron scheduler
 * Run with: node scripts/cron.js
 * Managed by PM2 on the VPS alongside Next.js
 *
 * Jobs:
 *   - Weekly notification: Sunday 9:00 AM AEST (configurable via notify_day in DB)
 *   - Daily FX refresh:    6:00 AM AEST
 *   - Daily DB backup:     2:00 AM AEST (Google Drive if configured)
 */

import cron from "node-cron";
import { createClient } from "@libsql/client";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const db = createClient({
  url: "file:" + path.join(__dirname, "..", "vaulted.db"),
});

async function getSetting(key) {
  const { rows } = await db.execute({ sql: "SELECT value FROM settings WHERE key = ?", args: [key] });
  return rows[0]?.value || null;
}

async function getAppUrl() {
  return (await getSetting("app_url")) || "http://localhost:3000";
}

// ─── Run history (last 3 per job) ─────────────────────────────────────────────
async function recordRun(type, ok, message) {
  const key = `cron_${type}_history`;
  const existing = await getSetting(key);
  const history = existing ? JSON.parse(existing) : [];
  history.unshift({ time: new Date().toISOString(), ok, message });
  const trimmed = history.slice(0, 3);
  await db.execute({
    sql: "INSERT OR REPLACE INTO settings (key, value) VALUES (?,?)",
    args: [key, JSON.stringify(trimmed)],
  });
}

// ─── Weekly notification ──────────────────────────────────────────────────────
async function sendWeeklyNotification() {
  console.log("[cron] Sending weekly notification...");
  try {
    const url = await getAppUrl();
    const res  = await fetch(`${url}/api/notify`, { method: "POST" });
    const data = await res.json();
    if (data.sent) {
      console.log(`[cron] ✓ Sent: "${data.message}"`);
      await recordRun("notify", true, data.message);
    } else {
      console.error("[cron] Failed:", data.error);
      await recordRun("notify", false, data.error || "Unknown error");
    }
  } catch (err) {
    console.error("[cron] Error:", err.message);
    await recordRun("notify", false, err.message);
  }
}

// ─── FX refresh ───────────────────────────────────────────────────────────────
async function refreshFxRate() {
  console.log("[cron] Refreshing FX rate...");
  try {
    const url  = await getAppUrl();
    const res  = await fetch(`${url}/api/fx?from=USD&to=AUD`);
    const data = await res.json();
    console.log(`[cron] ✓ 1 USD = ${data.rate} AUD`);
    await recordRun("fx", true, `1 USD = ${data.rate} AUD`);
  } catch (err) {
    console.error("[cron] FX error:", err.message);
    await recordRun("fx", false, err.message);
  }
}

// ─── GitHub backup ────────────────────────────────────────────────────────────
async function backupDb() {
  console.log("[cron] Running DB backup...");
  try {
    const ghToken = await getSetting("github_token");
    const ghRepo  = await getSetting("github_repo");

    if (!ghToken || !ghRepo) {
      console.log("[cron] Backup skipped — GitHub not configured");
      return;
    }

    const { readFile } = await import("fs/promises");
    const dbBuffer = await readFile(path.join(__dirname, "..", "vaulted.db"));
    const content  = dbBuffer.toString("base64");
    const filepath = "vaulted-backup.db";
    const ghHeaders = {
      Authorization: `token ${ghToken}`,
      "Content-Type": "application/json",
      "User-Agent":   "Vaulted",
    };

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
      console.log(`[cron] ✓ Backed up to github:${ghRepo}`);
      await recordRun("backup", true, `vaulted-backup.db → ${ghRepo}`);
    } else {
      const errData = await uploadRes.json().catch(() => ({}));
      const errMsg  = errData.message || "GitHub upload failed";
      console.error("[cron] GitHub backup failed:", errMsg);
      await recordRun("backup", false, errMsg);
    }
  } catch (err) {
    console.error("[cron] Backup error:", err.message);
    await recordRun("backup", false, err.message);
  }
}

// ─── Start ────────────────────────────────────────────────────────────────────
const DAY_MAP = { sunday:0, monday:1, tuesday:2, wednesday:3, thursday:4, friday:5, saturday:6 };

async function start() {
  const notifyDay = (await getSetting("notify_day")) || "sunday";
  const dayNum    = DAY_MAP[notifyDay.toLowerCase()] ?? 0;

  console.log(`[cron] Vaulted scheduler starting`);
  console.log(`[cron] Notification: ${notifyDay}s at 9:00 AM AEST`);
  console.log(`[cron] FX refresh:   daily at 6:00 AM AEST`);
  console.log(`[cron] DB backup:    Mondays at 2:00 AM AEST`);

  cron.schedule(`0 9 * * ${dayNum}`,  sendWeeklyNotification, { timezone: "Australia/Sydney" });
  cron.schedule("0 6 * * *",          refreshFxRate,           { timezone: "Australia/Sydney" });
  cron.schedule("0 2 * * 1",          backupDb,                { timezone: "Australia/Sydney" });

  console.log("[cron] ✓ Running. Jobs scheduled.");
}

start().catch(console.error);
