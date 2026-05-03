import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  aiAgencyPackageSlugs,
  getPackageAutomationContract,
  getPackageIdeaEvaluationGuardrails,
  getPackageServiceReplacementStrategy,
  getUniversalPackageCredentialFields,
  provisionablePackages,
  simpleOnboardingFieldKeys,
  type PackageServiceReplacementStrategy,
  type PackageSlug,
} from "../src/lib/package-catalog.ts";
import { packagePersonaBlueprints } from "../src/lib/package-persona-blueprints.ts";
import { provisionPackage, provisionPackageBundle } from "../src/lib/package-provisioner.ts";
import { deliveredNow, notLiveUntilConfigured } from "../src/lib/public-offer.ts";
import {
  _resetPackageProvisioningStoreForTests,
  getProvisionedPackage,
  saveProvisionedPackage,
} from "../src/lib/package-provisioning-store.ts";

const outcomeContext = {
  idealCustomerProfile: "Decision makers who want a complete outcome without learning new software.",
  successMetric: "qualified opportunities, finished assets, recovered revenue, and hours saved",
  currentProcess: "The customer currently handles the work manually with inconsistent follow-up and reporting.",
  fulfillmentConstraints: "Use human approval for regulated claims and avoid unsupported guarantees.",
  brandVoice: "clear, professional, helpful, and outcome-focused",
};

const universalCredentialContext = {
  ...outcomeContext,
  crmApiKey: "stored reference: crm access",
  stripeSecretKey: "stored reference: billing access",
  webhookUrl: "https://example.com/webhooks/lead-os",
  bookingUrl: "https://cal.com/acme/qualified-call",
  crmExportUrl: "https://example.com/crm-export.csv",
  adAccountAccess: "stored reference: ad account context",
  sourceAssetUrl: "https://example.com/source-material",
  brandAssetsUrl: "https://example.com/brand-assets",
  avatarVoiceConsent: "approved",
  complianceRules: "Use human approval for regulated claims.",
  socialAccountAccess: "stored reference: social publishing approval",
  emailCalendarAccess: "stored reference: inbox, calendar, and task rules",
  phoneProviderAccess: "stored reference: phone, SMS, and routing rules",
};

const standaloneMoatAcceptanceTests = [
  "Moat powers framework documented",
  "Speed as primary moat documented",
  "AI Seven Powers framework documented",
  "Process-power last-10-percent moat documented",
  "Counterpositioning work-based pricing moat documented",
  "Switching-costs deep integration moat documented",
  "Network-economy eval flywheel documented",
  "Cornered-resource data/eval moat documented",
  "Scale economies infrastructure moat documented",
  "Branding trust moat documented",
  "Schlep-blindness boring-space moat documented",
  "System-of-record data lock-in documented",
  "Outcome Graph moat documented",
  "Outcome Graph event schema documented",
  "Outcome Graph data assets documented",
  "Vertical eval flywheel documented",
  "Certified outcome standard documented",
  "Outcome billing moat documented",
] as const;

const bundleMoatAcceptanceTests = [
  "Bundle moat powers framework documented",
  "Bundle speed as primary moat documented",
  "Bundle AI Seven Powers framework documented",
  "Bundle process-power last-10-percent moat documented",
  "Bundle counterpositioning work-based pricing moat documented",
  "Bundle switching-costs deep integration moat documented",
  "Bundle network-economy eval flywheel documented",
  "Bundle cornered-resource data/eval moat documented",
  "Bundle scale economies infrastructure moat documented",
  "Bundle branding trust moat documented",
  "Bundle schlep-blindness boring-space moat documented",
  "Bundle system-of-record data lock-in documented",
  "Bundle Outcome Graph moat documented",
  "Bundle Outcome Graph event schema documented",
  "Bundle Outcome Graph data assets documented",
  "Bundle vertical eval flywheel documented",
  "Bundle Certified Outcome standard documented",
  "Bundle outcome billing moat documented",
] as const;

function assertMoatPowers(strategy: PackageServiceReplacementStrategy, label: string) {
  assert.match(
    strategy.moatPowerFrameworkSummary,
    /AI-native powers|speed first|process power|counterpositioning|switching costs|system-of-record/i,
    `${label} should summarize the AI-native moat powers portfolio`,
  );
  assert.match(
    strategy.speedAsPrimaryMoat,
    /one-day sprint cycles|AI software factories|forward-deployed|PRD/i,
    `${label} should treat speed as the primary moat`,
  );
  assert.match(
    strategy.aiSevenPowersFramework.join(" "),
    /Speed foundation|Process power|Counterpositioning|Switching costs|Network economy|Cornered resource|Scale economies|Branding/i,
    `${label} should map the AI Seven Powers`,
  );
  assert.match(
    strategy.processPowerLastTenPercentMoat,
    /last 10%|99% accuracy|KYC|loan origination/i,
    `${label} should make the final reliability gap the process-power moat`,
  );
  assert.match(
    strategy.counterpositioningWorkBasedPricingMoat,
    /work delivered|tasks completed|per-seat incumbent|headcount/i,
    `${label} should counterposition work-based pricing against per-seat incumbents`,
  );
  assert.match(
    strategy.switchingCostsDeepIntegrationMoat,
    /onboarding|custom rules|fraud-monitoring|debt recovery|acceptance history/i,
    `${label} should turn deep integration into switching costs`,
  );
  assert.match(
    strategy.networkEconomyEvalFlywheel,
    /eval flywheel|pass|failure|override|context engineering/i,
    `${label} should turn eval feedback into a network economy`,
  );
  assert.match(
    strategy.corneredResourceDataEvalMoat,
    /proprietary workflow data|tailored time-in-motion|specialized eval|serving cost|reliability/i,
    `${label} should identify cornered workflow data and eval resources`,
  );
  assert.match(
    strategy.scaleEconomiesInfrastructureMoat,
    /scale economies|static crawls|model optimizations|evaluation harnesses|cheaper per outcome/i,
    `${label} should connect reusable infrastructure to scale economies`,
  );
  assert.match(
    strategy.brandingTrustMoat,
    /brand|trust|category leadership|capabilities converge/i,
    `${label} should frame brand as trust under risk`,
  );
  assert.match(
    strategy.schlepBlindnessBoringSpaceMoat,
    /schlep blindness|payroll|tax accounting|trucking compliance|bank deals/i,
    `${label} should turn boring schlep into defensibility`,
  );
  assert.match(
    strategy.systemOfRecordDataLockIn,
    /system-of-record|customer history|operating memory|dashboard/i,
    `${label} should preserve operating memory as system-of-record lock-in`,
  );
  assert.match(
    strategy.outcomeGraphMoat,
    /Outcome Graph|buyer persona|accepted outputs|human overrides|pricing tested|tasks completed/i,
    `${label} should make the Outcome Graph the strongest moat`,
  );
  assert.match(
    strategy.outcomeGraphEventSchema.join(" "),
    /buyer persona|niche|pain point|offer|workflow steps|accepted outputs|failed outputs|human overrides|renewal reason|churn reason/i,
    `${label} should define the Outcome Graph event schema`,
  );
  assert.match(
    strategy.outcomeGraphDataAssets.join(" "),
    /Delivery hub records|acceptance receipts|pricing tests|Operator memory|human overrides|outcome reports/i,
    `${label} should identify Outcome Graph data assets`,
  );
  assert.match(
    strategy.verticalEvalFlywheel,
    /vertical evals|failed output|human override|accepted output|future package runs/i,
    `${label} should turn Outcome Graph events into vertical evals`,
  );
  assert.match(
    strategy.certifiedOutcomeStandard,
    /Certified Outcome|acceptance checks|launch proof|pricing logic|operating guide/i,
    `${label} should define a Certified Outcome standard`,
  );
  assert.match(
    strategy.switchingCostMemory,
    /switching costs|customer history|approvals|exceptions|performance receipts|operating memory/i,
    `${label} should compound switching-cost memory`,
  );
  assert.match(
    strategy.packageMarketplaceLoop,
    /package marketplace|clone|improve|specialize|distribute/i,
    `${label} should connect the moat to package marketplace distribution`,
  );
  assert.match(
    strategy.outcomeBillingMoat,
    /outcome-based billing|qualified leads|booked calls|recovered revenue|hours saved|accepted outputs/i,
    `${label} should tie billing to outcome proof`,
  );
  assert.match(
    strategy.forwardDeployedLearningLoop,
    /forward-deployed|custom implementation|boring workflow|reusable package logic/i,
    `${label} should turn customer implementations into reusable logic`,
  );
  assert.match(
    strategy.moatProofChecklist.join(" "),
    /accepted outputs|vertical eval|Certified Outcome|switching-cost memory|outcome billing/i,
    `${label} should expose a moat proof checklist`,
  );
  assert.match(
    strategy.moatOperatingRule,
    /feature count|Outcome Graph|workflow memory|compounds/i,
    `${label} should prioritize compounding workflow memory over feature count`,
  );
}

function assertBinaryTestGuardrails(
  guardrails: {
    pricingBinaryTestDefinition: string;
    openWalletValueSignal: string;
    binaryTestCustomerSegmentSignal: string;
    premiumPriceLearningSignal: string;
    complainButPayValidationSignal: string;
  },
  label: string,
) {
  assert.match(
    guardrails.pricingBinaryTestDefinition,
    /Binary Test|charging real money|open.*wallet|pays|price tag/i,
    `${label} should define the Binary Test as charging money`,
  );
  assert.match(
    guardrails.openWalletValueSignal,
    /open-wallet|refusal to pay|top-three|segment|valuable/i,
    `${label} should use open-wallet behavior as value validation`,
  );
  assert.match(
    guardrails.binaryTestCustomerSegmentSignal,
    /customer segment|pays fastest|budget|implementation friction/i,
    `${label} should use payment behavior to identify customer segments`,
  );
  assert.match(
    guardrails.premiumPriceLearningSignal,
    /undercutting|premium|Stripe|documentation|transaction fee|competitors/i,
    `${label} should preserve the premium-price learning lesson`,
  );
  assert.match(
    guardrails.complainButPayValidationSignal,
    /complains? about.*price|pays anyway|unsolved problem/i,
    `${label} should treat complain-but-pay as the strongest signal`,
  );
}

