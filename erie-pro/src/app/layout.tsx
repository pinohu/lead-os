import type { Metadata } from "next"
import { Inter } from "next/font/google"
import Link from "next/link"
import "./globals.css"
import { cityConfig } from "@/lib/city-config"
import { niches } from "@/lib/niches"
import { ThemeProvider } from "@/components/theme-provider"
import { ThemeToggle } from "@/components/theme-toggle"
import { MobileNav } from "@/components/mobile-nav"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { LocalSeoFooter } from "@/components/local-seo-footer"
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from "@/components/ui/navigation-menu"

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
  /* Top 6 niches for the dropdown */
  const topNiches = niches.slice(0, 6)
  const moreNiches = niches.slice(6)

  return (
    <html lang="en" className={inter.variable} suppressHydrationWarning>
      <body className={`${inter.className} antialiased`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          {/* ── Skip to content (accessibility) ──────────────── */}
          <a
            href="#main-content"
            className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-md focus:bg-primary focus:px-4 focus:py-2 focus:text-primary-foreground focus:outline-none"
          >
            Skip to main content
          </a>

          {/* ── Header ───────────────────────────────────────── */}
          <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <nav
              role="navigation"
              aria-label="Main navigation"
              className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6"
            >
              <Link href="/" className="flex items-center gap-2">
                <span className="text-lg font-bold tracking-tight">
                  {cityConfig.domain}
                </span>
              </Link>

              {/* ── Desktop nav ─────────────────────────────── */}
              <div className="hidden items-center gap-1 md:flex">
                <NavigationMenu>
                  <NavigationMenuList>
                    <NavigationMenuItem>
                      <NavigationMenuTrigger className="h-9 text-sm">
                        Services
                      </NavigationMenuTrigger>
                      <NavigationMenuContent>
                        <div className="grid w-[480px] gap-1 p-4 md:grid-cols-2">
                          {topNiches.map((n) => (
                            <NavigationMenuLink key={n.slug} asChild>
                              <Link
                                href={`/${n.slug}`}
                                className="flex items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors hover:bg-accent hover:text-accent-foreground"
                              >
                                <span>{n.icon}</span>
                                <div>
                                  <div className="font-medium">{n.label}</div>
                                  <p className="line-clamp-1 text-xs text-muted-foreground">
                                    {n.description}
                                  </p>
                                </div>
                              </Link>
                            </NavigationMenuLink>
                          ))}
                          {moreNiches.length > 0 && (
                            <>
                              <Separator className="col-span-2 my-1" />
                              {moreNiches.map((n) => (
                                <NavigationMenuLink key={n.slug} asChild>
                                  <Link
                                    href={`/${n.slug}`}
                                    className="flex items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors hover:bg-accent hover:text-accent-foreground"
                                  >
                                    <span>{n.icon}</span>
                                    <span>{n.label}</span>
                                  </Link>
                                </NavigationMenuLink>
                              ))}
                            </>
                          )}
                          <Separator className="col-span-2 my-1" />
                          <NavigationMenuLink asChild>
                            <Link
                              href="/services"
                              className="col-span-2 rounded-md px-3 py-2 text-center text-sm font-medium text-primary transition-colors hover:bg-accent"
                            >
                              View All Services
                            </Link>
                          </NavigationMenuLink>
                        </div>
                      </NavigationMenuContent>
                    </NavigationMenuItem>

                    <NavigationMenuItem>
                      <NavigationMenuLink asChild>
                        <Link
                          href="/areas"
                          className="inline-flex h-9 items-center justify-center rounded-md px-3 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground"
                        >
                          Areas
                        </Link>
                      </NavigationMenuLink>
                    </NavigationMenuItem>

                    <NavigationMenuItem>
                      <NavigationMenuLink asChild>
                        <Link
                          href="/about"
                          className="inline-flex h-9 items-center justify-center rounded-md px-3 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground"
                        >
                          About
                        </Link>
                      </NavigationMenuLink>
                    </NavigationMenuItem>
                  </NavigationMenuList>
                </NavigationMenu>

                {/* Subtle "For Businesses" link */}
                <Link
                  href="/for-business"
                  className="ml-1 inline-flex h-9 items-center px-3 text-xs text-muted-foreground transition-colors hover:text-foreground"
                >
                  For Businesses
                </Link>

                <ThemeToggle />

                <Button asChild size="sm" className="ml-2">
                  <Link href="/#services">Get a Free Quote</Link>
                </Button>
              </div>

              {/* ── Mobile nav ──────────────────────────────── */}
              <div className="flex items-center gap-2 md:hidden">
                <ThemeToggle />
                <MobileNav />
              </div>
            </nav>
          </header>

          {/* ── Main content ─────────────────────────────────── */}
          <div id="main-content" role="main">
            {children}
          </div>

          {/* ── Local SEO Footer ────────────────────────────── */}
          <LocalSeoFooter />

          {/* ── Footer ───────────────────────────────────────── */}
          <footer role="contentinfo" className="border-t bg-muted/40">
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
                    {niches.slice(0, 6).map((n) => (
                      <Link
                        key={n.slug}
                        href={`/${n.slug}`}
                        className="block text-sm text-muted-foreground transition-colors hover:text-foreground"
                      >
                        {n.icon} {n.label}
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

                {/* Links */}
                <div>
                  <h4 className="mb-3 text-sm font-semibold">Company</h4>
                  <div className="space-y-2">
                    <Link
                      href="/about"
                      className="block text-sm text-muted-foreground transition-colors hover:text-foreground"
                    >
                      About
                    </Link>
                    <Link
                      href="/contact"
                      className="block text-sm text-muted-foreground transition-colors hover:text-foreground"
                    >
                      Contact
                    </Link>
                    <Link
                      href="/for-business"
                      className="block text-sm text-muted-foreground transition-colors hover:text-foreground"
                    >
                      For Businesses
                    </Link>
                    <Link
                      href="/privacy"
                      className="block text-sm text-muted-foreground transition-colors hover:text-foreground"
                    >
                      Privacy Policy
                    </Link>
                    <Link
                      href="/terms"
                      className="block text-sm text-muted-foreground transition-colors hover:text-foreground"
                    >
                      Terms of Service
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
        </ThemeProvider>
      </body>
    </html>
  )
}
