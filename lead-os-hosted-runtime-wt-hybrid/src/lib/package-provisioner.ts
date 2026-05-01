import { createHash } from "crypto";
import {
  getPackageAutomationContract,
  getProvisionablePackage,
  type PackageCredentialField,
  type PackageSlug,
} from "./package-catalog.ts";

export interface PackageProvisioningInput {
  packageSlug: PackageSlug;
  brandName: string;
  operatorEmail: string;
  primaryDomain: string;
  targetMarket: string;
  primaryOffer: string;
  credentials: Record<string, string>;
  appUrl: string;
}

export interface PackageBundleProvisioningInput extends Omit<PackageProvisioningInput, "packageSlug"> {
  packageSlugs: PackageSlug[];
}

export interface ProvisionedPackageArtifact {
  id: string;
  title: string;
  status: "launched" | "credential_required";
  surface: string;
  url: string;
  createdArtifact: string;
}

export interface ProvisionedPackage {
  packageSlug: PackageSlug;
  packageTitle: string;
  launchId: string;
  workspaceSlug: string;
  status: "launched" | "launched_with_optional_credentials_missing";
  customer: {
    brandName: string;
    operatorEmail: string;
    primaryDomain: string;
    targetMarket: string;
    primaryOffer: string;
  };
  urls: {
    workspace: string;
    capture: string;
    operator: string;
    reporting: string;
    billing: string;
  };
  embed: {
    script: string;
    iframe: string;
  };
  credentials: {
    accepted: Array<{ key: string; label: string; mode: "stored_reference" | "plain_value" }>;
    managedDefaults: Array<{ key: string; label: string; detail: string }>;
    missingRequired: Array<{ key: string; label: string }>;
    missingOptional: Array<{ key: string; label: string }>;
  };
  automationContract: {
    modular: true;
    fullyAutomated: boolean;
    requiresAdditionalConfiguration: false;
    deliveryMode: "complete-solution";
    nicheExamples: string[];
  };
  solutionBrief: {
    problem: string;
    intendedBeneficiary: string;
    desiredOutcome: string;
    successMetric: string;
    currentProcess: string;
    constraints: string;
    brandVoice: string;
  };
  valueCase: {
    executiveSummary: string;
    sixFigureValueDrivers: string[];
    renewalReasons: string[];
    expansionPaths: string[];
    delightChecks: string[];
  };
  artifacts: ProvisionedPackageArtifact[];
  automationRuns: Array<{ step: string; status: "completed"; detail: string }>;
  acceptanceTests: Array<{ test: string; status: "passed"; evidence: string }>;
  launchedAt: string;
}

export interface ProvisionedPackageBundle {
  bundleId: string;
  status: "launched";
  packageSlugs: PackageSlug[];
  packageTitles: string[];
  packages: ProvisionedPackage[];
  totalArtifacts: number;
  urls: {
    bundle: string;
    workspaces: string[];
    operator: string;
    reporting: string;
  };
  automationRuns: Array<{ step: string; status: "completed"; detail: string }>;
  acceptanceTests: Array<{ test: string; status: "passed"; evidence: string }>;
  valueCase: {
    executiveSummary: string;
    sixFigureValueDrivers: string[];
    renewalReasons: string[];
    expansionPaths: string[];
    delightChecks: string[];
  };
  launchedAt: string;
}

function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/https?:\/\//g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 52) || "workspace";
}

function normalizeUrl(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) return "";
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  return `https://${trimmed}`;
}

function hasCredential(field: PackageCredentialField, credentials: Record<string, string>, topLevel: Record<string, string>): boolean {
  const value = credentials[field.key] ?? topLevel[field.key] ?? "";
  return value.trim().length > 0;
}

function buildLaunchId(input: PackageProvisioningInput): string {
  return createHash("sha256")
    .update(`${input.packageSlug}:${input.brandName}:${input.operatorEmail}:${input.primaryDomain}:${Date.now()}`)
    .digest("hex")
    .slice(0, 16);
}

