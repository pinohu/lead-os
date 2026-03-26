// docs/libraries/lead-magnets/tools/build-lead-magnet-catalog.mjs
// Generates catalog.v1.json (100 magnets). Run: node tools/build-lead-magnet-catalog.mjs

import fs from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.join(__dirname, "..")

const niches = [
  "plumbing",
  "hvac",
  "legal",
  "healthcare",
  "saas",
  "ecommerce",
  "real_estate",
  "financial_services",
  "home_services",
  "professional_services",
  "general"
]

function sectionsQuiz(hook, nicheHint) {
  return {
    sections: [
      {
        id: "hero",
        headline: hook,
        subhead: `Personalized for ${nicheHint} buyers evaluating options.`,
        bullets: [
          "Takes under 2 minutes",
          "Instant clarity on your situation",
          "No obligation—results you can use today"
        ],
        cta_text: "Start the assessment",
        cta_action: "start_assessment"
      },
      {
        id: "mechanism",
        headline: "How it works",
        subhead: "Short questions → scored model → tailored recommendation.",
        bullets: [
          "Maps intent to urgency and fit",
          "Surfaces hidden constraints (timeline, budget, authority)",
          "Routes you to the right next step automatically"
        ],
        cta_text: "Continue",
        cta_action: "scroll_questions"
      },
      {
        id: "proof",
        headline: "Why this works",
        subhead: "Interactive diagnostics outperform static PDFs when traffic is cold or mixed.",
        cta_text: "See sample results",
        cta_action: "open_example_modal"
      },
      {
        id: "faq",
        headline: "Common questions",
        bullets: [
          "Your email unlocks the full breakdown and follow-up tips",
          "We never sell your data",
          "Unsubscribe anytime"
        ],
        cta_text: "Begin",
        cta_action: "start_assessment"
      },
      {
        id: "sticky",
        headline: "Ready?",
        subhead: "Get your personalized outcome.",
        cta_text: "Start now",
        cta_action: "start_assessment"
      }
    ],
    thank_you_page: {
      headline: "Check your results",
      next_step_cta: "Open personalized plan + calendar option"
    }
  }
}

function sectionsCalculator(hook) {
  return {
    sections: [
      {
        id: "hero",
        headline: hook,
        subhead: "See numbers tailored to your inputs—built for fast decisions.",
        bullets: ["Money/time in one view", "Shareable summary", "Optional deeper plan"],
        cta_text: "Open calculator",
        cta_action: "open_calculator"
      },
      {
        id: "inputs",
        headline: "Enter your details",
        subhead: "All fields map to transparent formulas (disclose methodology on-page).",
        cta_text: "Calculate",
        cta_action: "submit_calc"
      },
      {
        id: "trust",
        headline: "Methodology",
        bullets: [
          "Assumptions listed beside results",
          "Sensitivity note for key variables",
          "Clear disclaimer where projections apply"
        ],
        cta_text: "Continue",
        cta_action: "scroll_methodology"
      },
      {
        id: "social",
        headline: "Used by teams who need defensible estimates",
        cta_text: "Try it",
        cta_action: "open_calculator"
      },
      {
        id: "footer_cta",
        headline: "Want the full optimization plan?",
        subhead: "Unlock the detailed report and implementation checklist.",
        cta_text: "Unlock report",
        cta_action: "email_gate_results"
      }
    ],
    thank_you_page: {
      headline: "Your report is ready",
      next_step_cta: "Download PDF + book review call"
    }
  }
}

function sectionsTemplate(hook) {
  return {
    sections: [
      {
        id: "hero",
        headline: hook,
        subhead: "Copy, customize, ship—structured for immediate execution.",
        bullets: ["Editable source format", "Annotated guidance", "Works solo or with a team"],
        cta_text: "Get the template",
        cta_action: "capture_email"
      },
      {
        id: "preview",
        headline: "What’s inside",
        subhead: "Outline of sections, fields, and example answers.",
        cta_text: "Preview outline",
        cta_action: "expand_outline"
      },
      {
        id: "use_cases",
        headline: "Best for",
        bullets: ["New hires", "Client onboarding", "Campaign launches", "Ops audits"],
        cta_text: "Download",
        cta_action: "capture_email"
      },
      {
        id: "credibility",
        headline: "Built from operational reality",
        cta_text: "Claim access",
        cta_action: "capture_email"
      },
      {
        id: "final",
        headline: "Steal this workflow",
        cta_text: "Send me the kit",
        cta_action: "capture_email"
      }
    ],
    thank_you_page: {
      headline: "Download started",
      next_step_cta: "Watch the 3-minute walkthrough"
    }
  }
}

function nurture4(emailPrefix, goals) {
  return [
    {
      step: 1,
      channel: "email",
      timing: "immediate",
      subject: `${emailPrefix}: here’s what you requested`,
      summary: "Deliver asset + restate value promise + single CTA.",
      goal: goals[0],
      cta: "Open asset + complete profile",
      segment_tag: "magnet_delivered"
    },
    {
      step: 2,
      channel: "email",
      timing: "day_1",
      subject: `${emailPrefix}: the mistake most people make next`,
      summary: "Teach one sharp insight tied to their segment or inputs.",
      goal: goals[1],
      cta: "Read the breakdown",
      segment_tag: "education"
    },
    {
      step: 3,
      channel: "email",
      timing: "day_3",
      subject: `${emailPrefix}: quick win you can apply today`,
      summary: "Actionable checklist or micro-task with proof elements.",
      goal: goals[2],
      cta: "Apply the checklist",
      segment_tag: "activation"
    },
    {
      step: 4,
      channel: "email",
      timing: "day_5",
      subject: `${emailPrefix}: ready for the next step?`,
      summary: "Bridge to primary offer; include fallback self-serve path.",
      goal: goals[3],
      cta: "Book / buy / reply",
      segment_tag: "conversion_push"
    }
  ]
}

function automationBundle(kind) {
  const base = {
    context_detection: [
      "Niche id + tenant id from runtime boot manifest",
      "Persona hint from traffic source + landing params (utm, placement)",
      "Intent score from on-site behavior (scroll depth, return visit, calculator completion)"
    ],
    selection_rules: [
      `Cold / broad traffic → prefer ${kind === "quiz" ? "quiz/assessment" : kind === "calc" ? "calculator" : "asset"} magnet`,
      "High intent (pricing, emergency, competitor) → calculator or audit application",
      "Warm retargeting → mini-course or toolkit depth",
      "BOFU revisit → personalized service or demo funnel"
    ],
    runtime_actions: [
      "POST /api/intake with magnet_id + segment outputs + idempotency key",
      "Resolve funnel graph node → next best action + experiment assignment",
      "Enqueue execution tasks (CRM sync, nurture enrollment, booking job if qualified)"
    ],
    n8n_triggers: [
      "Webhook: lead.magnet.delivered",
      "Webhook: lead.nurture.step_completed",
      "Schedule: digest for operator if SLA risk (dispatch, booking)"
    ],
    suitedash_updates: [
      "Contact create/update with custom fields: magnet_id, segment, score, source",
      "Deal or circle stage movement: new_lead → qualified on engagement threshold",
      "Task for owner when BOFU signals fire (call, audit, proposal)"
    ]
  }
  return base
}

function magnetBase(overrides) {
  const m = {
    id: overrides.id,
    title: overrides.title,
    category: overrides.category,
    niche_applicability: overrides.niche_applicability ?? niches,
    persona: overrides.persona,
    funnel_stage: overrides.funnel_stage,
    trigger_event: overrides.trigger_event,
    asset_type: overrides.asset_type,
    value_promise: overrides.value_promise,
    hook: overrides.hook,
    landing_page_structure: overrides.landing_page_structure,
    capture_mechanism: overrides.capture_mechanism,
    delivery_method: overrides.delivery_method,
    nurture_sequence: overrides.nurture_sequence,
    conversion_path: overrides.conversion_path,
    automation_logic: overrides.automation_logic,
    required_tools: overrides.required_tools ?? [
      "lead_os_hosted_runtime",
      "lead_os_embed_widgets",
      "suitedash",
      "n8n",
      "email_provider"
    ],
    traffic_fit: overrides.traffic_fit ?? ["paid_social", "organic", "retargeting"],
    notes: overrides.notes ?? ""
  }
  return m
}

const magnets = []

