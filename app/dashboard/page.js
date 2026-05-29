"use client";

import { useState, useEffect, useCallback } from "react";
import AppShell from "@/components/app-shell";
import AccountCard from "@/components/account-card";
import DonutChart from "@/components/charts/donut";
import Sparkline from "@/components/charts/sparkline";
import { useTheme } from "@/app/layout";
import { fetchAccounts, fetchNetWorth, fetchNetWorthHistory, fetchFxRate, fetchOwners } from "@/lib/api";
import { fmt, fmtShort, fmtPct } from "@/lib/utils";
import { ASSETS } from "@/lib/tokens";

const ASSET_OPTS = [
  { key: "all",    label: "ALL"    },
  { key: "cash",   label: "CASH"   },
  { key: "shares", label: "SHARES" },
  { key: "crypto", label: "CRYPTO" },
  { key: "super",  label: "SUPER"  },
];

function AssetFilter({ active, onChange }) {
  return (
    <div style={{ display: "flex", gap: 4, background: "var(--ink3)", borderRadius: "3px 10px 10px 3px", padding: 3 }}>
      {ASSET_OPTS.map(o => (
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

function OwnerFilter({ active, onChange, owners }) {
  const options = [
    { key: "all", label: "COMBINED" },
    ...owners.map(o => ({ key: o.key, label: o.label.toUpperCase() })),
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

function NetWorthHero({ total, history, filtered }) {
  const { theme } = useTheme();
  const prev  = history?.length > 1 ? history[history.length - 2]?.total : total;
  const change = total - (prev || total);
  const changePct = prev ? ((change / prev) * 100) : 0;
  const isUp = change >= 0;

  return (
    <div className="card card-glow fade-up" style={{
      padding: "22px 20px 18px",
      background: "linear-gradient(135deg, #FF6B6B 0%, #FF4757 55%, #C0392B 100%)",
      borderColor: "transparent",
      position: "relative",
      overflow: "hidden",
    }}>
      {/* Decorative circle — top right */}
      <div style={{
        position: "absolute",
        top: -40, right: -40,
        width: 160, height: 160,
        borderRadius: "50%",
        background: "rgba(255,255,255,0.08)",
        pointerEvents: "none",
      }} />
      {/* Decorative circle — bottom left */}
      <div style={{
        position: "absolute",
        bottom: -24, left: -24,
        width: 90, height: 90,
        borderRadius: "50%",
        background: "rgba(255,255,255,0.05)",
        pointerEvents: "none",
      }} />
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
        <div className="label" style={{ color: "rgba(255,255,255,0.55)" }}>Total Net Worth</div>
        {filtered && <div style={{ fontFamily: "var(--font-mono)", fontSize: 8, letterSpacing: "0.1em", padding: "2px 6px", borderRadius: "2px 5px 5px 2px", background: "rgba(255,210,74,0.15)", color: "var(--gold)" }}>FILTERED</div>}
      </div>
      <div style={{ fontFamily: "var(--font-display)", fontSize: 38, letterSpacing: "0.02em", color: "#FFFFFF", lineHeight: 1, marginBottom: 8 }}>
        {fmt(total)}
      </div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        {filtered ? (
          <div style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--ink2)", letterSpacing: "0.08em" }}>
            FILTERED VIEW
          </div>
        ) : (
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: isUp ? "var(--positive)" : "var(--negative)", display: "flex", alignItems: "center", gap: 4 }}>
              <span>{isUp ? "▲" : "▼"}</span>
              <span>{fmt(Math.abs(change))} this week</span>
            </div>
            <div style={{ fontFamily: "var(--font-mono)", fontSize: 10, padding: "2px 7px", borderRadius: "2px 6px 6px 2px", background: "rgba(255,255,255,0.18)", color: "rgba(255,255,255,0.9)" }}>
              {fmtPct(changePct)}
            </div>
          </div>
        )}
        {!filtered && history?.length > 1 && (
          <Sparkline data={history.map(h => ({ value: h.total || 0 }))} color="rgba(255,255,255,0.9)" height={36} width={90} />
        )}
      </div>
      <div style={{ marginTop: 14 }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
          <div className="label" style={{ color: "rgba(255,255,255,0.5)" }}>Progress to $100k</div>
          <div className="label" style={{ color: "rgba(255,255,255,0.5)" }}>{((total / 100000) * 100).toFixed(1)}%</div>
        </div>
        <div className="xp-bar-track" style={{ background: "rgba(0,0,0,0.2)" }}>
          <div className="xp-bar-fill" style={{
            "--xp-width": `${Math.min((total / 100000) * 100, 100)}%`,
            background: "rgba(255,255,255,0.9)",
            boxShadow: "none",
          }} />
        </div>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const [owner, setOwner]           = useState("all");
  const [assetFilter, setAssetFilter] = useState(() =>
    typeof window !== "undefined" ? (localStorage.getItem("dash_asset") || "all") : "all"
  );
  const [accounts, setAccounts] = useState([]);
  const [networth, setNetworth] = useState(null);
  const [history, setHistory]   = useState([]);
  const [owners, setOwners]     = useState([{ key: "H", label: "Husband" }, { key: "W", label: "Wife" }, { key: "J", label: "Joint" }]);
  const [loading, setLoading]   = useState(true);
  const { theme } = useTheme();

  const handleAssetFilter = (val) => {
    setAssetFilter(val);
    localStorage.setItem("dash_asset", val);
  };

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [accs, nw, hist, { rate: usdRate }, ownerList] = await Promise.all([
        fetchAccounts(owner),
        fetchNetWorth(owner),
        fetchNetWorthHistory(owner),
        fetchFxRate("USD", "AUD"),
        fetchOwners(),
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
      if (ownerList?.length) setOwners(ownerList);
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  }, [owner]);

  useEffect(() => { load(); }, [load]);

  const isFiltered = assetFilter !== "all";
  const filteredAccounts = isFiltered ? accounts.filter(a => a.asset === assetFilter) : accounts;
  const filteredTotal = filteredAccounts.reduce((s, a) => s + (a.balance || 0), 0);
  const assetTotals = filteredAccounts.reduce((acc, a) => {
    acc[a.asset] = (acc[a.asset] || 0) + (a.balance || 0);
    return acc;
  }, { cash: 0, shares: 0, crypto: 0, super: 0 });

  const grouped = {};
  filteredAccounts.forEach(a => { if (!grouped[a.asset]) grouped[a.asset] = []; grouped[a.asset].push(a); });
  const assetOrder  = ["cash","shares","crypto","super"];
  const assetLabels = { cash: "Cash", shares: "Shares", crypto: "Crypto", super: "Super" };

  return (
    <AppShell><main className="page" style={{ paddingTop: 16, display: "flex", flexDirection: "column", gap: 14 }}>
        <div className="fade-up" style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
          <OwnerFilter active={owner} onChange={setOwner} owners={owners} />
          <AssetFilter active={assetFilter} onChange={handleAssetFilter} />
        </div>

        {loading ? (
          <div style={{ textAlign: "center", padding: "48px 0", fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--ink2)", letterSpacing: "0.1em" }}>
            LOADING VAULT...
          </div>
        ) : (
          <>
            <NetWorthHero total={isFiltered ? filteredTotal : (networth?.total || 0)} history={history} filtered={isFiltered} />

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
      </main></AppShell>
  );
}
