import { getDb } from "@/lib/supabase/server";

export async function getSystemMetrics() {
  const db = getDb();

  const [jobs, dead, leads, subs] = await Promise.all([
    db.from("delivery_jobs").select("id,status", { count: "exact" }),
    db.from("dead_letter_jobs").select("id", { count: "exact" }),
    db.from("leads").select("id", { count: "exact" }),
    db.from("subscriptions").select("state", { count: "exact" }),
  ]);

  return {
    totalJobs: jobs.count || 0,
    pendingJobs: jobs.data?.filter(j => j.status === "pending").length || 0,
    failedJobs: jobs.data?.filter(j => j.status === "dead").length || 0,
    deadLetters: dead.count || 0,
    totalLeads: leads.count || 0,
    activeSubscriptions: subs.data?.filter(s => s.state === "active").length || 0,
  };
}
