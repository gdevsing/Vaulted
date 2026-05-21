import { useState } from "react";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";

const COLORS = {
  cash: "#3B82F6",
  shares: "#22C55E",
  crypto: "#A855F7",
  super: "#F97316",
  gold: "#EAB308",
  red: "#EF4444",
  bg: "#0A0A0F",
  card: "#13131A",
  border: "#1E1E2E",
  text: "#E2E8F0",
  muted: "#64748B",
};

const screens = ["Login", "Dashboard", "Update Flow", "Stake (FX)", "Trend Chart", "Account Detail", "Admin Panel", "Milestones"];

const netWorthData = [
  { month: "Jul", value: 61000 },
  { month: "Aug", value: 63500 },
  { month: "Sep", value: 62000 },
  { month: "Oct", value: 65800 },
  { month: "Nov", value: 67200 },
  { month: "Dec", value: 68900 },
  { month: "Jan", value: 71200 },
  { month: "Feb", value: 73800 },
  { month: "Mar", value: 75100 },
  { month: "Apr", value: 74200 },
  { month: "May", value: 78450 },
];

const assetData = [
  { name: "Cash", value: 28200, color: COLORS.cash },
  { name: "Shares", value: 32100, color: COLORS.shares },
  { name: "Crypto", value: 8950, color: COLORS.crypto },
  { name: "Super", value: 9200, color: COLORS.super },
];

const accounts = [
  { name: "Up Bank", owner: "H", asset: "cash", balance: 8200, balanceNative: null, currency: "AUD", updated: "today", color: COLORS.cash },
  { name: "NAB Everyday", owner: "H", asset: "cash", balance: 6400, balanceNative: null, currency: "AUD", updated: "today", color: COLORS.cash },
  { name: "ANZ Savings", owner: "H", asset: "cash", balance: 7100, balanceNative: null, currency: "AUD", updated: "today", color: COLORS.cash },
  { name: "ING Orange", owner: "H", asset: "cash", balance: 6500, balanceNative: null, currency: "AUD", updated: "3 days ago", color: COLORS.cash },
  { name: "Stake ASX", owner: "H", asset: "shares", balance: 9800, balanceNative: null, currency: "AUD", updated: "today", color: COLORS.shares, group: "Stake" },
  { name: "Stake Wall St", owner: "H", asset: "shares", balance: 13220, balanceNative: 8530, currency: "USD", updated: "today", color: COLORS.shares, group: "Stake" },
  { name: "Spaceship", owner: "H", asset: "shares", balance: 9080, balanceNative: null, currency: "AUD", updated: "2 weeks ago", color: COLORS.shares, overdue: true },
  { name: "Swyftx", owner: "H", asset: "crypto", balance: 8950, balanceNative: null, currency: "AUD", updated: "today", color: COLORS.crypto },
  { name: "Husband Super", owner: "H", asset: "super", balance: 5100, balanceNative: null, currency: "AUD", updated: "1 month ago", color: COLORS.super },
  { name: "Wife Super", owner: "W", asset: "super", balance: 4100, balanceNative: null, currency: "AUD", updated: "1 month ago", color: COLORS.super },
];

const fmt = (n) => "$" + n.toLocaleString();
const FX_RATE = 0.645;

// ─── Shared components ───────────────────────────────────────────────────────

const Card = ({ children, style = {} }) => (
  <div style={{ background: COLORS.card, border: `1px solid ${COLORS.border}`, borderRadius: 16, padding: 20, ...style }}>
    {children}
  </div>
);

const Tag = ({ label, color }) => (
  <span style={{ background: color + "22", color, fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 20, textTransform: "uppercase", letterSpacing: 1 }}>
    {label}
  </span>
);

const OwnerBadge = ({ owner }) => (
  <span style={{ background: owner === "H" ? "#3B82F622" : "#EC489922", color: owner === "H" ? "#3B82F6" : "#EC4899", fontSize: 10, fontWeight: 700, padding: "2px 6px", borderRadius: 8 }}>
    {owner === "H" ? "Husband" : "Wife"}
  </span>
);

const FXBadge = () => (
  <span style={{ background: "#EAB30822", color: COLORS.gold, fontSize: 10, fontWeight: 700, padding: "2px 6px", borderRadius: 8 }}>
    USD
  </span>
);

// ─── Screens ─────────────────────────────────────────────────────────────────

const LoginScreen = () => (
  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100%", gap: 32 }}>
    <div style={{ textAlign: "center" }}>
      <div style={{ fontSize: 40, marginBottom: 8 }}>🔐</div>
      <div style={{ fontSize: 28, fontWeight: 800, color: COLORS.gold, letterSpacing: -1 }}>Vaulted</div>
      <div style={{ color: COLORS.muted, fontSize: 13, marginTop: 4 }}>Your wealth, locked in.</div>
    </div>
    <Card style={{ width: "100%", maxWidth: 340, padding: 28 }}>
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <div>
          <label style={{ fontSize: 11, color: COLORS.muted, textTransform: "uppercase", letterSpacing: 1, display: "block", marginBottom: 6 }}>Username</label>
          <div style={{ background: COLORS.bg, border: `1px solid ${COLORS.border}`, borderRadius: 10, padding: "10px 14px", color: COLORS.text, fontSize: 14 }}>household</div>
        </div>
        <div>
          <label style={{ fontSize: 11, color: COLORS.muted, textTransform: "uppercase", letterSpacing: 1, display: "block", marginBottom: 6 }}>Password</label>
          <div style={{ background: COLORS.bg, border: `1px solid ${COLORS.border}`, borderRadius: 10, padding: "10px 14px", color: COLORS.muted, fontSize: 14 }}>••••••••••</div>
        </div>
        <div style={{ background: COLORS.gold, borderRadius: 10, padding: "12px", textAlign: "center", fontWeight: 700, color: "#0A0A0F", fontSize: 14, marginTop: 4 }}>
          Sign In
        </div>
      </div>
    </Card>
    <div style={{ fontSize: 11, color: COLORS.muted }}>🔒 Secured with HTTPS · Personal use only</div>
  </div>
);

