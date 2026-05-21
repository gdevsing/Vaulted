import { useState, useEffect, useRef } from "react";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";

// ─── GLOBAL STYLES injected into head ────────────────────────────────────────
const STYLE = `
  @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Instrument+Serif:ital@0;1&family=JetBrains+Mono:wght@300;400;600&display=swap');

  :root {
    --bg:       #080608;
    --ink:      #F0ECE8;
    --ink2:     #7A7069;
    --ink3:     #2E2A28;
    --surface:  rgba(240,236,232,0.04);
    --surface2: rgba(240,236,232,0.08);
    --glow:     rgba(255,210,80,0.18);
    --gold:     #FFD24A;
    --gold2:    #C8920A;
    --cash:     #7ECBBD;
    --shares:   #8FD49A;
    --crypto:   #B9A0E8;
    --super:    #F0A04A;
    --pos:      #7DD68A;
    --neg:      #E87070;
    --border:   rgba(240,236,232,0.09);
    --border2:  rgba(240,236,232,0.16);
  }

  /* ── Light theme overrides ── */
  [data-theme="light"] {
    --bg:       #F5F0E8;
    --ink:      #1A1614;
    --ink2:     #8A7E74;
    --ink3:     #D8CFC4;
    --surface:  rgba(26,22,20,0.04);
    --surface2: rgba(26,22,20,0.07);
    --glow:     rgba(180,120,0,0.10);
    --gold:     #B87800;
    --gold2:    #7A4E00;
    --cash:     #1A7A6E;
    --shares:   #1A7A38;
    --crypto:   #6040B0;
    --super:    #B85A00;
    --pos:      #1A7A38;
    --neg:      #C03030;
    --border:   rgba(26,22,20,0.10);
    --border2:  rgba(26,22,20,0.18);
  }

  /* ── Theme transition ── */
  .vault-root, .vault-root * {
    transition: background-color 0.35s ease, color 0.35s ease, border-color 0.25s ease, box-shadow 0.35s ease;
  }

  * { box-sizing: border-box; margin: 0; padding: 0; }

  .vault-root {
    background: var(--bg);
    font-family: 'JetBrains Mono', monospace;
    color: var(--ink);
    min-height: 100vh;
  }

  /* ── Stagger reveal ── */
  @keyframes fadeUp {
    from { opacity: 0; transform: translateY(14px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  .reveal { animation: fadeUp 0.45s ease both; }
  .reveal-1 { animation-delay: 0.05s; }
  .reveal-2 { animation-delay: 0.12s; }
  .reveal-3 { animation-delay: 0.19s; }
  .reveal-4 { animation-delay: 0.26s; }
  .reveal-5 { animation-delay: 0.33s; }

  /* ── XP bar fill ── */
  @keyframes xpFill {
    from { width: 0%; }
    to   { width: 78.45%; }
  }
  .xp-fill { animation: xpFill 1.1s cubic-bezier(0.16,1,0.3,1) 0.4s both; }

  /* ── Confetti burst ── */
  @keyframes burst {
    0%   { transform: translate(0,0) scale(1); opacity: 1; }
    100% { transform: translate(var(--tx), var(--ty)) scale(0); opacity: 0; }
  }
  .confetti-dot {
    position: absolute; width: 6px; height: 6px; border-radius: 50%;
    animation: burst 0.7s ease-out both;
  }

  /* ── Pulse ring on save ── */
  @keyframes pulseRing {
    0%   { transform: scale(0.8); opacity: 0.8; }
    100% { transform: scale(2.2); opacity: 0; }
  }
  .pulse-ring {
    position: absolute; inset: 0; border-radius: 50%;
    border: 2px solid var(--pos);
    animation: pulseRing 0.6s ease-out both;
  }

  /* ── Number tick-up ── */
  @keyframes tickUp {
    0%   { transform: translateY(8px); opacity: 0; }
    100% { transform: translateY(0);   opacity: 1; }
  }
  .tick { animation: tickUp 0.35s cubic-bezier(0.34,1.56,0.64,1) both; }

  /* ── Hover lift ── */
  .lift { transition: transform 0.18s ease, box-shadow 0.18s ease; }
  .lift:hover { transform: translateY(-2px); box-shadow: 0 12px 32px rgba(0,0,0,0.5); }

  /* ── Scrollbar ── */
  ::-webkit-scrollbar { width: 2px; }
  ::-webkit-scrollbar-track { background: transparent; }
  ::-webkit-scrollbar-thumb { background: var(--ink3); border-radius: 2px; }

  /* ── Tab active underline ── */
  .tab-active { border-bottom: 1.5px solid var(--gold) !important; color: var(--gold) !important; }

  /* ── Button press ── */
  .btn-press { transition: transform 0.1s; }
  .btn-press:active { transform: scale(0.96); }
`;

// ─── Inject styles ────────────────────────────────────────────────────────────
function StyleInject() {
  useEffect(() => {
    const el = document.createElement("style");
    el.textContent = STYLE;
    document.head.appendChild(el);
    return () => document.head.removeChild(el);
  }, []);
  return null;
}

// ─── Data ────────────────────────────────────────────────────────────────────
const nwData = [
  { m: "J", v: 61000 }, { m: "A", v: 63500 }, { m: "S", v: 62000 },
  { m: "O", v: 65800 }, { m: "N", v: 67200 }, { m: "D", v: 68900 },
  { m: "J", v: 71200 }, { m: "F", v: 73800 }, { m: "M", v: 75100 },
  { m: "A", v: 74200 }, { m: "M", v: 78450 },
];

const assetData = [
  { name: "CASH",   val: 28200, color: "var(--cash)",   key: "cash"   },
  { name: "SHARES", val: 32100, color: "var(--shares)", key: "shares" },
  { name: "CRYPTO", val: 8950,  color: "var(--crypto)", key: "crypto" },
  { name: "SUPER",  val: 9200,  color: "var(--super)",  key: "super"  },
];

