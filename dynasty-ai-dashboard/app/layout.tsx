import type { Metadata } from "next"
import localFont from "next/font/local"
import "./globals.css"
import { AuthProvider } from "./providers"
import { AppShell } from "./app-shell"

const inter = localFont({
  src: [
    { path: "../public/fonts/Inter-Regular.woff2", weight: "400", style: "normal" },
    { path: "../public/fonts/Inter-Medium.woff2", weight: "500", style: "normal" },
    { path: "../public/fonts/Inter-SemiBold.woff2", weight: "600", style: "normal" },
    { path: "../public/fonts/Inter-Bold.woff2", weight: "700", style: "normal" },
  ],
  display: "swap",
  variable: "--font-inter",
  fallback: ["-apple-system", "BlinkMacSystemFont", "Segoe UI", "Roboto", "sans-serif"],
})

export const metadata: Metadata = {
  title: "Dynasty AI Dashboard",
  description: "Real-time monitoring and control of Dynasty AI infrastructure",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="font-sans">
        <AuthProvider>
          <AppShell>{children}</AppShell>
        </AuthProvider>
      </body>
    </html>
  )
}
