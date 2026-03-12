# Lead OS — Enhanced User Journeys (All 22 Scenarios)

## How This Document Works

Each of the 22 AI Concierge scenarios is mapped through all 12 Lead OS layers. The document shows:

- **What V10 already does** (the working 15-module pipeline)
- **What Lead OS adds** (scoring, journeys, intelligence, lifecycle)
- **The complete lead journey** from first anonymous visit to niche intelligence feedback loop

---

## Part 1 — Lead OS × V10 Architecture Mapping

### The 12 Lead OS Layers

```
 1. Traffic & Authority Layer        ← drives visitors to forms
 2. Visitor Intelligence Layer       ← tracks anonymous behavior before capture
 3. Lead Capture Layer               ← webhook trigger / form submission
 4. Lead Identity Graph              ← canonical record in Boost.space
 5. Event Processing Layer           ← events fire, scores update
 6. Automation Orchestration Layer   ← the 15-module pipeline
 7. Journey Engine                   ← which nurture sequence applies
 8. Persona Messaging Engine         ← named advisor, tone, style
 9. Conversion Engine                ← consultation booking, proposals
10. Client Lifecycle Engine          ← onboarding → retention → referral
11. Niche Intelligence Engine        ← learns what works per niche
12. Control Tower & Analytics        ← dashboards, alerts, monitoring
```

### What V10 Already Implements

| Layer | V10 Status | Implementation |
|---|---|---|
| 1. Traffic & Authority | Partial | Website forms exist; SEO/content not yet automated |
| 2. Visitor Intelligence | Not built | No Plerdy/Happierleads/Salespanel integration yet |
| 3. Lead Capture | **COMPLETE** | 22 webhooks active, receiving form data |
| 4. Lead Identity Graph | **COMPLETE** | Boost.space sync + DataStore per lead |
| 5. Event Processing | Partial | `lead.captured` event fires; no scoring events yet |
| 6. Automation Orchestration | **COMPLETE** | 15-module pipeline, 22/22 passing |
| 7. Journey Engine | Partial | Single "intake" journey; no multi-step sequences |
| 8. Persona Messaging | **COMPLETE** | 11 named advisors, AI-personalized emails |
| 9. Conversion Engine | Partial | Welcome touch only; no consultation booking automation |
| 10. Client Lifecycle | Not built | SuiteDash records created but no lifecycle workflows |
| 11. Niche Intelligence | Not built | AITable logs data but no analysis engine |
| 12. Control Tower | Partial | Discord/Telegram alerts + AITable logs |

### The Enhanced Pipeline (V10 + Lead OS)

```
BEFORE CAPTURE (Lead OS adds these layers)
  │
  ├─ Authority content drives SEO traffic (NeuronWriter + Katteb)
  ├─ Visitor tracked anonymously (Plerdy + Happierleads)
  ├─ Company identified before form fill (Salespanel)
  ├─ Behavioral scoring begins (page views, time on site)
  │
CAPTURE (V10 — working now)
  │
  ├─ Form submitted → Webhook fires
  ├─ SetVariable × 2 (slug + advisor)
  ├─ HTTP POST to Vercel API → SuiteDash records
  ├─ OpenAI #1: Lead Intelligence Analyst
  ├─ OpenAI #2: Concierge Email Writer
  ├─ Boost.space CRM sync
  ├─ Discord notification (rich embed)
  ├─ Telegram notification
  ├─ Emailit: AI-written welcome email TO LEAD
  ├─ WhatsApp: instant message TO LEAD
  ├─ Emailit: admin briefing TO IKE
  ├─ AITable: event log
  ├─ DataStore: lead profile
  ├─ WebhookRespond: JSON to website
  │
AFTER CAPTURE (Lead OS adds these layers)
  │
  ├─ lead.captured event fires
  ├─ Scores calculated (intent + fit + engagement + urgency)
  ├─ Journey assigned (welcome → education → qualification → conversion)
  ├─ Nurture sequence begins (multi-touch, multi-day)
  ├─ Hot Lead Radar monitors for intent spikes
  ├─ Conversion acceleration triggers consultation invite
  ├─ Client lifecycle management post-conversion
  ├─ Niche intelligence aggregates performance data
  ├─ Control Tower dashboards update in real time
```

---

## Part 2 — Universal Lead OS Components

### 2.1 Canonical Lead Object (per Lead OS spec)

Every lead captured by any of the 22 scenarios creates this object in Boost.space:

```json
{
  "lead_id": "UUID",
  "created_at": "2026-03-10T02:49:53Z",
  "updated_at": "2026-03-10T02:49:55Z",

  "identity": {
    "first_name": "",
    "last_name": "",
    "email": "",
    "phone": "",
    "company_name": ""
  },

  "location": {
    "city": "",
    "state": "",
    "country": ""
  },

  "classification": {
    "lead_type": "customer",
    "niche": "yd-portal-setup",
    "brand": "Your Deputy",
    "source": "website_form",
    "source_detail": "portal-setup-page"
  },

  "scores": {
    "intent_score": 30,
    "fit_score": 0,
    "engagement_score": 0,
    "urgency_score": 0,
    "priority_score": 12
  },

  "behavior": {
    "pages_viewed": [],
    "emails_opened": [],
    "emails_clicked": [],
    "chat_sessions": [],
    "calls": []
  },

  "journey": {
    "journey_id": "welcome",
    "stage": "intake",
    "last_touch_at": "2026-03-10T02:49:55Z",
    "next_action": "education_email_1",
    "advisor": "Sarah Chen"
  },

  "preferences": {
    "preferred_channel": "email",
    "opt_in_status": true
  },

  "lifecycle": {
    "stage": "captured",
    "converted": false,
    "converted_at": null,
    "touchpoints": 1,
    "status": "concierge-active"
  },

  "niche_data": {}
}
```

The `niche_data` object varies per scenario (see individual journeys below).

### 2.2 Lead Lifecycle Stages

Every lead progresses through these stages. The V10 pipeline handles `Captured`. Lead OS adds the rest.

| Stage | Trigger | V10 Status |
|---|---|---|
| **Captured** | Form submitted, webhook fires | **ACTIVE** — this is what V10 does |
| **Enriched** | Visitor intelligence + API response merged | Partial — API response logged |
| **Engaged** | Lead opens email, clicks link, replies | Not built — needs email tracking |
| **Qualified** | Fit score + intent score exceed threshold | Not built — needs scoring engine |
| **Opportunity** | Consultation offered or requested | Not built — needs conversion engine |
| **Converted** | Becomes paying client | Not built — needs SuiteDash lifecycle |
| **Onboarding** | Service delivery begins | Not built — SuiteDash projects |
| **Active** | Ongoing service | Not built |
| **Dormant** | No interaction for 30-90 days | Not built — needs reactivation workflow |
| **Reactivated** | Re-engaged after dormancy | Not built |

### 2.3 Event Types (V10 → Lead OS)

Events that fire during and after the V10 pipeline:

