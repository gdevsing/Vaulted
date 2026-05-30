"use client";

import { useState, useEffect } from "react";
import Logo from "@/components/logo";

// Safely decode base64url to Uint8Array — handles missing padding (iOS is strict)
function decodeBase64url(str) {
  const base64 = str.replace(/-/g, "+").replace(/_/g, "/");
  const padded  = base64.padEnd(base64.length + (4 - base64.length % 4) % 4, "=");
  const binary  = atob(padded);
  return Uint8Array.from(binary, c => c.charCodeAt(0));
}

export default function LockScreen({ onUnlock }) {
  const [status,   setStatus]   = useState("idle"); // idle | prompting | error | unsupported
  const [attempts, setAttempts] = useState(0);
  const [message,  setMessage]  = useState("");

  // Check support on mount — don't auto-prompt (iOS blocks non-gesture calls)
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!window.PublicKeyCredential) {
      setStatus("unsupported");
      setMessage("Biometric not available on this browser.");
    }
  }, []);

  const handleUnlock = async () => {
    if (attempts >= 5) return;
    if (status === "prompting") return;
    setStatus("prompting");
    setMessage("");

    try {
      // Phase 1 — get challenge + allowed credentials
      const startRes = await fetch("/api/webauthn/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phase: "start" }),
      });

      if (!startRes.ok) {
        const err = await startRes.json();
        throw new Error(err.error || "Failed to start");
      }

      const options = await startRes.json();

      // Decode challenge
      const challenge = decodeBase64url(options.challenge);

      // Decode each allowed credential id
      const allowCredentials = (options.allowCredentials || []).map(c => ({
        type: "public-key",
        id:   decodeBase64url(c.id),
      }));

      // Phase 2 — browser biometric prompt
      // userVerification "preferred" is more compatible with iOS than "required"
      const assertion = await navigator.credentials.get({
        publicKey: {
          challenge,
          allowCredentials,
          userVerification: "preferred",
          timeout: 60000,
        },
      });

      if (!assertion) throw new Error("No assertion returned");

      // Encode response back to base64
      const id    = assertion.id;
      const rawId = btoa(String.fromCharCode(...new Uint8Array(assertion.rawId)));

      // Phase 3 — verify
      const finishRes = await fetch("/api/webauthn/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phase: "finish", id, rawId, type: assertion.type }),
      });

      const result = await finishRes.json();
      if (result.ok) {
        setStatus("idle");
        onUnlock();
      } else {
        throw new Error(result.error || "Verification failed");
      }

    } catch (err) {
      const name = err.name || "";
      if (name === "NotSupportedError" || name === "SecurityError") {
        setStatus("unsupported");
        setMessage("Biometric not supported on this device.");
      } else if (name === "NotAllowedError") {
        // User cancelled — just reset, don't count as failure
        setStatus("idle");
        setMessage("Cancelled. Tap Unlock to try again.");
      } else if (name === "InvalidStateError") {
        setStatus("idle");
        setMessage("Credential not found. Try re-registering this device.");
      } else {
        const newAttempts = attempts + 1;
        setAttempts(newAttempts);
        setStatus("idle");
        setMessage(err.message || "Something went wrong.");
      }
    }
  };

  const tooManyAttempts = attempts >= 5;

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 9999,
      background: "#0F0F0F",
      display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center",
      gap: 28, padding: 40,
    }}>
      <Logo size="lg" animate={false} />

      <div style={{ textAlign: "center" }}>
        <div style={{
          fontFamily: "var(--font-display)", fontSize: 18,
          color: "var(--ink)", marginBottom: 10, letterSpacing: "0.05em",
        }}>
          Vaulted is locked
        </div>
        <div style={{
          fontFamily: "var(--font-mono)", fontSize: 10,
          color: message ? (status === "unsupported" ? "var(--negative)" : "var(--ink2)") : "var(--ink2)",
          letterSpacing: "0.08em", lineHeight: 1.6,
        }}>
          {status === "prompting"
            ? "Waiting for biometric..."
            : status === "unsupported"
            ? message
            : tooManyAttempts
            ? "Too many failed attempts."
            : message || "Tap Unlock to use Face ID or fingerprint"}
        </div>
      </div>

      {/* Unlock button — always visible unless unsupported or too many attempts */}
      {status !== "unsupported" && !tooManyAttempts && (
        <button
          onClick={handleUnlock}
          disabled={status === "prompting"}
          className="btn-press"
          style={{
            background: status === "prompting" ? "rgba(255,71,87,0.12)" : "transparent",
            border: "1px solid rgba(255,71,87,0.6)",
            borderRadius: "3px 16px 16px 3px",
            padding: "14px 40px",
            fontFamily: "var(--font-mono)", fontSize: 12,
            letterSpacing: "0.14em",
            color: "#FF4757",
            cursor: status === "prompting" ? "default" : "pointer",
            boxShadow: status === "prompting" ? "none" : "0 0 20px rgba(255,71,87,0.2)",
            transition: "all 0.2s",
            minWidth: 160,
          }}
        >
          {status === "prompting" ? "UNLOCKING..." : "UNLOCK"}
        </button>
      )}

      {tooManyAttempts && (
        <div style={{
          fontFamily: "var(--font-mono)", fontSize: 9,
          color: "var(--ink2)", letterSpacing: "0.08em",
          textAlign: "center", lineHeight: 1.8,
        }}>
          <a href="/login" style={{ color: "var(--gold)", textDecoration: "none" }}>
            LOG OUT AND LOG BACK IN
          </a>
        </div>
      )}
    </div>
  );
}
