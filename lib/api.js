const base = "";

export async function fetchAccounts(owner) {
  const q = owner && owner !== "all" ? `?owner=${owner}` : "";
  const r = await fetch(`${base}/api/accounts${q}`, { cache: "no-store" });
  if (!r.ok) throw new Error(await r.text());
  const { accounts } = await r.json();
  return accounts;
}

export async function createAccount(data) {
  const r = await fetch(`${base}/api/accounts`, {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!r.ok) throw new Error(await r.text());
  return r.json();
}

export async function updateAccount(id, data) {
  const r = await fetch(`${base}/api/accounts/${id}`, {
    method: "PATCH", headers: { "Content-Type": "application/json" },
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

export async function fetchNetWorth(owner) {
  const q = owner && owner !== "all" ? `?owner=${owner}` : "";
  const r = await fetch(`${base}/api/networth${q}`, { cache: "no-store" });
  if (!r.ok) throw new Error(await r.text());
  const { networth } = await r.json();
  return networth;
}

export async function fetchNetWorthHistory(owner) {
  const q = owner && owner !== "all" ? `?history&owner=${owner}` : "?history";
  const r = await fetch(`${base}/api/networth${q}`, { cache: "no-store" });
  if (!r.ok) throw new Error(await r.text());
  const { history } = await r.json();
  return history;
}

export async function saveSnapshot({ account_id, balance, note, fx_rate, method }) {
  const r = await fetch(`${base}/api/snapshots`, {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ account_id, balance, note, fx_rate, method }),
  });
  if (!r.ok) throw new Error(await r.text());
  return r.json();
}

export async function fetchFxRate(from = "USD", to = "AUD") {
  const r = await fetch(`${base}/api/fx?from=${from}&to=${to}`, { cache: "no-store" });
  if (!r.ok) return { rate: 0.645 };
  return r.json();
}

export async function fetchSettings() {
  const r = await fetch(`${base}/api/settings`, { cache: "no-store" });
  if (!r.ok) throw new Error(await r.text());
  const { settings } = await r.json();
  return settings;
}

export async function updateSettings(patch) {
  const r = await fetch(`${base}/api/settings`, {
    method: "PATCH", headers: { "Content-Type": "application/json" },
    body: JSON.stringify(patch),
  });
  if (!r.ok) throw new Error(await r.text());
  return r.json();
}

// ─── Notifications ────────────────────────────────────────────────────────────
export async function sendTestNotification() {
  const r = await fetch("/api/notify", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      title:   "Vaulted test notification",
      message: "Your notifications are working correctly.",
      priority: "default",
      tags:    ["white_check_mark"],
    }),
  });
  if (!r.ok) throw new Error(await r.text());
  return r.json();
}

export async function getNotifyStatus() {
  const r = await fetch("/api/notify", { cache: "no-store" });
  if (!r.ok) throw new Error(await r.text());
  return r.json();
}
