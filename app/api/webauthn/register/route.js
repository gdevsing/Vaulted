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

export async function POST(request) {
  const cookieStore = cookies();
  if (!cookieStore.get("vaulth_auth") && !cookieStore.get("vaulted_auth")) {
    return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  }

  await initDb();
  const body = await request.json();

  if (body.phase === "start") {
    const challenge = base64url(crypto.getRandomValues(new Uint8Array(32)));
    await setSetting("webauthn_pending_challenge", JSON.stringify({
      challenge,
      expires: Date.now() + 120_000,
    }));

    return NextResponse.json({
      challenge,
      rp: { name: RP_NAME },
      user: {
        id: base64url(new TextEncoder().encode("vaulted-user")),
        name: "household",
        displayName: "Vaulted Household",
      },
      pubKeyCredParams: [
        { type: "public-key", alg: -7  },
        { type: "public-key", alg: -257 },
      ],
      authenticatorSelection: {
        authenticatorAttachment: "platform",
        userVerification: "required",
        residentKey: "preferred",
      },
      timeout: 60000,
    });
  }

  if (body.phase === "finish") {
    const pendingRaw = await getSetting("webauthn_pending_challenge");
    if (!pendingRaw) {
      return NextResponse.json({ error: "No pending challenge" }, { status: 400 });
    }
    const pending = JSON.parse(pendingRaw);
    if (Date.now() > pending.expires) {
      return NextResponse.json({ error: "Challenge expired" }, { status: 400 });
    }

    const credential = {
      id:           body.credential.id,
      rawId:        body.credential.rawId,
      type:         body.credential.type,
      response:     body.credential.response,
      registeredAt: new Date().toISOString(),
    };

    await setSetting("webauthn_credential", JSON.stringify(credential));
    await setSetting("webauthn_enabled", "1");
    await setSetting("webauthn_pending_challenge", "");

    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: "Invalid phase" }, { status: 400 });
}

export async function DELETE(request) {
  const cookieStore = cookies();
  if (!cookieStore.get("vaulted_auth")) {
    return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  }
  await initDb();
  await setSetting("webauthn_credential", "");
  await setSetting("webauthn_enabled", "0");
  return NextResponse.json({ ok: true });
}
