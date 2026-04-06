import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { CookieBanner } from "@/components/CookieBanner";
import { ClientWidgets } from "@/components/ClientWidgets";
import { siteConfig } from "@/lib/site-config";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: `${siteConfig.brandName} | ${siteConfig.marketingHeadline}`,
  description: siteConfig.marketingDescription,
  keywords:
    "business automation, process optimization, SuiteDash, client portal, CRM implementation, digital transformation, workflow automation, compliance training",
  openGraph: {
    title: `${siteConfig.brandName} | ${siteConfig.marketingHeadline}`,
    description: siteConfig.openGraphDescription,
    type: "website",
    url: siteConfig.siteUrl,
    images: [
      {
        url: `${siteConfig.siteUrl}/og-image.png`,
        width: 1200,
        height: 630,
        alt: `${siteConfig.brandName} — ${siteConfig.marketingHeadline}`,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: `${siteConfig.brandName} | ${siteConfig.marketingHeadline}`,
    description: siteConfig.openGraphDescription,
    images: [`${siteConfig.siteUrl}/og-image.png`],
  },
  metadataBase: new URL(siteConfig.siteUrl),
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": `${siteConfig.siteUrl}/#organization`,
        name: siteConfig.brandName,
        url: siteConfig.siteUrl,
        description: siteConfig.marketingDescription,
        contactPoint: {
          "@type": "ContactPoint",
          email: siteConfig.supportEmail,
          contactType: "customer support",
        },
      },
      {
        "@type": "WebSite",
        "@id": `${siteConfig.siteUrl}/#website`,
        url: siteConfig.siteUrl,
        name: `${siteConfig.brandName} | ${siteConfig.marketingHeadline}`,
        publisher: { "@id": `${siteConfig.siteUrl}/#organization` },
      },
      {
        "@type": "SoftwareApplication",
        "@id": `${siteConfig.siteUrl}/#app`,
        name: siteConfig.brandName,
        applicationCategory: "BusinessApplication",
        description: siteConfig.marketingDescription,
        url: siteConfig.siteUrl,
        publisher: { "@id": `${siteConfig.siteUrl}/#organization` },
      },
    ],
  }

  return (
    <html lang="en">
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <a
          href="#main-content"
          className="absolute -top-full left-4 z-50 rounded-md bg-cyan-500 px-4 py-2 text-white focus:top-4 focus:outline-none focus:ring-2 focus:ring-cyan-400"
        >
          Skip to content
        </a>
        <main id="main-content">{children}</main>
        <ClientWidgets />
        <CookieBanner />
      </body>
    </html>
  );
}
