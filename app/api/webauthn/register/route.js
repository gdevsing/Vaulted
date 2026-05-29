export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { cookies }      from "next/headers";
import { initDb, getDb, getSetting } from "@/lib/db";

const RP_NAME = "Vaulted";

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

// GET — return list of registered devices (id + name + date, no keys)
export async function GET(request) {
  const cookieStore = cookies();
  if (!cookieStore.get("vaulted_auth")) {
    return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  }
  await initDb();
  const raw = await getSetting("webauthn_credentials");
  const devices = raw ? JSON.parse(raw).map(d => ({
    id: d.id,
    name: d.name,
    registeredAt: d.registeredAt,
  })) : [];
  return NextResponse.json({ devices });
}

// POST — register/start or register/finish
export async function POST(request) {
  const cookieStore = cookies();
  if (!cookieStore.get("vaulted_auth")) {
    return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  }
  await initDb();
  const body = await request.json();

  // ── Phase 1: Start ───────────────────────────────────────────────────────
  if (body.phase === "start") {
    const challenge = base64url(crypto.getRandomValues(new Uint8Array(32)));
    await setSetting("webauthn_pending_challenge", JSON.stringify({
      challenge,
      deviceName: body.deviceName || "My Device",
      expires: Date.now() + 120_000,
    }));

    // Get existing credentials to exclude them (prevents re-registering same device)
    const raw = await getSetting("webauthn_credentials");
    const existing = raw ? JSON.parse(raw) : [];
    const excludeCredentials = existing.map(d => ({
      type: "public-key",
      id: d.id,
    }));

    return NextResponse.json({
      challenge,
      rp: { name: RP_NAME },
      user: {
        id: base64url(new TextEncoder().encode("vaulted-household")),
        name: "household",
        displayName: "Vaulted Household",
      },
      pubKeyCredParams: [
        { type: "public-key", alg: -7   },
        { type: "public-key", alg: -257 },
      ],
      excludeCredentials,
      authenticatorSelection: {
        authenticatorAttachment: "platform",
        userVerification: "required",
        residentKey: "preferred",
      },
      timeout: 60000,
    });
  }

  // ── Phase 2: Finish ──────────────────────────────────────────────────────
  if (body.phase === "finish") {
    const pendingRaw = await getSetting("webauthn_pending_challenge");
    if (!pendingRaw) {
      return NextResponse.json({ error: "No pending challenge" }, { status: 400 });
    }
    const pending = JSON.parse(pendingRaw);
    if (Date.now() > pending.expires) {
      return NextResponse.json({ error: "Challenge expired" }, { status: 400 });
    }

    // Append new device to existing list
    const raw = await getSetting("webauthn_credentials");
    const existing = raw ? JSON.parse(raw) : [];

    const newDevice = {
      id:           body.credential.id,
      rawId:        body.credential.rawId,
      type:         body.credential.type,
      response:     body.credential.response,
      name:         pending.deviceName || "My Device",
      registeredAt: new Date().toISOString(),
    };

    existing.push(newDevice);
    await setSetting("webauthn_credentials", JSON.stringify(existing));
    await setSetting("webauthn_enabled", "1");
    await setSetting("webauthn_pending_challenge", "");

    return NextResponse.json({ ok: true, device: { id: newDevice.id, name: newDevice.name } });
  }

  return NextResponse.json({ error: "Invalid phase" }, { status: 400 });
}

// DELETE — remove a specific device by id, or all if no id
export async function DELETE(request) {
  const cookieStore = cookies();
  if (!cookieStore.get("vaulted_auth")) {
    return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  }
  await initDb();
  const body = await request.json().catch(() => ({}));
  const { deviceId } = body;

  if (deviceId) {
    // Remove specific device
    const raw = await getSetting("webauthn_credentials");
    const existing = raw ? JSON.parse(raw) : [];
    const filtered = existing.filter(d => d.id !== deviceId);
    await setSetting("webauthn_credentials", JSON.stringify(filtered));
    // Disable if no devices left
    if (filtered.length === 0) {
      await setSetting("webauthn_enabled", "0");
    }
    return NextResponse.json({ ok: true, remaining: filtered.length });
  } else {
    // Remove all
    await setSetting("webauthn_credentials", "[]");
    await setSetting("webauthn_enabled", "0");
    return NextResponse.json({ ok: true, remaining: 0 });
  }
}
