import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Pricing",
  description:
    "Lead OS pricing plans. Choose the right tier for your lead generation needs, from starter to enterprise.",
};

const plans = [
  {
    name: "Starter",
    price: "$99",
    period: "/mo",
    description: "For solo operators getting started with lead generation.",
    features: [
      "100 leads/month",
      "5 funnel configurations",
      "3 integrations",
      "Email nurturing",
      "Basic scoring",
      "Operator dashboard",
      "Email support",
    ],
    cta: "Get Started",
    href: "/onboard?plan=starter",
    highlighted: false,
  },
  {
    name: "Growth",
    price: "$249",
    period: "/mo",
    description: "For growing agencies managing multiple niches.",
    features: [
      "500 leads/month",
      "15 funnel configurations",
      "10 integrations",
      "Multi-channel nurturing",
      "AI-powered scoring",
      "A/B experiment engine",
      "AI content generation",
      "Priority support",
    ],
    cta: "Get Started",
    href: "/onboard?plan=growth",
    highlighted: true,
  },
  {
    name: "Professional",
    price: "$499",
    period: "/mo",
    description: "For established agencies and white-label SaaS operators.",
    features: [
      "2,000 leads/month",
      "Unlimited funnels",
      "All 110+ integrations",
      "Multi-tenant management",
      "Lead marketplace access",
      "AI agent teams",
      "Custom branding",
      "API access",
      "Dedicated support",
    ],
    cta: "Get Started",
    href: "/onboard?plan=professional",
    highlighted: false,
  },
  {
    name: "Enterprise",
    price: "Custom",
    period: "",
    description: "For large-scale operations with custom requirements.",
    features: [
      "Unlimited leads",
      "Custom implementation",
      "Dedicated infrastructure",
      "SLA guarantee (99.9%)",
      "On-premise option",
      "Custom integrations",
      "Dedicated account manager",
      "Phone + Slack support",
    ],
    cta: "Contact Sales",
    href: "/contact?inquiry=enterprise",
    highlighted: false,
  },
];

