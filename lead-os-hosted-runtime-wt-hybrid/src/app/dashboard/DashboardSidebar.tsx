"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface NavItem {
  href: string;
  label: string;
  icon: string;
}

interface NavGroup {
  label: string;
  icon: string;
  items: NavItem[];
}

// ---------------------------------------------------------------------------
// Navigation structure
// ---------------------------------------------------------------------------

const NAV_GROUPS: NavGroup[] = [
  {
    label: "Overview",
    icon: "⊞",
    items: [
      { href: "/dashboard", label: "Dashboard", icon: "◈" },
      { href: "/dashboard/radar", label: "Radar", icon: "◎" },
    ],
  },
  {
    label: "Leads",
    icon: "◉",
    items: [
      { href: "/dashboard/leads", label: "All Leads", icon: "≡" },
      { href: "/dashboard/pipeline", label: "Pipeline", icon: "⇢" },
      { href: "/dashboard/scoring", label: "Scoring", icon: "★" },
      { href: "/dashboard/lead-magnets", label: "Lead Magnets", icon: "◆" },
    ],
  },
  {
    label: "Analytics",
    icon: "▲",
    items: [
      { href: "/dashboard/analytics", label: "Analytics", icon: "▦" },
      { href: "/dashboard/attribution", label: "Attribution", icon: "⤳" },
      { href: "/dashboard/revenue", label: "Revenue", icon: "$" },
      { href: "/dashboard/experiments", label: "Experiments", icon: "⚗" },
    ],
  },
  {
    label: "Automation",
    icon: "⚙",
    items: [
      { href: "/dashboard/workflows", label: "Workflows", icon: "⟳" },
      { href: "/dashboard/agents", label: "Agents", icon: "⬡" },
      { href: "/dashboard/bookings", label: "Bookings", icon: "▣" },
      { href: "/dashboard/documents", label: "Documents", icon: "▤" },
      { href: "/dashboard/creative", label: "Creative", icon: "✦" },
      { href: "/dashboard/distribution", label: "Distribution", icon: "⊕" },
    ],
  },
  {
    label: "Configuration",
    icon: "◩",
    items: [
      { href: "/dashboard/providers", label: "Providers", icon: "⬟" },
      { href: "/dashboard/credentials", label: "Credentials", icon: "⬠" },
      { href: "/dashboard/settings", label: "Settings", icon: "⚙" },
    ],
  },
  {
    label: "Business",
    icon: "◫",
    items: [
      { href: "/dashboard/billing", label: "Billing", icon: "◈" },
      { href: "/dashboard/marketplace", label: "Marketplace", icon: "◎" },
      { href: "/dashboard/tenants", label: "Tenants", icon: "⊞" },
      { href: "/dashboard/feedback", label: "Feedback", icon: "◉" },
      { href: "/dashboard/health", label: "Health", icon: "♥" },
    ],
  },
];

const STORAGE_KEY = "leados_sidebar_collapsed";
const ACCENT = "#4f46e5";
const ACCENT_BG = "rgba(79, 70, 229, 0.12)";
const SIDEBAR_FULL = 240;
const SIDEBAR_COLLAPSED = 60;

// ---------------------------------------------------------------------------
// NavGroupSection
// ---------------------------------------------------------------------------

interface NavGroupSectionProps {
  group: NavGroup;
  pathname: string;
  isCollapsed: boolean;
}

