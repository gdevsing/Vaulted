import { useState } from "react";

const STYLE = `
  @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Cormorant+Garamond:ital,wght@0,300;0,400;0,600;1,300;1,400&family=DM+Serif+Display:ital@0;1&family=Syne:wght@700;800&family=JetBrains+Mono:wght@300;400;700&family=Playfair+Display:ital,wght@0,400;0,700;1,400&display=swap');

  * { box-sizing: border-box; margin: 0; padding: 0; }

  body { background: #0D0B0A; }

  @keyframes fadeIn {
    from { opacity: 0; transform: translateY(10px); }
    to   { opacity: 1; transform: translateY(0); }
  }

  @keyframes rotateVault {
    0%   { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }

  @keyframes pulseGold {
    0%, 100% { opacity: 0.6; }
    50%       { opacity: 1; }
  }

  @keyframes shimmer {
    0%   { stroke-dashoffset: 200; }
    100% { stroke-dashoffset: 0; }
  }

  @keyframes dialSpin {
    0%   { transform: rotate(0deg); }
    100% { transform: rotate(-30deg); }
  }

  .logo-card {
    background: linear-gradient(145deg, rgba(255,255,255,0.055) 0%, rgba(255,255,255,0.02) 100%);
    border: 1px solid rgba(255,255,255,0.08);
    border-radius: 3px 18px 18px 3px;
    padding: 32px 28px;
    cursor: pointer;
    transition: transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease;
    animation: fadeIn 0.5s ease both;
  }

  .logo-card:hover {
    transform: translateY(-3px);
    box-shadow: 0 20px 48px rgba(0,0,0,0.6);
    border-color: rgba(255,255,255,0.14);
  }

  .logo-card.selected {
    border-color: rgba(255,210,74,0.5);
    box-shadow: 0 0 0 1px rgba(255,210,74,0.15), 0 20px 48px rgba(0,0,0,0.6);
  }

  .tag {
    font-family: 'JetBrains Mono', monospace;
    font-size: 9px;
    letter-spacing: 0.14em;
    text-transform: uppercase;
    color: #6A6058;
    margin-bottom: 6px;
  }

  .concept-name {
    font-family: 'JetBrains Mono', monospace;
    font-size: 11px;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    color: #C0B8B0;
    margin-top: 18px;
    margin-bottom: 4px;
  }

  .concept-desc {
    font-family: 'JetBrains Mono', monospace;
    font-size: 10px;
    color: #5A5248;
    line-height: 1.6;
  }

  .selected-badge {
    font-family: 'JetBrains Mono', monospace;
    font-size: 9px;
    letter-spacing: 0.12em;
    color: #FFD24A;
    background: rgba(255,210,74,0.1);
    border: 1px solid rgba(255,210,74,0.3);
    border-radius: 1px 8px 8px 1px;
    padding: 2px 8px;
    display: inline-block;
    margin-top: 8px;
  }
`;

function StyleInject() {
  const { useEffect } = require("react");
  useEffect(() => {
    const el = document.createElement("style");
    el.textContent = STYLE;
    document.head.appendChild(el);
    return () => document.head.removeChild(el);
  }, []);
  return null;
}