| Event | Source | When | V10 Status |
|---|---|---|---|
| `lead.captured` | Webhook | Form submitted | **ACTIVE** |
| `lead.api_processed` | Vercel API | SuiteDash records created | **ACTIVE** |
| `lead.ai_analyzed` | OpenAI #1 | Intelligence briefing generated | **ACTIVE** |
| `lead.email_composed` | OpenAI #2 | Welcome email written | **ACTIVE** |
| `lead.crm_synced` | Boost.space | CRM record created | **ACTIVE** |
| `lead.notified_discord` | Discord | Team alert sent | **ACTIVE** |
| `lead.notified_telegram` | Telegram | Team alert sent | **ACTIVE** |
| `lead.email_sent` | Emailit | Welcome email delivered | **ACTIVE** |
| `lead.whatsapp_sent` | WbizTool | WhatsApp message delivered | **ACTIVE** |
| `lead.admin_briefed` | Emailit | Admin briefing delivered | **ACTIVE** |
| `lead.logged` | AITable | Event row created | **ACTIVE** |
| `lead.stored` | DataStore | Lead profile saved | **ACTIVE** |
| `email.opened` | Emailit/tracking | Lead opens welcome email | Not built |
| `email.clicked` | Emailit/tracking | Lead clicks link in email | Not built |
| `email.replied` | Emailit | Lead replies to advisor | Not built |
| `whatsapp.replied` | WbizTool | Lead replies on WhatsApp | Not built |
| `page.pricing_viewed` | Plerdy | Lead views pricing page | Not built |
| `page.case_study_viewed` | Plerdy | Lead views case study | Not built |
| `phone.call_received` | CallScaler | Lead calls | Not built |
| `phone.call_missed` | CallScaler | Missed call | Not built |
| `consultation.booked` | SuiteDash | Lead books meeting | Not built |
| `proposal.sent` | SuiteDash | Proposal delivered | Not built |
| `proposal.accepted` | SuiteDash | Client signs | Not built |
| `client.onboarded` | SuiteDash | Onboarding complete | Not built |
| `lead.dormant` | Scoring engine | No activity for threshold | Not built |
| `lead.reactivated` | Any interaction | Dormant lead returns | Not built |
| `referral.generated` | UpViral | Client refers someone | Not built |

### 2.4 Scoring Model

Four scores calculated per lead. Initial scores assigned at capture, updated on every subsequent event.

**Intent Score** — purchase readiness:

| Event | Points |
|---|---|
| Form submitted (lead.captured) | +30 |
| Pricing page viewed | +20 |
| Case study viewed | +15 |
| Email clicked | +10 |
| Email replied | +25 |
| WhatsApp replied | +25 |
| Phone call | +40 |
| Consultation booked | +50 |
| Multiple visits (3+) | +15 |

**Fit Score** — lead quality match:

| Attribute | Points |
|---|---|
| Correct niche match | +30 |
| Company size in target range | +20 |
| Geography match | +20 |
| Budget/deal value in range | +20 |
| Complete contact info (email + phone) | +10 |

**Engagement Score** — responsiveness:

| Event | Points |
|---|---|
| Email opened | +5 |
| Email clicked | +10 |
| Email replied | +20 |
| WhatsApp replied | +25 |
| Chat response | +25 |
| Phone answered | +30 |

**Urgency Score** — time sensitivity:

| Event | Points |
|---|---|
| Phone call | +40 |
| Consultation request | +30 |
| Multiple visits same day | +25 |
| Form filled after hours | +10 |
| Immediate reply to message | +35 |

**Priority Score** (Hot Lead Radar trigger):

```
priority = intent × 0.4 + engagement × 0.3 + fit × 0.2 + urgency × 0.1
```

Hot Lead Radar fires when `priority >= 80`.

### 2.5 Journey State Machine

After V10 captures a lead, the Journey Engine takes over:

```
CAPTURED
  │ (V10 welcome touch: email + WhatsApp + Discord + Telegram)
  ↓
WELCOME JOURNEY (Day 0-2)
  │ Step 1: AI welcome email (V10 — already sent)
  │ Step 2: WhatsApp message (V10 — already sent)
  │ Step 3: Follow-up value email (Day 1, 24h later)
  │ Step 4: Case study / social proof email (Day 2)
  ↓
EDUCATION JOURNEY (Day 3-10) — if intent_score < 50
  │ Step 1: Industry insight email from advisor
  │ Step 2: "Quick wins" resource (Telegram)
  │ Step 3: Relevant lead magnet offer
  │ Step 4: Peer comparison data
  ↓
QUALIFICATION JOURNEY (Day 5-14) — if intent_score 20-50
  │ Step 1: Discovery questions (email or chat)
  │ Step 2: Needs assessment
  │ Step 3: Tailored recommendation
  ↓
CONVERSION JOURNEY — if intent_score > 50
  │ Step 1: Consultation invite (personalized)
  │ Step 2: Proposal offer
  │ Step 3: Urgency/scarcity message
  ↓
ONBOARDING JOURNEY — after conversion
  │ Step 1: Welcome kit
  │ Step 2: Setup guidance
  │ Step 3: 30-day success roadmap
  ↓
RETENTION JOURNEY — ongoing
  │ Monthly check-in, quarterly review, annual renewal
  ↓
REACTIVATION JOURNEY — if dormant
  │ Value resource → pain point reminder → new offer
  ↓
REFERRAL JOURNEY — after successful engagement
  │ Referral request → incentive offer (UpViral)
```

### 2.6 Persona Configuration (11 Advisors)

Each persona is fully configured for the Persona Messaging Engine:

```json
[
  {
    "persona_id": "onboarding",
    "name": "Sarah Chen",
    "title": "Onboarding Specialist",
    "tone": "warm, organized, encouraging",
    "objectives": ["smooth setup", "early wins", "confidence building"],
    "message_style": ["step-by-step", "proactive", "celebration of progress"],
    "scenarios": ["yd-portal-setup", "yd-onboarding", "nc-client-portal"]
  },
  {
    "persona_id": "strategy",
    "name": "James Park",
    "title": "Strategy Consultant",
    "tone": "confident, insightful, data-driven",
    "objectives": ["pipeline optimization", "deal acceleration", "competitive positioning"],
    "message_style": ["analytical", "benchmark-driven", "action-oriented"],
    "scenarios": ["yd-crm-pipeline"]
  },
  {
    "persona_id": "compliance",
    "name": "Dr. Maya Patel",
    "title": "Compliance Director",
    "tone": "authoritative, reassuring, thorough",
    "objectives": ["regulatory clarity", "risk reduction", "deadline awareness"],
    "message_style": ["precise", "regulatory-aware", "deadline-focused"],
    "scenarios": ["yd-compliance-training", "nc-training-platform", "nc-compliance-training", "nc-compliance-productized"]
  },
  {
    "persona_id": "analytics",
    "name": "Alex Thompson",
    "title": "Analytics Advisor",
    "tone": "data-curious, clear, insight-focused",
    "objectives": ["data clarity", "actionable dashboards", "decision support"],
    "message_style": ["metric-driven", "visual-thinking", "benchmark-oriented"],
    "scenarios": ["yd-business-intelligence", "nc-business-intelligence"]
  },
  {
    "persona_id": "solutions",
    "name": "Marcus Rivera",
    "title": "Solutions Architect",
    "tone": "technical but accessible, solution-focused",
    "objectives": ["system design", "ROI maximization", "phased implementation"],
    "message_style": ["architectural", "phased", "ROI-conscious"],
    "scenarios": ["yd-managed-services", "nc-process-automation", "nc-systems-integration", "nc-managed-services", "nc-digital-transformation"]
  },
  {
    "persona_id": "legal",
    "name": "Victoria Santos",
    "title": "Legal Technology Advisor",
    "tone": "precise, compliance-aware, empathetic",
    "objectives": ["regulatory compliance", "workflow efficiency", "client experience"],
    "message_style": ["regulation-referenced", "process-oriented", "empathetic"],
    "scenarios": ["nc-re-syndication", "nc-immigration-law"]
  },
  {
    "persona_id": "industry",
    "name": "David Mitchell",
    "title": "Industry Specialist",
    "tone": "practical, field-experienced, safety-conscious",
    "objectives": ["operational efficiency", "safety compliance", "cost reduction"],
    "message_style": ["field-practical", "metric-driven", "safety-first"],
    "scenarios": ["nc-construction"]
  },
  {
    "persona_id": "franchise",
    "name": "Elena Vasquez",
    "title": "Franchise Systems Advisor",
    "tone": "systematic, brand-focused, growth-oriented",
    "objectives": ["brand consistency", "multi-location efficiency", "franchisee success"],
    "message_style": ["systematic", "scalability-focused", "compliance-aware"],
    "scenarios": ["nc-franchise"]
  },
  {
    "persona_id": "workforce",
    "name": "Rachel Kim",
    "title": "Workforce Solutions Advisor",
    "tone": "efficient, people-focused, metrics-aware",
    "objectives": ["placement velocity", "compliance", "client satisfaction"],
    "message_style": ["benchmark-driven", "process-efficient", "compliance-aware"],
    "scenarios": ["nc-staffing"]
  },
  {
    "persona_id": "community",
    "name": "Michael Thompson",
    "title": "Community Engagement Advisor",
    "tone": "warm, mission-driven, inclusive",
    "objectives": ["member engagement", "volunteer coordination", "giving growth"],
    "message_style": ["community-centered", "mission-aligned", "inclusive"],
    "scenarios": ["nc-church-management"]
  },
  {
    "persona_id": "creative",
    "name": "Zara Williams",
    "title": "Creator Economy Specialist",
    "tone": "trend-aware, creator-native, data-savvy",
    "objectives": ["talent monetization", "brand partnerships", "portfolio growth"],
    "message_style": ["trend-referenced", "platform-native", "rate-aware"],
    "scenarios": ["nc-creator-management"]
  }
]
```

