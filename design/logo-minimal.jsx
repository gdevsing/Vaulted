import { useState, useEffect } from "react";

const STYLE = `
  @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Cormorant+Garamond:ital,wght@0,300;0,400;1,300&family=Syne:wght@700;800&family=JetBrains+Mono:wght@300;400&display=swap');

  * { box-sizing: border-box; margin: 0; padding: 0; }

  @keyframes fadeUp {
    from { opacity: 0; transform: translateY(10px); }
    to   { opacity: 1; transform: translateY(0); }
  }

  @keyframes dialTurn {
    from { transform: rotate(0deg); }
    to   { transform: rotate(-90deg); }
  }

  @keyframes subtleFloat {
    0%, 100% { transform: translateY(0); }
    50%       { transform: translateY(-3px); }
  }

  .concept {
    animation: fadeUp 0.4s ease both;
    cursor: pointer;
  }

  .concept:hover .dial-group {
    animation: dialTurn 0.9s cubic-bezier(0.34,1.2,0.64,1) both;
  }

  .concept:hover .float-group {
    animation: subtleFloat 2s ease-in-out infinite;
  }

  .pill {
    font-family: 'JetBrains Mono', monospace;
    font-size: 9px;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    padding: 2px 8px;
    border-radius: 1px 6px 6px 1px;
    display: inline-block;
    margin-top: 10px;
  }

  .sel-pill {
    background: rgba(255,210,74,0.1);
    border: 1px solid rgba(255,210,74,0.35);
    color: #FFD24A;
  }

  .name {
    font-family: 'JetBrains Mono', monospace;
    font-size: 10px;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    margin-top: 16px;
    margin-bottom: 4px;
  }

  .desc {
    font-family: 'JetBrains Mono', monospace;
    font-size: 9px;
    line-height: 1.7;
    opacity: 0.45;
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

// ─── Wordmarks ────────────────────────────────────────────────────────────────

const WM_Bebas = ({ color }) => (
  <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 22, letterSpacing: "0.28em", color, lineHeight: 1 }}>
    VAULTED
  </div>
);

const WM_Syne = ({ color }) => (
  <div style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: 16, letterSpacing: "0.2em", color, lineHeight: 1 }}>
    VAULTED
  </div>
);

const WM_Cormorant = ({ color }) => (
  <div style={{ fontFamily: "'Cormorant Garamond', serif", fontWeight: 300, fontSize: 22, letterSpacing: "0.22em", color, lineHeight: 1, textTransform: "uppercase" }}>
    Vaulted
  </div>
);

const WM_Split = ({ color1, color2 }) => (
  <div style={{ display: "flex", alignItems: "baseline", gap: 1 }}>
    <span style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: 17, letterSpacing: "0.05em", color: color1 }}>VAULT</span>
    <span style={{ fontFamily: "'Cormorant Garamond', serif", fontWeight: 300, fontStyle: "italic", fontSize: 21, color: color2 }}>ed</span>
  </div>
);

// ─── Mark components ──────────────────────────────────────────────────────────

// A: Single thin circle with a minimal dial line — one stroke, no fill
const MarkA = ({ fg, accent }) => (
  <svg className="float-group" width="56" height="56" viewBox="0 0 56 56">
    <circle cx="28" cy="28" r="24" fill="none" stroke={fg} strokeWidth="1.2" />
    {/* Single pointer line — the only detail */}
    <line x1="28" y1="28" x2="28" y2="8" stroke={accent} strokeWidth="1.5" strokeLinecap="round" />
    {/* Tiny centre dot */}
    <circle cx="28" cy="28" r="2" fill={accent} />
    {/* One tick at top */}
    <line x1="28" y1="4" x2="28" y2="7" stroke={fg} strokeWidth="1.2" strokeOpacity="0.5" />
  </svg>
);

// B: Two horizontal bars — abstracted vault bolts, pure geometry
const MarkB = ({ fg, accent }) => (
  <svg className="float-group" width="56" height="40" viewBox="0 0 56 40">
    {/* Top bolt bar */}
    <rect x="8" y="8" width="40" height="5" rx="2.5" fill="none" stroke={fg} strokeWidth="1.2" />
    {/* Bottom bolt bar */}
    <rect x="8" y="27" width="40" height="5" rx="2.5" fill="none" stroke={fg} strokeWidth="1.2" />
    {/* Gold accent — centre vertical bar (the lock pin) */}
    <rect x="25" y="4" width="6" height="32" rx="3" fill={accent} opacity="0.9" />
  </svg>
);

// C: Square with rounded corner cut — like a vault door viewed straight on, 
// reduced to one clean shape + a single circle for the dial
const MarkC = ({ fg, accent }) => (
  <svg className="float-group" width="52" height="52" viewBox="0 0 52 52">
    {/* Door outline — square, one corner cut */}
    <path d="M6 6 L46 6 L46 46 L6 46 Z" fill="none" stroke={fg} strokeWidth="1.2" />
    {/* Single circle = dial */}
    <circle cx="26" cy="26" r="9" fill="none" stroke={fg} strokeWidth="1" />
    <circle cx="26" cy="26" r="2.5" fill={accent} />
    {/* One pointer */}
    <g className="dial-group" style={{ transformOrigin: "26px 26px" }}>
      <line x1="26" y1="26" x2="26" y2="18" stroke={accent} strokeWidth="1.2" strokeLinecap="round" />
    </g>
  </svg>
);

// D: The letter V with a single arc above — minimal keyhole abstraction
// Arc = the circle of the keyhole, V = the slot. Two strokes total.
const MarkD = ({ fg, accent }) => (
  <svg className="float-group" width="50" height="58" viewBox="0 0 50 58">
    {/* Arc — top of keyhole */}
    <path d="M10 20 A16 16 0 0 1 40 20" fill="none" stroke={fg} strokeWidth="1.4" strokeLinecap="round" />
    {/* V — keyhole slot, also the brand letter */}
    <path d="M10 20 L25 52 L40 20" fill="none" stroke={accent} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

// E: Circle with a single notch cut out at top — like a dial indicator mark,
// or the opening of a vault. One circle, one gap. Absolutely minimal.
const MarkE = ({ fg, accent }) => (
  <svg className="float-group" width="56" height="56" viewBox="0 0 56 56">
    {/* Circle with gap at top */}
    <path d="M28 4 A24 24 0 1 1 27.9 4" fill="none" stroke={fg} strokeWidth="1.5"
      strokeLinecap="round" strokeDasharray="142 8" />
    {/* Gold tick at the gap */}
    <line x1="28" y1="2" x2="28" y2="10" stroke={accent} strokeWidth="2" strokeLinecap="round" />
    {/* Centre */}
    <circle cx="28" cy="28" r="2.5" fill={accent} />
  </svg>
);

// F: Two concentric arcs — just the top half of a vault door rim.
// Suggests vault without showing the whole thing. Ultra reductive.
const MarkF = ({ fg, accent }) => (
  <svg className="float-group" width="64" height="38" viewBox="0 0 64 38">
    {/* Outer arc */}
    <path d="M4 36 A28 28 0 0 1 60 36" fill="none" stroke={fg} strokeWidth="1.2" strokeLinecap="round" />
    {/* Inner arc */}
    <path d="M12 36 A20 20 0 0 1 52 36" fill="none" stroke={fg} strokeWidth="0.8" strokeLinecap="round" strokeOpacity="0.4" />
    {/* Gold centre vertical = pointer / handle */}
    <line x1="32" y1="8" x2="32" y2="36" stroke={accent} strokeWidth="1.5" strokeLinecap="round" />
    {/* End caps */}
    <circle cx="4" cy="36" r="2" fill={fg} opacity="0.4" />
    <circle cx="60" cy="36" r="2" fill={fg} opacity="0.4" />
  </svg>
);

// ─── Each concept = mark + wordmark pair, shown on dark + light ───────────────

const CONCEPTS = [
  {
    id: "A", Mark: MarkA,
    wm: (fg, accent) => <WM_Bebas color={fg} />,
    name: "Dial · One Line",
    desc: "Circle + single pointer. The most reduced version of a combination lock. Nothing more.",
  },
  {
    id: "B", Mark: MarkB,
    wm: (fg, accent) => <WM_Syne color={fg} />,
    name: "Bolt Bars",
    desc: "Two horizontal bars + a vertical pin. Pure abstraction of locking bolts. Reads industrial and precise.",
  },
  {
    id: "C", Mark: MarkC,
    wm: (fg, accent) => <WM_Bebas color={fg} />,
    name: "Square Door",
    desc: "A square outline with a single circle inside. Flat-on vault door reduced to two shapes. Hover to turn the dial.",
  },
  {
    id: "D", Mark: MarkD,
    wm: (fg, accent) => <WM_Split color1={fg} color2={accent} />,
    name: "Arc + V",
    desc: "Two strokes only. The arc is the keyhole circle, the V is the slot. Brand letter and vault symbol are the same shape.",
  },
  {
    id: "E", Mark: MarkE,
    wm: (fg, accent) => <WM_Cormorant color={fg} />,
    name: "Open Circle",
    desc: "A circle with one gap and one tick. Like a combination lock at zero. Serene and uncluttered.",
  },
  {
    id: "F", Mark: MarkF,
    wm: (fg, accent) => <WM_Bebas color={fg} />,
    name: "Half Vault",
    desc: "Two concentric arcs — the top half of a vault door only. Suggests the full form without showing it.",
  },
];

// ─── Logo tile: one concept on one background ─────────────────────────────────
const Tile = ({ concept, bg, fg, accent, border, label, selected, onSelect, delay }) => (
  <div
    className="concept"
    style={{
      background: bg,
      border: `1px solid ${selected ? accent : border}`,
      borderRadius: "3px 14px 14px 3px",
      padding: "28px 22px 22px",
      animationDelay: `${delay}s`,
      boxShadow: selected
        ? `0 0 0 1px ${accent}25, 0 16px 40px rgba(0,0,0,0.5)`
        : "0 8px 24px rgba(0,0,0,0.3)",
      transition: "box-shadow 0.2s, border-color 0.2s, transform 0.18s",
    }}
    onClick={onSelect}
  >
    <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 8, letterSpacing: "0.14em", color: fg, opacity: 0.3, marginBottom: 20, textTransform: "uppercase" }}>
      {label}
    </div>

    {/* Mark */}
    <div style={{ display: "flex", justifyContent: "center", minHeight: 68, alignItems: "center" }}>
      <concept.Mark fg={fg} accent={accent} />
    </div>

    {/* Wordmark */}
    <div style={{ display: "flex", justifyContent: "center", marginTop: 14 }}>
      {concept.wm(fg, accent)}
    </div>

    {selected && <div className="pill sel-pill">✓ SELECTED</div>}
  </div>
);

// ─── App ──────────────────────────────────────────────────────────────────────
export default function App() {
  const [selected, setSelected] = useState(null);

  const DARK  = { bg: "#0C0A08", fg: "#F0ECE8", accent: "#FFD24A", border: "rgba(255,255,255,0.07)" };
  const LIGHT = { bg: "#F5F0E8", fg: "#1A1614", accent: "#B87800", border: "rgba(26,22,20,0.1)"  };

  return (
    <div style={{ background: "#0A0806", minHeight: "100vh", padding: "40px 16px 60px", fontFamily: "'JetBrains Mono', monospace" }}>
      <StyleInject />

      {/* Header */}
      <div style={{ textAlign: "center", marginBottom: 48 }}>
        <div style={{ fontSize: 9, letterSpacing: "0.22em", color: "#2E2820", marginBottom: 10, textTransform: "uppercase" }}>
          Vaulted · Logo · Minimal
        </div>
        <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 38, letterSpacing: "0.14em", color: "#F0ECE8" }}>
          6 MARKS
        </div>
        <div style={{ fontSize: 9, color: "#2E2820", marginTop: 8, letterSpacing: "0.08em" }}>
          Each shown on dark + light · Hover to animate · Click to select
        </div>
      </div>

      {/* Concepts — each row = one concept, two tiles (dark + light) */}
      <div style={{ maxWidth: 860, margin: "0 auto", display: "flex", flexDirection: "column", gap: 12 }}>
        {CONCEPTS.map((c, i) => (
          <div key={c.id} style={{ display: "flex", gap: 12, flexWrap: "wrap", animation: `fadeUp 0.4s ease ${i * 0.06}s both` }}>

            {/* Dark tile */}
            <div style={{ flex: "1 1 200px" }}>
              <Tile
                concept={c}
                bg={DARK.bg} fg={DARK.fg} accent={DARK.accent} border={DARK.border}
                label={`0${i+1} · Dark`}
                selected={selected === `${c.id}-dark`}
                onSelect={() => setSelected(selected === `${c.id}-dark` ? null : `${c.id}-dark`)}
                delay={i * 0.06}
              />
            </div>

            {/* Light tile */}
            <div style={{ flex: "1 1 200px" }}>
              <Tile
                concept={c}
                bg={LIGHT.bg} fg={LIGHT.fg} accent={LIGHT.accent} border={LIGHT.border}
                label={`0${i+1} · Light`}
                selected={selected === `${c.id}-light`}
                onSelect={() => setSelected(selected === `${c.id}-light` ? null : `${c.id}-light`)}
                delay={i * 0.06 + 0.03}
              />
            </div>

            {/* Label */}
            <div style={{ flex: "0 0 140px", display: "flex", flexDirection: "column", justifyContent: "center", paddingLeft: 4 }}>
              <div className="name" style={{ color: "#C0B0A0" }}>{c.name}</div>
              <div className="desc" style={{ color: "#C0B0A0" }}>{c.desc}</div>
            </div>

          </div>
        ))}
      </div>

      {/* Selected callout */}
      {selected && (() => {
        const [id, theme] = selected.split("-");
        const c = CONCEPTS.find(x => x.id === id);
        const t = theme === "dark" ? DARK : LIGHT;
        return (
          <div style={{
            maxWidth: 860, margin: "32px auto 0",
            background: "rgba(255,210,74,0.04)",
            border: "1px solid rgba(255,210,74,0.18)",
            borderRadius: "3px 16px 16px 3px",
            padding: "28px 32px",
            display: "flex", alignItems: "center", gap: 32, flexWrap: "wrap",
          }}>
            {/* Large preview */}
            <div style={{
              background: t.bg, border: `1px solid ${t.border}`,
              borderRadius: "2px 12px 12px 2px",
              padding: "32px 40px",
              display: "flex", flexDirection: "column", alignItems: "center", gap: 20,
              transform: "scale(1.1)", transformOrigin: "center left",
            }}>
              <c.Mark fg={t.fg} accent={t.accent} />
              {c.wm(t.fg, t.accent)}
            </div>
            <div>
              <div style={{ fontSize: 9, color: "rgba(255,210,74,0.5)", letterSpacing: "0.14em", marginBottom: 8 }}>
                SELECTED · {id} · {theme.toUpperCase()}
              </div>
              <div style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: 18, color: "#F0ECE8", marginBottom: 6 }}>{c.name}</div>
              <div style={{ fontSize: 10, color: "#4A4038", lineHeight: 1.7 }}>{c.desc}</div>
            </div>
          </div>
        );
      })()}

      <div style={{ textAlign: "center", marginTop: 48, fontSize: 9, color: "#1A1610", letterSpacing: "0.14em" }}>
        VAULTED · MINIMAL MARK EXPLORATION · 2026
      </div>
    </div>
  );
}
