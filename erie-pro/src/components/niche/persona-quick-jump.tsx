"use client";

// ── Niche Persona Quick-Jump Nav ──────────────────────────────────────
// Sticky on mobile; addresses three distinct user modes the page must
// serve simultaneously: someone with an active emergency, someone
// gathering quotes, and someone in research mode. Each path lands the
// user at a different anchor on the page.

import { Phone, Search, ListChecks } from "lucide-react";
import { CONCIERGE_PHONE_DISPLAY, CONCIERGE_PHONE_TEL } from "@/lib/concierge";

interface Props {
  nicheLabel: string;
}

export default function NichePersonaQuickJump({ nicheLabel }: Props) {
  const label = nicheLabel.toLowerCase();
  return (
    <nav
      aria-label="Choose how to use this page"
      className="mx-auto max-w-4xl px-4 pb-2 sm:px-6"
    >
      <div className="grid gap-2 sm:grid-cols-3">
        <a
          href={CONCIERGE_PHONE_TEL}
          className="group flex items-center gap-3 rounded-lg border-2 border-red-200 bg-red-50 px-4 py-3 transition hover:border-red-300 hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-red-400"
        >
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-red-500 text-white">
            <Phone className="h-4 w-4" aria-hidden="true" />
          </div>
          <div className="text-left">
            <div className="text-xs font-semibold uppercase tracking-wide text-red-700">
              Right now
            </div>
            <div className="text-sm font-medium text-red-900">
              Emergency? Call {CONCIERGE_PHONE_DISPLAY}
            </div>
          </div>
        </a>
        <a
          href="#quote"
          className="group flex items-center gap-3 rounded-lg border-2 border-blue-200 bg-blue-50 px-4 py-3 transition hover:border-blue-300 hover:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-blue-400"
        >
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blue-500 text-white">
            <ListChecks className="h-4 w-4" aria-hidden="true" />
          </div>
          <div className="text-left">
            <div className="text-xs font-semibold uppercase tracking-wide text-blue-700">
              Getting quotes
            </div>
            <div className="text-sm font-medium text-blue-900">
              Start a 90-second intake
            </div>
          </div>
        </a>
        <a
          href="#guide"
          className="group flex items-center gap-3 rounded-lg border-2 border-emerald-200 bg-emerald-50 px-4 py-3 transition hover:border-emerald-300 hover:bg-emerald-100 focus:outline-none focus:ring-2 focus:ring-emerald-400"
        >
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-emerald-500 text-white">
            <Search className="h-4 w-4" aria-hidden="true" />
          </div>
          <div className="text-left">
            <div className="text-xs font-semibold uppercase tracking-wide text-emerald-700">
              Researching
            </div>
            <div className="text-sm font-medium text-emerald-900">
              {label} costs, FAQ, what to ask
            </div>
          </div>
        </a>
      </div>
    </nav>
  );
}
