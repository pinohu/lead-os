import type { PackageDeliverable, ProvisionablePackage } from "./package-catalog.ts";

export interface SolutionBriefForGuidance {
  problem: string;
  intendedBeneficiary: string;
  desiredOutcome: string;
  successMetric: string;
  currentProcess: string;
  constraints: string;
  brandVoice: string;
}

export interface DeliverableImplementationGuide {
  summary: string;
  customerPurpose: string;
  implementationSteps: string[];
  operatingWorkflow: string[];
  ownerActions: string[];
  handoffInstructions: string[];
  acceptanceChecklist: string[];
  failureStates: string[];
  nextMilestones: string[];
}

export interface PackageCustomerGuide {
  title: string;
  executiveOverview: string;
  startHere: string[];
  whatWasProvisioned: string[];
  operatingWorkflow: string[];
  implementationRoadmap: Array<{
    phase: string;
    timing: string;
    actions: string[];
  }>;
  rolesAndResponsibilities: Array<{
    role: string;
    responsibility: string;
  }>;
  measurementPlan: string[];
  supportAndEscalation: string[];
  ambiguityKillers: string[];
}

const defaultBrief: SolutionBriefForGuidance = {
  problem: "The buyer wants a complete business outcome without assembling or operating separate systems.",
  intendedBeneficiary: "The selected audience from the intake form.",
  desiredOutcome: "The promised customer outcome.",
  successMetric: "The success metric submitted in the intake form.",
  currentProcess: "The current process supplied during intake.",
  constraints: "The rules, limits, compliance notes, and approval requirements supplied during intake.",
  brandVoice: "The customer experience style supplied during intake.",
};

function surfacePurpose(surface: PackageDeliverable["launchSurface"]): string {
  switch (surface) {
    case "capture":
      return "This is the frontstage intake surface. It turns demand into structured submissions with enough context to route the next step.";
    case "operator":
      return "This is the operator surface. It tells the delivery owner what to inspect, approve, prioritize, or hand off next.";
    case "automation":
      return "This is the workflow layer. It defines the repeatable sequence, routing rule, scoring rule, or message logic behind the outcome.";
    case "billing":
      return "This is the monetization surface. It explains how quotes, payments, commissions, buyer claims, or revenue events should be handled.";
    case "reporting":
      return "This is the proof surface. It shows whether the promised outcome is moving in the right direction.";
    default:
      return "This is the delivery hub surface. It explains what was created, where it lives, and how the client should use it.";
  }
}

function surfaceWorkflow(surface: PackageDeliverable["launchSurface"], title: string): string[] {
  switch (surface) {
    case "capture":
      return [
        "Traffic or a human operator sends the right person to the capture surface.",
        "The form collects identity, context, urgency, desired outcome, and consent-sensitive details.",
        "The submitted record is routed to the operator path, report path, or follow-up path for this solution.",
        `The ${title.toLowerCase()} is reviewed against the stated success metric before the next action is taken.`,
      ];
    case "operator":
      return [
        "Open the operations surface at the beginning of each delivery cycle.",
        "Review ready, blocked, and needs-human-review items before any outbound action.",
        "Use the listed next action instead of improvising from email or chat threads.",
        "Record the outcome so reporting and future optimization stay accurate.",
      ];
    case "automation":
      return [
        "Treat the workflow as the system of record for the repeatable handoff.",
        "Confirm the trigger, routing condition, message, or scoring rule matches the intake constraints.",
        "Run one sample scenario before using the workflow with real customer demand.",
        "Escalate any edge case that violates the stated rules, limits, claims, or approval requirements.",
      ];
    case "billing":
      return [
        "Use the billing surface to confirm price, buyer, event type, and payment or payout state.",
        "Send the buyer to the payment, invoice, claim, or commission path shown in the surface.",
        "Reconcile the event against the revenue report after payment, refund, claim, or payout status changes.",
        "Do not treat money movement as live unless approved payment account access is connected.",
      ];
    case "reporting":
      return [
        "Open the reporting surface on the agreed cadence.",
        "Compare raw demand, qualified intent, completed action, and value created.",
        "Use the report to decide what to improve, pause, expand, or escalate.",
        "Attach the report to renewal, optimization, and client update conversations.",
      ];
    default:
      return [
        "Open the delivery hub first.",
        "Confirm the client name, target market, desired outcome, and success metric.",
        "Walk through the provisioned outputs in order.",
        "Use the acceptance checklist before treating the solution as customer-ready.",
      ];
  }
}

