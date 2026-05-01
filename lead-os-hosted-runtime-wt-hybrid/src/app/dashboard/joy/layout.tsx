import type { Metadata } from "next"
export const metadata: Metadata = {
  title: "Joy — Lead OS Dashboard",
  description: "Team morale tracking, celebration milestones, and culture metrics.",
}
export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
