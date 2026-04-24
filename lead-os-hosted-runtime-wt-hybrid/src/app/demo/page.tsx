import type { Metadata } from "next";
import Link from "next/link";
import { tenantConfig } from "@/lib/tenant";

export const metadata: Metadata = {
  title: "See CX React in Action | Demo",
  description: "See how CX React helps agencies capture, score, and nurture leads from one dashboard. No signup required.",
};

const demos = [
  {
    title: "Lead Capture",
    description: "See how your clients' websites turn visitors into qualified leads through forms, quizzes, calculators, and live chat.",
    details: [
      "Capture leads from forms, assessments, chat, and calculators",
      "Works on any website -- drop in a widget and go live",
      "Automatic duplicate detection keeps your data clean",
      "Track visitor behavior to understand buyer intent",
    ],
  },
  {
    title: "Lead Scoring",
    description: "Watch leads get scored automatically so your team always knows who to call first.",
    details: [
      "Intent: How likely is this person to buy?",
      "Fit: Do they match your client's ideal customer?",
      "Engagement: Are they actively researching?",
      "Urgency: Do they need help right now?",
      "Temperature labels (Cold, Warm, Hot, Burning) make prioritization instant",
    ],
  },
  {
    title: "AI Content Engine",
    description: "Generate social posts, ad copy, and email sequences in minutes -- all tailored to your client's industry.",
    details: [
      "10+ content angles per topic, matched to your niche",
      "Ready-to-post content for every major social platform",
      "Ad scripts for video, carousel, and long-form content",
      "Automated DM sequences that move leads toward a call",
    ],
  },
  {
    title: "Agency Dashboard",
    description: "One dashboard to manage all your clients. See KPIs, pipeline health, and revenue at a glance.",
    details: [
      "Real-time lead activity across all clients",
      "Attribution reports that prove your value to clients",
      "A/B testing with automatic winner detection",
      "AI-generated insights and recommended actions",
      "Revenue tracking and forecasting per client",
    ],
  },
  {
    title: "Lead Marketplace",
    description: "Turn surplus leads into revenue. List, price, and sell qualified leads to verified buyers.",
    details: [
      "Dynamic pricing based on lead quality and readiness",
      "Higher quality leads automatically command higher prices",
      "Track buyer outcomes to build marketplace reputation",
      "Revenue analytics by industry, quality tier, and time period",
    ],
  },
  {
    title: "Multi-Channel Nurturing",
    description: "Automated follow-up across email, SMS, and chat that adapts to each lead's engagement level.",
    details: [
      "Pre-built 30-day nurture sequences for every industry",
      "Messaging adapts automatically based on lead engagement",
      "Cold leads get re-engaged before they are lost",
      "The system learns which channels work best for each audience",
    ],
  },
];

export default function DemoPage() {
  const baseUrl = (process.env.NEXT_PUBLIC_SITE_URL || tenantConfig.siteUrl).replace(/\/$/, "");

  const demoJsonLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    "@id": `${baseUrl}/demo#demos`,
    name: "CX React Feature Demos",
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
        <h1 className="text-foreground text-2xl font-extrabold mb-3">
          See What Your Agency Could Look Like
        </h1>
        <p className="text-foreground max-w-xl mx-auto mb-6">
          Explore every feature of the platform your agency will run on. No signup required -- everything works in preview mode so you can try before you buy.
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
            <h2 className="text-foreground text-lg font-bold mb-2">
              {demo.title}
            </h2>
            <p className="text-foreground text-sm mb-4 leading-relaxed">
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
        <h2 className="text-foreground text-xl font-bold mb-3">
          Ready to run your agency on one platform?
        </h2>
        <p className="text-foreground mb-6 max-w-lg mx-auto">
          Set up your first client in 15 minutes. White-label everything with your brand. Start your 14-day free trial -- no credit card required.
        </p>
        <div className="flex gap-4 justify-center flex-wrap">
          <Link
            href="/onboard"
            className="px-6 py-2.5 bg-primary text-primary-foreground rounded-md no-underline font-semibold"
          >
            Start Your Free Trial
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
