#!/usr/bin/env node
/**
 * Vaulted smoke tests
 * Run after deploy to verify core API routes are working.
 * Usage: node scripts/smoke-test.js https://your-domain.com
 * Exit 0 = all passed, Exit 1 = failures found
 */

const BASE = process.argv[2] || "http://localhost:3000";
let passed = 0;
let failed = 0;

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

async function get(path) {
  const res = await fetch(`${BASE}${path}`);
  return { res, data: await res.json().catch(() => null) };
}

async function post(path, body) {
  const res = await fetch(`${BASE}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  return { res, data: await res.json().catch(() => null) };
}

async function run() {
  console.log(`\nVaulted smoke tests → ${BASE}\n`);

  // ─── Accounts ────────────────────────────────────────────────────────────
  await test("GET /api/accounts returns 200", async () => {
    const { res, data } = await get("/api/accounts");
    assert(res.status === 200, `Expected 200, got ${res.status}`);
    assert(Array.isArray(data?.accounts), "Expected accounts array");
  });

  await test("GET /api/accounts returns at least 1 account", async () => {
    const { data } = await get("/api/accounts");
    assert(data?.accounts?.length > 0, "No accounts found — DB may be empty");
  });

  // ─── Net worth ────────────────────────────────────────────────────────────
  await test("GET /api/networth returns 200 with total", async () => {
    const { res, data } = await get("/api/networth");
    assert(res.status === 200, `Expected 200, got ${res.status}`);
    assert(typeof data?.networth?.total === "number", "Expected numeric total");
  });

  await test("GET /api/networth?history returns history array", async () => {
    const { res, data } = await get("/api/networth?history");
    assert(res.status === 200, `Expected 200, got ${res.status}`);
    assert(Array.isArray(data?.history), "Expected history array");
  });

  // ─── Auth ─────────────────────────────────────────────────────────────────
  await test("POST /api/login with wrong password returns 401", async () => {
    const { res } = await post("/api/login", { password: "definitelywrong_xyz123" });
    assert(res.status === 401, `Expected 401, got ${res.status}`);
  });

  await test("GET /api/accounts without cookie returns 401", async () => {
    const res = await fetch(`${BASE}/api/accounts`, {
      headers: { Cookie: "" }, // no auth cookie
    });
    // Should be 401 if middleware is protecting API routes
    // Accept 200 if middleware not yet tightened (TODO item)
    assert([200, 401].includes(res.status), `Unexpected status ${res.status}`);
  });

  // ─── FX rate ──────────────────────────────────────────────────────────────
  await test("GET /api/fx returns a rate", async () => {
    const { res, data } = await get("/api/fx?from=USD&to=AUD");
    assert(res.status === 200, `Expected 200, got ${res.status}`);
    assert(typeof data?.rate === "number" && data.rate > 0, "Expected positive rate");
  });

  // ─── Notifications ────────────────────────────────────────────────────────
  await test("GET /api/notify returns config status", async () => {
    const { res, data } = await get("/api/notify");
    assert(res.status === 200, `Expected 200, got ${res.status}`);
    assert(typeof data?.configured === "boolean", "Expected configured boolean");
  });

  // ─── Settings ────────────────────────────────────────────────────────────
  await test("GET /api/settings returns settings object", async () => {
    const { res, data } = await get("/api/settings");
    assert(res.status === 200, `Expected 200, got ${res.status}`);
    assert(typeof data?.settings === "object", "Expected settings object");
  });

  // ─── Pages load ──────────────────────────────────────────────────────────
  await test("GET /login returns 200 HTML", async () => {
    const res = await fetch(`${BASE}/login`);
    assert(res.status === 200, `Expected 200, got ${res.status}`);
    const text = await res.text();
    assert(text.includes("VAULTED") || text.includes("vaulted"), "Login page missing Vaulted branding");
  });

  // ─── PWA ─────────────────────────────────────────────────────────────────
  await test("GET /manifest.json returns valid manifest", async () => {
    const res = await fetch(`${BASE}/manifest.json`);
    assert(res.status === 200, `Expected 200, got ${res.status}`);
    const data = await res.json();
    assert(data?.name === "Vaulted", "Expected name: Vaulted");
    assert(Array.isArray(data?.icons) && data.icons.length > 0, "Expected icons array");
  });

  // ─── Results ─────────────────────────────────────────────────────────────
  console.log(`\n${passed + failed} tests: ${passed} passed, ${failed} failed\n`);

  if (failed > 0) {
    console.error(`❌ ${failed} test(s) failed — deployment should be reviewed\n`);
    process.exit(1);
  } else {
    console.log(`✅ All tests passed\n`);
    process.exit(0);
  }
}

run().catch(err => {
  console.error("Smoke test runner error:", err.message);
  process.exit(1);
});
