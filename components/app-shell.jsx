"use client";

import { useState } from "react";
import Nav, { HelpDrawer } from "@/components/nav";
import TopBar from "@/components/top-bar";

// AppShell wraps every authenticated page
// Handles nav + help drawer state in one place
export default function AppShell({ children, topBarRight }) {
  const [helpOpen, setHelpOpen] = useState(false);

  return (
    <>
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
