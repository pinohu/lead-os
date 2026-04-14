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
import { CookieBanner } from "@/components/cookie-banner"
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
  metadataBase: new URL(`https://${cityConfig.domain}`),
  title: {
    default: `Find Local Services in ${cityConfig.name}, ${cityConfig.stateCode} | ${cityConfig.domain}`,
    template: `%s | ${cityConfig.domain}`,
  },
  description: `Find the best local service providers in ${cityConfig.name}, ${cityConfig.state}. Verified businesses, free quotes, no obligation. Serving ${cityConfig.serviceArea.slice(0, 5).join(", ")} and surrounding areas.`,
  openGraph: {
    type: "website",
    siteName: cityConfig.domain,
    locale: "en_US",
    title: `Find Local Services in ${cityConfig.name}, ${cityConfig.stateCode} | ${cityConfig.domain}`,
    description: `Find the best local service providers in ${cityConfig.name}, ${cityConfig.state}. Verified businesses, free quotes, no obligation.`,
    url: `https://${cityConfig.domain}`,
  },
  twitter: {
    card: "summary_large_image",
    title: `Find Local Services in ${cityConfig.name}, ${cityConfig.stateCode} | ${cityConfig.domain}`,
    description: `Find the best local service providers in ${cityConfig.name}, ${cityConfig.state}. Verified businesses, free quotes, no obligation.`,
  },
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "32x32" },
      { url: "/icon.svg", type: "image/svg+xml" },
    ],
    apple: "/apple-touch-icon.png",
  },
  manifest: "/manifest.json",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  /* Top 6 niches for the dropdown */
  const topNiches = niches.slice(0, 6)
  const moreNiches = niches.slice(6)

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "LocalBusiness",
        "@id": `https://${cityConfig.domain}/#organization`,
        name: cityConfig.domain,
        url: `https://${cityConfig.domain}`,
        description: `Find the best local service providers in ${cityConfig.name}, ${cityConfig.state}. Verified businesses, free quotes, no obligation.`,
        address: {
          "@type": "PostalAddress",
          addressLocality: cityConfig.name,
          addressRegion: cityConfig.stateCode,
          addressCountry: "US",
        },
        areaServed: cityConfig.serviceArea.map((area) => ({
          "@type": "City",
          name: area,
        })),
        serviceType: niches.map((n) => n.label),
      },
      {
        "@type": "WebSite",
        "@id": `https://${cityConfig.domain}/#website`,
        url: `https://${cityConfig.domain}`,
        name: `Find Local Services in ${cityConfig.name} | ${cityConfig.domain}`,
        publisher: { "@id": `https://${cityConfig.domain}/#organization` },
      },
    ],
  }

  return (
    <html lang="en" className={inter.variable} suppressHydrationWarning>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
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
                          href="/directory"
                          className="inline-flex h-9 items-center justify-center rounded-md px-3 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground"
                        >
                          Directory
                        </Link>
                      </NavigationMenuLink>
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

                {/* Provider CTA — routes to the /pros landing page */}
                <Link
                  href="/pros"
                  className="ml-1 inline-flex h-9 items-center px-3 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
                >
                  For Pros
                </Link>

                <ThemeToggle />

                <Button asChild size="sm" className="ml-2">
                  <Link href="/#get-matched">Get Matched Free</Link>
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
              <div className="grid gap-8 sm:grid-cols-2 md:grid-cols-4">
                {/* Column 1: Brand */}
                <div>
                  <div className="mb-2 text-lg font-bold">
                    {cityConfig.domain}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Erie&apos;s trusted local services directory
                  </p>
                  <div className="mt-4 space-y-1.5 text-sm text-muted-foreground">
                    <p>
                      <a href="tel:+18142000328" className="hover:text-foreground transition-colors">
                        (814) 200-0328
                      </a>
                    </p>
                    <p>
                      <a href={`mailto:hello@${cityConfig.domain}`} className="hover:text-foreground transition-colors">
                        hello@{cityConfig.domain}
                      </a>
                    </p>
                  </div>
                </div>

                {/* Column 2: Services */}
                <div>
                  <h4 className="mb-3 text-sm font-semibold">Services</h4>
                  <nav aria-label="Service links" className="space-y-2">
                    {["plumbing", "hvac", "roofing", "electrical", "landscaping", "cleaning"].map((slug) => {
                      const niche = niches.find((n) => n.slug === slug)
                      return niche ? (
                        <Link
                          key={slug}
                          href={`/${slug}`}
                          className="block text-sm text-muted-foreground transition-colors hover:text-foreground"
                        >
                          {niche.icon} {niche.label}
                        </Link>
                      ) : null
                    })}
                    <Link
                      href="/services"
                      className="block text-sm font-medium text-primary transition-colors hover:text-primary/80"
                    >
                      View all {niches.length} services &rarr;
                    </Link>
                  </nav>
                </div>

                {/* Column 3: For Pros */}
                <div>
                  <h4 className="mb-3 text-sm font-semibold">For Pros</h4>
                  <nav aria-label="Pro links" className="space-y-2">
                    <Link
                      href="/pros"
                      className="block text-sm text-muted-foreground transition-colors hover:text-foreground"
                    >
                      Become a Pro
                    </Link>
                    <Link
                      href="/for-business/claim"
                      className="block text-sm text-muted-foreground transition-colors hover:text-foreground"
                    >
                      Claim Your Territory
                    </Link>
                    <Link
                      href="/dashboard"
                      className="block text-sm text-muted-foreground transition-colors hover:text-foreground"
                    >
                      Provider Dashboard
                    </Link>
                    <Link
                      href="/for-business"
                      className="block text-sm text-muted-foreground transition-colors hover:text-foreground"
                    >
                      Pricing &amp; Tiers
                    </Link>
                  </nav>
                </div>

                {/* Column 4: Company */}
                <div>
                  <h4 className="mb-3 text-sm font-semibold">Company</h4>
                  <nav aria-label="Company links" className="space-y-2">
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
                  </nav>
                </div>
              </div>

              <Separator className="my-8" />

              <div className="text-center text-xs text-muted-foreground space-y-1">
                <p>
                  &copy; {new Date().getFullYear()} {cityConfig.domain}. All
                  rights reserved. Powered by Lead OS.
                </p>
                <p>
                  Serving Erie, Millcreek, Harborcreek, and the greater Erie County area
                </p>
              </div>
            </div>
          </footer>

          {/* ── Cookie Consent Banner ─────────────────────────── */}
          <CookieBanner />
        </ThemeProvider>
      </body>
    </html>
  )
}
