import { useState, useEffect } from "react";

const STYLE = `
  @import url('https://fonts.googleapis.com/css2?family=Rajdhani:wght@600;700&family=Oxanium:wght@600;700&family=Orbitron:wght@600;700&family=Exo+2:wght@600;700&family=Michroma&family=Audiowide&display=swap');

  * { box-sizing: border-box; margin: 0; padding: 0; }

  @keyframes fadeUp {
    from { opacity: 0; transform: translateY(8px); }
    to   { opacity: 1; transform: translateY(0); }
  }

  @keyframes dialTurn {
    0%   { transform: rotate(0deg); }
    60%  { transform: rotate(-105deg); }
    80%  { transform: rotate(-88deg); }
    100% { transform: rotate(-95deg); }
  }

  @keyframes ringBreath {
    0%, 100% { opacity: 0.2; }
    50%       { opacity: 0.5; }
  }

  .logo-wrap { display: inline-flex; align-items: center; cursor: pointer; }
  .logo-wrap:hover .needle { animation: dialTurn 1s cubic-bezier(0.34,1.1,0.64,1) both; }
  .logo-wrap:hover .inner-ring { animation: ringBreath 1.6s ease-in-out infinite; }

  .card {
    background: linear-gradient(145deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.015) 100%);
    border: 1px solid rgba(255,255,255,0.07);
    border-radius: 3px 16px 16px 3px;
    padding: 32px 24px 24px;
    cursor: pointer;
    transition: border-color 0.2s, box-shadow 0.2s, transform 0.18s;
    animation: fadeUp 0.45s ease both;
  }

  .card:hover { transform: translateY(-3px); box-shadow: 0 20px 48px rgba(0,0,0,0.6); }
  .card.sel   { border-color: rgba(255,210,74,0.45); box-shadow: 0 0 0 1px rgba(255,210,74,0.1), 0 20px 48px rgba(0,0,0,0.6); }

  .badge {
    font-family: 'JetBrains Mono', monospace;
    font-size: 9px; letter-spacing: 0.12em;
    color: #FFD24A;
    background: rgba(255,210,74,0.08);
    border: 1px solid rgba(255,210,74,0.28);
    border-radius: 1px 6px 6px 1px;
    padding: 2px 9px;
    display: inline-block;
    margin-top: 12px;
  }
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

// ─── Dial mark ────────────────────────────────────────────────────────────────
const Dial = ({ size = 44, fg, accent }) => {
  const c = size / 2, r = size * 0.44;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ flexShrink: 0 }}>
      <circle cx={c} cy={c} r={r} fill="none" stroke={fg} strokeWidth={size * 0.026} />
      <circle className="inner-ring" cx={c} cy={c} r={r * 0.7}
        fill="none" stroke={fg} strokeWidth={size * 0.013} strokeOpacity="0.22" />
      {/* 12 o'clock tick */}
      <line x1={c} y1={c - r + size * 0.01} x2={c} y2={c - r + size * 0.1}
        stroke={fg} strokeWidth={size * 0.026} strokeLinecap="round" strokeOpacity="0.45" />
      {/* Needle */}
      <g className="needle" style={{ transformOrigin: `${c}px ${c}px` }}>
        <line x1={c} y1={c} x2={c} y2={c - r * 0.68}
          stroke={accent} strokeWidth={size * 0.034} strokeLinecap="round" />
      </g>
      <circle cx={c} cy={c} r={size * 0.042} fill={accent} />
    </svg>
  );
};

// ─── Font options ─────────────────────────────────────────────────────────────
const FONTS = [
  {
    id: "A",
    family: "'Rajdhani', sans-serif",
    weight: 700,
    size: 24,
    tracking: "0.22em",
    name: "Rajdhani",
    desc: "Sharp angled cuts on letters. Military precision. Each character feels engineered.",
  },
  {
    id: "B",
    family: "'Oxanium', sans-serif",
    weight: 700,
    size: 22,
    tracking: "0.2em",
    name: "Oxanium",
    desc: "Geometric with subtle diagonal terminals. Clean and technical without feeling sci-fi.",
  },
  {
    id: "C",
    family: "'Orbitron', sans-serif",
    weight: 700,
    size: 18,
    tracking: "0.18em",
    name: "Orbitron",
    desc: "Pure geometric — every letter reduced to rectangles and circles. Maximum precision.",
  },
  {
    id: "D",
    family: "'Exo 2', sans-serif",
    weight: 700,
    size: 22,
    tracking: "0.2em",
    name: "Exo 2",
    desc: "Humanist geometry. Precise but warmer — won't feel cold. Most versatile of the six.",
  },
  {
    id: "E",
    family: "'Michroma', sans-serif",
    weight: 400,
    size: 19,
    tracking: "0.22em",
    name: "Michroma",
    desc: "Flat-cut terminals, zero curves on capitals. Like stencilled text on a vault door.",
  },
  {
    id: "F",
    family: "'Audiowide', sans-serif",
    weight: 400,
    size: 20,
    tracking: "0.18em",
    name: "Audiowide",
    desc: "Rounded geometric — circles and squares only. Softer precision. More approachable.",
  },
];

// ─── Single logo card ─────────────────────────────────────────────────────────
const LogoCard = ({ font, selected, onSelect, delay }) => (
  <div
    className={`card ${selected ? "sel" : ""}`}
    style={{ animationDelay: `${delay}s` }}
    onClick={onSelect}
  >
    <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 8, letterSpacing: "0.14em", color: "rgba(255,210,74,0.4)", marginBottom: 24, textTransform: "uppercase" }}>
      {font.id} · {font.name}
    </div>

    {/* Dark version */}
    <div style={{ marginBottom: 20 }}>
      <div style={{ fontSize: 8, fontFamily: "'JetBrains Mono', monospace", letterSpacing: "0.1em", color: "#2A2418", marginBottom: 12 }}>DARK</div>
      <div className="logo-wrap" style={{ gap: 14 }}>
        <Dial size={44} fg="#F0ECE8" accent="#FFD24A" />
        <span style={{
          fontFamily: font.family,
          fontWeight: font.weight,
          fontSize: font.size,
          letterSpacing: font.tracking,
          color: "#F0ECE8",
          lineHeight: 1,
        }}>VAULTED</span>
      </div>
    </div>

    {/* Light version */}
    <div style={{
      background: "#F5F0E8",
      borderRadius: "2px 10px 10px 2px",
      padding: "16px 14px",
    }}>
      <div style={{ fontSize: 8, fontFamily: "'JetBrains Mono', monospace", letterSpacing: "0.1em", color: "#C8C0B0", marginBottom: 12 }}>LIGHT</div>
      <div className="logo-wrap" style={{ gap: 14 }}>
        <Dial size={44} fg="#1A1614" accent="#B87800" />
        <span style={{
          fontFamily: font.family,
          fontWeight: font.weight,
          fontSize: font.size,
          letterSpacing: font.tracking,
          color: "#1A1614",
          lineHeight: 1,
        }}>VAULTED</span>
      </div>
    </div>

    <div style={{ marginTop: 16 }}>
      <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, color: "#C0B0A0", letterSpacing: "0.08em", marginBottom: 4 }}>{font.name}</div>
      <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, color: "#3A3028", lineHeight: 1.65 }}>{font.desc}</div>
    </div>

    {selected && <div className="badge">✓ SELECTED</div>}
  </div>
);

// ─── App ──────────────────────────────────────────────────────────────────────
export default function App() {
  const [selected, setSelected] = useState(null);
  const sel = FONTS.find(f => f.id === selected);

  return (
    <div style={{ background: "#090706", minHeight: "100vh", padding: "40px 16px 60px", fontFamily: "'JetBrains Mono', monospace" }}>
      <StyleInject />

      {/* Header */}
      <div style={{ textAlign: "center", marginBottom: 48, animation: "fadeUp 0.4s ease both" }}>
        <div style={{ fontSize: 9, letterSpacing: "0.22em", color: "#2A2018", textTransform: "uppercase", marginBottom: 10 }}>
          Vaulted · Wordmark · Geometric Fonts
        </div>
        <div style={{ fontFamily: "'Michroma', sans-serif", fontSize: 28, letterSpacing: "0.16em", color: "#F0ECE8" }}>
          6 TYPEFACES
        </div>
        <div style={{ fontSize: 9, color: "#2A2018", marginTop: 8 }}>
          Hover to spin the dial · Click to select
        </div>
      </div>

      {/* Grid */}
      <div style={{ maxWidth: 860, margin: "0 auto", display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: 12 }}>
        {FONTS.map((f, i) => (
          <LogoCard
            key={f.id}
            font={f}
            selected={selected === f.id}
            onSelect={() => setSelected(selected === f.id ? null : f.id)}
            delay={i * 0.06}
          />
        ))}
      </div>

      {/* Selected preview */}
      {sel && (
        <div style={{
          maxWidth: 860, margin: "28px auto 0",
          background: "rgba(255,210,74,0.04)",
          border: "1px solid rgba(255,210,74,0.18)",
          borderRadius: "3px 16px 16px 3px",
          padding: "32px 36px",
          display: "flex", alignItems: "center", gap: 40, flexWrap: "wrap",
          animation: "fadeUp 0.3s ease both",
        }}>
          {/* Large dark */}
          <div className="logo-wrap" style={{ gap: 18 }}>
            <Dial size={64} fg="#F0ECE8" accent="#FFD24A" />
            <span style={{
              fontFamily: sel.family, fontWeight: sel.weight,
              fontSize: sel.size * 1.35, letterSpacing: sel.tracking,
              color: "#F0ECE8", lineHeight: 1,
            }}>VAULTED</span>
          </div>
          <div>
            <div style={{ fontSize: 9, color: "rgba(255,210,74,0.5)", letterSpacing: "0.14em", marginBottom: 8 }}>SELECTED · {sel.name}</div>
            <div style={{ fontSize: 10, color: "#4A4038", lineHeight: 1.7 }}>{sel.desc}</div>
          </div>
        </div>
      )}

      <div style={{ textAlign: "center", marginTop: 48, fontSize: 9, color: "#1A1610", letterSpacing: "0.14em" }}>
        VAULTED · GEOMETRIC TYPEFACE EXPLORATION · 2026
      </div>
    </div>
  );
}