// ─── LOGO A: Mechanical Vault Door ───────────────────────────────────────────
// Concept: A stylised vault door rendered as pure geometry — concentric rings,
// bolt handles at cardinal points, and the word VAULTED in Bebas Neue below.
// Feeling: Industrial luxury. Like a Swiss watch meets a bank strongroom.
const LogoA = ({ animate }) => (
  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 16 }}>
    <svg width="120" height="120" viewBox="0 0 120 120">
      <defs>
        <radialGradient id="vaultGrad" cx="50%" cy="40%" r="60%">
          <stop offset="0%" stopColor="#FFD24A" stopOpacity="0.15" />
          <stop offset="100%" stopColor="#FFD24A" stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* Outer ring */}
      <circle cx="60" cy="60" r="54" fill="none" stroke="#3A3028" strokeWidth="2" />
      <circle cx="60" cy="60" r="54" fill="none" stroke="#FFD24A" strokeWidth="0.5" strokeOpacity="0.4" />

      {/* Bolt handles at N/E/S/W */}
      {[0, 90, 180, 270].map(angle => {
        const rad = (angle * Math.PI) / 180;
        const x = 60 + 54 * Math.sin(rad);
        const y = 60 - 54 * Math.cos(rad);
        return (
          <g key={angle}>
            <circle cx={x} cy={y} r="5" fill="#1A1614" stroke="#FFD24A" strokeWidth="1" strokeOpacity="0.7" />
            <circle cx={x} cy={y} r="2.5" fill="#FFD24A" fillOpacity="0.6" />
          </g>
        );
      })}

      {/* Middle ring */}
      <circle cx="60" cy="60" r="38" fill="none" stroke="#2A2420" strokeWidth="1.5" />

      {/* Dial — rotates on hover */}
      <g style={{ transformOrigin: "60px 60px", transform: animate ? "rotate(-30deg)" : "rotate(0deg)", transition: "transform 1.2s cubic-bezier(0.16,1,0.3,1)" }}>
        <circle cx="60" cy="60" r="28" fill="#120F0D" stroke="#3A3028" strokeWidth="1" />
        {/* Dial notches */}
        {Array.from({ length: 12 }).map((_, i) => {
          const a = (i * 30 * Math.PI) / 180;
          const x1 = 60 + 22 * Math.sin(a); const y1 = 60 - 22 * Math.cos(a);
          const x2 = 60 + 27 * Math.sin(a); const y2 = 60 - 27 * Math.cos(a);
          return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke="#FFD24A" strokeWidth={i % 3 === 0 ? "1.5" : "0.5"} strokeOpacity={i % 3 === 0 ? "0.8" : "0.3"} />;
        })}
        {/* Centre handle */}
        <circle cx="60" cy="60" r="6" fill="#1A1614" stroke="#FFD24A" strokeWidth="1" strokeOpacity="0.8" />
        <circle cx="60" cy="60" r="2.5" fill="#FFD24A" fillOpacity="0.9" />
        {/* Pointer */}
        <line x1="60" y1="60" x2="60" y2="38" stroke="#FFD24A" strokeWidth="1.5" strokeLinecap="round" strokeOpacity="0.9" />
      </g>

      {/* Inner glow */}
      <circle cx="60" cy="60" r="38" fill="url(#vaultGrad)" />
    </svg>

    {/* Wordmark */}
    <div style={{ textAlign: "center" }}>
      <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 28, letterSpacing: "0.22em", color: "#F0ECE8", lineHeight: 1 }}>
        VAULTED
      </div>
      <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 8, letterSpacing: "0.2em", color: "#6A6058", marginTop: 4 }}>
        PERSONAL FINANCE
      </div>
    </div>
  </div>
);

// ─── LOGO B: Serif Monogram + Rule ───────────────────────────────────────────
// Concept: Editorial luxury. A large "V" in Cormorant Garamond italic, flanked
// by fine ruled lines, with VAULTED set in tight spaced caps below.
// Feeling: A private bank. Old money. Quiet confidence.
const LogoB = ({ animate }) => (
  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 0 }}>
    {/* Monogram */}
    <div style={{ position: "relative", width: 100, height: 100, display: "flex", alignItems: "center", justifyContent: "center" }}>
      {/* Diamond frame */}
      <svg width="100" height="100" viewBox="0 0 100 100" style={{ position: "absolute" }}>
        <rect x="50" y="8" width="60" height="60" rx="2" fill="none" stroke="#FFD24A" strokeWidth="0.75" strokeOpacity="0.4"
          transform="rotate(45 50 50)" />
        <rect x="50" y="14" width="50" height="50" rx="1" fill="none" stroke="#FFD24A" strokeWidth="0.3" strokeOpacity="0.2"
          transform="rotate(45 50 50)" />
      </svg>
      <span style={{
        fontFamily: "'Cormorant Garamond', serif",
        fontSize: 64,
        fontWeight: 300,
        fontStyle: "italic",
        color: "#F0ECE8",
        lineHeight: 1,
        position: "relative",
        zIndex: 1,
        textShadow: "0 0 30px rgba(255,210,74,0.2)",
      }}>V</span>
    </div>

    {/* Rule + wordmark */}
    <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 8 }}>
      <div style={{ width: 24, height: 1, background: "linear-gradient(90deg, transparent, #FFD24A)" }} />
      <div style={{
        fontFamily: "'Cormorant Garamond', serif",
        fontSize: 15,
        fontWeight: 400,
        letterSpacing: "0.35em",
        color: "#F0ECE8",
        textTransform: "uppercase",
      }}>Vaulted</div>
      <div style={{ width: 24, height: 1, background: "linear-gradient(90deg, #FFD24A, transparent)" }} />
    </div>
    <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 8, letterSpacing: "0.22em", color: "#5A5248", marginTop: 6 }}>
      PERSONAL FINANCE OS
    </div>
  </div>
);