const DashboardScreen = ({ filter, setFilter }) => {
  const total = 78450;
  const filtered = filter === "Combined" ? accounts : accounts.filter(a => filter === "Husband" ? a.owner === "H" : a.owner === "W");
  const stakeAccounts = filtered.filter(a => a.group === "Stake");
  const stakeTotal = stakeAccounts.reduce((s, a) => s + a.balance, 0);
  const nonStake = filtered.filter(a => a.group !== "Stake");

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16, overflowY: "auto", height: "100%", paddingBottom: 8 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ fontSize: 16, fontWeight: 800, color: COLORS.text }}>Dashboard</div>
        <div style={{ display: "flex", gap: 6 }}>
          {["Combined", "Husband", "Wife"].map(f => (
            <button key={f} onClick={() => setFilter(f)}
              style={{ fontSize: 11, padding: "4px 10px", borderRadius: 20, border: `1px solid ${filter === f ? COLORS.gold : COLORS.border}`, cursor: "pointer", fontWeight: 600,
                background: filter === f ? COLORS.gold : "transparent", color: filter === f ? "#0A0A0F" : COLORS.muted }}>
              {f}
            </button>
          ))}
        </div>
      </div>

      <Card style={{ background: "linear-gradient(135deg, #13131A 0%, #1A1500 100%)", textAlign: "center", padding: 28 }}>
        <div style={{ fontSize: 11, color: COLORS.muted, textTransform: "uppercase", letterSpacing: 2, marginBottom: 8 }}>Total Net Worth (AUD)</div>
        <div style={{ fontSize: 42, fontWeight: 900, color: COLORS.gold, letterSpacing: -2 }}>{fmt(total)}</div>
        <div style={{ color: "#22C55E", fontSize: 13, marginTop: 8, fontWeight: 600 }}>▲ $1,240 this week · +1.6%</div>
        <div style={{ display: "flex", justifyContent: "center", gap: 20, marginTop: 16 }}>
          {assetData.map(a => (
            <div key={a.name} style={{ textAlign: "center" }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: a.color }}>{fmt(a.value)}</div>
              <div style={{ fontSize: 10, color: COLORS.muted }}>{a.name}</div>
            </div>
          ))}
        </div>
        <div style={{ marginTop: 12, fontSize: 10, color: COLORS.muted }}>AUD/USD 0.645 · updated today</div>
      </Card>

      <div style={{ display: "flex", gap: 12 }}>
        <Card style={{ flex: 1, padding: 16 }}>
          <div style={{ fontSize: 11, color: COLORS.muted, marginBottom: 8, textTransform: "uppercase", letterSpacing: 1 }}>Allocation</div>
          <PieChart width={110} height={110}>
            <Pie data={assetData} cx={50} cy={50} innerRadius={32} outerRadius={50} dataKey="value" strokeWidth={0}>
              {assetData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
            </Pie>
          </PieChart>
          <div style={{ display: "flex", flexDirection: "column", gap: 4, marginTop: 4 }}>
            {assetData.map(a => (
              <div key={a.name} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <div style={{ width: 8, height: 8, borderRadius: 2, background: a.color }} />
                <span style={{ fontSize: 11, color: COLORS.muted, flex: 1 }}>{a.name}</span>
                <span style={{ fontSize: 11, color: COLORS.text, fontWeight: 600 }}>{Math.round(a.value / total * 100)}%</span>
              </div>
            ))}
          </div>
        </Card>
        <Card style={{ flex: 1, padding: 16 }}>
          <div style={{ fontSize: 11, color: COLORS.muted, marginBottom: 12, textTransform: "uppercase", letterSpacing: 1 }}>🏆 Biggest Mover</div>
          <div style={{ color: COLORS.shares, fontSize: 16, fontWeight: 800 }}>Stake Wall St</div>
          <div style={{ color: "#22C55E", fontSize: 13, fontWeight: 700, marginTop: 4 }}>▲ $820 AUD</div>
          <div style={{ color: COLORS.muted, fontSize: 11 }}>+6.6% · USD $530</div>
          <div style={{ marginTop: 12, borderTop: `1px solid ${COLORS.border}`, paddingTop: 10 }}>
            <div style={{ fontSize: 11, color: COLORS.muted, marginBottom: 4 }}>⚠️ Overdue</div>
            <div style={{ color: COLORS.red, fontSize: 12, fontWeight: 600 }}>Spaceship</div>
            <div style={{ color: COLORS.muted, fontSize: 11 }}>2 weeks ago</div>
          </div>
        </Card>
      </div>

      <Card style={{ padding: 16 }}>
        <div style={{ fontSize: 11, color: COLORS.muted, marginBottom: 8, textTransform: "uppercase", letterSpacing: 1 }}>Net Worth Trend (AUD)</div>
        <ResponsiveContainer width="100%" height={80}>
          <LineChart data={netWorthData}>
            <Line type="monotone" dataKey="value" stroke={COLORS.gold} strokeWidth={2} dot={false} />
            <Tooltip formatter={(v) => fmt(v)} contentStyle={{ background: COLORS.card, border: `1px solid ${COLORS.border}`, borderRadius: 8, fontSize: 12 }} />
          </LineChart>
        </ResponsiveContainer>
      </Card>

      <div style={{ fontSize: 11, color: COLORS.muted, textTransform: "uppercase", letterSpacing: 1 }}>Accounts</div>

      {/* Stake grouped card */}
      {stakeAccounts.length > 0 && (
        <Card style={{ padding: 0, overflow: "hidden", borderLeft: `3px solid ${COLORS.shares}` }}>
          <div style={{ padding: "10px 16px", borderBottom: `1px solid ${COLORS.border}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontSize: 13, fontWeight: 800, color: COLORS.shares }}>Stake</span>
              <Tag label="Shares" color={COLORS.shares} />
              <OwnerBadge owner="H" />
            </div>
            <span style={{ fontSize: 15, fontWeight: 800, color: COLORS.shares }}>{fmt(stakeTotal)}</span>
          </div>
          {stakeAccounts.map(a => (
            <div key={a.name} style={{ padding: "8px 16px 8px 24px", borderBottom: `1px solid ${COLORS.border}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <div style={{ fontSize: 12, fontWeight: 600, color: COLORS.text }}>{a.name}</div>
                <div style={{ fontSize: 10, color: COLORS.muted }}>Updated {a.updated}</div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: COLORS.shares }}>{fmt(a.balance)} AUD</div>
                {a.currency === "USD" && <div style={{ fontSize: 10, color: COLORS.gold }}>USD ${a.balanceNative?.toLocaleString()} · @{FX_RATE}</div>}
              </div>
            </div>
          ))}
        </Card>
      )}

      {nonStake.map(a => (
        <Card key={a.name} style={{ padding: "12px 16px", borderLeft: `3px solid ${a.overdue ? COLORS.red : a.color}` }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 3 }}>
                <span style={{ fontSize: 13, fontWeight: 700, color: a.overdue ? COLORS.red : COLORS.text }}>{a.name}</span>
                <OwnerBadge owner={a.owner} />
                {a.overdue && <Tag label="Overdue" color={COLORS.red} />}
              </div>
              <div style={{ fontSize: 11, color: COLORS.muted }}>Updated {a.updated}</div>
            </div>
            <div style={{ fontSize: 16, fontWeight: 800, color: a.color }}>{fmt(a.balance)}</div>
          </div>
        </Card>
      ))}
      <div style={{ fontSize: 10, color: COLORS.muted, textAlign: "center" }}>All values in AUD · FX rates updated daily</div>
    </div>
  );
};

