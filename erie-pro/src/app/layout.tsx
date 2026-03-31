import type { Metadata } from "next"
import { Inter } from "next/font/google"
import Link from "next/link"
import "./globals.css"
import { cityConfig } from "@/lib/city-config"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" })

export const metadata: Metadata = {
  title: {
    default: `Find Local Services in ${cityConfig.name}, ${cityConfig.stateCode} | ${cityConfig.domain}`,
    template: `%s | ${cityConfig.domain}`,
  },
  description: `Find the best local service providers in ${cityConfig.name}, ${cityConfig.state}. Verified businesses, free quotes, no obligation. Serving ${cityConfig.serviceArea.slice(0, 5).join(", ")} and surrounding areas.`,
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={inter.variable}>
      <body className={`${inter.className} antialiased`}>
        {/* ── Header ─────────────────────────────────────────── */}
        <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <nav className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
            <Link href="/" className="flex items-center gap-2">
              <span className="text-lg font-bold tracking-tight">
                {cityConfig.domain}
              </span>
            </Link>

            <div className="hidden items-center gap-6 text-sm md:flex">
              <Link
                href="/#services"
                className="text-muted-foreground transition-colors hover:text-foreground"
              >
                Services
              </Link>
              <Link
                href="/#how-it-works"
                className="text-muted-foreground transition-colors hover:text-foreground"
              >
                How It Works
              </Link>
              <Link
                href="/for-business"
                className="text-muted-foreground transition-colors hover:text-foreground"
              >
                For Businesses
              </Link>
              <Button asChild size="sm">
                <Link href="/#services">Get a Free Quote</Link>
              </Button>
            </div>
          </nav>
        </header>

        {children}

        {/* ── Footer ─────────────────────────────────────────── */}
        <footer className="border-t bg-muted/40">
          <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
            <div className="grid gap-8 md:grid-cols-4">
              {/* Brand */}
              <div>
                <div className="mb-2 text-lg font-bold">
                  {cityConfig.domain}
                </div>
                <p className="text-sm text-muted-foreground">
                  Find verified local service providers in{" "}
                  {cityConfig.name}, {cityConfig.stateCode}. Free quotes,
                  no obligation.
                </p>
              </div>

              {/* Popular Services */}
              <div>
                <h4 className="mb-3 text-sm font-semibold">
                  Popular Services
                </h4>
                <div className="space-y-2">
                  {[
                    "plumbing",
                    "hvac",
                    "electrical",
                    "roofing",
                    "dental",
                    "legal",
                  ].map((s) => (
                    <Link
                      key={s}
                      href={`/${s}`}
                      className="block text-sm capitalize text-muted-foreground transition-colors hover:text-foreground"
                    >
                      {s.replace("-", " ")}
                    </Link>
                  ))}
                </div>
              </div>

              {/* Service Areas */}
              <div>
                <h4 className="mb-3 text-sm font-semibold">Service Areas</h4>
                <div className="space-y-2">
                  {cityConfig.serviceArea.slice(0, 6).map((area) => (
                    <span
                      key={area}
                      className="block text-sm text-muted-foreground"
                    >
                      {area}
                    </span>
                  ))}
                </div>
              </div>

              {/* For Businesses */}
              <div>
                <h4 className="mb-3 text-sm font-semibold">For Businesses</h4>
                <div className="space-y-2">
                  <Link
                    href="/for-business"
                    className="block text-sm text-muted-foreground transition-colors hover:text-foreground"
                  >
                    Claim Your Territory
                  </Link>
                  <Link
                    href="/for-business#pricing"
                    className="block text-sm text-muted-foreground transition-colors hover:text-foreground"
                  >
                    Pricing
                  </Link>
                  <Link
                    href="/for-business#how-it-works"
                    className="block text-sm text-muted-foreground transition-colors hover:text-foreground"
                  >
                    How It Works
                  </Link>
                </div>
              </div>
            </div>

            <Separator className="my-8" />

            <div className="text-center text-xs text-muted-foreground">
              &copy; {new Date().getFullYear()} {cityConfig.domain}. All
              rights reserved. Powered by Lead OS.
            </div>
          </div>
        </footer>
      </body>
    </html>
  )
}