// ─── LOGO C: Geometric V Shield ──────────────────────────────────────────────
// Concept: A bold shield shape containing a geometric V formed from two
// angled bars. Modern, protective, trustworthy. App-icon ready.
// Feeling: Fintech confidence. Premium mobile app. Bold at small sizes.
const LogoC = ({ animate }) => (
  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 16 }}>
    <svg width="90" height="104" viewBox="0 0 90 104">
      <defs>
        <linearGradient id="shieldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#2A2018" />
          <stop offset="100%" stopColor="#150F0A" />
        </linearGradient>
        <linearGradient id="vGrad" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#FFD24A" />
          <stop offset="100%" stopColor="#C8920A" />
        </linearGradient>
      </defs>

      {/* Shield outline — gold hairline */}
      <path d="M45 2 L88 18 L88 52 C88 78 68 96 45 102 C22 96 2 78 2 52 L2 18 Z"
        fill="url(#shieldGrad)" stroke="#FFD24A" strokeWidth="1" strokeOpacity="0.5" />

      {/* Inner shield highlight */}
      <path d="M45 10 L80 23 L80 52 C80 73 63 89 45 94 C27 89 10 73 10 52 L10 23 Z"
        fill="none" stroke="#FFD24A" strokeWidth="0.4" strokeOpacity="0.2" />

      {/* Geometric V — two angular bars */}
      <path d="M22 30 L38 70 L45 56 L52 70 L68 30 L60 30 L45 60 L30 30 Z"
        fill="url(#vGrad)" />

      {/* Top cap line */}
      <line x1="20" y1="24" x2="70" y2="24" stroke="#FFD24A" strokeWidth="0.5" strokeOpacity="0.3" />
    </svg>

    <div style={{ textAlign: "center" }}>
      <div style={{ fontFamily: "'Syne', sans-serif", fontSize: 22, fontWeight: 800, letterSpacing: "0.18em", color: "#F0ECE8" }}>
        VAULTED
      </div>
      <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 8, letterSpacing: "0.18em", color: "#6A6058", marginTop: 3 }}>
        YOUR WEALTH · LOCKED IN
      </div>
    </div>
  </div>
);

// ─── LOGO D: Wordmark Only — Typographic ────────────────────────────────────
// Concept: Pure typographic. "VAULT" in heavy Syne, "ED" in Cormorant italic —
// two weights/styles colliding mid-word. A single gold underbar anchors it.
// Feeling: Editorial finance. A magazine masthead. Sophisticated and modern.
const LogoD = ({ animate }) => (
  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}>

    {/* Icon mark — minimal V with overbar */}
    <svg width="44" height="36" viewBox="0 0 44 36">
      <line x1="4" y1="4" x2="40" y2="4" stroke="#FFD24A" strokeWidth="1.5" strokeOpacity="0.8" />
      <path d="M6 10 L22 32 L38 10" fill="none" stroke="#F0ECE8" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M6 10 L22 32 L38 10" fill="none" stroke="#FFD24A" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" strokeOpacity="0.5" />
    </svg>

    {/* Split wordmark */}
    <div style={{ display: "flex", alignItems: "baseline", gap: 0 }}>
      <span style={{
        fontFamily: "'Syne', sans-serif",
        fontWeight: 800,
        fontSize: 36,
        letterSpacing: "-0.01em",
        color: "#F0ECE8",
        lineHeight: 1,
      }}>VAULT</span>
      <span style={{
        fontFamily: "'Cormorant Garamond', serif",
        fontWeight: 300,
        fontStyle: "italic",
        fontSize: 42,
        color: "#FFD24A",
        lineHeight: 0.9,
        marginLeft: 2,
      }}>ed</span>
    </div>

    {/* Gold underbar */}
    <div style={{ width: "100%", display: "flex", alignItems: "center", gap: 8 }}>
      <div style={{ flex: 1, height: 1, background: "rgba(255,210,74,0.2)" }} />
      <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 8, letterSpacing: "0.2em", color: "#6A6058" }}>
        PERSONAL FINANCE
      </div>
      <div style={{ flex: 1, height: 1, background: "rgba(255,210,74,0.2)" }} />
    </div>
  </div>
);