// --- Category 1: Quiz / Assessment (10)
const cat1 = [
  {
    title: "What Type of [X] Are You? Diagnostic",
    persona: "curious_unaware",
    stage: "TOFU",
    trigger: "browsing_self_discovery",
    hook: "Find out your [type] in 60 seconds",
    promise: "Clarity on fit, risk, and next step—without a sales call.",
    asset: "interactive_quiz",
    capture: {
      type: "email_before_results",
      fields: ["email", "first_name", "optional_phone"],
      gating_rule: "Email required to unlock full results page + PDF",
      consent: ["marketing_email", "privacy_policy"]
    },
    delivery: {
      primary_channel: "results_page_plus_email",
      assets: ["dynamic_results_html", "pdf_summary", "segment_tags"],
      personalization: "Outcome buckets A/B/C drive copy and offer"
    },
    conv: {
      primary_offer: "Offer tailored to quiz outcome segment",
      fallback_offer: "Newsletter + toolkit for non-fit segments",
      success_metric: "qualified_lead_rate_and_booked_calls",
      booking_or_call: true
    },
    nKind: "quiz"
  },
  {
    title: "Readiness Score Assessment",
    persona: "evaluator",
    stage: "MOFU",
    trigger: "consideration_timing",
    hook: "Are you ready for [X]? Get your score",
    promise: "A numeric readiness model with gap analysis and fix list.",
    asset: "scored_assessment",
    capture: {
      type: "email_before_results",
      fields: ["email", "first_name", "company_optional"],
      gating_rule: "Score visible as teaser; breakdown email-gated",
      consent: ["marketing_email"]
    },
    delivery: {
      primary_channel: "email_plus_on_site",
      assets: ["scorecard", "gap_list_pdf"],
      personalization: "Subscores for budget, timing, authority, need"
    },
    conv: {
      primary_offer: "Fix your score implementation or advisory",
      fallback_offer: "Self-serve course or template pack",
      success_metric: "meetings_booked_from_gap_segment",
      booking_or_call: true
    },
    nKind: "quiz"
  },
  {
    title: "Risk Assessment Tool",
    persona: "risk_sensitive",
    stage: "TOFU",
    trigger: "fear_relief_search",
    hook: "How at risk is your [business/home/team] for [problem]?",
    promise: "Expose hidden exposure and prioritize mitigations.",
    asset: "risk_matrix_quiz",
    capture: {
      type: "partial_reveal",
      fields: ["email", "first_name"],
      gating_rule: "Show risk band; full matrix after email",
      consent: ["marketing_email"]
    },
    delivery: {
      primary_channel: "email",
      assets: ["risk_report", "mitigation_checklist"],
      personalization: "Severity tier + recommended service track"
    },
    conv: {
      primary_offer: "Mitigation service or audit",
      fallback_offer: "Monitoring checklist + drip education",
      success_metric: "audit_applications",
      booking_or_call: true
    },
    nKind: "quiz"
  },
  {
    title: "ROI Potential Quiz",
    persona: "roi_seeker",
    stage: "MOFU",
    trigger: "value_proof_seek",
    hook: "See if [solution] can move the needle for you",
    promise: "Directional ROI hypothesis with assumptions spelled out.",
    asset: "roi_hypothesis_quiz",
    capture: { type: "email_before_results", fields: ["email", "first_name"], gating_rule: "Full scenario after email", consent: ["marketing_email"] },
    delivery: { primary_channel: "email", assets: ["hypothesis_one_pager"], personalization: "Industry and volume sliders" },
    conv: { primary_offer: "Full ROI model session", fallback_offer: "Calculator deep dive", success_metric: "sales_conversations", booking_or_call: true },
    nKind: "quiz"
  },
  {
    title: "Skill Gap Analyzer",
    persona: "practitioner",
    stage: "MOFU",
    trigger: "capability_gap",
    hook: "Where are your skill gaps costing you the most?",
    promise: "Ranked gaps + learning path.",
    asset: "skills_matrix",
    capture: { type: "email_before_results", fields: ["email", "role"], gating_rule: "Detailed path email-gated", consent: ["marketing_email"] },
    delivery: { primary_channel: "email", assets: ["learning_roadmap"], personalization: "Role-based modules" },
    conv: { primary_offer: "Training or certification", fallback_offer: "Template + office hours", success_metric: "course_enrollment", booking_or_call: false },
    nKind: "quiz"
  },
  {
    title: "Profit Leak Finder",
    persona: "operator",
    stage: "MOFU",
    trigger: "margin_pressure",
    hook: "Find your top 3 profit leaks in under 3 minutes",
    promise: "Prioritized leak list with $ ranges where possible.",
    asset: "leak_diagnostic",
    capture: { type: "email_before_results", fields: ["email", "company_size"], gating_rule: "Top leak free; full list gated", consent: ["marketing_email"] },
    delivery: { primary_channel: "email", assets: ["leak_report"], personalization: "Segment by business model" },
    conv: { primary_offer: "Profit recovery engagement", fallback_offer: "SOP toolkit", success_metric: "strategy_calls", booking_or_call: true },
    nKind: "quiz"
  },
  {
    title: "Compliance Checker",
    persona: "compliance_owner",
    stage: "TOFU",
    trigger: "regulatory_anxiety",
    hook: "Are you compliant with [rule set]—quick self-check",
    promise: "Gap flags—not legal advice—with escalation path.",
    asset: "compliance_checklist_quiz",
    capture: { type: "application", fields: ["email", "company", "jurisdiction"], gating_rule: "Results + disclaimer after submit", consent: ["marketing_email", "terms"] },
    delivery: { primary_channel: "email", assets: ["gap_summary"], personalization: "Jurisdiction-aware question set" },
    conv: { primary_offer: "Compliance program or retained advisor", fallback_offer: "Paid audit lite", success_metric: "paid_audit_bookings", booking_or_call: true },
    nKind: "quiz"
  },
  {
    title: "Performance Benchmark Quiz",
    persona: "competitive",
    stage: "MOFU",
    trigger: "benchmarking",
    hook: "How do you stack up against top performers?",
    promise: "Percentile-style insights vs anonymized benchmarks.",
    asset: "benchmark_quiz",
    capture: { type: "email_before_results", fields: ["email", "industry"], gating_rule: "Benchmark chart gated", consent: ["marketing_email"] },
    delivery: { primary_channel: "email", assets: ["benchmark_pdf"], personalization: "Industry cohort" },
    conv: { primary_offer: "Performance improvement program", fallback_offer: "Benchmark club newsletter", success_metric: "sales_qualified_leads", booking_or_call: true },
    nKind: "quiz"
  },
  {
    title: "Personalized Plan Generator",
    persona: "planner",
    stage: "MOFU",
    trigger: "needs_roadmap",
    hook: "Generate a 30-day plan tailored to your situation",
    promise: "Structured plan PDF + milestones.",
    asset: "plan_generator",
    capture: { type: "progressive", fields: ["email", "goal", "constraint"], gating_rule: "Plan after last step + email verify", consent: ["marketing_email"] },
    delivery: { primary_channel: "email", assets: ["plan_pdf", "calendar_links"], personalization: "Inputs map to milestone templates" },
    conv: { primary_offer: "Done-with-you execution", fallback_offer: "Group cohort", success_metric: "cohort_signups", booking_or_call: true },
    nKind: "quiz"
  },
  {
    title: "AI Recommendation Quiz",
    persona: "early_adopter",
    stage: "TOFU",
    trigger: "tool_curiosity",
    hook: "Let the model recommend your best next tool/stack step",
    promise: "Ranked recommendations with rationale strings.",
    asset: "ai_guided_quiz",
    capture: { type: "email_before_results", fields: ["email", "use_case"], gating_rule: "Full rationale gated", consent: ["marketing_email", "ai_disclosure"] },
    delivery: { primary_channel: "email", assets: ["recommendation_memo"], personalization: "Model prompt keyed off answers" },
    conv: { primary_offer: "Implementation sprint", fallback_offer: "Affiliate stack / templates", success_metric: "paid_impl", booking_or_call: true },
    nKind: "quiz"
  }
]

cat1.forEach((c, i) => {
  const id = `lm-cat01-${String(i + 1).padStart(3, "0")}`
  magnets.push(
    magnetBase({
      id,
      title: c.title,
      category: "quiz_assessment",
      persona: c.persona,
      funnel_stage: c.stage,
      trigger_event: c.trigger,
      asset_type: c.asset,
      value_promise: c.promise,
      hook: c.hook,
      landing_page_structure: sectionsQuiz(c.hook, "your market"),
      capture_mechanism: c.capture,
      delivery_method: c.delivery,
      nurture_sequence: nurture4("Your results", [
        "Confirm delivery + set expectations",
        "Deepen problem awareness",
        "Micro-win + trust",
        "Convert to primary offer"
      ]),
      conversion_path: c.conv,
      automation_logic: automationBundle("quiz"),
      notes: "Quiz magnets: tune scoring in runtime; keep questions aligned to dispatch/qualification fields."
    })
  )
})

function pushCalc(catNum, i, title, hook, promise, persona, stage, trigger) {
  const id = `lm-cat${String(catNum).padStart(2, "0")}-${String(i).padStart(3, "0")}`
  magnets.push(
    magnetBase({
      id,
      title,
      category: "calculator",
      persona,
      funnel_stage: stage,
      trigger_event: trigger,
      asset_type: "interactive_calculator",
      value_promise: promise,
      hook,
      landing_page_structure: sectionsCalculator(hook),
      capture_mechanism: {
        type: "email_before_results",
        fields: ["email", "first_name"],
        gating_rule: "Summary on-page; PDF/report after email verification",
        consent: ["marketing_email"]
      },
      delivery_method: {
        primary_channel: "email_plus_download",
        assets: ["results_page", "pdf_report", "optional_csv"],
        personalization: "Inputs echo in headline and report cover"
      },
      nurture_sequence: nurture4("Your calculation", [
        "Deliver report + restate savings/ROI framing",
        "Teach how to realize the outcome (3 levers)",
        "Case study matching their segment",
        "Offer: implementation / consult / product"
      ]),
      conversion_path: {
        primary_offer: "Paid plan unlock or strategy session",
        fallback_offer: "Self-serve templates or lighter tier",
        success_metric: "qualified_opportunities",
        booking_or_call: true
      },
      automation_logic: automationBundle("calc"),
      notes: "Disclose formulas; add jurisdiction/industry disclaimers where needed."
    })
  )
}

const calcTitles = [
  ["ROI Calculator", "See how much you could make or save", "Directional ROI with explicit assumptions.", "roi_seeker", "MOFU", "money_motivation"],
  ["Cost Savings Calculator", "Estimate savings in under 90 seconds", "Concrete $ range with sensitivity notes.", "cfo", "MOFU", "cost_pressure"],
  ["Time Saved Calculator", "Quantify hours reclaimed weekly", "Time → $ translation optional.", "operator", "MOFU", "efficiency_seek"],
  ["Investment Projection Tool", "Project growth under conservative and aggressive cases", "Scenario table for planning.", "founder", "BOFU", "planning_mode"],
  ["Pricing Estimator", "Get a ballpark before you talk to sales", "Ranges + what changes price.", "buyer", "MOFU", "pricing_curiosity"],
  ["Break-even Calculator", "Find your break-even point fast", "Units/revenue threshold clarity.", "operator", "MOFU", "unit_economics"],
  ["Debt Payoff Calculator", "See payoff order and interest savings", "Snowball/avalanche comparison.", "consumer", "TOFU", "debt_stress"],
  ["Tax Savings Calculator", "Estimate savings from eligible strategies", "Non-advice estimator with disclaimers.", "owner", "MOFU", "tax_planning"],
  ["Energy Efficiency Calculator", "Model utility savings from upgrades", "Simple kWh → $ model.", "homeowner", "TOFU", "utility_bills"],
  ["Staffing Cost Analyzer", "Compare hire vs outsource vs automate", "Fully loaded cost bands.", "hr_leader", "MOFU", "headcount_planning"]
]
calcTitles.forEach((row, idx) => pushCalc(2, idx + 1, row[0], row[1], row[2], row[3], row[4], row[5]))

function pushSimple(catNum, category, kindKey, i, spec) {
  const id = `lm-cat${String(catNum).padStart(2, "0")}-${String(i).padStart(3, "0")}`
  const lp =
    category === "swipe_file" || category === "report_insight"
      ? sectionsTemplate(spec.hook)
      : sectionsTemplate(spec.hook)
  magnets.push(
    magnetBase({
      id,
      title: spec.title,
      category,
      persona: spec.persona,
      funnel_stage: spec.stage,
      trigger_event: spec.trigger,
      asset_type: spec.asset_type,
      value_promise: spec.promise,
      hook: spec.hook,
      landing_page_structure: lp,
      capture_mechanism: spec.capture,
      delivery_method: spec.delivery,
      nurture_sequence: nurture4(spec.emailPrefix, spec.goals),
      conversion_path: spec.conv,
      automation_logic: automationBundle(kindKey),
      traffic_fit: spec.traffic_fit,
      notes: spec.notes ?? ""
    })
  )
}

