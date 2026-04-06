import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import Contact from "@/components/Contact";
import { siteConfig } from "@/lib/site-config";

export const metadata = {
  title: `Lead Magnet Giveaway | ${siteConfig.brandName}`,
  description: "High-conversion giveaway funnel for cold traffic, list growth, and low-friction opt-ins.",
  openGraph: {
    title: `Lead Magnet Giveaway | ${siteConfig.brandName}`,
    description: "High-conversion giveaway funnel for cold traffic, list growth, and low-friction opt-ins.",
  },
};

export default function GiveawayPage() {
  return (
    <>
      <Navbar />
      <main className="bg-navy text-white pt-28">
        <section className="max-w-6xl mx-auto px-6 py-16">
          <div className="inline-flex rounded-full border border-amber-300/30 bg-amber-300/10 px-4 py-1 text-sm text-amber-200">
            Giveaway Funnel
          </div>
          <h1 className="mt-6 text-5xl font-bold leading-tight">
            Cold traffic needs a fast win before it will trust a serious offer.
          </h1>
          <p className="mt-6 max-w-3xl text-lg text-slate-300">
            The giveaway path uses low-friction capture, fast value, and intelligent follow-up. It is ideal for social
            traffic, ads, partnerships, and traffic sources that are curious but not sales-ready yet.
          </p>
          <div className="mt-10 grid gap-6 md:grid-cols-3">
            {[
              ["Capture", "Use simple value-first opt-in with minimal friction and strong promise clarity."],
              ["Qualify", "Layer in behavior, click depth, and follow-up response to separate curious from serious."],
              ["Advance", "Move engaged entrants into assessment, webinar, or consultation based on profile fit."],
            ].map(([title, copy]) => (
              <div key={title} className="rounded-2xl border border-white/10 bg-white/5 p-6">
                <h2 className="text-xl font-semibold">{title}</h2>
                <p className="mt-3 text-sm text-slate-300">{copy}</p>
              </div>
            ))}
          </div>
          <div className="mt-8 flex flex-wrap gap-4">
            <Link href="/calculator" className="rounded-lg bg-cyan px-6 py-3 font-semibold text-white">
              Get the ROI Tool
            </Link>
            <Link href="/webinar/on-demand" className="rounded-lg border border-white/20 px-6 py-3 font-semibold text-white">
              Continue to Evergreen Webinar
            </Link>
          </div>
        </section>
        <Contact />
      </main>
      <Footer />
    </>
  );
}
