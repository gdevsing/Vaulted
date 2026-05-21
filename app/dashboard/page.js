"use client";

import { useState, useEffect } from "react";
import TopBar from "@/components/top-bar";
import BottomNav from "@/components/nav";
import AccountCard from "@/components/account-card";
import DonutChart from "@/components/charts/donut";
import Sparkline from "@/components/charts/sparkline";
import { useTheme } from "@/app/layout";
import {
  ACCOUNTS, TOTAL_NET_WORTH, ASSET_TOTALS,
  NET_WORTH_HISTORY, WEEKLY_CHANGE, WEEKLY_CHANGE_PCT, GOALS,
} from "@/lib/mock-data";
import { fmt, fmtShort, fmtPct } from "@/lib/utils";

// ─── Owner filter toggle ──────────────────────────────────────────────────────
function OwnerFilter({ active, onChange }) {
  const options = [
    { key: "all", label: "COMBINED" },
    { key: "H",   label: "HUSBAND"  },
    { key: "W",   label: "WIFE"     },
  ];
  return (
    <div style={{ display: "flex", gap: 4, background: "var(--ink3)", borderRadius: "3px 10px 10px 3px", padding: 3 }}>
      {options.map(o => (
        <button
          key={o.key}
          onClick={() => onChange(o.key)}
          className="btn-press"
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: 9,
            letterSpacing: "0.1em",
            padding: "5px 10px",
            borderRadius: "2px 7px 7px 2px",
            border: "none",
            cursor: "pointer",
            background: active === o.key ? "var(--gold)" : "transparent",
            color: active === o.key ? "#0C0A08" : "var(--ink2)",
            fontWeight: active === o.key ? 600 : 400,
            transition: "all 0.2s",
          }}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

// ─── Hero net worth ───────────────────────────────────────────────────────────
function NetWorthHero({ total, change, changePct, history }) {
  const { theme } = useTheme();
  const isUp = change >= 0;

  return (
    <div
      className="card card-glow fade-up"
      style={{
        padding: "22px 20px 18px",
        background: theme === "dark"
          ? "linear-gradient(135deg, rgba(255,210,80,0.07) 0%, rgba(255,255,255,0.02) 60%)"
          : "linear-gradient(135deg, rgba(180,120,0,0.06) 0%, rgba(26,22,20,0.02) 60%)",
        borderColor: "rgba(255,210,74,0.2)",
      }}
    >
      <div className="label" style={{ marginBottom: 8 }}>Total Net Worth</div>

      <div style={{
        fontFamily: "var(--font-display)",
        fontSize: 38,
        letterSpacing: "0.02em",
        color: "var(--ink)",
        lineHeight: 1,
        marginBottom: 8,
      }}>
        {fmt(total)}
      </div>

      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{
            fontFamily: "var(--font-mono)",
            fontSize: 11,
            color: isUp ? "var(--positive)" : "var(--negative)",
            display: "flex",
            alignItems: "center",
            gap: 4,
          }}>
            <span>{isUp ? "▲" : "▼"}</span>
            <span>{fmt(Math.abs(change))} this week</span>
          </div>
          <div style={{
            fontFamily: "var(--font-mono)",
            fontSize: 10,
            padding: "2px 7px",
            borderRadius: "2px 6px 6px 2px",
            background: isUp ? "rgba(125,214,138,0.12)" : "rgba(232,112,112,0.12)",
            color: isUp ? "var(--positive)" : "var(--negative)",
          }}>
            {fmtPct(changePct)}
          </div>
        </div>
        <Sparkline data={history} color={isUp ? "#7DD68A" : "#E87070"} height={36} width={90} />
      </div>

      {/* XP bar toward $100k */}
      <div style={{ marginTop: 14 }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
          <div className="label">Progress to $100k</div>
          <div className="label">{((total / 100000) * 100).toFixed(1)}%</div>
        </div>
        <div className="xp-bar-track">
          <div className="xp-bar-fill" style={{ "--xp-width": `${Math.min((total / 100000) * 100, 100)}%` }} />
        </div>
      </div>
    </div>
  );
}

// ─── Biggest mover widget ─────────────────────────────────────────────────────
function BiggestMover() {
  const account = ACCOUNTS.find(a => a.id === 6);
  return (
    <div className="card fade-up fade-up-2" style={{ padding: "14px 16px" }}>
      <div className="label" style={{ marginBottom: 8 }}>Biggest Mover This Week</div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <div style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: "var(--ink)" }}>{account.name}</div>
          <div style={{ fontFamily: "var(--font-mono)", fontSize: 9, color: "var(--ink2)", marginTop: 3 }}>{account.institution}</div>
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{ fontFamily: "var(--font-display)", fontSize: 16, color: "var(--positive)", lineHeight: 1 }}>+$920</div>
          <div style={{ fontFamily: "var(--font-mono)", fontSize: 9, color: "var(--positive)", marginTop: 3 }}>+7.4%</div>
        </div>
      </div>
    </div>
  );
}

// ─── Dashboard ────────────────────────────────────────────────────────────────
export default function DashboardPage() {
  const [owner, setOwner] = useState("all");

  const filtered = owner === "all" ? ACCOUNTS : ACCOUNTS.filter(a => a.owner === owner);
  const filteredTotal = filtered.reduce((s, a) => s + a.balance, 0);
  const filteredAssets = filtered.reduce((acc, a) => {
    acc[a.asset] = (acc[a.asset] || 0) + a.balance;
    return acc;
  }, {});

  const grouped = {};
  filtered.forEach(a => {
    if (!grouped[a.asset]) grouped[a.asset] = [];
    grouped[a.asset].push(a);
  });

  const assetOrder  = ["cash", "shares", "crypto", "super"];
  const assetLabels = { cash: "Cash", shares: "Shares", crypto: "Crypto", super: "Super" };

  return (
    <>
      <TopBar />
      <main className="page" style={{ paddingTop: 16, display: "flex", flexDirection: "column", gap: 14 }}>

        <div className="fade-up" style={{ display: "flex", justifyContent: "center" }}>
          <OwnerFilter active={owner} onChange={setOwner} />
        </div>

        <NetWorthHero
          total={filteredTotal}
          change={WEEKLY_CHANGE}
          changePct={WEEKLY_CHANGE_PCT}
          history={NET_WORTH_HISTORY}
        />

        <div className="card fade-up fade-up-1" style={{ padding: "16px 18px" }}>
          <div className="label" style={{ marginBottom: 12 }}>Asset Allocation</div>
          <DonutChart totals={filteredAssets} />
        </div>

        <BiggestMover />

        {assetOrder.map(asset => {
          const accounts = grouped[asset];
          if (!accounts?.length) return null;
          return (
            <div key={asset} className="fade-up fade-up-3">
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                <div className="label">{assetLabels[asset]}</div>
                <div style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--ink2)" }}>
                  {fmt(accounts.reduce((s, a) => s + a.balance, 0))}
                </div>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {accounts.map((account, i) => (
                  <AccountCard key={account.id} account={account} delay={i * 0.06} />
                ))}
              </div>
            </div>
          );
        })}

        <div style={{ height: 8 }} />
      </main>
      <BottomNav />
    </>
  );
}
