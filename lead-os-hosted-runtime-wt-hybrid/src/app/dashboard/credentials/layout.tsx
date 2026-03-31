import type { Metadata } from "next"
export const metadata: Metadata = {
  title: "Credentials — Lead OS Dashboard",
  description: "Manage provider API keys, integration tokens, and credential vault.",
}
export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
