import { publicPlans, type PublicPlanId } from "./public-offer.ts";

export type PackageSlug =
  | "ai-opportunity-audit"
  | "ghost-expert-course-factory"
  | "ai-receptionist-missed-call-recovery"
  | "lead-reactivation-engine"
  | "speed-to-lead-system"
  | "content-repurposing-engine"
  | "ai-ugc-video-ad-studio"
  | "med-spa-growth-engine"
  | "webinar-lead-magnet-factory"
  | "founder-ai-chief-of-staff"
  | "ai-first-business-os"
  | "local-service-lead-engine"
  | "agency-client-workspace"
  | "directory-monetization-system"
  | "saas-trial-conversion-system"
  | "consultant-authority-funnel"
  | "franchise-territory-router"
  | "marketplace-lead-seller-system"
  | "affiliate-partner-revenue-system"
  | "reactivation-retention-system"
  | "operator-control-plane-system"
  | "content-distribution-engine"
  | "revenue-attribution-suite";

export type CredentialFieldType = "text" | "email" | "url" | "password" | "textarea" | "select";

export interface PackageCredentialField {
  key: string;
  label: string;
  type: CredentialFieldType;
  required: boolean;
  helper: string;
  options?: string[];
  sensitive?: boolean;
}

export interface PackageDeliverable {
  id: string;
  title: string;
  createdArtifact: string;
  launchSurface: "workspace" | "capture" | "operator" | "automation" | "billing" | "reporting";
}

export interface ProvisionablePackage {
  slug: PackageSlug;
  title: string;
  planIds: PublicPlanId[];
  customerOutcome: string;
  buyerPersona: string;
  launchPromise: string;
  pricingModel?: string;
  autonomousWorkflow?: string[];
  credentialFields: PackageCredentialField[];
  deliverables: PackageDeliverable[];
}

export const aiAgencyPackageSlugs = [
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
] as const satisfies readonly PackageSlug[];

export const simpleOnboardingFieldKeys = [
  "brandName",
  "operatorEmail",
  "primaryDomain",
  "targetMarket",
  "primaryOffer",
  "idealCustomerProfile",
  "successMetric",
  "currentProcess",
  "fulfillmentConstraints",
  "brandVoice",
  "crmApiKey",
  "stripeSecretKey",
  "webhookUrl",
  "bookingUrl",
  "crmExportUrl",
  "adAccountAccess",
  "sourceAssetUrl",
  "brandAssetsUrl",
  "avatarVoiceConsent",
  "complianceRules",
  "socialAccountAccess",
  "emailCalendarAccess",
  "phoneProviderAccess",
] as const;

const defaultNicheExamples = [
  "local services",
  "professional services",
  "B2B services",
  "creator-led businesses",
  "ecommerce brands",
  "multi-location operators",
];

const packageNicheExamples: Record<PackageSlug, string[]> = {
  "ai-opportunity-audit": ["SMBs", "agencies", "consultancies", "local operators", "startup teams"],
  "ghost-expert-course-factory": ["consultants", "coaches", "clinicians", "attorneys", "B2B experts"],
  "ai-receptionist-missed-call-recovery": ["med spas", "dentists", "HVAC", "roofers", "restaurants"],
  "lead-reactivation-engine": ["med spas", "real estate", "home services", "agencies", "coaches"],
  "speed-to-lead-system": ["law firms", "dental clinics", "real estate", "home services", "B2B SaaS"],
  "content-repurposing-engine": ["creators", "coaches", "consultants", "podcasters", "founders"],
  "ai-ugc-video-ad-studio": ["beauty ecommerce", "skincare", "wellness", "apparel", "consumer products"],
  "med-spa-growth-engine": ["med spas", "aesthetic clinics", "laser clinics", "wellness clinics", "salons"],
  "webinar-lead-magnet-factory": ["B2B SaaS", "agencies", "consultancies", "education brands", "communities"],
  "founder-ai-chief-of-staff": ["solo founders", "creators", "agency owners", "consultants", "executives"],
  "ai-first-business-os": ["SMBs", "startups", "agencies", "operator-led companies", "micro businesses"],
  "local-service-lead-engine": ["roofers", "HVAC", "landscapers", "plumbers", "electricians"],
  "agency-client-workspace": ["marketing agencies", "lead-gen agencies", "consultancies", "fractional CMOs", "operators"],
  "directory-monetization-system": ["local directories", "media sites", "niche directories", "community portals", "review sites"],
  "saas-trial-conversion-system": ["B2B SaaS", "PLG tools", "vertical SaaS", "AI apps", "subscription software"],
  "consultant-authority-funnel": ["consultants", "coaches", "fractional executives", "advisors", "experts"],
  "franchise-territory-router": ["franchises", "multi-location brands", "dealers", "field-service networks", "territory teams"],
  "marketplace-lead-seller-system": ["lead sellers", "pay-per-lead networks", "marketplaces", "agencies", "vertical media"],
  "affiliate-partner-revenue-system": ["affiliate programs", "partner teams", "channel programs", "creator programs", "resellers"],
  "reactivation-retention-system": ["clinics", "gyms", "coaches", "SaaS teams", "service businesses"],
  "operator-control-plane-system": ["agencies", "operators", "internal teams", "AI system owners", "service factories"],
  "content-distribution-engine": ["creators", "B2B marketers", "course sellers", "consultants", "communities"],
  "revenue-attribution-suite": ["agencies", "SaaS teams", "ecommerce brands", "partner programs", "lead sellers"],
};

export interface PackageAutomationContract {
  modular: true;
  fullyAutomated: boolean;
  requiresAdditionalConfiguration: false;
  simpleOnboardingFields: readonly string[];
  nicheExamples: string[];
  deliveryMode: "complete-solution";
}

export type PackageAudienceModel = "B2B" | "B2B2C";

export interface PackageAudienceContract {
  model: PackageAudienceModel;
  buyer: string;
  recipient: string;
  downstreamExperience: string;
  summary: string;
}

export interface PackageOutcomeGraphMoat {
  outcomeGraphMoat: string;
  outcomeGraphEventSchema: string[];
  outcomeGraphDataAssets: string[];
  verticalEvalFlywheel: string;
  certifiedOutcomeStandard: string;
  switchingCostMemory: string;
  packageMarketplaceLoop: string;
  outcomeBillingMoat: string;
  forwardDeployedLearningLoop: string;
  moatProofChecklist: string[];
  moatOperatingRule: string;
}

export interface PackageOutcomeGraphMoatInput {
  title: string;
  customerOutcome: string;
  buyerPersona: string;
  deliverableTitles: string[];
}

export interface PackageServiceReplacementStrategy extends PackageOutcomeGraphMoat {
  servicesBudgetTarget: string;
  targetServiceIndustries: string[];
  serviceReplacementIndustryThesis: string;
  financialAdminServiceMarkets: string[];
  bankingOperationsUseCases: string[];
  healthcareLegalServiceMarkets: string[];
  specializedVerticalMarkets: string[];
  customerSupportLanguageMarkets: string[];
  easiestServiceReplacementIndustries: string[];
  easiestServiceReplacementRationale: string;
  outsourcedOutcomeBudgetSignal: string;
  boringSchlepServiceOpportunity: string;
  fragmentedNonTechnicalReplacementPath: string;
  legalApplicationLayerReplacement: string;
  multilingualSupportReplacementAdvantage: string;
  outsourcedServiceReadiness: string;
  fragmentedNonTechBudgetOpportunity: string;
  highAttritionLaborWedge: string;
  pricingTradeoffSummary: string;
  perSeatCannibalizationTrap: string;
  perSeatLimitedWalletShare: string;
  incumbentPricingCultureResistance: string;
  workBasedPricingOpportunity: string;
  servicesBudgetPricingUpside: string;
  outcomeDrivenLaborAttritionValue: string;
  superhumanCapabilityPricing: string;
  workBasedPricingPilotRisk: string;
  pricingTradeoffMatrix: string[];
  pricingSurvivalRule: string;
  perSeatRisk: string;
  outcomePricing: string;
  walletShareExpansion: string;
  alignedIncentives: string;
  pricingUnits: string[];
  businessProcessAutomationShift: string;
  servicePerformingAutomation: string;
  selfRegulatingAutomationLoop: string;
  taskPricedAutomation: string;
  intelligenceOperatingSystem: string;
  queryableOrganizationModel: string;
  queryableOperatingSystemView: string;
  artifactRichLegibilitySources: string[];
  legibleByDefaultPolicy: string;
  queryableHumanMiddlewareReplacement: string;
  queryableAutonomousCoordination: string;
  queryableHumansAtEdgeRole: string;
  queryableTokenMaxingRule: string;
  artifactRichEnvironment: string;
  transparentCommunicationPolicy: string;
  contextualParityRule: string;
  intelligenceLayerCoordination: string;
  humansAtTheEdgeModel: string;
  sprintPlanningIntelligenceLoop: string;
  closedLoopSystem: string;
  openLoopReplacement: string;
  legibleOrganization: string;
  artifactGenerationPolicy: string;
  comprehensiveContextLayer: string;
  autonomousSprintPlanning: string;
  humanMiddlewareRemoval: string;
  closedLoopVelocityGain: string;
  moatPowerFrameworkSummary: string;
  speedAsPrimaryMoat: string;
  aiSevenPowersFramework: string[];
  processPowerLastTenPercentMoat: string;
  counterpositioningWorkBasedPricingMoat: string;
  switchingCostsDeepIntegrationMoat: string;
  networkEconomyEvalFlywheel: string;
  corneredResourceDataEvalMoat: string;
  scaleEconomiesInfrastructureMoat: string;
  brandingTrustMoat: string;
  schlepBlindnessBoringSpaceMoat: string;
  systemOfRecordDataLockIn: string;
  processPowerMoat: string;
  wrapperCloneMisconception: string;
  accuracyHurdleMoat: string;
  bigLabDrudgeryDefense: string;
  deepBackendLogicMoat: string;
  integrationSurfaceAreaMoat: string;
  customerMintedWorkflow: string;
  processAutomationMoat: string;
  pilotToCoreInfrastructure: string;
  forwardDeployedPosture: string;
  tokenMaxingRule: string;
  tokenMaxingCostShift: string;
  tokenUsageOrgDesign: string;
  managementHierarchyReplacement: string;
  icBuilderOperatorModel: string;
  prototypeFirstMeetingCulture: string;
  driOutcomeOwnershipModel: string;
  onePersonOneOutcomeRule: string;
  driStrategyOutcomeFocus: string;
  driSpecificResultContract: string;
  driNoHierarchyHidingRule: string;
  driMiddleManagementReplacement: string;
  driIntelligenceLayerGuidance: string;
  driEdgeGuidanceRole: string;
  driTokenMaxingLeverage: string;
  driInformationVelocityGuardrail: string;
  aiFounderLeadershipModel: string;
  aiStrategyOwnershipRule: string;
  tokenUsageArchetypeOperatingModel: string;
  humanMiddlewareVelocityGain: string;
  singlePersonAgentLeverage: string;
  leanDepartmentOperatingModel: string;
  organizationalArchetypes: string[];
  aiSoftwareFactory: string;
  softwareFactorySpecContract: string;
  agentIterationLoop: string;
  lastTenPercentReliability: string;
  tddSoftwareFactoryLoop: string;
  scenarioValidationThreshold: string;
  probabilisticReviewGate: string;
  validationDrivenReviewReplacement: string;
  thresholdEvidencePolicy: string;
  zeroHandwrittenCodePosture: string;
  specsOnlyRepositoryGoal: string;
  thousandXEngineerModel: string;
  softwareFactorySpeedMoat: string;
  speedMoatThesis: string;
  speedMoatAgainstLabs: string;
  humanMiddlewareSpeedGain: string;
  queryableSprintCompression: string;
  oneDaySprintCadence: string;
  incumbentCraftOverhead: string;
  legacyOperatingConstraint: string;
  aiNativeFromDayOneAdvantage: string;
  forwardDeployedSpeedLoop: string;
  drudgeryDiscoveryThesis: string;
  forwardDeployedTimeInMotion: string;
  nittyGrittyWorkflowMap: string;
  hiddenLogicDiscovery: string;
  attritionDiscoverySignal: string;
  boringWorkflowSchlepMap: string;
  lossyMiddlewareDiscovery: string;
  fieldResearchTruckStopMethod: string;
  missionCriticalWorkflowFilter: string;
  hackathonReliabilityGap: string;
  existentialPainWorkflowFilter: string;
  specializedEvalMinting: string;
  treasureBeforeLabs: string;
  incumbentCultureReset: string;
  contextEngineeringShift: string;
  evalFlywheel: string;
  domainEdgeCaseDrudgery: string;
  missionCriticalProcessPower: string;
  humanWranglingModel: string;
}

export interface PackageIdeaEvaluationGuardrails {
  problemRealityCheck: string;
  superficialPlausibilityCheck: string;
  technologyFirstTrapWarning: string;
  tarPitRiskCheck: string;
  tarPitResearchProtocol: string[];
  tarPitCategoryWarnings: string[];
  socialCoordinationTarPitWarning: string;
  funDiscoveryTarPitWarning: string;
  abstractSocietalProblemWarning: string;
  lowHitRateIdeaSpaceWarning: string;
  tarPitAvoidanceChecklist: string[];
  hardPartHypothesis: string;
  founderMarketFitCheck: string;
  boringHardCompetitiveAdvantage: string;
  boringSpaceValidationThesis: string;
  physicalObservationSchlepProtocol: string;
  invisiblePainDiscoverySignal: string;
  forwardDeployedWorkflowValidation: string;
  lastTenPercentEdgeCaseValidation: string;
  acutePainCheck: string;
  topThreePriorityTest: string;
  existentialPainTest: string;
  fireOrPromotionAcutenessTest: string;
  fireRiskSignal: string;
  promotionUpsideSignal: string;
  topThreeProblemRequirement: string;
  willingnessToPayAcutenessSignal: string;
  plainSightOpportunitySignal: string;
  pricingBinaryValidationSignal: string;
  pricingBinaryTestDefinition: string;
  openWalletValueSignal: string;
  binaryTestCustomerSegmentSignal: string;
  premiumPriceLearningSignal: string;
  complainButPayValidationSignal: string;
  highAttritionValidationSignal: string;
  alternativeIsNothingTest: string;
  chargeValidationTest: string;
  highValueNeedCategories: string[];
  moatTiming: string;
  pricingDiscipline: string;
}

