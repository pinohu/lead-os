// src/lib/pricing/autopilot-engine.ts
// Simulation + demand-biased proposal; safety policy applies after.

export interface AutopilotInput {
  basePriceCents: number;
  currentPriceCents: number;
  demandScore: number;
  learningBias?: number;
}

export interface SimulationResult {
  simulatedPriceCents: number;
  expectedRelativeLift: number;
  confidence: number;
  scenario: "baseline_demand" | "stressed_demand";
}

export function runPriceSimulation(input: AutopilotInput): SimulationResult {
  const demand = Math.min(1, Math.max(0, input.demandScore + (input.learningBias ?? 0)));
  const lift = (demand - 0.5) * 0.08;
  const simulatedPriceCents = Math.max(
    1,
    Math.round(input.currentPriceCents * (1 + lift)),
  );
  const expectedRelativeLift = Number(
    ((simulatedPriceCents - input.currentPriceCents) / input.currentPriceCents).toFixed(6),
  );
  const confidence = Number((0.55 + Math.abs(demand - 0.5) * 0.8).toFixed(4));
  return {
    simulatedPriceCents,
    expectedRelativeLift,
    confidence: Math.min(0.99, Math.max(0.1, confidence)),
    scenario: demand >= 0.5 ? "stressed_demand" : "baseline_demand",
  };
}

export function proposeNextPriceCents(input: AutopilotInput): number {
  const sim = runPriceSimulation(input);
  return sim.simulatedPriceCents;
}

export function evolveDemandScore(previous: number, epochMs: number): number {
  const t = Math.sin(epochMs / 3_600_000) * 0.018;
  const next = previous + t;
  return Math.min(1, Math.max(0, Number(next.toFixed(4))));
}
