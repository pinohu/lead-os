// src/lib/gtm/merge.ts
// Merge canonical GTM config with persisted operator status.

import type { GtmUseCase } from "../../config/gtm-use-cases.ts";
import { executionSurfacesForUseCase } from "./execution-links.ts";
import type { GtmStatusRow } from "./store.ts";
import type { GtmOperatorStatus } from "./status.ts";

export interface GtmUseCaseWithStatus extends GtmUseCase {
  status: GtmOperatorStatus;
  notes: string;
  executionSurfaces: ReturnType<typeof executionSurfacesForUseCase>;
  updatedAt: string | null;
  updatedBy: string | null;
}

function rowMap(rows: GtmStatusRow[]): Map<string, GtmStatusRow> {
  return new Map(rows.map((r) => [r.slug, r]));
}

export function mergeGtmUseCasesWithStatus(
  cases: readonly GtmUseCase[],
  rows: GtmStatusRow[],
): GtmUseCaseWithStatus[] {
  const map = rowMap(rows);
  return cases.map((c) => {
    const row = map.get(c.slug);
    return {
      ...c,
      status: row?.status ?? "not_started",
      notes: row?.notes ?? "",
      executionSurfaces: executionSurfacesForUseCase(c.technicalAnchors),
      updatedAt: row?.updatedAt ?? null,
      updatedBy: row?.updatedBy ?? null,
    };
  });
}
