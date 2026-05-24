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
// Calls ntfy.sh directly — no dependency on Next.js or auth middleware
async function sendWeeklyNotification() {
  console.log("[cron] Sending weekly notification...");
  try {
    const topic      = await getSetting("ntfy_topic");
    const server     = await getSetting("ntfy_server") || "https://ntfy.sh";
    const password   = await getSetting("ntfy_password");
    const publicUrl  = await getSetting("app_public_url") || "";

    if (!topic) {
      await recordRun("notify", false, "ntfy_topic not configured");
      return;
    }

    // Build due count directly from DB
    const { rows: accounts } = await db.execute(
      "SELECT name, frequency, updated FROM accounts WHERE active = 1"
    );

    const today = new Date(); today.setHours(0,0,0,0);
    const dow = today.getDay();
    const lastSunday = new Date(today);
    lastSunday.setDate(today.getDate() - (dow === 0 ? 0 : dow));

    const due = accounts.filter(a => {
      const lastUpdated = new Date(a.updated); lastUpdated.setHours(0,0,0,0);
      const daysSince = Math.floor((today - lastUpdated) / 86400000);
      if (a.frequency === "weekly")      return lastUpdated < lastSunday || daysSince > 7;
      if (a.frequency === "fortnightly") {
        const target = new Date(lastUpdated); target.setDate(target.getDate() + 14);
        const tdow = target.getDay();
        if (tdow !== 0) target.setDate(target.getDate() + (7 - tdow));
        return today >= target || daysSince > 16;
      }
      if (a.frequency === "monthly") {
        const d = new Date(today.getFullYear(), today.getMonth(), 1);
        const fdow = d.getDay();
        d.setDate(fdow === 0 ? 1 : 8 - fdow);
        return lastUpdated < d || daysSince > 33;
      }
      return daysSince > 33;
    });

    const message = due.length > 0
      ? `${due.length} account${due.length > 1 ? "s" : ""} to sync · Tap to open Vaulted`
      : "All accounts up to date · Tap to open Vaulted";

    const headers = {
      "Content-Type": "text/plain",
      "Title":    "Time to sync your vault",
      "Priority": due.length > 0 ? "high" : "default",
      "Tags":     "money_with_wings",
    };
    if (publicUrl) headers["Click"] = publicUrl + "/update";
    if (password)  headers["Authorization"] = "Bearer " + password;

    const res = await fetch(`${server}/${topic}`, {
      method: "POST", headers, body: message,
    });

    if (!res.ok) throw new Error(`ntfy returned ${res.status}`);

    // Log last sent time
    await db.execute({
      sql: "INSERT OR REPLACE INTO settings (key, value) VALUES (?,?)",
      args: ["last_notified", new Date().toISOString()],
    });

    console.log(`[cron] ✓ Notification sent: "${message}"`);
    await recordRun("notify", true, message);

  } catch (err) {
    console.error("[cron] Notification error:", err.message);
    await recordRun("notify", false, err.message);
  }
}

// ─── FX refresh ───────────────────────────────────────────────────────────────
// Calls frankfurter.app directly — avoids dependency on Next.js being up at 6am
async function refreshFxRate() {
  console.log("[cron] Refreshing FX rate...");
  try {
    const res  = await fetch("https://api.frankfurter.app/latest?from=USD&to=AUD");
    if (!res.ok) throw new Error(`frankfurter returned ${res.status}`);
    const data = await res.json();
    const rate = data.rates?.AUD;
    if (!rate) throw new Error("No AUD rate in response");

    // Cache in DB so the app API serves it
    await db.execute({
      sql: "INSERT OR REPLACE INTO settings (key, value) VALUES (?,?), (?,?)",
      args: ["fx_USD_AUD", String(rate), "fx_USD_AUD_ts", new Date().toISOString()],
    });

    console.log(`[cron] ✓ 1 USD = ${rate} AUD (cached in DB)`);
    await recordRun("fx", true, `1 USD = ${rate} AUD`);
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
