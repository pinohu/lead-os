// erie-pro/src/lib/chatbot/tool-registry.ts

import type { ChatPersona } from "@/lib/chatbot/personas"
import { getPolicyForPersona } from "@/lib/chatbot/policies"
import { executeConsumerTool } from "@/lib/chatbot/tools/consumer-tools"
import { executeProviderTool } from "@/lib/chatbot/tools/provider-tools"
import { executeAdminTool } from "@/lib/chatbot/tools/admin-tools"
import { executeStatusTool } from "@/lib/chatbot/tools/status-tools"
import type { ChatToolContext, ToolResult } from "@/lib/chatbot/tools/types"

export interface ChatToolDefinition {
  name: string
  description: string
  input_schema: {
    type: "object"
    properties: Record<string, { type: string; description?: string; enum?: string[] }>
    required?: string[]
  }
}

const ALL_TOOLS: ChatToolDefinition[] = [
  {
    name: "searchProviders",
    description: "Search directory listings by niche and optional area",
    input_schema: {
      type: "object",
      properties: {
        niche: { type: "string", description: "Niche slug e.g. plumbing" },
        area: { type: "string", description: "City or area label" },
        limit: { type: "string", description: "Max results as string number" },
      },
      required: ["niche"],
    },
  },
  {
    name: "checkServiceArea",
    description: "Check if a ZIP or city is in the Erie service area",
    input_schema: {
      type: "object",
      properties: {
        zip: { type: "string" },
        city: { type: "string" },
      },
    },
  },
  {
    name: "createServiceRequest",
    description: "Create a service request (requires email, niche, message)",
    input_schema: {
      type: "object",
      properties: {
        email: { type: "string" },
        niche: { type: "string" },
        message: { type: "string" },
        firstName: { type: "string" },
        phone: { type: "string" },
      },
      required: ["email", "niche", "message"],
    },
  },
  {
    name: "getRequestStatus",
    description: "Get service request status, timeline, and notifications (requires requestId and token)",
    input_schema: {
      type: "object",
      properties: {
        requestId: { type: "string" },
        token: { type: "string" },
      },
      required: ["requestId", "token"],
    },
  },
  {
    name: "retryConsumerConfirmation",
    description: "Retry consumer confirmation email for a request",
    input_schema: {
      type: "object",
      properties: { requestId: { type: "string" }, token: { type: "string" } },
      required: ["requestId", "token"],
    },
  },
  {
    name: "escalateServiceRequest",
    description: "Escalate a service request for human review",
    input_schema: {
      type: "object",
      properties: {
        requestId: { type: "string" },
        token: { type: "string" },
        reason: { type: "string" },
      },
      required: ["requestId", "reason"],
    },
  },
  {
    name: "findProviderProfile",
    description: "Find a provider listing by slug or business name",
    input_schema: {
      type: "object",
      properties: {
        slug: { type: "string" },
        query: { type: "string" },
      },
    },
  },
  {
    name: "createProviderInterest",
    description: "Record provider interest signup",
    input_schema: {
      type: "object",
      properties: {
        email: { type: "string" },
        businessName: { type: "string" },
        niche: { type: "string" },
      },
      required: ["email"],
    },
  },
  {
    name: "recommendProviderPlan",
    description: "Recommend a provider plan slug based on goals",
    input_schema: {
      type: "object",
      properties: { goals: { type: "string" } },
    },
  },
  {
    name: "getThriveCartCheckoutUrl",
    description: "Get ThriveCart checkout URL for a plan",
    input_schema: {
      type: "object",
      properties: {
        planSlug: { type: "string" },
        providerId: { type: "string" },
      },
    },
  },
  {
    name: "getProviderDashboardSummary",
    description: "Summary of provider dashboard metrics (auth required)",
    input_schema: { type: "object", properties: {} },
  },
  {
    name: "getMicrositeStatus",
    description: "Microsite publication status for logged-in provider",
    input_schema: { type: "object", properties: {} },
  },
  {
    name: "getSubscriptionStatus",
    description: "Subscription status for logged-in provider",
    input_schema: { type: "object", properties: {} },
  },
  {
    name: "getLeadSummary",
    description: "Recent leads summary for logged-in provider",
    input_schema: {
      type: "object",
      properties: { limit: { type: "string" } },
    },
  },
  {
    name: "createProviderSupportTicket",
    description: "Create a support ticket from the provider dashboard",
    input_schema: {
      type: "object",
      properties: { subject: { type: "string" }, body: { type: "string" } },
      required: ["subject", "body"],
    },
  },
  {
    name: "getFailedNotifications",
    description: "List failed notification events (admin)",
    input_schema: {
      type: "object",
      properties: { limit: { type: "string" } },
    },
  },
  {
    name: "retryNotification",
    description: "Retry a failed notification by event id (admin)",
    input_schema: {
      type: "object",
      properties: { eventId: { type: "string" } },
      required: ["eventId"],
    },
  },
  {
    name: "getUnmatchedThriveCartEvents",
    description: "List unmatched ThriveCart reconciliation items (admin)",
    input_schema: {
      type: "object",
      properties: { limit: { type: "string" } },
    },
  },
  {
    name: "reconcilePurchase",
    description: "Mark reconciliation item resolved (admin stub)",
    input_schema: {
      type: "object",
      properties: {
        itemId: { type: "string" },
        notes: { type: "string" },
      },
      required: ["itemId"],
    },
  },
  {
    name: "getProvisioningFailures",
    description: "List failed provisioning jobs (admin)",
    input_schema: {
      type: "object",
      properties: { limit: { type: "string" } },
    },
  },
  {
    name: "retryProvisioningJob",
    description: "Retry a provisioning job by id (admin)",
    input_schema: {
      type: "object",
      properties: { jobId: { type: "string" } },
      required: ["jobId"],
    },
  },
  {
    name: "getProviderHealth",
    description: "Aggregate provider health signals (admin)",
    input_schema: { type: "object", properties: {} },
  },
]

export function getToolDefinitionsForPersona(persona: ChatPersona): ChatToolDefinition[] {
  const allowed = new Set(getPolicyForPersona(persona).allowedToolNames)
  return ALL_TOOLS.filter((t) => allowed.has(t.name))
}

const STATUS_TOOL_NAMES = new Set([
  "getRequestStatus",
  "retryConsumerConfirmation",
  "escalateServiceRequest",
])

const PROVIDER_TOOL_NAMES = new Set([
  "findProviderProfile",
  "createProviderInterest",
  "recommendProviderPlan",
  "getThriveCartCheckoutUrl",
  "getProviderDashboardSummary",
  "getMicrositeStatus",
  "getSubscriptionStatus",
  "getLeadSummary",
  "createProviderSupportTicket",
])

const ADMIN_TOOL_NAMES = new Set([
  "getFailedNotifications",
  "retryNotification",
  "getUnmatchedThriveCartEvents",
  "reconcilePurchase",
  "getProvisioningFailures",
  "retryProvisioningJob",
  "getProviderHealth",
])

export async function executeChatTool(
  toolName: string,
  input: Record<string, unknown>,
  ctx: ChatToolContext,
): Promise<ToolResult> {
  if (STATUS_TOOL_NAMES.has(toolName)) {
    return executeStatusTool(toolName, input, ctx)
  }
  if (PROVIDER_TOOL_NAMES.has(toolName)) {
    return executeProviderTool(toolName, input, ctx)
  }
  if (ADMIN_TOOL_NAMES.has(toolName)) {
    return executeAdminTool(toolName, input, ctx)
  }
  return executeConsumerTool(toolName, input, ctx)
}
