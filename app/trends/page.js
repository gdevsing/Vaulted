"use client";

import { useState, useMemo, useEffect } from "react";
import {
  ResponsiveContainer, AreaChart, Area,
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
      background: theme === "dark" ? "#1A1614" : "#EDE8DF",
      border: "1px solid var(--border-strong)",
      borderRadius: "3px 10px 10px 3px",
      padding: "10px 14px",
      fontFamily: "var(--font-mono)", fontSize: 11,
      boxShadow: "0 8px 24px rgba(0,0,0,0.3)",
    }}>
      <div style={{ color: "var(--ink2)", fontSize: 9, letterSpacing: "0.1em", marginBottom: 6 }}>
        {label}
      </div>
      {payload.map(p => (
        <div key={p.dataKey} style={{ color: p.color, marginBottom: 2 }}>
          {p.name ? `${p.name}: ` : ""}{fmt(p.value)}
        </div>
      ))}
    </div>
  );
}

function StatPill({ label, value, sub, color }) {
  return (
    <div className="card" style={{ padding: "12px 14px", flex: 1 }}>
      <div className="label" style={{ marginBottom: 5 }}>{label}</div>
      <div style={{ fontFamily: "var(--font-display)", fontSize: 17, color: color || "var(--ink)", lineHeight: 1, marginBottom: sub ? 3 : 0 }}>
        {value}
      </div>
      {sub && <div style={{ fontFamily: "var(--font-mono)", fontSize: 9, color: "var(--ink2)" }}>{sub}</div>}
    </div>
  );
}

// ─── Trends page ──────────────────────────────────────────────────────────────
export default function TrendsPage() {
  const { theme } = useTheme();
  const [filter, setFilter] = useState(FILTERS[4]);
  const [view, setView]     = useState("networth");
  const [rawHistory, setRawHistory] = useState([]);
  const [loading, setLoading]       = useState(true);

  useEffect(() => {
    fetch("/api/networth?history", { cache: "no-store" })
      .then(r => r.json())
      .then(h => setRawHistory(h.history || []))
      .finally(() => setLoading(false));
  }, []);

  const historyData = useMemo(() => rawHistory.map(row => ({
    label:  weekToLabel(row.week),
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

  const chartData     = sliced.map(d => ({ date: d.label, value: d.value }));
  const breakdownData = sliced.map(d => ({ month: d.label, Cash: d.Cash, Shares: d.Shares, Crypto: d.Crypto, Super: d.Super }));

  const first   = sliced[0]?.value || 0;
  const last    = sliced[sliced.length - 1]?.value || 0;
  const gain    = last - first;
  const gainPct = first > 0 ? ((gain / first) * 100) : 0;
  const peak    = sliced.length ? Math.max(...sliced.map(d => d.value)) : 0;
  const isUp    = gain >= 0;

  const prev       = sliced[sliced.length - 2]?.value || last;
  const weekChange = last - prev;
  const weekPct    = prev > 0 ? ((weekChange / prev) * 100) : 0;

  const cashColor   = ASSETS.cash[theme];
  const sharesColor = ASSETS.shares[theme];
  const cryptoColor = ASSETS.crypto[theme];
  const superColor  = ASSETS.super[theme];
  const lineColor   = isUp ? (theme === "dark" ? "#7DD68A" : "#1A7A38") : (theme === "dark" ? "#E87070" : "#C03030");
  const gridColor   = theme === "dark" ? "rgba(255,255,255,0.05)" : "rgba(26,22,20,0.07)";
  const axisColor   = theme === "dark" ? "#3A3028" : "#C8C0B4";

  const isEmpty = !loading && historyData.length === 0;

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

            <div className="fade-up fade-up-1" style={{ display: "flex", gap: 8 }}>
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
            </div>

            <div className="fade-up fade-up-2" style={{
              display: "flex", gap: 4,
              background: "var(--ink3)", borderRadius: "3px 10px 10px 3px", padding: 3,
              alignSelf: "flex-start",
            }}>
              {[{ key: "networth", label: "Net Worth" }, { key: "breakdown", label: "Breakdown" }].map(v => (
                <button key={v.key} onClick={() => setView(v.key)} className="btn-press" style={{
                  fontFamily: "var(--font-mono)", fontSize: 9, letterSpacing: "0.1em",
                  padding: "5px 12px", borderRadius: "2px 7px 7px 2px", border: "none",
                  cursor: "pointer",
                  background: view === v.key ? "var(--gold)" : "transparent",
                  color: view === v.key ? "#0C0A08" : "var(--ink2)",
                  transition: "all 0.2s",
                }}>
                  {v.label}
                </button>
              ))}
            </div>

            <div className="card fade-up fade-up-2" style={{ padding: "18px 12px 8px" }}>
              {view === "networth" ? (
                <>
                  <div className="label" style={{ marginBottom: 14, paddingLeft: 6 }}>Net Worth</div>
                  <ResponsiveContainer width="100%" height={220}>
                    <AreaChart data={chartData} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
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
                      <Area type="monotone" dataKey="value" stroke={lineColor} strokeWidth={2} fill="url(#nwGrad)" dot={false} activeDot={{ r: 4, fill: lineColor, stroke: "var(--bg)", strokeWidth: 2 }} />
                    </AreaChart>
                  </ResponsiveContainer>
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
          </>
        )}

        <div style={{ height: 8 }} />
      </main></AppShell>
  );
}
