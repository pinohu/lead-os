// ── Niche Vetting Checklist ───────────────────────────────────────────
// Persona: "I want to vet providers before I hire."
// Renders a standard checklist of questions every consumer should ask a
// service provider, augmented with niche-specific add-ons (from
// niche-content.comparisonPoints) when present.

import { ClipboardList } from "lucide-react";

interface Props {
  nicheLabel: string;
  comparisonPoints: string[];
}

// Universal vetting questions — apply to virtually any home/services niche
const UNIVERSAL_QUESTIONS = [
  "Are you licensed in Pennsylvania? Can I see proof?",
  "What does your insurance cover, and is your worker's comp current?",
  "How long have you been in business under this name?",
  "Can you share three recent references from similar jobs?",
  "Is the quote fixed-price or time-and-materials?",
  "Do you pull permits, or do I?",
  "What's your warranty on the work?",
  "Who shows up to do the work — your team or a subcontractor?",
  "What's the payment schedule? (Avoid >30% upfront.)",
  "How do you handle change orders mid-project?",
];

export default function NicheVettingChecklist({
  nicheLabel,
  comparisonPoints,
}: Props) {
  // Use up to 3 niche-specific comparison points as extra questions
  const nicheSpecific = comparisonPoints.slice(0, 3);

  return (
    <section
      id="vetting"
      aria-labelledby="vetting-heading"
      className="mx-auto max-w-4xl scroll-mt-28 px-4 py-12 sm:px-6"
    >
      <div className="mb-6 flex items-center gap-2">
        <ClipboardList
          className="h-5 w-5 text-primary"
          aria-hidden="true"
        />
        <h2
          id="vetting-heading"
          className="text-2xl font-bold tracking-tight"
        >
          Questions to ask any {nicheLabel.toLowerCase()} contractor
        </h2>
      </div>
      <p className="mb-6 text-sm text-muted-foreground">
        A short checklist that separates real pros from operators who
        won't be around in six months. Copy and bring it to any quote
        conversation.
      </p>

      <ol
        className="space-y-3 rounded-lg border border-border bg-card p-6"
        aria-label="Contractor vetting checklist"
      >
        {UNIVERSAL_QUESTIONS.map((q, i) => (
          <li key={q} className="flex gap-3">
            <span
              aria-hidden="true"
              className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary"
            >
              {i + 1}
            </span>
            <span className="text-sm leading-relaxed">{q}</span>
          </li>
        ))}
        {nicheSpecific.length > 0 && (
          <>
            <li className="border-t border-border pt-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Specific to {nicheLabel.toLowerCase()}
            </li>
            {nicheSpecific.map((q, i) => (
              <li key={q} className="flex gap-3">
                <span
                  aria-hidden="true"
                  className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary"
                >
                  {UNIVERSAL_QUESTIONS.length + i + 1}
                </span>
                <span className="text-sm leading-relaxed">{q}</span>
              </li>
            ))}
          </>
        )}
      </ol>
    </section>
  );
}
