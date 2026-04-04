import type { Metadata } from "next"
export const metadata: Metadata = {
  title: "Billing — CX React Dashboard",
  description: "Subscription status, usage meters, invoice history, and plan management.",
}
export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
