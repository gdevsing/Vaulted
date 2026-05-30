"use client";

import { useState, useEffect } from "react";
import Logo from "@/components/logo";

// Safely decode base64url → Uint8Array (iOS Safari strict about padding)
function decodeBase64url(str) {
  const base64 = str.replace(/-/g, "+").replace(/_/g, "/");
  const padded  = base64.padEnd(base64.length + (4 - base64.length % 4) % 4, "=");
  return Uint8Array.from(atob(padded), c => c.charCodeAt(0));
}

export default function LockScreen({ onUnlock }) {
  const [status,   setStatus]   = useState("idle"); // idle | prompting | unsupported
  const [attempts, setAttempts] = useState(0);
  const [message,  setMessage]  = useState("");

  // Check support on mount — no auto-prompt (iOS blocks non-gesture calls)
  useEffect(() => {
    if (typeof window !== "undefined" && !window.PublicKeyCredential) {
      setStatus("unsupported");
      setMessage("Biometric not available on this browser.");
    }
  }, []);

  const handleUnlock = async () => {
    if (attempts >= 5 || status === "prompting") return;
    setStatus("prompting");
    setMessage("");

    try {
      // Phase 1 — get challenge
      const startRes = await fetch("/api/webauthn/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phase: "start" }),
      });
      if (!startRes.ok) throw new Error((await startRes.json()).error || "Failed to start");
      const options = await startRes.json();

      // Decode challenge
      const challenge = decodeBase64url(options.challenge);

      // Decode credential IDs — MUST be passed so iOS knows to authenticate
      // against an existing passkey, not create a new one.
      // Empty allowCredentials = "create new passkey" which shows the storage picker.
      const allowCredentials = (options.allowCredentials || []).map(c => ({
        type: "public-key",
        id:   decodeBase64url(c.id),
        transports: c.transports || ["internal"],
      }));

      // Phase 2 — browser biometric prompt
      // Pass allowCredentials so iOS goes straight to Face ID
      // mediation: "silent" skips the picker on Android when exactly one credential matches
      const credRequest = {
        publicKey: {
          challenge,
          allowCredentials,
          userVerification: "preferred",
          timeout: 60000,
        },
      };
      if (allowCredentials.length === 1) {
        credRequest.mediation = "silent";
      }
      const assertion = await navigator.credentials.get(credRequest);

      if (!assertion) throw new Error("No assertion returned");

      // Phase 3 — verify
      const finishRes = await fetch("/api/webauthn/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phase: "finish",
          id:    assertion.id,
          rawId: btoa(String.fromCharCode(...new Uint8Array(assertion.rawId))),
          type:  assertion.type,
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
      const name = err.name || "";
      if (name === "NotSupportedError" || name === "SecurityError") {
        setStatus("unsupported");
        setMessage("Biometric not supported on this device.");
      } else if (name === "NotAllowedError") {
        // User cancelled — don't count as failure
        setStatus("idle");
        setMessage("Cancelled. Tap Unlock to try again.");
      } else if (name === "InvalidStateError") {
        setStatus("idle");
        setMessage("Credential not found. Re-register this device in Admin.");
      } else {
        setAttempts(a => a + 1);
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
          color: "var(--ink2)", letterSpacing: "0.08em", lineHeight: 1.6,
        }}>
          {status === "prompting"    ? "Waiting for biometric..." :
           status === "unsupported"  ? message :
           tooManyAttempts           ? "Too many failed attempts." :
           message                   || "Tap Unlock to use Face ID or fingerprint"}
        </div>
      </div>

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
            letterSpacing: "0.14em", color: "#FF4757",
            cursor: status === "prompting" ? "default" : "pointer",
            boxShadow: status === "prompting" ? "none" : "0 0 20px rgba(255,71,87,0.2)",
            transition: "all 0.2s", minWidth: 160,
          }}
        >
          {status === "prompting" ? "UNLOCKING..." : "UNLOCK"}
        </button>
      )}

      {tooManyAttempts && (
        <a href="/login" style={{
          fontFamily: "var(--font-mono)", fontSize: 9,
          color: "var(--gold)", letterSpacing: "0.1em", textDecoration: "none",
        }}>
          LOG OUT AND LOG BACK IN
        </a>
      )}
    </div>
  );
}
