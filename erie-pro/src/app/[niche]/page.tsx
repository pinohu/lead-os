import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { cityConfig } from "@/lib/city-config";
import { niches, getNicheBySlug } from "@/lib/niches";

type Props = { params: Promise<{ niche: string }> };

export function generateStaticParams() {
  return niches.map(n => ({ niche: n.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { niche: slug } = await params;
  const niche = getNicheBySlug(slug);
  if (!niche) return { title: "Not Found" };
  return {
    title: `${niche.label} in ${cityConfig.name}, ${cityConfig.stateCode} — Get a Free Quote`,
    description: `Find the best ${niche.label.toLowerCase()} services in ${cityConfig.name}, ${cityConfig.state}. ${niche.description}. Get a free quote today.`,
  };
}

export default async function NichePage({ params }: Props) {
  const { niche: slug } = await params;
  const niche = getNicheBySlug(slug);
  if (!niche) notFound();

  return (
    <main>
      {/* Hero */}
      <section className="bg-gradient-to-br from-indigo-50 via-white to-purple-50 pt-16 pb-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center">
          <div className="text-5xl mb-4">{niche.icon}</div>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-gray-900">
            {niche.label} in {cityConfig.name}, {cityConfig.stateCode}
          </h1>
          <p className="mt-4 text-lg text-gray-500 max-w-xl mx-auto">
            {niche.description}. Serving {cityConfig.serviceArea.slice(0, 5).join(", ")} and surrounding areas.
          </p>
          <div className="mt-6 flex gap-3 justify-center">
            <a href="#quote" className="px-8 py-3.5 rounded-lg bg-indigo-600 text-white font-semibold hover:bg-indigo-700 transition-colors shadow-sm shadow-indigo-200">
              Get a Free Quote
            </a>
            {!niche.subscriberSlug && (
              <a href="#claim" className="px-8 py-3.5 rounded-lg bg-white text-gray-700 font-semibold border border-gray-200 hover:border-gray-300 transition-all">
                Claim This Territory
              </a>
            )}
          </div>
        </div>
      </section>

      {/* Quote Form */}
      <section id="quote" className="max-w-2xl mx-auto px-4 sm:px-6 py-16">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-lg p-8">
          <h2 className="text-2xl font-bold mb-2">Get a free {niche.label.toLowerCase()} quote</h2>
          <p className="text-gray-500 text-sm mb-6">Tell us what you need. We&apos;ll connect you with the best {niche.label.toLowerCase()} provider in {cityConfig.name}.</p>
          <form className="space-y-4" action="/api/lead" method="POST">
            <input type="hidden" name="niche" value={niche.slug} />
            <input type="hidden" name="city" value={cityConfig.slug} />
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">First name</label>
                <input type="text" name="firstName" required className="w-full px-4 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500" placeholder="John" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Last name</label>
                <input type="text" name="lastName" className="w-full px-4 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500" placeholder="Smith" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
              <input type="tel" name="phone" required className="w-full px-4 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500" placeholder="(814) 555-1234" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input type="email" name="email" required className="w-full px-4 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500" placeholder="john@example.com" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">What do you need?</label>
              <textarea name="message" rows={3} className="w-full px-4 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 resize-none" placeholder={`Describe your ${niche.label.toLowerCase()} needs...`} />
            </div>
            <button type="submit" className="w-full py-3 rounded-lg bg-indigo-600 text-white font-semibold hover:bg-indigo-700 transition-colors">
              Get My Free Quote
            </button>
            <p className="text-xs text-gray-400 text-center">No obligation. Your info goes only to verified {cityConfig.name} providers.</p>
          </form>
        </div>
      </section>

      {/* Claim Territory */}
      {!niche.subscriberSlug && (
        <section id="claim" className="bg-gray-50 py-16">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 text-center">
            <p className="text-sm font-semibold text-indigo-600 mb-2">For {niche.label.toLowerCase()} businesses</p>
            <h2 className="text-3xl font-bold">Own {niche.label} in {cityConfig.name}</h2>
            <p className="mt-3 text-gray-500 max-w-lg mx-auto">
              Be the exclusive {niche.label.toLowerCase()} provider on {cityConfig.domain}. Every lead in this category goes to you — and only you.
            </p>
            <div className="mt-6 inline-flex items-baseline gap-1">
              <span className="text-4xl font-bold">${niche.monthlyFee}</span>
              <span className="text-gray-400">/month</span>
            </div>
            <div className="mt-6">
              <a href="/contact" className="inline-flex px-8 py-3.5 rounded-lg bg-indigo-600 text-white font-semibold hover:bg-indigo-700 transition-colors">
                Claim This Territory
              </a>
            </div>
          </div>
        </section>
      )}

      {/* Other Services */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 py-16">
        <h2 className="text-xl font-bold mb-6">Other services in {cityConfig.name}</h2>
        <div className="flex flex-wrap gap-2">
          {niches.filter(n => n.slug !== niche.slug).map(n => (
            <Link key={n.slug} href={`/${n.slug}`} className="px-4 py-2 rounded-full border border-gray-100 text-sm text-gray-600 hover:border-indigo-200 hover:text-indigo-600 transition-all">
              {n.icon} {n.label}
            </Link>
          ))}
        </div>
      </section>
    </main>
  );
}
