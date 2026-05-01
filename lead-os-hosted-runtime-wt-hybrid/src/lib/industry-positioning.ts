export interface IndustryOutcome {
  label: string;
  result: string;
  deliveredAs: string;
}

export interface IndustryJourneyStep {
  label: string;
  customerReality: string;
  systemResponse: string;
}

export interface IndustryPositioning {
  slug: string;
  eyebrow: string;
  audience: string;
  title: string;
  summary: string;
  marketTruth: string;
  primaryPain: string;
  promisedResult: string;
  proofMetric: string;
  painPoints: string[];
  outcomes: IndustryOutcome[];
  deliverables: string[];
  journey: IndustryJourneyStep[];
}

const sharedJourneyFallback: IndustryJourneyStep[] = [
  {
    label: "Capture",
    customerReality: "A qualified lead or customer request arrives and needs a clear next step.",
    systemResponse: "The intake path captures the context, urgency, contact details, and routing signals.",
  },
  {
    label: "Qualify",
    customerReality: "The business needs to know what matters now and what can wait.",
    systemResponse: "Lead OS scores urgency, fit, value, and next-best action before work reaches the team.",
  },
  {
    label: "Route",
    customerReality: "Manual triage slows down response time and lets opportunities leak.",
    systemResponse: "The right workflow, owner, message, or handoff is triggered automatically.",
  },
  {
    label: "Prove",
    customerReality: "The buyer needs to see whether the system paid for itself.",
    systemResponse: "The delivery hub reports the outcome, the bottleneck, and the next optimization.",
  },
];

