export interface ExperimentVariant {
  id: string;
  name: string;
  weight: number;
  assignments: number;
  conversions: number;
}

export interface Experiment {
  id: string;
  name: string;
  description: string;
  status: "draft" | "running" | "paused" | "completed";
  variants: ExperimentVariant[];
  targetMetric: string;
  startedAt?: string;
  completedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export const experimentStore = new Map<string, Experiment>();
export const assignmentStore = new Map<string, { experimentId: string; variantId: string }>();
export const conversionStore: Array<{
  experimentId: string;
  visitorId: string;
  variantId: string;
  metric: string;
  value: number;
  timestamp: string;
}> = [];

export function generateExperimentId(): string {
  return `exp_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

export function analyzeExperiment(experiment: Experiment): {
  totalAssignments: number;
  totalConversions: number;
  overallConversionRate: number;
  variants: Array<{
    id: string;
    name: string;
    assignments: number;
    conversions: number;
    conversionRate: number;
  }>;
  leader: { id: string; name: string; conversionRate: number } | null;
  isStatisticallySignificant: boolean;
  sampleSizeReached: boolean;
} {
  const totalAssignments = experiment.variants.reduce((sum, v) => sum + v.assignments, 0);
  const totalConversions = experiment.variants.reduce((sum, v) => sum + v.conversions, 0);

  const variantAnalysis = experiment.variants.map((v) => {
    const conversionRate = v.assignments > 0 ? v.conversions / v.assignments : 0;
    return {
      id: v.id,
      name: v.name,
      assignments: v.assignments,
      conversions: v.conversions,
      conversionRate: Math.round(conversionRate * 10000) / 100,
    };
  });

  const sorted = [...variantAnalysis].sort((a, b) => b.conversionRate - a.conversionRate);
  const leader = sorted[0] ?? null;
  const isSignificant = totalAssignments >= 100 && leader !== null;

  return {
    totalAssignments,
    totalConversions,
    overallConversionRate: totalAssignments > 0
      ? Math.round((totalConversions / totalAssignments) * 10000) / 100
      : 0,
    variants: variantAnalysis,
    leader: leader ? { id: leader.id, name: leader.name, conversionRate: leader.conversionRate } : null,
    isStatisticallySignificant: isSignificant,
    sampleSizeReached: totalAssignments >= 100,
  };
}

export function selectVariant(weights: { id: string; weight: number }[]): string {
  const random = Math.random();
  let cumulative = 0;

  for (const variant of weights) {
    cumulative += variant.weight;
    if (random <= cumulative) {
      return variant.id;
    }
  }

  return weights[weights.length - 1].id;
}
