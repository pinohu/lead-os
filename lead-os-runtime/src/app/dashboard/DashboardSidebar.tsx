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
  Rocket,
  Gauge,
  PanelLeft,
  ChevronDown,
  Menu,
  X,
} from "lucide-react";
import { cn } from "@/lib/cn";

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
      { href: "/dashboard/control-plane", label: "Control plane", icon: <Gauge size={ICON_SIZE} /> },
      { href: "/dashboard/gtm", label: "GTM execution", icon: <Rocket size={ICON_SIZE} /> },
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

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function isActive(href: string, pathname: string): boolean {
  if (href === "/dashboard") return pathname === "/dashboard";
  return pathname === href || pathname.startsWith(href + "/");
}

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
      {/* Group header -- hidden when collapsed; groups merge into icon-only items */}
      {!isCollapsed && (
        <button
          type="button"
          onClick={() => setIsOpen((prev) => !prev)}
          aria-expanded={isOpen}
          className="flex items-center justify-between w-full px-3 py-1.5 bg-transparent border-none cursor-pointer text-muted-foreground text-[0.7rem] font-bold tracking-wider uppercase rounded-md"
        >
          <span className="flex items-center gap-1.5">
            <span aria-hidden="true" className="inline-flex">{group.icon}</span>
            {group.label}
          </span>
          <span
            aria-hidden="true"
            className={cn(
              "inline-flex transition-transform duration-150",
              !isOpen && "-rotate-90"
            )}
          >
            <ChevronDown size={12} />
          </span>
        </button>
      )}

      {/* Items */}
      <ul
        role="list"
        className={cn(
          "list-none p-0 m-0 overflow-hidden transition-[max-height] duration-200 ease-in-out",
          !isCollapsed && !isOpen ? "max-h-0" : "max-h-[9999px]"
        )}
      >
        {group.items.map((item) => {
          const active = isActive(item.href, pathname);
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                aria-current={active ? "page" : undefined}
                title={isCollapsed ? item.label : undefined}
                className={cn(
                  "flex items-center gap-2.5 rounded-lg no-underline text-sm transition-colors outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2",
                  isCollapsed ? "py-2.5 justify-center" : "px-3 py-2 justify-start",
                  active
                    ? "font-bold text-primary bg-primary/10"
                    : "font-medium text-foreground hover:bg-accent"
                )}
              >
                <span
                  aria-hidden="true"
                  className={cn(
                    "inline-flex items-center justify-center shrink-0",
                    active ? "text-primary" : "text-muted-foreground",
                    !isCollapsed && "w-[18px]"
                  )}
                >
                  {item.icon}
                </span>
                {!isCollapsed && (
                  <span className="whitespace-nowrap overflow-hidden text-ellipsis">
                    {item.label}
                  </span>
                )}
              </Link>
            </li>
          );
        })}
      </ul>
    </li>
  );
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

  const sidebarContent = (
    <>
      {/* Operator info */}
      <div
        className={cn(
          "border-b border-border flex flex-col gap-1",
          isCollapsed ? "py-4 items-center" : "p-3 items-start"
        )}
      >
        {!isCollapsed && (
          <span className="text-[0.7rem] font-bold tracking-wider uppercase text-muted-foreground">
            Operator
          </span>
        )}
        <div
          className="w-8 h-8 rounded-full bg-primary/10 border-2 border-primary flex items-center justify-center text-sm text-primary font-bold shrink-0"
          aria-hidden="true"
        >
          O
        </div>
        {!isCollapsed && (
          <a
            href="/auth/sign-out"
            className="text-xs text-muted-foreground no-underline mt-0.5 hover:text-primary transition-colors"
          >
            Sign out
          </a>
        )}
      </div>

      {/* Nav groups */}
      <nav aria-label="Dashboard navigation" className="flex-1 overflow-y-auto p-2 pt-2">
        <ul role="list" className="list-none p-0 m-0 flex flex-col gap-1">
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
      <div className="p-2 border-t border-border">
        <button
          type="button"
          onClick={toggleCollapse}
          aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          className={cn(
            "flex items-center gap-2 w-full px-3 py-2 bg-transparent border-none cursor-pointer rounded-lg text-muted-foreground text-xs font-medium hover:bg-accent transition-colors focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2",
            isCollapsed ? "justify-center" : "justify-start"
          )}
        >
          <span aria-hidden="true" className={cn("inline-flex", isCollapsed && "-scale-x-100")}>
            <PanelLeft size={16} />
          </span>
          {!isCollapsed && "Collapse"}
        </button>
      </div>
    </>
  );

  return (
    <>
      {/* Mobile hamburger -- visible only below md */}
      <button
        ref={hamburgerRef}
        type="button"
        onClick={() => setIsMobileOpen(true)}
        aria-label="Open navigation menu"
        aria-expanded={isMobileOpen}
        aria-controls="dashboard-sidebar-drawer"
        className="fixed top-3 left-3 z-50 flex md:hidden items-center justify-center w-11 h-11 rounded-lg bg-card border border-border cursor-pointer"
      >
        <Menu size={20} />
      </button>

      {/* Desktop sidebar -- hidden below md */}
      <aside
        aria-label="Dashboard sidebar"
        className={cn(
          "hidden md:flex flex-col shrink-0 sticky top-0 h-screen overflow-y-auto overflow-x-hidden bg-card border-r border-border transition-[width] duration-200 ease-in-out motion-reduce:transition-none",
          isCollapsed ? "w-[60px]" : "w-60"
        )}
      >
        {sidebarContent}
      </aside>

      {/* Mobile drawer overlay */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40 md:hidden"
          aria-hidden="true"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Mobile drawer */}
      <aside
        id="dashboard-sidebar-drawer"
        ref={drawerRef}
        aria-label="Dashboard navigation drawer"
        aria-modal="true"
        role="dialog"
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-60 bg-card border-r border-border flex flex-col overflow-y-auto overflow-x-hidden transition-transform duration-200 ease-in-out motion-reduce:transition-none md:hidden",
          isMobileOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {/* Close button */}
        <button
          type="button"
          onClick={() => setIsMobileOpen(false)}
          aria-label="Close navigation menu"
          className="self-end m-3 mb-0 p-1.5 bg-transparent border-none cursor-pointer text-muted-foreground rounded-md hover:bg-accent transition-colors focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
        >
          <X size={18} />
        </button>
        {sidebarContent}
      </aside>
    </>
  );
}
