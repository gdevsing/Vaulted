"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import AppShell from "@/components/app-shell";
import { useTheme } from "@/app/layout";
import { fetchAccounts, createAccount, updateAccount, deleteAccount, fetchSettings, updateSettings, sendTestNotification, getNotifyStatus, fetchFxRate } from "@/lib/api";
import { fmt, assetLabel, ownerLabel } from "@/lib/utils";
import { ASSETS } from "@/lib/tokens";

// ─── Constants ────────────────────────────────────────────────────────────────
const ASSET_OPTIONS     = ["cash","shares","crypto","super"];
const CURRENCY_OPTIONS  = ["AUD","USD"];
const FREQUENCY_OPTIONS = ["weekly","fortnightly","monthly"];
const EMPTY_ACCOUNT     = { name:"", institution:"", owner:"H", asset:"cash", currency:"AUD", frequency:"weekly", group:"" };
const OWNER_DEFAULTS    = [
  { key:"H", defaultLabel:"Husband" },
  { key:"W", defaultLabel:"Wife"    },
  { key:"J", defaultLabel:"Joint"   },
];

// ─── Credential field groups ──────────────────────────────────────────────────
// GitHub SVG icon
const GitHubIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" style={{ display:"inline-block", verticalAlign:"middle" }} fill="var(--gold)" xmlns="http://www.w3.org/2000/svg">
    <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z"/>
  </svg>
);

const CREDENTIAL_GROUPS = [
  {
    id: "gemini",
    label: "Gemini AI",
    icon: "✦",
    description: "Google Gemini 2.5 Flash — reads balances from screenshots",
    link: "https://aistudio.google.com/apikey",
    linkLabel: "Get API key →",
    fields: [
      { key: "gemini_api_key", label: "API Key", secret: true,  placeholder: "AIza..." },
      { key: "gemini_model",   label: "Model",   secret: false, placeholder: "gemini-2.5-flash-preview-04-17" },
    ],
  },
  {
    id: "ntfy",
    label: "ntfy.sh Notifications",
    icon: "◎",
    description: "Push notifications for weekly sync reminders",
    link: "https://ntfy.sh",
    linkLabel: "ntfy.sh docs →",
    fields: [
      { key: "ntfy_topic",    label: "Topic",          secret: false, placeholder: "vaulted-sync" },
      { key: "ntfy_server",   label: "Server URL",     secret: false, placeholder: "https://ntfy.sh" },
      { key: "ntfy_password", label: "Password (opt)", secret: true,  placeholder: "Leave blank for public topics" },
    ],
  },
  {
    id: "gdrive",
    label: "GitHub Backup",
    icon: "github",
    description: "Daily DB backup pushed to a private GitHub repository",
    link: "https://github.com/settings/tokens/new?scopes=repo&description=Vaulted+Backup",
    linkLabel: "Create token →",
    fields: [
      { key: "github_token",    label: "Personal Access Token", secret: true,  placeholder: "ghp_..." },
      { key: "github_repo",     label: "Repository",            secret: false, placeholder: "username/vaulted-backup" },
      { key: "backup_filename", label: "Backup filename",       secret: false, placeholder: "vaulted-backup.db" },
    ],
  },
  {
    id: "app",
    label: "App Settings",
    icon: "⚙",
    description: "General app configuration",
    fields: [
      { key: "app_public_url", label: "Public URL",      secret: false, placeholder: "https://your-domain.com", help: "Your app's public domain. Used in notification click links so tapping the alert opens your app directly." },
      { key: "app_password",   label: "Login Password",  secret: true,  placeholder: "Choose a strong password" },
      { key: "notify_day",     label: "Notify Day",      secret: false, placeholder: "sunday" },
      { key: "ntfy_topic",     label: "ntfy Topic",      secret: false, placeholder: "vaulted-sync" },
    ],
  },
];

// Render icon — handles string or special "github" key
function CardIcon({ icon, size = 16 }) {
  if (icon === "github") return <GitHubIcon />;
  return <span style={{ fontFamily: "var(--font-mono)", fontSize: size, color: "var(--gold)", lineHeight: 1 }}>{icon}</span>;
}

// ─── Reusable input ───────────────────────────────────────────────────────────
function Field({ label, children }) {
  return (
    <div>
      <div className="label" style={{ marginBottom: 6 }}>{label}</div>
      {children}
    </div>
  );
}

function Input({ value, onChange, placeholder, type = "text" }) {
  return (
    <input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
      style={{
        width:"100%", background:"rgba(255,255,255,0.03)",
        border:"1px solid var(--border-strong)", borderRadius:"2px 9px 9px 2px",
        padding:"9px 12px", fontFamily:"var(--font-mono)", fontSize:11,
        color:"var(--ink)", outline:"none", boxSizing:"border-box",
      }}
    />
  );
}

function Select({ value, onChange, options }) {
  return (
    <select value={value} onChange={e => onChange(e.target.value)}
      style={{
        width:"100%", background:"rgba(255,255,255,0.03)",
        border:"1px solid var(--border-strong)", borderRadius:"2px 9px 9px 2px",
        padding:"9px 12px", fontFamily:"var(--font-mono)", fontSize:11,
        color:"var(--ink)", outline:"none", cursor:"pointer", appearance:"none",
        backgroundImage:`url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='6'%3E%3Cpath d='M0 0l5 6 5-6z' fill='%237A7068'/%3E%3C/svg%3E")`,
        backgroundRepeat:"no-repeat", backgroundPosition:"right 12px center",
      }}
    >
      {options.map(o => (
        <option key={o.value ?? o} value={o.value ?? o}>{o.label ?? o}</option>
      ))}
    </select>
  );
}

// ─── Secret input — no show/hide, always masked ──────────────────────────────
function SecretInput({ value, onChange, placeholder }) {
  const isMasked = value?.startsWith("••••");
  return (
    <input
      type="password"
      value={value || ""}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      style={{
        width:"100%", background:"rgba(255,255,255,0.03)",
        border:"1px solid var(--border-strong)", borderRadius:"2px 9px 9px 2px",
        padding:"9px 12px", fontFamily:"var(--font-mono)", fontSize:11,
        color: isMasked ? "var(--ink2)" : "var(--ink)",
        outline:"none", boxSizing:"border-box",
      }}
    />
  );
}