export default function PricingPage() {
  return (
    <main id="main-content" style={{ maxWidth: "76rem", margin: "0 auto", padding: "3rem 1rem" }}>
      <div style={{ textAlign: "center", marginBottom: "3rem" }}>
        <h1 style={{ fontSize: "2rem", fontWeight: 800, marginBottom: "0.75rem" }}>
          Simple, Transparent Pricing
        </h1>
        <p style={{ color: "#6b7280", maxWidth: "36rem", margin: "0 auto" }}>
          Start free in development mode. Choose a plan when you are ready to go to production.
        </p>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(16rem, 1fr))",
          gap: "1.5rem",
          marginBottom: "4rem",
        }}
      >
        {plans.map((plan) => (
          <div
            key={plan.name}
            style={{
              border: plan.highlighted ? "2px solid #4f46e5" : "1px solid #e5e7eb",
              borderRadius: "0.75rem",
              padding: "2rem 1.5rem",
              display: "flex",
              flexDirection: "column",
              background: plan.highlighted ? "#fafafe" : "#fff",
              position: "relative",
            }}
          >
            {plan.highlighted && (
              <span
                style={{
                  position: "absolute",
                  top: "-0.75rem",
                  left: "50%",
                  transform: "translateX(-50%)",
                  background: "#4f46e5",
                  color: "#fff",
                  fontSize: "0.75rem",
                  fontWeight: 600,
                  padding: "0.125rem 0.75rem",
                  borderRadius: "1rem",
                }}
              >
                Most Popular
              </span>
            )}
            <h2 style={{ fontSize: "1.25rem", fontWeight: 700, marginBottom: "0.25rem" }}>
              {plan.name}
            </h2>
            <p style={{ color: "#6b7280", fontSize: "0.875rem", marginBottom: "1rem" }}>
              {plan.description}
            </p>
            <p style={{ fontSize: "2rem", fontWeight: 800, marginBottom: "1.5rem" }}>
              {plan.price}
              <span style={{ fontSize: "0.875rem", fontWeight: 400, color: "#6b7280" }}>
                {plan.period}
              </span>
            </p>
            <ul style={{ listStyle: "none", padding: 0, flex: 1, marginBottom: "1.5rem" }}>
              {plan.features.map((feature) => (
                <li
                  key={feature}
                  style={{
                    padding: "0.25rem 0",
                    fontSize: "0.875rem",
                    color: "#374151",
                    display: "flex",
                    alignItems: "baseline",
                    gap: "0.5rem",
                  }}
                >
                  <span style={{ color: "#10b981", flexShrink: 0 }} aria-hidden="true">&#10003;</span>
                  {feature}
                </li>
              ))}
            </ul>
            <Link
              href={plan.href}
              style={{
                display: "block",
                textAlign: "center",
                padding: "0.625rem 1rem",
                background: plan.highlighted ? "#4f46e5" : "#f3f4f6",
                color: plan.highlighted ? "#fff" : "#374151",
                borderRadius: "0.375rem",
                textDecoration: "none",
                fontWeight: 600,
                fontSize: "0.875rem",
              }}
            >
              {plan.cta}
            </Link>
          </div>
        ))}
      </div>

      <section style={{ textAlign: "center", marginBottom: "4rem" }}>
        <h2 style={{ fontSize: "1.25rem", fontWeight: 700, marginBottom: "2rem" }}>
          Trusted by Growing Businesses
        </h2>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(18rem, 1fr))",
            gap: "1.5rem",
            maxWidth: "56rem",
            margin: "0 auto 2rem",
          }}
        >
          {[
            {
              quote: "We went from manually tracking leads in spreadsheets to a fully automated pipeline in under a week. Our conversion rate is up 40%.",
              author: "Sarah M.",
              role: "Owner, SM Digital Marketing",
            },
            {
              quote: "The niche auto-configuration is brilliant. We onboard new verticals in hours instead of weeks. Our team manages 12 niches from one dashboard.",
              author: "James R.",
              role: "Director, LeadFlow Agency",
            },
            {
              quote: "The AI scoring alone is worth the price. We stopped wasting time on cold leads and focus only on prospects ready to buy.",
              author: "Maria L.",
              role: "Founder, BuildRight Consulting",
            },
          ].map((testimonial) => (
            <figure
              key={testimonial.author}
              style={{
                border: "1px solid #e5e7eb",
                borderRadius: "0.75rem",
                padding: "1.5rem",
                margin: 0,
                textAlign: "left",
                background: "#fff",
              }}
            >
              <blockquote style={{ margin: "0 0 1rem", fontSize: "0.875rem", color: "#374151", lineHeight: 1.6, fontStyle: "italic" }}>
                &ldquo;{testimonial.quote}&rdquo;
              </blockquote>
              <figcaption style={{ fontSize: "0.8125rem" }}>
                <strong style={{ color: "#111827" }}>{testimonial.author}</strong>
                <br />
                <span style={{ color: "#6b7280" }}>{testimonial.role}</span>
              </figcaption>
            </figure>
          ))}
        </div>

        <div style={{ display: "flex", justifyContent: "center", gap: "2rem", flexWrap: "wrap", marginBottom: "2rem" }}>
          {[
            { metric: "10K+", label: "Leads captured monthly" },
            { metric: "110+", label: "Integrations available" },
            { metric: "16", label: "Industry niches" },
            { metric: "99.9%", label: "Uptime SLA" },
          ].map((stat) => (
            <div key={stat.label} style={{ textAlign: "center" }}>
              <div style={{ fontSize: "1.5rem", fontWeight: 800, color: "#4f46e5" }}>{stat.metric}</div>
              <div style={{ fontSize: "0.75rem", color: "#6b7280" }}>{stat.label}</div>
            </div>
          ))}
        </div>
      </section>

      <section style={{ textAlign: "center", marginBottom: "4rem" }}>
        <h2 style={{ fontSize: "1.25rem", fontWeight: 700, marginBottom: "2rem" }}>
          Frequently Asked Questions
        </h2>
        <div style={{ maxWidth: "40rem", margin: "0 auto", textAlign: "left" }}>
          {[
            { q: "Can I try Lead OS before committing?", a: "Yes. Every plan starts with a 14-day free trial. You also get full dry-run mode for testing your setup with no real data sent." },
            { q: "Can I change plans later?", a: "Absolutely. Upgrade or downgrade at any time from your dashboard. Changes take effect at the start of your next billing cycle." },
            { q: "What happens if I exceed my lead limit?", a: "We will notify you when you reach 80% of your limit. If you go over, new leads are queued (not lost) until you upgrade or the next billing cycle starts." },
            { q: "Do you offer annual billing?", a: "Yes. Annual plans save 20%. Contact us or select annual billing during checkout." },
            { q: "Is my data secure?", a: "All data is encrypted at rest (AES-256) and in transit (TLS 1.3). We are GDPR and CCPA compliant. You own your data." },
          ].map((faq) => (
            <details key={faq.q} style={{ borderBottom: "1px solid #e5e7eb", padding: "1rem 0" }}>
              <summary style={{ fontSize: "0.9375rem", fontWeight: 600, color: "#111827", cursor: "pointer" }}>
                {faq.q}
              </summary>
              <p style={{ fontSize: "0.875rem", color: "#6b7280", lineHeight: 1.6, marginTop: "0.5rem" }}>
                {faq.a}
              </p>
            </details>
          ))}
        </div>
      </section>

      <section style={{ textAlign: "center" }}>
        <h2 style={{ fontSize: "1.25rem", fontWeight: 700, marginBottom: "1rem" }}>
          All Plans Include
        </h2>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(14rem, 1fr))",
            gap: "1rem",
            maxWidth: "48rem",
            margin: "0 auto",
            textAlign: "left",
          }}
        >
          {[
            "Dry-run mode for testing",
            "78 funnel node types",
            "Lead scoring (4 dimensions)",
            "Embeddable widgets",
            "GDPR compliance tools",
            "Operator dashboard",
            "Webhook event spine",
            "Niche auto-configuration",
          ].map((feature) => (
            <p key={feature} style={{ fontSize: "0.875rem", color: "#374151", display: "flex", gap: "0.5rem", alignItems: "baseline" }}>
              <span style={{ color: "#4f46e5" }} aria-hidden="true">&#10003;</span>
              {feature}
            </p>
          ))}
        </div>
      </section>
    </main>
  );
}
