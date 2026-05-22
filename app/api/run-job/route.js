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

async function runBackup() {
  const token    = await getSetting("gdrive_token");
  const folderId = await getSetting("gdrive_folder_id");

  if (!token || !folderId) {
    await recordRun("backup", false, "Google Drive not configured");
    return { ok: false, message: "Google Drive not configured" };
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
    scope: "https://www.googleapis.com/auth/drive.file",
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

  const searchRes = await fetch(
    `https://www.googleapis.com/drive/v3/files?q=name='${filename}'+and+'${folderId}'+in+parents+and+trashed=false&fields=files(id)`,
    { headers: { Authorization: `Bearer ${access_token}` } }
  );
  const { files } = await searchRes.json();
  const existingId = files?.[0]?.id;

  const boundary = "vaulted_backup";
  const makeBody = (includeParents) => Buffer.concat([
    Buffer.from(`--${boundary}\r\nContent-Type: application/json\r\n\r\n${
      includeParents ? JSON.stringify({ name: filename, parents: [folderId] }) : "{}"
    }\r\n--${boundary}\r\nContent-Type: application/octet-stream\r\n\r\n`),
    dbBuffer,
    Buffer.from(`\r\n--${boundary}--`),
  ]);

  const headers = {
    Authorization: `Bearer ${access_token}`,
    "Content-Type": `multipart/related; boundary=${boundary}`,
  };

  let action = "created";
  let uploadRes;

  if (existingId) {
    uploadRes = await fetch(
      `https://www.googleapis.com/upload/drive/v3/files/${existingId}?uploadType=multipart`,
      { method: "PATCH", headers, body: makeBody(false) }
    );
    if (uploadRes.status === 404) {
      uploadRes = await fetch(
        "https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart",
        { method: "POST", headers, body: makeBody(true) }
      );
    } else {
      action = "updated";
    }
  } else {
    uploadRes = await fetch(
      "https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart",
      { method: "POST", headers, body: makeBody(true) }
    );
  }

  if (uploadRes.ok) {
    const msg = `${filename} ${action}`;
    await recordRun("backup", true, msg);
    return { ok: true, message: msg };
  } else {
    const errText = await uploadRes.text();
    let errMsg = errText;
    try { errMsg = JSON.parse(errText)?.error?.message || errText; } catch {}
    await recordRun("backup", false, errMsg);
    return { ok: false, message: errMsg };
  }
}

export async function POST(request) {
  try {
    await initDb();
    const { job } = await request.json();

    if (job === "backup") {
      const result = await runBackup();
      return NextResponse.json(result, { status: result.ok ? 200 : 502 });
    }

    if (job === "fx") {
      const appUrl = (await getSetting("app_url")) || "http://localhost:3000";
      const res    = await fetch(`${appUrl}/api/fx?from=USD&to=AUD`);
      const data   = await res.json();
      if (data.rate) {
        const msg = `1 USD = ${data.rate} AUD`;
        await recordRun("fx", true, msg);
        return NextResponse.json({ ok: true, message: msg });
      }
      const msg = data.error || "FX fetch failed";
      await recordRun("fx", false, msg);
      return NextResponse.json({ ok: false, message: msg }, { status: 502 });
    }

    if (job === "notify") {
      const appUrl = (await getSetting("app_url")) || "http://localhost:3000";
      const res    = await fetch(`${appUrl}/api/notify`, { method: "POST" });
      const data   = await res.json();
      if (data.sent) {
        await recordRun("notify", true, data.message);
        return NextResponse.json({ ok: true, message: data.message });
      }
      const msg = data.error || "Notification failed";
      await recordRun("notify", false, msg);
      return NextResponse.json({ ok: false, message: msg }, { status: 502 });
    }

    return NextResponse.json({ error: "Unknown job" }, { status: 400 });
  } catch (err) {
    console.error("POST /api/run-job:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
