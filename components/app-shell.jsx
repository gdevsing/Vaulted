"use client";

import { useState, useEffect } from "react";
import SplashScreen from "@/components/splash";
import Nav, { HelpDrawer } from "@/components/nav";
import TopBar from "@/components/top-bar";

// AppShell wraps every authenticated page
// Handles nav + help drawer state in one place
export default function AppShell({ children, topBarRight }) {
  const [helpOpen, setHelpOpen] = useState(false);
  const [showSplash, setShowSplash] = useState(() => {
    // Only show splash on first visit per session
    if (typeof window === "undefined") return false;
    const seen = sessionStorage.getItem("splash_shown");
    if (seen) return false;
    sessionStorage.setItem("splash_shown", "1");
    return true;
  });

  return (
    <>
      {showSplash && <SplashScreen onComplete={() => setShowSplash(false)} />}
      <Nav onHelpOpen={() => setHelpOpen(true)} />

      {/* Mobile only top bar */}
      <div className="mobile-only-topbar">
        <TopBar right={topBarRight} onHelpOpen={() => setHelpOpen(true)} />
      </div>

      {children}

      <HelpDrawer open={helpOpen} onClose={() => setHelpOpen(false)} />

      <style>{`
        .mobile-only-topbar { display: block; }
        @media (min-width: 768px) {
          .mobile-only-topbar { display: none; }
        }
      `}</style>
    </>
  );
}
