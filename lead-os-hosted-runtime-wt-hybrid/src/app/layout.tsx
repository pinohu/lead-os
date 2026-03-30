import type { Metadata } from "next";
import Link from "next/link";
import Script from "next/script";
import "@/app/globals.css";
import { tenantConfig } from "@/lib/tenant";
import { embeddedSecrets } from "@/lib/embedded-secrets";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "https://leadgen-os.com"),
  title: {
    default: `${tenantConfig.brandName} — Programmable Lead Generation Platform`,
    template: `%s | ${tenantConfig.brandName}`,
  },
  description:
    "Multi-tenant lead generation infrastructure. Capture, score, route, nurture, and convert leads with configurable funnel graphs, AI-powered content, and 110+ integrations.",
  openGraph: {
    title: `${tenantConfig.brandName} — Programmable Lead Generation Platform`,
    description:
      "One runtime, many niches. Deploy a complete lead-gen platform for any industry in minutes.",
    type: "website",
    siteName: tenantConfig.brandName,
    images: [{ url: "/og-image.png", width: 1200, height: 630, alt: `${tenantConfig.brandName} platform` }],
  },
  twitter: {
    card: "summary_large_image",
    title: `${tenantConfig.brandName} — Programmable Lead Generation Platform`,
    description:
      "One runtime, many niches. Deploy a complete lead-gen platform for any industry in minutes.",
  },
  icons: { icon: "/icon.svg" },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const partneroProgramId = process.env.PARTNERO_PROGRAM_ID ?? embeddedSecrets.partnero.programId;
  const partneroAssetsHost = process.env.PARTNERO_ASSETS_HOST ?? embeddedSecrets.partnero.assetsHost;
  const brandName = tenantConfig.brandName;

  return (
    <html lang="en">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="theme-color" content={tenantConfig.accent} />
      </head>
      <body>
        <a href="#main-content" className="skip-link">
          Skip to content
        </a>
        <header className="site-nav" role="banner">
          <nav aria-label="Primary navigation">
            <Link href="/" className="site-nav__brand" aria-label={`${brandName} home`}>
              {brandName}
            </Link>
            <ul className="site-nav__links" role="list">
              <li>
                <Link href="/industries">Industries</Link>
              </li>
              <li>
                <Link href="/pricing">Pricing</Link>
              </li>
              <li>
                <Link href="/directory">Directory</Link>
              </li>
              <li>
                <Link href="/auth/sign-in" style={{ padding: "6px 16px", borderRadius: 6, border: "1px solid rgba(0,0,0,0.1)" }}>Sign in</Link>
              </li>
              <li>
                <Link href="/onboard" style={{ padding: "6px 16px", borderRadius: 6, background: "#2563eb", color: "#fff", fontWeight: 600 }}>Get started</Link>
              </li>
            </ul>
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
        <footer className="site-footer" role="contentinfo" style={{ borderTop: "1px solid #e5e7eb", padding: "2rem 1rem", marginTop: "4rem", textAlign: "center", fontSize: "0.875rem", color: "#6b7280" }}>
          <nav aria-label="Footer navigation" style={{ display: "flex", gap: "1.5rem", justifyContent: "center", flexWrap: "wrap", marginBottom: "0.75rem" }}>
            <Link href="/industries">Industries</Link>
            <Link href="/pricing">Pricing</Link>
            <Link href="/marketplace">Marketplace</Link>
            <Link href="/privacy">Privacy Policy</Link>
            <Link href="/terms">Terms of Service</Link>
            <Link href="/help">Help Center</Link>
            <Link href="/changelog">Changelog</Link>
            <Link href="/roadmap">Roadmap</Link>
            <Link href="/contact">Contact</Link>
          </nav>
          <p>&copy; {new Date().getFullYear()} {brandName}. All rights reserved.</p>
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
