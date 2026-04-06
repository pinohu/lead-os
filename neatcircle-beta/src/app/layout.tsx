import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import BehavioralTracker from "@/components/BehavioralTracker";
import ExitIntent from "@/components/ExitIntent";
import ChatWidget from "@/components/ChatWidget";
import FunnelOrchestrator from "@/components/FunnelOrchestrator";
import WhatsAppOptIn from "@/components/WhatsAppOptIn";
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
          className="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:p-4 focus:bg-white focus:text-black"
        >
          Skip to main content
        </a>
        <main id="main-content">{children}</main>
        <BehavioralTracker />
        <ExitIntent />
        <ChatWidget />
        <FunnelOrchestrator />
        <WhatsAppOptIn />
      </body>
    </html>
  );
}