// ─── Password confirm modal ───────────────────────────────────────────────────
function PasswordConfirmModal({ onConfirm, onCancel, error }) {
  const [pwd, setPwd] = useState("");
  const { theme } = useTheme();

  const handleSubmit = () => { if (pwd) onConfirm(pwd); };

  return (
    <>
      <div onClick={onCancel} style={{
        position:"fixed", inset:0, background:"rgba(0,0,0,0.6)", zIndex:299,
      }} />
      <div style={{
        position:"fixed", top:"50%", left:"50%",
        transform:"translate(-50%,-50%)",
        background: "#1A1614",
        border:"1px solid var(--border-strong)",
        borderRadius:"3px 16px 16px 3px",
        padding:"24px 24px 20px",
        width:"calc(100% - 48px)", maxWidth:360,
        zIndex:300,
        boxShadow:"0 24px 60px rgba(0,0,0,0.5)",
      }}>
        <div style={{ fontFamily:"var(--font-display)", fontSize:15, color:"var(--ink)", marginBottom:4 }}>
          Confirm password
        </div>
        <div style={{ fontFamily:"var(--font-mono)", fontSize:9, color:"var(--ink2)", letterSpacing:"0.06em", marginBottom:16 }}>
          Enter your current login password to save changes
        </div>

        <input
          type="password"
          value={pwd}
          onChange={e => setPwd(e.target.value)}
          onKeyDown={e => e.key === "Enter" && handleSubmit()}
          placeholder="Current password"
          autoFocus
          style={{
            width:"100%", background:"rgba(255,255,255,0.03)",
            border:`1px solid ${error ? "var(--negative)" : "var(--border-strong)"}`,
            borderRadius:"2px 9px 9px 2px",
            padding:"10px 12px", fontFamily:"var(--font-mono)", fontSize:12,
            color:"var(--ink)", outline:"none", boxSizing:"border-box", marginBottom:8,
          }}
        />
        {error && (
          <div style={{ fontFamily:"var(--font-mono)", fontSize:9, color:"var(--negative)", marginBottom:8, letterSpacing:"0.06em" }}>
            ⚠ Incorrect password
          </div>
        )}

        <div style={{ display:"flex", gap:8, marginTop:8 }}>
          <button onClick={handleSubmit} disabled={!pwd} className="btn-press" style={{
            flex:1, padding:"11px",
            background: pwd ? "var(--gold)" : "var(--ink3)",
            border:"none", borderRadius:"2px 9px 9px 2px",
            fontFamily:"var(--font-mono)", fontSize:11, letterSpacing:"0.1em",
            color: pwd ? "#0C0A08" : "var(--ink2)", cursor: pwd ? "pointer" : "not-allowed",
          }}>
            CONFIRM
          </button>
          <button onClick={onCancel} className="btn-press" style={{
            padding:"11px 16px", background:"transparent",
            border:"1px solid var(--border)", borderRadius:"2px 9px 9px 2px",
            fontFamily:"var(--font-mono)", fontSize:11, letterSpacing:"0.1em",
            color:"var(--ink2)", cursor:"pointer",
          }}>
            CANCEL
          </button>
        </div>
      </div>
    </>
  );
}

// ─── Credential group card ────────────────────────────────────────────────────
function CredentialGroup({ group, settings, onSave }) {
  const [local, setLocal]         = useState({});
  const [saving, setSaving]       = useState(false);
  const [saved, setSaved]         = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [pwdError, setPwdError]   = useState(false);

  useEffect(() => {
    const init = {};
    group.fields.forEach(f => { init[f.key] = settings[f.key] || ""; });
    setLocal(init);
  }, [settings, group]);

  const handleSaveClick = () => {
    setPwdError(false);
    setShowModal(true);
  };

  const handleConfirm = async (password) => {
    // Verify password first
    const res = await fetch("/api/verify-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });
    const { valid } = await res.json();
    if (!valid) { setPwdError(true); return; }

    setShowModal(false);
    setSaving(true);
    await onSave(local);
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const hasChanges = group.fields.some(f => {
    const orig = settings[f.key] || "";
    return local[f.key] !== orig && !local[f.key]?.startsWith("••••");
  });

  return (
    <div className="card fade-up" style={{ padding:"18px 20px" }}>
      {/* Header */}
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:14 }}>
        <div>
          <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:4 }}>
            <CardIcon icon={group.icon} size={16} />
            <span style={{ fontFamily:"var(--font-display)", fontSize:14, color:"var(--ink)" }}>{group.label}</span>
            {group.fields.some(f => f.secret && settings[f.key]) && (
              <div style={{ width:6, height:6, borderRadius:"50%", background:"var(--positive)", boxShadow:"0 0 6px var(--positive)", flexShrink:0 }} />
            )}
          </div>
          <div style={{ fontFamily:"var(--font-mono)", fontSize:9, color:"var(--ink2)", letterSpacing:"0.06em", lineHeight:1.6 }}>
            {group.description}
          </div>
        </div>
        {group.link && (
          <a href={group.link} target="_blank" rel="noopener noreferrer"
            style={{ fontFamily:"var(--font-mono)", fontSize:8, color:"var(--gold)", letterSpacing:"0.1em", textDecoration:"none", flexShrink:0, marginLeft:12 }}>
            {group.linkLabel}
          </a>
        )}
      </div>

      {/* Fields */}
      <div style={{ display:"flex", flexDirection:"column", gap:10, marginBottom:14 }}>
        {group.fields.map(f => (
          <Field key={f.key} label={f.label}>
            {f.secret ? (
              <SecretInput
                value={local[f.key] || ""}
                onChange={v => setLocal(l => ({ ...l, [f.key]: v }))}
                placeholder={f.placeholder}
              />
            ) : (
              <Input
                value={local[f.key] || ""}
                onChange={v => setLocal(l => ({ ...l, [f.key]: v }))}
                placeholder={f.placeholder}
              />
            )}
            {f.help && (
              <div style={{
                fontFamily: "var(--font-mono)", fontSize: 9,
                color: "var(--ink2)", letterSpacing: "0.04em",
                marginTop: 5, lineHeight: 1.6,
              }}>
                {f.help}
              </div>
            )}
          </Field>
        ))}
      </div>

      {/* Password confirm modal */}
      {showModal && (
        <PasswordConfirmModal
          onConfirm={handleConfirm}
          onCancel={() => { setShowModal(false); setPwdError(false); }}
          error={pwdError}
        />
      )}

      {/* Save button */}
      <button
        onClick={handleSaveClick}
        disabled={saving || !hasChanges}
        className="btn-press"
        style={{
          width:"100%", padding:"10px",
          background: saved ? "rgba(125,214,138,0.15)" : hasChanges ? "var(--gold)" : "var(--ink3)",
          border: saved ? "1px solid var(--positive)" : "none",
          borderRadius:"2px 9px 9px 2px",
          fontFamily:"var(--font-mono)", fontSize:10, letterSpacing:"0.1em",
          color: saved ? "var(--positive)" : hasChanges ? "#0C0A08" : "var(--ink2)",
          cursor: hasChanges ? "pointer" : "not-allowed",
          transition:"all 0.2s",
        }}
      >
        {saving ? "SAVING..." : saved ? "✓ SAVED" : "SAVE"}
      </button>
    </div>
  );
}

