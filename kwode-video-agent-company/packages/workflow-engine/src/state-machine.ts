/**
 * Video Job State Machine
 *
 * Single source of truth for what status transitions are legal.
 * Every transition must be routed through `transition()` so audit logs and
 * blocked-state reasons stay consistent.
 */

export const JOB_STATUSES = [
  "draft",
  "intake_received",
  "brief_generating",
  "brief_ready",
  "brief_approved",
  "script_generating",
  "script_ready",
  "storyboard_generating",
  "storyboard_ready",
  "prompts_generating",
  "prompts_ready",
  "assets_generating",
  "assets_ready",
  "rendering",
  "qa_pending",
  "qa_failed",
  "qa_passed",
  "client_review",
  "revision_requested",
  "approved",
  "delivered",
  "published",
  "archived",
  // failure states
  "failed_intake",
  "failed_brief",
  "failed_script",
  "failed_storyboard",
  "failed_prompting",
  "failed_generation",
  "failed_render",
  "failed_qa",
  "failed_delivery",
  // blocked states
  "blocked_missing_inputs",
  "blocked_missing_consent",
  "blocked_tool_unavailable",
  "blocked_human_review_required",
] as const;

export type JobStatus = (typeof JOB_STATUSES)[number];

/**
 * Adjacency list of valid forward transitions.
 * Failure/blocked transitions are universal — any "*_generating" or "*_pending"
 * can transition to its matching failure or to a blocked state.
 */
const ADVANCE: Record<JobStatus, JobStatus[]> = {
  draft: ["intake_received", "blocked_missing_inputs"],
  intake_received: ["brief_generating", "blocked_missing_inputs", "blocked_missing_consent"],
  brief_generating: ["brief_ready", "failed_brief"],
  brief_ready: ["brief_approved", "revision_requested"],
  brief_approved: ["script_generating"],
  script_generating: ["script_ready", "failed_script"],
  script_ready: ["storyboard_generating", "revision_requested"],
  storyboard_generating: ["storyboard_ready", "failed_storyboard"],
  storyboard_ready: ["prompts_generating", "revision_requested"],
  prompts_generating: ["prompts_ready", "failed_prompting"],
  prompts_ready: ["assets_generating", "qa_pending"], // can skip generation in mock mode
  assets_generating: ["assets_ready", "failed_generation", "blocked_tool_unavailable"],
  assets_ready: ["rendering", "qa_pending"],
  rendering: ["qa_pending", "failed_render"],
  qa_pending: ["qa_passed", "qa_failed"],
  qa_failed: ["revision_requested", "failed_qa"],
  qa_passed: ["client_review"],
  client_review: ["approved", "revision_requested", "blocked_human_review_required"],
  revision_requested: [
    "brief_generating",
    "script_generating",
    "storyboard_generating",
    "prompts_generating",
    "assets_generating",
    "rendering",
  ],
  approved: ["delivered", "failed_delivery"],
  delivered: ["published", "archived"],
  published: ["archived"],
  archived: [],
  // failure terminals (can only be re-opened via revision_requested)
  failed_intake: ["revision_requested", "archived"],
  failed_brief: ["revision_requested", "archived"],
  failed_script: ["revision_requested", "archived"],
  failed_storyboard: ["revision_requested", "archived"],
  failed_prompting: ["revision_requested", "archived"],
  failed_generation: ["revision_requested", "archived"],
  failed_render: ["revision_requested", "archived"],
  failed_qa: ["revision_requested", "archived"],
  failed_delivery: ["revision_requested", "archived"],
  // blocked states are recoverable once the blocker clears
  blocked_missing_inputs: ["intake_received", "archived"],
  blocked_missing_consent: ["intake_received", "brief_generating", "archived"],
  blocked_tool_unavailable: ["assets_generating", "archived"],
  blocked_human_review_required: ["client_review", "approved", "archived"],
};

export function canTransition(from: JobStatus, to: JobStatus): boolean {
  return ADVANCE[from]?.includes(to) ?? false;
}

export function allowedNext(from: JobStatus): JobStatus[] {
  return ADVANCE[from] ?? [];
}

export class IllegalTransitionError extends Error {
  constructor(public from: JobStatus, public to: JobStatus) {
    super(`Illegal job transition: ${from} -> ${to}`);
    this.name = "IllegalTransitionError";
  }
}

/**
 * Recommended next forward step in the happy path. Returns undefined if the
 * job is in a terminal or branching state that requires a human decision.
 */
export function happyPathNext(from: JobStatus): JobStatus | undefined {
  const map: Partial<Record<JobStatus, JobStatus>> = {
    draft: "intake_received",
    intake_received: "brief_generating",
    brief_generating: "brief_ready",
    brief_ready: "brief_approved",
    brief_approved: "script_generating",
    script_generating: "script_ready",
    script_ready: "storyboard_generating",
    storyboard_generating: "storyboard_ready",
    storyboard_ready: "prompts_generating",
    prompts_generating: "prompts_ready",
    prompts_ready: "qa_pending",
    qa_pending: "qa_passed",
    qa_passed: "client_review",
    client_review: "approved",
    approved: "delivered",
    delivered: "archived",
  };
  return map[from];
}

export function isTerminal(status: JobStatus): boolean {
  return status === "archived";
}

export function isFailure(status: JobStatus): boolean {
  return status.startsWith("failed_");
}

export function isBlocked(status: JobStatus): boolean {
  return status.startsWith("blocked_");
}
