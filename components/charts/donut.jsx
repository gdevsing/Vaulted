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

  // SVG donut
  const cx = 60, cy = 60, r = 46, inner = 30;
  const circumference = 2 * Math.PI * r;
  let offset = 0;
  const gap = 1.5; // degrees between segments

  const segments = items.map(item => {
    const pct = item.value / total;
    const degrees = pct * 360 - gap;
    const len = (degrees / 360) * circumference;
    const space = (gap / 360) * circumference;
    const seg = { ...item, pct, dashArray: `${len} ${circumference - len}`, dashOffset: -offset * circumference / 360 };
    offset += pct * 360;
    return seg;
  });

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
      {/* Donut */}
      <div style={{ position: "relative", flexShrink: 0 }}>
        <svg width={120} height={120} viewBox="0 0 120 120">
          {segments.map(seg => (
            <circle
              key={seg.key}
              cx={cx} cy={cy} r={r}
              fill="none"
              stroke={seg.color}
              strokeWidth={r - inner}
              strokeDasharray={seg.dashArray}
              strokeDashoffset={seg.dashOffset}
              style={{ transition: "all 0.6s cubic-bezier(0.16,1,0.3,1)" }}
            />
          ))}
          {/* Centre */}
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