// ─── Owner labels card ────────────────────────────────────────────────────────
function OwnerLabelsCard({ settings, onSave }) {
  const [local, setLocal]   = useState({});
  const [saving, setSaving] = useState(false);
  const [saved, setSaved]   = useState(false);

  useEffect(() => {
    const init = {};
    OWNER_DEFAULTS.forEach(({ key, defaultLabel }) => {
      init[`owner_${key}_label`]  = settings[`owner_${key}_label`]  || defaultLabel;
      init[`owner_${key}_active`] = settings[`owner_${key}_active`] !== "0" ? "1" : "0";
    });
    setLocal(init);
  }, [settings]);

  const hasChanges = OWNER_DEFAULTS.some(({ key, defaultLabel }) => {
    const lk = `owner_${key}_label`, ak = `owner_${key}_active`;
    return local[lk] !== (settings[lk] || defaultLabel) ||
           local[ak] !== (settings[ak] !== "0" ? "1" : "0");
  });

  const handleSave = async () => {
    setSaving(true);
    await onSave(local);
    setSaving(false); setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="card fade-up" style={{ padding:"18px 20px" }}>
      <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:4 }}>
        <span style={{ fontFamily:"var(--font-mono)", fontSize:16, color:"var(--gold)" }}>⊙</span>
        <span style={{ fontFamily:"var(--font-display)", fontSize:14, color:"var(--ink)" }}>Owner Labels</span>
      </div>
      <div style={{ fontFamily:"var(--font-mono)", fontSize:9, color:"var(--ink2)", letterSpacing:"0.06em", marginBottom:14 }}>
        Rename to match your household. Keys (H / W / J) stay in the DB — only what's shown in the UI changes.
      </div>
      <div style={{ display:"flex", flexDirection:"column", gap:10, marginBottom:14 }}>
        {OWNER_DEFAULTS.map(({ key, defaultLabel }) => (
          <div key={key} style={{ display:"flex", gap:10, alignItems:"center" }}>
            <div style={{ flex:1 }}>
              <Input
                value={local[`owner_${key}_label`] || ""}
                onChange={v => setLocal(l => ({ ...l, [`owner_${key}_label`]: v }))}
                placeholder={defaultLabel}
              />
            </div>
            <button
              onClick={() => setLocal(l => ({ ...l, [`owner_${key}_active`]: l[`owner_${key}_active`] === "1" ? "0" : "1" }))}
              className="btn-press"
              style={{
                padding:"8px 14px", borderRadius:"2px 9px 9px 2px",
                border: `1px solid ${local[`owner_${key}_active`] === "1" ? "rgba(125,214,138,0.5)" : "var(--border)"}`,
                cursor:"pointer", flexShrink:0,
                fontFamily:"var(--font-mono)", fontSize:9, letterSpacing:"0.1em",
                background: local[`owner_${key}_active`] === "1" ? "rgba(125,214,138,0.12)" : "transparent",
                color:      local[`owner_${key}_active`] === "1" ? "var(--positive)" : "var(--ink3)",
                transition: "all 0.2s",
              }}
            >
              {local[`owner_${key}_active`] === "1" ? "ON" : "OFF"}
            </button>
          </div>
        ))}
      </div>
      <button
        onClick={handleSave} disabled={saving || !hasChanges} className="btn-press"
        style={{
          width:"100%", padding:"10px",
          background: saved ? "rgba(125,214,138,0.15)" : hasChanges ? "var(--gold)" : "var(--ink3)",
          border: saved ? "1px solid var(--positive)" : "none",
          borderRadius:"2px 9px 9px 2px",
          fontFamily:"var(--font-mono)", fontSize:10, letterSpacing:"0.1em",
          color: saved ? "var(--positive)" : hasChanges ? "#0C0A08" : "var(--ink2)",
          cursor: hasChanges ? "pointer" : "not-allowed", transition:"all 0.2s",
        }}
      >
        {saving ? "SAVING..." : saved ? "✓ SAVED" : "SAVE"}
      </button>
    </div>
  );
}

// ─── Account form ─────────────────────────────────────────────────────────────
function AccountForm({ initial = EMPTY_ACCOUNT, onSave, onCancel, isNew, ownerOptions }) {
  const [form, setForm] = useState({ ...initial });
  const { theme } = useTheme();
  const set = key => val => setForm(f => ({ ...f, [key]: val }));
  const color = ASSETS[form.asset]?.[theme] || "var(--gold)";
  const valid = form.name.trim() && form.institution.trim();

  return (
    <div className="card fade-up" style={{ padding:"20px 18px", borderLeft:`3px solid ${color}` }}>
      <div style={{ fontFamily:"var(--font-display)", fontSize:15, color:"var(--ink)", marginBottom:16 }}>
        {isNew ? "New Account" : "Edit Account"}
      </div>
      <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
        <div style={{ display:"flex", gap:10 }}>
          <div style={{ flex:2 }}>
            <Field label="Account Name"><Input value={form.name} onChange={set("name")} placeholder="e.g. Up Bank" /></Field>
          </div>
          <div style={{ flex:2 }}>
            <Field label="Institution"><Input value={form.institution} onChange={set("institution")} placeholder="e.g. Up" /></Field>
          </div>
        </div>
        <div style={{ display:"flex", gap:10 }}>
          <div style={{ flex:1 }}>
            <Field label="Owner">
              <Select value={form.owner} onChange={set("owner")} options={ownerOptions} />
            </Field>
          </div>
          <div style={{ flex:1 }}>
            <Field label="Asset Class">
              <Select value={form.asset} onChange={set("asset")}
                options={ASSET_OPTIONS.map(a => ({ value:a, label:assetLabel(a) }))} />
            </Field>
          </div>
        </div>
        <div style={{ display:"flex", gap:10 }}>
          <div style={{ flex:1 }}>
            <Field label="Currency">
              <Select value={form.currency} onChange={set("currency")} options={CURRENCY_OPTIONS} />
            </Field>
          </div>
          <div style={{ flex:1 }}>
            <Field label="Frequency">
              <Select value={form.frequency} onChange={set("frequency")}
                options={FREQUENCY_OPTIONS.map(f => ({ value:f, label:f.charAt(0).toUpperCase()+f.slice(1) }))} />
            </Field>
          </div>
        </div>
        <Field label="Group (optional)">
          <Input value={form.group || ""} onChange={set("group")} placeholder="e.g. Stake" />
        </Field>
      </div>
      <div style={{ display:"flex", gap:8, marginTop:18 }}>
        <button onClick={() => valid && onSave(form)} className="btn-press" disabled={!valid}
          style={{
            flex:1, padding:"11px", background: valid ? "var(--gold)" : "var(--ink3)",
            border:"none", borderRadius:"2px 9px 9px 2px",
            fontFamily:"var(--font-mono)", fontSize:11, letterSpacing:"0.1em",
            color: valid ? "#0C0A08" : "var(--ink2)", cursor: valid ? "pointer" : "not-allowed",
          }}>
          {isNew ? "ADD ACCOUNT" : "SAVE CHANGES"}
        </button>
        <button onClick={onCancel} className="btn-press"
          style={{
            padding:"11px 16px", background:"transparent", border:"1px solid var(--border)",
            borderRadius:"2px 9px 9px 2px", fontFamily:"var(--font-mono)", fontSize:11,
            letterSpacing:"0.1em", color:"var(--ink2)", cursor:"pointer",
          }}>
          CANCEL
        </button>
      </div>
    </div>
  );
}

