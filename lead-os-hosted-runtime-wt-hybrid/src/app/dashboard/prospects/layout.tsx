import type { Metadata } from "next"
export const metadata: Metadata = {
  title: "Prospects — Lead OS Dashboard",
  description: "Prospect discovery, outreach pipeline, and qualification status.",
}
export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
