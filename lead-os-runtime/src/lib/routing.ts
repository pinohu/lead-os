// src/lib/routing.ts
import { query } from "@/lib/db";
import type { Node } from "@/types/lead";

export async function selectNode(category: string): Promise<Node | null> {
  const result = await query<Node>(
    `SELECT id, name, category, webhook_url, email, is_active, created_at
     FROM nodes
     WHERE category = $1 AND is_active = true
     ORDER BY created_at ASC
     LIMIT 1`,
    [category],
  );
  return result.rows[0] ?? null;
}