### 2.7 Communication Routing

The Communication Router decides which channel to use for each touch:

| Touch | Channel | Timing | V10 Status |
|---|---|---|---|
| First contact — instant | WhatsApp | 0 seconds | **ACTIVE** |
| First contact — personal | Email (AI-written) | 0 seconds | **ACTIVE** |
| Team alert | Discord + Telegram | 0 seconds | **ACTIVE** |
| Admin briefing | Email to Ike | 0 seconds | **ACTIVE** |
| Follow-up #1 | Email | +24 hours | Not built |
| Follow-up #2 | Telegram or WhatsApp | +48 hours | Not built |
| Education content | Email | +3-7 days | Not built |
| Consultation invite | Email + WhatsApp | When intent > 50 | Not built |
| Dormant reactivation | Email | +30-90 days | Not built |
| Referral request | Email | +14 days post-conversion | Not built |

### 2.8 Hot Lead Radar Triggers

These combinations trigger immediate escalation:

| Trigger Combination | Priority Score | Alert |
|---|---|---|
| Form + phone call same day | ~100 | Telegram + Discord + SuiteDash task |
| Form + pricing page 2x | ~85 | Telegram alert |
| Email clicked + WhatsApp replied | ~90 | Telegram + consultation invite |
| 3+ page visits + form fill | ~80 | Discord embed |
| Consultation page visited | ~95 | Immediate outreach |
| Deal value > $10K (CRM pipeline) | ~90 | #high-value-leads Discord |

---

## Part 3 — Enhanced User Journeys (All 22 Scenarios)

Each scenario is described through all 12 Lead OS layers.

---

### Scenario 1 — YD Portal Setup (143953)

**Brand:** Your Deputy
**Advisor:** Sarah Chen, Onboarding Specialist
**Niche config ID:** `yd_portal_setup`

#### Layer 1 — Traffic & Authority
- **SEO content:** "Best client portal software for [industry]", "How to set up a client portal"
- **Authority pages:** Portal feature comparison guides, industry-specific portal case studies
- **Directory:** Your Deputy service listing on Brilliant Directories

