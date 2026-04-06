import type { Metadata } from "next";
import Link from "next/link";
import { services } from "@/lib/services";
import { siteConfig } from "@/lib/site-config";

export const metadata: Metadata = {
  title: `Industries We Serve | ${siteConfig.brandName}`,
  description: `Explore industry-specific solutions from ${siteConfig.brandName}. We build tailored platforms for service businesses, legal, healthcare, construction, franchises, staffing, and more.`,
};

export default function IndustriesPage() {
  const coreServices = services.filter((s) => s.category === "core");
  const blueOceanServices = services.filter((s) => s.category === "blue-ocean");

  return (
    <main className="min-h-screen bg-white">
      {/* Hero */}
      <section className="bg-gradient-to-b from-slate-900 to-slate-800 text-white py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <span className="inline-block px-3 py-1 mb-4 text-xs font-semibold uppercase tracking-wider bg-cyan/10 text-cyan rounded-full border border-cyan/20">
            Industry Solutions
          </span>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4">
            Built for Your Industry
          </h1>
          <p className="text-lg text-slate-300 max-w-2xl mx-auto">
            {siteConfig.brandName} delivers purpose-built platforms for the
            industries that need them most. Find your vertical and see how we
            solve the problems your off-the-shelf tools ignore.
          </p>
        </div>
      </section>

      {/* Core Services */}
      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-2xl font-bold text-navy mb-2">Core Solutions</h2>
          <p className="text-slate-500 mb-8">
            Foundation platforms that power businesses across every vertical.
          </p>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {coreServices.map((svc) => (
              <Link
                key={svc.slug}
                href={`/industries/${svc.slug}`}
                className="group border border-slate-200 rounded-xl p-6 hover:border-cyan/40 hover:shadow-lg transition-all"
              >
                <span className="inline-block px-2 py-0.5 text-xs font-semibold uppercase tracking-wider bg-cyan/10 text-cyan rounded mb-3">
                  Core
                </span>
                <h3 className="text-lg font-bold text-navy group-hover:text-cyan transition-colors mb-2">
                  {svc.title}
                </h3>
                <p className="text-sm text-slate-600 mb-3">{svc.tagline}</p>
                <p className="text-xs text-slate-600">{svc.price}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Blue Ocean Services */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-slate-50">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-2xl font-bold text-navy mb-2">
            Blue Ocean Verticals
          </h2>
          <p className="text-slate-500 mb-8">
            Specialized platforms for underserved industries with massive
            opportunity.
          </p>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {blueOceanServices.map((svc) => (
              <Link
                key={svc.slug}
                href={`/industries/${svc.slug}`}
                className="group border border-slate-200 rounded-xl p-6 hover:border-cyan/40 hover:shadow-lg transition-all bg-white"
              >
                <span className="inline-block px-2 py-0.5 text-xs font-semibold uppercase tracking-wider bg-indigo-50 text-indigo-600 rounded mb-3">
                  Blue Ocean
                </span>
                <h3 className="text-lg font-bold text-navy group-hover:text-cyan transition-colors mb-2">
                  {svc.title}
                </h3>
                <p className="text-sm text-slate-600 mb-3">{svc.tagline}</p>
                <p className="text-xs text-slate-600">{svc.price}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-slate-900 text-white text-center">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-2xl sm:text-3xl font-bold mb-4">
            Not Sure Which Solution Fits?
          </h2>
          <p className="text-slate-300 mb-8">
            Take a free growth assessment and we will match you with the right
            platform for your industry in under two minutes.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link
              href="/assess"
              className="bg-cyan hover:bg-cyan-dark text-white font-semibold px-8 py-3.5 rounded-lg transition-colors"
            >
              Take the Assessment
            </Link>
            <Link
              href="/#contact"
              className="border border-white/20 hover:border-white/40 text-white font-semibold px-8 py-3.5 rounded-lg transition-colors"
            >
              Talk to Our Team
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
