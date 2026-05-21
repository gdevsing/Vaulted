"use client";

import { useState } from "react";
import TopBar from "@/components/top-bar";
import BottomNav from "@/components/nav";
import { useTheme } from "@/app/layout";
import { ACCOUNTS } from "@/lib/mock-data";
import { fmt, assetLabel, ownerLabel } from "@/lib/utils";
import { ASSETS } from "@/lib/tokens";

// ─── Field config ─────────────────────────────────────────────────────────────
const ASSET_OPTIONS      = ["cash", "shares", "crypto", "super"];
const OWNER_OPTIONS      = [{ value: "H", label: "Husband" }, { value: "W", label: "Wife" }];
const CURRENCY_OPTIONS   = ["AUD", "USD"];
const FREQUENCY_OPTIONS  = ["weekly", "fortnightly", "monthly"];

const EMPTY_ACCOUNT = {
  name: "", institution: "", owner: "H",
  asset: "cash", currency: "AUD",
  frequency: "weekly", group: "",
};

// ─── Styled select ────────────────────────────────────────────────────────────
function Select({ value, onChange, options, placeholder }) {
  return (
    <select
      value={value}
      onChange={e => onChange(e.target.value)}
      style={{
        width: "100%",
        background: "rgba(255,255,255,0.03)",
        border: "1px solid var(--border-strong)",
        borderRadius: "2px 9px 9px 2px",
        padding: "9px 12px",
        fontFamily: "var(--font-mono)",
        fontSize: 11,
        color: "var(--ink)",
        outline: "none",
        cursor: "pointer",
        appearance: "none",
        backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='6'%3E%3Cpath d='M0 0l5 6 5-6z' fill='%237A7068'/%3E%3C/svg%3E")`,
        backgroundRepeat: "no-repeat",
        backgroundPosition: "right 12px center",
      }}
    >
      {placeholder && <option value="">{placeholder}</option>}
      {options.map(o => (
        <option key={o.value ?? o} value={o.value ?? o}>
          {o.label ?? o}
        </option>
      ))}
    </select>
  );
}

// ─── Styled text input ────────────────────────────────────────────────────────
function Input({ value, onChange, placeholder, type = "text" }) {
  return (
    <input
      type={type}
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      style={{
        width: "100%",
        background: "rgba(255,255,255,0.03)",
        border: "1px solid var(--border-strong)",
        borderRadius: "2px 9px 9px 2px",
        padding: "9px 12px",
        fontFamily: "var(--font-mono)",
        fontSize: 11,
        color: "var(--ink)",
        outline: "none",
        boxSizing: "border-box",
      }}
    />
  );
}

// ─── Field row ────────────────────────────────────────────────────────────────
function Field({ label, children }) {
  return (
    <div>
      <div className="label" style={{ marginBottom: 6 }}>{label}</div>
      {children}
    </div>
  );
}

