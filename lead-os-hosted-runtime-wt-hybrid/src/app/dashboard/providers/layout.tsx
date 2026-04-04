import type { Metadata } from "next"
export const metadata: Metadata = {
  title: "Providers — CX React Dashboard",
  description: "Integration status, configuration, and provider health monitoring.",
}
export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
