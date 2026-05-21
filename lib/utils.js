// ─── Vaulted Utils ────────────────────────────────────────────────────────────

export const fmt = (n) => "$" + Number(n).toLocaleString("en-AU");

export const fmtShort = (n) => {
  if (n >= 1000000) return "$" + (n / 1000000).toFixed(1) + "M";
  if (n >= 1000)    return "$" + (n / 1000).toFixed(1)    + "k";
  return "$" + n;
};

export const fmtPct = (n) => (n >= 0 ? "+" : "") + n.toFixed(1) + "%";

export const fmtUSD = (n) => "USD $" + Number(n).toLocaleString("en-US");

export const assetLabel = (key) => ({
  cash: "Cash", shares: "Shares", crypto: "Crypto", super: "Super",
}[key] || key);

export const ownerLabel = (key) => key === "H" ? "Husband" : key === "W" ? "Wife" : "Joint";

export const daysAgo = (dateStr) => {
  const diff = Math.floor((Date.now() - new Date(dateStr)) / 86400000);
  if (diff === 0) return "today";
  if (diff === 1) return "yesterday";
  if (diff < 7)   return `${diff}d ago`;
  if (diff < 30)  return `${Math.floor(diff / 7)}wk ago`;
  return `${Math.floor(diff / 30)}mo ago`;
};

export const isOverdue = (account) => {
  const days = Math.floor((Date.now() - new Date(account.updated)) / 86400000);
  const limits = { weekly: 10, fortnightly: 18, monthly: 35 };
  return days > (limits[account.frequency] || 35);
};

// Project net worth forward based on average weekly growth
export const projectNetWorth = (history, weeksAhead) => {
  const recent = history.slice(-8);
  const avgWeeklyGrowth = (recent[recent.length - 1].value - recent[0].value) / (recent.length * 4.33);
  const last = history[history.length - 1].value;
  return Math.round(last + avgWeeklyGrowth * weeksAhead);
};
