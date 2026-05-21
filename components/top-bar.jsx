"use client";

import Logo from "@/components/logo";
import { ThemeToggle } from "@/components/ui/primitives";
import { useTheme } from "@/app/layout";

export default function TopBar({ right }) {
  const { theme, toggleTheme } = useTheme();

  return (
    <header className="top-bar">
      <Logo size="sm" />
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        {right}
        <ThemeToggle theme={theme} onToggle={toggleTheme} />
      </div>
    </header>
  );
}
