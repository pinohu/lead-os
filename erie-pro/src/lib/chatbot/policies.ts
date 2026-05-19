// erie-pro/src/lib/chatbot/policies.ts

import type { ChatPersona } from "@/lib/chatbot/personas"

export interface ChatPolicy {
  /** Never invent operational status — tools required */
  requireToolsForStatus: boolean
  maxToolRounds: number
  allowedToolNames: readonly string[]
  forbiddenTopics: readonly string[]
}

const CONSUMER_TOOLS = [
  "searchProviders",
  "checkServiceArea",
  "createServiceRequest",
  "getRequestStatus",
  "retryConsumerConfirmation",
  "escalateServiceRequest",
] as const

const STATUS_TOOLS = ["getRequestStatus", "retryConsumerConfirmation", "escalateServiceRequest"] as const

const PROVIDER_GROWTH_TOOLS = [
  "findProviderProfile",
  "createProviderInterest",
  "recommendProviderPlan",
  "getThriveCartCheckoutUrl",
] as const

const PROVIDER_OPS_TOOLS = [
  "getProviderDashboardSummary",
  "getMicrositeStatus",
  "getSubscriptionStatus",
  "getLeadSummary",
  "createProviderSupportTicket",
  ...PROVIDER_GROWTH_TOOLS,
] as const

const ADMIN_TOOLS = [
  "getFailedNotifications",
  "retryNotification",
  "getUnmatchedThriveCartEvents",
  "reconcilePurchase",
  "getProvisioningFailures",
  "retryProvisioningJob",
  "getProviderHealth",
] as const

export const CHAT_POLICIES: Record<ChatPersona, ChatPolicy> = {
  consumer_service: {
    requireToolsForStatus: true,
    maxToolRounds: 4,
    allowedToolNames: CONSUMER_TOOLS,
    forbiddenTopics: ["guaranteed same-day", "we already notified the provider without checking"],
  },
  consumer_status: {
    requireToolsForStatus: true,
    maxToolRounds: 5,
    allowedToolNames: STATUS_TOOLS,
    forbiddenTopics: ["invented delivery times", "provider was notified without tool confirmation"],
  },
  provider_growth: {
    requireToolsForStatus: false,
    maxToolRounds: 4,
    allowedToolNames: PROVIDER_GROWTH_TOOLS,
    forbiddenTopics: ["guaranteed leads", "instant #1 ranking"],
  },
  provider_operations: {
    requireToolsForStatus: true,
    maxToolRounds: 5,
    allowedToolNames: PROVIDER_OPS_TOOLS,
    forbiddenTopics: ["billing changes without dashboard"],
  },
  admin_operations: {
    requireToolsForStatus: true,
    maxToolRounds: 6,
    allowedToolNames: ADMIN_TOOLS,
    forbiddenTopics: [],
  },
}

export function getPolicyForPersona(persona: ChatPersona): ChatPolicy {
  return CHAT_POLICIES[persona]
}
