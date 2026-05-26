// ─── Vaulted Mock Data ────────────────────────────────────────────────────────

export const ACCOUNTS = [
  { id: 1,  name: "Cash Account 1",   institution: "Bank A",    owner: "H", asset: "cash",   currency: "AUD", balance: 8200,  nativeBalance: null,  updated: "2026-05-18", group: null,      overdue: false, frequency: "weekly"      },
  { id: 2,  name: "Cash Account 2",   institution: "Bank B",    owner: "H", asset: "cash",   currency: "AUD", balance: 6400,  nativeBalance: null,  updated: "2026-05-18", group: null,      overdue: false, frequency: "weekly"      },
  { id: 3,  name: "Cash Account 3",   institution: "Bank C",    owner: "H", asset: "cash",   currency: "AUD", balance: 7100,  nativeBalance: null,  updated: "2026-05-18", group: null,      overdue: false, frequency: "weekly"      },
  { id: 4,  name: "Cash Account 4",   institution: "Bank D",    owner: "H", asset: "cash",   currency: "AUD", balance: 6500,  nativeBalance: null,  updated: "2026-05-15", group: null,      overdue: false, frequency: "weekly"      },
  { id: 5,  name: "Shares AUD",       institution: "Broker A",  owner: "H", asset: "shares", currency: "AUD", balance: 9800,  nativeBalance: null,  updated: "2026-05-18", group: "Broker A", overdue: false, frequency: "fortnightly" },
  { id: 6,  name: "Shares USD",       institution: "Broker A",  owner: "H", asset: "shares", currency: "USD", balance: 13220, nativeBalance: 8530,  updated: "2026-05-18", group: "Broker A", overdue: false, frequency: "fortnightly" },
  { id: 7,  name: "Shares Managed",   institution: "Broker B",  owner: "H", asset: "shares", currency: "AUD", balance: 9080,  nativeBalance: null,  updated: "2026-05-04", group: null,      overdue: true,  frequency: "monthly"     },
  { id: 8,  name: "Crypto",           institution: "Exchange A", owner: "H", asset: "crypto", currency: "AUD", balance: 8950, nativeBalance: null,  updated: "2026-05-18", group: null,      overdue: false, frequency: "weekly"      },
  { id: 9,  name: "Super 1",          institution: "Super Fund A", owner: "H", asset: "super", currency: "AUD", balance: 5100, nativeBalance: null, updated: "2026-04-18", group: null,     overdue: false, frequency: "monthly"     },
  { id: 10, name: "Super 2",          institution: "Super Fund B", owner: "W", asset: "super", currency: "AUD", balance: 4100, nativeBalance: null, updated: "2026-04-18", group: null,     overdue: false, frequency: "monthly"     },
];

export const FX_RATE = 0.645; // AUD/USD

export const NET_WORTH_HISTORY = [
  { date: "2025-07-01", value: 61000 },
  { date: "2025-08-01", value: 63500 },
  { date: "2025-09-01", value: 62000 },
  { date: "2025-10-01", value: 65800 },
  { date: "2025-11-01", value: 67200 },
  { date: "2025-12-01", value: 68900 },
  { date: "2026-01-01", value: 71200 },
  { date: "2026-02-01", value: 73800 },
  { date: "2026-03-01", value: 75100 },
  { date: "2026-04-01", value: 74200 },
  { date: "2026-05-01", value: 78450 },
];

export const ASSET_HISTORY = {
  cash:   [28000, 29000, 27500, 30000, 28500, 27000, 28200, 29500, 28000, 27800, 28200],
  shares: [22000, 23500, 22800, 24000, 26000, 27500, 29500, 30500, 32000, 31000, 32100],
  crypto: [5000,  5200,  5800,  6000,  6500,  7200,  7800,  8200,  8800,  8900,  8950 ],
  super:  [6000,  5800,  5900,  5800,  6200,  7200,  5700,  5600,  6300,  6500,  9200 ],
};

export const GOALS = [
  { id: 1, name: "First $100k",  target: 100000, achieved: null },
  { id: 2, name: "First $250k",  target: 250000, achieved: null },
];

export const MILESTONES = [
  { amount: 75000, achievedAt: "2026-05-01" },
  { amount: 50000, achievedAt: "2026-01-15" },
  { amount: 25000, achievedAt: "2025-08-20" },
];

// Derived helpers
export const TOTAL_NET_WORTH = ACCOUNTS.reduce((sum, a) => sum + a.balance, 0);

export const ASSET_TOTALS = ACCOUNTS.reduce((acc, a) => {
  acc[a.asset] = (acc[a.asset] || 0) + a.balance;
  return acc;
}, {});

export const WEEKLY_CHANGE = 1240;
export const WEEKLY_CHANGE_PCT = 1.6;

export const MONTHS = ["Jul","Aug","Sep","Oct","Nov","Dec","Jan","Feb","Mar","Apr","May"];

// Update flow — accounts due this week
export const DUE_ACCOUNTS = ACCOUNTS.filter(a =>
  a.frequency === "weekly" || a.overdue
);

// ─── Mock mode — API response shapes ─────────────────────────────────────────
// Used by middleware to intercept API calls when cookie is "mock".
// Each entry matches the exact shape returned by the real route handler.

function toWeek(dateStr) {
  const d = new Date(dateStr + "T00:00:00");
  const jan1 = new Date(d.getFullYear(), 0, 1);
  const weekNum = Math.floor((d - jan1) / (7 * 86400000));
  return `${d.getFullYear()}-${String(weekNum).padStart(2, "0")}`;
}

export function getMockResponse(pathname, method, searchParams) {
  if (pathname === "/api/accounts" || pathname.startsWith("/api/accounts/")) {
    if (method === "DELETE" || method === "PATCH") return { ok: true };
    return { accounts: ACCOUNTS };
  }
  if (pathname === "/api/networth") {
    if (searchParams?.has("history")) {
      return { history: NET_WORTH_HISTORY.map((h, i) => ({
        week:   toWeek(h.date),
        total:  h.value,
        cash:   ASSET_HISTORY.cash[i]   || 0,
        shares: ASSET_HISTORY.shares[i] || 0,
        crypto: ASSET_HISTORY.crypto[i] || 0,
        super:  ASSET_HISTORY.super[i]  || 0,
      })) };
    }
    return { networth: { total: TOTAL_NET_WORTH, ...ASSET_TOTALS } };
  }
  if (pathname === "/api/fx") {
    return { rate: FX_RATE, cached: true };
  }
  if (pathname.startsWith("/api/snapshots")) {
    if (method === "POST") return { saved: true };
    return { snapshots: [] };
  }
  if (pathname === "/api/settings") {
    return { settings: {} };
  }
  if (pathname.startsWith("/api/gemini")) {
    return { balance: 12500, confidence: "high", currency: "AUD" };
  }
  if (pathname.startsWith("/api/notify") || pathname.startsWith("/api/run-job")) {
    return { ok: true };
  }
  return {};
}