function NavGroupSection({ group, pathname, isCollapsed }: NavGroupSectionProps) {
  const hasActive = group.items.some((item) => isActive(item.href, pathname));
  const [isOpen, setIsOpen] = useState(true);

  // Auto-expand the group containing the active item
  useEffect(() => {
    if (hasActive) setIsOpen(true);
  }, [hasActive]);

  return (
    <li>
      {/* Group header — hidden when collapsed; groups merge into icon-only items */}
      {!isCollapsed && (
        <button
          type="button"
          onClick={() => setIsOpen((prev) => !prev)}
          aria-expanded={isOpen}
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            width: "100%",
            padding: "6px 12px",
            background: "none",
            border: "none",
            cursor: "pointer",
            color: "#6b7280",
            fontSize: "0.7rem",
            fontWeight: 700,
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            borderRadius: 6,
          }}
        >
          <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <span aria-hidden="true" style={{ fontSize: "0.85rem" }}>{group.icon}</span>
            {group.label}
          </span>
          <span
            aria-hidden="true"
            style={{
              fontSize: "0.7rem",
              transform: isOpen ? "rotate(0deg)" : "rotate(-90deg)",
              transition: "transform 180ms ease",
              display: "inline-block",
            }}
          >
            ▾
          </span>
        </button>
      )}

      {/* Items */}
      <ul
        role="list"
        style={{
          listStyle: "none",
          padding: 0,
          margin: 0,
          overflow: "hidden",
          maxHeight: (!isCollapsed && !isOpen) ? 0 : 9999,
          transition: "max-height 200ms ease",
        }}
      >
        {group.items.map((item) => {
          const active = isActive(item.href, pathname);
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                aria-current={active ? "page" : undefined}
                title={isCollapsed ? item.label : undefined}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  padding: isCollapsed ? "10px 0" : "8px 12px",
                  justifyContent: isCollapsed ? "center" : "flex-start",
                  borderRadius: 8,
                  textDecoration: "none",
                  fontSize: "0.875rem",
                  fontWeight: active ? 700 : 500,
                  color: active ? ACCENT : "#374151",
                  background: active ? ACCENT_BG : "transparent",
                  transition: "background 120ms ease, color 120ms ease",
                  outline: "none",
                }}
                onMouseEnter={(e) => {
                  if (!active) {
                    (e.currentTarget as HTMLAnchorElement).style.background = "rgba(79,70,229,0.06)";
                  }
                }}
                onMouseLeave={(e) => {
                  if (!active) {
                    (e.currentTarget as HTMLAnchorElement).style.background = "transparent";
                  }
                }}
              >
                <span
                  aria-hidden="true"
                  style={{
                    fontSize: isCollapsed ? "1.1rem" : "0.9rem",
                    width: isCollapsed ? "auto" : 18,
                    textAlign: "center",
                    flexShrink: 0,
                    color: active ? ACCENT : "#9ca3af",
                  }}
                >
                  {item.icon}
                </span>
                {!isCollapsed && <span style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{item.label}</span>}
              </Link>
            </li>
          );
        })}
      </ul>
    </li>
  );
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function isActive(href: string, pathname: string): boolean {
  if (href === "/dashboard") return pathname === "/dashboard";
  return pathname === href || pathname.startsWith(href + "/");
}

// ---------------------------------------------------------------------------
// DashboardSidebar
// ---------------------------------------------------------------------------

