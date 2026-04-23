import type { Metadata } from "next"
export const metadata: Metadata = {
  title: "Documents — CX React Dashboard",
  description: "Contract and proposal generation, templates, and document management.",
}
export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