const baseFields: PackageCredentialField[] = [
  {
    key: "brandName",
    label: "Client brand name",
    type: "text",
    required: true,
    helper: "Used to personalize the finished solution and customer-facing pages.",
  },
  {
    key: "operatorEmail",
    label: "Primary delivery contact",
    type: "email",
    required: true,
    helper: "Receives completion notices, customer-ready links, and outcome reports.",
  },
  {
    key: "primaryDomain",
    label: "Primary domain",
    type: "url",
    required: true,
    helper: "The customer's site or domain where the finished solution should point traffic.",
  },
  {
    key: "targetMarket",
    label: "Target customer segment",
    type: "text",
    required: true,
    helper: "Example: roofing companies in Erie, B2B SaaS founders, local med spas.",
  },
  {
    key: "primaryOffer",
    label: "Outcome the customer wants to sell or achieve",
    type: "textarea",
    required: true,
    helper: "Describe the result this solution should create for the customer's buyers or internal team.",
  },
  {
    key: "idealCustomerProfile",
    label: "Who this solution is for",
    type: "textarea",
    required: true,
    helper: "Describe the buyer, patient, lead, student, client, or internal user who should benefit.",
  },
  {
    key: "successMetric",
    label: "How success should be measured",
    type: "text",
    required: true,
    helper: "Example: booked appointments, recovered revenue, hours saved, content shipped, calls answered.",
  },
  {
    key: "currentProcess",
    label: "How the customer handles this problem today",
    type: "textarea",
    required: true,
    helper: "Explain the current manual process, bottlenecks, missed opportunities, or broken handoffs.",
  },
  {
    key: "fulfillmentConstraints",
    label: "Rules, limits, and approval requirements",
    type: "textarea",
    required: true,
    helper: "Include compliance rules, claims to avoid, human approval points, geography, hours, or service limits.",
  },
  {
    key: "brandVoice",
    label: "Brand voice and customer experience",
    type: "textarea",
    required: true,
    helper: "Describe how the finished solution should sound and feel to customers.",
  },
];

const crmField: PackageCredentialField = {
  key: "crmApiKey",
  label: "CRM or customer list access details",
  type: "textarea",
  required: false,
  helper: "Optional. If omitted, the solution launches with an import-ready customer list and handoff process.",
  sensitive: true,
};

const stripeField: PackageCredentialField = {
  key: "stripeSecretKey",
  label: "Billing or payment account access details",
  type: "textarea",
  required: false,
  helper: "Optional. If omitted, the solution launches with quote, invoice, and payment-handoff instructions.",
  sensitive: true,
};

const webhookField: PackageCredentialField = {
  key: "webhookUrl",
  label: "Where completed lead or outcome notices should be sent",
  type: "url",
  required: false,
  helper: "Optional destination for lead notices, status changes, and outcome updates.",
};

const calendarField: PackageCredentialField = {
  key: "bookingUrl",
  label: "Booking calendar link",
  type: "url",
  required: false,
  helper: "Optional. If omitted, the solution launches with a qualified-lead handoff and booking instructions.",
};

const crmExportField: PackageCredentialField = {
  key: "crmExportUrl",
  label: "Customer list, old lead list, or CRM export",
  type: "url",
  required: false,
  helper: "Optional. If omitted, the solution launches with an import-ready list template and reactivation plan.",
  sensitive: true,
};

const adAccountField: PackageCredentialField = {
  key: "adAccountAccess",
  label: "Ad account, campaign, or performance context",
  type: "textarea",
  required: false,
  helper: "Optional. Include past ads, spend, winners, losers, or reporting access if available.",
  sensitive: true,
};

const contentSourceField: PackageCredentialField = {
  key: "sourceAssetUrl",
  label: "Source material for the solution",
  type: "url",
  required: false,
  helper: "Optional video, webinar, podcast, document, notes, product page, or prior training material.",
};

const brandAssetsField: PackageCredentialField = {
  key: "brandAssetsUrl",
  label: "Brand assets and examples",
  type: "url",
  required: false,
  helper: "Logo, colors, fonts, product images, examples, and visual references.",
};

const consentField: PackageCredentialField = {
  key: "avatarVoiceConsent",
  label: "Avatar or voice consent confirmation",
  type: "select",
  required: true,
  helper: "Required for avatar, voice, or likeness generation. Select not-applicable when no likeness is produced.",
  options: ["approved", "not-applicable"],
};

const complianceField: PackageCredentialField = {
  key: "complianceRules",
  label: "Additional compliance or claims rules",
  type: "textarea",
  required: false,
  helper: "Medical, financial, legal, ad-platform, privacy, claim-substantiation, or brand restrictions.",
};

const socialAccessField: PackageCredentialField = {
  key: "socialAccountAccess",
  label: "Social publishing or approval context",
  type: "textarea",
  required: false,
  helper: "Optional. Include approval rules, target platforms, publishing cadence, or scheduler access.",
  sensitive: true,
};

const emailCalendarAccessField: PackageCredentialField = {
  key: "emailCalendarAccess",
  label: "Inbox, calendar, and task process details",
  type: "textarea",
  required: false,
  helper: "Optional. Include delegation rules, recurring meetings, task systems, and follow-up preferences.",
  sensitive: true,
};

const voicePhoneField: PackageCredentialField = {
  key: "phoneProviderAccess",
  label: "Phone, SMS, and call-routing details",
  type: "textarea",
  required: false,
  helper: "Optional. Include numbers, call-forwarding rules, SMS preferences, and escalation contacts.",
  sensitive: true,
};

function deliverables(prefix: string, items: Array<[string, string, PackageDeliverable["launchSurface"]]>): PackageDeliverable[] {
  return items.map(([title, createdArtifact, launchSurface], index) => ({
    id: `${prefix}-${index + 1}`,
    title,
    createdArtifact,
    launchSurface,
  }));
}

