// src/lib/gtm/merge.ts
// Merge canonical GTM config with persisted operator status.

import type { GtmUseCase } from "@/config/gtm-use-cases";
import { executionSurfacesForUseCase } from "@/lib/gtm/execution-links";
import type { GtmStatusRow } from "@/lib/gtm/store";
import type { GtmOperatorStatus } from "@/lib/gtm/status";

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
