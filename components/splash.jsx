"use client";

import { useState, useEffect } from "react";

export default function SplashScreen({ onComplete }) {
  const [textIn, setTextIn]   = useState(false);
  const [fadeOut, setFadeOut] = useState(false);

  useEffect(() => {
    const t1 = setTimeout(() => setTextIn(true), 400);
    const t2 = setTimeout(() => setFadeOut(true), 2800);
    const t3 = setTimeout(() => onComplete?.(), 3300);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, []);

  const size = 140;
  const c = size / 2;
  const r = size * 0.43;

  const ticks = Array.from({ length: 12 }, (_, i) => {
    const rad = (i * 30 - 90) * Math.PI / 180;
    const isMajor = i % 3 === 0;
    return {
      x1: c + r * Math.cos(rad),
      y1: c + r * Math.sin(rad),
      x2: c + (r - (isMajor ? size*0.09 : size*0.055)) * Math.cos(rad),
      y2: c + (r - (isMajor ? size*0.09 : size*0.055)) * Math.sin(rad),
      major: isMajor,
    };
  });

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 9999,
      background: "#0F0F0F",
      display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center",
      gap: 28,
      opacity: fadeOut ? 0 : 1,
      transition: fadeOut ? "opacity 0.5s ease" : "none",
    }}>
      {/* Dial */}
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle cx={c} cy={c} r={r} fill="none" stroke="#F0ECE8" strokeWidth={size*0.025}/>
        <circle cx={c} cy={c} r={r*0.68} fill="none" stroke="#F0ECE8" strokeWidth={size*0.012} opacity={0.2}/>
        {ticks.map((t, i) => (
          <line key={i} x1={t.x1} y1={t.y1} x2={t.x2} y2={t.y2}
            stroke="#F0ECE8" strokeWidth={t.major ? size*0.023 : size*0.011}
            strokeLinecap="round" opacity={t.major ? 0.65 : 0.28}/>
        ))}
        {/* Needle — CSS animation: 2 full spins landing at 10pm (-60deg) */}
        <g style={{
          transformOrigin: `${c}px ${c}px`,
          animation: "splashDial 2.2s cubic-bezier(0.16,1,0.3,1) both",
        }}>
          <line x1={c} y1={c+size*0.08} x2={c} y2={c-r*0.7}
            stroke="#FF4757" strokeWidth={size*0.033} strokeLinecap="round"/>
          <line x1={c} y1={c} x2={c} y2={c+size*0.16}
            stroke="#FF4757" strokeWidth={size*0.02} strokeLinecap="round" opacity={0.4}/>
        </g>
        <circle cx={c} cy={c} r={size*0.055} fill="#FF4757" />
        <circle cx={c} cy={c} r={size*0.027} fill="#0F0F0F"/>
      </svg>

      {/* Text */}
      <div style={{
        display: "flex", flexDirection: "column", alignItems: "center", gap: 10,
        opacity: textIn ? 1 : 0,
        transform: textIn ? "translateY(0)" : "translateY(12px)",
        transition: "opacity 0.6s ease, transform 0.6s ease",
      }}>
        <div style={{
          fontFamily: "'Audiowide', sans-serif",
          fontSize: 28, letterSpacing: "0.2em", color: "#F0ECE8", lineHeight: 1,
        }}>
          VAULTED
        </div>
        <div style={{
          fontFamily: "'Cormorant Garamond', Georgia, serif",
          fontStyle: "italic", fontSize: 13,
          color: "#F0ECE8", opacity: 0.45, letterSpacing: "0.06em",
        }}>
          your wealth, compounding quietly
        </div>
      </div>
      <style>{`
        @keyframes splashDial {
          0%   { transform: rotate(-30deg); }
          75%  { transform: rotate(675deg); }
          88%  { transform: rotate(648deg); }
          100% { transform: rotate(660deg); }
        }
      `}</style>
    </div>
  );
}
