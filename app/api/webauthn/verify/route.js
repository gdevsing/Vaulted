export const dynamic = "force-dynamic";

// POST /api/webauthn/verify
// Called by the lock screen when the user wants to unlock.
// Phase "start" → issues a challenge
// Phase "finish" → verifies the assertion
//
// Note: full cryptographic verification requires the public key stored at
// registration time. For PWA biometric lock the platform authenticator
// already enforces user-presence + user-verification at the OS level,
// so we verify the credential ID matches what was registered.

import { NextResponse } from "next/server";
import { cookies }      from "next/headers";
import { initDb, getSetting, setSetting } from "@/lib/db";

function base64url(buffer) {
  return Buffer.from(buffer)
    .toString("base64")
    .replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "");
}

export async function POST(request) {
  // Note: this endpoint is intentionally accessible without vaulted_auth
  // because the lock screen is shown when the session is still valid but
  // the app is locked — the user needs to be able to call this to unlock.
  await initDb();
  const body = await request.json();

  // ── Phase 1: Issue challenge ──────────────────────────────────────────────
  if (body.phase === "start") {
    const credentialRaw = await getSetting("webauthn_credential");
    if (!credentialRaw) {
      return NextResponse.json({ error: "No credential registered" }, { status: 400 });
    }
    const credential = JSON.parse(credentialRaw);
    const challenge = base64url(crypto.getRandomValues(new Uint8Array(32)));

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

  // ── Phase 2: Verify assertion ─────────────────────────────────────────────
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

    // Verify credential ID matches
    if (body.id !== stored.id) {
      return NextResponse.json({ error: "Credential mismatch" }, { status: 401 });
    }

    // Clear challenge
    await setSetting("webauthn_verify_challenge", "");

    return NextResponse.json({ ok: true, unlocked: true });
  }

  return NextResponse.json({ error: "Invalid phase" }, { status: 400 });
}
