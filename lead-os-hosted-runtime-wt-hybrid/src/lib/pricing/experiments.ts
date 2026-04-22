import { getDb } from "@/lib/supabase/server";

export async function assignVariant(nodeId, experimentId) {
  const db = getDb();

  const { data: variants } = await db
    .from("pricing_variants")
    .select("*")
    .eq("experiment_id", experimentId);

  if (!variants || variants.length === 0) return null;

  const index = Math.floor(Math.random() * variants.length);
  const variant = variants[index];

  await db.from("pricing_assignments").insert({
    experiment_id: experimentId,
    node_id: nodeId,
    variant_id: variant.id,
  });

  return variant;
}

export async function recordExperimentResult(nodeId, experimentId, variantId, metrics) {
  const db = getDb();

  await db.from("pricing_experiment_results").insert({
    experiment_id: experimentId,
    variant_id: variantId,
    node_id: nodeId,
    leads: metrics.leads,
    closed: metrics.closed,
    revenue: metrics.revenue,
  });
}
