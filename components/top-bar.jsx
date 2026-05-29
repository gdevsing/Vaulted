"use client";

import { useRouter } from "next/navigation";
import Logo from "@/components/logo";

export default function TopBar({ right, onHelpOpen }) {
  const router = useRouter();

  const handleLogout = async () => {
    await fetch("/api/logout", { method: "POST" });
    router.push("/login");
  };

  // ? — quiet, secondary
  const helpStyle = {
    background: "transparent",
    border: "1px solid rgba(255,71,87,0.3)",
    borderRadius: "2px 7px 7px 2px",
    padding: "4px 10px",
    fontFamily: "var(--font-mono)",
    fontSize: 9,
    letterSpacing: "0.1em",
    color: "rgba(255,71,87,0.55)",
    cursor: "pointer",
    boxShadow: "0 0 6px rgba(255,71,87,0.08)",
    transition: "all 0.2s",
  };

  // LOGOUT — prominent, same family but stronger
  const logoutStyle = {
    background: "transparent",
    border: "1px solid rgba(255,71,87,0.6)",
    borderRadius: "2px 7px 7px 2px",
    padding: "4px 10px",
    fontFamily: "var(--font-mono)",
    fontSize: 9,
    letterSpacing: "0.1em",
    color: "#FF4757",
    cursor: "pointer",
    boxShadow: "0 0 10px rgba(255,71,87,0.25), inset 0 0 8px rgba(255,71,87,0.05)",
    transition: "all 0.2s",
  };

  return (
    <header className="top-bar">
      <Logo size="sm" />
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        {right}
        {onHelpOpen && (
          <button onClick={onHelpOpen} className="btn-press" style={helpStyle}>
            ?
          </button>
        )}
        <button onClick={handleLogout} className="btn-press" style={logoutStyle}>
          LOGOUT
        </button>
      </div>
    </header>
  );
}