const accounts = [
  { name: "Up Bank",       owner: "H", asset: "cash",   bal: 8200,  native: null, cur: "AUD", updated: "today",       group: null,    overdue: false },
  { name: "NAB Everyday",  owner: "H", asset: "cash",   bal: 6400,  native: null, cur: "AUD", updated: "today",       group: null,    overdue: false },
  { name: "ANZ Savings",   owner: "H", asset: "cash",   bal: 7100,  native: null, cur: "AUD", updated: "today",       group: null,    overdue: false },
  { name: "ING Orange",    owner: "H", asset: "cash",   bal: 6500,  native: null, cur: "AUD", updated: "3d ago",      group: null,    overdue: false },
  { name: "Stake ASX",     owner: "H", asset: "shares", bal: 9800,  native: null, cur: "AUD", updated: "today",       group: "Stake", overdue: false },
  { name: "Stake Wall St", owner: "H", asset: "shares", bal: 13220, native: 8530, cur: "USD", updated: "today",       group: "Stake", overdue: false },
  { name: "Spaceship",     owner: "H", asset: "shares", bal: 9080,  native: null, cur: "AUD", updated: "2wk ago",     group: null,    overdue: true  },
  { name: "Swyftx",        owner: "H", asset: "crypto", bal: 8950,  native: null, cur: "AUD", updated: "today",       group: null,    overdue: false },
  { name: "Husband Super", owner: "H", asset: "super",  bal: 5100,  native: null, cur: "AUD", updated: "1mo ago",     group: null,    overdue: false },
  { name: "Wife Super",    owner: "W", asset: "super",  bal: 4100,  native: null, cur: "AUD", updated: "1mo ago",     group: null,    overdue: false },
];

const ASSET_CSS = { cash:"var(--cash)", shares:"var(--shares)", crypto:"var(--crypto)", super:"var(--super)" };
const fmt = n => "$" + Number(n).toLocaleString();

// ─── Shared primitives ────────────────────────────────────────────────────────

// Asymmetric card with dramatic shadow + layered transparency
const Card = ({ children, style={}, accent, glow, className="", theme="dark" }) => (
  <div className={`lift ${className}`} style={{
    background: glow
      ? `linear-gradient(135deg, var(--glow) 0%, var(--surface) 60%)`
      : `linear-gradient(145deg, var(--surface2) 0%, var(--surface) 100%)`,
    border: `1px solid ${accent ? accent + "55" : "var(--border)"}`,
    borderLeft: accent ? `3px solid ${accent}` : undefined,
    borderRadius: "2px 12px 12px 2px",
    boxShadow: glow
      ? `0 0 40px var(--glow), 0 20px 48px rgba(0,0,0,0.25), inset 0 1px 0 rgba(255,255,255,0.06)`
      : `0 8px 32px rgba(0,0,0,0.18), inset 0 1px 0 rgba(255,255,255,0.04)`,
    backdropFilter: "blur(16px)",
    padding: 18,
    ...style,
  }}>
    {children}
  </div>
);

const Mono = ({ children, style={} }) => (
  <span style={{ fontFamily: "'JetBrains Mono', monospace", ...style }}>{children}</span>
);

const Serif = ({ children, style={} }) => (
  <span style={{ fontFamily: "'Instrument Serif', serif", ...style }}>{children}</span>
);

const Display = ({ children, style={} }) => (
  <span style={{ fontFamily: "'Bebas Neue', sans-serif", ...style }}>{children}</span>
);

const Label = ({ children, style={} }) => (
  <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, letterSpacing: "0.14em", color: "var(--ink2)", textTransform: "uppercase", ...style }}>
    {children}
  </div>
);

const Pip = ({ color }) => (
  <div style={{ width: 5, height: 5, borderRadius: "50%", background: color, boxShadow: `0 0 6px ${color}` }} />
);

const Tag = ({ label, color }) => (
  <span style={{
    fontFamily: "'JetBrains Mono', monospace", fontSize: 9, letterSpacing: "0.1em",
    padding: "2px 7px", borderRadius: 2,
    background: color + "18", color, border: `1px solid ${color}35`,
    textTransform: "uppercase",
  }}>{label}</span>
);

// ─── Confetti burst component (RPG quest complete) ────────────────────────────
const ConfettiBurst = ({ active }) => {
  const dots = [
    { tx: "-30px", ty: "-40px", color: "var(--gold)",   delay: "0s"    },
    { tx: "35px",  ty: "-35px", color: "var(--shares)", delay: "0.05s" },
    { tx: "-40px", ty: "10px",  color: "var(--cash)",   delay: "0.1s"  },
    { tx: "40px",  ty: "15px",  color: "var(--crypto)", delay: "0.08s" },
    { tx: "0px",   ty: "-48px", color: "var(--super)",  delay: "0.03s" },
    { tx: "-20px", ty: "38px",  color: "var(--gold)",   delay: "0.12s" },
    { tx: "25px",  ty: "40px",  color: "var(--shares)", delay: "0.07s" },
    { tx: "50px",  ty: "-10px", color: "var(--ink)",    delay: "0.15s" },
  ];
  if (!active) return null;
  return (
    <div style={{ position: "absolute", top: "50%", left: "50%", pointerEvents: "none", zIndex: 99 }}>
      {dots.map((d, i) => (
        <div key={i} className="confetti-dot" style={{
          background: d.color,
          "--tx": d.tx, "--ty": d.ty,
          animationDelay: d.delay,
        }} />
      ))}
    </div>
  );
};

// ─── Custom tooltip ───────────────────────────────────────────────────────────
const ChartTip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: "rgba(8,6,8,0.95)", border: "1px solid var(--border2)", borderRadius: 4, padding: "6px 10px" }}>
      <Label style={{ marginBottom: 3 }}>{label}</Label>
      <Mono style={{ fontSize: 12, color: "var(--ink)" }}>{fmt(payload[0].value)}</Mono>
    </div>
  );
};

