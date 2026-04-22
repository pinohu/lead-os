import { getDb } from "@/lib/supabase/server";

export async function approvePricing(id, approverId) {
  const db = getDb();

  const { data: rec } = await db
    .from("pricing_recommendations")
    .select("*")
    .eq("id", id)
    .single();

  if (!rec) throw new Error("Recommendation not found");

  await db.from("pricing_recommendations").update({
    status: "approved",
    approved_by: approverId,
    approved_at: new Date().toISOString(),
  }).eq("id", id);

  return rec;
}

export async function markApplied(id) {
  const db = getDb();

  await db.from("pricing_recommendations").update({
    status: "applied",
    applied_at: new Date().toISOString(),
  }).eq("id", id);
}