// ─── LOGO E: Abstract Isometric V ────────────────────────────────────────────
// Concept: An isometric 3D "V" built from two flat parallelogram faces,
// like an open vault door viewed from above. Bold and geometric.
// Feeling: Modern, spatial, memorable as an app icon. Unique silhouette.
const LogoE = ({ animate }) => (
  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 16 }}>
    <svg width="110" height="100" viewBox="0 0 110 100">
      <defs>
        <linearGradient id="isoTop" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FFD24A" />
          <stop offset="100%" stopColor="#E8B830" />
        </linearGradient>
        <linearGradient id="isoLeft" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#C8920A" />
          <stop offset="100%" stopColor="#A07008" />
        </linearGradient>
        <linearGradient id="isoRight" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#1A1614" />
          <stop offset="100%" stopColor="#2A2018" />
        </linearGradient>
      </defs>

      {/* Left arm of V — isometric block */}
      {/* Top face */}
      <polygon points="8,42 28,20 54,34 34,56" fill="url(#isoTop)" />
      {/* Left face */}
      <polygon points="8,42 28,20 28,36 8,58" fill="url(#isoLeft)" />
      {/* Right face */}
      <polygon points="34,56 54,34 54,50 34,72" fill="url(#isoRight)" />

      {/* Right arm of V — isometric block */}
      {/* Top face */}
      <polygon points="56,34 82,20 102,42 76,56" fill="url(#isoTop)" />
      {/* Left face */}
      <polygon points="56,34 82,20 82,36 56,50" fill="url(#isoLeft)" />
      {/* Right face */}
      <polygon points="76,56 102,42 102,58 76,72" fill="url(#isoRight)" />

      {/* Bottom point of V */}
      {/* Top face */}
      <polygon points="34,56 54,34 56,34 76,56 55,76" fill="url(#isoTop)" opacity="0.9" />
      {/* Face */}
      <polygon points="55,76 34,72 34,56 55,76" fill="url(#isoLeft)" opacity="0.7" />
      <polygon points="55,76 76,72 76,56 55,76" fill="url(#isoRight)" opacity="0.9" />

      {/* Thin gold edge lines for crispness */}
      <polygon points="8,42 28,20 54,34 34,56" fill="none" stroke="#FFE880" strokeWidth="0.4" strokeOpacity="0.6" />
      <polygon points="56,34 82,20 102,42 76,56" fill="none" stroke="#FFE880" strokeWidth="0.4" strokeOpacity="0.6" />
    </svg>

    <div style={{ textAlign: "center" }}>
      <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 26, letterSpacing: "0.26em", color: "#F0ECE8" }}>
        VAULTED
      </div>
      <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 8, letterSpacing: "0.18em", color: "#6A6058", marginTop: 3 }}>
        YOUR WEALTH · LOCKED IN
      </div>
    </div>
  </div>
);

// ─── CONCEPTS meta ───────────────────────────────────────────────────────────
const CONCEPTS = [
  {
    id: "A", Component: LogoA,
    name: "Mechanical Vault",
    desc: "Swiss watchmaker meets bank strongroom. Rotating dial, bolt handles, concentric rings. Detailed and tactile — rewards close inspection.",
    vibe: "Industrial luxury",
  },
  {
    id: "B", Component: LogoB,
    name: "Serif Monogram",
    desc: "Old money editorial. Italic Cormorant 'V' in a diamond frame, flanked by gold rules. Quiet, authoritative, timeless.",
    vibe: "Private banking",
  },
  {
    id: "C", Component: LogoC,
    name: "Shield Mark",
    desc: "Bold geometric V inside a shield. App-icon ready at any size. Communicates security and protection without being obvious about it.",
    vibe: "Fintech confidence",
  },
  {
    id: "D", Component: LogoD,
    name: "Split Wordmark",
    desc: "VAULT in heavy Syne, ed in Cormorant italic — two typefaces colliding mid-word. A magazine masthead for your finances.",
    vibe: "Editorial modern",
  },
  {
    id: "E", Component: LogoE,
    name: "Isometric V",
    desc: "A 3D V built from flat isometric faces, like an open vault viewed from above. Spatial, geometric, impossible to mistake.",
    vibe: "Bold & spatial",
  },
];

