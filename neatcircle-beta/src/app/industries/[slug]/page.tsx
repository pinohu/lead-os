import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { services } from "@/lib/services";
import { siteConfig } from "@/lib/site-config";

type PageProps = {
  params: Promise<{ slug: string }>;
};

function getService(slug: string) {
  return services.find((s) => s.slug === slug);
}

export function generateStaticParams() {
  return services.map((s) => ({ slug: s.slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const svc = getService(slug);
  if (!svc) return { title: `Industry Not Found | ${siteConfig.brandName}` };

  return {
    title: `${svc.title} | Industries | ${siteConfig.brandName}`,
    description: `${svc.tagline}. ${svc.overview.slice(0, 140)}...`,
    openGraph: {
      title: `${svc.title} | ${siteConfig.brandName}`,
      description: svc.tagline,
      type: "website",
      url: `${siteConfig.siteUrl}/industries/${svc.slug}`,
    },
  };
}

function CheckIcon() {
  return (
    <svg
      className="w-4 h-4 text-cyan shrink-0 mt-0.5"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M4.5 12.75l6 6 9-13.5"
      />
    </svg>
  );
}

export default async function IndustryPage({ params }: PageProps) {
  const { slug } = await params;
  const svc = getService(slug);
  if (!svc) notFound();

  const categoryLabel = svc.category === "blue-ocean" ? "Blue Ocean" : "Core";

  return (
    <main className="min-h-screen bg-white">
      {/* Hero */}
      <section className="bg-gradient-to-b from-slate-900 to-slate-800 text-white py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <span className="inline-block px-3 py-1 mb-4 text-xs font-semibold uppercase tracking-wider bg-cyan/10 text-cyan rounded-full border border-cyan/20">
            {categoryLabel} Solution
          </span>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4">
            {svc.title}
          </h1>
          <p className="text-lg text-slate-300 max-w-2xl mx-auto mb-4">
            {svc.tagline}
          </p>
          <p className="text-sm text-cyan font-semibold">{svc.price}</p>
          <div className="flex flex-wrap justify-center gap-4 mt-8">
            <Link
              href={`/assess/general`}
              className="bg-cyan hover:bg-cyan-dark text-white font-semibold px-8 py-3.5 rounded-lg transition-colors"
            >
              Take the Assessment
            </Link>
            <Link
              href="/#contact"
              className="border border-white/20 hover:border-white/40 text-white font-semibold px-8 py-3.5 rounded-lg transition-colors"
            >
              Contact Us
            </Link>
          </div>
        </div>
      </section>

      {/* Overview */}
      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold text-navy mb-4">Overview</h2>
          <p className="text-slate-600 leading-relaxed">{svc.overview}</p>
        </div>
      </section>

      {/* Features */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-slate-50">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold text-navy mb-8">Key Features</h2>
          <div className="grid gap-6 sm:grid-cols-2">
            {svc.features.map((feature) => (
              <div
                key={feature.title}
                className="bg-white border border-slate-200 rounded-xl p-6"
              >
                <h3 className="font-semibold text-navy mb-2">
                  {feature.title}
                </h3>
                <p className="text-sm text-slate-600">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Deliverables */}
      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold text-navy mb-8">
            What You Get
          </h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {svc.deliverables.map((item) => (
              <div
                key={item}
                className="flex items-start gap-2 bg-slate-50 border border-slate-200 rounded-lg px-4 py-3"
              >
                <CheckIcon />
                <span className="text-sm text-slate-700">{item}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Ideal Client */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-slate-50">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold text-navy mb-4">
            Who This Is For
          </h2>
          <p className="text-slate-600 mb-6">{svc.idealClient}</p>
          <ul className="space-y-3">
            {svc.idealClientDetails.map((detail) => (
              <li key={detail} className="flex items-start gap-2">
                <CheckIcon />
                <span className="text-sm text-slate-700">{detail}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Timeline */}
      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold text-navy mb-2">
            Implementation Timeline
          </h2>
          <p className="text-sm text-slate-500 mb-8">
            Typical delivery: {svc.timelineRange}
          </p>
          <div className="space-y-6">
            {svc.timeline.map((step, i) => (
              <div key={i} className="flex gap-4">
                <div className="flex flex-col items-center">
                  <div className="w-8 h-8 rounded-full bg-cyan/10 text-cyan flex items-center justify-center text-sm font-bold">
                    {i + 1}
                  </div>
                  {i < svc.timeline.length - 1 && (
                    <div className="w-px flex-1 bg-slate-200 mt-2" />
                  )}
                </div>
                <div className="pb-6">
                  <p className="text-xs font-semibold uppercase tracking-wider text-cyan mb-1">
                    {step.phase}
                  </p>
                  <h3 className="font-semibold text-navy mb-1">
                    {step.title}
                  </h3>
                  <p className="text-sm text-slate-600">{step.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Cross-Links */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-slate-50">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold text-navy mb-8">
            Explore Further
          </h2>
          <div className="grid gap-6 sm:grid-cols-3">
            <Link
              href={`/services/${svc.slug}`}
              className="group border border-slate-200 rounded-xl p-6 bg-white hover:border-cyan/40 hover:shadow-lg transition-all"
            >
              <h3 className="font-semibold text-navy group-hover:text-cyan transition-colors mb-2">
                Service Details
              </h3>
              <p className="text-sm text-slate-600">
                Full pricing, deliverables, and implementation details.
              </p>
            </Link>
            <Link
              href="/assess/general"
              className="group border border-slate-200 rounded-xl p-6 bg-white hover:border-cyan/40 hover:shadow-lg transition-all"
            >
              <h3 className="font-semibold text-navy group-hover:text-cyan transition-colors mb-2">
                Growth Assessment
              </h3>
              <p className="text-sm text-slate-600">
                Score your readiness in two minutes and get an action plan.
              </p>
            </Link>
            <Link
              href="/#contact"
              className="group border border-slate-200 rounded-xl p-6 bg-white hover:border-cyan/40 hover:shadow-lg transition-all"
            >
              <h3 className="font-semibold text-navy group-hover:text-cyan transition-colors mb-2">
                Talk to Our Team
              </h3>
              <p className="text-sm text-slate-600">
                Get a custom proposal tailored to your business.
              </p>
            </Link>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-slate-900 text-white text-center">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-2xl sm:text-3xl font-bold mb-4">
            Ready to Get Started with {svc.title}?
          </h2>
          <p className="text-slate-300 mb-8">
            Take the free growth assessment or contact us for a custom proposal.
            No obligation, no pressure.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link
              href="/assess/general"
              className="bg-cyan hover:bg-cyan-dark text-white font-semibold px-8 py-3.5 rounded-lg transition-colors"
            >
              Take the Assessment
            </Link>
            <Link
              href="/#contact"
              className="border border-white/20 hover:border-white/40 text-white font-semibold px-8 py-3.5 rounded-lg transition-colors"
            >
              Contact Us
            </Link>
          </div>
        </div>
      </section>

      {/* Schema.org JSON-LD */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Service",
            name: svc.title,
            description: svc.overview,
            url: `${siteConfig.siteUrl}/industries/${svc.slug}`,
            provider: {
              "@type": "Organization",
              name: siteConfig.brandName,
              url: siteConfig.siteUrl,
            },
            offers: {
              "@type": "Offer",
              price: svc.price,
              priceCurrency: "USD",
            },
          }),
        }}
      />
    </main>
  );
}
