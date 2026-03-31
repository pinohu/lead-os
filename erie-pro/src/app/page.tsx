import Link from "next/link";
import { cityConfig } from "@/lib/city-config";
import { niches } from "@/lib/niches";

export default function CityHubPage() {
  return (
    <main>
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-50 via-white to-purple-50" />
        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 pt-20 pb-16 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-600 text-xs font-semibold mb-6">
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
            {cityConfig.name}, {cityConfig.stateCode} — {cityConfig.serviceArea.length} communities served
          </div>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-gray-900 max-w-3xl mx-auto leading-[1.1]">
            Find trusted local pros in{" "}
            <span className="text-indigo-600">{cityConfig.name}</span>
          </h1>
          <p className="mt-5 text-lg text-gray-500 max-w-xl mx-auto leading-relaxed">
            Verified service providers across {niches.length} categories. Get instant quotes, read reviews, and hire with confidence.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
            <a href="#services" className="px-8 py-3.5 rounded-lg bg-indigo-600 text-white font-semibold hover:bg-indigo-700 transition-colors shadow-sm shadow-indigo-200">
              Browse Services
            </a>
            <a href="#pricing" className="px-8 py-3.5 rounded-lg bg-white text-gray-700 font-semibold border border-gray-200 hover:border-gray-300 hover:bg-gray-50 transition-all">
              List Your Business
            </a>
          </div>
          <p className="mt-4 text-xs text-gray-400">
            Serving {cityConfig.serviceArea.join(", ")}
          </p>
        </div>
      </section>

      {/* Stats */}
      <section className="border-y border-gray-100 py-10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 flex flex-wrap justify-center gap-x-16 gap-y-6">
          {[
            { value: String(niches.length), label: "Service categories" },
            { value: String(cityConfig.serviceArea.length), label: "Communities" },
            { value: "AI-powered", label: "Lead scoring" },
            { value: "Exclusive", label: "Territory rights" },
          ].map(({ value, label }) => (
            <div key={label} className="text-center">
              <div className="text-2xl font-bold text-gray-900">{value}</div>
              <div className="text-sm text-gray-500 mt-1">{label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Service Grid */}
      <section id="services" className="max-w-6xl mx-auto px-4 sm:px-6 py-20">
        <div className="text-center mb-12">
          <p className="text-sm font-semibold text-indigo-600 mb-2">Local services</p>
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">Every service your community needs</h2>
          <p className="mt-3 text-gray-500 max-w-lg mx-auto">
            Click any category to see available providers in {cityConfig.name} and request a quote.
          </p>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {niches.map((niche) => (
            <Link
              key={niche.slug}
              href={`/${niche.slug}`}
              className="group relative flex flex-col p-5 rounded-xl border border-gray-100 hover:border-indigo-200 hover:shadow-lg hover:shadow-indigo-50 transition-all"
            >
              <div className="text-3xl mb-3">{niche.icon}</div>
              <h3 className="font-semibold text-gray-900 group-hover:text-indigo-600 transition-colors">{niche.label}</h3>
              <p className="mt-1 text-sm text-gray-500 flex-1">{niche.description}</p>
              <div className="mt-3 flex items-center justify-between">
                <span className="text-xs text-gray-400">{niche.avgProjectValue}</span>
                {niche.subscriberSlug ? (
                  <span className="text-xs font-medium text-green-600 bg-green-50 px-2 py-0.5 rounded-full">Provider available</span>
                ) : niche.exclusiveAvailable ? (
                  <span className="text-xs font-medium text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full">Claim territory</span>
                ) : null}
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* How It Works (for service providers) */}
      <section id="how-it-works" className="bg-gray-50 py-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-12">
            <p className="text-sm font-semibold text-indigo-600 mb-2">For local businesses</p>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">Own your category in {cityConfig.name}</h2>
            <p className="mt-3 text-gray-500 max-w-lg mx-auto">
              One subscriber per category. Every lead in your niche goes to you — exclusively.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { step: "1", title: "Claim your category", desc: `Choose your service (plumbing, HVAC, dental, etc.) in ${cityConfig.name}. If nobody else has claimed it, it's yours.` },
              { step: "2", title: "We build your page", desc: "Your branded landing page goes live at [niche].erie.pro/[your-business]. AI-powered lead capture starts immediately." },
              { step: "3", title: "Exclusive leads flow in", desc: `Every lead searching for your service in ${cityConfig.name} comes to you — and only you. No bidding. No sharing.` },
            ].map(({ step, title, desc }) => (
              <div key={step} className="bg-white rounded-xl p-6 border border-gray-100">
                <div className="w-10 h-10 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold text-sm mb-4">{step}</div>
                <h3 className="font-semibold text-lg mb-2">{title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="max-w-6xl mx-auto px-4 sm:px-6 py-20">
        <div className="text-center mb-12">
          <p className="text-sm font-semibold text-indigo-600 mb-2">Simple pricing</p>
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">Own your territory</h2>
          <p className="mt-3 text-gray-500 max-w-lg mx-auto">
            One fixed monthly fee. All leads in your category go exclusively to you.
          </p>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {niches.slice(0, 6).map((niche) => (
            <div key={niche.slug} className="rounded-xl border border-gray-100 p-6 hover:border-indigo-200 hover:shadow-lg transition-all">
              <div className="flex items-center gap-3 mb-4">
                <span className="text-2xl">{niche.icon}</span>
                <div>
                  <h3 className="font-semibold">{niche.label}</h3>
                  <p className="text-xs text-gray-400">{cityConfig.name}, {cityConfig.stateCode}</p>
                </div>
              </div>
              <div className="mb-4">
                <span className="text-3xl font-bold">${niche.monthlyFee}</span>
                <span className="text-gray-400 text-sm">/month</span>
              </div>
              <ul className="space-y-2 mb-6 text-sm text-gray-600">
                <li className="flex items-start gap-2"><span className="text-green-500 mt-0.5">&#10003;</span> Exclusive leads in {cityConfig.name}</li>
                <li className="flex items-start gap-2"><span className="text-green-500 mt-0.5">&#10003;</span> Branded landing page</li>
                <li className="flex items-start gap-2"><span className="text-green-500 mt-0.5">&#10003;</span> AI-powered lead scoring</li>
                <li className="flex items-start gap-2"><span className="text-green-500 mt-0.5">&#10003;</span> 7-stage nurture sequence</li>
                <li className="flex items-start gap-2"><span className="text-green-500 mt-0.5">&#10003;</span> Monthly performance report</li>
              </ul>
              {niche.subscriberSlug ? (
                <div className="text-center py-2 rounded-lg bg-gray-50 text-gray-400 text-sm font-medium">Territory claimed</div>
              ) : (
                <a href={`/${niche.slug}`} className="block text-center py-2.5 rounded-lg bg-indigo-600 text-white font-semibold hover:bg-indigo-700 transition-colors">
                  Claim {niche.label} territory
                </a>
              )}
            </div>
          ))}
        </div>
        <div className="mt-8 text-center">
          <a href="#services" className="text-sm text-indigo-600 font-medium hover:text-indigo-700">
            See all {niches.length} categories &rarr;
          </a>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-indigo-600 py-16">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 text-center">
          <h2 className="text-3xl font-bold text-white">Be the only {cityConfig.name} provider your customers find</h2>
          <p className="mt-3 text-indigo-200 max-w-lg mx-auto">
            Lock in your category before a competitor does. One provider per niche. First come, first served.
          </p>
          <div className="mt-8">
            <a href="/contact" className="inline-flex px-8 py-3.5 rounded-lg bg-white text-indigo-600 font-semibold hover:bg-indigo-50 transition-colors">
              Get Listed Today
            </a>
          </div>
        </div>
      </section>

      {/* Schema.org */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
        "@context": "https://schema.org",
        "@type": "WebSite",
        name: `${cityConfig.name} Local Business Directory`,
        url: `https://${cityConfig.domain}`,
        description: `Find trusted local service providers in ${cityConfig.name}, ${cityConfig.state}`,
        areaServed: {
          "@type": "City",
          name: cityConfig.name,
          containedInPlace: { "@type": "State", name: cityConfig.state },
        },
      })}} />
    </main>
  );
}
