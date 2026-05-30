export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { initDb, getDb, getSetting } from "@/lib/db";

async function setSetting(key, value) {
  const db = getDb();
  await db.execute({
    sql: "INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)",
    args: [key, value],
  });
}

function base64url(buffer) {
  return Buffer.from(buffer)
    .toString("base64")
    .replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "");
}

export async function POST(request) {
  await initDb();
  const body = await request.json();

  // ── Phase 1: Issue challenge ─────────────────────────────────────────────
  if (body.phase === "start") {
    const raw = await getSetting("webauthn_credentials");
    const devices = raw ? JSON.parse(raw) : [];
    if (devices.length === 0) {
      return NextResponse.json({ error: "No credentials registered" }, { status: 400 });
    }

    const challenge = base64url(crypto.getRandomValues(new Uint8Array(32)));
    await setSetting("webauthn_verify_challenge", JSON.stringify({
      challenge,
      expires: Date.now() + 120_000,
    }));

    // Allow any registered device to unlock
    return NextResponse.json({
      challenge,
      allowCredentials: devices.map(d => ({ type: "public-key", id: d.id })),
      userVerification: "preferred",
      timeout: 60000,
    });
  }

  // ── Phase 2: Verify assertion ────────────────────────────────────────────
  if (body.phase === "finish") {
    const pendingRaw = await getSetting("webauthn_verify_challenge");
    if (!pendingRaw) {
      return NextResponse.json({ error: "No pending challenge" }, { status: 400 });
    }
    const pending = JSON.parse(pendingRaw);
    if (Date.now() > pending.expires) {
      return NextResponse.json({ error: "Challenge expired" }, { status: 400 });
    }

    const raw = await getSetting("webauthn_credentials");
    const devices = raw ? JSON.parse(raw) : [];

    // Check if the credential ID matches any registered device
    const matched = devices.find(d => d.id === body.id);
    if (!matched) {
      return NextResponse.json({ error: "Credential not recognised" }, { status: 401 });
    }

    await setSetting("webauthn_verify_challenge", "");
    return NextResponse.json({ ok: true, unlocked: true, device: matched.name });
  }

  return NextResponse.json({ error: "Invalid phase" }, { status: 400 });
}
