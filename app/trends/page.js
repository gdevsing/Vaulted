"use client";

import { useState, useMemo, useEffect } from "react";
import {
  ResponsiveContainer, AreaChart, Area, LineChart, Line,
  XAxis, YAxis, Tooltip, CartesianGrid,
} from "recharts";
import AppShell from "@/components/app-shell";
import { useTheme } from "@/app/layout";
import { fmt, fmtShort, fmtPct } from "@/lib/utils";
import { ASSETS } from "@/lib/tokens";

// ─── Time filter ──────────────────────────────────────────────────────────────
const FILTERS = [
  { key: "1M",  label: "1M",  weeks: 5  },
  { key: "3M",  label: "3M",  weeks: 13 },
  { key: "6M",  label: "6M",  weeks: 26 },
  { key: "1Y",  label: "1Y",  weeks: 52 },
  { key: "ALL", label: "ALL", weeks: 9999 },
];

function weekToLabel(weekStr) {
  const [year, wk] = weekStr.split("-").map(Number);
  const d = new Date(year, 0, 4 + (wk - 1) * 7);
  return d.toLocaleDateString("en-AU", { month: "short", day: "numeric" });
}

function dateLabel(iso) {
  return new Date(iso + "T00:00:00").toLocaleDateString("en-AU", { month: "short", day: "numeric" });
}

// Distinct line colours for individual accounts (cycled if there are more accounts)
const ACCOUNT_COLORS = [
  "#60A5FA", "#4ADE80", "#C084FC", "#FB923C", "#F472B6",
  "#FACC15", "#2DD4BF", "#A3E635", "#F87171", "#94A3B8",
  "#38BDF8", "#E879F9",
];

function TimeFilter({ active, onChange }) {
  return (
    <div style={{ display: "flex", gap: 4 }}>
      {FILTERS.map(f => (
        <button
          key={f.key}
          onClick={() => onChange(f)}
          className="btn-press"
          style={{
            fontFamily: "var(--font-mono)", fontSize: 9, letterSpacing: "0.1em",
            padding: "5px 10px", borderRadius: "2px 7px 7px 2px",
            border: `1px solid ${active.key === f.key ? "var(--gold)" : "var(--border)"}`,
            cursor: "pointer",
            background: active.key === f.key ? "rgba(255,210,74,0.12)" : "transparent",
            color: active.key === f.key ? "var(--gold)" : "var(--ink2)",
            transition: "all 0.2s",
          }}
        >
          {f.label}
        </button>
      ))}
    </div>
  );
}

function CustomTooltip({ active, payload, label, theme }) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: "#1A1A1A",
      border: "1px solid var(--border-strong)",
      borderRadius: "3px 10px 10px 3px",
      padding: "10px 14px",
      fontFamily: "var(--font-mono)", fontSize: 11,
      boxShadow: "0 8px 24px rgba(0,0,0,0.3)",
    }}>
      <div style={{ color: "var(--ink2)", fontSize: 9, letterSpacing: "0.1em", marginBottom: 6 }}>
        {label}
      </div>
      {payload
        .filter(p => p.value != null)
        .filter((p, _, arr) => !(p.dataKey === "projected" && arr.some(q => q.dataKey === "value")))
        .map(p => (
          <div key={p.dataKey} style={{ color: p.color, marginBottom: 2 }}>
            {p.name ? `${p.name}: ` : ""}{fmt(p.value)}
          </div>
        ))}
    </div>
  );
}

function AccountTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  const rows = payload.filter(p => p.value != null).sort((a, b) => b.value - a.value);
  return (
    <div style={{
      background: "#1A1A1A", border: "1px solid var(--border-strong)",
      borderRadius: "3px 10px 10px 3px", padding: "10px 14px",
      fontFamily: "var(--font-mono)", fontSize: 10, boxShadow: "0 8px 24px rgba(0,0,0,0.3)",
    }}>
      <div style={{ color: "var(--ink2)", fontSize: 9, letterSpacing: "0.1em", marginBottom: 6 }}>{label}</div>
      {rows.map(p => (
        <div key={p.dataKey} style={{ color: p.color, marginBottom: 2 }}>{p.name}: {fmt(p.value)}</div>
      ))}
    </div>
  );
}

