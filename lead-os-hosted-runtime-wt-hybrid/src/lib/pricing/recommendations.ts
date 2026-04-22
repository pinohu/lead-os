import { computePrice } from "./engine";

export function generatePricingRecommendation(nodeMetrics) {
  const { leads, revenue, roi, churnRisk, nodeId } = nodeMetrics;

  const recommendedPrice = computePrice({ leads, revenue, roi, churnRisk });

  let label = "standard";

  if (recommendedPrice > 2000) label = "premium";
  if (recommendedPrice > 3000) label = "dominant";
  if (recommendedPrice < 800) label = "starter";

  return {
    nodeId,
    recommendedPrice,
    label,
    reason: {
      leads,
      roi,
      churnRisk,
    },
  };
}
