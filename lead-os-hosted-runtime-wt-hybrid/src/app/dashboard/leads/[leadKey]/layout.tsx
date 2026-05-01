import type { Metadata } from "next"
export async function generateMetadata(): Promise<Metadata> {
  return {
    title: "Lead Profile — Lead OS Dashboard",
    description: "Full lead profile with scoring history, activity timeline, and CRM sync.",
  }
}
export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
