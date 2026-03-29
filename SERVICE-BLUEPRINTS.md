# Lead OS: Service Blueprints

## How to Read These Blueprints

Each blueprint maps the **end-to-end journey** for a specific persona through Lead OS. The format follows the service blueprint methodology:

- **Customer Actions**: What the persona does at each stage
- **Frontstage (Visible)**: What the persona sees and interacts with (UI, emails, widgets)
- **Backstage (Invisible)**: What Lead OS does behind the scenes (engines, scoring, automation)
- **Support Processes**: Infrastructure, integrations, and data flows that make it work
- **Pain Points Addressed**: The specific problems this journey solves
- **Key Metrics**: How the persona measures success

---

## Blueprint 1: Digital Marketing Agency

**Persona**: Sarah, owner of a 12-person digital marketing agency serving local service businesses. She manages 15 clients across plumbing, HVAC, dental, and legal niches. She currently uses 8 different SaaS tools to deliver lead generation services and spends 20+ hours/week on manual reporting and configuration.

**Revenue Model**: Managed Service ($200-1,000/month per client)

### Stage 1: Discovery & Evaluation

```
CUSTOMER ACTIONS
  Sarah discovers Lead OS through a prospect outreach email or marketplace listing.
  She visits the landing page, reviews pricing, and explores the demo dashboard.

FRONTSTAGE (VISIBLE)
  / ...................................... Public landing page with value props
  /dashboard ............................. Demo mode dashboard (no auth needed)
  /assess/marketing-agency ............... Agency assessment form
  /calculator ............................ ROI calculator showing SaaS replacement savings

BACKSTAGE (INVISIBLE)
  intake.ts .............................. Captures Sarah's assessment responses as a lead
  scoring-engine.ts ...................... Scores her as high-intent (viewed pricing + calculator)
  personalization-engine.ts .............. Delivers agency-specific content based on niche
  context-engine.ts ...................... Tracks her page views, time on site, return visits
  trust-engine.ts ........................ Shows testimonials from other agencies
  psychology-engine.ts ................... Selects "social proof + authority" persuasion pattern

SUPPORT PROCESSES
  runtime-store.ts ....................... Persists her lead record with full event timeline
  email-sender.ts ........................ Triggers nurture sequence after assessment completion
  providers.ts ........................... Sends follow-up via email (Sinosend) + SMS (EasyText)
  attribution.ts ......................... Records first-touch attribution source

PAIN POINTS ADDRESSED
  - "I can't demo a platform without a week of setup" -> Demo mode works instantly
  - "ROI calculators never match my business model" -> Calculator shows agency economics
  - "I don't know if this works for my specific niches" -> Assessment tailors to her verticals
```

### Stage 2: Onboarding & First Client Setup

```
CUSTOMER ACTIONS
  Sarah signs up via the self-service wizard. She enters her agency details,
  selects "Managed Service" revenue model, picks the Growth plan ($500/mo),
  and configures her first client niche (plumbing).

FRONTSTAGE (VISIBLE)
  /onboard ............................... 6-step wizard UI
    Step 1: Niche ........................ Types "Plumbing" -> auto-generates config
    Step 2: Plan ......................... Selects Managed Growth ($500/mo)
    Step 3: Branding ..................... Enters client's brand name, colors, logo
    Step 4: Integrations ................. Toggles: Sinosend (email), EasyText (SMS)
    Step 5: Review ....................... Confirms all settings
    Step 6: Complete ..................... Receives embed code + dashboard link
  /auth/check-email ...................... Magic link confirmation page

BACKSTAGE (INVISIBLE)
  onboarding.ts .......................... State machine: niche -> plan -> branding -> integrations -> review -> complete
  niche-generator.ts ..................... Generates complete plumbing config:
                                           - 7 assessment questions ("What plumbing service do you need?")
                                           - Scoring weights (urgency: 0.35, fit: 0.25, intent: 0.25, engagement: 0.15)
                                           - 7-stage nurture sequence with plumbing-specific copy
                                           - Pain points, urgency signals, offers, keywords
  niche-templates.ts ..................... Selects "service" industry template (HVAC/plumbing/electrical)
  tenant-provisioner.ts .................. Executes 9-step provisioning:
    1. create-tenant ..................... Creates tenant record with unique ID
    2. generate-niche .................... Runs niche generator for plumbing
    3. register-niche .................... Adds plumbing to catalog.ts runtime registry
    4. configure-funnels ................. Selects lead-magnet + qualification funnel families
    5. setup-creative-jobs ............... Configures social content pipeline for plumbing
    6. provision-workflows ............... Creates n8n workflows (if configured)
    7. configure-crm .................... Sets up SuiteDash pipeline tags
    8. generate-embed .................... Produces <script> tag for client's website
    9. create-operator ................... Creates operator account for Sarah
    10. send-welcome ..................... Sends magic link to Sarah's email

SUPPORT PROCESSES
  tenant-store.ts ........................ Persists tenant record (memory + Postgres JSONB)
  plan-catalog.ts ........................ Managed Growth plan: 2,000 leads/mo, 25,000 emails/mo
  billing.ts ............................. Creates Stripe checkout session for $500/mo
  credentials-vault.ts ................... Stores client's API keys encrypted
  catalog.ts ............................. Registers "plumbing" niche at runtime

PAIN POINTS ADDRESSED
  - "Setting up a new client takes me 2 weeks" -> Provisioning completes in seconds
  - "I need to configure scoring, content, and funnels from scratch" -> Niche generator does it all
  - "Managing 8 different tools per client is expensive" -> One platform replaces all 8
  - "Each tool has a separate login and billing" -> Single dashboard, single bill
```

### Stage 3: Client Website Integration

```
CUSTOMER ACTIONS
  Sarah copies the embed script and pastes it into her client's WordPress site.
  The widget renders immediately on the client's website with their branding.

FRONTSTAGE (VISIBLE)
  Client's website ....................... <script src="https://app.leadosapp.com/api/embed/manifest?tenantId=TENANT_ID">
  Widget renders on client site:
    - Lead capture form .................. "Need a plumber? Get a free quote in 60 seconds"
    - Assessment quiz .................... "What plumbing service do you need?" (7 questions)
    - Chat widget ........................ AI chatbot for real-time qualification
    - Calculator ......................... "How much could you save on plumbing repairs?"

BACKSTAGE (INVISIBLE)
  /api/embed/manifest .................... Returns tenant-scoped widget configuration
  /api/widgets/boot ...................... Boots widget with tenant branding (colors, logo, copy)
  tenant-context.ts ...................... Resolves tenant from tenantId query param
  cors.ts ................................ Whitelists client's domain for cross-origin requests

SUPPORT PROCESSES
  embed-widgets adapter .................. 4 formats: script tag, iframe, React component, WordPress plugin
  tenant-isolation.ts .................... Ensures widget data stays isolated to this tenant

PAIN POINTS ADDRESSED
  - "My clients don't want to change their website" -> Single script tag, no code changes
  - "Widgets look generic, not branded" -> Full brand customization per tenant
  - "Different tools for forms, chat, calculators" -> All widget types from one embed
```

### Stage 4: Lead Capture & Scoring (Daily Operations)

