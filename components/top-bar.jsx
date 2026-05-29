"use client";

import { useRouter } from "next/navigation";
import Logo from "@/components/logo";

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
          <button onClick={onHelpOpen} className="btn-press" style={{
            background: "none", border: "1px solid var(--border)",
            borderRadius: "2px 7px 7px 2px", padding: "4px 10px",
            fontFamily: "var(--font-mono)", fontSize: 9,
            letterSpacing: "0.1em", color: "var(--ink2)", cursor: "pointer",
          }}>
            ?
          </button>
        )}
        <button onClick={handleLogout} className="btn-press" style={{
          background: "none", border: "1px solid var(--border)",
          borderRadius: "2px 7px 7px 2px", padding: "4px 10px",
          fontFamily: "var(--font-mono)", fontSize: 9,
          letterSpacing: "0.1em", color: "var(--ink2)", cursor: "pointer",
        }}>
          LOGOUT
        </button>
      </div>
    </header>
  );
}
