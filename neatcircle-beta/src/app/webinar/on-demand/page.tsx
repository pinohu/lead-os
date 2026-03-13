import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import Contact from "@/components/Contact";
import { siteConfig } from "@/lib/site-config";

export const metadata = {
  title: `On-Demand Webinar | ${siteConfig.brandName}`,
  description: "Evergreen webinar funnel built for visitors who need proof, context, and flexible timing.",
};

export default function OnDemandWebinarPage() {
  return (
    <>
      <Navbar />
      <main className="bg-navy text-white pt-28">
        <section className="max-w-6xl mx-auto px-6 py-16">
          <div className="inline-flex rounded-full border border-emerald-400/30 bg-emerald-400/10 px-4 py-1 text-sm text-emerald-300">
            Evergreen Webinar Funnel
          </div>
          <h1 className="mt-6 text-5xl font-bold leading-tight">
            On-demand proof for visitors who want to learn before they book.
          </h1>
          <p className="mt-6 max-w-3xl text-lg text-slate-300">
            This is the evergreen version of the webinar path. It works best for trust objections, longer buying cycles,
            and niches that need layered education before a high-ticket conversation feels earned.
          </p>
          <div className="mt-8 grid gap-6 md:grid-cols-2">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
              <h2 className="text-2xl font-semibold">What the system does</h2>
              <ul className="mt-4 space-y-3 text-slate-300">
                <li>Captures viewer identity before full access.</li>
                <li>Tracks watch-intent and CTA engagement as funnel signals.</li>
                <li>Changes follow-up depending on whether the visitor watched, skipped, or bailed.</li>
              </ul>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
              <h2 className="text-2xl font-semibold">Best next actions</h2>
              <ul className="mt-4 space-y-3 text-slate-300">
                <li>Trust-heavy visitors get more proof and case material.</li>
                <li>Hot visitors get fast-tracked into consult and conversion flows.</li>
                <li>Price-sensitive visitors get ROI and offer-framing follow-up.</li>
              </ul>
            </div>
          </div>
          <div className="mt-8 flex flex-wrap gap-4">
            <a href="/stories/client-portal" className="rounded-lg bg-cyan px-6 py-3 font-semibold text-white">
              Watch the Story Version
            </a>
            <a href="/assess/general" className="rounded-lg border border-white/20 px-6 py-3 font-semibold text-white">
              Skip to Assessment
            </a>
          </div>
        </section>
        <Contact />
      </main>
      <Footer />
    </>
  );
}