// ─── LOGIN ────────────────────────────────────────────────────────────────────
const LoginScreen = () => (
  <div style={{ display: "flex", flexDirection: "column", justifyContent: "center", height: "100%", padding: "0 4px", gap: 40 }}>
    {/* Asymmetric title block */}
    <div style={{ paddingLeft: 2 }}>
      <Label style={{ marginBottom: 8 }}>Personal Finance OS</Label>
      <Display style={{ fontSize: 56, lineHeight: 0.9, color: "var(--ink)", display: "block", letterSpacing: "0.02em" }}>
        VAULTED
      </Display>
      <Serif style={{ fontSize: 14, color: "var(--ink2)", display: "block", marginTop: 10, fontStyle: "italic" }}>
        your wealth, compounding quietly
      </Serif>
    </div>

    {/* Offset card */}
    <div style={{ marginLeft: 12, marginRight: -4 }}>
      <Card glow style={{ padding: "22px 20px" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {[["Username", "household", false], ["Password", "••••••••••", true]].map(([l, v, muted]) => (
            <div key={l}>
              <Label style={{ marginBottom: 6 }}>{l}</Label>
              <div style={{
                background: "rgba(240,236,232,0.03)", border: "1px solid var(--border)",
                borderRadius: "1px 8px 8px 1px", padding: "10px 13px",
                fontFamily: "'JetBrains Mono', monospace", fontSize: 12,
                color: muted ? "var(--ink2)" : "var(--ink)",
              }}>{v}</div>
            </div>
          ))}
          <button className="btn-press" style={{
            marginTop: 4, background: "var(--gold)", border: "none",
            borderRadius: "1px 8px 8px 1px", padding: "12px",
            fontFamily: "'Bebas Neue', sans-serif", fontSize: 18, letterSpacing: "0.12em",
            color: "#080608", cursor: "pointer",
          }}>
            ENTER THE VAULT
          </button>
        </div>
      </Card>
    </div>

    <Mono style={{ fontSize: 9, color: "var(--ink3)", letterSpacing: "0.12em", paddingLeft: 14 }}>
      HTTPS · PERSONAL · ENCRYPTED
    </Mono>
  </div>
);

// ─── DASHBOARD ────────────────────────────────────────────────────────────────
const DashboardScreen = ({ filter, setFilter }) => {
  const [tickKey, setTickKey] = useState(0);
  const total = 78450;
  const stakeAccounts = accounts.filter(a => a.group === "Stake");
  const stakeTotal = stakeAccounts.reduce((s, a) => s + a.bal, 0);
  const rest = accounts.filter(a => a.group !== "Stake");

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16, overflowY: "auto", height: "100%", paddingBottom: 8 }}>

      {/* Header — asymmetric */}
      <div className="reveal reveal-1" style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", paddingLeft: 2 }}>
        <div>
          <Label>Net Worth</Label>
          <Display
            className="tick"
            key={tickKey}
            style={{ fontSize: 48, lineHeight: 1, color: "var(--ink)", display: "block", marginTop: 4 }}
          >
            {fmt(total)}
          </Display>
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 6 }}>
            <Pip color="var(--pos)" />
            <Mono style={{ fontSize: 10, color: "var(--pos)" }}>↑ $1,240 · +1.6% this week</Mono>
          </div>
        </div>
        {/* Owner toggle — vertical pills */}
        <div style={{ display: "flex", flexDirection: "column", gap: 3, marginBottom: 4 }}>
          {[["ALL","All"], ["H","Husband"], ["W","Wife"]].map(([v, l]) => (
            <button key={v} onClick={() => setFilter(v)} className="btn-press" style={{
              fontFamily: "'JetBrains Mono', monospace", fontSize: 9, padding: "3px 9px",
              borderRadius: "1px 6px 6px 1px", border: "1px solid var(--border)",
              background: filter === v ? "var(--gold)" : "transparent",
              color: filter === v ? "#080608" : "var(--ink2)", cursor: "pointer",
              letterSpacing: "0.1em",
            }}>{l}</button>
          ))}
        </div>
      </div>

      {/* Asset row — horizontal strip, not a grid */}
      <div className="reveal reveal-2" style={{ display: "flex", gap: 0, borderTop: "1px solid var(--border)", borderBottom: "1px solid var(--border)", padding: "12px 0" }}>
        {assetData.map((a, i) => (
          <div key={a.name} style={{
            flex: 1, textAlign: "center", padding: "0 4px",
            borderRight: i < assetData.length - 1 ? "1px solid var(--border)" : "none",
          }}>
            <Pip color={a.color} />
            <Mono style={{ fontSize: 11, color: "var(--ink)", display: "block", marginTop: 5 }}>{fmt(a.val)}</Mono>
            <Label style={{ marginTop: 3 }}>{a.name}</Label>
          </div>
        ))}
      </div>

      {/* Trend + donut side by side — offset layout */}
      <div className="reveal reveal-3" style={{ display: "flex", gap: 10 }}>
        <Card style={{ flex: 2, padding: "14px 14px 8px" }}>
          <Label style={{ marginBottom: 8 }}>12-Month Trend</Label>
          <ResponsiveContainer width="100%" height={80}>
            <LineChart data={nwData}>
              <Line type="monotone" dataKey="v" stroke="var(--gold)" strokeWidth={1.5} dot={false} />
              <Tooltip content={<ChartTip />} />
            </LineChart>
          </ResponsiveContainer>
          <Mono style={{ fontSize: 9, color: "var(--ink2)", marginTop: 6 }}>AUD/USD 0.645 · LIVE</Mono>
        </Card>
        <Card style={{ flex: 1, padding: 14, display: "flex", flexDirection: "column", alignItems: "center" }}>
          <Label style={{ marginBottom: 8 }}>Split</Label>
          <PieChart width={80} height={80}>
            <Pie data={assetData.map(a => ({ ...a, value: a.val }))} cx={36} cy={36} innerRadius={22} outerRadius={36} dataKey="value" strokeWidth={0}>
              {assetData.map((e, i) => <Cell key={i} fill={e.color} opacity={0.9} />)}
            </Pie>
          </PieChart>
        </Card>
      </div>

      {/* Top mover — dramatic accent card */}
      <Card className="reveal reveal-4" accent="var(--shares)" glow={false} style={{ padding: "14px 16px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <Label style={{ marginBottom: 4 }}>Top Mover</Label>
          <Serif style={{ fontSize: 18, color: "var(--ink)", fontStyle: "italic" }}>Stake Wall St</Serif>
        </div>
        <div style={{ textAlign: "right" }}>
          <Display style={{ fontSize: 28, color: "var(--pos)" }}>+$820</Display>
          <Mono style={{ fontSize: 10, color: "var(--ink2)" }}>USD $530 · +6.6%</Mono>
        </div>
      </Card>

      {/* Accounts — offset, not a list */}
      <Label className="reveal reveal-5" style={{ paddingLeft: 2, marginTop: 4 }}>Accounts</Label>

      {/* Stake group */}
      <div className="reveal reveal-5" style={{ border: "1px solid var(--border)", borderRadius: "2px 12px 12px 2px", borderLeft: "3px solid var(--shares)", overflow: "hidden",
        boxShadow: "0 8px 32px rgba(0,0,0,0.18)" }}>
        <div style={{ padding: "11px 16px", background: "var(--surface2)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <Pip color="var(--shares)" />
            <Mono style={{ fontSize: 12 }}>Stake</Mono>
            <Tag label="Shares" color="var(--shares)" />
          </div>
          <Display style={{ fontSize: 22, color: "var(--shares)" }}>{fmt(stakeTotal)}</Display>
        </div>
        {stakeAccounts.map((a, i) => (
          <div key={a.name} style={{ padding: "9px 16px 9px 26px", borderTop: "1px solid var(--border)", display: "flex", justifyContent: "space-between", alignItems: "center", background: "var(--surface)" }}>
            <div>
              <Mono style={{ fontSize: 11, color: "var(--ink2)" }}>{a.name}</Mono>
              {a.cur === "USD" && <Mono style={{ fontSize: 9, color: "var(--crypto)", display: "block", marginTop: 2 }}>USD ${a.native?.toLocaleString()} · @0.645</Mono>}
            </div>
            <Mono style={{ fontSize: 12, color: "var(--shares)" }}>{fmt(a.bal)}</Mono>
          </div>
        ))}
      </div>

      {rest.map((a, i) => (
        <Card key={a.name} accent={a.overdue ? "var(--neg)" : ASSET_CSS[a.asset]} style={{ padding: "12px 16px", marginLeft: i % 2 === 0 ? 0 : 8 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <div style={{ display: "flex", gap: 6, alignItems: "center", marginBottom: 4 }}>
                <Mono style={{ fontSize: 12, color: a.overdue ? "var(--neg)" : "var(--ink)" }}>{a.name}</Mono>
                <Tag label={a.owner === "H" ? "H" : "W"} color={a.owner === "H" ? "var(--cash)" : "#EC4899"} />
                {a.overdue && <Tag label="DUE" color="var(--neg)" />}
              </div>
              <Mono style={{ fontSize: 9, color: "var(--ink2)" }}>{a.updated}</Mono>
            </div>
            <Display style={{ fontSize: 22, color: a.overdue ? "var(--neg)" : ASSET_CSS[a.asset] }}>{fmt(a.bal)}</Display>
          </div>
        </Card>
      ))}
    </div>
  );
};

// ─── UPDATE FLOW (RPG micro-interactions) ─────────────────────────────────────
// 3 RPG mechanics:
// 1. Progress bar = XP bar (fills with gold glow, pulses on level-up)
// 2. Save = pulse ring expanding (like collecting an orb)
// 3. Completion = confetti burst (quest complete fanfare)
const UpdateFlowScreen = () => {
  const [step, setStep] = useState(0);
  const [mode, setMode] = useState(null);
  const [confirmed, setConfirmed] = useState(false);
  const [done, setDone] = useState(false);
  const [showPulse, setShowPulse] = useState(false);
  const [showBurst, setShowBurst] = useState(false);

  const due = accounts.slice(0, 5);
  const cur = due[step];
  const xpPct = ((step + (confirmed ? 1 : 0)) / due.length) * 100;

  const handleConfirm = () => {
    setShowPulse(true);
    setTimeout(() => setShowPulse(false), 700);
    setConfirmed(true);
  };

  const handleNext = () => {
    if (step < due.length - 1) { setStep(s => s + 1); setMode(null); setConfirmed(false); }
    else {
      setShowBurst(true);
      setTimeout(() => { setShowBurst(false); setDone(true); }, 800);
    }
  };

  if (done) return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100%", gap: 24, textAlign: "center", position: "relative" }}>
      <ConfettiBurst active={true} />
      <Display style={{ fontSize: 52, color: "var(--gold)", display: "block", letterSpacing: "0.04em" }}>LEVEL UP</Display>
      <Serif style={{ fontSize: 16, color: "var(--ink2)", fontStyle: "italic" }}>All accounts reconciled</Serif>
      <Card glow style={{ width: "100%", padding: 22 }}>
        <Label style={{ marginBottom: 12 }}>Weekly snapshot</Label>
        <Display style={{ fontSize: 42, color: "var(--ink)", display: "block" }}>$78,450</Display>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6, marginTop: 8 }}>
          <Pip color="var(--pos)" />
          <Mono style={{ fontSize: 11, color: "var(--pos)" }}>+$1,240 · +1.6%</Mono>
        </div>
        <div style={{ display: "flex", justifyContent: "space-around", marginTop: 18 }}>
          {assetData.map(a => (
            <div key={a.name} style={{ textAlign: "center" }}>
              <Mono style={{ fontSize: 12, color: a.color }}>{fmt(a.val)}</Mono>
              <Label style={{ marginTop: 3 }}>{a.name}</Label>
            </div>
          ))}
        </div>
      </Card>
      <button className="btn-press" onClick={() => { setStep(0); setMode(null); setConfirmed(false); setDone(false); }} style={{
        background: "transparent", border: "1px solid var(--border)", color: "var(--ink2)",
        borderRadius: "1px 8px 8px 1px", padding: "8px 18px",
        fontFamily: "'JetBrains Mono', monospace", fontSize: 10, letterSpacing: "0.1em", cursor: "pointer",
      }}>REPLAY</button>
    </div>
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", gap: 16 }}>
      {/* XP Bar — RPG mechanic #1 */}
      <div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
          <Label>Weekly Sync · XP</Label>
          <Mono style={{ fontSize: 10, color: "var(--gold)" }}>{step + 1}/{due.length}</Mono>
        </div>
        <div style={{ background: "var(--ink3)", borderRadius: 2, height: 4, overflow: "hidden" }}>
          <div style={{
            height: "100%", width: `${xpPct}%`,
            background: "linear-gradient(90deg, var(--gold2), var(--gold))",
            boxShadow: "0 0 10px var(--gold)",
            borderRadius: 2,
            transition: "width 0.5s cubic-bezier(0.16,1,0.3,1)",
          }} />
        </div>
        <div style={{ display: "flex", gap: 4, marginTop: 6 }}>
          {due.map((a, i) => (
            <div key={i} style={{
              flex: 1, height: 2, borderRadius: 1,
              background: i < step ? ASSET_CSS[a.asset] : i === step ? "var(--ink)" : "var(--ink3)",
              opacity: i < step ? 0.7 : 1,
              transition: "background 0.4s",
            }} />
          ))}
        </div>
      </div>

      {/* Current account */}
      <Card accent={ASSET_CSS[cur.asset]} style={{ padding: 18 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            <div style={{ display: "flex", gap: 6, marginBottom: 10 }}>
              <Tag label={cur.asset} color={ASSET_CSS[cur.asset]} />
              {cur.cur === "USD" && <Tag label="USD" color="var(--crypto)" />}
              <Tag label={cur.owner} color={cur.owner === "H" ? "var(--cash)" : "#EC4899"} />
            </div>
            <Serif style={{ fontSize: 22, color: "var(--ink)", display: "block" }}>{cur.name}</Serif>
            <div style={{ display: "flex", gap: 6, alignItems: "center", marginTop: 6 }}>
              <Mono style={{ fontSize: 10, color: "var(--ink2)" }}>Last:</Mono>
              <Mono style={{ fontSize: 11, color: ASSET_CSS[cur.asset] }}>{fmt(cur.bal)}</Mono>
              {cur.cur === "USD" && <Mono style={{ fontSize: 10, color: "var(--crypto)" }}>/ USD ${cur.native?.toLocaleString()}</Mono>}
            </div>
          </div>
        </div>
      </Card>

      {/* Action choices */}
      {!mode && (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {[
            { label: "SCREENSHOT →", sub: cur.cur === "USD" ? "AI reads USD · converts to AUD" : "AI extracts balance", action: "screenshot", primary: true },
            { label: "MANUAL ENTRY", sub: cur.cur === "USD" ? "Enter USD — AUD shown live" : "Type balance directly", action: "manual", primary: false },
          ].map(opt => (
            <button key={opt.action} onClick={() => setMode(opt.action)} className="btn-press" style={{
              background: opt.primary ? "rgba(255,210,74,0.08)" : "transparent",
              border: `1px solid ${opt.primary ? "var(--gold)" : "var(--border)"}`,
              borderRadius: "1px 10px 10px 1px", padding: "14px 16px",
              textAlign: "left", cursor: "pointer", display: "flex", flexDirection: "column", gap: 3,
            }}>
              <Mono style={{ fontSize: 11, color: opt.primary ? "var(--gold)" : "var(--ink)", letterSpacing: "0.06em" }}>{opt.label}</Mono>
              <Mono style={{ fontSize: 10, color: "var(--ink2)" }}>{opt.sub}</Mono>
            </button>
          ))}
          <button onClick={handleNext} className="btn-press" style={{
            background: "transparent", border: "none", color: "var(--ink2)",
            fontFamily: "'JetBrains Mono', monospace", fontSize: 10, letterSpacing: "0.1em",
            cursor: "pointer", padding: "6px 0", textAlign: "left",
          }}>SKIP · carry forward →</button>
        </div>
      )}

      {mode === "screenshot" && !confirmed && (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <div style={{
            background: "rgba(240,236,232,0.02)", border: "1px dashed var(--border)",
            borderRadius: "2px 12px 12px 2px", padding: 32, textAlign: "center",
          }}>
            <Display style={{ fontSize: 32, color: "var(--ink2)", display: "block" }}>↑</Display>
            <Mono style={{ fontSize: 11, color: "var(--ink2)", display: "block", marginTop: 8 }}>Upload screenshot</Mono>
          </div>
          <Card style={{ padding: 16 }}>
            <Label style={{ marginBottom: 10 }}>AI Extracted</Label>
            {cur.cur === "USD" ? (
              <>
                <Display style={{ fontSize: 28, color: "var(--crypto)", display: "block" }}>USD $8,530</Display>
                <Display style={{ fontSize: 22, color: "var(--shares)", display: "block", marginTop: 4 }}>≈ AUD $13,225</Display>
                <Mono style={{ fontSize: 9, color: "var(--ink2)", display: "block", marginTop: 4 }}>@ AUD/USD 0.645</Mono>
              </>
            ) : (
              <Display style={{ fontSize: 32, color: "var(--ink)", display: "block" }}>$8,641.20</Display>
            )}
            <Mono style={{ fontSize: 10, color: "var(--ink2)", display: "block", marginTop: 8 }}>Correct?</Mono>
            <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
              <button onClick={handleConfirm} className="btn-press" style={{
                flex: 2, background: "rgba(125,214,138,0.1)", border: "1px solid var(--pos)",
                borderRadius: "1px 8px 8px 1px", padding: "10px",
                fontFamily: "'Bebas Neue', sans-serif", fontSize: 16, letterSpacing: "0.08em",
                color: "var(--pos)", cursor: "pointer",
              }}>CONFIRM</button>
              <button className="btn-press" style={{
                flex: 1, background: "transparent", border: "1px solid var(--border)",
                borderRadius: "1px 8px 8px 1px", padding: "10px",
                fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: "var(--ink2)", cursor: "pointer",
              }}>Edit</button>
            </div>
          </Card>
        </div>
      )}

      {mode === "manual" && !confirmed && (
        <Card style={{ padding: 18 }}>
          <Label style={{ marginBottom: 8 }}>Balance {cur.cur === "USD" ? "· USD" : "· AUD"}</Label>
          <div style={{
            background: "rgba(240,236,232,0.03)", border: "1px solid var(--border2)",
            borderRadius: "1px 8px 8px 1px", padding: "12px 14px",
            fontFamily: "'Bebas Neue', sans-serif", fontSize: 28,
            color: cur.cur === "USD" ? "var(--crypto)" : "var(--ink)",
            marginBottom: cur.cur === "USD" ? 8 : 12,
          }}>
            {cur.cur === "USD" ? "USD $8,530" : "$8,641.20"}
          </div>
          {cur.cur === "USD" && (
            <div style={{
              background: "rgba(143,212,154,0.06)", border: "1px solid rgba(143,212,154,0.2)",
              borderRadius: "1px 8px 8px 1px", padding: "10px 14px", marginBottom: 12,
            }}>
              <Label style={{ marginBottom: 4 }}>AUD equivalent</Label>
              <Display style={{ fontSize: 22, color: "var(--shares)", display: "block" }}>≈ $13,225</Display>
              <Mono style={{ fontSize: 9, color: "var(--ink2)", display: "block", marginTop: 3 }}>@ 0.645 · LIVE</Mono>
            </div>
          )}
          <div style={{ background: "rgba(240,236,232,0.02)", border: "1px solid var(--border)", borderRadius: "1px 8px 8px 1px", padding: "9px 12px", marginBottom: 12 }}>
            <Mono style={{ fontSize: 11, color: "var(--ink2)" }}>Note (optional)</Mono>
          </div>
          <button onClick={handleConfirm} className="btn-press" style={{
            width: "100%", background: "rgba(240,236,232,0.06)", border: "1px solid var(--border2)",
            borderRadius: "1px 8px 8px 1px", padding: "12px",
            fontFamily: "'Bebas Neue', sans-serif", fontSize: 18, letterSpacing: "0.1em",
            color: "var(--ink)", cursor: "pointer",
          }}>SAVE</button>
        </Card>
      )}

      {/* RPG mechanic #2 — pulse ring on save (orb collect) */}
      {confirmed && (
        <div style={{ display: "flex", flexDirection: "column", gap: 14, alignItems: "center", paddingTop: 16 }}>
          <div style={{ position: "relative", width: 48, height: 48, display: "flex", alignItems: "center", justifyContent: "center" }}>
            {showPulse && <div className="pulse-ring" />}
            <Display style={{ fontSize: 36, color: "var(--pos)" }}>✓</Display>
          </div>
          <Serif style={{ fontSize: 14, color: "var(--ink2)", fontStyle: "italic" }}>Balance recorded</Serif>
          <button onClick={handleNext} className="btn-press" style={{
            background: "rgba(255,210,74,0.08)", border: "1px solid var(--gold)",
            borderRadius: "1px 10px 10px 1px", padding: "10px 24px",
            fontFamily: "'Bebas Neue', sans-serif", fontSize: 18, letterSpacing: "0.1em",
            color: "var(--gold)", cursor: "pointer",
          }}>NEXT →</button>
        </div>
      )}
    </div>
  );
};

// ─── TREND ────────────────────────────────────────────────────────────────────
const TrendScreen = () => {
  const [range, setRange] = useState("6M");
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16, height: "100%", overflowY: "auto" }}>
      <div style={{ paddingLeft: 2 }}>
        <Label>Wealth Trajectory</Label>
        <Display style={{ fontSize: 42, color: "var(--ink)", display: "block", marginTop: 4 }}>$78,450</Display>
        <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 6 }}>
          <Pip color="var(--pos)" />
          <Mono style={{ fontSize: 10, color: "var(--pos)" }}>↑ $17,450 · +28.6% this year</Mono>
        </div>
      </div>

      <div style={{ display: "flex", gap: 4 }}>
        {["1M","3M","6M","1Y","All"].map(r => (
          <button key={r} onClick={() => setRange(r)} className="btn-press" style={{
            fontFamily: "'JetBrains Mono', monospace", fontSize: 10, padding: "4px 10px",
            border: "1px solid var(--border)", borderRadius: "1px 6px 6px 1px",
            background: range === r ? "var(--gold)" : "transparent",
            color: range === r ? "#080608" : "var(--ink2)", cursor: "pointer",
            letterSpacing: "0.06em",
          }}>{r}</button>
        ))}
      </div>

      <Card style={{ padding: "16px 14px 10px" }}>
        <Label style={{ marginBottom: 10 }}>Total (AUD)</Label>
        <ResponsiveContainer width="100%" height={160}>
          <LineChart data={nwData}>
            <XAxis dataKey="m" tick={{ fill: "#7A7069", fontSize: 10, fontFamily: "JetBrains Mono" }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: "#7A7069", fontSize: 10, fontFamily: "JetBrains Mono" }} axisLine={false} tickLine={false} tickFormatter={v => "$" + (v/1000) + "k"} />
            <Tooltip content={<ChartTip />} />
            <Line type="monotone" dataKey="v" stroke="var(--gold)" strokeWidth={2} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </Card>

      <Card style={{ padding: "16px 14px 10px", marginLeft: 10 }}>
        <Label style={{ marginBottom: 10 }}>By Asset Class</Label>
        <ResponsiveContainer width="100%" height={130}>
          <LineChart data={nwData}>
            <XAxis dataKey="m" tick={{ fill: "#7A7069", fontSize: 10, fontFamily: "JetBrains Mono" }} axisLine={false} tickLine={false} />
            <Tooltip content={<ChartTip />} />
            {[["v","var(--cash)"],["v","var(--shares)"],["v","var(--crypto)"]].map(([k,c],i) => (
              <Line key={i} type="monotone" dataKey={k} stroke={c} strokeWidth={1.5} dot={false} strokeDasharray={i === 0 ? "" : i === 1 ? "4 2" : "2 2"} strokeOpacity={0.8} />
            ))}
          </LineChart>
        </ResponsiveContainer>
        <div style={{ display: "flex", gap: 14, marginTop: 10 }}>
          {[["Cash","var(--cash)"],["Shares","var(--shares)"],["Crypto","var(--crypto)"],["Super","var(--super)"]].map(([n,c]) => (
            <div key={n} style={{ display: "flex", gap: 5, alignItems: "center" }}>
              <Pip color={c} />
              <Label>{n}</Label>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
};

// ─── MILESTONES (RPG mechanic #3 — XP goal bar with animated fill) ────────────
const MilestonesScreen = () => {
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setTimeout(() => setMounted(true), 100); }, []);
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16, height: "100%", overflowY: "auto" }}>
      <div style={{ paddingLeft: 2 }}>
        <Label>Quest Progress</Label>
        <Display style={{ fontSize: 38, color: "var(--ink)", display: "block", marginTop: 4 }}>MILESTONES</Display>
      </div>

      {/* XP-style goal card */}
      <Card glow style={{ padding: 22 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
          <div>
            <Label style={{ marginBottom: 6 }}>Active Quest</Label>
            <Serif style={{ fontSize: 20, color: "var(--ink)", display: "block", fontStyle: "italic" }}>First $100,000</Serif>
            <Mono style={{ fontSize: 10, color: "var(--ink2)", marginTop: 4, display: "block" }}>Est. November 2026</Mono>
          </div>
          <Display style={{ fontSize: 28, color: "var(--gold)" }}>78%</Display>
        </div>
        {/* Animated XP bar */}
        <div style={{ background: "var(--ink3)", borderRadius: 3, height: 6, overflow: "hidden", marginBottom: 6 }}>
          <div style={{
            height: "100%",
            width: mounted ? "78.45%" : "0%",
            background: "linear-gradient(90deg, var(--gold2), var(--gold))",
            boxShadow: "0 0 14px var(--gold)",
            borderRadius: 3,
            transition: "width 1.2s cubic-bezier(0.16,1,0.3,1)",
          }} />
        </div>
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <Mono style={{ fontSize: 10, color: "var(--gold)" }}>$78,450</Mono>
          <Mono style={{ fontSize: 10, color: "var(--ink2)" }}>$21,550 to go</Mono>
        </div>
      </Card>

      <Card style={{ padding: 18, marginLeft: 8 }}>
        <Label style={{ marginBottom: 14 }}>Projections</Label>
        <div style={{ display: "flex", justifyContent: "space-around" }}>
          {[["6 mo","$89,200"],["1 yr","$97,800"],["3 yr","$142,000"]].map(([t,v]) => (
            <div key={t} style={{ textAlign: "center" }}>
              <Display style={{ fontSize: 22, color: "var(--shares)", display: "block" }}>{v}</Display>
              <Label style={{ marginTop: 4 }}>{t}</Label>
            </div>
          ))}
        </div>
      </Card>

      <Label style={{ paddingLeft: 2 }}>Completed Quests</Label>
      {[["$75,000","May 2026","✦"],["$50,000","Jan 2026","✦"],["$25,000","Aug 2025","✦"]].map(([amt,date,icon],i) => (
        <Card key={i} style={{ padding: "14px 16px", display: "flex", justifyContent: "space-between", alignItems: "center", marginLeft: i * 6 }}>
          <div>
            <Display style={{ fontSize: 26, color: "var(--gold)", display: "block" }}>{amt}</Display>
            <Mono style={{ fontSize: 10, color: "var(--ink2)", marginTop: 3 }}>{date}</Mono>
          </div>
          <Mono style={{ fontSize: 16, color: "var(--gold)", opacity: 0.5 }}>{icon}</Mono>
        </Card>
      ))}

      <button className="btn-press" style={{
        background: "transparent", border: "1px dashed var(--border)",
        borderRadius: "1px 10px 10px 1px", padding: "12px 16px",
        fontFamily: "'JetBrains Mono', monospace", fontSize: 10, letterSpacing: "0.1em",
        color: "var(--ink2)", cursor: "pointer", textAlign: "left",
      }}>+ NEW QUEST</button>
    </div>
  );
};