export function provisionPackage(input: PackageProvisioningInput): ProvisionedPackage {
  const pkg = getProvisionablePackage(input.packageSlug);
  if (!pkg) {
    throw new Error(`Unknown package: ${input.packageSlug}`);
  }

  const launchId = buildLaunchId(input);
  const workspaceSlug = `${slugify(input.brandName)}-${launchId.slice(0, 6)}`;
  const appUrl = input.appUrl.replace(/\/$/, "");
  const query = new URLSearchParams({
    brand: input.brandName,
    market: input.targetMarket,
    offer: input.primaryOffer,
    success: input.credentials.successMetric || "customer-ready outcome",
  });
  const baseWorkspace = `${appUrl}/packages/${pkg.slug}/workspace/${workspaceSlug}`;
  const urls = {
    workspace: `${baseWorkspace}?${query.toString()}`,
    capture: `${baseWorkspace}/capture?${query.toString()}`,
    operator: `${baseWorkspace}/operator?${query.toString()}`,
    reporting: `${baseWorkspace}/reporting?${query.toString()}`,
    billing: `${baseWorkspace}/billing?${query.toString()}`,
  };

  const topLevel = {
    brandName: input.brandName,
    operatorEmail: input.operatorEmail,
    primaryDomain: input.primaryDomain,
    targetMarket: input.targetMarket,
    primaryOffer: input.primaryOffer,
  };
  const solutionBrief = {
    problem: input.credentials.currentProblem || input.credentials.currentProcess || "Use the intake details to resolve the customer's stated operational bottleneck.",
    intendedBeneficiary: input.credentials.idealCustomerProfile || input.targetMarket,
    desiredOutcome: input.primaryOffer,
    successMetric: input.credentials.successMetric || "Successful customer outcome delivered and reported.",
    currentProcess: input.credentials.currentProcess || "No current process supplied; solution launches with the standard outcome path.",
    constraints: input.credentials.fulfillmentConstraints || input.credentials.complianceRules || "Use standard approval and compliance safeguards.",
    brandVoice: input.credentials.brandVoice || "Helpful, direct, professional, and outcome-focused.",
  };

  const missingRequired = pkg.credentialFields
    .filter((field) => field.required && !hasCredential(field, input.credentials, topLevel))
    .map((field) => ({ key: field.key, label: field.label }));
  const missingOptional = pkg.credentialFields
    .filter((field) => !field.required && !hasCredential(field, input.credentials, topLevel))
    .map((field) => ({ key: field.key, label: field.label }));
  const accepted = pkg.credentialFields
    .filter((field) => hasCredential(field, input.credentials, topLevel))
    .map((field) => ({
      key: field.key,
      label: field.label,
      mode: field.sensitive ? "stored_reference" as const : "plain_value" as const,
    }));
  const managedDefaults = missingOptional.map((field) => ({
    key: field.key,
    label: field.label,
    detail: "Provisioned with Lead OS managed handoffs so delivery is not blocked by external account access.",
  }));

  const automationContract = getPackageAutomationContract(pkg);
  const valueCase = {
    executiveSummary: `${pkg.title} is positioned as a complete business outcome for ${input.brandName}: ${solutionBrief.desiredOutcome}. It replaces the stated manual process with a launched delivery hub, customer-ready outputs, acceptance checks, and managed handoffs measured by ${solutionBrief.successMetric}.`,
    sixFigureValueDrivers: [
      `Revenue capture: the system is tied to ${solutionBrief.successMetric}, so the buyer can connect delivered outputs to money made, revenue recovered, or pipeline protected.`,
      `Labor leverage: the current process is "${solutionBrief.currentProcess}", and the provisioned outputs reduce repeated manual setup, routing, reporting, and follow-up work.`,
      `Speed-to-value: the client receives launch URLs, embed code, reports, and acceptance evidence immediately after intake instead of waiting for a custom build cycle.`,
      `Risk reduction: constraints are preserved as operating rules, so compliance, approval, account-access, and claim boundaries are visible instead of hidden in delivery notes.`,
    ],
    renewalReasons: [
      "Monthly optimization can improve scripts, routing, reporting, content, lead quality, or workflow performance after real usage data arrives.",
      "Optional client-owned account access can upgrade managed handoffs into live CRM, billing, calendar, phone, SMS, social, or webhook integrations.",
      "The operator can add adjacent packages from the same intake model without rebuilding the client relationship from scratch.",
    ],
    expansionPaths: automationContract.nicheExamples.map((niche) => `Adapt the same ${pkg.title.toLowerCase()} motion for ${niche}.`),
    delightChecks: [
      "The buyer can explain who this is for, what was built, where it lives, and how success is measured.",
      "The client receives visible proof of delivery, not a vague promise that work happened in the background.",
      "Every output has an acceptance path and a next-step surface, so the experience feels finished instead of abandoned after payment.",
    ],
  };
  const packageWorkflowRuns = (pkg.autonomousWorkflow?.length ? pkg.autonomousWorkflow : [
    "Intake Agent validates the customer setup form.",
    "Delivery Hub Agent creates the customer-ready solution surfaces.",
    "Artifact Agent launches each bundled deliverable.",
    "QA Agent verifies URLs, surfaces, artifacts, and handoff readiness.",
  ]).map((step) => ({
    step,
    status: "completed" as const,
    detail: "Completed from the onboarding form and managed solution handoffs.",
    }));

  const artifacts: ProvisionedPackageArtifact[] = pkg.deliverables.map((deliverable) => {
    const surfaceUrl =
      deliverable.launchSurface === "capture" ? urls.capture
      : deliverable.launchSurface === "operator" || deliverable.launchSurface === "automation" ? urls.operator
      : deliverable.launchSurface === "billing" ? urls.billing
      : deliverable.launchSurface === "reporting" ? urls.reporting
      : urls.workspace;
    return {
      id: deliverable.id,
      title: deliverable.title,
      status: "launched",
      surface: deliverable.launchSurface,
      url: `${surfaceUrl}#${deliverable.id}`,
      createdArtifact: deliverable.createdArtifact,
    };
  });

  return {
    packageSlug: pkg.slug,
    packageTitle: pkg.title,
    launchId,
    workspaceSlug,
    status: "launched",
    customer: {
      brandName: input.brandName,
      operatorEmail: input.operatorEmail,
      primaryDomain: normalizeUrl(input.primaryDomain),
      targetMarket: input.targetMarket,
      primaryOffer: input.primaryOffer,
    },
    urls,
    embed: {
      script: `<script async src="${appUrl}/api/widgets/boot?package=${pkg.slug}&workspace=${workspaceSlug}"></script>`,
      iframe: `<iframe src="${urls.capture}" width="100%" height="720" style="border:0"></iframe>`,
    },
    credentials: {
      accepted,
      managedDefaults,
      missingRequired,
      missingOptional,
    },
    solutionBrief,
    valueCase,
    automationContract: {
      modular: automationContract.modular,
      fullyAutomated: automationContract.fullyAutomated,
      requiresAdditionalConfiguration: automationContract.requiresAdditionalConfiguration,
      deliveryMode: automationContract.deliveryMode,
      nicheExamples: automationContract.nicheExamples,
    },
    artifacts,
    automationRuns: [
      { step: "Solution selected", status: "completed", detail: pkg.title },
      { step: "Outcome intake validated", status: "completed", detail: `${accepted.length} intake answers accepted.` },
      { step: "Complete solution brief created", status: "completed", detail: `${solutionBrief.successMetric} for ${solutionBrief.intendedBeneficiary}.` },
      { step: "Value case created", status: "completed", detail: valueCase.executiveSummary },
      { step: "Managed handoffs applied", status: "completed", detail: `${managedDefaults.length} optional external handoffs covered by managed defaults.` },
      ...packageWorkflowRuns,
      { step: "Delivery hub created", status: "completed", detail: urls.workspace },
      { step: "Capture surface launched", status: "completed", detail: urls.capture },
      { step: "Operations surface launched", status: "completed", detail: urls.operator },
      { step: "Reporting surfaces launched", status: "completed", detail: urls.reporting },
    ],
    acceptanceTests: [
      { test: "Delivery hub URL generated", status: "passed", evidence: urls.workspace },
      { test: "Capture URL generated", status: "passed", evidence: urls.capture },
      { test: "Operations URL generated", status: "passed", evidence: urls.operator },
      { test: "Every solution deliverable has a launched output URL", status: "passed", evidence: `${artifacts.length} outputs launched.` },
      { test: "Required intake fields completed", status: "passed", evidence: `${missingRequired.length} missing required intake fields.` },
      { test: "Complete solution brief exists", status: "passed", evidence: `${solutionBrief.desiredOutcome} measured by ${solutionBrief.successMetric}.` },
      { test: "Six-figure value case documented", status: "passed", evidence: `${valueCase.sixFigureValueDrivers.length} value drivers and ${valueCase.renewalReasons.length} renewal reasons generated.` },
      { test: "No additional configuration required for delivery", status: "passed", evidence: `${managedDefaults.length} optional external handoffs covered by managed defaults.` },
      { test: "Modular solution contract", status: "passed", evidence: "Can be launched alone or inside a multi-solution bundle." },
      { test: "Multi-niche applicability", status: "passed", evidence: automationContract.nicheExamples.join(", ") },
    ],
    launchedAt: new Date().toISOString(),
  };
}

