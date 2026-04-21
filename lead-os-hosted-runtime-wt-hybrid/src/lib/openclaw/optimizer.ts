import { summarizeOutcomes } from "./outcomes";

export function optimizeConfig(currentConfig) {
  const stats = summarizeOutcomes();
  const nextConfig = JSON.parse(JSON.stringify(currentConfig || {}));

  if (!nextConfig.closer) {
    nextConfig.closer = { enabled: true, minScore: 70 };
  }

  if (stats.total >= 10) {
    if (stats.winRate < 0.25) {
      nextConfig.closer.minScore = Math.max(40, (nextConfig.closer.minScore || 70) - 5);
    } else if (stats.winRate > 0.5) {
      nextConfig.closer.minScore = Math.min(90, (nextConfig.closer.minScore || 70) + 5);
    }
  }

  return {
    stats,
    nextConfig,
    changed: JSON.stringify(nextConfig) !== JSON.stringify(currentConfig || {})
  };
}
