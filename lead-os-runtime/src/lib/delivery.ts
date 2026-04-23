// src/lib/delivery.ts
import type { Lead, Node } from "@/types/lead";
import { log } from "@/lib/logger";

interface DeliveryResult {
  success: boolean;
  method: "webhook" | "email";
  response: string;
}

export async function deliverLead(lead: Lead, node: Node): Promise<DeliveryResult> {
  if (node.webhook_url) {
    return deliverViaWebhook(lead, node);
  }
  if (node.email) {
    return deliverViaEmail(lead, node);
  }
  return { success: false, method: "webhook", response: "Node has no webhook_url or email configured" };
}

async function deliverViaWebhook(lead: Lead, node: Node): Promise<DeliveryResult> {
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 10_000);

    const res = await fetch(node.webhook_url!, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        event: "lead.assigned",
        lead: {
          id: lead.id,
          email: lead.email,
          name: lead.name,
          message: lead.message,
          category: lead.category,
          tenant_id: lead.tenant_id,
          created_at: lead.created_at,
        },
        node: { id: node.id, name: node.name },
      }),
      signal: controller.signal,
    });

    clearTimeout(timer);
    const body = await res.text();

    return {
      success: res.ok,
      method: "webhook",
      response: `${res.status} ${body.slice(0, 500)}`,
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : "unknown error";
    log("webhook_delivery_failed", { node_id: node.id, error: message });
    return { success: false, method: "webhook", response: message };
  }
}

async function deliverViaEmail(lead: Lead, node: Node): Promise<DeliveryResult> {
  log("email_delivery_simulated", {
    to: node.email,
    lead_id: lead.id,
    subject: `New lead from ${lead.email}: ${lead.message.slice(0, 80)}`,
  });

  return {
    success: true,
    method: "email",
    response: `Simulated email to ${node.email}`,
  };
}
