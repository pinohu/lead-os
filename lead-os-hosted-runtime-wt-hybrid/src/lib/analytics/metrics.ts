import { getDb } from "@/lib/supabase/server";

export async function getRevenueMetrics() {
  const db = getDb();

  const [leads, subs, jobs, dead] = await Promise.all([
    db.from("leads").select("node_id, owner_id", { count: "exact" }),
    db.from("subscriptions").select("state", { count: "exact" }),
    db.from("delivery_jobs").select("status", { count: "exact" }),
    db.from("dead_letter_jobs").select("id", { count: "exact" }),
  ]);

  const totalLeads = leads.count || 0;
  const activeSubs = subs.data?.filter(s => s.state === "active").length || 0;

  const estimatedMRR = activeSubs * 1000; // placeholder pricing

  const successJobs = jobs.data?.filter(j => j.status === "success").length || 0;
  const totalJobs = jobs.count || 0;

  const successRate = totalJobs > 0 ? (successJobs / totalJobs) * 100 : 0;

  return {
    totalLeads,
    activeSubs,
    estimatedMRR,
    successRate,
    deadLetters: dead.count || 0,
  };
}
