import type { Metadata } from "next"
export const metadata: Metadata = {
  title: "Analytics — CX React Dashboard",
  description: "Funnel progression, channel performance, and lead scoring distributions.",
}
export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