const cat3 = [
  { title: "Done-for-you Checklist", hook: "Steal this exact checklist", promise: "Step-by-step execution list with checkpoints.", persona: "executor", stage: "MOFU", trigger: "need_clarity", asset_type: "pdf_checklist", capture: { type: "email_before_results", fields: ["email"], gating_rule: "Instant download after submit", consent: ["marketing_email"] }, delivery: { primary_channel: "email", assets: ["pdf", "notion_duplicate_link_optional"], personalization: "Niche-specific examples inline" }, conv: { primary_offer: "Done-for-you implementation", fallback_offer: "Template shop", success_metric: "service_bookings", booking_or_call: true }, emailPrefix: "Your checklist", goals: ["Deliver checklist", "Teach sequencing", "Show done-for-you contrast", "Book build"], notes: "Pair with video walkthrough Loom." },
  { title: "SOP Templates", hook: "Standardize operations without starting from zero", promise: "Repeatable SOP skeletons with RACI blocks.", persona: "operator", stage: "MOFU", trigger: "scaling_pain", asset_type: "doc_pack", capture: { type: "email_before_results", fields: ["email", "team_size"], gating_rule: "Zip after email", consent: ["marketing_email"] }, delivery: { primary_channel: "email", assets: ["docx_markdown_zip"], personalization: "Team size variants" }, conv: { primary_offer: "Ops consulting", fallback_offer: "Notion hub", success_metric: "consult_calls", booking_or_call: true }, emailPrefix: "SOP kit", goals: ["Deliver kit", "Highlight failure modes", "Share win story", "Offer audit"], notes: "" },
  { title: "Email Scripts", hook: "Copy-paste emails that still sound human", promise: "Sequences for outbound, nurture, and revive.", persona: "seller", stage: "MOFU", trigger: "pipeline_stuck", asset_type: "script_pack", capture: { type: "email_before_results", fields: ["email"], gating_rule: "Link to Google Doc / PDF", consent: ["marketing_email"] }, delivery: { primary_channel: "email", assets: ["google_doc", "pdf"], personalization: "Industry vertical snippets" }, conv: { primary_offer: "Outbound as a service", fallback_offer: "Course", success_metric: "reply_rate_lift_proxy", booking_or_call: true }, emailPrefix: "Scripts", goals: ["Deliver scripts", "Teach personalization rules", "Show metrics story", "Sell service"], notes: "" },
  { title: "Sales Scripts", hook: "Close more calls with a proven talk track", promise: "Discovery → pitch → objection map.", persona: "closer", stage: "BOFU", trigger: "call_anxiety", asset_type: "call_script_pdf", capture: { type: "email_before_results", fields: ["email"], gating_rule: "PDF link post-verify", consent: ["marketing_email"] }, delivery: { primary_channel: "email", assets: ["pdf", "roleplay_audio_optional"], personalization: "Segment by offer type" }, conv: { primary_offer: "Sales coaching", fallback_offer: "Group clinic", success_metric: "coaching_sales", booking_or_call: true }, emailPrefix: "Talk track", goals: ["Deliver", "Objection deep dive", "Recordings tip", "Book coaching"], notes: "" },
  { title: "Proposal Templates", hook: "Win proposals faster with a structured template", promise: "Scope, pricing table, terms blocks.", persona: "consultant", stage: "BOFU", trigger: "proposal_load", asset_type: "proposal_template", capture: { type: "email_before_results", fields: ["email", "company"], gating_rule: "Download gated", consent: ["marketing_email"] }, delivery: { primary_channel: "email", assets: ["docx", "slides_optional"], personalization: "Logo placeholder guidance" }, conv: { primary_offer: "Proposal writing service", fallback_offer: "Review call", success_metric: "paid_reviews", booking_or_call: true }, emailPrefix: "Proposal kit", goals: ["Deliver", "Pricing psychology", "Case study", "Offer review"], notes: "" },
  { title: "CRM Setup Template", hook: "Stand up a clean CRM in one weekend", promise: "Pipelines, fields, and views spec.", persona: "revops", stage: "MOFU", trigger: "crm_mess", asset_type: "crm_blueprint", capture: { type: "email_before_results", fields: ["email"], gating_rule: "Notion/PDF", consent: ["marketing_email"] }, delivery: { primary_channel: "email", assets: ["notion", "csv_field_map"], personalization: "SuiteDash/Salesforce-agnostic language" }, conv: { primary_offer: "CRM implementation", fallback_offer: "Office hours", success_metric: "impl_projects", booking_or_call: true }, emailPrefix: "CRM blueprint", goals: ["Deliver", "Data hygiene lesson", "Automation teaser", "Book impl"], notes: "Map fields to Lead OS intake keys." },
  { title: "Workflow Blueprint", hook: "Map handoffs between marketing, sales, and delivery", promise: "Swimlanes + SLA table.", persona: "operator", stage: "MOFU", trigger: "handoff_chaos", asset_type: "workflow_pdf", capture: { type: "email_before_results", fields: ["email"], gating_rule: "PDF", consent: ["marketing_email"] }, delivery: { primary_channel: "email", assets: ["pdf", "miro_optional"], personalization: "None or team size" }, conv: { primary_offer: "Workflow redesign sprint", fallback_offer: "Template club", success_metric: "sprint_bookings", booking_or_call: true }, emailPrefix: "Workflow", goals: ["Deliver", "Bottleneck story", "Metric to track", "Book sprint"], notes: "" },
  { title: "Hiring Templates", hook: "Hire faster with structured scorecards and panels", promise: "Job scorecard, questions, rubric.", persona: "founder", stage: "MOFU", trigger: "hiring_spike", asset_type: "hiring_pack", capture: { type: "email_before_results", fields: ["email"], gating_rule: "Zip", consent: ["marketing_email"] }, delivery: { primary_channel: "email", assets: ["pdf_docx"], personalization: "Role family tags" }, conv: { primary_offer: "Recruiting support", fallback_offer: "ATS tips", success_metric: "services", booking_or_call: true }, emailPrefix: "Hiring kit", goals: ["Deliver", "Bias guardrails", "Panel design", "Offer help"], notes: "" },
  { title: "Client Onboarding Kit", hook: "Onboard clients without dropping balls", promise: "Kickoff agenda, checklist, comms pack.", persona: "cs_lead", stage: "BOFU", trigger: "churn_risk", asset_type: "onboarding_pack", capture: { type: "email_before_results", fields: ["email"], gating_rule: "Zip", consent: ["marketing_email"] }, delivery: { primary_channel: "email", assets: ["pdf", "email_templates"], personalization: "B2B vs B2C variants" }, conv: { primary_offer: "CS playbook build", fallback_offer: "Course", success_metric: "projects", booking_or_call: true }, emailPrefix: "Onboarding", goals: ["Deliver", "Time-to-value framing", "Metrics", "Offer build"], notes: "" },
  { title: "Content Calendar", hook: "Plan 90 days of content in one sitting", promise: "Channel grid + themes + CTA map.", persona: "marketer", stage: "TOFU", trigger: "consistency_gap", asset_type: "spreadsheet_template", capture: { type: "email_before_results", fields: ["email"], gating_rule: "Sheet link", consent: ["marketing_email"] }, delivery: { primary_channel: "email", assets: ["google_sheet", "csv"], personalization: "Niche pillar suggestions" }, conv: { primary_offer: "Content studio retainer", fallback_offer: "AI prompts pack", success_metric: "retainer_sales", booking_or_call: true }, emailPrefix: "Calendar", goals: ["Deliver", "One theme deep dive", "Repurpose system", "Sell retainer"], notes: "" }
]
cat3.forEach((s, idx) => pushSimple(3, "template", "asset", idx + 1, s))

const cat4 = [
  { title: "Ad Swipe File", hook: "50 high-converting ads you can adapt ethically", promise: "Annotated patterns across hooks and CTAs.", persona: "marketer", stage: "MOFU", trigger: "creative_block", asset_type: "swipe_pdf", capture: { type: "email_before_results", fields: ["email"], gating_rule: "PDF", consent: ["marketing_email"] }, delivery: { primary_channel: "email", assets: ["pdf", "figma_optional"], personalization: "Vertical addendum page" }, conv: { primary_offer: "Creative strategy sprint", fallback_offer: "Templates", success_metric: "strategy_calls", booking_or_call: true }, emailPrefix: "Swipe file", goals: ["Deliver", "Pattern lesson", "Test plan", "Offer sprint"], notes: "Credit originals where required." },
  { title: "Landing Page Swipe File", hook: "Deconstruct pages that convert", promise: "Section-by-section commentary set.", persona: "growth", stage: "MOFU", trigger: "cro_curiosity", asset_type: "swipe_pdf", capture: { type: "email_before_results", fields: ["email"], gating_rule: "PDF", consent: ["marketing_email"] }, delivery: { primary_channel: "email", assets: ["pdf"], personalization: "Industry packs" }, conv: { primary_offer: "CRO project", fallback_offer: "Audit lite", success_metric: "audit_sales", booking_or_call: true }, emailPrefix: "LP swipes", goals: ["Deliver", "Above-fold anatomy", "Social proof patterns", "Offer CRO"], notes: "" },
  { title: "Email Swipe File", hook: "Steal structure, not voice", promise: "Welcome, nurture, cart, winback.", persona: "lifecycle", stage: "MOFU", trigger: "sequence_build", asset_type: "swipe_pdf", capture: { type: "email_before_results", fields: ["email"], gating_rule: "PDF", consent: ["marketing_email"] }, delivery: { primary_channel: "email", assets: ["pdf"], personalization: "B2B/B2C toggles" }, conv: { primary_offer: "Lifecycle build", fallback_offer: "Copy review", success_metric: "projects", booking_or_call: true }, emailPrefix: "Email swipes", goals: ["Deliver", "Voice rules", "Deliverability note", "Offer build"], notes: "" },
  { title: "Funnel Blueprint Library", hook: "Pick a funnel archetype and deploy faster", promise: "Maps for webinar, book-a-call, self-serve.", persona: "founder", stage: "MOFU", trigger: "funnel_confusion", asset_type: "blueprint_pdf", capture: { type: "email_before_results", fields: ["email"], gating_rule: "Zip", consent: ["marketing_email"] }, delivery: { primary_channel: "email", assets: ["pdf_pack"], personalization: "Niche-specific examples" }, conv: { primary_offer: "Funnel implementation", fallback_offer: "Office hours", success_metric: "implementation_deposits", booking_or_call: true }, emailPrefix: "Blueprints", goals: ["Deliver", "Pick your archetype", "Metrics map", "Offer impl"], notes: "Align nodes with Lead OS graph ids." },
  { title: "Viral Hooks Database", hook: "100 hooks with context on when they work", promise: "Tagged by awareness level.", persona: "creator", stage: "TOFU", trigger: "hook_hunt", asset_type: "notion_or_sheet", capture: { type: "email_before_results", fields: ["email"], gating_rule: "Link after verify", consent: ["marketing_email"] }, delivery: { primary_channel: "email", assets: ["notion_duplicate"], personalization: "None" }, conv: { primary_offer: "Content system build", fallback_offer: "Workshop", success_metric: "workshop_signups", booking_or_call: true }, emailPrefix: "Hooks", goals: ["Deliver", "Format breakdown", "One-week challenge", "Offer system"], notes: "" },
  { title: "Copywriting Angles Library", hook: "Never run out of angles again", promise: "Pain, proof, paradox, promise matrix.", persona: "writer", stage: "MOFU", trigger: "angle_fatigue", asset_type: "pdf", capture: { type: "email_before_results", fields: ["email"], gating_rule: "PDF", consent: ["marketing_email"] }, delivery: { primary_channel: "email", assets: ["pdf"], personalization: "Niche column examples" }, conv: { primary_offer: "Messaging intensive", fallback_offer: "Templates", success_metric: "intensive_sales", booking_or_call: true }, emailPrefix: "Angles", goals: ["Deliver", "One angle workshop", "Before/after", "Offer intensive"], notes: "" },
  { title: "Cold Outreach Scripts", hook: "Start conversations without sounding spammy", promise: "LinkedIn + email variants with guardrails.", persona: "sdr", stage: "MOFU", trigger: "pipeline_need", asset_type: "script_doc", capture: { type: "email_before_results", fields: ["email"], gating_rule: "Doc link", consent: ["marketing_email"] }, delivery: { primary_channel: "email", assets: ["google_doc"], personalization: "ICP snippets" }, conv: { primary_offer: "Outbound agency", fallback_offer: "List build course", success_metric: "meetings_booked", booking_or_call: true }, emailPrefix: "Outreach", goals: ["Deliver", "Research step", "Follow-up ladder", "Offer agency"], notes: "" },
  { title: "Upsell Scripts", hook: "Increase ACV with ethical upsells", promise: "Timing, phrasing, and bundling talk tracks.", persona: "account_manager", stage: "BOFU", trigger: "expansion", asset_type: "pdf", capture: { type: "email_before_results", fields: ["email"], gating_rule: "PDF", consent: ["marketing_email"] }, delivery: { primary_channel: "email", assets: ["pdf"], personalization: "SaaS vs services" }, conv: { primary_offer: "Rev expansion consulting", fallback_offer: "Training", success_metric: "consulting", booking_or_call: true }, emailPrefix: "Upsell", goals: ["Deliver", "When to upsell", "Risk reversal", "Offer consulting"], notes: "" },
  { title: "Objection Handling Scripts", hook: "Turn stalls into progress", promise: "Price, timing, trust, competitor map.", persona: "closer", stage: "BOFU", trigger: "deal_stalls", asset_type: "pdf", capture: { type: "email_before_results", fields: ["email"], gating_rule: "PDF", consent: ["marketing_email"] }, delivery: { primary_channel: "email", assets: ["pdf"], personalization: "Vertical objections appendix" }, conv: { primary_offer: "Sales training", fallback_offer: "Call review", success_metric: "training_sales", booking_or_call: true }, emailPrefix: "Objections", goals: ["Deliver", "Roleplay guide", "Proof sequencing", "Offer training"], notes: "" },
  { title: "Offer Stack Examples", hook: "See how stacks clarify buying paths", promise: "Good/better/best with bonuses.", persona: "offer_owner", stage: "MOFU", trigger: "offer_confusion", asset_type: "pdf", capture: { type: "email_before_results", fields: ["email"], gating_rule: "PDF", consent: ["marketing_email"] }, delivery: { primary_channel: "email", assets: ["pdf"], personalization: "Niche examples" }, conv: { primary_offer: "Offer design workshop", fallback_offer: "Template", success_metric: "workshop_sales", booking_or_call: true }, emailPrefix: "Offer stack", goals: ["Deliver", "Bonuses that work", "Guarantee framing", "Offer workshop"], notes: "" }
]
cat4.forEach((s, idx) => pushSimple(4, "swipe_file", "asset", idx + 1, s))

