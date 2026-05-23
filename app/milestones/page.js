"use client";

import { useState, useEffect } from "react";
import TopBar from "@/components/top-bar";
import BottomNav from "@/components/nav";
import { useTheme } from "@/app/layout";
import { fmt, fmtShort, projectNetWorth } from "@/lib/utils";

const MILESTONE_AMOUNTS = [25000, 50000, 75000, 100000, 150000, 200000, 250000, 500000, 1000000];
const GOALS = [
  { id: 1, name: "First $100k",  target: 100000 },
  { id: 2, name: "First $250k",  target: 250000 },
  { id: 3, name: "Half a mil",   target: 500000 },
];

// ─── Animated count-up ───────────────────────────────────────────────────────
function CountUp({ target, duration = 1200, prefix = "$" }) {
  const [val, setVal] = useState(0);
  useEffect(() => {
    const start = Date.now();
    const tick = () => {
      const elapsed = Date.now() - start;
      const progress = Math.min(elapsed / duration, 1);
      const ease = 1 - Math.pow(1 - progress, 3);
      setVal(Math.round(target * ease));
      if (progress < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, [target, duration]);
  return <>{prefix}{val.toLocaleString("en-AU")}</>;
}

// ─── XP goal bar ─────────────────────────────────────────────────────────────
function GoalBar({ goal, current, history }) {
  const pct       = Math.min((current / goal.target) * 100, 100);
  const remaining = Math.max(goal.target - current, 0);
  const { theme } = useTheme();
  const achieved  = current >= goal.target;

  let monthsLeft = null;
  if (!achieved && history.length >= 2) {
    const recent     = history.slice(-8);
    const avgWeekly  = (recent[recent.length - 1].value - recent[0].value) / (recent.length * 4.33);
    const weeksLeft  = avgWeekly > 0 ? Math.ceil(remaining / avgWeekly) : null;
    monthsLeft = weeksLeft ? Math.round(weeksLeft / 4.33) : null;
  }

  return (
    <div className="card lift fade-up" style={{
      padding: "18px 20px",
      borderLeft: `3px solid ${achieved ? "var(--positive)" : "var(--gold)"}`,
      background: achieved
        ? (theme === "dark" ? "rgba(125,214,138,0.05)" : "rgba(26,122,56,0.04)")
        : undefined,
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 14 }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 3 }}>
            <div style={{ fontFamily: "var(--font-display)", fontSize: 16, color: "var(--ink)" }}>
              {goal.name}
            </div>
            {achieved && (
              <div style={{
                fontFamily: "var(--font-mono)", fontSize: 8, letterSpacing: "0.1em",
                padding: "2px 7px", borderRadius: "2px 6px 6px 2px",
                background: "rgba(125,214,138,0.15)", color: "var(--positive)",
                border: "1px solid rgba(125,214,138,0.3)",
              }}>
                ACHIEVED
              </div>
            )}
          </div>
          <div style={{ fontFamily: "var(--font-mono)", fontSize: 9, color: "var(--ink2)", letterSpacing: "0.06em" }}>
            Target: {fmt(goal.target)}
          </div>
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{ fontFamily: "var(--font-display)", fontSize: 20, color: achieved ? "var(--positive)" : "var(--gold)", lineHeight: 1 }}>
            {pct.toFixed(1)}%
          </div>
        </div>
      </div>

      <div style={{ marginBottom: 12 }}>
        <div className="xp-bar-track" style={{ height: 7 }}>
          <div className="xp-bar-fill" style={{
            "--xp-width": `${pct}%`, width: `${pct}%`,
            background: achieved ? "linear-gradient(90deg, #1A7A38, var(--positive))" : undefined,
            boxShadow: achieved ? "0 0 10px var(--positive)" : undefined,
          }} />
        </div>
      </div>

      <div style={{ display: "flex", justifyContent: "space-between" }}>
        <div>
          <div className="label">Current</div>
          <div style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: "var(--ink)", marginTop: 2 }}>{fmt(current)}</div>
        </div>
        {!achieved && remaining > 0 && (
          <div style={{ textAlign: "center" }}>
            <div className="label">Remaining</div>
            <div style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: "var(--negative)", marginTop: 2 }}>{fmt(remaining)}</div>
          </div>
        )}
        <div style={{ textAlign: "right" }}>
          <div className="label">{achieved ? "Status" : "Est. arrival"}</div>
          <div style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: achieved ? "var(--positive)" : "var(--ink2)", marginTop: 2 }}>
            {achieved ? "Done" : monthsLeft !== null ? (monthsLeft < 1 ? "This month" : `~${monthsLeft}mo`) : "—"}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Projection card ──────────────────────────────────────────────────────────
