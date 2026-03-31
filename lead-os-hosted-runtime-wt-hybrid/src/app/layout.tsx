import type { Metadata } from "next";
import Link from "next/link";
import Script from "next/script";
import { Inter } from "next/font/google";
import "@/app/globals.css";
import { tenantConfig } from "@/lib/tenant";
import { embeddedSecrets } from "@/lib/embedded-secrets";
import { Button } from "@/components/ui/button";

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

const footerLinks = [
  { label: "Industries", href: "/industries" },
  { label: "Pricing", href: "/pricing" },
  { label: "Marketplace", href: "/marketplace" },
  { label: "Help", href: "/help" },
  { label: "Changelog", href: "/changelog" },
  { label: "Roadmap", href: "/roadmap" },
  { label: "Contact", href: "/contact" },
  { label: "Privacy", href: "/privacy" },
  { label: "Terms", href: "/terms" },
];

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const partneroProgramId = process.env.PARTNERO_PROGRAM_ID ?? embeddedSecrets.partnero.programId;
  const partneroAssetsHost = process.env.PARTNERO_ASSETS_HOST ?? embeddedSecrets.partnero.assetsHost;
  const brandName = tenantConfig.brandName;

  return (
    <html lang="en" className={inter.variable}>
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
        <a href="#main-content" className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-primary focus:text-primary-foreground focus:rounded-md">
          Skip to content
        </a>

        {/* ── Header ──────────────────────────────────────── */}
        <header className="sticky top-0 z-50 w-full border-b border-border/50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <nav className="max-w-7xl mx-auto flex items-center justify-between h-16 px-4" aria-label="Primary navigation">
            <Link href="/" className="text-lg font-bold tracking-tight text-foreground hover:text-primary transition-colors" aria-label={`${brandName} home`}>
              {brandName}
            </Link>
            <div className="hidden md:flex items-center gap-6">
              <Link href="/industries" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">Industries</Link>
              <Link href="/pricing" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">Pricing</Link>
              <Link href="/directory" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">Directory</Link>
              <Link href="/marketplace" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">Marketplace</Link>
            </div>
            <div className="flex items-center gap-3">
              <Button asChild variant="ghost" size="sm" className="hidden sm:inline-flex">
                <Link href="/auth/sign-in">Sign in</Link>
              </Button>
              <Button asChild size="sm">
                <Link href="/onboard">Get started</Link>
              </Button>
            </div>
          </nav>
        </header>

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
            <div className="flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="text-center md:text-left">
                <p className="font-semibold text-foreground">{brandName}</p>
                <p className="text-sm text-muted-foreground mt-1">Enterprise lead generation infrastructure</p>
              </div>
              <nav aria-label="Footer navigation" className="flex flex-wrap justify-center gap-x-6 gap-y-2">
                {footerLinks.map(({ label, href }) => (
                  <Link key={label} href={href} className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                    {label}
                  </Link>
                ))}
              </nav>
            </div>
            <div className="mt-8 pt-6 border-t border-border text-center">
              <p className="text-xs text-muted-foreground">&copy; {new Date().getFullYear()} {brandName}. All rights reserved.</p>
            </div>
          </div>
        </footer>

        {process.env.NEXT_PUBLIC_UMAMI_URL && process.env.NEXT_PUBLIC_UMAMI_WEBSITE_ID ? (
          <Script
            src={process.env.NEXT_PUBLIC_UMAMI_URL}
            data-website-id={process.env.NEXT_PUBLIC_UMAMI_WEBSITE_ID}
            strategy="afterInteractive"
          />
        ) : null}
      </body>
    </html>
  );
}
