// src/lib/integrations/lead-delivery-hub.ts
// Normalized outbound hooks: sendLead(), notifyClient(), triggerWorkflow().
// Never log secrets; integrations optional with safe fallbacks.

import { logger } from "../logger.ts";
import { createContact, type SuiteDashContactPayload } from "../suitedash.ts";

export interface DirectoryLeadPayload {
  tenantId: string;
  leadKey: string;
  category?: string;
  nodeKey?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  description?: string;
}

export interface IntegrationSendResult {
  channel: "crm" | "workflow" | "webhook" | "log";
  ok: boolean;
  mode: "live" | "simulated" | "skipped";
  detail?: string;
}

function activepiecesUrl(): string | undefined {
  return (
    process.env.ACTIVEPIECES_WEBHOOK_URL?.trim() ||
    process.env.ACTIVEPIECES_FLOW_WEBHOOK_URL?.trim() ||
    undefined
  );
}

function genericAutomationUrl(): string | undefined {
  return process.env.LEAD_OS_AUTOMATION_WEBHOOK_URL?.trim() || process.env.PABBLY_WEBHOOK_URL?.trim() || undefined;
}

async function suiteDashTry(payload: DirectoryLeadPayload): Promise<IntegrationSendResult> {
  const publicId = process.env.SUITEDASH_PUBLIC_ID?.trim();
  const secret = process.env.SUITEDASH_SECRET_KEY?.trim();
  if (!publicId || !secret || !payload.email) {
    return { channel: "crm", ok: true, mode: "skipped", detail: "crm_not_configured_or_no_email" };
  }

  try {
    const body: SuiteDashContactPayload = {
      first_name: payload.firstName?.trim() || "Lead",
      last_name: payload.lastName?.trim() || "",
      email: payload.email.trim().toLowerCase(),
      company_name: payload.tenantId,
      phone: payload.phone?.trim(),
      tags: ["lead-os", "erie-directory", payload.category ?? "general"].filter(Boolean),
      notes: [
        `leadKey=${payload.leadKey}`,
        payload.nodeKey ? `node=${payload.nodeKey}` : "",
        payload.description ? payload.description.slice(0, 500) : "",
      ].filter(Boolean),
      send_welcome_email: false,
    };
    await createContact(body);
    logger.info("integration.suitedash.contact_ok", { leadKey: payload.leadKey, tenantId: payload.tenantId });
    return { channel: "crm", ok: true, mode: "live" };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    logger.warn("integration.suitedash.contact_failed", {
      leadKey: payload.leadKey,
      tenantId: payload.tenantId,
      error: message.slice(0, 200),
    });
    return { channel: "crm", ok: false, mode: "live", detail: "crm_error" };
  }
}

/** Push directory lead to Activepieces (or compatible) webhook. */
export async function triggerWorkflow(payload: DirectoryLeadPayload): Promise<IntegrationSendResult> {
  const url = activepiecesUrl();
  if (!url) {
    logger.info("integration.activepieces.skipped", { leadKey: payload.leadKey });
    return { channel: "workflow", ok: true, mode: "skipped", detail: "no_webhook_url" };
  }

  try {
    const body = {
      event: "lead_os.directory_lead",
      tenantId: payload.tenantId,
      leadKey: payload.leadKey,
      category: payload.category ?? null,
      nodeKey: payload.nodeKey ?? null,
      contact: {
        firstName: payload.firstName ?? null,
        lastName: payload.lastName ?? null,
        email: payload.email ?? null,
        phone: payload.phone ?? null,
      },
      description: payload.description?.slice(0, 2000) ?? null,
    };
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      logger.warn("integration.activepieces.http_error", { leadKey: payload.leadKey, status: res.status });
      return { channel: "workflow", ok: false, mode: "live", detail: `http_${res.status}` };
    }
    logger.info("integration.activepieces.ok", { leadKey: payload.leadKey });
    return { channel: "workflow", ok: true, mode: "live" };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    logger.warn("integration.activepieces.failed", { leadKey: payload.leadKey, error: message.slice(0, 200) });
    return { channel: "workflow", ok: false, mode: "live", detail: "network_error" };
  }
}

/** Optional Pabbly / generic automation URL. */
export async function notifyClient(
  payload: DirectoryLeadPayload,
  template: "routed" | "hot",
): Promise<IntegrationSendResult> {
  const url = genericAutomationUrl();
  if (!url) {
    logger.info("integration.notify_client.simulated", {
      template,
      leadKey: payload.leadKey,
      tenantId: payload.tenantId,
    });
    return { channel: "log", ok: true, mode: "simulated", detail: template };
  }

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        source: "lead-os",
        type: "notify_client",
        template,
        tenantId: payload.tenantId,
        leadKey: payload.leadKey,
        category: payload.category,
        nodeKey: payload.nodeKey,
        contact: {
          firstName: payload.firstName,
          lastName: payload.lastName,
          email: payload.email,
          phone: payload.phone,
        },
      }),
    });
    return { channel: "webhook", ok: res.ok, mode: "live", detail: res.ok ? undefined : `http_${res.status}` };
  } catch {
    return { channel: "webhook", ok: false, mode: "live", detail: "network_error" };
  }
}

/** Full delivery: CRM (if configured), workflow webhook, client notify webhook, else simulated log. */
export async function sendLead(payload: DirectoryLeadPayload): Promise<IntegrationSendResult[]> {
  const results: IntegrationSendResult[] = [];
  results.push(await suiteDashTry(payload));
  results.push(await triggerWorkflow(payload));
  results.push(await notifyClient(payload, "routed"));
  if (results.every((r) => (r.mode === "skipped" || r.mode === "simulated") && r.ok)) {
    results.push({ channel: "log", ok: true, mode: "simulated", detail: "no_external_channels_ready" });
  }
  return results;
}

export async function triggerWorkflowNamed(
  name: string,
  body: Record<string, unknown>,
): Promise<IntegrationSendResult> {
  const url = activepiecesUrl();
  if (!url) {
    return { channel: "workflow", ok: true, mode: "skipped", detail: "no_webhook_url" };
  }
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ event: name, ...body }),
    });
    return { channel: "workflow", ok: res.ok, mode: "live", detail: res.ok ? undefined : `http_${res.status}` };
  } catch {
    return { channel: "workflow", ok: false, mode: "live", detail: "network_error" };
  }
}
