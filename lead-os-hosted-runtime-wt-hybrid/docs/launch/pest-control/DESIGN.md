# Pest Control Vertical — DESIGN.md

> First vertical deployment for Lead OS. This spec drives all configuration, scoring, routing, and automation for pest control lead generation.

## Audience

- **Primary**: Homeowners with an active pest emergency (roaches, termites, bed bugs, rodents, ants, scorpions)
- **Secondary**: Property managers overseeing rental units or multi-family buildings
- **Urgency level**: High — damage is happening NOW, health risks are present, sleep is disrupted
- **Decision maker**: Homeowner (single-family) or property manager (multi-unit)
- **Budget range**:
  - General pest treatment: $150-500
  - Termite treatment: $500-2,000
  - Annual protection plans: $300-600/year
- **Core pain points**:
  - Health risk (bites, allergens, disease vectors)
  - Property damage (structural wood, wiring, insulation)
  - Embarrassment (social stigma of infestation)
  - Sleep disruption (bed bugs, rodents in walls)
  - Fear of escalation (small problem becoming catastrophic)

## Ingress Strategy

### SEO (Primary — Day 1)
- 25 programmatic city pages targeting "emergency pest control [city]"
- Long-tail keywords: "[pest type] exterminator [city]", "same day pest removal [city]"
- Each page has unique local content, pest-specific data, and neighborhood references
- Target: page 1 ranking within 60-90 days for city-specific terms

### Directory Listings (Day 7+)
- Pest control comparison and review sites
- Local business directories (Yelp, BBB, Google Business Profile)
- Niche directories (pest control associations, home service aggregators)

### Paid Search (Week 3+)
- Google Ads: "emergency exterminator near me", "pest control near me today"
- Geo-targeted to cities with active provider partnerships
- Budget: Start at $20/day per city, scale winners
- Target CPA: $12-18 per qualified lead

### Referral (Month 2+)
- Provider referral program: $10 credit per referred provider
- Customer referral: "Refer a neighbor, get $25 off next treatment"

## Funnel Logic

### High Intent (Lead Score > 70)
- **Signals**: Emergency language, specific pest identified, "today"/"now" in query, phone number provided upfront
- **Route**: Direct to phone call CTA + instant booking calendar
- **Response**: Auto-dial within 60 seconds for score > 80
- **Goal**: Booked appointment within 5 minutes

### Medium Intent (Lead Score 40-70)
- **Signals**: General pest inquiry, browsing multiple pages, comparing options
- **Route**: Interactive pest assessment quiz (5 questions) -> personalized recommendation -> booking CTA
- **Quiz flow**:
  1. What type of pest? (photo identification option)
  2. Where in your home? (kitchen, bedroom, bathroom, exterior, multiple rooms)
  3. How long has this been happening? (just noticed, days, weeks, months)
  4. Own or rent? (determines decision authority)
  5. When do you want service? (today, this week, just exploring)
- **Goal**: Convert to high-intent or capture email for nurture

### Low Intent (Lead Score < 40)
- **Signals**: Informational queries, no urgency language, browsing only
- **Route**: "Free Pest ID Guide" lead magnet download
- **Lead magnet**: PDF with photos of 20 common household pests, DIY prevention tips, and "when to call a pro" thresholds
- **Nurture sequence**: 7-email drip over 14 days
- **Goal**: Capture email, nurture to medium/high intent

## Scoring Model

| Signal | Points | Rationale |
|--------|--------|-----------|
| Phone number provided | +25 | Highest intent signal |
| "Emergency" or "today" in form | +20 | Urgency confirmed |
| Specific pest identified | +15 | Problem is real and diagnosed |
| Multiple rooms affected | +10 | Severity indicator |
| Homeowner (not renter) | +10 | Decision maker confirmed |
| Photo uploaded | +10 | Engaged, problem is visible |
| Return visitor | +5 | Considering options |
| Quiz completed | +5 | Engaged with content |
| Email only (no phone) | +3 | Lower commitment |
| Informational page only | +2 | Early research phase |

## Psychology

### Urgency Triggers
- "Every hour of delay lets the infestation spread to adjacent rooms"
- "Termites consume wood 24/7 — they do not sleep, and they do not stop"
- "A single pair of roaches can produce 400,000 offspring in a year"
- Countdown elements: "3 inspection slots remaining today"

### Fear (Factual, Not Manipulative)
- "Termites cause $5 billion in US property damage annually — more than fires, floods, and storms combined"
- "Bed bug infestations reduce property values by 20% until resolved"
- "Rodent-chewed wiring is the #2 cause of residential electrical fires"

### Trust Builders
- "Licensed, bonded, and insured in [STATE]"
- "Background-checked technicians — your safety matters"
- "Satisfaction guaranteed: if pests return within 30 days, we re-treat FREE"
- State-specific license numbers displayed on every page

### Social Proof
- Dynamic counter: "[847] emergency calls answered this month"
- City-specific testimonials with first name, neighborhood, and pest type
- Star ratings from verified customers
- "Trusted by [X] homeowners in [CITY]" with real numbers

## Offers

