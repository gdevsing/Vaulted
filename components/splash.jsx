"use client";

import { useState, useEffect, useRef } from "react";

export default function SplashScreen({ onComplete }) {
  const [rotation, setRotation]   = useState(-30);
  const [locked, setLocked]       = useState(false);
  const [textIn, setTextIn]       = useState(false);
  const [fadeOut, setFadeOut]     = useState(false);
  const frameRef = useRef();

  useEffect(() => {
    // Option A: 2 full clockwise spins → snap + bounce lock
    const DUR = 2200;
    let start = null;
    let cancelled = false;

    const animate = (t) => {
      if (t < 0.8) {
        const ease = 1 - Math.pow(1 - t / 0.8, 2);
        return { rot: -30 + ease * 750, locked: false };
      }
      const bt = (t - 0.8) / 0.2;
      const bounce = Math.sin(bt * Math.PI * 3) * (1 - bt) * 18;
      return { rot: 720 + bounce, locked: bt > 0.75 };
    };

    const tick = (ts) => {
      if (cancelled) return;
      if (!start) start = ts;
      const t = Math.min((ts - start) / DUR, 1);
      const { rot, locked: isLocked } = animate(t);
      setRotation(rot);
      setLocked(isLocked);
      if ((ts - start) < DUR + 300) {
        frameRef.current = requestAnimationFrame(tick);
      }
    };

    // Start text after 400ms
    const t1 = setTimeout(() => setTextIn(true), 400);
    // Start fade out
    const t2 = setTimeout(() => setFadeOut(true), 2800);
    // Complete
    const t3 = setTimeout(() => onComplete?.(), 3300);

    frameRef.current = requestAnimationFrame(tick);

    return () => {
      cancelled = true;
      cancelAnimationFrame(frameRef.current);
      clearTimeout(t1); clearTimeout(t2); clearTimeout(t3);
    };
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
      background: "#0C0A08",
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
        <g style={{ transformOrigin:`${c}px ${c}px`, transform:`rotate(${rotation}deg)` }}>
          <line x1={c} y1={c+size*0.08} x2={c} y2={c-r*0.7}
            stroke="#FFD24A" strokeWidth={size*0.033} strokeLinecap="round"/>
          <line x1={c} y1={c} x2={c} y2={c+size*0.16}
            stroke="#FFD24A" strokeWidth={size*0.02} strokeLinecap="round" opacity={0.4}/>
        </g>
        <circle cx={c} cy={c} r={size*0.055} fill={locked ? "#FFD24A" : "#F0ECE8"} style={{transition:"fill 0.3s"}}/>
        <circle cx={c} cy={c} r={size*0.027} fill="#0C0A08"/>
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
    </div>
  );
}
