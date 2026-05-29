"use client";

import { useTheme } from "@/app/layout";
import { ASSETS } from "@/lib/tokens";
import { fmt, assetLabel } from "@/lib/utils";

export default function DonutChart({ totals }) {
  const { theme } = useTheme();

  const items = Object.entries(totals).map(([key, value]) => ({
    key,
    value,
    color: ASSETS[key]?.[theme] || "#888",
    label: assetLabel(key),
  }));

  const total = items.reduce((s, i) => s + i.value, 0);

  // SVG donut — proper segment positioning
  // Each segment is a circle with strokeDasharray to show just its arc,
  // rotated by its cumulative start angle via transform="rotate()"
  const cx = 60, cy = 60, r = 46, inner = 30;
  const strokeWidth = r - inner;
  const circumference = 2 * Math.PI * r;
  const gap = 2; // gap in degrees between segments

  let cumulativeDeg = -90; // start at 12 o'clock

  const segments = items.map(item => {
    const pct = total > 0 ? item.value / total : 0;
    const degrees = pct * 360;
    const arcDeg = Math.max(0, degrees - gap);
    const arcLen = (arcDeg / 360) * circumference;
    const startDeg = cumulativeDeg;
    cumulativeDeg += degrees;
    return {
      ...item,
      pct,
      startDeg,
      arcLen,
    };
  });

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
      {/* Donut */}
      <div style={{ position: "relative", flexShrink: 0 }}>
        <svg width={120} height={120} viewBox="0 0 120 120">
          {/* Background ring */}
          <circle
            cx={cx} cy={cy} r={r}
            fill="none"
            stroke="rgba(255,255,255,0.05)"
            strokeWidth={strokeWidth}
          />
          {segments.map(seg => (
            seg.arcLen > 0 && (
              <circle
                key={seg.key}
                cx={cx} cy={cy} r={r}
                fill="none"
                stroke={seg.color}
                strokeWidth={strokeWidth}
                strokeDasharray={`${seg.arcLen} ${circumference}`}
                strokeDashoffset={0}
                transform={`rotate(${seg.startDeg} ${cx} ${cy})`}
                style={{ transition: "all 0.6s cubic-bezier(0.16,1,0.3,1)" }}
              />
            )
          ))}
          {/* Centre fill */}
          <circle cx={cx} cy={cy} r={inner} fill="#0F0F0F" />
        </svg>
        {/* Centre text */}
        <div style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
        }}>
          <div style={{ fontFamily: "var(--font-mono)", fontSize: 8, color: "var(--ink2)", letterSpacing: "0.1em", textTransform: "uppercase" }}>TOTAL</div>
          <div style={{ fontFamily: "var(--font-display)", fontSize: 11, color: "var(--gold)", marginTop: 1 }}>
            {(total / 1000).toFixed(1)}k
          </div>
        </div>
      </div>

      {/* Legend */}
      <div style={{ display: "flex", flexDirection: "column", gap: 8, flex: 1 }}>
        {segments.map(seg => (
          <div key={seg.key} style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ width: 3, height: 28, borderRadius: 2, background: seg.color, flexShrink: 0 }} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontFamily: "var(--font-mono)", fontSize: 10, letterSpacing: "0.08em", color: "var(--ink)", textTransform: "uppercase" }}>
                  {seg.label}
                </span>
                <span style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: seg.color }}>
                  {(seg.pct * 100).toFixed(0)}%
                </span>
              </div>
              <div style={{ fontFamily: "var(--font-mono)", fontSize: 9, color: "var(--ink2)", marginTop: 1 }}>
                {fmt(seg.value)}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
