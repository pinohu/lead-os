"use client"

import { useSession, signOut } from "next-auth/react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Home, Activity, DollarSign, Brain, Settings, LogOut } from "lucide-react"

const NAV_ITEMS = [
  { href: "/", label: "Dashboard", icon: Home },
  { href: "/settings", label: "Settings", icon: Settings },
  { href: "/knowledge", label: "Knowledge Base", icon: Brain },
]

export function AppShell({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession()
  const pathname = usePathname()

  if (status !== "authenticated") return <>{children}</>
  if (pathname === "/auth/signin") return <>{children}</>

  return (
    <div className="flex h-screen bg-gray-950 text-white">
      <nav className="w-56 flex-shrink-0 border-r border-gray-800 flex flex-col" aria-label="Main navigation">
        <div className="p-5 border-b border-gray-800">
          <p className="text-lg font-bold text-white">Dynasty AI</p>
          <p className="text-xs text-gray-400">Mission Control</p>
        </div>

        <ul className="flex-1 py-3 space-y-0.5" role="list">
          {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
            const isActive = pathname === href
            return (
              <li key={href}>
                <Link
                  href={href}
                  aria-current={isActive ? "page" : undefined}
                  className={`flex items-center gap-3 px-5 py-2.5 text-sm transition-colors ${
                    isActive
                      ? "bg-gray-800 text-white font-medium"
                      : "text-gray-400 hover:text-white hover:bg-gray-900"
                  }`}
                >
                  <Icon className="w-4 h-4 flex-shrink-0" aria-hidden="true" />
                  {label}
                </Link>
              </li>
            )
          })}
        </ul>

        <div className="p-4 border-t border-gray-800">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 min-w-0">
              <span className="w-7 h-7 rounded-full bg-dynasty-purple text-white text-xs font-bold flex items-center justify-center flex-shrink-0">
                {session?.user?.email?.charAt(0).toUpperCase() ?? "?"}
              </span>
              <span className="text-sm text-gray-300 truncate">
                {session?.user?.name ?? "User"}
              </span>
            </div>
            <button
              onClick={() => signOut({ callbackUrl: "/auth/signin" })}
              className="text-gray-500 hover:text-white p-1 rounded transition-colors"
              aria-label="Sign out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </nav>

      <div className="flex-1 overflow-auto">
        {children}
      </div>
    </div>
  )
}
