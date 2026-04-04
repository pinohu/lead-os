import type { Metadata } from "next"
export const metadata: Metadata = {
  title: "Leads — CX React Dashboard",
  description: "Lead profiles, scoring history, full activity timeline, and CRM sync.",
}
export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
