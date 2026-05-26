export const dynamic = "force-dynamic";

// POST /api/admin/restore-db
//
// Two modes — determined by Content-Type of the request:
//
//   1. JSON body { source: "github" }
//      Fetches the backup file from the repo configured in settings
//      (github_repo + github_token). File path within the repo is
//      read from settings key "backup_filename", defaulting to
//      "vaulted-backup.db" if not set.
//
//   2. multipart/form-data with field "db"
//      Accepts a manually uploaded .db file.
//
// In both cases:
//   - Validates SQLite magic bytes
//   - Writes to a temp path
//   - Renames current DB to a timestamped .bak file
//   - Moves temp file to live DB path
//   - Restarts app via PM2 (fire-and-forget after response is sent)
//
// Auth:
//   - Protected by middleware (vaulted_auth cookie required for all routes)
//   - Defence-in-depth: also checks cookie directly inside this route
//     because this is a destructive, irreversible operation

import { NextResponse } from "next/server";
import { cookies }      from "next/headers";
import fs               from "fs";
import path             from "path";
import { execSync }     from "child_process";
import { getDb, initDb, getSetting } from "@/lib/db";

const DB_PATH      = path.join(process.cwd(), "vaulted.db");
const TMP_PATH     = path.join(process.cwd(), "vaulted_restore_tmp.db");
const SQLITE_MAGIC = Buffer.from("SQLite format 3\0");

// ── Validate buffer is a real SQLite file ────────────────────────────────────
function validateSqlite(buffer) {
  if (buffer.length < 16 || !buffer.subarray(0, 16).equals(SQLITE_MAGIC)) {
    throw new Error("Invalid SQLite file — magic bytes check failed");
  }
  if (buffer.length < 4096) {
    throw new Error("File too small to be a valid Vaulted database");
  }
  if (buffer.length > 500 * 1024 * 1024) {
    throw new Error("File too large (max 500MB)");
  }
}

// ── Swap DB files and restart ────────────────────────────────────────────────
function swapAndRestart(buffer) {
  fs.writeFileSync(TMP_PATH, buffer);
  const backupPath = DB_PATH + ".bak_" + Date.now();
  fs.renameSync(DB_PATH, backupPath);
  fs.renameSync(TMP_PATH, DB_PATH);

  // Fire-and-forget: respond first, then restart
  setTimeout(() => {
    try {
      execSync("pm2 restart vaulted --update-env", { stdio: "ignore" });
    } catch (e) {
      console.error("PM2 restart failed after DB restore:", e.message);
    }
  }, 500);

  return path.basename(backupPath);
}

export async function POST(request) {
  // ── Defence-in-depth auth check ──────────────────────────────────────────
  const cookieStore = cookies();
  const auth = cookieStore.get("vaulted_auth");
  if (!auth) {
    return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  }

  const contentType = request.headers.get("content-type") || "";

  try {
    await initDb();

    // ════════════════════════════════════════════════════════════════════════
    // MODE 1 — Pull from configured GitHub backup repo
    // ════════════════════════════════════════════════════════════════════════
    if (contentType.includes("application/json")) {
      const body = await request.json();
      if (body.source !== "github") {
        return NextResponse.json({ error: "Invalid source" }, { status: 400 });
      }

      // Read config from DB — whatever is currently set in Admin
      const githubToken    = await getSetting("github_token");
      const githubRepo     = await getSetting("github_repo");
      const backupFilename = (await getSetting("backup_filename")) || "vaulted-backup.db";

      if (!githubToken || !githubRepo) {
        return NextResponse.json(
          { error: "GitHub token or repo not configured in Admin → Credentials" },
          { status: 400 }
        );
      }

      // Fetch file metadata from GitHub API to get download URL + commit info
      const metaRes = await fetch(
        `https://api.github.com/repos/${githubRepo}/contents/${backupFilename}`,
        { headers: { Authorization: `token ${githubToken}`, Accept: "application/vnd.github.v3+json" } }
      );
      if (!metaRes.ok) {
        const err = await metaRes.json();
        return NextResponse.json(
          { error: `GitHub API error: ${err.message || metaRes.status}` },
          { status: 400 }
        );
      }
      const meta = await metaRes.json();

      // Download raw file content (base64 decoded)
      const buffer = Buffer.from(meta.content.replace(/\n/g, ""), "base64");

      validateSqlite(buffer);
      const backupCreated = swapAndRestart(buffer);

      return NextResponse.json({
        ok: true,
        message: "Database restored from GitHub backup. App is restarting — refresh in 10 seconds.",
        source: "github",
        repo: githubRepo,
        file: backupFilename,
        restoredBytes: buffer.length,
        backupCreated,
        sha: meta.sha?.slice(0, 8),
      });
    }

    // ════════════════════════════════════════════════════════════════════════
    // MODE 2 — Manual file upload
    // ════════════════════════════════════════════════════════════════════════
    if (contentType.includes("multipart/form-data")) {
      const formData = await request.formData();
      const file = formData.get("db");

      if (!file || typeof file === "string") {
        return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
      }
      if (!file.name?.endsWith(".db")) {
        return NextResponse.json({ error: "File must be a .db file" }, { status: 400 });
      }

      const buffer = Buffer.from(await file.arrayBuffer());
      validateSqlite(buffer);
      const backupCreated = swapAndRestart(buffer);

      return NextResponse.json({
        ok: true,
        message: "Database restored from uploaded file. App is restarting — refresh in 10 seconds.",
        source: "upload",
        file: file.name,
        restoredBytes: buffer.length,
        backupCreated,
      });
    }

    return NextResponse.json({ error: "Unsupported content type" }, { status: 400 });

  } catch (err) {
    try { if (fs.existsSync(TMP_PATH)) fs.unlinkSync(TMP_PATH); } catch {}
    console.error("POST /api/admin/restore-db:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
