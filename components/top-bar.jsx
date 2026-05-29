"use client";

import { useRouter } from "next/navigation";
import Logo from "@/components/logo";

// Shared coral glow button style
const coralBtn = {
  background: "rgba(255,71,87,0.08)",
  border: "1px solid rgba(255,71,87,0.45)",
  borderRadius: "2px 7px 7px 2px",
  padding: "4px 10px",
  fontFamily: "var(--font-mono)",
  fontSize: 9,
  letterSpacing: "0.1em",
  color: "rgba(255,255,255,0.85)",
  cursor: "pointer",
  boxShadow: "0 0 8px rgba(255,71,87,0.2), inset 0 0 8px rgba(255,71,87,0.04)",
  transition: "all 0.2s",
};

export default function TopBar({ right, onHelpOpen }) {
  const router = useRouter();

  const handleLogout = async () => {
    await fetch("/api/logout", { method: "POST" });
    router.push("/login");
  };

  return (
    <header className="top-bar">
      <Logo size="sm" />
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        {right}
        {onHelpOpen && (
          <button onClick={onHelpOpen} className="btn-press" style={coralBtn}>
            ?
          </button>
        )}
        <button onClick={handleLogout} className="btn-press" style={coralBtn}>
          LOGOUT
        </button>
      </div>
    </header>
  );
}
