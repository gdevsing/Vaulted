"use client";

import { useRouter } from "next/navigation";
import Logo from "@/components/logo";

export default function TopBar({ right, onHelpOpen }) {
  const router = useRouter();

  const handleLogout = async () => {
    await fetch("/api/logout", { method: "POST" });
    router.push("/login");
  };

  const btnStyle = {
    background: "transparent",
    border: "1px solid rgba(255,71,87,0.5)",
    borderRadius: "2px 7px 7px 2px",
    padding: "4px 10px",
    fontFamily: "var(--font-mono)",
    fontSize: 9,
    letterSpacing: "0.1em",
    color: "rgba(255,71,87,0.9)",
    cursor: "pointer",
    boxShadow: "0 0 8px rgba(255,71,87,0.2), inset 0 0 8px rgba(255,71,87,0.04)",
    transition: "all 0.2s",
  };

  return (
    <header className="top-bar">
      <Logo size="sm" />
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        {right}
        {onHelpOpen && (
          <button onClick={onHelpOpen} className="btn-press" style={btnStyle}>
            ?
          </button>
        )}
        <button onClick={handleLogout} className="btn-press" style={btnStyle}>
          LOGOUT
        </button>
      </div>
    </header>
  );
}
