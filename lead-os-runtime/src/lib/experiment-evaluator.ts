import {
  type Experiment,
  type ExperimentSurface,
  listRunningExperiments,
  analyzeExperiment,
  promoteWinner,
  stopExperiment,
  computeConfidence,
  computeZScore,
} from "./experiment-engine.ts";

export interface EvaluationResult {
  experimentId: string;
  surface: ExperimentSurface;
  action: "promote" | "stop" | "continue" | "insufficient-data";
  winnerId?: string;
  lift?: number;
  confidence: number;
  sampleSize: number;
  reason: string;
}

export interface EvaluationSummary {
  evaluatedAt: string;
  experimentsChecked: number;
  promoted: number;
  stopped: number;
  continuing: number;
  results: EvaluationResult[];
}

const CONFIDENCE_THRESHOLD = 0.95;
const MINIMUM_VISITORS_PER_VARIANT = 100;
const EARLY_STOP_CONFIDENCE = 0.99;
const EARLY_STOP_DEGRADATION = -0.15;

export async function evaluateAllExperiments(tenantId?: string): Promise<EvaluationSummary> {
  const experiments = await listRunningExperiments(tenantId);
  const results: EvaluationResult[] = [];

  for (const experiment of experiments) {
    const result = await evaluateSingleExperiment(experiment);
    results.push(result);
  }

  return {
    evaluatedAt: new Date().toISOString(),
    experimentsChecked: experiments.length,
    promoted: results.filter((r) => r.action === "promote").length,
    stopped: results.filter((r) => r.action === "stop").length,
    continuing: results.filter((r) => r.action === "continue" || r.action === "insufficient-data").length,
    results,
  };
}

export async function evaluateSingleExperiment(experiment: Experiment): Promise<EvaluationResult> {
  const controlVariant = experiment.variants.find((v) => v.isControl);

  if (!controlVariant) {
    return {
      experimentId: experiment.id,
      surface: experiment.surface,
      action: "continue",
      confidence: 0,
      sampleSize: 0,
      reason: "No control variant defined — cannot compute statistical significance",
    };
  }

  const analysis = await analyzeExperiment(experiment.id);
  const controlAnalysis = analysis.variants.find((v) => v.variantId === controlVariant.id);
  const controlVisitors = controlAnalysis?.visitors ?? 0;
  const controlRate = controlAnalysis?.conversionRate ?? 0;

  const hasMinimumData = experiment.variants.every((v) => {
    const va = analysis.variants.find((a) => a.variantId === v.id);
    return (va?.visitors ?? 0) >= MINIMUM_VISITORS_PER_VARIANT;
  });

  if (!hasMinimumData) {
    const totalNeeded = MINIMUM_VISITORS_PER_VARIANT * experiment.variants.length;
    return {
      experimentId: experiment.id,
      surface: experiment.surface,
      action: "insufficient-data",
      confidence: 0,
      sampleSize: analysis.sampleSize,
      reason: `Need at least ${MINIMUM_VISITORS_PER_VARIANT} visitors per variant (${totalNeeded} total). Have ${analysis.sampleSize}.`,
    };
  }

  for (const variant of experiment.variants) {
    if (variant.id === controlVariant.id) continue;

    const va = analysis.variants.find((a) => a.variantId === variant.id);
    if (!va) continue;

    const zScore = computeZScore(controlRate, va.conversionRate, controlVisitors, va.visitors);
    const confidence = computeConfidence(zScore);
    const improvement = controlRate > 0 ? (va.conversionRate - controlRate) / controlRate : 0;

    if (improvement < EARLY_STOP_DEGRADATION && confidence >= EARLY_STOP_CONFIDENCE) {
      await stopExperiment(
        experiment.id,
        `Variant "${variant.name}" is significantly worse than control (${(improvement * 100).toFixed(1)}% at ${(confidence * 100).toFixed(1)}% confidence). Rollback threshold: ${(experiment.rollbackThreshold * 100).toFixed(0)}%.`,
      );
      return {
        experimentId: experiment.id,
        surface: experiment.surface,
        action: "stop",
        confidence,
        sampleSize: analysis.sampleSize,
        reason: `Early stopped: variant "${variant.name}" degraded by ${(improvement * 100).toFixed(1)}%`,
      };
    }

    if (improvement < -experiment.rollbackThreshold && va.visitors >= MINIMUM_VISITORS_PER_VARIANT) {
      await stopExperiment(
        experiment.id,
        `Variant "${variant.name}" degraded conversion by ${(Math.abs(improvement) * 100).toFixed(1)}%, exceeding rollback threshold of ${(experiment.rollbackThreshold * 100).toFixed(0)}%.`,
      );
      return {
        experimentId: experiment.id,
        surface: experiment.surface,
        action: "stop",
        confidence,
        sampleSize: analysis.sampleSize,
        reason: `Rollback: variant "${variant.name}" exceeded degradation threshold`,
      };
    }
  }

  let bestVariantId: string | null = null;
  let bestLift = 0;
  let bestConfidence = 0;

  for (const variant of experiment.variants) {
    if (variant.id === controlVariant.id) continue;

    const va = analysis.variants.find((a) => a.variantId === variant.id);
    if (!va || va.visitors < MINIMUM_VISITORS_PER_VARIANT) continue;

    const zScore = computeZScore(controlRate, va.conversionRate, controlVisitors, va.visitors);
    const confidence = computeConfidence(zScore);
    const improvement = controlRate > 0 ? (va.conversionRate - controlRate) / controlRate : 0;

    if (improvement > 0 && confidence >= CONFIDENCE_THRESHOLD && improvement > bestLift) {
      bestVariantId = variant.id;
      bestLift = improvement;
      bestConfidence = confidence;
    }
  }

  if (bestVariantId && analysis.sampleSize >= experiment.minimumSampleSize) {
    const winnerVariant = experiment.variants.find((v) => v.id === bestVariantId);
    await promoteWinner(experiment.id, bestVariantId, bestLift);

    return {
      experimentId: experiment.id,
      surface: experiment.surface,
      action: "promote",
      winnerId: bestVariantId,
      lift: bestLift,
      confidence: bestConfidence,
      sampleSize: analysis.sampleSize,
      reason: `Winner: "${winnerVariant?.name}" with ${(bestLift * 100).toFixed(1)}% lift at ${(bestConfidence * 100).toFixed(1)}% confidence`,
    };
  }

  return {
    experimentId: experiment.id,
    surface: experiment.surface,
    action: "continue",
    confidence: bestConfidence,
    sampleSize: analysis.sampleSize,
    reason: bestConfidence > 0
      ? `Best variant at ${(bestConfidence * 100).toFixed(1)}% confidence — need ${(CONFIDENCE_THRESHOLD * 100).toFixed(0)}% to declare winner`
      : "No variant outperforming control yet. Collecting more data.",
  };
}
