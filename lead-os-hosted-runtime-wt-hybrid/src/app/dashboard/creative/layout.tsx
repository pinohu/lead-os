import type { Metadata } from "next"
export const metadata: Metadata = {
  title: "Creative — Lead OS Dashboard",
  description: "AI-powered social content generation, hooks, scripts, and asset management.",
}
export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
