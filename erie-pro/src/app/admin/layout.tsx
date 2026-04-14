// ── Admin Dashboard Layout ──────────────────────────────────────────
// Wraps all /admin/* pages with sidebar nav + admin access guard.
// Provides persistent navigation, alert banners, and header.

import type { Metadata } from "next"
import { redirect } from "next/navigation"
import { auth } from "@/lib/auth"
import { cityConfig } from "@/lib/city-config"
import { prisma } from "@/lib/db"
import Link from "next/link"

export const metadata: Metadata = {
  title: `Admin | ${cityConfig.domain}`,
  robots: { index: false, follow: false },
}

export const dynamic = "force-dynamic"

type BadgeKey = "claims" | "disputes" | "messages" | "concierge"

interface NavItem {
  href: string
  label: string
  icon: string
  badgeKey?: BadgeKey
}

interface NavSection {
  label: string
  items: NavItem[]
}

const navSections: NavSection[] = [
  {
    label: "Operations",
    items: [
      { href: "/admin", label: "Dashboard", icon: "📊" },
      { href: "/admin/leads", label: "Leads", icon: "📋" },
      { href: "/admin/providers", label: "Providers", icon: "👥" },
      { href: "/admin/territories", label: "Territories", icon: "📍" },
      { href: "/admin/listings", label: "Listings", icon: "🏢" },
      { href: "/admin/claims", label: "Claims", icon: "🛡️", badgeKey: "claims" as const },
      { href: "/admin/disputes", label: "Disputes", icon: "⚖️", badgeKey: "disputes" as const },
      { href: "/admin/messages", label: "Messages", icon: "💬", badgeKey: "messages" as const },
      { href: "/admin/failovers", label: "Failover Log", icon: "🔁" },
    ],
  },
  {
    label: "Business",
    items: [
      { href: "/admin/revenue", label: "Revenue", icon: "💰" },
      { href: "/admin/founding", label: "Founding Offer", icon: "🔒" },
      { href: "/admin/concierge", label: "Concierge Inbox", icon: "🛎️", badgeKey: "concierge" as const },
      { href: "/admin/calls", label: "Call Tracking", icon: "📞" },
    ],
  },
  {
    label: "System",
    items: [
      { href: "/admin/audit-log", label: "Audit Log", icon: "📜" },
      { href: "/admin/flags", label: "Feature Flags", icon: "🚩" },
      { href: "/admin/cities", label: "Cities", icon: "🌐" },
    ],
  },
]

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const adminKey = process.env.ADMIN_ACCESS_KEY
  if (!adminKey) {
    redirect("/for-business")
  }

  // Verify user is authenticated and has admin role
  const session = await auth()
  if (!session?.user) {
    redirect("/login?callbackUrl=/admin")
  }

  const userRole = (session.user as { role?: string }).role
  if (userRole !== "admin") {
    // Non-admin users see a forbidden message
    redirect("/dashboard")
  }

  // Fetch badge counts for sidebar
  const [pendingClaims, pendingDisputes, unreadMessages, openConcierge] = await Promise.all([
    prisma.provider.count({ where: { verificationStatus: { in: ["unverified", "pending"] } } }),
    prisma.leadDispute.count({ where: { status: "pending" } }),
    prisma.contactMessage.count({ where: { status: "unread" } }),
    prisma.checkoutSession.count({
      where: {
        sessionType: "concierge_job",
        status: "completed",
        fulfilledAt: null,
      },
    }),
  ])

  const badges: Record<string, number> = {
    claims: pendingClaims,
    disputes: pendingDisputes,
    messages: unreadMessages,
    concierge: openConcierge,
  }

  return (
    <div className="flex min-h-screen bg-gray-50 dark:bg-gray-950">
      {/* ── Sidebar ─────────────────────────────────────────────── */}
      <aside className="hidden w-64 shrink-0 border-r border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 md:flex md:flex-col">
        {/* Logo / Header */}
        <div className="flex h-14 items-center border-b border-gray-200 dark:border-gray-800 px-5">
          <Link href="/admin" className="flex items-center gap-2">
            <span className="text-lg font-bold text-gray-900 dark:text-white">
              {cityConfig.domain}
            </span>
            <span className="rounded bg-red-100 dark:bg-red-900/30 px-1.5 py-0.5 text-[10px] font-semibold uppercase text-red-700 dark:text-red-400">
              Admin
            </span>
          </Link>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-4">
          {navSections.map((section) => (
            <div key={section.label} className="mb-6">
              <p className="mb-2 px-5 text-[11px] font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">
                {section.label}
              </p>
              <div className="space-y-0.5 px-3">
                {section.items.map((item) => {
                  const badgeCount = "badgeKey" in item && item.badgeKey ? badges[item.badgeKey] ?? 0 : 0
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className="flex items-center justify-between rounded-md px-3 py-2 text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white transition-colors"
                    >
                      <span className="flex items-center gap-3">
                        <span className="text-base" aria-hidden="true">{item.icon}</span>
                        {item.label}
                      </span>
                      {badgeCount > 0 && (
                        <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-red-100 dark:bg-red-900/40 px-1.5 text-[11px] font-bold text-red-700 dark:text-red-400">
                          {badgeCount}
                        </span>
                      )}
                    </Link>
                  )
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* Footer */}
        <div className="border-t border-gray-200 dark:border-gray-800 p-4">
          <Link
            href="/"
            className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
          >
            <span aria-hidden="true">&larr;</span>
            Back to site
          </Link>
        </div>
      </aside>

      {/* ── Mobile header ───────────────────────────────────────── */}
      <div className="flex flex-1 flex-col min-w-0">
        <header className="flex h-14 items-center justify-between border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 px-4 md:hidden">
          <Link href="/admin" className="flex items-center gap-2">
            <span className="text-base font-bold text-gray-900 dark:text-white">
              {cityConfig.domain}
            </span>
            <span className="rounded bg-red-100 dark:bg-red-900/30 px-1.5 py-0.5 text-[10px] font-semibold uppercase text-red-700 dark:text-red-400">
              Admin
            </span>
          </Link>
          <nav className="flex items-center gap-1">
            {navSections.flatMap((s) => s.items).slice(0, 6).map((item) => {
              const badgeCount = "badgeKey" in item && item.badgeKey ? badges[item.badgeKey] ?? 0 : 0
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className="relative rounded-md px-2 py-1 text-base hover:bg-gray-100 dark:hover:bg-gray-800"
                  title={item.label}
                >
                  <span aria-hidden="true">{item.icon}</span>
                  <span className="sr-only">{item.label}</span>
                  {badgeCount > 0 && (
                    <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-red-500 px-1 text-[9px] font-bold text-white">
                      {badgeCount}
                    </span>
                  )}
                </Link>
              )
            })}
          </nav>
        </header>

        {/* ── Main content ────────────────────────────────────── */}
        <main className="flex-1 overflow-y-auto p-4 md:p-8">{children}</main>
      </div>
    </div>
  )
}