describe("package provisioning", () => {
  it("exposes many complete package artifacts, not only the small live deliverable examples", () => {
    const totalArtifacts = provisionablePackages.reduce((total, pkg) => total + pkg.deliverables.length, 0);

    assert.equal(provisionablePackages.length, 23);
    assert.ok(totalArtifacts >= 184);
  });

  it("keeps every package wired to credential fields and concrete created artifacts", () => {
    for (const pkg of provisionablePackages) {
      assert.ok(pkg.credentialFields.some((field) => field.required), `${pkg.slug} should require setup fields`);
      assert.ok(pkg.deliverables.length >= 8, `${pkg.slug} should launch a complete bundle`);

      for (const deliverable of pkg.deliverables) {
        assert.ok(deliverable.title.length > 3);
        assert.ok(deliverable.createdArtifact.length > 20);
      }
    }
  });

  it("keeps the universal intake broad enough to launch any standalone package or package bundle", () => {
    const universalKeys = new Set(simpleOnboardingFieldKeys);
    const universalFields = getUniversalPackageCredentialFields();

    for (const pkg of provisionablePackages) {
      for (const field of pkg.credentialFields) {
        assert.ok(universalKeys.has(field.key as never), `${pkg.slug} field ${field.key} should be collected in the one-time intake`);
      }
    }

    assert.equal(universalFields.length, simpleOnboardingFieldKeys.length);
    assert.deepEqual(
      universalFields.map((field) => field.key),
      [...simpleOnboardingFieldKeys],
    );
  });

  it("gives every standalone package a persona, message, pain points, journey, service blueprint, and delivery shape", () => {
    for (const pkg of provisionablePackages) {
      const blueprint = packagePersonaBlueprints[pkg.slug];

      assert.ok(blueprint, `${pkg.slug} should have a persona blueprint`);
      assert.ok(blueprint.offerFor.length > 40, `${pkg.slug} should state who the offer is for`);
      assert.ok(blueprint.decisionMaker.length > 20, `${pkg.slug} should identify the decision maker`);
      assert.ok(blueprint.residentPersona.length > 30, `${pkg.slug} should identify the resident or end user`);
      assert.ok(blueprint.messaging.length > 40, `${pkg.slug} should include market-facing messaging`);
      assert.ok(blueprint.residentPainPoints.length >= 4, `${pkg.slug} should include specific pain points`);
      assert.ok(blueprint.expectedOutcome.length > 40, `${pkg.slug} should define the expected result`);
      assert.ok(blueprint.deliveryShape.length >= 5, `${pkg.slug} should define the shape of delivery`);
      assert.ok(blueprint.userJourney.length >= 4, `${pkg.slug} should include a persona journey`);
      assert.ok(blueprint.serviceBlueprint.length >= 3, `${pkg.slug} should include a service blueprint`);
      assert.ok(blueprint.verificationPosture.length > 40, `${pkg.slug} should state delivery verification posture`);
    }
  });

  it("includes the 2026 autonomous agency products as concrete provisionable outcomes", () => {
    const slugs = new Set(provisionablePackages.map((pkg) => pkg.slug));
    const expectedAgencySlugs = [
      "ai-opportunity-audit",
      "ghost-expert-course-factory",
      "ai-receptionist-missed-call-recovery",
      "lead-reactivation-engine",
      "speed-to-lead-system",
      "content-repurposing-engine",
      "ai-ugc-video-ad-studio",
      "med-spa-growth-engine",
      "webinar-lead-magnet-factory",
      "founder-ai-chief-of-staff",
      "ai-first-business-os",
    ] satisfies PackageSlug[];

    for (const slug of expectedAgencySlugs) {
      assert.ok(slugs.has(slug), `${slug} should be a sellable autonomous agency product`);
    }

    const flagship = provisionablePackages.find((pkg) => pkg.slug === "ghost-expert-course-factory");
    assert.ok(flagship?.pricingModel?.includes("$5,000-$40,000"));
    assert.ok(flagship?.autonomousWorkflow?.some((step) => step.includes("Knowledge Extraction Agent")));
  });

  it("provisions a launched package with URLs, embed code, automation, and acceptance tests", () => {
    const result = provisionPackage({
      packageSlug: "local-service-lead-engine",
      brandName: "Acme Roofing",
      operatorEmail: "ops@example.com",
      primaryDomain: "https://example.com",
      targetMarket: "roofing customers in Erie, PA",
      primaryOffer: "Book an emergency roofing quote",
      credentials: {
        ...outcomeContext,
        bookingUrl: "https://cal.com/acme/roofing",
        webhookUrl: "https://example.com/webhooks/leads",
      },
      appUrl: "https://lead-os.example.com",
    });

    assert.equal(result.status, "launched");
    assert.match(result.urls.workspace, /^https:\/\/lead-os\.example\.com\/packages\/local-service-lead-engine\/workspace\//);
    assert.match(result.urls.capture, /\/capture\?/);
    assert.match(result.embed.script, /api\/widgets\/boot/);
    assert.equal(result.credentials.missingRequired.length, 0);
    assert.ok(result.credentials.managedDefaults.some((field) => field.key === "crmApiKey"));
    assert.equal(result.automationContract.requiresAdditionalConfiguration, false);
    assert.equal(result.automationContract.deliveryMode, "complete-solution");
    assert.equal(result.solutionBrief.successMetric, outcomeContext.successMetric);
    assert.match(result.serviceReplacementStrategy.servicesBudgetTarget, /service|outsourced|internal labor|agency/i);
    assert.match(result.serviceReplacementStrategy.perSeatRisk, /per-seat|automation|cannibalize revenue/i);
    assert.match(result.serviceReplacementStrategy.outcomePricing, /work delivered|accepted outputs|recovered revenue|qualified outcomes|completed tasks/i);
    assert.match(result.serviceReplacementStrategy.walletShareExpansion, /4% to 10%|services wallet/i);
    assert.ok(result.serviceReplacementStrategy.pricingUnits.includes("work delivered"));
    assert.ok(result.serviceReplacementStrategy.targetServiceIndustries.includes("insurance brokerage"));
    assert.match(result.serviceReplacementStrategy.serviceReplacementIndustryThesis, /human labor spend|software spend|outsourced function|manual operating team/i);
    assert.match(result.serviceReplacementStrategy.financialAdminServiceMarkets.join(" "), /accounting|tax audit|payroll|insurance brokerage|compliance|banking operations/i);
    assert.match(result.serviceReplacementStrategy.bankingOperationsUseCases.join(" "), /KYC|loan origination|debt recovery|fraud monitoring/i);
    assert.match(result.serviceReplacementStrategy.healthcareLegalServiceMarkets.join(" "), /healthcare administration|legal services|junior associate|outsourced legal/i);
    assert.match(result.serviceReplacementStrategy.specializedVerticalMarkets.join(" "), /logistics|trucking|fuel cards|HVAC|home services|construction|real estate|debt financing/i);
    assert.match(result.serviceReplacementStrategy.customerSupportLanguageMarkets.join(" "), /customer support|multilingual support|international contractor|DoorDasher-style|language-learning conversation/i);
    assert.match(result.serviceReplacementStrategy.easiestServiceReplacementIndustries.join(" "), /financial and administrative services|banking infrastructure|healthcare administration|legal application-layer services|HVAC and fragmented home services|construction and fragmented field services|trucking and logistics|multilingual customer and contractor support/i);
    assert.match(result.serviceReplacementStrategy.easiestServiceReplacementRationale, /services spend.*dwarfs software spend|already outsourced|completed outcome|managing headcount/i);
    assert.match(result.serviceReplacementStrategy.outsourcedOutcomeBudgetSignal, /agency|BPO|broker|admin team|specialist|replace the vendor path/i);
    assert.match(result.serviceReplacementStrategy.boringSchlepServiceOpportunity, /payroll|tax|trucking compliance|insurance|regulated admin|painstaking drudgery|process power/i);
    assert.match(result.serviceReplacementStrategy.fragmentedNonTechnicalReplacementPath, /HVAC|construction|home services|trucking|local field operations|minted into.*core workflow/i);
    assert.match(result.serviceReplacementStrategy.legalApplicationLayerReplacement, /legal services|application-layer replacement|research copilots|specialized legal work|attorney-review boundaries/i);
    assert.match(result.serviceReplacementStrategy.multilingualSupportReplacementAdvantage, /infinitely patient|hundreds of languages|international contractor|DoorDasher-style|human teams struggle to staff/i);
    assert.match(result.serviceReplacementStrategy.outsourcedServiceReadiness, /outsourced|human service|budget.*outside software/i);
    assert.match(result.serviceReplacementStrategy.fragmentedNonTechBudgetOpportunity, /fragmented, non-tech|1%|4% to 10%|doing the work/i);
    assert.match(result.serviceReplacementStrategy.highAttritionLaborWedge, /50% to 80%|support attrition|torturous|multilingual support|staff reliably/i);
    assert.match(result.serviceReplacementStrategy.pricingTradeoffSummary, /per-seat SaaS|headcount|work-based pricing|completed service outcomes|automation works/i);
    assert.match(result.serviceReplacementStrategy.perSeatCannibalizationTrap, /Achilles heel|employee count|loses seats|more efficient/i);
    assert.match(result.serviceReplacementStrategy.perSeatLimitedWalletShare, /software budget|1%|completed service/i);
    assert.match(result.serviceReplacementStrategy.incumbentPricingCultureResistance, /product, sales, and engineering culture|features for human users|reduce seat demand/i);
    assert.match(result.serviceReplacementStrategy.workBasedPricingOpportunity, /work delivered|tasks completed|accepted outputs|qualified outcomes|recovered revenue|hours saved/i);
    assert.match(result.serviceReplacementStrategy.servicesBudgetPricingUpside, /services budget|4% to 10%|performs the service/i);
    assert.match(result.serviceReplacementStrategy.outcomeDrivenLaborAttritionValue, /50% to 80%|reliable outcome|human team/i);
    assert.match(result.serviceReplacementStrategy.superhumanCapabilityPricing, /human seat|200-language fluency|outcomes and volume/i);
    assert.match(result.serviceReplacementStrategy.workBasedPricingPilotRisk, /reliability proof|longer pilots|acceptance evidence|last-10-percent/i);
    assert.match(result.serviceReplacementStrategy.pricingTradeoffMatrix.join(" "), /Primary goal|Revenue driver|Budget source|Core risk|Moat/i);
    assert.match(result.serviceReplacementStrategy.pricingSurvivalRule, /benefits when the AI gets better|SaaS|AI-native service/i);
    assert.match(result.serviceReplacementStrategy.businessProcessAutomationShift, /business process automation|performs the service itself|co-pilot|productivity layer/i);
    assert.match(result.serviceReplacementStrategy.servicePerformingAutomation, /own the full service path|monitor the work|take the next action|escalate/i);
    assert.match(result.serviceReplacementStrategy.selfRegulatingAutomationLoop, /self-regulating|continuously monitor outputs|stated goals|performance drifts/i);
    assert.match(result.serviceReplacementStrategy.taskPricedAutomation, /tasks completed|work delivered|accepted outputs|service capacity|seats/i);
    assert.match(result.serviceReplacementStrategy.intelligenceOperatingSystem, /intelligence operating system|agent layer|legible/i);
    assert.match(result.serviceReplacementStrategy.queryableOrganizationModel, /queryable organization|process.*decision.*workflow|stability|correctness/i);
    assert.match(result.serviceReplacementStrategy.queryableOperatingSystemView, /continuous, up-to-date view|operations|tool snapshot/i);
    assert.match(result.serviceReplacementStrategy.artifactRichLegibilitySources.join(" "), /email|Pylon-style|GitHub commits|issues|Notion|Google Docs|sales calls|daily standups|acceptance receipts/i);
    assert.match(result.serviceReplacementStrategy.legibleByDefaultPolicy, /legible by default|communication logs|GitHub activity|what actually shipped|customer needs/i);
    assert.match(result.serviceReplacementStrategy.queryableHumanMiddlewareReplacement, /coordinator-style human middleware|intelligence layer|artifacts|lossy manager rollups/i);
    assert.match(result.serviceReplacementStrategy.queryableAutonomousCoordination, /tickets|Pylon\/email feedback|Notion or Google Docs|GitHub commits and issues|sales calls|standup recordings/i);
    assert.match(result.serviceReplacementStrategy.queryableHumansAtEdgeRole, /humans at the edge|IC builder operators|DRI strategists|status updates/i);
    assert.match(result.serviceReplacementStrategy.queryableTokenMaxingRule, /Max tokens before headcount|high API spend|HR|admin|engineering|support coordination|management routing/i);
    assert.match(result.serviceReplacementStrategy.artifactRichEnvironment, /AI meeting notes|Slack transcripts|GitHub events|departmental dashboards/i);
    assert.match(result.serviceReplacementStrategy.transparentCommunicationPolicy, /private DMs|inbox-only|transparent channels|embedded agents/i);
    assert.match(result.serviceReplacementStrategy.contextualParityRule, /contextual parity|human employee|revenue|sales|engineering|hiring|operations|recordings/i);
    assert.match(result.serviceReplacementStrategy.contextualParityRule, /Pylon-style support logs|Notion or Google Docs|sales calls|standup recordings/i);
    assert.match(result.serviceReplacementStrategy.intelligenceLayerCoordination, /intelligence layer|middle-management|status translation|decision surfaces/i);
    assert.match(result.serviceReplacementStrategy.humansAtTheEdgeModel, /humans to the edge|builders|operators|QA owners|agent wranglers/i);
    assert.match(result.serviceReplacementStrategy.sprintPlanningIntelligenceLoop, /Linear-style tickets|Slack|GitHub|standup recordings|10x/i);
    assert.match(result.serviceReplacementStrategy.sprintPlanningIntelligenceLoop, /Pylon\/email feedback|GitHub commits and issues|Notion or Google Docs|sales-call notes/i);
    assert.match(result.serviceReplacementStrategy.tokenMaxingCostShift, /uncomfortably high API bills|token spend|HR|admin|engineering|headcount/i);
    assert.match(result.serviceReplacementStrategy.managementHierarchyReplacement, /management stack|intelligence layer|manually interpreting|relaying status/i);
    assert.match(result.serviceReplacementStrategy.icBuilderOperatorModel, /Individual Contributor|builder operator|support|sales|operations|agents/i);
    assert.match(result.serviceReplacementStrategy.prototypeFirstMeetingCulture, /working prototypes|meeting artifact|live workflows|static pitch decks/i);
    assert.match(result.serviceReplacementStrategy.driOutcomeOwnershipModel, /Directly Responsible Individual|strategy-and-customer-outcome|middle manager|measurable result/i);
    assert.match(result.serviceReplacementStrategy.onePersonOneOutcomeRule, /one person, one outcome|named DRI|singular accountability|nowhere to hide/i);
    assert.match(result.serviceReplacementStrategy.driStrategyOutcomeFocus, /strategy|customer outcomes|status routing|headcount|middleware/i);
    assert.match(result.serviceReplacementStrategy.driSpecificResultContract, /one named DRI|specific.*result|success evidence|decision rights/i);
    assert.match(result.serviceReplacementStrategy.driNoHierarchyHidingRule, /hide behind a hierarchy|outcome misses|DRI owns|committees|manager layers/i);
    assert.match(result.serviceReplacementStrategy.driMiddleManagementReplacement, /middle-management coordination|intelligence layer|artifacts|exceptions|DRI/i);
    assert.match(result.serviceReplacementStrategy.driIntelligenceLayerGuidance, /guides.*intelligence layer|business objectives|goals|constraints|evals|escalation rules/i);
    assert.match(result.serviceReplacementStrategy.driEdgeGuidanceRole, /edge|customers|operators|exceptions|AI systems|repeatable work/i);
    assert.match(result.serviceReplacementStrategy.driTokenMaxingLeverage, /token-maxing|one accountable operator|agents|large engineering|admin|coordination teams/i);
    assert.match(result.serviceReplacementStrategy.driInformationVelocityGuardrail, /information velocity|artifacts to agents|decisions|customer-visible changes|manual interpretation chains/i);
    assert.match(result.serviceReplacementStrategy.aiFounderLeadershipModel, /AI Founder|personally builds|coaches|massive capability gains/i);
    assert.match(result.serviceReplacementStrategy.aiStrategyOwnershipRule, /Do not delegate AI strategy|frontier of the tools|operating behavior/i);
    assert.match(result.serviceReplacementStrategy.tokenUsageArchetypeOperatingModel, /IC, DRI, and AI Founder|token usage|headcount|humans own building/i);
    assert.match(result.serviceReplacementStrategy.humanMiddlewareVelocityGain, /human middleware|middle-manager status relays|direct velocity gains|artifacts to agents/i);
    assert.match(result.serviceReplacementStrategy.singlePersonAgentLeverage, /one capable operator|AI agents|larger cross-functional team|humans at the edge/i);
    assert.match(result.serviceReplacementStrategy.leanDepartmentOperatingModel, /lean engineering, HR, admin, support, and operations|agent throughput|token spend|coordination headcount/i);
    assert.match(result.serviceReplacementStrategy.openLoopReplacement, /open-loop|measure.*stated goal|self-corrects/i);
    assert.match(result.serviceReplacementStrategy.legibleOrganization, /legible to AI|transparent channels|private DMs|inbox fragments/i);
    assert.match(result.serviceReplacementStrategy.artifactGenerationPolicy, /digital artifact|meeting notes|decision logs|approval receipts|QA traces/i);
    assert.match(result.serviceReplacementStrategy.comprehensiveContextLayer, /as much context as an employee|revenue|sales|GitHub|dashboards/i);
    assert.match(result.serviceReplacementStrategy.comprehensiveContextLayer, /Pylon-style support|Notion or Google Docs|call recording|standup recording/i);
    assert.match(result.serviceReplacementStrategy.autonomousSprintPlanning, /autonomous sprint planning|tickets|Slack|GitHub|predictable next-cycle plans|manual status rollups/i);
    assert.match(result.serviceReplacementStrategy.autonomousSprintPlanning, /Pylon\/email feedback|Notion or Google Docs|GitHub commits and issues|sales calls|standup recordings/i);
    assert.match(result.serviceReplacementStrategy.humanMiddlewareRemoval, /human middleware|status meetings|middle-management|signal to decision/i);
    assert.match(result.serviceReplacementStrategy.closedLoopVelocityGain, /cutting sprint time in half|10x more useful work|goals|feedback/i);
    assert.match(result.serviceReplacementStrategy.aiSoftwareFactory, /AI software factory|specs|tests|agents/i);
    assert.match(result.serviceReplacementStrategy.softwareFactorySpecContract, /spec and test harness|what to build|judge criteria|implementation syntax/i);
    assert.match(result.serviceReplacementStrategy.agentIterationLoop, /generate.*test.*iterate|human-defined harness passes/i);
    assert.match(result.serviceReplacementStrategy.lastTenPercentReliability, /last 10%|99%|10x to 100x|demo/i);
    assert.match(result.serviceReplacementStrategy.tddSoftwareFactoryLoop, /test-driven development|spec|edge-case tests|agents iterate|tests pass/i);
    assert.match(result.serviceReplacementStrategy.scenarioValidationThreshold, /scenario-based validations|probabilistic satisfaction threshold|reliability bar/i);
    assert.match(result.serviceReplacementStrategy.probabilisticReviewGate, /line-by-line code review|probabilistic review gate|statistically likely to be correct/i);
    assert.match(result.serviceReplacementStrategy.validationDrivenReviewReplacement, /Eliminate human middleware|validations the reviewer|autonomously refine|manual syntax check/i);
    assert.match(result.serviceReplacementStrategy.thresholdEvidencePolicy, /threshold evidence|scenario coverage|failing cases|confidence signals|acceptance receipts/i);
    assert.match(result.serviceReplacementStrategy.zeroHandwrittenCodePosture, /spec-first|handwritten implementation|outcomes rather than syntax/i);
    assert.match(result.serviceReplacementStrategy.specsOnlyRepositoryGoal, /StrongDM-style|specs|scenario validations|test harnesses|handwritten production code/i);
    assert.match(result.serviceReplacementStrategy.thousandXEngineerModel, /thousandx engineer|one expert surrounded by agents|engineering team|speed/i);
    assert.match(result.serviceReplacementStrategy.incumbentCultureReset, /incumbents|reset engineering culture|context engineering|prompt engineering|intelligence loops/i);
    assert.match(result.serviceReplacementStrategy.contextEngineeringShift, /context engineering|test harnesses|failure traces|acceptance evidence|hand-written syntax/i);
    assert.match(result.serviceReplacementStrategy.evalFlywheel, /evals|pass\/fail|human overrides|context engineering|prompt/i);
    assert.match(result.serviceReplacementStrategy.wrapperCloneMisconception, /easily cloned model wrapper|demo surface|workflow logic|operating evidence/i);
    assert.match(result.serviceReplacementStrategy.accuracyHurdleMoat, /99% accuracy|weekend hackathon|80%|loan origination|KYC|10x to 100x/i);
    assert.match(result.serviceReplacementStrategy.bigLabDrudgeryDefense, /big-lab defense|AGI labs|final 5%|unglamorous vertical details/i);
    assert.match(result.serviceReplacementStrategy.deepBackendLogicMoat, /Stripe|Gusto|policy rules|state transitions|audit trails|reconciliations/i);
    assert.match(result.serviceReplacementStrategy.integrationSurfaceAreaMoat, /surface area|financial-institution-style|crawlers|imports|exports|reporting contracts/i);
    assert.match(result.serviceReplacementStrategy.customerMintedWorkflow, /Mint the agent|custom logic|evals|thresholds|switching/i);
    assert.match(result.serviceReplacementStrategy.processAutomationMoat, /process-automation moat|last-10%|99% accuracy|banking|legal/i);
    assert.match(result.serviceReplacementStrategy.pilotToCoreInfrastructure, /pilots|internal operations|custom rules|core infrastructure/i);
    assert.match(result.serviceReplacementStrategy.domainEdgeCaseDrudgery, /drudgery|domain knowledge|KYC|loan-processing|edge cases/i);
    assert.match(result.serviceReplacementStrategy.missionCriticalProcessPower, /mission-critical process power|vertical evals|QA gates|moat/i);
    assert.match(result.serviceReplacementStrategy.softwareFactorySpeedMoat, /AI software factory|process-power acceleration|complex infrastructure|incumbents/i);
    assert.match(result.serviceReplacementStrategy.speedMoatThesis, /speed.*first moat|outlearn labs|incumbents|AI-native service improvements/i);
    assert.match(result.serviceReplacementStrategy.speedMoatAgainstLabs, /OpenAI|Google|capital and compute|narrow vertical|treasure/i);
    assert.match(result.serviceReplacementStrategy.humanMiddlewareSpeedGain, /removed human routing layer|speed gain|meetings|tickets|Slack|GitHub|DRIs/i);
    assert.match(result.serviceReplacementStrategy.queryableSprintCompression, /queryable organization data|compress.*sprint|cut sprint time in half|10x/i);
    assert.match(result.serviceReplacementStrategy.oneDaySprintCadence, /one-day sprint cycles|spec.*test.*eval|acceptance evidence|daily release readiness/i);
    assert.match(result.serviceReplacementStrategy.incumbentCraftOverhead, /incumbent craft overhead|PM layers|operations reviews|PRDs|spec docs|launch gates/i);
    assert.match(result.serviceReplacementStrategy.legacyOperatingConstraint, /AI-native from day one|legacy SOPs|live-product assumptions|human-first rituals/i);
    assert.match(result.serviceReplacementStrategy.aiNativeFromDayOneAdvantage, /prototypes over decks|specs and evals|tokens over coordination headcount|agents inside/i);
    assert.match(result.serviceReplacementStrategy.forwardDeployedSpeedLoop, /forward-deployed engineering|sit with customers|boring manual pain|eval data/i);
    assertMoatPowers(result.serviceReplacementStrategy, "standalone package");
    assert.match(result.serviceReplacementStrategy.drudgeryDiscoveryThesis, /painstaking drudgery|last 10%|reliable service delivery|superficially plausible/i);
    assert.match(result.serviceReplacementStrategy.forwardDeployedTimeInMotion, /forward-deployed time-in-motion|sit with the customer|tailored workflow|minute by minute/i);
    assert.match(result.serviceReplacementStrategy.nittyGrittyWorkflowMap, /email|form|call|ticket|spreadsheet|enriched|manual data entry|workflow stalls/i);
    assert.match(result.serviceReplacementStrategy.hiddenLogicDiscovery, /hidden logic|backend rules|reconciliation|informal checks|exception paths|operator know-how/i);
    assert.match(result.serviceReplacementStrategy.attritionDiscoverySignal, /50% to 80%|annual attrition|torturous support|admin roles|service replacement/i);
    assert.match(result.serviceReplacementStrategy.boringWorkflowSchlepMap, /payroll|tax accounting|trucking compliance|insurance operations|regulated admin|grinding execution/i);
    assert.match(result.serviceReplacementStrategy.lossyMiddlewareDiscovery, /lossy information middleware|status rollups|fragmented handoffs|manager interpretation|manual coordination/i);
    assert.match(result.serviceReplacementStrategy.fieldResearchTruckStopMethod, /truck-stop method|where the work.*happens|frontline operators|fuel-card-style wedges|field research/i);
    assert.match(result.serviceReplacementStrategy.missionCriticalWorkflowFilter, /mission-critical infrastructure|KYC|loan origination|legal review|compliance checks|cost millions/i);
    assert.match(result.serviceReplacementStrategy.hackathonReliabilityGap, /hackathon demo|80% prototype|final 5% to 20%|99% reliability/i);
    assert.match(result.serviceReplacementStrategy.existentialPainWorkflowFilter, /existential pain|lost revenue|being fired|compliance exposure|business failure/i);
    assert.match(result.serviceReplacementStrategy.specializedEvalMinting, /custom evals|datasets|customer workflow|process power|feature churn/i);
    assert.match(result.serviceReplacementStrategy.treasureBeforeLabs, /treasure|labs care|narrow vertical|edge cases|platform goals/i);
    assert.match(result.serviceReplacementStrategy.tokenUsageOrgDesign, /token usage|headcount|agents|builders|agent wranglers/i);
    assert.match(result.serviceReplacementStrategy.humanWranglingModel, /agent wrangling|repetitive|complex exceptions/i);
    assert.match(result.serviceReplacementStrategy.organizationalArchetypes.join(" "), /Individual Contributor|Directly Responsible Individual|AI Founder/i);
    assert.match(result.serviceReplacementStrategy.organizationalArchetypes.join(" "), /builder operator|working prototypes|one-person-one-outcome|builds and coaches/i);
    assert.match(result.ideaEvaluationGuardrails.problemRealityCheck, /solution in search of a problem|painful workflow/i);
    assert.match(result.ideaEvaluationGuardrails.superficialPlausibilityCheck, /sounds logical|genuinely bothered|daily operations|pay or change behavior/i);
    assert.match(result.ideaEvaluationGuardrails.technologyFirstTrapWarning, /AI can do this|hunt for an application|user's painful service workflow/i);
    assert.match(result.ideaEvaluationGuardrails.acutePainCheck, /acute pain|lost revenue|wasted labor|urgent business consequence/i);
    assert.match(result.ideaEvaluationGuardrails.topThreePriorityTest, /top three priority|nice-to-have/i);
    assert.match(result.ideaEvaluationGuardrails.existentialPainTest, /fire-or-promotion|promotion|fired|business at risk|growth/i);
    assert.match(result.ideaEvaluationGuardrails.fireOrPromotionAcutenessTest, /Fire or Promotion|being fired|missing a promotion|not wanting to face the work|business momentum/i);
    assert.match(result.ideaEvaluationGuardrails.fireRiskSignal, /fire-side signal|professional risk|miss.*number|lose credibility|business suffer/i);
    assert.match(result.ideaEvaluationGuardrails.promotionUpsideSignal, /promotion-side signal|advance|next-year growth|take over more of the business|top-priority problem/i);
    assert.match(result.ideaEvaluationGuardrails.topThreeProblemRequirement, /top three customer problem|right now|useful|nice-to-have/i);
    assert.match(result.ideaEvaluationGuardrails.willingnessToPayAcutenessSignal, /willingness to pay|budget|complain about price|still pay|unsolved problem/i);
    assert.match(result.ideaEvaluationGuardrails.plainSightOpportunitySignal, /lying in plain sight|high-stakes|operators endure every day|large company/i);
    assert.match(result.ideaEvaluationGuardrails.boringSpaceValidationThesis, /boring spaces|tax|payroll|trucking compliance|higher hit rates|fun markets/i);
    assert.match(result.ideaEvaluationGuardrails.physicalObservationSchlepProtocol, /schlep|physically|frontline operators|truck-stop|desk research/i);
    assert.match(result.ideaEvaluationGuardrails.invisiblePainDiscoverySignal, /phone-order|1-800|spreadsheet|fax|tribal-knowledge|programmers/i);
    assert.match(result.ideaEvaluationGuardrails.forwardDeployedWorkflowValidation, /forward-deployed|tailored time-in-motion|requests.*enriched|call centers|manual entry|judgment/i);
    assert.match(result.ideaEvaluationGuardrails.lastTenPercentEdgeCaseValidation, /last 10%|edge cases|specialized knowledge|99% reliability|trusted service/i);
    assert.match(result.ideaEvaluationGuardrails.pricingBinaryValidationSignal, /binary validation|refuse|complain.*pay|yes immediately|too low/i);
    assertBinaryTestGuardrails(result.ideaEvaluationGuardrails, "standalone package");
    assert.match(result.ideaEvaluationGuardrails.highAttritionValidationSignal, /50% to 80%|annual churn|support|admin|service replacement/i);
    assert.match(result.ideaEvaluationGuardrails.alternativeIsNothingTest, /current alternative is nothing|banks|agencies|software|internal process/i);
    assert.match(result.ideaEvaluationGuardrails.chargeValidationTest, /Charge money|binary test|complain|still pay/i);
    assert.match(result.ideaEvaluationGuardrails.tarPitCategoryWarnings.join(" "), /Social coordination|weekend-plans|Fun discovery|restaurant discovery|music discovery|consumer hardware|social networks|ad tech/i);
    assert.match(result.ideaEvaluationGuardrails.funDiscoveryTarPitWarning, /restaurant discovery|music discovery|picked over|willingness to pay/i);
    assert.match(result.ideaEvaluationGuardrails.abstractSocietalProblemWarning, /abstract societal problem|poverty|climate|tractable workflow|specific pain/i);
    assert.match(result.ideaEvaluationGuardrails.lowHitRateIdeaSpaceWarning, /consumer hardware|social networks|ad tech|low-hit-rate|distribution insight/i);
    assert.match(result.ideaEvaluationGuardrails.tarPitAvoidanceChecklist.join(" "), /Google|graveyard of prior attempts|Talk to founders|Fire or Promotion|boring service workflows/i);
    assert.equal(result.ideaEvaluationGuardrails.highValueNeedCategories.length, 4);
    assert.match(result.ideaEvaluationGuardrails.highValueNeedCategories.join(" "), /Make more money|Reduce costs|Move faster|Avoid risk/i);
    assert.match(result.ideaEvaluationGuardrails.pricingDiscipline, /Charge early|under-charging|completed service/i);
    assert.ok(result.ideaEvaluationGuardrails.tarPitResearchProtocol.length >= 3);
    assert.match(result.ideaEvaluationGuardrails.tarPitResearchProtocol.join(" "), /Google prior|failed attempts|hard-part hypothesis/i);
    assert.match(result.ideaEvaluationGuardrails.socialCoordinationTarPitWarning, /social coordination|weekend-plan|event lists|friend invites/i);
    assert.match(result.ideaEvaluationGuardrails.hardPartHypothesis, /structural barrier|adoption|workflow-change|distribution/i);
    assert.match(result.urls.workspace, /success=/);
    assert.match(result.valueCase.executiveSummary, /complete business outcome/);
    assert.ok(result.valueCase.sixFigureValueDrivers.some((driver) => /Services budget capture/i.test(driver)));
    assert.ok(result.valueCase.sixFigureValueDrivers.some((driver) => /Service-heavy markets/i.test(driver)));
    assert.ok(result.valueCase.sixFigureValueDrivers.some((driver) => /Industry replacement thesis/i.test(driver)));
    assert.ok(result.valueCase.sixFigureValueDrivers.some((driver) => /Banking operations use cases/i.test(driver)));
    assert.ok(result.valueCase.sixFigureValueDrivers.some((driver) => /Support and language markets/i.test(driver)));
    assert.ok(result.valueCase.sixFigureValueDrivers.some((driver) => /Per-seat risk avoided/i.test(driver)));
    assert.ok(result.valueCase.sixFigureValueDrivers.some((driver) => /Pricing trade-off summary/i.test(driver)));
    assert.ok(result.valueCase.sixFigureValueDrivers.some((driver) => /Work-based pricing opportunity/i.test(driver)));
    assert.ok(result.valueCase.sixFigureValueDrivers.some((driver) => /Wallet-share expansion/i.test(driver)));
    assert.ok(result.valueCase.sixFigureValueDrivers.some((driver) => /Moat powers framework/i.test(driver)));
    assert.ok(result.valueCase.sixFigureValueDrivers.some((driver) => /AI Seven Powers framework/i.test(driver)));
    assert.ok(result.valueCase.sixFigureValueDrivers.some((driver) => /Binary Test definition/i.test(driver)));
    assert.ok(result.valueCase.sixFigureValueDrivers.some((driver) => /Premium-price learning signal/i.test(driver)));
    assert.ok(result.valueCase.sixFigureValueDrivers.some((driver) => /Acute-pain filter/i.test(driver)));
    assert.ok(result.valueCase.renewalReasons.some((reason) => /queryable/i.test(reason)));
    assert.ok(result.valueCase.sixFigureValueDrivers.length >= 4);
    assert.ok(result.valueCase.renewalReasons.length >= 3);
    assert.ok(result.customerGuide.startHere.length >= 5);
    assert.ok(result.customerGuide.implementationRoadmap.length >= 3);
    assert.ok(result.customerGuide.ambiguityKillers.some((item) => /outcome/i.test(item)));
    assert.equal(result.artifacts.length, 9);
    assert.equal(result.artifacts.every((artifact) => artifact.guide.implementationSteps.length >= 5), true);
    assert.equal(result.artifacts.every((artifact) => artifact.guide.operatingWorkflow.length >= 4), true);
    assert.equal(result.artifacts.every((artifact) => artifact.guide.acceptanceChecklist.length >= 5), true);
    assert.equal(result.artifacts.every((artifact) => artifact.guide.failureStates.length >= 4), true);
    assert.equal(result.artifacts.every((artifact) => artifact.guide.nextMilestones.length >= 3), true);
    assert.ok(result.automationRuns.length >= 5);
    assert.ok(result.acceptanceTests.every((test) => test.status === "passed"));
    assert.equal(
      result.acceptanceTests.some((test) => test.test === "Six-figure value case documented"),
      true,
    );
    assert.equal(
      result.acceptanceTests.some((test) => test.test === "Every deliverable has usage guidance"),
      true,
    );
    assert.equal(
      result.acceptanceTests.some((test) => test.test === "Tar-pit research protocol documented"),
      true,
    );
    assert.equal(
      result.acceptanceTests.some((test) => test.test === "Pricing trade-off summary documented"),
      true,
    );
    assert.equal(
      result.acceptanceTests.some((test) => test.test === "Work-based pricing opportunity documented"),
      true,
    );
    assert.equal(
      result.acceptanceTests.some((test) => test.test === "Pricing trade-off matrix documented"),
      true,
    );
    assert.equal(
      result.acceptanceTests.some((test) => test.test === "Pricing survival rule documented"),
      true,
    );
    assert.equal(
      result.acceptanceTests.some((test) => test.test === "Tar-pit category warnings documented"),
      true,
    );
    assert.equal(
      result.acceptanceTests.some((test) => test.test === "Fun discovery tar-pit warning documented"),
      true,
    );
    assert.equal(
      result.acceptanceTests.some((test) => test.test === "Abstract societal problem warning documented"),
      true,
    );
    assert.equal(
      result.acceptanceTests.some((test) => test.test === "Low-hit-rate idea-space warning documented"),
      true,
    );
    assert.equal(
      result.acceptanceTests.some((test) => test.test === "Tar-pit avoidance checklist documented"),
      true,
    );
    assert.equal(
      result.acceptanceTests.some((test) => test.test === "Superficial plausibility guardrail documented"),
      true,
    );
    assert.equal(
      result.acceptanceTests.some((test) => test.test === "Acute pain validation documented"),
      true,
    );
    assert.equal(
      result.acceptanceTests.some((test) => test.test === "Fire-or-promotion acuteness gate documented"),
      true,
    );
    assert.equal(
      result.acceptanceTests.some((test) => test.test === "Fire risk signal documented"),
      true,
    );
    assert.equal(
      result.acceptanceTests.some((test) => test.test === "Promotion upside signal documented"),
      true,
    );
    assert.equal(
      result.acceptanceTests.some((test) => test.test === "Top-three problem requirement documented"),
      true,
    );
    assert.equal(
      result.acceptanceTests.some((test) => test.test === "Willingness-to-pay acuteness signal documented"),
      true,
    );
    assert.equal(
      result.acceptanceTests.some((test) => test.test === "Plain-sight opportunity signal documented"),
      true,
    );
    assert.equal(
      result.acceptanceTests.some((test) => test.test === "Boring-space validation thesis documented"),
      true,
    );
    assert.equal(
      result.acceptanceTests.some((test) => test.test === "Physical-observation schlep documented"),
      true,
    );
    assert.equal(
      result.acceptanceTests.some((test) => test.test === "Invisible pain discovery documented"),
      true,
    );
    assert.equal(
      result.acceptanceTests.some((test) => test.test === "Forward-deployed workflow validation documented"),
      true,
    );
    assert.equal(
      result.acceptanceTests.some((test) => test.test === "Last-10-percent edge-case validation documented"),
      true,
    );
    assert.equal(
      result.acceptanceTests.some((test) => test.test === "Pricing binary validation documented"),
      true,
    );
    assert.equal(
      result.acceptanceTests.some((test) => test.test === "Binary Test definition documented"),
      true,
    );
    assert.equal(
      result.acceptanceTests.some((test) => test.test === "Open-wallet value signal documented"),
      true,
    );
    assert.equal(
      result.acceptanceTests.some((test) => test.test === "Binary Test customer segment signal documented"),
      true,
    );
    assert.equal(
      result.acceptanceTests.some((test) => test.test === "Premium-price learning signal documented"),
      true,
    );
    assert.equal(
      result.acceptanceTests.some((test) => test.test === "Complain-but-pay validation signal documented"),
      true,
    );
    assert.equal(
      result.acceptanceTests.some((test) => test.test === "High-attrition validation documented"),
      true,
    );
    assert.equal(
      result.acceptanceTests.some((test) => test.test === "Charge validation documented"),
      true,
    );
    assert.equal(
      result.acceptanceTests.some((test) => test.test === "Business process automation shift documented"),
      true,
    );
    assert.equal(
      result.acceptanceTests.some((test) => test.test === "Service-performing automation documented"),
      true,
    );
    assert.equal(
      result.acceptanceTests.some((test) => test.test === "Self-regulating automation loop documented"),
      true,
    );
    assert.equal(
      result.acceptanceTests.some((test) => test.test === "Task-priced automation documented"),
      true,
    );
    assert.equal(
      result.acceptanceTests.some((test) => test.test === "AI-native operating model documented"),
      true,
    );
    assert.equal(
      result.acceptanceTests.some((test) => test.test === "Service-replacement industry thesis documented"),
      true,
    );
    assert.equal(
      result.acceptanceTests.some((test) => test.test === "Financial/admin service markets documented"),
      true,
    );
    assert.equal(
      result.acceptanceTests.some((test) => test.test === "Banking operations use cases documented"),
      true,
    );
    assert.equal(
      result.acceptanceTests.some((test) => test.test === "Healthcare/legal service markets documented"),
      true,
    );
    assert.equal(
      result.acceptanceTests.some((test) => test.test === "Specialized vertical markets documented"),
      true,
    );
    assert.equal(
      result.acceptanceTests.some((test) => test.test === "Support/language service markets documented"),
      true,
    );
    assert.equal(
      result.acceptanceTests.some((test) => test.test === "Easiest service-replacement industries documented"),
      true,
    );
    assert.equal(
      result.acceptanceTests.some((test) => test.test === "Easiest replacement rationale documented"),
      true,
    );
    assert.equal(
      result.acceptanceTests.some((test) => test.test === "Outsourced outcome budget signal documented"),
      true,
    );
    assert.equal(
      result.acceptanceTests.some((test) => test.test === "Boring schlep opportunity documented"),
      true,
    );
    assert.equal(
      result.acceptanceTests.some((test) => test.test === "Fragmented non-technical replacement path documented"),
      true,
    );
    assert.equal(
      result.acceptanceTests.some((test) => test.test === "Legal application-layer replacement documented"),
      true,
    );
    assert.equal(
      result.acceptanceTests.some((test) => test.test === "Multilingual support replacement advantage documented"),
      true,
    );
    assert.equal(
      result.acceptanceTests.some((test) => test.test === "Outsourced-service readiness documented"),
      true,
    );
    assert.equal(
      result.acceptanceTests.some((test) => test.test === "Fragmented non-tech budget wedge documented"),
      true,
    );
    assert.equal(
      result.acceptanceTests.some((test) => test.test === "High-attrition labor wedge documented"),
      true,
    );
    assert.equal(
      result.acceptanceTests.some((test) => test.test === "Queryable organization model documented"),
      true,
    );
    assert.equal(
      result.acceptanceTests.some((test) => test.test === "Queryable operating system view documented"),
      true,
    );
    assert.equal(
      result.acceptanceTests.some((test) => test.test === "Artifact-rich legibility sources documented"),
      true,
    );
    assert.equal(
      result.acceptanceTests.some((test) => test.test === "Legible-by-default policy documented"),
      true,
    );
    assert.equal(
      result.acceptanceTests.some((test) => test.test === "Queryable human middleware replacement documented"),
      true,
    );
    assert.equal(
      result.acceptanceTests.some((test) => test.test === "Queryable autonomous coordination documented"),
      true,
    );
    assert.equal(
      result.acceptanceTests.some((test) => test.test === "Queryable humans-at-the-edge role documented"),
      true,
    );
    assert.equal(
      result.acceptanceTests.some((test) => test.test === "Queryable token-maxing rule documented"),
      true,
    );
    assert.equal(
      result.acceptanceTests.some((test) => test.test === "Artifact-rich environment documented"),
      true,
    );
    assert.equal(
      result.acceptanceTests.some((test) => test.test === "Transparent communication policy documented"),
      true,
    );
    assert.equal(
      result.acceptanceTests.some((test) => test.test === "Contextual parity rule documented"),
      true,
    );
    assert.equal(
      result.acceptanceTests.some((test) => test.test === "Intelligence-layer coordination documented"),
      true,
    );
    assert.equal(
      result.acceptanceTests.some((test) => test.test === "Humans-at-the-edge model documented"),
      true,
    );
    assert.equal(
      result.acceptanceTests.some((test) => test.test === "Sprint-planning intelligence loop documented"),
      true,
    );
    assert.equal(
      result.acceptanceTests.some((test) => test.test === "Token-maxing cost shift documented"),
      true,
    );
    assert.equal(
      result.acceptanceTests.some((test) => test.test === "Management hierarchy replacement documented"),
      true,
    );
    assert.equal(
      result.acceptanceTests.some((test) => test.test === "IC builder-operator model documented"),
      true,
    );
    assert.equal(
      result.acceptanceTests.some((test) => test.test === "Prototype-first meeting culture documented"),
      true,
    );
    assert.equal(
      result.acceptanceTests.some((test) => test.test === "DRI outcome ownership model documented"),
      true,
    );
    assert.equal(
      result.acceptanceTests.some((test) => test.test === "One-person-one-outcome rule documented"),
      true,
    );
    assert.equal(
      result.acceptanceTests.some((test) => test.test === "DRI strategy outcome focus documented"),
      true,
    );
    assert.equal(
      result.acceptanceTests.some((test) => test.test === "DRI specific result contract documented"),
      true,
    );
    assert.equal(
      result.acceptanceTests.some((test) => test.test === "DRI no hierarchy hiding rule documented"),
      true,
    );
    assert.equal(
      result.acceptanceTests.some((test) => test.test === "DRI middle management replacement documented"),
      true,
    );
    assert.equal(
      result.acceptanceTests.some((test) => test.test === "DRI intelligence layer guidance documented"),
      true,
    );
    assert.equal(
      result.acceptanceTests.some((test) => test.test === "DRI edge guidance role documented"),
      true,
    );
    assert.equal(
      result.acceptanceTests.some((test) => test.test === "DRI token-maxing leverage documented"),
      true,
    );
    assert.equal(
      result.acceptanceTests.some((test) => test.test === "DRI information velocity guardrail documented"),
      true,
    );
    assert.equal(
      result.acceptanceTests.some((test) => test.test === "AI founder leadership model documented"),
      true,
    );
    assert.equal(
      result.acceptanceTests.some((test) => test.test === "AI strategy ownership rule documented"),
      true,
    );
    assert.equal(
      result.acceptanceTests.some((test) => test.test === "Token-usage archetype operating model documented"),
      true,
    );
    assert.equal(
      result.acceptanceTests.some((test) => test.test === "Human-middleware velocity gain documented"),
      true,
    );
    assert.equal(
      result.acceptanceTests.some((test) => test.test === "Single-person agent leverage documented"),
      true,
    );
    assert.equal(
      result.acceptanceTests.some((test) => test.test === "Lean department operating model documented"),
      true,
    );
    assert.equal(
      result.acceptanceTests.some((test) => test.test === "Software factory spec-and-test workflow documented"),
      true,
    );
    assert.equal(
      result.acceptanceTests.some((test) => test.test === "Autonomous agent iteration loop documented"),
      true,
    );
    assert.equal(
      result.acceptanceTests.some((test) => test.test === "Human agent-wrangling model documented"),
      true,
    );
    assert.equal(
      result.acceptanceTests.some((test) => test.test === "Last-10-percent reliability plan documented"),
      true,
    );
    assert.equal(
      result.acceptanceTests.some((test) => test.test === "Eval flywheel documented"),
      true,
    );
    assert.equal(
      result.acceptanceTests.some((test) => test.test === "Probabilistic review gate documented"),
      true,
    );
    assert.equal(
      result.acceptanceTests.some((test) => test.test === "Validation-driven review replacement documented"),
      true,
    );
    assert.equal(
      result.acceptanceTests.some((test) => test.test === "Threshold evidence policy documented"),
      true,
    );
    assert.equal(
      result.acceptanceTests.some((test) => test.test === "Specs-only repository goal documented"),
      true,
    );
    assert.equal(
      result.acceptanceTests.some((test) => test.test === "Open-loop replacement documented"),
      true,
    );
    assert.equal(
      result.acceptanceTests.some((test) => test.test === "Legible organization policy documented"),
      true,
    );
    assert.equal(
      result.acceptanceTests.some((test) => test.test === "Artifact generation policy documented"),
      true,
    );
    assert.equal(
      result.acceptanceTests.some((test) => test.test === "Comprehensive context layer documented"),
      true,
    );
    assert.equal(
      result.acceptanceTests.some((test) => test.test === "Autonomous sprint planning documented"),
      true,
    );
    assert.equal(
      result.acceptanceTests.some((test) => test.test === "Human middleware removal documented"),
      true,
    );
    assert.equal(
      result.acceptanceTests.some((test) => test.test === "Closed-loop velocity gain documented"),
      true,
    );
    assert.equal(
      result.acceptanceTests.some((test) => test.test === "Wrapper-clone misconception rejected"),
      true,
    );
    assert.equal(
      result.acceptanceTests.some((test) => test.test === "99-percent accuracy moat documented"),
      true,
    );
    assert.equal(
      result.acceptanceTests.some((test) => test.test === "Big-lab drudgery defense documented"),
      true,
    );
    assert.equal(
      result.acceptanceTests.some((test) => test.test === "Deep backend logic moat documented"),
      true,
    );
    assert.equal(
      result.acceptanceTests.some((test) => test.test === "Integration surface-area moat documented"),
      true,
    );
    assert.equal(
      result.acceptanceTests.some((test) => test.test === "Customer-minted workflow switching cost documented"),
      true,
    );
    assert.equal(
      result.acceptanceTests.some((test) => test.test === "Process automation moat documented"),
      true,
    );
    assert.equal(
      result.acceptanceTests.some((test) => test.test === "Pilot-to-core infrastructure documented"),
      true,
    );
    assert.equal(
      result.acceptanceTests.some((test) => test.test === "Token-usage org design documented"),
      true,
    );
    assert.equal(
      result.acceptanceTests.some((test) => test.test === "Speed moat thesis documented"),
      true,
    );
    assert.equal(
      result.acceptanceTests.some((test) => test.test === "Speed moat against labs documented"),
      true,
    );
    assert.equal(
      result.acceptanceTests.some((test) => test.test === "Human-middleware speed gain documented"),
      true,
    );
    assert.equal(
      result.acceptanceTests.some((test) => test.test === "Queryable sprint compression documented"),
      true,
    );
    assert.equal(
      result.acceptanceTests.some((test) => test.test === "One-day sprint cadence documented"),
      true,
    );
    assert.equal(
      result.acceptanceTests.some((test) => test.test === "Incumbent craft overhead documented"),
      true,
    );
    assert.equal(
      result.acceptanceTests.some((test) => test.test === "Legacy operating constraint documented"),
      true,
    );
    assert.equal(
      result.acceptanceTests.some((test) => test.test === "AI-native from day one advantage documented"),
      true,
    );
    assert.equal(
      result.acceptanceTests.some((test) => test.test === "Forward-deployed speed loop documented"),
      true,
    );
    for (const testName of standaloneMoatAcceptanceTests) {
      assert.equal(
        result.acceptanceTests.some((test) => test.test === testName),
        true,
        `${testName} should be present`,
      );
    }
    assert.equal(
      result.acceptanceTests.some((test) => test.test === "Drudgery discovery thesis documented"),
      true,
    );
    assert.equal(
      result.acceptanceTests.some((test) => test.test === "Forward-deployed time-in-motion documented"),
      true,
    );
    assert.equal(
      result.acceptanceTests.some((test) => test.test === "Nitty-gritty workflow map documented"),
      true,
    );
    assert.equal(
      result.acceptanceTests.some((test) => test.test === "Hidden logic discovery documented"),
      true,
    );
    assert.equal(
      result.acceptanceTests.some((test) => test.test === "Attrition discovery signal documented"),
      true,
    );
    assert.equal(
      result.acceptanceTests.some((test) => test.test === "Boring workflow schlep map documented"),
      true,
    );
    assert.equal(
      result.acceptanceTests.some((test) => test.test === "Lossy middleware discovery documented"),
      true,
    );
    assert.equal(
      result.acceptanceTests.some((test) => test.test === "Field research truck-stop method documented"),
      true,
    );
    assert.equal(
      result.acceptanceTests.some((test) => test.test === "Mission-critical workflow filter documented"),
      true,
    );
    assert.equal(
      result.acceptanceTests.some((test) => test.test === "Hackathon reliability gap documented"),
      true,
    );
    assert.equal(
      result.acceptanceTests.some((test) => test.test === "Existential pain workflow filter documented"),
      true,
    );
    assert.equal(
      result.acceptanceTests.some((test) => test.test === "Specialized eval minting documented"),
      true,
    );
    assert.equal(
      result.acceptanceTests.some((test) => test.test === "Treasure before labs documented"),
      true,
    );
    assert.equal(
      result.acceptanceTests.some((test) => test.test === "Thousandx engineer model documented"),
      true,
    );
    assert.equal(
      result.acceptanceTests.some((test) => test.test === "Incumbent culture reset documented"),
      true,
    );
  });

  it("provisions a new AI agency product with its required consent field", () => {
    const result = provisionPackage({
      packageSlug: "ghost-expert-course-factory",
      brandName: "Brian Expert Course",
      operatorEmail: "ops@example.com",
      primaryDomain: "https://example.com",
      targetMarket: "camera-shy experts with premium knowledge",
      primaryOffer: "Turn your expertise into a finished branded course",
      credentials: {
        ...outcomeContext,
        avatarVoiceConsent: "approved",
        sourceAssetUrl: "https://example.com/source-notes",
        brandAssetsUrl: "https://example.com/brand",
      },
      appUrl: "https://lead-os.example.com",
    });

    assert.equal(result.credentials.missingRequired.length, 0);
    assert.equal(result.artifacts.length, 8);
    assert.match(result.urls.workspace, /ghost-expert-course-factory/);
    assert.ok(result.artifacts.some((artifact) => artifact.title === "Polished lesson scripts"));
  });

  it("keeps every AI agency offer fully automated, modular, and multi-niche", () => {
    for (const slug of aiAgencyPackageSlugs) {
      const pkg = provisionablePackages.find((item) => item.slug === slug);
      assert.ok(pkg, `${slug} should exist`);
      const contract = getPackageAutomationContract(pkg);

      assert.equal(contract.modular, true, `${slug} should be modular`);
      assert.equal(contract.fullyAutomated, true, `${slug} should have a complete autonomous workflow`);
      assert.equal(contract.requiresAdditionalConfiguration, false, `${slug} should not require post-form setup for delivery`);
      assert.equal(contract.deliveryMode, "complete-solution", `${slug} should be sold as a complete solution`);
      assert.ok(contract.nicheExamples.length >= 3, `${slug} should apply to multiple niches`);
      for (const key of ["idealCustomerProfile", "successMetric", "currentProcess", "fulfillmentConstraints", "brandVoice"]) {
        assert.ok(simpleOnboardingFieldKeys.includes(key as never), `${key} should be collected by the simple intake`);
      }
      assert.ok(pkg.deliverables.every((deliverable) => deliverable.launchSurface), `${slug} deliverables should have launch surfaces`);
    }
  });

  it("codifies the AI-native service replacement thesis for every provisionable package", () => {
    for (const pkg of provisionablePackages) {
      const strategy = getPackageServiceReplacementStrategy(pkg);
      const strategyCopy = Object.values(strategy).join(" ");

      assert.match(strategy.servicesBudgetTarget, /service|outsourced|internal labor|agency/i, `${pkg.slug} should target a services budget`);
      assert.match(strategy.perSeatRisk, /per-seat|automation|cannibalize revenue/i, `${pkg.slug} should reject per-seat incentives`);
      assert.match(strategy.outcomePricing, /work delivered|accepted outputs|recovered revenue|qualified outcomes|completed tasks/i, `${pkg.slug} should price against work delivered`);
      assert.match(strategy.walletShareExpansion, /4% to 10%|services wallet/i, `${pkg.slug} should include larger wallet-share logic`);
      assert.match(strategy.alignedIncentives, /more work|more valuable|without needing more human seats/i, `${pkg.slug} should align automation with value capture`);
      assert.ok(strategy.targetServiceIndustries.includes("insurance brokerage"), `${pkg.slug} should name service-heavy target markets`);
      assert.ok(strategy.targetServiceIndustries.includes("accounting"), `${pkg.slug} should include accounting as a service-heavy market`);
      assert.match(strategy.serviceReplacementIndustryThesis, /human labor spend|software spend|outsourced function|manual operating team/i, `${pkg.slug} should name the service-heavy industry thesis`);
      assert.match(strategy.financialAdminServiceMarkets.join(" "), /accounting|tax audit|payroll|insurance brokerage|compliance|banking operations/i, `${pkg.slug} should include financial/admin service markets`);
      assert.match(strategy.bankingOperationsUseCases.join(" "), /KYC|loan origination|debt recovery|fraud monitoring/i, `${pkg.slug} should include banking operations use cases`);
      assert.match(strategy.healthcareLegalServiceMarkets.join(" "), /healthcare administration|legal services|junior associate|outsourced legal/i, `${pkg.slug} should include healthcare/legal service markets`);
      assert.match(strategy.specializedVerticalMarkets.join(" "), /logistics|trucking|fuel cards|HVAC|home services|construction|real estate|debt financing/i, `${pkg.slug} should include specialized vertical markets`);
      assert.match(strategy.customerSupportLanguageMarkets.join(" "), /customer support|multilingual support|international contractor|DoorDasher-style|language-learning conversation/i, `${pkg.slug} should include support and language markets`);
      assert.match(strategy.easiestServiceReplacementIndustries.join(" "), /financial and administrative services|banking infrastructure|healthcare administration|legal application-layer services|HVAC and fragmented home services|construction and fragmented field services|trucking and logistics|multilingual customer and contractor support/i, `${pkg.slug} should include easiest service-replacement industries`);
      assert.match(strategy.easiestServiceReplacementRationale, /services spend.*dwarfs software spend|already outsourced|completed outcome|managing headcount/i, `${pkg.slug} should explain why these are easiest to replace`);
      assert.match(strategy.outsourcedOutcomeBudgetSignal, /agency|BPO|broker|admin team|specialist|replace the vendor path/i, `${pkg.slug} should treat outsourced outcome spend as a buying signal`);
      assert.match(strategy.boringSchlepServiceOpportunity, /payroll|tax|trucking compliance|insurance|regulated admin|painstaking drudgery|process power/i, `${pkg.slug} should turn boring schlep into process power`);
      assert.match(strategy.fragmentedNonTechnicalReplacementPath, /HVAC|construction|home services|trucking|local field operations|minted into.*core workflow/i, `${pkg.slug} should include fragmented non-technical replacement paths`);
      assert.match(strategy.legalApplicationLayerReplacement, /legal services|application-layer replacement|research copilots|specialized legal work|attorney-review boundaries/i, `${pkg.slug} should include legal application-layer replacement`);
      assert.match(strategy.multilingualSupportReplacementAdvantage, /infinitely patient|hundreds of languages|international contractor|DoorDasher-style|human teams struggle to staff/i, `${pkg.slug} should include multilingual support replacement advantage`);
      assert.match(strategy.outsourcedServiceReadiness, /outsourced|human service|budget.*outside software/i, `${pkg.slug} should prefer already-outsourced work`);
      assert.match(strategy.fragmentedNonTechBudgetOpportunity, /fragmented, non-tech|1%|4% to 10%|doing the work/i, `${pkg.slug} should name fragmented non-tech budget expansion`);
      assert.match(strategy.highAttritionLaborWedge, /50% to 80%|support attrition|torturous|multilingual support|staff reliably/i, `${pkg.slug} should use high-attrition labor as a wedge`);
      assert.match(strategy.pricingTradeoffSummary, /per-seat SaaS|headcount|work-based pricing|completed service outcomes|automation works/i, `${pkg.slug} should explain the per-seat versus work-based pricing trade-off`);
      assert.match(strategy.perSeatCannibalizationTrap, /Achilles heel|employee count|loses seats|more efficient/i, `${pkg.slug} should name the per-seat cannibalization trap`);
      assert.match(strategy.perSeatLimitedWalletShare, /software budget|1%|completed service/i, `${pkg.slug} should name the limited software wallet share`);
      assert.match(strategy.incumbentPricingCultureResistance, /product, sales, and engineering culture|features for human users|reduce seat demand/i, `${pkg.slug} should name incumbent culture resistance`);
      assert.match(strategy.workBasedPricingOpportunity, /work delivered|tasks completed|accepted outputs|qualified outcomes|recovered revenue|hours saved/i, `${pkg.slug} should define work-based pricing`);
      assert.match(strategy.servicesBudgetPricingUpside, /services budget|4% to 10%|performs the service/i, `${pkg.slug} should connect work-based pricing to services-budget upside`);
      assert.match(strategy.outcomeDrivenLaborAttritionValue, /50% to 80%|reliable outcome|human team/i, `${pkg.slug} should connect outcome pricing to high-attrition labor`);
      assert.match(strategy.superhumanCapabilityPricing, /human seat|200-language fluency|outcomes and volume/i, `${pkg.slug} should price superhuman capability by outcomes`);
      assert.match(strategy.workBasedPricingPilotRisk, /reliability proof|longer pilots|acceptance evidence|last-10-percent/i, `${pkg.slug} should name the work-based pricing pilot risk`);
      assert.match(strategy.pricingTradeoffMatrix.join(" "), /Primary goal|Revenue driver|Budget source|Core risk|Moat/i, `${pkg.slug} should include a pricing trade-off matrix`);
      assert.match(strategy.pricingSurvivalRule, /benefits when the AI gets better|SaaS|AI-native service/i, `${pkg.slug} should require a pricing model that benefits when AI improves`);
      assert.ok(strategy.pricingUnits.includes("tasks completed"), `${pkg.slug} should include task-completed pricing units`);
      assert.match(strategy.businessProcessAutomationShift, /business process automation|performs the service itself|co-pilot|productivity layer/i, `${pkg.slug} should frame automation as service performance`);
      assert.match(strategy.servicePerformingAutomation, /own the full service path|monitor the work|take the next action|escalate/i, `${pkg.slug} should perform the service path`);
      assert.match(strategy.selfRegulatingAutomationLoop, /self-regulating|continuously monitor outputs|stated goals|performance drifts/i, `${pkg.slug} should self-regulate against goals`);
      assert.match(strategy.taskPricedAutomation, /tasks completed|work delivered|accepted outputs|service capacity|seats/i, `${pkg.slug} should price automation by completed work`);
      assert.match(strategy.intelligenceOperatingSystem, /intelligence operating system|agent layer|legible/i, `${pkg.slug} should be framed as an intelligence OS`);
      assert.match(strategy.queryableOrganizationModel, /queryable organization|process.*decision.*workflow|stability|correctness/i, `${pkg.slug} should make the organization queryable`);
      assert.match(strategy.queryableOperatingSystemView, /continuous, up-to-date view|operations|tool snapshot/i, `${pkg.slug} should give AI an operating-system view`);
      assert.match(strategy.artifactRichLegibilitySources.join(" "), /email|Pylon-style|GitHub commits|issues|Notion|Google Docs|sales calls|daily standups|acceptance receipts/i, `${pkg.slug} should name queryable artifact sources`);
      assert.match(strategy.legibleByDefaultPolicy, /legible by default|communication logs|GitHub activity|what actually shipped|customer needs/i, `${pkg.slug} should make the org legible by default`);
      assert.match(strategy.queryableHumanMiddlewareReplacement, /coordinator-style human middleware|intelligence layer|artifacts|lossy manager rollups/i, `${pkg.slug} should replace coordinator middleware`);
      assert.match(strategy.queryableAutonomousCoordination, /tickets|Pylon\/email feedback|Notion or Google Docs|GitHub commits and issues|sales calls|standup recordings/i, `${pkg.slug} should coordinate from queryable evidence`);
      assert.match(strategy.queryableHumansAtEdgeRole, /humans at the edge|IC builder operators|DRI strategists|status updates/i, `${pkg.slug} should put humans at the edge of the queryable org`);
      assert.match(strategy.queryableTokenMaxingRule, /Max tokens before headcount|high API spend|HR|admin|engineering|support coordination|management routing/i, `${pkg.slug} should connect token maxing to queryable org scaling`);
      assert.match(strategy.artifactRichEnvironment, /AI meeting notes|Slack transcripts|GitHub events|departmental dashboards/i, `${pkg.slug} should define artifact-rich operation`);
      assert.match(strategy.transparentCommunicationPolicy, /private DMs|inbox-only|transparent channels|embedded agents/i, `${pkg.slug} should move work into transparent channels`);
      assert.match(strategy.contextualParityRule, /contextual parity|human employee|revenue|sales|engineering|hiring|operations|recordings/i, `${pkg.slug} should give agents contextual parity`);
      assert.match(strategy.contextualParityRule, /Pylon-style support logs|Notion or Google Docs|sales calls|standup recordings/i, `${pkg.slug} should include concrete employee-grade context sources`);
      assert.match(strategy.intelligenceLayerCoordination, /intelligence layer|middle-management|status translation|decision surfaces/i, `${pkg.slug} should use the intelligence layer for coordination`);
      assert.match(strategy.humansAtTheEdgeModel, /humans to the edge|builders|operators|QA owners|agent wranglers/i, `${pkg.slug} should move humans to the edge`);
      assert.match(strategy.sprintPlanningIntelligenceLoop, /Linear-style tickets|Slack|GitHub|standup recordings|10x/i, `${pkg.slug} should include the sprint-planning intelligence loop`);
      assert.match(strategy.sprintPlanningIntelligenceLoop, /Pylon\/email feedback|GitHub commits and issues|Notion or Google Docs|sales-call notes/i, `${pkg.slug} should base planning on queryable operating evidence`);
      assert.match(strategy.tokenMaxingCostShift, /uncomfortably high API bills|token spend|HR|admin|engineering|headcount/i, `${pkg.slug} should treat token maxing as a cost shift`);
      assert.match(strategy.managementHierarchyReplacement, /management stack|intelligence layer|manually interpreting|relaying status/i, `${pkg.slug} should replace classic hierarchy with an intelligence layer`);
      assert.match(strategy.icBuilderOperatorModel, /Individual Contributor|builder operator|support|sales|operations|agents/i, `${pkg.slug} should define ICs as builder operators`);
      assert.match(strategy.prototypeFirstMeetingCulture, /working prototypes|meeting artifact|live workflows|static pitch decks/i, `${pkg.slug} should prefer prototype-first meetings`);
      assert.match(strategy.driOutcomeOwnershipModel, /Directly Responsible Individual|strategy-and-customer-outcome|middle manager|measurable result/i, `${pkg.slug} should define DRI outcome ownership`);
      assert.match(strategy.onePersonOneOutcomeRule, /one person, one outcome|named DRI|singular accountability|nowhere to hide/i, `${pkg.slug} should require one person per outcome`);
      assert.match(strategy.driStrategyOutcomeFocus, /strategy|customer outcomes|status routing|headcount|middleware/i, `${pkg.slug} should keep DRI focus on strategy and outcomes`);
      assert.match(strategy.driSpecificResultContract, /one named DRI|specific.*result|success evidence|decision rights/i, `${pkg.slug} should attach one DRI to one result contract`);
      assert.match(strategy.driNoHierarchyHidingRule, /hide behind a hierarchy|outcome misses|DRI owns|committees|manager layers/i, `${pkg.slug} should prevent hierarchy hiding`);
      assert.match(strategy.driMiddleManagementReplacement, /middle-management coordination|intelligence layer|artifacts|exceptions|DRI/i, `${pkg.slug} should replace middle-management coordination`);
      assert.match(strategy.driIntelligenceLayerGuidance, /guides.*intelligence layer|business objectives|goals|constraints|evals|escalation rules/i, `${pkg.slug} should make the DRI guide the intelligence layer`);
      assert.match(strategy.driEdgeGuidanceRole, /edge|customers|operators|exceptions|AI systems|repeatable work/i, `${pkg.slug} should place the DRI at the edge`);
      assert.match(strategy.driTokenMaxingLeverage, /token-maxing|one accountable operator|agents|large engineering|admin|coordination teams/i, `${pkg.slug} should connect DRI work to token maxing`);
      assert.match(strategy.driInformationVelocityGuardrail, /information velocity|artifacts to agents|decisions|customer-visible changes|manual interpretation chains/i, `${pkg.slug} should protect information velocity`);
      assert.match(strategy.aiFounderLeadershipModel, /AI Founder|personally builds|coaches|massive capability gains/i, `${pkg.slug} should define AI Founder leadership`);
      assert.match(strategy.aiStrategyOwnershipRule, /Do not delegate AI strategy|frontier of the tools|operating behavior/i, `${pkg.slug} should keep AI strategy with hands-on leaders`);
      assert.match(strategy.tokenUsageArchetypeOperatingModel, /IC, DRI, and AI Founder|token usage|headcount|humans own building/i, `${pkg.slug} should connect archetypes to token usage over headcount`);
      assert.match(strategy.humanMiddlewareVelocityGain, /human middleware|middle-manager status relays|direct velocity gains|artifacts to agents/i, `${pkg.slug} should connect human-middleware removal to velocity`);
      assert.match(strategy.singlePersonAgentLeverage, /one capable operator|AI agents|larger cross-functional team|humans at the edge/i, `${pkg.slug} should define single-person agent leverage`);
      assert.match(strategy.leanDepartmentOperatingModel, /lean engineering, HR, admin, support, and operations|agent throughput|token spend|coordination headcount/i, `${pkg.slug} should define lean department operation`);
      assert.match(strategy.closedLoopSystem, /closed loop|queryable|outcome reports|delivery hub/i, `${pkg.slug} should include closed-loop learning`);
      assert.match(strategy.openLoopReplacement, /open-loop|measure.*stated goal|self-corrects/i, `${pkg.slug} should replace open-loop execution`);
      assert.match(strategy.legibleOrganization, /legible to AI|transparent channels|private DMs|inbox fragments/i, `${pkg.slug} should make the organization legible`);
      assert.match(strategy.artifactGenerationPolicy, /digital artifact|meeting notes|decision logs|approval receipts|QA traces/i, `${pkg.slug} should create artifacts for important actions`);
      assert.match(strategy.comprehensiveContextLayer, /as much context as an employee|revenue|sales|GitHub|dashboards/i, `${pkg.slug} should provide employee-grade model context`);
      assert.match(strategy.comprehensiveContextLayer, /Pylon-style support|Notion or Google Docs|call recording|standup recording/i, `${pkg.slug} should connect planning docs and recordings`);
      assert.match(strategy.autonomousSprintPlanning, /autonomous sprint planning|tickets|Slack|GitHub|predictable next-cycle plans|manual status rollups/i, `${pkg.slug} should support autonomous sprint planning`);
      assert.match(strategy.autonomousSprintPlanning, /Pylon\/email feedback|Notion or Google Docs|GitHub commits and issues|sales calls|standup recordings/i, `${pkg.slug} should use queryable sources for autonomous planning`);
      assert.match(strategy.humanMiddlewareRemoval, /human middleware|status meetings|middle-management|signal to decision/i, `${pkg.slug} should remove human middleware`);
      assert.match(strategy.closedLoopVelocityGain, /cutting sprint time in half|10x more useful work|goals|feedback/i, `${pkg.slug} should define closed-loop velocity gains`);
      assertMoatPowers(strategy, pkg.slug);
      assert.match(strategy.processPowerMoat, /final 5% to 10%|QA|switching costs|workflow/i, `${pkg.slug} should describe process-power moat`);
      assert.match(strategy.forwardDeployedPosture, /forward-deployed|customer|workflow|usage data/i, `${pkg.slug} should include forward-deployed delivery`);
      assert.match(strategy.tokenMaxingRule, /AI tokens|service labor|headcount/i, `${pkg.slug} should include token-maxing logic`);
      assert.match(strategy.organizationalArchetypes.join(" "), /Individual Contributor|Directly Responsible Individual|AI Founder/i, `${pkg.slug} should name AI-native org archetypes`);
      assert.match(strategy.organizationalArchetypes.join(" "), /builder operator|working prototypes|one-person-one-outcome|builds and coaches/i, `${pkg.slug} should detail the AI-native org archetypes`);
      assert.match(strategy.aiSoftwareFactory, /AI software factory|specs|tests|agents|incumbents/i, `${pkg.slug} should include AI software factory speed`);
      assert.match(strategy.softwareFactorySpecContract, /spec and test harness|what to build|judge criteria|implementation syntax/i, `${pkg.slug} should make specs and tests the main factory artifact`);
      assert.match(strategy.agentIterationLoop, /generate.*test.*iterate|human-defined harness passes/i, `${pkg.slug} should surround operators with iterating agents`);
      assert.match(strategy.lastTenPercentReliability, /last 10%|99%|10x to 100x|demo/i, `${pkg.slug} should treat the last reliability gap as the product`);
      assert.match(strategy.tddSoftwareFactoryLoop, /test-driven development|spec|edge-case tests|agents iterate|tests pass/i, `${pkg.slug} should include a TDD-style agent loop`);
      assert.match(strategy.scenarioValidationThreshold, /scenario-based validations|probabilistic satisfaction threshold|reliability bar/i, `${pkg.slug} should include scenario validation thresholds`);
      assert.match(strategy.probabilisticReviewGate, /line-by-line code review|probabilistic review gate|statistically likely to be correct/i, `${pkg.slug} should replace line-by-line review with threshold evidence`);
      assert.match(strategy.validationDrivenReviewReplacement, /Eliminate human middleware|validations the reviewer|autonomously refine|manual syntax check/i, `${pkg.slug} should make validations replace manual review`);
      assert.match(strategy.thresholdEvidencePolicy, /threshold evidence|scenario coverage|failing cases|confidence signals|acceptance receipts/i, `${pkg.slug} should store threshold evidence`);
      assert.match(strategy.zeroHandwrittenCodePosture, /spec-first|handwritten implementation|outcomes rather than syntax/i, `${pkg.slug} should bias toward spec-first generated implementation`);
      assert.match(strategy.specsOnlyRepositoryGoal, /StrongDM-style|specs|scenario validations|test harnesses|handwritten production code/i, `${pkg.slug} should aim repeatable workflows toward specs-only repositories`);
      assert.match(strategy.thousandXEngineerModel, /thousandx engineer|one expert surrounded by agents|engineering team|speed/i, `${pkg.slug} should include thousandx engineer leverage`);
      assert.match(strategy.incumbentCultureReset, /incumbents|reset engineering culture|context engineering|prompt engineering|intelligence loops/i, `${pkg.slug} should name incumbent adoption friction`);
      assert.match(strategy.contextEngineeringShift, /context engineering|test harnesses|failure traces|acceptance evidence|hand-written syntax/i, `${pkg.slug} should shift senior judgment into context engineering`);
      assert.match(strategy.evalFlywheel, /evals|pass\/fail|human overrides|context engineering|prompt/i, `${pkg.slug} should include eval flywheel learning`);
      assert.match(strategy.wrapperCloneMisconception, /easily cloned model wrapper|demo surface|workflow logic|operating evidence/i, `${pkg.slug} should reject wrapper-clone thinking`);
      assert.match(strategy.accuracyHurdleMoat, /99% accuracy|weekend hackathon|80%|loan origination|KYC|10x to 100x/i, `${pkg.slug} should name the 99% accuracy moat`);
      assert.match(strategy.bigLabDrudgeryDefense, /big-lab defense|AGI labs|final 5%|unglamorous vertical details/i, `${pkg.slug} should use drudgery as big-lab defense`);
      assert.match(strategy.deepBackendLogicMoat, /Stripe|Gusto|policy rules|state transitions|audit trails|reconciliations/i, `${pkg.slug} should include deep backend logic defensibility`);
      assert.match(strategy.integrationSurfaceAreaMoat, /surface area|financial-institution-style|crawlers|imports|exports|reporting contracts/i, `${pkg.slug} should compound integration surface area`);
      assert.match(strategy.customerMintedWorkflow, /Mint the agent|custom logic|evals|thresholds|switching/i, `${pkg.slug} should create customer-minted workflow switching costs`);
      assert.match(strategy.processAutomationMoat, /process-automation moat|last-10%|99% accuracy|banking|legal/i, `${pkg.slug} should include process automation moat`);
      assert.match(strategy.pilotToCoreInfrastructure, /pilots|internal operations|custom rules|core infrastructure/i, `${pkg.slug} should turn pilots into core infrastructure`);
      assert.match(strategy.domainEdgeCaseDrudgery, /drudgery|domain knowledge|KYC|loan-processing|edge cases/i, `${pkg.slug} should account for vertical edge cases`);
      assert.match(strategy.missionCriticalProcessPower, /mission-critical process power|vertical evals|QA gates|moat/i, `${pkg.slug} should convert reliability work into process power`);
      assert.match(strategy.softwareFactorySpeedMoat, /AI software factory|process-power acceleration|complex infrastructure|incumbents/i, `${pkg.slug} should turn software factories into a speed moat`);
      assert.match(strategy.speedMoatThesis, /speed.*first moat|outlearn labs|incumbents|AI-native service improvements/i, `${pkg.slug} should treat speed as the first moat`);
      assert.match(strategy.speedMoatAgainstLabs, /OpenAI|Google|capital and compute|narrow vertical|treasure/i, `${pkg.slug} should name the speed edge against labs`);
      assert.match(strategy.humanMiddlewareSpeedGain, /removed human routing layer|speed gain|meetings|tickets|Slack|GitHub|DRIs/i, `${pkg.slug} should connect human-middleware removal to speed`);
      assert.match(strategy.queryableSprintCompression, /queryable organization data|compress.*sprint|cut sprint time in half|10x/i, `${pkg.slug} should compress sprint cycles with queryable data`);
      assert.match(strategy.oneDaySprintCadence, /one-day sprint cycles|spec.*test.*eval|acceptance evidence|daily release readiness/i, `${pkg.slug} should name one-day sprint cadence`);
      assert.match(strategy.incumbentCraftOverhead, /incumbent craft overhead|PM layers|operations reviews|PRDs|spec docs|launch gates/i, `${pkg.slug} should exploit incumbent craft overhead`);
      assert.match(strategy.legacyOperatingConstraint, /AI-native from day one|legacy SOPs|live-product assumptions|human-first rituals/i, `${pkg.slug} should avoid legacy operating constraints`);
      assert.match(strategy.aiNativeFromDayOneAdvantage, /prototypes over decks|specs and evals|tokens over coordination headcount|agents inside/i, `${pkg.slug} should define AI-native-from-day-one operation`);
      assert.match(strategy.forwardDeployedSpeedLoop, /forward-deployed engineering|sit with customers|boring manual pain|eval data/i, `${pkg.slug} should use forward-deployed speed loops`);
      assert.match(strategy.drudgeryDiscoveryThesis, /painstaking drudgery|last 10%|reliable service delivery|superficially plausible/i, `${pkg.slug} should discover drudgery beyond superficial plausibility`);
      assert.match(strategy.forwardDeployedTimeInMotion, /forward-deployed time-in-motion|sit with the customer|tailored workflow|minute by minute/i, `${pkg.slug} should require time-in-motion observation`);
      assert.match(strategy.nittyGrittyWorkflowMap, /email|form|call|ticket|spreadsheet|enriched|manual data entry|workflow stalls/i, `${pkg.slug} should map nitty-gritty workflow paths`);
      assert.match(strategy.hiddenLogicDiscovery, /hidden logic|backend rules|reconciliation|informal checks|exception paths|operator know-how/i, `${pkg.slug} should identify hidden workflow logic`);
      assert.match(strategy.attritionDiscoverySignal, /50% to 80%|annual attrition|torturous support|admin roles|service replacement/i, `${pkg.slug} should use attrition as a discovery signal`);
      assert.match(strategy.boringWorkflowSchlepMap, /payroll|tax accounting|trucking compliance|insurance operations|regulated admin|grinding execution/i, `${pkg.slug} should map boring schlep workflows`);
      assert.match(strategy.lossyMiddlewareDiscovery, /lossy information middleware|status rollups|fragmented handoffs|manager interpretation|manual coordination/i, `${pkg.slug} should identify lossy middleware`);
      assert.match(strategy.fieldResearchTruckStopMethod, /truck-stop method|where the work.*happens|frontline operators|fuel-card-style wedges|field research/i, `${pkg.slug} should include truck-stop-style field research`);
      assert.match(strategy.missionCriticalWorkflowFilter, /mission-critical infrastructure|KYC|loan origination|legal review|compliance checks|cost millions/i, `${pkg.slug} should filter for mission-critical workflows`);
      assert.match(strategy.hackathonReliabilityGap, /hackathon demo|80% prototype|final 5% to 20%|99% reliability/i, `${pkg.slug} should distinguish demos from production reliability`);
      assert.match(strategy.existentialPainWorkflowFilter, /existential pain|lost revenue|being fired|compliance exposure|business failure/i, `${pkg.slug} should filter for existential workflow pain`);
      assert.match(strategy.specializedEvalMinting, /custom evals|datasets|customer workflow|process power|feature churn/i, `${pkg.slug} should mint specialized evals`);
      assert.match(strategy.treasureBeforeLabs, /treasure|labs care|narrow vertical|edge cases|platform goals/i, `${pkg.slug} should defend treasure before labs care`);
      assert.match(strategy.tokenUsageOrgDesign, /token usage|headcount|agents|builders|agent wranglers/i, `${pkg.slug} should design around token usage before headcount`);
      assert.match(strategy.humanWranglingModel, /agent wrangling|repetitive|exceptions|interesting/i, `${pkg.slug} should shift humans into agent wrangling`);
      assert.doesNotMatch(strategyCopy, /customer-operated tools/i, `${pkg.slug} should not frame delivery as customer-operated tools`);
    }
  });

  it("codifies startup idea guardrails for every provisionable package", () => {
    for (const pkg of provisionablePackages) {
      const guardrails = getPackageIdeaEvaluationGuardrails(pkg);
      const guardrailCopy = Object.values(guardrails).join(" ");

      assert.match(guardrails.problemRealityCheck, /solution in search of a problem|painful workflow/i, `${pkg.slug} should avoid SISP`);
      assert.match(guardrails.problemRealityCheck, /made-up problem/i, `${pkg.slug} should reject made-up problems`);
      assert.match(guardrails.superficialPlausibilityCheck, /sounds logical|genuinely bothered|daily operations|pay or change behavior/i, `${pkg.slug} should reject superficially plausible ideas`);
      assert.match(guardrails.technologyFirstTrapWarning, /AI can do this|hunt for an application|painful service workflow/i, `${pkg.slug} should reject technology-first ideation`);
      assert.match(guardrails.tarPitRiskCheck, /tar pit|structural blockers|failed/i, `${pkg.slug} should check tar pit risk`);
      assert.match(guardrails.tarPitRiskCheck, /superficially plausible|tantalizing-from-a-distance/i, `${pkg.slug} should name the distance illusion`);
      assert.match(guardrails.founderMarketFitCheck, /founder-market fit|domain access|forward-deployed/i, `${pkg.slug} should check founder-market fit`);
      assert.match(guardrails.boringHardCompetitiveAdvantage, /boring|hard|competitive|schlep/i, `${pkg.slug} should not avoid hard markets`);
      assert.match(guardrails.acutePainCheck, /existential pain|lost revenue|wasted labor|promotion risk|urgent business consequence/i, `${pkg.slug} should require acute pain`);
      assert.match(guardrails.topThreePriorityTest, /top three priority|nice-to-have/i, `${pkg.slug} should require top-three priority`);
      assert.match(guardrails.existentialPainTest, /fire-or-promotion|promotion|fired|business at risk|growth/i, `${pkg.slug} should use the fire-or-promotion test`);
      assert.match(guardrails.fireOrPromotionAcutenessTest, /Fire or Promotion|being fired|missing a promotion|not wanting to face the work|business momentum/i, `${pkg.slug} should define the Fire or Promotion acuteness gate`);
      assert.match(guardrails.fireRiskSignal, /fire-side signal|professional risk|miss.*number|lose credibility|business suffer/i, `${pkg.slug} should name the fire-side risk`);
      assert.match(guardrails.promotionUpsideSignal, /promotion-side signal|advance|next-year growth|take over more of the business|top-priority problem/i, `${pkg.slug} should name the promotion-side upside`);
      assert.match(guardrails.topThreeProblemRequirement, /top three customer problem|right now|useful|nice-to-have/i, `${pkg.slug} should keep top-three priority concrete`);
      assert.match(guardrails.willingnessToPayAcutenessSignal, /willingness to pay|budget|complain about price|still pay|unsolved problem/i, `${pkg.slug} should use willingness to pay as acuteness proof`);
      assert.match(guardrails.plainSightOpportunitySignal, /lying in plain sight|high-stakes|operators endure every day|large company/i, `${pkg.slug} should look for plain-sight acute opportunities`);
      assert.match(guardrails.boringSpaceValidationThesis, /boring spaces|tax|payroll|trucking compliance|higher hit rates|fun markets/i, `${pkg.slug} should validate boring spaces through real pain`);
      assert.match(guardrails.physicalObservationSchlepProtocol, /schlep|physically|frontline operators|truck-stop|desk research/i, `${pkg.slug} should require physical observation`);
      assert.match(guardrails.invisiblePainDiscoverySignal, /phone-order|1-800|spreadsheet|fax|tribal-knowledge|programmers/i, `${pkg.slug} should look for invisible operator pain`);
      assert.match(guardrails.forwardDeployedWorkflowValidation, /forward-deployed|tailored time-in-motion|requests.*enriched|call centers|manual entry|judgment/i, `${pkg.slug} should validate by forward-deployed workflow mapping`);
      assert.match(guardrails.lastTenPercentEdgeCaseValidation, /last 10%|edge cases|specialized knowledge|99% reliability|trusted service/i, `${pkg.slug} should make edge-case reliability part of validation`);
      assert.match(guardrails.pricingBinaryValidationSignal, /binary validation|refuse|complain.*pay|yes immediately|too low/i, `${pkg.slug} should use pricing as a binary validation test`);
      assertBinaryTestGuardrails(guardrails, pkg.slug);
      assert.match(guardrails.highAttritionValidationSignal, /50% to 80%|annual churn|support|admin|service replacement/i, `${pkg.slug} should use attrition as validation`);
      assert.match(guardrails.alternativeIsNothingTest, /current alternative is nothing|banks|agencies|software|internal process/i, `${pkg.slug} should check no-real-alternative wedges`);
      assert.match(guardrails.chargeValidationTest, /Charge money|binary test|complain|still pay/i, `${pkg.slug} should use willingness to pay as validation`);
      assert.match(guardrails.tarPitCategoryWarnings.join(" "), /Social coordination|weekend-plans|Fun discovery|restaurant discovery|music discovery|consumer hardware|social networks|ad tech/i, `${pkg.slug} should name tar-pit categories`);
      assert.match(guardrails.funDiscoveryTarPitWarning, /restaurant discovery|music discovery|picked over|willingness to pay/i, `${pkg.slug} should warn on fun discovery apps`);
      assert.match(guardrails.abstractSocietalProblemWarning, /abstract societal problem|poverty|climate|tractable workflow|specific pain/i, `${pkg.slug} should require tractable abstract-problem wedges`);
      assert.match(guardrails.lowHitRateIdeaSpaceWarning, /consumer hardware|social networks|ad tech|low-hit-rate|distribution insight/i, `${pkg.slug} should flag low-hit-rate spaces`);
      assert.match(guardrails.tarPitAvoidanceChecklist.join(" "), /Google|graveyard of prior attempts|Talk to founders|Fire or Promotion|boring service workflows/i, `${pkg.slug} should include a tar-pit avoidance checklist`);
      assert.equal(guardrails.highValueNeedCategories.length, 4, `${pkg.slug} should include the four value categories`);
      assert.match(guardrails.highValueNeedCategories.join(" "), /Make more money|Reduce costs|Move faster|Avoid risk/i, `${pkg.slug} should classify value`);
      assert.match(guardrails.moatTiming, /five-year moat|early defensibility|speed/i, `${pkg.slug} should not over-analyze moats early`);
      assert.match(guardrails.pricingDiscipline, /Charge early|under-charging|lower price|value/i, `${pkg.slug} should enforce pricing discipline`);
      assert.ok(guardrails.tarPitResearchProtocol.length >= 3, `${pkg.slug} should require tar-pit research`);
      assert.match(guardrails.tarPitResearchProtocol.join(" "), /Google prior|failed attempts|hard-part hypothesis/i, `${pkg.slug} should research prior attempts and name the hard part`);
      assert.match(guardrails.socialCoordinationTarPitWarning, /social coordination|weekend-plan|event lists|friend invites/i, `${pkg.slug} should use social coordination as the tar-pit warning`);
      assert.match(guardrails.socialCoordinationTarPitWarning, /superficially plausible|willingness to switch/i, `${pkg.slug} should connect universal pain to switching behavior`);
      assert.match(guardrails.hardPartHypothesis, /structural barrier|adoption|workflow-change|distribution/i, `${pkg.slug} should require a hard-part hypothesis`);
      assert.doesNotMatch(guardrailCopy, /cool AI/i, `${pkg.slug} should not start from technology novelty`);
    }
  });

  it("keeps AI agency offer language focused on complete solutions instead of customer-operated tools", () => {
    for (const slug of aiAgencyPackageSlugs) {
      const pkg = provisionablePackages.find((item) => item.slug === slug);
      assert.ok(pkg);
      const publicCopy = [
        pkg.title,
        pkg.customerOutcome,
        pkg.buyerPersona,
        pkg.launchPromise,
        ...pkg.deliverables.flatMap((deliverable) => [deliverable.title, deliverable.createdArtifact]),
      ].join(" ");

      assert.doesNotMatch(publicCopy, /\btools?\b/i, `${slug} should not sell tools in customer-facing copy`);
    }
  });

  it("provisions all AI agency offers from one simple onboarding form", () => {
    const bundle = provisionPackageBundle({
      packageSlugs: [...aiAgencyPackageSlugs],
      brandName: "Acme AI Agency Bundle",
      operatorEmail: "ops@example.com",
      primaryDomain: "https://example.com",
      targetMarket: "med spas, home services, ecommerce, B2B experts, and SMB operators",
      primaryOffer: "Launch a modular AI agency operating system with outcome-based offers",
      credentials: universalCredentialContext,
      appUrl: "https://lead-os.example.com",
    });

    assert.equal(bundle.status, "launched");
    assert.equal(bundle.packageSlugs.length, aiAgencyPackageSlugs.length);
    assert.equal(bundle.packages.every((pkg) => pkg.status === "launched"), true);
    assert.equal(bundle.packages.every((pkg) => pkg.credentials.missingRequired.length === 0), true);
    assert.equal(bundle.packages.every((pkg) => pkg.automationContract.requiresAdditionalConfiguration === false), true);
    assert.equal(bundle.packages.every((pkg) => pkg.solutionBrief.successMetric === outcomeContext.successMetric), true);
    assert.match(bundle.serviceReplacementStrategy.servicesBudgetTarget, /service|agency|internal labor/i);
    assert.match(bundle.serviceReplacementStrategy.perSeatRisk, /per-seat|automation|revenue/i);
    assert.match(bundle.serviceReplacementStrategy.outcomePricing, /work delivered|accepted outputs|recovered revenue|qualified outcomes|hours saved/i);
    assert.match(bundle.serviceReplacementStrategy.walletShareExpansion, /4% to 10%|services budget/i);
    assert.ok(bundle.serviceReplacementStrategy.pricingUnits.includes("hours saved"));
    assert.ok(bundle.serviceReplacementStrategy.targetServiceIndustries.includes("healthcare administration"));
    assert.match(bundle.serviceReplacementStrategy.serviceReplacementIndustryThesis, /human labor spend|software spend|outsourced functions|manual operating teams/i);
    assert.match(bundle.serviceReplacementStrategy.financialAdminServiceMarkets.join(" "), /accounting|tax audit|payroll|insurance brokerage|compliance|banking operations/i);
    assert.match(bundle.serviceReplacementStrategy.bankingOperationsUseCases.join(" "), /KYC|loan origination|debt recovery|fraud monitoring/i);
    assert.match(bundle.serviceReplacementStrategy.healthcareLegalServiceMarkets.join(" "), /healthcare administration|legal services|junior associate|outsourced legal/i);
    assert.match(bundle.serviceReplacementStrategy.specializedVerticalMarkets.join(" "), /logistics|trucking|fuel cards|HVAC|home services|construction|real estate|debt financing/i);
    assert.match(bundle.serviceReplacementStrategy.customerSupportLanguageMarkets.join(" "), /customer support|multilingual support|international contractor|DoorDasher-style|language-learning conversation/i);
    assert.match(bundle.serviceReplacementStrategy.easiestServiceReplacementIndustries.join(" "), /financial and administrative services|banking infrastructure|healthcare administration|legal application-layer services|HVAC and fragmented home services|construction and fragmented field services|trucking and logistics|multilingual customer and contractor support/i);
    assert.match(bundle.serviceReplacementStrategy.easiestServiceReplacementRationale, /human services spend.*dwarfs software spend|already outsourced|completed outcomes|managing headcount/i);
    assert.match(bundle.serviceReplacementStrategy.outsourcedOutcomeBudgetSignal, /agencies|BPOs|brokers|contractors|specialists|replace the vendor path/i);
    assert.match(bundle.serviceReplacementStrategy.boringSchlepServiceOpportunity, /payroll|tax|trucking compliance|insurance|KYC|debt recovery|painstaking drudgery|process power/i);
    assert.match(bundle.serviceReplacementStrategy.fragmentedNonTechnicalReplacementPath, /HVAC|construction|home services|trucking|local field operations|minted into.*core workflow/i);
    assert.match(bundle.serviceReplacementStrategy.legalApplicationLayerReplacement, /legal services|application-layer replacement|research copilots|specialized legal work|attorney-review boundaries/i);
    assert.match(bundle.serviceReplacementStrategy.multilingualSupportReplacementAdvantage, /infinitely patient|hundreds of languages|international contractor|DoorDasher-style|human teams struggle to staff/i);
    assert.match(bundle.serviceReplacementStrategy.outsourcedServiceReadiness, /outsourced|human service|budget.*outside software/i);
    assert.match(bundle.serviceReplacementStrategy.fragmentedNonTechBudgetOpportunity, /fragmented, non-tech|1%|4% to 10%|doing the work/i);
    assert.match(bundle.serviceReplacementStrategy.highAttritionLaborWedge, /50% to 80%|support attrition|torturous|multilingual support|staff reliably/i);
    assert.match(bundle.serviceReplacementStrategy.pricingTradeoffSummary, /per-seat SaaS|headcount|work-based pricing|completed service outcomes|automation works/i);
    assert.match(bundle.serviceReplacementStrategy.perSeatCannibalizationTrap, /Achilles heel|employee count|loses seats|more efficient/i);
    assert.match(bundle.serviceReplacementStrategy.perSeatLimitedWalletShare, /software budget|1%|completed services/i);
    assert.match(bundle.serviceReplacementStrategy.incumbentPricingCultureResistance, /product, sales, and engineering culture|features for human users|reduce seat demand/i);
    assert.match(bundle.serviceReplacementStrategy.workBasedPricingOpportunity, /work delivered|tasks completed|accepted outputs|qualified outcomes|recovered revenue|hours saved/i);
    assert.match(bundle.serviceReplacementStrategy.servicesBudgetPricingUpside, /services budget|4% to 10%|service work/i);
    assert.match(bundle.serviceReplacementStrategy.outcomeDrivenLaborAttritionValue, /50% to 80%|reliable outcomes|human teams/i);
    assert.match(bundle.serviceReplacementStrategy.superhumanCapabilityPricing, /human seats|200-language fluency|outcomes and volume/i);
    assert.match(bundle.serviceReplacementStrategy.workBasedPricingPilotRisk, /reliability proof|longer pilots|acceptance evidence|last-10-percent/i);
    assert.match(bundle.serviceReplacementStrategy.pricingTradeoffMatrix.join(" "), /Primary goal|Revenue driver|Budget source|Core risk|Moat/i);
    assert.match(bundle.serviceReplacementStrategy.pricingSurvivalRule, /benefits when AI gets better|SaaS|AI-native service/i);
    assert.match(bundle.serviceReplacementStrategy.businessProcessAutomationShift, /business process automation|performs the selected services|co-pilots|productivity layers/i);
    assert.match(bundle.serviceReplacementStrategy.servicePerformingAutomation, /own the full service paths|monitor work|take next actions|escalate/i);
    assert.match(bundle.serviceReplacementStrategy.selfRegulatingAutomationLoop, /self-regulating|continuously monitor outputs|stated goals|performance drifts/i);
    assert.match(bundle.serviceReplacementStrategy.taskPricedAutomation, /tasks completed|work delivered|accepted outputs|service capacity|seats/i);
    assert.match(bundle.serviceReplacementStrategy.intelligenceOperatingSystem, /intelligence operating system|agent layer|co-pilot/i);
    assert.match(bundle.serviceReplacementStrategy.queryableOrganizationModel, /queryable organization|process.*decision.*workflow|stability|correctness/i);
    assert.match(bundle.serviceReplacementStrategy.queryableOperatingSystemView, /continuous, up-to-date view|operations|tool snapshot/i);
    assert.match(bundle.serviceReplacementStrategy.artifactRichLegibilitySources.join(" "), /email|Pylon-style|GitHub commits|issues|Notion|Google Docs|sales calls|daily standups|acceptance receipts/i);
    assert.match(bundle.serviceReplacementStrategy.legibleByDefaultPolicy, /legible by default|communication logs|GitHub activity|what actually shipped|customer needs/i);
    assert.match(bundle.serviceReplacementStrategy.queryableHumanMiddlewareReplacement, /coordinator-style human middleware|intelligence layer|artifacts|lossy manager rollups/i);
    assert.match(bundle.serviceReplacementStrategy.queryableAutonomousCoordination, /tickets|Pylon\/email feedback|Notion or Google Docs|GitHub commits and issues|sales calls|standup recordings/i);
    assert.match(bundle.serviceReplacementStrategy.queryableHumansAtEdgeRole, /humans at the edge|IC builder operators|DRI strategists|status updates/i);
    assert.match(bundle.serviceReplacementStrategy.queryableTokenMaxingRule, /Max tokens before headcount|high API spend|HR|admin|engineering|support coordination|management routing/i);
    assert.match(bundle.serviceReplacementStrategy.artifactRichEnvironment, /AI meeting notes|Slack transcripts|GitHub events|departmental dashboards/i);
    assert.match(bundle.serviceReplacementStrategy.transparentCommunicationPolicy, /private DMs|inbox-only|transparent channels|embedded agents/i);
    assert.match(bundle.serviceReplacementStrategy.contextualParityRule, /contextual parity|human employee|revenue|sales|engineering|hiring|operations|recordings/i);
    assert.match(bundle.serviceReplacementStrategy.contextualParityRule, /Pylon-style support logs|Notion or Google Docs|sales calls|standup recordings/i);
    assert.match(bundle.serviceReplacementStrategy.intelligenceLayerCoordination, /intelligence layer|middle-management|status translation|decision records/i);
    assert.match(bundle.serviceReplacementStrategy.humansAtTheEdgeModel, /humans to the edge|builders|operators|QA owners|agent wranglers/i);
    assert.match(bundle.serviceReplacementStrategy.sprintPlanningIntelligenceLoop, /Linear-style tickets|Slack|GitHub|standup recordings|10x/i);
    assert.match(bundle.serviceReplacementStrategy.sprintPlanningIntelligenceLoop, /Pylon\/email feedback|GitHub commits and issues|Notion or Google Docs|sales-call notes/i);
    assert.match(bundle.serviceReplacementStrategy.tokenMaxingCostShift, /uncomfortably high API bills|token spend|HR|admin|engineering|headcount/i);
    assert.match(bundle.serviceReplacementStrategy.managementHierarchyReplacement, /bundle management stack|intelligence layer|manually interpreting|relaying status/i);
    assert.match(bundle.serviceReplacementStrategy.icBuilderOperatorModel, /bundle Individual Contributor|builder operator|support|sales|operations|agents/i);
    assert.match(bundle.serviceReplacementStrategy.prototypeFirstMeetingCulture, /working prototypes|bundle meeting artifact|live workflows|static pitch decks/i);
    assert.match(bundle.serviceReplacementStrategy.driOutcomeOwnershipModel, /bundle Directly Responsible Individual|strategy-and-customer-outcome|middle manager|measurable result/i);
    assert.match(bundle.serviceReplacementStrategy.onePersonOneOutcomeRule, /one person, one outcome|named DRI|singular accountability|nowhere to hide/i);
    assert.match(bundle.serviceReplacementStrategy.driStrategyOutcomeFocus, /strategy|customer outcomes|status routing|headcount|middleware/i);
    assert.match(bundle.serviceReplacementStrategy.driSpecificResultContract, /one named DRI|specific bundle result|success evidence|decision rights/i);
    assert.match(bundle.serviceReplacementStrategy.driNoHierarchyHidingRule, /hide behind a hierarchy|outcome misses|DRI owns|committees|manager layers/i);
    assert.match(bundle.serviceReplacementStrategy.driMiddleManagementReplacement, /middle-management coordination|intelligence layer|artifacts|exceptions|DRI/i);
    assert.match(bundle.serviceReplacementStrategy.driIntelligenceLayerGuidance, /guides.*bundle intelligence layer|business objectives|goals|constraints|evals|escalation rules/i);
    assert.match(bundle.serviceReplacementStrategy.driEdgeGuidanceRole, /edge|customers|operators|exceptions|AI systems|repeatable work/i);
    assert.match(bundle.serviceReplacementStrategy.driTokenMaxingLeverage, /token-maxing|one accountable operator|agents|large engineering|admin|coordination teams/i);
    assert.match(bundle.serviceReplacementStrategy.driInformationVelocityGuardrail, /information velocity|artifacts to agents|decisions|customer-visible changes|manual interpretation chains/i);
    assert.match(bundle.serviceReplacementStrategy.aiFounderLeadershipModel, /bundle AI Founder|personally builds|coaches|massive capability gains/i);
    assert.match(bundle.serviceReplacementStrategy.aiStrategyOwnershipRule, /Do not delegate bundle AI strategy|frontier of the tools|operating behavior/i);
    assert.match(bundle.serviceReplacementStrategy.tokenUsageArchetypeOperatingModel, /IC, DRI, and AI Founder|token usage|headcount|humans own building/i);
    assert.match(bundle.serviceReplacementStrategy.humanMiddlewareVelocityGain, /human middleware|middle-manager status relays|direct velocity gains|artifacts to agents/i);
    assert.match(bundle.serviceReplacementStrategy.singlePersonAgentLeverage, /one capable operator|AI agents|larger cross-functional team|humans at the edge/i);
    assert.match(bundle.serviceReplacementStrategy.leanDepartmentOperatingModel, /lean engineering, HR, admin, support, and operations|agent throughput|token spend|coordination headcount/i);
    assert.match(bundle.serviceReplacementStrategy.openLoopReplacement, /open-loop|measure output|self-corrects/i);
    assert.match(bundle.serviceReplacementStrategy.legibleOrganization, /legible to AI|transparent channels|private DMs|inbox fragments/i);
    assert.match(bundle.serviceReplacementStrategy.artifactGenerationPolicy, /digital artifact|meeting notes|decision logs|approval receipts|QA traces/i);
    assert.match(bundle.serviceReplacementStrategy.comprehensiveContextLayer, /employee-grade context|revenue|sales|GitHub|dashboards/i);
    assert.match(bundle.serviceReplacementStrategy.comprehensiveContextLayer, /Pylon-style support|Notion or Google Docs|call recording|standup recording/i);
    assert.match(bundle.serviceReplacementStrategy.autonomousSprintPlanning, /autonomous sprint planning|tickets|Slack|GitHub|predictable next-cycle plans|manual status rollups/i);
    assert.match(bundle.serviceReplacementStrategy.autonomousSprintPlanning, /Pylon\/email feedback|Notion or Google Docs|GitHub commits and issues|sales calls|standup recordings/i);
    assert.match(bundle.serviceReplacementStrategy.humanMiddlewareRemoval, /human middleware|status meetings|middle-management|signal to decision/i);
    assert.match(bundle.serviceReplacementStrategy.closedLoopVelocityGain, /cutting sprint time in half|10x more useful work|goals|feedback/i);
    assert.match(bundle.serviceReplacementStrategy.aiSoftwareFactory, /AI software factory|specs|tests|agents/i);
    assert.match(bundle.serviceReplacementStrategy.softwareFactorySpecContract, /specs and test harnesses|success scenarios|judge criteria|implementation syntax/i);
    assert.match(bundle.serviceReplacementStrategy.agentIterationLoop, /generate.*test.*iterate|human-defined harness passes/i);
    assert.match(bundle.serviceReplacementStrategy.lastTenPercentReliability, /last 10%|99%|10x to 100x|demo/i);
    assert.match(bundle.serviceReplacementStrategy.tddSoftwareFactoryLoop, /test-driven development|success specs|edge-case tests|agents iterate/i);
    assert.match(bundle.serviceReplacementStrategy.scenarioValidationThreshold, /scenario-based validations|probabilistic satisfaction threshold|reliability/i);
    assert.match(bundle.serviceReplacementStrategy.probabilisticReviewGate, /line-by-line code review|probabilistic review gate|statistically likely to be correct/i);
    assert.match(bundle.serviceReplacementStrategy.validationDrivenReviewReplacement, /Eliminate human middleware|validations the reviewer|autonomously refine/i);
    assert.match(bundle.serviceReplacementStrategy.thresholdEvidencePolicy, /threshold evidence|scenario coverage|failing cases|confidence signals|acceptance receipts/i);
    assert.match(bundle.serviceReplacementStrategy.zeroHandwrittenCodePosture, /spec-first|handwritten implementation|outcomes instead of syntax/i);
    assert.match(bundle.serviceReplacementStrategy.specsOnlyRepositoryGoal, /StrongDM-style|specs|scenario validations|test harnesses|handwritten production code/i);
    assert.match(bundle.serviceReplacementStrategy.thousandXEngineerModel, /thousandx engineer|one expert surrounded by agents|engineering team/i);
    assert.match(bundle.serviceReplacementStrategy.incumbentCultureReset, /incumbents|resetting engineering culture|context engineering|prompt engineering|intelligence loops/i);
    assert.match(bundle.serviceReplacementStrategy.contextEngineeringShift, /context engineering|test harnesses|failure traces|acceptance evidence|intelligence layer/i);
    assert.match(bundle.serviceReplacementStrategy.evalFlywheel, /evals|pass\/fail|human overrides|context engineering|prompt/i);
    assert.match(bundle.serviceReplacementStrategy.wrapperCloneMisconception, /cloneable wrapper|demo surface|workflow logic|operating evidence/i);
    assert.match(bundle.serviceReplacementStrategy.accuracyHurdleMoat, /99% accuracy|weekend hackathon|80%|loan origination|KYC|10x to 100x/i);
    assert.match(bundle.serviceReplacementStrategy.bigLabDrudgeryDefense, /big-lab defense|AGI labs|final 5%|unglamorous operating details/i);
    assert.match(bundle.serviceReplacementStrategy.deepBackendLogicMoat, /Stripe|Gusto|policy rules|state transitions|audit trails|reconciliations/i);
    assert.match(bundle.serviceReplacementStrategy.integrationSurfaceAreaMoat, /surface area|financial-institution-style|crawlers|imports|exports|reporting contracts/i);
    assert.match(bundle.serviceReplacementStrategy.customerMintedWorkflow, /Mint the bundle|custom logic|evals|thresholds|switching/i);
    assert.match(bundle.serviceReplacementStrategy.processAutomationMoat, /process-automation moat|last-10%|99% accuracy|banking|legal/i);
    assert.match(bundle.serviceReplacementStrategy.pilotToCoreInfrastructure, /pilots|internal operations|custom rules|core infrastructure/i);
    assert.match(bundle.serviceReplacementStrategy.domainEdgeCaseDrudgery, /drudgery|domain experts|KYC|loan-processing|healthcare-admin/i);
    assert.match(bundle.serviceReplacementStrategy.missionCriticalProcessPower, /mission-critical process power|vertical evals|QA gates|moat/i);
    assert.match(bundle.serviceReplacementStrategy.softwareFactorySpeedMoat, /AI software factory|process-power acceleration|complex bundle infrastructure|incumbents/i);
    assert.match(bundle.serviceReplacementStrategy.speedMoatThesis, /speed.*first moat|outlearn labs|incumbents|AI-native service improvements/i);
    assert.match(bundle.serviceReplacementStrategy.speedMoatAgainstLabs, /OpenAI|Google|capital and compute|narrow verticals|treasure/i);
    assert.match(bundle.serviceReplacementStrategy.humanMiddlewareSpeedGain, /removed bundle routing layer|speed gain|meetings|tickets|Slack|GitHub|DRIs/i);
    assert.match(bundle.serviceReplacementStrategy.queryableSprintCompression, /queryable bundle data|compress sprint cycles|cut sprint time in half|10x/i);
    assert.match(bundle.serviceReplacementStrategy.oneDaySprintCadence, /one-day sprint cycles|spec.*test.*eval|acceptance evidence|daily release readiness/i);
    assert.match(bundle.serviceReplacementStrategy.incumbentCraftOverhead, /incumbent craft overhead|PM layers|operations reviews|PRDs|spec docs|launch gates/i);
    assert.match(bundle.serviceReplacementStrategy.legacyOperatingConstraint, /AI-native from day one|legacy SOPs|live-product assumptions|human-first rituals/i);
    assert.match(bundle.serviceReplacementStrategy.aiNativeFromDayOneAdvantage, /prototypes over decks|specs and evals|tokens over coordination headcount|agents inside/i);
    assert.match(bundle.serviceReplacementStrategy.forwardDeployedSpeedLoop, /forward-deployed engineering|sit with customers|boring manual pain|eval data/i);
    assertMoatPowers(bundle.serviceReplacementStrategy, "package bundle");
    assert.match(bundle.serviceReplacementStrategy.drudgeryDiscoveryThesis, /painstaking drudgery|last 10%|reliable multi-service delivery|superficially plausible/i);
    assert.match(bundle.serviceReplacementStrategy.forwardDeployedTimeInMotion, /forward-deployed time-in-motion|sit with the customer|tailored workflow|minute by minute/i);
    assert.match(bundle.serviceReplacementStrategy.nittyGrittyWorkflowMap, /email|forms|calls|tickets|spreadsheets|enriched|manual data entry|workflow stalls/i);
    assert.match(bundle.serviceReplacementStrategy.hiddenLogicDiscovery, /hidden bundle logic|backend rules|reconciliation|informal checks|exception paths|operator know-how/i);
    assert.match(bundle.serviceReplacementStrategy.attritionDiscoverySignal, /50% to 80%|annual attrition|torturous support|admin roles|service replacement/i);
    assert.match(bundle.serviceReplacementStrategy.boringWorkflowSchlepMap, /payroll|tax accounting|trucking compliance|insurance operations|regulated admin|grinding execution/i);
    assert.match(bundle.serviceReplacementStrategy.lossyMiddlewareDiscovery, /lossy information middleware|status rollups|fragmented handoffs|manager interpretation|manual coordination/i);
    assert.match(bundle.serviceReplacementStrategy.fieldResearchTruckStopMethod, /truck-stop method|where the work.*happens|frontline operators|fuel-card-style wedges|field research/i);
    assert.match(bundle.serviceReplacementStrategy.missionCriticalWorkflowFilter, /mission-critical infrastructure|KYC|loan origination|legal review|compliance checks|cost millions/i);
    assert.match(bundle.serviceReplacementStrategy.hackathonReliabilityGap, /hackathon demo|80% prototype|final 5% to 20%|99% reliability/i);
    assert.match(bundle.serviceReplacementStrategy.existentialPainWorkflowFilter, /existential pain|lost revenue|being fired|compliance exposure|business failure/i);
    assert.match(bundle.serviceReplacementStrategy.specializedEvalMinting, /custom evals|datasets|customer workflow|process power|feature churn/i);
    assert.match(bundle.serviceReplacementStrategy.treasureBeforeLabs, /treasure|labs care|narrow vertical|edge cases|platform goals/i);
    assert.match(bundle.serviceReplacementStrategy.tokenUsageOrgDesign, /token usage|headcount|agents|builders|agent wranglers/i);
    assert.match(bundle.serviceReplacementStrategy.humanWranglingModel, /agent wrangling|exception|expert judgment/i);
    assert.match(bundle.serviceReplacementStrategy.organizationalArchetypes.join(" "), /Individual Contributor|Directly Responsible Individual|AI Founder/i);
    assert.match(bundle.serviceReplacementStrategy.organizationalArchetypes.join(" "), /builder operator|working prototypes|one-person-one-outcome|builds and coaches/i);
    assert.match(bundle.ideaEvaluationGuardrails.problemRealityCheck, /acute customer workflows|plausible/i);
    assert.match(bundle.ideaEvaluationGuardrails.problemRealityCheck, /made-up problem/i);
    assert.match(bundle.ideaEvaluationGuardrails.superficialPlausibilityCheck, /superficially plausible|genuinely bothered|daily operations|pay or change behavior/i);
    assert.match(bundle.ideaEvaluationGuardrails.technologyFirstTrapWarning, /AI novelty|hunt for a buyer|painful service workflow/i);
    assert.match(bundle.ideaEvaluationGuardrails.tarPitRiskCheck, /failed attempts|structural blockers/i);
    assert.match(bundle.ideaEvaluationGuardrails.tarPitRiskCheck, /tantalizing-from-a-distance/i);
    assert.match(bundle.ideaEvaluationGuardrails.acutePainCheck, /existential pain|urgent revenue|customer loss/i);
    assert.match(bundle.ideaEvaluationGuardrails.topThreePriorityTest, /top three buyer priority/i);
    assert.match(bundle.ideaEvaluationGuardrails.existentialPainTest, /fire-or-promotion|business survival|promotion/i);
    assert.match(bundle.ideaEvaluationGuardrails.fireOrPromotionAcutenessTest, /Fire or Promotion|being fired|missing a promotion|not wanting to face the work|business momentum/i);
    assert.match(bundle.ideaEvaluationGuardrails.fireRiskSignal, /fire-side signal|professional risk|miss.*number|lose credibility|business suffer/i);
    assert.match(bundle.ideaEvaluationGuardrails.promotionUpsideSignal, /promotion-side signal|advance|next-year growth|take over more of the business|top-priority problem/i);
    assert.match(bundle.ideaEvaluationGuardrails.topThreeProblemRequirement, /top three customer problem|right now|delay|nice-to-have/i);
    assert.match(bundle.ideaEvaluationGuardrails.willingnessToPayAcutenessSignal, /willingness to pay|budget|complain about price|still pay|unsolved problem/i);
    assert.match(bundle.ideaEvaluationGuardrails.plainSightOpportunitySignal, /lying in plain sight|high-stakes|operators endure every day|large company/i);
    assert.match(bundle.ideaEvaluationGuardrails.boringSpaceValidationThesis, /boring spaces|tax|payroll|trucking compliance|higher hit rates|fun markets/i);
    assert.match(bundle.ideaEvaluationGuardrails.physicalObservationSchlepProtocol, /schlep|physically|frontline operators|truck-stop|desk research/i);
    assert.match(bundle.ideaEvaluationGuardrails.invisiblePainDiscoverySignal, /phone-order|1-800|spreadsheet|fax|tribal-knowledge|programmers/i);
    assert.match(bundle.ideaEvaluationGuardrails.forwardDeployedWorkflowValidation, /forward-deployed|tailored time-in-motion|request intake|call centers|manual entry|judgment/i);
    assert.match(bundle.ideaEvaluationGuardrails.lastTenPercentEdgeCaseValidation, /last 10%|edge cases|specialized knowledge|99% reliability|trusted services/i);
    assert.match(bundle.ideaEvaluationGuardrails.pricingBinaryValidationSignal, /binary.*validation|refuse|complain.*pay|yes immediately|too cheap/i);
    assertBinaryTestGuardrails(bundle.ideaEvaluationGuardrails, "package bundle");
    assert.match(bundle.ideaEvaluationGuardrails.highAttritionValidationSignal, /50% to 80%|annual churn|support|admin|service replacement/i);
    assert.match(bundle.ideaEvaluationGuardrails.alternativeIsNothingTest, /current alternative is literally nothing|banks|agencies|software/i);
    assert.match(bundle.ideaEvaluationGuardrails.chargeValidationTest, /Charge|binary test|complaining|still paying/i);
    assert.match(bundle.ideaEvaluationGuardrails.tarPitCategoryWarnings.join(" "), /social coordination|weekend-plans|fun discovery|restaurant discovery|music discovery|consumer hardware|social networks|ad tech/i);
    assert.match(bundle.ideaEvaluationGuardrails.funDiscoveryTarPitWarning, /restaurant discovery|music discovery|picked over|willingness to pay/i);
    assert.match(bundle.ideaEvaluationGuardrails.abstractSocietalProblemWarning, /abstract societal problem|poverty|climate|tractable workflows|specific pain/i);
    assert.match(bundle.ideaEvaluationGuardrails.lowHitRateIdeaSpaceWarning, /consumer hardware|social networks|ad tech|low-hit-rate|distribution insight/i);
    assert.match(bundle.ideaEvaluationGuardrails.tarPitAvoidanceChecklist.join(" "), /Google|graveyard of prior attempts|Talk to founders|Fire or Promotion|boring service workflows/i);
    assert.equal(bundle.ideaEvaluationGuardrails.highValueNeedCategories.length, 4);
    assert.match(bundle.ideaEvaluationGuardrails.highValueNeedCategories.join(" "), /Make more money|Reduce costs|Move faster|Avoid risk/i);
    assert.match(bundle.ideaEvaluationGuardrails.pricingDiscipline, /Charge|under-charging|outcomes delivered/i);
    assert.ok(bundle.ideaEvaluationGuardrails.tarPitResearchProtocol.length >= 3);
    assert.match(bundle.ideaEvaluationGuardrails.tarPitResearchProtocol.join(" "), /Google prior|failed|hard-part hypothesis/i);
    assert.match(bundle.ideaEvaluationGuardrails.socialCoordinationTarPitWarning, /social coordination|universal problem|network adoption/i);
    assert.match(bundle.ideaEvaluationGuardrails.hardPartHypothesis, /structural barrier|distribution|workflow change|reliability/i);
    assert.ok(bundle.totalArtifacts >= aiAgencyPackageSlugs.length * 8);
    assert.ok(bundle.valueCase.sixFigureValueDrivers.length >= 4);
    assert.ok(bundle.valueCase.sixFigureValueDrivers.some((driver) => /Bundle moat powers framework/i.test(driver)));
    assert.ok(bundle.valueCase.sixFigureValueDrivers.some((driver) => /Bundle AI Seven Powers framework/i.test(driver)));
    assert.ok(bundle.valueCase.sixFigureValueDrivers.some((driver) => /Bundle Binary Test definition/i.test(driver)));
    assert.ok(bundle.valueCase.sixFigureValueDrivers.some((driver) => /Bundle premium-price learning signal/i.test(driver)));
    assert.ok(bundle.valueCase.renewalReasons.length >= 3);
    assert.ok(bundle.customerGuide.startHere.length >= 4);
    assert.ok(bundle.customerGuide.implementationRoadmap.length >= 3);
    assert.ok(bundle.customerGuide.ambiguityKillers.some((item) => /one intake/i.test(item)));
    assert.equal(bundle.packages.every((pkg) => pkg.customerGuide.startHere.length >= 5), true);
    assert.equal(bundle.packages.every((pkg) => pkg.artifacts.every((artifact) => artifact.guide.handoffInstructions.length >= 4)), true);
    assert.equal(bundle.acceptanceTests.every((test) => test.status === "passed"), true);
    assert.equal(
      bundle.acceptanceTests.some((test) => test.test === "Bundle value case documented"),
      true,
    );
    assert.equal(
      bundle.acceptanceTests.some((test) => test.test === "Bundle tar-pit hard part documented"),
      true,
    );
    assert.equal(
      bundle.acceptanceTests.some((test) => test.test === "Bundle pricing trade-off summary documented"),
      true,
    );
    assert.equal(
      bundle.acceptanceTests.some((test) => test.test === "Bundle work-based pricing opportunity documented"),
      true,
    );
    assert.equal(
      bundle.acceptanceTests.some((test) => test.test === "Bundle pricing trade-off matrix documented"),
      true,
    );
    assert.equal(
      bundle.acceptanceTests.some((test) => test.test === "Bundle pricing survival rule documented"),
      true,
    );
    assert.equal(
      bundle.acceptanceTests.some((test) => test.test === "Bundle tar-pit category warnings documented"),
      true,
    );
    assert.equal(
      bundle.acceptanceTests.some((test) => test.test === "Bundle fun discovery tar-pit warning documented"),
      true,
    );
    assert.equal(
      bundle.acceptanceTests.some((test) => test.test === "Bundle abstract societal problem warning documented"),
      true,
    );
    assert.equal(
      bundle.acceptanceTests.some((test) => test.test === "Bundle low-hit-rate idea-space warning documented"),
      true,
    );
    assert.equal(
      bundle.acceptanceTests.some((test) => test.test === "Bundle tar-pit avoidance checklist documented"),
      true,
    );
    assert.equal(
      bundle.acceptanceTests.some((test) => test.test === "Bundle superficial plausibility guardrail documented"),
      true,
    );
    assert.equal(
      bundle.acceptanceTests.some((test) => test.test === "Bundle acute pain validation documented"),
      true,
    );
    assert.equal(
      bundle.acceptanceTests.some((test) => test.test === "Bundle fire-or-promotion acuteness gate documented"),
      true,
    );
    assert.equal(
      bundle.acceptanceTests.some((test) => test.test === "Bundle fire risk signal documented"),
      true,
    );
    assert.equal(
      bundle.acceptanceTests.some((test) => test.test === "Bundle promotion upside signal documented"),
      true,
    );
    assert.equal(
      bundle.acceptanceTests.some((test) => test.test === "Bundle top-three problem requirement documented"),
      true,
    );
    assert.equal(
      bundle.acceptanceTests.some((test) => test.test === "Bundle willingness-to-pay acuteness signal documented"),
      true,
    );
    assert.equal(
      bundle.acceptanceTests.some((test) => test.test === "Bundle plain-sight opportunity signal documented"),
      true,
    );
    assert.equal(
      bundle.acceptanceTests.some((test) => test.test === "Bundle boring-space validation thesis documented"),
      true,
    );
    assert.equal(
      bundle.acceptanceTests.some((test) => test.test === "Bundle physical-observation schlep documented"),
      true,
    );
    assert.equal(
      bundle.acceptanceTests.some((test) => test.test === "Bundle invisible pain discovery documented"),
      true,
    );
    assert.equal(
      bundle.acceptanceTests.some((test) => test.test === "Bundle forward-deployed workflow validation documented"),
      true,
    );
    assert.equal(
      bundle.acceptanceTests.some((test) => test.test === "Bundle last-10-percent edge-case validation documented"),
      true,
    );
    assert.equal(
      bundle.acceptanceTests.some((test) => test.test === "Bundle pricing binary validation documented"),
      true,
    );
    assert.equal(
      bundle.acceptanceTests.some((test) => test.test === "Bundle Binary Test definition documented"),
      true,
    );
    assert.equal(
      bundle.acceptanceTests.some((test) => test.test === "Bundle open-wallet value signal documented"),
      true,
    );
    assert.equal(
      bundle.acceptanceTests.some((test) => test.test === "Bundle Binary Test customer segment signal documented"),
      true,
    );
    assert.equal(
      bundle.acceptanceTests.some((test) => test.test === "Bundle premium-price learning signal documented"),
      true,
    );
    assert.equal(
      bundle.acceptanceTests.some((test) => test.test === "Bundle complain-but-pay validation signal documented"),
      true,
    );
    assert.equal(
      bundle.acceptanceTests.some((test) => test.test === "Bundle high-attrition validation documented"),
      true,
    );
    assert.equal(
      bundle.acceptanceTests.some((test) => test.test === "Bundle charge validation documented"),
      true,
    );
    assert.equal(
      bundle.acceptanceTests.some((test) => test.test === "Bundle business process automation shift documented"),
      true,
    );
    assert.equal(
      bundle.acceptanceTests.some((test) => test.test === "Bundle service-performing automation documented"),
      true,
    );
    assert.equal(
      bundle.acceptanceTests.some((test) => test.test === "Bundle self-regulating automation loop documented"),
      true,
    );
    assert.equal(
      bundle.acceptanceTests.some((test) => test.test === "Bundle task-priced automation documented"),
      true,
    );
    assert.equal(
      bundle.acceptanceTests.some((test) => test.test === "Bundle AI-native operating model documented"),
      true,
    );
    assert.equal(
      bundle.acceptanceTests.some((test) => test.test === "Bundle service-replacement industry thesis documented"),
      true,
    );
    assert.equal(
      bundle.acceptanceTests.some((test) => test.test === "Bundle financial/admin service markets documented"),
      true,
    );
    assert.equal(
      bundle.acceptanceTests.some((test) => test.test === "Bundle banking operations use cases documented"),
      true,
    );
    assert.equal(
      bundle.acceptanceTests.some((test) => test.test === "Bundle healthcare/legal service markets documented"),
      true,
    );
    assert.equal(
      bundle.acceptanceTests.some((test) => test.test === "Bundle specialized vertical markets documented"),
      true,
    );
    assert.equal(
      bundle.acceptanceTests.some((test) => test.test === "Bundle support/language service markets documented"),
      true,
    );
    assert.equal(
      bundle.acceptanceTests.some((test) => test.test === "Bundle easiest service-replacement industries documented"),
      true,
    );
    assert.equal(
      bundle.acceptanceTests.some((test) => test.test === "Bundle easiest replacement rationale documented"),
      true,
    );
    assert.equal(
      bundle.acceptanceTests.some((test) => test.test === "Bundle outsourced outcome budget signal documented"),
      true,
    );
    assert.equal(
      bundle.acceptanceTests.some((test) => test.test === "Bundle boring schlep opportunity documented"),
      true,
    );
    assert.equal(
      bundle.acceptanceTests.some((test) => test.test === "Bundle fragmented non-technical replacement path documented"),
      true,
    );
    assert.equal(
      bundle.acceptanceTests.some((test) => test.test === "Bundle legal application-layer replacement documented"),
      true,
    );
    assert.equal(
      bundle.acceptanceTests.some((test) => test.test === "Bundle multilingual support replacement advantage documented"),
      true,
    );
    assert.equal(
      bundle.acceptanceTests.some((test) => test.test === "Bundle outsourced-service readiness documented"),
      true,
    );
    assert.equal(
      bundle.acceptanceTests.some((test) => test.test === "Bundle fragmented non-tech budget wedge documented"),
      true,
    );
    assert.equal(
      bundle.acceptanceTests.some((test) => test.test === "Bundle high-attrition labor wedge documented"),
      true,
    );
    assert.equal(
      bundle.acceptanceTests.some((test) => test.test === "Bundle queryable organization model documented"),
      true,
    );
    assert.equal(
      bundle.acceptanceTests.some((test) => test.test === "Bundle queryable operating system view documented"),
      true,
    );
    assert.equal(
      bundle.acceptanceTests.some((test) => test.test === "Bundle artifact-rich legibility sources documented"),
      true,
    );
    assert.equal(
      bundle.acceptanceTests.some((test) => test.test === "Bundle legible-by-default policy documented"),
      true,
    );
    assert.equal(
      bundle.acceptanceTests.some((test) => test.test === "Bundle queryable human middleware replacement documented"),
      true,
    );
    assert.equal(
      bundle.acceptanceTests.some((test) => test.test === "Bundle queryable autonomous coordination documented"),
      true,
    );
    assert.equal(
      bundle.acceptanceTests.some((test) => test.test === "Bundle queryable humans-at-the-edge role documented"),
      true,
    );
    assert.equal(
      bundle.acceptanceTests.some((test) => test.test === "Bundle queryable token-maxing rule documented"),
      true,
    );
    assert.equal(
      bundle.acceptanceTests.some((test) => test.test === "Bundle artifact-rich environment documented"),
      true,
    );
    assert.equal(
      bundle.acceptanceTests.some((test) => test.test === "Bundle transparent communication policy documented"),
      true,
    );
    assert.equal(
      bundle.acceptanceTests.some((test) => test.test === "Bundle contextual parity rule documented"),
      true,
    );
    assert.equal(
      bundle.acceptanceTests.some((test) => test.test === "Bundle intelligence-layer coordination documented"),
      true,
    );
    assert.equal(
      bundle.acceptanceTests.some((test) => test.test === "Bundle humans-at-the-edge model documented"),
      true,
    );
    assert.equal(
      bundle.acceptanceTests.some((test) => test.test === "Bundle sprint-planning intelligence loop documented"),
      true,
    );
    assert.equal(
      bundle.acceptanceTests.some((test) => test.test === "Bundle token-maxing cost shift documented"),
      true,
    );
    assert.equal(
      bundle.acceptanceTests.some((test) => test.test === "Bundle management hierarchy replacement documented"),
      true,
    );
    assert.equal(
      bundle.acceptanceTests.some((test) => test.test === "Bundle IC builder-operator model documented"),
      true,
    );
    assert.equal(
      bundle.acceptanceTests.some((test) => test.test === "Bundle prototype-first meeting culture documented"),
      true,
    );
    assert.equal(
      bundle.acceptanceTests.some((test) => test.test === "Bundle DRI outcome ownership model documented"),
      true,
    );
    assert.equal(
      bundle.acceptanceTests.some((test) => test.test === "Bundle one-person-one-outcome rule documented"),
      true,
    );
    assert.equal(
      bundle.acceptanceTests.some((test) => test.test === "Bundle DRI strategy outcome focus documented"),
      true,
    );
    assert.equal(
      bundle.acceptanceTests.some((test) => test.test === "Bundle DRI specific result contract documented"),
      true,
    );
    assert.equal(
      bundle.acceptanceTests.some((test) => test.test === "Bundle DRI no hierarchy hiding rule documented"),
      true,
    );
    assert.equal(
      bundle.acceptanceTests.some((test) => test.test === "Bundle DRI middle management replacement documented"),
      true,
    );
    assert.equal(
      bundle.acceptanceTests.some((test) => test.test === "Bundle DRI intelligence layer guidance documented"),
      true,
    );
    assert.equal(
      bundle.acceptanceTests.some((test) => test.test === "Bundle DRI edge guidance role documented"),
      true,
    );
    assert.equal(
      bundle.acceptanceTests.some((test) => test.test === "Bundle DRI token-maxing leverage documented"),
      true,
    );
    assert.equal(
      bundle.acceptanceTests.some((test) => test.test === "Bundle DRI information velocity guardrail documented"),
      true,
    );
    assert.equal(
      bundle.acceptanceTests.some((test) => test.test === "Bundle AI founder leadership model documented"),
      true,
    );
    assert.equal(
      bundle.acceptanceTests.some((test) => test.test === "Bundle AI strategy ownership rule documented"),
      true,
    );
    assert.equal(
      bundle.acceptanceTests.some((test) => test.test === "Bundle token-usage archetype operating model documented"),
      true,
    );
    assert.equal(
      bundle.acceptanceTests.some((test) => test.test === "Bundle human-middleware velocity gain documented"),
      true,
    );
    assert.equal(
      bundle.acceptanceTests.some((test) => test.test === "Bundle single-person agent leverage documented"),
      true,
    );
    assert.equal(
      bundle.acceptanceTests.some((test) => test.test === "Bundle lean department operating model documented"),
      true,
    );
    assert.equal(
      bundle.acceptanceTests.some((test) => test.test === "Bundle speed moat thesis documented"),
      true,
    );
    assert.equal(
      bundle.acceptanceTests.some((test) => test.test === "Bundle speed moat against labs documented"),
      true,
    );
    assert.equal(
      bundle.acceptanceTests.some((test) => test.test === "Bundle human-middleware speed gain documented"),
      true,
    );
    assert.equal(
      bundle.acceptanceTests.some((test) => test.test === "Bundle queryable sprint compression documented"),
      true,
    );
    assert.equal(
      bundle.acceptanceTests.some((test) => test.test === "Bundle one-day sprint cadence documented"),
      true,
    );
    assert.equal(
      bundle.acceptanceTests.some((test) => test.test === "Bundle incumbent craft overhead documented"),
      true,
    );
    assert.equal(
      bundle.acceptanceTests.some((test) => test.test === "Bundle legacy operating constraint documented"),
      true,
    );
    assert.equal(
      bundle.acceptanceTests.some((test) => test.test === "Bundle AI-native from day one advantage documented"),
      true,
    );
    assert.equal(
      bundle.acceptanceTests.some((test) => test.test === "Bundle forward-deployed speed loop documented"),
      true,
    );
    for (const testName of bundleMoatAcceptanceTests) {
      assert.equal(
        bundle.acceptanceTests.some((test) => test.test === testName),
        true,
        `${testName} should be present`,
      );
    }
    assert.equal(
      bundle.acceptanceTests.some((test) => test.test === "Bundle drudgery discovery thesis documented"),
      true,
    );
    assert.equal(
      bundle.acceptanceTests.some((test) => test.test === "Bundle forward-deployed time-in-motion documented"),
      true,
    );
    assert.equal(
      bundle.acceptanceTests.some((test) => test.test === "Bundle nitty-gritty workflow map documented"),
      true,
    );
    assert.equal(
      bundle.acceptanceTests.some((test) => test.test === "Bundle hidden logic discovery documented"),
      true,
    );
    assert.equal(
      bundle.acceptanceTests.some((test) => test.test === "Bundle attrition discovery signal documented"),
      true,
    );
    assert.equal(
      bundle.acceptanceTests.some((test) => test.test === "Bundle boring workflow schlep map documented"),
      true,
    );
    assert.equal(
      bundle.acceptanceTests.some((test) => test.test === "Bundle lossy middleware discovery documented"),
      true,
    );
    assert.equal(
      bundle.acceptanceTests.some((test) => test.test === "Bundle field research truck-stop method documented"),
      true,
    );
    assert.equal(
      bundle.acceptanceTests.some((test) => test.test === "Bundle mission-critical workflow filter documented"),
      true,
    );
    assert.equal(
      bundle.acceptanceTests.some((test) => test.test === "Bundle hackathon reliability gap documented"),
      true,
    );
    assert.equal(
      bundle.acceptanceTests.some((test) => test.test === "Bundle existential pain workflow filter documented"),
      true,
    );
    assert.equal(
      bundle.acceptanceTests.some((test) => test.test === "Bundle specialized eval minting documented"),
      true,
    );
    assert.equal(
      bundle.acceptanceTests.some((test) => test.test === "Bundle treasure before labs documented"),
      true,
    );
    assert.equal(
      bundle.acceptanceTests.some((test) => test.test === "Bundle open-loop replacement documented"),
      true,
    );
    assert.equal(
      bundle.acceptanceTests.some((test) => test.test === "Bundle legible organization policy documented"),
      true,
    );
    assert.equal(
      bundle.acceptanceTests.some((test) => test.test === "Bundle artifact generation policy documented"),
      true,
    );
    assert.equal(
      bundle.acceptanceTests.some((test) => test.test === "Bundle comprehensive context layer documented"),
      true,
    );
    assert.equal(
      bundle.acceptanceTests.some((test) => test.test === "Bundle autonomous sprint planning documented"),
      true,
    );
    assert.equal(
      bundle.acceptanceTests.some((test) => test.test === "Bundle human middleware removal documented"),
      true,
    );
    assert.equal(
      bundle.acceptanceTests.some((test) => test.test === "Bundle closed-loop velocity gain documented"),
      true,
    );
    assert.equal(
      bundle.acceptanceTests.some((test) => test.test === "Bundle software factory spec-and-test workflow documented"),
      true,
    );
    assert.equal(
      bundle.acceptanceTests.some((test) => test.test === "Bundle autonomous agent iteration loop documented"),
      true,
    );
    assert.equal(
      bundle.acceptanceTests.some((test) => test.test === "Bundle human agent-wrangling model documented"),
      true,
    );
    assert.equal(
      bundle.acceptanceTests.some((test) => test.test === "Bundle last-10-percent reliability plan documented"),
      true,
    );
    assert.equal(
      bundle.acceptanceTests.some((test) => test.test === "Bundle eval flywheel documented"),
      true,
    );
    assert.equal(
      bundle.acceptanceTests.some((test) => test.test === "Bundle probabilistic review gate documented"),
      true,
    );
    assert.equal(
      bundle.acceptanceTests.some((test) => test.test === "Bundle validation-driven review replacement documented"),
      true,
    );
    assert.equal(
      bundle.acceptanceTests.some((test) => test.test === "Bundle threshold evidence policy documented"),
      true,
    );
    assert.equal(
      bundle.acceptanceTests.some((test) => test.test === "Bundle specs-only repository goal documented"),
      true,
    );
    assert.equal(
      bundle.acceptanceTests.some((test) => test.test === "Bundle thousandx engineer model documented"),
      true,
    );
    assert.equal(
      bundle.acceptanceTests.some((test) => test.test === "Bundle incumbent culture reset documented"),
      true,
    );
    assert.equal(
      bundle.acceptanceTests.some((test) => test.test === "Bundle wrapper-clone misconception rejected"),
      true,
    );
    assert.equal(
      bundle.acceptanceTests.some((test) => test.test === "Bundle 99-percent accuracy moat documented"),
      true,
    );
    assert.equal(
      bundle.acceptanceTests.some((test) => test.test === "Bundle big-lab drudgery defense documented"),
      true,
    );
    assert.equal(
      bundle.acceptanceTests.some((test) => test.test === "Bundle deep backend logic moat documented"),
      true,
    );
    assert.equal(
      bundle.acceptanceTests.some((test) => test.test === "Bundle integration surface-area moat documented"),
      true,
    );
    assert.equal(
      bundle.acceptanceTests.some((test) => test.test === "Bundle customer-minted workflow switching cost documented"),
      true,
    );
    assert.equal(
      bundle.acceptanceTests.some((test) => test.test === "Bundle process automation moat documented"),
      true,
    );
    assert.equal(
      bundle.acceptanceTests.some((test) => test.test === "Bundle pilot-to-core infrastructure documented"),
      true,
    );
    assert.equal(
      bundle.acceptanceTests.some((test) => test.test === "Bundle token-usage org design documented"),
      true,
    );
    assert.equal(
      bundle.automationRuns.every((run) => !/\bpackage workspace|package selected|package count\b/i.test(`${run.step} ${run.detail}`)),
      true,
    );
  });

  it("provisions one, two, three, four, or all packages from the same universal intake without extra configuration", () => {
    const packageSets: PackageSlug[][] = [
      ["ai-opportunity-audit"],
      ["ai-opportunity-audit", "lead-reactivation-engine"],
      ["ai-opportunity-audit", "lead-reactivation-engine", "content-repurposing-engine"],
      ["ai-opportunity-audit", "lead-reactivation-engine", "content-repurposing-engine", "ai-ugc-video-ad-studio"],
      provisionablePackages.map((pkg) => pkg.slug),
    ];

    for (const packageSlugs of packageSets) {
      const bundle = provisionPackageBundle({
        packageSlugs,
        brandName: "Composable Client",
        operatorEmail: "ops@example.com",
        primaryDomain: "https://example.com",
        targetMarket: "SMB operators, local services, ecommerce, creators, and agencies",
        primaryOffer: "Launch selected outcome packages from one universal intake",
        credentials: universalCredentialContext,
        appUrl: "https://lead-os.example.com",
      });

      assert.equal(bundle.status, "launched");
      assert.equal(bundle.packages.length, new Set(packageSlugs).size);
      assert.equal(bundle.packages.every((pkg) => pkg.credentials.missingRequired.length === 0), true);
      assert.equal(bundle.packages.every((pkg) => pkg.automationContract.requiresAdditionalConfiguration === false), true);
      assert.ok(bundle.valueCase.executiveSummary.includes("launched solution hubs"));
      assert.ok(bundle.valueCase.renewalReasons.length >= 3);
      assert.ok(bundle.customerGuide.operatingWorkflow.length >= 4);
      assert.equal(bundle.packages.every((pkg) => pkg.customerGuide.measurementPlan.length >= 4), true);
      assert.equal(bundle.acceptanceTests.every((test) => test.status === "passed"), true);
      assert.equal(
        bundle.acceptanceTests.some((test) => test.test === "No additional configuration required for delivery"),
        true,
      );
    }
  });

  it("keeps public readiness copy outcome-facing instead of infrastructure-facing", () => {
    const publicCopy = [...deliveredNow, ...notLiveUntilConfigured].join(" ");

    assert.match(publicCopy, /outcome/i);
    assert.match(publicCopy, /Pricing trade-off|Per-seat cannibalization|Work-based pricing|Superhuman-capability/i);
    assert.match(publicCopy, /Moat-powers|AI Seven Powers|System-of-record lock-in|Schlep-blindness/i);
    assert.match(publicCopy, /Binary Test|open-wallet|Customer-segment discovery|Premium-price learning|Complain-but-pay/i);
    assert.match(publicCopy, /client-owned/i);
    assert.doesNotMatch(
      publicCopy,
      /\b(DATABASE_URL|REDIS_URL|STRIPE_SECRET_KEY|STRIPE_WEBHOOK_SECRET|LEAD_OS_ENABLE_LIVE_SENDS|environment variable|API key)\b/i,
    );
  });

  it("fails clearly when a client tries to launch without choosing a solution", () => {
    assert.throws(
      () =>
        provisionPackageBundle({
          packageSlugs: [],
          brandName: "Acme Empty Bundle",
          operatorEmail: "ops@example.com",
          primaryDomain: "https://example.com",
          targetMarket: "SMB operators",
          primaryOffer: "Launch a complete AI solution",
          credentials: outcomeContext,
          appUrl: "https://lead-os.example.com",
        }),
      /At least one solution is required/,
    );
  });

  it("persists provisioned package records for later customer/operator retrieval", async () => {
    _resetPackageProvisioningStoreForTests();
    const provisioned = provisionPackage({
      packageSlug: "agency-client-workspace",
      brandName: "Northstar Agency",
      operatorEmail: "ops@northstar.example",
      primaryDomain: "northstar.example",
      targetMarket: "local service clients",
      primaryOffer: "Launch client lead systems",
      credentials: outcomeContext,
      appUrl: "https://lead-os.example.com",
    });

    const saved = await saveProvisionedPackage(provisioned, "tenant-test");
    const fetched = await getProvisionedPackage(provisioned.launchId, "tenant-test");

    assert.equal(saved.persisted, false);
    assert.ok(fetched);
    assert.equal(fetched.launchId, provisioned.launchId);
    assert.equal(fetched.packageSlug, "agency-client-workspace");
    assert.equal(fetched.tenantId, "tenant-test");
  });
});