function sectionsCourse(hook) {
  return {
    sections: [
      { id: "hero", headline: hook, subhead: "Short lessons, one action per day.", bullets: ["Email-first delivery", "Optional community checkpoint", "Certificate or badge optional"], cta_text: "Join free", cta_action: "capture_email" },
      { id: "curriculum", headline: "What you’ll learn", subhead: "Module breakdown with outcomes.", cta_text: "See syllabus", cta_action: "expand_syllabus" },
      { id: "proof", headline: "Who it’s for", bullets: ["Beginners welcome", "Busy operators", "Builders shipping weekly"], cta_text: "Enroll", cta_action: "capture_email" },
      { id: "instructor", headline: "Why listen to us", cta_text: "Start day 1", cta_action: "capture_email" },
      { id: "cta", headline: "Start today", cta_text: "Send lesson 1", cta_action: "capture_email" }
    ],
    thank_you_page: { headline: "Day 1 is on the way", next_step_cta: "Join the community link (optional)" }
  }
}

function pushCourse(catNum, i, spec) {
  const id = `lm-cat${String(catNum).padStart(2, "0")}-${String(i).padStart(3, "0")}`
  magnets.push(
    magnetBase({
      id,
      title: spec.title,
      category: "mini_course",
      persona: spec.persona,
      funnel_stage: spec.stage,
      trigger_event: spec.trigger,
      asset_type: spec.asset_type,
      value_promise: spec.promise,
      hook: spec.hook,
      landing_page_structure: sectionsCourse(spec.hook),
      capture_mechanism: { type: "email_before_results", fields: ["email", "first_name"], gating_rule: "Double opt-in optional", consent: ["marketing_email"] },
      delivery_method: { primary_channel: "email_sequence", assets: spec.assets, personalization: "Branch on clicks" },
      nurture_sequence: spec.extraNurture ?? nurture4(spec.emailPrefix, spec.goals),
      conversion_path: spec.conv,
      automation_logic: automationBundle("quiz"),
      notes: spec.notes ?? ""
    })
  )
}

const cat5 = [
  { title: "5-Day Email Course", hook: "Free 5-day training on [topic]", promise: "One focused lesson per day with homework.", persona: "learner", stage: "TOFU", trigger: "education_seek", asset_type: "email_course", assets: ["5_emails", "worksheet_pdf"], emailPrefix: "Day", goals: ["Deliver D1", "Build habit D2-D3", "Case study D4", "Sell core offer D5"], conv: { primary_offer: "Paid program or service", fallback_offer: "Toolkit", success_metric: "conversion_to_offer", booking_or_call: false }, notes: "Tag clicks in n8n for segmentation." },
  { title: "Video Bootcamp", hook: "Watch-and-build bootcamp (short episodes)", promise: "Screen recordings + checklists.", persona: "visual_learner", stage: "MOFU", trigger: "implementation_gap", asset_type: "video_series", assets: ["unlisted_playlist", "pdf"], emailPrefix: "Bootcamp", goals: ["Episode 1", "Work session", "Q&A invite", "Upsell cohort"], conv: { primary_offer: "Cohort or service", fallback_offer: "Templates", success_metric: "cohort_enrollment", booking_or_call: true }, notes: "" },
  { title: "Audio Series", hook: "Learn on the go—10-minute episodes", promise: "Private podcast feed or MP3 pack.", persona: "commuter", stage: "TOFU", trigger: "passive_learning", asset_type: "audio_feed", assets: ["rss_private", "mp3_zip"], emailPrefix: "Audio", goals: ["Deliver feed", "Highlight episode 2", "Workbook drop", "Offer"], conv: { primary_offer: "Membership", fallback_offer: "Course", success_metric: "membership_signups", booking_or_call: false }, notes: "" },
  { title: "Challenge Funnel", hook: "5-day challenge: small wins daily", promise: "Community + leaderboard optional.", persona: "community_seeker", stage: "TOFU", trigger: "accountability", asset_type: "challenge", assets: ["daily_prompts", "tracker_sheet"], emailPrefix: "Challenge", goals: ["Kickoff", "Midpoint push", "Share wins", "Pitch core"], conv: { primary_offer: "Core product", fallback_offer: "Continuity", success_metric: "challenge_to_paid", booking_or_call: false }, notes: "" },
  { title: "Certification Lite", hook: "Prove you completed the foundations", promise: "Badge + assessment.", persona: "careerist", stage: "MOFU", trigger: "credential", asset_type: "cert_lite", assets: ["quiz", "badge_png"], emailPrefix: "Cert", goals: ["Welcome", "Study guide", "Exam invite", "Upsell pro cert"], conv: { primary_offer: "Pro certification", fallback_offer: "Community", success_metric: "pro_cert_sales", booking_or_call: false }, notes: "" },
  { title: "Zero to X Guide", hook: "A guided path from zero to [outcome]", promise: "Milestones with success criteria.", persona: "beginner", stage: "TOFU", trigger: "starting_out", asset_type: "email_plus_pdf", assets: ["pdf_roadmap", "email_tips"], emailPrefix: "Zero to X", goals: ["Deliver map", "Remove obstacles", "Tool intro", "Offer help"], conv: { primary_offer: "Implementation help", fallback_offer: "DIY kit", success_metric: "calls_booked", booking_or_call: true }, notes: "" },
  { title: "Case Study Series", hook: "See how others solved it", promise: "3 case breakdowns with metrics.", persona: "skeptic", stage: "MOFU", trigger: "proof_need", asset_type: "email_series", assets: ["3_emails", "pdf_summary"], emailPrefix: "Case study", goals: ["Story 1", "Story 2", "Pattern extraction", "Offer"], conv: { primary_offer: "Same outcome service", fallback_offer: "Audit", success_metric: "sales_calls", booking_or_call: true }, notes: "" },
  { title: "Masterclass Replay", hook: "Watch the masterclass on demand", promise: "Recording + workbook.", persona: "serious_buyer", stage: "MOFU", trigger: "webinar_miss", asset_type: "video_reply", assets: ["vimeo_unlisted", "workbook"], emailPrefix: "Replay", goals: ["Deliver replay", "Key timestamp", "FAQ", "Offer call"], conv: { primary_offer: "Strategy call", fallback_offer: "Self-serve", success_metric: "calls_booked", booking_or_call: true }, notes: "" },
  { title: "Webinar Funnel", hook: "Live training + Q&A this week", promise: "Registration → reminders → offer.", persona: "evaluator", stage: "MOFU", trigger: "live_event", asset_type: "webinar", assets: ["zoom_link", "slides_pdf"], emailPrefix: "Webinar", goals: ["Confirm seat", "Reminder story", "Replay or recap", "Pitch"], conv: { primary_offer: "Core offer", fallback_offer: "Payment plan", success_metric: "show_rate_and_close", booking_or_call: false }, notes: "Tie attendance tags to SuiteDash." },
  { title: "Workshop Funnel", hook: "Hands-on workshop (small group)", promise: "Work blocks + feedback.", persona: "builder", stage: "BOFU", trigger: "interactive_need", asset_type: "workshop", assets: ["calendar_invite", "materials_zip"], emailPrefix: "Workshop", goals: ["Prep email", "Agenda", "Follow-up resources", "Upsell mentorship"], conv: { primary_offer: "Mentorship", fallback_offer: "Async course", success_metric: "mentorship_sales", booking_or_call: true }, notes: "" }
]
cat5.forEach((s, idx) => pushCourse(5, idx + 1, s))

