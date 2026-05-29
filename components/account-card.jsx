"use client";

import { useTheme } from "@/app/layout";
import { ASSETS } from "@/lib/tokens";
import { fmt, daysAgo } from "@/lib/utils";

export default function AccountCard({ account, delay = 0 }) {
  const { theme } = useTheme();
  const color = ASSETS[account.asset]?.[theme] || "var(--ink2)";

  return (
    <div
      className="card lift fade-up"
      style={{
        animationDelay: `${delay}s`,
        borderLeft: `3px solid ${color}`,
        padding: "14px 16px",
        display: "flex",
        alignItems: "center",
        gap: 12,
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Overdue glow */}
      {account.overdue && (
        <div style={{
          position: "absolute",
          top: 0, right: 0,
          width: 6, height: 6,
          borderRadius: "50%",
          background: "var(--negative)",
          margin: 8,
          boxShadow: "0 0 8px var(--negative)",
        }} />
      )}

      {/* Left: info */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 3 }}>
          <div style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: "var(--ink)", fontWeight: 400 }}>
            {account.name}
          </div>
          <div style={{
            fontFamily: "var(--font-mono)",
            fontSize: 8,
            letterSpacing: "0.08em",
            padding: "1px 5px",
            borderRadius: "2px 6px 6px 2px",
            background: `${color}18`,
            color,
            border: `1px solid ${color}35`,
            textTransform: "uppercase",
          }}>
            {account.ownerLabel || account.owner}
          </div>
          {account.group && (
            <div style={{
              fontFamily: "var(--font-mono)",
              fontSize: 8,
              color: "var(--ink2)",
              letterSpacing: "0.06em",
            }}>
              {account.group}
            </div>
          )}
        </div>
        <div style={{ fontFamily: "var(--font-mono)", fontSize: 9, color: "var(--ink2)", letterSpacing: "0.06em" }}>
          {account.institution} · {daysAgo(account.updated)}
          {account.overdue && <span style={{ color: "var(--negative)", marginLeft: 6 }}>OVERDUE</span>}
        </div>
        {account.currency !== "AUD" && account.native_balance != null && (
          <div style={{ fontFamily: "var(--font-mono)", fontSize: 9, color: "var(--ink)", marginTop: 2 }}>
            {account.currency} {fmt(account.native_balance)}
            {account.liveRate && (
              <span style={{ marginLeft: 5, fontSize: 8, color: "var(--ink2)" }}>
                @ {account.liveRate.toFixed(4)}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Right: balance */}
      <div style={{ textAlign: "right", flexShrink: 0 }}>
        <div style={{
          fontFamily: "var(--font-display)",
          fontSize: 15,
          color: "var(--ink)",
          letterSpacing: "0.02em",
          lineHeight: 1,
        }}>
          {fmt(account.balance)}
        </div>
        <div style={{
          fontFamily: "var(--font-mono)",
          fontSize: 8,
          color,
          letterSpacing: "0.1em",
          textTransform: "uppercase",
          marginTop: 3,
        }}>
          AUD
        </div>
      </div>
    </div>
  );
}