export function buildDeliverableGuide(
  pkg: ProvisionablePackage,
  deliverable: PackageDeliverable,
  brief: Partial<SolutionBriefForGuidance> = {},
): DeliverableImplementationGuide {
  const context = { ...defaultBrief, ...brief };
  const purpose = surfacePurpose(deliverable.launchSurface);

  return {
    summary: `${deliverable.title} is provisioned as part of ${pkg.title}. It exists to move ${context.intendedBeneficiary} toward ${context.desiredOutcome} and to make progress measurable by ${context.successMetric}.`,
    customerPurpose: `${purpose} The client should use it as a finished part of the solution, not as a blank setup task.`,
    implementationSteps: [
      `Open the linked ${deliverable.launchSurface} surface and confirm the title, promise, and context match the buyer's submitted intake.`,
      `Read the created artifact: ${deliverable.createdArtifact}`,
      `Apply the brand voice rule: ${context.brandVoice}`,
      `Apply the constraint rule before any customer-facing use: ${context.constraints}`,
      "Run the acceptance checklist below. If anything fails, use the failure-state instructions instead of guessing.",
    ],
    operatingWorkflow: surfaceWorkflow(deliverable.launchSurface, deliverable.title),
    ownerActions: [
      "Assign one delivery owner for this output.",
      "Confirm whether the output is customer-facing, operator-facing, reporting-facing, or monetization-facing.",
      "Use the next milestone list to decide what the client should do today, this week, and this month.",
      "Record any client-specific exception in the delivery hub so the next operator sees the same truth.",
    ],
    handoffInstructions: [
      "Send the client the delivery hub URL first, then the specific output URL.",
      "Explain the output in one sentence using the summary above.",
      "Point the client to the first implementation step and the acceptance checklist.",
      "If an optional external account is not connected, use the managed handoff described in the provisioning result.",
    ],
    acceptanceChecklist: [
      "The output has a launched URL.",
      "The output title and created artifact match the selected package.",
      "The output names the intended beneficiary, success metric, and next action.",
      "The client can tell whether this output is for capture, operations, workflow, billing, reporting, or the delivery hub.",
      "The output has clear failure handling and does not require hidden follow-up configuration to be useful.",
    ],
    failureStates: [
      "If the client does not recognize the business context, return to the intake values and correct the brand, market, or offer before using the output.",
      "If the next action depends on a client-owned account, use the managed handoff until approved access is added.",
      "If the output would make a regulated, financial, medical, legal, or unsupported claim, pause and route to human approval.",
      "If the output does not support the stated success metric, mark it for optimization before presenting it as proof of value.",
    ],
    nextMilestones: [
      "Today: review the output and complete the acceptance checklist.",
      "This week: use the output with a real or sample customer scenario and record the result.",
      "This month: compare results against the success metric and decide whether to optimize, expand, or bundle another package.",
    ],
  };
}

export function buildPackageCustomerGuide(
  pkg: ProvisionablePackage,
  brief: Partial<SolutionBriefForGuidance> = {},
  createdOutputs: Array<{ title: string; createdArtifact: string; surface: string }> = pkg.deliverables.map((deliverable) => ({
    title: deliverable.title,
    createdArtifact: deliverable.createdArtifact,
    surface: deliverable.launchSurface,
  })),
): PackageCustomerGuide {
  const context = { ...defaultBrief, ...brief };

  return {
    title: `${pkg.title} customer implementation guide`,
    executiveOverview: `${pkg.title} has been provisioned as a complete solution for ${context.intendedBeneficiary}. The client should judge it by ${context.successMetric}, not by the number of screens or assets created.`,
    startHere: [
      "Open the delivery hub URL first.",
      "Confirm the business name, target market, primary outcome, and success metric.",
      "Review the customer-ready outputs in the order they appear in the hub.",
      "Use each output guide before sending links to customers, staff, buyers, partners, or operators.",
      "Use managed handoffs for any optional account access that was not supplied during intake.",
    ],
    whatWasProvisioned: createdOutputs.map((output) => `${output.title} (${output.surface}): ${output.createdArtifact}`),
    operatingWorkflow: [
      "Capture demand or source material through the provisioned capture or workspace surface.",
      "Route submissions, assets, or decisions through the operator surface.",
      "Use workflow outputs to standardize follow-up, scoring, production, reactivation, or handoff.",
      "Use reporting outputs to prove whether the promised outcome is happening.",
      "Use billing or monetization outputs only with approved account access or managed payment handoff instructions.",
    ],
    implementationRoadmap: [
      {
        phase: "Immediate handoff",
        timing: "0-1 hour after intake",
        actions: [
          "Open every launched URL.",
          "Read the package guide and the output guides.",
          "Confirm the acceptance checks show passed.",
          "Send the delivery hub to the client with the start-here instructions.",
        ],
      },
      {
        phase: "First usage cycle",
        timing: "First 1-7 days",
        actions: [
          "Run one real or sample customer scenario through the capture or workspace surface.",
          "Check the operator surface for next actions and blocked items.",
          "Record the first outcome against the success metric.",
          "Update constraints if the client identifies a compliance, brand, or escalation edge case.",
        ],
      },
      {
        phase: "Optimization cycle",
        timing: "Weeks 2-4",
        actions: [
          "Review reporting and acceptance evidence.",
          "Tune copy, routing, sequence, scoring, or handoff rules using observed friction.",
          "Identify whether the client should add another package or expand the current package to another niche.",
          "Prepare the renewal report around outcomes, not activity.",
        ],
      },
    ],
    rolesAndResponsibilities: [
      { role: "Client decision maker", responsibility: "Confirms the business outcome, approval rules, and success metric." },
      { role: "Delivery operator", responsibility: "Uses the delivery hub, reviews output guides, and handles exceptions." },
      { role: "Customer-facing team", responsibility: "Uses capture, booking, nurture, or support outputs exactly as described in the guide." },
      { role: "Lead OS system", responsibility: "Provisions the selected outputs, managed handoffs, guidance, acceptance checks, and reporting surfaces from the submitted intake." },
    ],
    measurementPlan: [
      `Primary metric: ${context.successMetric}.`,
      "Track raw demand, qualified demand, completed action, value created, and blocked items.",
      "Separate live connected results from managed-handoff results so the client always understands what is automatic now and what improves with approved account access.",
      "Use the reporting surface as the renewal receipt.",
    ],
    supportAndEscalation: [
      "Use human review for any item that conflicts with the submitted constraints.",
      "Escalate missing or contradictory intake details before sending customer-facing messages.",
      "Escalate regulated claims, payment disputes, privacy requests, angry customers, emergencies, and high-value exceptions.",
      "When optional external accounts are missing, continue with the managed handoff rather than blocking delivery.",
    ],
    ambiguityKillers: [
      "The client bought an outcome, not software to configure.",
      "The delivery hub is the first place to open.",
      "Each output has its own guide, next action, and acceptance checklist.",
      "A missing optional integration is not a failed launch; it is handled through managed handoff until approved access is added.",
      "Success is measured by the intake success metric and the package reporting surface.",
    ],
  };
}

