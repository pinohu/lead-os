import { Suspense } from "react";
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import ClientWidgets from "@/components/ClientWidgets";
import Loading from "./loading";
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
          className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-primary focus:text-primary-foreground focus:rounded-md focus:outline-none"
        >
          Skip to content
        </a>
        <div id="main-content">
          <Suspense fallback={<Loading />}>
            {children}
          </Suspense>
        </div>
        <ClientWidgets />
      </body>
    </html>
  );
}
