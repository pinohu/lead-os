import type { Metadata } from "next"
import { Inter } from "next/font/google"
import Link from "next/link"
import "./globals.css"
import { cityConfig } from "@/lib/city-config"
import { niches } from "@/lib/niches"
import { ThemeProvider } from "@/components/theme-provider"
import { Separator } from "@/components/ui/separator"
import { SiteChrome } from "@/components/audience/site-chrome"
import { LocalSeoFooter } from "@/components/local-seo-footer"
import { CookieBanner } from "@/components/cookie-banner"
import { SiteAnalytics } from "@/components/site-analytics"
import { LiveChatEmbed } from "@/components/live-chat-embed"
import { EmergencyMobileCallBar } from "@/components/emergency-mobile-call-bar"
import { ConvertBoxEventTracker } from "@/components/convertbox-event-tracker"
import { ConvertBoxLoader } from "@/components/convertbox-loader"
import { ConvertBoxPageContext } from "@/components/convertbox-page-context"
import { TrackedPhoneLink } from "@/components/tracked-phone-link"
import {
  buildOrganizationJsonLd,
  buildOrganizationPostalAddress,
  organizationGoogleBusinessLinkLabel,
  organizationNap,
} from "@/lib/organization-nap"
import { homeOpenGraphImage } from "@/lib/seo-metadata"
const inter = Inter({ subsets: ["latin"], variable: "--font-inter" })

const pilotServiceLabels = (cityConfig.pilotCategories ?? niches.slice(0, 6).map((n) => n.slug))
  .map((slug) => niches.find((n) => n.slug === slug)?.label)
  .filter((label): label is string => Boolean(label))

export const metadata: Metadata = {
  metadataBase: new URL(`https://${cityConfig.domain}`),
  title: {
    default: `One Vetted ${cityConfig.name} Pro — Free Match in 4 Hours | ${cityConfig.domain}`,
    template: `%s | ${cityConfig.domain}`,
  },
  description: `Get matched with one vetted local pro in ${cityConfig.name}, ${cityConfig.stateCode}. No bidding wars. Erie County focused. Free for homeowners.`,
  openGraph: {
    type: "website",
    siteName: cityConfig.domain,
    locale: "en_US",
    title: `One Vetted ${cityConfig.name} Pro — Free Match | ${cityConfig.domain}`,
    description: `One vetted Erie County pro for plumbing, HVAC, cleaning, and more. Free matching. No spam calls.`,
    url: `https://${cityConfig.domain}`,
    images: [homeOpenGraphImage()],
  },
  twitter: {
    card: "summary_large_image",
    title: `One Vetted ${cityConfig.name} Pro — Free Match | ${cityConfig.domain}`,
    description: `One vetted Erie County pro. Free matching. No bidding wars.`,
    images: [homeOpenGraphImage().url],
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
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      buildOrganizationJsonLd(),
      {
        "@type": "LocalBusiness",
        "@id": `https://${cityConfig.domain}/#localbusiness`,
        name: organizationNap.name,
        url: `https://${cityConfig.domain}`,
        telephone: organizationNap.phone,
        address: buildOrganizationPostalAddress(),
        areaServed: cityConfig.serviceArea.map((area) => ({
          "@type": "City",
          name: area,
        })),
        serviceType: pilotServiceLabels,
      },
      {
        "@type": "WebSite",
        "@id": `https://${cityConfig.domain}/#website`,
        url: `https://${cityConfig.domain}`,
        name: `One Vetted ${cityConfig.name} Pro | ${cityConfig.domain}`,
        publisher: { "@id": `https://${cityConfig.domain}/#organization` },
        potentialAction: {
          "@type": "SearchAction",
          target: `https://${cityConfig.domain}/get-matched`,
          "query-input": "required name=search_term_string",
        },
      },
    ],
  }

  return (
    <html lang="en-US" className={inter.variable} suppressHydrationWarning>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className={`${inter.className} antialiased`}>
        <ConvertBoxLoader />
        <ConvertBoxPageContext />
        <ConvertBoxEventTracker />
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

          <SiteChrome>
            <div id="main-content" role="main">
              {children}
            </div>
          </SiteChrome>

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
                      <TrackedPhoneLink
                        phone="+18142000328"
                        className="hover:text-foreground transition-colors"
                        sourcePageType="site_footer"
                        routingModel="general"
                      >
                        (814) 200-0328
                      </TrackedPhoneLink>
                    </p>
                    <p>
                      <a href={`mailto:${organizationNap.email}`} className="hover:text-foreground transition-colors">
                        {organizationNap.email}
                      </a>
                    </p>
                    {organizationNap.googleBusinessUrl ? (
                      <p>
                        <a
                          href={organizationNap.googleBusinessUrl}
                          rel="noopener noreferrer"
                          target="_blank"
                          className="hover:text-foreground transition-colors"
                        >
                          {organizationGoogleBusinessLinkLabel()}
                        </a>
                      </p>
                    ) : null}
                  </div>
                  <nav aria-label="Company links" className="mt-4 space-y-2">
                    <Link
                      href="/about"
                      className="block text-sm text-muted-foreground transition-colors hover:text-foreground"
                    >
                      About Erie.pro
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

                {/* Column 2: Services */}
                <div>
                  <h4 className="mb-3 text-sm font-semibold">Find Local Help</h4>
                  <nav aria-label="Service links" className="space-y-2">
                    <Link
                      href="/get-matched"
                      className="block text-sm font-medium text-primary transition-colors hover:text-primary/80"
                    >
                      Get Matched Free
                    </Link>
                    <Link
                      href="/services"
                      className="block text-sm text-muted-foreground transition-colors hover:text-foreground"
                    >
                      Browse Services
                    </Link>
                    <Link
                      href="/directory"
                      className="block text-sm text-muted-foreground transition-colors hover:text-foreground"
                    >
                      Erie Service Directory
                    </Link>
                    <Link
                      href="/emergency"
                      className="block text-sm text-muted-foreground transition-colors hover:text-foreground"
                    >
                      Emergency Services
                    </Link>
                    <Link
                      href="/pricing"
                      className="block text-sm text-muted-foreground transition-colors hover:text-foreground"
                    >
                      Pricing Guides
                    </Link>
                    <Link
                      href="/areas"
                      className="block text-sm text-muted-foreground transition-colors hover:text-foreground"
                    >
                      Areas Served
                    </Link>
                  </nav>
                </div>

                {/* Column 3: Top Services */}
                <div>
                  <h4 className="mb-3 text-sm font-semibold">Top Services</h4>
                  <nav aria-label="Top service links" className="space-y-2">
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
                  </nav>
                </div>

                {/* Column 4: For Pros */}
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
          <EmergencyMobileCallBar />
          <SiteAnalytics />
          <LiveChatEmbed />
        </ThemeProvider>
      </body>
    </html>
  )
}
