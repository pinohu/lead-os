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
      { question: "What is Lead OS?", answer: "Lead OS is a programmable, multi-tenant lead generation platform. It captures visitor intent through widgets, scores leads across four dimensions, routes them through configurable funnel graphs, orchestrates multi-channel follow-up, and syncs outcomes to your CRM. It replaces 15-20 separate SaaS products with a single deployable runtime." },
      { question: "How do I set up my first instance?", answer: "Visit the /onboard page to start the self-service wizard. Choose your niche, select a plan, configure branding, enable integrations, and get your embed code. The system auto-generates scoring weights, assessment questions, and nurture content for your industry." },
      { question: "How do I capture my first lead?", answer: "After onboarding, embed the provided script tag on your website. Visitors will see your configured widget (quiz, calculator, form, or chat). When they submit, the lead is automatically scored, routed, and entered into your nurture sequence." },
      { question: "What does the operator dashboard show?", answer: "The dashboard has 23 pages covering KPIs, lead management, pipeline visualization, AI agent management, content generation, A/B experiments, billing, marketplace, and system health. It gives you full visibility into your lead generation operations." },
      { question: "Can I add a new niche without coding?", answer: "Yes. Lead OS treats niches as configuration, not code. Enter your industry name and the system auto-generates scoring weights, assessment questions, lead magnets, nurture content, and funnel configurations." },
    ],
  },
  {
    title: "Lead Management",
    items: [
      { question: "How does lead scoring work?", answer: "Lead OS uses four-dimensional scoring: Intent (0-100), Fit (0-100), Engagement (0-100), and Urgency (0-100). These are combined into a composite score with niche-specific weight biases. AI-enhanced predictive scoring can further refine the results." },
      { question: "What do the temperature labels mean?", answer: "Cold (0-34): Early-stage, needs nurturing. Warm (35-59): Showing interest, engage actively. Hot (60-79): High intent, prioritize outreach. Burning (80+): Ready to buy, route to sales immediately." },
      { question: "How does lead routing work?", answer: "Leads are routed based on funnel graph configuration. You define rules for each stage: qualification criteria, routing logic, and next actions. The system handles automatic assignment to team members, CRM stages, and nurture sequences." },
      { question: "How does deduplication work?", answer: "Lead OS uses idempotency keys and lead key hashing. Duplicate submissions are detected and merged rather than creating new records. The system preserves the highest scores and most recent engagement data." },
      { question: "Can I export my leads?", answer: "Yes. Use the GDPR export endpoint (/api/gdpr/export) or the dashboard export function. Data is returned in standard JSON format. You can also sync leads in real-time to your CRM via integration adapters." },
    ],
  },
  {
    title: "Integrations",
    items: [
      { question: "How do I connect my CRM?", answer: "Go to Dashboard > Credentials and add your CRM API key (SuiteDash, SalesNexus, or others). Lead OS will automatically sync leads, deals, and pipeline stages. All integrations run in dry-run mode until credentials are configured." },
      { question: "How do I set up email nurturing?", answer: "Configure your email provider (Sinosend, Emailit) in Dashboard > Credentials. Lead OS includes pre-built 7-stage nurture sequences that adapt content based on lead temperature and niche." },
      { question: "How do I configure SMS?", answer: "Add your EasyText Marketing API key in Dashboard > Credentials. SMS is part of the multi-channel nurture sequence and can be enabled/disabled per funnel stage." },
      { question: "How do webhooks work?", answer: "Lead OS fires webhooks on key events (lead captured, scored, stage changed, converted). Configure webhook URLs in Dashboard > Settings. All webhooks include HMAC-SHA256 signatures for verification." },
      { question: "What happens without API keys?", answer: "All 110+ integrations operate in dry-run mode when API keys are not configured. They return realistic mock data so you can develop and test without connecting external services." },
    ],
  },
  {
    title: "Billing",
    items: [
      { question: "What plans are available?", answer: "Starter ($99/mo), Growth ($249/mo), Professional ($499/mo), and Enterprise (custom). See the /pricing page for full feature comparison." },
      { question: "How do I upgrade my plan?", answer: "Go to Dashboard > Billing and click 'Change Plan'. Upgrades take effect immediately. Downgrades take effect at the next billing cycle." },
      { question: "How do I cancel?", answer: "Go to Dashboard > Billing and click 'Manage Subscription'. You can cancel anytime. Your access continues until the end of the current billing period. You can export your data before cancellation." },
      { question: "What counts toward usage limits?", answer: "Each plan has limits on leads/month, emails/month, SMS/month, active funnels, and enabled integrations. Usage resets at the start of each billing cycle." },
      { question: "How do I view my invoices?", answer: "Go to Dashboard > Billing to view all invoices. Invoices are generated by Stripe and include PDF download links." },
    ],
  },
  {
    title: "Technical",
    items: [
      { question: "Where are the API docs?", answer: "Full API documentation is available at /docs/API_REFERENCE.md in the repository. The system exposes 278 API endpoints covering intake, scoring, nurturing, marketplace, billing, and operator tools." },
      { question: "How do I embed widgets?", answer: "After onboarding, you receive a script tag for your website. The widget loads asynchronously and can be configured as a popup, inline form, chat bubble, or full-page assessment." },
      { question: "Can I use a custom domain?", answer: "Yes. Configure your custom domain in Dashboard > Settings. Point a CNAME record to your Lead OS instance. TLS certificates are provisioned automatically." },
      { question: "How is my data protected?", answer: "Lead OS uses parameterized SQL, HMAC-SHA256 token signing, webhook signature verification, SSRF protection, security headers (HSTS, CSP), rate limiting, and database-level tenant isolation via RLS policies." },
      { question: "Is Lead OS GDPR compliant?", answer: "Yes. Lead OS provides data export (/api/gdpr/export), data deletion (/api/gdpr/delete), and consent management. See our Privacy Policy for details." },
    ],
  },
];

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
    <main id="main-content" style={{ maxWidth: "48rem", margin: "0 auto", padding: "3rem 1rem" }}>
      <h1 style={{ fontSize: "2rem", fontWeight: 800, marginBottom: "0.5rem" }}>Help Center</h1>
      <p style={{ color: "#6b7280", marginBottom: "2rem" }}>
        Find answers to common questions about Lead OS.
      </p>

      <div style={{ marginBottom: "2rem" }}>
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
          style={{
            width: "100%",
            padding: "0.75rem 1rem",
            border: "1px solid #d1d5db",
            borderRadius: "0.5rem",
            fontSize: "1rem",
          }}
        />
      </div>

      {filtered.map((category) => (
        <section key={category.title} style={{ marginBottom: "2rem" }}>
          <h2 style={{ fontSize: "1.25rem", fontWeight: 700, marginBottom: "0.75rem" }}>
            {category.title}
          </h2>
          {category.items.map((item) => {
            const key = `${category.title}-${item.question}`;
            const isOpen = openItems.has(key);
            return (
              <div
                key={key}
                style={{
                  border: "1px solid #e5e7eb",
                  borderRadius: "0.375rem",
                  marginBottom: "0.5rem",
                  overflow: "hidden",
                }}
              >
                <button
                  onClick={() => toggleItem(key)}
                  aria-expanded={isOpen}
                  style={{
                    width: "100%",
                    padding: "0.75rem 1rem",
                    background: "#fafafa",
                    border: "none",
                    textAlign: "left",
                    cursor: "pointer",
                    fontWeight: 600,
                    fontSize: "0.875rem",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  {item.question}
                  <span aria-hidden="true" style={{ transform: isOpen ? "rotate(180deg)" : "none", transition: "transform 0.2s" }}>
                    &#9660;
                  </span>
                </button>
                {isOpen && (
                  <div style={{ padding: "0.75rem 1rem", fontSize: "0.875rem", color: "#4b5563", lineHeight: 1.6 }}>
                    {item.answer}
                  </div>
                )}
              </div>
            );
          })}
        </section>
      ))}

      <section
        style={{
          marginTop: "3rem",
          padding: "2rem",
          background: "#f9fafb",
          borderRadius: "0.75rem",
          textAlign: "center",
        }}
      >
        <h2 style={{ fontSize: "1.25rem", fontWeight: 700, marginBottom: "0.5rem" }}>
          Still need help?
        </h2>
        <p style={{ color: "#6b7280", marginBottom: "1rem" }}>
          Contact our support team and we will get back to you within 24 hours.
        </p>
        <Link
          href="/contact"
          style={{
            display: "inline-block",
            padding: "0.5rem 1.5rem",
            background: "#4f46e5",
            color: "#fff",
            borderRadius: "0.375rem",
            textDecoration: "none",
            fontWeight: 600,
          }}
        >
          Contact Support
        </Link>
      </section>
    </main>
  );
}