export const provisionablePackages: ProvisionablePackage[] = [
  {
    slug: "ai-opportunity-audit",
    title: "AI opportunity audit",
    planIds: ["whitelabel-starter", "whitelabel-growth", "whitelabel-enterprise"],
    buyerPersona: "SMBs, founders, agencies, and operators who know AI matters but do not know what to install first.",
    customerOutcome: "Get a concrete AI implementation roadmap that shows where AI will save time, recover revenue, or reduce operating risk.",
    launchPromise: "A finished AI opportunity report with maturity score, process map, prioritized solution backlog, ROI estimates, and 30-day rollout plan.",
    pricingModel: "$500-$15,000 audit depending on company size; upgrades into implementation packages.",
    autonomousWorkflow: [
      "Audit Agent collects business model, departments, pain points, goals, constraints, and success metrics.",
      "Process Mapping Agent converts inputs into sales, marketing, delivery, admin, finance, and support workflows.",
      "Opportunity Agent scores each workflow by ROI, complexity, risk, and time-to-value.",
      "Roadmap Agent produces a 30-day install plan with quick wins and high-ticket follow-on packages.",
    ],
    credentialFields: [...baseFields, webhookField],
    deliverables: deliverables("ai-audit", [
      ["AI maturity score", "Scored assessment of current AI usage, data readiness, operational leverage, and outcome potential.", "reporting"],
      ["Department workflow map", "Sales, marketing, delivery, admin, support, finance, and leadership process inventory.", "workspace"],
      ["Solution opportunity backlog", "Prioritized list of outcome improvements ranked by revenue impact, hours saved, complexity, and risk.", "automation"],
      ["ROI estimate table", "Plain-language estimate of hours saved, revenue recovered, risk reduced, and monthly value.", "reporting"],
      ["Recommended implementation plan", "Step-by-step solution plan mapped to the customer's current systems and constraints.", "workspace"],
      ["30-day implementation roadmap", "Week-by-week plan for the first workflow installs and owner responsibilities.", "operator"],
      ["Risk and compliance notes", "Data, claims, approval, privacy, and human-review requirements for AI deployment.", "workspace"],
      ["Upgrade path", "Recommended next package: receptionist, reactivation, content engine, chief of staff, or AI-first OS.", "operator"],
    ]),
  },
  {
    slug: "ghost-expert-course-factory",
    title: "Ghost expert course factory",
    planIds: ["whitelabel-growth", "whitelabel-enterprise"],
    buyerPersona: "Experts, consultants, coaches, educators, and regulated professionals with valuable expertise but no finished course.",
    customerOutcome: "Turn trapped expertise into a finished branded course without the expert writing scripts or performing on camera.",
    launchPromise: "A finished course-production solution with knowledge extraction, curriculum, scripts, avatar-ready modules, workbook, launch copy, and QA.",
    pricingModel: "$5,000-$40,000 per course; $2,000-$8,000 per language localization; $1,000-$5,000/month updates.",
    autonomousWorkflow: [
      "Knowledge Extraction Agent interviews the expert module-by-module from voice notes or calls.",
      "Curriculum Agent turns raw expertise into modules, lessons, outcomes, exercises, and edge cases.",
      "Teaching Polish Agent adds pacing, pauses, examples, emphasis, and plain-language transitions.",
      "Production Agent prepares avatar/video scripts, branded backgrounds, workbook, sales page, and launch emails.",
    ],
    credentialFields: [...baseFields, consentField, contentSourceField, brandAssetsField, complianceField, webhookField],
    deliverables: deliverables("ghost-course", [
      ["Expert intake interview map", "Question set that extracts tacit knowledge, examples, mistakes, objections, and edge cases.", "workspace"],
      ["Course architecture", "Promise, learner profile, modules, lesson outcomes, sequencing, and completion criteria.", "workspace"],
      ["Polished lesson scripts", "Avatar-ready scripts with teaching rhythm, emphasis notes, pauses, and human-sounding phrasing.", "automation"],
      ["Avatar production brief", "Consent status, visual style, backgrounds, icon system, and video rendering checklist.", "automation"],
      ["Workbook and exercises", "Lesson summaries, worksheets, action steps, checklists, and student implementation prompts.", "workspace"],
      ["Course sales page copy", "Headline, promise, audience, modules, proof blocks, offer stack, FAQs, and CTA copy.", "capture"],
      ["Launch email sequence", "Announcement, value, objection, proof, deadline, and enrollment emails.", "automation"],
      ["Course QA report", "Checks for module completeness, claim risk, missing examples, learning outcomes, and handoff readiness.", "reporting"],
    ]),
  },
  {
    slug: "ai-receptionist-missed-call-recovery",
    title: "AI receptionist and missed-call recovery",
    planIds: ["whitelabel-growth", "whitelabel-enterprise"],
    buyerPersona: "Med spas, dentists, HVAC, roofers, salons, restaurants, clinics, and appointment-heavy local businesses.",
    customerOutcome: "Recover missed calls, answer common questions, qualify callers, and book appointments 24/7.",
    launchPromise: "A complete missed-call recovery solution with business knowledge base, call flows, booking handoff, transcript log, SMS fallback, and monitoring.",
    pricingModel: "$2,000-$15,000 setup plus $400-$3,000/month; usage billed to the customer.",
    autonomousWorkflow: [
      "Voice Intake Agent collects services, hours, prices, FAQs, booking rules, and escalation contacts.",
      "Conversation Designer Agent creates answer, qualify, book, transfer, spam-filter, and fallback flows.",
      "Test Call Agent simulates appointment, price, emergency, objection, spam, and escalation scenarios.",
      "Monitoring Agent reviews transcripts and proposes script improvements weekly.",
    ],
    credentialFields: [...baseFields, calendarField, voicePhoneField, crmField, complianceField, webhookField],
    deliverables: deliverables("ai-receptionist", [
      ["Business knowledge base", "Structured services, pricing, hours, location, policies, FAQs, and disallowed answers.", "workspace"],
      ["Inbound call script", "Greeting, qualification, FAQ, booking, transfer, and fallback call flow.", "automation"],
      ["Booking handoff", "Calendar routing logic with confirmation and unavailable-slot fallback.", "operator"],
      ["Missed-call SMS recovery", "Prepared SMS sequence for callers who disconnect or cannot complete booking.", "automation"],
      ["Human escalation rules", "Urgent, sensitive, angry, medical/legal, and high-value caller transfer logic.", "operator"],
      ["Call transcript dashboard", "Call summary, lead details, intent, booking state, and next action view.", "reporting"],
      ["Test call suite", "Acceptance scenarios for common questions, booking, spam, escalation, and off-hours calls.", "workspace"],
      ["Optimization report", "Weekly improvement checklist for unanswered questions, drop-offs, and booking failures.", "reporting"],
    ]),
  },
  {
    slug: "lead-reactivation-engine",
    title: "Lead reactivation engine",
    planIds: ["whitelabel-growth", "whitelabel-enterprise"],
    buyerPersona: "Businesses with dormant CRM leads, old inquiries, stale quotes, abandoned consults, or past customers.",
    customerOutcome: "Turn leads the business already paid for into booked appointments and recovered pipeline.",
    launchPromise: "A complete lead reactivation solution with list cleanup, segments, SMS/email/call sequences, reply handling, booking, and ROI reporting.",
    pricingModel: "$3,000-$15,000 setup or $50-$300 per booked appointment; optional $1,000-$5,000/month optimization.",
    autonomousWorkflow: [
      "CRM Audit Agent cleans, deduplicates, suppresses, and segments the old list.",
      "Offer Agent creates reactivation angles from the customer's service, promotion, and lead history.",
      "Reply Agent classifies yes, no, later, question, objection, complaint, unsubscribe, and booked states.",
      "Booking Agent schedules qualified leads and updates the outcome dashboard.",
    ],
    credentialFields: [...baseFields, crmExportField, calendarField, crmField, voicePhoneField, complianceField, webhookField],
    deliverables: deliverables("lead-reactivation", [
      ["CRM cleanup plan", "Import, dedupe, suppression, stale-record, missing-field, and segment readiness report.", "workspace"],
      ["Dormant lead segments", "Buckets for no-show, old inquiry, abandoned quote, past customer, churn risk, and high-value lead.", "operator"],
      ["Reactivation offer map", "Offer angles for check-in, reopened quote, limited slots, new package, and past-customer winback.", "workspace"],
      ["SMS/email sequence", "Multi-touch reactivation messages with compliance-safe opt-out and reply routing.", "automation"],
      ["AI reply classifier", "Rules for reply categories, booking intent, objections, and human handoff.", "automation"],
      ["Booked appointment flow", "Calendar handoff, confirmation message, CRM status update, and no-show recovery.", "operator"],
      ["Recovered revenue dashboard", "Leads contacted, replies, booked appointments, pipeline value, and estimated recovered revenue.", "reporting"],
      ["Suppression and consent log", "Do-not-contact, unsubscribe, duplicate, invalid, and sensitive-contact handling.", "reporting"],
    ]),
  },
  {
    slug: "speed-to-lead-system",
    title: "Speed-to-lead system",
    planIds: ["whitelabel-growth", "whitelabel-enterprise"],
    buyerPersona: "Businesses running paid ads, landing pages, form fills, quote requests, demos, or booking funnels.",
    customerOutcome: "Contact every new lead within 60 seconds so competitors do not win the conversation first.",
    launchPromise: "A complete speed-to-lead solution with instant intake, SMS/email/voice follow-up, qualification, booking, CRM update, and SLA reporting.",
    pricingModel: "$3,000-$10,000 setup plus about 20% monthly retainer.",
    autonomousWorkflow: [
      "Webhook Agent captures every ad, landing-page, form, or chat lead event.",
      "Qualification Agent scores fit, urgency, budget, timeline, and service interest.",
      "Voice/SMS Agent responds immediately with approved scripts and fallback handling.",
      "SLA Reporting Agent tracks time-to-first-touch, booked calls, and conversion movement.",
    ],
    credentialFields: [...baseFields, calendarField, crmField, voicePhoneField, adAccountField, webhookField],
    deliverables: deliverables("speed-lead", [
      ["Lead capture webhook", "Endpoint and payload schema for Meta, Google, landing pages, and quote forms.", "automation"],
      ["Instant response script", "Approved SMS, email, and optional voice script triggered immediately after lead submission.", "automation"],
      ["Lead qualification flow", "Question set and score rules for fit, urgency, budget, timeline, and route.", "capture"],
      ["Booking route", "Calendar handoff with rep routing, fallback, reminders, and confirmation states.", "operator"],
      ["CRM pipeline update", "Field map for new, contacted, qualified, booked, no-response, and nurture stages.", "automation"],
      ["Sales rep alert", "Internal alert template with lead context, score, source, and next action.", "operator"],
      ["Follow-up sequence", "No-response and later-interest follow-up messages with stop conditions.", "automation"],
      ["Speed-to-lead dashboard", "Time-to-first-touch, contacted count, booked count, source, and SLA miss report.", "reporting"],
    ]),
  },
  {
    slug: "content-repurposing-engine",
    title: "AI content repurposing engine",
    planIds: ["whitelabel-starter", "whitelabel-growth", "whitelabel-enterprise"],
    buyerPersona: "Creators, consultants, coaches, founders, podcasters, agencies, and expert-led businesses.",
    customerOutcome: "Turn one source asset into a full month of platform-native content without asking the customer to create more.",
    launchPromise: "A complete content repurposing solution with transcript extraction, idea mining, posts, newsletters, blogs, carousels, captions, calendar, and approvals.",
    pricingModel: "$1,500-$8,000/month; premium creator packages can exceed $10,000/month.",
    autonomousWorkflow: [
      "Transcript Agent extracts source material from videos, calls, podcasts, or documents.",
      "Insight Agent identifies hooks, frameworks, stories, claims, and quotable moments.",
      "Platform Agent adapts content for LinkedIn, X, Instagram, YouTube, newsletter, and blog formats.",
      "Scheduler Agent prepares an approval queue and publishing calendar.",
    ],
    credentialFields: [...baseFields, contentSourceField, brandAssetsField, socialAccessField, complianceField, webhookField],
    deliverables: deliverables("content-repurpose", [
      ["Source transcript and idea map", "Clean transcript with hooks, frameworks, stories, quotes, and content pillars extracted.", "workspace"],
      ["LinkedIn/X post pack", "Platform-native text posts with hooks, proof, CTA, and audience-specific framing.", "workspace"],
      ["Newsletter and blog drafts", "Longer-form assets derived from the same source with subject lines and SEO titles.", "workspace"],
      ["Short-form clip plan", "Clip timestamps, hooks, titles, captions, and visual notes for Shorts/Reels/TikTok.", "workspace"],
      ["Carousel copy", "Slide-by-slide carousel copy with headline, proof, lesson, and CTA structure.", "workspace"],
      ["Publishing calendar", "30-day calendar with platform, asset, CTA, and approval status.", "operator"],
      ["Approval queue", "Client-ready review board showing approved, revise, rejected, and scheduled assets.", "operator"],
      ["Performance report", "Engagement, followers, clicks, leads, top themes, and next-month content recommendations.", "reporting"],
    ]),
  },
  {
    slug: "ai-ugc-video-ad-studio",
    title: "AI UGC and video ad studio",
    planIds: ["whitelabel-growth", "whitelabel-enterprise"],
    buyerPersona: "Ecommerce, beauty, skincare, wellness, product, and paid-media brands that need constant creative testing.",
    customerOutcome: "Create high-volume product ad creative faster and cheaper than traditional UGC production.",
    launchPromise: "A complete ad-creative solution with product research, review mining, hooks, scripts, AI UGC briefs, static ads, compliance checks, and testing plan.",
    pricingModel: "$1,500-$5,000/month or $100-$300 per creative; $3,000-$10,000/month with ad management.",
    autonomousWorkflow: [
      "Research Agent mines reviews, Reddit, comments, competitor formats, and customer language.",
      "Hook Agent finds unusual, non-commodity customer phrasing for creative differentiation.",
      "Script Agent writes UGC scripts, product demos, testimonials-style disclaimers, and static ad copy.",
      "Compliance Agent blocks fake endorsements, unsupported claims, and platform-risky copy.",
    ],
    credentialFields: [...baseFields, brandAssetsField, adAccountField, socialAccessField, complianceField, webhookField],
    deliverables: deliverables("ugc-studio", [
      ["Product and audience brief", "Product promise, audience pain, objections, proof, claim limits, and creative guardrails.", "workspace"],
      ["Review and Reddit language mine", "Customer phrases, pains, desired outcomes, objections, and surprising hook material.", "workspace"],
      ["Hook library", "Angles for problem, benefit, objection, social proof, comparison, demo, and curiosity creatives.", "workspace"],
      ["UGC script pack", "Short-form scripts with opening hook, product moment, proof, CTA, and platform notes.", "workspace"],
      ["AI video production brief", "Avatar/scene/product-shot prompts, shot list, voice notes, and export specs.", "automation"],
      ["Static ad concepts", "Image ad directions, copy variants, headline variants, and CTA variants.", "workspace"],
      ["Creative testing matrix", "Variant map by hook, format, audience, product angle, and hypothesis.", "reporting"],
      ["Compliance and claims report", "Unsupported claims, synthetic endorsement warnings, disclosure notes, and revision requirements.", "reporting"],
    ]),
  },
  {
    slug: "med-spa-growth-engine",
    title: "Med spa growth engine",
    planIds: ["whitelabel-growth", "whitelabel-enterprise"],
    buyerPersona: "Med spas and aesthetic clinics selling high-value services like Botox, laser hair removal, body contouring, and weight-loss treatments.",
    customerOutcome: "Generate more booked consultations through AI-powered ad creative, Google Business Profile optimization, reviews, and local attribution.",
    launchPromise: "A med-spa-specific growth solution with ad creative, local SEO checklist, review engine, directory citations, and lead dashboard.",
    pricingModel: "$2,000-$3,000/month for creative/local SEO; higher when paid media management is included.",
    autonomousWorkflow: [
      "Local Audit Agent checks Google Business Profile, keywords, photos, reviews, service categories, and citation consistency.",
      "Creative Research Agent extracts med spa service pains, benefits, objections, and before/after-safe language.",
      "Ad Agent creates monthly static/video creative briefs and copy variants.",
      "Reporting Agent tracks calls, form fills, consultation requests, and source-level ROI.",
    ],
    credentialFields: [...baseFields, brandAssetsField, adAccountField, calendarField, complianceField, webhookField],
    deliverables: deliverables("med-spa-growth", [
      ["Google Business Profile audit", "Keyword, category, review, photo, service, post, Q&A, and map-pack readiness report.", "reporting"],
      ["Review-generation flow", "Review request sequence, QR/link handoff, internal owner instructions, and response templates.", "automation"],
      ["Local citation package", "Name, address, phone, category, description, and directory submission checklist.", "workspace"],
      ["Monthly ad creative pack", "Ten ad concepts with hooks, copy, visual direction, CTA, and service-specific angle.", "workspace"],
      ["Service pain-point research", "Botox, laser, body contouring, weight-loss, and skin-treatment customer language map.", "workspace"],
      ["Consultation capture funnel", "Lead page and qualification questions for med spa consultations.", "capture"],
      ["Lead and booking dashboard", "Calls, forms, qualified leads, booked consultations, and estimated treatment value.", "reporting"],
      ["Compliance-safe claims checklist", "Before/after, medical claim, pricing, guarantee, testimonial, and ad-platform constraints.", "operator"],
    ]),
  },
  {
    slug: "webinar-lead-magnet-factory",
    title: "Webinar lead magnet factory",
    planIds: ["whitelabel-starter", "whitelabel-growth", "whitelabel-enterprise"],
    buyerPersona: "B2B companies, SaaS teams, agencies, consultants, and education businesses with webinars or recorded trainings.",
    customerOutcome: "Turn existing webinars into lead magnets that generate new subscribers, sales calls, and pipeline.",
    launchPromise: "A complete webinar-to-lead-magnet solution with transcript, ebook, checklist, LinkedIn posts, landing copy, nurture emails, and opt-in tracking.",
    pricingModel: "$750-$1,500 per asset or $2,000-$8,000/month for recurring webinar repurposing.",
    autonomousWorkflow: [
      "Transcript Agent processes the webinar and extracts frameworks, examples, claims, and CTAs.",
      "Lead Magnet Agent turns the content into ebook, checklist, white paper, and landing-page assets.",
      "Distribution Agent writes LinkedIn, email, and comment-to-get promotion copy.",
      "Analytics Agent tracks opt-ins, registrations, and content reuse.",
    ],
    credentialFields: [...baseFields, contentSourceField, brandAssetsField, webhookField],
    deliverables: deliverables("webinar-magnet", [
      ["Webinar transcript", "Clean transcript with sections, speaker notes, examples, and key teaching points.", "workspace"],
      ["Branded lead magnet", "Ebook, checklist, white paper, or guide created from the webinar content.", "workspace"],
      ["Landing page copy", "Headline, promise, bullets, preview, opt-in form copy, and CTA for the lead magnet.", "capture"],
      ["Email nurture sequence", "Delivery, value, objection, case study, and sales-action follow-up emails.", "automation"],
      ["LinkedIn promo pack", "Comment-to-get post, carousel outline, text posts, and DM follow-up copy.", "workspace"],
      ["Repurposed article", "Search-friendly article or summary that points readers to the lead magnet.", "workspace"],
      ["Opt-in tracking view", "Lead magnet downloads, source, conversion rate, and influenced pipeline fields.", "reporting"],
      ["Reuse inventory", "Map of webinar sections converted into assets and remaining material for future content.", "operator"],
    ]),
  },
  {
    slug: "founder-ai-chief-of-staff",
    title: "Founder AI chief of staff",
    planIds: ["whitelabel-growth", "whitelabel-enterprise"],
    buyerPersona: "Busy founders, creators, executives, small teams, and operators drowning in admin, inbox, CRM, and reporting work.",
    customerOutcome: "Save 10-20 hours per week with an AI assistant that actually does follow-up, triage, summaries, and business-health reporting.",
    launchPromise: "A complete founder operations solution with inbox rules, calendar support, stale-lead alerts, dashboards, daily brief, and weekly executive summary.",
    pricingModel: "$2,000-$10,000 setup plus $1,000-$5,000/month.",
    autonomousWorkflow: [
      "Founder Intake Agent maps priorities, communications, escalation rules, recurring decisions, and desired time savings.",
      "Inbox Agent triages urgent, reply-needed, delegate, wait, and archive messages.",
      "CRM Agent identifies stale leads, at-risk deals, and follow-up opportunities.",
      "Briefing Agent produces daily priorities and weekly executive summaries.",
    ],
    credentialFields: [...baseFields, emailCalendarAccessField, crmField, socialAccessField, complianceField, webhookField],
    deliverables: deliverables("founder-chief", [
      ["Founder operating profile", "Priorities, communication style, escalation rules, decision preferences, and protected-time rules.", "workspace"],
      ["Inbox triage rules", "Urgent, reply-needed, delegate, wait, archive, sales, support, finance, and personal categories.", "automation"],
      ["Calendar support workflow", "Scheduling, prep notes, reminders, follow-ups, and conflict handling.", "automation"],
      ["CRM stale-lead monitor", "At-risk leads, overdue follow-ups, next-step suggestions, and owner notifications.", "operator"],
      ["Daily priority brief", "Morning summary of urgent items, calendar, blocked decisions, follow-ups, and recommended actions.", "reporting"],
      ["Weekly executive dashboard", "Sales, support, content, operations, risk, and open-loop summary.", "reporting"],
      ["Task routing workflow", "Rules for creating tasks, assigning owners, due dates, and follow-up checks.", "automation"],
      ["Permission and safety rules", "Actions allowed automatically, actions requiring approval, and actions never allowed.", "operator"],
    ]),
  },
  {
    slug: "ai-first-business-os",
    title: "AI-first business OS",
    planIds: ["whitelabel-enterprise"],
    buyerPersona: "SMBs, startups, agencies, and operators ready for an installed AI-first operating system with ongoing optimization.",
    customerOutcome: "Rebuild repetitive business operations into an AI-agent-operated system that frees founder and team bandwidth.",
    launchPromise: "A complete AI-first operating-system solution with business brain, department map, agents, skills, data handoffs, dashboards, QA, and optimization cadence.",
    pricingModel: "$5,000-$15,000 setup plus $2,000-$4,000/month for micro/SMB; higher for larger companies.",
    autonomousWorkflow: [
      "Audit Agent reviews company context, processes, meetings, docs, bottlenecks, and desired outcomes.",
      "Business Brain Agent creates reusable company context for every department agent.",
      "Department Agent builds marketing, sales, delivery, admin, finance, and support operating layers.",
      "Skill Agent installs reusable workflows for lead gen, content, onboarding, reporting, follow-up, and fulfillment.",
    ],
    credentialFields: [...baseFields, emailCalendarAccessField, crmField, stripeField, socialAccessField, webhookField],
    deliverables: deliverables("ai-first-os", [
      ["Business brain", "Company profile, offers, customers, constraints, tone, process rules, and source-of-truth map.", "workspace"],
      ["Department architecture", "Marketing, sales, delivery, admin, finance, support, and leadership agent responsibilities.", "workspace"],
      ["Agent roster", "Named agents with responsibilities, permissions, inputs, outputs, and review requirements.", "operator"],
      ["Reusable skill library", "Lead generation, content, onboarding, reporting, follow-up, fulfillment, and QA skill definitions.", "automation"],
      ["Data handoff plan", "Stripe, CRM, calendar, email, documents, transcripts, Slack, analytics, and warehouse handoff map.", "automation"],
      ["Operating dashboards", "Revenue, leads, delivery, support, bottlenecks, tasks, and AI execution visibility.", "reporting"],
      ["QA and approval gates", "Acceptance tests, human approval points, risk thresholds, rollback, and audit log requirements.", "operator"],
      ["Monthly optimization cadence", "Review loop for performance, failures, new skills, prompt updates, and workflow improvements.", "reporting"],
    ]),
  },
  {
    slug: "local-service-lead-engine",
    title: "Local service lead engine",
    planIds: ["whitelabel-starter", "whitelabel-growth", "whitelabel-enterprise"],
    buyerPersona: "Local service businesses and agencies selling local lead generation.",
    customerOutcome: "Capture urgent local service demand, qualify it, route it, and prove source-level ROI.",
    launchPromise: "A launched local lead capture workspace with intake, scoring, follow-up, embed code, and operator view.",
    credentialFields: [...baseFields, calendarField, crmField, webhookField],
    deliverables: deliverables("local", [
      ["Hosted lead capture page", "Public capture page with offer, form, routing metadata, and thank-you state.", "capture"],
      ["Embeddable website widget", "Script tag and iframe-ready capture surface for the customer domain.", "capture"],
      ["Urgency scoring model", "Signal map for quote intent, booking intent, phone presence, and time sensitivity.", "automation"],
      ["Service routing rules", "Rules that route by service requested, urgency, and contact completeness.", "automation"],
      ["Five-touch nurture sequence", "Email/SMS-ready follow-up plan for unbooked leads.", "automation"],
      ["Booking handoff", "Calendar handoff block with fallback instructions when no booking URL is present.", "operator"],
      ["Local attribution table", "UTM and source table showing raw leads, qualified leads, and pipeline value.", "reporting"],
      ["Operator dashboard view", "Workspace status, lead counts, routing status, and activation checklist.", "operator"],
      ["Launch QA checklist", "Acceptance tests for capture, scoring, routing, embed, and notification readiness.", "workspace"],
    ]),
  },
  {
    slug: "agency-client-workspace",
    title: "Agency client workspace",
    planIds: ["whitelabel-starter", "whitelabel-growth", "whitelabel-enterprise"],
    buyerPersona: "Agencies launching client-facing lead systems.",
    customerOutcome: "Create a client workspace that an agency can brand, operate, and report from.",
    launchPromise: "A branded client workspace with capture, dashboard, reporting, credentials checklist, and client-ready handoff.",
    credentialFields: [...baseFields, crmField, webhookField],
    deliverables: deliverables("agency", [
      ["Client workspace shell", "Branded client workspace with plan, market, offer, and operator details.", "workspace"],
      ["Client capture funnel", "Lead capture page and embed configuration scoped to the client.", "capture"],
      ["Client routing policy", "Rules for quote, booking, support, and nurture handoff.", "automation"],
      ["Agency operator dashboard", "Single view of client status, readiness, and lead flow.", "operator"],
      ["Client report template", "Weekly performance report structure with source and ROI sections.", "reporting"],
      ["White-label handoff page", "Customer-facing launch page that explains exactly what was built.", "workspace"],
      ["Credential checklist", "CRM, email, domain, webhook, and billing connection requirements.", "operator"],
      ["Acceptance test pack", "Runnable checklist for form capture, scoring, routing, and dashboard verification.", "workspace"],
    ]),
  },
  {
    slug: "directory-monetization-system",
    title: "Directory monetization system",
    planIds: ["whitelabel-growth", "whitelabel-enterprise"],
    buyerPersona: "Directory owners and local media operators.",
    customerOutcome: "Turn directory traffic into routed, monetizable lead demand.",
    launchPromise: "A category-based directory intake system with buyer routing, source tracking, and monetization surfaces.",
    credentialFields: [...baseFields, stripeField, webhookField],
    deliverables: deliverables("directory", [
      ["Category intake page", "Lead capture surface grouped by category, location, and urgency.", "capture"],
      ["Buyer routing matrix", "Routing table for buyer category, service area, and exclusivity status.", "automation"],
      ["Claimable lead inventory", "Public sample inventory and operator inventory table.", "operator"],
      ["Lead pricing table", "Price bands by category, urgency, and exclusivity.", "billing"],
      ["Buyer onboarding form", "Credential and service-area form for new lead buyers.", "capture"],
      ["Attribution report", "Source, category, qualified count, and revenue table.", "reporting"],
      ["Exclusivity rules", "Territory and buyer lockout logic documented for operators.", "automation"],
      ["Revenue ledger view", "Revenue summary for claimed, pending, refunded, and closed leads.", "reporting"],
    ]),
  },
  {
    slug: "saas-trial-conversion-system",
    title: "SaaS trial conversion system",
    planIds: ["whitelabel-growth", "whitelabel-enterprise"],
    buyerPersona: "SaaS founders and product-led growth teams.",
    customerOutcome: "Convert trial users by routing activation signals into nudges, demos, and revenue events.",
    launchPromise: "A trial conversion workspace with onboarding events, scoring, lifecycle nudges, and revenue attribution.",
    credentialFields: [...baseFields, stripeField, webhookField],
    deliverables: deliverables("saas", [
      ["Trial intake form", "Signup qualification form tied to company size, use case, and urgency.", "capture"],
      ["Activation event map", "Tracked milestones for signup, setup, usage, invite, and billing intent.", "automation"],
      ["Trial scoring model", "Fit, intent, engagement, and urgency score configuration.", "automation"],
      ["Lifecycle email sequence", "Activation, rescue, proof, demo, and close-loop messages.", "automation"],
      ["Demo routing policy", "Rules for demo-ready users, product-qualified accounts, and nurture users.", "automation"],
      ["Subscription handoff", "Stripe-ready checkout and lifecycle requirement checklist.", "billing"],
      ["Trial ROI dashboard", "Trial source, activation rate, qualified accounts, and pipeline value.", "reporting"],
      ["Operator playbook", "Daily actions for stuck, hot, expanding, and at-risk trials.", "operator"],
    ]),
  },
  {
    slug: "consultant-authority-funnel",
    title: "Consultant authority funnel",
    planIds: ["whitelabel-starter", "whitelabel-growth", "whitelabel-enterprise"],
    buyerPersona: "Consultants, experts, coaches, and service providers.",
    customerOutcome: "Qualify prospects before they book and give the consultant a complete authority funnel.",
    launchPromise: "A launched authority intake, qualification path, nurture sequence, booking handoff, and operator summary.",
    credentialFields: [...baseFields, calendarField, webhookField],
    deliverables: deliverables("consultant", [
      ["Authority landing page", "Offer-led capture page with problem, outcome, and qualification form.", "capture"],
      ["Prospect qualifier", "Question set that captures budget, urgency, problem, and fit.", "capture"],
      ["Booking handoff", "Qualified lead path to booking URL with fallback operator notification.", "operator"],
      ["Proof sequence", "Follow-up sequence using proof, objection handling, and close-loop prompts.", "automation"],
      ["Lead brief", "Operator-ready summary of the prospect's pain, desired outcome, and next action.", "operator"],
      ["Qualification scoring", "Score rules for urgency, fit, authority, budget, and timeline.", "automation"],
      ["Consulting pipeline board", "New, qualified, booked, proposal, won, and nurture stages.", "operator"],
      ["Proposal trigger", "Structured handoff for proposal or contract generation after qualification.", "automation"],
    ]),
  },
  {
    slug: "franchise-territory-router",
    title: "Franchise territory router",
    planIds: ["whitelabel-enterprise"],
    buyerPersona: "Franchises, territory operators, and multi-location brands.",
    customerOutcome: "Route leads to the right territory while keeping brand-level visibility.",
    launchPromise: "A territory-aware capture and routing system with operator controls and territory reporting.",
    credentialFields: [...baseFields, crmField, webhookField],
    deliverables: deliverables("franchise", [
      ["Territory intake page", "Capture form that accepts location, service, urgency, and contact information.", "capture"],
      ["Territory routing matrix", "Routing rules by ZIP, city, state, territory owner, and fallback.", "automation"],
      ["Brand operator dashboard", "Brand-level status across territories and production readiness.", "operator"],
      ["Location operator view", "Territory-specific lead and routing summary.", "operator"],
      ["Conflict resolution rules", "Rules for overlapping territories, overflow, and unavailable owners.", "automation"],
      ["Territory attribution report", "Source and revenue view by territory and market.", "reporting"],
      ["SLA monitor", "Response-time targets and overdue handoff indicators.", "operator"],
      ["Franchise launch checklist", "Credential, domain, CRM, routing, and notification requirements.", "workspace"],
    ]),
  },
  {
    slug: "marketplace-lead-seller-system",
    title: "Marketplace lead seller system",
    planIds: ["whitelabel-enterprise"],
    buyerPersona: "Lead sellers and pay-per-lead marketplace operators.",
    customerOutcome: "Package qualified leads into buyer-ready inventory with pricing, claim, and outcome tracking.",
    launchPromise: "A launched marketplace surface with inventory, buyer claim flow, pricing logic, and revenue tracking.",
    credentialFields: [...baseFields, stripeField, webhookField],
    deliverables: deliverables("marketplace", [
      ["Lead inventory board", "Buyer-facing inventory cards with score, category, market, and price.", "operator"],
      ["Buyer claim flow", "Claim action model with payment and routing requirements.", "billing"],
      ["Lead quality scoring", "Score rubric for lead freshness, intent, fit, and contact completeness.", "automation"],
      ["Pricing engine setup", "Price bands by quality, category, market, and exclusivity.", "billing"],
      ["Buyer onboarding", "Buyer profile, categories, territories, caps, and webhook destination.", "capture"],
      ["Outcome reporting", "Accepted, rejected, contacted, booked, won, and refunded statuses.", "reporting"],
      ["Revenue summary", "Gross revenue, refunds, net revenue, and buyer performance.", "reporting"],
      ["Compliance notes", "Consent, resale, suppression, and audit requirements for operators.", "workspace"],
    ]),
  },
  {
    slug: "affiliate-partner-revenue-system",
    title: "Affiliate and partner revenue system",
    planIds: ["whitelabel-growth", "whitelabel-enterprise"],
    buyerPersona: "Affiliate operators, partner programs, and channel teams.",
    customerOutcome: "Capture partner-sourced leads and attribute revenue back to the right partner.",
    launchPromise: "A partner-ready capture, attribution, commission, and reporting workspace.",
    credentialFields: [...baseFields, stripeField, webhookField],
    deliverables: deliverables("affiliate", [
      ["Partner capture links", "Partner-aware capture URLs and UTM conventions.", "capture"],
      ["Partner attribution model", "First-touch, last-touch, and partner override attribution rules.", "reporting"],
      ["Commission table", "Commission tiers, qualifying events, and payout-ready status.", "billing"],
      ["Partner dashboard view", "Partner leads, qualified count, revenue, and pending payout view.", "operator"],
      ["Fraud checks", "Duplicate, self-referral, suspicious domain, and velocity checks.", "automation"],
      ["Conversion event webhook", "Webhook payload structure for closed-won and subscription events.", "automation"],
      ["Partner onboarding form", "Partner profile, payout details placeholder, markets, and approved offers.", "capture"],
      ["ROI report", "Partner-sourced revenue, cost, conversion, and quality summary.", "reporting"],
    ]),
  },
  {
    slug: "reactivation-retention-system",
    title: "Reactivation and retention system",
    planIds: ["whitelabel-growth", "whitelabel-enterprise"],
    buyerPersona: "Operators with dormant leads, churn risk, or repeat purchase opportunities.",
    customerOutcome: "Bring dormant leads and customers back into a measurable revenue path.",
    launchPromise: "A launched reactivation workspace with segments, messages, routing, and outcome tracking.",
    credentialFields: [...baseFields, crmField, webhookField],
    deliverables: deliverables("retention", [
      ["Dormant segment intake", "Customer/lead segment definition for dormant, at-risk, and winback groups.", "workspace"],
      ["Reactivation sequence", "Multi-touch email/SMS-ready messages for winback and next-step offers.", "automation"],
      ["Risk scoring model", "Signals for inactivity, missed milestone, no booking, churn risk, and lost deal.", "automation"],
      ["Offer rotation rules", "Rules for discount, proof, consultation, and deadline offers.", "automation"],
      ["Outcome board", "Reactivated, booked, purchased, unsubscribed, and no-response statuses.", "operator"],
      ["Suppression rules", "Respect unsubscribe, do-not-contact, duplicate, and stale records.", "automation"],
      ["Retention ROI report", "Recovered opportunities, revenue potential, and response rate.", "reporting"],
      ["Operator daily list", "Prioritized people or accounts requiring human follow-up.", "operator"],
    ]),
  },
  {
    slug: "operator-control-plane-system",
    title: "Operator control plane system",
    planIds: ["whitelabel-enterprise"],
    buyerPersona: "Internal operators, agencies, and autonomous system owners.",
    customerOutcome: "Operate the full system from a single control plane with readiness, toggles, queues, and revenue status.",
    launchPromise: "A launched operator workspace with control plane views, readiness checks, and action surfaces.",
    credentialFields: [...baseFields, webhookField],
    deliverables: deliverables("control", [
      ["System health panel", "API, dashboard, database, billing, queues, and live-send status.", "operator"],
      ["Activation checklist", "Dependency checklist tied to production readiness.", "operator"],
      ["Queue visibility surface", "Queue, retry, and dead-letter placeholders with setup requirements.", "operator"],
      ["Feature toggle register", "Runtime toggles for billing enforcement, sends, and provider behavior.", "operator"],
      ["Revenue command center", "Billing, subscription, quote, invoice, and revenue summary sections.", "billing"],
      ["Audit trail view", "Operator action, credential, provisioning, and launch event log model.", "reporting"],
      ["Agent execution surface", "Agent-callable actions and workflow handoff map.", "automation"],
      ["Incident runbook", "Failure modes, retry steps, rollback path, and escalation targets.", "workspace"],
    ]),
  },
  {
    slug: "content-distribution-engine",
    title: "Content distribution engine",
    planIds: ["whitelabel-growth", "whitelabel-enterprise"],
    buyerPersona: "Operators who need reusable content, lead magnets, and distribution workflows.",
    customerOutcome: "Launch content capture paths that turn audience attention into qualified leads.",
    launchPromise: "A content-led capture package with lead magnets, distribution plan, scoring, and attribution.",
    credentialFields: [...baseFields, webhookField],
    deliverables: deliverables("content", [
      ["Lead magnet page", "Capture page tied to a resource, report, checklist, or calculator.", "capture"],
      ["Resource delivery flow", "Confirmation and delivery steps for the promised content.", "automation"],
      ["Content nurture sequence", "Follow-up sequence that turns content engagement into a sales action.", "automation"],
      ["Distribution calendar", "Channel and cadence plan for posting, email, partner, and paid distribution.", "workspace"],
      ["Engagement scoring", "Signals for resource download, page depth, return visits, and clicks.", "automation"],
      ["CTA experiment setup", "Offer and CTA variants ready for A/B testing.", "automation"],
      ["Content attribution report", "Source, resource, lead quality, and conversion summary.", "reporting"],
      ["Repurposing brief", "Reusable hooks, angles, and follow-up assets for the operator.", "workspace"],
    ]),
  },
  {
    slug: "revenue-attribution-suite",
    title: "Revenue attribution suite",
    planIds: ["whitelabel-growth", "whitelabel-enterprise"],
    buyerPersona: "Operators who need to prove campaign, partner, buyer, or channel ROI.",
    customerOutcome: "Connect lead capture to revenue outcomes and show what is working.",
    launchPromise: "A reporting-ready attribution workspace with source tracking, conversion events, and ROI views.",
    credentialFields: [...baseFields, stripeField, webhookField],
    deliverables: deliverables("revenue", [
      ["Source tracking map", "UTM, referrer, partner, campaign, and medium conventions.", "reporting"],
      ["Conversion event schema", "Captured, qualified, booked, paid, won, refunded, and retained events.", "automation"],
      ["ROI dashboard", "Lead count, qualified count, revenue, cost, and ROI by source.", "reporting"],
      ["Revenue webhook", "Webhook payload structure for purchase, subscription, invoice, and refund events.", "automation"],
      ["Attribution model", "First-touch, last-touch, linear, and override attribution definitions.", "reporting"],
      ["Pipeline value table", "Expected value, actual revenue, close rate, and confidence view.", "reporting"],
      ["Executive report", "Customer-showable summary of what generated revenue and what to fix.", "workspace"],
      ["Data quality checklist", "Missing UTMs, duplicate leads, missing outcomes, and stale events.", "operator"],
    ]),
  },
];

