import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Demo",
  description: "See Lead OS in action. Interactive demos of lead capture, scoring, AI content generation, and the operator dashboard.",
};

const demos = [
  {
    title: "Lead Capture",
    description: "See how embeddable widgets capture visitor intent through quizzes, calculators, forms, and chat.",
    details: [
      "Multi-source intake: forms, assessments, chat, calculators, voice, API",
      "Embeddable as script tag, iframe, React component, or WordPress plugin",
      "Idempotent deduplication via lead keys",
      "Behavioral event tracking (page views, scroll depth, CTA clicks)",
    ],
  },
  {
    title: "Lead Scoring",
    description: "Watch a lead get scored across four dimensions in real-time with niche-specific weight biases.",
    details: [
      "Intent (0-100): How likely is this lead to convert?",
      "Fit (0-100): How well does this lead match your ideal customer?",
      "Engagement (0-100): How actively is this lead interacting?",
      "Urgency (0-100): How time-sensitive is this lead's need?",
      "Temperature: Cold (0-34), Warm (35-59), Hot (60-79), Burning (80+)",
    ],
  },
  {
    title: "AI Content Engine",
    description: "Generate social media content, ad copy, and email sequences powered by AI with niche-specific psychology.",
    details: [
      "10+ content angles per topic with niche psychology",
      "7 hook types x 12 platform variants",
      "PAS script generation for short-video, carousel, thread, article",
      "4-stage DM conversion funnel (acknowledge, value, qualify, offer)",
    ],
  },
  {
    title: "Operator Dashboard",
    description: "23-page dashboard with KPIs, analytics, pipeline, AI agents, experiments, and system health.",
    details: [
      "Real-time lead activity radar",
      "Multi-touch attribution reports",
      "A/B experiment management with auto-winner detection",
      "AI agent team coordination and audit logs",
      "Revenue tracking and forecasting",
    ],
  },
  {
    title: "Lead Marketplace",
    description: "List, price, and sell qualified leads through the built-in marketplace with dynamic pricing.",
    details: [
      "Dynamic pricing by temperature: Cold $25, Warm $50, Hot $100, Burning $200",
      "Quality multiplier based on composite score",
      "Buyer claiming with outcome tracking",
      "Revenue analytics by niche, temperature, and time period",
    ],
  },
  {
    title: "Multi-Channel Nurturing",
    description: "Automated follow-up across email, SMS, WhatsApp, voice, and chat, adapted to lead temperature.",
    details: [
      "7-stage nurture sequence (day 0 through day 30)",
      "Temperature-aware content progression",
      "Escalation engine for stale lead re-engagement",
      "Channel optimization based on engagement patterns",
    ],
  },
];

export default function DemoPage() {
  return (
    <main id="main-content" style={{ maxWidth: "64rem", margin: "0 auto", padding: "3rem 1rem" }}>
      <div style={{ textAlign: "center", marginBottom: "3rem" }}>
        <h1 style={{ fontSize: "2rem", fontWeight: 800, marginBottom: "0.75rem" }}>
          See Lead OS in Action
        </h1>
        <p style={{ color: "#6b7280", maxWidth: "36rem", margin: "0 auto", marginBottom: "1.5rem" }}>
          Explore the capabilities of a complete lead generation platform. No signup required — the system runs entirely in dry-run mode for demos.
        </p>
        <div style={{ display: "flex", gap: "1rem", justifyContent: "center", flexWrap: "wrap" }}>
          <Link
            href="/onboard"
            style={{
              padding: "0.625rem 1.5rem",
              background: "#4f46e5",
              color: "#fff",
              borderRadius: "0.375rem",
              textDecoration: "none",
              fontWeight: 600,
            }}
          >
            Start Free Trial
          </Link>
          <Link
            href="/dashboard"
            style={{
              padding: "0.625rem 1.5rem",
              background: "#f3f4f6",
              color: "#374151",
              borderRadius: "0.375rem",
              textDecoration: "none",
              fontWeight: 600,
            }}
          >
            Explore Dashboard
          </Link>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(18rem, 1fr))", gap: "1.5rem" }}>
        {demos.map((demo) => (
          <article
            key={demo.title}
            style={{
              border: "1px solid #e5e7eb",
              borderRadius: "0.75rem",
              padding: "1.5rem",
              display: "flex",
              flexDirection: "column",
            }}
          >
            <h2 style={{ fontSize: "1.125rem", fontWeight: 700, marginBottom: "0.5rem" }}>
              {demo.title}
            </h2>
            <p style={{ color: "#6b7280", fontSize: "0.875rem", marginBottom: "1rem", lineHeight: 1.5 }}>
              {demo.description}
            </p>
            <ul style={{ paddingLeft: "1.25rem", fontSize: "0.8rem", color: "#4b5563", lineHeight: 1.7, flex: 1 }}>
              {demo.details.map((detail) => (
                <li key={detail}>{detail}</li>
              ))}
            </ul>
          </article>
        ))}
      </div>

      <section style={{ marginTop: "4rem", textAlign: "center", padding: "2rem", background: "#f9fafb", borderRadius: "0.75rem" }}>
        <h2 style={{ fontSize: "1.25rem", fontWeight: 700, marginBottom: "0.75rem" }}>
          Ready to deploy your own?
        </h2>
        <p style={{ color: "#6b7280", marginBottom: "1.5rem", maxWidth: "32rem", margin: "0 auto 1.5rem" }}>
          Lead OS runs entirely in-memory with dry-run mode for development. No environment variables required. Clone, install, and start in under 2 minutes.
        </p>
        <div style={{ display: "flex", gap: "1rem", justifyContent: "center", flexWrap: "wrap" }}>
          <Link
            href="/onboard"
            style={{
              padding: "0.625rem 1.5rem",
              background: "#4f46e5",
              color: "#fff",
              borderRadius: "0.375rem",
              textDecoration: "none",
              fontWeight: 600,
            }}
          >
            Start Onboarding
          </Link>
          <Link
            href="/pricing"
            style={{
              padding: "0.625rem 1.5rem",
              background: "#f3f4f6",
              color: "#374151",
              borderRadius: "0.375rem",
              textDecoration: "none",
              fontWeight: 600,
            }}
          >
            View Pricing
          </Link>
        </div>
      </section>
    </main>
  );
}
