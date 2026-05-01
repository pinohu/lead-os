import type { Metadata } from "next"
export const metadata: Metadata = {
  title: "Pipeline — Lead OS Dashboard",
  description: "Sales pipeline visualization, stage movement, and deal tracking.",
}
export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
