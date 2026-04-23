/**
 * Execution Engine (leadnest)
 *
 * Clean separation from the Decision Brain (orchestrator.ts).
 * The orchestrator decides WHAT to do. This engine DOES it.
 *
 * Architecture rule from the playbook:
 *   lead-os = decisions ONLY
 *   leadnest = execution ONLY
 *
 * This module receives a decision and executes the corresponding
 * side effects: CRM sync, emails, SMS, webhooks, booking, docs.
 * It never makes routing decisions.
 */

import type { ProviderResult } from "./providers.ts";
import {
  syncLeadToCrm,
  logEventsToLedger,
  sendEmailAction,
  sendSmsAction,
  sendWhatsAppAction,
  emitWorkflowAction,
  createBookingAction,
  generateDocumentAction,
  sendAlertAction,
} from "./providers.ts";
import {
  recordProviderExecution,
  recordWorkflowRun,
  upsertBookingJob,
  upsertDocumentJob,
} from "./runtime-store.ts";
import type { CanonicalEvent, TraceContext } from "./trace.ts";
import { publish } from "./realtime.ts";
import { incrementUsage } from "./billing-store.ts";

export interface ExecutionPlan {
  tenantId: string;
  leadKey: string;
  trace: TraceContext;
  events: CanonicalEvent[];
  actions: ExecutionAction[];
}

export type ExecutionAction =
  | { type: "crm-sync"; data: Record<string, unknown> }
  | { type: "log-events"; data: { events: CanonicalEvent[] } }
  | { type: "send-email"; data: { to: string; subject: string; html: string; templateId?: string } }
  | { type: "send-sms"; data: { phone: string; body: string } }
  | { type: "send-whatsapp"; data: { phone: string; body: string } }
  | { type: "emit-workflow"; data: { eventName: string; payload: Record<string, unknown> } }
  | { type: "create-booking"; data: Record<string, unknown> }
  | { type: "generate-document"; data: { type: string; variables: Record<string, unknown> } }
  | { type: "send-alert"; data: { title: string; body: string; trace: TraceContext } }
  | { type: "publish-realtime"; data: { type: string; payload: Record<string, unknown> } };

export interface ExecutionResult {
  action: string;
  ok: boolean;
  provider: string;
  mode: string;
  detail: string;
}

async function executeAction(
  action: ExecutionAction,
  plan: ExecutionPlan,
): Promise<ExecutionResult> {
  const { leadKey, trace } = plan;

  switch (action.type) {
    case "crm-sync": {
      const result = await syncLeadToCrm(action.data);
      await recordProviderExecution({
        leadKey,
        provider: "suitedash",
        kind: "crm-sync",
        ok: result.ok,
        mode: result.mode,
        detail: result.detail,
      });
      return { action: "crm-sync", ok: result.ok, provider: result.provider, mode: result.mode, detail: result.detail };
    }

    case "log-events": {
      const result = await logEventsToLedger(action.data.events);
      return { action: "log-events", ok: result.ok, provider: result.provider, mode: result.mode, detail: result.detail };
    }

    case "send-email": {
      const result = await sendEmailAction({
        to: action.data.to,
        subject: action.data.subject,
        html: action.data.html,
        trace: plan.trace,
      });
      await recordProviderExecution({
        leadKey,
        provider: "emailit",
        kind: "send-email",
        ok: result.ok,
        mode: result.mode,
        detail: result.detail,
      });
      incrementUsage(plan.tenantId, "emails", 1).catch(() => {});
      return { action: "send-email", ok: result.ok, provider: result.provider, mode: result.mode, detail: result.detail };
    }

    case "send-sms": {
      const result = await sendSmsAction({
        phone: action.data.phone,
        body: action.data.body,
      });
      await recordProviderExecution({
        leadKey,
        provider: "sms",
        kind: "send-sms",
        ok: result.ok,
        mode: result.mode,
        detail: result.detail,
      });
      incrementUsage(plan.tenantId, "sms", 1).catch(() => {});
      return { action: "send-sms", ok: result.ok, provider: result.provider, mode: result.mode, detail: result.detail };
    }

    case "send-whatsapp": {
      const result = await sendWhatsAppAction({
        phone: action.data.phone,
        body: action.data.body,
      });
      await recordProviderExecution({
        leadKey,
        provider: "wbiztool",
        kind: "send-whatsapp",
        ok: result.ok,
        mode: result.mode,
        detail: result.detail,
      });
      incrementUsage(plan.tenantId, "whatsapp", 1).catch(() => {});
      return { action: "send-whatsapp", ok: result.ok, provider: result.provider, mode: result.mode, detail: result.detail };
    }

    case "emit-workflow": {
      const result = await emitWorkflowAction(action.data.eventName, action.data.payload);
      await recordWorkflowRun({
        leadKey,
        eventName: action.data.eventName,
        provider: result.provider,
        ok: result.ok,
        mode: result.mode,
        detail: result.detail,
      });
      return { action: "emit-workflow", ok: result.ok, provider: result.provider, mode: result.mode, detail: result.detail };
    }

    case "create-booking": {
      const result = await createBookingAction(action.data);
      if (result.ok) {
        await upsertBookingJob({
          leadKey,
          provider: result.provider,
          status: "completed",
          detail: result.detail,
        });
      }
      return { action: "create-booking", ok: result.ok, provider: result.provider, mode: result.mode, detail: result.detail };
    }

    case "generate-document": {
      const result = await generateDocumentAction({ docType: action.data.type, ...action.data.variables });
      if (result.ok) {
        await upsertDocumentJob({
          leadKey,
          provider: result.provider,
          status: "completed",
          detail: result.detail,
        });
      }
      return { action: "generate-document", ok: result.ok, provider: result.provider, mode: result.mode, detail: result.detail };
    }

    case "send-alert": {
      const result = await sendAlertAction(action.data);
      return { action: "send-alert", ok: result.ok, provider: result.provider, mode: result.mode, detail: result.detail };
    }

    case "publish-realtime": {
      publish({
        type: action.data.type as Parameters<typeof publish>[0]["type"],
        tenantId: plan.tenantId,
        payload: action.data.payload,
      });
      return { action: "publish-realtime", ok: true, provider: "realtime", mode: "live", detail: "Event published" };
    }
  }
}

