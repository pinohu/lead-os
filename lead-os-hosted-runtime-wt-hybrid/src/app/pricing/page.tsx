import type { Metadata } from "next";
import Link from "next/link";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check } from "lucide-react";

export const metadata: Metadata = {
  title: "Pricing — Lead OS",
  description:
    "Enterprise lead generation pricing. Replace 15-20 SaaS tools with one platform. Plans from $299/mo.",
};

const plans = [
  {
    name: "Starter",
    price: "$299",
    period: "/mo",
    description: "For solo operators launching their first lead engine.",
    features: [
      "Up to 250 qualified leads per month",
      "10 custom lead capture funnels",
      "5 tool integrations (CRM, email, etc.)",
      "Automated email nurture sequences",
      "AI-powered lead qualification",
      "Client management dashboard",
      "Risk-free testing sandbox",
      "Email support",
    ],
    cta: "Start Free Trial",
    href: "/onboard?plan=starter",
    highlighted: false,
  },
  {
    name: "Growth",
    price: "$599",
    period: "/mo",
    description: "For growing agencies managing multiple niches and channels.",
    features: [
      "Up to 1,500 qualified leads per month",
      "25 custom lead capture funnels",
      "25 tool integrations",
      "Multi-channel nurturing (email, SMS, chat)",
      "AI-powered scoring and content creation",
      "Built-in A/B testing with auto-winner",
      "Automated prospect discovery",
      "Competitor benchmarking reports",
      "Priority support",
    ],
    cta: "Start Free Trial",
    href: "/onboard?plan=growth",
    highlighted: true,
  },
  {
    name: "Professional",
    price: "$1,299",
    period: "/mo",
    description: "For established agencies and white-label SaaS operators.",
    features: [
      "Up to 10,000 qualified leads per month",
      "Unlimited lead capture funnels",
      "All 137+ tool integrations",
      "Manage multiple clients from one account",
      "Sell qualified leads through the marketplace",
      "AI agents that work overnight for you",
      "Your branding, your domain, your clients",
      "Developer-friendly API access",
      "Automated morning briefings and reports",
      "Dedicated support",
    ],
    cta: "Start Free Trial",
    href: "/onboard?plan=professional",
    highlighted: false,
  },
  {
    name: "Enterprise",
    price: "$2,999",
    period: "/mo",
    description: "For large-scale operations with custom infrastructure needs.",
    features: [
      "Unlimited leads across all clients",
      "Custom implementation and onboarding",
      "Dedicated infrastructure for your agency",
      "99.9% uptime SLA guarantee",
      "Single sign-on for your entire team",
      "Advanced security (IP restrictions, 2FA)",
      "Compliance reporting for enterprise clients",
      "Custom integrations built to your needs",
      "Dedicated account manager",
      "Phone + Slack support",
    ],
    cta: "Contact Sales",
    href: "/contact?inquiry=enterprise",
    highlighted: false,
  },
];

