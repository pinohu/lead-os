// ── Provider Dashboard Layout ─────────────────────────────────────────
// Wraps all /dashboard/* pages with sidebar nav + auth guard.

import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { cityConfig } from "@/lib/city-config";
import Link from "next/link";

export const metadata: Metadata = {
  title: `Dashboard | ${cityConfig.name} Provider Portal`,
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

const navItems = [
  { href: "/dashboard", label: "Overview", icon: "📊" },
  { href: "/dashboard/profile", label: "Profile", icon: "👤" },
  { href: "/dashboard/leads", label: "Leads", icon: "📋" },
  { href: "/dashboard/disputes", label: "Disputes", icon: "⚖️" },
  { href: "/dashboard/settings", label: "Settings", icon: "⚙️" },
];

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session?.user) {
    redirect("/login?callbackUrl=/dashboard");
  }

  return (
    <div className="flex min-h-screen bg-background">
      {/* ── Sidebar ─────────────────────────────────────────────── */}
      <aside className="hidden w-64 shrink-0 border-r border-border bg-card md:block">
        <div className="flex h-16 items-center border-b border-border px-6">
          <Link
            href="/"
            className="text-lg font-bold text-foreground"
          >
            {cityConfig.domain}
          </Link>
        </div>

        <nav className="mt-4 space-y-1 px-3">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
            >
              <span aria-hidden="true">{item.icon}</span>
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="absolute bottom-0 w-64 border-t border-border p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
              {session.user.name?.[0]?.toUpperCase() ?? session.user.email?.[0]?.toUpperCase() ?? "P"}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-foreground">
                {session.user.name ?? "Provider"}
              </p>
              <p className="truncate text-xs text-muted-foreground">
                {session.user.email}
              </p>
            </div>
          </div>
        </div>
      </aside>

      {/* ── Mobile header ───────────────────────────────────────── */}
      <div className="flex flex-1 flex-col">
        <header className="flex h-16 items-center justify-between border-b border-border bg-card px-4 md:hidden">
          <Link
            href="/"
            className="text-lg font-bold text-foreground"
          >
            {cityConfig.domain}
          </Link>
          <nav className="flex gap-2">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="rounded-md px-2 py-1 text-xs font-medium text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                title={item.label}
              >
                <span aria-hidden="true">{item.icon}</span>
                <span className="sr-only">{item.label}</span>
              </Link>
            ))}
          </nav>
        </header>

        {/* ── Main content ────────────────────────────────────── */}
        <main className="flex-1 p-4 md:p-8">{children}</main>
      </div>
    </div>
  );
}