### Core Offer
- **Free Emergency Inspection** (normally $149) — today only
- Includes: visual inspection, pest identification, damage assessment, treatment recommendation
- No obligation, no pressure
- Available same-day for leads scoring > 60

### Upsell Offer
- **Annual Pest Protection Plan**: $29/month
- Includes: quarterly treatments, unlimited emergency callbacks, termite monitoring
- Positioned after initial treatment: "Prevent this from ever happening again"

### Guarantee
- "30-Day Pest-Free Guarantee: if pests return within 30 days of treatment, we re-treat at no additional cost"
- "Price Match: find a lower quote from a licensed provider, and we will match it"

## Automation

### Response Timing
| Lead Score | Channel | Target Response Time |
|------------|---------|---------------------|
| 80-100 | Auto-dial + SMS | < 60 seconds |
| 60-79 | SMS + Email | < 2 minutes |
| 40-59 | Email + SMS | < 5 minutes |
| 0-39 | Email only | < 15 minutes |

### SMS Sequence
1. **Immediate** (score > 40): "Hi [NAME], we received your pest control request. A licensed technician in [CITY] is available today. Reply YES to confirm or call [PHONE]."
2. **+30 minutes** (if no reply): "Still dealing with [PEST TYPE]? Our [CITY] team has [X] openings left today. Inspection is FREE — no obligation."
3. **+4 hours** (if no reply): "Just checking in, [NAME]. Pest problems get worse with time. Reply STOP to opt out or YES to schedule your free inspection."

### Email Sequence
1. **Immediate**: Confirmation + what to expect + technician photo and credentials
2. **+1 hour**: Inspection report template + treatment options with pricing
3. **+24 hours**: "Did you get the help you needed?" + secondary provider option
4. **+72 hours**: Prevention tips + annual plan pitch
5. **+7 days**: "Still dealing with pests?" + limited-time discount

### Auto-Dial Rules
- Score > 80: auto-connect to nearest available provider within 60 seconds
- 3 ring maximum — if no provider pickup, SMS the lead with ETA
- Record call disposition for quality scoring
- Never auto-dial before 8 AM or after 9 PM local time

## Provider Management

### Onboarding Requirements
- Valid state pest control license (verified)
- General liability insurance ($1M minimum)
- Positive online reputation (3.5+ stars, 20+ reviews)
- Response commitment: answer or return calls within 15 minutes
- Service area defined by zip codes

### Lead Distribution
- Exclusive leads: one lead goes to one provider (not shared)
- Round-robin within a service area, weighted by:
  - Response time history
  - Conversion rate
  - Customer satisfaction score
  - Payment standing
- Providers can set daily/weekly lead caps
- Pause/resume at any time

### Pricing Tiers
| Lead Type | Price | Criteria |
|-----------|-------|----------|
| Standard pest (roaches, ants) | $35 | Verified contact, pest identified |
| Premium pest (termites) | $75 | Verified contact, termite confirmed |
| Emergency (same-day) | $50 | High urgency, available today |
| Bed bugs | $60 | Verified contact, bed bugs confirmed |
| Rodents | $45 | Verified contact, rodent activity confirmed |

## KPIs

### Lead Generation
- **Conversion rate**: 8% target (visitor to lead)
- **Cost per lead**: < $15 (organic), < $25 (paid)
- **Lead volume**: 10-20 leads/day at scale

### Lead Quality
- **Contact rate**: 85%+ (phone answers or responds to SMS)
- **Qualification rate**: 70%+ (real pest problem, in service area)
- **Provider acceptance rate**: 90%+ (providers accept the lead)

### Revenue
- **Revenue per lead**: $45 average (blended across pest types)
- **Provider retention**: 80%+ month-over-month
- **Monthly recurring revenue target**: $5,000 by Month 3

### Operational
- **Response time**: < 2 minutes for score > 60
- **Lead-to-booking rate**: 25% target
- **Provider response time**: < 15 minutes
- **Customer satisfaction**: 4.0+ stars

## Technical Integration Points

### Lead OS Endpoints Used
- `POST /api/intake` — receive and process new leads
- `POST /api/niche-generator` — initialize pest-control niche
- `POST /api/design-spec` — load this spec into the system
- `POST /api/design-spec/[id]/apply` — activate scoring and routing rules
- `POST /api/testbed/run` — calibrate with synthetic leads
- `POST /api/distribution/programmatic` — deploy city pages
- `POST /api/adaptive-loop/cycle` — trigger optimization cycle
- `GET /api/health` — system health check

### Dashboard Views
- `/dashboard/pipeline` — lead flow visualization
- `/dashboard/radar` — hot lead identification
- `/dashboard/revenue` — revenue tracking and forecasting
- `/dashboard/feedback` — system performance insights

### External Integrations (Future)
- Stripe: provider billing
- Twilio: SMS and voice
- SendGrid/Emailit: transactional email
- Google Search Console: SEO monitoring
- Google Analytics: traffic and conversion tracking

---

## Documentation map

Kernel surfaces: [`../../PRODUCT-SURFACES.md`](../../PRODUCT-SURFACES.md). Integration bullets above are **targets** until wired with real credentials and tested end-to-end.
