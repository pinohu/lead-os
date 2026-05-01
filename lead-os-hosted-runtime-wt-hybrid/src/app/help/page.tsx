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
      {
        question: "What is Lead OS?",
        answer:
          "Lead OS is a complete-solution launch system for agencies, SaaS teams, lead-gen shops, consultants, and franchise operators. Choose the outcome the customer bought, collect the intake details, and receive customer-facing pages, embed code, routing, dashboards, reporting, finished outputs, and managed handoffs.",
      },
      {
        question: "How do I get started?",
        answer:
          "Start account setup, choose the plan capacity you need, then open Solutions. Pick what the customer bought and submit the intake form to launch the customer-ready outputs.",
      },
      {
        question: "How do I capture my first lead?",
        answer:
          "After a solution launches, share the capture URL or add the provided embed code to your site or your customer's site. Visitors see the prepared form, quiz, calculator, or chat widget. On submit, the lead is scored, routed, and shown in the delivery hub.",
      },
      {
        question: "What does the dashboard show?",
        answer:
          "The dashboard summarizes lead operations: KPIs, pipeline status, experiments, billing signals, solution activity, and delivery performance.",
      },
      {
        question: "Can I add a new niche without coding?",
        answer:
          "Yes. Lead OS treats niches as configuration, not code. Industry templates shape scoring weights, assessment questions, lead magnets, nurture content, and funnel configurations.",
      },
    ],
  },
  {
    title: "Lead Management",
    items: [
      {
        question: "How does lead scoring work?",
        answer:
          "Lead OS scores every lead across intent, fit, engagement, and urgency. These combine into a single score that tells your team exactly who to call first.",
      },
      {
        question: "What do the temperature labels mean?",
        answer:
          "Cold means early-stage and needs nurturing. Warm means showing interest. Hot means high intent. Burning means ready to buy and should be routed immediately.",
      },
      {
        question: "How does lead routing work?",
        answer:
          "You define rules for who qualifies, where they go next, and what happens automatically. The system assigns leads, updates approved connected accounts, and starts the right follow-up sequence when live access is available.",
      },
      {
        question: "What happens with duplicate leads?",
        answer:
          "Lead OS detects duplicate submissions and merges them instead of creating new records, so your team does not call the same person twice.",
      },
      {
        question: "Can I export my leads?",
        answer:
          "Yes. Export leads from the dashboard or set up real-time sync to your CRM after account access is approved. You own your data and can export it anytime.",
      },
    ],
  },
  {
    title: "Solutions and Integrations",
    items: [
      {
        question: "What does a customer receive after the intake form is submitted?",
        answer:
          "They receive solution-specific delivery links, a capture page, embed code, operations and reporting surfaces, routing logic, finished outputs, provisioning runs, and acceptance checks.",
      },
      {
        question: "How do I connect my CRM?",
        answer:
          "Go to Dashboard > Account Access and add the CRM or operations account connection you use. Sync behavior depends on which adapters are enabled for your deployment. Integrations stay in managed-handoff mode until live access is present.",
      },
      {
        question: "How do I set up email nurturing?",
        answer:
          "Approve your email account in Dashboard > Account Access. Lead OS includes nurture sequences that adapt messaging based on lead engagement and industry.",
      },
      {
        question: "What if I have not connected my accounts yet?",
        answer:
          "The solution still launches its built-in surfaces and finished outputs. External actions such as CRM sync, live sends, billing, and webhooks activate when you approve the required accounts.",
      },
    ],
  },
  {
    title: "Billing",
    items: [
      {
        question: "What plans are available?",
        answer:
          "Starter, Growth, Professional, and Enterprise plans control lead volume, operators, funnels, experiments, integrations, and solution capacity. See /pricing for the current catalog.",
      },
      {
        question: "How do I upgrade my plan?",
        answer:
          "Go to Dashboard > Billing and click Change Plan. Upgrades take effect immediately when billing is connected. Downgrades take effect at the next billing cycle.",
      },
      {
        question: "How do I view invoices?",
        answer:
          "Go to Dashboard > Billing to view invoices. Live invoice generation requires approved payment account access.",
      },
    ],
  },
  {
    title: "Setup and Security",
    items: [
      {
        question: "Do you have developer documentation?",
        answer:
          "Yes. Start at /docs for API references and operator documents. The repository docs include runbooks, deployment detail, environment specs, and architecture notes.",
      },
      {
        question: "Can I use my own domain?",
        answer:
          "Yes. Configure your domain in Dashboard > Settings or through your deployment provider. Customers should see your brand and the solution URL you choose.",
      },
      {
        question: "How is my data protected?",
        answer:
          "Traffic uses TLS in production configurations, operator areas use authenticated sessions, and data access is parameterized in the app layer. Review your database, RLS, processor agreements, and threat model before promising compliance downstream.",
      },
      {
        question: "Is Lead OS GDPR compliant?",
        answer:
          "Lead OS includes capabilities for data export, data deletion, and consent management. Your compliance depends on your deployment, subprocessors, policies, and legal review.",
      },
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
    })),
  ),
};

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
      <div className="mx-auto max-w-3xl px-4 py-12">
        <h1 className="mb-2 text-2xl font-extrabold text-foreground">Help Center</h1>
        <p className="mb-8 text-foreground">
          Find answers to common questions about launching complete customer solutions with Lead OS.
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
            className="w-full rounded-lg border border-border px-4 py-3 text-base"
          />
        </div>

        {filtered.map((category) => (
          <section key={category.title} className="mb-8">
            <h2 className="mb-3 text-xl font-bold text-foreground">{category.title}</h2>
            {category.items.map((item) => {
              const key = `${category.title}-${item.question}`;
              const isOpen = openItems.has(key);
              return (
                <div key={key} className="mb-2 overflow-hidden rounded-md border border-border">
                  <button
                    onClick={() => toggleItem(key)}
                    aria-expanded={isOpen}
                    className="flex w-full cursor-pointer items-center justify-between border-none bg-muted px-4 py-3 text-left text-sm font-semibold"
                  >
                    {item.question}
                    <span aria-hidden="true" className={`text-muted-foreground transition-transform ${isOpen ? "rotate-180" : ""}`}>
                      &#9660;
                    </span>
                  </button>
                  {isOpen ? <div className="px-4 py-3 text-sm leading-relaxed text-foreground">{item.answer}</div> : null}
                </div>
              );
            })}
          </section>
        ))}

        <section className="mt-12 rounded-xl bg-muted p-8 text-center">
          <h2 className="mb-2 text-xl font-bold text-foreground">Still need help?</h2>
          <p className="mb-4 text-foreground">
            Contact support if you need help choosing a solution, approving account access, or understanding what will launch.
          </p>
          <Link href="/contact" className="inline-block rounded-md bg-primary px-6 py-2 font-semibold text-primary-foreground no-underline">
            Contact Support
          </Link>
        </section>
      </div>
    </>
  );
}