// ─── Account form (add / edit) ────────────────────────────────────────────────
function AccountForm({ initial = EMPTY_ACCOUNT, onSave, onCancel, isNew }) {
  const [form, setForm] = useState({ ...initial });
  const { theme } = useTheme();
  const set = key => val => setForm(f => ({ ...f, [key]: val }));
  const color = ASSETS[form.asset]?.[theme] || "var(--gold)";

  const valid = form.name.trim() && form.institution.trim();

  return (
    <div className="card fade-up" style={{
      padding: "20px 18px",
      borderLeft: `3px solid ${color}`,
    }}>
      <div style={{ fontFamily: "var(--font-display)", fontSize: 15, color: "var(--ink)", marginBottom: 16 }}>
        {isNew ? "New Account" : "Edit Account"}
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <div style={{ display: "flex", gap: 10 }}>
          <div style={{ flex: 2 }}>
            <Field label="Account Name">
              <Input value={form.name} onChange={set("name")} placeholder="e.g. Up Bank" />
            </Field>
          </div>
          <div style={{ flex: 2 }}>
            <Field label="Institution">
              <Input value={form.institution} onChange={set("institution")} placeholder="e.g. Up" />
            </Field>
          </div>
        </div>

        <div style={{ display: "flex", gap: 10 }}>
          <div style={{ flex: 1 }}>
            <Field label="Owner">
              <Select value={form.owner} onChange={set("owner")} options={OWNER_OPTIONS} />
            </Field>
          </div>
          <div style={{ flex: 1 }}>
            <Field label="Asset Class">
              <Select
                value={form.asset}
                onChange={set("asset")}
                options={ASSET_OPTIONS.map(a => ({ value: a, label: assetLabel(a) }))}
              />
            </Field>
          </div>
        </div>

        <div style={{ display: "flex", gap: 10 }}>
          <div style={{ flex: 1 }}>
            <Field label="Currency">
              <Select value={form.currency} onChange={set("currency")} options={CURRENCY_OPTIONS} />
            </Field>
          </div>
          <div style={{ flex: 1 }}>
            <Field label="Update Frequency">
              <Select
                value={form.frequency}
                onChange={set("frequency")}
                options={FREQUENCY_OPTIONS.map(f => ({ value: f, label: f.charAt(0).toUpperCase() + f.slice(1) }))}
              />
            </Field>
          </div>
        </div>

        <Field label="Group (optional)">
          <Input value={form.group || ""} onChange={set("group")} placeholder="e.g. Stake" />
        </Field>
      </div>

      {/* Actions */}
      <div style={{ display: "flex", gap: 8, marginTop: 18 }}>
        <button
          onClick={() => valid && onSave(form)}
          className="btn-press"
          disabled={!valid}
          style={{
            flex: 1, padding: "11px",
            background: valid ? "var(--gold)" : "var(--ink3)",
            border: "none",
            borderRadius: "2px 9px 9px 2px",
            fontFamily: "var(--font-mono)", fontSize: 11,
            letterSpacing: "0.1em",
            color: valid ? "#0C0A08" : "var(--ink2)",
            cursor: valid ? "pointer" : "not-allowed",
          }}
        >
          {isNew ? "ADD ACCOUNT" : "SAVE CHANGES"}
        </button>
        <button
          onClick={onCancel}
          className="btn-press"
          style={{
            padding: "11px 16px",
            background: "transparent",
            border: "1px solid var(--border)",
            borderRadius: "2px 9px 9px 2px",
            fontFamily: "var(--font-mono)", fontSize: 11,
            letterSpacing: "0.1em",
            color: "var(--ink2)", cursor: "pointer",
          }}
        >
          CANCEL
        </button>
      </div>
    </div>
  );
}