function SegToggle({ options, value, onChange }) {
  return (
    <div style={{
      display: "flex", gap: 4, background: "var(--ink3)",
      borderRadius: "3px 10px 10px 3px", padding: 3, alignSelf: "flex-start",
    }}>
      {options.map(v => (
        <button key={v.key} onClick={() => onChange(v.key)} className="btn-press" style={{
          fontFamily: "var(--font-mono)", fontSize: 9, letterSpacing: "0.1em",
          padding: "5px 12px", borderRadius: "2px 7px 7px 2px", border: "none", cursor: "pointer",
          background: value === v.key ? "rgba(255,71,87,0.12)" : "transparent",
          color: value === v.key ? "var(--gold)" : "var(--ink2)",
          transition: "all 0.2s",
        }}>
          {v.label}
        </button>
      ))}
    </div>
  );
}

function StatPill({ label, value, sub, color }) {
  return (
    <div className="card" style={{ padding: "9px 11px", flex: 1, borderLeft: "2px solid rgba(255,71,87,0.4)" }}>
      <div className="label" style={{ marginBottom: 3, fontSize: 8 }}>{label}</div>
      <div style={{ fontFamily: "var(--font-display)", fontSize: 13, color: color || "var(--ink)", lineHeight: 1, marginBottom: sub ? 2 : 0 }}>
        {value}
      </div>
      {sub && <div style={{ fontFamily: "var(--font-mono)", fontSize: 8, color: "var(--ink2)" }}>{sub}</div>}
    </div>
  );
}