const UpdateFlowScreen = () => {
  const [step, setStep] = useState(0);
  const [mode, setMode] = useState(null);
  const [confirmed, setConfirmed] = useState(false);
  const [done, setDone] = useState(false);

  const dueAccounts = accounts.slice(0, 5);
  const current = dueAccounts[step];

  if (done) return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100%", gap: 20, textAlign: "center" }}>
      <div style={{ fontSize: 48 }}>🎉</div>
      <div style={{ fontSize: 22, fontWeight: 800, color: COLORS.gold }}>All Updated!</div>
      <Card style={{ width: "100%", padding: 24 }}>
        <div style={{ fontSize: 11, color: COLORS.muted, textTransform: "uppercase", letterSpacing: 1, marginBottom: 12 }}>This Week's Summary</div>
        <div style={{ fontSize: 36, fontWeight: 900, color: COLORS.gold }}>$78,450</div>
        <div style={{ color: "#22C55E", fontWeight: 700, marginTop: 4 }}>▲ $1,240 · +1.6%</div>
        <div style={{ display: "flex", justifyContent: "space-around", marginTop: 20 }}>
          {assetData.map(a => (
            <div key={a.name} style={{ textAlign: "center" }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: a.color }}>{fmt(a.value)}</div>
              <div style={{ fontSize: 10, color: COLORS.muted }}>{a.name}</div>
            </div>
          ))}
        </div>
      </Card>
      <button onClick={() => { setStep(0); setMode(null); setConfirmed(false); setDone(false); }}
        style={{ background: COLORS.border, color: COLORS.text, border: "none", borderRadius: 10, padding: "10px 20px", cursor: "pointer", fontSize: 13 }}>
        Back to Start
      </button>
    </div>
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", gap: 16 }}>
      <div>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
          <span style={{ fontSize: 11, color: COLORS.muted }}>Weekly Update</span>
          <span style={{ fontSize: 11, color: COLORS.muted }}>{step + 1} of {dueAccounts.length}</span>
        </div>
        <div style={{ background: COLORS.border, borderRadius: 4, height: 4 }}>
          <div style={{ background: COLORS.gold, borderRadius: 4, height: 4, width: `${((step + 1) / dueAccounts.length) * 100}%`, transition: "width 0.3s" }} />
        </div>
        <div style={{ display: "flex", gap: 4, marginTop: 8 }}>
          {dueAccounts.map((a, i) => (
            <div key={i} style={{ flex: 1, height: 4, borderRadius: 4, background: i <= step ? a.color : COLORS.border }} />
          ))}
        </div>
      </div>

      <Card style={{ borderLeft: `3px solid ${current.color}`, padding: 20 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
              <Tag label={current.asset} color={current.color} />
              {current.currency === "USD" && <FXBadge />}
            </div>
            <div style={{ fontSize: 20, fontWeight: 800, color: COLORS.text, marginTop: 8 }}>{current.name}</div>
            <div style={{ color: COLORS.muted, fontSize: 12, marginTop: 4 }}>
              Previous: <span style={{ color: current.color, fontWeight: 700 }}>{fmt(current.balance)} AUD</span>
              {current.currency === "USD" && <span style={{ color: COLORS.gold }}> · USD ${current.balanceNative?.toLocaleString()}</span>}
            </div>
          </div>
          <OwnerBadge owner={current.owner} />
        </div>
      </Card>

      {!mode && (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <button onClick={() => setMode("screenshot")}
            style={{ background: COLORS.card, border: `1px solid ${COLORS.border}`, borderRadius: 12, padding: 16, cursor: "pointer", textAlign: "left", display: "flex", alignItems: "center", gap: 12 }}>
            <span style={{ fontSize: 24 }}>📸</span>
            <div>
              <div style={{ color: COLORS.text, fontWeight: 700, fontSize: 14 }}>Upload Screenshot</div>
              <div style={{ color: COLORS.muted, fontSize: 12 }}>AI will extract the balance automatically</div>
            </div>
          </button>
          <button onClick={() => setMode("manual")}
            style={{ background: COLORS.card, border: `1px solid ${COLORS.border}`, borderRadius: 12, padding: 16, cursor: "pointer", textAlign: "left", display: "flex", alignItems: "center", gap: 12 }}>
            <span style={{ fontSize: 24 }}>✏️</span>
            <div>
              <div style={{ color: COLORS.text, fontWeight: 700, fontSize: 14 }}>Enter Manually</div>
              <div style={{ color: COLORS.muted, fontSize: 12 }}>
                {current.currency === "USD" ? "Enter in USD — AUD shown live" : "Type the balance directly"}
              </div>
            </div>
          </button>
          <button onClick={() => { if (step < dueAccounts.length - 1) { setStep(s => s + 1); setMode(null); setConfirmed(false); } else setDone(true); }}
            style={{ background: "transparent", border: "none", color: COLORS.muted, fontSize: 13, cursor: "pointer", padding: 8 }}>
            Skip for now →
          </button>
        </div>
      )}

      {mode === "screenshot" && !confirmed && (
        <Card style={{ padding: 20 }}>
          <div style={{ background: COLORS.bg, border: `2px dashed ${COLORS.border}`, borderRadius: 12, padding: 28, marginBottom: 12, textAlign: "center" }}>
            <div style={{ fontSize: 32 }}>📱</div>
            <div style={{ color: COLORS.muted, fontSize: 13, marginTop: 8 }}>Tap to upload screenshot</div>
          </div>
          <div style={{ background: "#22C55E11", border: `1px solid #22C55E44`, borderRadius: 10, padding: 14, marginBottom: 4 }}>
            <div style={{ fontSize: 11, color: COLORS.muted, marginBottom: 4 }}>AI Extracted Balance</div>
            {current.currency === "USD" ? (
              <>
                <div style={{ fontSize: 22, fontWeight: 800, color: COLORS.gold }}>USD $8,530</div>
                <div style={{ fontSize: 16, fontWeight: 700, color: "#22C55E", marginTop: 4 }}>≈ AUD $13,225</div>
                <div style={{ fontSize: 11, color: COLORS.muted, marginTop: 2 }}>@ AUD/USD 0.645 · Does this look right?</div>
              </>
            ) : (
              <>
                <div style={{ fontSize: 22, fontWeight: 800, color: "#22C55E" }}>$8,641.20</div>
                <div style={{ fontSize: 12, color: COLORS.muted, marginTop: 4 }}>Does this look right?</div>
              </>
            )}
          </div>
          <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
            <button onClick={() => setConfirmed(true)}
              style={{ flex: 1, background: "#22C55E", color: "#fff", border: "none", borderRadius: 10, padding: 12, fontWeight: 700, cursor: "pointer", fontSize: 14 }}>
              ✓ Confirm
            </button>
            <button style={{ flex: 1, background: COLORS.border, color: COLORS.text, border: "none", borderRadius: 10, padding: 12, fontWeight: 700, cursor: "pointer", fontSize: 14 }}>
              Edit
            </button>
          </div>
        </Card>
      )}

      {mode === "manual" && !confirmed && (
        <Card style={{ padding: 20 }}>
          <div style={{ fontSize: 11, color: COLORS.muted, textTransform: "uppercase", letterSpacing: 1, marginBottom: 8 }}>
            Enter Balance {current.currency === "USD" ? "(USD)" : "(AUD)"}
          </div>
          <div style={{ background: COLORS.bg, border: `2px solid ${current.color}`, borderRadius: 12, padding: "14px 16px", fontSize: 22, fontWeight: 800, color: current.currency === "USD" ? COLORS.gold : COLORS.text, marginBottom: current.currency === "USD" ? 8 : 12 }}>
            {current.currency === "USD" ? "USD $8,530" : "$8,641.20"}
          </div>
          {current.currency === "USD" && (
            <div style={{ background: COLORS.shares + "11", border: `1px solid ${COLORS.shares}44`, borderRadius: 10, padding: "10px 14px", marginBottom: 12 }}>
              <div style={{ fontSize: 11, color: COLORS.muted }}>AUD equivalent</div>
              <div style={{ fontSize: 18, fontWeight: 800, color: COLORS.shares }}>≈ AUD $13,225</div>
              <div style={{ fontSize: 10, color: COLORS.muted, marginTop: 2 }}>@ AUD/USD 0.645 · updated today</div>
            </div>
          )}
          <div style={{ background: COLORS.bg, border: `1px solid ${COLORS.border}`, borderRadius: 10, padding: "10px 14px", fontSize: 13, color: COLORS.muted, marginBottom: 12 }}>
            Note (optional)
          </div>
          <button onClick={() => setConfirmed(true)}
            style={{ width: "100%", background: current.color, color: "#fff", border: "none", borderRadius: 10, padding: 12, fontWeight: 700, cursor: "pointer", fontSize: 14 }}>
            Save Balance
          </button>
        </Card>
      )}

      {confirmed && (
        <div style={{ display: "flex", flexDirection: "column", gap: 12, alignItems: "center" }}>
          <div style={{ fontSize: 40 }}>✅</div>
          <div style={{ color: "#22C55E", fontWeight: 700, fontSize: 16 }}>Saved!</div>
          <button onClick={() => { if (step < dueAccounts.length - 1) { setStep(s => s + 1); setMode(null); setConfirmed(false); } else setDone(true); }}
            style={{ background: COLORS.gold, color: "#0A0A0F", border: "none", borderRadius: 10, padding: "12px 24px", fontWeight: 800, cursor: "pointer", fontSize: 14 }}>
            Next Account →
          </button>
        </div>
      )}
    </div>
  );
};

