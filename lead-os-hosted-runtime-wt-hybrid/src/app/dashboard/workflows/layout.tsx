import type { Metadata } from "next"
export const metadata: Metadata = {
  title: "Workflows — Lead OS Dashboard",
  description: "Automation workflow management, triggers, and execution history.",
}
export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
