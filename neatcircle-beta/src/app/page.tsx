import type { Metadata } from "next";
import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import Stats from "@/components/Stats";
import Services from "@/components/Services";
import Industries from "@/components/Industries";
import BluOcean from "@/components/BluOcean";
import Process from "@/components/Process";
import ToolStack from "@/components/ToolStack";
import Pricing from "@/components/Pricing";
import Testimonials from "@/components/Testimonials";
import About from "@/components/About";
import Contact from "@/components/Contact";
import ReferralBanner from "@/components/ReferralBanner";
import Footer from "@/components/Footer";
import { siteConfig } from "@/lib/site-config";

export const metadata: Metadata = {
  title: `${siteConfig.brandName} | ${siteConfig.marketingHeadline}`,
  description: siteConfig.marketingDescription,
  openGraph: {
    title: `${siteConfig.brandName} | ${siteConfig.marketingHeadline}`,
    description: siteConfig.openGraphDescription,
    type: "website",
    url: siteConfig.siteUrl,
  },
};

export default function Home() {
  return (
    <>
      <Navbar />
      <main id="main-content">
        <Hero />
        <Stats />
        <Services />
        <Industries />
        <BluOcean />
        <Process />
        <ToolStack />
        <Pricing />
        <Testimonials />
        <About />
        <Contact />
        <ReferralBanner />
      </main>
      <Footer />
    </>
  );
}
