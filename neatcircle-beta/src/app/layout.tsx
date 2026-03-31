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
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-primary focus:text-primary-foreground focus:rounded-md focus:outline-none"
        >
          Skip to content
        </a>
        <div id="main-content">{children}</div>
        <BehavioralTracker />
        <ExitIntent />
        <ChatWidget />
        <FunnelOrchestrator />
        <WhatsAppOptIn />
      </body>
    </html>
  );
}
