import { useState, useEffect } from "react";

const STYLE = `
  @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Cormorant+Garamond:ital,wght@0,300;0,400;1,300;1,400&family=Syne:wght@700;800&family=JetBrains+Mono:wght@300;400;700&display=swap');

  * { box-sizing: border-box; margin: 0; padding: 0; }

  @keyframes fadeUp {
    from { opacity: 0; transform: translateY(14px); }
    to   { opacity: 1; transform: translateY(0); }
  }

  @keyframes spinDial {
    from { transform: rotate(0deg); }
    to   { transform: rotate(-72deg); }
  }

  @keyframes spinDialFast {
    0%   { transform: rotate(0deg); }
    40%  { transform: rotate(-120deg); }
    70%  { transform: rotate(-80deg); }
    100% { transform: rotate(-105deg); }
  }

  @keyframes glowPulse {
    0%, 100% { filter: drop-shadow(0 0 4px rgba(255,210,74,0.2)); }
    50%       { filter: drop-shadow(0 0 16px rgba(255,210,74,0.6)); }
  }

  @keyframes boltSlide {
    0%   { transform: translateX(0); }
    50%  { transform: translateX(6px); }
    100% { transform: translateX(0); }
  }

  @keyframes unlock {
    0%   { transform: rotate(0deg); }
    100% { transform: rotate(90deg); }
  }

  @keyframes floatUp {
    0%, 100% { transform: translateY(0); }
    50%       { transform: translateY(-5px); }
  }

  @keyframes ringExpand {
    0%   { r: 44; opacity: 0.6; }
    100% { r: 52; opacity: 0; }
  }

  .card {
    background: linear-gradient(145deg, rgba(255,255,255,0.058) 0%, rgba(255,255,255,0.018) 100%);
    border: 1px solid rgba(255,255,255,0.075);
    border-radius: 3px 20px 20px 3px;
    padding: 36px 24px 28px;
    cursor: pointer;
    transition: transform 0.22s ease, box-shadow 0.22s ease, border-color 0.22s ease;
    animation: fadeUp 0.5s ease both;
    position: relative;
    overflow: hidden;
  }

  .card::after {
    content: '';
    position: absolute;
    top: 0; left: 0; right: 0; height: 1px;
    background: linear-gradient(90deg, transparent, rgba(255,210,74,0.25), transparent);
    opacity: 0; transition: opacity 0.3s;
  }

  .card:hover::after, .card.selected::after { opacity: 1; }

  .card:hover {
    transform: translateY(-4px);
    box-shadow: 0 28px 60px rgba(0,0,0,0.7), 0 0 0 1px rgba(255,255,255,0.06);
  }

  .card.selected {
    border-color: rgba(255,210,74,0.5);
    box-shadow: 0 0 0 1px rgba(255,210,74,0.14), 0 28px 60px rgba(0,0,0,0.7);
  }

  /* Hover animations */
  .card:hover .anim-dial    { animation: spinDialFast 1.4s cubic-bezier(0.34,1.2,0.64,1) both; }
  .card:hover .anim-glow    { animation: glowPulse 2s ease-in-out infinite; }
  .card:hover .anim-bolt-r  { animation: boltSlide 0.8s ease 0.1s both; }
  .card:hover .anim-bolt-l  { animation: boltSlide 0.8s ease 0.2s both; transform-origin: center; transform: scaleX(-1); }
  .card:hover .anim-float   { animation: floatUp 2.5s ease-in-out infinite; }
  .card:hover .anim-unlock  { animation: unlock 0.6s cubic-bezier(0.34,1.56,0.64,1) 0.2s both; transform-origin: 50% 75%; }

  .v-label { font-family:'JetBrains Mono',monospace; font-size:9px; letter-spacing:0.14em; text-transform:uppercase; color:rgba(255,210,74,0.45); margin-bottom:8px; }
  .v-name  { font-family:'JetBrains Mono',monospace; font-size:11px; letter-spacing:0.1em; text-transform:uppercase; color:#C0B8B0; margin-top:20px; margin-bottom:4px; }
  .v-vibe  { font-family:'JetBrains Mono',monospace; font-size:9px; color:rgba(255,210,74,0.65); letter-spacing:0.08em; margin-bottom:6px; }
  .v-desc  { font-family:'JetBrains Mono',monospace; font-size:10px; color:#484038; line-height:1.65; }
  .sel     { font-family:'JetBrains Mono',monospace; font-size:9px; letter-spacing:0.12em; color:#FFD24A; background:rgba(255,210,74,0.08); border:1px solid rgba(255,210,74,0.28); border-radius:1px 8px 8px 1px; padding:3px 10px; display:inline-block; margin-top:10px; }
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

// ─── LOGO 1: Circular Vault Door ─────────────────────────────────────────────
// A proper round bank vault door — outer frame ring, inner door, 4 locking
// bolts at cardinal points, centre combination wheel with spokes + handle bar.
// Heavily detailed. Reads "vault" instantly.
const Logo1 = () => (
  <svg className="anim-glow" width="130" height="130" viewBox="0 0 130 130">
    <defs>
      <radialGradient id="l1-door" cx="42%" cy="38%" r="65%">
        <stop offset="0%" stopColor="#2E2418" />
        <stop offset="100%" stopColor="#0E0A06" />
      </radialGradient>
      <radialGradient id="l1-dial" cx="45%" cy="40%" r="60%">
        <stop offset="0%" stopColor="#3A2C18" />
        <stop offset="100%" stopColor="#1A1208" />
      </radialGradient>
      <linearGradient id="l1-rim" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#FFD24A" />
        <stop offset="40%" stopColor="#C8920A" />
        <stop offset="100%" stopColor="#8A6000" />
      </linearGradient>
      <linearGradient id="l1-spoke" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#FFD24A" stopOpacity="0.9" />
        <stop offset="100%" stopColor="#C8920A" stopOpacity="0.6" />
      </linearGradient>
      <filter id="l1-glow">
        <feGaussianBlur stdDeviation="2" result="blur" />
        <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
      </filter>
    </defs>

    {/* ── Outer wall frame ── */}
    <circle cx="65" cy="65" r="60" fill="#0A0806" stroke="#2A1E0E" strokeWidth="2" />
    <circle cx="65" cy="65" r="60" fill="none" stroke="url(#l1-rim)" strokeWidth="1" strokeOpacity="0.5" />

    {/* Frame screws at corners */}
    {[45, 135, 225, 315].map(a => {
      const r = (a * Math.PI) / 180;
      return (
        <g key={a}>
          <circle cx={65 + 54 * Math.cos(r)} cy={65 + 54 * Math.sin(r)} r="4" fill="#1A1208" stroke="#FFD24A" strokeWidth="0.6" strokeOpacity="0.5" />
          <line x1={65 + 54 * Math.cos(r) - 2} y1={65 + 54 * Math.sin(r)} x2={65 + 54 * Math.cos(r) + 2} y2={65 + 54 * Math.sin(r)} stroke="#FFD24A" strokeWidth="0.5" strokeOpacity="0.4" />
          <line x1={65 + 54 * Math.cos(r)} y1={65 + 54 * Math.sin(r) - 2} x2={65 + 54 * Math.cos(r)} y2={65 + 54 * Math.sin(r) + 2} stroke="#FFD24A" strokeWidth="0.5" strokeOpacity="0.4" />
        </g>
      );
    })}

    {/* ── Door face ── */}
    <circle cx="65" cy="65" r="50" fill="url(#l1-door)" />
    <circle cx="65" cy="65" r="50" fill="none" stroke="#FFD24A" strokeWidth="0.8" strokeOpacity="0.3" />
    <circle cx="65" cy="65" r="46" fill="none" stroke="#2A1E0E" strokeWidth="1.5" />

    {/* ── Locking bolts — N/E/S/W ── */}
    {[0, 90, 180, 270].map(a => {
      const rad = (a * Math.PI) / 180;
      const bx = 65 + 46 * Math.cos(rad);
      const by = 65 + 46 * Math.sin(rad);
      const isHoriz = a === 90 || a === 270;
      return (
        <g key={a} className={a === 90 ? "anim-bolt-r" : a === 270 ? "anim-bolt-l" : ""}>
          {/* Bolt cylinder */}
          <rect
            x={isHoriz ? bx - 10 : bx - 5}
            y={isHoriz ? by - 5 : by - 10}
            width={isHoriz ? 20 : 10}
            height={isHoriz ? 10 : 20}
            rx="3"
            fill="#1A1208"
            stroke="#FFD24A"
            strokeWidth="0.8"
            strokeOpacity="0.7"
          />
          {/* Bolt highlight */}
          <rect
            x={isHoriz ? bx - 8 : bx - 3}
            y={isHoriz ? by - 2 : by - 8}
            width={isHoriz ? 16 : 6}
            height={isHoriz ? 3 : 14}
            rx="1.5"
            fill="#FFD24A"
            fillOpacity="0.15"
          />
          {/* Bolt tip */}
          <circle cx={65 + 56 * Math.cos(rad)} cy={65 + 56 * Math.sin(rad)} r="3.5"
            fill="#0A0806" stroke="#FFD24A" strokeWidth="0.8" strokeOpacity="0.6" />
        </g>
      );
    })}

    {/* ── Combination dial ── */}
    <g className="anim-dial" style={{ transformOrigin: "65px 65px" }}>
      {/* Dial ring */}
      <circle cx="65" cy="65" r="24" fill="url(#l1-dial)" stroke="#FFD24A" strokeWidth="1" strokeOpacity="0.5" />
      <circle cx="65" cy="65" r="20" fill="none" stroke="#FFD24A" strokeWidth="0.4" strokeOpacity="0.2" />

      {/* Dial notches — 12 around the ring */}
      {Array.from({ length: 12 }).map((_, i) => {
        const a = (i * 30 * Math.PI) / 180;
        const isMajor = i % 3 === 0;
        return (
          <line key={i}
            x1={65 + 19 * Math.cos(a)} y1={65 + 19 * Math.sin(a)}
            x2={65 + (isMajor ? 23 : 21) * Math.cos(a)} y2={65 + (isMajor ? 23 : 21) * Math.sin(a)}
            stroke="#FFD24A" strokeWidth={isMajor ? 1.2 : 0.5}
            strokeOpacity={isMajor ? 0.8 : 0.3}
          />
        );
      })}

      {/* Spokes */}
      {[0, 60, 120, 180, 240, 300].map(a => {
        const rad = (a * Math.PI) / 180;
        return (
          <line key={a}
            x1={65 + 4 * Math.cos(rad)} y1={65 + 4 * Math.sin(rad)}
            x2={65 + 17 * Math.cos(rad)} y2={65 + 17 * Math.sin(rad)}
            stroke="url(#l1-spoke)" strokeWidth="1.5" strokeLinecap="round"
          />
        );
      })}

      {/* Centre hub */}
      <circle cx="65" cy="65" r="5" fill="#0A0806" stroke="#FFD24A" strokeWidth="1" strokeOpacity="0.8" />
      <circle cx="65" cy="65" r="2.5" fill="#FFD24A" fillOpacity="0.7" />

      {/* Pointer marker at top */}
      <polygon points="65,40 62.5,45 67.5,45" fill="#FFD24A" fillOpacity="0.9" />
    </g>

    {/* ── Handle bar ── */}
    <rect x="51" y="62" width="28" height="6" rx="3" fill="#1A1208" stroke="#FFD24A" strokeWidth="0.8" strokeOpacity="0.6" />
    <rect x="53" y="63.5" width="24" height="3" rx="1.5" fill="#FFD24A" fillOpacity="0.12" />
    {/* Handle end caps */}
    <circle cx="51" cy="65" r="4" fill="#1A1208" stroke="#FFD24A" strokeWidth="0.8" strokeOpacity="0.7" />
    <circle cx="79" cy="65" r="4" fill="#1A1208" stroke="#FFD24A" strokeWidth="0.8" strokeOpacity="0.7" />

    {/* ── Indicator dot ── */}
    <circle cx="65" cy="19" r="2" fill="#FFD24A" fillOpacity="0.6" />
  </svg>
);

// ─── LOGO 2: Minimal Safe Dial ───────────────────────────────────────────────
// Stripped back to the combination dial only — the most iconic part of a safe.
// Clean, geometric, instantly readable. Works at any size. Very modern.
const Logo2 = () => (
  <svg className="anim-glow" width="120" height="120" viewBox="0 0 120 120">
    <defs>
      <radialGradient id="l2-bg" cx="40%" cy="35%" r="70%">
        <stop offset="0%" stopColor="#201808" />
        <stop offset="100%" stopColor="#080604" />
      </radialGradient>
    </defs>

    {/* Outer ring — tick marks */}
    <circle cx="60" cy="60" r="54" fill="none" stroke="rgba(255,210,74,0.12)" strokeWidth="1" />
    {Array.from({ length: 40 }).map((_, i) => {
      const a = (i * 9 * Math.PI) / 180;
      const isMajor = i % 5 === 0;
      return (
        <line key={i}
          x1={60 + 50 * Math.cos(a)} y1={60 + 50 * Math.sin(a)}
          x2={60 + (isMajor ? 54 : 52) * Math.cos(a)} y2={60 + (isMajor ? 54 : 52) * Math.sin(a)}
          stroke="#FFD24A" strokeWidth={isMajor ? 1.2 : 0.4}
          strokeOpacity={isMajor ? 0.6 : 0.2}
        />
      );
    })}

    {/* Main dial body */}
    <circle cx="60" cy="60" r="42" fill="url(#l2-bg)" />
    <circle cx="60" cy="60" r="42" fill="none" stroke="#FFD24A" strokeWidth="0.8" strokeOpacity="0.4" />

    {/* Inner ring */}
    <circle cx="60" cy="60" r="34" fill="none" stroke="rgba(255,210,74,0.15)" strokeWidth="1" />

    {/* Dial spokes */}
    <g className="anim-dial" style={{ transformOrigin: "60px 60px" }}>
      {[0, 45, 90, 135, 180, 225, 270, 315].map(a => {
        const rad = (a * Math.PI) / 180;
        return (
          <line key={a}
            x1={60 + 6 * Math.cos(rad)} y1={60 + 6 * Math.sin(rad)}
            x2={60 + 30 * Math.cos(rad)} y2={60 + 30 * Math.sin(rad)}
            stroke="#FFD24A" strokeWidth="1" strokeOpacity={a % 90 === 0 ? 0.7 : 0.25}
            strokeLinecap="round"
          />
        );
      })}

      {/* Knurled edge pattern */}
      {Array.from({ length: 24 }).map((_, i) => {
        const a = (i * 15 * Math.PI) / 180;
        return (
          <rect key={i}
            x={60 + 36 * Math.cos(a) - 1.5}
            y={60 + 36 * Math.sin(a) - 3}
            width="3" height="6" rx="1"
            fill="#1A1208" stroke="#FFD24A" strokeWidth="0.4" strokeOpacity="0.4"
            transform={`rotate(${i * 15 + 90}, ${60 + 36 * Math.cos(a)}, ${60 + 36 * Math.sin(a)})`}
          />
        );
      })}
    </g>

    {/* Centre */}
    <circle cx="60" cy="60" r="8" fill="#0A0806" stroke="#FFD24A" strokeWidth="1" strokeOpacity="0.7" />
    <circle cx="60" cy="60" r="4" fill="#FFD24A" fillOpacity="0.8" />
    <circle cx="60" cy="60" r="1.5" fill="#0A0806" />

    {/* Pointer */}
    <polygon points="60,8 57,16 63,16" fill="#FFD24A" fillOpacity="0.9" />
    <circle cx="60" cy="8" r="2" fill="#FFD24A" fillOpacity="0.5" />

    {/* Number markers */}
    {[0, 25, 50, 75].map((n, i) => {
      const a = (i * 90 * Math.PI) / 180 - Math.PI / 2;
      return (
        <text key={n}
          x={60 + 45 * Math.cos(a)} y={60 + 45 * Math.sin(a) + 3}
          textAnchor="middle" fontSize="7"
          fontFamily="JetBrains Mono, monospace"
          fill="#FFD24A" fillOpacity="0.4"
        >{n}</text>
      );
    })}
  </svg>
);

// ─── LOGO 3: V inside Vault Door ─────────────────────────────────────────────
// The circular vault door contains the letterform V.
// The V is formed by the negative space / etched into the door face.
// Brand mark + concept unified.
const Logo3 = () => (
  <svg className="anim-float" width="130" height="130" viewBox="0 0 130 130">
    <defs>
      <radialGradient id="l3-door" cx="40%" cy="35%" r="70%">
        <stop offset="0%" stopColor="#2A2010" />
        <stop offset="100%" stopColor="#0C0A06" />
      </radialGradient>
      <linearGradient id="l3-v" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stopColor="#FFD24A" />
        <stop offset="100%" stopColor="#C8920A" />
      </linearGradient>
      <radialGradient id="l3-glow" cx="50%" cy="50%" r="50%">
        <stop offset="0%" stopColor="rgba(255,210,74,0.08)" />
        <stop offset="100%" stopColor="rgba(255,210,74,0)" />
      </radialGradient>
    </defs>

    {/* Outer frame */}
    <circle cx="65" cy="65" r="60" fill="#0A0806" />
    <circle cx="65" cy="65" r="60" fill="none" stroke="#FFD24A" strokeWidth="1.5" strokeOpacity="0.35" />
    <circle cx="65" cy="65" r="56" fill="none" stroke="#FFD24A" strokeWidth="0.4" strokeOpacity="0.15" />

    {/* Door */}
    <circle cx="65" cy="65" r="50" fill="url(#l3-door)" />

    {/* Bolt rings at edge */}
    {[0, 72, 144, 216, 288].map(a => {
      const rad = (a * Math.PI) / 180;
      return (
        <g key={a} className={a === 0 ? "anim-bolt-r" : ""}>
          <circle cx={65 + 46 * Math.cos(rad)} cy={65 + 46 * Math.sin(rad)} r="5"
            fill="#0A0806" stroke="#FFD24A" strokeWidth="0.8" strokeOpacity="0.6" />
          <circle cx={65 + 46 * Math.cos(rad)} cy={65 + 46 * Math.sin(rad)} r="2.5"
            fill="#FFD24A" fillOpacity="0.3" />
        </g>
      );
    })}

    {/* Concentric decoration rings */}
    <circle cx="65" cy="65" r="38" fill="none" stroke="rgba(255,210,74,0.1)" strokeWidth="1" />

    {/* Glow behind V */}
    <circle cx="65" cy="65" r="26" fill="url(#l3-glow)" />

    {/* ── V letterform etched into door ── */}
    {/* Bold geometric V — two thick bars meeting at bottom */}
    <path
      d="M42 36 L54 36 L65 62 L76 36 L88 36 L65 82 Z"
      fill="url(#l3-v)"
    />
    {/* Inner cutout to make it look etched/raised */}
    <path
      d="M46 38 L54 38 L65 62 L76 38 L84 38 L65 76 Z"
      fill="#1A1208"
      fillOpacity="0.4"
    />

    {/* Thin dial ring around V */}
    <g className="anim-dial" style={{ transformOrigin: "65px 65px" }}>
      <circle cx="65" cy="65" r="30" fill="none" stroke="#FFD24A" strokeWidth="0.5" strokeOpacity="0.25" strokeDasharray="3 5" />
      {Array.from({ length: 8 }).map((_, i) => {
        const a = (i * 45 * Math.PI) / 180;
        return (
          <circle key={i}
            cx={65 + 30 * Math.cos(a)} cy={65 + 30 * Math.sin(a)}
            r="1.5" fill="#FFD24A" fillOpacity="0.4"
          />
        );
      })}
    </g>

    {/* Handle */}
    <rect x="51" y="88" width="28" height="6" rx="3"
      fill="#1A1208" stroke="#FFD24A" strokeWidth="0.8" strokeOpacity="0.5" />
    <circle cx="51" cy="91" r="4" fill="#1A1208" stroke="#FFD24A" strokeWidth="0.7" strokeOpacity="0.6" />
    <circle cx="79" cy="91" r="4" fill="#1A1208" stroke="#FFD24A" strokeWidth="0.7" strokeOpacity="0.6" />
  </svg>
);

// ─── LOGO 4: Heavy Rectangular Safe Door ─────────────────────────────────────
// A flat-on view of a rectangular safe door — thick frame, visible hinge,
// four corner bolts, centre handle wheel. More industrial than circular.
const Logo4 = () => (
  <svg className="anim-glow" width="120" height="130" viewBox="0 0 120 130">
    <defs>
      <linearGradient id="l4-door" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#2A2010" />
        <stop offset="100%" stopColor="#0C0806" />
      </linearGradient>
      <linearGradient id="l4-frame" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#3A2C18" />
        <stop offset="100%" stopColor="#1A1208" />
      </linearGradient>
    </defs>

    {/* Wall / frame */}
    <rect x="8" y="8" width="104" height="114" rx="8" fill="url(#l4-frame)" stroke="#FFD24A" strokeWidth="0.8" strokeOpacity="0.3" />

    {/* Hinge — left side */}
    <rect x="6" y="28" width="12" height="20" rx="3" fill="#1A1208" stroke="#FFD24A" strokeWidth="0.8" strokeOpacity="0.5" />
    <rect x="6" y="82" width="12" height="20" rx="3" fill="#1A1208" stroke="#FFD24A" strokeWidth="0.8" strokeOpacity="0.5" />
    {[33, 37, 41, 87, 91, 95].map(y => (
      <line key={y} x1="7" y1={y} x2="17" y2={y} stroke="#FFD24A" strokeWidth="0.4" strokeOpacity="0.4" />
    ))}

    {/* Door face */}
    <rect x="18" y="14" width="90" height="102" rx="5" fill="url(#l4-door)" />
    <rect x="18" y="14" width="90" height="102" rx="5" fill="none" stroke="#FFD24A" strokeWidth="0.8" strokeOpacity="0.25" />

    {/* Corner bolts */}
    {[[26,22],[100,22],[26,108],[100,108]].map(([cx,cy],i) => (
      <g key={i} className={i < 2 ? "anim-bolt-r" : ""}>
        <circle cx={cx} cy={cy} r="5.5" fill="#0C0806" stroke="#FFD24A" strokeWidth="0.8" strokeOpacity="0.6" />
        <circle cx={cx} cy={cy} r="2.5" fill="#FFD24A" fillOpacity="0.3" />
        {/* Bolt slot */}
        <line x1={cx-2} y1={cy} x2={cx+2} y2={cy} stroke="#FFD24A" strokeWidth="0.6" strokeOpacity="0.5" />
      </g>
    ))}

    {/* Inner frame ring */}
    <rect x="28" y="24" width="70" height="82" rx="3" fill="none" stroke="rgba(255,210,74,0.12)" strokeWidth="1" />

    {/* Centre combination wheel */}
    <g className="anim-dial" style={{ transformOrigin: "63px 65px" }}>
      <circle cx="63" cy="65" r="22" fill="#0C0806" stroke="#FFD24A" strokeWidth="1" strokeOpacity="0.5" />
      <circle cx="63" cy="65" r="18" fill="none" stroke="#FFD24A" strokeWidth="0.4" strokeOpacity="0.2" />

      {/* Spokes */}
      {[0,45,90,135,180,225,270,315].map(a => {
        const rad = (a * Math.PI) / 180;
        return (
          <line key={a}
            x1={63 + 5 * Math.cos(rad)} y1={65 + 5 * Math.sin(rad)}
            x2={63 + 16 * Math.cos(rad)} y2={65 + 16 * Math.sin(rad)}
            stroke="#FFD24A" strokeWidth="1.2" strokeOpacity={a % 90 === 0 ? 0.7 : 0.3}
            strokeLinecap="round"
          />
        );
      })}

      {/* Notches */}
      {Array.from({ length: 16 }).map((_, i) => {
        const a = (i * 22.5 * Math.PI) / 180;
        return (
          <line key={i}
            x1={63 + 18 * Math.cos(a)} y1={65 + 18 * Math.sin(a)}
            x2={63 + 21 * Math.cos(a)} y2={65 + 21 * Math.sin(a)}
            stroke="#FFD24A" strokeWidth={i % 4 === 0 ? 1 : 0.4}
            strokeOpacity={i % 4 === 0 ? 0.7 : 0.25}
          />
        );
      })}

      <circle cx="63" cy="65" r="5" fill="#0C0806" stroke="#FFD24A" strokeWidth="0.8" strokeOpacity="0.7" />
      <circle cx="63" cy="65" r="2.5" fill="#FFD24A" fillOpacity="0.7" />
    </g>

    {/* Handle bar — horizontal */}
    <rect x="44" y="61.5" width="38" height="7" rx="3.5"
      fill="#1A1208" stroke="#FFD24A" strokeWidth="0.8" strokeOpacity="0.55" />
    <circle cx="44" cy="65" r="5" fill="#1A1208" stroke="#FFD24A" strokeWidth="0.7" strokeOpacity="0.6" />
    <circle cx="82" cy="65" r="5" fill="#1A1208" stroke="#FFD24A" strokeWidth="0.7" strokeOpacity="0.6" />

    {/* Indicator */}
    <polygon points="63,44 60.5,49 65.5,49" fill="#FFD24A" fillOpacity="0.7" />
  </svg>
);

// ─── LOGO 5: Keyhole + V ─────────────────────────────────────────────────────
// A padlock keyhole silhouette where the keyhole IS the V letterform.
// The circle at top + V slot below = both keyhole and brand mark simultaneously.
// Minimal, clever, dual-read.
const Logo5 = () => (
  <svg className="anim-float" width="100" height="120" viewBox="0 0 100 120">
    <defs>
      <radialGradient id="l5-bg" cx="50%" cy="40%" r="60%">
        <stop offset="0%" stopColor="#2A2010" />
        <stop offset="100%" stopColor="#0C0806" />
      </radialGradient>
      <linearGradient id="l5-key" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stopColor="#FFD24A" />
        <stop offset="100%" stopColor="#C8920A" />
      </linearGradient>
    </defs>

    {/* Shield / escutcheon background */}
    <path d="M50 4 L94 20 L94 62 C94 88 74 108 50 116 C26 108 6 88 6 62 L6 20 Z"
      fill="url(#l5-bg)" stroke="#FFD24A" strokeWidth="0.8" strokeOpacity="0.35" />
    <path d="M50 12 L86 26 L86 62 C86 84 68 102 50 110 C32 102 14 84 14 62 L14 26 Z"
      fill="none" stroke="rgba(255,210,74,0.1)" strokeWidth="0.5" />

    {/* ── Keyhole that IS also a V ── */}
    {/* Circle top of keyhole */}
    <circle cx="50" cy="46" r="14" fill="url(#l5-key)" />
    <circle cx="50" cy="46" r="10" fill="#0C0806" />

    {/* V slot — widens downward like a keyhole */}
    <path d="M40 56 L50 82 L60 56 Z" fill="url(#l5-key)" />
    {/* Inner cutout for depth */}
    <path d="M43 57 L50 78 L57 57 Z" fill="#0C0806" fillOpacity="0.5" />

    {/* Ring details around circle */}
    <circle cx="50" cy="46" r="17" fill="none" stroke="#FFD24A" strokeWidth="0.5" strokeOpacity="0.3" strokeDasharray="3 4" />

    {/* Corner rivet details */}
    {[[18,28],[82,28],[18,96],[82,96]].map(([cx,cy],i) => (
      <circle key={i} cx={cx} cy={cy} r="3" fill="#0C0806" stroke="#FFD24A" strokeWidth="0.5" strokeOpacity="0.4" />
    ))}
  </svg>
);

// ─── LOGO 6: Open Vault Door (ajar) ─────────────────────────────────────────
// A perspective view of a vault door swung open — you can see the thickness
// of the door, the frame opening, and a hint of light from inside.
// Communicates "unlocked" and "access" — money freed, not locked away.
const Logo6 = () => (
  <svg className="anim-glow" width="130" height="120" viewBox="0 0 130 120">
    <defs>
      <linearGradient id="l6-inside" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" stopColor="#FFD24A" stopOpacity="0.4" />
        <stop offset="60%" stopColor="#FFD24A" stopOpacity="0.08" />
        <stop offset="100%" stopColor="#FFD24A" stopOpacity="0" />
      </linearGradient>
      <linearGradient id="l6-door-face" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#2A2010" />
        <stop offset="100%" stopColor="#0C0806" />
      </linearGradient>
      <linearGradient id="l6-door-edge" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" stopColor="#C8920A" />
        <stop offset="100%" stopColor="#8A6000" />
      </linearGradient>
      <linearGradient id="l6-frame" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#1E1810" />
        <stop offset="100%" stopColor="#0A0806" />
      </linearGradient>
    </defs>

    {/* ── Wall frame opening ── */}
    <rect x="6" y="10" width="78" height="100" rx="4" fill="url(#l6-frame)" stroke="#FFD24A" strokeWidth="0.8" strokeOpacity="0.25" />

    {/* Inside vault glow — gold light spilling out */}
    <rect x="8" y="12" width="74" height="96" rx="3" fill="url(#l6-inside)" />

    {/* Frame inner edge */}
    <rect x="14" y="18" width="62" height="84" rx="2" fill="#060402" stroke="rgba(255,210,74,0.15)" strokeWidth="0.5" />

    {/* ── Door swung open (perspective, ajar ~60°) ── */}
    {/* Door face — foreshortened in perspective */}
    <polygon points="82,10 122,18 122,102 82,110" fill="url(#l6-door-face)" />
    <polygon points="82,10 122,18 122,102 82,110" fill="none" stroke="#FFD24A" strokeWidth="0.6" strokeOpacity="0.3" />

    {/* Door edge thickness */}
    <polygon points="82,10 90,10 90,110 82,110" fill="url(#l6-door-edge)" />

    {/* Door inner face bevel */}
    <polygon points="84,14 88,14 88,106 84,106" fill="#FFD24A" fillOpacity="0.06" />

    {/* Bolts on door face — 4, evenly spaced */}
    {[24, 44, 76, 96].map((y, i) => (
      <g key={i}>
        <ellipse cx="100" cy={y} rx="7" ry="5" fill="#0C0806" stroke="#FFD24A" strokeWidth="0.6" strokeOpacity="0.5" />
        <ellipse cx="100" cy={y} rx="3.5" ry="2.5" fill="#FFD24A" fillOpacity="0.2" />
      </g>
    ))}

    {/* Door combination dial — foreshortened */}
    <g className="anim-dial" style={{ transformOrigin: "104px 60px" }}>
      <ellipse cx="104" cy="60" rx="12" ry="14" fill="#0C0806" stroke="#FFD24A" strokeWidth="0.8" strokeOpacity="0.55" />
      {[0,60,120,180,240,300].map(a => {
        const rad = (a * Math.PI) / 180;
        return (
          <line key={a}
            x1={104 + 3 * Math.cos(rad)} y1={60 + 4 * Math.sin(rad)}
            x2={104 + 9 * Math.cos(rad)} y2={60 + 11 * Math.sin(rad)}
            stroke="#FFD24A" strokeWidth="0.8" strokeOpacity="0.5" strokeLinecap="round"
          />
        );
      })}
      <ellipse cx="104" cy="60" rx="3" ry="3.5" fill="#FFD24A" fillOpacity="0.6" />
    </g>

    {/* Hinge — visible on door edge */}
    {[28, 92].map(y => (
      <g key={y}>
        <rect x="79" y={y - 7} width="6" height="14" rx="2" fill="#1A1208" stroke="#FFD24A" strokeWidth="0.5" strokeOpacity="0.5" />
        <circle cx="82" cy={y} r="2.5" fill="#FFD24A" fillOpacity="0.3" />
      </g>
    ))}

    {/* Light ray from inside */}
    <polygon points="14,60 14,58 50,50 50,70" fill="#FFD24A" fillOpacity="0.04" />
  </svg>
);

// ─── Wordmarks ────────────────────────────────────────────────────────────────
const WM = ({ size = 24, sub, style = {} }) => (
  <div style={{ textAlign: "center", ...style }}>
    <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: size, letterSpacing: "0.2em", color: "#F0ECE8", lineHeight: 1 }}>VAULTED</div>
    {sub && <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 8, letterSpacing: "0.18em", color: "#4A4038", marginTop: 5 }}>{sub}</div>}
  </div>
);

const WMSerif = ({ size = 22, sub }) => (
  <div style={{ textAlign: "center" }}>
    <div style={{ display: "flex", alignItems: "baseline", justifyContent: "center" }}>
      <span style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: size, letterSpacing: "-0.01em", color: "#F0ECE8" }}>VAULT</span>
      <span style={{ fontFamily: "'Cormorant Garamond', serif", fontWeight: 300, fontStyle: "italic", fontSize: size * 1.18, color: "#FFD24A", marginLeft: 2 }}>ed</span>
    </div>
    {sub && <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 8, letterSpacing: "0.18em", color: "#4A4038", marginTop: 5 }}>{sub}</div>}
  </div>
);

// ─── Concepts ─────────────────────────────────────────────────────────────────
const LOGOS = [
  {
    id: 1, Logo: Logo1,
    wm: <WM sub="PERSONAL FINANCE" />,
    name: "Classic Round Door",
    vibe: "Authoritative · Iconic",
    desc: "The definitive vault door — circular frame, 4 locking bolts, rotating combination dial with spokes and notches, horizontal handle bar. Unmistakable at first glance. Hover to spin the dial.",
  },
  {
    id: 2, Logo: Logo2,
    wm: <WMSerif sub="YOUR WEALTH · LOCKED IN" />,
    name: "Combination Dial",
    vibe: "Minimal · Precise",
    desc: "The iconic combination dial reduced to pure geometry — 40 tick marks, 8 spokes, knurled edge, numbered quadrants. No door needed. Instantly reads as 'safe'. Hover to turn.",
  },
  {
    id: 3, Logo: Logo3,
    wm: <WM sub="YOUR WEALTH · LOCKED IN" />,
    name: "V Inside the Door",
    vibe: "Brand + Concept unified",
    desc: "The vault door contains the V letterform — etched in gold into the door face. The brand mark and the vault concept are inseparable. Rotating dot ring on hover adds mechanical precision.",
  },
  {
    id: 4, Logo: Logo4,
    wm: <WM sub="PERSONAL FINANCE OS" />,
    name: "Rectangular Safe",
    vibe: "Industrial · Heavy",
    desc: "A flat-on view of a rectangular safe door — thick frame, visible hinge, four corner bolts, central combination wheel. More industrial than circular. Like a floor safe or hotel safe.",
  },
  {
    id: 5, Logo: Logo5,
    wm: <WMSerif />,
    name: "Keyhole V",
    vibe: "Clever · Dual-read",
    desc: "The most conceptually elegant — the keyhole IS the V. Circle at top + widening V slot = both letterform and keyhole simultaneously. Two meanings, one mark. Works as a wax seal or app icon.",
  },
  {
    id: 6, Logo: Logo6,
    wm: <WM sub="YOUR WEALTH · UNLOCKED" />,
    name: "Open Vault Door",
    vibe: "Dynamic · Perspective",
    desc: "A perspective view of a vault door swung open — you see the door thickness, frame, and gold light spilling from inside. Communicates access and reward rather than just security. Unique in the space.",
  },
];

// ─── App ──────────────────────────────────────────────────────────────────────
export default function App() {
  const [selected, setSelected] = useState(null);
  const [hovered, setHovered] = useState(null);
  const sel = LOGOS.find(l => l.id === selected);

  return (
    <div style={{ background: "#090706", minHeight: "100vh", padding: "40px 20px 60px", fontFamily: "'JetBrains Mono', monospace" }}>
      <StyleInject />

      {/* Header */}
      <div style={{ textAlign: "center", marginBottom: 48 }}>
        <div style={{ fontSize: 9, letterSpacing: "0.22em", color: "#3A3028", marginBottom: 10, textTransform: "uppercase" }}>
          Vaulted · Logo Concepts · Vault Designs
        </div>
        <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 40, letterSpacing: "0.14em", color: "#F0ECE8", lineHeight: 1 }}>
          6 VAULT DIRECTIONS
        </div>
        <div style={{ fontSize: 10, color: "#3A3028", marginTop: 10 }}>Hover to animate the mechanics · Click to select</div>
      </div>

      {/* 3-column grid */}
      <div style={{ maxWidth: 860, margin: "0 auto", display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: 14 }}>
        {LOGOS.map((l, i) => (
          <div
            key={l.id}
            className={`card ${selected === l.id ? "selected" : ""}`}
            style={{ animationDelay: `${i * 0.07}s` }}
            onClick={() => setSelected(selected === l.id ? null : l.id)}
            onMouseEnter={() => setHovered(l.id)}
            onMouseLeave={() => setHovered(null)}
          >
            <div className="v-label">0{l.id} / 06</div>
            <div style={{ display: "flex", justifyContent: "center", minHeight: 150, alignItems: "center" }}>
              <l.Logo animate={hovered === l.id} />
            </div>
            <div style={{ display: "flex", justifyContent: "center", marginTop: 8, marginBottom: 4 }}>
              {l.wm}
            </div>
            <div className="v-name">{l.name}</div>
            <div className="v-vibe">{l.vibe}</div>
            <div className="v-desc">{l.desc}</div>
            {selected === l.id && <div className="sel">✓ SELECTED</div>}
          </div>
        ))}
      </div>

      {/* Selected preview */}
      {sel && (
        <div style={{
          maxWidth: 860, margin: "32px auto 0",
          background: "linear-gradient(135deg, rgba(255,210,74,0.055), rgba(255,210,74,0.015))",
          border: "1px solid rgba(255,210,74,0.22)",
          borderRadius: "3px 18px 18px 3px",
          padding: "32px 36px",
          display: "flex", alignItems: "center", gap: 36, flexWrap: "wrap",
        }}>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 16, transform: "scale(1.25)", transformOrigin: "center" }}>
            <sel.Logo animate={false} />
            {sel.wm}
          </div>
          <div style={{ flex: 1, minWidth: 200 }}>
            <div style={{ fontSize: 9, color: "rgba(255,210,74,0.55)", letterSpacing: "0.14em", marginBottom: 8 }}>SELECTED · 0{sel.id} / 06</div>
            <div style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: 20, color: "#F0ECE8", marginBottom: 5, letterSpacing: "0.04em" }}>{sel.name}</div>
            <div style={{ fontSize: 9, color: "rgba(255,210,74,0.65)", letterSpacing: "0.08em", marginBottom: 12 }}>{sel.vibe}</div>
            <div style={{ fontSize: 10, color: "#4A4038", lineHeight: 1.75 }}>{sel.desc}</div>
          </div>
        </div>
      )}

      <div style={{ textAlign: "center", marginTop: 44, fontSize: 9, color: "#1E1A16", letterSpacing: "0.14em" }}>
        VAULTED · LOGO EXPLORATION · 2026
      </div>
    </div>
  );
}
