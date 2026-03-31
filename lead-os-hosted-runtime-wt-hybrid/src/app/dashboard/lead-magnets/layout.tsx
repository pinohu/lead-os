import type { Metadata } from "next"
export const metadata: Metadata = {
  title: "Lead Magnets — Lead OS Dashboard",
  description: "Content offer management, conversion rates, and opt-in performance.",
}
export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
