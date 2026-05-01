import type { PackageSlug } from "./package-catalog.ts";

export interface PersonaJourneyStep {
  stage: string;
  personaGoal: string;
  systemExperience: string;
  evidence: string;
}

export interface ServiceBlueprintStep {
  phase: string;
  frontstage: string;
  backstage: string;
  support: string;
  failureState: string;
}

export interface PackagePersonaBlueprint {
  offerFor: string;
  decisionMaker: string;
  residentPersona: string;
  messaging: string;
  residentPainPoints: string[];
  expectedOutcome: string;
  deliveryShape: string[];
  userJourney: PersonaJourneyStep[];
  serviceBlueprint: ServiceBlueprintStep[];
  verificationPosture: string;
}

export const packagePersonaBlueprints = {
  "ai-opportunity-audit": {
    offerFor: "Business owners and operators who feel pressure to adopt AI but do not know which workflow should be automated first.",
    decisionMaker: "Founder, COO, agency owner, department lead, or transformation sponsor.",
    residentPersona: "Internal operators, managers, and staff who currently carry repetitive work, reporting, follow-up, and process confusion.",
    messaging: "Stop guessing where AI belongs. Get a prioritized roadmap that shows exactly which workflows should be installed first, why they matter, and what outcome each one should produce.",
    residentPainPoints: [
      "Leadership hears AI urgency but cannot translate it into a practical install plan.",
      "Teams waste time on scattered experiments that do not become operating improvements.",
      "Manual processes are known, but no one has quantified the revenue or labor impact.",
      "Risk, approvals, and data boundaries are unclear.",
    ],
    expectedOutcome: "A decision-ready AI implementation report with maturity score, workflow map, ROI backlog, risk notes, and a 30-day rollout path.",
    deliveryShape: ["AI maturity report", "Department workflow map", "ROI-ranked backlog", "30-day implementation roadmap", "upgrade recommendation"],
    userJourney: [
      journey("Recognize", "Understand where AI can help without buying random software.", "Reads the package page and sees an audit positioned as a decision roadmap.", "Buyer persona, outcome, and launch promise on `/packages/ai-opportunity-audit`."),
      journey("Submit", "Explain the business, processes, constraints, and success metric once.", "Completes the intake form with target market, current process, constraints, and success metric.", "Required credential fields and solution brief inputs."),
      journey("Receive", "Get a complete roadmap without assembling tools.", "Delivery hub generates report, workflow map, backlog, and rollout outputs.", "Workspace, reporting, and operator URLs plus launched artifacts."),
      journey("Act", "Choose the first install with confidence.", "Upgrade path and roadmap point to the next package or workflow.", "Upgrade path deliverable and acceptance tests."),
    ],
    serviceBlueprint: blueprint(
      "Audit intake",
      "Client submits business context and current process.",
      "Audit and process mapping agents convert answers into department workflows.",
      "Package provisioner creates workspace, reporting links, and artifacts.",
      "If data is incomplete, managed defaults state assumptions and required follow-up."
    ),
    verificationPosture: "Prepared to deliver report artifacts and delivery hub. External implementation still depends on the next package selection.",
  },
  "ghost-expert-course-factory": {
    offerFor: "Experts, consultants, coaches, educators, and professionals who own valuable knowledge but do not have a finished course.",
    decisionMaker: "Expert, founder, education lead, practice owner, or consultant.",
    residentPersona: "Learners, students, clients, or members who need the expert's knowledge in a structured course experience.",
    messaging: "Turn your expertise into a finished course without writing scripts, building lessons, or being on camera for every module.",
    residentPainPoints: [
      "The expert has knowledge trapped in calls, notes, workshops, and experience.",
      "Course creation stalls because scripting, curriculum, video, workbook, and launch assets are too much work.",
      "Learners need structured lessons rather than scattered advice.",
      "Regulated or expert-led content needs claim controls and consent clarity.",
    ],
    expectedOutcome: "A course-production package with extracted knowledge, curriculum, lesson scripts, avatar production brief, workbook, sales copy, launch emails, and QA notes.",
    deliveryShape: ["Course architecture", "Lesson scripts", "Avatar/video production brief", "Workbook", "Sales page copy", "Launch email sequence"],
    userJourney: [
      journey("Decide", "Know the course can be created from existing expertise.", "Package page frames the offer as done-for-you course production.", "Buyer persona, pricing model, and delivery list."),
      journey("Contribute", "Provide source material and consent once.", "Intake captures expertise area, source material, brand assets, compliance rules, and avatar consent.", "Consent and source asset fields."),
      journey("Review", "See the course assembled into teachable assets.", "Delivery hub exposes curriculum, scripts, workbook, sales assets, and QA report.", "Workspace artifacts and reporting surface."),
      journey("Launch", "Use finished course assets to sell or publish.", "Sales page copy and launch emails are included as customer-ready outputs.", "Course sales page and launch sequence deliverables."),
    ],
    serviceBlueprint: blueprint(
      "Knowledge extraction",
      "Expert submits source material, market, transformation, and consent.",
      "Knowledge, curriculum, teaching-polish, and production agents create the course package.",
      "Artifacts launch into workspace, automation, capture, and reporting surfaces.",
      "If likeness consent is missing, API rejects launch until the required field is supplied."
    ),
    verificationPosture: "Prepared to generate course assets and consent-gated delivery surfaces. Actual video rendering depends on connected or managed production tooling.",
  },
  "ai-receptionist-missed-call-recovery": {
    offerFor: "Appointment-heavy local businesses that lose revenue when calls are missed or answered slowly.",
    decisionMaker: "Owner, practice manager, front-desk manager, operations lead, or local agency selling the service.",
    residentPersona: "Callers, patients, homeowners, guests, or prospects who need answers, booking, or routing right now.",
    messaging: "Recover missed calls and bookings with a 24/7 receptionist solution that answers questions, qualifies callers, books appointments, and hands off edge cases.",
    residentPainPoints: [
      "People call after hours or during busy periods and reach no one.",
      "Front-desk teams repeat the same answers instead of focusing on in-person work.",
      "High-value prospects abandon the business and call a competitor.",
      "Owners cannot see how many calls, bookings, or escalations were missed.",
    ],
    expectedOutcome: "A missed-call recovery hub with knowledge base, inbound call script, booking handoff, SMS fallback, transcript dashboard, escalation rules, and test-call suite.",
    deliveryShape: ["Business knowledge base", "Call script", "Booking handoff", "Missed-call SMS sequence", "Transcript dashboard", "Escalation rules"],
    userJourney: [
      journey("Need help", "Get an answer without waiting for office hours.", "Caller reaches the capture or call workflow and receives approved guidance.", "Capture surface and voice script artifact."),
      journey("Qualify", "Confirm the service, urgency, and next step.", "System asks approved questions and routes by urgency and fit.", "Qualification and escalation artifacts."),
      journey("Book", "Secure an appointment or callback.", "Booking handoff uses calendar URL or managed handoff instructions.", "Booking URL, operator surface, and managed defaults."),
      journey("Follow up", "Know what happened after the call.", "Operator sees transcript, next action, and reporting outputs.", "Transcript dashboard and reporting URL."),
    ],
    serviceBlueprint: blueprint(
      "Call recovery",
      "Client provides services, hours, FAQs, calendar, escalation contacts, and phone rules.",
      "Voice intake, conversation design, test-call, and monitoring agents create the flow.",
      "Provisioner launches workspace, capture, operator, and reporting artifacts.",
      "If phone provider access is absent, managed handoff launches while live telephony waits for approved account access."
    ),
    verificationPosture: "Prepared to deliver scripts, routing surfaces, SMS fallback, and reporting artifacts. Live phone-number activation requires phone/SMS provider access.",
  },
  "lead-reactivation-engine": {
    offerFor: "Businesses with old leads, no-shows, stale quotes, past buyers, or dormant CRM records.",
    decisionMaker: "Owner, sales manager, marketing lead, agency operator, or revenue leader.",
    residentPersona: "Past prospects or customers who showed interest but never booked, bought, or returned.",
    messaging: "Turn leads you already paid for into appointments and pipeline instead of buying more traffic.",
    residentPainPoints: [
      "Old leads sit untouched in spreadsheets or CRM lists.",
      "Sales teams do not know who should be recontacted first.",
      "Manual follow-up is inconsistent and rarely measured.",
      "Businesses want upside without paying again to acquire the same demand.",
    ],
    expectedOutcome: "A reactivation system with CRM cleanup, segments, offer map, SMS/email sequence, reply classifier, booking flow, consent log, and recovered revenue dashboard.",
    deliveryShape: ["CRM cleanup plan", "Dormant segments", "Reactivation sequence", "Reply classifier", "Booking flow", "Recovered revenue dashboard"],
    userJourney: [
      journey("Identify", "Find recoverable pipeline in existing lists.", "Client submits or references CRM data and current process.", "CRM export and current process fields."),
      journey("Re-engage", "Send relevant messages without manual chasing.", "Sequence and reply classification artifacts define the outreach path.", "Automation artifacts and consent log."),
      journey("Book", "Route warm replies to appointments or human follow-up.", "Booking flow and operator board show next action.", "Booking handoff and operator URL."),
      journey("Measure", "See recovered revenue and appointment counts.", "Reporting surface shows contacted, replied, booked, and pipeline metrics.", "Recovered revenue dashboard."),
    ],
    serviceBlueprint: blueprint(
      "Lead recovery",
      "Client supplies list context, offer, constraints, booking path, and success metric.",
      "CRM audit, offer, reply, and booking agents build the reactivation path.",
      "Provisioner creates artifacts, reporting, and managed defaults for missing CRM access.",
      "If list access is absent, system launches with import-ready templates and handoff instructions."
    ),
    verificationPosture: "Prepared to deliver campaign assets, segments, booking handoffs, and dashboards. Live sends require approved SMS/email/CRM access.",
  },
  "speed-to-lead-system": {
    offerFor: "Businesses spending money on ads, forms, quote requests, demos, or booking funnels.",
    decisionMaker: "Marketing lead, sales manager, founder, local business owner, or agency operator.",
    residentPersona: "Fresh leads who just raised their hand and expect a fast response before they choose a competitor.",
    messaging: "Respond to every new lead in under a minute with qualification, routing, booking, and SLA reporting.",
    residentPainPoints: [
      "Ad leads go cold while teams are in meetings, on jobs, or offline.",
      "Slow first response makes paid campaigns look worse than they are.",
      "Sales reps lack context when they finally respond.",
      "Owners cannot prove response-time improvement.",
    ],
    expectedOutcome: "A speed-to-lead workflow with webhook capture, instant response scripts, qualification flow, booking route, CRM updates, sales alerts, follow-up sequence, and SLA dashboard.",
    deliveryShape: ["Lead webhook schema", "Instant response script", "Qualification flow", "Booking route", "Rep alert", "SLA dashboard"],
    userJourney: [
      journey("Submit", "Get contacted immediately after requesting help.", "Lead enters a form, ad, or landing page path.", "Webhook and capture artifacts."),
      journey("Respond", "Answer qualifying questions with minimal friction.", "System sends approved SMS, email, or voice script.", "Instant response and qualification artifacts."),
      journey("Book", "Schedule or route to the right rep.", "Qualified lead reaches calendar or sales alert workflow.", "Booking route and rep alert."),
      journey("Report", "Understand first-touch performance.", "Dashboard shows response time, booked leads, and SLA misses.", "Speed-to-lead dashboard."),
    ],
    serviceBlueprint: blueprint(
      "Fast follow-up",
      "Client submits form source, sales calendar, qualification rules, and CRM context.",
      "Webhook, qualification, voice/SMS, and SLA agents build the response path.",
      "Provisioner creates capture, operator, reporting, and CRM handoff artifacts.",
      "If ad or CRM access is missing, system launches webhook specs and managed handoff instructions."
    ),
    verificationPosture: "Prepared to deliver webhook specs, response scripts, and SLA reporting. Live event capture and outbound contact require connected forms and messaging accounts.",
  },
  "content-repurposing-engine": {
    offerFor: "Creators, experts, founders, consultants, coaches, agencies, and podcasters with underused long-form content.",
    decisionMaker: "Founder, creator, marketing lead, personal brand operator, or agency owner.",
    residentPersona: "Audience members and prospects who need consistent, platform-native content before they trust or buy.",
    messaging: "Turn one source asset into a month of content across posts, newsletters, blogs, carousels, and clips.",
    residentPainPoints: [
      "The client has expertise but cannot post consistently.",
      "Long-form material is not repurposed into platform-native assets.",
      "Content creation takes too long and loses brand voice.",
      "There is no approval queue or performance loop.",
    ],
    expectedOutcome: "A content engine with transcript, idea map, post packs, newsletter and blog drafts, clip plan, carousel copy, publishing calendar, approval queue, and performance report.",
    deliveryShape: ["Transcript and idea map", "Social post pack", "Newsletter/blog drafts", "Clip plan", "Carousel copy", "Publishing calendar"],
    userJourney: [
      journey("Upload", "Reuse existing material instead of creating from scratch.", "Client submits a source asset and brand voice.", "Source asset and brand voice fields."),
      journey("Transform", "Receive platform-native assets.", "Transcript and platform agents generate differentiated outputs.", "Workspace artifacts."),
      journey("Approve", "Review content without hunting across files.", "Approval queue and calendar organize assets.", "Operator surface and calendar deliverable."),
      journey("Improve", "See which ideas perform.", "Performance report informs the next month.", "Reporting surface."),
    ],
    serviceBlueprint: blueprint(
      "Content conversion",
      "Client supplies source material, audience, offers, platforms, and approval preferences.",
      "Transcript, insight, platform, and scheduler agents generate the content system.",
      "Provisioner launches content artifacts and reporting surfaces.",
      "If social access is missing, publishing remains an approval-ready handoff instead of live posting."
    ),
    verificationPosture: "Prepared to deliver content assets, calendar, and approval surfaces. Live publishing requires approved scheduler or social account access.",
  },
  "ai-ugc-video-ad-studio": {
    offerFor: "Ecommerce and product brands that need a constant stream of fresh ad creative.",
    decisionMaker: "Founder, growth marketer, ecommerce operator, paid media lead, or agency.",
    residentPersona: "Shoppers who need clear product proof, relatable scenarios, and concise reasons to buy.",
    messaging: "Create more ad creative, faster, using research-backed hooks, product language, AI UGC briefs, compliance checks, and testing plans.",
    residentPainPoints: [
      "Creative fatigue forces constant new variants.",
      "Traditional UGC is slow, expensive, and inconsistent.",
      "Competitor copying creates generic ads.",
      "Unsupported claims and synthetic endorsements create platform risk.",
    ],
    expectedOutcome: "An ad studio package with product brief, review and Reddit language mine, hook library, UGC scripts, AI video production briefs, static ad concepts, testing matrix, and compliance report.",
    deliveryShape: ["Product brief", "Customer language mine", "Hook library", "UGC scripts", "Video production brief", "Testing matrix"],
    userJourney: [
      journey("Brief", "Explain the product and allowed claims.", "Client submits product, assets, audience, and compliance rules.", "Brand assets and compliance fields."),
      journey("Research", "Find customer language competitors are not using.", "Research agent mines reviews, forums, comments, and competitor formats.", "Review and Reddit language mine."),
      journey("Create", "Receive test-ready ad concepts.", "Hook and script agents generate videos, statics, and variants.", "UGC scripts and static ad artifacts."),
      journey("Test", "Know what to test and what to avoid.", "Testing matrix and compliance report guide launch.", "Reporting artifacts."),
    ],
    serviceBlueprint: blueprint(
      "Creative production",
      "Client provides product assets, current ads, audience, and claims boundaries.",
      "Research, hook, script, and compliance agents build the creative package.",
      "Provisioner launches workspace and reporting artifacts.",
      "If ad account access is missing, outputs are delivered as upload-ready creative briefs and scripts."
    ),
    verificationPosture: "Prepared to deliver creative strategy, scripts, briefs, and compliance checks. Final video rendering and ad publishing depend on production and ad-account access.",
  },
  "med-spa-growth-engine": {
    offerFor: "Med spas and aesthetic clinics that need booked consultations for high-value treatments.",
    decisionMaker: "Med spa owner, practice manager, marketing manager, or aesthetic clinic operator.",
    residentPersona: "Prospective patients or clients comparing local treatment providers and deciding who to trust.",
    messaging: "Generate more booked consultations through service-specific ad creative, local search readiness, reviews, consultation capture, and compliance-safe reporting.",
    residentPainPoints: [
      "High-value treatments require trust before booking.",
      "Google Business Profiles often lack reviews, keywords, photos, or service clarity.",
      "Ad creative gets stale and may make risky claims.",
      "Owners need consultation counts, not vanity metrics.",
    ],
    expectedOutcome: "A med-spa growth workspace with GBP audit, review flow, citation package, monthly ad creative, service pain research, consultation funnel, lead dashboard, and compliance checklist.",
    deliveryShape: ["GBP audit", "Review flow", "Citation package", "Ad creative pack", "Consultation capture funnel", "Lead dashboard"],
    userJourney: [
      journey("Discover", "Find a credible local provider.", "Directory, local search, or ad path points prospects to consultation capture.", "GBP, citation, and ad artifacts."),
      journey("Trust", "Understand treatment options without unsafe claims.", "Compliance-safe content and proof support decisions.", "Claims checklist."),
      journey("Book", "Request a consultation quickly.", "Consultation capture funnel qualifies and routes the lead.", "Capture surface."),
      journey("Measure", "See bookings and treatment value.", "Reporting surface shows consultation and source performance.", "Lead and booking dashboard."),
    ],
    serviceBlueprint: blueprint(
      "Med spa growth",
      "Client supplies services, local market, assets, offers, and claim limits.",
      "Local audit, creative research, ad, and reporting agents create the growth system.",
      "Provisioner launches capture, workspace, reporting, and operator outputs.",
      "If GBP or ad access is missing, system launches checklists and briefs for managed handoff."
    ),
    verificationPosture: "Prepared to deliver growth assets and consultation surfaces. Live GBP edits, review sends, and ads require account access and compliance approval.",
  },
  "webinar-lead-magnet-factory": {
    offerFor: "B2B teams with webinars, workshops, trainings, or expert sessions that are not producing enough leads after the live event.",
    decisionMaker: "Marketing lead, founder, demand generation manager, consultant, or education business owner.",
    residentPersona: "Prospects who prefer useful educational assets before booking a demo or sales call.",
    messaging: "Turn existing webinars into lead magnets, landing copy, emails, and LinkedIn assets that keep generating pipeline.",
    residentPainPoints: [
      "Webinar recordings become dormant assets after the event.",
      "Registration and attendance are not converted into reusable demand.",
      "Teams lack time to write ebooks, checklists, posts, and nurture emails.",
      "Lead magnet performance is not tracked.",
    ],
    expectedOutcome: "A webinar repurposing package with transcript, branded lead magnet, landing page copy, nurture emails, LinkedIn promo pack, article, opt-in tracking, and reuse inventory.",
    deliveryShape: ["Transcript", "Lead magnet", "Landing copy", "Nurture emails", "LinkedIn promo pack", "Opt-in tracking"],
    userJourney: [
      journey("Upload", "Use the webinar already recorded.", "Client submits webinar source and CTA.", "Source asset field."),
      journey("Extract", "Find the best frameworks and examples.", "Transcript and extraction agents structure content.", "Transcript and reuse inventory."),
      journey("Capture", "Offer a downloadable asset to prospects.", "Lead magnet and landing page copy create the opt-in path.", "Capture artifacts."),
      journey("Nurture", "Convert downloaders into sales conversations.", "Email and LinkedIn assets guide follow-up.", "Automation and reporting outputs."),
    ],
    serviceBlueprint: blueprint(
      "Webinar reuse",
      "Client submits recording, buyer, brand assets, CTA, and examples.",
      "Transcript, lead magnet, distribution, and analytics agents create the package.",
      "Provisioner launches resource, capture, nurture, and reporting artifacts.",
      "If publishing access is missing, assets are delivered as ready-to-publish copy and files."
    ),
    verificationPosture: "Prepared to deliver content and lead magnet assets. Actual PDF design export and distribution depend on connected design and publishing workflow.",
  },
  "founder-ai-chief-of-staff": {
    offerFor: "Busy founders and executives whose inbox, calendar, CRM, reporting, and follow-up loops consume too much time.",
    decisionMaker: "Founder, CEO, creator-operator, executive, agency owner, or small-team lead.",
    residentPersona: "The founder and their immediate team who need fewer open loops and faster decisions.",
    messaging: "Install an AI chief of staff that turns scattered work into daily priorities, follow-ups, stale-lead alerts, dashboards, and executive summaries.",
    residentPainPoints: [
      "The founder is pulled into admin instead of high-leverage work.",
      "Important emails, leads, and decisions slip through the cracks.",
      "Dashboards are scattered or nonexistent.",
      "The team needs permission boundaries before automation can act.",
    ],
    expectedOutcome: "A founder operations package with operating profile, inbox rules, calendar workflow, CRM stale-lead monitor, daily priority brief, weekly dashboard, task routing, and permission rules.",
    deliveryShape: ["Operating profile", "Inbox triage rules", "Calendar workflow", "CRM monitor", "Daily brief", "Weekly dashboard", "Permission rules"],
    userJourney: [
      journey("Offload", "Describe how work should be triaged.", "Founder submits priorities, processes, and permissions.", "Email/calendar access and constraints fields."),
      journey("Organize", "Separate urgent work from noise.", "Inbox and CRM artifacts define categories and next actions.", "Automation and operator artifacts."),
      journey("Review", "Start each day with clear priorities.", "Daily brief and weekly dashboard summarize decisions and open loops.", "Reporting surface."),
      journey("Control", "Avoid risky autonomous actions.", "Permission rules separate auto actions, approval actions, and never actions.", "Safety deliverable."),
    ],
    serviceBlueprint: blueprint(
      "Founder operations",
      "Founder provides priorities, email/calendar context, CRM context, and delegation rules.",
      "Founder intake, inbox, CRM, and briefing agents define the operating system.",
      "Provisioner creates dashboards, rules, briefings, and handoff surfaces.",
      "If inbox/calendar access is missing, system launches as a policy and reporting workspace until connected."
    ),
    verificationPosture: "Prepared to deliver operating rules, dashboards, and briefing surfaces. Reading or sending real email/calendar events requires approved account access.",
  },
  "ai-first-business-os": {
    offerFor: "SMBs, startups, agencies, and operators ready to standardize multiple departments around AI-assisted workflows.",
    decisionMaker: "Founder, COO, agency owner, operations leader, or transformation lead.",
    residentPersona: "Internal teams in marketing, sales, delivery, admin, finance, support, and leadership.",
    messaging: "Install an AI-first operating system that maps the business, defines department agents, creates reusable skills, connects handoffs, and gives leadership operating visibility.",
    residentPainPoints: [
      "Departments operate from scattered tools and undocumented process memory.",
      "Manual follow-up, reporting, onboarding, and delivery work consume team capacity.",
      "Leaders cannot see which AI workflows are safe, active, or failing.",
      "Automation efforts remain one-off instead of becoming a reusable operating system.",
    ],
    expectedOutcome: "A business OS package with business brain, department architecture, agent roster, skill library, data handoff plan, operating dashboards, QA gates, and optimization cadence.",
    deliveryShape: ["Business brain", "Department map", "Agent roster", "Skill library", "Data handoff plan", "Dashboards", "QA gates"],
    userJourney: [
      journey("Map", "Turn scattered company context into a single operating model.", "Client submits business context, processes, and goals.", "Business brain and workflow map."),
      journey("Install", "Create department-specific responsibilities and workflows.", "Department and skill agents define operating layers.", "Agent roster and skill library."),
      journey("Operate", "Run from dashboards and approval gates.", "Operator surfaces show workflows, reporting, and safety rules.", "Dashboards and QA gates."),
      journey("Improve", "Iterate monthly on bottlenecks and new workflows.", "Optimization cadence creates a recurring improvement loop.", "Monthly optimization deliverable."),
    ],
    serviceBlueprint: blueprint(
      "Business OS install",
      "Client provides company docs, teams, tools, goals, and constraints.",
      "Audit, business brain, department, and skill agents produce the operating system.",
      "Provisioner launches workspace, operator, reporting, and automation artifacts.",
      "If system credentials are missing, managed handoff maps what to connect before live execution."
    ),
    verificationPosture: "Prepared to deliver the OS map, agent definitions, workflows, dashboards, and QA gates. Live cross-tool automation depends on connected systems.",
  },
  "local-service-lead-engine": getLocalLeadBlueprint(),
  "agency-client-workspace": {
    offerFor: "Agencies that need a repeatable client workspace for lead capture, reporting, and delivery accountability.",
    decisionMaker: "Agency owner, client success lead, fractional CMO, or lead-gen operator.",
    residentPersona: "Agency clients and their internal teams who need visibility into leads and outcomes without learning the agency's backend.",
    messaging: "Launch a branded client workspace that shows what was built, captures demand, routes leads, and reports progress.",
    residentPainPoints: ["Client work is scattered across docs, dashboards, and tools.", "Clients do not know what has launched or what is missing.", "Agencies need repeatable handoff and reporting.", "Credential collection blocks launches."],
    expectedOutcome: "A branded client workspace with capture funnel, routing policy, operator dashboard, report template, handoff page, credential checklist, and acceptance tests.",
    deliveryShape: ["Client workspace", "Capture funnel", "Routing policy", "Agency dashboard", "Client report", "Credential checklist"],
    userJourney: standardJourney("agency-client-workspace", "agency client", "client workspace", "leads and reporting"),
    serviceBlueprint: blueprint("Client workspace launch", "Agency submits client, market, offer, and routing details.", "Workspace and routing artifacts are generated.", "Provisioner creates client-facing pages and operator views.", "Missing credentials become checklist items and managed defaults."),
    verificationPosture: "Prepared to create client workspaces, reports, and handoff surfaces. Live CRM/webhook actions require approved access.",
  },
  "directory-monetization-system": {
    offerFor: "Directory owners, niche media sites, review sites, and community portals with traffic that should become paid lead demand.",
    decisionMaker: "Directory owner, media operator, local publisher, or marketplace founder.",
    residentPersona: "Residents, consumers, or buyers searching a directory for a provider, quote, or local match.",
    messaging: "Turn directory visitors into routed, priced, claimable leads with buyer matching and revenue reporting.",
    residentPainPoints: ["Visitors search but do not become monetized leads.", "Buyer routing is manual or unclear.", "Lead pricing and exclusivity are not standardized.", "Revenue attribution is hard to prove."],
    expectedOutcome: "A directory monetization system with category intake, buyer routing, lead inventory, pricing table, buyer onboarding, attribution, exclusivity rules, and revenue ledger.",
    deliveryShape: ["Category intake", "Buyer routing matrix", "Lead inventory", "Pricing table", "Buyer onboarding", "Revenue ledger"],
    userJourney: standardJourney("directory-monetization-system", "directory visitor", "matched request", "claimed lead revenue"),
    serviceBlueprint: blueprint("Directory demand routing", "Operator submits categories, buyers, territory, and monetization rules.", "Routing, pricing, and inventory artifacts are generated.", "Provisioner launches capture, operator, billing, and reporting surfaces.", "Payment and buyer webhooks remain managed handoffs until connected."),
    verificationPosture: "Prepared to deliver monetization surfaces and routing artifacts. Live payments and buyer delivery require billing/webhook access.",
  },
  "saas-trial-conversion-system": {
    offerFor: "SaaS teams with trial signups that do not reliably activate, book demos, or convert.",
    decisionMaker: "SaaS founder, growth lead, PLG manager, sales leader, or product marketer.",
    residentPersona: "Trial users and product-qualified accounts trying to reach value quickly.",
    messaging: "Convert more trials by tracking activation signals, scoring fit, nudging stuck users, and routing demo-ready accounts.",
    residentPainPoints: ["Users sign up but never reach the aha moment.", "Sales cannot see which trials are ready for a demo.", "Lifecycle messages are generic.", "Revenue attribution from trial to paid is incomplete."],
    expectedOutcome: "A trial conversion workspace with trial intake, activation event map, scoring model, lifecycle sequence, demo routing, subscription handoff, ROI dashboard, and operator playbook.",
    deliveryShape: ["Trial intake", "Activation event map", "Trial scoring", "Lifecycle emails", "Demo routing", "ROI dashboard"],
    userJourney: standardJourney("saas-trial-conversion-system", "trial user", "activation path", "paid conversion"),
    serviceBlueprint: blueprint("Trial conversion", "SaaS team submits product, trial milestones, offer, and revenue context.", "Activation, scoring, lifecycle, and routing artifacts are generated.", "Provisioner launches capture, automation, billing, and reporting outputs.", "Live product events and billing require connected webhooks or Stripe access."),
    verificationPosture: "Prepared to deliver trial scoring, messaging, and reporting artifacts. Live event ingestion requires product and billing integrations.",
  },
  "consultant-authority-funnel": {
    offerFor: "Consultants, coaches, advisors, and experts who need qualified calls instead of low-fit inquiries.",
    decisionMaker: "Consultant, coach, fractional executive, advisor, or service provider.",
    residentPersona: "Prospects deciding whether the expert is credible and worth booking.",
    messaging: "Turn authority into qualified appointments with a funnel that educates, scores, books, and prepares the consultant for the call.",
    residentPainPoints: ["Prospects book before they are qualified.", "The consultant repeats the same education on every sales call.", "Proof and objections are not organized into a conversion path.", "Pipeline stages are manual."],
    expectedOutcome: "An authority funnel with landing page, prospect qualifier, booking handoff, proof sequence, lead brief, scoring, pipeline board, and proposal trigger.",
    deliveryShape: ["Authority page", "Prospect qualifier", "Booking handoff", "Proof sequence", "Lead brief", "Pipeline board"],
    userJourney: standardJourney("consultant-authority-funnel", "prospect", "qualified booking", "sales-ready consultation"),
    serviceBlueprint: blueprint("Authority funnel", "Consultant submits offer, audience, proof, calendar, and constraints.", "Qualifier, proof, scoring, and proposal artifacts are generated.", "Provisioner launches capture, operator, and automation surfaces.", "If calendar is missing, leads route to manual booking instructions."),
    verificationPosture: "Prepared to deliver funnel and qualification assets. Live calendar or contract generation requires approved integrations.",
  },
  "franchise-territory-router": {
    offerFor: "Franchises and multi-location brands that need leads routed to the right location or owner.",
    decisionMaker: "Franchise operator, brand lead, territory manager, or multi-location owner.",
    residentPersona: "Consumers or local buyers who expect the nearest correct location to respond quickly.",
    messaging: "Route every lead to the right territory while giving the brand one view of response, source, and performance.",
    residentPainPoints: ["Territory conflicts create bad customer experiences.", "Brand teams lack visibility after handoff.", "Local operators respond inconsistently.", "Overflow and unavailable territory rules are unclear."],
    expectedOutcome: "A territory router with intake page, routing matrix, brand dashboard, location view, conflict rules, territory report, SLA monitor, and launch checklist.",
    deliveryShape: ["Territory intake", "Routing matrix", "Brand dashboard", "Location view", "Conflict rules", "SLA monitor"],
    userJourney: standardJourney("franchise-territory-router", "local buyer", "correct territory handoff", "faster local response"),
    serviceBlueprint: blueprint("Territory routing", "Brand submits territories, owner rules, markets, and handoff constraints.", "Routing, conflict, SLA, and reporting artifacts are generated.", "Provisioner launches capture and operator surfaces.", "CRM or location webhook gaps become managed handoff tasks."),
    verificationPosture: "Prepared to deliver territory rules and reporting. Live location notifications require CRM/webhook access.",
  },
  "marketplace-lead-seller-system": {
    offerFor: "Lead sellers and marketplaces that need packaged inventory, buyer claims, pricing, and outcome tracking.",
    decisionMaker: "Marketplace founder, lead seller, agency owner, or vertical media operator.",
    residentPersona: "Lead buyers who need clear lead quality, price, category, market, and outcome tracking.",
    messaging: "Turn qualified demand into buyer-ready lead inventory with pricing, claims, revenue, and compliance notes.",
    residentPainPoints: ["Leads are sold manually or inconsistently.", "Buyers do not trust quality without scoring.", "Pricing varies without rules.", "Outcomes and refunds are hard to track."],
    expectedOutcome: "A marketplace system with inventory board, buyer claim flow, lead quality scoring, pricing setup, buyer onboarding, outcome reporting, revenue summary, and compliance notes.",
    deliveryShape: ["Inventory board", "Claim flow", "Quality scoring", "Pricing setup", "Buyer onboarding", "Revenue summary"],
    userJourney: standardJourney("marketplace-lead-seller-system", "lead buyer", "claimable inventory", "tracked purchased lead"),
    serviceBlueprint: blueprint("Lead marketplace", "Operator submits buyer, category, pricing, and consent rules.", "Inventory, scoring, pricing, claim, and outcome artifacts are generated.", "Provisioner launches operator, billing, and reporting surfaces.", "Live payment and delivery require billing/webhook credentials."),
    verificationPosture: "Prepared to deliver inventory and claim surfaces. Live transactions require payment setup and buyer delivery channels.",
  },
  "affiliate-partner-revenue-system": {
    offerFor: "Partner and affiliate programs that need source tracking, commission logic, and partner reporting.",
    decisionMaker: "Partnerships lead, affiliate manager, founder, channel team, or creator-program operator.",
    residentPersona: "Partners, affiliates, creators, and resellers who need trust that their referrals are tracked and credited.",
    messaging: "Capture partner-sourced leads, attribute revenue correctly, and show partners what they generated.",
    residentPainPoints: ["Partner links and UTMs are inconsistent.", "Commission rules are unclear.", "Fraud and duplicate referrals are not checked.", "Partners lack visibility into lead and revenue status."],
    expectedOutcome: "A partner revenue system with capture links, attribution model, commission table, partner dashboard, fraud checks, conversion webhook, onboarding form, and ROI report.",
    deliveryShape: ["Partner links", "Attribution model", "Commission table", "Partner dashboard", "Fraud checks", "ROI report"],
    userJourney: standardJourney("affiliate-partner-revenue-system", "partner", "credited referral", "attributed revenue"),
    serviceBlueprint: blueprint("Partner revenue", "Program owner submits partner rules, offers, commission logic, and conversion events.", "Attribution, commission, fraud, and dashboard artifacts are generated.", "Provisioner launches capture, billing, automation, and reporting surfaces.", "Live payout and conversion events require billing/webhook integration."),
    verificationPosture: "Prepared to deliver partner tracking artifacts. Live payouts and conversion tracking depend on payment and event integrations.",
  },
  "reactivation-retention-system": {
    offerFor: "Operators with dormant leads, churn risk, inactive customers, or repeat purchase opportunities.",
    decisionMaker: "Founder, lifecycle marketer, sales manager, customer success lead, or agency.",
    residentPersona: "Dormant customers or prospects who may return if the offer and timing are relevant.",
    messaging: "Bring dormant customers and stale leads back into a measurable revenue path with segments, offers, messages, and outcome tracking.",
    residentPainPoints: ["Inactive customers are ignored until revenue drops.", "Winback messaging is manual and inconsistent.", "Risk signals are not prioritized.", "Recovered revenue is not measured."],
    expectedOutcome: "A reactivation and retention workspace with segments, sequences, risk scoring, offer rules, outcome board, suppression, ROI report, and daily follow-up list.",
    deliveryShape: ["Dormant segments", "Reactivation sequence", "Risk scoring", "Offer rules", "Outcome board", "ROI report"],
    userJourney: standardJourney("reactivation-retention-system", "dormant customer", "relevant return path", "reactivated revenue"),
    serviceBlueprint: blueprint("Retention recovery", "Client submits dormant segment, offer, suppression rules, and current process.", "Risk, sequence, offer, and outcome artifacts are generated.", "Provisioner launches automation, operator, and reporting outputs.", "Live sends and CRM updates require approved access."),
    verificationPosture: "Prepared to deliver retention assets and reporting. Live outreach requires email/SMS/CRM credentials.",
  },
  "operator-control-plane-system": {
    offerFor: "Agencies, internal operators, and autonomous-system owners who need one place to run delivery.",
    decisionMaker: "Agency owner, operations lead, platform operator, or internal automation lead.",
    residentPersona: "Operators responsible for health, readiness, queues, toggles, revenue, audit logs, and incident response.",
    messaging: "Run the system from one control plane instead of jumping between dashboards, scripts, queues, and docs.",
    residentPainPoints: ["Operators cannot see readiness across systems.", "Feature toggles, queues, billing, and incidents are scattered.", "Audit trails are incomplete.", "Launches fail because dependencies are not visible."],
    expectedOutcome: "A control plane with health panel, activation checklist, queue visibility, toggle register, revenue command center, audit trail, agent execution surface, and incident runbook.",
    deliveryShape: ["Health panel", "Activation checklist", "Queue surface", "Toggle register", "Revenue center", "Incident runbook"],
    userJourney: standardJourney("operator-control-plane-system", "operator", "single command center", "controlled delivery"),
    serviceBlueprint: blueprint("Control plane", "Operator submits runtime, team, and operating requirements.", "Health, checklist, queue, toggle, revenue, and incident artifacts are generated.", "Provisioner launches operator and reporting surfaces.", "Live system health depends on configured infrastructure and providers."),
    verificationPosture: "Prepared to deliver control-plane artifacts and UI surfaces. Live queue/provider telemetry depends on connected services.",
  },
  "content-distribution-engine": {
    offerFor: "B2B marketers, creators, course sellers, consultants, and communities that need content to become qualified demand.",
    decisionMaker: "Marketing lead, founder, creator, consultant, or community operator.",
    residentPersona: "Audience members who consume content and need a clear path to a resource, offer, or qualified next step.",
    messaging: "Turn content attention into leads with lead magnets, delivery flows, nurture, scoring, experiments, and attribution.",
    residentPainPoints: ["Content gets attention but no captured demand.", "Lead magnets are not connected to nurture.", "Engagement is not scored.", "Distribution cadence is inconsistent."],
    expectedOutcome: "A distribution engine with lead magnet page, delivery flow, nurture sequence, distribution calendar, engagement scoring, CTA experiments, attribution report, and repurposing brief.",
    deliveryShape: ["Lead magnet page", "Resource flow", "Nurture sequence", "Distribution calendar", "Engagement scoring", "Attribution report"],
    userJourney: standardJourney("content-distribution-engine", "content audience", "resource opt-in", "qualified lead"),
    serviceBlueprint: blueprint("Content distribution", "Client submits content, resource, channels, audience, and CTA.", "Lead magnet, nurture, scoring, and attribution artifacts are generated.", "Provisioner launches capture, automation, and reporting surfaces.", "Live posting or email sends require connected publishing tools."),
    verificationPosture: "Prepared to deliver lead magnet and distribution assets. Live distribution requires email/social integrations.",
  },
  "revenue-attribution-suite": {
    offerFor: "Operators who need to prove which campaigns, partners, buyers, or sources create revenue.",
    decisionMaker: "Founder, agency operator, revenue leader, marketer, partner manager, or finance-adjacent operator.",
    residentPersona: "Internal decision makers who need trustworthy source-to-revenue visibility.",
    messaging: "Connect lead capture to revenue outcomes so the business knows what is working, what to scale, and what to stop.",
    residentPainPoints: ["Lead counts are disconnected from revenue.", "UTMs and conversion events are inconsistent.", "Partner or campaign ROI is debated manually.", "Data quality problems hide what actually works."],
    expectedOutcome: "An attribution suite with source map, conversion schema, ROI dashboard, revenue webhook, attribution model, pipeline value table, executive report, and data quality checklist.",
    deliveryShape: ["Source map", "Conversion schema", "ROI dashboard", "Revenue webhook", "Attribution model", "Executive report"],
    userJourney: standardJourney("revenue-attribution-suite", "decision maker", "trusted ROI view", "better budget decisions"),
    serviceBlueprint: blueprint("Revenue attribution", "Client submits sources, conversion events, revenue context, and reporting needs.", "Source, schema, attribution, and quality artifacts are generated.", "Provisioner launches reporting, automation, and workspace surfaces.", "Live revenue attribution requires event, billing, CRM, or webhook data."),
    verificationPosture: "Prepared to deliver attribution framework and reporting surfaces. Live data requires connected revenue and event sources.",
  },
} satisfies Record<PackageSlug, PackagePersonaBlueprint>;

