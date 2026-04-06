import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { siteConfig } from "@/lib/site-config";

export const metadata = {
  title: `Customer Success Paths | ${siteConfig.brandName}`,
  description: "Continuity, referral, upsell, and refund-prevention flow surface for active clients.",
  openGraph: {
    title: `Customer Success Paths | ${siteConfig.brandName}`,
    description: "Continuity, referral, upsell, and refund-prevention flow surface for active clients.",
  },
};

export default function CustomerSuccessPage() {
  return (
    <>
      <Navbar />
      <main className="bg-navy text-white pt-28">
        <section className="max-w-6xl mx-auto px-6 py-16">
          <div className="inline-flex rounded-full border border-violet-300/30 bg-violet-300/10 px-4 py-1 text-sm text-violet-200">
            Continuity + Refund Prevention
          </div>
          <h1 className="mt-6 text-5xl font-bold leading-tight">
            Customer journeys should protect revenue, not just acquire it.
          </h1>
          <p className="mt-6 max-w-3xl text-lg text-slate-300">
            This surface is the handoff from acquisition to retention. It supports onboarding confidence, expansion
            offers, referrals, and save-the-client flows when a relationship shows signs of risk.
          </p>
          <div className="mt-10 grid gap-6 md:grid-cols-4">
            {[
              ["Onboarding", "Reduce friction, reinforce value, and accelerate first visible win."],
              ["Expansion", "Offer the next logical service based on behavior, maturity, and ROI realized."],
              ["Referral", "Turn satisfied clients into active pipeline sources with intelligent timing."],
              ["Save", "Catch drop-off, objection, or refund signals before they become churn."],
            ].map(([title, copy]) => (
              <div key={title} className="rounded-2xl border border-white/10 bg-white/5 p-6">
                <h2 className="text-xl font-semibold">{title}</h2>
                <p className="mt-3 text-sm text-slate-300">{copy}</p>
              </div>
            ))}
          </div>
          <div className="mt-8 flex flex-wrap gap-4">
            <Link href="/dashboard" className="rounded-lg bg-cyan px-6 py-3 font-semibold text-white">
              View Control Tower
            </Link>
            <Link href="/control-center" className="rounded-lg border border-white/20 px-6 py-3 font-semibold text-white">
              Open Platform Controls
            </Link>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
