import type { Metadata } from "next";
import Link from "next/link";
import Script from "next/script";
import { Inter } from "next/font/google";
import "@/app/globals.css";
import { tenantConfig } from "@/lib/tenant";
import { embeddedSecrets } from "@/lib/embedded-secrets";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/sonner";
import { SiteHeader } from "@/components/site-header";
import { Separator } from "@/components/ui/separator";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "https://leadgen-os.com"),
  title: {
    default: `${tenantConfig.brandName} — Enterprise Lead Generation Platform`,
    template: `%s | ${tenantConfig.brandName}`,
  },
  description:
    "Multi-tenant lead generation infrastructure. Capture, score, route, nurture, and convert leads with configurable funnel graphs, AI-powered content, and 137+ integrations.",
  openGraph: {
    title: `${tenantConfig.brandName} — Enterprise Lead Generation Platform`,
    description:
      "One runtime, many niches. Deploy a complete lead-gen platform for any industry in minutes.",
    type: "website",
    siteName: tenantConfig.brandName,
    images: [{ url: "/og-image.png", width: 1200, height: 630, alt: `${tenantConfig.brandName} platform` }],
  },
  twitter: {
    card: "summary_large_image",
    title: `${tenantConfig.brandName} — Enterprise Lead Generation Platform`,
    description:
      "One runtime, many niches. Deploy a complete lead-gen platform for any industry in minutes.",
  },
  icons: { icon: "/icon.svg" },
};

const footerPlatform = [
  { label: "Industries", href: "/industries" },
  { label: "Pricing", href: "/pricing" },
  { label: "Directory", href: "/directory" },
  { label: "Marketplace", href: "/marketplace" },
  { label: "Demo", href: "/demo" },
  { label: "ROI Calculator", href: "/calculator" },
];

const footerResources = [
  { label: "Help Center", href: "/help" },
  { label: "Changelog", href: "/changelog" },
  { label: "Roadmap", href: "/roadmap" },
  { label: "Contact", href: "/contact" },
  { label: "API Docs", href: "/docs/api" },
  { label: "Setup Guide", href: "/setup" },
];

