import type { ScoringWeightOverrides } from "./scoring-engine.ts";

const scoringConfigStore = new Map<string, ScoringWeightOverrides>();

export function getScoringConfig(tenantId: string): ScoringWeightOverrides | undefined {
  return scoringConfigStore.get(tenantId);
}

export function setScoringConfig(tenantId: string, overrides: ScoringWeightOverrides): void {
  scoringConfigStore.set(tenantId, overrides);
}

export function deleteScoringConfig(tenantId: string): boolean {
  return scoringConfigStore.delete(tenantId);
}

export function resetScoringConfigStore(): void {
  scoringConfigStore.clear();
}