export const industryPositioning: Record<string, IndustryPositioning> = {
  general: {
    slug: "general",
    eyebrow: "For overloaded operators",
    audience: "Owners and managers of service businesses that have demand, admin, and follow-up spread across email, forms, spreadsheets, phones, and memory.",
    title: "Turn a scattered service business into a managed operating system.",
    summary: "Lead OS installs the intake, routing, follow-up, reporting, and delivery checks that stop work from disappearing between people and tools.",
    marketTruth: "The real problem is not that the business lacks software. It is that no one owns the handoff from first request to finished outcome.",
    primaryPain: "Every team member has a different version of the truth, so leads go stale, customers wait, and owners become the backup system.",
    promisedResult: "A single customer journey where every request is captured, scored, routed, followed up, and reported without the owner chasing it.",
    proofMetric: "Hours saved per week, response time, lead-to-next-step rate, and unresolved handoffs.",
    painPoints: [
      "Requests arrive in too many places and nobody trusts one central queue.",
      "The owner is still the person who remembers which lead, invoice, or customer needs attention.",
      "Follow-up quality depends on who is working that day.",
      "Reporting explains what happened after the fact instead of preventing leaks while they happen.",
    ],
    outcomes: [
      { label: "One operating queue", result: "Every inbound request lands in a scored, owned, and visible workflow.", deliveredAs: "Intake forms, routing rules, owner assignments, and delivery status." },
      { label: "Faster follow-up", result: "High-value requests get immediate next steps instead of waiting for manual review.", deliveredAs: "Automated email, SMS, task, CRM, and handoff actions." },
      { label: "Proof of control", result: "Operators can see what is open, what moved, and what needs intervention.", deliveredAs: "Dashboard, audit trail, and weekly outcome report." },
    ],
    deliverables: [
      "Business intake map with required customer, lead, and workflow fields.",
      "Automated capture, scoring, routing, and follow-up path.",
      "Delivery hub showing open requests, routed work, and completed outcomes.",
      "Acceptance checks for every promised workflow before launch.",
    ],
    journey: sharedJourneyFallback,
  },
  legal: {
    slug: "legal",
    eyebrow: "For firms losing consults after the first call",
    audience: "Managing partners, intake directors, and practice owners who need faster consult qualification without weakening confidentiality, conflict, or case-fit discipline.",
    title: "Convert urgent legal inquiries before they call the next firm.",
    summary: "Lead OS gives law firms a disciplined intake and follow-up system that captures matter details, flags urgency, routes qualified consults, and keeps every prospect from falling into a paralegal inbox.",
    marketTruth: "A legal lead is not just a lead. It is a deadline, a conflict risk, a jurisdiction question, and often a scared person comparing firms in real time.",
    primaryPain: "Prospective clients go cold because the firm responds slowly, asks the same questions twice, or fails to explain the next step clearly.",
    promisedResult: "New matters are captured with the right facts, qualified by practice area and urgency, routed to the right person, and followed up until the consult is booked or disqualified.",
    proofMetric: "Consult booking rate, response time, completed intake rate, and qualified matter value.",
    painPoints: [
      "Inquiry forms collect contact details but miss the facts attorneys need to judge fit.",
      "Reception and intake teams struggle to separate urgent matters from poor-fit requests.",
      "No-shows and unprepared consults waste attorney time.",
      "Marketing spend is hard to defend because lead quality, booked consults, and signed matters are disconnected.",
    ],
    outcomes: [
      { label: "Matter-ready intake", result: "The firm receives structured context before the consult is accepted.", deliveredAs: "Practice-area intake, urgency flags, conflict prompts, and document request steps." },
      { label: "Qualified consult routing", result: "High-fit prospects are routed quickly to the right attorney or intake owner.", deliveredAs: "Scoring rules, routing queue, calendar handoff, and follow-up sequence." },
      { label: "Marketing accountability", result: "The firm can see which channels create qualified consults, not just form fills.", deliveredAs: "Lead source tracking, status reporting, and conversion dashboard." },
    ],
    deliverables: [
      "Practice-area specific intake questions and urgency logic.",
      "Consult qualification score and routing rules by case type.",
      "Follow-up sequences for booked, incomplete, and unqualified inquiries.",
      "Operator report for consults booked, stale leads, and matter-fit outcomes.",
    ],
    journey: [
      { label: "Urgent inquiry", customerReality: "A prospect has a deadline, accusation, injury, dispute, or immigration concern.", systemResponse: "Capture matter type, jurisdiction, urgency, contact consent, and immediate risk." },
      { label: "Fit screen", customerReality: "The firm needs to know whether this is worth attorney time.", systemResponse: "Score practice fit, value, urgency, and disqualification signals." },
      { label: "Consult handoff", customerReality: "The prospect expects a fast and confident next step.", systemResponse: "Book or route the consult, send preparation instructions, and keep reminders active." },
      { label: "Signed-matter proof", customerReality: "The firm needs to know whether intake created revenue.", systemResponse: "Report source, consult status, signed matter, and lost reason." },
    ],
  },
  "home-services": {
    slug: "home-services",
    eyebrow: "For contractors who lose jobs by responding late",
    audience: "Plumbers, HVAC companies, roofers, electricians, cleaners, landscapers, and local service operators that depend on calls, quotes, reviews, and repeat work.",
    title: "Catch the job while the homeowner still needs it fixed.",
    summary: "Lead OS installs a fast-response booking and quote engine for trades businesses so urgent calls, missed calls, web forms, and old estimates become booked jobs instead of competitor revenue.",
    marketTruth: "In home services, the winner is often the company that responds first with a clear next step, not the company with the prettiest website.",
    primaryPain: "The owner pays for ads, SEO, and referrals, then loses jobs because the phone is busy, the quote is slow, or no one follows up.",
    promisedResult: "Every lead is captured, qualified by job type and urgency, routed to the right crew or salesperson, and followed up until booked, won, or closed.",
    proofMetric: "Booked jobs, missed-call recovery, quote follow-up rate, speed-to-lead, and average job value recovered.",
    painPoints: [
      "After-hours calls turn into voicemail while the customer calls the next provider.",
      "Estimate requests sit unworked because dispatch is focused on today's jobs.",
      "Review requests are inconsistent, so local rankings do not reflect the quality of the work.",
      "Past customers and old estimates are rarely reactivated before slow season.",
    ],
    outcomes: [
      { label: "Missed-call recovery", result: "Calls that would have vanished become text follow-ups, bookings, or quote requests.", deliveredAs: "Phone intake, SMS response, calendar routing, and transcript log." },
      { label: "Quote-to-job conversion", result: "Open estimates get structured follow-up before the customer chooses someone else.", deliveredAs: "Estimate pipeline, reminder sequence, and win/loss tracking." },
      { label: "Local trust loop", result: "Happy customers are prompted for reviews while the job is still fresh.", deliveredAs: "Review request flow, reputation report, and repeat-customer prompts." },
    ],
    deliverables: [
      "Emergency and non-emergency intake paths by trade and service area.",
      "Automated missed-call, quote, and appointment follow-up.",
      "Dispatch or owner handoff rules for urgent jobs.",
      "Weekly report showing booked jobs, recovered leads, and stale estimates.",
    ],
    journey: [
      { label: "Problem at home", customerReality: "A homeowner has a leak, outage, broken AC, damaged roof, or overdue project.", systemResponse: "Capture service type, urgency, location, photos, and preferred appointment window." },
      { label: "Fast response", customerReality: "They are comparing whoever replies first.", systemResponse: "Send immediate confirmation, route urgent jobs, and book qualified appointments." },
      { label: "Quote follow-up", customerReality: "If they do not decide today, the job can still be saved.", systemResponse: "Trigger quote reminders, objection follow-up, and seasonal reactivation." },
      { label: "Repeat and review", customerReality: "The relationship is strongest right after a successful job.", systemResponse: "Request reviews, offer maintenance, and tag the customer for future campaigns." },
    ],
  },
  coaching: {
    slug: "coaching",
    eyebrow: "For experts selling trust before they sell time",
    audience: "Coaches, consultants, course creators, and expert-led firms that need better-fit calls, stronger authority, and fewer unqualified prospects on the calendar.",
    title: "Fill the calendar with prospects who already understand the transformation.",
    summary: "Lead OS turns your expertise, content, and offer into a qualification system that educates prospects, filters poor-fit leads, and books serious buyers into the right call.",
    marketTruth: "A high-ticket buyer rarely books because they saw one CTA. They book when the problem feels named, the path feels credible, and the next step feels personal.",
    primaryPain: "Discovery calls get filled with curious people, not committed buyers, because the funnel never explains fit, stakes, or expected transformation.",
    promisedResult: "Prospects are educated, scored, segmented, and routed to the right next step before they reach the calendar.",
    proofMetric: "Qualified call rate, show rate, close rate, content-to-call conversion, and time saved on poor-fit calls.",
    painPoints: [
      "Content creates attention but does not consistently move people toward a decision.",
      "Discovery calls repeat basic education that should have happened before booking.",
      "Lead magnets collect emails without revealing buying intent.",
      "The offer sounds like coaching instead of a concrete business or personal outcome.",
    ],
    outcomes: [
      { label: "Authority-to-call path", result: "Content readers and viewers are moved into a clear qualification journey.", deliveredAs: "Lead magnet, assessment, nurture sequence, and booking page." },
      { label: "Fit-based calendar", result: "The calendar prioritizes prospects with urgency, budget, and transformation fit.", deliveredAs: "Scoring model, application form, routing logic, and call prep." },
      { label: "Expertise repurposed", result: "Existing calls, videos, and frameworks become trust-building assets.", deliveredAs: "Content extraction, email sequence, proof assets, and offer copy." },
    ],
    deliverables: [
      "Buyer-fit assessment tied to the core transformation.",
      "Application and booking flow with qualification scoring.",
      "Authority nurture sequence using the expert's frameworks.",
      "Pipeline report showing booked calls, fit quality, and conversion bottlenecks.",
    ],
    journey: [
      { label: "Self-diagnosis", customerReality: "The prospect suspects they have the problem but may not know what to call it.", systemResponse: "Use assessment questions to name the gap and show the cost of staying put." },
      { label: "Trust build", customerReality: "They need to believe the expert has seen this pattern before.", systemResponse: "Deliver frameworks, proof, and relevant examples based on their answers." },
      { label: "Fit decision", customerReality: "Not every interested person should get a sales call.", systemResponse: "Score urgency, budget, readiness, and fit before offering the calendar." },
      { label: "Prepared call", customerReality: "A serious buyer wants a direct conversation about their situation.", systemResponse: "Send call prep to both prospect and operator so the conversation starts deep." },
    ],
  },
  construction: {
    slug: "construction",
    eyebrow: "For contractors whose profit leaks between bid and jobsite",
    audience: "General contractors, remodelers, specialty trades, and construction operators that manage bids, crews, change orders, client updates, and project follow-up across too many disconnected systems.",
    title: "Protect margin from the first bid request to the final follow-up.",
    summary: "Lead OS gives construction teams a bid and project communication layer that captures qualified opportunities, follows up on estimates, and keeps owners from managing work out of inboxes.",
    marketTruth: "Construction does not lose money only on bad bids. It loses money in slow follow-up, unclear scope, missed change signals, and client communication gaps.",
    primaryPain: "The team is busy doing the work, so bid requests, estimate follow-ups, and customer updates become inconsistent.",
    promisedResult: "Bid requests are qualified, estimates are followed up, project updates are structured, and operators can see which opportunities need attention.",
    proofMetric: "Estimate response time, bid follow-up rate, won bids, change-order visibility, and owner admin hours saved.",
    painPoints: [
      "Good leads arrive without enough scope details for a useful estimate.",
      "Old bids are forgotten even though the buyer has not made a decision.",
      "Project updates live in texts, emails, and field notes that never become one record.",
      "Owners cannot tell which opportunities deserve follow-up today.",
    ],
    outcomes: [
      { label: "Qualified bid intake", result: "The team receives scope, timeline, budget, location, and photos before estimating.", deliveredAs: "Bid intake form, attachment capture, scoring, and estimator handoff." },
      { label: "Estimate recovery", result: "Pending bids are followed up until won, lost, or archived.", deliveredAs: "Estimate pipeline, automated reminders, and lost-reason tracking." },
      { label: "Project communication control", result: "Clients receive clearer updates without owner bottlenecks.", deliveredAs: "Milestone messages, update templates, and escalation rules." },
    ],
    deliverables: [
      "Scope-first bid intake and qualification logic.",
      "Estimate follow-up workflow with status tracking.",
      "Client update templates by project stage.",
      "Operator dashboard for open bids, stale estimates, and project communication gaps.",
    ],
    journey: sharedJourneyFallback,
  },
  "real-estate": {
    slug: "real-estate",
    eyebrow: "For agents and teams racing the portal lead clock",
    audience: "Solo agents, team leads, brokers, and real estate operators who need to respond quickly, nurture long-cycle buyers and sellers, and keep database opportunities alive.",
    title: "Respond before the lead forgets which property made them click.",
    summary: "Lead OS creates a real estate lead response and nurture system that turns portal leads, listing inquiries, valuation requests, and old database contacts into real conversations.",
    marketTruth: "Real estate leads are perishable. The longer the response delay, the more the lead becomes someone else's client or no one's client.",
    primaryPain: "Agents pay for leads, then manually chase people who are months from action, already talking to competitors, or never properly segmented.",
    promisedResult: "New and existing contacts are qualified by timeline, motivation, property interest, and next step, then routed into the right follow-up path.",
    proofMetric: "Speed-to-lead, booked appointments, reactivated contacts, seller valuation requests, and pipeline value.",
    painPoints: [
      "Portal leads expect a response while they are still looking at the listing.",
      "Buyer timelines vary wildly, but most follow-up treats everyone the same.",
      "Seller leads need valuation context and trust before they agree to talk.",
      "Old CRM contacts represent paid-for demand that rarely gets reactivated.",
    ],
    outcomes: [
      { label: "Instant inquiry response", result: "Property and valuation leads receive a fast, relevant next step.", deliveredAs: "SMS/email response, timeline questions, and booking handoff." },
      { label: "Database reactivation", result: "Old buyers, sellers, and open-house contacts are sorted back into live conversations.", deliveredAs: "Segmented campaigns, reply classification, and agent alerts." },
      { label: "Motivation-based nurture", result: "Contacts get follow-up that matches their move timeline and intent.", deliveredAs: "Timeline tags, content sequences, and CRM status updates." },
    ],
    deliverables: [
      "Lead source intake for portal, listing, valuation, and open-house demand.",
      "Timeline and motivation scoring.",
      "Reactivation campaigns for old CRM contacts.",
      "Agent dashboard for booked calls, hot leads, and stale opportunities.",
    ],
    journey: sharedJourneyFallback,
  },
  tech: {
    slug: "tech",
    eyebrow: "For SaaS teams with users stuck before activation",
    audience: "SaaS founders, growth leads, product marketers, and customer success teams that need more trial users to reach activation and more accounts to stay engaged.",
    title: "Turn signups into activated users before the trial clock runs out.",
    summary: "Lead OS installs onboarding, lifecycle, and expansion workflows that detect stalled users, route qualified accounts, and create the right next action before churn becomes obvious.",
    marketTruth: "SaaS growth breaks when the team celebrates signups while users quietly fail to reach the moment where the product becomes useful.",
    primaryPain: "Trial users drop off because activation signals, education, sales handoff, and lifecycle messaging are not connected.",
    promisedResult: "Every user segment gets the right onboarding path, risk signal, sales handoff, or expansion prompt based on behavior and fit.",
    proofMetric: "Activation rate, trial-to-paid conversion, time-to-value, expansion signals, and churn-risk interventions.",
    painPoints: [
      "Users sign up but never complete the key action that predicts retention.",
      "Sales does not know which product-led accounts are worth human attention.",
      "Lifecycle emails are calendar-based instead of behavior-based.",
      "Customer success hears about churn after the usage drop has already happened.",
    ],
    outcomes: [
      { label: "Activation routing", result: "Users are guided to the next action based on product behavior and segment.", deliveredAs: "Lifecycle events, user scoring, onboarding steps, and in-app/email triggers." },
      { label: "Sales assist signal", result: "High-fit accounts get human follow-up when the timing is strongest.", deliveredAs: "PQL scoring, CRM alert, and account summary." },
      { label: "Retention early warning", result: "Risky accounts are flagged before renewal or cancellation pressure arrives.", deliveredAs: "Usage monitor, risk queue, and intervention playbooks." },
    ],
    deliverables: [
      "Activation map and user-event scoring logic.",
      "Lifecycle messaging for new, stalled, high-intent, and expansion-ready users.",
      "Sales and CS routing rules.",
      "Dashboard for activation, conversion, and churn-risk cohorts.",
    ],
    journey: sharedJourneyFallback,
  },
  education: {
    slug: "education",
    eyebrow: "For programs that need more enrolled learners, not more inquiries",
    audience: "Admissions directors, program owners, tutoring businesses, training providers, and education teams that need to turn interest into applications, enrollments, and retained students.",
    title: "Move prospective students from interest to enrollment with fewer dead ends.",
    summary: "Lead OS creates an enrollment journey that answers fit questions, follows up with families or learners, routes qualified applicants, and keeps admitted students engaged before they disappear.",
    marketTruth: "Education buyers compare trust, timing, cost, and outcomes. A generic brochure does not carry them through the decision.",
    primaryPain: "Programs collect inquiries but lose momentum during follow-up, application, financial questions, or pre-start communication.",
    promisedResult: "Prospects are guided from inquiry to fit check, application, advisor handoff, and enrollment follow-up with every drop-off visible.",
    proofMetric: "Inquiry-to-application rate, booked advisor calls, completed applications, enrolled students, and pre-start retention.",
    painPoints: [
      "Inquiry forms do not answer whether the program is actually a fit.",
      "Families and learners need repeated reassurance before committing.",
      "Application steps are abandoned when questions about cost, schedule, or outcomes go unanswered.",
      "Admitted students can go cold before the first class or onboarding milestone.",
    ],
    outcomes: [
      { label: "Fit-first inquiry", result: "Prospects get a clear next step based on goals, timeline, and program match.", deliveredAs: "Program-fit form, advisor routing, and personalized follow-up." },
      { label: "Application completion", result: "Incomplete applicants are reminded and helped before they drop out.", deliveredAs: "Application status triggers, reminders, and escalation rules." },
      { label: "Enrollment nurture", result: "Admitted students receive timely orientation and reassurance.", deliveredAs: "Pre-start sequence, FAQ handling, and retention dashboard." },
    ],
    deliverables: [
      "Program-fit intake and student goal segmentation.",
      "Advisor handoff and application follow-up workflows.",
      "Parent, learner, or employer nurture sequences.",
      "Enrollment report showing inquiries, applications, starts, and drop-offs.",
    ],
    journey: sharedJourneyFallback,
  },
  finance: {
    slug: "finance",
    eyebrow: "For advisory firms where trust and compliance shape every handoff",
    audience: "Financial advisors, CPAs, tax firms, bookkeepers, insurance practices, and wealth teams that need structured client intake, document collection, and follow-up without creating compliance chaos.",
    title: "Make client onboarding feel controlled before money or documents change hands.",
    summary: "Lead OS gives finance and accounting teams a compliant-feeling intake and follow-up layer that collects the right facts, routes clients by service need, and keeps document-heavy work moving.",
    marketTruth: "Finance buyers are not only buying speed. They are buying confidence that sensitive work will be handled carefully.",
    primaryPain: "Client onboarding slows down because facts, documents, signatures, and follow-up requests live across inboxes and portals.",
    promisedResult: "New client requests are segmented, document needs are triggered, follow-ups are tracked, and operators can see which accounts are blocked.",
    proofMetric: "Onboarding cycle time, completed document requests, booked consults, stale client tasks, and compliance-sensitive handoff completion.",
    painPoints: [
      "Prospects ask complex questions before the firm has enough context.",
      "Document requests are repeated manually and still arrive incomplete.",
      "Seasonal deadlines create follow-up pressure the team cannot manually absorb.",
      "Advisory opportunities are buried under tax, bookkeeping, or service emails.",
    ],
    outcomes: [
      { label: "Structured financial intake", result: "The firm receives the service need, deadline, entity context, and document status.", deliveredAs: "Segmented intake, secure-document instructions, and routing logic." },
      { label: "Document completion", result: "Clients know what is missing and staff know who is blocked.", deliveredAs: "Checklist reminders, status tracking, and escalation queue." },
      { label: "Advisory opportunity routing", result: "High-value clients are surfaced for review instead of buried in admin.", deliveredAs: "Client scoring, owner alert, and next-step sequence." },
    ],
    deliverables: [
      "Client intake by service line, deadline, and account type.",
      "Document request and reminder workflows.",
      "Consult, review, and advisory routing rules.",
      "Operator dashboard for blocked accounts, urgent deadlines, and high-value opportunities.",
    ],
    journey: sharedJourneyFallback,
  },
  franchise: {
    slug: "franchise",
    eyebrow: "For franchisors trying to see every location clearly",
    audience: "Franchise development teams, COOs, field ops leaders, and multi-location brands that need consistent lead routing, local execution, and performance visibility across territories.",
    title: "Give every location the same growth system without losing territory control.",
    summary: "Lead OS installs a franchise lead and operations layer that routes demand by territory, standardizes local follow-up, and shows which franchisees are converting or leaking opportunities.",
    marketTruth: "Franchise growth is a coordination problem: national demand, local owners, brand rules, uneven follow-up, and territory economics all collide.",
    primaryPain: "Corporate cannot prove whether lead quality, franchisee response, or local execution is causing performance gaps.",
    promisedResult: "Every inquiry is routed to the right territory, followed up with approved messaging, and reported by location, franchisee, and outcome.",
    proofMetric: "Territory response time, lead acceptance rate, location conversion, franchisee compliance, and revenue attribution.",
    painPoints: [
      "National campaigns create leads that local franchisees do not always work quickly.",
      "Brand-approved messaging breaks down in local follow-up.",
      "Corporate dashboards show leads but not the operational reason deals stall.",
      "Territory conflicts create trust issues between franchisees and headquarters.",
    ],
    outcomes: [
      { label: "Territory-safe routing", result: "Demand is assigned by territory, category, and owner without manual sorting.", deliveredAs: "Territory rules, franchisee handoff, and routing audit." },
      { label: "Brand-consistent follow-up", result: "Every location gets approved messages while still acting locally.", deliveredAs: "Message library, local tokens, and compliance checks." },
      { label: "Location performance proof", result: "Corporate can see which locations respond, convert, and need help.", deliveredAs: "Franchise dashboard, SLA report, and exception queue." },
    ],
    deliverables: [
      "Territory and location routing map.",
      "Franchisee handoff and lead acceptance workflow.",
      "Approved follow-up templates with local personalization.",
      "Multi-location report for SLA, conversion, and compliance.",
    ],
    journey: sharedJourneyFallback,
  },
  staffing: {
    slug: "staffing",
    eyebrow: "For recruiters buried in candidates but short on placements",
    audience: "Staffing agency owners, recruiting directors, and talent teams that need to screen candidates faster, reactivate talent pools, and keep clients informed without recruiter busywork.",
    title: "Move candidates and job orders before the desk gets stale.",
    summary: "Lead OS creates staffing workflows that screen candidates, route job-fit matches, reactivate old talent, and keep recruiter pipelines visible from first application to placement.",
    marketTruth: "Staffing money is made in speed, fit, and follow-through. A great candidate can become worthless if the agency responds tomorrow.",
    primaryPain: "Recruiters spend too much time sorting, chasing, and updating instead of matching the right candidate to the right job order.",
    promisedResult: "Candidates are screened, tagged, routed, and followed up automatically while recruiters focus on high-fit conversations.",
    proofMetric: "Candidate response time, qualified submissions, interview bookings, fill rate, and recruiter hours saved.",
    painPoints: [
      "Applications arrive faster than recruiters can screen them.",
      "Old candidate databases sit unused even when new roles open.",
      "Client updates depend on manual recruiter discipline.",
      "Job-fit signals are trapped in resumes, notes, and email threads.",
    ],
    outcomes: [
      { label: "Candidate screening", result: "Applicants are scored by role fit, availability, location, and requirements.", deliveredAs: "Screening form, resume summary, fit score, and recruiter queue." },
      { label: "Talent reactivation", result: "Past candidates are matched to new openings before sourcing starts from zero.", deliveredAs: "Segmented reactivation, reply classification, and match alerts." },
      { label: "Client pipeline clarity", result: "Clients see momentum without constant manual status emails.", deliveredAs: "Submission status, interview tracking, and client-ready updates." },
    ],
    deliverables: [
      "Role-fit candidate intake and scoring rules.",
      "Talent pool reactivation workflows.",
      "Recruiter queue for high-fit and urgent candidates.",
      "Placement pipeline report for submissions, interviews, and fills.",
    ],
    journey: sharedJourneyFallback,
  },
  faith: {
    slug: "faith",
    eyebrow: "For ministries where follow-up is pastoral, not transactional",
    audience: "Senior pastors, executive pastors, ministry administrators, and church operations teams that need better guest follow-up, volunteer coordination, giving communication, and member care.",
    title: "Help every guest, volunteer, and member receive the next right touch.",
    summary: "Lead OS creates a ministry engagement system that turns connect cards, prayer requests, volunteer interest, giving moments, and event signups into thoughtful follow-up.",
    marketTruth: "Church operations fail quietly when care depends on memory, scattered spreadsheets, and busy staff trying to remember every person.",
    primaryPain: "Guests, volunteers, and members fall through cracks because the team lacks one reliable follow-up path.",
    promisedResult: "People are captured with context, routed to the right ministry owner, followed up with appropriate timing, and visible until care is complete.",
    proofMetric: "Guest follow-up completion, volunteer response, event engagement, giving follow-up, and unresolved care tasks.",
    painPoints: [
      "Connect cards are collected but not consistently followed up.",
      "Volunteer interest gets lost between Sunday and the ministry leader's week.",
      "Prayer and care requests need sensitivity, ownership, and timely response.",
      "Giving and event communication often feels disconnected from real member journeys.",
    ],
    outcomes: [
      { label: "Guest care path", result: "New visitors receive warm, timely, appropriate follow-up.", deliveredAs: "Connect-card intake, owner assignment, and welcome sequence." },
      { label: "Volunteer coordination", result: "Interest becomes a clear next step instead of a forgotten form.", deliveredAs: "Role-fit questions, ministry routing, and follow-up reminders." },
      { label: "Care visibility", result: "Sensitive requests have ownership without becoming public noise.", deliveredAs: "Care queue, escalation rules, and completion tracking." },
    ],
    deliverables: [
      "Connect, prayer, volunteer, and event intake paths.",
      "Ministry-owner routing and follow-up reminders.",
      "Welcome, volunteer, and care communication templates.",
      "Engagement report for guests, volunteers, events, and unresolved care.",
    ],
    journey: sharedJourneyFallback,
  },
  creative: {
    slug: "creative",
    eyebrow: "For agencies tired of vague briefs and feast-or-famine pipelines",
    audience: "Creative agencies, studios, designers, video teams, photographers, and brand consultants that need better project intake, client qualification, approvals, and portfolio-to-lead conversion.",
    title: "Turn creative interest into scoped work without chasing every prospect manually.",
    summary: "Lead OS gives creative teams a qualification and delivery pipeline that captures serious buyers, clarifies project scope, manages approvals, and reports which work creates new opportunities.",
    marketTruth: "Creative teams do not just need more leads. They need better briefs, cleaner approvals, and prospects who understand the value before asking for a price.",
    primaryPain: "The team loses time to vague inquiries, poor-fit projects, revision loops, and a pipeline that depends on referrals arriving at the right time.",
    promisedResult: "Prospects are qualified by budget, timing, scope, and creative fit, then moved into a clear proposal or nurture path.",
    proofMetric: "Qualified inquiries, proposal readiness, approval cycle time, booked strategy calls, and project margin protection.",
    painPoints: [
      "Portfolio traffic does not consistently become qualified conversations.",
      "Prospects ask for quotes before scope, timeline, and success criteria are clear.",
      "Client approvals happen across threads and tools, creating revision drag.",
      "The studio's best thinking is trapped in calls and proposals that never become reusable sales assets.",
    ],
    outcomes: [
      { label: "Brief-ready intake", result: "The team receives budget, scope, goals, assets, and timing before quoting.", deliveredAs: "Creative brief form, fit score, and proposal handoff." },
      { label: "Approval discipline", result: "Feedback and revisions move through a visible path instead of scattered comments.", deliveredAs: "Approval checkpoints, status messages, and escalation rules." },
      { label: "Portfolio conversion", result: "Case studies and project pages guide visitors toward the right inquiry path.", deliveredAs: "Lead magnet, inquiry routing, and content follow-up." },
    ],
    deliverables: [
      "Project-fit intake and creative brief generator.",
      "Proposal-readiness scoring and routing.",
      "Client approval and revision follow-up workflows.",
      "Pipeline report for inquiries, proposals, approvals, and lost reasons.",
    ],
    journey: sharedJourneyFallback,
  },
  health: {
    slug: "health",
    eyebrow: "For practices where missed follow-up becomes lost care",
    audience: "Dental, med spa, chiropractic, therapy, wellness, veterinary, and specialty practices that need more booked appointments, fewer no-shows, and compliant patient communication discipline.",
    title: "Book the appointment while the patient still trusts the practice.",
    summary: "Lead OS installs patient-friendly intake, scheduling, reminder, and reactivation workflows that help practices convert inquiries without making staff carry every follow-up manually.",
    marketTruth: "Healthcare and wellness demand is personal. A slow, unclear response feels like the practice may not take the patient seriously.",
    primaryPain: "Front desk teams juggle calls, forms, insurance or service questions, reminders, and no-shows while revenue leaks from unbooked demand.",
    promisedResult: "Patient and client inquiries are captured, qualified, scheduled, reminded, reactivated, and reported with appropriate guardrails.",
    proofMetric: "Booked appointments, no-show rate, response time, reactivated patients, and front-desk hours saved.",
    painPoints: [
      "Phones are busiest exactly when staff are already serving patients.",
      "New patients ask the same cost, insurance, service, and availability questions repeatedly.",
      "No-shows and late cancellations create unused provider capacity.",
      "Past patients or leads go inactive even when they would return with the right prompt.",
    ],
    outcomes: [
      { label: "Appointment capture", result: "Inbound demand becomes booked appointments or clear next steps.", deliveredAs: "Intake, FAQ response, booking handoff, and staff alert." },
      { label: "No-show reduction", result: "Patients receive timely reminders and confirmation prompts.", deliveredAs: "Reminder sequence, reschedule path, and appointment status report." },
      { label: "Patient reactivation", result: "Old leads and inactive patients are invited back appropriately.", deliveredAs: "Segmented outreach, reply handling, and booking workflow." },
    ],
    deliverables: [
      "Service or appointment-specific intake and FAQ logic.",
      "Booking, reminder, and reschedule workflows.",
      "Reactivation campaigns for old leads and inactive patients.",
      "Practice report for booked visits, no-shows, reactivations, and staff workload.",
    ],
    journey: sharedJourneyFallback,
  },
  ecommerce: {
    slug: "ecommerce",
    eyebrow: "For brands that need more buying intent from the traffic they already have",
    audience: "Ecommerce founders, growth teams, beauty and wellness brands, product operators, and paid media teams that need better conversion, creative testing, retention, and customer lifecycle automation.",
    title: "Turn product attention into purchases, repeat orders, and better ad decisions.",
    summary: "Lead OS creates ecommerce growth systems that capture buying intent, recover abandoned revenue, generate creative angles, and move customers into repeat-purchase paths.",
    marketTruth: "Ecommerce growth is no longer just more traffic. Margins depend on conversion, creative velocity, offer clarity, retention, and knowing which customers deserve attention.",
    primaryPain: "Brands spend on ads and creators while checkout leaks, email flows underperform, and customer insights never make it back into the next campaign.",
    promisedResult: "Traffic, cart activity, customer feedback, and campaign signals become automated recovery, retention, and creative-testing workflows.",
    proofMetric: "Conversion rate, cart recovery, repeat purchase rate, creative output, CAC payback, and revenue per customer.",
    painPoints: [
      "Ad creative fatigues faster than the team can produce useful variants.",
      "Product page objections are visible in reviews and comments but absent from the page.",
      "Abandoned carts and first-time buyers receive generic flows that ignore intent.",
      "Retention campaigns do not reflect product usage, replenishment timing, or customer segment.",
    ],
    outcomes: [
      { label: "Conversion repair", result: "Product objections are captured and addressed in the buying path.", deliveredAs: "Review mining, offer copy, FAQ blocks, and product-page recommendations." },
      { label: "Revenue recovery", result: "Abandoned carts and stalled buyers receive intent-aware follow-up.", deliveredAs: "Cart, browse, and post-purchase workflow sequences with segmentation." },
      { label: "Creative velocity", result: "The brand gets more hooks, angles, and ad variants from customer language.", deliveredAs: "Creative briefs, UGC scripts, hooks, and performance report loop." },
    ],
    deliverables: [
      "Store funnel audit and product objection map.",
      "Cart, browse, and customer lifecycle follow-up workflows.",
      "Review/comment mining for ad and page copy.",
      "Creative testing report tied to offer, product, and audience signals.",
    ],
    journey: sharedJourneyFallback,
  },
  fitness: {
    slug: "fitness",
    eyebrow: "For gyms and coaches where motivation fades fast",
    audience: "Gyms, boutique studios, personal trainers, wellness coaches, and fitness operators that need more trial bookings, better member onboarding, and stronger retention.",
    title: "Turn interest into attendance before motivation disappears.",
    summary: "Lead OS gives fitness businesses a trial, onboarding, and retention journey that follows up fast, removes friction, and keeps members engaged beyond the first burst of motivation.",
    marketTruth: "Fitness buyers act when motivation is high, but that window closes quickly. The follow-up has to turn intent into a scheduled visit or habit.",
    primaryPain: "Leads inquire, download a challenge, or book a trial, then disappear before they ever become active members.",
    promisedResult: "Prospects are routed into trials, new members are onboarded into habits, and at-risk members are flagged before they cancel.",
    proofMetric: "Trial bookings, show rate, member conversion, attendance consistency, at-risk saves, and retained revenue.",
    painPoints: [
      "New leads need fast encouragement and a low-friction first step.",
      "Trials do not convert when the next appointment or membership offer is unclear.",
      "Members stop attending before staff notice they are at risk.",
      "Challenges and promotions collect interest without a disciplined conversion path.",
    ],
    outcomes: [
      { label: "Trial conversion", result: "Interested prospects are booked, reminded, and followed up after the first visit.", deliveredAs: "Lead form, trial calendar, reminder sequence, and post-visit offer." },
      { label: "Member onboarding", result: "New members receive habit-building prompts during the first fragile weeks.", deliveredAs: "Onboarding sequence, attendance check-ins, and milestone messages." },
      { label: "Retention warning", result: "At-risk members are surfaced before cancellation.", deliveredAs: "Attendance monitor, save offers, and staff alert queue." },
    ],
    deliverables: [
      "Trial intake and booking workflow.",
      "New-member onboarding sequence.",
      "Attendance and retention risk triggers.",
      "Fitness growth report for trials, shows, conversions, and member saves.",
    ],
    journey: sharedJourneyFallback,
  },
};

export function getIndustryPositioning(slug: string): IndustryPositioning {
  return industryPositioning[slug] ?? industryPositioning.general;
}