const StakeFXScreen = () => (
  <div style={{ display: "flex", flexDirection: "column", gap: 16, height: "100%", overflowY: "auto" }}>
    <div style={{ fontSize: 16, fontWeight: 800, color: COLORS.text }}>Stake — FX Detail</div>

    {/* FX Rate card */}
    <Card style={{ background: "linear-gradient(135deg, #13131A, #0F1A0F)", padding: 20 }}>
      <div style={{ fontSize: 11, color: COLORS.muted, textTransform: "uppercase", letterSpacing: 1, marginBottom: 8 }}>Today's Rate</div>
      <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
        <span style={{ fontSize: 28, fontWeight: 900, color: COLORS.gold }}>1 USD</span>
        <span style={{ color: COLORS.muted }}>=</span>
        <span style={{ fontSize: 28, fontWeight: 900, color: COLORS.shares }}>1.550 AUD</span>
      </div>
      <div style={{ fontSize: 11, color: COLORS.muted, marginTop: 6 }}>Source: frankfurter.app · Updated 9:00 AM today</div>
    </Card>

    {/* Stake ASX */}
    <Card style={{ borderLeft: `3px solid ${COLORS.shares}`, padding: 16 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <div style={{ fontSize: 11, color: COLORS.muted, textTransform: "uppercase", letterSpacing: 1 }}>Stake ASX</div>
          <div style={{ fontSize: 22, fontWeight: 800, color: COLORS.shares, marginTop: 4 }}>$9,800 AUD</div>
          <div style={{ fontSize: 11, color: COLORS.muted, marginTop: 4 }}>No FX conversion · AUD native</div>
        </div>
        <Tag label="AUD" color={COLORS.shares} />
      </div>
    </Card>

    {/* Stake Wall St */}
    <Card style={{ borderLeft: `3px solid ${COLORS.gold}`, padding: 16 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
        <div>
          <div style={{ fontSize: 11, color: COLORS.muted, textTransform: "uppercase", letterSpacing: 1 }}>Stake Wall St</div>
          <div style={{ fontSize: 22, fontWeight: 800, color: COLORS.gold, marginTop: 4 }}>USD $8,530</div>
        </div>
        <FXBadge />
      </div>
      <div style={{ background: COLORS.bg, borderRadius: 10, padding: 12 }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
          <span style={{ fontSize: 12, color: COLORS.muted }}>USD amount</span>
          <span style={{ fontSize: 12, fontWeight: 700, color: COLORS.gold }}>$8,530</span>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
          <span style={{ fontSize: 12, color: COLORS.muted }}>× AUD/USD rate</span>
          <span style={{ fontSize: 12, fontWeight: 700, color: COLORS.muted }}>÷ 0.645</span>
        </div>
        <div style={{ borderTop: `1px solid ${COLORS.border}`, paddingTop: 8, display: "flex", justifyContent: "space-between" }}>
          <span style={{ fontSize: 12, color: COLORS.muted }}>= AUD equivalent</span>
          <span style={{ fontSize: 14, fontWeight: 800, color: COLORS.shares }}>$13,225 AUD</span>
        </div>
      </div>
    </Card>

    {/* Combined */}
    <Card style={{ background: "linear-gradient(135deg, #13131A, #001A00)", padding: 16 }}>
      <div style={{ fontSize: 11, color: COLORS.muted, textTransform: "uppercase", letterSpacing: 1, marginBottom: 12 }}>Combined Stake Total</div>
      <div style={{ display: "flex", justifyContent: "space-between" }}>
        <div>
          <div style={{ fontSize: 11, color: COLORS.muted }}>ASX</div>
          <div style={{ fontSize: 14, fontWeight: 700, color: COLORS.shares }}>$9,800</div>
        </div>
        <div style={{ color: COLORS.muted, alignSelf: "center" }}>+</div>
        <div>
          <div style={{ fontSize: 11, color: COLORS.muted }}>Wall St (AUD)</div>
          <div style={{ fontSize: 14, fontWeight: 700, color: COLORS.shares }}>$13,225</div>
        </div>
        <div style={{ color: COLORS.muted, alignSelf: "center" }}>=</div>
        <div>
          <div style={{ fontSize: 11, color: COLORS.muted }}>Total</div>
          <div style={{ fontSize: 16, fontWeight: 800, color: COLORS.gold }}>$23,025</div>
        </div>
      </div>
    </Card>

    <div style={{ fontSize: 10, color: COLORS.muted, textAlign: "center" }}>
      Historical snapshots lock the rate at time of entry — no retroactive recalculation
    </div>
  </div>
);

const TrendScreen = () => {
  const [range, setRange] = useState("6M");
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16, height: "100%", overflowY: "auto" }}>
      <div style={{ fontSize: 16, fontWeight: 800, color: COLORS.text }}>Net Worth Trend</div>
      <Card>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <div>
            <div style={{ fontSize: 26, fontWeight: 900, color: COLORS.gold }}>$78,450</div>
            <div style={{ color: "#22C55E", fontSize: 12, fontWeight: 600 }}>▲ $17,450 · +28.6% this year</div>
          </div>
          <div style={{ display: "flex", gap: 4 }}>
            {["1M","3M","6M","1Y","All"].map(r => (
              <button key={r} onClick={() => setRange(r)}
                style={{ fontSize: 11, padding: "4px 8px", borderRadius: 8, border: "none", cursor: "pointer", fontWeight: 600,
                  background: range === r ? COLORS.gold : COLORS.border, color: range === r ? "#0A0A0F" : COLORS.muted }}>
                {r}
              </button>
            ))}
          </div>
        </div>
        <ResponsiveContainer width="100%" height={180}>
          <LineChart data={netWorthData}>
            <XAxis dataKey="month" tick={{ fill: COLORS.muted, fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: COLORS.muted, fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={v => "$" + (v/1000) + "k"} />
            <Tooltip formatter={(v) => fmt(v)} contentStyle={{ background: COLORS.card, border: `1px solid ${COLORS.border}`, borderRadius: 8, fontSize: 12 }} />
            <Line type="monotone" dataKey="value" stroke={COLORS.gold} strokeWidth={2.5} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </Card>
      <div style={{ fontSize: 11, color: COLORS.muted, textTransform: "uppercase", letterSpacing: 1 }}>By Asset Class (AUD)</div>
      <Card>
        <ResponsiveContainer width="100%" height={140}>
          <LineChart data={netWorthData}>
            <XAxis dataKey="month" tick={{ fill: COLORS.muted, fontSize: 11 }} axisLine={false} tickLine={false} />
            <Tooltip contentStyle={{ background: COLORS.card, border: `1px solid ${COLORS.border}`, borderRadius: 8, fontSize: 12 }} />
            <Line type="monotone" dataKey="value" stroke={COLORS.cash} strokeWidth={2} dot={false} name="Cash" />
            <Line type="monotone" dataKey="value" stroke={COLORS.shares} strokeWidth={2} dot={false} name="Shares" strokeDasharray="4 2" />
            <Line type="monotone" dataKey="value" stroke={COLORS.crypto} strokeWidth={2} dot={false} name="Crypto" strokeDasharray="2 2" />
          </LineChart>
        </ResponsiveContainer>
        <div style={{ display: "flex", gap: 12, justifyContent: "center", marginTop: 8 }}>
          {[["Cash", COLORS.cash], ["Shares", COLORS.shares], ["Crypto", COLORS.crypto], ["Super", COLORS.super]].map(([n, c]) => (
            <div key={n} style={{ display: "flex", alignItems: "center", gap: 4 }}>
              <div style={{ width: 10, height: 3, background: c, borderRadius: 2 }} />
              <span style={{ fontSize: 11, color: COLORS.muted }}>{n}</span>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
};

const AccountDetailScreen = () => (
  <div style={{ display: "flex", flexDirection: "column", gap: 16, height: "100%", overflowY: "auto" }}>
    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
      <div style={{ width: 40, height: 40, borderRadius: 10, background: COLORS.shares + "22", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>📈</div>
      <div>
        <div style={{ fontSize: 18, fontWeight: 800, color: COLORS.text }}>Stake Wall St</div>
        <div style={{ display: "flex", gap: 6, marginTop: 2 }}>
          <Tag label="Shares" color={COLORS.shares} />
          <FXBadge />
          <OwnerBadge owner="H" />
        </div>
      </div>
    </div>

    <div style={{ display: "flex", gap: 10 }}>
      {[["AUD Value", "$13,225", COLORS.shares], ["USD Value", "USD $8,530", COLORS.gold], ["Avg (AUD)", "$11,400", COLORS.muted]].map(([l, v, c]) => (
        <Card key={l} style={{ flex: 1, padding: 12, textAlign: "center" }}>
          <div style={{ fontSize: 10, color: COLORS.muted, marginBottom: 4 }}>{l}</div>
          <div style={{ fontSize: 12, fontWeight: 800, color: c }}>{v}</div>
        </Card>
      ))}
    </div>

    <Card>
      <div style={{ fontSize: 11, color: COLORS.muted, marginBottom: 12, textTransform: "uppercase", letterSpacing: 1 }}>AUD Balance History</div>
      <ResponsiveContainer width="100%" height={120}>
        <LineChart data={netWorthData.map(d => ({ ...d, value: d.value * 0.17 }))}>
          <XAxis dataKey="month" tick={{ fill: COLORS.muted, fontSize: 11 }} axisLine={false} tickLine={false} />
          <Tooltip formatter={(v) => fmt(Math.round(v))} contentStyle={{ background: COLORS.card, border: `1px solid ${COLORS.border}`, borderRadius: 8, fontSize: 12 }} />
          <Line type="monotone" dataKey="value" stroke={COLORS.shares} strokeWidth={2.5} dot={false} />
        </LineChart>
      </ResponsiveContainer>
    </Card>

    <div style={{ fontSize: 11, color: COLORS.muted, textTransform: "uppercase", letterSpacing: 1 }}>Update History</div>
    {[
      { date: "18 May 2026", audBalance: 13225, usdBalance: 8530, rate: 0.645, method: "📸 Screenshot" },
      { date: "4 May 2026", audBalance: 12405, usdBalance: 8190, rate: 0.660, method: "📸 Screenshot" },
      { date: "20 Apr 2026", audBalance: 11890, usdBalance: 7820, rate: 0.658, method: "✏️ Manual" },
    ].map((h, i) => (
      <Card key={i} style={{ padding: "12px 16px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: COLORS.shares }}>{fmt(h.audBalance)} AUD</div>
            <div style={{ fontSize: 11, color: COLORS.gold }}>USD ${h.usdBalance.toLocaleString()} · @{h.rate}</div>
            <div style={{ fontSize: 11, color: COLORS.muted, marginTop: 2 }}>{h.method} · {h.date}</div>
          </div>
        </div>
      </Card>
    ))}
  </div>
);

const AdminScreen = () => (
  <div style={{ display: "flex", flexDirection: "column", gap: 16, height: "100%", overflowY: "auto" }}>
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
      <div style={{ fontSize: 16, fontWeight: 800, color: COLORS.text }}>Admin Panel</div>
      <button style={{ background: COLORS.gold, color: "#0A0A0F", border: "none", borderRadius: 8, padding: "6px 14px", fontWeight: 700, fontSize: 12, cursor: "pointer" }}>
        + Add Account
      </button>
    </div>

    <Card style={{ border: `1px solid ${COLORS.gold}44` }}>
      <div style={{ fontSize: 12, fontWeight: 700, color: COLORS.gold, marginBottom: 14 }}>➕ New Account</div>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {[["Account Name", "e.g. Stake Wall St"], ["Institution", "e.g. Stake"]].map(([l, p]) => (
          <div key={l}>
            <div style={{ fontSize: 10, color: COLORS.muted, marginBottom: 4, textTransform: "uppercase", letterSpacing: 1 }}>{l}</div>
            <div style={{ background: COLORS.bg, border: `1px solid ${COLORS.border}`, borderRadius: 8, padding: "8px 12px", fontSize: 13, color: COLORS.muted }}>{p}</div>
          </div>
        ))}
        <div style={{ display: "flex", gap: 10 }}>
          {[["Owner", "Husband ▾"], ["Asset Class", "Shares ▾"]].map(([l, v]) => (
            <div key={l} style={{ flex: 1 }}>
              <div style={{ fontSize: 10, color: COLORS.muted, marginBottom: 4, textTransform: "uppercase", letterSpacing: 1 }}>{l}</div>
              <div style={{ background: COLORS.bg, border: `1px solid ${COLORS.border}`, borderRadius: 8, padding: "8px 12px", fontSize: 13, color: COLORS.text }}>{v}</div>
            </div>
          ))}
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          {[["Currency", "USD ▾"], ["Frequency", "Fortnightly ▾"]].map(([l, v]) => (
            <div key={l} style={{ flex: 1 }}>
              <div style={{ fontSize: 10, color: COLORS.muted, marginBottom: 4, textTransform: "uppercase", letterSpacing: 1 }}>{l}</div>
              <div style={{ background: COLORS.bg, border: `1px solid ${l === "Currency" ? COLORS.gold : COLORS.border}`, borderRadius: 8, padding: "8px 12px", fontSize: 13, color: l === "Currency" ? COLORS.gold : COLORS.text }}>{v}</div>
            </div>
          ))}
        </div>
        <div>
          <div style={{ fontSize: 10, color: COLORS.muted, marginBottom: 4, textTransform: "uppercase", letterSpacing: 1 }}>Group Name (optional)</div>
          <div style={{ background: COLORS.bg, border: `1px solid ${COLORS.border}`, borderRadius: 8, padding: "8px 12px", fontSize: 13, color: COLORS.text }}>Stake</div>
          <div style={{ fontSize: 10, color: COLORS.muted, marginTop: 4 }}>Accounts with the same group name are displayed together on the dashboard</div>
        </div>
      </div>
    </Card>

    <div style={{ fontSize: 11, color: COLORS.muted, textTransform: "uppercase", letterSpacing: 1 }}>Existing Accounts</div>
    {accounts.slice(0, 6).map(a => (
      <Card key={a.name} style={{ padding: "12px 16px", borderLeft: `3px solid ${a.color}` }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <div style={{ display: "flex", gap: 6, alignItems: "center", marginBottom: 4 }}>
              <span style={{ fontSize: 13, fontWeight: 700, color: COLORS.text }}>{a.name}</span>
              <OwnerBadge owner={a.owner} />
              {a.currency === "USD" && <FXBadge />}
            </div>
            <div style={{ display: "flex", gap: 6 }}>
              <Tag label={a.asset} color={a.color} />
              <Tag label={a.currency} color={a.currency === "USD" ? COLORS.gold : COLORS.muted} />
            </div>
          </div>
          <div style={{ display: "flex", gap: 6 }}>
            <button style={{ background: COLORS.border, border: "none", color: COLORS.muted, borderRadius: 6, padding: "4px 8px", fontSize: 11, cursor: "pointer" }}>Edit</button>
            <button style={{ background: COLORS.red + "22", border: "none", color: COLORS.red, borderRadius: 6, padding: "4px 8px", fontSize: 11, cursor: "pointer" }}>✕</button>
          </div>
        </div>
      </Card>
    ))}
  </div>
);

const MilestonesScreen = () => (
  <div style={{ display: "flex", flexDirection: "column", gap: 16, height: "100%", overflowY: "auto" }}>
    <div style={{ fontSize: 16, fontWeight: 800, color: COLORS.text }}>Milestones & Goals</div>
    <Card style={{ background: "linear-gradient(135deg, #13131A, #1A1500)", padding: 24 }}>
      <div style={{ fontSize: 11, color: COLORS.muted, textTransform: "uppercase", letterSpacing: 1, marginBottom: 8 }}>🎯 Current Goal</div>
      <div style={{ fontSize: 20, fontWeight: 800, color: COLORS.gold }}>$100,000 AUD</div>
      <div style={{ color: COLORS.muted, fontSize: 12, marginTop: 4 }}>Estimated: November 2026</div>
      <div style={{ background: COLORS.border, borderRadius: 4, height: 8, marginTop: 16 }}>
        <div style={{ background: `linear-gradient(90deg, ${COLORS.gold}, #F97316)`, borderRadius: 4, height: 8, width: "78.45%" }} />
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", marginTop: 6 }}>
        <span style={{ fontSize: 12, color: COLORS.gold, fontWeight: 700 }}>$78,450</span>
        <span style={{ fontSize: 12, color: COLORS.muted }}>78% · $21,550 to go</span>
      </div>
    </Card>
    <Card>
      <div style={{ fontSize: 11, color: COLORS.muted, textTransform: "uppercase", letterSpacing: 1, marginBottom: 12 }}>📈 Projections (AUD)</div>
      <div style={{ display: "flex", justifyContent: "space-around" }}>
        {[["6 months", "$89,200"], ["1 year", "$97,800"], ["3 years", "$142,000"]].map(([t, v]) => (
          <div key={t} style={{ textAlign: "center" }}>
            <div style={{ fontSize: 15, fontWeight: 800, color: COLORS.shares }}>{v}</div>
            <div style={{ fontSize: 11, color: COLORS.muted }}>{t}</div>
          </div>
        ))}
      </div>
    </Card>
    <div style={{ fontSize: 11, color: COLORS.muted, textTransform: "uppercase", letterSpacing: 1 }}>🏆 Achieved</div>
    {[
      { amount: "$75,000", date: "May 2026", emoji: "🥇" },
      { amount: "$50,000", date: "Jan 2026", emoji: "🥈" },
      { amount: "$25,000", date: "Aug 2025", emoji: "🥉" },
    ].map((m, i) => (
      <Card key={i} style={{ padding: "14px 16px", display: "flex", alignItems: "center", gap: 14 }}>
        <div style={{ fontSize: 28 }}>{m.emoji}</div>
        <div>
          <div style={{ fontSize: 16, fontWeight: 800, color: COLORS.gold }}>{m.amount} AUD</div>
          <div style={{ fontSize: 12, color: COLORS.muted }}>Reached {m.date}</div>
        </div>
      </Card>
    ))}
    <Card style={{ padding: 16, border: `1px dashed ${COLORS.border}`, textAlign: "center" }}>
      <div style={{ color: COLORS.muted, fontSize: 13 }}>+ Set a new goal</div>
    </Card>
  </div>
);

// ─── Nav ─────────────────────────────────────────────────────────────────────

const navItems = [
  { icon: "🏠", label: "Dashboard" },
  { icon: "🔄", label: "Update Flow" },
  { icon: "📈", label: "Trend Chart" },
  { icon: "🏆", label: "Milestones" },
  { icon: "⚙️", label: "Admin Panel" },
];

// ─── Main ────────────────────────────────────────────────────────────────────

export default function App() {
  const [screen, setScreen] = useState("Login");
  const [filter, setFilter] = useState("Combined");

  const renderScreen = () => {
    switch (screen) {
      case "Login": return <LoginScreen />;
      case "Dashboard": return <DashboardScreen filter={filter} setFilter={setFilter} />;
      case "Update Flow": return <UpdateFlowScreen />;
      case "Stake (FX)": return <StakeFXScreen />;
      case "Trend Chart": return <TrendScreen />;
      case "Account Detail": return <AccountDetailScreen />;
      case "Admin Panel": return <AdminScreen />;
      case "Milestones": return <MilestonesScreen />;
      default: return <DashboardScreen filter={filter} setFilter={setFilter} />;
    }
  };

  return (
    <div style={{ background: "#050508", minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", fontFamily: "'SF Pro Display', -apple-system, sans-serif", padding: 20 }}>
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", justifyContent: "center", marginBottom: 20 }}>
        {screens.map(s => (
          <button key={s} onClick={() => setScreen(s)}
            style={{ fontSize: 11, padding: "5px 12px", borderRadius: 20, border: `1px solid ${screen === s ? COLORS.gold : COLORS.border}`, cursor: "pointer", fontWeight: 600,
              background: screen === s ? COLORS.gold : "transparent", color: screen === s ? "#0A0A0F" : COLORS.muted }}>
            {s}
          </button>
        ))}
      </div>

      <div style={{ width: 375, background: COLORS.bg, borderRadius: 40, border: `2px solid ${COLORS.border}`, overflow: "hidden", boxShadow: "0 40px 80px #00000080" }}>
        <div style={{ background: COLORS.card, padding: "12px 24px 8px", display: "flex", justifyContent: "space-between", borderBottom: `1px solid ${COLORS.border}` }}>
          <span style={{ fontSize: 12, color: COLORS.muted, fontWeight: 600 }}>9:41</span>
          <div style={{ width: 80, height: 8, background: COLORS.border, borderRadius: 4 }} />
          <span style={{ fontSize: 12, color: COLORS.muted }}>●●●</span>
        </div>
        {screen !== "Login" && (
          <div style={{ background: COLORS.card, padding: "10px 20px", display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: `1px solid ${COLORS.border}` }}>
            <span style={{ fontSize: 14, fontWeight: 800, color: COLORS.gold }}>🔐 Vaulted</span>
            <span style={{ fontSize: 11, color: COLORS.muted }}>🌙</span>
          </div>
        )}
        <div style={{ padding: 16, height: 580, overflowY: "auto" }}>
          {renderScreen()}
        </div>
        {screen !== "Login" && (
          <div style={{ background: COLORS.card, borderTop: `1px solid ${COLORS.border}`, padding: "8px 0 12px", display: "flex", justifyContent: "space-around" }}>
            {navItems.map(n => (
              <button key={n.label} onClick={() => setScreen(n.label)}
                style={{ background: "none", border: "none", cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", gap: 2 }}>
                <span style={{ fontSize: 18 }}>{n.icon}</span>
                <span style={{ fontSize: 9, color: screen === n.label ? COLORS.gold : COLORS.muted, fontWeight: screen === n.label ? 700 : 400 }}>{n.label.split(" ")[0]}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      <div style={{ marginTop: 16, color: COLORS.muted, fontSize: 11, textAlign: "center" }}>
        Navigate with the buttons above · Try "Stake (FX)" to see multi-currency · Tap through Update Flow for the full experience
      </div>
    </div>
  );
}
