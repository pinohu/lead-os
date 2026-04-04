import Link from "next/link";

const tiers = [
  {
    name: "Starter",
    setup: "$3,500",
    monthly: "$500/mo",
    audience: "For small businesses",
    featured: false,
    features: [
      "Client portal (your brand & domain)",
      "CRM setup & contact migration",
      "Up to 3 workflow automations",
      "Invoicing & payment processing",
      "Email & calendar integration",
      "Basic reporting dashboard",
      "30-day onboarding support",
      "209+ tools included",
    ],
  },
  {
    name: "Professional",
    setup: "$7,500",
    monthly: "$1,200/mo",
    audience: "For growing companies",
    featured: true,
    features: [
      "Everything in Starter, plus:",
      "Advanced portal customization",
      "Up to 10 workflow automations",
      "LMS / training platform",
      "Project management suite",
      "Multi-pipeline CRM",
      "Advanced analytics & KPIs",
      "Quarterly optimization reviews",
      "Priority support",
    ],
  },
  {
    name: "Enterprise",
    setup: "$15,000+",
    monthly: "$2,500/mo",
    audience: "For complex organizations",
    featured: false,
    features: [
      "Everything in Professional, plus:",
      "Unlimited workflow automations",
      "Custom API integrations",
      "Multi-location / franchise support",
      "Compliance training platform",
      "Dedicated account manager",
      "Custom reporting & BI dashboards",
      "Monthly strategy sessions",
      "SLA-backed uptime guarantee",
    ],
  },
];

export default function Pricing() {
  return (
    <section
      id="pricing"
      className="py-20 bg-gradient-to-b from-navy-dark via-navy to-navy-light"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-14">
          <span className="text-cyan font-semibold text-sm uppercase tracking-wider">
            Transparent Pricing
          </span>
          <h2 className="text-3xl sm:text-4xl font-bold text-white mt-3 mb-4">
            Simple, Predictable Investment
          </h2>
          <p className="text-slate-300 max-w-2xl mx-auto text-lg">
            All plans include our full $2.1M software portfolio. No hidden fees.
            No surprise licensing costs. 30-day money-back guarantee on setup.
          </p>
        </div>

        {/* Tiers */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {tiers.map((tier) => (
            <div
              key={tier.name}
              className={`rounded-xl p-7 flex flex-col ${
                tier.featured
                  ? "bg-white ring-2 ring-cyan shadow-2xl scale-[1.03]"
                  : "bg-white/5 border border-white/10"
              }`}
            >
              {tier.featured && (
                <div className="text-center mb-3">
                  <span className="bg-cyan text-white text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                    Most Popular
                  </span>
                </div>
              )}
              <h3
                className={`text-xl font-bold mb-1 ${
                  tier.featured ? "text-navy" : "text-white"
                }`}
              >
                {tier.name}
              </h3>
              <p
                className={`text-sm mb-4 ${
                  tier.featured ? "text-slate-500" : "text-slate-400"
                }`}
              >
                {tier.audience}
              </p>

              <div className="mb-6">
                <div
                  className={`text-3xl font-bold ${
                    tier.featured ? "text-navy" : "text-white"
                  }`}
                >
                  {tier.setup}
                  <span
                    className={`text-sm font-normal ml-1 ${
                      tier.featured ? "text-slate-500" : "text-slate-400"
                    }`}
                  >
                    setup
                  </span>
                </div>
                <div
                  className={`text-lg font-semibold mt-1 ${
                    tier.featured ? "text-cyan-dark" : "text-cyan"
                  }`}
                >
                  {tier.monthly}
                </div>
              </div>

              <ul className="space-y-3 mb-8 flex-1">
                {tier.features.map((f) => (
                  <li key={f} className="flex items-start gap-2.5">
                    <svg
                      className={`w-5 h-5 mt-0.5 shrink-0 ${
                        tier.featured ? "text-cyan" : "text-cyan"
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
                        tier.featured ? "text-slate-600" : "text-slate-300"
                      }`}
                    >
                      {f}
                    </span>
                  </li>
                ))}
              </ul>

              <a
                href="#contact"
                className={`block text-center font-semibold py-3 rounded-lg transition-colors ${
                  tier.featured
                    ? "bg-cyan hover:bg-cyan-dark text-white"
                    : "border border-white/30 hover:border-white/60 text-white"
                }`}
              >
                Get Started
              </a>
            </div>
          ))}
        </div>

        {/* ROI CTA */}
        <div className="mt-10 text-center">
          <p className="text-slate-300 text-sm mb-3">Not sure which plan fits?</p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <a
              href="/calculator"
              className="inline-block bg-cyan/20 hover:bg-cyan/30 text-cyan font-semibold px-6 py-2.5 rounded-lg transition-colors text-sm"
            >
              Calculate Your ROI
            </a>
            <Link
              href="/assess/general"
              className="inline-block border border-white/20 hover:border-white/40 text-white font-semibold px-6 py-2.5 rounded-lg transition-colors text-sm"
            >
              Take Free Assessment
            </Link>
          </div>
        </div>

        {/* Note */}
        <p className="text-center text-slate-400 text-sm mt-6">
          Industry-specific packages available. Custom scoping for complex
          requirements.{" "}
          <a href="#contact" className="text-cyan hover:underline">
            Contact us
          </a>{" "}
          for a tailored proposal.
        </p>
      </div>
    </section>
  );
}
