import type { Metadata } from "next"
export const metadata: Metadata = {
  title: "Marketing Ingestion — CX React Dashboard",
  description: "Marketing artifact analysis, competitive intelligence, and content insights.",
}
export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
