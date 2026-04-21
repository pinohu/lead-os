export function optimizeConfig(config, outcomes = []) {
  if (!outcomes.length) {
    return { changed: false, nextConfig: config, stats: {} };
  }

  const winRate = outcomes.filter(o => o.won).length / outcomes.length;

  const next = { ...config };

  if (winRate < 0.3 && next.closer?.minScore) {
    next.closer.minScore = Math.max(40, next.closer.minScore - 5);
  }

  if (winRate > 0.7 && next.closer?.minScore) {
    next.closer.minScore = Math.min(95, next.closer.minScore + 5);
  }

  return {
    changed: true,
    nextConfig: next,
    stats: { winRate },
  };
}
