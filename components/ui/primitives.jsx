"use client";

// ─── Card ─────────────────────────────────────────────────────────────────────
export function Card({ children, accent, glow, style = {}, className = "", onClick }) {
  return (
    <div
      className={`card lift ${glow ? "card-glow" : ""} ${className}`}
      onClick={onClick}
      style={{
        borderLeft: accent ? `3px solid ${accent}` : undefined,
        borderColor: accent ? `${accent}55` : undefined,
        cursor: onClick ? "pointer" : undefined,
        ...style,
      }}
    >
      {children}
    </div>
  );
}

// ─── Label ────────────────────────────────────────────────────────────────────
export function Label({ children, style = {} }) {
  return <div className="label" style={style}>{children}</div>;
}

// ─── Tag / pill ───────────────────────────────────────────────────────────────
export function Tag({ label, color }) {
  return (
    <span
      className="tag"
      style={{
        background: color + "18",
        color,
        border: `1px solid ${color}35`,
      }}
    >
      {label}
    </span>
  );
}

// ─── Colour dot ───────────────────────────────────────────────────────────────
export function Pip({ color, size = 5 }) {
  return (
    <div style={{
      width: size, height: size,
      borderRadius: "50%",
      background: color,
      boxShadow: `0 0 6px ${color}`,
      flexShrink: 0,
    }} />
  );
}

// ─── Divider ─────────────────────────────────────────────────────────────────
export function Divider({ style = {} }) {
  return (
    <div style={{
      height: 1,
      background: "var(--border)",
      margin: "6px 0",
      ...style,
    }} />
  );
}

// ─── Owner badge ─────────────────────────────────────────────────────────────
export function OwnerBadge({ owner }) {
  const isH = owner === "H";
  return (
    <span style={{
      fontFamily: "var(--font-mono)",
      fontSize: 9,
      letterSpacing: "0.08em",
      padding: "2px 7px",
      borderRadius: "2px 6px 6px 2px",
      background: isH ? "rgba(96,165,250,0.15)" : "rgba(236,72,153,0.15)",
      color: isH ? "var(--cash)" : "#EC4899",
      border: `1px solid ${isH ? "rgba(96,165,250,0.3)" : "rgba(236,72,153,0.3)"}`,
    }}>
      {isH ? "H" : "W"}
    </span>
  );
}

// ─── Section header ───────────────────────────────────────────────────────────
export function SectionHeader({ children, action }) {
  return (
    <div style={{
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 10,
    }}>
      <Label>{children}</Label>
      {action}
    </div>
  );
}

// ─── Empty state ─────────────────────────────────────────────────────────────
export function EmptyState({ message }) {
  return (
    <div style={{
      padding: "32px 16px",
      textAlign: "center",
      fontFamily: "var(--font-mono)",
      fontSize: 11,
      color: "var(--ink2)",
      border: "1px dashed var(--border)",
      borderRadius: "3px 14px 14px 3px",
    }}>
      {message}
    </div>
  );
}

// ─── Theme toggle button ──────────────────────────────────────────────────────
export function ThemeToggle({ theme, onToggle }) {
  return (
    <button
      onClick={onToggle}
      className="btn-press"
      style={{
        background: "transparent",
        border: "1px solid var(--border)",
        color: "var(--ink2)",
        borderRadius: "2px 8px 8px 2px",
        padding: "5px 10px",
        fontFamily: "var(--font-mono)",
        fontSize: 10,
        letterSpacing: "0.1em",
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
        gap: 6,
      }}
    >
      {theme === "dark" ? "☀" : "◑"}
    </button>
  );
}
