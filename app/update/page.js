"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import TopBar from "@/components/top-bar";
import BottomNav from "@/components/nav";
import { useTheme } from "@/app/layout";
import { fetchAccounts, saveSnapshot } from "@/lib/api";
import { fmt, assetLabel, daysAgo } from "@/lib/utils";
import { ASSETS } from "@/lib/tokens";

// ─── Helpers ──────────────────────────────────────────────────────────────────
function getDueAccounts(accounts) {
  return accounts.filter(a => {
    const days = Math.floor((Date.now() - new Date(a.updated)) / 86400000);
    const limits = { weekly: 8, fortnightly: 16, monthly: 33 };
    return days >= (limits[a.frequency] || 33) || a.overdue;
  });
}

function fileToBase64(file) {
  return new Promise((res, rej) => {
    const reader = new FileReader();
    reader.onload  = () => res(reader.result.split(",")[1]);
    reader.onerror = rej;
    reader.readAsDataURL(file);
  });
}

// ─── XP bar ───────────────────────────────────────────────────────────────────
function XPBar({ current, total }) {
  const pct = total === 0 ? 0 : (current / total) * 100;
  return (
    <div>
      <div style={{ display:"flex", justifyContent:"space-between", marginBottom:5 }}>
        <div className="label">Sync progress</div>
        <div className="label">{current}/{total}</div>
      </div>
      <div className="xp-bar-track">
        <div className="xp-bar-fill" style={{ "--xp-width":`${pct}%`, width:`${pct}%` }} />
      </div>
    </div>
  );
}

// ─── Confidence badge ─────────────────────────────────────────────────────────
function ConfidenceBadge({ confidence }) {
  const map = {
    high:   { color:"var(--positive)", label:"HIGH CONFIDENCE" },
    medium: { color:"var(--gold)",     label:"MEDIUM CONFIDENCE" },
    low:    { color:"var(--negative)", label:"LOW CONFIDENCE — verify manually" },
  };
  const { color, label } = map[confidence] || map.medium;
  return (
    <div style={{
      fontFamily:"var(--font-mono)", fontSize:8, letterSpacing:"0.1em",
      padding:"2px 8px", borderRadius:"2px 6px 6px 2px",
      background:`${color}15`, color, border:`1px solid ${color}35`,
      display:"inline-block",
    }}>
      {label}
    </div>
  );
}

// ─── Screenshot zone ──────────────────────────────────────────────────────────
function ScreenshotZone({ onFileSelect, file, loading, result }) {
  const inputRef = useRef();
  const [drag, setDrag] = useState(false);

  const handleDrop = useCallback(e => {
    e.preventDefault(); setDrag(false);
    const f = e.dataTransfer.files[0];
    if (f?.type.startsWith("image/")) onFileSelect(f);
  }, [onFileSelect]);

  return (
    <div>
      <input ref={inputRef} type="file" accept="image/*" style={{ display:"none" }}
        onChange={e => e.target.files[0] && onFileSelect(e.target.files[0])} />

      <div
        onClick={() => !loading && inputRef.current?.click()}
        onDragOver={e => { e.preventDefault(); setDrag(true); }}
        onDragLeave={() => setDrag(false)}
        onDrop={handleDrop}
        style={{
          border:`1.5px dashed ${drag ? "var(--gold)" : "var(--border-strong)"}`,
          borderRadius:"3px 14px 14px 3px", padding:"20px 16px",
          textAlign:"center", cursor: loading ? "wait" : "pointer",
          background: drag ? "rgba(255,210,74,0.04)" : "transparent",
          transition:"all 0.2s",
        }}
      >
        {loading ? (
          <div style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:10 }}>
            <div style={{
              width:28, height:28,
              border:"2px solid var(--border)", borderTopColor:"var(--gold)",
              borderRadius:"50%", animation:"spin 0.8s linear infinite",
            }} />
            <div style={{ fontFamily:"var(--font-mono)", fontSize:10, color:"var(--ink2)", letterSpacing:"0.1em" }}>
              GEMINI READING SCREENSHOT...
            </div>
          </div>
        ) : result ? (
          <div style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:8 }}>
            <div style={{ fontSize:22 }}>✓</div>
            <div style={{ fontFamily:"var(--font-display)", fontSize:24,
              color: result.confidence === "low" ? "var(--negative)" : "var(--positive)" }}>
              {fmt(result.balance)}
            </div>
            <ConfidenceBadge confidence={result.confidence} />
            {result.raw && (
              <div style={{ fontFamily:"var(--font-mono)", fontSize:8, color:"var(--ink2)",
                maxWidth:260, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
                "{result.raw}"
              </div>
            )}
            <div style={{ fontFamily:"var(--font-mono)", fontSize:8, color:"var(--ink2)", letterSpacing:"0.08em" }}>
              TAP TO UPLOAD DIFFERENT SCREENSHOT
            </div>
          </div>
        ) : file ? (
          <div style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:6 }}>
            <div style={{ fontSize:24 }}>🖼</div>
            <div style={{ fontFamily:"var(--font-mono)", fontSize:10, color:"var(--ink2)" }}>{file.name}</div>
          </div>
        ) : (
          <div style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:10 }}>
            <div style={{
              width:44, height:44,
              border:"1.5px solid var(--border-strong)", borderRadius:"3px 12px 12px 3px",
              display:"flex", alignItems:"center", justifyContent:"center", fontSize:20,
            }}>📸</div>
            <div style={{ fontFamily:"var(--font-mono)", fontSize:11, color:"var(--ink)", letterSpacing:"0.04em" }}>
              Upload screenshot
            </div>
            <div style={{ fontFamily:"var(--font-mono)", fontSize:9, color:"var(--ink2)", letterSpacing:"0.1em" }}>
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
  const dots = Array.from({ length: 14 }, (_, i) => ({
    color: ["var(--gold)","var(--positive)","#60A5FA","#C084FC"][i % 4],
    tx: `${(Math.random()-0.5)*130}px`,
    ty: `${-(Math.random()*90+20)}px`,
    delay: `${i*0.04}s`,
  }));
  return (
    <div style={{ position:"absolute", inset:0, pointerEvents:"none", overflow:"hidden" }}>
      {dots.map((d,i) => (
        <div key={i} className="confetti-dot" style={{
          background:d.color, left:"50%", top:"50%",
          "--tx":d.tx, "--ty":d.ty, animationDelay:d.delay,
        }} />
      ))}
    </div>
  );
}