```
CUSTOMER ACTIONS
  Sarah monitors her dashboard daily. She sees new leads coming in, reviews
  their scores, and prioritizes follow-up. She checks each client's
  performance metrics.

FRONTSTAGE (VISIBLE)
  /dashboard ............................. Overview: KPIs, lead count, conversion rate, revenue
  /dashboard/leads ....................... Lead list with temperature badges (cold/warm/hot/burning)
  /dashboard/leads/[id] .................. Individual lead deep-dive with full timeline
  /dashboard/analytics ................... Conversion funnels, channel attribution, trends
  /dashboard/scoring ..................... Score distribution calibration
  /dashboard/radar ....................... Real-time lead activity monitor
  /dashboard/pipeline .................... Sales pipeline visualization

BACKSTAGE (INVISIBLE)
  For each lead captured:
  intake.ts .............................. Normalizes, deduplicates, routes incoming lead
    -> scoring-engine.ts ................. Computes 4D score:
       Intent (0-100) ................... Pages viewed, calculator usage, chat engagement
       Fit (0-100) ...................... Service match, location, budget signals
       Engagement (0-100) ............... Email opens, content downloads, return visits
       Urgency (0-100) .................. "Emergency" keywords, timeline indicators
       Composite (0-100) ................ Weighted by plumbing-specific bias (urgency: 0.35)
    -> Temperature classification:
       Cold (0-34) ...................... Nurture with educational content
       Warm (35-59) ..................... Offer case studies and estimates
       Hot (60-79) ...................... Push booking and on-site quotes
       Burning (80-100) ................. Immediate human handoff
    -> personalization-engine.ts ......... Selects plumbing-specific content for their temperature
    -> orchestrator.ts ................... Decides next step based on funnel position
    -> providers.ts ...................... Executes actions:
       Email followup (Sinosend) ........ Temperature-aware subject line + body
       SMS notification (EasyText) ....... "Your free plumbing quote is ready"
       CRM sync (SuiteDash) ............. Creates/updates contact + deal
       Alert to Sarah ................... "New hot lead: John D. in Austin needs emergency pipe repair"
    -> billing-store.ts .................. Increments usage: leads +1, emails +1, SMS +1
    -> plan-enforcer.ts .................. Checks: 847/2,000 leads this month (within limit)

  Ongoing nurture:
  email-templates.ts ..................... Stage-appropriate templates per temperature
  escalation-engine.ts ................... Re-engages stale leads after 72 hours
  rescore-engine.ts ...................... Recalculates scores daily based on new signals

SUPPORT PROCESSES
  runtime-store.ts ....................... Persists all lead data with tenant isolation
  attribution.ts ......................... Tracks: "This lead came from Google organic > assessment form"
  product-analytics.ts ................... Tenant health scoring (is this client active?)
  realtime.ts ............................ SSE pushes live updates to dashboard
  notification-hub.ts .................... Routes alerts across channels

PAIN POINTS ADDRESSED
  - "I spend 3 hours/day manually qualifying leads" -> Auto-scoring handles it
  - "I can't tell which leads are worth calling" -> Temperature badges + priority sort
  - "Follow-up emails are manual and inconsistent" -> Automated nurture sequences
  - "I lose leads because I forget to follow up" -> Escalation engine catches stale leads
  - "I can't show my clients their ROI" -> Analytics dashboard with attribution
```

### Stage 5: Content & Social Media Management

```
CUSTOMER ACTIONS
  Sarah generates social media content for her clients using the Creative dashboard.
  She selects a topic, the AI produces content across all platforms, and she
  posts it to her clients' channels.

FRONTSTAGE (VISIBLE)
  /dashboard/creative .................... AI content generation dashboard
    Topic input .......................... "Emergency plumbing tips for homeowners"
    Platform selection ................... TikTok, IG Reels, Facebook, LinkedIn
    Generated output:
      - 10+ content angles .............. "Fear-based: What happens if you ignore that drip"
      - 7 hook types per angle .......... Question, shock, story, statistic hooks
      - Full scripts per platform ........ TikTok 60s script, LinkedIn article, etc.
      - Hashtag sets ..................... #PlumbingTips #HomeRepair #EmergencyPlumber

BACKSTAGE (INVISIBLE)
  social-asset-engine.ts ................. Orchestrates full content pipeline
  social-angle-generator.ts .............. 10+ angles using plumbing psychology profile
  social-hook-generator.ts ............... 7 hook types x platforms with engagement scoring
  social-script-generator.ts ............. PAS (Problem-Agitate-Solve) scripts per format
  social-platform-adapter.ts ............. Adapts to 12 platform character limits and formats
  social-content-memory.ts ............... Prevents duplicate content, tracks exhaustion
  social-performance-tracker.ts .......... Identifies winning patterns over time
  social-dm-engine.ts .................... 4-stage DM funnel for Instagram/LinkedIn engagement
  ai-copywriter.ts ....................... AI-powered copy for ads, emails, landing pages
  weaponized-creative.ts ................. High-conversion creative asset templates

SUPPORT PROCESSES
  ai-client.ts ........................... OpenAI/Anthropic API for content generation
  langchain-adapter.ts ................... 13 AI content generation functions

PAIN POINTS ADDRESSED
  - "Creating content for 15 clients across 4 platforms takes 30 hours/week" -> AI generates it all
  - "Content feels generic, not niche-specific" -> Psychology-driven angles per industry
  - "I keep repeating the same topics" -> Content memory tracks exhaustion
  - "I can't tell what content actually converts" -> Performance tracker identifies winners
```

### Stage 6: Optimization & Experiments

```
CUSTOMER ACTIONS
  Sarah sets up A/B tests to optimize her clients' conversion rates.
  She tests email subject lines, CTA copy, and lead magnet offers.
  The system auto-evaluates results and promotes winners.

FRONTSTAGE (VISIBLE)
  /dashboard/experiments ................. A/B test management with statistical analysis
    Create experiment:
      Name: "Plumbing email subject line test"
      Surface: email-subject
      Variants: ["Get Your Free Quote" vs "Your Pipes Are Costing You Money"]
      Minimum sample: 200
    Results table:
      Control: 12.3% open rate (250 sends)
      Variant A: 18.7% open rate (248 sends)
      Confidence: 97.2% -> AUTO-PROMOTED

BACKSTAGE (INVISIBLE)
  experiment-engine.ts ................... Creates experiment, assigns variants, tracks conversions
  experiment-evaluator.ts ................ Autoresearch loop:
    - z-test for proportions ............. Statistical significance testing
    - CONFIDENCE_THRESHOLD = 0.95 ....... 95% confidence to declare winner
    - EARLY_STOP_DEGRADATION = -0.15 .... Stops variant if 15%+ worse than control
    - Auto-promotion .................... Winner replaces control automatically
  /api/cron/experiments .................. Scheduled evaluation of all running experiments
  email-sender.ts ........................ Routes emails through winning variant

  Five optimization surfaces:
    1. email-subject ..................... 48-hour evaluation cycles
    2. cta-copy .......................... 72-hour evaluation cycles
    3. lead-magnet-offer ................. 1-week evaluation cycles
    4. scoring-weights ................... 2-week evaluation cycles
    5. funnel-step-order ................. 3-week evaluation cycles

PAIN POINTS ADDRESSED
  - "I don't know which email subject lines work best" -> Auto-testing with statistical rigor
  - "A/B testing requires expensive tools" -> Built-in, no extra cost
  - "I forget to check experiment results" -> Autoresearch loop handles it automatically
  - "Bad variants hurt my conversion rate" -> Early stopping prevents degradation
```

### Stage 7: Competitive Intelligence

