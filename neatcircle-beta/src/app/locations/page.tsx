import { Metadata } from "next";
import Link from "next/link";
import { gmbProfiles } from "@/lib/gmb-profiles";
import { siteConfig } from "@/lib/site-config";

export const metadata: Metadata = {
  title: `Locations & Services | ${siteConfig.brandName}`,
  description: `Explore ${siteConfig.brandName} service locations. Marketing agencies, SaaS platforms, lead generation, consulting, and franchise operations nationwide.`,
  openGraph: {
    title: `Locations & Services | ${siteConfig.brandName}`,
    description: `Find ${siteConfig.brandName} services near you.`,
    type: "website",
    url: `${siteConfig.siteUrl}/locations`,
  },
};

export default function LocationsPage() {
  return (
    <main className="min-h-screen bg-white">
      <section className="bg-gradient-to-b from-slate-900 to-slate-800 text-white py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <span className="inline-block px-3 py-1 mb-4 text-xs font-semibold uppercase tracking-wider bg-cyan/10 text-cyan rounded-full border border-cyan/20">
            Service Locations
          </span>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4">
            Find the Right Service for Your Business
          </h1>
          <p className="text-lg text-slate-300 max-w-2xl mx-auto">
            From marketing agencies to franchise operations, we serve businesses of every type and size nationwide.
          </p>
        </div>
      </section>

      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {gmbProfiles.map((profile) => (
            <Link
              key={profile.slug}
              href={`/locations/${profile.slug}`}
              className="group border border-slate-200 rounded-xl p-6 hover:border-cyan/40 hover:shadow-lg transition-all flex flex-col"
            >
              <span className="inline-block px-2 py-0.5 mb-3 text-xs font-semibold bg-slate-100 text-slate-600 rounded-full w-fit">
                {profile.gmbCategory}
              </span>
              <h2 className="text-lg font-bold text-navy mb-1 group-hover:text-cyan transition-colors">
                {profile.businessName}
              </h2>
              <p className="text-sm text-slate-500 mb-3 flex-1 line-clamp-3">
                {profile.description}
              </p>
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-600">{profile.serviceArea}</span>
                <span className="text-cyan font-medium group-hover:translate-x-1 transition-transform inline-flex items-center gap-1">
                  View details
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                  </svg>
                </span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-slate-50 text-center">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-2xl font-bold text-navy mb-4">Not Sure Where to Start?</h2>
          <p className="text-slate-600 mb-8">Take our free assessment and we will recommend the best service for your business.</p>
          <Link
            href="/#contact"
            className="bg-cyan hover:bg-cyan-dark text-white font-semibold px-8 py-3.5 rounded-lg transition-colors"
          >
            Get a Free Assessment
          </Link>
        </div>
      </section>
    </main>
  );
}
