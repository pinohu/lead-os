import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { cityConfig } from "@/lib/city-config";
import { getNicheBySlug } from "@/lib/niches";

type Props = { params: Promise<{ niche: string; provider: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { niche: nicheSlug, provider } = await params;
  const niche = getNicheBySlug(nicheSlug);
  if (!niche) return { title: "Not Found" };
  const providerName = provider.replace(/-/g, " ").replace(/\b\w/g, c => c.toUpperCase());
  return {
    title: `${providerName} — ${niche.label} in ${cityConfig.name}, ${cityConfig.stateCode}`,
    description: `${providerName} provides ${niche.label.toLowerCase()} services in ${cityConfig.name}, ${cityConfig.state}. ${niche.description}. Get a free quote today.`,
  };
}

export default async function ProviderPage({ params }: Props) {
  const { niche: nicheSlug, provider: providerSlug } = await params;
  const niche = getNicheBySlug(nicheSlug);
  if (!niche) notFound();

  const providerName = providerSlug.replace(/-/g, " ").replace(/\b\w/g, c => c.toUpperCase());

  return (
    <main>
      {/* Hero */}
      <section className="bg-gradient-to-br from-indigo-50 via-white to-purple-50 pt-16 pb-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-green-50 border border-green-200 text-green-700 text-xs font-semibold mb-4">
            <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
            Verified {cityConfig.name} Provider
          </div>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-gray-900">
            {providerName}
          </h1>
          <p className="mt-2 text-lg text-gray-500">
            {niche.icon} {niche.label} in {cityConfig.name}, {cityConfig.stateCode}
          </p>
          <p className="mt-4 text-gray-500 max-w-xl mx-auto">
            {niche.description}. Serving {cityConfig.serviceArea.slice(0, 5).join(", ")} and surrounding areas.
          </p>
          <div className="mt-6">
            <a href="#contact" className="px-8 py-3.5 rounded-lg bg-indigo-600 text-white font-semibold hover:bg-indigo-700 transition-colors shadow-sm shadow-indigo-200">
              Request a Free Quote from {providerName}
            </a>
          </div>
        </div>
      </section>

      {/* Provider Info */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 py-16">
        <div className="grid md:grid-cols-3 gap-6">
          <div className="bg-white rounded-xl border border-gray-100 p-6">
            <h3 className="font-semibold mb-2">Service Area</h3>
            <p className="text-sm text-gray-500">{cityConfig.serviceArea.join(", ")}</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-100 p-6">
            <h3 className="font-semibold mb-2">Category</h3>
            <p className="text-sm text-gray-500">{niche.label} — {niche.description}</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-100 p-6">
            <h3 className="font-semibold mb-2">Project Range</h3>
            <p className="text-sm text-gray-500">{niche.avgProjectValue}</p>
          </div>
        </div>
      </section>

      {/* Contact Form */}
      <section id="contact" className="max-w-2xl mx-auto px-4 sm:px-6 py-16">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-lg p-8">
          <h2 className="text-2xl font-bold mb-2">Contact {providerName}</h2>
          <p className="text-gray-500 text-sm mb-6">Send your request directly to {providerName} in {cityConfig.name}.</p>
          <form className="space-y-4">
            <input type="hidden" name="niche" value={niche.slug} />
            <input type="hidden" name="provider" value={providerSlug} />
            <input type="hidden" name="city" value={cityConfig.slug} />
            <div className="grid sm:grid-cols-2 gap-4">
              <input type="text" name="firstName" required placeholder="First name" className="px-4 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500" />
              <input type="tel" name="phone" required placeholder="Phone" className="px-4 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500" />
            </div>
            <input type="email" name="email" required placeholder="Email" className="w-full px-4 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500" />
            <textarea name="message" rows={3} placeholder="What do you need?" className="w-full px-4 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 resize-none" />
            <button type="submit" className="w-full py-3 rounded-lg bg-indigo-600 text-white font-semibold hover:bg-indigo-700 transition-colors">
              Send Request to {providerName}
            </button>
          </form>
        </div>
      </section>

      {/* Schema.org */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
        "@context": "https://schema.org",
        "@type": "LocalBusiness",
        name: providerName,
        description: `${niche.label} services in ${cityConfig.name}, ${cityConfig.state}`,
        url: `https://${cityConfig.domain}/${niche.slug}/${providerSlug}`,
        areaServed: cityConfig.serviceArea.map(area => ({ "@type": "City", name: area })),
        makesOffer: {
          "@type": "Offer",
          itemOffered: { "@type": "Service", name: niche.label, description: niche.description },
        },
      })}} />
    </main>
  );
}
