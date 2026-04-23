import type { Metadata } from "next"
export const metadata: Metadata = {
  title: "System Health — CX React Dashboard",
  description: "Integration status, API health checks, and system diagnostics.",
}
export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