export function getProvisionablePackage(slug: string): ProvisionablePackage | undefined {
  return provisionablePackages.find((pkg) => pkg.slug === slug);
}

export function getUniversalPackageCredentialFields(): PackageCredentialField[] {
  const fields = new Map<string, PackageCredentialField>();

  for (const pkg of provisionablePackages) {
    for (const field of pkg.credentialFields) {
      fields.set(field.key, field);
    }
  }

  return [...fields.values()].sort(
    (first, second) =>
      simpleOnboardingFieldKeys.indexOf(first.key as typeof simpleOnboardingFieldKeys[number]) -
      simpleOnboardingFieldKeys.indexOf(second.key as typeof simpleOnboardingFieldKeys[number]),
  );
}

export function getPackagePlanNames(pkg: ProvisionablePackage): string {
  return pkg.planIds.map((planId) => publicPlans.find((plan) => plan.id === planId)?.name ?? planId).join(", ");
}

export function getPackagesForPlan(planId: PublicPlanId): ProvisionablePackage[] {
  return provisionablePackages.filter((pkg) => pkg.planIds.includes(planId));
}

export function getPackageNicheExamples(slug: PackageSlug): string[] {
  return packageNicheExamples[slug] ?? defaultNicheExamples;
}

export function getPackageAutomationContract(pkg: ProvisionablePackage): PackageAutomationContract {
  return {
    modular: true,
    fullyAutomated: pkg.deliverables.length >= 8 && (pkg.autonomousWorkflow?.length ?? 0) >= 4,
    requiresAdditionalConfiguration: false,
    simpleOnboardingFields: simpleOnboardingFieldKeys,
    nicheExamples: getPackageNicheExamples(pkg.slug),
    deliveryMode: "complete-solution",
  };
}

