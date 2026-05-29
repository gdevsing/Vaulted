"use client";

import { useState, useEffect } from "react";
import Logo from "@/components/logo";

export default function LockScreen({ onUnlock }) {
  const [status, setStatus]   = useState("idle"); // idle | prompting | error | unsupported
  const [attempts, setAttempts] = useState(0);

  // Auto-prompt on mount
  useEffect(() => {
    // Small delay so the lock screen renders first
    const t = setTimeout(() => handleUnlock(), 400);
    return () => clearTimeout(t);
  }, []);

  const handleUnlock = async () => {
    if (attempts >= 3) return;
    setStatus("prompting");

    try {
      // Phase 1 — get challenge
      const startRes = await fetch("/api/webauthn/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phase: "start" }),
      });
      if (!startRes.ok) throw new Error("Failed to start verification");
      const options = await startRes.json();

      // Convert challenge to ArrayBuffer
      const challengeBuffer = Uint8Array.from(
        atob(options.challenge.replace(/-/g, "+").replace(/_/g, "/")),
        c => c.charCodeAt(0)
      );

      const allowCredentials = options.allowCredentials.map(c => ({
        ...c,
        id: Uint8Array.from(atob(c.id.replace(/-/g, "+").replace(/_/g, "/")), ch => ch.charCodeAt(0)),
      }));

      // Phase 2 — browser biometric prompt
      const assertion = await navigator.credentials.get({
        publicKey: {
          challenge: challengeBuffer,
          allowCredentials,
          userVerification: "required",
          timeout: 60000,
        },
      });

      // Send assertion to server
      const finishRes = await fetch("/api/webauthn/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phase:  "finish",
          id:     assertion.id,
          rawId:  btoa(String.fromCharCode(...new Uint8Array(assertion.rawId))),
          type:   assertion.type,
        }),
      });

      const result = await finishRes.json();
      if (result.ok) {
        setStatus("idle");
        onUnlock();
      } else {
        throw new Error(result.error || "Verification failed");
      }

    } catch (err) {
      if (err.name === "NotSupportedError" || err.name === "SecurityError") {
        setStatus("unsupported");
      } else if (err.name === "NotAllowedError") {
        // User cancelled or failed
        const newAttempts = attempts + 1;
        setAttempts(newAttempts);
        setStatus(newAttempts >= 3 ? "error" : "idle");
      } else {
        setAttempts(a => a + 1);
        setStatus("idle");
      }
    }
  };

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 9999,
      background: "#0F0F0F",
      display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center",
      gap: 32, padding: 32,
    }}>
      {/* Logo */}
      <Logo size="lg" animate={false} />

      {/* Status */}
      <div style={{ textAlign: "center" }}>
        <div style={{
          fontFamily: "var(--font-display)", fontSize: 18,
          color: "var(--ink)", marginBottom: 8,
        }}>
          Vaulted is locked
        </div>
        <div style={{
          fontFamily: "var(--font-mono)", fontSize: 10,
          color: "var(--ink2)", letterSpacing: "0.08em",
        }}>
          {status === "prompting" ? "Waiting for biometric..." :
           status === "unsupported" ? "Biometric not available on this device" :
           attempts >= 3 ? "Too many attempts" :
           "Use Face ID or fingerprint to unlock"}
        </div>
      </div>

      {/* Unlock button */}
      {status !== "unsupported" && attempts < 3 && (
        <button
          onClick={handleUnlock}
          disabled={status === "prompting"}
          className="btn-press"
          style={{
            background: status === "prompting" ? "rgba(255,71,87,0.1)" : "transparent",
            border: "1px solid rgba(255,71,87,0.6)",
            borderRadius: "3px 14px 14px 3px",
            padding: "12px 32px",
            fontFamily: "var(--font-mono)", fontSize: 11,
            letterSpacing: "0.12em",
            color: "#FF4757",
            cursor: status === "prompting" ? "not-allowed" : "pointer",
            boxShadow: "0 0 16px rgba(255,71,87,0.2)",
            transition: "all 0.2s",
          }}
        >
          {status === "prompting" ? "UNLOCKING..." : "UNLOCK"}
        </button>
      )}

      {/* Too many attempts */}
      {attempts >= 3 && (
        <div style={{
          fontFamily: "var(--font-mono)", fontSize: 9,
          color: "var(--ink2)", letterSpacing: "0.08em",
          textAlign: "center", lineHeight: 1.7,
        }}>
          Too many failed attempts.{"\n"}
          <a href="/login" style={{ color: "var(--gold)", textDecoration: "none" }}>
            Log out and log back in
          </a>
        </div>
      )}
    </div>
  );
}