function ProjectionCard({ label, value, current, delay }) {
  const gain    = value - current;
  const gainPct = ((gain / current) * 100).toFixed(0);
  const isUp    = gain >= 0;

  return (
    <div className={`card lift fade-up fade-up-${delay}`} style={{ padding: "14px 16px", flex: 1, borderLeft: "3px solid var(--ink3)" }}>
      <div className="label" style={{ marginBottom: 6 }}>{label}</div>
      <div style={{ fontFamily: "var(--font-display)", fontSize: 18, color: "var(--ink)", lineHeight: 1, marginBottom: 4 }}>
        {fmtShort(value)}
      </div>
      <div style={{ fontFamily: "var(--font-mono)", fontSize: 9, color: isUp ? "var(--positive)" : "var(--negative)" }}>
        {isUp ? "▲" : "▼"} {fmtShort(Math.abs(gain))} ({isUp ? "+" : ""}{gainPct}%)
      </div>
    </div>
  );
}

// ─── Achieved milestone badge ─────────────────────────────────────────────────
function MilestoneBadge({ milestone, index }) {
  const { theme } = useTheme();
  const icons = ["◈", "◇", "○"];
  return (
    <div className={`fade-up fade-up-${index + 1}`} style={{
      display: "flex", alignItems: "center", gap: 14,
      padding: "12px 0", borderBottom: "1px solid var(--border)",
    }}>
      <div style={{
        width: 36, height: 36, borderRadius: "50%",
        border: "1.5px solid var(--gold)",
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: 14, color: "var(--gold)", flexShrink: 0,
        background: theme === "dark" ? "rgba(255,210,74,0.06)" : "rgba(180,120,0,0.05)",
      }}>
        {icons[index % icons.length]}
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ fontFamily: "var(--font-display)", fontSize: 14, color: "var(--ink)", lineHeight: 1, marginBottom: 3 }}>
          {fmt(milestone.amount)}
        </div>
        <div style={{ fontFamily: "var(--font-mono)", fontSize: 9, color: "var(--ink2)", letterSpacing: "0.06em" }}>
          Reached {milestone.achievedAt}
        </div>
      </div>
      <div style={{
        fontFamily: "var(--font-mono)", fontSize: 8, letterSpacing: "0.1em",
        padding: "2px 8px", borderRadius: "2px 6px 6px 2px",
        background: "rgba(255,210,74,0.1)", color: "var(--gold)",
        border: "1px solid rgba(255,210,74,0.25)",
      }}>
        MILESTONE
      </div>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function MilestonesPage() {
  const { theme }               = useTheme();
  const [current, setCurrent]   = useState(0);
  const [history, setHistory]   = useState([]);
  const [loading, setLoading]   = useState(true);

  useEffect(() => {
    Promise.all([
      fetch("/api/networth", { cache: "no-store" }).then(r => r.json()),
      fetch("/api/networth?history", { cache: "no-store" }).then(r => r.json()),
    ]).then(([n, h]) => {
      setCurrent(Number(n.networth?.total || 0));
      setHistory((h.history || []).map(row => ({ value: Number(row.total) })));
    }).finally(() => setLoading(false));
  }, []);

  // Projections — only if we have enough history
  const projections = history.length >= 2
    ? { "6mo": projectNetWorth(history, 26), "1yr": projectNetWorth(history, 52), "3yr": projectNetWorth(history, 156) }
    : null;

  // Milestones crossed — find first history point where total crossed each threshold
  const achieved = MILESTONE_AMOUNTS
    .filter(amt => current >= amt)
    .map(amt => {
      const crossedAt = history.find(h => h.value >= amt);
      return { amount: amt, achievedAt: crossedAt ? "On record" : "Before tracking" };
    })
    .reverse();

  // Next milestone
  const nextMilestone = MILESTONE_AMOUNTS.find(m => m > current) || 0;
  const nextPct       = nextMilestone ? Math.min((current / nextMilestone) * 100, 100) : 100;

  return (
    <>
      <TopBar />
      <main className="page" style={{ paddingTop: 16, display: "flex", flexDirection: "column", gap: 18 }}>

        <div className="fade-up">
          <div style={{ fontFamily: "var(--font-display)", fontSize: 20, color: "var(--ink)", marginBottom: 4 }}>Milestones</div>
          <div style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--ink2)", letterSpacing: "0.08em" }}>Goals, projections & achievements</div>
        </div>

        {/* Hero — next milestone */}
        <div className="card card-glow fade-up" style={{
          padding: "22px 20px",
          background: theme === "dark"
            ? "linear-gradient(135deg, rgba(255,210,80,0.07) 0%, rgba(255,255,255,0.02) 60%)"
            : "linear-gradient(135deg, rgba(180,120,0,0.06) 0%, rgba(26,22,20,0.02) 60%)",
          borderColor: "rgba(255,210,74,0.2)",
        }}>
          <div className="label" style={{ marginBottom: 10 }}>Next Milestone</div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 14 }}>
            <div>
              <div style={{ fontFamily: "var(--font-display)", fontSize: 32, color: "var(--ink)", lineHeight: 1, marginBottom: 4 }}>
                {loading ? "—" : <CountUp target={current} duration={1000} />}
              </div>
              <div style={{ fontFamily: "var(--font-serif)", fontStyle: "italic", fontSize: 12, color: "var(--ink2)" }}>
                of {fmt(nextMilestone)} target
              </div>
            </div>
            <div style={{ textAlign: "right" }}>
              <div style={{ fontFamily: "var(--font-display)", fontSize: 28, color: "var(--gold)", lineHeight: 1 }}>
                {nextPct.toFixed(1)}%
              </div>
              <div style={{ fontFamily: "var(--font-mono)", fontSize: 9, color: "var(--ink2)", marginTop: 3, letterSpacing: "0.08em" }}>
                {fmt(nextMilestone - current)} to go
              </div>
            </div>
          </div>
          <div className="xp-bar-track" style={{ height: 8 }}>
            <div className="xp-bar-fill" style={{ "--xp-width": `${nextPct}%`, width: `${nextPct}%`, height: "100%" }} />
          </div>
        </div>

        {/* Goals */}
        <div>
          <div className="label" style={{ marginBottom: 10 }}>Goals</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {GOALS.map(goal => (
              <GoalBar key={goal.id} goal={goal} current={current} history={history} />
            ))}
          </div>
        </div>

        {/* Projections */}
        {projections && (
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
              <div className="label">Projections</div>
              <div style={{ fontFamily: "var(--font-mono)", fontSize: 8, color: "var(--ink2)", letterSpacing: "0.08em" }}>based on avg weekly growth</div>
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <ProjectionCard label="6 months" value={projections["6mo"]} current={current} delay={1} />
              <ProjectionCard label="1 year"   value={projections["1yr"]} current={current} delay={2} />
              <ProjectionCard label="3 years"  value={projections["3yr"]} current={current} delay={3} />
            </div>
            <div style={{ fontFamily: "var(--font-mono)", fontSize: 8, color: "var(--ink2)", marginTop: 8, letterSpacing: "0.06em" }}>
              * projections assume consistent growth and are not financial advice
            </div>
          </div>
        )}

        {/* Achieved milestones */}
        <div>
          <div className="label" style={{ marginBottom: 10 }}>Achieved</div>
          <div className="card" style={{ padding: "4px 18px" }}>
            {achieved.length > 0
              ? achieved.map((m, i) => <MilestoneBadge key={m.amount} milestone={m} index={i} />)
              : (
                <div style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--ink2)", textAlign: "center", padding: "28px 0" }}>
                  No milestones reached yet — keep going
                </div>
              )
            }
          </div>
        </div>

        <div style={{ height: 8 }} />
      </main>
      <BottomNav />
    </>
  );
}
