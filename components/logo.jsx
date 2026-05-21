"use client";

import { useTheme } from "@/app/layout";

export default function Logo({ size = "default", showWordmark = true, className = "" }) {
  const { theme } = useTheme();

  const sizes = {
    sm:      { mark: 26, word: 12, gap: 9  },
    default: { mark: 40, word: 18, gap: 12 },
    lg:      { mark: 56, word: 24, gap: 16 },
  };

  const s     = sizes[size] || sizes.default;
  const fg    = theme === "dark" ? "#F0ECE8" : "#1A1614";
  const accent= theme === "dark" ? "#FFD24A" : "#B87800";
  const c     = s.mark / 2;
  const r     = s.mark * 0.44;

  return (
    <div style={{ display: "inline-flex", alignItems: "center", gap: s.gap }} className={className}>
      {/* Dial mark */}
      <svg width={s.mark} height={s.mark} viewBox={`0 0 ${s.mark} ${s.mark}`} style={{ flexShrink: 0 }}>
        {/* Outer circle */}
        <circle cx={c} cy={c} r={r} fill="none" stroke={fg} strokeWidth={s.mark * 0.026} />
        {/* Inner ring */}
        <circle cx={c} cy={c} r={r * 0.7}
          fill="none" stroke={fg} strokeWidth={s.mark * 0.013} strokeOpacity="0.22" />
        {/* 12 o'clock tick */}
        <line
          x1={c} y1={c - r + s.mark * 0.01}
          x2={c} y2={c - r + s.mark * 0.1}
          stroke={fg} strokeWidth={s.mark * 0.026} strokeLinecap="round" strokeOpacity="0.45"
        />
        {/* Needle */}
        <line
          x1={c} y1={c}
          x2={c} y2={c - r * 0.68}
          stroke={accent} strokeWidth={s.mark * 0.034} strokeLinecap="round"
        />
        {/* Centre dot */}
        <circle cx={c} cy={c} r={s.mark * 0.042} fill={accent} />
      </svg>

      {/* Wordmark */}
      {showWordmark && (
        <span style={{
          fontFamily: "'Audiowide', sans-serif",
          fontSize: s.word,
          letterSpacing: "0.18em",
          color: fg,
          lineHeight: 1,
          userSelect: "none",
        }}>
          VAULTED
        </span>
      )}
    </div>
  );
}
