import type { Metadata } from "next"
export const metadata: Metadata = {
  title: "Feedback — Lead OS Dashboard",
  description: "Customer feedback collection, NPS scores, and sentiment analysis.",
}
export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
