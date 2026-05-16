"use client";

// ── Niche FAQ (Inline, Native Disclosure) ─────────────────────────────
// Renders the same faqItems data that the /[niche]/faq subroute uses,
// but inline on the main page so visitors don't have to leave. Uses
// native <details>/<summary> for accessibility (keyboard, screen reader,
// no JS needed) and adds JSON-LD FAQPage schema for SEO.

import { HelpCircle, ChevronDown } from "lucide-react";
import type { NicheFaqItem } from "@/lib/niche-content";
import { useState } from "react";

interface Props {
  nicheLabel: string;
  faqItems: NicheFaqItem[];
}

export default function NicheFAQInline({ nicheLabel, faqItems }: Props) {
  // Limit to the top 8 to keep the page focused; users can see the full
  // FAQ at /[niche]/faq via the link at the bottom.
  const displayed = faqItems.slice(0, 8);

  if (displayed.length === 0) return null;

  return (
    <section
      id="faq"
      aria-labelledby="faq-heading"
      className="mx-auto max-w-4xl scroll-mt-28 px-4 py-12 sm:px-6"
    >
      <div className="mb-6 flex items-center gap-2">
        <HelpCircle
          className="h-5 w-5 text-primary"
          aria-hidden="true"
        />
        <h2 id="faq-heading" className="text-2xl font-bold tracking-tight">
          {nicheLabel} FAQ
        </h2>
      </div>
      <p className="mb-6 text-sm text-muted-foreground">
        The most common questions visitors ask about {nicheLabel.toLowerCase()}{" "}
        in Erie. Each answer is a paragraph or two — not vague filler.
      </p>

      <div className="space-y-2">
        {displayed.map((item, idx) => (
          <FAQItem key={idx} question={item.question} answer={item.answer} />
        ))}
      </div>
    </section>
  );
}

function FAQItem({ question, answer }: { question: string; answer: string }) {
  const [open, setOpen] = useState(false);
  return (
    <details
      className="group rounded-lg border border-border bg-card open:bg-muted/30"
      onToggle={(e) => setOpen((e.target as HTMLDetailsElement).open)}
    >
      <summary className="flex cursor-pointer items-center justify-between gap-3 px-5 py-4 text-left">
        <span className="text-sm font-semibold leading-tight">{question}</span>
        <ChevronDown
          className={`h-4 w-4 shrink-0 text-muted-foreground transition-transform ${
            open ? "rotate-180" : ""
          }`}
          aria-hidden="true"
        />
      </summary>
      <div className="border-t border-border px-5 py-4 text-sm leading-relaxed text-muted-foreground">
        {answer}
      </div>
    </details>
  );
}
