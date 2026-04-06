import { Metadata } from "next";
import Link from "next/link";
import { getCoreServices, getBlueOceanServices, type ServiceData } from "@/lib/services";
import { siteConfig } from "@/lib/site-config";

export const metadata: Metadata = {
  title: `Services | ${siteConfig.brandName}`,
  description:
    `Explore ${siteConfig.brandName}'s business automation and optimization services. Core solutions and Blue Ocean niche opportunities for every industry.`,
  openGraph: {
    title: `Services | ${siteConfig.brandName}`,
    description:
      `Explore ${siteConfig.brandName}'s business automation and optimization services.`,
    type: "website",
    url: `${siteConfig.siteUrl}/services`,
  },
};

function ArrowRightIcon() {
  return (
    <svg
      className="w-4 h-4 transition-transform group-hover:translate-x-1"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3"
      />
    </svg>
  );
}

function CoreServiceCard({ service }: { service: ServiceData }) {
  return (
    <Link
      href={`/services/${service.slug}`}
      className="group border border-slate-200 rounded-xl p-6 hover:border-cyan/40 hover:shadow-lg transition-all flex flex-col"
    >
      <h3 className="text-lg font-semibold text-navy mb-1">{service.title}</h3>
      <p className="text-cyan font-semibold text-sm mb-3">{service.price}</p>
      <p className="text-slate-500 text-sm leading-relaxed flex-1">
        {service.tagline}
      </p>
      <div className="flex items-center gap-2 text-cyan text-sm font-medium mt-4">
        Learn more <ArrowRightIcon />
      </div>
    </Link>
  );
}

function BlueOceanCard({ service }: { service: ServiceData }) {
  return (
    <Link
      href={`/services/${service.slug}`}
      className="group bg-white border border-slate-200 rounded-xl p-6 hover:border-cyan/40 hover:shadow-lg transition-all flex flex-col"
    >
      <div className="flex items-start justify-between mb-3">
        <h3 className="text-lg font-semibold text-navy">{service.title}</h3>
        {service.marketSize && (
          <span className="text-xs font-semibold bg-cyan/10 text-cyan px-2.5 py-1 rounded-full shrink-0 ml-3">
            {service.marketSize}
          </span>
        )}
      </div>
      <p className="text-slate-500 text-sm leading-relaxed mb-4 flex-1">
        {service.tagline}
      </p>
      <div className="border-t border-slate-100 pt-3 mt-auto">
        <p className="text-cyan font-semibold text-sm mb-2">{service.price}</p>
        <div className="flex items-center gap-2 text-cyan text-sm font-medium">
          Learn more <ArrowRightIcon />
        </div>
      </div>
    </Link>
  );
}

export default function ServicesIndex() {
  const coreServices = getCoreServices();
  const blueOceanServices = getBlueOceanServices();

  return (
    <main>
      {/* Header */}
      <section className="bg-navy pt-28 pb-16 sm:pt-32 sm:pb-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm text-slate-600 hover:text-white transition-colors mb-8"
          >
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
            Home
          </Link>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-4">
            Our Services
          </h1>
          <p className="text-lg text-slate-300 max-w-2xl">
            16 proven solutions to automate operations, connect systems, and
            unlock growth. Choose a core service or explore our Blue Ocean niche
            opportunities.
          </p>
        </div>
      </section>

      {/* Core Services */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-10">
            <span className="text-cyan font-semibold text-sm uppercase tracking-wider">
              Foundation
            </span>
            <h2 className="text-2xl sm:text-3xl font-bold text-navy mt-2 mb-3">
              Core Services
            </h2>
            <p className="text-slate-500 max-w-2xl">
              End-to-end solutions that eliminate manual work, connect your
              systems, and accelerate growth.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {coreServices.map((svc) => (
              <CoreServiceCard key={svc.slug} service={svc} />
            ))}
          </div>
        </div>
      </section>

      {/* Blue Ocean Services */}
      <section className="py-16 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-10">
            <span className="text-cyan font-semibold text-sm uppercase tracking-wider">
              Blue Ocean Opportunities
            </span>
            <h2 className="text-2xl sm:text-3xl font-bold text-navy mt-2 mb-3">
              Untapped Markets. First-Mover Advantage.
            </h2>
            <p className="text-slate-500 max-w-2xl">
              Pre-built solutions for underserved industries with massive market
              potential.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {blueOceanServices.map((svc) => (
              <BlueOceanCard key={svc.slug} service={svc} />
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 bg-navy">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-2xl sm:text-3xl font-bold text-white mb-4">
            Not Sure Which Service You Need?
          </h2>
          <p className="text-slate-300 mb-8 text-lg">
            Book a free discovery call and we will recommend the right solution
            for your business.
          </p>
          <Link
            href="/#contact"
            className="inline-block bg-cyan hover:bg-cyan-dark text-white font-semibold px-8 py-3.5 rounded-lg transition-colors text-lg"
          >
            Book a Discovery Call
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-navy-dark py-8 border-t border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <Link
            href="/"
            className="flex items-center gap-0 text-xl font-bold tracking-tight"
          >
            <span className="text-white">{siteConfig.brandPrimary}</span>
            <span className="text-cyan">{siteConfig.brandAccent}</span>
          </Link>
          <div className="flex items-center gap-6">
            <Link
              href="/"
              className="text-sm text-slate-600 hover:text-white transition-colors"
            >
              Home
            </Link>
            <Link
              href="/#contact"
              className="text-sm text-slate-600 hover:text-white transition-colors"
            >
              Contact
            </Link>
          </div>
          <p className="text-xs text-slate-500">
            &copy; {new Date().getFullYear()} {siteConfig.brandName}. All rights reserved.
          </p>
        </div>
      </footer>
    </main>
  );
}