const cat6 = [
  { title: "Ultimate Toolkit", hook: "Everything you need to [achieve outcome] in one bundle", promise: "Templates + calculators + checklist + scripts.", persona: "operator", stage: "MOFU", trigger: "bundle_seek", asset_type: "zip_toolkit", capture: { type: "email_before_results", fields: ["email"], gating_rule: "Zip download", consent: ["marketing_email"] }, delivery: { primary_channel: "email", assets: ["zip"], personalization: "Readme with order of operations" }, conv: { primary_offer: "Premium toolkit or service", fallback_offer: "Community", success_metric: "upsell_rate", booking_or_call: true }, emailPrefix: "Toolkit", goals: ["Deliver bundle", "How to consume", "Win story", "Upsell premium"], notes: "" },
  { title: "Starter Kits", hook: "Start small—ship in a weekend", promise: "Minimal viable stack of assets.", persona: "beginner", stage: "TOFU", trigger: "overwhelm", asset_type: "starter_zip", capture: { type: "email_before_results", fields: ["email"], gating_rule: "Download link", consent: ["marketing_email"] }, delivery: { primary_channel: "email", assets: ["zip"], personalization: "Niche readme" }, conv: { primary_offer: "Full toolkit", fallback_offer: "Course", success_metric: "upgrade_sales", booking_or_call: false }, emailPrefix: "Starter", goals: ["Deliver", "Quick win", "What’s next", "Upgrade"], notes: "" },
  { title: "Vendor Lists", hook: "Curated vendors vetted for [criteria]", promise: "Comparison grid + contact protocol.", persona: "buyer", stage: "MOFU", trigger: "procurement", asset_type: "spreadsheet", capture: { type: "email_before_results", fields: ["email", "use_case"], gating_rule: "Sheet link", consent: ["marketing_email"] }, delivery: { primary_channel: "email", assets: ["google_sheet"], personalization: "Geo or industry filter" }, conv: { primary_offer: "Concierge procurement", fallback_offer: "Newsletter", success_metric: "concierge_bookings", booking_or_call: true }, emailPrefix: "Vendors", goals: ["Deliver", "How to evaluate", "Red flags", "Offer concierge"], notes: "Refresh list quarterly; date-stamp." },
  { title: "Resource Directories", hook: "A living directory of tools, communities, and references", promise: "Categorized links with notes.", persona: "researcher", stage: "TOFU", trigger: "discovery", asset_type: "notion_directory", capture: { type: "email_before_results", fields: ["email"], gating_rule: "Duplicate link", consent: ["marketing_email"] }, delivery: { primary_channel: "email", assets: ["notion_template"], personalization: "Optional niche tabs" }, conv: { primary_offer: "Implementation partner intro", fallback_offer: "Sponsorship slots", success_metric: "partner_intros", booking_or_call: true }, emailPrefix: "Directory", goals: ["Deliver", "How to use", "Highlight top 3", "Offer help"], notes: "" },
  { title: "Software Stack Guide", hook: "The exact stack we’d use to run [function]", promise: "Tools, costs, and integration order.", persona: "builder", stage: "MOFU", trigger: "stack_confusion", asset_type: "pdf_guide", capture: { type: "email_before_results", fields: ["email"], gating_rule: "PDF", consent: ["marketing_email"] }, delivery: { primary_channel: "email", assets: ["pdf"], personalization: "SMB vs enterprise column" }, conv: { primary_offer: "Stack implementation", fallback_offer: "Office hours", success_metric: "implementation_projects", booking_or_call: true }, emailPrefix: "Stack", goals: ["Deliver", "Integration pitfalls", "Security note", "Offer impl"], notes: "Map to Lead OS + SuiteDash where relevant." },
  { title: "Industry Playbooks", hook: "Operational playbook for [industry]", promise: "GTM + ops checklists.", persona: "exec", stage: "MOFU", trigger: "vertical_entry", asset_type: "playbook_pdf", capture: { type: "email_before_results", fields: ["email", "company"], gating_rule: "PDF", consent: ["marketing_email"] }, delivery: { primary_channel: "email", assets: ["pdf"], personalization: "Industry stats sidebar" }, conv: { primary_offer: "Vertical consulting", fallback_offer: "Workshop", success_metric: "consulting_deals", booking_or_call: true }, emailPrefix: "Playbook", goals: ["Deliver", "One playbook tactic", "Metric to watch", "Offer consulting"], notes: "" },
  { title: "Compliance Kits", hook: "Operationalize compliance without drowning in docs", promise: "Checklists + evidence pointers (not legal advice).", persona: "compliance_owner", stage: "TOFU", trigger: "audit_season", asset_type: "compliance_zip", capture: { type: "application", fields: ["email", "company", "jurisdiction"], gating_rule: "Manual or auto review", consent: ["marketing_email", "terms"] }, delivery: { primary_channel: "email", assets: ["zip"], personalization: "Jurisdiction pack" }, conv: { primary_offer: "Compliance advisory", fallback_offer: "Training", success_metric: "advisory_calls", booking_or_call: true }, emailPrefix: "Compliance", goals: ["Deliver", "Scope limits", "Evidence tips", "Offer advisory"], notes: "Always include non-legal disclaimer." },
  { title: "Marketing Kits", hook: "Campaign-in-a-box for [channel]", promise: "Angles, creatives brief, landing outline.", persona: "marketer", stage: "MOFU", trigger: "campaign_launch", asset_type: "marketing_zip", capture: { type: "email_before_results", fields: ["email"], gating_rule: "Zip", consent: ["marketing_email"] }, delivery: { primary_channel: "email", assets: ["zip"], personalization: "Channel variant" }, conv: { primary_offer: "Done-for-you campaigns", fallback_offer: "Review call", success_metric: "agency_revenue", booking_or_call: true }, emailPrefix: "Marketing kit", goals: ["Deliver", "Testing plan", "Creative examples", "Offer DFY"], notes: "" },
  { title: "Automation Kits", hook: "Automations you can import today", promise: "n8n JSON + runtime webhook map.", persona: "revops", stage: "MOFU", trigger: "automation_backlog", asset_type: "automation_zip", capture: { type: "email_before_results", fields: ["email"], gating_rule: "Zip + README", consent: ["marketing_email"] }, delivery: { primary_channel: "email", assets: ["n8n_json", "readme_md"], personalization: "Tenant webhook placeholders" }, conv: { primary_offer: "Automation build", fallback_offer: "Support block", success_metric: "build_scope_signed", booking_or_call: true }, emailPrefix: "Automation", goals: ["Deliver", "Safety checklist", "Test plan", "Offer build"], notes: "Cross-link SuiteDash repo import paths." },
  { title: "Growth Kits", hook: "Growth levers ranked for your stage", promise: "Now / next / later roadmap.", persona: "founder", stage: "MOFU", trigger: "growth_stall", asset_type: "growth_pdf", capture: { type: "email_before_results", fields: ["email", "arr_band_optional"], gating_rule: "PDF", consent: ["marketing_email"] }, delivery: { primary_channel: "email", assets: ["pdf"], personalization: "Stage-based roadmap" }, conv: { primary_offer: "Growth sprint", fallback_offer: "Office hours", success_metric: "sprint_sales", booking_or_call: true }, emailPrefix: "Growth", goals: ["Deliver", "One lever deep dive", "Metric focus", "Offer sprint"], notes: "" }
]
cat6.forEach((s, idx) => pushSimple(6, "toolkit", "asset", idx + 1, s))

function sectionsTool(hook) {
  return {
    sections: [
      { id: "hero", headline: hook, subhead: "Use the tool first—upgrade optional.", bullets: ["Fast time-to-value", "Account optional or required per design", "Clear upgrade path"], cta_text: "Use free tool", cta_action: "open_tool" },
      { id: "demo", headline: "See it in action", cta_text: "Try sample", cta_action: "demo_mode" },
      { id: "trust", headline: "Privacy & data", bullets: ["Data use policy", "Retention", "Export/delete"], cta_text: "Continue", cta_action: "scroll_privacy" },
      { id: "upgrade", headline: "Unlock more", subhead: "Paid tier removes limits and adds teams.", cta_text: "View plans", cta_action: "pricing" },
      { id: "capture", headline: "Save your work", cta_text: "Create free account", cta_action: "signup" }
    ],
    thank_you_page: { headline: "You’re in", next_step_cta: "Complete onboarding checklist" }
  }
}

function pushTool(catNum, i, spec) {
  const id = `lm-cat${String(catNum).padStart(2, "0")}-${String(i).padStart(3, "0")}`
  magnets.push(
    magnetBase({
      id,
      title: spec.title,
      category: "free_tool",
      persona: spec.persona,
      funnel_stage: spec.stage,
      trigger_event: spec.trigger,
      asset_type: spec.asset_type,
      value_promise: spec.promise,
      hook: spec.hook,
      landing_page_structure: sectionsTool(spec.hook),
      capture_mechanism: spec.capture,
      delivery_method: spec.delivery,
      nurture_sequence: nurture4(spec.emailPrefix, spec.goals),
      conversion_path: spec.conv,
      automation_logic: automationBundle("calc"),
      required_tools: spec.tools ?? undefined,
      notes: spec.notes ?? ""
    })
  )
}

