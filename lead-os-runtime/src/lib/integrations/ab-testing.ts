import { randomUUID } from "crypto";
import {
  experimentStore as localExperimentStore,
  assignmentStore as localAssignmentStore,
  conversionStore as localConversionStore,
  selectVariant,
  analyzeExperiment as analyzeLocalExperiment,
  generateExperimentId,
  type ExperimentVariant as LocalVariant,
} from "../experiment-store.ts";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface Experiment {
  id: string;
  name: string;
  hypothesis: string;
  variations: { id: string; name: string; weight: number }[];
  targetingRules?: { attribute: string; condition: string; value: string }[];
  metrics: string[];
  status: "draft" | "running" | "stopped" | "completed";
}

export interface ExperimentResult {
  experimentId: string;
  variations: {
    id: string;
    name: string;
    visitors: number;
    conversions: number;
    conversionRate: number;
    revenue: number;
    revenuePerVisitor: number;
    chanceToBeatControl: number;
  }[];
  winner?: string;
  significanceLevel: number;
  recommendedAction: "keep-running" | "declare-winner" | "stop-losing";
}

// ---------------------------------------------------------------------------
// In-memory store
// ---------------------------------------------------------------------------

const experimentStore = new Map<string, Experiment>();

// Tracks conversion events: experimentId -> userId -> { metric, value }[]
const conversionStore = new Map<string, { userId: string; metric: string; value: number; variationId: string }[]>();

// Tracks user assignments: `${experimentId}:${userId}` -> variationId
const assignmentStore = new Map<string, string>();

export function resetABTestingStore(): void {
  experimentStore.clear();
  conversionStore.clear();
  assignmentStore.clear();
}

// ---------------------------------------------------------------------------
// Config detection
// ---------------------------------------------------------------------------

function getGrowthBookConfig(): { apiKey: string; baseUrl: string } | undefined {
  const apiKey = process.env["GROWTHBOOK_API_KEY"];
  const baseUrl = process.env["GROWTHBOOK_URL"];

  if (
    typeof apiKey === "string" && apiKey.trim().length > 0 &&
    typeof baseUrl === "string" && baseUrl.trim().length > 0
  ) {
    return { apiKey: apiKey.trim(), baseUrl: baseUrl.trim() };
  }

  return undefined;
}

// ---------------------------------------------------------------------------
// GrowthBook API helpers
// ---------------------------------------------------------------------------

