import type { Metadata } from "next"
export const metadata: Metadata = {
  title: "Bookings — Lead OS Dashboard",
  description: "Appointment management, calendar view, and booking pipeline.",
}
export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