```
CUSTOMER ACTIONS
  Sarah tracks her clients' competitors. She adds competitor URLs and the system
  analyzes their websites, extracts design patterns, and identifies opportunities.

FRONTSTAGE (VISIBLE)
  /dashboard/competitors ................. Competitor tracking dashboard
    Add: "https://rival-plumber.com"
    Analysis results:
      - Design tokens: primary #2563eb, 8 sections, 4 CTAs
      - Funnel signals: has chat (yes), has booking (yes), has pricing (no)
      - Copy analysis: 12 headlines, 6 CTAs, "24/7 emergency" messaging
      - Gap analysis: No video testimonials, no FAQ, no calculator
  /dashboard/creative .................... Marketing artifact ingestion

BACKSTAGE (INVISIBLE)
  competitor-store.ts .................... Tracks competitor profiles with analysis history
  design-ingestion.ts .................... Scrapes competitor site:
    - Layout: section count, hero pattern, footer structure
    - Copy: headlines, CTA labels, trust signals
    - Funnel: chat, booking, pricing, testimonials, video, FAQ presence
    - Design tokens: colors, typography, spacing
  design-ingestion-to-spec.ts ............ Converts raw data into actionable creative specs
  marketing-ingestion.ts ................. Processes marketing artifacts into competitive intel
  marketing-artifact-store.ts ............ Persists ingested marketing artifacts
  discovery-scout.ts ..................... Computes website quality score (0-100)

SUPPORT PROCESSES
  firecrawl adapter ...................... Web scraping for competitor analysis
  skyvern-adapter.ts ..................... Browser automation for deep scraping

PAIN POINTS ADDRESSED
  - "I don't know what my clients' competitors are doing" -> Automated competitor monitoring
  - "Competitor analysis is manual and time-consuming" -> One-click website analysis
  - "I can't extract actionable insights from competitor sites" -> Design-to-spec pipeline
```

### Stage 8: Prospect Discovery (Finding New Clients for the Agency)

```
CUSTOMER ACTIONS
  Sarah uses the prospect discovery engine to find new businesses that
  need her agency's services. She scouts niches and the system identifies
  businesses with poor digital presence that she can sell to.

FRONTSTAGE (VISIBLE)
  /dashboard/prospects ................... Prospect discovery and management
    Scout form:
      Niche: "HVAC"
      Geo: "Austin, TX"
      Max results: 50
    Results:
      - "Cool Air HVAC" | Rating: 4.7 | No website | Opportunity: 87 | Priority: HOT
      - "Austin Heating" | Rating: 4.2 | Poor website (quality: 23) | Opportunity: 72 | Priority: WARM
    Prospect cards with:
      - Priority badge (hot/warm/cool/cold)
      - Opportunity score meter
      - Confidence percentage
      - Suggested action + outreach template
      - One-click status updates (new -> contacted -> qualified -> converted -> lost)

BACKSTAGE (INVISIBLE)
  prospect-pipeline.ts ................... End-to-end pipeline:
    1. discovery-scout.ts ................ Finds businesses via web scraping (Firecrawl)
       -> scoreBusiness() ................ Scores digital presence gap (0-100)
       -> computeWebsiteQuality() ........ Website quality scoring (sections, CTAs, funnel elements)
       -> assessDigitalPresenceGap() ..... Gap analysis (high rating + no website = high opportunity)
    2. opportunity-classifier.ts ......... 4-way classification:
       -> managed-service ................ "This business needs full service" ($2K-10K/mo)
       -> white-label .................... "This business could resell our platform" ($99-499/mo)
       -> affiliate ...................... "This business could refer leads" (rev share)
       -> referral-partner ............... "This business complements our services" (mutual referral)
    3. prospect-store.ts ................. Creates prospect record with:
       -> estimatedMonthlyValue .......... Revenue projection per prospect
       -> suggestedAction ................ "Propose managed lead generation service"
       -> outreachTemplate ............... Pre-written email/call script
       -> qualitySignals ................. growthIndicators, weaknesses, strengths
    4. Auto-ingest to lead pipeline ...... Hot prospects auto-enter Lead OS as leads

  Cron-scheduled scouting:
  /api/cron/discovery .................... Multi-niche automated scouting on recurring schedule
  getComplementaryNiches() ............... Suggests related niches (plumbing -> HVAC, electrical)

SUPPORT PROCESSES
  firecrawl adapter ...................... Web scraping for business discovery
  skyvern-adapter.ts ..................... LinkedIn and directory scraping

PAIN POINTS ADDRESSED
  - "Finding new clients is random and expensive" -> Automated prospect discovery
  - "I don't know which businesses to approach" -> Opportunity scoring prioritizes best targets
  - "Cold outreach has no personalization" -> Pre-written templates based on analysis
  - "I waste time on businesses that aren't a good fit" -> 4-way classification filters opportunities
```

### Stage 9: Billing & Client Management

```
CUSTOMER ACTIONS
  Sarah manages her client subscriptions, monitors usage, and handles billing.
  She can see which clients are approaching plan limits and need upgrades.

FRONTSTAGE (VISIBLE)
  /dashboard/billing ..................... Subscription status, usage meters, invoice history
    Client usage meters:
      Leads: 1,247 / 2,000 this month
      Emails: 18,350 / 25,000 this month
      SMS: 892 / 2,000 this month
    Upgrade prompts when approaching limits
  /dashboard/tenants ..................... Multi-tenant management (super-admin view)
  /dashboard/settings .................... Tenant configuration

BACKSTAGE (INVISIBLE)
  billing.ts ............................. Stripe integration:
    createCheckoutSession() .............. Generates Stripe Checkout URL for new clients
    createBillingPortalSession() ......... Self-service upgrade/downgrade portal
    handleStripeWebhook() ................ Processes payment events:
      checkout.session.completed ......... Activates subscription
      subscription.updated ............... Plan changes
      subscription.deleted ............... Churn handling
      invoice.payment_failed ............. Dunning flow
  billing-store.ts ....................... Tracks subscription state + usage counters
  plan-enforcer.ts ....................... Enforces plan limits:
    enforcePlanLimits() .................. Returns 402 if over limit
    isFeatureEnabled() ................... Feature gating by tier
  plan-catalog.ts ........................ 8 plans across 4 revenue models

SUPPORT PROCESSES
  Stripe ............................... Payment processing, invoicing, tax calculation
  tenant-store.ts ........................ Tenant lifecycle management
  tenant-isolation.ts .................... Per-plan quotas and RLS policies

PAIN POINTS ADDRESSED
  - "Managing billing for 15 clients across different tools is chaos" -> Unified billing
  - "I can't track usage against plan limits" -> Real-time usage meters
  - "Clients complain about surprise overages" -> Proactive limit warnings
  - "Upgrading a client requires manual work" -> Self-service portal via Stripe
```

### Stage 10: Scaling to 50+ Clients

```
CUSTOMER ACTIONS
  Sarah adds her 16th client. She types a new niche, the system generates everything,
  and the client is live in minutes. She repeats this 34 more times.

FRONTSTAGE (VISIBLE)
  /onboard or /api/provision ............. Same process for client #50 as client #1
  /dashboard/tenants ..................... Overview of all 50 tenant instances
  /dashboard/analytics ................... Cross-client analytics and comparison

BACKSTAGE (INVISIBLE)
  niche-generator.ts ..................... Generates config for ANY niche:
    "Immigration Law" .................... Legal template + immigration-specific content
    "Dental" ............................. Health template + dental-specific content
    "Solar Installation" ................. Construction template + solar-specific content
    Each generates: assessment questions, scoring weights, nurture sequences, offers
  tenant-provisioner.ts .................. Same 9-step sequence, every time, zero variance
  data-moat.ts ........................... Cross-niche data accumulation:
    After 6 months ...................... Scoring accuracy exceeds any single-niche tool
    Pattern recognition .................. "Emergency language" urgency signals work across niches
  adaptive-loop.ts ....................... Self-optimizing feedback loops across all tenants

SUPPORT PROCESSES
  Multi-tenant infrastructure:
    runtime-store.ts ..................... Tenant-scoped data isolation
    tenant-isolation.ts .................. RLS policies prevent cross-tenant data leakage
    rate-limiter.ts ...................... Per-tenant rate limiting

PAIN POINTS ADDRESSED
  - "Adding a new niche takes weeks of research and configuration" -> 5 minutes, automated
  - "My 50th client costs as much to operate as my 1st" -> Zero marginal cost per niche
  - "I can't maintain quality at scale" -> Same automated quality for every client
  - "Data from one client doesn't help my others" -> Cross-niche learning improves all
```