async function growthbookRequest<T>(
  config: { apiKey: string; baseUrl: string },
  method: string,
  path: string,
  body?: unknown,
): Promise<T> {
  const endpoint = config.baseUrl.replace(/\/$/, "");
  const response = await fetch(`${endpoint}${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${config.apiKey}`,
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  if (!response.ok) {
    throw new Error(`GrowthBook ${method} ${path} returned ${response.status}`);
  }

  return response.json() as Promise<T>;
}

type GrowthBookExperiment = {
  id: string;
  name?: string;
  hypothesis?: string;
  status?: string;
  variations?: { id: string; name: string; weight: number }[];
  metrics?: string[];
  phases?: { targetingCondition?: string }[];
};

function mapGrowthBookExperiment(gb: GrowthBookExperiment): Experiment {
  return {
    id: gb.id,
    name: gb.name ?? "",
    hypothesis: gb.hypothesis ?? "",
    variations: gb.variations ?? [],
    metrics: gb.metrics ?? [],
    status: (gb.status as Experiment["status"]) ?? "draft",
  };
}

// ---------------------------------------------------------------------------
// Local fallback helpers
// ---------------------------------------------------------------------------

function toLocalVariant(v: { id: string; name: string; weight: number }): LocalVariant {
  return { id: v.id, name: v.name, weight: v.weight, assignments: 0, conversions: 0 };
}

function syncToLocalStore(experiment: Experiment): void {
  const existing = localExperimentStore.get(experiment.id);
  localExperimentStore.set(experiment.id, {
    id: experiment.id,
    name: experiment.name,
    description: experiment.hypothesis,
    status: experiment.status === "stopped" ? "paused" : experiment.status,
    variants: experiment.variations.map(toLocalVariant),
    targetMetric: experiment.metrics[0] ?? "conversion",
    startedAt: experiment.status === "running" ? new Date().toISOString() : existing?.startedAt,
    createdAt: existing?.createdAt ?? new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });
}

// ---------------------------------------------------------------------------
// Experiment CRUD
// ---------------------------------------------------------------------------

export async function createExperiment(
  input: Omit<Experiment, "id" | "status">,
): Promise<Experiment> {
  const config = getGrowthBookConfig();

  if (config) {
    try {
      const data = await growthbookRequest<{ experiment: GrowthBookExperiment }>(
        config,
        "POST",
        "/api/v1/experiments",
        {
          name: input.name,
          hypothesis: input.hypothesis,
          variations: input.variations,
          metrics: input.metrics,
          status: "draft",
        },
      );

      const experiment = mapGrowthBookExperiment(data.experiment);
      experimentStore.set(experiment.id, experiment);
      syncToLocalStore(experiment);
      return experiment;
    } catch {
      // fall through to local
    }
  }

  const experiment: Experiment = {
    id: generateExperimentId(),
    ...input,
    status: "draft",
  };

  experimentStore.set(experiment.id, experiment);
  syncToLocalStore(experiment);
  return experiment;
}

export async function getExperiment(id: string): Promise<Experiment | undefined> {
  const cached = experimentStore.get(id);
  if (cached) return cached;

  const config = getGrowthBookConfig();
  if (config) {
    try {
      const data = await growthbookRequest<{ experiment: GrowthBookExperiment }>(
        config,
        "GET",
        `/api/v1/experiments/${id}`,
      );

      const experiment = mapGrowthBookExperiment(data.experiment);
      experimentStore.set(experiment.id, experiment);
      return experiment;
    } catch {
      return undefined;
    }
  }

  return undefined;
}

export async function listExperiments(status?: string): Promise<Experiment[]> {
  const config = getGrowthBookConfig();

  if (config) {
    try {
      const path = status ? `/api/v1/experiments?status=${encodeURIComponent(status)}` : "/api/v1/experiments";
      const data = await growthbookRequest<{ experiments: GrowthBookExperiment[] }>(config, "GET", path);
      const experiments = data.experiments.map(mapGrowthBookExperiment);
      for (const e of experiments) {
        experimentStore.set(e.id, e);
      }
      return experiments;
    } catch {
      // fall through to local
    }
  }

  const all = [...experimentStore.values()];
  return status ? all.filter((e) => e.status === status) : all;
}

export async function startExperiment(id: string): Promise<Experiment> {
  const experiment = await getExperiment(id);
  if (!experiment) throw new Error(`Experiment ${id} not found`);

  const updated: Experiment = { ...experiment, status: "running" };

  const config = getGrowthBookConfig();
  if (config) {
    try {
      await growthbookRequest(config, "POST", `/api/v1/experiments/${id}/start`);
    } catch {
      // continue with local update
    }
  }

  experimentStore.set(id, updated);
  syncToLocalStore(updated);
  return updated;
}

export async function stopExperiment(id: string): Promise<Experiment> {
  const experiment = await getExperiment(id);
  if (!experiment) throw new Error(`Experiment ${id} not found`);

  const updated: Experiment = { ...experiment, status: "stopped" };

  const config = getGrowthBookConfig();
  if (config) {
    try {
      await growthbookRequest(config, "POST", `/api/v1/experiments/${id}/stop`);
    } catch {
      // continue with local update
    }
  }

  experimentStore.set(id, updated);
  syncToLocalStore(updated);
  return updated;
}

// ---------------------------------------------------------------------------
// Assignment
// ---------------------------------------------------------------------------

export async function getVariation(
  experimentId: string,
  userId: string,
  attributes?: Record<string, string>,
): Promise<string> {
  const assignmentKey = `${experimentId}:${userId}`;
  const existing = localAssignmentStore.get(assignmentKey);
  if (existing) return existing.variantId;

  const cached = assignmentStore.get(assignmentKey);
  if (cached) return cached;

  const experiment = await getExperiment(experimentId);
  if (!experiment || experiment.status !== "running") {
    // Return control (first variation) when experiment is not running
    return experiment?.variations[0]?.id ?? "control";
  }

  // Apply targeting rules if provided
  if (experiment.targetingRules && attributes) {
    const blocked = experiment.targetingRules.some((rule) => {
      const attrValue = attributes[rule.attribute];
      if (attrValue === undefined) return false;
      if (rule.condition === "equals") return attrValue !== rule.value;
      if (rule.condition === "not_equals") return attrValue === rule.value;
      if (rule.condition === "contains") return !attrValue.includes(rule.value);
      return false;
    });

    if (blocked) return experiment.variations[0]?.id ?? "control";
  }

  const variantId = selectVariant(experiment.variations.map((v) => ({ id: v.id, weight: v.weight })));

  assignmentStore.set(assignmentKey, variantId);
  localAssignmentStore.set(assignmentKey, { experimentId, variantId });

  // Update assignment count on local store variant
  const localExp = localExperimentStore.get(experimentId);
  if (localExp) {
    const variant = localExp.variants.find((v) => v.id === variantId);
    if (variant) variant.assignments += 1;
  }

  return variantId;
}

// ---------------------------------------------------------------------------
// Conversion tracking
// ---------------------------------------------------------------------------

export async function trackConversion(
  experimentId: string,
  userId: string,
  metric: string,
  value = 1,
): Promise<void> {
  const assignmentKey = `${experimentId}:${userId}`;
  const variationId = assignmentStore.get(assignmentKey)
    ?? localAssignmentStore.get(assignmentKey)?.variantId
    ?? "control";

  const existing = conversionStore.get(experimentId) ?? [];
  existing.push({ userId, metric, value, variationId });
  conversionStore.set(experimentId, existing);

  // Mirror to local store for analysis
  localConversionStore.push({
    experimentId,
    visitorId: userId,
    variantId: variationId,
    metric,
    value,
    timestamp: new Date().toISOString(),
  });

  // Update conversion count on local store variant
  const localExp = localExperimentStore.get(experimentId);
  if (localExp) {
    const variant = localExp.variants.find((v) => v.id === variationId);
    if (variant) variant.conversions += 1;
  }

  const config = getGrowthBookConfig();
  if (config) {
    try {
      await growthbookRequest(config, "POST", `/api/v1/experiments/${experimentId}/track`, {
        userId,
        metric,
        value,
        variationId,
        timestamp: new Date().toISOString(),
      });
    } catch {
      // local tracking is already recorded, ignore remote failure
    }
  }
}

// ---------------------------------------------------------------------------
// Analysis
// ---------------------------------------------------------------------------

export async function analyzeExperiment(id: string): Promise<ExperimentResult> {
  const experiment = await getExperiment(id);
  if (!experiment) throw new Error(`Experiment ${id} not found`);

  const conversions = conversionStore.get(id) ?? [];
  const allAssignments = [...assignmentStore.entries()]
    .filter(([key]) => key.startsWith(`${id}:`))
    .map(([key, variationId]) => ({ userId: key.split(":")[1], variationId }));

  const control = experiment.variations[0];

  const variationResults = experiment.variations.map((variation) => {
    const visitors = allAssignments.filter((a) => a.variationId === variation.id).length;
    const varConversions = conversions.filter((c) => c.variationId === variation.id);
    const uniqueConverters = new Set(varConversions.map((c) => c.userId)).size;
    const revenue = varConversions.reduce((sum, c) => sum + c.value, 0);

    const conversionRate = visitors > 0 ? uniqueConverters / visitors : 0;
    const revenuePerVisitor = visitors > 0 ? revenue / visitors : 0;

    return {
      id: variation.id,
      name: variation.name,
      visitors,
      conversions: uniqueConverters,
      conversionRate,
      revenue,
      revenuePerVisitor,
      chanceToBeatControl: 0, // computed below
    };
  });

  const controlResult = variationResults.find((v) => v.id === control?.id);

  // Compute chance to beat control using a simple Z-score approximation
  for (const variation of variationResults) {
    if (!controlResult || variation.id === control?.id) {
      variation.chanceToBeatControl = 0.5;
      continue;
    }

    const n1 = controlResult.visitors;
    const n2 = variation.visitors;
    const p1 = controlResult.conversionRate;
    const p2 = variation.conversionRate;

    if (n1 === 0 || n2 === 0 || (p1 === 0 && p2 === 0)) {
      variation.chanceToBeatControl = 0.5;
      continue;
    }

    const pooled = (p1 * n1 + p2 * n2) / (n1 + n2);
    const se = Math.sqrt(pooled * (1 - pooled) * (1 / n1 + 1 / n2));

    if (se === 0) {
      variation.chanceToBeatControl = p2 > p1 ? 1 : 0;
      continue;
    }

    const z = (p2 - p1) / se;
    // Normal CDF approximation (Horner's method)
    const absZ = Math.abs(z);
    const t = 1 / (1 + 0.2316419 * absZ);
    const poly = t * (0.319381530 + t * (-0.356563782 + t * (1.781477937 + t * (-1.821255978 + t * 1.330274429))));
    const normalCdf = 1 - (1 / Math.sqrt(2 * Math.PI)) * Math.exp(-0.5 * z * z) * poly;

    variation.chanceToBeatControl = Math.min(Math.max(normalCdf, 0), 1);
  }

  const significanceLevel = 0.95;
  const winner = variationResults.find(
    (v) => v.chanceToBeatControl >= significanceLevel && v.id !== control?.id,
  );

  const loser = variationResults.find(
    (v) => v.id !== control?.id && v.chanceToBeatControl <= (1 - significanceLevel),
  );

  let recommendedAction: ExperimentResult["recommendedAction"] = "keep-running";
  if (winner) recommendedAction = "declare-winner";
  else if (loser) recommendedAction = "stop-losing";

  return {
    experimentId: id,
    variations: variationResults,
    winner: winner?.id,
    significanceLevel,
    recommendedAction,
  };
}

// ---------------------------------------------------------------------------
// Lead OS specific helpers
// ---------------------------------------------------------------------------

export async function createFunnelExperiment(
  tenantId: string,
  funnelName: string,
  variations: { name: string; config: Record<string, unknown> }[],
): Promise<Experiment> {
  return createExperiment({
    name: `[${tenantId}] Funnel: ${funnelName}`,
    hypothesis: `Testing ${variations.length} variations of the ${funnelName} funnel to find the highest-converting layout and copy.`,
    variations: variations.map((v, i) => ({
      id: randomUUID(),
      name: v.name,
      weight: 1 / variations.length,
    })),
    metrics: ["conversion", "revenue", "time_on_page"],
    targetingRules: [{ attribute: "tenantId", condition: "equals", value: tenantId }],
  });
}

export async function createOfferExperiment(
  tenantId: string,
  offers: { name: string; offer: Record<string, unknown> }[],
): Promise<Experiment> {
  return createExperiment({
    name: `[${tenantId}] Offer Test`,
    hypothesis: `Testing ${offers.length} different offers to identify which drives the highest acceptance rate and revenue.`,
    variations: offers.map((o) => ({
      id: randomUUID(),
      name: o.name,
      weight: 1 / offers.length,
    })),
    metrics: ["offer_acceptance", "revenue", "conversion"],
    targetingRules: [{ attribute: "tenantId", condition: "equals", value: tenantId }],
  });
}
