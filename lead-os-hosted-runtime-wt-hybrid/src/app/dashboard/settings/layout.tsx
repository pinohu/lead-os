import type { Metadata } from "next"
export const metadata: Metadata = {
  title: "Settings — CX React Dashboard",
  description: "Tenant configuration, branding, and platform preferences.",
}
export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
