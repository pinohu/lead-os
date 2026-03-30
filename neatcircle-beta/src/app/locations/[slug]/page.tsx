import { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { gmbProfiles, getGmbProfile } from "@/lib/gmb-profiles";
import { siteConfig } from "@/lib/site-config";

type PageProps = {
  params: Promise<{ slug: string }>;
};

export function generateStaticParams() {
  return gmbProfiles.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const profile = getGmbProfile(slug);
  if (!profile) return { title: `Location Not Found | ${siteConfig.brandName}` };

  return {
    title: `${profile.businessName} | ${profile.businessType} | ${siteConfig.brandName}`,
    description: profile.description,
    openGraph: {
      title: `${profile.businessName} | ${siteConfig.brandName}`,
      description: profile.description,
      type: "website",
      url: `${siteConfig.siteUrl}/locations/${profile.slug}`,
    },
  };
}

function CheckIcon() {
  return (
    <svg className="w-4 h-4 text-cyan shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
    </svg>
  );
}

export default async function LocationPage({ params }: PageProps) {
  const { slug } = await params;
  const profile = getGmbProfile(slug);
  if (!profile) notFound();

  const schema: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": profile.schemaType,
    name: profile.businessName,
    description: profile.description,
    url: `${siteConfig.siteUrl}/locations/${profile.slug}`,
    telephone: profile.phone,
    email: profile.email,
    areaServed: profile.serviceArea,
    openingHours: profile.hours,
    category: profile.gmbCategory,
    ...(profile.address
      ? {
          address: {
            "@type": "PostalAddress",
            streetAddress: profile.address.street,
            addressLocality: profile.address.city,
            addressRegion: profile.address.state,
            postalCode: profile.address.zip,
            addressCountry: profile.address.country,
          },
        }
      : {}),
    hasOfferCatalog: {
      "@type": "OfferCatalog",
      name: "Services",
      itemListElement: profile.services.map((s, i) => ({
        "@type": "Offer",
        itemOffered: { "@type": "Service", name: s },
        position: i + 1,
      })),
    },
    parentOrganization: {
      "@type": "Organization",
      name: siteConfig.brandName,
      url: siteConfig.siteUrl,
    },
  };

  return (
    <main className="min-h-screen bg-white">
      {/* Hero */}
      <section className="bg-gradient-to-b from-slate-900 to-slate-800 text-white py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <span className="inline-block px-3 py-1 mb-4 text-xs font-semibold uppercase tracking-wider bg-cyan/10 text-cyan rounded-full border border-cyan/20">
            {profile.gmbCategory}
          </span>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4">{profile.businessName}</h1>
          <p className="text-lg text-slate-300 max-w-2xl mx-auto mb-8">{profile.description}</p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link href="/#contact" className="bg-cyan hover:bg-cyan-dark text-white font-semibold px-8 py-3.5 rounded-lg transition-colors">
              Get Started
            </Link>
            <a href={`tel:${profile.phone.replace(/[^+\d]/g, "")}`} className="border border-white/20 hover:border-white/40 text-white font-semibold px-8 py-3.5 rounded-lg transition-colors">
              Call {profile.phone}
            </a>
          </div>
        </div>
      </section>

      {/* Business Info Grid */}
      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          <div className="border border-slate-200 rounded-xl p-6">
            <h3 className="font-semibold text-navy mb-2">Service Area</h3>
            <p className="text-slate-600 text-sm">{profile.serviceArea}</p>
          </div>
          <div className="border border-slate-200 rounded-xl p-6">
            <h3 className="font-semibold text-navy mb-2">Business Hours</h3>
            <p className="text-slate-600 text-sm">{profile.hours}</p>
          </div>
          <div className="border border-slate-200 rounded-xl p-6">
            <h3 className="font-semibold text-navy mb-2">Contact</h3>
            <p className="text-slate-600 text-sm">{profile.phone}</p>
            <p className="text-slate-600 text-sm">{profile.email}</p>
          </div>
        </div>
      </section>

      {/* Services */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-slate-50">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold text-navy mb-8">Our Services</h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {profile.services.map((service) => (
              <div key={service} className="flex items-start gap-2 bg-white border border-slate-200 rounded-lg px-4 py-3">
                <CheckIcon />
                <span className="text-sm text-slate-700">{service}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold text-navy mb-4">Business Categories</h2>
          <div className="flex flex-wrap gap-2">
            <span className="px-3 py-1 bg-cyan/10 text-cyan text-sm font-semibold rounded-full">{profile.gmbCategory}</span>
            {profile.gmbAdditionalCategories.map((cat) => (
              <span key={cat} className="px-3 py-1 bg-slate-100 text-slate-600 text-sm rounded-full">{cat}</span>
            ))}
          </div>
        </div>
      </section>

      {/* Citation Sources */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-slate-50">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold text-navy mb-4">Find Us On</h2>
          <div className="flex flex-wrap gap-3">
            {profile.citationSources.map((source) => (
              <span key={source} className="px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-700">
                {source}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* Cross-links */}
      <section className="py-12 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-xl font-bold text-navy mb-6">Explore More Resources</h2>
          <div className="flex flex-wrap justify-center gap-4">
            <Link href="/services" className="bg-white border border-slate-200 rounded-lg px-6 py-3 text-sm font-semibold text-navy hover:border-cyan/40 hover:shadow transition-all">
              View All Services →
            </Link>
            <Link href="/#contact" className="bg-cyan hover:bg-cyan-dark text-white rounded-lg px-6 py-3 text-sm font-semibold transition-colors">
              Get a Free Assessment →
            </Link>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-slate-900 text-white text-center">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-2xl sm:text-3xl font-bold mb-4">Ready to Get Started?</h2>
          <p className="text-slate-300 mb-8">Contact us today for a free consultation and see how we can help grow your business.</p>
          <Link href="/#contact" className="bg-cyan hover:bg-cyan-dark text-white font-semibold px-8 py-3.5 rounded-lg transition-colors">
            Contact Us
          </Link>
        </div>
      </section>

      {/* Schema.org JSON-LD */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
      />
    </main>
  );
}