---

## Blueprint 2: SaaS Entrepreneur

**Persona**: Marcus, a solo technical founder building "DentalLeads Pro" -- a vertical SaaS for dental practices. He wants to launch a white-label lead generation platform that dental practices self-serve on. He has strong technical skills but no sales team.

**Revenue Model**: White-Label SaaS ($99-499/month per seat)

### Stage 1: Product Launch

```
CUSTOMER ACTIONS
  Marcus deploys Lead OS to his own infrastructure (Vercel/Railway).
  He configures it as a white-label dental lead generation platform.
  He removes all Lead OS branding and adds his own.

FRONTSTAGE (VISIBLE)
  His deployment:
    dentalleadspro.com/ .................. His branded landing page
    dentalleadspro.com/onboard ........... Self-service signup for dental practices
    dentalleadspro.com/dashboard ......... Branded operator dashboard
    dentalleadspro.com/marketplace ....... Lead marketplace (if enabled)

BACKSTAGE (INVISIBLE)
  Deployment:
    auto-deploy.ts ....................... GitHub -> Vercel/Cloudflare Pages pipeline
    railway.json ......................... Pre-configured Railway deployment
    tenant.ts ............................ Static tenant config for "DentalLeads Pro" branding
  Niche setup:
    niche-generator.ts ................... Generates dental-specific config:
      Assessment ......................... "What dental services do you offer?"
      Scoring ............................ Fit weight high (dental practices have specific needs)
      Nurture ............................ "5 Ways to Get More Dental Patients This Month"
      Offers ............................. "Free Patient Acquisition Audit"

SUPPORT PROCESSES
  Environment variables .................. DATABASE_URL, STRIPE_SECRET_KEY, AI_API_KEY
  plan-catalog.ts ........................ White-label plans: $99, $249, $499/mo

PAIN POINTS ADDRESSED
  - "Building a SaaS from scratch takes 12-18 months" -> Deploy in an afternoon
  - "I need to hire a team for scoring, nurturing, CRM" -> All built-in
  - "White-labeling is usually an afterthought" -> No Lead OS branding anywhere
```

### Stage 2: Customer Self-Service Onboarding

```
CUSTOMER ACTIONS
  Dr. Chen, a dentist in Portland, discovers DentalLeads Pro.
  She signs up through the self-service wizard, configures her practice,
  and starts capturing leads immediately.

FRONTSTAGE (VISIBLE)
  dentalleadspro.com/onboard ............. Marcus's branded 6-step wizard
    Step 1: Practice type ................ "General Dentistry" (pre-filled, dental-only)
    Step 2: Plan ......................... Starter $99/mo | Growth $249/mo | Pro $499/mo
    Step 3: Practice info ................ "Chen Family Dental", colors, logo
    Step 4: Integrations ................. Email (toggle on), SMS (toggle on)
    Step 5: Review ....................... Confirm settings
    Step 6: Complete ..................... Embed code + dashboard link + magic link

  Stripe Checkout ........................ $99/mo payment for Starter plan
  dentalleadspro.com/auth/check-email .... Magic link to access dashboard

BACKSTAGE (INVISIBLE)
  onboarding.ts .......................... Same state machine, Marcus's branding
  tenant-provisioner.ts .................. Creates Dr. Chen as a sub-tenant under Marcus's instance
  niche-generator.ts ..................... Generates "general-dentistry" variant:
    Questions: "Are you accepting new patients?", "What insurance do you accept?"
    Scoring: fit (0.30), intent (0.25), engagement (0.25), urgency (0.20)
    Nurture: dental-specific email sequence
  billing.ts ............................. Creates Stripe checkout for $99/mo
    Revenue goes to Marcus's Stripe account
    Marcus keeps 100% (his customers, his pricing)

SUPPORT PROCESSES
  tenant-store.ts ........................ Dr. Chen's tenant record isolated from other dentists
  plan-enforcer.ts ....................... Starter limits: 100 leads/mo, 1 operator, 2 funnels
  credentials-vault.ts ................... Dr. Chen's email/SMS API keys (if she has her own)

PAIN POINTS ADDRESSED
  - "SaaS onboarding is always broken" -> Battle-tested 6-step wizard
  - "I need engineers to provision each customer" -> Fully automated provisioning
  - "Billing integration takes months to build" -> Stripe pre-integrated
```

### Stage 3: End-User Lead Capture (Dr. Chen's Daily Experience)

```
CUSTOMER ACTIONS
  Dr. Chen adds the embed script to her dental practice website.
  Patients fill out forms, book appointments, and engage with the chat widget.
  Dr. Chen checks her DentalLeads Pro dashboard each morning.

FRONTSTAGE (VISIBLE)
  chenfamilydental.com ................... Dr. Chen's website with embedded widget:
    "Schedule Your Free Dental Consultation" (lead capture form)
    "Dental Health Assessment" (5-question quiz)
    "How Much Could You Save?" (dental savings calculator)
    Chat widget .......................... AI chatbot: "Hi! Looking for a dentist? I can help"

  dentalleadspro.com/dashboard ........... Dr. Chen's dashboard:
    Today: 3 new leads, 1 hot (needs emergency crown replacement)
    This week: 12 leads, 34% warm+, 2 bookings
    Lead list with temperature badges
    "Mrs. Rodriguez - Score: 82/100 - BURNING - Needs implant consultation"

BACKSTAGE (INVISIBLE)
  For each patient inquiry:
  /api/intake ............................ Captures patient data
  scoring-engine.ts ...................... Dental-specific scoring:
    Intent: "Viewed implant pricing page 3x" = high
    Fit: "Has dental insurance, within 10 miles" = high
    Urgency: "Tooth pain, needs ASAP" = critical
    Composite: 82 -> BURNING
  personalization-engine.ts .............. Delivers dental-specific content:
    Cold: "5 Signs You Need a Dental Checkup"
    Warm: "What to Expect at Chen Family Dental"
    Hot: "Book Your Free Consultation (Limited Spots)"
    Burning: ALERT -> Dr. Chen gets SMS: "Hot lead needs emergency care"
  orchestrator.ts ........................ Routes burning lead to immediate callback
  providers.ts ........................... Sends confirmation email + SMS to patient

  For Marcus (platform operator):
  product-analytics.ts ................... Tracks Dr. Chen's health score
    Feature usage, lead volume, login frequency
    Churn risk: LOW (active daily, good lead volume)
  billing-store.ts ....................... Usage tracking: 47/100 leads this month

PAIN POINTS ADDRESSED
  - "I get website visitors but they don't convert" -> Multi-format capture widgets
  - "I don't know which patient inquiries to prioritize" -> AI scoring + temperature
  - "Follow-up with new patient inquiries is slow" -> Automated nurture sequences
  - "I can't tell if my marketing is working" -> Attribution + analytics dashboard
```

### Stage 4: Platform Growth & Optimization

