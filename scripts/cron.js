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

// ─── Google Drive backup (rolling 7 files, one per day of week) ──────────────
async function backupDb() {
  console.log("[cron] Running DB backup...");
  try {
    const token    = await getSetting("gdrive_token");
    const folderId = await getSetting("gdrive_folder_id");

    if (!token || !folderId) {
      console.log("[cron] Backup skipped — Google Drive not configured");
      return;
    }

    const { readFile }   = await import("fs/promises");
    const { createSign } = await import("crypto");

    const dbPath   = path.join(__dirname, "..", "vaulted.db");
    const dbBuffer = await readFile(dbPath);
    const filename = "vaulted-backup.db";

    // Build JWT for service account
    const sa  = JSON.parse(token);
    const now = Math.floor(Date.now() / 1000);
    const hdr = Buffer.from(JSON.stringify({ alg:"RS256", typ:"JWT" })).toString("base64url");
    const pld = Buffer.from(JSON.stringify({
      iss: sa.client_email,
      scope: "https://www.googleapis.com/auth/drive.file",
      aud: "https://oauth2.googleapis.com/token",
      iat: now, exp: now + 3600,
    })).toString("base64url");
    const sign = createSign("RSA-SHA256");
    sign.update(`${hdr}.${pld}`);
    const jwt = `${hdr}.${pld}.${sign.sign(sa.private_key, "base64url")}`;

    // Get access token
    const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer", assertion: jwt }),
    });
    const { access_token } = await tokenRes.json();

    // Check if file already exists in Drive folder
    const searchRes = await fetch(
      `https://www.googleapis.com/drive/v3/files?q=name='${filename}'+and+'${folderId}'+in+parents+and+trashed=false&fields=files(id)`,
      { headers: { "Authorization": `Bearer ${access_token}` } }
    );
    const { files } = await searchRes.json();
    const existingId = files?.[0]?.id;

    const boundary = "vaulted_backup";

    // Build a fresh multipart body for POST (needs parents metadata)
    const makeUploadBody = (includeParents) => Buffer.concat([
      Buffer.from(`--${boundary}\r\nContent-Type: application/json\r\n\r\n${
        includeParents ? JSON.stringify({ name: filename, parents: [folderId] }) : "{}"
      }\r\n--${boundary}\r\nContent-Type: application/octet-stream\r\n\r\n`),
      dbBuffer,
      Buffer.from(`\r\n--${boundary}--`),
    ]);

    const driveHeaders = {
      "Authorization": `Bearer ${access_token}`,
      "Content-Type": `multipart/related; boundary=${boundary}`,
    };

    let action = "created";
    let uploadRes;

    if (existingId) {
      uploadRes = await fetch(
        `https://www.googleapis.com/upload/drive/v3/files/${existingId}?uploadType=multipart`,
        { method: "PATCH", headers: driveHeaders, body: makeUploadBody(false) }
      );
      if (uploadRes.status === 404) {
        // Stale ID — file was deleted; fall back to creating a new one
        console.log("[cron] PATCH 404 — file gone, creating new file");
        uploadRes = await fetch(
          "https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart",
          { method: "POST", headers: driveHeaders, body: makeUploadBody(true) }
        );
      } else {
        action = "updated";
      }
    } else {
      uploadRes = await fetch(
        "https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart",
        { method: "POST", headers: driveHeaders, body: makeUploadBody(true) }
      );
    }

    if (uploadRes.ok) {
      console.log(`[cron] ✓ Backed up to Drive: ${filename} (${action})`);
      await recordRun("backup", true, `${filename} ${action}`);
    } else {
      const errText = await uploadRes.text();
      console.error("[cron] Drive upload failed:", errText);
      await recordRun("backup", false, errText);
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
