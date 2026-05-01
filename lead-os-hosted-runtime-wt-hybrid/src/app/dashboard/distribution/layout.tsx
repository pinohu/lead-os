import type { Metadata } from "next"
export const metadata: Metadata = {
  title: "Distribution — Lead OS Dashboard",
  description: "Lead routing rules, assignment logic, and distribution analytics.",
}
export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