```
CUSTOMER ACTIONS
  Marcus monitors his SaaS metrics. He has 47 dental practices paying $99-499/mo.
  He uses experiments to optimize conversion across all customers.
  He uses prospect discovery to find dental practices that need his platform.

FRONTSTAGE (VISIBLE)
  His super-admin dashboard:
    /dashboard/tenants ................... 47 active tenants, 3 churned, 2 trialing
    /dashboard/billing ................... MRR: $12,350, churn: 2.1%
    /dashboard/experiments ............... Platform-wide A/B tests
    /dashboard/prospects ................. Dental practice discovery
    /dashboard/analytics ................. Cross-tenant performance benchmarks

BACKSTAGE (INVISIBLE)
  Experiments across all tenants:
  experiment-engine.ts ................... Tests that benefit ALL dental practices:
    "Book Now" vs "Schedule Free Consultation" (CTA test)
    -> Winner auto-promoted across all 47 tenants
  experiment-evaluator.ts ................ Autoresearch with 47x sample size acceleration

  Prospect discovery for Marcus's own growth:
  prospect-pipeline.ts ................... Finds dental practices with poor websites
    "Portland Dental Clinic" - 4.8 stars, no online booking -> Opportunity: 91
    Auto-generates outreach: "I noticed Portland Dental Clinic has great reviews
    but no online booking system. DentalLeads Pro can help..."

  Platform intelligence:
  data-moat.ts ........................... Accumulated dental lead data creates competitive advantage
  adaptive-loop.ts ....................... Cross-tenant optimization:
    "Emergency dental" leads convert 3x with SMS vs email-only
    -> Auto-adjusts nurture for all tenants

  Revenue tracking:
  revenue-engine.ts ...................... Revenue analytics and forecasting
  monetization-engine.ts ................. Affiliate/referral tracking

PAIN POINTS ADDRESSED
  - "I can't A/B test across my entire customer base" -> Platform-wide experiments
  - "Finding new customers is expensive" -> Automated prospect discovery
  - "Each customer's data is siloed" -> Cross-tenant optimization improves everyone
  - "I don't have SaaS metrics" -> Built-in MRR, churn, health scoring
```

---

## Blueprint 3: Lead Generation Company

**Persona**: Alex runs a 4-person lead gen company that captures leads across multiple niches (legal, real estate, insurance) and sells them to businesses. He needs volume, quality scoring, and a marketplace where buyers can purchase leads.

**Revenue Model**: Lead Marketplace (per-lead pricing)

### Stage 1: Multi-Niche Lead Capture Network

```
CUSTOMER ACTIONS
  Alex sets up Lead OS as a lead capture network across 5 niches.
  He creates landing pages, assessments, and calculators for each niche.
  He captures leads through SEO, paid ads, and content marketing.

FRONTSTAGE (VISIBLE)
  Multiple capture properties:
    personalinjuryleads.com .............. PI lead capture with injury assessment
    homesearchleads.com .................. Real estate buyer lead capture
    insurancequoteleads.com .............. Insurance comparison calculator
    dentalpatientleads.com ............... Dental patient acquisition
    contractorleads.com .................. Home service contractor matching

  Each site has:
    Assessment form ...................... Niche-specific qualification quiz
    Calculator ........................... ROI/savings/cost calculator
    Chat widget .......................... AI chatbot for real-time qualification
    Content ............................. SEO-optimized authority content

BACKSTAGE (INVISIBLE)
  For each niche:
  niche-generator.ts ..................... Generates complete config per vertical
  tenant-provisioner.ts .................. One tenant per niche property

  Lead capture pipeline:
  intake.ts .............................. Normalizes leads from all sources
  scoring-engine.ts ...................... Niche-specific scoring per vertical:
    Legal: urgency weighted (accident just happened = burning)
    Real estate: fit weighted (pre-approved, budget >$500K = hot)
    Insurance: intent weighted (comparing 3+ quotes = hot)

  Quality enrichment:
  ai-predictive.ts ....................... Predictive lead scoring
  ai-scoring.ts .......................... ML-enhanced score computation
  persona-engine.ts ...................... Buyer persona matching

SUPPORT PROCESSES
  authority-site adapter ................. SEO-optimized content generation
  grapesjs adapter ....................... Landing page builder (5 templates)
  brizy adapter .......................... Advanced page builder integration
  firecrawl adapter ...................... Web scraping for data enrichment

PAIN POINTS ADDRESSED
  - "Each niche requires different landing pages and qualification" -> Niche generator handles it
  - "Lead quality varies wildly" -> 4D scoring ensures consistent quality measurement
  - "I need different scoring for legal vs real estate" -> Niche-specific scoring weights
```

### Stage 2: Lead Marketplace Operations

```
CUSTOMER ACTIONS
  Alex publishes qualified leads to the marketplace. Lead buyers (attorneys,
  agents, contractors) browse, filter, and purchase leads. Buyers report
  outcomes, and the marketplace adjusts pricing automatically.

FRONTSTAGE (VISIBLE)
  /marketplace ........................... Public buyer-facing marketplace
    Filters: niche, temperature, price range, location
    Lead cards (anonymized):
      "high-quality personal-injury lead (J***) interested in auto accident
       representation — score 87/100"
      Price: $250 | Temperature: HOT | Niche: Personal Injury
      [Claim Lead] button

  /dashboard/marketplace ................. Alex's marketplace management
    Published: 342 leads this month
    Claimed: 287 (84% claim rate)
    Revenue: $47,250
    Outcome tracking:
      Contacted: 91% | Booked: 47% | Converted: 23% | No response: 9%

  Buyer portal:
    Lead purchase history
    Outcome reporting
    Budget management
    Niche subscriptions

BACKSTAGE (INVISIBLE)
  marketplace.ts ......................... Marketplace engine:
    publishLeadToMarketplace() ........... Creates anonymized listing with dynamic price
    calculateLeadPrice() ................. Pricing formula:
      Base price by temperature: Cold=$25, Warm=$50, Hot=$100, Burning=$200
      Niche multiplier: legal=2.5x, construction=2.0x, staffing=1.5x
      Quality multiplier: (score/100) * 1.5 + 0.5
      Example: Hot legal lead, score 87 = $100 * 2.5 * 1.805 = $451
    anonymizeLeadSummary() ............... Hides PII, shows quality + niche + service
    claimLead() .......................... Marks claimed, creates Stripe charge to buyer
    reportOutcome() ...................... Tracks: contacted/booked/converted/no-response
    getRevenueByNiche() .................. Revenue analytics per vertical

  Auto-publish logic:
  intake.ts .............................. After lead capture:
    if tenant.revenueModel === "directory" && score >= threshold:
      -> publishLeadToMarketplace(leadKey, tenantId)

SUPPORT PROCESSES
  marketplace-store.ts ................... Persistence: lead_os_marketplace_leads, lead_os_marketplace_buyers
  billing.ts ............................. Stripe charges for lead purchases
  gdpr.ts ................................ Data handling compliance for lead data

PAIN POINTS ADDRESSED
  - "Selling leads manually is slow" -> Auto-publish qualified leads to marketplace
  - "Pricing leads is guesswork" -> Dynamic pricing based on temperature + quality + niche
  - "I don't know if buyers actually convert leads" -> Outcome tracking closes the loop
  - "Lead quality complaints" -> Transparent scoring visible to buyers
```

### Stage 3: Lead Acquisition at Scale

