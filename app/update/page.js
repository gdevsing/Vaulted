"use client";
import { saveSnapshot, fetchAccounts, fetchFxRate } from "@/lib/api";

import { useState, useRef, useCallback } from "react";
import TopBar from "@/components/top-bar";
import BottomNav from "@/components/nav";
import { useTheme } from "@/app/layout";
import { ACCOUNTS } from "@/lib/mock-data";
import { fmt, assetLabel, daysAgo, isOverdue } from "@/lib/utils";
import { ASSETS } from "@/lib/tokens";

// ─── Which accounts are due? ──────────────────────────────────────────────────
function getDueAccounts() {
  return ACCOUNTS.filter(a => {
    const days = Math.floor((Date.now() - new Date(a.updated)) / 86400000);
    const limits = { weekly: 8, fortnightly: 16, monthly: 33 };
    return days >= (limits[a.frequency] || 33) || a.overdue;
  });
}

// ─── XP progress bar ─────────────────────────────────────────────────────────
function XPBar({ current, total, label }) {
  const pct = total === 0 ? 0 : (current / total) * 100;
  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
        <div className="label">{label}</div>
        <div className="label">{current}/{total}</div>
      </div>
      <div className="xp-bar-track">
        <div
          className="xp-bar-fill"
          style={{ "--xp-width": `${pct}%`, width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

// ─── Screenshot upload zone ───────────────────────────────────────────────────
function ScreenshotZone({ onFileSelect, file, loading, extracted }) {
  const inputRef = useRef();
  const [drag, setDrag] = useState(false);
  const { theme } = useTheme();

  const handleDrop = useCallback(e => {
    e.preventDefault();
    setDrag(false);
    const f = e.dataTransfer.files[0];
    if (f && f.type.startsWith("image/")) onFileSelect(f);
  }, [onFileSelect]);

  return (
    <div>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        style={{ display: "none" }}
        onChange={e => e.target.files[0] && onFileSelect(e.target.files[0])}
      />
      <div
        onClick={() => inputRef.current?.click()}
        onDragOver={e => { e.preventDefault(); setDrag(true); }}
        onDragLeave={() => setDrag(false)}
        onDrop={handleDrop}
        style={{
          border: `1.5px dashed ${drag ? "var(--gold)" : "var(--border-strong)"}`,
          borderRadius: "3px 14px 14px 3px",
          padding: "20px 16px",
          textAlign: "center",
          cursor: "pointer",
          background: drag ? "rgba(255,210,74,0.04)" : "transparent",
          transition: "all 0.2s",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {loading ? (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
            <div style={{
              width: 28, height: 28,
              border: "2px solid var(--border)",
              borderTopColor: "var(--gold)",
              borderRadius: "50%",
              animation: "spin 0.8s linear infinite",
            }} />
            <div style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--ink2)", letterSpacing: "0.1em" }}>
              GEMINI READING...
            </div>
          </div>
        ) : extracted !== null ? (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
            <div style={{ fontSize: 20 }}>✓</div>
            <div style={{ fontFamily: "var(--font-display)", fontSize: 20, color: "var(--positive)" }}>
              {fmt(extracted)}
            </div>
            <div style={{ fontFamily: "var(--font-mono)", fontSize: 9, color: "var(--ink2)", letterSpacing: "0.1em" }}>
              AI EXTRACTED · TAP TO CHANGE
            </div>
          </div>
        ) : file ? (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
            <div style={{ fontSize: 24 }}>🖼</div>
            <div style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--ink2)", letterSpacing: "0.08em" }}>
              {file.name}
            </div>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
            <div style={{
              width: 40, height: 40,
              border: "1.5px solid var(--border-strong)",
              borderRadius: "3px 12px 12px 3px",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 18, color: "var(--ink2)",
            }}>
              📸
            </div>
            <div style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--ink)", letterSpacing: "0.06em" }}>
              Upload screenshot
            </div>
            <div style={{ fontFamily: "var(--font-mono)", fontSize: 9, color: "var(--ink2)", letterSpacing: "0.1em" }}>
              GEMINI AI READS THE BALANCE
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Confetti burst ───────────────────────────────────────────────────────────
function Confetti() {
  const dots = Array.from({ length: 12 }, (_, i) => ({
    color: ["var(--gold)", "var(--positive)", "var(--shares)", "var(--crypto)"][i % 4],
    tx: `${(Math.random() - 0.5) * 120}px`,
    ty: `${-(Math.random() * 80 + 20)}px`,
    delay: `${i * 0.05}s`,
  }));
  return (
    <div style={{ position: "absolute", inset: 0, pointerEvents: "none", overflow: "hidden" }}>
      {dots.map((d, i) => (
        <div key={i} className="confetti-dot" style={{
          background: d.color,
          left: "50%", top: "50%",
          "--tx": d.tx, "--ty": d.ty,
          animationDelay: d.delay,
        }} />
      ))}
    </div>
  );
}

// ─── Completion screen ────────────────────────────────────────────────────────
function CompletionScreen({ count, onReset }) {
  const { theme } = useTheme();
  return (
    <div style={{
      display: "flex", flexDirection: "column", alignItems: "center",
      justifyContent: "center", gap: 20, padding: "60px 24px",
      textAlign: "center", position: "relative",
    }}>
      <Confetti />
      <div style={{
        width: 72, height: 72,
        border: "2px solid var(--positive)",
        borderRadius: "50%",
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: 32, position: "relative",
      }}>
        ◎
        <div className="pulse-ring" />
      </div>
      <div>
        <div style={{ fontFamily: "var(--font-display)", fontSize: 22, color: "var(--ink)", marginBottom: 6 }}>
          VAULT SYNCED
        </div>
        <div style={{ fontFamily: "var(--font-serif)", fontStyle: "italic", fontSize: 14, color: "var(--ink2)" }}>
          {count} account{count !== 1 ? "s" : ""} updated
        </div>
      </div>
      <div style={{
        fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--gold)",
        letterSpacing: "0.14em", padding: "8px 16px",
        border: "1px solid var(--gold)", borderRadius: "2px 8px 8px 2px",
      }}>
        +{count * 50} XP EARNED
      </div>
      <button
        onClick={onReset}
        className="btn-press"
        style={{
          fontFamily: "var(--font-mono)", fontSize: 11, letterSpacing: "0.1em",
          padding: "12px 24px", borderRadius: "2px 9px 9px 2px",
          background: "var(--ink3)", border: "1px solid var(--border)",
          color: "var(--ink2)", cursor: "pointer",
        }}
      >
        DONE
      </button>
    </div>
  );
}

// ─── Single account update card ───────────────────────────────────────────────
function AccountUpdateCard({ account, onSave, onSkip }) {
  const { theme } = useTheme();
  const color = ASSETS[account.asset]?.[theme] || "var(--ink2)";
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [extracted, setExtracted] = useState(null);
  const [manual, setManual] = useState(String(account.balance));
  const [mode, setMode] = useState("screenshot"); // "screenshot" | "manual"
  const [saved, setSaved] = useState(false);

  // Simulate Gemini extraction
  const handleFileSelect = async (f) => {
    setFile(f);
    setLoading(true);
    // Simulate API call — replace with real Gemini call
    await new Promise(r => setTimeout(r, 1800));
    const simulated = account.balance + Math.floor((Math.random() - 0.3) * 500);
    setExtracted(simulated);
    setManual(String(simulated));
    setLoading(false);
  };

  const handleSave = async () => {
    setSaved(true);
    try {
      const balance = parseFloat(manual) || account.balance;
      await saveSnapshot({
        account_id: account.id,
        balance,
        note: null,
        method: mode === "screenshot" ? "ai" : "manual",
      });
    } catch (e) {
      console.error("saveSnapshot failed:", e);
    }
    setTimeout(() => onSave(parseFloat(manual) || account.balance), 400);
  };

  const displayValue = mode === "screenshot" && extracted !== null
    ? extracted
    : parseFloat(manual) || account.balance;

  const diff = displayValue - account.balance;
  const diffColor = diff > 0 ? "var(--positive)" : diff < 0 ? "var(--negative)" : "var(--ink2)";

  return (
    <div className="card fade-up" style={{
      borderLeft: `3px solid ${color}`,
      padding: 0,
      overflow: "hidden",
      transition: "all 0.3s",
      opacity: saved ? 0.5 : 1,
      transform: saved ? "scale(0.98)" : "scale(1)",
    }}>
      {/* Header */}
      <div style={{ padding: "16px 18px 12px", borderBottom: "1px solid var(--border)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            <div style={{ fontFamily: "var(--font-mono)", fontSize: 14, color: "var(--ink)", marginBottom: 3 }}>
              {account.name}
            </div>
            <div style={{ fontFamily: "var(--font-mono)", fontSize: 9, color: "var(--ink2)", letterSpacing: "0.08em" }}>
              {account.institution} · last updated {daysAgo(account.updated)}
              {account.overdue && (
                <span style={{ color: "var(--negative)", marginLeft: 6 }}>OVERDUE</span>
              )}
            </div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--ink2)" }}>current</div>
            <div style={{ fontFamily: "var(--font-display)", fontSize: 16, color: "var(--ink)", marginTop: 2 }}>
              {fmt(account.balance)}
            </div>
          </div>
        </div>
      </div>

      {/* Mode tabs */}
      <div style={{
        display: "flex", borderBottom: "1px solid var(--border)",
        background: "rgba(0,0,0,0.1)",
      }}>
        {["screenshot", "manual"].map(m => (
          <button
            key={m}
            onClick={() => setMode(m)}
            className="btn-press"
            style={{
              flex: 1, padding: "9px 0",
              fontFamily: "var(--font-mono)", fontSize: 9,
              letterSpacing: "0.12em", textTransform: "uppercase",
              border: "none", cursor: "pointer",
              background: mode === m ? "var(--surface-solid)" : "transparent",
              color: mode === m ? "var(--gold)" : "var(--ink2)",
              borderBottom: mode === m ? `2px solid ${color}` : "2px solid transparent",
              transition: "all 0.2s",
            }}
          >
            {m === "screenshot" ? "📸 Screenshot" : "✎ Manual"}
          </button>
        ))}
      </div>

      {/* Input area */}
      <div style={{ padding: "16px 18px" }}>
        {mode === "screenshot" ? (
          <ScreenshotZone
            onFileSelect={handleFileSelect}
            file={file}
            loading={loading}
            extracted={extracted}
          />
        ) : (
          <div>
            <div className="label" style={{ marginBottom: 7 }}>New Balance (AUD)</div>
            <div style={{ position: "relative" }}>
              <span style={{
                position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)",
                fontFamily: "var(--font-display)", fontSize: 16, color: "var(--ink2)",
              }}>$</span>
              <input
                type="number"
                value={manual}
                onChange={e => setManual(e.target.value)}
                style={{
                  width: "100%",
                  background: "rgba(255,255,255,0.03)",
                  border: "1px solid var(--border-strong)",
                  borderRadius: "2px 9px 9px 2px",
                  padding: "11px 14px 11px 28px",
                  fontFamily: "var(--font-display)",
                  fontSize: 20,
                  color: "var(--ink)",
                  outline: "none",
                  boxSizing: "border-box",
                }}
              />
            </div>
          </div>
        )}

        {/* Diff indicator */}
        {diff !== 0 && (
          <div style={{
            marginTop: 10, padding: "7px 12px",
            background: diff > 0 ? "rgba(125,214,138,0.08)" : "rgba(232,112,112,0.08)",
            border: `1px solid ${diffColor}35`,
            borderRadius: "2px 8px 8px 2px",
            fontFamily: "var(--font-mono)", fontSize: 10,
            color: diffColor, display: "flex", justifyContent: "space-between",
          }}>
            <span>{diff > 0 ? "▲" : "▼"} Change</span>
            <span>{diff > 0 ? "+" : ""}{fmt(diff)}</span>
          </div>
        )}

        {/* Notes */}
        <div style={{ marginTop: 12 }}>
          <textarea
            placeholder="Note (optional)..."
            rows={2}
            style={{
              width: "100%",
              background: "rgba(255,255,255,0.02)",
              border: "1px solid var(--border)",
              borderRadius: "2px 8px 8px 2px",
              padding: "8px 12px",
              fontFamily: "var(--font-mono)", fontSize: 10,
              color: "var(--ink2)", outline: "none", resize: "none",
              boxSizing: "border-box",
            }}
          />
        </div>
      </div>

      {/* Actions */}
      <div style={{
        padding: "12px 18px",
        borderTop: "1px solid var(--border)",
        display: "flex", gap: 8,
      }}>
        <button
          onClick={handleSave}
          disabled={saved}
          className="btn-press"
          style={{
            flex: 1, padding: "12px",
            background: "var(--gold)", border: "none",
            borderRadius: "2px 9px 9px 2px",
            fontFamily: "var(--font-mono)", fontSize: 11,
            letterSpacing: "0.1em", color: "#0C0A08",
            cursor: saved ? "not-allowed" : "pointer",
            opacity: saved ? 0.6 : 1,
          }}
        >
          {saved ? "SAVED ✓" : "SAVE BALANCE"}
        </button>
        <button
          onClick={onSkip}
          className="btn-press"
          style={{
            padding: "12px 16px",
            background: "transparent", border: "1px solid var(--border)",
            borderRadius: "2px 9px 9px 2px",
            fontFamily: "var(--font-mono)", fontSize: 11,
            letterSpacing: "0.1em", color: "var(--ink2)",
            cursor: "pointer",
          }}
        >
          SKIP
        </button>
      </div>
    </div>
  );
}

// ─── Main update flow ─────────────────────────────────────────────────────────
export default function UpdatePage() {
  const dueAccounts = getDueAccounts();
  const [done, setDone] = useState([]); // ids of completed accounts
  const [skipped, setSkipped] = useState([]); // ids of skipped
  const [complete, setComplete] = useState(false);
  const { theme } = useTheme();

  const remaining = dueAccounts.filter(a => !done.includes(a.id) && !skipped.includes(a.id));
  const current = remaining[0];
  const completedCount = done.length;
  const totalCount = dueAccounts.length;

  const handleSave = (id) => {
    const next = [...done, id];
    setDone(next);
    if (next.length + skipped.length >= totalCount) {
      setTimeout(() => setComplete(true), 600);
    }
  };

  const handleSkip = (id) => {
    const next = [...skipped, id];
    setSkipped(next);
    if (done.length + next.length >= totalCount) {
      setTimeout(() => setComplete(true), 300);
    }
  };

  const handleReset = () => {
    setDone([]);
    setSkipped([]);
    setComplete(false);
  };

  return (
    <>
      <TopBar />
      <main className="page" style={{ paddingTop: 16, display: "flex", flexDirection: "column", gap: 16 }}>

        {complete ? (
          <CompletionScreen count={done.length} onReset={handleReset} />
        ) : (
          <>
            {/* Header */}
            <div className="fade-up">
              <div style={{ fontFamily: "var(--font-display)", fontSize: 20, color: "var(--ink)", marginBottom: 4 }}>
                Weekly Sync
              </div>
              <div style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--ink2)", letterSpacing: "0.08em" }}>
                {remaining.length} account{remaining.length !== 1 ? "s" : ""} remaining
              </div>
            </div>

            {/* XP bar */}
            <div className="fade-up fade-up-1">
              <XPBar
                current={completedCount}
                total={totalCount}
                label="Sync progress"
              />
            </div>

            {/* Queue overview */}
            <div className="fade-up fade-up-1" style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              {dueAccounts.map(a => {
                const isDone    = done.includes(a.id);
                const isSkipped = skipped.includes(a.id);
                const isCurrent = current?.id === a.id;
                const color     = ASSETS[a.asset]?.[theme] || "var(--ink2)";
                return (
                  <div key={a.id} style={{
                    fontFamily: "var(--font-mono)", fontSize: 8, letterSpacing: "0.08em",
                    padding: "3px 9px", borderRadius: "2px 7px 7px 2px",
                    background: isDone    ? `${color}22`
                              : isSkipped ? "var(--ink3)"
                              : isCurrent ? `${color}18`
                              : "transparent",
                    border: `1px solid ${isDone ? color : isCurrent ? color : "var(--border)"}`,
                    color: isDone    ? color
                         : isSkipped ? "var(--ink2)"
                         : isCurrent ? color
                         : "var(--ink2)",
                    textDecoration: isSkipped ? "line-through" : "none",
                    transition: "all 0.3s",
                  }}>
                    {isDone ? "✓ " : isSkipped ? "— " : isCurrent ? "▶ " : ""}{a.name}
                  </div>
                );
              })}
            </div>

            {/* Active account card */}
            {current ? (
              <AccountUpdateCard
                key={current.id}
                account={current}
                onSave={() => handleSave(current.id)}
                onSkip={() => handleSkip(current.id)}
              />
            ) : (
              <div style={{
                fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--ink2)",
                textAlign: "center", padding: "32px 0",
              }}>
                Processing...
              </div>
            )}

            {/* Up next */}
            {remaining.length > 1 && (
              <div className="fade-up" style={{ opacity: 0.55 }}>
                <div className="label" style={{ marginBottom: 8 }}>Up next</div>
                <div className="card" style={{ padding: "12px 16px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <div style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: "var(--ink)" }}>
                      {remaining[1].name}
                    </div>
                    <div style={{ fontFamily: "var(--font-mono)", fontSize: 9, color: "var(--ink2)", marginTop: 2 }}>
                      {assetLabel(remaining[1].asset)} · {remaining[1].institution}
                    </div>
                  </div>
                  <div style={{ fontFamily: "var(--font-display)", fontSize: 14, color: "var(--ink2)" }}>
                    {fmt(remaining[1].balance)}
                  </div>
                </div>
              </div>
            )}

            {/* No accounts due */}
            {dueAccounts.length === 0 && (
              <div style={{
                textAlign: "center", padding: "48px 24px",
                border: "1px dashed var(--border)", borderRadius: "3px 14px 14px 3px",
              }}>
                <div style={{ fontSize: 28, marginBottom: 12 }}>◎</div>
                <div style={{ fontFamily: "var(--font-display)", fontSize: 16, color: "var(--ink)", marginBottom: 6 }}>
                  All up to date
                </div>
                <div style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--ink2)" }}>
                  No accounts due for sync
                </div>
              </div>
            )}
          </>
        )}
      </main>
      <BottomNav />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </>
  );
}
