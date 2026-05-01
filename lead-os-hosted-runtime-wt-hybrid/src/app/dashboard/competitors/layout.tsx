import type { Metadata } from "next"
export const metadata: Metadata = {
  title: "Competitors — Lead OS Dashboard",
  description: "Competitive intelligence tracking and market position analysis.",
}
export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