```
CUSTOMER ACTIONS
  Alex uses prospect discovery to find businesses that buy leads.
  He uses content generation to create SEO content that captures organic leads.
  He runs experiments to optimize conversion across all niche properties.

FRONTSTAGE (VISIBLE)
  /dashboard/prospects ................... Find lead BUYERS (attorneys, agents, contractors)
    Scout "personal-injury lawyers in Houston"
    -> 45 firms found, 12 without adequate online lead gen
    -> Auto-generate outreach: "Buy pre-qualified PI leads in Houston"

  /dashboard/creative .................... Content pipeline for SEO lead capture
    Topic: "What to do after a car accident in Texas"
    -> 10 angles, 7 hooks, full article outline
    -> Optimized for organic search traffic -> captures leads

  /dashboard/experiments ................. Cross-niche optimization
    Test: Assessment length (5 questions vs 7 questions)
    Result: 5 questions converts 23% better, but 7 questions produces 40% better lead quality
    Decision: 7 questions for marketplace leads (quality = higher price)

BACKSTAGE (INVISIBLE)
  prospect-pipeline.ts ................... Finds lead buyers:
    discovery-scout.ts ................... Scouts law firms, real estate offices, dental practices
    opportunity-classifier.ts ............ Classifies as potential lead buyers
  social-asset-engine.ts ................. SEO content generation at scale
  experiment-evaluator.ts ................ Tests across all 5 niche properties simultaneously
  data-moat.ts ........................... Accumulated lead data creates pricing intelligence:
    "PI leads in Houston close at 28% vs 18% nationally -> charge 1.5x premium"

PAIN POINTS ADDRESSED
  - "Finding lead buyers is as hard as finding leads" -> Prospect discovery for buyers
  - "SEO content takes too long to produce" -> AI content pipeline at scale
  - "I don't know what converts best" -> Cross-niche experimentation
  - "I'm leaving money on the table with flat pricing" -> Dynamic pricing with data moat
```

---

## Blueprint 4: Consultant & Implementer

**Persona**: David is an independent consultant who deploys lead generation systems for mid-market B2B companies. He charges $15K for setup and $3K/month for ongoing management. He works with 5-8 clients at a time and positions himself as a strategic advisor, not just a technician.

**Revenue Model**: Implementation + Retainer ($5K-25K setup + $1K-5K/month)

### Stage 1: Client Discovery & Proposal

```
CUSTOMER ACTIONS
  David meets a potential client (a regional HVAC company doing $5M revenue
  with no digital lead generation). He runs a competitive analysis and
  prospect assessment to build a data-backed proposal.

FRONTSTAGE (VISIBLE)
  /dashboard/competitors ................. Analyzes the HVAC company's competitors
    Adds 5 competitor URLs
    Gets design analysis, funnel comparison, gap identification
    "3 of 5 competitors have online booking; your client doesn't"
    "Average website quality score: 62; your client: 0 (no website)"

  /dashboard/prospects ................... Assesses the client as a prospect
    Business: "Comfort Zone HVAC" | Rating: 4.6 | 180 reviews | No website
    Opportunity Score: 94 | Digital Gap: 95 | Priority: HOT
    Classification: managed-service
    Estimated monthly value: $3,000

  /assess/hvac ........................... Runs the client through an assessment
    7 HVAC-specific questions
    Assessment results feed into the proposal

BACKSTAGE (INVISIBLE)
  discovery-scout.ts ..................... Scores client's digital presence gap
  competitor-store.ts .................... Stores competitive intelligence
  design-ingestion.ts .................... Extracts competitor design patterns
  design-ingestion-to-spec.ts ............ Creates "here's what good looks like" spec
  niche-generator.ts ..................... Previews what their system would look like:
    Assessment questions, scoring weights, nurture content
    -> David includes this in his proposal: "Here's your system, pre-built"

SUPPORT PROCESSES
  Documents dashboard .................... Generates proposal/SOW document
  ROI calculator ......................... Quantifies expected lead volume and revenue

PAIN POINTS ADDRESSED
  - "Proposals take me a week to write" -> Data-backed proposal in 30 minutes
  - "Clients don't understand the value" -> Competitive gap analysis shows them
  - "I can't demo the system before they sign" -> Live assessment + demo dashboard
```

### Stage 2: Implementation (Weeks 1-2)

```
CUSTOMER ACTIONS
  Client signs the $15K SOW. David deploys their Lead OS instance in one session.
  He spends the remaining time on strategy, branding, and content planning
  rather than technical configuration.

FRONTSTAGE (VISIBLE)
  /api/provision ......................... David provisions via API:
    POST /api/provision
    {
      "slug": "comfort-zone-hvac",
      "brandName": "Comfort Zone HVAC",
      "siteUrl": "https://comfortzonehvac.com",
      "operatorEmail": "owner@comfortzonehvac.com",
      "niche": "HVAC",
      "industry": "service",
      "revenueModel": "managed",
      "plan": "growth"
    }

  Result (instant):
    tenantId: "tnt_abc123"
    embedScript: <script src="...">
    dashboardUrl: "https://app.leadosapp.com/dashboard"
    9/9 provisioning steps completed

  /dashboard/credentials ................. David enters the client's provider keys:
    Sinosend (email), EasyText (SMS), SuiteDash (CRM)
    Each key verified on save

  /dashboard/scoring ..................... David calibrates scoring weights:
    HVAC urgency boost: "AC broken in summer" = urgency * 1.5

BACKSTAGE (INVISIBLE)
  tenant-provisioner.ts .................. 9-step automated provisioning (all complete)
  niche-generator.ts ..................... Generated HVAC config:
    Assessment: "Is your AC/heating working?", "How old is your system?"
    Scoring: urgency 0.35, fit 0.25, intent 0.25, engagement 0.15
    Nurture: "Is Your HVAC System Costing You Money?"
    Offers: "Free HVAC Efficiency Audit"
  credentials-vault.ts ................... Encrypts and stores client API keys
  n8n-client.ts .......................... Provisions 4 workflows:
    Lead notification, email nurture, CRM sync, weekly digest

SUPPORT PROCESSES
  embed-widgets adapter .................. WordPress plugin for client site
  grapesjs adapter ....................... 5 HVAC landing page templates
  authority-site adapter ................. SEO authority site: "comfortzonehvac.com/learn"

PAIN POINTS ADDRESSED
  - "Implementation takes 4-6 weeks" -> Core system live in hours
  - "I spend 80% of my time on technical work, 20% on strategy" -> Inverted ratio
  - "Every implementation is different" -> Standardized provisioning, customized strategy
  - "$15K setup fee is hard to justify" -> Show them the system running within the kickoff call
```

### Stage 3: Ongoing Management ($3K/month Retainer)

```
CUSTOMER ACTIONS
  David checks each client's dashboard weekly. He optimizes scoring,
  runs experiments, reviews lead quality, and provides strategic recommendations.
  He generates monthly reports showing ROI.

FRONTSTAGE (VISIBLE)
  Weekly routine per client (5-8 clients):
    /dashboard ........................... Check KPIs: leads, conversion rate, pipeline value
    /dashboard/experiments ............... Review experiment results, create new tests
    /dashboard/scoring ................... Review score distribution, recalibrate if needed
    /dashboard/analytics ................. Channel performance, attribution analysis
    /dashboard/competitors ............... Monitor competitor changes
    /dashboard/creative .................. Generate content for client's channels
    /dashboard/health .................... System health and integration status

  Monthly deliverables:
    /dashboard/analytics ................. Export performance report
    /dashboard/revenue ................... Revenue attribution report
    /dashboard/attribution ............... Multi-touch attribution analysis

BACKSTAGE (INVISIBLE)
  Automated operations (no David intervention needed):
  intake.ts .............................. Leads captured 24/7
  scoring-engine.ts ...................... Scores computed in real-time
  personalization-engine.ts .............. Content personalized per lead
  email-sender.ts ........................ Nurture sequences running automatically
  escalation-engine.ts ................... Stale leads re-engaged
  experiment-evaluator.ts ................ A/B tests auto-evaluated via cron
  rescore-engine.ts ...................... Scores recalculated daily

  David adds value through:
  experiment-engine.ts ................... Creating strategic experiments
  scoring-engine.ts ...................... Seasonal scoring adjustments (summer AC urgency boost)
  social-asset-engine.ts ................. Content strategy and generation
  competitor-store.ts .................... Competitive intelligence reporting

SUPPORT PROCESSES
  product-analytics.ts ................... Client health scoring
  billing-store.ts ....................... Usage tracking for monthly reports

PAIN POINTS ADDRESSED
  - "Retainer clients question the value" -> Automated system + strategic optimization = clear ROI
  - "I can only manage 3-4 clients at my current capacity" -> Automation enables 8+ clients
  - "Monthly reports are manual and time-consuming" -> Dashboard exports handle it
  - "Client churn because they don't see improvements" -> Experiments show measurable gains
```