// ─── Completion screen ────────────────────────────────────────────────────────
function CompletionScreen({ count, onReset }) {
  return (
    <div style={{ display:"flex", flexDirection:"column", alignItems:"center",
      justifyContent:"center", gap:20, padding:"60px 24px", textAlign:"center", position:"relative" }}>
      <Confetti />
      <div style={{ width:72, height:72, border:"2px solid var(--positive)", borderRadius:"50%",
        display:"flex", alignItems:"center", justifyContent:"center", fontSize:32, position:"relative" }}>
        ◎<div className="pulse-ring" />
      </div>
      <div>
        <div style={{ fontFamily:"var(--font-display)", fontSize:22, color:"var(--ink)", marginBottom:6 }}>
          VAULT SYNCED
        </div>
        <div style={{ fontFamily:"var(--font-serif)", fontStyle:"italic", fontSize:14, color:"var(--ink2)" }}>
          {count} account{count !== 1 ? "s" : ""} updated
        </div>
      </div>
      <div style={{ fontFamily:"var(--font-mono)", fontSize:10, color:"var(--gold)",
        letterSpacing:"0.14em", padding:"8px 16px",
        border:"1px solid var(--gold)", borderRadius:"2px 8px 8px 2px" }}>
        +{count * 50} XP EARNED
      </div>
      <button onClick={onReset} className="btn-press" style={{
        fontFamily:"var(--font-mono)", fontSize:11, letterSpacing:"0.1em",
        padding:"12px 24px", borderRadius:"2px 9px 9px 2px",
        background:"var(--ink3)", border:"1px solid var(--border)",
        color:"var(--ink2)", cursor:"pointer",
      }}>
        DONE
      </button>
    </div>
  );
}

