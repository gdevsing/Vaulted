"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV_ITEMS = [
  { href: "/dashboard",  icon: "◈", label: "HOME"   },
  { href: "/update",     icon: "↻", label: "SYNC"   },
  { href: "/trends",     icon: "∿", label: "TRENDS" },
  { href: "/milestones", icon: "◎", label: "GOALS"  },
  { href: "/admin",      icon: "⊞", label: "ADMIN"  },
];

export default function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="bottom-nav">
      {NAV_ITEMS.map(item => {
        const active = pathname.startsWith(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 3,
              textDecoration: "none",
              padding: "4px 12px",
            }}
          >
            <span style={{
              fontSize: 18,
              color: active ? "var(--gold)" : "var(--ink2)",
              transition: "color 0.2s",
            }}>
              {item.icon}
            </span>
            <span style={{
              fontFamily: "var(--font-mono)",
              fontSize: 8,
              letterSpacing: "0.1em",
              color: active ? "var(--gold)" : "var(--ink2)",
              fontWeight: active ? 600 : 400,
              transition: "color 0.2s",
            }}>
              {item.label}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
