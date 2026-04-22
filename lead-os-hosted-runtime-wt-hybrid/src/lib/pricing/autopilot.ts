import { getDb } from "@/lib/supabase/server";
import { applyStripePricing } from "./engine";

export function shouldAutoApprove(rec) {
  return (
    rec.churnRisk === "LOW" &&
    rec.roi >= 5 &&
    rec.leads >= 25 &&
    rec.priceChangePercent <= 20 &&
    !rec.grandfathered
  );
}

export async function runPricingAutopilot(rec) {
  const db = getDb();

  if (!shouldAutoApprove(rec)) {
    return { action: "manual_review" };
  }

  // mark auto approved
  await db.from("pricing_recommendations").update({
    status: "auto_approved",
  }).eq("id", rec.id);

  try {
    const result = await applyStripePricing({
      subscriptionId: rec.subscriptionId,
      subscriptionItemId: rec.subscriptionItemId,
      newPriceId: rec.newPriceId,
      mode: rec.mode,
      effectiveDate: rec.effectiveDate,
    });

    await db.from("pricing_recommendations").update({
      status: "auto_applied",
      applied_at: new Date().toISOString(),
    }).eq("id", rec.id);

    await db.from("pricing_history").insert({
      node_id: rec.nodeId,
      owner_id: rec.ownerId,
      old_price_cents: rec.currentPrice,
      new_price_cents: rec.recommendedPrice,
      mode: rec.mode,
      note: "auto-applied",
    });

    return { action: "auto_applied", result };

  } catch (err) {
    await db.from("pricing_recommendations").update({
      status: "failed",
    }).eq("id", rec.id);

    return { action: "failed", error: err.message };
  }
}
