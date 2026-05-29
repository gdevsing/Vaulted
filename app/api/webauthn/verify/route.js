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

  if (body.phase === "start") {
    const credentialRaw = await getSetting("webauthn_credential");
    if (!credentialRaw) {
      return NextResponse.json({ error: "No credential registered" }, { status: 400 });
    }
    const credential = JSON.parse(credentialRaw);
    const challenge  = base64url(crypto.getRandomValues(new Uint8Array(32)));

    await setSetting("webauthn_verify_challenge", JSON.stringify({
      challenge,
      expires: Date.now() + 120_000,
    }));

    return NextResponse.json({
      challenge,
      allowCredentials: [{ type: "public-key", id: credential.id }],
      userVerification: "required",
      timeout: 60000,
    });
  }

  if (body.phase === "finish") {
    const pendingRaw = await getSetting("webauthn_verify_challenge");
    if (!pendingRaw) {
      return NextResponse.json({ error: "No pending challenge" }, { status: 400 });
    }
    const pending = JSON.parse(pendingRaw);
    if (Date.now() > pending.expires) {
      return NextResponse.json({ error: "Challenge expired" }, { status: 400 });
    }

    const credentialRaw = await getSetting("webauthn_credential");
    if (!credentialRaw) {
      return NextResponse.json({ error: "No credential registered" }, { status: 400 });
    }
    const stored = JSON.parse(credentialRaw);

    if (body.id !== stored.id) {
      return NextResponse.json({ error: "Credential mismatch" }, { status: 401 });
    }

    await setSetting("webauthn_verify_challenge", "");
    return NextResponse.json({ ok: true, unlocked: true });
  }

  return NextResponse.json({ error: "Invalid phase" }, { status: 400 });
}
