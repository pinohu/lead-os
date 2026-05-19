// erie-pro/src/lib/chatbot/personas.ts
// Persona modes enforced in code — one platform, distinct tool sets and policies.

import type { Audience } from "@/lib/audience-context"

export type ChatPersona =
  | "consumer_service"
  | "consumer_status"
  | "provider_growth"
  | "provider_operations"
  | "admin_operations"

export interface ChatPersonaUiConfig {
  launcherLabel: string
  panelTitle: string
  openingMessage: string
  placeholder: string
}

export const CHAT_PERSONA_UI: Record<ChatPersona, ChatPersonaUiConfig> = {
  consumer_service: {
    launcherLabel: "Ask Erie",
    panelTitle: "Service assistant",
    openingMessage:
      "I can help you find a local pro or submit a service request. I only report status from our system — I won't guess.",
    placeholder: "Describe what you need help with…",
  },
  consumer_status: {
    launcherLabel: "Request help",
    panelTitle: "Request status",
    openingMessage:
      "I can check your request status, notifications, and timeline from our records. Share your request ID if you have it.",
    placeholder: "Ask about your request status…",
  },
  provider_growth: {
    launcherLabel: "Provider plans",
    panelTitle: "Growth assistant",
    openingMessage:
      "I can explain Starter, Professional, Premium, and Elite plans — plus checkout links and claiming. Name a plan or tell me your goals.",
    placeholder: "Ask about plans or claiming…",
  },
  provider_operations: {
    launcherLabel: "Dashboard help",
    panelTitle: "Operations assistant",
    openingMessage:
      "Signed-in provider assistant. I can summarize your dashboard, leads, and subscription from live data.",
    placeholder: "Ask about your account…",
  },
  admin_operations: {
    launcherLabel: "Admin assist",
    panelTitle: "Admin diagnostics",
    openingMessage:
      "Admin diagnostics mode. I can surface failed notifications, unmatched purchases, and provisioning issues from the database.",
    placeholder: "Ask for a diagnostic…",
  },
}

export interface ResolveChatPersonaInput {
  pathname: string
  audience: Audience
  /** Request status page token context */
  serviceRequestId?: string | null
}

export function resolveChatPersona(input: ResolveChatPersonaInput): ChatPersona {
  const path = input.pathname.split("?")[0]?.replace(/\/+$/, "") || "/"

  if (path.startsWith("/admin")) return "admin_operations"
  if (path.startsWith("/request-status")) return "consumer_status"
  if (path.startsWith("/dashboard")) return "provider_operations"
  if (
    path.startsWith("/for-business") ||
    path === "/pros" ||
    path.startsWith("/offers") ||
    path.startsWith("/provider")
  ) {
    return "provider_growth"
  }

  if (input.audience === "admin") return "admin_operations"
  if (input.audience === "provider") return "provider_growth"
  return "consumer_service"
}

export function isChatEnabledForPersona(persona: ChatPersona): boolean {
  return persona !== "admin_operations" || process.env.NODE_ENV !== "production"
    ? true
    : true
}
