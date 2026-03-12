import { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  getServiceBySlug,
  getAllSlugs,
  type ServiceData,
  type PricingTier,
} from "@/lib/services";

type PageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateStaticParams() {
  return getAllSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const service = getServiceBySlug(slug);
  if (!service) return { title: "Service Not Found | NeatCircle" };

  return {
    title: `${service.title} | NeatCircle`,
    description: service.tagline,
    openGraph: {
      title: `${service.title} | NeatCircle`,
      description: service.tagline,
      type: "website",
      url: `https://neatcircle.com/services/${service.slug}`,
    },
  };
}

/* ─── Icon helpers (pure SVG, no client JS) ────────────────────── */

function CheckIcon() {
  return (
    <svg
      className="w-5 h-5 text-cyan shrink-0 mt-0.5"
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

function ArrowLeftIcon() {
  return (
    <svg
      className="w-4 h-4"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18"
      />
    </svg>
  );
}

function ClockIcon() {
  return (
    <svg
      className="w-5 h-5 text-cyan shrink-0"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={1.5}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z"
      />
    </svg>
  );
}

function UserGroupIcon() {
  return (
    <svg
      className="w-6 h-6 text-cyan"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={1.5}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z"
      />
    </svg>
  );
}

function ChartIcon() {
  return (
    <svg
      className="w-5 h-5 text-white"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={1.5}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M2.25 18L9 11.25l4.306 4.307a11.95 11.95 0 015.814-5.519l2.74-1.22m0 0l-5.94-2.28m5.94 2.28l-2.28 5.941"
      />
    </svg>
  );
}

/* ─── Sub-components ───────────────────────────────────────────── */

function HeroSection({ service }: { service: ServiceData }) {
  return (
    <section className="relative bg-navy pt-28 pb-16 sm:pt-32 sm:pb-20">
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-96 h-96 rounded-full bg-cyan/5 blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 rounded-full bg-cyan/5 blur-3xl" />
      </div>
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <Link
          href="/services"
          className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-white transition-colors mb-8"
        >
          <ArrowLeftIcon />
          All Services
        </Link>

        {service.category === "blue-ocean" && service.marketSize && (
          <span className="inline-block text-xs font-semibold bg-cyan/15 text-cyan px-3 py-1 rounded-full mb-4">
            {service.marketSize} Market Opportunity
          </span>
        )}

        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-4 max-w-3xl">
          {service.title}
        </h1>
        <p className="text-lg sm:text-xl text-slate-300 max-w-2xl mb-6">
          {service.tagline}
        </p>
        <div className="flex flex-wrap items-center gap-4">
          <span className="text-2xl font-bold text-cyan">{service.price}</span>
          <span className="text-slate-400">|</span>
          <span className="flex items-center gap-2 text-slate-300">
            <ClockIcon />
            {service.timelineRange}
          </span>
        </div>
      </div>
    </section>
  );
}

function OverviewSection({ service }: { service: ServiceData }) {
  return (
    <section className="py-16 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl">
          <h2 className="text-2xl sm:text-3xl font-bold text-navy mb-6">
            Overview
          </h2>
          <p className="text-slate-600 text-lg leading-relaxed">
            {service.overview}
          </p>
          {service.tools && service.tools.length > 0 && (
            <div className="mt-6 flex flex-wrap gap-2">
              {service.tools.map((tool) => (
                <span
                  key={tool}
                  className="text-xs font-medium bg-slate-100 text-slate-600 px-3 py-1.5 rounded-full"
                >
                  {tool}
                </span>
              ))}
            </div>
          )}
        </div>

        {service.category === "blue-ocean" && service.roiCallout && (
          <div className="mt-10 bg-navy/5 border border-navy/10 rounded-xl p-6 flex items-start gap-4 max-w-3xl">
            <div className="w-10 h-10 rounded-lg bg-cyan flex items-center justify-center shrink-0">
              <ChartIcon />
            </div>
            <div>
              <p className="font-semibold text-navy mb-1">ROI Insight</p>
              <p className="text-slate-600 text-sm leading-relaxed">
                {service.roiCallout}
              </p>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

function DeliverablesSection({ service }: { service: ServiceData }) {
  return (
    <section className="py-16 bg-slate-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-2xl sm:text-3xl font-bold text-navy mb-8">
          What You Get
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {service.deliverables.map((item) => (
            <div key={item} className="flex items-start gap-3">
              <CheckIcon />
              <span className="text-slate-700">{item}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function FeaturesSection({ service }: { service: ServiceData }) {
  return (
    <section className="py-16 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-2xl sm:text-3xl font-bold text-navy mb-10">
          Key Features
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {service.features.map((feature) => (
            <div
              key={feature.title}
              className="border border-slate-200 rounded-xl p-6 hover:border-cyan/40 hover:shadow-md transition-all"
            >
              <h3 className="text-lg font-semibold text-navy mb-2">
                {feature.title}
              </h3>
              <p className="text-slate-500 text-sm leading-relaxed">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function TimelineSection({ service }: { service: ServiceData }) {
  return (
    <section className="py-16 bg-slate-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-2xl sm:text-3xl font-bold text-navy mb-2">
          Timeline & Process
        </h2>
        <p className="text-slate-500 mb-10">
          Typical engagement: {service.timelineRange}
        </p>
        <div className="relative">
          {/* Vertical connector */}
          <div className="absolute left-[19px] top-6 bottom-6 w-0.5 bg-cyan/20 hidden sm:block" />

          <div className="space-y-8">
            {service.timeline.map((step, i) => (
              <div key={step.phase} className="flex items-start gap-5">
                <div className="relative z-10 w-10 h-10 rounded-full bg-cyan/10 border-2 border-cyan flex items-center justify-center shrink-0">
                  <span className="text-xs font-bold text-cyan">{i + 1}</span>
                </div>
                <div>
                  <span className="text-xs font-semibold text-cyan uppercase tracking-wider">
                    {step.phase}
                  </span>
                  <h3 className="text-lg font-semibold text-navy mt-1">
                    {step.title}
                  </h3>
                  <p className="text-slate-500 text-sm mt-1 leading-relaxed">
                    {step.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function IdealClientSection({ service }: { service: ServiceData }) {
  return (
    <section className="py-16 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl">
          <div className="flex items-center gap-3 mb-6">
            <UserGroupIcon />
            <h2 className="text-2xl sm:text-3xl font-bold text-navy">
              Who This Is For
            </h2>
          </div>
          <p className="text-slate-600 text-lg leading-relaxed mb-6">
            {service.idealClient}
          </p>
          <div className="bg-slate-50 rounded-xl p-6">
            <p className="text-sm font-semibold text-navy mb-4">
              This service is perfect if you are:
            </p>
            <ul className="space-y-3">
              {service.idealClientDetails.map((detail) => (
                <li key={detail} className="flex items-start gap-3">
                  <CheckIcon />
                  <span className="text-slate-600 text-sm">{detail}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}

function PricingCard({ tier }: { tier: PricingTier }) {
  return (
    <div
      className={`rounded-xl p-6 flex flex-col ${
        tier.highlighted
          ? "bg-navy text-white ring-2 ring-cyan shadow-xl relative"
          : "bg-white border border-slate-200"
      }`}
    >
      {tier.highlighted && (
        <span className="absolute -top-3 left-1/2 -translate-x-1/2 text-xs font-semibold bg-cyan text-white px-3 py-1 rounded-full">
          Most Popular
        </span>
      )}
      <h3
        className={`text-lg font-semibold mb-1 ${
          tier.highlighted ? "text-white" : "text-navy"
        }`}
      >
        {tier.name}
      </h3>
      <p
        className={`text-2xl font-bold mb-2 ${
          tier.highlighted ? "text-cyan-light" : "text-cyan"
        }`}
      >
        {tier.price}
      </p>
      <p
        className={`text-sm mb-6 ${
          tier.highlighted ? "text-slate-300" : "text-slate-500"
        }`}
      >
        {tier.description}
      </p>
      <ul className="space-y-3 flex-1">
        {tier.features.map((feat) => (
          <li key={feat} className="flex items-start gap-2.5">
            <svg
              className={`w-4 h-4 shrink-0 mt-0.5 ${
                tier.highlighted ? "text-cyan-light" : "text-cyan"
              }`}
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
            <span
              className={`text-sm ${
                tier.highlighted ? "text-slate-200" : "text-slate-600"
              }`}
            >
              {feat}
            </span>
          </li>
        ))}
      </ul>
      <Link
        href="/#contact"
        className={`mt-6 block text-center text-sm font-semibold py-3 rounded-lg transition-colors ${
          tier.highlighted
            ? "bg-cyan hover:bg-cyan-dark text-white"
            : "bg-navy hover:bg-navy-light text-white"
        }`}
      >
        Get Started
      </Link>
    </div>
  );
}

function PricingSection({ service }: { service: ServiceData }) {
  return (
    <section className="py-16 bg-slate-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-10">
          <h2 className="text-2xl sm:text-3xl font-bold text-navy mb-3">
            Pricing
          </h2>
          <p className="text-slate-500 max-w-xl mx-auto">
            {service.category === "blue-ocean"
              ? "Setup fee plus ongoing monthly management. All plans include onboarding and training."
              : "Choose the package that fits your needs. All plans include documentation and training."}
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {service.pricingTiers.map((tier) => (
            <PricingCard key={tier.name} tier={tier} />
          ))}
        </div>
      </div>
    </section>
  );
}

function CtaSection() {
  return (
    <section className="py-16 bg-navy">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <h2 className="text-2xl sm:text-3xl font-bold text-white mb-4">
          Ready to Get Started?
        </h2>
        <p className="text-slate-300 mb-8 text-lg">
          Book a free discovery call to discuss your needs and get a custom
          proposal tailored to your business.
        </p>
        <Link
          href="/#contact"
          className="inline-block bg-cyan hover:bg-cyan-dark text-white font-semibold px-8 py-3.5 rounded-lg transition-colors text-lg"
        >
          Book a Discovery Call
        </Link>
      </div>
    </section>
  );
}

function FooterNav() {
  return (
    <footer className="bg-navy-dark py-8 border-t border-white/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
        <Link
          href="/"
          className="flex items-center gap-0 text-xl font-bold tracking-tight"
        >
          <span className="text-white">Neat</span>
          <span className="text-cyan">Circle</span>
        </Link>
        <div className="flex items-center gap-6">
          <Link
            href="/services"
            className="text-sm text-slate-400 hover:text-white transition-colors"
          >
            All Services
          </Link>
          <Link
            href="/#contact"
            className="text-sm text-slate-400 hover:text-white transition-colors"
          >
            Contact
          </Link>
        </div>
        <p className="text-xs text-slate-500">
          &copy; {new Date().getFullYear()} NeatCircle. All rights reserved.
        </p>
      </div>
    </footer>
  );
}

/* ─── Page component ───────────────────────────────────────────── */

export default async function ServicePage({ params }: PageProps) {
  const { slug } = await params;
  const service = getServiceBySlug(slug);
  if (!service) notFound();

  return (
    <main>
      <HeroSection service={service} />
      <OverviewSection service={service} />
      <DeliverablesSection service={service} />
      <FeaturesSection service={service} />
      <TimelineSection service={service} />
      <IdealClientSection service={service} />
      <PricingSection service={service} />
      <CtaSection />
      <FooterNav />
    </main>
  );
}
