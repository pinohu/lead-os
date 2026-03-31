import type { Metadata } from "next"
export const metadata: Metadata = {
  title: "Attribution — Lead OS Dashboard",
  description: "Multi-touch attribution reports showing which channels drive conversions.",
}
export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
