import type { Metadata } from "next"
export const metadata: Metadata = {
  title: "System Health — Lead OS Dashboard",
  description: "Integration status, API health checks, and system diagnostics.",
}
export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