export function getPackagePersonaBlueprint(slug: PackageSlug): PackagePersonaBlueprint {
  return packagePersonaBlueprints[slug];
}

function journey(stage: string, personaGoal: string, systemExperience: string, evidence: string): PersonaJourneyStep {
  return { stage, personaGoal, systemExperience, evidence };
}

function blueprint(
  phase: string,
  frontstage: string,
  backstage: string,
  support: string,
  failureState: string,
): ServiceBlueprintStep[] {
  return [
    { phase, frontstage, backstage, support, failureState },
    {
      phase: "Provision",
      frontstage: "Client sees launched delivery, capture, operator, reporting, and billing links as applicable.",
      backstage: "Package provisioner creates URLs, artifacts, automation runs, acceptance tests, embed code, and solution brief.",
      support: "Package catalog, provisioner, persistence store, workspace route, and managed handoff defaults.",
      failureState: "Validation blocks missing required fields; persistence failures return explicit 503 errors.",
    },
    {
      phase: "Operate",
      frontstage: "Client or operator uses the delivered outputs and reports rather than learning a tool.",
      backstage: "Artifacts are grouped by launch surface and surfaced in the delivery hub.",
      support: "Workspace pages, reporting pages, operator surfaces, and acceptance-test evidence.",
      failureState: "External live actions remain labeled as needing approved account access when credentials are absent.",
    },
  ];
}