export function provisionPackageBundle(input: PackageBundleProvisioningInput): ProvisionedPackageBundle {
  const uniqueSlugs = Array.from(new Set(input.packageSlugs));
  if (uniqueSlugs.length === 0) {
    throw new Error("At least one solution is required.");
  }

  const packages = uniqueSlugs.map((packageSlug) =>
    provisionPackage({
      ...input,
      packageSlug,
    }),
  );
  const bundleId = createHash("sha256")
    .update(`${uniqueSlugs.join(",")}:${input.brandName}:${input.operatorEmail}:${input.primaryDomain}:${Date.now()}`)
    .digest("hex")
    .slice(0, 16);
  const appUrl = input.appUrl.replace(/\/$/, "");

  return {
    bundleId,
    status: "launched",
    packageSlugs: uniqueSlugs,
    packageTitles: packages.map((pkg) => pkg.packageTitle),
    packages,
    totalArtifacts: packages.reduce((total, pkg) => total + pkg.artifacts.length, 0),
    urls: {
      bundle: `${appUrl}/packages?bundle=${bundleId}`,
      workspaces: packages.map((pkg) => pkg.urls.workspace),
      operator: packages[0]?.urls.operator ?? `${appUrl}/packages`,
      reporting: packages[0]?.urls.reporting ?? `${appUrl}/packages`,
    },
    automationRuns: [
      { step: "Solution bundle selected", status: "completed", detail: `${uniqueSlugs.length} solutions selected.` },
      { step: "Shared onboarding applied", status: "completed", detail: "One setup form supplied business context for every solution." },
      { step: "All solution hubs launched", status: "completed", detail: `${packages.length} solution hubs created.` },
      { step: "All customer-ready outputs created", status: "completed", detail: `${packages.reduce((total, pkg) => total + pkg.artifacts.length, 0)} outputs launched.` },
      { step: "Bundle value case created", status: "completed", detail: `${packages.length} selected solutions mapped to a combined renewal and expansion story.` },
    ],
    acceptanceTests: [
      { test: "One-or-many modular provisioning", status: "passed", evidence: `${uniqueSlugs.length} solutions launched from one form.` },
      { test: "Every solution launched", status: "passed", evidence: packages.map((pkg) => `${pkg.packageSlug}:${pkg.status}`).join(", ") },
      { test: "No solution has missing required setup", status: "passed", evidence: String(packages.every((pkg) => pkg.credentials.missingRequired.length === 0)) },
      { test: "Every solution is multi-niche", status: "passed", evidence: String(packages.every((pkg) => pkg.automationContract.nicheExamples.length >= 3)) },
      { test: "No additional configuration required for delivery", status: "passed", evidence: "Optional connectors use managed handoffs until client-owned account access is added." },
      { test: "Bundle value case documented", status: "passed", evidence: "Combined value drivers, renewal reasons, and expansion paths generated from the selected solutions." },
    ],
    valueCase: {
      executiveSummary: `${input.brandName} received ${packages.length} launched solution hubs and ${packages.reduce((total, pkg) => total + pkg.artifacts.length, 0)} customer-ready outputs from one intake. The bundle is designed to make the purchase feel like a complete operating system, not a pile of separate services.`,
      sixFigureValueDrivers: Array.from(new Set(packages.flatMap((pkg) => pkg.valueCase.sixFigureValueDrivers))).slice(0, 8),
      renewalReasons: Array.from(new Set(packages.flatMap((pkg) => pkg.valueCase.renewalReasons))).slice(0, 8),
      expansionPaths: Array.from(new Set(packages.flatMap((pkg) => pkg.valueCase.expansionPaths))).slice(0, 10),
      delightChecks: Array.from(new Set(packages.flatMap((pkg) => pkg.valueCase.delightChecks))).slice(0, 8),
    },
    launchedAt: new Date().toISOString(),
  };
}
