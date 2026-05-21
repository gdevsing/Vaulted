import { useState, useEffect } from "react";

const STYLE = `
  @import url('https://fonts.googleapis.com/css2?family=Audiowide&family=JetBrains+Mono:wght@300;400&display=swap');

  * { box-sizing: border-box; margin: 0; padding: 0; }

  @keyframes fadeUp {
    from { opacity: 0; transform: translateY(8px); }
    to   { opacity: 1; transform: translateY(0); }
  }

  @keyframes dialTurn {
    0%   { transform: rotate(0deg); }
    60%  { transform: rotate(-105deg); }
    80%  { transform: rotate(-85deg); }
    100% { transform: rotate(-95deg); }
  }

  @keyframes ringPulse {
    0%, 100% { opacity: 0.25; }
    50%       { opacity: 0.55; }
  }

  .logo-wrap {
    display: inline-flex;
    align-items: center;
    gap: 0;
    cursor: pointer;
  }

  .logo-wrap:hover .dial-needle {
    animation: dialTurn 1.1s cubic-bezier(0.34,1.1,0.64,1) both;
  }

  .logo-wrap:hover .dial-ring {
    animation: ringPulse 1.6s ease-in-out infinite;
  }

  .fade { animation: fadeUp 0.5s ease both; }
`;

function StyleInject() {
  useEffect(() => {
    const el = document.createElement("style");
    el.textContent = STYLE;
    document.head.appendChild(el);
    return () => document.head.removeChild(el);
  }, []);
  return null;
}

// ─── The mark ─────────────────────────────────────────────────────────────────
const DialMark = ({ size = 48, fg, accent }) => {
  const cx = size / 2;
  const r  = size * 0.44;
  const pr = size * 0.04;  // pointer radius
  const needleLen = r * 0.68;

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ flexShrink: 0 }}>
      {/* Outer circle */}
      <circle cx={cx} cy={cx} r={r} fill="none" stroke={fg} strokeWidth={size * 0.025} />

      {/* Subtle inner ring */}
      <circle className="dial-ring" cx={cx} cy={cx} r={r * 0.72}
        fill="none" stroke={fg} strokeWidth={size * 0.012} strokeOpacity="0.25" />

      {/* Single tick at 12 o'clock */}
      <line
        x1={cx} y1={cx - r + size * 0.01}
        x2={cx} y2={cx - r + size * 0.09}
        stroke={fg} strokeWidth={size * 0.025} strokeLinecap="round" strokeOpacity="0.5"
      />

      {/* Needle — rotates on hover */}
      <g className="dial-needle" style={{ transformOrigin: `${cx}px ${cx}px` }}>
        <line
          x1={cx} y1={cx}
          x2={cx} y2={cx - needleLen}
          stroke={accent} strokeWidth={size * 0.032} strokeLinecap="round"
        />
      </g>

      {/* Centre dot */}
      <circle cx={cx} cy={cx} r={pr} fill={accent} />
    </svg>
  );
};

// ─── Wordmark ────────────────────────────────────────────────────────────────
const Wordmark = ({ fg, size = 20, tracking = "0.18em" }) => (
  <div style={{
    fontFamily: "'Audiowide', sans-serif",
    fontWeight: 400,
    fontSize: size,
    letterSpacing: tracking,
    color: fg,
    lineHeight: 1,
    userSelect: "none",
  }}>
    VAULTED
  </div>
);

// ─── Full logo ────────────────────────────────────────────────────────────────
const Logo = ({ fg, accent, markSize = 48, wordSize = 22, gap = 14 }) => (
  <div className="logo-wrap">
    <DialMark size={markSize} fg={fg} accent={accent} />
    <div style={{ width: gap }} />
    <Wordmark fg={fg} size={wordSize} />
  </div>
);