export function buildPackageOutcomeGraphMoat(input: PackageOutcomeGraphMoatInput): PackageOutcomeGraphMoat {
  const deliverableSnapshot = input.deliverableTitles.slice(0, 5).join(", ");
  const deliverableContext = deliverableSnapshot
    ? ` starting with ${deliverableSnapshot}`
    : " across the launched delivery artifacts";

  return {
    outcomeGraphMoat: `The strongest moat for ${input.title} is the Outcome Graph: every delivery records buyer persona, niche, pain point, offer, workflow steps, accepted outputs, failed outputs, human overrides, pricing tested, renewals, churn reasons, hours saved, revenue recovered, and tasks completed so future runs learn from work competitors cannot see.`,
    outcomeGraphEventSchema: [
      `Buyer context: buyer persona (${input.buyerPersona}), niche, pain point, customer outcome (${input.customerOutcome}), current alternative, and services budget source.`,
      "Offer and pricing: solution chosen, promised outcome, outcome-based pricing unit, pricing tested, objection handled, discount reason, renewal reason, and churn reason.",
      "Workflow execution: intake state, workflow steps, agent actions, human approvals, accepted outputs, failed outputs, human overrides, exception reasons, elapsed time, and owner.",
      "Result proof: tasks completed, hours saved, revenue recovered, qualified outcomes, accepted deliverables, acceptance receipts, expansion signal, and next best action.",
    ],
    outcomeGraphDataAssets: [
      `Delivery hub records: intake fields, customer guide, artifacts${deliverableContext}, acceptance receipts, QA traces, launch proof, and outcome reports.`,
      "Operator memory: human overrides, exception decisions, support notes, customer-specific rules, follow-up commitments, and reusable workflow corrections.",
      "Commercial memory: pricing tests, objections, renewal reasons, churn reasons, expansion paths, work-based billing units, and services-budget proof.",
      "Reliability memory: failed outputs, accepted outputs, vertical edge cases, scenario validations, eval scores, approval latency, and final customer acceptance.",
    ],
    verticalEvalFlywheel: `Turn every accepted output, failed output, human override, exception, and customer acceptance receipt from ${input.title} into vertical evals that improve prompts, context, routing, QA checks, and future package runs.`,
    certifiedOutcomeStandard: `Create a Certified Outcome standard for ${input.title}: a package is not considered defensible until acceptance checks, launch proof, pricing logic, operating guide, escalation rules, and outcome reports are attached to the customer's delivery record.`,
    switchingCostMemory: `Compound switching costs through customer history, approvals, exceptions, performance receipts, operating memory, workflow corrections, and human override traces that would be expensive for a competitor to relearn.`,
    packageMarketplaceLoop: `Use the package marketplace as a moat loop: clone the best ${input.title} pattern, improve it with real Outcome Graph data, specialize it by vertical, and distribute certified versions faster than bespoke agencies or generic SaaS tools can react.`,
    outcomeBillingMoat: `Tie outcome-based billing to the Outcome Graph: charge for qualified leads, booked calls, accepted outputs, recovered revenue, hours saved, tasks completed, or other proven service outcomes instead of seats, logins, or feature access.`,
    forwardDeployedLearningLoop: `Keep a forward-deployed learning loop: each custom implementation should expose a boring workflow detail, become reusable package logic, add a vertical eval, and strengthen the next customer deployment.`,
    moatProofChecklist: [
      "Every run records buyer persona, niche, pain point, offer, workflow steps, accepted outputs, failed outputs, human overrides, pricing tested, and final result.",
      "Every failed output or human override becomes a vertical eval, scenario validation, rule, prompt update, or escalation threshold.",
      "Every delivered package earns a Certified Outcome record with launch proof, acceptance receipts, pricing logic, and operating-guide evidence.",
      "Every customer-specific rule is stored as switching-cost memory instead of disappearing into private DMs, calls, or one-off implementation notes.",
      "Every invoice can point to outcome billing proof such as accepted outputs, qualified leads, booked calls, hours saved, revenue recovered, or tasks completed.",
      "Every reusable improvement is eligible to become a marketplace package, vertical template, or package-specific eval set.",
    ],
    moatOperatingRule: `Do not optimize ${input.title} for feature count. Optimize for Outcome Graph workflow memory that compounds across customers, turns delivery evidence into vertical evals, and makes the service harder to replace every time it runs.`,
  };
}

