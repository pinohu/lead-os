"use client";

// Client component that mounts the IntakeWidget and falls back to the
// legacy LeadForm on unrecoverable error. Kept separate from the
// server-side IntakeOrForm so the form variant can skip loading the
// intake widget bundle entirely.

import { useState } from "react";
import IntakeWidget from "./intake-widget";
import LeadForm from "./lead-form";

interface Props {
  nicheSlug: string;
  nicheLabel: string;
  citySlug: string;
  cityName: string;
}

export default function IntakeOrFormClient({
  nicheSlug,
  nicheLabel,
  citySlug,
  cityName,
}: Props) {
  const [fellBackToForm, setFellBackToForm] = useState(false);

  if (fellBackToForm) {
    return (
      <div>
        <div className="mb-3 text-xs text-gray-500">
          Use the form below to send your request:
        </div>
        <LeadForm
          nicheSlug={nicheSlug}
          nicheLabel={nicheLabel}
          citySlug={citySlug}
          cityName={cityName}
        />
      </div>
    );
  }

  return (
    <IntakeWidget
      nicheSlug={nicheSlug}
      nicheLabel={nicheLabel}
      onFatalError={() => setFellBackToForm(true)}
    />
  );
}
