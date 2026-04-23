import type { Metadata } from "next"
export const metadata: Metadata = {
  title: "Experiments — CX React Dashboard",
  description: "A/B test management, variant performance, and statistical significance.",
}
export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