// ─── Account update card ──────────────────────────────────────────────────────
function AccountUpdateCard({ account, onSave, onSkip }) {
  const { theme } = useTheme();
  const color = ASSETS[account.asset]?.[theme] || "var(--ink2)";

  const [mode, setMode]         = useState("screenshot");
  const [file, setFile]         = useState(null);
  const [loading, setLoading]   = useState(false);
  const [result, setResult]     = useState(null);   // { balance, currency, confidence, raw }
  const [aiError, setAiError]   = useState(null);
  const [manual, setManual]     = useState(String(account.balance || 0));
  const [note, setNote]         = useState("");
  const [saved, setSaved]       = useState(false);

  const activeBalance = mode === "no-change"
    ? (account.balance || 0)
    : mode === "screenshot" && result?.balance != null
      ? result.balance
      : parseFloat(manual) || 0;

  const diff = activeBalance - (account.balance || 0);

  // ── Real Gemini call ──────────────────────────────────────────────────────
  const handleFileSelect = async (f) => {
    setFile(f);
    setLoading(true);
    setResult(null);
    setAiError(null);
    try {
      const base64 = await fileToBase64(f);
      const mimeType = f.type || "image/jpeg";

      const res = await fetch("/api/gemini", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: base64, mimeType }),
      });

      const data = await res.json();

      if (!res.ok || data.error) {
        setAiError(data.error || "Gemini extraction failed");
        setMode("manual"); // fallback to manual
      } else if (data.balance === null) {
        setAiError("Gemini couldn't find a balance in this screenshot");
        setMode("manual");
      } else {
        setResult(data);
        setManual(String(data.balance));
      }
    } catch (err) {
      setAiError("Network error — check your connection");
      setMode("manual");
    }
    setLoading(false);
  };

  const handleSave = async () => {
    setSaved(true);
    try {
      await saveSnapshot({
        account_id: account.id,
        balance:    activeBalance,
        note:       note || null,
        method:     mode === "no-change" ? "no_change" : mode === "screenshot" && result ? "ai" : "manual",
      });
    } catch (e) {
      console.error("saveSnapshot failed:", e);
    }
    setTimeout(() => onSave(activeBalance), 350);
  };

  return (
    <div className="card fade-up" style={{
      borderLeft:`3px solid ${color}`, padding:0, overflow:"hidden",
      opacity: saved ? 0.5 : 1, transform: saved ? "scale(0.98)" : "scale(1)",
      transition:"all 0.3s",
    }}>
      {/* Header */}
      <div style={{ padding:"16px 18px 12px", borderBottom:"1px solid var(--border)" }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start" }}>
          <div>
            <div style={{ fontFamily:"var(--font-mono)", fontSize:14, color:"var(--ink)", marginBottom:3 }}>
              {account.name}
            </div>
            <div style={{ fontFamily:"var(--font-mono)", fontSize:9, color:"var(--ink2)", letterSpacing:"0.08em" }}>
              {account.institution} · last updated {daysAgo(account.updated)}
            </div>
          </div>
          <div style={{ textAlign:"right" }}>
            <div style={{ fontFamily:"var(--font-mono)", fontSize:9, color:"var(--ink2)" }}>current</div>
            <div style={{ fontFamily:"var(--font-display)", fontSize:16, color:"var(--ink)", marginTop:2 }}>
              {fmt(account.balance || 0)}
            </div>
          </div>
        </div>
      </div>

      {/* Mode tabs */}
      <div style={{ display:"flex", borderBottom:"1px solid var(--border)", background:"rgba(0,0,0,0.1)" }}>
        {[
          { key:"screenshot",  label:"📸 Screenshot" },
          { key:"manual",      label:"✎ Manual" },
          { key:"no-change",   label:"✓ No Change" },
        ].map(({ key, label }) => (
          <button key={key} onClick={() => setMode(key)} className="btn-press" style={{
            flex:1, padding:"9px 0", fontFamily:"var(--font-mono)", fontSize:9,
            letterSpacing:"0.12em", textTransform:"uppercase", border:"none",
            cursor:"pointer", background: mode === key ? "var(--surface-solid)" : "transparent",
            color: mode === key ? (key === "no-change" ? "var(--positive)" : "var(--gold)") : "var(--ink2)",
            borderBottom: mode === key ? `2px solid ${key === "no-change" ? "var(--positive)" : color}` : "2px solid transparent",
            transition:"all 0.2s",
          }}>
            {label}
          </button>
        ))}
      </div>

      {/* Input area */}
      <div style={{ padding:"16px 18px" }}>

        {/* AI error banner */}
        {aiError && (
          <div style={{
            marginBottom:12, padding:"8px 12px",
            background:"rgba(232,112,112,0.1)", border:"1px solid rgba(232,112,112,0.3)",
            borderRadius:"2px 8px 8px 2px",
            fontFamily:"var(--font-mono)", fontSize:9, color:"var(--negative)",
          }}>
            ⚠ {aiError}
          </div>
        )}

        {mode === "screenshot" ? (
          <ScreenshotZone
            onFileSelect={handleFileSelect}
            file={file} loading={loading} result={result}
          />
        ) : mode === "no-change" ? (
          <div style={{
            display:"flex", flexDirection:"column", alignItems:"center", gap:8,
            padding:"18px 12px", border:"1.5px solid rgba(125,214,138,0.25)",
            borderRadius:"3px 14px 14px 3px", background:"rgba(125,214,138,0.04)",
          }}>
            <div style={{ fontFamily:"var(--font-display)", fontSize:26, color:"var(--positive)" }}>
              {fmt(account.balance || 0)}
            </div>
            <div style={{ fontFamily:"var(--font-mono)", fontSize:9, color:"var(--positive)", letterSpacing:"0.12em" }}>
              BALANCE UNCHANGED — CONFIRMING AS IS
            </div>
          </div>
        ) : (
          <div>
            <div className="label" style={{ marginBottom:7 }}>New Balance ({account.currency || "AUD"})</div>
            <div style={{ position:"relative" }}>
              <span style={{ position:"absolute", left:12, top:"50%", transform:"translateY(-50%)",
                fontFamily:"var(--font-display)", fontSize:16, color:"var(--ink2)" }}>$</span>
              <input
                type="number" value={manual} onChange={e => setManual(e.target.value)}
                style={{
                  width:"100%", background:"rgba(255,255,255,0.03)",
                  border:"1px solid var(--border-strong)", borderRadius:"2px 9px 9px 2px",
                  padding:"11px 14px 11px 28px", fontFamily:"var(--font-display)",
                  fontSize:20, color:"var(--ink)", outline:"none", boxSizing:"border-box",
                }}
              />
            </div>
          </div>
        )}

        {/* Diff indicator */}
        {diff !== 0 && activeBalance > 0 && (
          <div style={{
            marginTop:10, padding:"7px 12px",
            background: diff > 0 ? "rgba(125,214,138,0.08)" : "rgba(232,112,112,0.08)",
            border:`1px solid ${diff > 0 ? "rgba(125,214,138,0.3)" : "rgba(232,112,112,0.3)"}`,
            borderRadius:"2px 8px 8px 2px",
            fontFamily:"var(--font-mono)", fontSize:10,
            color: diff > 0 ? "var(--positive)" : "var(--negative)",
            display:"flex", justifyContent:"space-between",
          }}>
            <span>{diff > 0 ? "▲" : "▼"} Change</span>
            <span>{diff > 0 ? "+" : ""}{fmt(diff)}</span>
          </div>
        )}

        {/* Note */}
        {mode !== "no-change" && (
          <div style={{ marginTop:12 }}>
            <textarea
              value={note} onChange={e => setNote(e.target.value)}
              placeholder="Note (optional)..." rows={2}
              style={{
                width:"100%", background:"rgba(255,255,255,0.02)",
                border:"1px solid var(--border)", borderRadius:"2px 8px 8px 2px",
                padding:"8px 12px", fontFamily:"var(--font-mono)", fontSize:10,
                color:"var(--ink2)", outline:"none", resize:"none", boxSizing:"border-box",
              }}
            />
          </div>
        )}
      </div>

      {/* Actions */}
      <div style={{ padding:"12px 18px", borderTop:"1px solid var(--border)", display:"flex", gap:8 }}>
        <button onClick={handleSave} disabled={saved} className="btn-press" style={{
          flex:1, padding:"12px",
          background: mode === "no-change" ? "rgba(125,214,138,0.15)" : "var(--gold)",
          border: mode === "no-change" ? "1px solid var(--positive)" : "none",
          borderRadius:"2px 9px 9px 2px", fontFamily:"var(--font-mono)", fontSize:11,
          letterSpacing:"0.1em",
          color: mode === "no-change" ? "var(--positive)" : "#0C0A08",
          cursor: saved ? "not-allowed" : "pointer",
          opacity: saved ? 0.6 : 1,
        }}>
          {saved ? "SAVED ✓" : mode === "no-change" ? "CONFIRM NO CHANGE" : "SAVE BALANCE"}
        </button>
        <button onClick={onSkip} className="btn-press" style={{
          padding:"12px 16px", background:"transparent", border:"1px solid var(--border)",
          borderRadius:"2px 9px 9px 2px", fontFamily:"var(--font-mono)", fontSize:11,
          letterSpacing:"0.1em", color:"var(--ink2)", cursor:"pointer",
        }}>
          SKIP
        </button>
      </div>
    </div>
  );
}

