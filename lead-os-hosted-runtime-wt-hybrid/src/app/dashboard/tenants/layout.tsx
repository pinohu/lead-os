import type { Metadata } from "next"
export const metadata: Metadata = {
  title: "Tenants — CX React Dashboard",
  description: "Multi-tenant management, provisioning, and super-admin controls.",
}
export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
