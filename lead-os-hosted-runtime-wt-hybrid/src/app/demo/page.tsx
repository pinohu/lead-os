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
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://leadgen-os.com";

  const demoJsonLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    "@id": `${baseUrl}/demo#demos`,
    name: "Lead OS Feature Demos",
    description: "Interactive demos of lead capture, scoring, AI content generation, and the operator dashboard.",
    numberOfItems: demos.length,
    itemListElement: demos.map((demo, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: demo.title,
      description: demo.description,
      url: `${baseUrl}/demo#${demo.title.toLowerCase().replace(/\s+/g, "-")}`,
    })),
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(demoJsonLd) }} />
    <main id="main-content" className="max-w-5xl mx-auto px-4 py-12">
      <div className="text-center mb-12">
        <h1 className="text-2xl font-extrabold mb-3">
          See Lead OS in Action
        </h1>
        <p className="text-muted-foreground max-w-xl mx-auto mb-6">
          Explore the capabilities of a complete lead generation platform. No signup required — the system runs entirely in dry-run mode for demos.
        </p>
        <div className="flex gap-4 justify-center flex-wrap">
          <Link
            href="/onboard"
            className="px-6 py-2.5 bg-primary text-primary-foreground rounded-md no-underline font-semibold"
          >
            Start Free Trial
          </Link>
          <Link
            href="/dashboard"
            className="px-6 py-2.5 bg-muted text-foreground rounded-md no-underline font-semibold"
          >
            Explore Dashboard
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {demos.map((demo) => (
          <article
            key={demo.title}
            className="border border-border rounded-xl p-6 flex flex-col"
          >
            <h2 className="text-lg font-bold mb-2">
              {demo.title}
            </h2>
            <p className="text-muted-foreground text-sm mb-4 leading-relaxed">
              {demo.description}
            </p>
            <ul className="pl-5 text-xs text-muted-foreground leading-7 flex-1">
              {demo.details.map((detail) => (
                <li key={detail}>{detail}</li>
              ))}
            </ul>
          </article>
        ))}
      </div>

      <section className="mt-16 text-center p-8 bg-muted rounded-xl">
        <h2 className="text-xl font-bold mb-3">
          Ready to deploy your own?
        </h2>
        <p className="text-muted-foreground mb-6 max-w-lg mx-auto">
          Lead OS runs entirely in-memory with dry-run mode for development. No environment variables required. Clone, install, and start in under 2 minutes.
        </p>
        <div className="flex gap-4 justify-center flex-wrap">
          <Link
            href="/onboard"
            className="px-6 py-2.5 bg-primary text-primary-foreground rounded-md no-underline font-semibold"
          >
            Start Onboarding
          </Link>
          <Link
            href="/pricing"
            className="px-6 py-2.5 bg-muted text-foreground rounded-md no-underline font-semibold border border-border"
          >
            View Pricing
          </Link>
        </div>
      </section>
    </main>
    </>
  );
}
