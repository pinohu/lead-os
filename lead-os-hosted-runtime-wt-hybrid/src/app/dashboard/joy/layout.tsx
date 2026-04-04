import type { Metadata } from "next"
export const metadata: Metadata = {
  title: "Joy — CX React Dashboard",
  description: "Team morale tracking, celebration milestones, and culture metrics.",
}
export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
