import type { Metadata } from "next"
export const metadata: Metadata = {
  title: "Scoring — CX React Dashboard",
  description: "Score distribution, calibration tools, and weight configuration.",
}
export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
