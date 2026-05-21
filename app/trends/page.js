"use client";

import { useState, useMemo } from "react";
import {
  ResponsiveContainer, AreaChart, Area, LineChart, Line,
  XAxis, YAxis, Tooltip, CartesianGrid, Legend,
} from "recharts";
import TopBar from "@/components/top-bar";
import BottomNav from "@/components/nav";
import { useTheme } from "@/app/layout";
import {
  NET_WORTH_HISTORY, ASSET_HISTORY, MONTHS,
  TOTAL_NET_WORTH, WEEKLY_CHANGE, WEEKLY_CHANGE_PCT,
} from "@/lib/mock-data";
import { fmt, fmtShort, fmtPct } from "@/lib/utils";
import { ASSETS } from "@/lib/tokens";

// ─── Time filter ──────────────────────────────────────────────────────────────
const FILTERS = [
  { key: "1M",  label: "1M",  months: 1  },
  { key: "3M",  label: "3M",  months: 3  },
  { key: "6M",  label: "6M",  months: 6  },
  { key: "1Y",  label: "1Y",  months: 12 },
  { key: "ALL", label: "ALL", months: 99 },
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
            fontFamily: "var(--font-mono)",
            fontSize: 9,
            letterSpacing: "0.1em",
            padding: "5px 10px",
            borderRadius: "2px 7px 7px 2px",
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

// ─── Custom tooltip ───────────────────────────────────────────────────────────
function CustomTooltip({ active, payload, label, theme }) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: theme === "dark" ? "#1A1614" : "#EDE8DF",
      border: "1px solid var(--border-strong)",
      borderRadius: "3px 10px 10px 3px",
      padding: "10px 14px",
      fontFamily: "var(--font-mono)",
      fontSize: 11,
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

// ─── Stat pill ────────────────────────────────────────────────────────────────
function StatPill({ label, value, sub, color }) {
  return (
    <div className="card" style={{ padding: "12px 14px", flex: 1 }}>
      <div className="label" style={{ marginBottom: 5 }}>{label}</div>
      <div style={{
        fontFamily: "var(--font-display)",
        fontSize: 17,
        color: color || "var(--ink)",
        lineHeight: 1,
        marginBottom: sub ? 3 : 0,
      }}>
        {value}
      </div>
      {sub && (
        <div style={{ fontFamily: "var(--font-mono)", fontSize: 9, color: "var(--ink2)" }}>
          {sub}
        </div>
      )}
    </div>
  );
}

// ─── Trends page ──────────────────────────────────────────────────────────────
export default function TrendsPage() {
  const { theme } = useTheme();
  const [filter, setFilter] = useState(FILTERS[4]); // ALL default
  const [view, setView]     = useState("networth"); // "networth" | "breakdown"

  // Slice history by filter
  const slicedHistory = useMemo(() => {
    if (filter.months >= 99) return NET_WORTH_HISTORY;
    return NET_WORTH_HISTORY.slice(-filter.months);
  }, [filter]);

  // Build stacked data for breakdown chart
  const breakdownData = useMemo(() => {
    const n = filter.months >= 99 ? MONTHS.length : filter.months;
    const start = MONTHS.length - n;
    return MONTHS.slice(start).map((month, i) => ({
      month,
      Cash:   ASSET_HISTORY.cash[start + i],
      Shares: ASSET_HISTORY.shares[start + i],
      Crypto: ASSET_HISTORY.crypto[start + i],
      Super:  ASSET_HISTORY.super[start + i],
    }));
  }, [filter]);

  // Stats derived from sliced history
  const first = slicedHistory[0]?.value || 0;
  const last  = slicedHistory[slicedHistory.length - 1]?.value || 0;
  const gain  = last - first;
  const gainPct = first > 0 ? ((gain / first) * 100) : 0;
  const peak  = Math.max(...slicedHistory.map(d => d.value));
  const isUp  = gain >= 0;

  // Colours
  const cashColor   = ASSETS.cash[theme];
  const sharesColor = ASSETS.shares[theme];
  const cryptoColor = ASSETS.crypto[theme];
  const superColor  = ASSETS.super[theme];
  const lineColor   = isUp ? (theme === "dark" ? "#7DD68A" : "#1A7A38") : (theme === "dark" ? "#E87070" : "#C03030");
  const gridColor   = theme === "dark" ? "rgba(255,255,255,0.05)" : "rgba(26,22,20,0.07)";
  const axisColor   = theme === "dark" ? "#3A3028" : "#C8C0B4";

  // Chart data formatted
  const chartData = slicedHistory.map(d => ({
    date: d.date.slice(0, 7).replace("-", "/"),
    value: d.value,
  }));

  return (
    <>
      <TopBar />
      <main className="page" style={{ paddingTop: 16, display: "flex", flexDirection: "column", gap: 16 }}>

        {/* Title */}
        <div className="fade-up">
          <div style={{ fontFamily: "var(--font-display)", fontSize: 20, color: "var(--ink)", marginBottom: 4 }}>
            Trends
          </div>
          <div style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--ink2)", letterSpacing: "0.08em" }}>
            Net worth over time
          </div>
        </div>

        {/* Time filter */}
        <div className="fade-up fade-up-1">
          <TimeFilter active={filter} onChange={setFilter} />
        </div>

        {/* Stats row */}
        <div className="fade-up fade-up-1" style={{ display: "flex", gap: 8 }}>
          <StatPill
            label="Net Worth"
            value={fmtShort(last)}
            sub={`Peak: ${fmtShort(peak)}`}
          />
          <StatPill
            label={isUp ? "Total Gain" : "Total Loss"}
            value={(isUp ? "+" : "") + fmtShort(Math.abs(gain))}
            sub={fmtPct(gainPct)}
            color={isUp ? "var(--positive)" : "var(--negative)"}
          />
          <StatPill
            label="This Week"
            value={(WEEKLY_CHANGE >= 0 ? "+" : "") + fmtShort(WEEKLY_CHANGE)}
            sub={fmtPct(WEEKLY_CHANGE_PCT)}
            color={WEEKLY_CHANGE >= 0 ? "var(--positive)" : "var(--negative)"}
          />
        </div>

        {/* View toggle */}
        <div className="fade-up fade-up-2" style={{
          display: "flex", gap: 4,
          background: "var(--ink3)", borderRadius: "3px 10px 10px 3px", padding: 3,
          alignSelf: "flex-start",
        }}>
          {[
            { key: "networth",  label: "Net Worth"  },
            { key: "breakdown", label: "Breakdown"  },
          ].map(v => (
            <button
              key={v.key}
              onClick={() => setView(v.key)}
              className="btn-press"
              style={{
                fontFamily: "var(--font-mono)", fontSize: 9, letterSpacing: "0.1em",
                padding: "5px 12px", borderRadius: "2px 7px 7px 2px", border: "none",
                cursor: "pointer",
                background: view === v.key ? "var(--gold)" : "transparent",
                color: view === v.key ? "#0C0A08" : "var(--ink2)",
                transition: "all 0.2s",
              }}
            >
              {v.label}
            </button>
          ))}
        </div>

        {/* Main chart */}
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
                  <XAxis
                    dataKey="date"
                    tick={{ fontFamily: "var(--font-mono)", fontSize: 8, fill: axisColor, letterSpacing: "0.06em" }}
                    tickLine={false} axisLine={false}
                    interval="preserveStartEnd"
                  />
                  <YAxis
                    tick={{ fontFamily: "var(--font-mono)", fontSize: 8, fill: axisColor }}
                    tickLine={false} axisLine={false}
                    tickFormatter={v => fmtShort(v)}
                    width={42}
                  />
                  <Tooltip content={<CustomTooltip theme={theme} />} />
                  <Area
                    type="monotone"
                    dataKey="value"
                    stroke={lineColor}
                    strokeWidth={2}
                    fill="url(#nwGrad)"
                    dot={false}
                    activeDot={{ r: 4, fill: lineColor, stroke: "var(--bg)", strokeWidth: 2 }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </>
          ) : (
            <>
              <div className="label" style={{ marginBottom: 14, paddingLeft: 6 }}>Asset Breakdown</div>
              <ResponsiveContainer width="100%" height={220}>
                <AreaChart data={breakdownData} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
                  <defs>
                    {[
                      { id: "cashGrad",   color: cashColor   },
                      { id: "sharesGrad", color: sharesColor },
                      { id: "cryptoGrad", color: cryptoColor },
                      { id: "superGrad",  color: superColor  },
                    ].map(g => (
                      <linearGradient key={g.id} id={g.id} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={g.color} stopOpacity={0.4} />
                        <stop offset="100%" stopColor={g.color} stopOpacity={0.05} />
                      </linearGradient>
                    ))}
                  </defs>
                  <CartesianGrid stroke={gridColor} strokeDasharray="3 3" vertical={false} />
                  <XAxis
                    dataKey="month"
                    tick={{ fontFamily: "var(--font-mono)", fontSize: 8, fill: axisColor }}
                    tickLine={false} axisLine={false}
                    interval="preserveStartEnd"
                  />
                  <YAxis
                    tick={{ fontFamily: "var(--font-mono)", fontSize: 8, fill: axisColor }}
                    tickLine={false} axisLine={false}
                    tickFormatter={v => fmtShort(v)}
                    width={42}
                  />
                  <Tooltip content={<CustomTooltip theme={theme} />} />
                  <Area type="monotone" dataKey="Cash"   stroke={cashColor}   strokeWidth={1.5} fill="url(#cashGrad)"   dot={false} stackId="1" />
                  <Area type="monotone" dataKey="Shares" stroke={sharesColor} strokeWidth={1.5} fill="url(#sharesGrad)" dot={false} stackId="1" />
                  <Area type="monotone" dataKey="Crypto" stroke={cryptoColor} strokeWidth={1.5} fill="url(#cryptoGrad)" dot={false} stackId="1" />
                  <Area type="monotone" dataKey="Super"  stroke={superColor}  strokeWidth={1.5} fill="url(#superGrad)"  dot={false} stackId="1" />
                </AreaChart>
              </ResponsiveContainer>

              {/* Legend */}
              <div style={{ display: "flex", gap: 12, flexWrap: "wrap", paddingLeft: 6, marginTop: 10 }}>
                {[
                  { label: "Cash",   color: cashColor   },
                  { label: "Shares", color: sharesColor },
                  { label: "Crypto", color: cryptoColor },
                  { label: "Super",  color: superColor  },
                ].map(l => (
                  <div key={l.label} style={{ display: "flex", alignItems: "center", gap: 5 }}>
                    <div style={{ width: 8, height: 8, borderRadius: "50%", background: l.color, boxShadow: `0 0 5px ${l.color}` }} />
                    <span style={{ fontFamily: "var(--font-mono)", fontSize: 9, color: "var(--ink2)", letterSpacing: "0.08em" }}>
                      {l.label}
                    </span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Monthly summary table */}
        <div className="card fade-up fade-up-3" style={{ padding: "16px 18px" }}>
          <div className="label" style={{ marginBottom: 12 }}>Monthly Snapshot</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
            {slicedHistory.slice(-6).reverse().map((row, i) => {
              const prev  = slicedHistory[slicedHistory.indexOf(row) - 1];
              const delta = prev ? row.value - prev.value : 0;
              const up    = delta >= 0;
              return (
                <div key={row.date} style={{
                  display: "flex", justifyContent: "space-between", alignItems: "center",
                  padding: "9px 0",
                  borderBottom: i < 5 ? "1px solid var(--border)" : "none",
                }}>
                  <div style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--ink2)", letterSpacing: "0.06em" }}>
                    {row.date.slice(0, 7)}
                  </div>
                  <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                    {delta !== 0 && (
                      <div style={{
                        fontFamily: "var(--font-mono)", fontSize: 9,
                        color: up ? "var(--positive)" : "var(--negative)",
                      }}>
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

        <div style={{ height: 8 }} />
      </main>
      <BottomNav />
    </>
  );
}