// ─── App ─────────────────────────────────────────────────────────────────────
export default function App() {
  const [selected, setSelected] = useState(null);
  const [hovered, setHovered] = useState(null);

  return (
    <div style={{ background: "#0D0B0A", minHeight: "100vh", fontFamily: "'JetBrains Mono', monospace", padding: "40px 20px 60px" }}>
      <StyleInject />

      {/* Header */}
      <div style={{ textAlign: "center", marginBottom: 48 }}>
        <div style={{ fontSize: 9, letterSpacing: "0.2em", color: "#5A5248", marginBottom: 10, textTransform: "uppercase" }}>
          Vaulted · Logo Concepts
        </div>
        <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 42, letterSpacing: "0.12em", color: "#F0ECE8" }}>
          5 DIRECTIONS
        </div>
        <div style={{ fontSize: 10, color: "#5A5248", marginTop: 8 }}>
          Click a concept to select it
        </div>
      </div>

      {/* Grid — intentionally asymmetric: 3 top, 2 bottom */}
      <div style={{ maxWidth: 900, margin: "0 auto" }}>

        {/* Row 1 — 3 cards */}
        <div style={{ display: "flex", gap: 16, marginBottom: 16, flexWrap: "wrap", justifyContent: "center" }}>
          {CONCEPTS.slice(0, 3).map((c, i) => (
            <div
              key={c.id}
              className={`logo-card ${selected === c.id ? "selected" : ""}`}
              style={{ flex: "1 1 220px", maxWidth: 260, animationDelay: `${i * 0.08}s` }}
              onClick={() => setSelected(selected === c.id ? null : c.id)}
              onMouseEnter={() => setHovered(c.id)}
              onMouseLeave={() => setHovered(null)}
            >
              <div className="tag">{`0${c.id.charCodeAt(0) - 64}`} / 05</div>
              <div style={{ display: "flex", justifyContent: "center", minHeight: 160, alignItems: "center" }}>
                <c.Component animate={hovered === c.id} />
              </div>
              <div className="concept-name">{c.name}</div>
              <div style={{ fontSize: 9, color: "#FFD24A", letterSpacing: "0.08em", marginBottom: 6 }}>{c.vibe}</div>
              <div className="concept-desc">{c.desc}</div>
              {selected === c.id && <div className="selected-badge">✓ SELECTED</div>}
            </div>
          ))}
        </div>

        {/* Row 2 — 2 cards, offset */}
        <div style={{ display: "flex", gap: 16, justifyContent: "center", flexWrap: "wrap" }}>
          {CONCEPTS.slice(3).map((c, i) => (
            <div
              key={c.id}
              className={`logo-card ${selected === c.id ? "selected" : ""}`}
              style={{ flex: "1 1 260px", maxWidth: 300, animationDelay: `${(i + 3) * 0.08}s` }}
              onClick={() => setSelected(selected === c.id ? null : c.id)}
              onMouseEnter={() => setHovered(c.id)}
              onMouseLeave={() => setHovered(null)}
            >
              <div className="tag">{`0${c.id.charCodeAt(0) - 64}`} / 05</div>
              <div style={{ display: "flex", justifyContent: "center", minHeight: 160, alignItems: "center" }}>
                <c.Component animate={hovered === c.id} />
              </div>
              <div className="concept-name">{c.name}</div>
              <div style={{ fontSize: 9, color: "#FFD24A", letterSpacing: "0.08em", marginBottom: 6 }}>{c.vibe}</div>
              <div className="concept-desc">{c.desc}</div>
              {selected === c.id && <div className="selected-badge">✓ SELECTED</div>}
            </div>
          ))}
        </div>
      </div>

      {/* Selection summary */}
      {selected && (
        <div style={{
          maxWidth: 900, margin: "32px auto 0",
          background: "linear-gradient(135deg, rgba(255,210,74,0.06), rgba(255,210,74,0.02))",
          border: "1px solid rgba(255,210,74,0.2)",
          borderRadius: "2px 14px 14px 2px",
          padding: "20px 24px",
          display: "flex", justifyContent: "space-between", alignItems: "center",
        }}>
          <div>
            <div style={{ fontSize: 9, color: "#FFD24A", letterSpacing: "0.14em", marginBottom: 4 }}>SELECTED CONCEPT</div>
            <div style={{ fontSize: 14, color: "#F0ECE8", letterSpacing: "0.06em" }}>
              {CONCEPTS.find(c => c.id === selected)?.name}
            </div>
          </div>
          <div style={{ fontSize: 9, color: "#6A6058" }}>
            Hover cards to animate · Click to select
          </div>
        </div>
      )}
    </div>
  );
}
