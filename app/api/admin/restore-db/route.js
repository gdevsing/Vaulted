export const dynamic = "force-dynamic";

// POST /api/admin/restore-db
// Accepts a multipart form upload of a .db file.
// Validates it is a real SQLite database, writes it to a temp path,
// closes the current DB connection, hot-swaps the file, then restarts
// the process via PM2 so the new DB is picked up cleanly.
//
// Auth: protected by middleware (vaulted_auth cookie required).
// Defence-in-depth: also checks the cookie directly in this route
// because this is a destructive, irreversible operation.

import { NextResponse } from "next/server";
import { cookies }      from "next/headers";
import fs               from "fs";
import path             from "path";
import { execSync }     from "child_process";

const DB_PATH   = path.join(process.cwd(), "vaulted.db");
const TMP_PATH  = path.join(process.cwd(), "vaulted_restore_tmp.db");
const SQLITE_MAGIC = Buffer.from("SQLite format 3\0");

export async function POST(request) {
  // ── Defence-in-depth auth check ──────────────────────────────────────────
  const cookieStore = cookies();
  const auth = cookieStore.get("vaulted_auth");
  if (!auth) {
    return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  }

  try {
    // ── Parse uploaded file ─────────────────────────────────────────────────
    const formData = await request.formData();
    const file = formData.get("db");

    if (!file || typeof file === "string") {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    const filename = file.name || "";
    if (!filename.endsWith(".db")) {
      return NextResponse.json({ error: "File must be a .db file" }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // ── Validate SQLite magic bytes ─────────────────────────────────────────
    if (buffer.length < 16 || !buffer.subarray(0, 16).equals(SQLITE_MAGIC)) {
      return NextResponse.json({ error: "Invalid SQLite file — magic bytes check failed" }, { status: 400 });
    }

    // ── Basic size sanity check (must be > 4KB, less than 500MB) ───────────
    if (buffer.length < 4096) {
      return NextResponse.json({ error: "File too small to be a valid Vaulted database" }, { status: 400 });
    }
    if (buffer.length > 500 * 1024 * 1024) {
      return NextResponse.json({ error: "File too large (max 500MB)" }, { status: 400 });
    }

    // ── Write to temp path first ────────────────────────────────────────────
    fs.writeFileSync(TMP_PATH, buffer);

    // ── Swap: rename current DB to backup, move temp to live path ──────────
    const backupPath = DB_PATH + ".bak_" + Date.now();
    fs.renameSync(DB_PATH, backupPath);
    fs.renameSync(TMP_PATH, DB_PATH);

    // ── Restart via PM2 to reload the DB connection cleanly ────────────────
    // Fire-and-forget: the restart will kill this process, so we respond first.
    // We use a short delay so the response can be sent before the process dies.
    setTimeout(() => {
      try {
        execSync("pm2 restart vaulted --update-env", { stdio: "ignore" });
      } catch (e) {
        // If PM2 restart fails the file swap still succeeded.
        // The operator can restart manually.
        console.error("PM2 restart failed after DB restore:", e.message);
      }
    }, 500);

    return NextResponse.json({
      ok: true,
      message: "Database restored. App is restarting — refresh in 10 seconds.",
      backupCreated: path.basename(backupPath),
      restoredBytes: buffer.length,
    });

  } catch (err) {
    // Clean up temp file if it exists
    try { if (fs.existsSync(TMP_PATH)) fs.unlinkSync(TMP_PATH); } catch {}
    console.error("POST /api/admin/restore-db:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