---

## Blueprint 5: Franchise Network

**Persona**: Jennifer is VP of Marketing at a 200-location home services franchise. She needs identical lead capture across all locations with centralized analytics and per-location performance tracking. Each franchisee needs their own dashboard while corporate sees the aggregate view.

**Revenue Model**: Managed Service (enterprise tier)

### Stage 1: Corporate Platform Setup

```
CUSTOMER ACTIONS
  Jennifer works with her IT team to deploy Lead OS as the franchise's
  central lead management platform. She configures the corporate tenant
  and establishes the template for all 200 locations.

FRONTSTAGE (VISIBLE)
  Corporate dashboard:
    /dashboard/tenants ................... Master tenant list (200 locations)
    /dashboard/analytics ................. Cross-location performance comparison
    /dashboard/experiments ............... Corporate-level A/B tests (affect all locations)
    /dashboard/scoring ................... Standardized scoring model across franchise
    /dashboard/settings .................. Corporate branding, default configurations

BACKSTAGE (INVISIBLE)
  Corporate setup:
  tenant-provisioner.ts .................. Creates "FranchiseCorp" master tenant
  niche-generator.ts ..................... Generates home-services config:
    Standard assessment across all locations
    Uniform scoring weights (franchisees can't modify)
    Branded nurture templates with location merge fields
  plan-catalog.ts ........................ Enterprise plan: unlimited everything

  Template configuration:
  niche-templates.ts ..................... "service" industry template
  funnel-library.ts ...................... Standard funnel for all locations:
    Lead magnet -> Qualification -> Booking -> Retention
  email-templates.ts ..................... Corporate-approved email templates
    "Hello {{firstName}}, the {{locationName}} team is ready to help..."

SUPPORT PROCESSES
  tenant-isolation.ts .................... Hierarchical tenant model:
    Corporate tenant (parent) ........... Sees all location data
    Location tenants (children) ......... See only their own data
    RLS policies enforce hierarchy
  auth-system.ts ......................... Role hierarchy:
    Corporate admin ..................... Full access across all locations
    Regional manager .................... Access to their region's locations
    Location operator ................... Access to their location only

PAIN POINTS ADDRESSED
  - "200 locations using different tools is unmanageable" -> Single platform, uniform experience
  - "Franchisees modify things they shouldn't" -> Centralized config with role-based access
  - "We can't compare location performance" -> Standardized scoring and analytics
```

### Stage 2: Location Provisioning at Scale

```
CUSTOMER ACTIONS
  Jennifer provisions all 200 locations. She uses the API to batch-provision
  with a CSV of location data. Each location gets its own branded instance
  within minutes.

FRONTSTAGE (VISIBLE)
  Provisioning API (batch):
    POST /api/provision (200 times, or scripted batch)
    Each location gets:
      - Unique tenant ID
      - Location-branded embed script
      - Location operator dashboard access
      - Magic link sent to each franchisee

  Location operator experience:
    /dashboard ........................... Location-specific KPIs
    /dashboard/leads ..................... Only their location's leads
    /dashboard/analytics ................. Only their location's metrics
    /dashboard/bookings .................. Their service calendar

BACKSTAGE (INVISIBLE)
  tenant-provisioner.ts .................. 200x provisioning sequence:
    Each location provisioned in <5 seconds
    Total: ~15 minutes for all 200 locations

  Per-location customization:
    Location name, address, phone, service area
    Local team member names for personalized emails
    Local Google Business Profile integration
    Location-specific embed script

  Multi-tenant data model:
  runtime-store.ts ....................... Each location's leads isolated:
    tenant_id = "loc_austin_001" -> only Austin sees Austin leads
    Corporate: tenant_id IN (all location IDs) -> sees everything

  billing.ts ............................. Single corporate Stripe subscription
    Usage aggregated across all locations
    Enterprise plan: unlimited

SUPPORT PROCESSES
  tenant-context.ts ...................... Resolves location from subdomain:
    austin.franchise.com -> loc_austin_001
    portland.franchise.com -> loc_portland_001
  webhook-registry.ts .................... Webhooks fire per-location:
    New lead in Austin -> notify Austin franchisee
    New lead in Portland -> notify Portland franchisee

PAIN POINTS ADDRESSED
  - "Onboarding 200 locations takes 6 months" -> All 200 provisioned in an afternoon
  - "Each location needs custom branding" -> Automated per-location customization
  - "Location managers see other locations' data" -> Tenant isolation enforced
  - "We pay per-seat for every location" -> Enterprise plan with unlimited locations
```

### Stage 3: Centralized Analytics & Optimization

```
CUSTOMER ACTIONS
  Jennifer monitors franchise-wide performance from corporate HQ.
  She identifies underperforming locations, runs corporate experiments,
  and standardizes best practices across the network.

FRONTSTAGE (VISIBLE)
  Corporate analytics:
    /dashboard/analytics ................. Cross-location heatmap:
      Austin: 127 leads, 34% conversion | Portland: 89 leads, 41% conversion
      National avg: 23% conversion | Top location: 47% conversion

    /dashboard/experiments ............... Corporate experiments:
      Test: "Schedule Service" vs "Get Your Free Quote" (CTA)
      Sample: 200 locations x avg 50 leads = 10,000 visitors
      Result in 48 hours (vs months with single-location test)
      Winner auto-deployed to all 200 locations

    /dashboard/revenue ................... Franchise revenue tracking:
      Total pipeline: $2.3M across all locations
      Average lead value: $347
      Top-performing region: Southwest ($890K)

    /dashboard/competitors ............... National competitive intelligence:
      Track competitors in each metro market
      Identify locations facing strongest competition

BACKSTAGE (INVISIBLE)
  Cross-location intelligence:
  data-moat.ts ........................... 200 locations = massive data advantage
    Pattern: "Leads from Google organic convert 2.3x vs paid in home services"
    Pattern: "SMS follow-up within 5 min = 4x booking rate"
    All locations benefit from every other location's data

  adaptive-loop.ts ....................... Self-optimizing across franchise:
    Top location's scoring weights propagated to underperformers
    Best nurture sequences identified and standardized
    Seasonal adjustments (summer AC, winter heating) auto-applied

  experiment-evaluator.ts ................ Corporate experiments:
    200x sample size acceleration
    Winners deployed in days, not months
    5 surfaces optimized continuously

  product-analytics.ts ................... Per-location health scoring:
    Login frequency, lead response time, conversion rate
    Flags locations that need training or support

  Alerting:
  notification-hub.ts .................... Corporate alerts:
    "Austin location conversion dropped 15% this week"
    "Portland location hit 500 leads milestone"
    "Emergency: Cleveland location has 0 leads in 72 hours"

SUPPORT PROCESSES
  channel-domination.ts .................. Channel performance ranking per location
  attribution.ts ......................... Attribution comparison across locations
  revenue-pipeline.ts .................... Pipeline stage tracking per location

PAIN POINTS ADDRESSED
  - "We can't compare locations because they use different tools" -> Unified metrics
  - "A/B testing at franchise scale is impossible" -> 10,000+ visitor experiments in 48 hours
  - "We don't know which locations need help until it's too late" -> Health scoring + alerts
  - "Best practices stay in one location" -> Automated propagation of winning strategies
```

