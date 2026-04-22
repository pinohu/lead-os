import { getDb } from "@/lib/supabase/server";

export async function getRealROIMetrics() {
  const db = getDb();

  const { data: leads } = await db.from("leads").select("owner_id, node_id, status, revenue");
  const { data: subs } = await db.from("subscriptions").select("owner_id, node_id, state");

  let totalRevenue = 0;
  let closedDeals = 0;

  const revenueByOwner = {};
  const revenueByNode = {};

  for (const l of leads || []) {
    if (l.status === "closed") {
      closedDeals++;
      totalRevenue += l.revenue || 0;

      revenueByOwner[l.owner_id] = (revenueByOwner[l.owner_id] || 0) + l.revenue;
      revenueByNode[l.node_id] = (revenueByNode[l.node_id] || 0) + l.revenue;
    }
  }

  const activeSubs = subs?.filter(s => s.state === "active") || [];

  const roiByOwner = activeSubs.map(s => {
    const revenue = revenueByOwner[s.owner_id] || 0;
    const cost = 1000; // monthly cost placeholder

    return {
      owner: s.owner_id,
      node: s.node_id,
      revenue,
      cost,
      roi: cost > 0 ? revenue / cost : 0,
    };
  });

  return {
    totalRevenue,
    closedDeals,
    revenueByOwner,
    revenueByNode,
    roiByOwner,
  };
}
