import type { RevenueActionAutomationPayload, RevenueOutcome } from "@/lib/revenue-actions"

export const boostspaceRevenueActionStatuses = ["planned", "queued", "in_progress", "completed", "failed", "skipped"] as const

export type BoostspaceRevenueActionStatus = (typeof boostspaceRevenueActionStatuses)[number]

export type BoostspaceRevenueActionScenario = {
  slug: string
  name: string
  purpose: string
  pollQuery: string
  completionStatus: BoostspaceRevenueActionStatus
  successSignal: string
}

export type BoostspaceRevenueActionEnvelope = {
  id: string
  outcome: RevenueOutcome
  status: BoostspaceRevenueActionStatus
  automationPayload: RevenueActionAutomationPayload
  idempotencyKey: string
}

export const boostspaceRevenueActionScenarios: BoostspaceRevenueActionScenario[] = [
  {
    slug: "revenue-action-router",
    name: "Erie.Pro Revenue Action Router",
    purpose: "Poll planned route actions and fan them into SuiteDash, Taskade, ProductDyno, or internal Erie.Pro follow-up.",
    pollQuery: "status=planned&outcome=route&limit=50",
    completionStatus: "queued",
    successSignal: "Each action receives an external Boost.space record ID and moves from planned to queued.",
  },
  {
    slug: "revenue-delivery-dispatch",
    name: "Erie.Pro Delivery Dispatch",
    purpose: "Poll deliver actions for paid ThriveCart/checkout events and create the fulfillment work item.",
    pollQuery: "status=planned&outcome=deliver&limit=50",
    completionStatus: "queued",
    successSignal: "Paid offer actions route to the correct fulfillment owner with offer and service metadata attached.",
  },
  {
    slug: "revenue-recovery-dispatch",
    name: "Erie.Pro Recovery Dispatch",
    purpose: "Poll recover actions for abandoned, failed, refunded, or cancelled revenue events.",
    pollQuery: "status=planned&outcome=recover&limit=50",
    completionStatus: "queued",
    successSignal: "Recovery actions create the appropriate follow-up path without losing coupon, affiliate, source, or offer context.",
  },
  {
    slug: "revenue-learning-sync",
    name: "Erie.Pro Learning Sync",
    purpose: "Poll learn actions and sync attribution dimensions into the reporting destination.",
    pollQuery: "status=planned&outcome=learn&limit=50",
    completionStatus: "completed",
    successSignal: "Attribution dimensions are persisted and the action is closed as completed.",
  },
]

export function buildBoostspaceIdempotencyKey(actionId: string, automationKey: string | null, status: string) {
  return ["erie-pro", "boostspace", actionId, automationKey ?? "manual", status].join(":")
}

export function buildBoostspaceRevenueActionEnvelope(input: {
  id: string
  outcome: RevenueOutcome
  status?: string | null
  automationPayload: RevenueActionAutomationPayload
}): BoostspaceRevenueActionEnvelope {
  const status = boostspaceRevenueActionStatuses.includes(input.status as BoostspaceRevenueActionStatus)
    ? input.status as BoostspaceRevenueActionStatus
    : "planned"

  return {
    id: input.id,
    outcome: input.outcome,
    status,
    automationPayload: input.automationPayload,
    idempotencyKey: buildBoostspaceIdempotencyKey(
      input.id,
      input.automationPayload.automationKey,
      status,
    ),
  }
}

export function buildBoostspaceScenarioExport(appUrl: string, tokenVariable = "REVENUE_ACTIONS_API_TOKEN") {
  const baseUrl = appUrl.replace(/\/$/, "")
  return {
    generatedBy: "erie-pro",
    sourceOfTruth: "Neon offerInteraction revenue_action records",
    auth: {
      header: "Authorization: Bearer {{token}}",
      tokenVariable,
    },
    endpoints: {
      poll: `${baseUrl}/api/integrations/boostspace/revenue-actions`,
      statusCallback: `${baseUrl}/api/integrations/boostspace/revenue-actions`,
      genericPoll: `${baseUrl}/api/revenue-actions`,
      genericStatusPatch: `${baseUrl}/api/revenue-actions`,
    },
    scenarios: boostspaceRevenueActionScenarios.map((scenario) => ({
      ...scenario,
      pollUrl: `${baseUrl}/api/integrations/boostspace/revenue-actions?${scenario.pollQuery}`,
      callback: {
        method: "POST",
        url: `${baseUrl}/api/integrations/boostspace/revenue-actions`,
        body: {
          id: "{{action.id}}",
          status: scenario.completionStatus,
          externalSystem: "boostspace",
          externalRecordId: "{{boostspace.record.id}}",
          ownerNote: `${scenario.name} accepted the action.`,
        },
      },
    })),
  }
}
