import type { Metadata } from "next";
import Link from "next/link";
import Script from "next/script";
import { headers } from "next/headers";
import { Inter } from "next/font/google";
import "@/app/globals.css";
import { tenantConfig } from "@/lib/tenant";
import { embeddedSecrets } from "@/lib/embedded-secrets";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/sonner";
import { SiteHeader } from "@/components/site-header";
import { PageAudienceBanner } from "@/components/PageAudienceBanner";
import { Separator } from "@/components/ui/separator";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || tenantConfig.siteUrl || "https://cxreact.com"),
  title: {
    default: `${tenantConfig.brandName} | Complete AI solution fulfillment`,
    template: `%s | ${tenantConfig.brandName}`,
  },
  description:
    "Lead OS helps B2B operators sell outcome-based AI solutions, collect client intake details, and provision the business-ready delivery hubs, downstream pages, routing, assets, dashboards, reports, and managed handoffs the client paid for.",
  openGraph: {
    title: `${tenantConfig.brandName} | Complete AI solution fulfillment`,
    description:
      "Sell an outcome-based AI solution, collect one intake form, and provision the client-ready pages, routing, dashboard, and reports.",
    type: "website",
    siteName: tenantConfig.brandName,
    images: [{ url: "/og-image.png", width: 1200, height: 630, alt: `${tenantConfig.brandName} complete AI solution fulfillment` }],
  },
  twitter: {
    card: "summary_large_image",
    title: `${tenantConfig.brandName} | Complete AI solution fulfillment`,
    description:
      "Sell an outcome-based AI solution, collect one intake form, and provision the client-ready pages, routing, dashboard, and reports.",
  },
  icons: { icon: "/icon.svg" },
};

const footerPlatform = [
  { label: "Industries", href: "/industries" },
  { label: "Offers", href: "/offers" },
  { label: "Pricing", href: "/pricing" },
  { label: "Directory", href: "/directory" },
  { label: "Marketplace", href: "/marketplace" },
  { label: "Live examples", href: "/demo" },
  { label: "Client examples", href: "/client-examples" },
  { label: "ROI Calculator", href: "/calculator" },
];

const footerResources = [
  { label: "Audience map", href: "/audience-map" },
  { label: "Help Center", href: "/help" },
  { label: "Changelog", href: "/changelog" },
  { label: "Roadmap", href: "/roadmap" },
  { label: "Contact", href: "/contact" },
  { label: "Documentation hub", href: "/docs" },
  { label: "API reference", href: "/docs/api" },
  { label: "SLA", href: "/docs/sla" },
  { label: "Setup Guide", href: "/setup" },
];

