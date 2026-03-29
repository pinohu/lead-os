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
      "500 leads/month",
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
    price: "$299",
    period: "/mo",
    description: "For growing agencies managing multiple niches.",
    features: [
      "2,500 leads/month",
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
      "10,000 leads/month",
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
