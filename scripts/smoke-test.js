#!/usr/bin/env node
/**
 * Vaulted smoke tests
 * Reads app_password from DB, logs in to get a session cookie,
 * then runs all tests with that cookie. Cleans up on exit.
 *
 * Usage: node scripts/smoke-test.js [base_url] [db_path]
 * Exit 0 = all passed, Exit 1 = failures found
 */

import { createClient } from "@libsql/client";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const BASE    = process.argv[2] || "http://localhost:3000";
const DB_PATH = process.argv[3] || path.join(__dirname, "..", "vaulted.db");

let passed = 0;
let failed = 0;
let sessionCookie = null;

// ─── Helpers ──────────────────────────────────────────────────────────────────
async function test(name, fn) {
  try {
    await fn();
    console.log(`  ✓ ${name}`);
    passed++;
  } catch (err) {
    console.error(`  ✗ ${name}: ${err.message}`);
    failed++;
  }
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function headers() {
  const h = { "Content-Type": "application/json" };
  if (sessionCookie) h["Cookie"] = sessionCookie;
  return h;
}

async function get(path) {
  const res = await fetch(`${BASE}${path}`, { headers: headers() });
  const data = await res.json().catch(() => null);
  return { res, data };
}

async function post(path, body, withAuth = true) {
  const h = withAuth ? headers() : { "Content-Type": "application/json" };
  const res = await fetch(`${BASE}${path}`, {
    method: "POST", headers: h,
    body: JSON.stringify(body),
  });
  return { res, data: await res.json().catch(() => null) };
}

// ─── Login to get session cookie ─────────────────────────────────────────────
async function login() {
  try {
    // Read password directly from DB
    const db = createClient({ url: `file:${DB_PATH}` });
    const { rows } = await db.execute("SELECT value FROM settings WHERE key = 'app_password'");
    const password = rows[0]?.value;

    if (!password) {
      console.warn("  ⚠ No app_password in DB — skipping auth tests");
      return false;
    }

    const res = await fetch(`${BASE}/api/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });

    if (!res.ok) {
      console.error(`  ✗ Login failed with status ${res.status}`);
      return false;
    }

    // Extract session cookie
    const setCookie = res.headers.get("set-cookie");
    if (setCookie) {
      sessionCookie = setCookie.split(";")[0]; // just the key=value part
      console.log("  ✓ Logged in — session cookie obtained");
      return true;
    }

    console.warn("  ⚠ Login succeeded but no cookie returned");
    return false;
  } catch (err) {
    console.error(`  ✗ Login error: ${err.message}`);
    return false;
  }
}

async function logout() {
  if (sessionCookie) {
    await fetch(`${BASE}/api/logout`, { method: "POST", headers: headers() }).catch(() => {});
  }
}

// ─── Run tests ────────────────────────────────────────────────────────────────
async function run() {
  console.log(`\nVaulted smoke tests → ${BASE}\n`);

  // Login first
  console.log("── Authenticating ──");
  const loggedIn = await login();
  if (!loggedIn) {
    console.error("Cannot run authenticated tests — aborting\n");
    process.exit(1);
  }

  console.log("\n── API tests ──");

  await test("GET /api/accounts returns 200", async () => {
    const { res, data } = await get("/api/accounts");
    assert(res.status === 200, `Expected 200, got ${res.status}`);
    assert(Array.isArray(data?.accounts), "Expected accounts array");
  });

  await test("GET /api/accounts returns at least 1 account", async () => {
    const { data } = await get("/api/accounts");
    assert(data?.accounts?.length > 0, "No accounts found — DB may be empty");
  });

  await test("GET /api/networth returns 200 with total", async () => {
    const { res, data } = await get("/api/networth");
    assert(res.status === 200, `Expected 200, got ${res.status}`);
    assert(typeof data?.networth?.total === "number", "Expected numeric total");
  });

  await test("GET /api/networth?history returns array", async () => {
    const { res, data } = await get("/api/networth?history");
    assert(res.status === 200, `Expected 200, got ${res.status}`);
    assert(Array.isArray(data?.history), "Expected history array");
  });

  await test("GET /api/fx returns a rate", async () => {
    const { res, data } = await get("/api/fx?from=USD&to=AUD");
    assert(res.status === 200, `Expected 200, got ${res.status}`);
    assert(typeof data?.rate === "number" && data.rate > 0, "Expected positive rate");
  });

  await test("GET /api/notify returns config status", async () => {
    const { res, data } = await get("/api/notify");
    assert(res.status === 200, `Expected 200, got ${res.status}`);
    assert(typeof data?.configured === "boolean", "Expected configured boolean");
  });

  await test("GET /api/settings returns settings", async () => {
    const { res, data } = await get("/api/settings");
    assert(res.status === 200, `Expected 200, got ${res.status}`);
    assert(typeof data?.settings === "object", "Expected settings object");
  });

  console.log("\n── Auth tests ──");

  await test("POST /api/login with wrong password returns 401", async () => {
    const { res } = await post("/api/login", { password: "definitelywrong_xyz123" }, false);
    assert(res.status === 401, `Expected 401, got ${res.status}`);
  });

  await test("GET /api/accounts without cookie returns 401", async () => {
    const res = await fetch(`${BASE}/api/accounts`);
    assert(res.status === 401, `Expected 401, got ${res.status}`);
  });

  console.log("\n── PWA + Pages ──");

  await test("GET /login returns 200", async () => {
    const res = await fetch(`${BASE}/login`);
    assert(res.status === 200, `Expected 200, got ${res.status}`);
  });

  await test("GET /manifest.json returns valid manifest", async () => {
    const res = await fetch(`${BASE}/manifest.json`);
    assert(res.status === 200, `Expected 200, got ${res.status}`);
    const data = await res.json();
    assert(data?.name === "Vaulted", `Expected name Vaulted, got ${data?.name}`);
    assert(Array.isArray(data?.icons) && data.icons.length > 0, "Expected icons");
  });

  await test("GET /icons/icon-192x192.png returns 200", async () => {
    const res = await fetch(`${BASE}/icons/icon-192x192.png`);
    assert(res.status === 200, `Expected 200, got ${res.status}`);
  });

  // ─── Cleanup ────────────────────────────────────────────────────────────
  await logout();

  // ─── Results ────────────────────────────────────────────────────────────
  const total = passed + failed;
  console.log(`\n${total} tests: ${passed} passed, ${failed} failed\n`);

  if (failed > 0) {
    console.error(`❌ ${failed} test(s) failed\n`);
    process.exit(1);
  } else {
    console.log(`✅ All tests passed\n`);
    process.exit(0);
  }
}

run().catch(err => {
  console.error("Smoke test error:", err.message);
  process.exit(1);
});