// ─── ADMIN ────────────────────────────────────────────────────────────────────
const AdminScreen = () => (
  <div style={{ display: "flex", flexDirection: "column", gap: 14, height: "100%", overflowY: "auto" }}>
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
      <div>
        <Label>Configuration</Label>
        <Display style={{ fontSize: 32, color: "var(--ink)", display: "block", marginTop: 4 }}>ACCOUNTS</Display>
      </div>
      <button className="btn-press" style={{
        background: "rgba(255,210,74,0.08)", border: "1px solid var(--gold)",
        borderRadius: "1px 8px 8px 1px", padding: "6px 14px",
        fontFamily: "'Bebas Neue', sans-serif", fontSize: 16, letterSpacing: "0.08em",
        color: "var(--gold)", cursor: "pointer", marginBottom: 4,
      }}>+ ADD</button>
    </div>

    <Card glow style={{ padding: 18 }}>
      <Label style={{ marginBottom: 14 }}>New Account</Label>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {[["Name","e.g. Stake Wall St"],["Institution","e.g. Stake"]].map(([l,p]) => (
          <div key={l}>
            <Label style={{ marginBottom: 5 }}>{l}</Label>
            <div style={{ background: "rgba(240,236,232,0.03)", border: "1px solid var(--border)", borderRadius: "1px 7px 7px 1px", padding: "8px 12px", fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: "var(--ink2)" }}>{p}</div>
          </div>
        ))}
        <div style={{ display: "flex", gap: 8 }}>
          {[["Owner","Husband ▾"],["Asset","Shares ▾"]].map(([l,v]) => (
            <div key={l} style={{ flex: 1 }}>
              <Label style={{ marginBottom: 5 }}>{l}</Label>
              <div style={{ background: "rgba(240,236,232,0.03)", border: "1px solid var(--border)", borderRadius: "1px 7px 7px 1px", padding: "8px 10px", fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: "var(--ink)" }}>{v}</div>
            </div>
          ))}
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          {[["Currency","USD ▾","var(--crypto)"],["Frequency","Fortnightly ▾",null]].map(([l,v,c]) => (
            <div key={l} style={{ flex: 1 }}>
              <Label style={{ marginBottom: 5 }}>{l}</Label>
              <div style={{ background: "rgba(240,236,232,0.03)", border: `1px solid ${c ? "rgba(185,160,232,0.4)" : "var(--border)"}`, borderRadius: "1px 7px 7px 1px", padding: "8px 10px", fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: c || "var(--ink)" }}>{v}</div>
            </div>
          ))}
        </div>
        <div>
          <Label style={{ marginBottom: 5 }}>Group</Label>
          <div style={{ background: "rgba(240,236,232,0.03)", border: "1px solid var(--border)", borderRadius: "1px 7px 7px 1px", padding: "8px 12px", fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: "var(--ink)" }}>Stake</div>
          <Mono style={{ fontSize: 9, color: "var(--ink2)", display: "block", marginTop: 4 }}>Accounts in the same group appear together on dashboard</Mono>
        </div>
      </div>
    </Card>

    <Label style={{ paddingLeft: 2, marginTop: 4 }}>All Accounts</Label>
    {accounts.slice(0, 7).map((a, i) => (
      <Card key={a.name} accent={ASSET_CSS[a.asset]} style={{ padding: "12px 16px", marginLeft: i % 3 === 0 ? 0 : i % 3 === 1 ? 8 : 4 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <div style={{ display: "flex", gap: 6, alignItems: "center", marginBottom: 5 }}>
              <Serif style={{ fontSize: 14, color: "var(--ink)" }}>{a.name}</Serif>
              <Tag label={a.owner} color={a.owner === "H" ? "var(--cash)" : "#EC4899"} />
              {a.cur === "USD" && <Tag label="USD" color="var(--crypto)" />}
            </div>
            <Tag label={a.asset} color={ASSET_CSS[a.asset]} />
          </div>
          <div style={{ display: "flex", gap: 6 }}>
            <button className="btn-press" style={{ background: "transparent", border: "1px solid var(--border)", color: "var(--ink2)", borderRadius: "1px 6px 6px 1px", padding: "4px 9px", fontFamily: "'JetBrains Mono', monospace", fontSize: 9, letterSpacing: "0.08em", cursor: "pointer" }}>EDIT</button>
            <button className="btn-press" style={{ background: "transparent", border: "1px solid rgba(232,112,112,0.3)", color: "var(--neg)", borderRadius: "1px 6px 6px 1px", padding: "4px 8px", fontFamily: "'JetBrains Mono', monospace", fontSize: 10, cursor: "pointer" }}>✕</button>
          </div>
        </div>
      </Card>
    ))}
  </div>
);

// ─── SHELL ────────────────────────────────────────────────────────────────────
const SCREENS = ["Login","Dashboard","Update Flow","Trend","Milestones","Admin"];
const NAV = [
  { icon: "◈", label: "HOME",    screen: "Dashboard"   },
  { icon: "↻", label: "SYNC",    screen: "Update Flow" },
  { icon: "∿", label: "TREND",   screen: "Trend"       },
  { icon: "◎", label: "QUESTS",  screen: "Milestones"  },
  { icon: "⊞", label: "CONFIG",  screen: "Admin"       },
];

export default function App() {
  const [screen, setScreen] = useState("Login");
  const [filter, setFilter] = useState("All");
  const [theme, setTheme] = useState("dark");

  const render = () => {
    switch (screen) {
      case "Login":       return <LoginScreen />;
      case "Dashboard":   return <DashboardScreen filter={filter} setFilter={setFilter} />;
      case "Update Flow": return <UpdateFlowScreen />;
      case "Trend":       return <TrendScreen />;
      case "Milestones":  return <MilestonesScreen />;
      case "Admin":       return <AdminScreen />;
      default:            return <DashboardScreen filter={filter} setFilter={setFilter} />;
    }
  };

  return (
    <div className="vault-root" data-theme={theme}>
      <StyleInject />
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "100vh", padding: 20 }}>

        {/* Top controls row */}
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20, flexWrap: "wrap", justifyContent: "center" }}>
          {/* Screen nav */}
          <div style={{ display: "flex", gap: 5, flexWrap: "wrap", justifyContent: "center" }}>
            {SCREENS.map(s => (
              <button key={s} onClick={() => setScreen(s)} className="btn-press" style={{
                fontFamily: "'JetBrains Mono', monospace", fontSize: 9, padding: "4px 11px",
                borderRadius: "1px 16px 16px 1px", letterSpacing: "0.1em",
                border: `1px solid ${screen === s ? "var(--gold)" : "var(--border)"}`,
                background: screen === s ? "rgba(255,210,74,0.1)" : "transparent",
                color: screen === s ? "var(--gold)" : "var(--ink2)", cursor: "pointer",
              }}>{s.toUpperCase()}</button>
            ))}
          </div>

          {/* Theme toggle */}
          <button
            onClick={() => setTheme(t => t === "dark" ? "light" : "dark")}
            className="btn-press"
            style={{
              fontFamily: "'JetBrains Mono', monospace", fontSize: 9, padding: "4px 12px",
              borderRadius: "1px 16px 16px 1px", letterSpacing: "0.1em",
              border: "1px solid var(--border2)",
              background: "var(--surface2)",
              color: "var(--ink)", cursor: "pointer",
              display: "flex", alignItems: "center", gap: 6, whiteSpace: "nowrap",
            }}
          >
            <span style={{ fontSize: 12 }}>{theme === "dark" ? "☀" : "◑"}</span>
            {theme === "dark" ? "LIGHT" : "DARK"}
          </button>
        </div>

        {/* Phone frame */}
        <div style={{
          width: 375,
          background: "var(--bg)",
          borderRadius: 44,
          border: "1.5px solid var(--border2)",
          overflow: "hidden",
          boxShadow: theme === "dark"
            ? "0 0 0 1px rgba(255,210,74,0.04), 0 48px 96px rgba(0,0,0,0.85), inset 0 1px 0 rgba(255,255,255,0.05)"
            : "0 0 0 1px rgba(180,120,0,0.06), 0 48px 96px rgba(0,0,0,0.18), inset 0 1px 0 rgba(255,255,255,0.8)",
          position: "relative",
        }}>
          {/* Subtle top accent line */}
          <div style={{ position: "absolute", top: 0, left: "20%", right: "20%", height: 1, background: "linear-gradient(90deg, transparent, var(--gold), transparent)", opacity: 0.35 }} />

          {/* Status bar */}
          <div style={{ padding: "13px 24px 8px", display: "flex", justifyContent: "space-between" }}>
            <Mono style={{ fontSize: 11, color: "var(--ink2)" }}>9:41</Mono>
            <div style={{ width: 72, height: 7, background: "var(--ink3)", borderRadius: 4 }} />
            <Mono style={{ fontSize: 11, color: "var(--ink2)" }}>●●●</Mono>
          </div>

          {/* App bar */}
          {screen !== "Login" && (
            <div style={{ padding: "10px 20px 10px", display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid var(--border)" }}>
              <Display style={{ fontSize: 22, letterSpacing: "0.12em", color: "var(--ink)" }}>VAULTED</Display>
              <Mono style={{ fontSize: 9, color: "var(--ink2)", letterSpacing: "0.1em" }}>AUD</Mono>
            </div>
          )}

          {/* Content */}
          <div style={{ padding: 16, height: 560, overflowY: "auto" }}>
            {render()}
          </div>

          {/* Bottom nav */}
          {screen !== "Login" && (
            <div style={{ borderTop: "1px solid var(--border)", padding: "10px 0 14px", display: "flex", justifyContent: "space-around" }}>
              {NAV.map(n => (
                <button key={n.label} onClick={() => setScreen(n.screen)} className="btn-press" style={{
                  background: "none", border: "none", cursor: "pointer",
                  display: "flex", flexDirection: "column", alignItems: "center", gap: 3,
                }}>
                  <span style={{ fontSize: 15, color: screen === n.screen ? "var(--gold)" : "var(--ink2)" }}>{n.icon}</span>
                  <Mono style={{ fontSize: 8, color: screen === n.screen ? "var(--gold)" : "var(--ink2)", letterSpacing: "0.1em" }}>{n.label}</Mono>
                </button>
              ))}
            </div>
          )}
        </div>

        <Mono style={{ marginTop: 16, fontSize: 9, color: "var(--ink2)", letterSpacing: "0.12em", textAlign: "center" }}>
          TAP SCREENS ABOVE · TRY UPDATE FLOW FOR RPG INTERACTIONS
        </Mono>
      </div>
    </div>
  );
}