// ─── Trends page ──────────────────────────────────────────────────────────────
export default function TrendsPage() {
  const { theme } = useTheme();
  const [filter, setFilter] = useState(FILTERS[4]);
  const [view, setView]     = useState("networth");
  const [rawHistory, setRawHistory] = useState([]);
  const [accounts, setAccounts]     = useState([]);
  const [loading, setLoading]       = useState(true);
  // Accounts view
  const [acctMode, setAcctMode]     = useState("together"); // "together" | "single"
  const [hidden, setHidden]         = useState(() => new Set()); // keys hidden in "together"
  const [focus, setFocus]           = useState(null);            // key shown in "single"

  useEffect(() => {
    fetch("/api/networth?history", { cache: "no-store" })
      .then(r => r.json())
      .then(h => {
        setRawHistory(h.history || []);
        setAccounts(h.accounts || []);
      })
      .finally(() => setLoading(false));
  }, []);

  const historyData = useMemo(() => rawHistory.map(row => ({
    ...row,
    label:  row.week_end ? dateLabel(row.week_end) : weekToLabel(row.week),
    week:   row.week,
    value:  Number(row.total),
    Cash:   Number(row.cash),
    Shares: Number(row.shares),
    Crypto: Number(row.crypto),
    Super:  Number(row.super),
  })), [rawHistory]);

  const sliced = useMemo(() => {
    if (filter.weeks >= 9999) return historyData;
    return historyData.slice(-filter.weeks);
  }, [historyData, filter]);

  const breakdownData = sliced.map(d => ({ month: d.label, Cash: d.Cash, Shares: d.Shares, Crypto: d.Crypto, Super: d.Super }));

  const first   = sliced[0]?.value || 0;
  const last    = sliced[sliced.length - 1]?.value || 0;
  const gain    = Math.round((last - first) * 100) / 100;
  const gainPct = first > 0 ? ((gain / first) * 100) : 0;
  const peak    = sliced.length ? Math.max(...sliced.map(d => d.value)) : 0;
  const isUp    = gain >= 0;

  const prev       = sliced[sliced.length - 2]?.value || last;
  const weekChange = Math.round((last - prev) * 100) / 100;
  const weekPct    = prev > 0 ? ((weekChange / prev) * 100) : 0;

  const weeklyDeltas   = sliced.slice(1).map((d, i) => d.value - sliced[i].value);
  const avgWeekly      = weeklyDeltas.length > 0 ? weeklyDeltas.reduce((s, c) => s + c, 0) / weeklyDeltas.length : 0;
  const monthlyRate    = Math.round(avgWeekly * (52 / 12));
  const mid            = Math.floor(weeklyDeltas.length / 2);
  const recentAvg      = weeklyDeltas.length > mid ? weeklyDeltas.slice(mid).reduce((s, c) => s + c, 0) / (weeklyDeltas.length - mid) : avgWeekly;
  const earlierAvg     = mid > 0 ? weeklyDeltas.slice(0, mid).reduce((s, c) => s + c, 0) / mid : avgWeekly;
  const savingsTrendUp = recentAvg >= earlierAvg;

  const lastWeek = sliced[sliced.length - 1]?.week;
  const lastEnd  = sliced[sliced.length - 1]?.week_end;
  const forecastPoints = sliced.length >= 2 && lastWeek ? Array.from({ length: 52 }, (_, i) => {
    const [yr, wk] = lastWeek.split("-").map(Number);
    const d = lastEnd
      ? new Date(new Date(lastEnd + "T00:00:00").getTime() + (i + 1) * 7 * 86400000)
      : new Date(yr, 0, 4 + (wk - 1 + i + 1) * 7);
    return {
      date: d.toLocaleDateString("en-AU", { month: "short", day: "numeric" }),
      projected: Math.round(last + avgWeekly * (i + 1)),
    };
  }) : [];

  const forecastChart = [
    ...sliced.map((d, i) => ({
      date: d.label,
      value: d.value,
      projected: i === sliced.length - 1 ? d.value : undefined,
    })),
    ...forecastPoints,
  ];

  const cashColor   = ASSETS.cash[theme];
  const sharesColor = ASSETS.shares[theme];
  const cryptoColor = ASSETS.crypto[theme];
  const superColor  = ASSETS.super[theme];
  const lineColor   = isUp ? "#FF6B6B" : "#E87070";
  const goldColor   = "#FF4757";
  const gridColor   = "rgba(255,255,255,0.05)";
  const axisColor   = "#3A3A3A";

  const isEmpty = !loading && historyData.length === 0;

  // ─── Per-account series ─────────────────────────────────────────────────────
  const acctList = useMemo(() => accounts.map((a, i) => {
    const vals  = sliced.map(d => d[a.key]).filter(v => v != null);
    const start = vals[0] ?? null;
    const end   = vals[vals.length - 1] ?? null;
    const change = start != null && end != null ? Math.round((end - start) * 100) / 100 : 0;
    return {
      ...a,
      color: ACCOUNT_COLORS[i % ACCOUNT_COLORS.length],
      start, end, change,
      changePct: start > 0 ? (change / start) * 100 : 0,
    };
  }), [accounts, sliced]);

  const visibleAccts = acctList.filter(a => !hidden.has(a.key));
  const focusAcct    = acctList.find(a => a.key === focus) || acctList[0];
  const acctChart    = sliced.map(d => {
    const row = { date: d.label };
    for (const a of acctList) row[a.key] = d[a.key];
    return row;
  });

  const toggleHidden = (key) => setHidden(prev => {
    const next = new Set(prev);
    next.has(key) ? next.delete(key) : next.add(key);
    return next;
  });
  const openSingle = (key) => { setFocus(key); setAcctMode("single"); };

  // Weeks where the focused account actually changed (newest first)
  const focusHistory = focusAcct ? sliced
    .map((d, i) => ({ label: d.label, week: d.week, value: d[focusAcct.key], prev: i > 0 ? sliced[i - 1][focusAcct.key] : null }))
    .filter(r => r.value != null && (r.prev == null || r.value !== r.prev))
    .reverse()
    .slice(0, 8) : [];

  return (
    <AppShell><main className="page" style={{ paddingTop: 16, display: "flex", flexDirection: "column", gap: 16 }}>

        <div className="fade-up">
          <div style={{ fontFamily: "var(--font-display)", fontSize: 20, color: "var(--ink)", marginBottom: 4 }}>Trends</div>
          <div style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--ink2)", letterSpacing: "0.08em" }}>Net worth over time</div>
        </div>

        {isEmpty ? (
          <div className="card fade-up" style={{ padding: "48px 24px", textAlign: "center" }}>
            <div style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--ink2)", letterSpacing: "0.08em" }}>
              No history yet
            </div>
            <div style={{ fontFamily: "var(--font-mono)", fontSize: 9, color: "var(--ink3)", marginTop: 8 }}>
              Update your accounts to start tracking trends
            </div>
          </div>
        ) : (
          <>
            <div className="fade-up fade-up-1">
              <TimeFilter active={filter} onChange={setFilter} />
            </div>

            <div className="fade-up fade-up-1" style={{ display: "flex", gap: 6 }}>
              <StatPill label="Net Worth" value={fmtShort(last)} sub={`Peak: ${fmtShort(peak)}`} />
              <StatPill
                label={isUp ? "Total Gain" : "Total Loss"}
                value={(isUp ? "+" : "") + fmtShort(Math.abs(gain))}
                sub={fmtPct(gainPct)}
                color={isUp ? "var(--positive)" : "var(--negative)"}
              />
              <StatPill
                label="This Week"
                value={(weekChange >= 0 ? "+" : "") + fmtShort(Math.abs(weekChange))}
                sub={fmtPct(weekPct)}
                color={weekChange >= 0 ? "var(--positive)" : "var(--negative)"}
              />
              <StatPill
                label="Monthly Avg"
                value={(monthlyRate >= 0 ? "~" : "-~") + fmtShort(Math.abs(monthlyRate))}
                sub={weeklyDeltas.length >= 4 ? (savingsTrendUp ? "▲ improving" : "▼ slowing") : "/ month"}
                color={monthlyRate >= 0 ? "var(--positive)" : "var(--negative)"}
              />
            </div>

            <div className="fade-up fade-up-2" style={{ display: "flex" }}>
              <SegToggle
                options={[{ key: "networth", label: "Net Worth" }, { key: "breakdown", label: "Breakdown" }, { key: "accounts", label: "Accounts" }]}
                value={view}
                onChange={setView}
              />
            </div>

            {view === "accounts" ? (
              <AccountsView
                mode={acctMode} setMode={setAcctMode}
                list={acctList} visible={visibleAccts} hidden={hidden}
                toggleHidden={toggleHidden} setHidden={setHidden}
                focusAcct={focusAcct} setFocus={setFocus} openSingle={openSingle}
                chartData={acctChart} focusHistory={focusHistory}
                gridColor={gridColor} axisColor={axisColor}
              />
            ) : (<>
            <div className="card fade-up fade-up-2" style={{ padding: "18px 12px 8px" }}>
              {view === "networth" ? (
                <>
                  <div className="label" style={{ marginBottom: 14, paddingLeft: 6 }}>Net Worth</div>
                  <ResponsiveContainer width="100%" height={220}>
                    <AreaChart data={forecastChart} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
                      <defs>
                        <linearGradient id="nwGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor={lineColor} stopOpacity={0.25} />
                          <stop offset="100%" stopColor={lineColor} stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid stroke={gridColor} strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="date" tick={{ fontFamily: "var(--font-mono)", fontSize: 8, fill: axisColor, letterSpacing: "0.06em" }} tickLine={false} axisLine={false} interval="preserveStartEnd" />
                      <YAxis tick={{ fontFamily: "var(--font-mono)", fontSize: 8, fill: axisColor }} tickLine={false} axisLine={false} tickFormatter={v => fmtShort(v)} width={42} />
                      <Tooltip content={<CustomTooltip theme={theme} />} />
                      <Area type="monotone" dataKey="value" name="Net Worth" stroke={lineColor} strokeWidth={2} fill="url(#nwGrad)" dot={false} activeDot={{ r: 4, fill: lineColor, stroke: "var(--bg)", strokeWidth: 2 }} />
                      <Area type="monotone" dataKey="projected" name="Forecast" stroke={goldColor} strokeWidth={1.5} strokeDasharray="5 4" fill="none" dot={false} activeDot={{ r: 3, fill: goldColor, stroke: "var(--bg)", strokeWidth: 2 }} />
                    </AreaChart>
                  </ResponsiveContainer>
                  {forecastPoints.length > 0 && (
                    <div style={{ display: "flex", gap: 16, paddingLeft: 6, marginTop: 10 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                        <div style={{ width: 14, height: 2, background: lineColor, borderRadius: 1 }} />
                        <span style={{ fontFamily: "var(--font-mono)", fontSize: 8, color: "var(--ink2)", letterSpacing: "0.08em" }}>ACTUAL</span>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                        <div style={{ width: 14, height: 0, borderTop: `2px dashed ${goldColor}` }} />
                        <span style={{ fontFamily: "var(--font-mono)", fontSize: 8, color: goldColor, letterSpacing: "0.08em" }}>FORECAST</span>
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <>
                  <div className="label" style={{ marginBottom: 14, paddingLeft: 6 }}>Asset Breakdown</div>
                  <ResponsiveContainer width="100%" height={220}>
                    <AreaChart data={breakdownData} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
                      <defs>
                        {[{ id: "cashGrad", color: cashColor }, { id: "sharesGrad", color: sharesColor }, { id: "cryptoGrad", color: cryptoColor }, { id: "superGrad", color: superColor }].map(g => (
                          <linearGradient key={g.id} id={g.id} x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor={g.color} stopOpacity={0.4} />
                            <stop offset="100%" stopColor={g.color} stopOpacity={0.05} />
                          </linearGradient>
                        ))}
                      </defs>
                      <CartesianGrid stroke={gridColor} strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="month" tick={{ fontFamily: "var(--font-mono)", fontSize: 8, fill: axisColor }} tickLine={false} axisLine={false} interval="preserveStartEnd" />
                      <YAxis tick={{ fontFamily: "var(--font-mono)", fontSize: 8, fill: axisColor }} tickLine={false} axisLine={false} tickFormatter={v => fmtShort(v)} width={42} />
                      <Tooltip content={<CustomTooltip theme={theme} />} />
                      <Area type="monotone" dataKey="Cash"   stroke={cashColor}   strokeWidth={1.5} fill="url(#cashGrad)"   dot={false} stackId="1" />
                      <Area type="monotone" dataKey="Shares" stroke={sharesColor} strokeWidth={1.5} fill="url(#sharesGrad)" dot={false} stackId="1" />
                      <Area type="monotone" dataKey="Crypto" stroke={cryptoColor} strokeWidth={1.5} fill="url(#cryptoGrad)" dot={false} stackId="1" />
                      <Area type="monotone" dataKey="Super"  stroke={superColor}  strokeWidth={1.5} fill="url(#superGrad)"  dot={false} stackId="1" />
                    </AreaChart>
                  </ResponsiveContainer>
                  <div style={{ display: "flex", gap: 12, flexWrap: "wrap", paddingLeft: 6, marginTop: 10 }}>
                    {[{ label: "Cash", color: cashColor }, { label: "Shares", color: sharesColor }, { label: "Crypto", color: cryptoColor }, { label: "Super", color: superColor }].map(l => (
                      <div key={l.label} style={{ display: "flex", alignItems: "center", gap: 5 }}>
                        <div style={{ width: 8, height: 8, borderRadius: "50%", background: l.color, boxShadow: `0 0 5px ${l.color}` }} />
                        <span style={{ fontFamily: "var(--font-mono)", fontSize: 9, color: "var(--ink2)", letterSpacing: "0.08em" }}>{l.label}</span>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>

            {/* History table */}
            <div className="card fade-up fade-up-3" style={{ padding: "16px 18px" }}>
              <div className="label" style={{ marginBottom: 12 }}>History</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
                {sliced.slice(-6).reverse().map((row, i, arr) => {
                  const prevRow = sliced[sliced.indexOf(row) - 1];
                  const delta   = prevRow ? row.value - prevRow.value : 0;
                  const up      = delta >= 0;
                  return (
                    <div key={row.week} style={{
                      display: "flex", justifyContent: "space-between", alignItems: "center",
                      padding: "9px 0",
                      borderBottom: i < arr.length - 1 ? "1px solid var(--border)" : "none",
                    }}>
                      <div style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--ink2)", letterSpacing: "0.06em" }}>
                        {row.label}
                      </div>
                      <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                        {delta !== 0 && (
                          <div style={{ fontFamily: "var(--font-mono)", fontSize: 9, color: up ? "var(--positive)" : "var(--negative)" }}>
                            {up ? "▲" : "▼"} {fmt(Math.abs(delta))}
                          </div>
                        )}
                        <div style={{ fontFamily: "var(--font-display)", fontSize: 14, color: "var(--ink)" }}>
                          {fmt(row.value)}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
            </>)}
          </>
        )}

        <div style={{ height: 8 }} />
      </main></AppShell>
  );
}

// ─── Accounts view ────────────────────────────────────────────────────────────
// "Together": every account on one chart, chips toggle each line on/off.
// "Single":   one account on its own, with its stats and change history.
function AccountsView({
  mode, setMode, list, visible, hidden, toggleHidden, setHidden,
  focusAcct, setFocus, openSingle, chartData, focusHistory, gridColor, axisColor,
}) {
  const mono = { fontFamily: "var(--font-mono)" };
  const tick = { ...mono, fontSize: 8, fill: axisColor };

  if (!list.length) {
    return (
      <div className="card fade-up fade-up-2" style={{ padding: "32px 18px", textAlign: "center", ...mono, fontSize: 10, color: "var(--ink2)" }}>
        No accounts with history yet
      </div>
    );
  }

  const chip = (a, on, onClick) => (
    <button key={a.key} onClick={onClick} className="btn-press" style={{
      display: "flex", alignItems: "center", gap: 6,
      ...mono, fontSize: 9, letterSpacing: "0.06em",
      padding: "5px 10px", borderRadius: "2px 7px 7px 2px", cursor: "pointer",
      border: `1px solid ${on ? a.color : "var(--border)"}`,
      background: on ? `${a.color}1F` : "transparent",
      color: on ? "var(--ink)" : "var(--ink2)",
      opacity: on ? 1 : 0.6, transition: "all 0.2s",
    }}>
      <span style={{ width: 7, height: 7, borderRadius: "50%", background: a.color, flexShrink: 0 }} />
      {a.name}
    </button>
  );

  const changeText = (a) => (a.change >= 0 ? "▲ " : "▼ ") + fmt(Math.abs(a.change)) + "  " + fmtPct(a.changePct);
  const changeColor = (v) => (v >= 0 ? "var(--positive)" : "var(--negative)");

  return (
    <>
      <div className="fade-up fade-up-2" style={{ display: "flex" }}>
        <SegToggle
          options={[{ key: "together", label: "Together" }, { key: "single", label: "One at a time" }]}
          value={mode}
          onChange={setMode}
        />
      </div>

      {mode === "together" ? (
        <>
          <div className="card fade-up fade-up-2" style={{ padding: "18px 12px 10px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingLeft: 6, marginBottom: 14 }}>
              <div className="label">All Accounts</div>
              <div style={{ display: "flex", gap: 10 }}>
                <button onClick={() => setHidden(new Set())} style={{ ...mono, fontSize: 8, letterSpacing: "0.1em", color: "var(--gold)", background: "none", border: "none", cursor: "pointer" }}>ALL</button>
                <button onClick={() => setHidden(new Set(list.map(a => a.key)))} style={{ ...mono, fontSize: 8, letterSpacing: "0.1em", color: "var(--ink2)", background: "none", border: "none", cursor: "pointer" }}>NONE</button>
              </div>
            </div>
            <ResponsiveContainer width="100%" height={240}>
              <LineChart data={chartData} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
                <CartesianGrid stroke={gridColor} strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="date" tick={tick} tickLine={false} axisLine={false} interval="preserveStartEnd" />
                <YAxis tick={tick} tickLine={false} axisLine={false} tickFormatter={v => fmtShort(v)} width={42} />
                <Tooltip content={<AccountTooltip />} />
                {visible.map(a => (
                  <Line key={a.key} type="monotone" dataKey={a.key} name={a.name} stroke={a.color}
                    strokeWidth={1.75} dot={false} connectNulls={false}
                    activeDot={{ r: 3, fill: a.color, stroke: "var(--bg)", strokeWidth: 2 }} />
                ))}
              </LineChart>
            </ResponsiveContainer>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6, padding: "12px 6px 2px" }}>
              {list.map(a => chip(a, !hidden.has(a.key), () => toggleHidden(a.key)))}
            </div>
          </div>

          <div className="card fade-up fade-up-3" style={{ padding: "16px 18px" }}>
            <div className="label" style={{ marginBottom: 12 }}>Change This Period</div>
            {[...list].sort((x, y) => (y.end ?? 0) - (x.end ?? 0)).map((a, i, arr) => (
              <button key={a.key} onClick={() => openSingle(a.key)} className="btn-press" style={{
                width: "100%", display: "flex", justifyContent: "space-between", alignItems: "center",
                padding: "9px 0", background: "none", border: "none", cursor: "pointer", textAlign: "left",
                borderBottom: i < arr.length - 1 ? "1px solid var(--border)" : "none",
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0 }}>
                  <span style={{ width: 7, height: 7, borderRadius: "50%", background: a.color, flexShrink: 0 }} />
                  <span style={{ ...mono, fontSize: 10, color: "var(--ink)", letterSpacing: "0.04em" }}>{a.name}</span>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontFamily: "var(--font-display)", fontSize: 13, color: "var(--ink)" }}>{a.end != null ? fmt(a.end) : "—"}</div>
                  {a.end != null && <div style={{ ...mono, fontSize: 8, color: changeColor(a.change), marginTop: 2 }}>{changeText(a)}</div>}
                </div>
              </button>
            ))}
            <div style={{ ...mono, fontSize: 8, color: "var(--ink2)", marginTop: 10, letterSpacing: "0.06em" }}>
              Tap an account to see it on its own
            </div>
          </div>
        </>
      ) : focusAcct && (
        <>
          <div className="fade-up fade-up-2" style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            {list.map(a => chip(a, a.key === focusAcct.key, () => setFocus(a.key)))}
          </div>

          <div className="fade-up fade-up-2" style={{ display: "flex", gap: 6 }}>
            <StatPill label="Balance" value={focusAcct.end != null ? fmtShort(focusAcct.end) : "—"} sub={`${focusAcct.institution} · ${focusAcct.currency}`} />
            <StatPill
              label={focusAcct.change >= 0 ? "Gain" : "Loss"}
              value={(focusAcct.change >= 0 ? "+" : "-") + fmtShort(Math.abs(focusAcct.change))}
              sub={fmtPct(focusAcct.changePct)}
              color={changeColor(focusAcct.change)}
            />
          </div>

          <div className="card fade-up fade-up-2" style={{ padding: "18px 12px 8px" }}>
            <div className="label" style={{ marginBottom: 14, paddingLeft: 6 }}>{focusAcct.name}</div>
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={chartData} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
                <defs>
                  <linearGradient id="acctGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={focusAcct.color} stopOpacity={0.3} />
                    <stop offset="100%" stopColor={focusAcct.color} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke={gridColor} strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="date" tick={tick} tickLine={false} axisLine={false} interval="preserveStartEnd" />
                <YAxis tick={tick} tickLine={false} axisLine={false} tickFormatter={v => fmtShort(v)} width={42} domain={["auto", "auto"]} />
                <Tooltip content={<AccountTooltip />} />
                <Area type="monotone" dataKey={focusAcct.key} name={focusAcct.name} stroke={focusAcct.color}
                  strokeWidth={2} fill="url(#acctGrad)" dot={false} connectNulls={false}
                  activeDot={{ r: 4, fill: focusAcct.color, stroke: "var(--bg)", strokeWidth: 2 }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          <div className="card fade-up fade-up-3" style={{ padding: "16px 18px" }}>
            <div className="label" style={{ marginBottom: 12 }}>Updates</div>
            {focusHistory.length === 0 ? (
              <div style={{ ...mono, fontSize: 10, color: "var(--ink2)" }}>No updates in this period</div>
            ) : focusHistory.map((r, i, arr) => {
              const delta = r.prev != null ? r.value - r.prev : 0;
              return (
                <div key={r.week} style={{
                  display: "flex", justifyContent: "space-between", alignItems: "center", padding: "9px 0",
                  borderBottom: i < arr.length - 1 ? "1px solid var(--border)" : "none",
                }}>
                  <div style={{ ...mono, fontSize: 10, color: "var(--ink2)", letterSpacing: "0.06em" }}>{r.label}</div>
                  <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                    {delta !== 0 && (
                      <div style={{ ...mono, fontSize: 9, color: changeColor(delta) }}>
                        {delta >= 0 ? "▲" : "▼"} {fmt(Math.abs(Math.round(delta * 100) / 100))}
                      </div>
                    )}
                    <div style={{ fontFamily: "var(--font-display)", fontSize: 14, color: "var(--ink)" }}>{fmt(r.value)}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </>
  );
}
