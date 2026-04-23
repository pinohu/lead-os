import type { Metadata } from "next"
export const metadata: Metadata = {
  title: "Revenue — CX React Dashboard",
  description: "Revenue tracking, forecasting, and monetization analytics.",
}
export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
