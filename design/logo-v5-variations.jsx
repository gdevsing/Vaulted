import { useState, useEffect } from "react";

const STYLE = `
  @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Cormorant+Garamond:ital,wght@0,300;0,400;1,300;1,400&family=Syne:wght@700;800&family=JetBrains+Mono:wght@300;400;700&display=swap');

  * { box-sizing: border-box; margin: 0; padding: 0; }

  @keyframes fadeUp {
    from { opacity: 0; transform: translateY(12px); }
    to   { opacity: 1; transform: translateY(0); }
  }

  @keyframes floatY {
    0%, 100% { transform: translateY(0px); }
    50%       { transform: translateY(-4px); }
  }

  @keyframes glowPulse {
    0%, 100% { filter: drop-shadow(0 0 6px rgba(255,210,74,0.3)); }
    50%       { filter: drop-shadow(0 0 18px rgba(255,210,74,0.7)); }
  }

  @keyframes rotateSlow {
    from { transform: rotate(0deg); }
    to   { transform: rotate(360deg); }
  }

  @keyframes unfold {
    from { transform: scaleY(0); opacity: 0; transform-origin: top; }
    to   { transform: scaleY(1); opacity: 1; transform-origin: top; }
  }

  @keyframes strokeDraw {
    from { stroke-dashoffset: 400; opacity: 0.3; }
    to   { stroke-dashoffset: 0; opacity: 1; }
  }

  .card {
    background: linear-gradient(145deg, rgba(255,255,255,0.055) 0%, rgba(255,255,255,0.018) 100%);
    border: 1px solid rgba(255,255,255,0.07);
    border-radius: 3px 18px 18px 3px;
    padding: 36px 24px 28px;
    cursor: pointer;
    transition: transform 0.22s ease, box-shadow 0.22s ease, border-color 0.22s ease;
    animation: fadeUp 0.5s ease both;
    position: relative;
    overflow: hidden;
  }

  .card::before {
    content: '';
    position: absolute;
    top: 0; left: 0; right: 0;
    height: 1px;
    background: linear-gradient(90deg, transparent, rgba(255,210,74,0.2), transparent);
    opacity: 0;
    transition: opacity 0.3s;
  }

  .card:hover::before { opacity: 1; }

  .card:hover {
    transform: translateY(-4px);
    box-shadow: 0 24px 56px rgba(0,0,0,0.65), 0 0 0 1px rgba(255,255,255,0.06);
  }

  .card.selected {
    border-color: rgba(255,210,74,0.45);
    box-shadow: 0 0 0 1px rgba(255,210,74,0.12), 0 24px 56px rgba(0,0,0,0.65);
  }

  .card.selected::before { opacity: 1; }

  .card:hover .logo-iso { animation: floatY 2.4s ease-in-out infinite; }
  .card:hover .logo-glow { animation: glowPulse 1.8s ease-in-out infinite; }
  .card:hover .logo-spin { animation: rotateSlow 8s linear infinite; }
  .card:hover .logo-draw { animation: strokeDraw 0.8s ease both; }

  .v-label {
    font-family: 'JetBrains Mono', monospace;
    font-size: 9px;
    letter-spacing: 0.14em;
    text-transform: uppercase;
    color: rgba(255,210,74,0.5);
    margin-bottom: 8px;
  }

  .v-name {
    font-family: 'JetBrains Mono', monospace;
    font-size: 11px;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    color: #C8C0B8;
    margin-top: 20px;
    margin-bottom: 5px;
  }

  .v-desc {
    font-family: 'JetBrains Mono', monospace;
    font-size: 10px;
    color: #4A4440;
    line-height: 1.65;
  }

  .v-vibe {
    font-family: 'JetBrains Mono', monospace;
    font-size: 9px;
    color: rgba(255,210,74,0.7);
    letter-spacing: 0.08em;
    margin-bottom: 5px;
  }

  .sel-badge {
    font-family: 'JetBrains Mono', monospace;
    font-size: 9px;
    letter-spacing: 0.12em;
    color: #FFD24A;
    background: rgba(255,210,74,0.08);
    border: 1px solid rgba(255,210,74,0.28);
    border-radius: 1px 8px 8px 1px;
    padding: 3px 10px;
    display: inline-block;
    margin-top: 10px;
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

// ─── Shared iso face colours ──────────────────────────────────────────────────
const ISO = {
  topA:   ["#FFD24A", "#E8B830"],   // bright gold
  topB:   ["#F0ECE8", "#D8CFC4"],   // silver/ivory
  topC:   ["#7ECBBD", "#4A9E94"],   // teal
  leftA:  ["#C8920A", "#8A6000"],   // dark gold
  leftB:  ["#A0988C", "#6A6058"],   // warm grey
  leftC:  ["#1A5E58", "#0E3C38"],   // deep teal
  rightA: ["#1A1614", "#0A0808"],   // near black
  rightB: ["#2A2420", "#1A1614"],   // dark warm
};

// ─── V5-A: Classic Gold — original refined ───────────────────────────────────
const V5A = () => (
  <svg className="logo-iso" width="110" height="90" viewBox="0 0 110 90">
    <defs>
      <linearGradient id="a-top" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor={ISO.topA[0]} /><stop offset="100%" stopColor={ISO.topA[1]} />
      </linearGradient>
      <linearGradient id="a-left" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" stopColor={ISO.leftA[0]} /><stop offset="100%" stopColor={ISO.leftA[1]} />
      </linearGradient>
      <linearGradient id="a-right" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" stopColor={ISO.rightA[0]} /><stop offset="100%" stopColor={ISO.rightA[1]} />
      </linearGradient>
    </defs>
    {/* Left arm */}
    <polygon points="6,38 24,18 48,30 30,50" fill="url(#a-top)" />
    <polygon points="6,38 24,18 24,32 6,52" fill="url(#a-left)" />
    <polygon points="30,50 48,30 48,44 30,64" fill="url(#a-right)" />
    {/* Right arm */}
    <polygon points="62,30 86,18 104,38 80,50" fill="url(#a-top)" />
    <polygon points="62,30 86,18 86,32 62,44" fill="url(#a-left)" />
    <polygon points="80,50 104,38 104,52 80,64" fill="url(#a-right)" />
    {/* Bottom point */}
    <polygon points="30,50 48,30 62,30 80,50 55,72" fill="url(#a-top)" opacity="0.95" />
    <polygon points="55,72 30,66 30,50 55,72" fill="url(#a-left)" opacity="0.8" />
    <polygon points="55,72 80,66 80,50 55,72" fill="url(#a-right)" />
    {/* Edge highlights */}
    <polyline points="6,38 24,18 48,30 62,30 86,18 104,38" fill="none" stroke="#FFE880" strokeWidth="0.5" strokeOpacity="0.5" />
  </svg>
);

// ─── V5-B: Monochrome Slate — no gold, all greyscale depth ───────────────────
const V5B = () => (
  <svg className="logo-iso" width="110" height="90" viewBox="0 0 110 90">
    <defs>
      <linearGradient id="b-top" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#D8D0C8" /><stop offset="100%" stopColor="#B0A89C" />
      </linearGradient>
      <linearGradient id="b-left" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" stopColor="#6A6460" /><stop offset="100%" stopColor="#484440" />
      </linearGradient>
      <linearGradient id="b-right" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" stopColor="#242020" /><stop offset="100%" stopColor="#141210" />
      </linearGradient>
    </defs>
    <polygon points="6,38 24,18 48,30 30,50" fill="url(#b-top)" />
    <polygon points="6,38 24,18 24,32 6,52" fill="url(#b-left)" />
    <polygon points="30,50 48,30 48,44 30,64" fill="url(#b-right)" />
    <polygon points="62,30 86,18 104,38 80,50" fill="url(#b-top)" />
    <polygon points="62,30 86,18 86,32 62,44" fill="url(#b-left)" />
    <polygon points="80,50 104,38 104,52 80,64" fill="url(#b-right)" />
    <polygon points="30,50 48,30 62,30 80,50 55,72" fill="url(#b-top)" opacity="0.95" />
    <polygon points="55,72 30,66 30,50 55,72" fill="url(#b-left)" opacity="0.8" />
    <polygon points="55,72 80,66 80,50 55,72" fill="url(#b-right)" />
    {/* Single gold accent line only */}
    <polyline points="6,38 24,18 48,30 62,30 86,18 104,38" fill="none" stroke="#FFD24A" strokeWidth="1" strokeOpacity="0.35" />
    <line x1="30" y1="50" x2="55" y2="72" stroke="#FFD24A" strokeWidth="0.5" strokeOpacity="0.2" />
    <line x1="80" y1="50" x2="55" y2="72" stroke="#FFD24A" strokeWidth="0.5" strokeOpacity="0.2" />
  </svg>
);

// ─── V5-C: Outlined Wire — no fills, pure stroke geometry ────────────────────
const V5C = () => (
  <svg className="logo-glow" width="110" height="90" viewBox="0 0 110 90">
    <defs>
      <linearGradient id="c-stroke" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#FFD24A" /><stop offset="100%" stopColor="#C8920A" />
      </linearGradient>
    </defs>
    {/* Wire frame faces — no fills */}
    {[
      "6,38 24,18 48,30 30,50",
      "6,38 24,18 24,32 6,52",
      "30,50 48,30 48,44 30,64",
      "62,30 86,18 104,38 80,50",
      "62,30 86,18 86,32 62,44",
      "80,50 104,38 104,52 80,64",
      "30,50 48,30 62,30 80,50 55,72",
      "55,72 30,66 30,50",
      "55,72 80,66 80,50",
    ].map((pts, i) => (
      <polygon key={i} points={pts} fill="none"
        stroke="#FFD24A" strokeWidth={i === 6 ? "1.2" : "0.8"}
        strokeOpacity={i < 6 ? 0.4 : 0.7}
      />
    ))}
    {/* Bright top edge */}
    <polyline points="6,38 24,18 48,30 62,30 86,18 104,38"
      fill="none" stroke="#FFD24A" strokeWidth="1.5" strokeOpacity="0.9" />
    {/* Centre spine */}
    <line x1="55" y1="30" x2="55" y2="72" stroke="#FFD24A" strokeWidth="0.5" strokeOpacity="0.2" />
  </svg>
);

// ─── V5-D: Split Colour — left arm teal, right arm gold ──────────────────────
const V5D = () => (
  <svg className="logo-iso" width="110" height="90" viewBox="0 0 110 90">
    <defs>
      <linearGradient id="d-teal-top" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#7ECBBD" /><stop offset="100%" stopColor="#4A9E94" />
      </linearGradient>
      <linearGradient id="d-teal-left" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" stopColor="#2A7A70" /><stop offset="100%" stopColor="#1A5050" />
      </linearGradient>
      <linearGradient id="d-teal-right" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" stopColor="#0E3C38" /><stop offset="100%" stopColor="#081818" />
      </linearGradient>
      <linearGradient id="d-gold-top" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#FFD24A" /><stop offset="100%" stopColor="#E8B830" />
      </linearGradient>
      <linearGradient id="d-gold-left" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" stopColor="#C8920A" /><stop offset="100%" stopColor="#8A6000" />
      </linearGradient>
      <linearGradient id="d-gold-right" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" stopColor="#1A1614" /><stop offset="100%" stopColor="#0A0808" />
      </linearGradient>
    </defs>
    {/* Left arm — teal */}
    <polygon points="6,38 24,18 48,30 30,50" fill="url(#d-teal-top)" />
    <polygon points="6,38 24,18 24,32 6,52" fill="url(#d-teal-left)" />
    <polygon points="30,50 48,30 48,44 30,64" fill="url(#d-teal-right)" />
    {/* Right arm — gold */}
    <polygon points="62,30 86,18 104,38 80,50" fill="url(#d-gold-top)" />
    <polygon points="62,30 86,18 86,32 62,44" fill="url(#d-gold-left)" />
    <polygon points="80,50 104,38 104,52 80,64" fill="url(#d-gold-right)" />
    {/* Bottom point — split diagonal */}
    <polygon points="30,50 48,30 55,30 55,72" fill="url(#d-teal-top)" opacity="0.9" />
    <polygon points="55,30 62,30 80,50 55,72" fill="url(#d-gold-top)" opacity="0.9" />
    <polygon points="55,72 30,66 30,50 55,72" fill="url(#d-teal-left)" opacity="0.8" />
    <polygon points="55,72 80,66 80,50 55,72" fill="url(#d-gold-right)" />
    {/* Seam line */}
    <line x1="55" y1="18" x2="55" y2="72" stroke="rgba(255,255,255,0.12)" strokeWidth="1" />
  </svg>
);

// ─── V5-E: Deep Drop Shadow — floating with dramatic cast shadow ──────────────
const V5E = () => (
  <svg className="logo-iso" width="120" height="100" viewBox="0 0 120 100">
    <defs>
      <linearGradient id="e-top" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#FFE06A" /><stop offset="100%" stopColor="#FFD24A" />
      </linearGradient>
      <linearGradient id="e-left" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" stopColor="#D4940C" /><stop offset="100%" stopColor="#A06800" />
      </linearGradient>
      <linearGradient id="e-right" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" stopColor="#1A1614" /><stop offset="100%" stopColor="#0E0C0A" />
      </linearGradient>
      <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
        <feDropShadow dx="0" dy="8" stdDeviation="8" floodColor="#FFD24A" floodOpacity="0.15" />
        <feDropShadow dx="0" dy="20" stdDeviation="16" floodColor="#000000" floodOpacity="0.7" />
      </filter>
    </defs>
    <g filter="url(#shadow)" transform="translate(5, 0)">
      {/* Left arm */}
      <polygon points="6,38 24,18 48,30 30,50" fill="url(#e-top)" />
      <polygon points="6,38 24,18 24,32 6,52" fill="url(#e-left)" />
      <polygon points="30,50 48,30 48,44 30,64" fill="url(#e-right)" />
      {/* Right arm */}
      <polygon points="62,30 86,18 104,38 80,50" fill="url(#e-top)" />
      <polygon points="62,30 86,18 86,32 62,44" fill="url(#e-left)" />
      <polygon points="80,50 104,38 104,52 80,64" fill="url(#e-right)" />
      {/* Bottom point */}
      <polygon points="30,50 48,30 62,30 80,50 55,72" fill="url(#e-top)" opacity="0.95" />
      <polygon points="55,72 30,66 30,50 55,72" fill="url(#e-left)" opacity="0.8" />
      <polygon points="55,72 80,66 80,50 55,72" fill="url(#e-right)" />
    </g>
    {/* Bright top edge */}
    <polyline points="11,38 29,18 53,30 67,30 91,18 109,38"
      fill="none" stroke="#FFF0A0" strokeWidth="0.8" strokeOpacity="0.6" transform="translate(5,0)" />
  </svg>
);

// ─── V5-F: Stacked / Double Extrusion — two layers offset ────────────────────
const V5F = () => (
  <svg className="logo-iso" width="120" height="100" viewBox="0 0 120 100">
    <defs>
      <linearGradient id="f-top" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#FFD24A" /><stop offset="100%" stopColor="#E8B830" />
      </linearGradient>
      <linearGradient id="f-left" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" stopColor="#C8920A" /><stop offset="100%" stopColor="#8A6000" />
      </linearGradient>
      <linearGradient id="f-right" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" stopColor="#2A2018" /><stop offset="100%" stopColor="#181210" />
      </linearGradient>
    </defs>

    {/* Back layer — offset, muted */}
    <g opacity="0.35" transform="translate(8, 6)">
      <polygon points="6,38 24,18 48,30 30,50" fill="#C8920A" />
      <polygon points="6,38 24,18 24,32 6,52" fill="#8A6000" />
      <polygon points="30,50 48,30 48,44 30,64" fill="#1A1614" />
      <polygon points="62,30 86,18 104,38 80,50" fill="#C8920A" />
      <polygon points="62,30 86,18 86,32 62,44" fill="#8A6000" />
      <polygon points="80,50 104,38 104,52 80,64" fill="#1A1614" />
      <polygon points="30,50 48,30 62,30 80,50 55,72" fill="#C8920A" />
      <polygon points="55,72 30,66 30,50 55,72" fill="#8A6000" />
      <polygon points="55,72 80,66 80,50 55,72" fill="#1A1614" />
    </g>

    {/* Front layer — full colour */}
    <polygon points="6,38 24,18 48,30 30,50" fill="url(#f-top)" />
    <polygon points="6,38 24,18 24,32 6,52" fill="url(#f-left)" />
    <polygon points="30,50 48,30 48,44 30,64" fill="url(#f-right)" />
    <polygon points="62,30 86,18 104,38 80,50" fill="url(#f-top)" />
    <polygon points="62,30 86,18 86,32 62,44" fill="url(#f-left)" />
    <polygon points="80,50 104,38 104,52 80,64" fill="url(#f-right)" />
    <polygon points="30,50 48,30 62,30 80,50 55,72" fill="url(#f-top)" opacity="0.95" />
    <polygon points="55,72 30,66 30,50 55,72" fill="url(#f-left)" opacity="0.8" />
    <polygon points="55,72 80,66 80,50 55,72" fill="url(#f-right)" />

    {/* Connecting side faces between layers */}
    <polygon points="14,44 6,38 6,52 14,58" fill="#6A4800" opacity="0.5" />
    <polygon points="96,44 104,38 104,52 96,58" fill="#6A4800" opacity="0.3" />

    {/* Top highlight */}
    <polyline points="6,38 24,18 48,30 62,30 86,18 104,38"
      fill="none" stroke="#FFE880" strokeWidth="0.6" strokeOpacity="0.6" />
  </svg>
);

// ─── Wordmark variants ────────────────────────────────────────────────────────
const WM_Bebas = ({ color = "#F0ECE8" }) => (
  <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 26, letterSpacing: "0.22em", color, lineHeight: 1 }}>
    VAULTED
  </div>
);

const WM_Syne = ({ color = "#F0ECE8" }) => (
  <div style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: 20, letterSpacing: "0.14em", color, lineHeight: 1 }}>
    VAULTED
  </div>
);

const WM_Split = () => (
  <div style={{ display: "flex", alignItems: "baseline" }}>
    <span style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: 22, letterSpacing: "-0.01em", color: "#F0ECE8" }}>VAULT</span>
    <span style={{ fontFamily: "'Cormorant Garamond', serif", fontWeight: 300, fontStyle: "italic", fontSize: 26, color: "#FFD24A", marginLeft: 2 }}>ed</span>
  </div>
);

const WM_Tagline = ({ wm }) => (
  <div style={{ textAlign: "center" }}>
    {wm}
    <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 8, letterSpacing: "0.18em", color: "#5A5248", marginTop: 5 }}>
      YOUR WEALTH · LOCKED IN
    </div>
  </div>
);

// ─── Concept definitions ──────────────────────────────────────────────────────
const VARIANTS = [
  {
    id: "5A",
    Logo: V5A,
    wordmark: <WM_Tagline wm={<WM_Bebas />} />,
    name: "Classic Gold",
    vibe: "Original refined",
    desc: "The original concept, refined. Rich gold top faces, dark amber sides, near-black depth face. Bebas Neue wordmark. Timeless and authoritative.",
  },
  {
    id: "5B",
    Logo: V5B,
    wordmark: <WM_Tagline wm={<WM_Syne color="#D8D0C8" />} />,
    name: "Monochrome Slate",
    vibe: "Restrained luxury",
    desc: "All greyscale with a single thread of gold — one hairline edge only. Syne wordmark in warm white. Understated. Works beautifully in print.",
  },
  {
    id: "5C",
    Logo: V5C,
    wordmark: <WM_Tagline wm={<WM_Bebas color="#FFD24A" />} />,
    name: "Wire Frame",
    vibe: "Technical precision",
    desc: "No solid fills — pure stroke geometry. Glows on hover. Feels like a blueprint or circuit board. Wordmark in gold to anchor the lightness.",
  },
  {
    id: "5D",
    Logo: V5D,
    wordmark: <WM_Tagline wm={<WM_Split />} />,
    name: "Split Colour",
    vibe: "Bold duality",
    desc: "Left arm in teal, right arm in gold — two asset classes, one mark. The seam down the centre represents the balance between two owners. Split wordmark pairs perfectly.",
  },
  {
    id: "5E",
    Logo: V5E,
    wordmark: <WM_Tagline wm={<WM_Bebas />} />,
    name: "Deep Shadow",
    vibe: "Dramatic depth",
    desc: "Same geometry but floating above a dramatic drop shadow — gold glow underneath, heavy black cast below. Feels physical, almost touchable. Premium app icon energy.",
  },
  {
    id: "5F",
    Logo: V5F,
    wordmark: <WM_Tagline wm={<WM_Syne />} />,
    name: "Double Extrusion",
    vibe: "Dimensional",
    desc: "Two layers — a ghost layer offset behind the main form. Creates the illusion of real 3D depth, like the V is being lifted off the surface. Unique and memorable.",
  },
];

// ─── App ──────────────────────────────────────────────────────────────────────
export default function App() {
  const [selected, setSelected] = useState(null);
  const [hovered, setHovered] = useState(null);

  return (
    <div style={{ background: "#0A0808", minHeight: "100vh", padding: "40px 20px 60px" }}>
      <StyleInject />

      {/* Header */}
      <div style={{ textAlign: "center", marginBottom: 48 }}>
        <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, letterSpacing: "0.22em", color: "#4A4440", marginBottom: 10, textTransform: "uppercase" }}>
          Vaulted · Isometric V · Variations
        </div>
        <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 40, letterSpacing: "0.14em", color: "#F0ECE8", lineHeight: 1 }}>
          6 DIRECTIONS
        </div>
        <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: "#4A4440", marginTop: 10 }}>
          Hover to animate · Click to select
        </div>
      </div>

      {/* 2-column grid */}
      <div style={{ maxWidth: 780, margin: "0 auto", display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 14 }}>
        {VARIANTS.map((v, i) => (
          <div
            key={v.id}
            className={`card ${selected === v.id ? "selected" : ""}`}
            style={{ animationDelay: `${i * 0.07}s` }}
            onClick={() => setSelected(selected === v.id ? null : v.id)}
            onMouseEnter={() => setHovered(v.id)}
            onMouseLeave={() => setHovered(null)}
          >
            <div className="v-label">Concept {v.id}</div>

            {/* Logo mark */}
            <div style={{ display: "flex", justifyContent: "center", minHeight: 130, alignItems: "center" }}>
              <v.Logo animate={hovered === v.id} />
            </div>

            {/* Wordmark */}
            <div style={{ display: "flex", justifyContent: "center", marginTop: 4 }}>
              {v.wordmark}
            </div>

            <div className="v-name">{v.name}</div>
            <div className="v-vibe">{v.vibe}</div>
            <div className="v-desc">{v.desc}</div>

            {selected === v.id && <div className="sel-badge">✓ SELECTED</div>}
          </div>
        ))}
      </div>

      {/* Comparison — show selected at larger size */}
      {selected && (() => {
        const v = VARIANTS.find(x => x.id === selected);
        return (
          <div style={{
            maxWidth: 780, margin: "32px auto 0",
            background: "linear-gradient(135deg, rgba(255,210,74,0.05), rgba(255,210,74,0.015))",
            border: "1px solid rgba(255,210,74,0.2)",
            borderRadius: "3px 18px 18px 3px",
            padding: "32px 40px",
            display: "flex", justifyContent: "space-between", alignItems: "center", gap: 24,
            flexWrap: "wrap",
          }}>
            {/* Large mark */}
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 16 }}>
              <svg viewBox="0 0 110 90" width="180" height="148">
                <v.Logo animate={false} />
              </svg>
              <div style={{ transform: "scale(1.3)", transformOrigin: "center" }}>
                {v.wordmark}
              </div>
            </div>
            <div style={{ flex: 1, minWidth: 200 }}>
              <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, color: "rgba(255,210,74,0.6)", letterSpacing: "0.14em", marginBottom: 8 }}>
                SELECTED · CONCEPT {v.id}
              </div>
              <div style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: 20, color: "#F0ECE8", marginBottom: 6, letterSpacing: "0.04em" }}>
                {v.name}
              </div>
              <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: "rgba(255,210,74,0.7)", marginBottom: 12, letterSpacing: "0.08em" }}>
                {v.vibe}
              </div>
              <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: "#5A5248", lineHeight: 1.7 }}>
                {v.desc}
              </div>
            </div>
          </div>
        );
      })()}

      {/* Footer */}
      <div style={{ textAlign: "center", marginTop: 40, fontFamily: "'JetBrains Mono', monospace", fontSize: 9, color: "#2A2420", letterSpacing: "0.12em" }}>
        ALL VARIATIONS BASED ON ISOMETRIC V CONCEPT · VAULTED 2026
      </div>
    </div>
  );
}
