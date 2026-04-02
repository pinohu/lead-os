"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState, type ReactNode } from "react";
import {
  LayoutDashboard,
  Radar,
  Users,
  ArrowRightToLine,
  Star,
  Diamond,
  BarChart3,
  GitBranch,
  DollarSign,
  FlaskConical,
  Workflow,
  Bot,
  CalendarCheck,
  FileText,
  Sparkles,
  Share2,
  Building2,
  KeyRound,
  Settings,
  CreditCard,
  Store,
  UsersRound,
  MessageSquare,
  HeartPulse,
  Eye,
  CircleDot,
  TrendingUp,
  Zap,
  Briefcase,
  PanelLeft,
  ChevronDown,
  Menu,
  X,
} from "lucide-react";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface NavItem {
  href: string;
  label: string;
  icon: ReactNode;
}

interface NavGroup {
  label: string;
  icon: ReactNode;
  items: NavItem[];
}

// ---------------------------------------------------------------------------
// Navigation structure
// ---------------------------------------------------------------------------

const ICON_SIZE = 16;

const NAV_GROUPS: NavGroup[] = [
  {
    label: "Overview",
    icon: <Eye size={ICON_SIZE} />,
    items: [
      { href: "/dashboard", label: "Dashboard", icon: <LayoutDashboard size={ICON_SIZE} /> },
      { href: "/dashboard/radar", label: "Radar", icon: <Radar size={ICON_SIZE} /> },
    ],
  },
  {
    label: "Leads",
    icon: <CircleDot size={ICON_SIZE} />,
    items: [
      { href: "/dashboard/leads", label: "All Leads", icon: <Users size={ICON_SIZE} /> },
      { href: "/dashboard/pipeline", label: "Pipeline", icon: <ArrowRightToLine size={ICON_SIZE} /> },
      { href: "/dashboard/scoring", label: "Scoring", icon: <Star size={ICON_SIZE} /> },
      { href: "/dashboard/lead-magnets", label: "Lead Magnets", icon: <Diamond size={ICON_SIZE} /> },
    ],
  },
  {
    label: "Analytics",
    icon: <TrendingUp size={ICON_SIZE} />,
    items: [
      { href: "/dashboard/analytics", label: "Analytics", icon: <BarChart3 size={ICON_SIZE} /> },
      { href: "/dashboard/attribution", label: "Attribution", icon: <GitBranch size={ICON_SIZE} /> },
      { href: "/dashboard/revenue", label: "Revenue", icon: <DollarSign size={ICON_SIZE} /> },
      { href: "/dashboard/experiments", label: "Experiments", icon: <FlaskConical size={ICON_SIZE} /> },
    ],
  },
  {
    label: "Automation",
    icon: <Zap size={ICON_SIZE} />,
    items: [
      { href: "/dashboard/workflows", label: "Workflows", icon: <Workflow size={ICON_SIZE} /> },
      { href: "/dashboard/agents", label: "Agents", icon: <Bot size={ICON_SIZE} /> },
      { href: "/dashboard/bookings", label: "Bookings", icon: <CalendarCheck size={ICON_SIZE} /> },
      { href: "/dashboard/documents", label: "Documents", icon: <FileText size={ICON_SIZE} /> },
      { href: "/dashboard/creative", label: "Creative", icon: <Sparkles size={ICON_SIZE} /> },
      { href: "/dashboard/distribution", label: "Distribution", icon: <Share2 size={ICON_SIZE} /> },
    ],
  },
  {
    label: "Configuration",
    icon: <Settings size={ICON_SIZE} />,
    items: [
      { href: "/dashboard/providers", label: "Providers", icon: <Building2 size={ICON_SIZE} /> },
      { href: "/dashboard/credentials", label: "Credentials", icon: <KeyRound size={ICON_SIZE} /> },
      { href: "/dashboard/settings", label: "Settings", icon: <Settings size={ICON_SIZE} /> },
    ],
  },
  {
    label: "Business",
    icon: <Briefcase size={ICON_SIZE} />,
    items: [
      { href: "/dashboard/billing", label: "Billing", icon: <CreditCard size={ICON_SIZE} /> },
      { href: "/dashboard/marketplace", label: "Marketplace", icon: <Store size={ICON_SIZE} /> },
      { href: "/dashboard/tenants", label: "Tenants", icon: <UsersRound size={ICON_SIZE} /> },
      { href: "/dashboard/feedback", label: "Feedback", icon: <MessageSquare size={ICON_SIZE} /> },
      { href: "/dashboard/health", label: "Health", icon: <HeartPulse size={ICON_SIZE} /> },
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
            <span aria-hidden="true" style={{ display: "inline-flex" }}>{group.icon}</span>
            {group.label}
          </span>
          <span
            aria-hidden="true"
            style={{
              transform: isOpen ? "rotate(0deg)" : "rotate(-90deg)",
              transition: "transform 180ms ease",
              display: "inline-flex",
            }}
          >
            <ChevronDown size={12} />
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
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    width: isCollapsed ? "auto" : 18,
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

  // Focus management: traps focus in mobile drawer when open, restores focus
  // to hamburger button on close. Escape key dismisses the drawer.
  // NOTE: This focus trap covers Tab cycling and Escape dismiss. If the drawer
  // content grows significantly, consider a dedicated focus-trap library
  // (e.g., focus-trap-react) for more robust edge-case handling.
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
          <span aria-hidden="true" style={{ display: "inline-flex", transform: isCollapsed ? "scaleX(-1)" : "none" }}>
            <PanelLeft size={16} />
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
        <Menu size={20} />
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
          <X size={18} />
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