// ─── Account row ──────────────────────────────────────────────────────────────
function AccountRow({ account, onEdit, onDelete, ownersMap }) {
  const { theme } = useTheme();
  const color = ASSETS[account.asset]?.[theme] || "var(--ink2)";
  const [confirmDelete, setConfirmDelete] = useState(false);

  return (
    <div className="card lift fade-up" style={{ padding:"13px 16px", borderLeft:`3px solid ${color}`, display:"flex", alignItems:"center", gap:12 }}>
      <div style={{ flex:1, minWidth:0 }}>
        <div style={{ display:"flex", alignItems:"center", gap:6, marginBottom:3 }}>
          <div style={{ fontFamily:"var(--font-mono)", fontSize:12, color:"var(--ink)" }}>{account.name}</div>
          <div style={{
            fontFamily:"var(--font-mono)", fontSize:8, padding:"1px 5px",
            borderRadius:"2px 5px 5px 2px", background:`${color}18`, color,
            border:`1px solid ${color}30`, textTransform:"uppercase",
          }}>
            {assetLabel(account.asset)}
          </div>
          {account.grp && <div style={{ fontFamily:"var(--font-mono)", fontSize:8, color:"var(--ink2)" }}>{account.grp}</div>}
        </div>
        <div style={{ fontFamily:"var(--font-mono)", fontSize:9, color:"var(--ink2)", letterSpacing:"0.06em" }}>
          {account.institution} · {ownerLabel(account.owner, ownersMap)} · {account.currency} · {account.frequency}
        </div>
        {account.currency !== "AUD" && account.native_balance != null && (
          <div style={{ fontFamily:"var(--font-mono)", fontSize:8, color:"var(--ink3)", marginTop:2 }}>
            {account.currency} {fmt(account.native_balance)}
            {account.liveRate && <span style={{ marginLeft:4 }}>· 1 {account.currency} = {account.liveRate.toFixed(4)} AUD</span>}
          </div>
        )}
      </div>
      <div style={{ textAlign:"right", flexShrink:0 }}>
        <div style={{ fontFamily:"var(--font-display)", fontSize:14, color:"var(--ink)" }}>
          {fmt(account.balance || 0)}
        </div>
        {account.currency !== "AUD" && (
          <div style={{ fontFamily:"var(--font-mono)", fontSize:8, color:"var(--ink3)", marginTop:1 }}>AUD</div>
        )}
      </div>
      <div style={{ display:"flex", gap:6, flexShrink:0 }}>
        <button onClick={() => onEdit(account)} className="btn-press"
          style={{ padding:"5px 10px", background:"transparent", border:"1px solid var(--border)", borderRadius:"2px 7px 7px 2px", fontFamily:"var(--font-mono)", fontSize:9, letterSpacing:"0.08em", color:"var(--ink2)", cursor:"pointer" }}>
          EDIT
        </button>
        {confirmDelete ? (
          <button onClick={() => onDelete(account.id)} className="btn-press"
            style={{ padding:"5px 10px", background:"rgba(232,112,112,0.15)", border:"1px solid var(--negative)", borderRadius:"2px 7px 7px 2px", fontFamily:"var(--font-mono)", fontSize:9, color:"var(--negative)", cursor:"pointer" }}>
            CONFIRM
          </button>
        ) : (
          <button onClick={() => setConfirmDelete(true)} className="btn-press"
            style={{ padding:"5px 10px", background:"transparent", border:"1px solid var(--border)", borderRadius:"2px 7px 7px 2px", fontFamily:"var(--font-mono)", fontSize:9, color:"var(--ink2)", cursor:"pointer" }}>
            ✕
          </button>
        )}
      </div>
    </div>
  );
}