export function getPackageServiceReplacementStrategy(pkg: ProvisionablePackage): PackageServiceReplacementStrategy {
  const pricingBasis = pkg.pricingModel
    ? `${pkg.pricingModel} Anchor the offer to work delivered, accepted outputs, recovered revenue, qualified outcomes, or completed tasks instead of per-seat software access.`
    : "Price the offer around work delivered, accepted outputs, recovered revenue, qualified outcomes, or completed tasks instead of per-seat software access.";
  const outcomeGraphMoat = buildPackageOutcomeGraphMoat({
    title: pkg.title,
    customerOutcome: pkg.customerOutcome,
    buyerPersona: pkg.buyerPersona,
    deliverableTitles: pkg.deliverables.map((deliverable) => deliverable.title),
  });

  return {
    ...outcomeGraphMoat,
    servicesBudgetTarget: `Sell ${pkg.title} against the outsourced service, internal labor, or agency budget behind "${pkg.customerOutcome}", not against the buyer's software-tool budget.`,
    targetServiceIndustries: ["insurance brokerage", "accounting", "tax audit", "compliance", "healthcare administration"],
    serviceReplacementIndustryThesis: `Prioritize ${pkg.title} in industries where human labor spend dwarfs software spend and the workflow is already bought as a service, outsourced function, or manual operating team.`,
    financialAdminServiceMarkets: ["accounting", "tax audit", "payroll", "insurance brokerage", "compliance", "banking operations"],
    bankingOperationsUseCases: ["KYC", "loan origination", "debt recovery", "fraud monitoring"],
    healthcareLegalServiceMarkets: ["healthcare administration", "legal services", "junior associate workflows", "outsourced legal operations"],
    specializedVerticalMarkets: ["logistics", "trucking", "fuel cards", "HVAC", "home services", "construction", "real estate", "debt financing"],
    customerSupportLanguageMarkets: ["customer support", "multilingual support", "international contractor support", "DoorDasher-style contractor support", "language-learning conversation practice"],
    easiestServiceReplacementIndustries: [
      "financial and administrative services",
      "banking infrastructure",
      "healthcare administration",
      "legal application-layer services",
      "HVAC and fragmented home services",
      "construction and fragmented field services",
      "trucking and logistics",
      "multilingual customer and contractor support",
    ],
    easiestServiceReplacementRationale: `The easiest ${pkg.title.toLowerCase()} replacement wedges have services spend that dwarfs software spend, are already outsourced or staffed as human services, and let the buyer pay for the completed outcome instead of managing headcount.`,
    outsourcedOutcomeBudgetSignal: "Treat outsourced work as the strongest buying signal: the customer already buys an outcome from an agency, BPO, broker, admin team, or specialist, so an AI-native service can replace the vendor path more naturally than it can replace software seats.",
    boringSchlepServiceOpportunity: "Prioritize boring schlep in payroll, tax, accounting, trucking compliance, insurance operations, and regulated admin work; founders avoid this painstaking drudgery, which leaves room to build process power.",
    fragmentedNonTechnicalReplacementPath: "Target fragmented, non-technical markets such as HVAC, construction, home services, trucking, and local field operations where software quality is thin and an AI agent can be minted into the customer's core workflow.",
    legalApplicationLayerReplacement: "Treat legal services as application-layer replacement territory: move beyond research copilots toward workflows that perform specialized legal work, draft artifacts, check facts, route exceptions, and preserve attorney-review boundaries.",
    multilingualSupportReplacementAdvantage: "Use multilingual support as an easy wedge because agents can be infinitely patient and fluent across hundreds of languages out of the box, including international contractor or DoorDasher-style support that human teams struggle to staff.",
    outsourcedServiceReadiness: `Prefer ${pkg.title} buyers where the work is already outsourced or staffed as a human service, because replacing the service is easier when the budget already lives outside software.`,
    fragmentedNonTechBudgetOpportunity: "Target fragmented, non-tech verticals where software has historically captured about 1% of budget but AI-native service replacement can justify 4% to 10% by doing the work.",
    highAttritionLaborWedge: "Use labor shortages and 50% to 80% support attrition as a wedge: AI agents can take repetitive, torturous, multilingual support and admin work that businesses struggle to staff reliably.",
    pricingTradeoffSummary: `Make the ${pkg.title} pricing choice explicit: per-seat SaaS monetizes customer headcount and is punished when automation works, while work-based pricing monetizes completed service outcomes and grows as the agent handles more of the workflow.`,
    perSeatCannibalizationTrap: "Per-seat pricing is the incumbent Achilles heel: if AI reduces the customer's employee count, the vendor loses seats exactly when the product becomes more efficient.",
    perSeatLimitedWalletShare: "Per-seat SaaS is usually capped by the software budget, often around 1% of the customer's gross transaction value, because it sells a tool for humans instead of the completed service.",
    incumbentPricingCultureResistance: "Incumbents resist the shift because their product, sales, and engineering culture is built around shipping features for human users, not perfecting agents that perform the work and reduce seat demand.",
    workBasedPricingOpportunity: `Price ${pkg.title} by work delivered, tasks completed, accepted outputs, qualified outcomes, recovered revenue, or hours saved so revenue follows service throughput instead of logins.`,
    servicesBudgetPricingUpside: "Work-based pricing taps the services budget and should justify roughly 4% to 10% of replaced spend when the package actually performs the service rather than supporting a human operator.",
    outcomeDrivenLaborAttritionValue: "Use high-attrition service functions as pricing proof: buyers with 50% to 80% turnover often prefer a reliable outcome over paying for seats tied to a revolving human team.",
    superhumanCapabilityPricing: "Do not price superhuman agent capacity like one human seat; capabilities such as always-on patience, 200-language fluency, and instant parallel handling should be monetized by outcomes and volume.",
    workBasedPricingPilotRisk: "The trade-off is reliability proof: work-based pricing can capture more value, but it usually requires longer pilots, acceptance evidence, and last-10-percent engineering before a buyer trusts the outcome.",
    pricingTradeoffMatrix: [
      "Primary goal: per-seat SaaS enhances human productivity; work-based AI-native pricing completes the service.",
      "Revenue driver: per-seat pricing grows with customer headcount; work-based pricing grows with outcomes, tasks, and accepted outputs.",
      "Budget source: per-seat pricing lives in the software budget; work-based pricing pursues the larger services, outsourced-work, agency, and labor budget.",
      "Core risk: per-seat pricing cannibalizes itself as automation improves; work-based pricing carries pilot and reliability risk until the agent proves production accuracy.",
      "Moat: per-seat pricing leans on system-of-record switching costs; work-based pricing builds process power through finely honed workflows, evals, and customer-minted operations.",
    ],
    pricingSurvivalRule: "Choose the model that benefits when the AI gets better: if automation success would shrink revenue, the package is still thinking like SaaS instead of an AI-native service company.",
    perSeatRisk: "Avoid per-seat pricing because successful automation reduces the number of humans needed to operate the workflow, which would otherwise cannibalize revenue as the solution gets better.",
    outcomePricing: pricingBasis,
    walletShareExpansion: "Use outcome-based pricing to capture the larger services wallet share: the offer should be able to justify roughly 4% to 10% of the spend it replaces when it performs real service work.",
    alignedIncentives: "The more work the AI handles reliably, the more valuable the package becomes to the client and the more expansion room the operator earns, without needing more human seats.",
    pricingUnits: ["work delivered", "tasks completed", "accepted outputs", "qualified outcomes", "recovered revenue", "hours saved"],
    businessProcessAutomationShift: `Frame ${pkg.title} as business process automation that performs the service itself, not as a co-pilot or productivity layer that merely improves an existing human workflow.`,
    servicePerformingAutomation: `The automation should own the full service path behind "${pkg.customerOutcome}": monitor the work, take the next action, create proof, and escalate only the exceptions humans should judge.`,
    selfRegulatingAutomationLoop: `Make the automated process self-regulating: continuously monitor outputs, compare them to ${pkg.title}'s stated goals, and adjust prompts, routing, tests, approvals, or handoffs when performance drifts.`,
    taskPricedAutomation: "Tie automation value to tasks completed, work delivered, accepted outputs, and service capacity created rather than seats, logins, dashboards, or generic productivity claims.",
    intelligenceOperatingSystem: `Run ${pkg.title} as an intelligence operating system, not an employee tool: the agent layer should own the repeatable service workflow, produce artifacts, and make every important decision legible to operators.`,
    queryableOrganizationModel: `Make ${pkg.title} part of a queryable organization: every process, decision, and workflow should be legible to AI so the company operates as a closed loop that improves stability and correctness.`,
    queryableOperatingSystemView: `Use ${pkg.title} as part of a company operating system that gives AI a continuous, up-to-date view of operations rather than a one-off tool snapshot.`,
    artifactRichLegibilitySources: [
      "Communication logs: customer feedback from email, Pylon-style support tools, shared channels, and support queues.",
      "Technical activity: GitHub commits, pull requests, issues, review notes, deployments, and shipped-work evidence.",
      "Planning data: strategic plans, specs, and decision memos in Notion, Google Docs, delivery hubs, and package workspaces.",
      "Recorded interactions: sales calls, customer calls, daily standups, meeting notes, transcripts, and follow-up commitments.",
      "Outcome evidence: acceptance receipts, QA traces, reporting surfaces, customer outcomes, and exception decisions.",
    ],
    legibleByDefaultPolicy: `Make ${pkg.title} legible by default: when communication logs, GitHub activity, planning docs, recordings, and outcome evidence are captured automatically, agents can analyze what actually shipped and whether it solved customer needs.`,
    queryableHumanMiddlewareReplacement: `Replace coordinator-style human middleware for ${pkg.title}: the intelligence layer should route signals across artifacts, owners, agents, and decision records faster than lossy manager rollups.`,
    queryableAutonomousCoordination: `Use queryable data for autonomous coordination: agents should inspect tickets, Pylon/email feedback, Notion or Google Docs plans, GitHub commits and issues, sales calls, standup recordings, and delivery evidence before proposing the next plan.`,
    queryableHumansAtEdgeRole: `Put humans at the edge for ${pkg.title}: IC builder operators and DRI strategists guide the intelligence layer, judge exceptions, and improve workflows instead of manually managing status updates.`,
    queryableTokenMaxingRule: `Max tokens before headcount for ${pkg.title}: accept high API spend when it replaces HR, admin, engineering, support coordination, and management routing while keeping expert humans focused on leverage and judgment.`,
    artifactRichEnvironment: "Run an artifact-rich environment: AI meeting notes, email and Pylon-style feedback, decision logs, ticket updates, Slack transcripts, GitHub commits and issues, Notion or Google Docs plans, sales calls, standup recordings, customer outcomes, and departmental dashboards should become analyzable operating memory.",
    transparentCommunicationPolicy: "Minimize lossy private DMs and inbox-only decisions; move important work into transparent channels and package surfaces where embedded agents can observe, route, summarize, and learn.",
    contextualParityRule: `Give the ${pkg.title.toLowerCase()} intelligence layer contextual parity with a human employee: revenue, sales, engineering, hiring, operations, customer feedback, emails, Pylon-style support logs, tickets, Slack, GitHub, Notion or Google Docs plans, sales calls, standup recordings, and dashboards should be available before it plans or decides.`,
    intelligenceLayerCoordination: "Let the intelligence layer route information instead of classic middle-management chains: reduce manual upward and downward status translation and move signals directly to owners, agents, and decision surfaces.",
    humansAtTheEdgeModel: "Move humans to the edge of the organization as builders, operators, QA owners, approvers, and agent wranglers who guide the intelligence layer instead of sitting in the middle of information flow.",
    sprintPlanningIntelligenceLoop: "Use Linear-style tickets, Pylon/email feedback, Slack, GitHub commits and issues, Notion or Google Docs plans, standup recordings, sales-call notes, shipped-work evidence, and customer needs to generate predictable sprint plans that cut planning noise, compress sprint cycles, and target nearly 10x more useful work.",
    closedLoopSystem: `Capture intake, decisions, handoffs, approvals, acceptance checks, exceptions, and outcome reports back into the delivery hub so each run makes the organization more queryable and the next delivery more accurate.`,
    openLoopReplacement: `Replace open-loop operations for ${pkg.title}: do not merely make a decision and execute it; measure the output, compare it with the stated goal, and adjust routing, prompts, tests, or handoffs until the workflow self-corrects.`,
    legibleOrganization: `Make the organization legible to AI by keeping ${pkg.title} work in transparent channels, delivery surfaces, and shared records rather than private DMs, inbox fragments, or undocumented side conversations.`,
    artifactGenerationPolicy: `Every important action should produce a digital artifact: meeting notes, decision logs, ticket updates, approval receipts, exceptions, QA traces, customer outcomes, and follow-up commitments that the central intelligence can learn from.`,
    comprehensiveContextLayer: `Give models as much context as an employee would receive by connecting revenue, sales, engineering, hiring, customer, email, Pylon-style support, ticket, Slack, GitHub, Notion or Google Docs, call recording, standup recording, and package-performance dashboards into the operating context for ${pkg.title}.`,
    autonomousSprintPlanning: `Use agents for autonomous sprint planning: inspect tickets, customer needs, shipped work, Slack decisions, Pylon/email feedback, Notion or Google Docs plans, GitHub commits and issues, sales calls, standup recordings, and delivery evidence, then propose predictable next-cycle plans instead of relying on lossy manual status rollups.`,
    humanMiddlewareRemoval: `Remove human middleware where the intelligence layer can route information directly: fewer status meetings, fewer translation layers, fewer middle-management handoffs, and faster movement from signal to decision.`,
    closedLoopVelocityGain: `Use closed-loop coordination to target practical speed gains, including cutting sprint time in half and getting nearly 10x more useful work done when agents can see goals, context, shipped work, and customer feedback.`,
    moatPowerFrameworkSummary: `Define ${pkg.title}'s moat as a portfolio of AI-native powers: speed first, then process power, counterpositioning, switching costs, eval network economy, cornered resources, scale economies, branding, schlep blindness, and system-of-record lock-in.`,
    speedAsPrimaryMoat: `Use speed as ${pkg.title}'s first defense: one-day sprint cycles, AI software factories, and forward-deployed customer learning let the operator ship before incumbents or broad labs can route work through craft, middle management, and PRD cycles.`,
    aiSevenPowersFramework: [
      "Speed foundation: relentless execution, software factories, one-day sprint cycles, and forward-deployed customer learning before other moats mature.",
      "Process power: the final 5% to 10% of reliability, evals, approvals, edge cases, and workflow rules that turn an 80% demo into 99% mission-critical service.",
      "Counterpositioning: work-delivered pricing and token-maxing culture let the startup embrace automation that would cannibalize a per-seat incumbent.",
      "Switching costs: deep onboarding, customer-specific logic, acceptance history, and minted workflows make replacement expensive after the agent is trusted.",
      "Network economy: every customer run creates pass/fail data, evals, overrides, and workflow lessons that improve the intelligence layer for future runs.",
      "Cornered resource: proprietary customer workflow data, specialized evals, domain edge cases, and optimized model routes outsiders cannot observe from the demo.",
      "Scale economies and branding: reusable infrastructure, crawls, model optimizations, trust, and category memory compound when the package becomes the known choice.",
    ],
    processPowerLastTenPercentMoat: `Process power for ${pkg.title} lives in the last 10%: finely honed agents, vertical edge cases, QA gates, and 99% accuracy expectations for workflows such as KYC, loan origination, legal review, accounting, healthcare administration, or compliance.`,
    counterpositioningWorkBasedPricingMoat: `Counterposition ${pkg.title} against SaaS incumbents by pricing work delivered, tasks completed, and accepted outcomes; incumbents tied to seats hesitate because successful automation reduces the customer headcount they monetize.`,
    switchingCostsDeepIntegrationMoat: `Create switching costs by embedding ${pkg.title} into onboarding, data flows, custom rules, fraud-monitoring-style workflows, debt recovery paths, approvals, and acceptance history until switching would mean relearning the customer's operating logic.`,
    networkEconomyEvalFlywheel: `Use the eval flywheel as the AI network economy: every pass, failure, override, exception, and customer acceptance receipt should improve prompts, context engineering, scenario validations, and workflow rules for the next customer.`,
    corneredResourceDataEvalMoat: `Cornered resources come from proprietary workflow data, tailored time-in-motion observations, specialized eval sets, customer-specific edge cases, and optimized model or routing choices that reduce serving cost or increase reliability.`,
    scaleEconomiesInfrastructureMoat: `Use scale economies where ${pkg.title} can reuse expensive infrastructure across customers: static crawls, model optimizations, evaluation harnesses, integrations, compliance checks, and deployment pipelines become cheaper per outcome as volume grows.`,
    brandingTrustMoat: `Build brand as trust under risk: buyers should associate ${pkg.title} with reliable service outcomes, clear acceptance evidence, and category leadership the way default AI brands win attention even when model capabilities converge.`,
    schlepBlindnessBoringSpaceMoat: `Exploit schlep blindness: boring spaces such as payroll, tax accounting, trucking compliance, insurance operations, bank infrastructure, and regulated admin become defensible because competitors avoid the unsexy bank deals, infrastructure details, and workflow drudgery.`,
    systemOfRecordDataLockIn: `Preserve system-of-record data lock-in: customer history, decisions, approvals, outcomes, exceptions, eval traces, and reporting receipts should live in ${pkg.title}'s delivery surfaces so leaving means losing operating memory, not just a dashboard.`,
    processPowerMoat: `The moat is the reliable final 5% to 10%: customer-specific workflow rules, QA evidence, human approval gates, reporting receipts, and switching costs around the minted ${pkg.title.toLowerCase()} operating path.`,
    wrapperCloneMisconception: `Do not treat ${pkg.title} as an easily cloned model wrapper. The demo surface may be easy to imitate, but the defensible product is the accumulated workflow logic, evals, approvals, exceptions, and operating evidence behind it.`,
    accuracyHurdleMoat: `Make the 99% accuracy hurdle explicit: a weekend hackathon version may reach 80%, but mission-critical workflows such as loan origination, KYC, legal review, accounting, or compliance need 99% reliability and 10x to 100x more edge-case work.`,
    bigLabDrudgeryDefense: `Use painstaking drudgery as big-lab defense: broad AGI labs are unlikely to spend their best attention perfecting the final 5% of consistency for a niche ${pkg.title.toLowerCase()} workflow when the value lives in unglamorous vertical details.`,
    deepBackendLogicMoat: `Build process power like Stripe, Gusto, or other deep-backend systems: encode policy rules, state transitions, retries, audit trails, permissions, reconciliations, handoffs, and exception paths that are invisible from the demo but hard to replicate.`,
    integrationSurfaceAreaMoat: `Expand the surface area competitors would need to copy: client systems, data formats, approval paths, financial-institution-style integration quirks, crawlers, imports, exports, and reporting contracts should compound over time.`,
    customerMintedWorkflow: `Mint the agent into the customer's operations by capturing custom logic, evals, thresholds, loan-reconciliation-style rules, and acceptance receipts that make switching away costly once the workflow is trusted.`,
    processAutomationMoat: `Build a process-automation moat by doing the painstaking last-10% work needed for 99% accuracy in mission-critical banking, legal, accounting, compliance, healthcare, or other high-stakes service environments.`,
    pilotToCoreInfrastructure: `Use pilots to learn the customer's internal operations and then turn custom rules, integrations, reporting, approvals, and acceptance history into core infrastructure the customer depends on.`,
    forwardDeployedPosture: `A forward-deployed operator should sit with the customer, map the boring manual workflow, install the agent or delivery path inside that workflow, and keep tuning it from real usage data.`,
    tokenMaxingRule: "Spend AI tokens where they replace repetitive service labor, admin follow-up, research, routing, reporting, or production work; escalate high-stakes exceptions instead of adding headcount by default.",
    tokenMaxingCostShift: "Treat uncomfortably high API bills as a rational cost shift when token spend replaces inflated HR, admin, engineering, and coordination headcount while keeping the organization leaner and faster than incumbents.",
    tokenUsageOrgDesign: "Rebuild the organization around token usage before headcount: use agents for repeatable operations and move humans to the edges as builders, operators, QA owners, approvers, and agent wranglers.",
    managementHierarchyReplacement: `Replace the ${pkg.title.toLowerCase()} management stack with an intelligence layer that routes information, preserves artifacts, and reduces managers whose main job is manually interpreting or relaying status.`,
    icBuilderOperatorModel: "Define the Individual Contributor as a builder operator: engineers, support, sales, and operations teammates are expected to make, run, improve, and inspect workflows directly with agents.",
    prototypeFirstMeetingCulture: "Make working prototypes the meeting artifact: ICs should bring live workflows, agent runs, dashboards, scripts, or customer-ready drafts instead of static pitch decks whenever the work can be demonstrated.",
    driOutcomeOwnershipModel: "Define the Directly Responsible Individual as a strategy-and-customer-outcome owner, not a classic middle manager; the DRI owns one measurable result and the decisions needed to improve it.",
    onePersonOneOutcomeRule: "Use the one person, one outcome rule: every important package result needs a named DRI with singular accountability, visible evidence, and nowhere to hide behind committee status updates.",
    driStrategyOutcomeFocus: `For ${pkg.title}, the DRI focuses on strategy and customer outcomes rather than status routing, headcount management, or middleware coordination.`,
    driSpecificResultContract: `Assign one named DRI to one specific ${pkg.title} result with success evidence, customer proof, and decision rights visible in the package surfaces.`,
    driNoHierarchyHidingRule: `Do not let ${pkg.title} hide behind a hierarchy: if the outcome misses, the DRI owns the adjustment path instead of diffusing responsibility through committees or manager layers.`,
    driMiddleManagementReplacement: `Replace classic middle-management coordination for ${pkg.title} with the intelligence layer: agents route artifacts, updates, exceptions, and evidence so the DRI can guide outcomes.`,
    driIntelligenceLayerGuidance: `The DRI guides the ${pkg.title} intelligence layer toward business objectives by setting goals, constraints, evals, escalation rules, and acceptance evidence rather than manually relaying information.`,
    driEdgeGuidanceRole: `Place the DRI at the edge of ${pkg.title}: close enough to customers and operators to judge strategy, exceptions, and outcomes while AI systems coordinate the repeatable work.`,
    driTokenMaxingLeverage: `Use the DRI as a token-maxing lever for ${pkg.title}: one accountable operator with agents should replace what previously required large engineering, admin, or coordination teams.`,
    driInformationVelocityGuardrail: `The DRI protects ${pkg.title} information velocity: signals should move from artifacts to agents, decisions, and customer-visible changes without being slowed by manual interpretation chains.`,
    aiFounderLeadershipModel: "Define the AI Founder type as the leader who personally builds, coaches, tests, and demonstrates AI-native workflows so the team can see massive capability gains firsthand.",
    aiStrategyOwnershipRule: "Do not delegate AI strategy to a distant committee or tooling owner; founders and senior DRIs should stay at the frontier of the tools and model the operating behavior they expect.",
    tokenUsageArchetypeOperatingModel: "Use the IC, DRI, and AI Founder archetypes to maximize token usage rather than headcount: agents route information and perform repeatable work while humans own building, outcomes, judgment, and coaching.",
    humanMiddlewareVelocityGain: `Use the ${pkg.title.toLowerCase()} intelligence layer to remove human middleware: fewer middle-manager status relays should create direct velocity gains because information moves from artifacts to agents, owners, and decisions without lossy coordination chains.`,
    singlePersonAgentLeverage: `Design ${pkg.title} so one capable operator with AI agents can perform work that previously required a larger cross-functional team, while escalating judgment-heavy exceptions to humans at the edge.`,
    leanDepartmentOperatingModel: "Make lean engineering, HR, admin, support, and operations departments the default: maximize agent throughput and token spend before adding coordination headcount.",
    organizationalArchetypes: [
      "Individual Contributor: a builder operator across engineering, support, sales, and operations who brings working prototypes, ships workflows, runs checks, and wrangles agents.",
      "Directly Responsible Individual: the one-person-one-outcome owner accountable for strategy, customer proof, pricing, escalation rules, and measured results.",
      "AI Founder: the leader who uses the operating system personally, builds and coaches by example, defines the taste bar, and keeps token spend pointed at service labor replacement.",
    ],
    aiSoftwareFactory: `Use an AI software factory for ${pkg.title}: humans define specs, constraints, tests, and acceptance evidence while agents generate code, scripts, content, routing logic, and reports at a speed incumbents with legacy processes cannot match.`,
    softwareFactorySpecContract: `Make the spec and test harness the primary engineering artifact for ${pkg.title}: humans define what to build, the success scenarios, constraints, and judge criteria; agents own the implementation syntax.`,
    agentIterationLoop: `Surround the operator with a system of agents that generate, test, inspect failures, and iterate on code, prompts, routing, reports, and workflow logic until the human-defined harness passes.`,
    lastTenPercentReliability: `Treat the last 10% as the product for ${pkg.title}: the demo can get to 80%, but production delivery should aim for 99% reliability and accept that the final gap may take 10x to 100x more refinement than the first prototype.`,
    tddSoftwareFactoryLoop: `Run the package like test-driven development for agents: humans write the success spec, constraints, edge-case tests, and acceptance checks; agents iterate on implementation until the tests pass and the delivered service is accepted.`,
    scenarioValidationThreshold: `Use scenario-based validations and a probabilistic satisfaction threshold for high-variance work, so agents keep refining prompts, routing, data handling, and outputs until the workflow clears the required reliability bar.`,
    probabilisticReviewGate: `Replace line-by-line code review with a probabilistic review gate: the agent output should not be accepted until scenario performance makes the system statistically likely to be correct for the defined ${pkg.title.toLowerCase()} operating cases.`,
    validationDrivenReviewReplacement: `Eliminate human middleware by making validations the reviewer: humans define constraints, scenarios, failure states, and acceptance criteria; agents autonomously refine implementation until every validation passes without requiring a manual syntax check.`,
    thresholdEvidencePolicy: `Store the threshold evidence for each run: scenario coverage, failing cases, retries, confidence signals, human overrides, and acceptance receipts should explain why the output cleared the satisfaction threshold.`,
    zeroHandwrittenCodePosture: `Bias new workflow code toward spec-first generation: the long-term target is repositories where durable specs, tests, evals, and harnesses matter more than handwritten implementation, with humans reviewing outcomes rather than syntax.`,
    specsOnlyRepositoryGoal: `Aim new repeatable workflow repositories toward the StrongDM-style end state: specs, scenario validations, evals, and test harnesses guide the agents, while handwritten production code becomes the exception rather than the norm.`,
    thousandXEngineerModel: `Design ${pkg.title} for the thousandx engineer: one expert surrounded by agents should produce features, service assets, and operating improvements that previously required an engineering team, making speed a practical moat.`,
    softwareFactorySpeedMoat: `Use the AI software factory as process-power acceleration: specs, tests, agents, and eval loops let the operator build and maintain complex infrastructure at a pace and headcount profile traditional incumbents struggle to match.`,
    speedMoatThesis: `Treat speed as ${pkg.title}'s first moat: before data, network, or brand defensibility exists, outlearn labs and incumbents by shipping AI-native service improvements faster than their product process can react.`,
    speedMoatAgainstLabs: `OpenAI, Google, and other labs may have capital and compute, but ${pkg.title} can win the narrow vertical by living inside the workflow, using customer evidence, and closing reliability gaps before broad labs notice the treasure.`,
    humanMiddlewareSpeedGain: `Every removed human routing layer is a speed gain for ${pkg.title}: artifacts should flow directly from meetings, tickets, Slack, GitHub, and customer outcomes to agents, DRIs, and shipped changes.`,
    queryableSprintCompression: `Use queryable organization data to compress ${pkg.title} sprint cycles: agents compare shipped work with customer needs so the team can cut sprint time in half and target nearly 10x more useful work.`,
    oneDaySprintCadence: `Push toward one-day sprint cycles where ${pkg.title} can safely ship: one accountable owner defines the spec, test, or eval in the morning, agents implement, and acceptance evidence decides daily release readiness.`,
    incumbentCraftOverhead: "Exploit incumbent craft overhead: large companies route features through PM layers, operations reviews, PRDs, spec docs, approvals, and launch gates that slow the final customer-visible change.",
    legacyOperatingConstraint: "Start AI-native from day one instead of unwinding legacy SOPs, live-product assumptions, core software-development beliefs, and human-first rituals that slow incumbents.",
    aiNativeFromDayOneAdvantage: "Build the culture around AI-native operations now: prototypes over decks, specs and evals over committee syncs, tokens over coordination headcount, and agents inside every repeatable workflow.",
    forwardDeployedSpeedLoop: `Use forward-deployed engineering as the speed loop for ${pkg.title}: sit with customers, spot boring manual pain, automate it inside the live workflow, then feed usage and eval data back into the next iteration.`,
    drudgeryDiscoveryThesis: `Identify ${pkg.title} opportunities by looking past superficially plausible automation and into the painstaking drudgery behind the last 10% of reliable service delivery.`,
    forwardDeployedTimeInMotion: `Use a forward-deployed time-in-motion study for ${pkg.title}: sit with the customer, watch the tailored workflow minute by minute, and record what a request, exception, or approval actually does before anyone proposes automation.`,
    nittyGrittyWorkflowMap: `Map the nitty-gritty path for ${pkg.title}: how a request arrives by email, form, call, ticket, or spreadsheet; how it gets enriched; where call centers, manual data entry, or human judgment bridge gaps; and where the workflow stalls.`,
    hiddenLogicDiscovery: `Look for hidden logic in ${pkg.title}: backend rules, reconciliation habits, informal checks, exception paths, and operator know-how that are invisible from a landing page or high-level industry overview.`,
    attritionDiscoverySignal: `Use 50% to 80% annual attrition as a discovery signal for ${pkg.title}: repetitive, torturous support or admin roles are often painful enough that buyers welcome AI-native service replacement.`,
    boringWorkflowSchlepMap: `Search boring workflow spaces for ${pkg.title}: payroll, tax accounting, trucking compliance, insurance operations, regulated admin, and other schlep-heavy work where the day-to-day product is grinding execution rather than fun features.`,
    lossyMiddlewareDiscovery: `Find lossy information middleware around ${pkg.title}: status rollups, fragmented handoffs, manager interpretation, duplicated updates, and manual coordination that a closed-loop system can make queryable by default.`,
    fieldResearchTruckStopMethod: `Use the truck-stop method for ${pkg.title}: go where the work physically or operationally happens, talk to frontline operators, and look for fuel-card-style wedges that only show up through the schlep of field research.`,
    missionCriticalWorkflowFilter: `Prioritize ${pkg.title} workflows that are mission-critical infrastructure, such as KYC, loan origination, legal review, accounting close, compliance checks, or customer operations where a miss can cost millions.`,
    hackathonReliabilityGap: `Separate the ${pkg.title} hackathon demo from the production workflow: an 80% prototype is not the product; the drudgery is the edge-case work needed for the final 5% to 20% of consistency and 99% reliability.`,
    existentialPainWorkflowFilter: `Filter ${pkg.title} opportunities for existential pain: the buyer should fear lost revenue, being fired, compliance exposure, missed promotions, or business failure if the workflow remains manual, slow, or unreliable.`,
    specializedEvalMinting: `Mint custom evals and datasets into each ${pkg.title} customer workflow so speed compounds into process power instead of one-off feature churn.`,
    treasureBeforeLabs: `Find and defend the ${pkg.title} treasure before labs care: capture the valuable narrow vertical, prove the outcome, and harden edge cases while bigger competitors are still prioritizing broad platform goals.`,
    incumbentCultureReset: "Expect incumbents to struggle because this model asks teams to stop measuring value by manual coding volume and reset engineering culture around specs, tests, context engineering, prompt engineering, evals, and intelligence loops.",
    contextEngineeringShift: "Move senior engineering judgment upstream into context engineering: better specs, examples, test harnesses, failure traces, prompts, retrieval context, and acceptance evidence feed the intelligence layer more than hand-written syntax does.",
    evalFlywheel: `Capture evals on every run: pass/fail outcomes, rejected outputs, human overrides, edge cases, and customer acceptance evidence should feed context engineering, prompt updates, tests, and operating rules for the next run.`,
    domainEdgeCaseDrudgery: `Budget for painstaking vertical drudgery: specialized domain knowledge is needed to identify KYC, loan-processing, legal, compliance, or customer-specific edge cases that a weekend demo would miss.`,
    missionCriticalProcessPower: `Convert the final reliability work into mission-critical process power: the unsexy vertical evals, QA gates, tuned context, and customer-specific operating rules become the moat that broad model labs and quick demos are unlikely to replicate.`,
    humanWranglingModel: `Move humans out of repetitive, torturous execution and into agent wrangling: supervising the fleet, approving complex exceptions, improving prompts and tests, and handling the unusual cases that make the work more interesting.`,
  };
}