const cat7 = [
  { title: "Micro SaaS Tool", hook: "Solve one job for free—upgrade for teams", promise: "Core utility with usage limits.", persona: "practitioner", stage: "TOFU", trigger: "utility_search", asset_type: "micro_saas", capture: { type: "account_signup", fields: ["email", "password_or_magic_link"], gating_rule: "Account to save projects", consent: ["terms", "privacy"] }, delivery: { primary_channel: "in_app", assets: ["web_app"], personalization: "User data workspace" }, conv: { primary_offer: "Paid plan", fallback_offer: "Annual discount", success_metric: "free_to_paid", booking_or_call: false }, emailPrefix: "Your workspace", goals: ["Activation tips", "Aha moment nudge", "Case study", "Upgrade offer"], tools: ["lead_os_hosted_runtime", "product_db", "billing_optional", "email_provider"], notes: "" },
  { title: "AI Content Generator", hook: "Generate drafts tailored to your inputs", promise: "Editable outputs with brand guardrails.", persona: "marketer", stage: "MOFU", trigger: "content_throughput", asset_type: "ai_tool", capture: { type: "email_before_results", fields: ["email"], gating_rule: "Credits after verify", consent: ["marketing_email", "ai_terms"] }, delivery: { primary_channel: "web_tool", assets: ["session_outputs"], personalization: "Tone + niche selectors" }, conv: { primary_offer: "Unlimited credits", fallback_offer: "Template pack", success_metric: "subscription", booking_or_call: false }, emailPrefix: "AI drafts", goals: ["Deliver sample", "Editing tips", "Workflow", "Upgrade"], tools: ["llm_api", "leadgen_ai_portal_optional", "email_provider"], notes: "Log prompts for abuse monitoring." },
  { title: "Audit Tool", hook: "Run an instant audit of [surface]", promise: "Score + prioritized fixes.", persona: "owner", stage: "MOFU", trigger: "optimization", asset_type: "audit_scanner", capture: { type: "progressive", fields: ["url_or_inputs", "email"], gating_rule: "Email for PDF report", consent: ["marketing_email"] }, delivery: { primary_channel: "email", assets: ["pdf_report"], personalization: "Input echo" }, conv: { primary_offer: "Done-for-you remediation", fallback_offer: "Office hours", success_metric: "remediation_scope", booking_or_call: true }, emailPrefix: "Audit", goals: ["Deliver report", "Explain top issue", "ROI of fixes", "Book remediation"], tools: ["scanner_workers", "email_provider"], notes: "" },
  { title: "Analyzer Tool", hook: "Break down [dataset/text] into actionable themes", promise: "Charts + summaries.", persona: "analyst", stage: "MOFU", trigger: "analysis_need", asset_type: "analyzer", capture: { type: "email_before_results", fields: ["email"], gating_rule: "Full export gated", consent: ["marketing_email"] }, delivery: { primary_channel: "web_plus_email", assets: ["csv_png_summary"], personalization: "Upload-driven" }, conv: { primary_offer: "Analyst retainer", fallback_offer: "Self-serve templates", success_metric: "retainer_signed", booking_or_call: true }, emailPrefix: "Analysis", goals: ["Deliver", "Method note", "Example", "Offer retainer"], tools: ["compute_backend", "email_provider"], notes: "" },
  { title: "Recommendation Engine", hook: "Get ranked recommendations from your inputs", promise: "Transparent scoring rubric.", persona: "buyer", stage: "MOFU", trigger: "choice_overload", asset_type: "recommender", capture: { type: "email_before_results", fields: ["email"], gating_rule: "Full list gated", consent: ["marketing_email"] }, delivery: { primary_channel: "email", assets: ["ranked_list_pdf"], personalization: "Preference vector" }, conv: { primary_offer: "Implementation package", fallback_offer: "Affiliate offers", success_metric: "package_sales", booking_or_call: true }, emailPrefix: "Recommendations", goals: ["Deliver", "Why ranking works", "Risk note", "Offer package"], tools: ["runtime_or_edge_function", "email_provider"], notes: "" },
  { title: "Report Generator", hook: "Turn inputs into a client-ready report", promise: "Branded PDF in minutes.", persona: "consultant", stage: "BOFU", trigger: "deliverable_speed", asset_type: "report_gen", capture: { type: "account_signup", fields: ["email"], gating_rule: "Watermark removed on paid", consent: ["terms"] }, delivery: { primary_channel: "in_app", assets: ["pdf_docx"], personalization: "Brand tokens" }, conv: { primary_offer: "Pro subscription", fallback_offer: "Per-report credits", success_metric: "mrr", booking_or_call: false }, emailPrefix: "Reports", goals: ["First report tips", "Brand setup", "Client delivery workflow", "Upgrade"], tools: ["pdf_engine", "storage", "email_provider"], notes: "" },
  { title: "Dashboard Tool", hook: "See your KPIs in one link", promise: "Connectors or manual CSV.", persona: "exec", stage: "MOFU", trigger: "visibility", asset_type: "dashboard", capture: { type: "account_signup", fields: ["email"], gating_rule: "Share links on paid", consent: ["terms"] }, delivery: { primary_channel: "in_app", assets: ["live_dashboard"], personalization: "Widget layout" }, conv: { primary_offer: "Team seats", fallback_offer: "Export add-on", success_metric: "seat_expansion", booking_or_call: false }, emailPrefix: "Dashboard", goals: ["Setup help", "Metric hygiene", "Alerting", "Upgrade seats"], tools: ["db_warehouse_optional", "auth", "email_provider"], notes: "" },
  { title: "Chrome Extension Tool", hook: "Workflow inside the tab you already use", promise: "Lightweight helper with permissions explained.", persona: "power_user", stage: "MOFU", trigger: "workflow_friction", asset_type: "extension", capture: { type: "account_signup", fields: ["email"], gating_rule: "Sync across devices", consent: ["terms", "chrome_permissions"] }, delivery: { primary_channel: "chrome_store", assets: ["crx"], personalization: "Settings sync" }, conv: { primary_offer: "Pro features", fallback_offer: "Tip jar", success_metric: "pro_conversion", booking_or_call: false }, emailPrefix: "Extension", goals: ["Install tips", "Power shortcuts", "Security", "Go pro"], tools: ["extension_host", "auth_api"], notes: "" },
  { title: "API Tool Access", hook: "Free tier API for developers", promise: "Sandbox keys + docs.", persona: "developer", stage: "TOFU", trigger: "integration_build", asset_type: "api_product", capture: { type: "account_signup", fields: ["email", "org"], gating_rule: "Key after verify", consent: ["terms"] }, delivery: { primary_channel: "developer_portal", assets: ["openapi_json"], personalization: "Usage quotas" }, conv: { primary_offer: "Usage-based billing", fallback_offer: "Enterprise", success_metric: "api_revenue", booking_or_call: true }, emailPrefix: "API", goals: ["Quickstart", "Rate limits", "Examples", "Upgrade usage"], tools: ["api_gateway", "billing", "docs_host"], notes: "" },
  { title: "Widget Tool", hook: "Embeddable widget for your site visitors", promise: "Lead capture or utility on-page.", persona: "site_owner", stage: "MOFU", trigger: "onsite_conversion", asset_type: "embed_widget", capture: { type: "none_before_tool", fields: ["visitor_optional"], gating_rule: "Email on save/share", consent: ["privacy"] }, delivery: { primary_channel: "embed", assets: ["snippet_js"], personalization: "Runtime boot from Lead OS" }, conv: { primary_offer: "Higher limits + branding removal", fallback_offer: "Managed setup", success_metric: "widget_upgrades", booking_or_call: true }, emailPrefix: "Widget", goals: ["Install verified", "First lead celebration", "Optimize tips", "Upgrade"], tools: ["lead_os_embed_widgets", "lead_os_hosted_runtime"], notes: "Primary integration with Universal Lead Engine embed path." }
]
cat7.forEach((s, idx) => pushTool(7, idx + 1, s))

const cat8 = [
  { title: "Industry Report", hook: "2026 [industry] outlook you can share", promise: "Data + narrative + implications.", persona: "exec", stage: "TOFU", trigger: "market_context", asset_type: "pdf_report", capture: { type: "email_before_results", fields: ["email", "title_optional"], gating_rule: "PDF link", consent: ["marketing_email"] }, delivery: { primary_channel: "email", assets: ["pdf", "slides_executive_summary"], personalization: "Company size paragraph" }, conv: { primary_offer: "Strategy engagement", fallback_offer: "Newsletter", success_metric: "strategy_calls", booking_or_call: true }, emailPrefix: "Report", goals: ["Deliver", "Key chart explained", "What to do Monday", "Book strategy"], notes: "Cite sources; date the report." },
  { title: "Benchmark Report", hook: "How you compare to peers (anonymized)", promise: "Cohort stats + interpretation.", persona: "operator", stage: "MOFU", trigger: "benchmarking", asset_type: "benchmark_pdf", capture: { type: "email_before_results", fields: ["email", "industry"], gating_rule: "PDF", consent: ["marketing_email"] }, delivery: { primary_channel: "email", assets: ["pdf"], personalization: "Cohort label" }, conv: { primary_offer: "Performance program", fallback_offer: "Workshop", success_metric: "program_sales", booking_or_call: true }, emailPrefix: "Benchmarks", goals: ["Deliver", "Methodology", "Improvement plan teaser", "Offer program"], notes: "" },
  { title: "Case Study Report", hook: "Deep dive: problem → system → outcome", promise: "Metrics and timeline truthfully stated.", persona: "buyer", stage: "MOFU", trigger: "proof", asset_type: "case_pdf", capture: { type: "email_before_results", fields: ["email"], gating_rule: "PDF", consent: ["marketing_email"] }, delivery: { primary_channel: "email", assets: ["pdf"], personalization: "Similar company callout" }, conv: { primary_offer: "Same outcome package", fallback_offer: "Pilot", success_metric: "pipeline_created", booking_or_call: true }, emailPrefix: "Case study", goals: ["Deliver", "Lesson extracted", "Risk addressed", "Offer package"], notes: "" },
  { title: "Trends Report", hook: "Signals we’re watching in [space]", promise: "Implications for operators.", persona: "strategist", stage: "TOFU", trigger: "trend_tracking", asset_type: "trends_pdf", capture: { type: "email_before_results", fields: ["email"], gating_rule: "PDF", consent: ["marketing_email"] }, delivery: { primary_channel: "email", assets: ["pdf"], personalization: "Optional vertical inset" }, conv: { primary_offer: "Advisory", fallback_offer: "Briefing call", success_metric: "advisory_revenue", booking_or_call: true }, emailPrefix: "Trends", goals: ["Deliver", "One signal deep", "Scenario planning", "Offer advisory"], notes: "" },
  { title: "Competitive Analysis", hook: "Map competitors without the fluff", promise: "Feature matrix + wedge recommendations.", persona: "pm", stage: "MOFU", trigger: "competitive_pressure", asset_type: "competitive_pdf", capture: { type: "email_before_results", fields: ["email", "market"], gating_rule: "PDF", consent: ["marketing_email"] }, delivery: { primary_channel: "email", assets: ["pdf"], personalization: "Top 3 comps from form" }, conv: { primary_offer: "GTM sprint", fallback_offer: "Workshop", success_metric: "sprint_sales", booking_or_call: true }, emailPrefix: "Competitive", goals: ["Deliver", "Positioning angle", "Launch risks", "Offer sprint"], notes: "" },
  { title: "Market Map", hook: "Visual map of the ecosystem", promise: "Players, segments, and whitespace.", persona: "investor_or_founder", stage: "TOFU", trigger: "landscape_need", asset_type: "market_map_pdf", capture: { type: "email_before_results", fields: ["email"], gating_rule: "High-res PDF", consent: ["marketing_email"] }, delivery: { primary_channel: "email", assets: ["pdf_png"], personalization: "None" }, conv: { primary_offer: "Custom research", fallback_offer: "Briefing", success_metric: "research_contracts", booking_or_call: true }, emailPrefix: "Market map", goals: ["Deliver", "How to read map", "Whitespace thesis", "Offer custom"], notes: "" },
  { title: "Data Dashboard", hook: "Explore the dataset behind the narrative", promise: "Embedded BI or public dashboard.", persona: "analyst", stage: "MOFU", trigger: "data_exploration", asset_type: "public_dashboard", capture: { type: "email_before_results", fields: ["email"], gating_rule: "Gated slices or export", consent: ["marketing_email"] }, delivery: { primary_channel: "link", assets: ["looker_metabase_url"], personalization: "Saved views" }, conv: { primary_offer: "Private modeling", fallback_offer: "API access", success_metric: "data_deals", booking_or_call: true }, emailPrefix: "Dashboard data", goals: ["Access instructions", "Key charts", "Caveats", "Offer private"], tools: ["bi_tool", "warehouse"], notes: "" },
  { title: "Survey Results", hook: "What [audience] said—raw insights", promise: "Charts + quotes + methodology.", persona: "marketer", stage: "TOFU", trigger: "community_voice", asset_type: "survey_pdf", capture: { type: "email_before_results", fields: ["email"], gating_rule: "PDF", consent: ["marketing_email"] }, delivery: { primary_channel: "email", assets: ["pdf"], personalization: "Segment filters" }, conv: { primary_offer: "Custom survey + report", fallback_offer: "Webinar walkthrough", success_metric: "custom_studies", booking_or_call: true }, emailPrefix: "Survey", goals: ["Deliver", "Surprise finding", "How to apply", "Offer custom"], notes: "" },
  { title: "Insider Report", hook: "What insiders know about [topic]", promise: "Non-obvious mechanics + risks.", persona: "sophisticated", stage: "MOFU", trigger: "edge_seeking", asset_type: "insider_pdf", capture: { type: "email_before_results", fields: ["email"], gating_rule: "PDF", consent: ["marketing_email"] }, delivery: { primary_channel: "email", assets: ["pdf"], personalization: "Redacted client examples" }, conv: { primary_offer: "Mastermind or advisory", fallback_offer: "Community", success_metric: "high_ticket_sales", booking_or_call: true }, emailPrefix: "Insider", goals: ["Deliver", "Framework", "Cautionary tale", "Offer mastermind"], notes: "" },
  { title: "Opportunity Report", hook: "Where the opportunity is in the next 90 days", promise: "Prioritized plays with effort estimates.", persona: "founder", stage: "BOFU", trigger: "planning_cycle", asset_type: "opportunity_pdf", capture: { type: "email_before_results", fields: ["email", "company"], gating_rule: "PDF", consent: ["marketing_email"] }, delivery: { primary_channel: "email", assets: ["pdf"], personalization: "Inputs reflected in appendix" }, conv: { primary_offer: "Execution partnership", fallback_offer: "Sprint", success_metric: "sprint_close", booking_or_call: true }, emailPrefix: "Opportunity", goals: ["Deliver", "Pick one play", "Resource needs", "Offer partnership"], notes: "" }
]
cat8.forEach((s, idx) => pushSimple(8, "report_insight", "asset", idx + 1, s))

