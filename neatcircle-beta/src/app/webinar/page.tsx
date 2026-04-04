import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import Contact from "@/components/Contact";
import { siteConfig } from "@/lib/site-config";

export const metadata = {
  title: `Live Growth Workshop | ${siteConfig.brandName}`,
  description: "Register for a live workshop on intelligent lead capture, conversion systems, and adaptive funnels.",
};

export default function WebinarPage() {
  return (
    <>
      <Navbar />
      <main className="bg-navy text-white pt-28">
        <section className="max-w-6xl mx-auto px-6 py-16">
          <div className="inline-flex rounded-full border border-cyan/30 bg-cyan/10 px-4 py-1 text-sm text-cyan">
            Live Webinar Funnel
          </div>
          <h1 className="mt-6 text-5xl font-bold leading-tight">
            Live training for operators who want a lead system that reacts in real time.
          </h1>
          <p className="mt-6 max-w-3xl text-lg text-slate-300">
            This surface is built for warm traffic. It pre-qualifies visitors with live intent, pushes them into
            application or consultation flows, and hands the strongest leads directly into your automated intake stack.
          </p>
          <div className="mt-8 flex flex-wrap gap-4">
            <Link href="/assess/general" className="rounded-lg bg-cyan px-6 py-3 font-semibold text-white">
              Reserve My Spot
            </Link>
            <a href="/calculator" className="rounded-lg border border-white/20 px-6 py-3 font-semibold text-white">
              Preview ROI First
            </a>
          </div>
          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {[
              ["Before the webinar", "Capture source, intent, niche, and objection profile before the session starts."],
              ["During the webinar", "Push attendees toward application, consult, or direct offer paths based on behavior."],
              ["After the webinar", "Route no-shows, watchers, and high-intent attendees into different nurture sequences."],
            ].map(([title, copy]) => (
              <div key={title} className="rounded-2xl border border-white/10 bg-white/5 p-6">
                <h2 className="text-xl font-semibold">{title}</h2>
                <p className="mt-3 text-sm text-slate-300">{copy}</p>
              </div>
            ))}
          </div>
        </section>
        <Contact />
      </main>
      <Footer />
    </>
  );
}
