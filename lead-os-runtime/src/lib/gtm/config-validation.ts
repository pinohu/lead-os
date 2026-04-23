// src/lib/gtm/config-validation.ts
// Runtime validation for GTM_USE_CASES (CLI + API boot checks).

import type { GtmUseCase } from "@/config/gtm-use-cases";

export interface GtmConfigValidationResult {
  ok: true;
}

export interface GtmConfigValidationError {
  ok: false;
  message: string;
  details?: string[];
}

export type GtmConfigValidation = GtmConfigValidationResult | GtmConfigValidationError;

export function validateGtmUseCasesConfig(cases: readonly GtmUseCase[]): GtmConfigValidation {
  const details: string[] = [];
  const ids = new Set<number>();
  const slugs = new Set<string>();
  const aliasSet = new Set<string>();

  for (const c of cases) {
    if (!Number.isInteger(c.id) || c.id < 1) details.push(`Invalid id for slug "${c.slug}": ${c.id}`);
    if (ids.has(c.id)) details.push(`Duplicate id: ${c.id}`);
    ids.add(c.id);

    if (!c.slug || typeof c.slug !== "string" || !/^[a-z0-9-]+$/.test(c.slug)) {
      details.push(`Invalid slug for id ${c.id}: ${String(c.slug)}`);
    } else if (slugs.has(c.slug)) details.push(`Duplicate slug: ${c.slug}`);
    else slugs.add(c.slug);

    const aliases = c.slugAliases ?? [];
    for (const a of aliases) {
      if (!a || typeof a !== "string" || !/^[a-z0-9-]+$/.test(a)) {
        details.push(`Invalid slugAlias on "${c.slug}": ${String(a)}`);
        continue;
      }
      if (slugs.has(a) || aliasSet.has(a)) details.push(`Alias "${a}" collides with another slug or alias`);
      aliasSet.add(a);
    }

    if (!c.title?.trim()) details.push(`Missing title for id ${c.id}`);
    if (!Array.isArray(c.technicalAnchors)) details.push(`technicalAnchors must be an array (id ${c.id})`);
    if (!Array.isArray(c.envKeys)) details.push(`envKeys must be an array (id ${c.id})`);
    if (!Array.isArray(c.weekOneActions)) details.push(`weekOneActions must be an array (id ${c.id})`);
  }

  if (details.length) return { ok: false, message: "GTM_USE_CASES config is invalid", details };
  return { ok: true };
}

export function assertValidGtmConfig(cases: readonly GtmUseCase[]): void {
  const r = validateGtmUseCasesConfig(cases);
  if (!r.ok) {
    const extra = r.details?.length ? `\n${r.details.join("\n")}` : "";
    throw new Error(`${r.message}${extra}`);
  }
}