export function getPackageIdeaEvaluationGuardrails(pkg: ProvisionablePackage): PackageIdeaEvaluationGuardrails {
  return {
    problemRealityCheck: `Do not launch ${pkg.title} as a solution in search of a problem or a made-up problem; validate the painful workflow behind "${pkg.customerOutcome}" before treating AI as the answer.`,
    superficialPlausibilityCheck: `Reject ${pkg.title} if the idea only sounds logical from a pitch deck. Prove the buyer is genuinely bothered in daily operations, already works around the pain, and would care enough to pay or change behavior.`,
    technologyFirstTrapWarning: `Do not start with "AI can do this" and then hunt for an application. Start with the user's painful service workflow, then use AI only where it helps deliver the outcome reliably.`,
    tarPitRiskCheck: `Research why similar ${pkg.title.toLowerCase()} attempts, agencies, tools, or internal workflows failed before. Name the structural blockers so a superficially plausible, tantalizing-from-a-distance idea does not become a tar pit.`,
    tarPitResearchProtocol: [
      `Google prior ${pkg.title.toLowerCase()} attempts, adjacent SaaS tools, agencies, marketplaces, and internal workflow projects before building.`,
      "Talk to operators, customers, or founders who tried a similar idea and ask exactly what made adoption, retention, distribution, or workflow change fail.",
      "Write the hard-part hypothesis before launch: the specific structural barrier this package handles differently from failed attempts.",
    ],
    tarPitCategoryWarnings: [
      `Social coordination tar pit: do not let ${pkg.title} inherit the college weekend-plans trap where universal text-thread pain, event lists, and friend invites hide hard social dynamics and switching barriers.`,
      `Fun discovery tar pit: restaurant discovery, music discovery, and hobby-discovery apps are picked-over spaces where personal interest rarely proves monetizable, urgent demand.`,
      `Abstract societal problem trap: climate, poverty, and other huge goals need tractable wedge workflows before they are startup ideas; ${pkg.title} must name a specific pain someone can buy now.`,
      "Low-hit-rate idea spaces: consumer hardware, social networks, and ad tech require extra skepticism because the category itself has historically lower startup hit rates than boring service workflows.",
    ],
    socialCoordinationTarPitWarning: "Treat fun social coordination app logic as the canonical tar pit warning: universal weekend-plan pain feels obvious and superficially plausible, but two decades of event lists, friend invites, and group-planning apps show that ubiquity does not equal willingness to switch.",
    funDiscoveryTarPitWarning: `Do not package ${pkg.title} like a fun discovery app unless there is acute demand. Restaurant discovery, music discovery, and hobby-finding ideas are often picked over by thousands of founders and hard to monetize because curiosity is not the same as willingness to pay.`,
    abstractSocietalProblemWarning: `Do not start ${pkg.title} from an abstract societal problem. Big goals such as poverty or climate need a tractable workflow, named buyer, budget, and specific pain point before they become a viable package.`,
    lowHitRateIdeaSpaceWarning: `Treat consumer hardware, social networks, and ad tech as low-hit-rate idea spaces that need stronger proof than normal: prior-attempt research, distribution insight, acute pain, and a hard-part hypothesis before launch.`,
    tarPitAvoidanceChecklist: [
      `Google ${pkg.title.toLowerCase()} and adjacent idea spaces before launch; many tar pits are obvious only after you see the graveyard of prior attempts.`,
      "Talk to founders, operators, or customers who tried similar ideas and ask what structural hard part blocked adoption, retention, distribution, monetization, or workflow change.",
      "Run Fire or Promotion before building: if the pain is not tied to firing risk, promotion upside, business survival, revenue, cost, speed, or risk, treat it as nice-to-have.",
      "Prefer boring service workflows where customers already spend money over fun, universal, picked-over ideas that only feel plausible from personal experience.",
    ],
    hardPartHypothesis: `Before launch, state the hard part for ${pkg.title}: the adoption, trust, data access, workflow-change, compliance, distribution, or reliability barrier that previous attempts did not solve.`,
    founderMarketFitCheck: `Confirm the operator has founder-market fit: domain access, customer empathy, delivery expertise, distribution, or a credible forward-deployed path into ${pkg.buyerPersona}.`,
    boringHardCompetitiveAdvantage: `Prefer the boring, hard, or competitive version of this package when it exposes service spend, regulatory schlep, messy handoffs, or incumbents that users tolerate but dislike.`,
    boringSpaceValidationThesis: `Validate ${pkg.title} in boring spaces before chasing fun markets: tax, payroll, trucking compliance, insurance operations, regulated admin, and similar schlep-heavy workflows often have higher hit rates because the pain is real, budgets exist, and fewer founders do the work.`,
    physicalObservationSchlepProtocol: `Do the schlep for ${pkg.title}: go where the work physically or operationally happens, interview frontline operators, watch the workflow in context, and find truck-stop-style fuel-card wedges that do not appear in desk research.`,
    invisiblePainDiscoverySignal: `Look for invisible ${pkg.title} pains that programmers rarely see: phone-order, 1-800-number, spreadsheet, fax, inbox, and tribal-knowledge workflows where specialists have tolerated broken processes for years.`,
    forwardDeployedWorkflowValidation: `Validate ${pkg.title} as a forward-deployed engineer: sit with the customer, map tailored time-in-motion, trace how requests arrive and get enriched, and identify where call centers, manual entry, approvals, or judgment bridge gaps.`,
    lastTenPercentEdgeCaseValidation: `Do not call ${pkg.title} validated until the last 10% is visible: list the edge cases, specialized knowledge, exception paths, and 99% reliability requirements that separate a demo from a trusted service in mission-critical work.`,
    acutePainCheck: `Qualify acute pain before delivery: ${pkg.title} should solve existential pain, not a minor inconvenience. The buyer should fear lost revenue, wasted labor, missed customers, compliance risk, churn, promotion risk, or another urgent business consequence if this workflow stays broken.`,
    topThreePriorityTest: `Treat ${pkg.title} as viable only if the workflow is a top three priority for the buyer this quarter, not a nice-to-have improvement they will revisit after urgent work is done.`,
    existentialPainTest: `Run the fire-or-promotion test: the buyer should believe unresolved ${pkg.title.toLowerCase()} pain could cost them a promotion, get someone fired, materially slow growth, or put the business at risk.`,
    fireOrPromotionAcutenessTest: `Use the Fire or Promotion test as the acuteness gate for ${pkg.title}: the pain should be severe enough that the buyer fears being fired, missing a promotion, not wanting to face the work, or losing business momentum if the workflow stays broken.`,
    fireRiskSignal: `The fire-side signal for ${pkg.title} is explicit professional risk: someone could miss their number, lose credibility, miss promotion, get fired, avoid the work, or see the business suffer if the issue remains unsolved.`,
    promotionUpsideSignal: `The promotion-side signal for ${pkg.title} is visible upside: solving the workflow could help the buyer advance, unlock next-year growth, take over more of the business, or become the operator who fixed a top-priority problem.`,
    topThreeProblemRequirement: `Do not treat ${pkg.title} as acute unless it is a top three customer problem right now; if the buyer calls it useful but can delay it, it is still nice-to-have.`,
    willingnessToPayAcutenessSignal: `Use willingness to pay as the Fire or Promotion proof: buyers with existential pain will budget, complain about price but still pay, or change behavior because the unsolved problem is more expensive.`,
    plainSightOpportunitySignal: `Look for ${pkg.title} opportunities lying in plain sight: high-stakes, emotionally obvious work that operators endure every day and that can support a very large company when solved with reliable service replacement.`,
    pricingBinaryValidationSignal: `Use pricing as the binary validation test for ${pkg.title}: if buyers refuse to pay, the pain is not acute enough; if they complain about a high price but still pay, the boring problem is real; if they say yes immediately, the price may be too low.`,
    pricingBinaryTestDefinition: `Define the Binary Test for ${pkg.title} as charging real money to see whether the buyer will open their wallet. The result should teach quickly: either the customer pays, or the package has not created enough value to overcome the price tag.`,
    openWalletValueSignal: `Treat open-wallet behavior as value validation for ${pkg.title}. A refusal to pay means the workflow is not yet a top-three problem, the buyer segment is wrong, or the package has not made the outcome valuable enough.`,
    binaryTestCustomerSegmentSignal: `Use Binary Test results to identify the right ${pkg.title} customer segment: the best segment is the group that pays fastest, complains least about implementation friction, and most clearly connects the outcome to budget.`,
    premiumPriceLearningSignal: `Do not validate ${pkg.title} by undercutting alone. A startup can learn more by charging a premium when it believes the outcome is meaningfully better, as Stripe did when early developer-friendly setup and documentation justified a higher transaction fee than competitors.`,
    complainButPayValidationSignal: `The strongest ${pkg.title} pricing signal is not polite interest; it is a buyer who complains about the price but pays anyway because the cost of leaving the problem unsolved is higher.`,
    highAttritionValidationSignal: `Use high attrition as ${pkg.title} validation: 50% to 80% annual churn in support, admin, field, or compliance roles signals torturous repetitive work that businesses may welcome AI-native service replacement for.`,
    alternativeIsNothingTest: `Look for a "current alternative is nothing" wedge: if the buyer cannot solve the critical need through banks, agencies, software, staff, or internal process, the pain is more likely acute.`,
    chargeValidationTest: `Charge money as the binary test. The best signal is a high price that customers complain about but still pay because solving the problem is worth more than the cost.`,
    highValueNeedCategories: [
      `Make more money: ${pkg.title} should connect to revenue, pipeline, recovered demand, accepted outputs, or monetizable customer action.`,
      `Reduce costs: ${pkg.title} should remove meaningful labor, vendor spend, rework, missed handoffs, or operational waste.`,
      `Move faster: ${pkg.title} should compress launch, response, production, approval, or fulfillment timelines from months to weeks, weeks to days, or days to minutes.`,
      `Avoid risk: ${pkg.title} should reduce compliance, legal, payment, brand, customer-loss, or operational exposure.`,
    ],
    moatTiming: "Do not reject the idea for lacking a five-year moat on day one; early defensibility is speed, customer proximity, learning rate, and reliable execution through the final delivery edge cases.",
    pricingDiscipline: "Charge early, avoid under-charging, and do not compete only on lower price. Price from the value of the completed service and proof of outcome.",
  };
}

