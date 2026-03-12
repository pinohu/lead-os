import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "NeatCircle | Business Automation & Process Optimization",
  description:
    "Systematic process optimization and operational efficiency solutions for middle-market companies. 209+ premium tools included. Zero software licensing fees.",
  keywords:
    "business automation, process optimization, SuiteDash, client portal, CRM implementation, digital transformation, workflow automation, compliance training",
  openGraph: {
    title: "NeatCircle | Business Automation & Process Optimization",
    description:
      "209+ premium business tools included in every engagement. Zero software licensing fees. 97% client satisfaction.",
    type: "website",
    url: "https://neatcircle.com",
  },
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
        {children}
      </body>
    </html>
  );
}