function standardJourney(slug: PackageSlug, persona: string, firstValue: string, result: string): PersonaJourneyStep[] {
  return [
    journey("Discover", `Understand how the offer helps the ${persona}.`, `Package page explains the ${firstValue} outcome in customer language.`, `Persona blueprint and package catalog for ${slug}.`),
    journey("Submit", "Give the business context once.", "Intake captures target market, offer, current process, success metric, constraints, and brand voice.", "Package provision form and API schema."),
    journey("Provision", "Receive a complete solution, not software to configure.", "Provisioner creates hub URLs, artifacts, automation run evidence, and acceptance tests.", "Package provisioner outputs."),
    journey("Use", `Reach ${result}.`, "Client uses delivered capture, operator, reporting, billing, or workspace outputs.", "Workspace route and package deliverables."),
  ];
}

function getLocalLeadBlueprint(): PackagePersonaBlueprint {
  return {
    offerFor: "Local service businesses and agencies that need more qualified local demand.",
    decisionMaker: "Owner, office manager, agency operator, or local lead-gen seller.",
    residentPersona: "Residents or local buyers who need fast help from a nearby provider.",
    messaging: "Capture urgent local demand, qualify it, route it, and prove source-level ROI.",
    residentPainPoints: [
      "Residents need immediate help and will contact multiple providers.",
      "Local teams miss or mishandle form and phone demand.",
      "Agencies need proof that leads are qualified and attributable.",
      "Routing by service, urgency, and completeness is often manual.",
    ],
    expectedOutcome: "A local lead engine with hosted capture page, embed widget, urgency scoring, routing rules, nurture sequence, booking handoff, attribution table, dashboard view, and launch QA checklist.",
    deliveryShape: ["Capture page", "Embed widget", "Urgency scoring", "Routing rules", "Nurture sequence", "Attribution table", "QA checklist"],
    userJourney: standardJourney("local-service-lead-engine", "resident", "urgent local request", "qualified local service lead"),
    serviceBlueprint: blueprint(
      "Local lead capture",
      "Resident submits service need, location, contact details, and urgency.",
      "Scoring and routing rules classify the request and prepare the correct handoff.",
      "Provisioner creates capture, operator, reporting, and embed surfaces.",
      "If CRM or booking access is missing, the lead routes to managed handoff instructions."
    ),
    verificationPosture: "Prepared to deliver capture, routing, attribution, and handoff artifacts. Live CRM or calendar insertion requires credentials.",
  };
}