// ─── Account row card ─────────────────────────────────────────────────────────
function AccountRow({ account, onEdit, onDelete }) {
  const { theme } = useTheme();
  const color = ASSETS[account.asset]?.[theme] || "var(--ink2)";
  const [confirmDelete, setConfirmDelete] = useState(false);

  return (
    <div className="card lift fade-up" style={{
      padding: "13px 16px",
      borderLeft: `3px solid ${color}`,
      display: "flex", alignItems: "center", gap: 12,
    }}>
      {/* Info */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 3 }}>
          <div style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: "var(--ink)" }}>
            {account.name}
          </div>
          <div style={{
            fontFamily: "var(--font-mono)", fontSize: 8,
            padding: "1px 5px", borderRadius: "2px 5px 5px 2px",
            background: `${color}18`, color, border: `1px solid ${color}30`,
            textTransform: "uppercase", letterSpacing: "0.06em",
          }}>
            {assetLabel(account.asset)}
          </div>
          {account.group && (
            <div style={{ fontFamily: "var(--font-mono)", fontSize: 8, color: "var(--ink2)" }}>
              {account.group}
            </div>
          )}
        </div>
        <div style={{ fontFamily: "var(--font-mono)", fontSize: 9, color: "var(--ink2)", letterSpacing: "0.06em" }}>
          {account.institution} · {ownerLabel(account.owner)} · {account.currency} · {account.frequency}
        </div>
      </div>

      {/* Balance */}
      <div style={{ fontFamily: "var(--font-display)", fontSize: 14, color: "var(--ink)", flexShrink: 0 }}>
        {fmt(account.balance)}
      </div>

      {/* Actions */}
      <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
        <button
          onClick={() => onEdit(account)}
          className="btn-press"
          style={{
            padding: "5px 10px",
            background: "transparent",
            border: "1px solid var(--border)",
            borderRadius: "2px 7px 7px 2px",
            fontFamily: "var(--font-mono)", fontSize: 9,
            letterSpacing: "0.08em", color: "var(--ink2)",
            cursor: "pointer",
          }}
        >
          EDIT
        </button>
        {confirmDelete ? (
          <button
            onClick={() => onDelete(account.id)}
            className="btn-press"
            style={{
              padding: "5px 10px",
              background: "rgba(232,112,112,0.15)",
              border: "1px solid var(--negative)",
              borderRadius: "2px 7px 7px 2px",
              fontFamily: "var(--font-mono)", fontSize: 9,
              letterSpacing: "0.08em", color: "var(--negative)",
              cursor: "pointer",
            }}
          >
            CONFIRM
          </button>
        ) : (
          <button
            onClick={() => setConfirmDelete(true)}
            className="btn-press"
            style={{
              padding: "5px 10px",
              background: "transparent",
              border: "1px solid var(--border)",
              borderRadius: "2px 7px 7px 2px",
              fontFamily: "var(--font-mono)", fontSize: 9,
              letterSpacing: "0.08em", color: "var(--ink2)",
              cursor: "pointer",
            }}
          >
            ✕
          </button>
        )}
      </div>
    </div>
  );
}

// ─── Stats summary bar ────────────────────────────────────────────────────────
function SummaryBar({ accounts }) {
  const byAsset = accounts.reduce((acc, a) => {
    acc[a.asset] = (acc[a.asset] || 0) + 1;
    return acc;
  }, {});
  return (
    <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
      <div style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--ink2)" }}>
        {accounts.length} accounts
      </div>
      {Object.entries(byAsset).map(([asset, count]) => (
        <div key={asset} style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--ink2)" }}>
          {count} {assetLabel(asset).toLowerCase()}
        </div>
      ))}
    </div>
  );
}

