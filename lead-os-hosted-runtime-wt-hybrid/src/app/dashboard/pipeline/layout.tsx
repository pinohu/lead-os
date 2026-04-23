import type { Metadata } from "next"
export const metadata: Metadata = {
  title: "Pipeline — CX React Dashboard",
  description: "Sales pipeline visualization, stage movement, and deal tracking.",
}
export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
