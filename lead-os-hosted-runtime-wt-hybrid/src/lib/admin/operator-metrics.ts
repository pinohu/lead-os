import { getDb } from "@/lib/supabase/server";

export async function getOperatorDashboardData() {
  const db = getDb();

  const [recs, history, leads, subs, dead] = await Promise.all([
    db.from("pricing_recommendations").select("*").order("created_at", { ascending: false }).limit(10),
    db.from("pricing_history").select("*").order("changed_at", { ascending: false }).limit(10),
    db.from("leads").select("node_id, owner_id, status, revenue"),
    db.from("subscriptions").select("owner_id, node_id, state"),
    db.from("dead_letter_jobs").select("id, owner_id, channel, created_at"),
  ]);

  const totalRevenue = (leads.data || []).reduce((sum, l) => sum + (l.revenue || 0), 0);
  const activeProviders = new Set((subs.data || []).filter(s => s.state === "active").map(s => s.owner_id)).size;
  const pendingApprovals = (recs.data || []).filter(r => r.status === "proposed").length;
  const highRiskAccounts = new Set(
    (subs.data || [])
      .filter(s => s.state === "active")
      .filter(s => (leads.data || []).filter(l => l.owner_id === s.owner_id && l.status === "closed").length === 0)
      .map(s => s.owner_id)
  ).size;

  const territoryMap = {};
  for (const l of leads.data || []) {
    if (!territoryMap[l.node_id]) {
      territoryMap[l.node_id] = { nodeId: l.node_id, leads: 0, revenue: 0, closed: 0 };
    }
    territoryMap[l.node_id].leads += 1;
    territoryMap[l.node_id].revenue += l.revenue || 0;
    if (l.status === "closed") territoryMap[l.node_id].closed += 1;
  }

  const territories = Object.values(territoryMap)
    .map((t: any) => ({
      ...t,
      roi: t.revenue / 1000,
      risk: t.closed === 0 ? "HIGH" : t.closed < 3 ? "MEDIUM" : "LOW",
    }))
    .sort((a: any, b: any) => b.revenue - a.revenue)
    .slice(0, 20);

  const riskMap = {};
  for (const s of subs.data || []) {
    if (s.state !== "active") continue;
    const ownerLeads = (leads.data || []).filter(l => l.owner_id === s.owner_id);
    const closed = ownerLeads.filter(l => l.status === "closed").length;
    const revenue = ownerLeads.reduce((sum, l) => sum + (l.revenue || 0), 0);
    const risk = closed === 0 ? "HIGH" : closed < 3 ? "MEDIUM" : "LOW";
    riskMap[`${s.owner_id}:${s.node_id}`] = {
      ownerId: s.owner_id,
      nodeId: s.node_id,
      leads: ownerLeads.length,
      revenue,
      risk,
    };
  }

  return {
    kpis: {
      totalRevenue,
      activeProviders,
      pendingApprovals,
      highRiskAccounts,
      deadLetters: dead.data?.length || 0,
    },
    pricingRecommendations: recs.data || [],
    pricingHistory: history.data || [],
    territories,
    riskWatchlist: Object.values(riskMap).sort((a: any, b: any) => a.risk.localeCompare(b.risk)),
    deadLetters: dead.data || [],
  };
}