// ─── Showcase ────────────────────────────────────────────────────────────────
export default function App() {
  return (
    <div style={{ background: "#0A0806", minHeight: "100vh", fontFamily: "'JetBrains Mono', monospace", padding: "48px 24px 72px" }}>
      <StyleInject />

      {/* Page header */}
      <div className="fade" style={{ textAlign: "center", marginBottom: 64 }}>
        <div style={{ fontSize: 9, letterSpacing: "0.22em", color: "#2A2418", textTransform: "uppercase", marginBottom: 10 }}>
          Vaulted · Final Logo
        </div>
        <div style={{ fontFamily: "'Audiowide', sans-serif", fontSize: 26, letterSpacing: "0.1em", color: "#F0ECE8" }}>
          DIAL MARK · AUDIOWIDE
        </div>
        <div style={{ fontSize: 9, color: "#2A2418", marginTop: 8 }}>Hover the logo to animate the dial</div>
      </div>

      {/* ── DARK ── */}
      <div className="fade" style={{
        maxWidth: 680, margin: "0 auto 16px",
        background: "#0D0B09",
        border: "1px solid rgba(255,255,255,0.06)",
        borderRadius: "3px 18px 18px 3px",
        padding: "56px 48px",
        display: "flex", flexDirection: "column", gap: 48,
      }}>
        <div style={{ fontSize: 9, letterSpacing: "0.14em", color: "#2A2418", textTransform: "uppercase" }}>Dark</div>

        {/* Large */}
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <div style={{ fontSize: 8, letterSpacing: "0.12em", color: "#2A2418" }}>Large</div>
          <Logo fg="#F0ECE8" accent="#FFD24A" markSize={64} wordSize={28} gap={18} />
        </div>

        {/* Default */}
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <div style={{ fontSize: 8, letterSpacing: "0.12em", color: "#2A2418" }}>Default</div>
          <Logo fg="#F0ECE8" accent="#FFD24A" markSize={44} wordSize={20} gap={14} />
        </div>

        {/* Small */}
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <div style={{ fontSize: 8, letterSpacing: "0.12em", color: "#2A2418" }}>Small</div>
          <Logo fg="#F0ECE8" accent="#FFD24A" markSize={28} wordSize={13} gap={10} />
        </div>

        {/* Mark only */}
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <div style={{ fontSize: 8, letterSpacing: "0.12em", color: "#2A2418" }}>Mark only</div>
          <DialMark size={44} fg="#F0ECE8" accent="#FFD24A" />
        </div>
      </div>

      {/* ── LIGHT ── */}
      <div className="fade" style={{
        maxWidth: 680, margin: "0 auto 16px",
        background: "#F5F0E8",
        border: "1px solid rgba(26,22,20,0.08)",
        borderRadius: "3px 18px 18px 3px",
        padding: "56px 48px",
        display: "flex", flexDirection: "column", gap: 48,
        animationDelay: "0.1s",
      }}>
        <div style={{ fontSize: 9, letterSpacing: "0.14em", color: "#C8C0B0", textTransform: "uppercase" }}>Light</div>

        {/* Large */}
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <div style={{ fontSize: 8, letterSpacing: "0.12em", color: "#C8C0B0" }}>Large</div>
          <Logo fg="#1A1614" accent="#B87800" markSize={64} wordSize={28} gap={18} />
        </div>

        {/* Default */}
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <div style={{ fontSize: 8, letterSpacing: "0.12em", color: "#C8C0B0" }}>Default</div>
          <Logo fg="#1A1614" accent="#B87800" markSize={44} wordSize={20} gap={14} />
        </div>

        {/* Small */}
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <div style={{ fontSize: 8, letterSpacing: "0.12em", color: "#C8C0B0" }}>Small</div>
          <Logo fg="#1A1614" accent="#B87800" markSize={28} wordSize={13} gap={10} />
        </div>

        {/* Mark only */}
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <div style={{ fontSize: 8, letterSpacing: "0.12em", color: "#C8C0B0" }}>Mark only</div>
          <DialMark size={44} fg="#1A1614" accent="#B87800" />
        </div>
      </div>

      {/* ── On coloured / app bar context ── */}
      <div className="fade" style={{
        maxWidth: 680, margin: "0 auto",
        borderRadius: "3px 18px 18px 3px",
        overflow: "hidden",
        animationDelay: "0.18s",
      }}>
        {/* App bar dark */}
        <div style={{
          background: "#0D0B09",
          borderBottom: "1px solid rgba(255,255,255,0.06)",
          padding: "14px 20px",
          display: "flex", justifyContent: "space-between", alignItems: "center",
        }}>
          <Logo fg="#F0ECE8" accent="#FFD24A" markSize={28} wordSize={13} gap={10} />
          <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, color: "#3A3028", letterSpacing: "0.1em" }}>AUD</div>
        </div>

        {/* App bar light */}
        <div style={{
          background: "#F5F0E8",
          padding: "14px 20px",
          display: "flex", justifyContent: "space-between", alignItems: "center",
        }}>
          <Logo fg="#1A1614" accent="#B87800" markSize={28} wordSize={13} gap={10} />
          <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, color: "#C8C0B0", letterSpacing: "0.1em" }}>AUD</div>
        </div>

        <div style={{ fontSize: 8, letterSpacing: "0.12em", color: "#2A2418", padding: "10px 20px", textAlign: "center" }}>
          IN APP CONTEXT
        </div>
      </div>

      <div style={{ textAlign: "center", marginTop: 52, fontSize: 9, color: "#1A1610", letterSpacing: "0.14em" }}>
        VAULTED · MARK + AUDIOWIDE · 2026
      </div>
    </div>
  );
}
