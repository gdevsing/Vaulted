"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Logo from "@/components/logo";
import { ThemeToggle } from "@/components/ui/primitives";
import { useTheme } from "@/app/layout";

export default function LoginPage() {
  const { theme, toggleTheme } = useTheme();
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [error, setError] = useState(false);

  const handleLogin = async () => {
    if (!password) {
      setError(true);
      setTimeout(() => setError(false), 1000);
      return;
    }
    try {
      const res = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      if (res.ok) {
        router.push("/dashboard");
      } else {
        setError(true);
        setTimeout(() => setError(false), 1000);
      }
    } catch {
      setError(true);
      setTimeout(() => setError(false), 1000);
    }
  };

  return (
    <div style={{
      minHeight: "100vh",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      padding: "24px",
      gap: 40,
      position: "relative",
    }}>

      {/* Theme toggle — top right */}
      <div style={{ position: "absolute", top: 20, right: 20 }}>
        <ThemeToggle theme={theme} onToggle={toggleTheme} />
      </div>

      {/* Logo + tagline */}
      <div className="fade-up" style={{ textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", gap: 14 }}>
        <Logo size="lg" />
        <span style={{
          fontFamily: "var(--font-serif)",
          fontStyle: "italic",
          fontSize: 14,
          color: "var(--ink2)",
          fontWeight: 300,
        }}>
          your wealth, compounding quietly
        </span>
      </div>

      {/* Login card */}
      <div className="card fade-up fade-up-2" style={{ width: "100%", maxWidth: 360, padding: "28px 24px" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

          {/* Username */}
          <div>
            <div className="label" style={{ marginBottom: 7 }}>Username</div>
            <div style={{
              background: "rgba(255,255,255,0.03)",
              border: "1px solid var(--border)",
              borderRadius: "2px 9px 9px 2px",
              padding: "10px 13px",
              fontFamily: "var(--font-mono)",
              fontSize: 13,
              color: "var(--ink)",
            }}>
              household
            </div>
          </div>

          {/* Password */}
          <div>
            <div className="label" style={{ marginBottom: 7 }}>Password</div>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              onKeyDown={e => e.key === "Enter" && handleLogin()}
              placeholder="••••••••••"
              style={{
                width: "100%",
                background: "rgba(255,255,255,0.03)",
                border: `1px solid ${error ? "var(--negative)" : "var(--border)"}`,
                borderRadius: "2px 9px 9px 2px",
                padding: "10px 13px",
                fontFamily: "var(--font-mono)",
                fontSize: 13,
                color: "var(--ink)",
                outline: "none",
                transition: "border-color 0.2s",
              }}
            />
          </div>

          {/* Submit */}
          <button
            onClick={handleLogin}
            className="btn-press"
            style={{
              marginTop: 4,
              background: "var(--gold)",
              border: "none",
              borderRadius: "2px 9px 9px 2px",
              padding: "13px",
              fontFamily: "var(--font-display)",
              fontSize: 16,
              letterSpacing: "0.14em",
              color: "#0C0A08",
              cursor: "pointer",
              width: "100%",
            }}
          >
            ENTER THE VAULT
          </button>
        </div>
      </div>

      {/* Footer */}
      <div className="fade-up fade-up-3" style={{
        fontFamily: "var(--font-mono)",
        fontSize: 9,
        letterSpacing: "0.12em",
        color: "var(--ink3)",
        textTransform: "uppercase",
      }}>
        HTTPS · PERSONAL · ENCRYPTED
      </div>
    </div>
  );
}
