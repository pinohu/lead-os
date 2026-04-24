"use client";

import { useState } from "react";
import Link from "next/link";

interface FaqItem {
  question: string;
  answer: string;
}

interface FaqCategory {
  title: string;
  items: FaqItem[];
}

const faqData: FaqCategory[] = [
  {
    title: "Getting Started",
    items: [
      { question: "What is CX React?", answer: "CX React is a configurable lead operating system for agencies, SaaS teams, lead-gen shops, consultants, and franchise operators. It captures leads through embeddable widgets and API intake, scores and routes them, and nurtures across email, SMS, and chat when providers are connected — with one operator dashboard and APIs you control." },
      { question: "How do I get started?", answer: "Head to the onboarding page to start the setup wizard. Choose your industry, pick a plan, add your branding, and connect your tools. The system automatically configures lead scoring, assessment questions, and nurture sequences for your industry." },
      { question: "How do I capture my first lead?", answer: "After onboarding, add the provided widget to your site or your customer’s site (agencies often embed per client). Visitors see your configured form, quiz, calculator, or chat widget. On submit, the lead is scored, routed, and entered into the nurture sequence you enabled." },
      { question: "What does the dashboard show?", answer: "The dashboard summarizes lead operations: KPIs, pipeline status, experiments, billing signals, and workspace-level performance. Whether you run one product, many territories, or many client accounts, it is the same control plane." },
      { question: "Can I add a new niche without coding?", answer: "Yes. CX React treats niches as configuration, not code. Enter your industry name and the system auto-generates scoring weights, assessment questions, lead magnets, nurture content, and funnel configurations." },
    ],
  },
  {
    title: "Lead Management",
    items: [
      { question: "How does lead scoring work?", answer: "CX React scores every lead across four dimensions: how likely they are to buy (intent), how well they match your ideal customer (fit), how actively they are engaging (engagement), and how urgently they need your service (urgency). These combine into a single score that tells your team exactly who to call first." },
      { question: "What do the temperature labels mean?", answer: "Cold (0-34): Early-stage, needs nurturing. Warm (35-59): Showing interest, engage actively. Hot (60-79): High intent, prioritize outreach. Burning (80+): Ready to buy, route to sales immediately." },
      { question: "How does lead routing work?", answer: "You define rules for each stage of your funnel: who qualifies, where they go next, and what happens automatically. The system assigns leads to the right team members, updates your CRM, and starts the right nurture sequence -- all without manual work." },
      { question: "What happens with duplicate leads?", answer: "CX React automatically detects duplicate submissions and merges them instead of creating new records. The system keeps the best data from each submission so your lead counts stay accurate and your team never calls the same person twice." },
      { question: "Can I export my leads?", answer: "Yes. Export leads directly from the dashboard with one click, or set up real-time sync to your CRM. You always own your data and can export it anytime." },
    ],
  },
  {
    title: "Integrations",
    items: [
      { question: "How do I connect my CRM?", answer: "Go to Dashboard > Credentials and add the CRM or ops tool connectors you use. Sync behavior depends on which adapters are enabled for your deployment. All integrations stay in sandbox or stub mode until real API keys are present." },
      { question: "How do I set up email nurturing?", answer: "Connect your email provider in Dashboard > Credentials. CX React includes pre-built 7-stage nurture sequences that automatically adapt messaging based on how engaged each lead is and what industry they are in." },
      { question: "How do I configure SMS?", answer: "Connect your SMS provider in Dashboard > Credentials. SMS is part of the multi-channel nurture sequence and can be turned on or off for each stage of your funnel." },
      { question: "Can I get real-time notifications when something happens?", answer: "Yes. CX React sends real-time notifications when key events occur -- like a new lead coming in, a lead changing stages, or a conversion. Configure these alerts in Dashboard > Settings." },
      { question: "What if I have not connected my tools yet?", answer: "No problem. All integrations run in sandbox mode until you connect your accounts. You can explore and test the full platform with realistic sample data before going live." },
    ],
  },
  {
    title: "Billing",
    items: [
      { question: "What plans are available?", answer: "Starter ($299/mo), Growth ($599/mo), Professional ($1,299/mo), and Enterprise ($2,999/mo). All plans include a 14-day free trial. See the /pricing page for full feature comparison." },
      { question: "How do I upgrade my plan?", answer: "Go to Dashboard > Billing and click 'Change Plan'. Upgrades take effect immediately. Downgrades take effect at the next billing cycle." },
      { question: "How do I cancel?", answer: "Go to Dashboard > Billing and click 'Manage Subscription'. You can cancel anytime. Your access continues until the end of the current billing period. You can export your data before cancellation." },
      { question: "What counts toward usage limits?", answer: "Each plan has limits on leads/month, emails/month, SMS/month, active funnels, and enabled integrations. Usage resets at the start of each billing cycle." },
      { question: "How do I view my invoices?", answer: "Go to Dashboard > Billing to view all invoices. Invoices are generated by Stripe and include PDF download links." },
    ],
  },
  {
    title: "Setup and Security",
    items: [
      { question: "Do you have developer documentation?", answer: "Yes. Start at the in-app documentation hub at /docs (OpenAPI JSON at /api/docs/openapi.json). For runbooks and deployment detail, see the docs folder in the repository linked from /docs." },
      { question: "How do I add the widget to a website?", answer: "After onboarding you get embed snippets per workspace or niche. They work on any normal web stack as a popup, inline form, chat bubble, or full-page assessment." },
      { question: "Can I use my own domain?", answer: "Yes. Set up your custom domain in Dashboard > Settings. Your clients will see your brand and your URL -- not ours." },
      { question: "How is my data protected?", answer: "Traffic uses TLS in production configurations; operator areas use magic-link sessions; data access is parameterized in the app layer. Tenant isolation depends on your Postgres/RLS and deployment model — review docs/SOC2-CONTROLS.md and your own threat model before promising compliance downstream." },
      { question: "Is CX React GDPR compliant?", answer: "Yes. CX React includes built-in tools for data export, data deletion, and consent management. See our Privacy Policy for full details." },
    ],
  },
];

const helpFaqJsonLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: faqData.flatMap((category) =>
    category.items.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: { "@type": "Answer", text: item.answer },
    }))
  ),
}

export default function HelpCenterPage() {
  const [search, setSearch] = useState("");
  const [openItems, setOpenItems] = useState<Set<string>>(new Set());

  const filtered = search.trim()
    ? faqData
        .map((cat) => ({
          ...cat,
          items: cat.items.filter(
            (item) =>
              item.question.toLowerCase().includes(search.toLowerCase()) ||
              item.answer.toLowerCase().includes(search.toLowerCase()),
          ),
        }))
        .filter((cat) => cat.items.length > 0)
    : faqData;

  const toggleItem = (key: string) => {
    setOpenItems((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(helpFaqJsonLd) }} />
      <main id="main-content" className="max-w-3xl mx-auto px-4 py-12">
      <h1 className="text-foreground text-2xl font-extrabold mb-2">Help Center</h1>
      <p className="text-foreground mb-8">
        Find answers to common questions about CX React.
      </p>

      <div className="mb-8">
        <label htmlFor="faq-search" className="sr-only">
          Search help articles
        </label>
        <input
          id="faq-search"
          type="search"
          placeholder="Search questions..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          aria-label="Search help articles"
          className="w-full px-4 py-3 border border-border rounded-lg text-base"
        />
      </div>

      {filtered.map((category) => (
        <section key={category.title} className="mb-8">
          <h2 className="text-foreground text-xl font-bold mb-3">
            {category.title}
          </h2>
          {category.items.map((item) => {
            const key = `${category.title}-${item.question}`;
            const isOpen = openItems.has(key);
            return (
              <div
                key={key}
                className="border border-border rounded-md mb-2 overflow-hidden"
              >
                <button
                  onClick={() => toggleItem(key)}
                  aria-expanded={isOpen}
                  className="w-full px-4 py-3 bg-muted border-none text-left cursor-pointer font-semibold text-sm flex justify-between items-center"
                >
                  {item.question}
                  <span aria-hidden="true" className={`text-muted-foreground transition-transform ${isOpen ? "rotate-180" : ""}`}>
                    &#9660;
                  </span>
                </button>
                {isOpen && (
                  <div className="px-4 py-3 text-sm text-foreground leading-relaxed">
                    {item.answer}
                  </div>
                )}
              </div>
            );
          })}
        </section>
      ))}

      <section className="mt-12 p-8 bg-muted rounded-xl text-center">
        <h2 className="text-foreground text-xl font-bold mb-2">
          Still need help?
        </h2>
        <p className="text-foreground mb-4">
          Contact our support team and we will get back to you within 24 hours.
        </p>
        <Link
          href="/contact"
          className="inline-block px-6 py-2 bg-primary text-primary-foreground rounded-md no-underline font-semibold"
        >
          Contact Support
        </Link>
      </section>
    </main>
    </>
  );
}
