import { getDb } from "@/lib/supabase/server";

export async function getAdvancedMetrics() {
  const db = getDb();

  const { data: leads } = await db.from("leads").select("node_id, owner_id, created_at");
  const { data: subs } = await db.from("subscriptions").select("node_id, owner_id, state");

  // Territory ranking
  const territoryCounts = {};
  for (const l of leads || []) {
    territoryCounts[l.node_id] = (territoryCounts[l.node_id] || 0) + 1;
  }

  const topTerritories = Object.entries(territoryCounts)
    .map(([node, count]) => ({ node, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  // Provider ROI (simple proxy)
  const providerCounts = {};
  for (const l of leads || []) {
    providerCounts[l.owner_id] = (providerCounts[l.owner_id] || 0) + 1;
  }

  const providerROI = Object.entries(providerCounts).map(([owner, count]) => ({
    owner,
    leads: count,
    estValue: count * 50, // placeholder per-lead value
  }));

  // Churn detection
  const churnRisk = [];

  for (const s of subs || []) {
    if (s.state !== "active") continue;

    const leadCount = providerCounts[s.owner_id] || 0;

    if (leadCount === 0) {
      churnRisk.push({ owner: s.owner_id, node: s.node_id, risk: "HIGH" });
    } else if (leadCount < 3) {
      churnRisk.push({ owner: s.owner_id, node: s.node_id, risk: "MEDIUM" });
    }
  }

  return {
    topTerritories,
    providerROI,
    churnRisk,
  };
}
