import type { Metadata } from "next"
export const metadata: Metadata = {
  title: "Radar — Lead OS Dashboard",
  description: "Real-time lead activity monitoring and live event stream.",
}
export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
