import Link from "next/link";
import { cityConfig } from "@/lib/city-config";
import { niches } from "@/lib/niches";

export default function CityHubPage() {
  const availableCount = niches.filter((n) => !n.subscriberSlug).length;

  return (
    <main>
      {/* ── Hero ─────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden">
        {/* Layered background */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(99,102,241,0.12),transparent_70%)]" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[800px] bg-[radial-gradient(circle,rgba(139,92,246,0.06)_0%,transparent_70%)]" />

        <div className="relative max-w-5xl mx-auto px-4 sm:px-6 pt-24 pb-20 text-center">
          {/* Status pill */}
          <div className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full bg-white border border-indigo-100 shadow-sm text-[0.8rem] font-medium text-indigo-700 mb-8">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500" />
            </span>
            {availableCount} of {niches.length} territories still available in {cityConfig.name}
          </div>

          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-gray-900 leading-[1.05]">
            Find trusted local
            <br />
            <span className="bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent">
              pros in {cityConfig.name}
            </span>
          </h1>

          <p className="mt-6 text-lg sm:text-xl text-gray-500 max-w-2xl mx-auto leading-relaxed">
            {niches.length} service categories. {cityConfig.serviceArea.length} communities.
            AI-powered lead scoring. One exclusive provider per niche.
          </p>

          <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="#services"
              className="group inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl bg-indigo-600 text-white font-semibold text-base hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200/50 hover:shadow-xl hover:shadow-indigo-200/50 hover:-translate-y-0.5"
            >
              Browse Services
              <svg className="w-4 h-4 transition-transform group-hover:translate-x-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" /></svg>
            </a>
            <a
              href="#pricing"
              className="inline-flex items-center justify-center px-8 py-4 rounded-xl bg-white text-gray-700 font-semibold text-base border border-gray-200 hover:border-gray-300 hover:bg-gray-50 transition-all hover:-translate-y-0.5"
            >
              List Your Business
            </a>
          </div>

          <div className="mt-6 flex flex-wrap justify-center gap-x-6 gap-y-1 text-sm text-gray-400">
            <span>No credit card required</span>
            <span className="hidden sm:inline">&middot;</span>
            <span>Free for consumers</span>
            <span className="hidden sm:inline">&middot;</span>
            <span>Exclusive territories</span>
          </div>
        </div>
      </section>

      {/* ── Trust bar ────────────────────────────────────────────── */}
      <section className="border-y border-gray-100 bg-gray-50/50">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 flex flex-wrap justify-center gap-x-12 gap-y-4">
          {[
            { icon: "📍", value: String(cityConfig.serviceArea.length), label: "Communities served" },
            { icon: "🏢", value: String(niches.length), label: "Service categories" },
            { icon: "🤖", value: "AI", label: "Lead scoring" },
            { icon: "🔒", value: "1 per niche", label: "Exclusive territory" },
          ].map(({ icon, value, label }) => (
            <div key={label} className="flex items-center gap-3">
              <span className="text-2xl">{icon}</span>
              <div>
                <div className="text-base font-bold text-gray-900">{value}</div>
                <div className="text-xs text-gray-500">{label}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Service grid ─────────────────────────────────────────── */}
      <section id="services" className="max-w-6xl mx-auto px-4 sm:px-6 py-24">
        <div className="text-center mb-16">
          <p className="text-sm font-semibold text-indigo-600 mb-3 tracking-wide">Local services</p>
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-gray-900">
            Every service your community needs
          </h2>
          <p className="mt-4 text-gray-500 max-w-lg mx-auto text-lg">
            Click any category to request a quote from the top provider in {cityConfig.name}.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {niches.map((niche) => (
            <Link
              key={niche.slug}
              href={`/${niche.slug}`}
              className="group relative flex flex-col p-6 rounded-2xl bg-white border border-gray-100 hover:border-indigo-200 transition-all duration-300 hover:shadow-xl hover:shadow-indigo-50/50 hover:-translate-y-1"
            >
              <div className="flex items-start justify-between mb-4">
                <span className="text-4xl">{niche.icon}</span>
                {!niche.subscriberSlug && niche.exclusiveAvailable && (
                  <span className="text-[0.65rem] font-bold text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-full uppercase tracking-wider">
                    Available
                  </span>
                )}
              </div>
              <h3 className="font-bold text-gray-900 text-lg group-hover:text-indigo-600 transition-colors">
                {niche.label}
              </h3>
              <p className="mt-2 text-sm text-gray-500 leading-relaxed flex-1">
                {niche.description}
              </p>
              <div className="mt-4 pt-4 border-t border-gray-50 flex items-center justify-between">
                <span className="text-xs font-medium text-gray-400">{niche.avgProjectValue}</span>
                <span className="text-xs font-semibold text-indigo-600 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
                  View
                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" /></svg>
                </span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* ── How it works ─────────────────────────────────────────── */}
      <section id="how-it-works" className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-gray-900 to-gray-950" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_50%_at_50%_0%,rgba(99,102,241,0.15),transparent_70%)]" />

        <div className="relative max-w-5xl mx-auto px-4 sm:px-6 py-24">
          <div className="text-center mb-16">
            <p className="text-sm font-semibold text-indigo-400 mb-3 tracking-wide">For local businesses</p>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-white">
              Own your category in {cityConfig.name}
            </h2>
            <p className="mt-4 text-gray-400 max-w-xl mx-auto text-lg">
              One subscriber per category. Every lead in your niche goes to you — exclusively.
              No bidding. No sharing. No competition.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                step: "1",
                title: "Claim your category",
                desc: `Choose your service — plumbing, HVAC, dental, legal — in ${cityConfig.name}. If it's unclaimed, it's yours.`,
                gradient: "from-indigo-500 to-violet-500",
              },
              {
                step: "2",
                title: "We build your page",
                desc: "Your branded landing page goes live instantly. AI-powered lead capture, scoring, and nurture start working for you 24/7.",
                gradient: "from-violet-500 to-purple-500",
              },
              {
                step: "3",
                title: "Exclusive leads flow in",
                desc: `Every person searching for your service in ${cityConfig.name} finds your page. Leads go to you — and only you.`,
                gradient: "from-purple-500 to-pink-500",
              },
            ].map(({ step, title, desc, gradient }) => (
              <div key={step} className="relative bg-white/[0.04] backdrop-blur-sm rounded-2xl border border-white/[0.06] p-8 hover:bg-white/[0.07] transition-colors">
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center text-white font-bold text-lg mb-6 shadow-lg`}>
                  {step}
                </div>
                <h3 className="font-bold text-white text-xl mb-3">{title}</h3>
                <p className="text-gray-400 leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Pricing ──────────────────────────────────────────────── */}
      <section id="pricing" className="max-w-6xl mx-auto px-4 sm:px-6 py-24">
        <div className="text-center mb-16">
          <p className="text-sm font-semibold text-indigo-600 mb-3 tracking-wide">Simple pricing</p>
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-gray-900">
            Own your territory
          </h2>
          <p className="mt-4 text-gray-500 max-w-lg mx-auto text-lg">
            One fixed monthly fee. All leads in your category go exclusively to you.
            Cancel anytime.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {niches.map((niche) => (
            <div
              key={niche.slug}
              className="group rounded-2xl border border-gray-100 bg-white p-7 hover:border-indigo-200 transition-all duration-300 hover:shadow-xl hover:shadow-indigo-50/50 hover:-translate-y-1 flex flex-col"
            >
              <div className="flex items-center gap-3 mb-5">
                <span className="text-3xl">{niche.icon}</span>
                <div>
                  <h3 className="font-bold text-gray-900">{niche.label}</h3>
                  <p className="text-xs text-gray-400">{cityConfig.name}, {cityConfig.stateCode} — Exclusive</p>
                </div>
              </div>

              <div className="mb-5">
                <span className="text-4xl font-extrabold tracking-tight text-gray-900">${niche.monthlyFee}</span>
                <span className="text-gray-400 text-sm ml-1">/month</span>
              </div>

              <ul className="space-y-3 mb-7 flex-1">
                {[
                  `All ${niche.label.toLowerCase()} leads in ${cityConfig.name}`,
                  "Branded landing page",
                  "AI-powered lead scoring",
                  "7-stage email nurture sequence",
                  "Monthly performance report",
                ].map((feature) => (
                  <li key={feature} className="flex items-start gap-2.5 text-sm text-gray-600">
                    <svg className="w-4 h-4 text-indigo-500 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>
                    {feature}
                  </li>
                ))}
              </ul>

              {niche.subscriberSlug ? (
                <div className="text-center py-3 rounded-xl bg-gray-50 text-gray-400 text-sm font-medium">
                  Territory claimed
                </div>
              ) : (
                <Link
                  href={`/${niche.slug}`}
                  className="block text-center py-3 rounded-xl bg-indigo-600 text-white font-semibold hover:bg-indigo-700 transition-colors shadow-sm shadow-indigo-200/50"
                >
                  Claim {niche.label} →
                </Link>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* ── Urgency + trust ──────────────────────────────────────── */}
      <section className="bg-gray-50 border-y border-gray-100">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-20">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <p className="text-sm font-semibold text-indigo-600 mb-3 tracking-wide">Why act now</p>
              <h2 className="text-3xl font-bold tracking-tight text-gray-900 mb-4">
                Only one provider per category
              </h2>
              <p className="text-gray-500 leading-relaxed mb-6">
                When a competitor claims your niche, that territory is off the market.
                Every lead in that category goes to them — not you. The first to claim wins.
              </p>
              <ul className="space-y-3">
                {[
                  "Exclusive leads — no sharing, no bidding",
                  "Your branded page ranks for local searches",
                  "AI nurture converts leads while you sleep",
                  "Cancel anytime — no contracts, no lock-in",
                ].map((point) => (
                  <li key={point} className="flex items-start gap-3 text-sm text-gray-600">
                    <svg className="w-5 h-5 text-indigo-500 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    {point}
                  </li>
                ))}
              </ul>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {[
                { value: `${availableCount}`, label: "Territories still open", color: "text-indigo-600" },
                { value: "$0", label: "For consumers to use", color: "text-green-600" },
                { value: "24/7", label: "AI lead capture", color: "text-violet-600" },
                { value: "100%", label: "Leads go to you", color: "text-indigo-600" },
              ].map(({ value, label, color }) => (
                <div key={label} className="bg-white rounded-2xl border border-gray-100 p-6 text-center">
                  <div className={`text-3xl font-extrabold ${color}`}>{value}</div>
                  <div className="text-xs text-gray-500 mt-1">{label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Final CTA ────────────────────────────────────────────── */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-600 via-violet-600 to-purple-700" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_50%_80%_at_50%_-20%,rgba(255,255,255,0.1),transparent_60%)]" />

        <div className="relative max-w-3xl mx-auto px-4 sm:px-6 py-20 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-white tracking-tight">
            Be the only {cityConfig.name} provider
            <br className="hidden sm:block" /> your customers find
          </h2>
          <p className="mt-4 text-indigo-200 max-w-lg mx-auto text-lg">
            Lock in your category before a competitor does.
            One provider per niche. First come, first served.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="#pricing"
              className="inline-flex items-center justify-center px-8 py-4 rounded-xl bg-white text-indigo-600 font-semibold text-base hover:bg-indigo-50 transition-colors shadow-lg"
            >
              Claim Your Territory
            </a>
            <a
              href="#services"
              className="inline-flex items-center justify-center px-8 py-4 rounded-xl bg-white/10 text-white font-semibold text-base border border-white/20 hover:bg-white/20 transition-colors"
            >
              Browse Categories
            </a>
          </div>
        </div>
      </section>

      {/* ── Schema.org ───────────────────────────────────────────── */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "WebSite",
            name: `${cityConfig.name} Local Business Directory`,
            url: `https://${cityConfig.domain}`,
            description: `Find trusted local service providers in ${cityConfig.name}, ${cityConfig.state}. ${niches.length} categories with exclusive territory rights.`,
            areaServed: {
              "@type": "City",
              name: cityConfig.name,
              containedInPlace: { "@type": "State", name: cityConfig.state },
            },
          }),
        }}
      />
    </main>
  );
}