export function buildBundleCustomerGuide(input: {
  brandName: string;
  packageTitles: string[];
  totalArtifacts: number;
  successMetric: string;
}): PackageCustomerGuide {
  const packageList = input.packageTitles.join(", ");

  return {
    title: `${input.brandName} bundle implementation guide`,
    executiveOverview: `${input.brandName} received ${input.packageTitles.length} complete solution hubs and ${input.totalArtifacts} guided outputs. The bundle should be operated as one connected outcome system measured by ${input.successMetric}.`,
    startHere: [
      "Open the first workspace URL in the bundle.",
      "Review each package guide before assigning work to the client or delivery team.",
      "Use the same intake truth across all selected packages instead of asking the client to submit another form.",
      "Confirm every package has passed acceptance checks.",
    ],
    whatWasProvisioned: input.packageTitles.map((title) => `${title}: complete delivery hub with guided outputs and acceptance checks.`),
    operatingWorkflow: [
      `Operate these selected packages together: ${packageList}.`,
      "Use shared intake details for target market, offer, success metric, current process, constraints, and brand voice.",
      "Route capture, production, follow-up, monetization, and reporting through the package surfaces that match the client's immediate goal.",
      "Use reporting outputs to decide which package should be optimized or expanded first.",
    ],
    implementationRoadmap: [
      {
        phase: "Bundle orientation",
        timing: "Same day",
        actions: [
          "Open every package workspace.",
          "Identify the package that touches the customer's buyer first.",
          "Identify the package that proves value fastest.",
          "Assign owners to each package guide.",
        ],
      },
      {
        phase: "First outcome path",
        timing: "First week",
        actions: [
          "Run a customer scenario through the highest-priority package.",
          "Use adjacent packages only where they support that first outcome.",
          "Record proof in the reporting surface.",
        ],
      },
      {
        phase: "Expansion path",
        timing: "Weeks 2-4",
        actions: [
          "Review which package created the strongest value signal.",
          "Turn that proof into the renewal story.",
          "Add connected account access where it unlocks more value.",
        ],
      },
    ],
    rolesAndResponsibilities: [
      { role: "Client decision maker", responsibility: "Approves the combined outcome priority and success metric." },
      { role: "Package owner", responsibility: "Owns the guide, outputs, and acceptance checks for one selected package." },
      { role: "Delivery operator", responsibility: "Coordinates package handoffs without asking the client for repeat intake." },
      { role: "Lead OS system", responsibility: "Launches every selected package from the one submitted form." },
    ],
    measurementPlan: [
      `Shared success metric: ${input.successMetric}.`,
      "Track package-level outcomes separately and roll them up into one bundle story.",
      "Prioritize optimization where the fastest money, time, or risk value appears.",
    ],
    supportAndEscalation: [
      "Escalate contradictions between selected package outcomes before changing customer-facing copy.",
      "Keep optional account access as managed handoff until approved access is added.",
      "Use package-specific failure states when one package is blocked while others remain live.",
    ],
    ambiguityKillers: [
      "One intake form is enough for the selected package mix.",
      "Each package can stand alone, but the bundle guide explains how to operate them together.",
      "The client should not receive raw artifacts without the package guide and output guides.",
      "The first renewal conversation should point to outcomes and acceptance evidence.",
    ],
  };
}