function sectionsService(hook) {
  return {
    sections: [
      { id: "hero", headline: hook, subhead: "Application protects your time and sets expectations.", bullets: ["Clear deliverable", "SLA stated", "Fit criteria visible"], cta_text: "Apply", cta_action: "start_application" },
      { id: "process", headline: "What happens after you apply", subhead: "Review → diagnostic → proposal path.", cta_text: "See steps", cta_action: "scroll_process" },
      { id: "proof", headline: "Outcomes we create", cta_text: "Read cases", cta_action: "cases" },
      { id: "faq", headline: "Fit & pricing", bullets: ["Who it’s for", "Who it’s not for", "Typical timelines"], cta_text: "Apply now", cta_action: "start_application" },
      { id: "cta", headline: "Request your spot", cta_text: "Submit application", cta_action: "submit_application" }
    ],
    thank_you_page: { headline: "Application received", next_step_cta: "Book intake if auto-scheduled" }
  }
}

function pushService(catNum, i, spec) {
  const id = `lm-cat${String(catNum).padStart(2, "0")}-${String(i).padStart(3, "0")}`
  magnets.push(
    magnetBase({
      id,
      title: spec.title,
      category: "personalized_service",
      persona: spec.persona,
      funnel_stage: spec.stage,
      trigger_event: spec.trigger,
      asset_type: spec.asset_type,
      value_promise: spec.promise,
      hook: spec.hook,
      landing_page_structure: sectionsService(spec.hook),
      capture_mechanism: spec.capture,
      delivery_method: spec.delivery,
      nurture_sequence: nurture4(spec.emailPrefix, spec.goals),
      conversion_path: spec.conv,
      automation_logic: automationBundle("quiz"),
      notes: spec.notes ?? ""
    })
  )
}

const cat9 = [
  { title: "Free Audit", hook: "Free [surface] audit—limited spots per month", promise: "Loom/video or written findings.", persona: "owner", stage: "MOFU", trigger: "trust_build", asset_type: "audit_application", capture: { type: "application", fields: ["email", "company", "url", "goals"], gating_rule: "Manual qualification", consent: ["marketing_email", "terms"] }, delivery: { primary_channel: "async_video_or_doc", assets: ["loom", "google_doc"], personalization: "Tailored to submitted URL" }, conv: { primary_offer: "Remediation engagement", fallback_offer: "DIY checklist", success_metric: "close_rate_from_audit", booking_or_call: true }, emailPrefix: "Audit", goals: ["Expectations set", "Deliver findings", "Plan options", "Close project"], notes: "Cap monthly volume in n8n." },
  { title: "Strategy Call", hook: "Book a free strategy call (qualified)", promise: "30 minutes, outcome agenda.", persona: "buyer", stage: "BOFU", trigger: "high_intent", asset_type: "call_booking", capture: { type: "application", fields: ["email", "phone", "context"], gating_rule: "Calendar after qualify", consent: ["marketing_email"] }, delivery: { primary_channel: "calendar", assets: ["cal_link"], personalization: "Rep routing rules" }, conv: { primary_offer: "Proposal", fallback_offer: "Paid audit", success_metric: "qualified_calls_held", booking_or_call: true }, emailPrefix: "Call", goals: ["Confirm agenda", "Pre-call homework", "Recap", "Proposal"], notes: "Sync to SuiteDash tasks." },
  { title: "Roadmap Plan", hook: "Get a written roadmap for [goal]", promise: "Phase plan with milestones.", persona: "planner", stage: "BOFU", trigger: "planning", asset_type: "roadmap_deliverable", capture: { type: "application", fields: ["email", "budget_band", "timeline"], gating_rule: "Paid or free limited promo", consent: ["terms"] }, delivery: { primary_channel: "email", assets: ["pdf_roadmap"], personalization: "Inputs reflected" }, conv: { primary_offer: "Execution retainer", fallback_offer: "Office hours pack", success_metric: "retainer_close", booking_or_call: true }, emailPrefix: "Roadmap", goals: ["Kickoff", "Draft review", "Finalize", "Offer execution"], notes: "" },
  { title: "Custom Proposal", hook: "Request a tailored proposal", promise: "Scope, price bands, timeline.", persona: "procurement", stage: "BOFU", trigger: "vendor_selection", asset_type: "proposal_request", capture: { type: "application", fields: ["email", "company", "requirements_doc"], gating_rule: "NDA optional", consent: ["terms"] }, delivery: { primary_channel: "email", assets: ["pdf_proposal"], personalization: "Full custom" }, conv: { primary_offer: "Signed SOW", fallback_offer: "Pilot", success_metric: "win_rate", booking_or_call: true }, emailPrefix: "Proposal", goals: ["Clarify needs", "Deliver draft", "Revision round", "Close"], notes: "" },
  { title: "Demo Funnel", hook: "See the product with your data (sandbox)", promise: "Guided demo + trial extension.", persona: "evaluator", stage: "BOFU", trigger: "product_eval", asset_type: "demo_flow", capture: { type: "application", fields: ["email", "role"], gating_rule: "AE assigns slot", consent: ["marketing_email"] }, delivery: { primary_channel: "live_demo", assets: ["zoom", "sandbox_env"], personalization: "Use-case script" }, conv: { primary_offer: "Commercial agreement", fallback_offer: "POC", success_metric: "demo_to_close", booking_or_call: true }, emailPrefix: "Demo", goals: ["Prep", "Demo recap", "Security FAQ", "Commercials"], notes: "" },
  { title: "Personalized Video", hook: "A 2-minute video made for you", promise: "Uses submitted details—human or hybrid.", persona: "prospect", stage: "MOFU", trigger: "delight", asset_type: "personal_video", capture: { type: "email_before_results", fields: ["email", "first_name", "company"], gating_rule: "Queue-based SLA", consent: ["marketing_email"] }, delivery: { primary_channel: "email", assets: ["hosted_video_link"], personalization: "Script from CRM fields" }, conv: { primary_offer: "Strategy call", fallback_offer: "Self-serve trial", success_metric: "call_book_rate", booking_or_call: true }, emailPrefix: "Video", goals: ["Deliver video", "CTA reinforcement", "Objection preempt", "Book call"], notes: "Throttle with queue worker." },
  { title: "AI-Generated Plan", hook: "AI drafts your plan—you refine with us", promise: "Structured plan with assumptions flagged.", persona: "early_adopter", stage: "MOFU", trigger: "speed", asset_type: "ai_plan", capture: { type: "progressive", fields: ["email", "goals", "constraints"], gating_rule: "Human review optional", consent: ["marketing_email", "ai_disclosure"] }, delivery: { primary_channel: "email", assets: ["pdf_plan"], personalization: "Model + human edits" }, conv: { primary_offer: "Implementation sprint", fallback_offer: "Template pack", success_metric: "sprint_sales", booking_or_call: true }, emailPrefix: "AI plan", goals: ["Deliver draft", "Human review invite", "Refinement tips", "Offer sprint"], notes: "" },
  { title: "Done-for-you Sample", hook: "See a sample deliverable before you buy", promise: "Redacted real sample or synthetic twin.", persona: "skeptic", stage: "BOFU", trigger: "quality_check", asset_type: "sample_pack", capture: { type: "email_before_results", fields: ["email", "niche"], gating_rule: "Watermark sample", consent: ["marketing_email"] }, delivery: { primary_channel: "email", assets: ["pdf_zip"], personalization: "Niche-flavored sample" }, conv: { primary_offer: "Full engagement", fallback_offer: "Pilot milestone", success_metric: "pilot_to_full", booking_or_call: true }, emailPrefix: "Sample", goals: ["Deliver sample", "Explain process", "Timeline", "Start pilot"], notes: "" },
  { title: "Pilot Program", hook: "Low-risk pilot with clear success criteria", promise: "Scope box + exit decision.", persona: "champion", stage: "BOFU", trigger: "risk_reduction", asset_type: "pilot_sow", capture: { type: "application", fields: ["email", "company", "success_metrics"], gating_rule: "Contract countersign", consent: ["terms"] }, delivery: { primary_channel: "project_portal", assets: ["notion_or_pm_link"], personalization: "Pilot dashboard" }, conv: { primary_offer: "Full rollout", fallback_offer: "Extend pilot", success_metric: "pilot_success_rate", booking_or_call: true }, emailPrefix: "Pilot", goals: ["Kickoff", "Weekly checkpoint", "Results review", "Expand or exit"], notes: "" },
  { title: "Beta Access", hook: "Join the beta—shape the roadmap", promise: "Early features + feedback channel.", persona: "innovator", stage: "MOFU", trigger: "early_access", asset_type: "beta_program", capture: { type: "application", fields: ["email", "use_case"], gating_rule: "Waitlist or instant", consent: ["terms", "beta_agreement"] }, delivery: { primary_channel: "product", assets: ["beta_env"], personalization: "Feature flags" }, conv: { primary_offer: "Annual plan lock-in", fallback_offer: "Community", success_metric: "beta_to_paid", booking_or_call: false }, emailPrefix: "Beta", goals: ["Welcome", "First task", "Feedback loop", "Convert to paid"], notes: "Tie to experiment keys in runtime." }
]
cat9.forEach((s, idx) => pushService(9, idx + 1, s))

