// ─── Vaulted API client ───────────────────────────────────────────────────────
// Thin fetch wrappers — all pages call these instead of mock-data directly.

const base = "";  // same-origin, no prefix needed

// ─── Accounts ─────────────────────────────────────────────────────────────────
export async function fetchAccounts(owner) {
  const q = owner && owner !== "all" ? `?owner=${owner}` : "";
  const r = await fetch(`${base}/api/accounts${q}`);
  if (!r.ok) throw new Error(await r.text());
  const { accounts } = await r.json();
  return accounts;
}

export async function createAccount(data) {
  const r = await fetch(`${base}/api/accounts`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!r.ok) throw new Error(await r.text());
  return r.json();
}

export async function updateAccount(id, data) {
  const r = await fetch(`${base}/api/accounts/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!r.ok) throw new Error(await r.text());
  return r.json();
}

export async function deleteAccount(id) {
  const r = await fetch(`${base}/api/accounts/${id}`, { method: "DELETE" });
  if (!r.ok) throw new Error(await r.text());
  return r.json();
}

// ─── Net worth ────────────────────────────────────────────────────────────────
export async function fetchNetWorth(owner) {
  const q = owner && owner !== "all" ? `?owner=${owner}` : "";
  const r = await fetch(`${base}/api/networth${q}`);
  if (!r.ok) throw new Error(await r.text());
  const { networth } = await r.json();
  return networth;
}

export async function fetchNetWorthHistory(owner) {
  const q = owner && owner !== "all" ? `?history&owner=${owner}` : "?history";
  const r = await fetch(`${base}/api/networth${q}`);
  if (!r.ok) throw new Error(await r.text());
  const { history } = await r.json();
  return history;
}

// ─── Snapshots ────────────────────────────────────────────────────────────────
export async function saveSnapshot({ account_id, balance, note, fx_rate, method }) {
  const r = await fetch(`${base}/api/snapshots`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ account_id, balance, note, fx_rate, method }),
  });
  if (!r.ok) throw new Error(await r.text());
  return r.json();
}

export async function fetchSnapshots(account_id, limit = 52) {
  const r = await fetch(`${base}/api/snapshots?account_id=${account_id}&limit=${limit}`);
  if (!r.ok) throw new Error(await r.text());
  const { snapshots } = await r.json();
  return snapshots;
}

// ─── FX ───────────────────────────────────────────────────────────────────────
export async function fetchFxRate(from = "USD", to = "AUD") {
  const r = await fetch(`${base}/api/fx?from=${from}&to=${to}`);
  if (!r.ok) return { rate: 0.645 };
  return r.json();
}

// ─── Settings ─────────────────────────────────────────────────────────────────
export async function fetchSettings() {
  const r = await fetch(`${base}/api/settings`);
  if (!r.ok) throw new Error(await r.text());
  const { settings } = await r.json();
  return settings;
}

export async function updateSettings(patch) {
  const r = await fetch(`${base}/api/settings`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(patch),
  });
  if (!r.ok) throw new Error(await r.text());
  return r.json();
}