const footerLegal = [
  { label: "Privacy", href: "/privacy" },
  { label: "Terms", href: "/terms" },
  { label: "Manage Data", href: "/privacy/manage" },
  { label: "Cookie Policy", href: "/privacy#cookies" },
];

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const partneroProgramId = process.env.PARTNERO_PROGRAM_ID ?? embeddedSecrets.partnero.programId;
  const partneroAssetsHost = process.env.PARTNERO_ASSETS_HOST ?? embeddedSecrets.partnero.assetsHost;
  const brandName = tenantConfig.brandName;

  return (
    <html lang="en" className={inter.variable} suppressHydrationWarning>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="theme-color" content="#4f46e5" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@graph": [
                {
                  "@type": "Organization",
                  "@id": "https://leadgen-os.com/#organization",
                  name: tenantConfig.brandName,
                  url: "https://leadgen-os.com",
                  logo: {
                    "@type": "ImageObject",
                    url: "https://leadgen-os.com/og-image.png",
                    width: 1200,
                    height: 630,
                  },
                  description:
                    "Multi-tenant lead generation infrastructure. Capture, score, route, nurture, and convert leads with configurable funnel graphs, AI-powered content, and 137+ integrations.",
                  sameAs: [],
                },
                {
                  "@type": "WebSite",
                  "@id": "https://leadgen-os.com/#website",
                  url: "https://leadgen-os.com",
                  name: `${tenantConfig.brandName} — Enterprise Lead Generation Platform`,
                  publisher: { "@id": "https://leadgen-os.com/#organization" },
                  potentialAction: {
                    "@type": "SearchAction",
                    target: {
                      "@type": "EntryPoint",
                      urlTemplate: "https://leadgen-os.com/industries?q={search_term_string}",
                    },
                    "query-input": "required name=search_term_string",
                  },
                },
                {
                  "@type": "SoftwareApplication",
                  "@id": "https://leadgen-os.com/#app",
                  name: `${tenantConfig.brandName} Platform`,
                  applicationCategory: "BusinessApplication",
                  operatingSystem: "Web",
                  offers: {
                    "@type": "Offer",
                    url: "https://leadgen-os.com/pricing",
                    priceCurrency: "USD",
                  },
                  publisher: { "@id": "https://leadgen-os.com/#organization" },
                },
              ],
            }),
          }}
        />
      </head>
      <body className={`${inter.className} bg-background text-foreground antialiased`}>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
        <a href="#main-content" className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-primary focus:text-primary-foreground focus:rounded-md">
          Skip to content
        </a>

        {/* ── Header ──────────────────────────────────────── */}
        <SiteHeader brandName={brandName} />

        {partneroProgramId ? (
          <Script
            id="partnero-js"
            strategy="afterInteractive"
            dangerouslySetInnerHTML={{
              __html: `(function(p,t,n,e,r,o){ p['__partnerObject']=r;function f(){var c={ a:arguments,q:[]};var r=this.push(c);return "number"!=typeof r?r:f.bind(c.q);}f.q=f.q||[];p[r]=p[r]||f.bind(f.q);p[r].q=p[r].q||f.q;o=t.createElement(n);var _=t.getElementsByTagName(n)[0];o.async=1;o.src=e+'?v'+(~~(new Date().getTime()/1e6));_.parentNode.insertBefore(o,_);})(window, document, 'script', 'https://app.partnero.com/js/universal.js', 'po');po('settings', 'assets_host', '${partneroAssetsHost}');po('program', '${partneroProgramId}', 'load');`,
            }}
          />
        ) : null}

        <div id="main-content">{children}</div>

        {/* ── Footer ──────────────────────────────────────── */}
        <footer className="border-t border-border mt-16" role="contentinfo">
          <div className="max-w-7xl mx-auto px-4 py-12">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
              {/* Column 1: Brand */}
              <div className="col-span-2 md:col-span-1">
                <p className="font-semibold text-foreground">{brandName}</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Enterprise lead generation infrastructure for every vertical.
                </p>
              </div>

              {/* Column 2: Platform */}
              <div>
                <p className="text-sm font-semibold text-foreground mb-3">Platform</p>
                <nav aria-label="Platform links" className="flex flex-col gap-2">
                  {footerPlatform.map(({ label, href }) => (
                    <Link key={label} href={href} className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                      {label}
                    </Link>
                  ))}
                </nav>
              </div>

              {/* Column 3: Resources */}
              <div>
                <p className="text-sm font-semibold text-foreground mb-3">Resources</p>
                <nav aria-label="Resource links" className="flex flex-col gap-2">
                  {footerResources.map(({ label, href }) => (
                    <Link key={label} href={href} className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                      {label}
                    </Link>
                  ))}
                </nav>
              </div>

              {/* Column 4: Legal */}
              <div>
                <p className="text-sm font-semibold text-foreground mb-3">Legal</p>
                <nav aria-label="Legal links" className="flex flex-col gap-2">
                  {footerLegal.map(({ label, href }) => (
                    <Link key={label} href={href} className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                      {label}
                    </Link>
                  ))}
                </nav>
              </div>
            </div>

            <Separator className="my-8" />

            <div className="text-center">
              <p className="text-xs text-muted-foreground">&copy; {new Date().getFullYear()} {brandName}. All rights reserved.</p>
            </div>
          </div>
        </footer>

        <Toaster />

        {process.env.NEXT_PUBLIC_UMAMI_URL && process.env.NEXT_PUBLIC_UMAMI_WEBSITE_ID ? (
          <Script
            src={process.env.NEXT_PUBLIC_UMAMI_URL}
            data-website-id={process.env.NEXT_PUBLIC_UMAMI_WEBSITE_ID}
            strategy="afterInteractive"
          />
        ) : null}
        </ThemeProvider>
      </body>
    </html>
  );
}