### Stage 4: Franchisee Self-Service

```
CUSTOMER ACTIONS
  Individual franchisees manage their daily operations through their
  location dashboard. They see their leads, respond to inquiries,
  and track their performance against franchise benchmarks.

FRONTSTAGE (VISIBLE)
  Location dashboard:
    /dashboard ........................... Location-specific overview
      Today: 4 new leads, 1 burning (emergency pipe burst)
      This month: 67 leads vs franchise avg: 52
      Performance rank: 14th of 200 locations

    /dashboard/leads ..................... Location lead list
      Click to view full lead profile
      Temperature-coded badges
      One-click call/email actions

    /dashboard/bookings .................. Service calendar
      "Tomorrow: 3 service calls booked from Lead OS"
      Calendar sync with Trafft/Lunacal

    /dashboard/radar ..................... Live lead activity
      Real-time: "New lead from Google organic just completed assessment"

BACKSTAGE (INVISIBLE)
  All corporate-configured automation runs silently:
  scoring-engine.ts ...................... Corporate scoring model applied
  personalization-engine.ts .............. Corporate-approved content delivered
  email-sender.ts ........................ Nurture sequences running
  escalation-engine.ts ................... Stale leads re-engaged
  experiment-evaluator.ts ................ Corporate experiments auto-applied

  Franchisee can only:
    View their leads
    Update lead status
    Manage bookings
    View their analytics

  Franchisee cannot:
    Change scoring weights
    Modify email templates
    Access other locations
    Change plan or billing

SUPPORT PROCESSES
  auth-middleware.ts ..................... Role-based access enforcement
  tenant-isolation.ts .................... Location-scoped data access
  realtime.ts ............................ SSE for live dashboard updates

PAIN POINTS ADDRESSED
  - "Franchisees need a simple interface, not enterprise software" -> Clean, focused dashboard
  - "Some franchisees ignore leads" -> Escalation engine catches stale leads, alerts corporate
  - "Franchisees want to see how they compare" -> Benchmark against franchise average
  - "Corporate changes take months to roll out" -> Instant propagation to all locations
```

---

## Cross-Cutting Concerns (All Personas)

### Security & Compliance

```
EVERY PERSONA BENEFITS FROM:

Authentication:
  auth-system.ts ......................... User, API key, and session management
  auth-middleware.ts ..................... Every request authenticated
  operator-auth.ts ....................... Magic link passwordless auth (no passwords to leak)

Data Protection:
  gdpr.ts ................................ GDPR compliance:
    POST /api/gdpr/export ............... Full data export per lead
    POST /api/gdpr/deletion ............. Complete data erasure
    POST /api/gdpr/consent .............. Consent preference management
  tenant-isolation.ts .................... RLS policies at database level
  credentials-vault.ts ................... AES-encrypted credential storage

Infrastructure Security:
  rate-limiter.ts ........................ Per-tenant, per-endpoint rate limiting
  cors.ts ................................ Strict origin whitelisting
  Security headers ....................... HSTS, CSP, X-Frame-Options, X-Content-Type-Options
  Parameterized queries .................. Zero SQL injection surface
  HMAC-SHA256 ............................ Token signing
  Stripe webhook verification ............ HMAC signature validation
```

### Integration Flexibility

```
EVERY PERSONA BENEFITS FROM:

110 provider integrations with a universal pattern:
  1. Check for API key in environment/credentials vault
  2. If key present: execute real API call with retry + error handling
  3. If key absent: execute dry-run returning realistic mock data
  4. Log execution result to provider audit trail

This means:
  - Demo mode works perfectly without any API keys
  - Adding an integration = entering one API key
  - Switching providers = changing one API key
  - No integration ever blocks the system from functioning
```

### Continuous Optimization

```
EVERY PERSONA BENEFITS FROM:

Autoresearch Loop (/api/cron/experiments):
  1. List all running experiments
  2. For each, compute z-test for proportions
  3. If variant significantly worse: STOP (rollback)
  4. If variant significantly better at 95% confidence: PROMOTE (winner)
  5. If insufficient data: CONTINUE (collect more)
  Runs on cron schedule, no human intervention needed

Five Optimization Surfaces:
  email-subject (48hr) ................... Which subject lines get opens?
  cta-copy (72hr) ........................ Which CTAs get clicks?
  lead-magnet-offer (1wk) ................ Which offers get downloads?
  scoring-weights (2wk) .................. Which scoring config produces best quality?
  funnel-step-order (3wk) ................ Which funnel sequence converts highest?

Data Moat:
  Every lead interaction across every tenant improves:
  - Scoring accuracy (which signals actually predict conversion)
  - Nurture effectiveness (which content moves leads forward)
  - Pricing intelligence (what leads are actually worth)
  - Channel attribution (where to invest for best ROI)
```

---

## System Touchpoint Map

This table shows which system components each persona interacts with most frequently:

| Component | Agency | SaaS | LeadGen | Consultant | Franchise |
|-----------|--------|------|---------|------------|-----------|
| Onboarding wizard | Setup | Build | Setup | Client setup | Batch setup |
| Tenant provisioner | Per-client | Customer self-serve | Per-niche | Per-client | 200x batch |
| Niche generator | Multi-niche | Single niche | Multi-niche | Per-client | Single niche |
| Scoring engine | Daily review | Customer uses | Quality control | Weekly calibrate | Corporate standard |
| Experiment engine | Per-client tests | Platform-wide | Cross-niche | Strategic tests | 200-location tests |
| Prospect discovery | Find new clients | Find customers | Find buyers | Find prospects | N/A |
| Marketplace | N/A | Optional | Core revenue | N/A | N/A |
| Content pipeline | Multi-client content | Template content | SEO at scale | Client content | Corporate standard |
| Competitor analysis | Per-client intel | Market research | Market gaps | Proposal data | National intel |
| Billing | Per-client subs | Self-serve subs | Per-lead pricing | Custom invoicing | Enterprise contract |
| Dashboard | Multi-tenant | Tenant mgmt | Marketplace mgmt | Client review | Corporate + location |
| GDPR | Per-client | Customer facing | Marketplace req | Client compliance | Corporate policy |

---

## Journey Stage Summary

| Stage | Agency | SaaS | LeadGen | Consultant | Franchise |
|-------|--------|------|---------|------------|-----------|
| **Discover** | Landing + assessment | Deploy + brand | Multi-property | Competitor analysis | Corporate planning |
| **Onboard** | 6-step wizard/client | Customer self-serve | Niche provisioning | API provisioning | Batch 200 locations |
| **Capture** | Client widgets | End-user widgets | Multi-niche capture | Client-branded widgets | Location widgets |
| **Score** | Per-client scoring | Platform scoring | Quality for pricing | Strategic scoring | Standardized model |
| **Nurture** | Auto email+SMS | Auto email+SMS | Warm for marketplace | Multi-channel | Corporate templates |
| **Optimize** | A/B per client | Platform-wide A/B | Cross-niche A/B | Strategic experiments | 200-location A/B |
| **Monetize** | $200-1K/mo/client | $99-499/mo/seat | $25-500/lead | $15K + $3K/mo | Enterprise contract |
| **Scale** | 50+ clients | 100+ seats | 1000+ leads/mo | 8+ clients | 200+ locations |