const b2bOnlyPackageSlugs: readonly PackageSlug[] = [
  "ai-opportunity-audit",
  "founder-ai-chief-of-staff",
  "ai-first-business-os",
  "agency-client-workspace",
  "operator-control-plane-system",
  "revenue-attribution-suite",
];

export function getPackageAudienceContract(pkg: ProvisionablePackage): PackageAudienceContract {
  const model: PackageAudienceModel = b2bOnlyPackageSlugs.includes(pkg.slug) ? "B2B" : "B2B2C";
  const recipient = "The client business receives the launched solution, delivery hub, reports, and operating handoffs.";
  const downstreamExperience =
    model === "B2B2C"
      ? "The client's leads, customers, patients, shoppers, applicants, partners, or prospects may interact with the capture, booking, nurture, course, marketplace, or ad surfaces."
      : "The primary experience stays inside the buyer's team: operators, founders, consultants, executives, marketers, or delivery staff use the outputs to make decisions and run workflows.";

  return {
    model,
    buyer: pkg.buyerPersona,
    recipient,
    downstreamExperience,
    summary:
      model === "B2B2C"
        ? "Sold to a business buyer and delivered through customer-facing surfaces for that business's audience."
        : "Sold to a business buyer for internal operations, strategy, reporting, enablement, or workflow execution.",
  };
}
