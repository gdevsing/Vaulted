"use client";

import { useState, useEffect } from "react";
import TopBar from "@/components/top-bar";
import BottomNav from "@/components/nav";
import { useTheme } from "@/app/layout";
import { fetchAccounts, createAccount, updateAccount, deleteAccount, fetchSettings, updateSettings } from "@/lib/api";
import { fmt, assetLabel, ownerLabel } from "@/lib/utils";
import { ASSETS } from "@/lib/tokens";

// ─── Constants ────────────────────────────────────────────────────────────────
const ASSET_OPTIONS     = ["cash","shares","crypto","super"];
const OWNER_OPTIONS     = [{ value:"H", label:"Husband" }, { value:"W", label:"Wife" }];
const CURRENCY_OPTIONS  = ["AUD","USD"];
const FREQUENCY_OPTIONS = ["weekly","fortnightly","monthly"];
const EMPTY_ACCOUNT     = { name:"", institution:"", owner:"H", asset:"cash", currency:"AUD", frequency:"weekly", group:"" };

// ─── Credential field groups ──────────────────────────────────────────────────
const CREDENTIAL_GROUPS = [
  {
    id: "gemini",
    label: "Gemini AI",
    icon: "◈",
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
    label: "Google Drive Backup",
    icon: "↓",
    description: "Automatic daily DB backup to Google Drive",
    link: "https://console.cloud.google.com",
    linkLabel: "GCP Console →",
    fields: [
      { key: "gdrive_token",     label: "Service Account Token", secret: true,  placeholder: "Paste JSON token..." },
      { key: "gdrive_folder_id", label: "Folder ID",             secret: false, placeholder: "1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgVE2..." },
    ],
  },
  {
    id: "app",
    label: "App Settings",
    icon: "⊞",
    description: "General app configuration",
    fields: [
      { key: "app_url",      label: "App URL",        secret: false, placeholder: "https://vaulted.yourdomain.com" },
      { key: "app_password", label: "Login Password", secret: true,  placeholder: "Choose a strong password" },
      { key: "notify_day",   label: "Notify Day",     secret: false, placeholder: "sunday" },
      { key: "ntfy_topic",   label: "ntfy Topic",     secret: false, placeholder: "vaulted-sync" },
    ],
  },
];

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

// ─── Secret input with show/hide toggle ──────────────────────────────────────
function SecretInput({ value, onChange, placeholder }) {
  const [show, setShow] = useState(false);
  const isMasked = value?.startsWith("••••");
  return (
    <div style={{ position:"relative" }}>
      <input
        type={show ? "text" : "password"}
        value={value || ""}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        style={{
          width:"100%", background:"rgba(255,255,255,0.03)",
          border:"1px solid var(--border-strong)", borderRadius:"2px 9px 9px 2px",
          padding:"9px 36px 9px 12px", fontFamily:"var(--font-mono)", fontSize:11,
          color: isMasked ? "var(--ink2)" : "var(--ink)",
          outline:"none", boxSizing:"border-box",
        }}
      />
      <button
        onClick={() => setShow(s => !s)}
        style={{
          position:"absolute", right:10, top:"50%", transform:"translateY(-50%)",
          background:"none", border:"none", cursor:"pointer",
          fontFamily:"var(--font-mono)", fontSize:9, color:"var(--ink2)",
          letterSpacing:"0.08em",
        }}
      >
        {show ? "HIDE" : "SHOW"}
      </button>
    </div>
  );
}

// ─── Credential group card ────────────────────────────────────────────────────
function CredentialGroup({ group, settings, onSave }) {
  const [local, setLocal] = useState({});
  const [saving, setSaving] = useState(false);
  const [saved, setSaved]   = useState(false);

  useEffect(() => {
    const init = {};
    group.fields.forEach(f => { init[f.key] = settings[f.key] || ""; });
    setLocal(init);
  }, [settings, group]);

  const handleSave = async () => {
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
          <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:3 }}>
            <span style={{ fontFamily:"var(--font-mono)", fontSize:16, color:"var(--gold)" }}>{group.icon}</span>
            <span style={{ fontFamily:"var(--font-display)", fontSize:14, color:"var(--ink)" }}>{group.label}</span>
            {/* Status dot */}
            {group.fields.some(f => f.secret && settings[f.key]) && (
              <div style={{
                width:6, height:6, borderRadius:"50%",
                background:"var(--positive)", boxShadow:"0 0 6px var(--positive)",
              }} />
            )}
          </div>
          <div style={{ fontFamily:"var(--font-mono)", fontSize:9, color:"var(--ink2)", letterSpacing:"0.06em" }}>
            {group.description}
          </div>
        </div>
        {group.link && (
          <a href={group.link} target="_blank" rel="noopener noreferrer"
            style={{ fontFamily:"var(--font-mono)", fontSize:8, color:"var(--gold)", letterSpacing:"0.1em", textDecoration:"none", flexShrink:0 }}>
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
          </Field>
        ))}
      </div>

      {/* Save button */}
      <button
        onClick={handleSave}
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

// ─── Account form ─────────────────────────────────────────────────────────────
function AccountForm({ initial = EMPTY_ACCOUNT, onSave, onCancel, isNew }) {
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
              <Select value={form.owner} onChange={set("owner")} options={OWNER_OPTIONS} />
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
function AccountRow({ account, onEdit, onDelete }) {
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
          {account.institution} · {ownerLabel(account.owner)} · {account.currency} · {account.frequency}
        </div>
      </div>
      <div style={{ fontFamily:"var(--font-display)", fontSize:14, color:"var(--ink)", flexShrink:0 }}>
        {fmt(account.balance || 0)}
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

// ─── Tab bar ──────────────────────────────────────────────────────────────────
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
        const [accs, setts] = await Promise.all([
          fetchAccounts(),
          fetchSettings(),
        ]);
        setAccounts(accs);
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
  };

  const handleSaveSettings = async (patch) => {
    await updateSettings(patch);
    setSettings(s => ({ ...s, ...patch }));
  };

  const filtered = assetFilter === "all" ? accounts : accounts.filter(a => a.asset === assetFilter);
  const assetOrder = ["cash","shares","crypto","super"];

  // Count configured credentials
  const credsConfigured = CREDENTIAL_GROUPS.filter(g =>
    g.fields.some(f => f.secret && settings[f.key] && !settings[f.key].startsWith("••••") || (settings[f.key] && settings[f.key].length > 4))
  ).length;

  return (
    <>
      <TopBar />
      <main className="page" style={{ paddingTop:16, display:"flex", flexDirection:"column", gap:16 }}>

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
                {adding && <AccountForm isNew onSave={handleAdd} onCancel={() => setAdding(false)} />}
                {editing && <AccountForm initial={editing} onSave={handleEdit} onCancel={() => setEditing(null)} />}

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
                <div style={{ fontFamily:"var(--font-mono)", fontSize:9, color:"var(--ink2)", letterSpacing:"0.08em", padding:"10px 14px", background:"rgba(255,210,74,0.06)", border:"1px solid rgba(255,210,74,0.2)", borderRadius:"2px 8px 8px 2px" }}>
                  ◈ Credentials are stored in the local SQLite database on your VPS. Never committed to git.
                </div>
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
      </main>
      <BottomNav />
    </>
  );
}
