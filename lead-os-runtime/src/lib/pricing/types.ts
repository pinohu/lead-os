// src/lib/pricing/types.ts

export interface PricingSkuRow {
  id: string;
  tenantId: string;
  skuKey: string;
  label: string;
  currency: string;
  basePriceCents: number;
  currentPriceCents: number;
  demandScore: number;
  lastChangedAt: string | null;
  updatedAt: string;
}

export interface PricingNodeRow {
  id: string;
  tenantId: string;
  nodeKey: string;
  skuKey: string;
  status: string;
  learningBias: number;
  lastScanAt: string | null;
}

export interface PricingTickJobData {
  kind: "tick";
  tenantId: string;
  source?: string;
}

export interface PricingMeasureJobData {
  kind: "measure";
  outcomeId: string;
}

export interface PricingDlqJobData {
  kind: "dlq";
  sourceQueue: string;
  originalName: string;
  originalData: Record<string, unknown>;
  errorMessage: string;
  failedJobId: string | undefined;
  attemptsMade?: number;
}

export type PricingQueueJobData = PricingTickJobData | PricingMeasureJobData;
