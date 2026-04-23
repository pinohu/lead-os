import type { Metadata } from "next"
export const metadata: Metadata = {
  title: "Credentials — CX React Dashboard",
  description: "Manage provider API keys, integration tokens, and credential vault.",
}
export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