export default function PricingPage() {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://leadgen-os.com";

  const pricingFaqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: [
      { "@type": "Question", name: "Can I try Lead OS before committing?", acceptedAnswer: { "@type": "Answer", text: "Yes. Every plan starts with a 14-day free trial. You can test everything in sandbox mode before going live." } },
      { "@type": "Question", name: "Can I change plans later?", acceptedAnswer: { "@type": "Answer", text: "Absolutely. Upgrade or downgrade at any time from your dashboard. Changes take effect at the start of your next billing cycle." } },
      { "@type": "Question", name: "What happens if I exceed my lead limit?", acceptedAnswer: { "@type": "Answer", text: "We will notify you when you reach 80% of your limit. If you go over, new leads are queued (not lost) until you upgrade or the next billing cycle starts." } },
      { "@type": "Question", name: "Do you offer annual billing?", acceptedAnswer: { "@type": "Answer", text: "Yes. Annual plans save 20%. Contact us or select annual billing during checkout." } },
      { "@type": "Question", name: "Is my data secure?", acceptedAnswer: { "@type": "Answer", text: "All data is encrypted at rest and in transit using bank-level security standards. We are GDPR and CCPA compliant. You own your data." } },
    ],
  }

  const softwareAppJsonLd = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    "@id": `${baseUrl}/#app`,
    name: "Lead OS",
    applicationCategory: "BusinessApplication",
    operatingSystem: "Web",
    description: "Enterprise lead generation platform. Replace 15-20 SaaS tools with one platform.",
    url: baseUrl,
    offers: plans.map((plan) => ({
      "@type": "Offer",
      name: plan.name,
      price: plan.price.replace("$", ""),
      priceCurrency: "USD",
      description: plan.description,
      url: `${baseUrl}${plan.href}`,
      availability: "https://schema.org/InStock",
    })),
  }

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(pricingFaqJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(softwareAppJsonLd) }} />
      <main id="main-content" className="max-w-7xl mx-auto px-4 py-8">
      <div className="text-center mb-12">
        <Badge variant="secondary" className="mb-4">Pricing</Badge>
        <h1 className="text-foreground text-4xl font-extrabold tracking-tight mb-3">
          Replace 15-20 Tools With One Platform
        </h1>
        <p className="text-foreground max-w-2xl mx-auto text-lg">
          Every plan includes a 14-day free trial. Test everything risk-free before going live.
          Upgrade, downgrade, or cancel anytime.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
        {plans.map((plan) => (
          <Card
            key={plan.name}
            className={
              plan.highlighted
                ? "border-2 border-primary relative shadow-lg"
                : "relative"
            }
          >
            {plan.highlighted && (
              <Badge className="absolute -top-3 left-1/2 -translate-x-1/2">
                Most Popular
              </Badge>
            )}
            <CardHeader>
              <CardTitle className="text-xl">{plan.name}</CardTitle>
              <CardDescription>{plan.description}</CardDescription>
            </CardHeader>
            <CardContent className="flex-1">
              <p className="text-4xl font-extrabold mb-6">
                {plan.price}
                <span className="text-base font-normal text-muted-foreground">
                  {plan.period}
                </span>
              </p>
              <ul className="space-y-2">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-2 text-sm">
                    <Check className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
            <CardFooter>
              <Button
                asChild
                variant={plan.highlighted ? "default" : "outline"}
                className="w-full"
                size="lg"
              >
                <Link href={plan.href}>{plan.cta}</Link>
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>

      <section className="text-center mb-16" aria-labelledby="why-choose-heading">
        <h2 id="why-choose-heading" className="text-foreground text-2xl font-bold mb-8">Why Teams Choose Lead OS</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto mb-8">
          {[
            {
              metric: "8+",
              title: "SaaS tools replaced",
              desc: "One platform for funnels, scoring, nurturing, CRM, analytics, and more.",
            },
            {
              metric: "20+",
              title: "Hours saved per week",
              desc: "Automate reporting, lead routing, and nurture sequences across every client.",
            },
            {
              metric: "14 days",
              title: "Free trial, no credit card",
              desc: "Full access to every feature. Test your setup risk-free before going live.",
            },
          ].map((item) => (
            <Card key={item.title} className="text-center">
              <CardContent className="pt-6">
                <div className="text-3xl font-extrabold text-primary mb-2">{item.metric}</div>
                <p className="text-sm font-semibold mb-1">{item.title}</p>
                <p className="text-xs text-foreground">{item.desc}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="flex justify-center gap-8 flex-wrap">
          {[
            { metric: "137+", label: "Integrations available" },
            { metric: "16", label: "Industries pre-built" },
            { metric: "99.9%", label: "Uptime SLA" },
            { metric: "0", label: "Contracts required" },
          ].map((stat) => (
            <div key={stat.label} className="text-center">
              <div className="text-2xl font-extrabold text-primary">{stat.metric}</div>
              <div className="text-xs text-muted-foreground">{stat.label}</div>
            </div>
          ))}
        </div>
      </section>

      <section className="text-center mb-16" aria-labelledby="faq-heading">
        <h2 id="faq-heading" className="text-foreground text-2xl font-bold mb-8">Frequently Asked Questions</h2>
        <div className="max-w-2xl mx-auto text-left space-y-0">
          {[
            { q: "Can I try Lead OS before committing?", a: "Yes. Every plan starts with a 14-day free trial. You can test everything in sandbox mode before going live." },
            { q: "Can I change plans later?", a: "Absolutely. Upgrade or downgrade at any time from your dashboard. Changes take effect at the start of your next billing cycle." },
            { q: "What happens if I exceed my lead limit?", a: "We will notify you when you reach 80% of your limit. If you go over, new leads are queued (not lost) until you upgrade or the next billing cycle starts." },
            { q: "Do you offer annual billing?", a: "Yes. Annual plans save 20%. Contact us or select annual billing during checkout." },
            { q: "Is my data secure?", a: "All data is encrypted at rest and in transit using bank-level security standards. We are GDPR and CCPA compliant. You own your data." },
          ].map((faq) => (
            <details key={faq.q} className="border-b border-border py-4 group">
              <summary className="text-[0.9375rem] font-semibold cursor-pointer list-none flex items-center justify-between">
                {faq.q}
                <span className="text-muted-foreground group-open:rotate-180 transition-transform">&#9662;</span>
              </summary>
              <p className="text-sm text-foreground leading-relaxed mt-2">
                {faq.a}
              </p>
            </details>
          ))}
        </div>
      </section>

      <section className="text-center" aria-labelledby="all-plans-heading">
        <h2 id="all-plans-heading" className="text-foreground text-2xl font-bold mb-6">All Plans Include</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-3xl mx-auto text-left">
          {[
            "Risk-free testing sandbox",
            "Drag-and-drop funnel builder",
            "AI-powered lead qualification",
            "Embeddable capture widgets",
            "GDPR and privacy compliance",
            "Client management dashboard",
            "Real-time event notifications",
            "One-click industry setup",
          ].map((feature) => (
            <p key={feature} className="text-sm flex gap-2 items-baseline">
              <Check className="h-3.5 w-3.5 text-primary shrink-0" />
              {feature}
            </p>
          ))}
        </div>
      </section>
    </main>
    </>
  );
}
