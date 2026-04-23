import type { Metadata } from "next"
export const metadata: Metadata = {
  title: "Lead Magnets — CX React Dashboard",
  description: "Content offer management, conversion rates, and opt-in performance.",
}
export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
