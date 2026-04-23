import type { Metadata } from "next"
export const metadata: Metadata = {
  title: "Marketplace — CX React Dashboard",
  description: "Lead marketplace management, buyer activity, and revenue by temperature.",
}
export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