// ─── Admin page ───────────────────────────────────────────────────────────────
export default function AdminPage() {
  const [accounts, setAccounts]     = useState([...ACCOUNTS]);
  const [adding, setAdding]         = useState(false);
  const [editing, setEditing]       = useState(null); // account being edited
  const [filter, setFilter]         = useState("all");
  const { theme } = useTheme();

  const handleAdd = (form) => {
    const newAccount = {
      ...form,
      id: Date.now(),
      balance: 0,
      nativeBalance: null,
      updated: new Date().toISOString().slice(0, 10),
      overdue: false,
    };
    setAccounts(a => [...a, newAccount]);
    setAdding(false);
  };

  const handleEdit = (form) => {
    setAccounts(a => a.map(acc => acc.id === editing.id ? { ...acc, ...form } : acc));
    setEditing(null);
  };

  const handleDelete = (id) => {
    setAccounts(a => a.filter(acc => acc.id !== id));
  };

  const filtered = filter === "all"
    ? accounts
    : accounts.filter(a => a.asset === filter);

  const assetOrder = ["cash", "shares", "crypto", "super"];

  return (
    <>
      <TopBar />
      <main className="page" style={{ paddingTop: 16, display: "flex", flexDirection: "column", gap: 16 }}>

        {/* Header */}
        <div className="fade-up" style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            <div style={{ fontFamily: "var(--font-display)", fontSize: 20, color: "var(--ink)", marginBottom: 4 }}>
              Admin
            </div>
            <SummaryBar accounts={accounts} />
          </div>
          {!adding && !editing && (
            <button
              onClick={() => setAdding(true)}
              className="btn-press"
              style={{
                padding: "9px 14px",
                background: "var(--gold)", border: "none",
                borderRadius: "2px 9px 9px 2px",
                fontFamily: "var(--font-mono)", fontSize: 10,
                letterSpacing: "0.1em", color: "#0C0A08",
                cursor: "pointer", flexShrink: 0,
              }}
            >
              + ADD
            </button>
          )}
        </div>

        {/* Add form */}
        {adding && (
          <AccountForm
            isNew
            onSave={handleAdd}
            onCancel={() => setAdding(false)}
          />
        )}

        {/* Edit form */}
        {editing && (
          <AccountForm
            initial={editing}
            onSave={handleEdit}
            onCancel={() => setEditing(null)}
          />
        )}

        {/* Filter tabs */}
        {!adding && !editing && (
          <div className="fade-up fade-up-1" style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
            {["all", ...assetOrder].map(f => {
              const count = f === "all"
                ? accounts.length
                : accounts.filter(a => a.asset === f).length;
              return (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className="btn-press"
                  style={{
                    fontFamily: "var(--font-mono)", fontSize: 9,
                    letterSpacing: "0.1em", padding: "5px 10px",
                    borderRadius: "2px 7px 7px 2px",
                    border: `1px solid ${filter === f ? "var(--gold)" : "var(--border)"}`,
                    background: filter === f ? "rgba(255,210,74,0.1)" : "transparent",
                    color: filter === f ? "var(--gold)" : "var(--ink2)",
                    cursor: "pointer", transition: "all 0.2s",
                  }}
                >
                  {f === "all" ? "ALL" : assetLabel(f).toUpperCase()} ({count})
                </button>
              );
            })}
          </div>
        )}

        {/* Account list */}
        {!adding && !editing && (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {filtered.length === 0 ? (
              <div style={{
                fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--ink2)",
                textAlign: "center", padding: "32px 0",
                border: "1px dashed var(--border)", borderRadius: "3px 14px 14px 3px",
              }}>
                No accounts in this category
              </div>
            ) : (
              filtered.map((account, i) => (
                <AccountRow
                  key={account.id}
                  account={account}
                  onEdit={a => { setEditing(a); setAdding(false); }}
                  onDelete={handleDelete}
                />
              ))
            )}
          </div>
        )}

        {/* Settings section */}
        {!adding && !editing && (
          <div className="fade-up fade-up-3">
            <div className="label" style={{ marginBottom: 10 }}>Settings</div>
            <div className="card" style={{ padding: 0, overflow: "hidden" }}>
              {[
                { label: "Notification day",    value: "Sunday",    icon: "◷" },
                { label: "Gemini AI model",     value: "2.5 Flash", icon: "◈" },
                { label: "FX rate source",      value: "frankfurter.app", icon: "⇄" },
                { label: "ntfy.sh topic",       value: "vaulted-sync", icon: "◎" },
                { label: "Data export",         value: "CSV / PDF", icon: "↓"  },
              ].map((s, i, arr) => (
                <div
                  key={s.label}
                  style={{
                    display: "flex", justifyContent: "space-between", alignItems: "center",
                    padding: "13px 18px",
                    borderBottom: i < arr.length - 1 ? "1px solid var(--border)" : "none",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <span style={{ fontFamily: "var(--font-mono)", fontSize: 14, color: "var(--ink2)", width: 18, textAlign: "center" }}>
                      {s.icon}
                    </span>
                    <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--ink)", letterSpacing: "0.04em" }}>
                      {s.label}
                    </span>
                  </div>
                  <span style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--ink2)" }}>
                    {s.value}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        <div style={{ height: 8 }} />
      </main>
      <BottomNav />
    </>
  );
}