function sectionsCommunity(hook) {
  return {
    sections: [
      { id: "hero", headline: hook, subhead: "Belonging + access + cadence.", bullets: ["Guidelines", "Moderation", "Value rituals"], cta_text: "Join", cta_action: "capture_email" },
      { id: "inside", headline: "What you get inside", cta_text: "Preview topics", cta_action: "scroll_topics" },
      { id: "rules", headline: "Community rules", cta_text: "Agree & continue", cta_action: "capture_email" },
      { id: "cta", headline: "Claim your access", cta_text: "Join now", cta_action: "capture_email" },
      { id: "sticky", headline: "Doors close or cap applies", cta_text: "Join before cap", cta_action: "capture_email" }
    ],
    thank_you_page: { headline: "Welcome in", next_step_cta: "Introduce yourself in #intros" }
  }
}

function pushCommunity(catNum, i, spec) {
  const id = `lm-cat${String(catNum).padStart(2, "0")}-${String(i).padStart(3, "0")}`
  magnets.push(
    magnetBase({
      id,
      title: spec.title,
      category: "community_access",
      persona: spec.persona,
      funnel_stage: spec.stage,
      trigger_event: spec.trigger,
      asset_type: spec.asset_type,
      value_promise: spec.promise,
      hook: spec.hook,
      landing_page_structure: sectionsCommunity(spec.hook),
      capture_mechanism: spec.capture,
      delivery_method: spec.delivery,
      nurture_sequence: nurture4(spec.emailPrefix, spec.goals),
      conversion_path: spec.conv,
      automation_logic: automationBundle("asset"),
      notes: spec.notes ?? ""
    })
  )
}

const cat10 = [
  { title: "Private Community", hook: "Join the private community for [topic]", promise: "Forum + office hours + resource drops.", persona: "community_seeker", stage: "MOFU", trigger: "belonging", asset_type: "community", capture: { type: "email_before_results", fields: ["email", "first_name"], gating_rule: "Payment or application optional", consent: ["community_rules", "marketing_email"] }, delivery: { primary_channel: "circle_or_slack", assets: ["invite_link"], personalization: "Onboarding cohorts" }, conv: { primary_offer: "Paid membership", fallback_offer: "Annual", success_metric: "mrr", booking_or_call: false }, emailPrefix: "Community", goals: ["Welcome", "First win thread", "Highlight member", "Upsell annual"], notes: "Moderation SLA in SuiteDash tasks." },
  { title: "VIP Newsletter", hook: "The memo operators actually read", promise: "Weekly insight + one tool.", persona: "subscriber", stage: "TOFU", trigger: "ongoing_value", asset_type: "newsletter", capture: { type: "email_before_results", fields: ["email"], gating_rule: "Double opt-in optional", consent: ["marketing_email"] }, delivery: { primary_channel: "email", assets: ["weekly_issue"], personalization: "Topic tags from clicks" }, conv: { primary_offer: "Paid research tier", fallback_offer: "Sponsor slots", success_metric: "paid_tier_subs", booking_or_call: false }, emailPrefix: "VIP memo", goals: ["Issue 1 value", "Reply prompt", "Archive highlight", "Offer paid tier"], notes: "" },
  { title: "Insider Club", hook: "Insider drops: deals, templates, early invites", promise: "Monthly bundle + live Q&A.", persona: "deal_seeker", stage: "MOFU", trigger: "insider_status", asset_type: "club", capture: { type: "email_before_results", fields: ["email"], gating_rule: "Stripe or manual", consent: ["terms"] }, delivery: { primary_channel: "email_plus_event", assets: ["monthly_drop", "zoom_qa"], personalization: "Segment by niche" }, conv: { primary_offer: "Annual club", fallback_offer: "Partner perks", success_metric: "club_retention", booking_or_call: false }, emailPrefix: "Insider", goals: ["First drop", "Q&A invite", "Member win", "Renewal"], notes: "" },
  { title: "Slack/Discord Access", hook: "Real-time help in our workspace", promise: "Channels by topic + office hours.", persona: "builder", stage: "MOFU", trigger: "realtime_help", asset_type: "chat_access", capture: { type: "application", fields: ["email", "linkedin_optional"], gating_rule: "Invite after vetting", consent: ["code_of_conduct"] }, delivery: { primary_channel: "chat_invite", assets: ["invite"], personalization: "Role-based channels" }, conv: { primary_offer: "Mentorship tier", fallback_offer: "Courses", success_metric: "tier_upgrades", booking_or_call: false }, emailPrefix: "Chat access", goals: ["Invite sent", "Rules ack", "First question guided", "Upsell tier"], notes: "" },
  { title: "Founding Member Access", hook: "Founding member pricing and influence", promise: "Locked rate + roadmap votes.", persona: "early_adopter", stage: "MOFU", trigger: "founder_affinity", asset_type: "founding_pass", capture: { type: "application", fields: ["email", "payment"], gating_rule: "Cap count", consent: ["terms"] }, delivery: { primary_channel: "product", assets: ["founding_badge"], personalization: "Member number" }, conv: { primary_offer: "Lifetime or annual", fallback_offer: "None", success_metric: "founding_seats_sold", booking_or_call: false }, emailPrefix: "Founding", goals: ["Welcome founders", "Roadmap vote", "Exclusive call", "Retention story"], notes: "" },
  { title: "Waitlist Funnel", hook: "Join the waitlist for [launch]", promise: "Position + bonus for early waiters.", persona: "anticipator", stage: "TOFU", trigger: "scarcity", asset_type: "waitlist", capture: { type: "email_before_results", fields: ["email"], gating_rule: "Referral optional", consent: ["marketing_email"] }, delivery: { primary_channel: "email", assets: ["position_updates"], personalization: "Referral rank" }, conv: { primary_offer: "Launch purchase", fallback_offer: "Downsell", success_metric: "waitlist_to_sale", booking_or_call: false }, emailPrefix: "Waitlist", goals: ["Confirm spot", "Build hype", "Social proof", "Launch offer"], notes: "Runtime handles referral keys." },
  { title: "Early Access Program", hook: "Early access before public GA", promise: "Bug bounty culture + direct line to team.", persona: "innovator", stage: "MOFU", trigger: "product_hype", asset_type: "early_access", capture: { type: "application", fields: ["email", "use_case"], gating_rule: "Accept/decline", consent: ["terms"] }, delivery: { primary_channel: "product", assets: ["early_build"], personalization: "Feature flags" }, conv: { primary_offer: "Paid plan", fallback_offer: "Credits", success_metric: "activation_rate", booking_or_call: false }, emailPrefix: "Early access", goals: ["Ship login", "First success path", "Feedback", "Convert"], notes: "" },
  { title: "Ambassador Program", hook: "Earn rewards for spreading the word", promise: "Tracked links + tiers.", persona: "advocate", stage: "MOFU", trigger: "advocacy", asset_type: "ambassador", capture: { type: "application", fields: ["email", "audience_size"], gating_rule: "Manual approve", consent: ["terms", "payout_policy"] }, delivery: { primary_channel: "portal", assets: ["affiliate_dashboard"], personalization: "Custom link" }, conv: { primary_offer: "Revenue share", fallback_offer: "Credits", success_metric: "partner_revenue", booking_or_call: false }, emailPrefix: "Ambassador", goals: ["Approve", "Asset kit", "First post ideas", "Payout cadence"], notes: "" },
  { title: "Referral Program", hook: "Give $X, get $Y—refer friends", promise: "Simple referral UX + tracking.", persona: "customer", stage: "BOFU", trigger: "delight", asset_type: "referral", capture: { type: "account_signup", fields: ["email"], gating_rule: "Must be customer", consent: ["terms"] }, delivery: { primary_channel: "in_app", assets: ["share_links"], personalization: "Dynamic coupon" }, conv: { primary_offer: "More referrals", fallback_offer: "Charity option", success_metric: "viral_coefficient", booking_or_call: false }, emailPrefix: "Referral", goals: ["Explain program", "First share nudge", "Reward issued", "Double-sided bonus"], notes: "" },
  { title: "Exclusive Deals Club", hook: "Members-only deals from partners", promise: "Curated offers with deadlines.", persona: "buyer", stage: "MOFU", trigger: "deal_hunt", asset_type: "deals_club", capture: { type: "email_before_results", fields: ["email"], gating_rule: "Monthly fee or email-only", consent: ["marketing_email"] }, delivery: { primary_channel: "email", assets: ["deal_digest"], personalization: "Category prefs" }, conv: { primary_offer: "Paid club", fallback_offer: "Sponsor", success_metric: "club_mrr", booking_or_call: false }, emailPrefix: "Deals club", goals: ["First deal drop", "Redemption story", "Partner spotlight", "Renew"], notes: "Compliance for financial promos if applicable." }
]
cat10.forEach((s, idx) => pushCommunity(10, idx + 1, s))

if (magnets.length !== 100) {
  console.error("Expected 100 magnets, got", magnets.length)
  process.exit(1)
}

const catalog = {
  catalog_version: "1.0.0",
  schema: "lead-magnet.schema.json",
  generated_at: new Date().toISOString(),
  count: magnets.length,
  categories: [
    { code: "cat01", key: "quiz_assessment", label: "Quiz / Assessment" },
    { code: "cat02", key: "calculator", label: "Calculators" },
    { code: "cat03", key: "template", label: "Templates" },
    { code: "cat04", key: "swipe_file", label: "Swipe Files" },
    { code: "cat05", key: "mini_course", label: "Mini-Courses" },
    { code: "cat06", key: "toolkit", label: "Toolkits / Resource Packs" },
    { code: "cat07", key: "free_tool", label: "Free Tools / PLG" },
    { code: "cat08", key: "report_insight", label: "Reports & Insights" },
    { code: "cat09", key: "personalized_service", label: "Personalized Services" },
    { code: "cat10", key: "community_access", label: "Community / Access" }
  ],
  magnets
}

const outPath = path.join(root, "catalog.v1.json")
fs.writeFileSync(outPath, JSON.stringify(catalog, null, 2), "utf8")
console.log("Wrote", outPath, "magnets:", catalog.count)
