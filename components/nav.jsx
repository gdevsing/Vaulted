"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import Logo from "@/components/logo";
import { ThemeToggle } from "@/components/ui/primitives";
import { useTheme } from "@/app/layout";

const NAV_ITEMS = [
  { href: "/dashboard",  icon: "◈", label: "HOME"   },
  { href: "/update",     icon: "↻", label: "SYNC"   },
  { href: "/trends",     icon: "∿", label: "TRENDS" },
  { href: "/milestones", icon: "◎", label: "GOALS"  },
  { href: "/admin",      icon: "⊞", label: "ADMIN"  },
];

// ─── Desktop Sidebar ──────────────────────────────────────────────────────────
function DesktopSidebar({ onHelpOpen }) {
  const pathname   = usePathname();
  const router     = useRouter();
  const { theme, toggleTheme } = useTheme();
  const [collapsed, setCollapsed] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("sidebar-collapsed") === "true";
    }
    return false;
  });

  const toggleCollapsed = () => {
    const next = !collapsed;
    setCollapsed(next);
    localStorage.setItem("sidebar-collapsed", String(next));
  };

  const handleLogout = async () => {
    await fetch("/api/logout", { method: "POST" });
    router.push("/login");
  };

  const w = collapsed ? 64 : 220;

  return (
    <aside
      style={{
        position: "fixed",
        top: 0, left: 0, bottom: 0,
        width: w,
        background: "var(--surface-solid)",
        borderRight: "1px solid var(--border)",
        display: "flex",
        flexDirection: "column",
        zIndex: 100,
        transition: "width 0.25s cubic-bezier(0.16,1,0.3,1)",
        overflow: "hidden",
        cursor: collapsed ? "pointer" : "default",
      }}
      onClick={collapsed ? toggleCollapsed : undefined}
      title={collapsed ? "Click to expand" : undefined}
    >

      {/* Logo + collapse toggle */}
      <div style={{
        padding: collapsed ? "20px 0" : "20px 16px",
        display: "flex",
        alignItems: "center",
        justifyContent: collapsed ? "center" : "space-between",
        borderBottom: "1px solid var(--border)",
        minHeight: 64,
      }}>
        {collapsed ? (
          <div style={{ width: 26, height: 26, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Logo size="sm" showWordmark={false} />
          </div>
        ) : (
          <>
            <Logo size="sm" />
            <button
              onClick={e => { e.stopPropagation(); toggleCollapsed(); }}
              className="btn-press"
              title="Collapse sidebar"
              style={{
                background: "none",
                border: "1px solid var(--border)",
                borderRadius: "2px 6px 6px 2px",
                padding: "4px 8px",
                cursor: "pointer",
                color: "var(--ink2)",
                fontSize: 11,
                lineHeight: 1,
                flexShrink: 0,
              }}
            >
              ◀
            </button>
          </>
        )}
      </div>

      {/* Nav items */}
      <nav style={{ flex: 1, padding: "12px 0" }}>
        {NAV_ITEMS.map(item => {
          const active = pathname.startsWith(item.href);
          return (
            <div key={item.href} style={{ position: "relative", margin: "2px 8px" }}>
              <Link href={item.href} style={{
                display: "flex",
                alignItems: "center",
                gap: collapsed ? 0 : 12,
                justifyContent: collapsed ? "center" : "flex-start",
                padding: collapsed ? "10px 0" : "10px 12px",
                borderRadius: "2px 10px 10px 2px",
                textDecoration: "none",
                background: active
                  ? "rgba(255,210,74,0.10)"
                  : "transparent",
                borderLeft: active ? "3px solid var(--gold)" : "3px solid transparent",
                transition: "all 0.15s",
              }}>
                <span style={{
                  fontSize: 17,
                  color: active ? "var(--gold)" : "var(--ink2)",
                  transition: "color 0.2s",
                  width: 20,
                  textAlign: "center",
                  flexShrink: 0,
                }}>
                  {item.icon}
                </span>
                {!collapsed && (
                  <span style={{
                    fontFamily: "var(--font-mono)",
                    fontSize: 10,
                    letterSpacing: "0.1em",
                    color: active ? "var(--gold)" : "var(--ink2)",
                    fontWeight: active ? 600 : 400,
                    whiteSpace: "nowrap",
                  }}>
                    {item.label}
                  </span>
                )}
              </Link>
              {/* Tooltip when collapsed */}
              {collapsed && (
                <div className="sidebar-tooltip">
                  {item.label}
                </div>
              )}
            </div>
          );
        })}
      </nav>

      {/* Bottom actions */}
      <div style={{
        padding: "12px 8px",
        borderTop: "1px solid var(--border)",
        display: "flex",
        flexDirection: "column",
        gap: 6,
      }}>

        {/* Help button */}
        <button onClick={onHelpOpen} className="btn-press" style={{
          display: "flex", alignItems: "center",
          gap: collapsed ? 0 : 12,
          justifyContent: collapsed ? "center" : "flex-start",
          padding: collapsed ? "10px 0" : "10px 12px",
          background: "transparent",
          border: "none",
          borderRadius: "2px 10px 10px 2px",
          cursor: "pointer",
          width: "100%",
          position: "relative",
        }}>
          <span style={{ fontSize: 16, color: "var(--ink2)", width: 20, textAlign: "center" }}>?</span>
          {!collapsed && (
            <span style={{ fontFamily: "var(--font-mono)", fontSize: 10, letterSpacing: "0.1em", color: "var(--ink2)" }}>
              HELP
            </span>
          )}
          {collapsed && <div className="sidebar-tooltip">HELP</div>}
        </button>

        {/* Theme toggle */}
        <button onClick={toggleTheme} className="btn-press" style={{
          display: "flex", alignItems: "center",
          gap: collapsed ? 0 : 12,
          justifyContent: collapsed ? "center" : "flex-start",
          padding: collapsed ? "10px 0" : "10px 12px",
          background: "transparent", border: "none",
          borderRadius: "2px 10px 10px 2px",
          cursor: "pointer", width: "100%", position: "relative",
        }}>
          <span style={{ fontSize: 14, color: "var(--ink2)", width: 20, textAlign: "center" }}>
            {"☀"}
          </span>
          {!collapsed && (
            <span style={{ fontFamily: "var(--font-mono)", fontSize: 10, letterSpacing: "0.1em", color: "var(--ink2)" }}>
              {"LIGHT"}
            </span>
          )}
          {collapsed && <div className="sidebar-tooltip">{"LIGHT MODE"}</div>}
        </button>

        {/* Logout */}
        <button onClick={handleLogout} className="btn-press" style={{
          display: "flex", alignItems: "center",
          gap: collapsed ? 0 : 12,
          justifyContent: collapsed ? "center" : "flex-start",
          padding: collapsed ? "10px 0" : "10px 12px",
          background: "transparent", border: "none",
          borderRadius: "2px 10px 10px 2px",
          cursor: "pointer", width: "100%", position: "relative",
        }}>
          <span style={{ fontSize: 13, color: "var(--ink2)", width: 20, textAlign: "center" }}>⇥</span>
          {!collapsed && (
            <span style={{ fontFamily: "var(--font-mono)", fontSize: 10, letterSpacing: "0.1em", color: "var(--ink2)" }}>
              LOGOUT
            </span>
          )}
          {collapsed && <div className="sidebar-tooltip">LOGOUT</div>}
        </button>
      </div>
    </aside>
  );
}

// ─── Mobile Bottom Nav ────────────────────────────────────────────────────────
function MobileNav({ onHelpOpen }) {
  const pathname = usePathname();
  return (
    <nav className="bottom-nav">
      {NAV_ITEMS.map(item => {
        const active = pathname.startsWith(item.href);
        return (
          <Link key={item.href} href={item.href} style={{
            display: "flex", flexDirection: "column",
            alignItems: "center", gap: 3,
            textDecoration: "none", padding: "4px 10px",
          }}>
            <span style={{ fontSize: 18, color: active ? "var(--gold)" : "var(--ink2)", transition: "color 0.2s" }}>
              {item.icon}
            </span>
            <span style={{
              fontFamily: "var(--font-mono)", fontSize: 8, letterSpacing: "0.1em",
              color: active ? "var(--gold)" : "var(--ink2)",
              fontWeight: active ? 600 : 400, transition: "color 0.2s",
            }}>
              {item.label}
            </span>
          </Link>
        );
      })}

    </nav>
  );
}

// ─── Help Drawer ──────────────────────────────────────────────────────────────
const HELP_SECTIONS = [
  {
    icon: "◈", title: "Dashboard",
    items: [
      "Shows your total net worth across all accounts",
      "Filter by Combined, Husband, Wife or Joint",
      "Asset allocation donut shows cash/shares/crypto/super split",
      "XP bar tracks progress toward your next goal",
    ],
  },
  {
    icon: "↻", title: "Sync",
    items: [
      "Updates account balances one at a time",
      "Screenshot tab — upload a bank app screenshot, Gemini AI reads the balance automatically",
      "Manual tab — type the balance in directly",
      "No Change tab — confirm the balance hasn't changed",
      "Queue chips at the top show done ✓ / current ▶ / pending",
      "Tap ALL ACCOUNTS to update any account regardless of schedule",
    ],
  },
  {
    icon: "∿", title: "Trends",
    items: [
      "Net worth chart over time — 1M / 3M / 6M / 1Y / ALL filters",
      "Breakdown view shows each asset class stacked",
      "Monthly snapshot table shows month-by-month history",
    ],
  },
  {
    icon: "◎", title: "Goals",
    items: [
      "Tracks progress toward custom net worth targets",
      "Projections estimate when you'll hit each goal based on recent growth",
      "Achieved milestones logged with the date they were reached",
    ],
  },
  {
    icon: "⊞", title: "Admin",
    items: [
      "Add, edit or remove accounts",
      "Credentials tab — configure Gemini API key, ntfy.sh notifications, backups",
      "Cron jobs — view last run status, trigger manually with Run Now",
    ],
  },
  {
    icon: "◷", title: "Weekly Sync",
    items: [
      "ntfy.sh sends a push notification every Sunday at 9am",
      "Download the ntfy app and subscribe to your topic to receive it",
      "Tap the notification to open the Sync screen directly",
    ],
  },
];

export function HelpDrawer({ open, onClose }) {
  const { theme } = useTheme();

  useEffect(() => {
    const handler = (e) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  if (!open) return null;

  return (
    <>
      {/* Backdrop */}
      <div onClick={onClose} style={{
        position: "fixed", inset: 0,
        background: "rgba(0,0,0,0.5)",
        zIndex: 199,
        animation: "fadeIn 0.2s ease",
      }} />

      {/* Drawer — bottom sheet on mobile, right panel on desktop */}
      <div style={{
        position: "fixed",
        zIndex: 200,
        background: "#141210",
        borderTop: "1px solid var(--border)",
        overflowY: "auto",
      }}
      className="help-drawer"
      >
        {/* Header */}
        <div style={{
          display: "flex", justifyContent: "space-between", alignItems: "center",
          padding: "18px 20px 14px",
          borderBottom: "1px solid var(--border)",
          position: "sticky", top: 0,
          background: "#141210",
          zIndex: 1,
        }}>
          <div>
            <div style={{ fontFamily: "var(--font-display)", fontSize: 16, color: "var(--ink)", letterSpacing: "0.06em" }}>
              Help
            </div>
            <div style={{ fontFamily: "var(--font-mono)", fontSize: 9, color: "var(--ink2)", letterSpacing: "0.1em", marginTop: 2 }}>
              QUICK REFERENCE
            </div>
          </div>
          <button onClick={onClose} className="btn-press" style={{
            background: "none", border: "1px solid var(--border)",
            borderRadius: "2px 8px 8px 2px", padding: "5px 10px",
            fontFamily: "var(--font-mono)", fontSize: 10,
            color: "var(--ink2)", cursor: "pointer",
          }}>
            ✕
          </button>
        </div>

        {/* Content */}
        <div style={{ padding: "14px 20px 32px" }}>
          {HELP_SECTIONS.map((section, si) => (
            <div key={section.title} style={{ marginBottom: 20 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                <span style={{ fontSize: 14, color: "var(--gold)" }}>{section.icon}</span>
                <span style={{ fontFamily: "var(--font-display)", fontSize: 13, color: "var(--ink)", letterSpacing: "0.06em" }}>
                  {section.title}
                </span>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                {section.items.map((item, ii) => (
                  <div key={ii} style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
                    <span style={{ color: "var(--gold)", fontSize: 8, marginTop: 4, flexShrink: 0 }}>◆</span>
                    <span style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--ink2)", lineHeight: 1.6, letterSpacing: "0.04em" }}>
                      {item}
                    </span>
                  </div>
                ))}
              </div>
              {si < HELP_SECTIONS.length - 1 && (
                <div style={{ height: 1, background: "var(--border)", marginTop: 16 }} />
              )}
            </div>
          ))}

          <div style={{
            fontFamily: "var(--font-serif)", fontStyle: "italic",
            fontSize: 11, color: "var(--ink3)", textAlign: "center", marginTop: 8,
          }}>
            your wealth, compounding quietly
          </div>
        </div>
      </div>

      <style>{`
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }

        @media (max-width: 767px) {
          .help-drawer {
            bottom: 0; left: 0; right: 0;
            border-radius: 16px 16px 0 0;
            max-height: 80vh;
            animation: slideUp 0.3s cubic-bezier(0.16,1,0.3,1);
          }
          @keyframes slideUp {
            from { transform: translateY(100%); }
            to   { transform: translateY(0); }
          }
        }

        @media (min-width: 768px) {
          .help-drawer {
            top: 0; right: 0; bottom: 0;
            width: 360px;
            border-left: 1px solid var(--border);
            border-top: none;
            animation: slideRight 0.3s cubic-bezier(0.16,1,0.3,1);
          }
          @keyframes slideRight {
            from { transform: translateX(100%); }
            to   { transform: translateX(0); }
          }
        }
      `}</style>
    </>
  );
}

// ─── Main Nav export — renders correct version based on screen size ────────────
export default function Nav({ onHelpOpen }) {
  const [isDesktop, setIsDesktop] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(min-width: 768px)");
    setIsDesktop(mq.matches);
    const handler = (e) => setIsDesktop(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  if (isDesktop) return <DesktopSidebar onHelpOpen={onHelpOpen} />;
  return <MobileNav onHelpOpen={onHelpOpen} />;
}
