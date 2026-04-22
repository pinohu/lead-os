export type PriceComputationInput = {
  leads: number;
  revenue: number;
  roi: number;
  churnRisk: "LOW" | "MEDIUM" | "HIGH";
};

export function computePrice({ leads, revenue, roi, churnRisk }: PriceComputationInput) {
  let base = 1000;

  if (leads > 50) base += 500;
  if (leads > 100) base += 1000;

  if (roi > 5) base += 500;
  if (roi > 10) base += 1000;

  if (revenue > 25000) base += 250;
  if (revenue > 50000) base += 500;

  if (churnRisk === "HIGH") base -= 300;
  if (churnRisk === "MEDIUM") base -= 100;

  if (base < 300) base = 300;

  return base;
}

export function simulatePricingDecision(input: PriceComputationInput & { currentPrice?: number }) {
  const recommendedPrice = computePrice(input);
  const currentPrice = input.currentPrice ?? 1000;
  const delta = recommendedPrice - currentPrice;
  const deltaPct = currentPrice > 0 ? (delta / currentPrice) * 100 : 0;

  const demandSensitivity = input.churnRisk === "HIGH" ? 0.8 : input.churnRisk === "MEDIUM" ? 0.5 : 0.3;
  const expectedRevenueLift = Math.round(Math.max(-0.25, 0.18 - demandSensitivity * (deltaPct / 100)) * input.revenue);
  const projectedRevenue = input.revenue + expectedRevenueLift;
  const downsidePct = Math.min(0, -Math.abs(deltaPct) * 0.004 - (input.churnRisk === "HIGH" ? 0.06 : input.churnRisk === "MEDIUM" ? 0.03 : 0.01));
  const probChurnHigh = Math.min(0.95, Math.max(0.02, (input.churnRisk === "HIGH" ? 0.35 : input.churnRisk === "MEDIUM" ? 0.18 : 0.08) + Math.max(0, deltaPct) * 0.004));

  return {
    currentPrice,
    recommendedPrice,
    priceChange: delta,
    priceChangePercent: Number(deltaPct.toFixed(2)),
    expectedRevenueLift,
    projectedRevenue,
    projectedP10Revenue: Math.round(projectedRevenue * (1 + downsidePct)),
    projectedDownsidePercent: Number((downsidePct * 100).toFixed(2)),
    probChurnHigh: Number(probChurnHigh.toFixed(4)),
  };
}

export async function applyStripePricing(input: {
  subscriptionId: string;
  subscriptionItemId: string;
  newPriceId: string;
  mode?: string;
  effectiveDate?: string;
}) {
  return {
    ok: true,
    mode: input.mode ?? "immediate",
    effectiveDate: input.effectiveDate ?? null,
    subscriptionId: input.subscriptionId,
    subscriptionItemId: input.subscriptionItemId,
    newPriceId: input.newPriceId,
    dryRun: true,
  };
}