// ─── Main update page ─────────────────────────────────────────────────────────
export default function UpdatePage() {
  const [accounts, setAccounts]   = useState([]);
  const [loading, setLoading]     = useState(true);
  const [done, setDone]           = useState([]);
  const [skipped, setSkipped]     = useState([]);
  const [complete, setComplete]   = useState(false);
  const { theme } = useTheme();

  useEffect(() => {
    fetchAccounts().then(accs => { setAccounts(accs); setLoading(false); }).catch(console.error);
  }, []);

  const dueAccounts = getDueAccounts(accounts);
  const remaining   = dueAccounts.filter(a => !done.includes(a.id) && !skipped.includes(a.id));
  const current     = remaining[0];

  const handleSave = (id) => {
    const next = [...done, id];
    setDone(next);
    if (next.length + skipped.length >= dueAccounts.length) setTimeout(() => setComplete(true), 600);
  };

  const handleSkip = (id) => {
    const next = [...skipped, id];
    setSkipped(next);
    if (done.length + next.length >= dueAccounts.length) setTimeout(() => setComplete(true), 300);
  };

  const handleReset = () => { setDone([]); setSkipped([]); setComplete(false); };

  if (loading) return (
    <>
      <TopBar />
      <main className="page" style={{ paddingTop:16 }}>
        <div style={{ textAlign:"center", padding:"48px 0", fontFamily:"var(--font-mono)", fontSize:10, color:"var(--ink2)", letterSpacing:"0.1em" }}>
          LOADING ACCOUNTS...
        </div>
      </main>
      <BottomNav />
    </>
  );

  return (
    <>
      <TopBar />
      <main className="page" style={{ paddingTop:16, display:"flex", flexDirection:"column", gap:16 }}>

        {complete ? (
          <CompletionScreen count={done.length} onReset={handleReset} />
        ) : (
          <>
            <div className="fade-up">
              <div style={{ fontFamily:"var(--font-display)", fontSize:20, color:"var(--ink)", marginBottom:4 }}>Weekly Sync</div>
              <div style={{ fontFamily:"var(--font-mono)", fontSize:10, color:"var(--ink2)", letterSpacing:"0.08em" }}>
                {remaining.length} account{remaining.length !== 1 ? "s" : ""} remaining
              </div>
            </div>

            <div className="fade-up fade-up-1">
              <XPBar current={done.length} total={dueAccounts.length} />
            </div>

            {/* Queue chips */}
            <div className="fade-up fade-up-1" style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
              {dueAccounts.map(a => {
                const isDone    = done.includes(a.id);
                const isSkipped = skipped.includes(a.id);
                const isCurrent = current?.id === a.id;
                const color = ASSETS[a.asset]?.[theme] || "var(--ink2)";
                return (
                  <div key={a.id} style={{
                    fontFamily:"var(--font-mono)", fontSize:8, letterSpacing:"0.08em",
                    padding:"3px 9px", borderRadius:"2px 7px 7px 2px",
                    background: isDone ? `${color}22` : isSkipped ? "var(--ink3)" : isCurrent ? `${color}18` : "transparent",
                    border:`1px solid ${isDone || isCurrent ? color : "var(--border)"}`,
                    color: isDone ? color : isSkipped ? "var(--ink2)" : isCurrent ? color : "var(--ink2)",
                    textDecoration: isSkipped ? "line-through" : "none",
                    transition:"all 0.3s",
                  }}>
                    {isDone ? "✓ " : isSkipped ? "— " : isCurrent ? "▶ " : ""}{a.name}
                  </div>
                );
              })}
            </div>

            {/* Active card */}
            {current ? (
              <AccountUpdateCard
                key={current.id}
                account={current}
                onSave={() => handleSave(current.id)}
                onSkip={() => handleSkip(current.id)}
              />
            ) : dueAccounts.length === 0 ? (
              <div style={{
                textAlign:"center", padding:"48px 24px",
                border:"1px dashed var(--border)", borderRadius:"3px 14px 14px 3px",
              }}>
                <div style={{ fontSize:28, marginBottom:12 }}>◎</div>
                <div style={{ fontFamily:"var(--font-display)", fontSize:16, color:"var(--ink)", marginBottom:6 }}>All up to date</div>
                <div style={{ fontFamily:"var(--font-mono)", fontSize:10, color:"var(--ink2)" }}>No accounts due for sync</div>
              </div>
            ) : null}

            {/* Up next */}
            {remaining.length > 1 && (
              <div className="fade-up" style={{ opacity:0.55 }}>
                <div className="label" style={{ marginBottom:8 }}>Up next</div>
                <div className="card" style={{ padding:"12px 16px", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                  <div>
                    <div style={{ fontFamily:"var(--font-mono)", fontSize:12, color:"var(--ink)" }}>{remaining[1].name}</div>
                    <div style={{ fontFamily:"var(--font-mono)", fontSize:9, color:"var(--ink2)", marginTop:2 }}>
                      {assetLabel(remaining[1].asset)} · {remaining[1].institution}
                    </div>
                  </div>
                  <div style={{ fontFamily:"var(--font-display)", fontSize:14, color:"var(--ink2)" }}>
                    {fmt(remaining[1].balance || 0)}
                  </div>
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
