export type NodeState = "NEW" | "GROWING" | "SATURATED" | "UNSTABLE";
export type ChurnRisk = "LOW" | "MEDIUM" | "HIGH";

export type StrategyAction =
  | { type: "adjust_price"; deltaPct: number }
  | { type: "hold_price" }
  | { type: "discount"; deltaPct: number }
  | { type: "expand" }
  | { type: "boost_allocation" }
  | { type: "reduce_allocation" };

export type MonteCarloSummary = {
  expectedRevenue: number;
  p10Revenue: number;
  probChurnHigh: number;
};

export type NodeContext = {
  nodeId: string;
  state: NodeState;
  churnRisk: ChurnRisk;
  isExploration: boolean;
  lastActionAt?: string | null;
  baselineRevenue: number;
  mc: MonteCarloSummary;
};

export type PortfolioContext = {
  totalNodes: number;
  currentlyExploringNodes: number;
};

export type PolicyResult =
  | { allowed: true; action: StrategyAction }
  | { allowed: false; reason: string };

export const SAFETY_INVARIANTS = {
  maxExplorationPct: 0.10,
  maxExplorationPriceDeltaPct: 0.10,
  cooldownDays: 7,
  maxChurnProbability: 0.30,
  maxRevenueDownsidePct: -0.08,
} as const;

function daysSince(iso?: string | null): number {
  if (!iso) return Number.POSITIVE_INFINITY;
  const then = new Date(iso).getTime();
  const now = Date.now();
  return (now - then) / (1000 * 60 * 60 * 24);
}

function projectedDownsidePct(
  baselineRevenue: number,
  p10Revenue: number,
): number {
  if (baselineRevenue <= 0) return 0;
  return (p10Revenue - baselineRevenue) / baselineRevenue;
}

function capExplorationDelta(action: StrategyAction): StrategyAction {
  if (action.type !== "adjust_price") return action;

  const capped = Math.max(
    -SAFETY_INVARIANTS.maxExplorationPriceDeltaPct,
    Math.min(
      SAFETY_INVARIANTS.maxExplorationPriceDeltaPct,
      action.deltaPct / 100,
    ),
  );

  return {
    ...action,
    deltaPct: capped * 100,
  };
}

export function enforceExplorationPolicy(
  action: StrategyAction,
  node: NodeContext,
  portfolio: PortfolioContext,
): PolicyResult {
  const explorationShare =
    portfolio.totalNodes > 0
      ? portfolio.currentlyExploringNodes / portfolio.totalNodes
      : 0;

  if (
    node.isExploration &&
    explorationShare >= SAFETY_INVARIANTS.maxExplorationPct
  ) {
    return {
      allowed: false,
      reason: "Global exploration cap reached",
    };
  }

  if (
    node.isExploration &&
    (node.churnRisk === "HIGH" || node.state === "UNSTABLE")
  ) {
    return {
      allowed: false,
      reason: "Exploration blocked for HIGH churn or UNSTABLE nodes",
    };
  }

  if (daysSince(node.lastActionAt) < SAFETY_INVARIANTS.cooldownDays) {
    return {
      allowed: false,
      reason: "Node is still in cooldown window",
    };
  }

  if (node.mc.probChurnHigh > SAFETY_INVARIANTS.maxChurnProbability) {
    return {
      allowed: false,
      reason: "Projected churn probability too high",
    };
  }

  const downsidePct = projectedDownsidePct(
    node.baselineRevenue,
    node.mc.p10Revenue,
  );

  if (downsidePct < SAFETY_INVARIANTS.maxRevenueDownsidePct) {
    return {
      allowed: false,
      reason: "Projected downside exceeds allowed cap",
    };
  }

  const safeAction = node.isExploration ? capExplorationDelta(action) : action;

  return {
    allowed: true,
    action: safeAction,
  };
}
