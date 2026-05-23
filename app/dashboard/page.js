"use client";

import { useState, useEffect, useCallback } from "react";
import TopBar from "@/components/top-bar";
import BottomNav from "@/components/nav";
import AccountCard from "@/components/account-card";
import DonutChart from "@/components/charts/donut";
import Sparkline from "@/components/charts/sparkline";
import { useTheme } from "@/app/layout";
import { fetchAccounts, fetchNetWorth, fetchNetWorthHistory, fetchFxRate } from "@/lib/api";
import { fmt, fmtShort, fmtPct } from "@/lib/utils";
import { ASSETS } from "@/lib/tokens";

function OwnerFilter({ active, onChange }) {
  const options = [
    { key: "all", label: "COMBINED" },
    { key: "H",   label: "HUSBAND"  },
    { key: "W",   label: "WIFE"     },
    { key: "J",   label: "JOINT"    },
  ];
  return (
    <div style={{ display: "flex", gap: 4, background: "var(--ink3)", borderRadius: "3px 10px 10px 3px", padding: 3 }}>
      {options.map(o => (
        <button key={o.key} onClick={() => onChange(o.key)} className="btn-press" style={{
          fontFamily: "var(--font-mono)", fontSize: 9, letterSpacing: "0.1em",
          padding: "5px 10px", borderRadius: "2px 7px 7px 2px", border: "none",
          cursor: "pointer",
          background: active === o.key ? "var(--gold)" : "transparent",
          color: active === o.key ? "#0C0A08" : "var(--ink2)",
          transition: "all 0.2s",
        }}>{o.label}</button>
      ))}
    </div>
  );
}

function NetWorthHero({ total, history }) {
  const { theme } = useTheme();
  const prev  = history?.length > 1 ? history[history.length - 2]?.total : total;
  const change = total - (prev || total);
  const changePct = prev ? ((change / prev) * 100) : 0;
  const isUp = change >= 0;

  return (
    <div className="card card-glow fade-up" style={{
      padding: "22px 20px 18px",
      background: theme === "dark"
        ? "linear-gradient(135deg, rgba(255,210,80,0.07) 0%, rgba(255,255,255,0.02) 60%)"
        : "linear-gradient(135deg, rgba(180,120,0,0.06) 0%, rgba(26,22,20,0.02) 60%)",
      borderColor: "rgba(255,210,74,0.2)",
    }}>
      <div className="label" style={{ marginBottom: 8 }}>Total Net Worth</div>
      <div style={{ fontFamily: "var(--font-display)", fontSize: 38, letterSpacing: "0.02em", color: "var(--ink)", lineHeight: 1, marginBottom: 8 }}>
        {fmt(total)}
      </div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: isUp ? "var(--positive)" : "var(--negative)", display: "flex", alignItems: "center", gap: 4 }}>
            <span>{isUp ? "▲" : "▼"}</span>
            <span>{fmt(Math.abs(change))} this week</span>
          </div>
          <div style={{ fontFamily: "var(--font-mono)", fontSize: 10, padding: "2px 7px", borderRadius: "2px 6px 6px 2px", background: isUp ? "rgba(125,214,138,0.12)" : "rgba(232,112,112,0.12)", color: isUp ? "var(--positive)" : "var(--negative)" }}>
            {fmtPct(changePct)}
          </div>
        </div>
        {history?.length > 1 && (
          <Sparkline data={history.map(h => ({ value: h.total || 0 }))} color={isUp ? "#7DD68A" : "#E87070"} height={36} width={90} />
        )}
      </div>
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

export default function DashboardPage() {
  const [owner, setOwner]       = useState("all");
  const [accounts, setAccounts] = useState([]);
  const [networth, setNetworth] = useState(null);
  const [history, setHistory]   = useState([]);
  const [loading, setLoading]   = useState(true);
  const { theme } = useTheme();

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [accs, nw, hist, { rate: usdRate }] = await Promise.all([
        fetchAccounts(owner),
        fetchNetWorth(owner),
        fetchNetWorthHistory(owner),
        fetchFxRate("USD", "AUD"),
      ]);

      // Override balance with live AUD conversion for non-AUD accounts
      const enriched = accs.map(a =>
        a.currency !== "AUD" && a.native_balance != null
          ? { ...a, balance: Math.round(a.native_balance * usdRate * 100) / 100, liveRate: usdRate }
          : a
      );

      setAccounts(enriched);
      setNetworth(nw);
      setHistory(hist);
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  }, [owner]);

  useEffect(() => { load(); }, [load]);

  const assetTotals = { cash: networth?.cash || 0, shares: networth?.shares || 0, crypto: networth?.crypto || 0, super: networth?.super || 0 };
  const grouped = {};
  accounts.forEach(a => { if (!grouped[a.asset]) grouped[a.asset] = []; grouped[a.asset].push(a); });
  const assetOrder  = ["cash","shares","crypto","super"];
  const assetLabels = { cash: "Cash", shares: "Shares", crypto: "Crypto", super: "Super" };

  return (
    <>
      <TopBar />
      <main className="page" style={{ paddingTop: 16, display: "flex", flexDirection: "column", gap: 14 }}>
        <div className="fade-up" style={{ display: "flex", justifyContent: "center" }}>
          <OwnerFilter active={owner} onChange={setOwner} />
        </div>

        {loading ? (
          <div style={{ textAlign: "center", padding: "48px 0", fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--ink2)", letterSpacing: "0.1em" }}>
            LOADING VAULT...
          </div>
        ) : (
          <>
            <NetWorthHero total={networth?.total || 0} history={history} />

            <div className="card fade-up fade-up-1" style={{ padding: "16px 18px" }}>
              <div className="label" style={{ marginBottom: 12 }}>Asset Allocation</div>
              <DonutChart totals={assetTotals} />
            </div>

            {assetOrder.map(asset => {
              const accs = grouped[asset];
              if (!accs?.length) return null;
              return (
                <div key={asset} className="fade-up fade-up-3">
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                    <div className="label">{assetLabels[asset]}</div>
                    <div style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--ink2)" }}>
                      {fmt(accs.reduce((s, a) => s + (a.balance || 0), 0))}
                    </div>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    {accs.map((account, i) => (
                      <AccountCard key={account.id} account={account} delay={i * 0.06} />
                    ))}
                  </div>
                </div>
              );
            })}
          </>
        )}
        <div style={{ height: 8 }} />
      </main>
      <BottomNav />
    </>
  );
}
