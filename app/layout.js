"use client";

import { useState, useContext, createContext, useEffect, useRef, useCallback } from "react";
import "./globals.css";
import LockScreen from "@/components/lock-screen";

export const ThemeContext = createContext({ theme: "coral", toggleTheme: () => {} });
export const useTheme = () => useContext(ThemeContext);

const DEFAULT_TIMEOUT_MS = 5 * 60 * 1000; // 5 minutes

export default function RootLayout({ children }) {
  const theme      = "coral";
  const toggleTheme = () => {};
  const [locked, setLocked]     = useState(false);
  const [biometricEnabled, setBiometricEnabled] = useState(false);
  const timeoutRef = useRef(null);
  const timeoutMs  = useRef(DEFAULT_TIMEOUT_MS);

  // Load biometric + timeout settings
  useEffect(() => {
    fetch("/api/settings", { cache: "no-store" })
      .then(r => r.json())
      .then(({ settings }) => {
        const enabled = settings.webauthn_enabled === "1";
        setBiometricEnabled(enabled);
        const mins = parseInt(settings.lock_timeout_mins || "5", 10);
        const valid = [2, 5, 10].includes(mins) ? mins : 5;
        timeoutMs.current = valid * 60 * 1000;
      })
      .catch(() => {});
  }, []);

  const resetTimer = useCallback(() => {
    if (!biometricEnabled) return;
    clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => setLocked(true), timeoutMs.current);
  }, [biometricEnabled]);

  // Start timer on mount, reset on activity
  useEffect(() => {
    if (!biometricEnabled) return;
    const events = ["touchstart", "touchmove", "click", "keydown", "scroll"];
    events.forEach(e => window.addEventListener(e, resetTimer, { passive: true }));
    resetTimer();
    return () => {
      events.forEach(e => window.removeEventListener(e, resetTimer));
      clearTimeout(timeoutRef.current);
    };
  }, [biometricEnabled, resetTimer]);

  const handleUnlock = () => {
    setLocked(false);
    resetTimer();
  };

  return (
    <html lang="en" data-theme={theme}>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
        {/* PWA — Android */}
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#0F0F0F" />
        <meta name="mobile-web-app-capable" content="yes" />
        {/* PWA — iOS */}
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="Vaulted" />
        <link rel="apple-touch-icon" href="/icons/icon-152x152.png" />
        <link rel="apple-touch-icon" sizes="192x192" href="/icons/icon-192x192.png" />
        {/* Favicon */}
        <link rel="icon" type="image/svg+xml" href="/icons/icon.svg" />
        <link rel="icon" type="image/png" sizes="96x96" href="/icons/icon-96x96.png" />
        <title>Vaulted</title>
      </head>
      <body>
        <ThemeContext.Provider value={{ theme, toggleTheme }}>
          {locked && biometricEnabled ? (
            <LockScreen onUnlock={handleUnlock} />
          ) : (
            children
          )}
        </ThemeContext.Provider>
      </body>
    </html>
  );
}
