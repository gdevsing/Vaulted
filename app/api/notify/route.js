export const dynamic = "force-dynamic";

// POST /api/notify
// Sends a push notification via ntfy.sh
// Body (optional): { title, message, priority, tags }
// Called by the cron job every Sunday, or manually from admin

import { NextResponse } from "next/server";
import { getDb, initDb, getSetting } from "@/lib/db";

async function buildWeeklySummary(db) {
  // Total net worth
  const { rows: nw } = await db.execute(
    "SELECT SUM(balance) as total FROM accounts WHERE active = 1"
  );
  const total = nw[0]?.total || 0;

  // Accounts due for update
  const { rows: accounts } = await db.execute(
    "SELECT name, frequency, updated FROM accounts WHERE active = 1"
  );

  const due = accounts.filter(a => {
    const days = Math.floor((Date.now() - new Date(a.updated)) / 86400000);
    const limits = { weekly: 8, fortnightly: 16, monthly: 33 };
    return days >= (limits[a.frequency] || 33);
  });

    const dueStr   = due.length > 0
    ? `${due.length} account${due.length > 1 ? "s" : ""} to update`
    : "All accounts up to date";

  return {
    title:   "Time to sync your vault",
    message: `${dueStr} · Tap to open Vaulted`,
    dueCount: due.length,
    total,
  };
}

export async function POST(request) {
  try {
    await initDb();
    const db = getDb();

    const topic    = await getSetting("ntfy_topic");
    const server   = await getSetting("ntfy_server") || "https://ntfy.sh";
    const password = await getSetting("ntfy_password");
    // app_url = internal (localhost), app_public_url = external domain
    const appPublicUrl = await getSetting("app_public_url") || "";

    if (!topic) {
      return NextResponse.json(
        { error: "ntfy_topic not configured. Go to Admin → Credentials." },
        { status: 503 }
      );
    }

    // Allow custom override from body, fall back to weekly summary
    let body = {};
    try { body = await request.json(); } catch {}

    const summary = await buildWeeklySummary(db);

    const title   = body.title   || summary.title;
    const message = body.message || summary.message;
    const priority = body.priority || (summary.dueCount > 0 ? "high" : "default");
    const tags    = body.tags    || ["money_with_wings"];

    // Build ntfy request
    const headers = {
      "Content-Type": "text/plain",
      "Title":    title,
      "Priority": priority,
      "Tags":     tags.join(","),
    };
    if (appPublicUrl) headers["Click"] = appPublicUrl + "/update";

    if (password) {
      headers["Authorization"] = "Bearer " + password;
    }

    const ntfyRes = await fetch(`${server}/${topic}`, {
      method:  "POST",
      headers,
      body:    message,
    });

    if (!ntfyRes.ok) {
      const detail = await ntfyRes.text();
      return NextResponse.json(
        { error: "ntfy request failed", detail },
        { status: 502 }
      );
    }

    // Log the send time in settings
    await db.execute({
      sql: "INSERT OR REPLACE INTO settings (key, value) VALUES (?,?)",
      args: ["last_notified", new Date().toISOString()],
    });

    return NextResponse.json({
      sent: true,
      title,
      message,
      topic,
      server,
    });

  } catch (err) {
    console.error("POST /api/notify:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// GET /api/notify → test endpoint, returns config status
export async function GET() {
  try {
    await initDb();
    const topic       = await getSetting("ntfy_topic");
    const server      = await getSetting("ntfy_server") || "https://ntfy.sh";
    const lastNotified = await getSetting("last_notified");

    return NextResponse.json({
      configured:   !!topic,
      topic:        topic || null,
      server,
      lastNotified: lastNotified || null,
      subscribeUrl: topic ? `${server}/${topic}` : null,
    });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
