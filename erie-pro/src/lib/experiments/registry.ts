// ── Experiment registry ──────────────────────────────────────────────
// Central place where experiments are declared. Adding a new experiment:
//   1. Add the ExperimentDef to EXPERIMENTS below
//   2. Wire `assignVariant(EXPERIMENTS.your_experiment_key, ctx)` into
//      the code path that should be tested
//   3. Record exposure via runtime.recordExposure when the variant is
//      actually USED (not just assigned — exposure is the moment the
//      visitor sees the differentiated experience)
//   4. Attribute conversions via runtime.recordConversion when the
//      success event happens
//
// Experiments are declared in CODE so they're code-reviewed and
// version-controlled. The DB only stores exposures + conversions.

import type { ExperimentDef } from "@/lib/experiments/types";

/** Did-you-mean UI from PR #51 — does it actually improve completion? */
export const DID_YOU_MEAN_UI: ExperimentDef = {
  key: "intake_did_you_mean_ui",
  description:
    "Does showing 'did you mean?' niche alternatives improve intake completion rate vs. silent routing?",
  variants: [
    {
      key: "control",
      weight: 50,
      description: "No 'did you mean?' UI — classifier picks silently",
    },
    {
      key: "show_alternatives",
      weight: 50,
      description: "Surface up to 3 alternatives when classifier confidence is ambiguous",
    },
  ],
  startedAt: "2026-05-17T00:00:00Z",
  defaultVariant: "show_alternatives", // safer-to-fail default (PR #51's behavior)
};

/** TCPA copy variant — does shorter/longer wording affect contact-step completion? */
export const TCPA_COPY_VARIANT: ExperimentDef = {
  key: "intake_tcpa_copy",
  description:
    "Does shorter TCPA disclosure copy improve the contact→complete step retention?",
  variants: [
    {
      key: "v2_full",
      weight: 50,
      description: "Current TCPA_TEXT_V2 (full version) — control",
    },
    {
      key: "v2_concise",
      weight: 50,
      description: "Shortened TCPA copy with same legal coverage",
    },
  ],
  startedAt: "2026-05-17T00:00:00Z",
  defaultVariant: "v2_full",
  // Paused by default — change to false to activate. Doing this so the
  // experiment is defined and ready but doesn't immediately affect prod.
  paused: true,
};

/** Registry — array form for analytics iteration. */
export const EXPERIMENTS: readonly ExperimentDef[] = [
  DID_YOU_MEAN_UI,
  TCPA_COPY_VARIANT,
];

/** Map form for direct lookup. */
export const EXPERIMENTS_BY_KEY: Record<string, ExperimentDef> = Object.fromEntries(
  EXPERIMENTS.map((e) => [e.key, e])
);
