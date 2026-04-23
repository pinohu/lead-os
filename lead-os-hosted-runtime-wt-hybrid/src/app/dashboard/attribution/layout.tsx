import type { Metadata } from "next"
export const metadata: Metadata = {
  title: "Attribution — CX React Dashboard",
  description: "Multi-touch attribution reports showing which channels drive conversions.",
}
export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