const footerLegal = [
  { label: "Privacy", href: "/privacy" },
  { label: "Terms", href: "/terms" },
  { label: "Manage data (GDPR)", href: "/manage-data" },
  { label: "Cookie Policy", href: "/privacy#cookies" },
];

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const requestHeaders = await headers();
  const nonce = requestHeaders.get("x-csp-nonce") ?? "";
  const pathname = requestHeaders.get("x-leados-pathname") ?? "";
  const isOperatorPortal = pathname.startsWith("/portal/");
  const isClientExampleSite = pathname.startsWith("/client-examples/");
  const hidePlatformChrome = isOperatorPortal || isClientExampleSite;
  const partneroProgramId = process.env.PARTNERO_PROGRAM_ID ?? embeddedSecrets.partnero.programId;
  const partneroAssetsHost = process.env.PARTNERO_ASSETS_HOST ?? embeddedSecrets.partnero.assetsHost;
  const brandName = tenantConfig.brandName;
  const siteBase = tenantConfig.siteUrl.replace(/\/$/, "");

  return (
    <html lang="en" className={inter.variable} suppressHydrationWarning>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="theme-color" content={tenantConfig.accent} />
        {hidePlatformChrome ? null : (
        <script
          type="application/ld+json"
          nonce={nonce}
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@graph": [
                {
                  "@type": "Organization",
                  "@id": `${siteBase}/#organization`,
                  name: tenantConfig.brandName,
                  url: siteBase,
                  logo: {
                    "@type": "ImageObject",
                    url: `${siteBase}/og-image.png`,
                    width: 1200,
                    height: 630,
                  },
                  description:
                    "Complete AI solution fulfillment for B2B operators including agencies, SaaS teams, lead-gen operators, consultants, and franchises. Lead OS provisions client delivery hubs, downstream pages, embeds, routing, dashboards, reports, and managed handoffs.",
                  sameAs: [],
                },
                {
                  "@type": "WebSite",
                  "@id": `${siteBase}/#website`,
                  url: siteBase,
                  name: `${tenantConfig.brandName} | Complete AI solution fulfillment`,
                  publisher: { "@id": `${siteBase}/#organization` },
                  potentialAction: {
                    "@type": "SearchAction",
                    target: {
                      "@type": "EntryPoint",
                      urlTemplate: `${siteBase}/industries?q={search_term_string}`,
                    },
                    "query-input": "required name=search_term_string",
                  },
                },
                {
                  "@type": "SoftwareApplication",
                  "@id": `${siteBase}/#app`,
                  name: `${tenantConfig.brandName} solution fulfillment system`,
                  applicationCategory: "BusinessApplication",
                  operatingSystem: "Web",
                  offers: {
                    "@type": "Offer",
                    url: `${siteBase}/pricing`,
                    priceCurrency: "USD",
                  },
                  publisher: { "@id": `${siteBase}/#organization` },
                },
              ],
            }),
          }}
        />
        )}
      </head>
      <body className={`${inter.className} bg-background text-foreground antialiased`}>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-primary focus:text-primary-foreground focus:rounded-md"
        >
          Skip to main content
        </a>

        {/* ── Header ──────────────────────────────────────── */}
        {hidePlatformChrome ? null : <SiteHeader brandName={brandName} />}
        {hidePlatformChrome ? null : <PageAudienceBanner pathname={pathname} />}

        {partneroProgramId ? (
          <Script
            id="partnero-js"
            strategy="afterInteractive"
            nonce={nonce}
            dangerouslySetInnerHTML={{
              __html: `(function(p,t,n,e,r,o){ p['__partnerObject']=r;function f(){var c={ a:arguments,q:[]};var r=this.push(c);return "number"!=typeof r?r:f.bind(c.q);}f.q=f.q||[];p[r]=p[r]||f.bind(f.q);p[r].q=p[r].q||f.q;o=t.createElement(n);var _=t.getElementsByTagName(n)[0];o.async=1;o.src=e+'?v'+(~~(new Date().getTime()/1e6));_.parentNode.insertBefore(o,_);})(window, document, 'script', 'https://app.partnero.com/js/universal.js', 'po');po('settings', 'assets_host', '${partneroAssetsHost}');po('program', '${partneroProgramId}', 'load');`,
            }}
          />
        ) : null}

        <main id="main-content" tabIndex={-1} className="min-w-0 w-full max-w-none overflow-x-hidden p-0 outline-none">
          {children}
        </main>

        {/* ── Footer ──────────────────────────────────────── */}
        {hidePlatformChrome ? null : (
        <footer className="border-t border-border mt-8" role="contentinfo">
          <div className="max-w-7xl mx-auto px-4 py-8">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
              {/* Column 1: Brand */}
              <div className="col-span-2 md:col-span-1">
                <p className="font-semibold text-foreground">{brandName}</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Sell outcome-based AI solutions and provision the client-ready intake, routing, dashboard, and reports.
                </p>
              </div>

              {/* Column 2: Product */}
              <div>
                <p className="text-sm font-semibold text-foreground mb-3">Product</p>
                <nav aria-label="Product links" className="flex flex-col gap-2">
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
        )}

        <Toaster />

        {process.env.NEXT_PUBLIC_UMAMI_URL && process.env.NEXT_PUBLIC_UMAMI_WEBSITE_ID ? (
          <Script
            src={process.env.NEXT_PUBLIC_UMAMI_URL}
            data-website-id={process.env.NEXT_PUBLIC_UMAMI_WEBSITE_ID}
            strategy="afterInteractive"
            nonce={nonce}
          />
        ) : null}
        </ThemeProvider>
      </body>
    </html>
  );
}