// ─── Cron status card ─────────────────────────────────────────────────────────
function CronStatusCard() {
  const [status,  setStatus]  = useState(null);
  const [running, setRunning] = useState({});

  const refresh = () => fetch("/api/cron-status").then(r => r.json()).then(setStatus).catch(() => {});

  useEffect(() => { refresh(); }, []);

  if (!status) return null;

  const jobs = [
    { key: "notify", label: "Weekly Notification", schedule: "Sundays 9 AM" },
    { key: "fx",     label: "FX Rate Refresh",      schedule: "Daily 6 AM"   },
    { key: "backup", label: "DB Backup",             schedule: "Mondays 2 AM" },
  ];

  const runJob = async (key) => {
    setRunning(r => ({ ...r, [key]: true }));
    try {
      await fetch("/api/run-job", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ job: key }),
      });
      await refresh();
    } finally {
      setRunning(r => ({ ...r, [key]: false }));
    }
  };

  return (
    <div className="card fade-up" style={{ padding: "18px 20px" }}>
      <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:14 }}>
        <span style={{ fontFamily:"var(--font-mono)", fontSize:16, color:"var(--gold)" }}>⟳</span>
        <span style={{ fontFamily:"var(--font-display)", fontSize:14, color:"var(--ink)" }}>Cron Jobs</span>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {jobs.map(({ key, label, schedule }) => {
          const runs = status[key] || [];
          const anyFail = runs.some(r => !r.ok);
          const dotColor = runs.length === 0 ? "var(--ink3)" : anyFail ? "var(--negative)" : "var(--positive)";
          const isRunning = running[key];

          return (
            <div key={key} style={{ borderTop: "1px solid var(--border)", paddingTop: 10 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--ink)" }}>{label}</span>
                <div style={{ width: 6, height: 6, borderRadius: "50%", background: dotColor, boxShadow: `0 0 6px ${dotColor}`, flexShrink:0 }} />
                <span style={{ fontFamily: "var(--font-mono)", fontSize: 9, color: "var(--ink2)" }}>{schedule}</span>
                <button
                  onClick={() => runJob(key)}
                  disabled={isRunning}
                  className="btn-press"
                  style={{
                    marginLeft: "auto",
                    fontFamily: "var(--font-mono)", fontSize: 9,
                    letterSpacing: "0.08em", textTransform: "uppercase",
                    background: "var(--ink3)", color: "var(--ink2)",
                    border: "1px solid var(--border)", borderRadius: "2px 6px 6px 2px",
                    padding: "3px 8px", cursor: isRunning ? "default" : "pointer",
                    opacity: isRunning ? 0.5 : 1,
                  }}
                >
                  {isRunning ? "···" : "Run Now"}
                </button>
              </div>
              {runs.length === 0 ? (
                <div style={{ fontFamily: "var(--font-mono)", fontSize: 9, color: "var(--ink2)", letterSpacing: "0.06em" }}>No runs recorded yet</div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                  {runs.map((r, i) => (
                    <div key={i} style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
                      <span style={{ fontFamily: "var(--font-mono)", fontSize: 9, color: r.ok ? "var(--positive)" : "var(--negative)", flexShrink: 0 }}>
                        {r.ok ? "✓" : "✕"}
                      </span>
                      <span style={{ fontFamily: "var(--font-mono)", fontSize: 9, color: "var(--ink2)" }}>
                        {new Date(r.time).toLocaleString("en-AU", { dateStyle: "short", timeStyle: "short" })}
                      </span>
                      <span style={{ fontFamily: "var(--font-mono)", fontSize: 9, color: r.ok ? "var(--ink2)" : "var(--negative)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {r.message}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Notification status card ─────────────────────────────────────────────────
function NotifyStatusCard() {
  const [status, setStatus]   = useState(null);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState(null);

  useEffect(() => {
    getNotifyStatus().then(setStatus).catch(() => {});
  }, []);

  const handleTest = async () => {
    setTesting(true);
    setTestResult(null);
    try {
      await sendTestNotification();
      setTestResult({ ok: true, message: "Notification sent! Check your phone." });
    } catch (err) {
      setTestResult({ ok: false, message: err.message });
    }
    setTesting(false);
  };

  if (!status) return null;

  const accentColor = status.configured ? "var(--positive)" : "var(--negative)";

  return (
    <div className="card fade-up" style={{ padding:"18px 20px" }}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start" }}>
        <div>
          <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:4 }}>
            <span style={{ fontFamily:"var(--font-mono)", fontSize:16, color:"var(--gold)" }}>◈</span>
            <span style={{ fontFamily:"var(--font-display)", fontSize:14, color:"var(--ink)" }}>
              {status.configured ? "ntfy.sh connected" : "ntfy.sh not configured"}
            </span>
            <div style={{ width:6, height:6, borderRadius:"50%", background:accentColor, boxShadow:`0 0 6px ${accentColor}`, flexShrink:0 }} />
          </div>
          {status.configured && (
            <div style={{ fontFamily:"var(--font-mono)", fontSize:9, color:"var(--ink2)", letterSpacing:"0.06em" }}>
              Topic: {status.topic} · {status.lastNotified ? `Last sent ${new Date(status.lastNotified).toLocaleDateString()}` : "Never sent"}
            </div>
          )}
        </div>
        {status.configured && (
          <button onClick={handleTest} disabled={testing} className="btn-press" style={{
            padding:"6px 12px", background:"transparent",
            border:"1px solid var(--positive)", borderRadius:"2px 7px 7px 2px",
            fontFamily:"var(--font-mono)", fontSize:9, letterSpacing:"0.1em",
            color:"var(--positive)", cursor: testing ? "wait" : "pointer",
          }}>
            {testing ? "SENDING..." : "TEST"}
          </button>
        )}
      </div>
      {testResult && (
        <div style={{ marginTop:8, fontFamily:"var(--font-mono)", fontSize:9, color: testResult.ok ? "var(--positive)" : "var(--negative)", letterSpacing:"0.06em" }}>
          {testResult.ok ? "✓" : "⚠"} {testResult.message}
        </div>
      )}
      {status.configured && (
        <div style={{ marginTop:8, fontFamily:"var(--font-mono)", fontSize:8, color:"var(--ink2)", letterSpacing:"0.06em" }}>
          Subscribe: <span style={{ color:"var(--gold)" }}>{status.subscribeUrl}</span>
        </div>
      )}
    </div>
  );
}


// ─── Backup source info ──────────────────────────────────────────────────────
function BackupSourceInfo({ repoInfo, status }) {
  const [lastBackup, setLastBackup] = useState(null);

  useEffect(() => {
    if (!repoInfo?.repo || !repoInfo?.token) return;
    fetch(
      `https://api.github.com/repos/${repoInfo.repo}/commits?path=${repoInfo.file}&per_page=1`,
      { headers: { Authorization: `token ${repoInfo.token}` } }
    )
      .then(r => r.json())
      .then(commits => {
        if (commits?.[0]) {
          const msg = commits[0].commit?.message || "";
          const date = commits[0].commit?.author?.date;
          const label = msg.startsWith("backup:") ? msg.replace("backup:", "").trim()
            : date ? date.slice(0, 10) : null;
          setLastBackup(label);
        }
      })
      .catch(() => {});
  }, [repoInfo]);

  if (status === "loading") {
    return (
      <div style={{ fontFamily: "var(--font-mono)", fontSize: 9, color: "var(--ink2)",
        letterSpacing: "0.06em", marginBottom: 14 }}>Loading config...</div>
    );
  }
  if (!repoInfo?.repo) {
    return (
      <div style={{ fontFamily: "var(--font-mono)", fontSize: 9, color: "var(--negative)",
        letterSpacing: "0.06em", padding: "10px 14px", marginBottom: 14,
        background: "rgba(232,112,112,0.08)", border: "1px solid rgba(232,112,112,0.2)",
        borderRadius: "2px 7px 7px 2px" }}>
        ⚠ No GitHub repo configured — set it in GitHub Backup above
      </div>
    );
  }
  return (
    <div style={{ padding: "10px 14px", marginBottom: 14,
      background: "rgba(255,255,255,0.03)", border: "1px solid var(--border-strong)",
      borderRadius: "2px 9px 9px 2px" }}>
      <div style={{ fontFamily: "var(--font-mono)", fontSize: 9, color: "var(--ink2)",
        letterSpacing: "0.06em", marginBottom: 4 }}>SOURCE</div>
      <div style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--gold)" }}>
        {repoInfo.repo}
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 4 }}>
        <div style={{ fontFamily: "var(--font-mono)", fontSize: 9, color: "var(--ink2)" }}>
          /{repoInfo.file}
          {!repoInfo.hasToken && (
            <span style={{ color: "var(--negative)", marginLeft: 8 }}>⚠ No token configured</span>
          )}
        </div>
        {lastBackup && (
          <div style={{ fontFamily: "var(--font-mono)", fontSize: 9, color: "var(--ink2)" }}>
            Last backup: <span style={{ color: "var(--positive)" }}>{lastBackup}</span>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── DB Restore card ──────────────────────────────────────────────────────────
function RestoreDbCard() {
  const [mode,      setMode]     = useState("github"); // "github" | "upload"
  const [file,      setFile]     = useState(null);
  const [status,    setStatus]   = useState(null); // null | "loading" | "restoring" | "done" | "error"
  const [message,   setMessage]  = useState("");
  const [repoInfo,  setRepoInfo] = useState(null); // { repo, file } from settings
  const [showModal, setShowModal] = useState(false);
  const [pwdError,  setPwdError]  = useState(false);
  const { theme } = useTheme();

  // Load configured repo + filename from settings on mount
  useEffect(() => {
    setStatus("loading");
    fetch("/api/settings")
      .then(r => r.json())
      .then(({ settings }) => {
        setRepoInfo({
          repo: settings.github_repo || "",
          file: settings.backup_filename || "vaulted-backup.db",
          hasToken: !!settings.github_token,
          token: settings.github_token || "",
        });
        setStatus(null);
      })
      .catch(() => setStatus(null));
  }, []);

  const handleFileChange = (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (!f.name.endsWith(".db")) {
      setMessage("File must be a .db file");
      setStatus("error");
      return;
    }
    setFile(f);
    setStatus(null);
    setMessage("");
  };

  const canRestore = mode === "github"
    ? repoInfo?.repo && repoInfo?.hasToken
    : !!file;

  const handleRestoreClick = () => {
    if (!canRestore) return;
    setPwdError(false);
    setShowModal(true);
  };

  const handleConfirm = async (password) => {
    // Verify password first
    const res = await fetch("/api/verify-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });
    const { valid } = await res.json();
    if (!valid) { setPwdError(true); return; }

    setShowModal(false);
    setStatus("restoring");
    setMessage(mode === "github" ? "Fetching backup from GitHub..." : "Uploading and restoring...");

    try {
      let r;
      if (mode === "github") {
        r = await fetch("/api/admin/restore-db", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ source: "github" }),
        });
      } else {
        const form = new FormData();
        form.append("db", file);
        r = await fetch("/api/admin/restore-db", { method: "POST", body: form });
      }

      const data = await r.json();
      if (!r.ok || !data.ok) {
        setStatus("error");
        setMessage(data.error || "Restore failed");
      } else {
        setStatus("done");
        setMessage(data.message);
        setFile(null);
      }
    } catch (err) {
      setStatus("error");
      setMessage(err.message);
    }
  };

  return (
    <div className="card fade-up" style={{ padding: "18px 20px" }}>

      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 14 }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 3 }}>
            <span style={{ fontFamily: "var(--font-mono)", fontSize: 16, color: "var(--gold)" }}>↺</span>
            <span style={{ fontFamily: "var(--font-display)", fontSize: 14, color: "var(--ink)" }}>Restore Database</span>
          </div>
          <div style={{ fontFamily: "var(--font-mono)", fontSize: 9, color: "var(--ink2)", letterSpacing: "0.06em" }}>
            Replace the live database from a backup
          </div>
        </div>
      </div>

      {/* Mode toggle */}
      <div style={{ display: "flex", gap: 4, background: "var(--ink3)", borderRadius: "2px 8px 8px 2px", padding: 3, marginBottom: 16, alignSelf: "flex-start" }}>
        {[
          { key: "github", label: "↓ GitHub Backup" },
          { key: "upload", label: "↑ Upload File" },
        ].map(({ key, label }) => (
          <button key={key} onClick={() => { setMode(key); setStatus(null); setMessage(""); setFile(null); }}
            className="btn-press"
            style={{
              fontFamily: "var(--font-mono)", fontSize: 9, letterSpacing: "0.08em",
              padding: "5px 12px", borderRadius: "2px 6px 6px 2px", border: "none",
              cursor: "pointer",
              background: mode === key ? "rgba(255,71,87,0.12)" : "transparent",
              color: mode === key ? "#0C0A08" : "var(--ink2)",
              transition: "all 0.2s",
            }}>
            {label}
          </button>
        ))}
      </div>

      {/* GitHub mode */}
      {mode === "github" && (
        <BackupSourceInfo repoInfo={repoInfo} status={status} />
      )}

      {/* Upload mode */}
      {mode === "upload" && (
        <label style={{
          display: "flex", alignItems: "center", gap: 10,
          padding: "10px 14px", marginBottom: 14,
          background: "rgba(255,255,255,0.03)",
          border: `1px dashed ${file ? "var(--gold)" : "var(--border-strong)"}`,
          borderRadius: "2px 9px 9px 2px",
          cursor: "pointer",
        }}>
          <span style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: file ? "var(--gold)" : "var(--ink2)", letterSpacing: "0.08em", flex: 1 }}>
            {file ? `✓  ${file.name}  (${(file.size / 1024).toFixed(0)} KB)` : "Choose .db file..."}
          </span>
          <input type="file" accept=".db" onChange={handleFileChange} style={{ display: "none" }} />
          <span style={{ fontFamily: "var(--font-mono)", fontSize: 9, color: "var(--ink2)", letterSpacing: "0.1em" }}>BROWSE</span>
        </label>
      )}

      {/* Status message */}
      {message && (
        <div style={{
          fontFamily: "var(--font-mono)", fontSize: 9, letterSpacing: "0.06em",
          color: status === "error" ? "var(--negative)" : status === "done" ? "var(--positive)" : "var(--ink2)",
          marginBottom: 12, lineHeight: 1.6,
        }}>
          {status === "error" ? "⚠ " : status === "done" ? "✓ " : "⟳ "}{message}
        </div>
      )}

      {/* Destructive warning */}
      {canRestore && status !== "done" && status !== "restoring" && (
        <div style={{
          fontFamily: "var(--font-mono)", fontSize: 9, color: "var(--negative)",
          letterSpacing: "0.06em", marginBottom: 14, lineHeight: 1.6,
          padding: "8px 12px", background: "rgba(232,112,112,0.08)",
          border: "1px solid rgba(232,112,112,0.2)", borderRadius: "2px 7px 7px 2px",
        }}>
          ⚠ This replaces the live database and restarts the app. Current DB is saved as a timestamped .bak file on disk.
        </div>
      )}

      {/* Restore button */}
      <button
        onClick={handleRestoreClick}
        disabled={!canRestore || status === "restoring" || status === "done" || status === "loading"}
        className="btn-press"
        style={{
          width: "100%", padding: "10px",
          background: !canRestore || status === "restoring" || status === "done" || status === "loading"
            ? "var(--ink3)"
            : "rgba(232,112,112,0.85)",
          border: "none", borderRadius: "2px 9px 9px 2px",
          fontFamily: "var(--font-mono)", fontSize: 10, letterSpacing: "0.1em",
          color: !canRestore || status === "restoring" || status === "done" || status === "loading"
            ? "var(--ink2)" : "#fff",
          cursor: canRestore && status !== "restoring" && status !== "done" ? "pointer" : "not-allowed",
          transition: "all 0.2s",
        }}
      >
        {status === "restoring" ? "RESTORING..." : status === "done" ? "✓ RESTORED" : "RESTORE DATABASE"}
      </button>

      {/* Password confirm modal */}
      {showModal && (
        <PasswordConfirmModal
          onConfirm={handleConfirm}
          onCancel={() => { setShowModal(false); setPwdError(false); }}
          error={pwdError}
        />
      )}
    </div>
  );
}


// ─── Biometric lock card ──────────────────────────────────────────────────────
function BiometricCard() {
  const [devices,    setDevices]    = useState([]);   // registered devices
  const [loading,    setLoading]    = useState(true);
  const [status,     setStatus]     = useState(null); // null | "registering" | "error"
  const [message,    setMessage]    = useState("");
  const [deviceName, setDeviceName] = useState("");
  const [showModal,  setShowModal]  = useState(false);
  const [pwdError,   setPwdError]   = useState(false);
  const [pendingDel, setPendingDel] = useState(null); // device id to delete, or "all"

  const loadDevices = () => {
    setLoading(true);
    fetch("/api/webauthn/register")
      .then(r => r.json())
      .then(d => { setDevices(d.devices || []); })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { loadDevices(); }, []);

  const supported = typeof window !== "undefined" && window.PublicKeyCredential !== undefined;
  const isEnabled = devices.length > 0;

  const handleRegister = () => {
    if (!deviceName.trim()) return;
    setPwdError(false);
    setPendingDel(null);
    setShowModal(true);
  };

  const handleRemove = (deviceId) => {
    setPendingDel(deviceId);
    setPwdError(false);
    setShowModal(true);
  };

  const handleConfirm = async (password) => {
    const res = await fetch("/api/verify-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });
    const { valid } = await res.json();
    if (!valid) { setPwdError(true); return; }
    setShowModal(false);

    // ── Remove device ──
    if (pendingDel) {
      await fetch("/api/webauthn/register", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ deviceId: pendingDel === "all" ? undefined : pendingDel }),
      });
      setMessage(pendingDel === "all" ? "All devices removed." : "Device removed.");
      setPendingDel(null);
      loadDevices();
      return;
    }

    // ── Register new device ──
    setStatus("registering");
    setMessage("");
    try {
      const startRes = await fetch("/api/webauthn/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phase: "start", deviceName: deviceName.trim() }),
      });
      const options = await startRes.json();

      const challengeBuffer = Uint8Array.from(
        atob(options.challenge.replace(/-/g, "+").replace(/_/g, "/")),
        c => c.charCodeAt(0)
      );
      const userIdBuffer = Uint8Array.from(
        atob(options.user.id.replace(/-/g, "+").replace(/_/g, "/")),
        c => c.charCodeAt(0)
      );
      const excludeCredentials = (options.excludeCredentials || []).map(c => ({
        ...c,
        id: Uint8Array.from(atob(c.id.replace(/-/g, "+").replace(/_/g, "/")), ch => ch.charCodeAt(0)),
      }));

      const credential = await navigator.credentials.create({
        publicKey: {
          ...options,
          challenge: challengeBuffer,
          user: { ...options.user, id: userIdBuffer },
          excludeCredentials,
        },
      });

      const finishRes = await fetch("/api/webauthn/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phase: "finish",
          credential: {
            id:         credential.id,
            rawId:      btoa(String.fromCharCode(...new Uint8Array(credential.rawId))),
            type:       credential.type,
            transports: credential.response.getTransports ? credential.response.getTransports() : ["internal"],
            response: {
              attestationObject: btoa(String.fromCharCode(...new Uint8Array(credential.response.attestationObject))),
              clientDataJSON:    btoa(String.fromCharCode(...new Uint8Array(credential.response.clientDataJSON))),
            },
          },
        }),
      });

      const result = await finishRes.json();
      if (result.ok) {
        setStatus(null);
        setMessage(`✓ "${result.device.name}" registered.`);
        setDeviceName("");
        loadDevices();
      } else {
        throw new Error(result.error || "Registration failed");
      }
    } catch (err) {
      setStatus("error");
      setMessage(err.name === "NotAllowedError" ? "Cancelled." : err.name === "InvalidStateError" ? "This device is already registered." : err.message);
    }
  };

  return (
    <div className="card fade-up" style={{ padding: "18px 20px" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
        <span style={{ fontFamily:"var(--font-mono)", color: "var(--gold)", fontSize: 16, lineHeight:1 }}>⌖</span>
        <span style={{ fontFamily: "var(--font-display)", fontSize: 14, color: "var(--ink)" }}>Biometric Lock</span>
        {isEnabled && <span style={{ fontFamily: "var(--font-mono)", fontSize: 8, letterSpacing: "0.1em", padding: "1px 6px", borderRadius: "2px 6px 6px 2px", background: "rgba(255,71,87,0.12)", color: "var(--gold)", border: "1px solid rgba(255,71,87,0.2)" }}>{devices.length} DEVICE{devices.length !== 1 ? "S" : ""}</span>}
      </div>
      <div style={{ fontFamily: "var(--font-mono)", fontSize: 9, color: "var(--ink2)", letterSpacing: "0.06em", lineHeight: 1.6, marginBottom: 14 }}>
        PWA only. Each phone registers separately. Any registered device can unlock.
      </div>

      {!supported && (
        <div style={{ fontFamily: "var(--font-mono)", fontSize: 9, color: "var(--negative)", letterSpacing: "0.06em", marginBottom: 12 }}>
          ⚠ WebAuthn not supported on this browser
        </div>
      )}

      {/* Registered devices list */}
      {!loading && devices.length > 0 && (
        <div style={{ marginBottom: 14, display: "flex", flexDirection: "column", gap: 6 }}>
          {devices.map(device => (
            <div key={device.id} style={{
              display: "flex", justifyContent: "space-between", alignItems: "center",
              padding: "8px 12px", background: "rgba(255,255,255,0.03)",
              border: "1px solid var(--border)", borderRadius: "2px 10px 10px 2px",
            }}>
              <div>
                <div style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--ink)", marginBottom: 1 }}>
                  {device.name}
                </div>
                <div style={{ fontFamily: "var(--font-mono)", fontSize: 8, color: "var(--ink2)", letterSpacing: "0.06em" }}>
                  {new Date(device.registeredAt).toLocaleDateString("en-AU", { day: "numeric", month: "short", year: "numeric" })}
                </div>
              </div>
              <button
                onClick={() => handleRemove(device.id)}
                className="btn-press"
                style={{
                  background: "transparent", border: "1px solid rgba(232,112,112,0.3)",
                  borderRadius: "2px 7px 7px 2px", padding: "3px 10px",
                  fontFamily: "var(--font-mono)", fontSize: 8, letterSpacing: "0.1em",
                  color: "var(--negative)", cursor: "pointer",
                }}
              >
                REMOVE
              </button>
            </div>
          ))}
          {devices.length > 1 && (
            <button onClick={() => handleRemove("all")} className="btn-press" style={{
              background: "transparent", border: "1px solid rgba(232,112,112,0.2)",
              borderRadius: "2px 9px 9px 2px", padding: "6px",
              fontFamily: "var(--font-mono)", fontSize: 8, letterSpacing: "0.1em",
              color: "var(--negative)", cursor: "pointer", opacity: 0.7,
            }}>
              REMOVE ALL DEVICES
            </button>
          )}
        </div>
      )}

      {message && (
        <div style={{ fontFamily: "var(--font-mono)", fontSize: 9, color: status === "error" ? "var(--negative)" : "var(--positive)", letterSpacing: "0.06em", marginBottom: 12 }}>
          {message}
        </div>
      )}

      {/* Add new device */}
      {supported && (
        <div style={{ display: "flex", gap: 8 }}>
          <input
            type="text"
            value={deviceName}
            onChange={e => setDeviceName(e.target.value)}
            placeholder="Device name (e.g. Gurdev's Phone)"
            style={{
              flex: 1, padding: "8px 12px",
              background: "rgba(255,255,255,0.04)", border: "1px solid var(--border)",
              borderRadius: "2px 9px 9px 2px", color: "var(--ink)",
              fontFamily: "var(--font-mono)", fontSize: 10, outline: "none",
            }}
          />
          <button
            onClick={handleRegister}
            disabled={!deviceName.trim() || status === "registering"}
            className="btn-press"
            style={{
              padding: "8px 14px",
              background: !deviceName.trim() || status === "registering" ? "var(--ink3)" : "rgba(255,71,87,0.85)",
              border: "none", borderRadius: "2px 9px 9px 2px",
              fontFamily: "var(--font-mono)", fontSize: 9, letterSpacing: "0.1em",
              color: !deviceName.trim() || status === "registering" ? "var(--ink2)" : "#fff",
              cursor: deviceName.trim() && status !== "registering" ? "pointer" : "not-allowed",
            }}
          >
            {status === "registering" ? "..." : "+ ADD"}
          </button>
        </div>
      )}

      {showModal && (
        <PasswordConfirmModal
          onConfirm={handleConfirm}
          onCancel={() => { setShowModal(false); setPwdError(false); }}
          error={pwdError}
        />
      )}
    </div>
  );
}

