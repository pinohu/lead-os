import { getDb } from "@/lib/supabase/server";

export default async function AdminDashboard() {
  const db = getDb();

  const { data: recs } = await db
    .from("pricing_recommendations")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(10);

  const { data: history } = await db
    .from("pricing_history")
    .select("*")
    .order("changed_at", { ascending: false })
    .limit(10);

  return (
    <div style={{ padding: 20 }}>
      <h1>Operator Dashboard</h1>

      <section>
        <h2>Recent Pricing Recommendations</h2>
        <pre>{JSON.stringify(recs, null, 2)}</pre>
      </section>

      <section>
        <h2>Recent Pricing Changes</h2>
        <pre>{JSON.stringify(history, null, 2)}</pre>
      </section>
    </div>
  );
}