export function DashboardSidebar() {
  const pathname = usePathname();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const drawerRef = useRef<HTMLElement>(null);
  const hamburgerRef = useRef<HTMLButtonElement>(null);

  // Persist collapse state
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === "true") setIsCollapsed(true);
  }, []);

  const toggleCollapse = () => {
    setIsCollapsed((prev) => {
      const next = !prev;
      localStorage.setItem(STORAGE_KEY, String(next));
      return next;
    });
  };

  // Close mobile drawer on route change
  useEffect(() => {
    setIsMobileOpen(false);
  }, [pathname]);

  // Trap focus in mobile drawer and restore on close
  useEffect(() => {
    if (!isMobileOpen) {
      hamburgerRef.current?.focus();
      return;
    }
    const el = drawerRef.current;
    if (!el) return;
    const focusable = el.querySelectorAll<HTMLElement>(
      'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])'
    );
    focusable[0]?.focus();

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsMobileOpen(false);
        return;
      }
      if (e.key !== "Tab") return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (e.shiftKey) {
        if (document.activeElement === first) {
          e.preventDefault();
          last?.focus();
        }
      } else {
        if (document.activeElement === last) {
          e.preventDefault();
          first?.focus();
        }
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isMobileOpen]);

  const sidebarWidth = isCollapsed ? SIDEBAR_COLLAPSED : SIDEBAR_FULL;

  const sidebarContent = (
    <>
      {/* Operator info */}
      <div
        style={{
          padding: isCollapsed ? "16px 0" : "16px 12px",
          borderBottom: "1px solid #e5e7eb",
          display: "flex",
          flexDirection: "column",
          alignItems: isCollapsed ? "center" : "flex-start",
          gap: 4,
        }}
      >
        {!isCollapsed && (
          <span style={{ fontSize: "0.7rem", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "#9ca3af" }}>
            Operator
          </span>
        )}
        <div
          style={{
            width: 32,
            height: 32,
            borderRadius: "50%",
            background: ACCENT_BG,
            border: `2px solid ${ACCENT}`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "0.85rem",
            color: ACCENT,
            fontWeight: 700,
            flexShrink: 0,
          }}
          aria-hidden="true"
        >
          O
        </div>
        {!isCollapsed && (
          <a
            href="/auth/sign-out"
            style={{
              fontSize: "0.75rem",
              color: "#6b7280",
              textDecoration: "none",
              marginTop: 2,
            }}
            onMouseEnter={(e) => ((e.currentTarget as HTMLAnchorElement).style.color = ACCENT)}
            onMouseLeave={(e) => ((e.currentTarget as HTMLAnchorElement).style.color = "#6b7280")}
          >
            Sign out
          </a>
        )}
      </div>

      {/* Nav groups */}
      <nav aria-label="Dashboard navigation" style={{ flex: 1, overflowY: "auto", padding: "8px 8px 0" }}>
        <ul role="list" style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 4 }}>
          {NAV_GROUPS.map((group) => (
            <NavGroupSection
              key={group.label}
              group={group}
              pathname={pathname}
              isCollapsed={isCollapsed}
            />
          ))}
        </ul>
      </nav>

      {/* Collapse toggle */}
      <div style={{ padding: "12px 8px", borderTop: "1px solid #e5e7eb" }}>
        <button
          type="button"
          onClick={toggleCollapse}
          aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: isCollapsed ? "center" : "flex-start",
            gap: 8,
            width: "100%",
            padding: "8px 12px",
            background: "none",
            border: "none",
            cursor: "pointer",
            borderRadius: 8,
            color: "#6b7280",
            fontSize: "0.8rem",
            fontWeight: 500,
          }}
        >
          <span aria-hidden="true" style={{ fontSize: "0.9rem", transform: isCollapsed ? "scaleX(-1)" : "none", display: "inline-block" }}>
            ◁
          </span>
          {!isCollapsed && "Collapse"}
        </button>
      </div>
    </>
  );

  return (
    <>
      {/* ------------------------------------------------------------------ */}
      {/* Mobile hamburger — visible only below 768px                         */}
      {/* ------------------------------------------------------------------ */}
      <button
        ref={hamburgerRef}
        type="button"
        onClick={() => setIsMobileOpen(true)}
        aria-label="Open navigation menu"
        aria-expanded={isMobileOpen}
        aria-controls="dashboard-sidebar-drawer"
        style={{
          position: "fixed",
          top: 12,
          left: 12,
          zIndex: 50,
          display: "none",
          alignItems: "center",
          justifyContent: "center",
          width: 44,
          height: 44,
          borderRadius: 8,
          background: "#fff",
          border: "1px solid #e5e7eb",
          cursor: "pointer",
          fontSize: "1.1rem",
        }}
        className="sidebar-hamburger"
      >
        ☰
      </button>

      {/* ------------------------------------------------------------------ */}
      {/* Desktop sidebar — hidden below 768px                                */}
      {/* ------------------------------------------------------------------ */}
      <aside
        aria-label="Dashboard sidebar"
        style={{
          width: sidebarWidth,
          minHeight: "100vh",
          background: "#fff",
          borderRight: "1px solid #e5e7eb",
          display: "flex",
          flexDirection: "column",
          transition: "width 200ms ease",
          flexShrink: 0,
          position: "sticky",
          top: 0,
          height: "100vh",
          overflowY: "auto",
          overflowX: "hidden",
        }}
        className="sidebar-desktop"
      >
        {sidebarContent}
      </aside>

      {/* ------------------------------------------------------------------ */}
      {/* Mobile drawer overlay                                               */}
      {/* ------------------------------------------------------------------ */}
      {isMobileOpen && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 40,
            background: "rgba(0,0,0,0.4)",
          }}
          aria-hidden="true"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      <aside
        id="dashboard-sidebar-drawer"
        ref={drawerRef}
        aria-label="Dashboard navigation drawer"
        aria-modal="true"
        role="dialog"
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          zIndex: 50,
          width: SIDEBAR_FULL,
          height: "100vh",
          background: "#fff",
          borderRight: "1px solid #e5e7eb",
          display: "flex",
          flexDirection: "column",
          transform: isMobileOpen ? "translateX(0)" : "translateX(-100%)",
          transition: "transform 220ms ease",
          overflowY: "auto",
          overflowX: "hidden",
        }}
        className="sidebar-mobile"
      >
        {/* Close button */}
        <button
          type="button"
          onClick={() => setIsMobileOpen(false)}
          aria-label="Close navigation menu"
          style={{
            alignSelf: "flex-end",
            margin: "12px 12px 0",
            padding: "6px 10px",
            background: "none",
            border: "none",
            cursor: "pointer",
            fontSize: "1rem",
            color: "#6b7280",
            borderRadius: 6,
          }}
        >
          ✕
        </button>
        {sidebarContent}
      </aside>

      {/* ------------------------------------------------------------------ */}
      {/* Responsive styles via a style tag                                   */}
      {/* ------------------------------------------------------------------ */}
      <style>{`
        @media (max-width: 767px) {
          .sidebar-desktop { display: none !important; }
          .sidebar-hamburger { display: flex !important; }
        }
        @media (min-width: 768px) {
          .sidebar-mobile { display: none !important; }
          .sidebar-hamburger { display: none !important; }
        }
        .sidebar-desktop a:focus-visible,
        .sidebar-mobile a:focus-visible,
        .sidebar-desktop button:focus-visible,
        .sidebar-mobile button:focus-visible {
          outline: 2px solid ${ACCENT};
          outline-offset: 2px;
        }
        @media (prefers-reduced-motion: reduce) {
          .sidebar-desktop,
          .sidebar-mobile * {
            transition: none !important;
          }
        }
      `}</style>
    </>
  );
}
