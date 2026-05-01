import type { Metadata } from "next"
export const metadata: Metadata = {
  title: "AI Agents — Lead OS Dashboard",
  description: "Manage AI agent teams, view audit logs, and schedule automated agent tasks.",
}
export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