#### Layer 2 — Visitor Intelligence
- **Plerdy:** Heatmaps on portal setup page, funnel analytics
- **Happierleads:** Company identification (know who's browsing before they fill the form)
- **Salespanel:** Track which industries are visiting, time on pricing page

#### Layer 3 — Lead Capture
- **Form fields:** companyName, contactFirstName, contactLastName, contactEmail, phone, domain, industry
- **Webhook:** Hook ID 55119 → Boost.space scenario 143953
- **Capture method:** Website form on yourdeputy.com portal setup page

#### Layer 4 — Lead Identity Graph
- **Canonical record created in Boost.space:**
  - Identity: name, email, phone, company
  - Classification: niche=`yd-portal-setup`, brand=`Your Deputy`, source=`website_form`
  - Niche data: `{ domain, industry, features_needed }`
- **SuiteDash:** Company + primary contact created with industry tags and feature tags (crm, pm, invoicing, fileVault, scheduling, lms)
- **DataStore:** `yd-portal-setup_{email}` key, stage=intake, touchpoints=1

#### Layer 5 — Event Processing
- `lead.captured` → initial scores: intent=30, fit=scored by industry match
- `lead.api_processed` → SuiteDash records confirmed
- `lead.ai_analyzed` → intelligence briefing: portal features for their industry, integration needs, competitor analysis
- `lead.email_sent` → welcome email delivered
- `lead.whatsapp_sent` → instant WhatsApp touch

#### Layer 6 — Automation Orchestration (V10 Pipeline)
```
Webhook → SetVar(slug=yd-portal-setup) → SetVar(advisor=Sarah Chen | Onboarding Specialist)
→ HTTP POST to yourdeputy-review.vercel.app/api/automations/portal-setup
  (creates company + contact in SuiteDash with industry/feature tags)
→ OpenAI #1: "What portal features matter most for their industry, what integrations they need, what competitors do"
→ OpenAI #2: Warm welcome email from Sarah Chen referencing their industry and domain
→ Boost.space sync
→ Discord: rich embed with AI intelligence briefing
→ Telegram: lead alert
→ Emailit: AI-written email TO LEAD ("Quick thoughts on {company} portal setup, {firstName}")
→ WhatsApp: instant message from Sarah Chen
→ Emailit: admin briefing TO IKE
→ AITable: event log row
→ DataStore: lead profile
→ WebhookRespond: {"success":true, "advisor":{"name":"Sarah Chen"}}
```

#### Layer 7 — Journey Engine
| Stage | Timing | Action |
|---|---|---|
| Welcome | Day 0 | V10 concierge touch (email + WhatsApp + Discord + Telegram) |
| Welcome follow-up | Day 1 | "Here's a quick portal feature checklist for {industry} companies" |
| Education | Day 3 | "How {similar company} set up their portal in 3 days" |
| Qualification | Day 5 | "Quick question — are you looking for client-facing or internal?" |
| Conversion | Day 7+ | "I'd love to walk you through a portal demo tailored to {industry}" |

#### Layer 8 — Persona Messaging
- **Advisor:** Sarah Chen
- **Tone:** Warm, organized, encouraging
- **Email style:** Step-by-step, references their specific domain and industry
- **Subject line:** "Quick thoughts on {company} portal setup, {firstName}"
- **WhatsApp style:** Brief, personal, mentions she'll send a detailed email

#### Layer 9 — Conversion Engine
- **Primary CTA:** Portal demo / consultation
- **Proposal trigger:** Lead replies or clicks consultation link
- **SuiteDash:** Creates project for portal setup, generates proposal

#### Layer 10 — Client Lifecycle
```
Captured → Enriched → Engaged → Qualified → Opportunity → Converted
→ Onboarding (SuiteDash project: portal configuration)
→ Active (portal live, ongoing support)
→ Retention (monthly check-in)
→ Referral (invite to refer other companies)
```

#### Layer 11 — Niche Intelligence
- **Tracks:** Which industries convert best, which portal features are most requested, which email subject lines get opened
- **Learns:** "Healthcare companies convert at 22% vs 8% for general. Portal demo CTA converts 3x vs free trial CTA."
- **Feeds back:** Adjusts scoring weights, email templates, advisor talking points

#### Layer 12 — Control Tower
- **Dashboard metrics:** Portal setup leads/week, conversion rate by industry, avg time to conversion
- **Alerts:** Hot lead (pricing page + form), high-value (enterprise indicator)

#### Hot Lead Radar Triggers (Scenario-Specific)
- Lead visits portal pricing page after form fill → priority spike
- Lead has domain already (indicates existing website, ready to integrate) → fit score +15
- Industry = healthcare or finance → high compliance needs = higher deal value

---

### Scenario 2 — YD CRM Pipeline (143956)

**Brand:** Your Deputy
**Advisor:** James Park, Strategy Consultant
**Niche config ID:** `yd_crm_pipeline`

#### Layer 1 — Traffic & Authority
- **SEO:** "CRM pipeline management for service businesses", "Deal tracking best practices"
- **Authority:** Sales process optimization guides, pipeline velocity benchmarks

#### Layer 2 — Visitor Intelligence
- **Key signals:** Time on pipeline/CRM pages, return visits to pricing, company size indicators

#### Layer 3 — Lead Capture
- **Form fields:** firstName, lastName, email, stage (discovery/proposal/negotiation/closed-won/closed-lost), company, phone, source, dealValue, notes
- **Webhook:** Hook ID 55120 → scenario 143956
- **Unique:** This is the ONLY scenario with explicit deal stages and values

#### Layer 4 — Lead Identity Graph
- **SuiteDash role mapping:** discovery→Lead, proposal/negotiation→Prospect, closed-won→Client, closed-lost→Lead
- **Deal value tags:** under-1k, 1k-5k, 5k-25k, 25k-100k, 100k-plus
- **Niche data:** `{ stage, dealValue, source, notes }`

#### Layer 5 — Event Processing
- `lead.captured` → intent score varies by stage: discovery=20, proposal=40, negotiation=60, closed-won=80
- Deal value > $10K → `lead.high_value` event → #high-value-leads Discord

#### Layer 6 — Automation Orchestration (V10 Pipeline)
```
Webhook → SetVar(slug=yd-crm-pipeline) → SetVar(advisor=James Park | Strategy Consultant)
→ HTTP POST to yourdeputy-review.vercel.app/api/automations/crm-pipeline
  (creates contact with stage-based role, deal value tags, source tags)
→ OpenAI #1: "Stage-appropriate next steps, deal value benchmarking, competitive positioning, urgency signals"
→ OpenAI #2: Personalized email from James Park
→ Full 15-module delivery
```

#### Layer 7 — Journey Engine (UNIQUE: Stage-Branched)
| Deal Stage | Journey | Content Focus |
|---|---|---|
| Discovery | Education | Industry insights, pain point awareness, call agenda prep |
| Proposal | Qualification | ROI calculator, case studies, proposal support |
| Negotiation | Conversion | Competitive comparison, urgency, executive briefing |
| Closed-Won | Onboarding | Celebration, welcome, success roadmap |
| Closed-Lost | Reactivation | Lessons learned, re-engagement offer (30-day follow-up) |

#### Layer 8 — Persona Messaging
- **Advisor:** James Park
- **Tone:** Confident, insightful, data-driven
- **Subject:** "Wanted to share some insights on {company}, {firstName}"
- **Style:** References deal value benchmarks, competitive positioning, stage-specific language

#### Layer 9 — Conversion Engine
- **Discovery → Proposal:** AI recommends proposal timing based on engagement signals
- **Proposal → Negotiation:** Sends competitive comparison data
- **Negotiation → Closed-Won:** Triggers onboarding automation
- **Deal value > $25K:** Executive alert to #high-value-leads Discord

#### Layer 11 — Niche Intelligence
- **Tracks:** Win rates by stage, avg deal size, source quality, time-in-stage
- **Learns:** "Deals from organic search close at 18% vs 6% from paid. Average deal takes 12 days from discovery to proposal."

#### Hot Lead Radar Triggers
- Deal value > $10K + stage = negotiation → immediate Telegram alert
- Closed-won + deal > $25K → celebration in #wins Discord
- Multiple notes added → high engagement signal

---

### Scenario 3 — YD Onboarding (143957)

**Brand:** Your Deputy
**Advisor:** Sarah Chen, Onboarding Specialist
**Niche config ID:** `yd_onboarding`

#### Layer 3 — Lead Capture
- **Form fields:** companyName, contactFirstName, contactLastName, contactEmail, plan (starter/professional/enterprise), phone, billingEmail
- **Webhook:** Hook ID 55121 → scenario 143957
- **Unique:** Has billingEmail field — creates separate billing contact if different from primary

#### Layer 4 — Lead Identity Graph
- **SuiteDash:** Company + primary contact. If billingEmail ≠ contactEmail, creates second contact tagged "billing-contact"
- **Niche data:** `{ plan, billingEmail, services }`

#### Layer 6 — Automation Orchestration
```
→ HTTP POST to yourdeputy-review.vercel.app/api/automations/onboarding
  (creates company + primary contact + optional billing contact)
→ OpenAI #1: "Plan-appropriate feature recommendations, early wins, upgrade path, 30-day success roadmap"
→ OpenAI #2: Welcome email with onboarding roadmap
```

#### Layer 7 — Journey Engine (Plan-Tiered)
| Plan | Journey Focus | Content |
|---|---|---|
| Starter | Quick setup | Essential features only, fast time-to-value |
| Professional | Full onboarding | Feature deep-dives, integrations, team training |
| Enterprise | White-glove | Dedicated setup, custom configuration, executive briefing |

#### Layer 9 — Conversion Engine
- **Already converted** — this is a post-sale scenario
- **Upsell engine:** Starter → Professional recommendation at Day 30. Professional → Enterprise at Day 60.
- **Referral trigger:** Day 14 post-onboarding → referral request via UpViral

#### Hot Lead Radar Triggers
- Enterprise plan + large company → VIP onboarding alert
- Billing email at corporate domain → likely decision-maker

---

### Scenario 4 — YD Compliance Training (143958)

**Brand:** Your Deputy
**Advisor:** Dr. Maya Patel, Compliance Director
**Niche config ID:** `yd_compliance_training`

#### Layer 3 — Lead Capture
- **Form fields:** companyName, contactEmail, contactFirstName, contactLastName, employees (array), courses (array: osha/hipaa/aml/harassment/dei/ethics/data-privacy/workplace-safety)
- **Webhook:** Hook ID 55122 → scenario 143958
- **Unique:** BULK operation — creates individual records for each employee

#### Layer 4 — Lead Identity Graph
- **SuiteDash:** Company + contact per employee (name, email, role). Course assignments tracked.
- **Returns:** Enrollment summary (total, enrolled, failed counts)
- **Niche data:** `{ employeeCount, courses, enrollmentResults }`

#### Layer 6 — Automation Orchestration
```
→ HTTP POST to yourdeputy-review.vercel.app/api/automations/compliance-training
  (creates company + bulk employee contacts, assigns courses)
→ OpenAI #1: "Regulatory requirements for their industry, completion timeline, additional courses needed, penalty risks"
→ OpenAI #2: Compliance roadmap email to primary contact
```

#### Layer 7 — Journey Engine (Compliance-Specific)
| Stage | Timing | Action |
|---|---|---|
| Enrollment confirmed | Day 0 | V10 concierge touch + course access instructions |
| Progress check | Day 7 | "Your team is X% through — here's what's next" |
| Deadline reminder | Day 14 | "Compliance deadline approaching — {N} employees remaining" |
| Completion celebration | On completion | Certificate generation + congratulations |
| Renewal notice | 11 months | "Annual recertification approaching" |

#### Layer 11 — Niche Intelligence
- **Tracks:** Courses per company, completion rates, industry distribution, upsell to additional courses
- **Learns:** "HIPAA companies average 45 employees, 3.2 courses. OSHA completions take 18 days on average."

#### Hot Lead Radar Triggers
- Employee count > 100 → high-value enterprise
- Multiple course types → comprehensive compliance need → upsell opportunity
- Healthcare + HIPAA → regulatory urgency signal

---

### Scenario 5 — YD Business Intelligence (143959)

**Brand:** Your Deputy
**Advisor:** Alex Thompson, Analytics Advisor
**Niche config ID:** `yd_business_intelligence`

#### Layer 3 — Lead Capture
- **Form fields:** companyName, contactFirstName, contactLastName, contactEmail, dataSources (quickbooks/stripe/shopify/hubspot/salesforce/sheets/custom), kpis (revenue/expenses/profitability/pipeline/churn/cac/ltv), reportingFrequency (daily/weekly/monthly)
- **Webhook:** Hook ID 55123 → scenario 143959

#### Layer 4 — Lead Identity Graph
- **SuiteDash:** Company + contact, tags per data source and KPI
- **Niche data:** `{ dataSources, kpis, reportingFrequency }`

#### Layer 7 — Journey Engine
| Stage | Content |
|---|---|
| Welcome | "Here's what I see for {company}'s data stack" |
| Education | "Top 5 KPIs {industry} companies should track" |
| Qualification | "Quick question — what decisions do you make from data today?" |
| Conversion | "Let me build you a sample dashboard — 15 min call" |

#### Hot Lead Radar Triggers
- Multiple data sources (3+) → complex integration = higher deal value
- KPI includes "profitability" + "churn" → sophisticated buyer
- Daily reporting frequency → urgent operational need

---

### Scenario 6 — YD Managed Services (143960)

**Brand:** Your Deputy
**Advisor:** Marcus Rivera, Solutions Architect
**Niche config ID:** `yd_managed_services`

#### Layer 3 — Lead Capture
- **Form fields:** companyName, contactFirstName, contactLastName, contactEmail, plan (starter/professional/enterprise), monthlyBudget
- **Webhook:** Hook ID 55124 → scenario 143960

#### Layer 4 — Lead Identity Graph
- **SuiteDash:** Company + contact, plan tag, budget range tag (under-1k through 10k-plus)
- **Niche data:** `{ plan, monthlyBudget, currentTools, painPoints }`

#### Layer 7 — Journey Engine (Budget-Tiered)
| Budget Range | Journey Focus |
|---|---|
| Under $1K | Quick wins, self-service resources, starter plan benefits |
| $1K-$5K | Managed implementation, monthly reviews |
| $5K+ | Dedicated account management, custom SLAs, executive reporting |

#### Hot Lead Radar Triggers
- Budget > $5K/month → high-value lead → #high-value-leads Discord
- Enterprise plan + large budget → VIP treatment
- Pain points mention "scaling" or "growing" → expansion signal

---

### Scenario 7 — NC Client Portal (143961)

**Brand:** NeatCircle
**Advisor:** Sarah Chen, Onboarding Specialist
**Niche config ID:** `nc_client_portal`

#### Layer 3 — Lead Capture
- **Form fields:** companyName, firstName, lastName, email, phone, industry
- **Webhook:** Hook ID 55125 → scenario 143961

#### Layer 4 — Lead Identity Graph
- **SuiteDash:** Company + contact with portal setup metadata
- **Niche data:** `{ industry, features_interested }`

#### Layer 7 — Journey Engine
| Stage | Content |
|---|---|
| Welcome | "Ideas for {company} client portal" — industry-specific module recommendations |
| Education | "How {industry} companies use portals to retain clients" |
| Qualification | "Which matters more — client communication or project tracking?" |
| Conversion | "Let me show you a portal mockup for {industry}" |

---

### Scenario 8 — NC Process Automation (143962)

**Brand:** NeatCircle
**Advisor:** Marcus Rivera, Solutions Architect
**Niche config ID:** `nc_process_automation`

#### Layer 3 — Lead Capture
- **Form fields:** companyName, firstName, lastName, email, estimatedManualHours
- **Webhook:** Hook ID 55126 → scenario 143962

#### Layer 4 — Lead Identity Graph
- **SuiteDash:** Company + contact, manual hours range tags (0-10, 11-40, 41-100, 100+)
- **Niche data:** `{ estimatedManualHours, currentProcesses, painPoints, targetTools }`

#### Layer 7 — Journey Engine (ROI-Driven)
| Manual Hours | Journey Focus |
|---|---|
| 0-10 hrs/week | "Small wins that save 5+ hours/month" |
| 11-40 hrs/week | "Your team is spending ${hours × $40}/month on manual work" |
| 41-100 hrs/week | "This is a full-time employee's worth of automation opportunity" |
| 100+ hrs/week | "Enterprise automation assessment — let's map your processes" |

#### Hot Lead Radar Triggers
- 100+ manual hours/week → massive ROI opportunity → immediate escalation
- Mentions "growing" or "scaling" in pain points → expansion signal

---

### Scenario 9 — NC Systems Integration (143963)

**Brand:** NeatCircle
**Advisor:** Marcus Rivera, Solutions Architect
**Niche config ID:** `nc_systems_integration`

#### Layer 3 — Lead Capture
- **Form fields:** companyName, firstName, lastName, email, syncFrequency
- **Webhook:** Hook ID 55127 → scenario 143963

#### Layer 7 — Journey Engine
| Sync Frequency | Journey Focus |
|---|---|
| Real-time | "Your data needs to flow instantly — here's how" |
| Hourly/Daily | "Batch sync strategies that prevent data conflicts" |
| Weekly | "Weekly reporting integrations done right" |

---

### Scenario 10 — NC Training Platform (143964)

**Brand:** NeatCircle
**Advisor:** Dr. Maya Patel, Compliance Director
**Niche config ID:** `nc_training_platform`

#### Layer 3 — Lead Capture
- **Form fields:** companyName, firstName, lastName, email, trainingType (employee/client/certification/compliance), estimatedLearners
- **Webhook:** Hook ID 55128 → scenario 143964

#### Layer 4 — Lead Identity Graph
- **SuiteDash:** Company + contact, tags for training type and learner count (1-50, 51-200, 201-500, 500+)
- **Niche data:** `{ trainingType, estimatedLearners, courseCount }`

#### Layer 7 — Journey Engine
| Training Type | Journey Focus |
|---|---|
| Employee training | Internal upskilling, onboarding sequences |
| Client training | Customer education portals, self-service knowledge |
| Certification | Exam prep, certificate generation, renewal tracking |
| Compliance | Regulatory deadlines, mandatory courses, audit prep |

#### Hot Lead Radar Triggers
- 500+ learners → enterprise training deal
- Compliance + certification combined → comprehensive training need

---

### Scenario 11 — NC Business Intelligence (143965)

**Brand:** NeatCircle
**Advisor:** Alex Thompson, Analytics Advisor
**Niche config ID:** `nc_business_intelligence`

#### Layer 3 — Lead Capture
- **Form fields:** companyName, firstName, lastName, email, reportingFrequency
- **Webhook:** Hook ID 55129 → scenario 143965

#### Layer 7 — Journey Engine
| Reporting Frequency | Journey Focus |
|---|---|
| Daily | "Real-time dashboards for operational decisions" |
| Weekly | "Weekly pulse reports that drive action" |
| Monthly | "Board-ready monthly analytics packages" |

---

### Scenario 12 — NC Compliance Training (143966)

**Brand:** NeatCircle
**Advisor:** Dr. Maya Patel, Compliance Director
**Niche config ID:** `nc_compliance_training`

#### Layer 3 — Lead Capture
- **Form fields:** companyName, contactFirstName, contactLastName, contactEmail, employees (array), courses (array)
- **Webhook:** Hook ID 55130 → scenario 143966
- **Unique:** Same bulk employee pattern as YD Compliance Training (Scenario 4)

#### Layer 4 — Lead Identity Graph
- **SuiteDash:** Company + per-employee contacts + course assignments
- **Niche data:** `{ employees, courses, enrollmentResults }`

#### Layer 7 — Journey Engine
Same compliance-specific journey as Scenario 4, with NeatCircle branding. Regulation-specific content (OSHA, HIPAA, SOX) based on detected industry.

#### Hot Lead Radar Triggers
- Large employee arrays (50+) → enterprise compliance deal
- Multiple course types → comprehensive program → higher deal value

---

### Scenario 13 — NC Managed Services (143967)

**Brand:** NeatCircle
**Advisor:** Marcus Rivera, Solutions Architect
**Niche config ID:** `nc_managed_services`

#### Layer 3 — Lead Capture
- **Form fields:** companyName, firstName, lastName, email, plan
- **Webhook:** Hook ID 55131 → scenario 143967

#### Layer 7 — Journey Engine
| Plan | Journey Focus |
|---|---|
| Starter | Self-service resources + monthly check-in |
| Professional | Bi-weekly reviews + proactive recommendations |
| Enterprise | Weekly strategy sessions + dedicated account manager |

---

### Scenario 14 — NC Digital Transformation (143968)

**Brand:** NeatCircle
**Advisor:** Marcus Rivera, Solutions Architect
**Niche config ID:** `nc_digital_transformation`

#### Layer 3 — Lead Capture
- **Form fields:** companyName, firstName, lastName, email, timeline, budgetRange
- **Webhook:** Hook ID 55132 → scenario 143968
- **Niche data:** `{ timeline, budgetRange, currentState, goals }`

#### Layer 7 — Journey Engine (Timeline-Driven)
| Timeline | Journey Focus |
|---|---|
| 1-3 months | "Quick transformation sprints — maximum impact, minimum disruption" |
| 3-6 months | "Phased digital roadmap with measurable milestones" |
| 6-12 months | "Comprehensive transformation program with change management" |
| 12+ months | "Enterprise digital evolution — long-term strategic partnership" |

#### Hot Lead Radar Triggers
- Budget > $50K → enterprise deal
- Timeline < 3 months → urgency signal
- Multiple goals → complex engagement → higher value

---

### Scenario 15 — NC RE Syndication (143969)

**Brand:** NeatCircle
**Advisor:** Victoria Santos, Legal Technology Advisor
**Niche config ID:** `nc_re_syndication`

#### Layer 1 — Traffic & Authority
- **SEO:** "Investor portal software for real estate syndication", "Reg D 506(b) compliance tools"
- **Authority:** SEC compliance guides, investor communication best practices

#### Layer 3 — Lead Capture
- **Form fields:** syndicationName, firstName, lastName, email, phone, dealType (equity/debt/preferred), targetRaise, propertyType
- **Webhook:** Hook ID 55133 → scenario 143969

#### Layer 4 — Lead Identity Graph
- **SuiteDash:** Company (syndication) + contact, raise range tags (under-1m, 1m-5m, 5m-25m, 25m-plus)
- **Niche data:** `{ dealType, targetRaise, propertyType, investorCount }`

#### Layer 7 — Journey Engine (Raise-Size Tiered)
| Target Raise | Journey Focus |
|---|---|
| Under $1M | "Small syndication portal essentials — investor updates + K-1 distribution" |
| $1M-$5M | "Mid-market syndication — investor CRM + automated distributions" |
| $5M-$25M | "Institutional-grade portal — investor accreditation + waterfall calc" |
| $25M+ | "Enterprise syndication platform — multi-deal, multi-entity, investor relations" |

#### Hot Lead Radar Triggers
- Target raise > $5M → high-value
- Deal type = equity → more complex, higher fee
- Multiple property types → serial syndicator → long-term client

---

### Scenario 16 — NC Immigration Law (143970)

**Brand:** NeatCircle
**Advisor:** Victoria Santos, Legal Technology Advisor
**Niche config ID:** `nc_immigration_law`

#### Layer 1 — Traffic & Authority
- **SEO:** "Immigration law case management software", "Client portal for immigration attorneys"
- **Authority:** USCIS deadline tracking guides, multilingual client communication

#### Layer 3 — Lead Capture
- **Form fields:** firmName, firstName, lastName, email, phone, caseVolume
- **Webhook:** Hook ID 55134 → scenario 143970

#### Layer 4 — Lead Identity Graph
- **SuiteDash:** Company (firm) + contact, case volume tracked
- **Niche data:** `{ caseVolume, visaTypes, languages }`

#### Layer 7 — Journey Engine (Volume-Based)
| Monthly Case Volume | Journey Focus |
|---|---|
| 1-10 | "Solo practitioner essentials — deadline tracking + client updates" |
| 11-50 | "Growing firm — case pipeline management + multilingual portals" |
| 51-200 | "Mid-size firm — attorney assignment + automated status updates" |
| 200+ | "Enterprise immigration — multi-office, bulk processing, API integrations" |

#### Hot Lead Radar Triggers
- Case volume > 50/month → mid-size firm = high-value client
- Mentions EB-5 → investor immigration = premium service
- Multiple visa types → complex practice → comprehensive platform need

---

### Scenario 17 — NC Construction (143971)

**Brand:** NeatCircle
**Advisor:** David Mitchell, Industry Specialist
**Niche config ID:** `nc_construction`

#### Layer 3 — Lead Capture
- **Form fields:** companyName, firstName, lastName, email, phone, annualRevenue, safetyProgram
- **Webhook:** Hook ID 55135 → scenario 143971

#### Layer 4 — Lead Identity Graph
- **SuiteDash:** Company + contact, revenue range tags (under-1m, 1m-5m, 5m-25m, 25m-plus)
- **Niche data:** `{ annualRevenue, safetyProgram, projectTypes, employeeCount }`

#### Layer 7 — Journey Engine (Revenue-Tiered)
| Annual Revenue | Journey Focus |
|---|---|
| Under $1M | "Small contractor — job tracking + safety documentation" |
| $1M-$5M | "Growing GC — subcontractor management + project scheduling" |
| $5M-$25M | "Mid-market — multi-project dashboard + OSHA compliance" |
| $25M+ | "Enterprise construction — multi-site, labor compliance, fleet management" |

#### Hot Lead Radar Triggers
- Revenue > $5M → significant construction company
- Safety program = true → compliance-conscious = ready to buy
- Multiple project types → complex operations → higher value

---

### Scenario 18 — NC Franchise (143972)

**Brand:** NeatCircle
**Advisor:** Elena Vasquez, Franchise Systems Advisor
**Niche config ID:** `nc_franchise`

#### Layer 3 — Lead Capture
- **Form fields:** brandName, firstName, lastName, email, phone, locationCount
- **Webhook:** Hook ID 55136 → scenario 143972

#### Layer 4 — Lead Identity Graph
- **SuiteDash:** Company (brand) + contact, location range tags (1-5, 6-25, 26-100, 100-plus)
- **Niche data:** `{ locationCount, expansionPlans, trainingNeeds }`

#### Layer 7 — Journey Engine (Scale-Based)
| Location Count | Journey Focus |
|---|---|
| 1-5 | "Emerging franchise — brand consistency + basic franchisee reporting" |
| 6-25 | "Growing brand — multi-location ops + franchisee training platform" |
| 26-100 | "Regional franchise — district management + performance benchmarking" |
| 100+ | "National brand — enterprise franchisee portal + automated compliance" |

#### Hot Lead Radar Triggers
- 26+ locations → enterprise franchise management deal
- Expansion plans mentioned → growth signal
- Training needs → upsell to LMS

---

### Scenario 19 — NC Staffing (143973)

**Brand:** NeatCircle
**Advisor:** Rachel Kim, Workforce Solutions Advisor
**Niche config ID:** `nc_staffing`

#### Layer 3 — Lead Capture
- **Form fields:** agencyName, firstName, lastName, email, phone, placementsPerMonth
- **Webhook:** Hook ID 55137 → scenario 143973

#### Layer 4 — Lead Identity Graph
- **SuiteDash:** Company (agency) + contact, placement volume tags (1-10, 11-50, 51-200, 200-plus)
- **Niche data:** `{ placementsPerMonth, specialties, clientCount }`

#### Layer 7 — Journey Engine (Volume-Based)
| Placements/Month | Journey Focus |
|---|---|
| 1-10 | "Boutique agency — candidate pipeline + client portal" |
| 11-50 | "Growing agency — automated matching + compliance tracking" |
| 51-200 | "Mid-market — multi-recruiter dashboard + client reporting" |
| 200+ | "Enterprise staffing — VMS integration + bulk processing + analytics" |

#### Hot Lead Radar Triggers
- 51+ placements/month → high-volume agency = premium client
- Multiple specialties → complex needs → higher value

---

### Scenario 20 — NC Church Management (143974)

**Brand:** NeatCircle
**Advisor:** Michael Thompson, Community Engagement Advisor
**Niche config ID:** `nc_church_management`

#### Layer 3 — Lead Capture
- **Form fields:** organizationName, firstName, lastName, email, phone, memberCount
- **Webhook:** Hook ID 55138 → scenario 143974

#### Layer 4 — Lead Identity Graph
- **SuiteDash:** Company (organization) + contact, member range tags (1-100, 101-500, 501-2000, 2000-plus)
- **Niche data:** `{ memberCount, ministries, needs }`

#### Layer 7 — Journey Engine (Congregation-Size Based)
| Member Count | Journey Focus |
|---|---|
| 1-100 | "Small church — member directory + event management" |
| 101-500 | "Growing church — small groups + volunteer scheduling + giving" |
| 501-2000 | "Large church — multi-campus + ministry portals + donor CRM" |
| 2000+ | "Mega church — enterprise member management + app + streaming" |

#### Layer 8 — Persona Messaging (Unique Tone)
- **Advisor:** Michael Thompson
- **Tone:** Warm, mission-driven, inclusive — distinctly different from corporate scenarios
- **Style:** References community impact, ministry goals, stewardship language

#### Hot Lead Radar Triggers
- 500+ members → large organization = significant deal
- Donation management need → recurring revenue opportunity
- Multiple ministry types → complex needs

---

### Scenario 21 — NC Creator Management (143975)

**Brand:** NeatCircle
**Advisor:** Zara Williams, Creator Economy Specialist
**Niche config ID:** `nc_creator_management`

#### Layer 3 — Lead Capture
- **Form fields:** agencyName, firstName, lastName, email, phone, talentCount
- **Webhook:** Hook ID 55139 → scenario 143975

#### Layer 4 — Lead Identity Graph
- **SuiteDash:** Company (agency) + contact, talent metadata
- **Niche data:** `{ talentCount, platforms, services }`

#### Layer 7 — Journey Engine (Scale-Based)
| Talent Count | Journey Focus |
|---|---|
| 1-5 | "Boutique management — contract templates + rate cards" |
| 6-20 | "Growing roster — content calendar + brand deal tracking" |
| 21-50 | "Mid-size agency — portfolio analytics + revenue dashboard" |
| 50+ | "Enterprise talent management — multi-vertical, brand marketplace" |

#### Layer 8 — Persona Messaging (Unique Tone)
- **Advisor:** Zara Williams
- **Tone:** Trend-aware, creator-native, speaks the language of the creator economy
- **Style:** References platform algorithms, brand deal rates, creator economy trends

#### Hot Lead Radar Triggers
- 20+ talent → significant agency = premium client
- Multiple platforms → cross-platform management complexity
- Brand deal services → revenue-focused = high-value

---

### Scenario 22 — NC Compliance Productized (143976)

**Brand:** NeatCircle
**Advisor:** Dr. Maya Patel, Compliance Director
**Niche config ID:** `nc_compliance_productized`

#### Layer 1 — Traffic & Authority
- **SEO:** "White-label compliance training platform", "Resell compliance courses"
- **Authority:** Compliance market sizing, pricing strategy guides for training resellers

#### Layer 3 — Lead Capture
- **Form fields:** resellerName, firstName, lastName, email, phone, targetMarket (hr-consulting/peo/payroll/insurance), pricingModel (per-employee/flat-rate/tiered)
- **Webhook:** Hook ID 55140 → scenario 143976

#### Layer 4 — Lead Identity Graph
- **SuiteDash:** Company (reseller) + contact, target market and pricing model tags
- **Niche data:** `{ targetMarket, pricingModel, clientCount }`

#### Layer 7 — Journey Engine (Market-Specific)
| Target Market | Journey Focus |
|---|---|
| HR Consulting | "White-label compliance for HR consultants — expand your service offering" |
| PEO | "PEO compliance platform — mandatory training at scale" |
| Payroll | "Add compliance training to your payroll services bundle" |
| Insurance | "Risk reduction training — lower premiums for your clients" |

#### Layer 9 — Conversion Engine (B2B2B — Unique)
- **This is a reseller/partner scenario** — not end-customer
- Conversion means: reseller signs up to white-label the platform
- Revenue model: recurring per-employee or flat-rate licensing
- Upsell: more compliance verticals, custom content, premium support

#### Hot Lead Radar Triggers
- PEO target market → large employee bases = high volume
- Tiered pricing model → sophisticated buyer
- Existing client count > 50 → established reseller = quick revenue

---

## Part 4 — Implementation Roadmap

### What's Built (V10) — Layer 3, 4, 6, 8 (partial), 12 (partial)

All 22 scenarios have working lead capture, SuiteDash record creation, AI-powered intelligence + messaging, multi-channel delivery (email + WhatsApp + Discord + Telegram), and basic tracking (AITable + DataStore).

### Phase 1 — Scoring Engine (Layers 5 + Hot Lead Radar)
- Build scoring calculation in Activepieces/Make.com
- Store scores in Boost.space canonical record
- Hot Lead Radar: trigger when priority_score >= 80
- Timeline: Extends each scenario with event-driven score updates

### Phase 2 — Journey Engine (Layer 7)
- Build multi-step nurture sequences per scenario
- Welcome → Education → Qualification → Conversion paths
- Timing engine (Day 1, Day 3, Day 7 follow-ups)
- Journey branching based on scores and events

### Phase 3 — Visitor Intelligence (Layer 2)
- Integrate Plerdy (heatmaps + funnel analytics)
- Integrate Happierleads (company identification)
- Integrate Salespanel (behavioral tracking)
- Pre-capture scoring from anonymous visitor data

### Phase 4 — Conversion Engine (Layer 9)
- SuiteDash consultation booking automation
- Proposal generation triggers
- Deal stage advancement automation

### Phase 5 — Client Lifecycle (Layer 10)
- Onboarding project templates in SuiteDash
- Retention workflows (monthly check-in, quarterly review)
- Upsell triggers per plan tier
- Referral engine (UpViral integration)

### Phase 6 — Niche Intelligence (Layer 11)
- Aggregate AITable data into performance dashboards
- Calculate per-niche conversion rates, best channels, best CTAs
- Feed insights back into journey configs and scoring weights
- Experimentation engine: A/B test email subjects, CTAs, timing

### Phase 7 — Control Tower (Layer 12)
- Unified dashboard: all 22 scenarios in one view
- Real-time lead volume, conversion rates, niche performance
- Anomaly detection: alert when capture rate drops or errors spike
- Revenue intelligence: LTV, CAC, revenue per niche

### Phase 8 — Authority & Traffic (Layer 1)
- NeuronWriter + Katteb content generation per niche
- Brilliant Directories category pages
- UpViral referral campaigns
- SEO monitoring and content optimization

### Phase 9 — Provider Acquisition (Directory Scaling)
- Google Maps Scraper → provider discovery
- Clodura/LeadRocks → provider outreach
- SalesNexus → provider nurture sequences
- Brilliant Directories → provider onboarding

### Phase 10 — Autonomous Optimization
- System recommends niche config changes based on intelligence
- Auto-adjust scoring weights per niche
- Auto-select best-performing email templates
- Portfolio management: launch → validate → optimize → scale → maintain → pause

---

## Appendix A — Niche Configuration Templates

### Template: YD Portal Setup
```json
{
  "niche_id": "yd_portal_setup",
  "brand": "Your Deputy",
  "scenario_id": 143953,
  "hook_id": 55119,
  "advisor": "onboarding",

  "pain_points": [
    "no client-facing portal",
    "manual file sharing",
    "disconnected communication",
    "unprofessional client experience"
  ],

  "preferred_channels": ["email", "whatsapp"],
  "primary_cta": "portal_demo",

  "lead_magnets": [
    "client_portal_feature_checklist",
    "industry_portal_examples"
  ],

  "scoring_weights": {
    "form_submitted": 30,
    "pricing_page_view": 20,
    "portal_demo_page_view": 25,
    "email_clicked": 10,
    "phone_call": 40
  },

  "journey_config": {
    "welcome_delay_hours": 0,
    "education_delay_hours": 72,
    "qualification_delay_hours": 120,
    "conversion_delay_hours": 168
  },

  "fit_criteria": {
    "industries": ["healthcare", "finance", "legal", "consulting"],
    "company_size_min": 5,
    "has_domain": true
  }
}
```

### Template: NC Immigration Law
```json
{
  "niche_id": "nc_immigration_law",
  "brand": "NeatCircle",
  "scenario_id": 143970,
  "hook_id": 55134,
  "advisor": "legal",

  "pain_points": [
    "USCIS deadline tracking",
    "multilingual client communication",
    "case status updates",
    "document collection bottleneck",
    "attorney admin burden"
  ],

  "preferred_channels": ["email", "whatsapp"],
  "primary_cta": "case_management_demo",

  "lead_magnets": [
    "immigration_case_workflow_template",
    "uscis_deadline_tracker",
    "multilingual_portal_guide"
  ],

  "scoring_weights": {
    "form_submitted": 30,
    "case_management_page_view": 25,
    "pricing_page_view": 20,
    "email_replied": 25,
    "phone_call": 40,
    "eb5_visa_type": 15
  },

  "journey_config": {
    "welcome_delay_hours": 0,
    "education_delay_hours": 48,
    "qualification_delay_hours": 96,
    "conversion_delay_hours": 144
  },

  "fit_criteria": {
    "case_volume_min": 10,
    "visa_types_include": ["h1b", "eb5", "family"],
    "multilingual": true
  }
}
```

### Template: NC Franchise
```json
{
  "niche_id": "nc_franchise",
  "brand": "NeatCircle",
  "scenario_id": 143972,
  "hook_id": 55136,
  "advisor": "franchise",

  "pain_points": [
    "brand consistency across locations",
    "franchisee communication",
    "multi-location reporting",
    "training standardization",
    "FDD compliance"
  ],

  "preferred_channels": ["email", "whatsapp"],
  "primary_cta": "franchise_platform_demo",

  "lead_magnets": [
    "multi_location_management_guide",
    "franchise_brand_consistency_checklist",
    "franchisee_onboarding_template"
  ],

  "scoring_weights": {
    "form_submitted": 30,
    "pricing_page_view": 20,
    "email_clicked": 10,
    "phone_call": 40,
    "location_count_26_plus": 25
  },

  "journey_config": {
    "welcome_delay_hours": 0,
    "education_delay_hours": 48,
    "qualification_delay_hours": 120,
    "conversion_delay_hours": 168
  },

  "fit_criteria": {
    "location_count_min": 5,
    "has_expansion_plans": true
  }
}
```

---

## Appendix B — Quick Reference Table

| # | Scenario | Brand | Advisor | Niche Config | Key Differentiator | Hot Lead Signal |
|---|---|---|---|---|---|---|
| 1 | yd-portal-setup | Your Deputy | Sarah Chen | `yd_portal_setup` | Industry-specific portal features | Healthcare/finance + domain exists |
| 2 | yd-crm-pipeline | Your Deputy | James Park | `yd_crm_pipeline` | Deal stage + value branching | Deal > $10K + negotiation stage |
| 3 | yd-onboarding | Your Deputy | Sarah Chen | `yd_onboarding` | Plan-tiered + dual contacts | Enterprise plan |
| 4 | yd-compliance-training | Your Deputy | Dr. Maya Patel | `yd_compliance_training` | Bulk employee processing | 100+ employees + HIPAA |
| 5 | yd-business-intelligence | Your Deputy | Alex Thompson | `yd_business_intelligence` | Data source + KPI mapping | 3+ data sources + daily reporting |
| 6 | yd-managed-services | Your Deputy | Marcus Rivera | `yd_managed_services` | Plan + budget tiering | Budget > $5K/month |
| 7 | nc-client-portal | NeatCircle | Sarah Chen | `nc_client_portal` | Industry-specific modules | Healthcare/legal industry |
| 8 | nc-process-automation | NeatCircle | Marcus Rivera | `nc_process_automation` | Manual hours → ROI calc | 100+ manual hrs/week |
| 9 | nc-systems-integration | NeatCircle | Marcus Rivera | `nc_systems_integration` | Sync frequency driven | Real-time sync need |
| 10 | nc-training-platform | NeatCircle | Dr. Maya Patel | `nc_training_platform` | Training type branching | 500+ learners |
| 11 | nc-business-intelligence | NeatCircle | Alex Thompson | `nc_business_intelligence` | Reporting frequency driven | Daily reporting |
| 12 | nc-compliance-training | NeatCircle | Dr. Maya Patel | `nc_compliance_training` | Bulk employee + regulation-specific | 50+ employees + multiple courses |
| 13 | nc-managed-services | NeatCircle | Marcus Rivera | `nc_managed_services` | Plan-tiered journey | Enterprise plan |
| 14 | nc-digital-transformation | NeatCircle | Marcus Rivera | `nc_digital_transformation` | Timeline + budget driven | Budget > $50K or < 3mo timeline |
| 15 | nc-re-syndication | NeatCircle | Victoria Santos | `nc_re_syndication` | SEC compliance + raise size | Raise > $5M + equity deal |
| 16 | nc-immigration-law | NeatCircle | Victoria Santos | `nc_immigration_law` | Case volume + visa types | 50+ cases/month + EB-5 |
| 17 | nc-construction | NeatCircle | David Mitchell | `nc_construction` | Revenue-tiered + OSHA | Revenue > $5M + safety program |
| 18 | nc-franchise | NeatCircle | Elena Vasquez | `nc_franchise` | Location count scaling | 26+ locations |
| 19 | nc-staffing | NeatCircle | Rachel Kim | `nc_staffing` | Placement volume | 51+ placements/month |
| 20 | nc-church-management | NeatCircle | Michael Thompson | `nc_church_management` | Mission-driven tone + member size | 500+ members |
| 21 | nc-creator-management | NeatCircle | Zara Williams | `nc_creator_management` | Creator economy native | 20+ talent |
| 22 | nc-compliance-productized | NeatCircle | Dr. Maya Patel | `nc_compliance_productized` | B2B2B reseller model | PEO market + tiered pricing |
