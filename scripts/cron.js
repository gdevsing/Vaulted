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

// ─── Weekly notification ──────────────────────────────────────────────────────
async function sendWeeklyNotification() {
  console.log("[cron] Sending weekly notification...");
  try {
    const url = await getAppUrl();
    const res  = await fetch(`${url}/api/notify`, { method: "POST" });
    const data = await res.json();
    if (data.sent) {
      console.log(`[cron] ✓ Sent: "${data.message}"`);
    } else {
      console.error("[cron] Failed:", data.error);
    }
  } catch (err) {
    console.error("[cron] Error:", err.message);
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
  } catch (err) {
    console.error("[cron] FX error:", err.message);
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
    const days     = ["sunday","monday","tuesday","wednesday","thursday","friday","saturday"];
    const filename = `vaulted-${days[new Date().getDay()]}.db`;

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
    const uploadBody = Buffer.concat([
      Buffer.from(`--${boundary}\r\nContent-Type: application/json\r\n\r\n${
        existingId ? "{}" : JSON.stringify({ name: filename, parents: [folderId] })
      }\r\n--${boundary}\r\nContent-Type: application/octet-stream\r\n\r\n`),
      dbBuffer,
      Buffer.from(`\r\n--${boundary}--`),
    ]);

    // Update existing file or create new one
    const url = existingId
      ? `https://www.googleapis.com/upload/drive/v3/files/${existingId}?uploadType=multipart`
      : "https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart";

    const uploadRes = await fetch(url, {
      method: existingId ? "PATCH" : "POST",
      headers: {
        "Authorization": `Bearer ${access_token}`,
        "Content-Type": `multipart/related; boundary=${boundary}`,
      },
      body: uploadBody,
    });

    if (uploadRes.ok) {
      console.log(`[cron] ✓ Backed up to Drive: ${filename} (${existingId ? "updated" : "created"})`);
      await db.execute({
        sql: "INSERT OR REPLACE INTO settings (key, value) VALUES (?,?)",
        args: ["last_backup", new Date().toISOString()],
      });
    } else {
      console.error("[cron] Drive upload failed:", await uploadRes.text());
    }
  } catch (err) {
    console.error("[cron] Backup error:", err.message);
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
  console.log(`[cron] DB backup:    daily at 2:00 AM AEST`);

  cron.schedule(`0 9 * * ${dayNum}`,  sendWeeklyNotification, { timezone: "Australia/Sydney" });
  cron.schedule("0 6 * * *",          refreshFxRate,           { timezone: "Australia/Sydney" });
  cron.schedule("0 2 * * *",          backupDb,                { timezone: "Australia/Sydney" });

  console.log("[cron] ✓ Running. Jobs scheduled.");
}

start().catch(console.error);