/**
 * Execute a full plan of actions. Actions run in parallel where safe,
 * sequentially where order matters. Returns all results.
 */
export async function executePlan(plan: ExecutionPlan): Promise<ExecutionResult[]> {
  const results: ExecutionResult[] = [];

  for (const action of plan.actions) {
    try {
      const result = await executeAction(action, plan);
      results.push(result);
    } catch (error) {
      results.push({
        action: action.type,
        ok: false,
        provider: "unknown",
        mode: "error",
        detail: error instanceof Error ? error.message : "Unknown execution error",
      });
    }
  }

  return results;
}

/**
 * Build an execution plan from a decision + lead context.
 * This is the bridge between the decision brain (orchestrator)
 * and the execution engine (this module).
 *
 * The decision brain says "route to qualification funnel".
 * This function translates that into concrete actions:
 * - sync lead to CRM
 * - log events
 * - send initial email
 * - emit workflow
 * - publish realtime event
 */
export function buildExecutionPlan(params: {
  tenantId: string;
  leadKey: string;
  trace: TraceContext;
  events: CanonicalEvent[];
  lead: Record<string, unknown>;
  decision: { family: string; destination: string; recommendedChannels: string[] };
  hot: boolean;
  email?: string;
  phone?: string;
  score: number;
}): ExecutionPlan {
  const actions: ExecutionAction[] = [];

  actions.push({ type: "crm-sync", data: params.lead });

  if (params.events.length > 0) {
    actions.push({ type: "log-events", data: { events: params.events } });
  }

  actions.push({
    type: "emit-workflow",
    data: {
      eventName: "lead.captured",
      payload: { leadKey: params.leadKey, score: params.score, family: params.decision.family },
    },
  });

  if (params.hot) {
    actions.push({
      type: "send-alert",
      data: { title: "Hot Lead", body: `Hot lead: ${params.leadKey} (score: ${params.score})`, trace: params.trace },
    });
    actions.push({
      type: "emit-workflow",
      data: {
        eventName: "lead.hot",
        payload: { leadKey: params.leadKey, score: params.score },
      },
    });
  }

  if (params.email && params.decision.recommendedChannels.includes("email")) {
    actions.push({
      type: "send-email",
      data: {
        to: params.email,
        subject: "Welcome — here's your next step",
        html: `<p>Thanks for reaching out. Your personalized path is ready at <a href="${params.decision.destination}">${params.decision.destination}</a></p>`,
      },
    });
  }

  if (params.phone && params.decision.recommendedChannels.includes("whatsapp")) {
    actions.push({
      type: "send-whatsapp",
      data: {
        phone: params.phone,
        body: `Thanks for reaching out! Your next step: ${params.decision.destination}`,
      },
    });
  }

  if (params.phone && params.decision.recommendedChannels.includes("sms")) {
    actions.push({
      type: "send-sms",
      data: {
        phone: params.phone,
        body: `Your personalized assessment is ready: ${params.decision.destination}`,
      },
    });
  }

  actions.push({
    type: "publish-realtime",
    data: {
      type: "lead.captured",
      payload: { leadKey: params.leadKey, score: params.score, hot: params.hot, family: params.decision.family },
    },
  });

  return {
    tenantId: params.tenantId,
    leadKey: params.leadKey,
    trace: params.trace,
    events: params.events,
    actions,
  };
}