// ─── Tab bar ──────────────────────────────────────────────────────────────
function TabBar({ active, onChange }) {
  const tabs = [
    { key:"accounts",    label:"Accounts",    icon:"⊞" },
    { key:"credentials", label:"Credentials", icon:"◈" },
  ];
  return (
    <div style={{ display:"flex", gap:4, background:"var(--ink3)", borderRadius:"3px 10px 10px 3px", padding:3, alignSelf:"flex-start" }}>
      {tabs.map(t => (
        <button key={t.key} onClick={() => onChange(t.key)} className="btn-press"
          style={{
            fontFamily:"var(--font-mono)", fontSize:9, letterSpacing:"0.1em",
            padding:"6px 14px", borderRadius:"2px 7px 7px 2px", border:"none",
            cursor:"pointer",
            background: active === t.key ? "var(--gold)" : "transparent",
            color: active === t.key ? "#0C0A08" : "var(--ink2)",
            transition:"all 0.2s",
          }}>
          {t.icon} {t.label}
        </button>
      ))}
    </div>
  );
}

// ─── Admin page ───────────────────────────────────────────────────────────────
export default function AdminPage() {
  const router = useRouter();
  const [tab, setTab]           = useState("accounts");
  const [accounts, setAccounts] = useState([]);
  const [settings, setSettings] = useState({});
  const [loading, setLoading]   = useState(true);
  const [adding, setAdding]     = useState(false);
  const [editing, setEditing]   = useState(null);
  const [assetFilter, setFilter]= useState("all");

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const [accs, setts, { rate: usdRate }] = await Promise.all([
          fetchAccounts(),
          fetchSettings(),
          fetchFxRate("USD", "AUD"),
        ]);
        const enriched = accs.map(a =>
          a.currency !== "AUD" && a.native_balance != null
            ? { ...a, balance: Math.round(a.native_balance * usdRate * 100) / 100, liveRate: usdRate }
            : a
        );
        setAccounts(enriched);
        setSettings(setts);
      } catch (e) { console.error(e); }
      setLoading(false);
    })();
  }, []);

  const handleAdd = async (form) => {
    const { account } = await createAccount(form);
    setAccounts(a => [...a, account]);
    setAdding(false);
  };

  const handleEdit = async (form) => {
    const { account } = await updateAccount(editing.id, form);
    setAccounts(a => a.map(acc => acc.id === editing.id ? account : acc));
    setEditing(null);
  };

  const handleDelete = async (id) => {
    await deleteAccount(id);
    setAccounts(a => a.filter(acc => acc.id !== id));
    router.refresh(); // invalidates Next.js cache so other pages re-fetch fresh data
  };

  const handleSaveSettings = async (patch) => {
    await updateSettings(patch);
    setSettings(s => ({ ...s, ...patch }));
  };

  const filtered = assetFilter === "all" ? accounts : accounts.filter(a => a.asset === assetFilter);
  const assetOrder = ["cash","shares","crypto","super"];

  const ownerOptions = OWNER_DEFAULTS
    .filter(({ key }) => settings[`owner_${key}_active`] !== "0")
    .map(({ key, defaultLabel }) => ({ value: key, label: settings[`owner_${key}_label`] || defaultLabel }));
  const ownersMap = Object.fromEntries(ownerOptions.map(o => [o.value, o.label]));

  // Count configured credentials
  const credsConfigured = CREDENTIAL_GROUPS.filter(g =>
    g.fields.some(f => f.secret && settings[f.key] && !settings[f.key].startsWith("••••") || (settings[f.key] && settings[f.key].length > 4))
  ).length;

  return (
    <AppShell><main className="page" style={{ paddingTop:16, display:"flex", flexDirection:"column", gap:16 }}>

        {/* Header */}
        <div className="fade-up" style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start" }}>
          <div>
            <div style={{ fontFamily:"var(--font-display)", fontSize:20, color:"var(--ink)", marginBottom:4 }}>Admin</div>
            <div style={{ fontFamily:"var(--font-mono)", fontSize:9, color:"var(--ink2)", letterSpacing:"0.08em" }}>
              {accounts.length} accounts · {credsConfigured}/{CREDENTIAL_GROUPS.length} services configured
            </div>
          </div>
          {tab === "accounts" && !adding && !editing && (
            <button onClick={() => setAdding(true)} className="btn-press"
              style={{ padding:"9px 14px", background:"var(--gold)", border:"none", borderRadius:"2px 9px 9px 2px", fontFamily:"var(--font-mono)", fontSize:10, letterSpacing:"0.1em", color:"#0C0A08", cursor:"pointer" }}>
              + ADD
            </button>
          )}
        </div>

        {/* Tab bar */}
        <TabBar active={tab} onChange={t => { setTab(t); setAdding(false); setEditing(null); }} />

        {loading ? (
          <div style={{ textAlign:"center", padding:"40px 0", fontFamily:"var(--font-mono)", fontSize:10, color:"var(--ink2)", letterSpacing:"0.1em" }}>
            LOADING...
          </div>
        ) : (
          <>
            {/* ─── Accounts tab ─── */}
            {tab === "accounts" && (
              <>
                {adding && <AccountForm isNew onSave={handleAdd} onCancel={() => setAdding(false)} ownerOptions={ownerOptions} />}
                {editing && <AccountForm initial={editing} onSave={handleEdit} onCancel={() => setEditing(null)} ownerOptions={ownerOptions} />}

                {!adding && !editing && (
                  <>
                    {/* Asset filter chips */}
                    <div className="fade-up" style={{ display:"flex", gap:4, flexWrap:"wrap" }}>
                      {["all", ...assetOrder].map(f => {
                        const count = f === "all" ? accounts.length : accounts.filter(a => a.asset === f).length;
                        return (
                          <button key={f} onClick={() => setFilter(f)} className="btn-press"
                            style={{
                              fontFamily:"var(--font-mono)", fontSize:9, letterSpacing:"0.1em",
                              padding:"5px 10px", borderRadius:"2px 7px 7px 2px",
                              border:`1px solid ${assetFilter === f ? "var(--gold)" : "var(--border)"}`,
                              background: assetFilter === f ? "rgba(255,210,74,0.1)" : "transparent",
                              color: assetFilter === f ? "var(--gold)" : "var(--ink2)",
                              cursor:"pointer", transition:"all 0.2s",
                            }}>
                            {f === "all" ? "ALL" : f.toUpperCase()} ({count})
                          </button>
                        );
                      })}
                    </div>

                    {/* Account list */}
                    <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
                      {filtered.map(account => (
                        <AccountRow key={account.id} account={account}
                          onEdit={a => { setEditing(a); setAdding(false); }}
                          onDelete={handleDelete}
                          ownersMap={ownersMap}
                        />
                      ))}
                      {filtered.length === 0 && (
                        <div style={{ fontFamily:"var(--font-mono)", fontSize:10, color:"var(--ink2)", textAlign:"center", padding:"32px 0", border:"1px dashed var(--border)", borderRadius:"3px 14px 14px 3px" }}>
                          No accounts in this category
                        </div>
                      )}
                    </div>
                  </>
                )}
              </>
            )}

            {/* ─── Credentials tab ─── */}
            {tab === "credentials" && (
              <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
                <div style={{ fontFamily:"var(--font-mono)", fontSize:9, color:"var(--ink2)", letterSpacing:"0.08em", padding:"10px 14px", background:"rgba(255,255,255,0.03)", border:"1px solid var(--border)", borderRadius:"2px 8px 8px 2px", lineHeight:1.6 }}>
                  Credentials are stored in the local SQLite database on your VPS. Never committed to git.
                </div>
                <OwnerLabelsCard settings={settings} onSave={handleSaveSettings} />
                <CronStatusCard />
                <NotifyStatusCard />
                <BiometricCard />
                <RestoreDbCard />
                {CREDENTIAL_GROUPS.map(group => (
                  <CredentialGroup
                    key={group.id}
                    group={group}
                    settings={settings}
                    onSave={handleSaveSettings}
                  />
                ))}
              </div>
            )}
          </>
        )}

        <div style={{ height:8 }} />
      </main></AppShell>
  );
}
