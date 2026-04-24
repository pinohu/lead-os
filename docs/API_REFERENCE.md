# Lead OS API Reference

> **Canonical contract:** The hosted kernel serves **OpenAPI 3.1** at **`/api/docs/openapi.json`** and a human entry point at **`/docs/api`** when that deployment is built from `lead-os-hosted-runtime-wt-hybrid`. This Markdown file is a **narrative companion** — it can lag behind generated routers. For route-level truth on a branch, run `npm run enumerate:api-routes` in the hybrid package and diff against this doc.

Complete reference for all API endpoints across the kernel runtime and edge layer.

## Authentication

Lead OS uses three authentication mechanisms depending on the endpoint:

| Mechanism | Used By | How It Works |
|-----------|---------|-------------|
| **None / CORS** | Public endpoints (health, intake, decision, embed) | Open access. CORS headers restrict widget origins via `LEAD_OS_WIDGET_ORIGINS`. |
| **Operator session** | Dashboard, config, smoke, provisioning | Magic link email flow. Operator requests a link via `POST /api/auth/request-link`, clicks the emailed link, receives a session cookie (`leados_operator_session`). |
| **Cron secret** | Cron endpoints (nurture) | Bearer token in `Authorization` header matching `CRON_SECRET` env var. |

### Operator Authentication Flow

1. `POST /api/auth/request-link` with `email` in form data.
2. If the email is in the `LEAD_OS_OPERATOR_EMAILS` list, a magic link is sent via Emailit.
3. Clicking the link sets a session cookie.
4. All operator-protected endpoints check this cookie. Returns `401` if missing or expired.

---

## Kernel Runtime Endpoints

Base URL: The deployed runtime URL (e.g., `https://api.yourdomain.com`).

---

### GET /api/health

System health check. Returns tenant configuration, funnel count, persistence mode, and telemetry counts.

**Auth:** None

**Response:**

```json
{
  "success": true,
  "service": "lead-os-hosted-runtime",
  "tenantId": "my-tenant",
  "brandName": "My Brand",
  "siteUrl": "https://api.example.com",
  "widgetOrigins": ["https://example.com"],
  "enabledFunnels": ["lead-magnet", "qualification", "chat", "..."],
  "funnelCount": 10,
  "persistenceMode": "postgresql",
  "eventCount": 42,
  "leadCount": 15,
  "milestoneFramework": { "...": "..." },
  "health": { "liveMode": true, "providers": { "...": "..." }, "channels": { "...": "..." } }
}
```

---

### POST /api/intake

Accept a lead submission. Processes the lead through scoring, funnel decisioning, CRM sync, and multi-channel follow-up orchestration.

**Auth:** CORS (origin validated against `LEAD_OS_WIDGET_ORIGINS`)

**Request body:**

```json
{
  "source": "contact_form",
  "firstName": "Jane",
  "lastName": "Doe",
  "email": "jane@example.com",
  "phone": "+1234567890",
  "company": "Acme Corp",
  "service": "process-automation",
  "niche": "construction",
  "message": "I need help automating my scheduling.",
  "score": 75,
  "returning": false,
  "askingForQuote": true,
  "wantsBooking": false,
  "wantsCheckout": false,
  "prefersChat": false,
  "contentEngaged": false,
  "preferredFamily": "qualification",
  "metadata": { "utm_source": "google" },
  "dryRun": false
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `source` | string | Yes | Intake source: `contact_form`, `assessment`, `roi_calculator`, `exit_intent`, `chat`, `webinar`, `checkout`, `manual` |
| `firstName` | string | No | Lead first name |
| `lastName` | string | No | Lead last name |
| `email` | string | No | Lead email address |
| `phone` | string | No | Lead phone number |
| `company` | string | No | Company name |
| `service` | string | No | Requested service slug |
| `niche` | string | No | Niche slug |
| `message` | string | No | Freeform message |
| `score` | number | No | Pre-computed lead score (0-100) |
| `returning` | boolean | No | Whether this is a returning visitor |
| `askingForQuote` | boolean | No | Quote intent signal |
| `wantsBooking` | boolean | No | Booking intent signal |
| `wantsCheckout` | boolean | No | Checkout intent signal |
| `prefersChat` | boolean | No | Chat preference signal |
| `contentEngaged` | boolean | No | Content engagement signal |
| `preferredFamily` | string | No | Override funnel family routing |
| `metadata` | object | No | Arbitrary metadata (UTM params, custom fields) |
| `dryRun` | boolean | No | If true, skip external provider calls |

**Response (200):**

```json
{
  "success": true,
  "leadKey": "lead-jane-doe-abc123",
  "decision": {
    "family": "qualification",
    "blueprintId": "qualification-construction",
    "destination": "/assess/construction",
    "reason": "High-intent consult signal detected; move into qualification and booking.",
    "ctaLabel": "Book Your Free Assessment",
    "recommendedChannels": ["email", "whatsapp"]
  },
  "providerResults": [
    { "ok": true, "provider": "suitedash", "mode": "live", "detail": "Contact synced" },
    { "ok": true, "provider": "emailit", "mode": "live", "detail": "Welcome email sent" }
  ],
  "stage": "captured",
  "score": 75
}
```

**Error (400):**

```json
{
  "success": false,
  "error": "At least email or phone is required"
}
```

---

### POST /api/decision

Determine the next funnel step for a visitor based on signals. Does not persist data -- use for real-time routing decisions.

**Auth:** CORS

**Request body:**

```json
{
  "source": "chat",
  "service": "ai-integration",
  "niche": "construction",
  "hasEmail": true,
  "hasPhone": false,
  "returning": true,
  "askingForQuote": false,
  "wantsBooking": false,
  "wantsCheckout": false,
  "prefersChat": true,
  "contentEngaged": false,
  "score": 60,
  "preferredFamily": "chat"
}
```

**Response (200):**

```json
{
  "success": true,
  "decision": {
    "family": "chat",
    "blueprintId": "chat-construction",
    "destination": "/calculator?niche=construction&mode=chat",
    "reason": "Conversational entry detected; use the chat qualification funnel.",
    "ctaLabel": "Chat With Us",
    "recommendedChannels": ["email", "chat"],
    "traceDefaults": {
      "service": "ai-integration",
      "niche": "construction",
      "blueprintId": "chat-construction",
      "stepId": "chat_entry"
    },
    "recipe": {
      "family": "chat",
      "summary": "Capture transcript, classify objections, and route to the best next step.",
      "trigger": "Chat identity captured",
      "actions": ["Summarize conversation", "Classify objection and persona", "..."]
    }
  }
}
```

### Valid Funnel Families

| Family | Description |
|--------|-------------|
| `lead-magnet` | Front-end capture with nurture and offer routing |
| `qualification` | Assessment/scoring with booking or nurture branching |
| `chat` | Conversational qualification via AI chat |
| `webinar` | Educational content path (webinar/mini-class) |
| `authority` | Content-led authority building |
| `checkout` | Direct commerce/payment flow |
| `retention` | Customer retention and reactivation |
| `rescue` | Win-back for at-risk or churned leads |
| `referral` | Referral and affiliate program activation |
| `continuity` | Ongoing engagement and subscription |

---

### GET /api/embed/manifest

Full embed manifest containing tenant config, niche catalog, widget types, experience manifests, and funnel summaries. Used by embed widgets to bootstrap themselves.

**Auth:** CORS

**Response (200):**

```json
{
  "success": true,
  "tenant": {
    "tenantId": "my-tenant",
    "brandName": "My Brand",
    "siteUrl": "https://api.example.com",
    "supportEmail": "support@example.com",
    "accent": "#14b8a6",
    "enabledFunnels": ["..."],
    "channels": { "email": true, "whatsapp": true, "sms": false, "chat": true, "voice": false }
  },
  "niches": [
    { "slug": "general", "label": "General", "painPoints": ["..."], "offers": ["..."] }
  ],
  "widgets": { "chat": true, "form": true, "assessment": true, "calculator": true },
  "experience": [
    { "niche": "general", "manifest": { "...": "..." } }
  ],
  "funnels": [
    {
      "id": "lead-magnet-my-tenant",
      "family": "lead-magnet",
      "goal": "Capture and nurture leads",
      "entryPoints": ["landing_page", "popup_entry"],
      "nodeCount": 12,
      "recipe": { "...": "..." }
    }
  ],
  "health": { "liveMode": true, "providers": { "...": "..." }, "channels": { "...": "..." } }
}
```

---

### GET /api/widgets/boot

Lightweight widget boot configuration. Returns just enough data for an embed script to initialize.

**Auth:** CORS

**Response (200):**

```json
{
  "success": true,
  "widget": {
    "tenantId": "my-tenant",
    "brandName": "My Brand",
    "accent": "#14b8a6",
    "runtimeBaseUrl": "https://api.example.com",
    "routes": {
      "intake": "/api/intake",
      "decision": "/api/decision",
      "manifest": "/api/embed/manifest"
    },
    "defaults": {
      "service": "lead-capture",
      "niche": "general"
    },
    "channels": { "email": true, "whatsapp": true, "sms": false, "chat": true, "voice": false },
    "enabledFunnels": ["lead-magnet", "qualification", "..."],
    "experience": { "...": "..." },
    "primaryFunnels": [
      { "id": "lead-magnet-my-tenant", "family": "lead-magnet", "goal": "..." }
    ],
    "health": { "liveMode": true, "channels": { "...": "..." } }
  }
}
```

---

### GET /api/dashboard

Operator dashboard data. Returns leads, events, framework, and persistence info.

**Auth:** Operator session (cookie)

**Response (200):**

```json
{
  "success": true,
  "tenantId": "my-tenant",
  "brandName": "My Brand",
  "liveMode": true,
  "persistenceMode": "postgresql",
  "framework": { "...": "three-visit milestone framework" },
  "dashboard": {
    "totalLeads": 42,
    "leadsByStage": { "captured": 20, "qualified": 10, "booked": 7, "converted": 5 },
    "eventTimeline": ["..."],
    "recentLeads": ["..."]
  }
}
```

**Error (401):**

```json
{ "error": "Unauthorized" }
```

---

### GET /api/runtime-config

Read operational runtime configuration (Trafft, Documentero, Crove settings).

**Auth:** Operator session

**Response (200):**

```json
{
  "success": true,
  "config": {
    "trafft": {
      "publicBookingUrl": "https://booking.example.com",
      "defaultServiceId": "svc_123",
      "serviceMap": { "plumbing": "svc_456" }
    },
    "documentero": {
      "defaultFormat": "pdf",
      "proposalTemplateId": "tpl_abc"
    },
    "crove": {}
  },
  "summary": { "...": "human-readable config summary" }
}
```

### POST /api/runtime-config

Update operational runtime configuration. Partial updates are supported.

**Auth:** Operator session

**Request body:**

```json
{
  "trafft": {
    "publicBookingUrl": "https://new-booking.example.com",
    "serviceMap": { "hvac": "svc_789" }
  }
}
```

**Response (200):** Same shape as GET, with updated values.

---

### GET /api/automations/health

Provider and channel health status. Shows which integrations are configured, live, and their ownership.

**Auth:** None

**Response (200):**

```json
{
  "success": true,
  "tenantId": "my-tenant",
  "liveMode": true,
  "persistenceMode": "postgresql",
  "providers": {
    "suitedash": { "configured": true, "live": true, "owner": "crm", "responsibility": "..." },
    "emailit": { "configured": true, "live": true, "owner": "email", "responsibility": "..." },
    "n8n": { "configured": false, "live": false, "owner": "orchestration", "responsibility": "..." }
  },
  "channels": { "email": true, "whatsapp": true, "sms": false, "chat": false, "voice": false },
  "funnels": [
    { "id": "lead-magnet-my-tenant", "family": "lead-magnet", "recipe": { "...": "..." }, "nodes": 12, "edges": 15 }
  ],
  "telemetry": { "leads": 42, "events": 150 }
}
```

---

### POST /api/automations/smoke

Run a smoke test against all configured providers. Tests connectivity without affecting real data.

**Auth:** Operator session

**Request body:**

```json
{
  "dryRun": true
}
```

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `dryRun` | boolean | `true` | If true, simulates provider calls. If false, sends real test messages. |

**Response (200):**

```json
{
  "success": true,
  "smoke": {
    "suitedash": { "ok": true, "mode": "dry-run", "detail": "Would create contact" },
    "emailit": { "ok": true, "mode": "dry-run", "detail": "Would send email" }
  }
}
```

---

### GET /api/config/health

Configuration completeness summary. Shows which config sections are complete, missing, or partial.

**Auth:** Operator session

**Response (200):**

```json
{
  "success": true,
  "configuration": {
    "tenant": { "status": "complete", "details": { "...": "..." } },
    "crm": { "status": "complete", "details": { "...": "..." } },
    "email": { "status": "complete", "details": { "...": "..." } },
    "booking": { "status": "missing", "details": { "...": "..." } }
  }
}
```

---

### GET /api/cron/nurture

Process nurture sequences for eligible leads. Sends follow-up messages based on the 7-stage nurture cadence.

**Auth:** Bearer token (CRON_SECRET)

```
Authorization: Bearer your-cron-secret
```

**Response (200):**

```json
{
  "success": true,
  "processed": [
    { "leadKey": "lead-jane-doe-abc123", "stage": "day-2", "channels": ["email"] },
    { "leadKey": "lead-john-smith-def456", "stage": "day-5", "channels": ["email", "whatsapp"] }
  ],
  "count": 2
}
```

**Error (401):**

```json
{ "success": false, "error": "Unauthorized" }
```

---

### POST /api/auth/request-link

Request an operator magic link. Sends an email with a one-time authentication link.

**Auth:** None

**Content-Type:** `application/x-www-form-urlencoded`

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `email` | string | Yes | Operator email (must be in `LEAD_OS_OPERATOR_EMAILS`) |
| `next` | string | No | Path to redirect after login. Default: `/dashboard` |

**Success:** Redirects to `/auth/check-email?email=...`

**Error:** Redirects to `/auth/sign-in?error=unauthorized` or `error=delivery-failed`

---

### GET /api/n8n/manifest

Catalog of available n8n starter workflows.

**Auth:** None

**Response (200):**

```json
{
  "success": true,
  "count": 8,
  "manifestVersion": "1.0.0",
  "canProvision": true,
  "provisionUrl": "/api/n8n/provision",
  "defaultOperationalSlugs": [
    "lead-intake-fanout",
    "milestone-second-touch",
    "milestone-third-touch-conversion",
    "referral-activation-loop"
  ],
  "workflows": [
    {
      "slug": "lead-intake-fanout",
      "name": "Lead Intake Fanout",
      "summary": "Routes new leads to CRM, email, and alert channels",
      "family": "lead-magnet",
      "sources": ["..."],
      "repos": ["..."],
      "importUrl": "/api/n8n/workflows/lead-intake-fanout",
      "provisionUrl": "/api/n8n/provision/lead-intake-fanout"
    }
  ]
}
```

---

### GET /api/n8n/provision

Check provisioning status of all n8n starter workflows.

**Auth:** Operator session

**Response (200):**

```json
{
  "success": true,
  "configured": true,
  "count": 8,
  "manifestVersion": "1.0.0",
  "workflows": [
    { "slug": "lead-intake-fanout", "name": "...", "provisioned": true, "active": true }
  ]
}
```

### POST /api/n8n/provision

Provision n8n starter workflows to the connected n8n instance.

**Auth:** Operator session

**Request body:**

```json
{
  "slugs": ["lead-intake-fanout", "milestone-second-touch"],
  "replaceExisting": true,
  "activate": true
}
```

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `slugs` | string[] | all | Specific workflow slugs to provision. Omit to provision all. |
| `replaceExisting` | boolean | `true` | Replace workflows that already exist in n8n. |
| `activate` | boolean | `true` | Activate workflows after provisioning. |

**Response (200):**

```json
{
  "success": true,
  "provisioned": 2,
  "results": [
    { "slug": "lead-intake-fanout", "ok": true, "action": "created" },
    { "slug": "milestone-second-touch", "ok": true, "action": "replaced" }
  ]
}
```

---

### GET /api/n8n/provision/:slug

Check provisioning status of a single workflow.

**Auth:** Operator session

### POST /api/n8n/provision/:slug

Provision a single n8n workflow.

**Auth:** Operator session

---

### GET /api/n8n/workflows/:slug

Download the raw n8n workflow JSON for manual import.

**Auth:** None

**Response:** n8n workflow JSON with `Content-Disposition: attachment` header.

---

### POST /api/scoring

Compute lead scores across behavioral, demographic, intent, and engagement dimensions.

**Auth:** CORS

**Request body:**

```json
{
  "leadKey": "lead-jane-abc123",
  "email": "jane@example.com",
  "phone": "+1234567890",
  "source": "organic",
  "niche": "construction",
  "sessionCount": 3,
  "totalPageViews": 12,
  "totalTimeOnSite": 300,
  "intentSignals": ["pricing_page_view", "booking_intent"],
  "isReturning": true,
  "hasAssessment": false,
  "hasCalculator": true,
  "hasBookingIntent": true,
  "hasPricingView": true,
  "companySize": "51-200",
  "revenue": "$1M-$5M",
  "role": "owner"
}
```

**Response (200):**

```json
{
  "data": {
    "leadKey": "lead-jane-abc123",
    "behavioralScore": 45,
    "demographicScore": 70,
    "intentScore": 60,
    "engagementScore": 35,
    "compositeScore": 53,
    "grade": "C",
    "isHot": true,
    "temperature": "warm",
    "recommendedAction": "Book consultation. Send tailored case study.",
    "signals": ["booking_intent", "pricing_engagement", "returning_visitor"],
    "breakdown": {
      "behavioral": { "sessions": 15, "pageViews": 15, "...": "..." },
      "demographic": { "email": 20, "phone": 15, "...": "..." },
      "intent": { "pricingView": 20, "bookingIntent": 25, "...": "..." },
      "engagement": { "sessions": 24, "pageViews": 20, "...": "..." }
    }
  },
  "error": null,
  "meta": { "scoredAt": "2026-01-15T09:30:00Z" }
}
```

---

### GET /api/experiments

List all A/B experiments, optionally filtered by status.

**Auth:** CORS

**Query parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `status` | string | Filter by status: `draft`, `running`, `paused`, `completed` |

**Response (200):**

```json
{
  "data": [
    {
      "id": "exp_123",
      "name": "CTA Color Test",
      "description": "Test red vs blue CTA",
      "status": "running",
      "variants": [
        { "id": "var_0", "name": "Red (Control)", "weight": 0.5, "assignments": 150, "conversions": 12 },
        { "id": "var_1", "name": "Blue", "weight": 0.5, "assignments": 148, "conversions": 18 }
      ],
      "targetMetric": "conversion",
      "createdAt": "2026-01-10T09:00:00Z",
      "updatedAt": "2026-01-15T09:30:00Z"
    }
  ],
  "error": null,
  "meta": { "count": 1 }
}
```

### POST /api/experiments

Create a new experiment. Requires at least 2 variants.

**Auth:** CORS

**Request body:**

```json
{
  "name": "CTA Color Test",
  "description": "Test red vs blue CTA button",
  "status": "running",
  "variants": [
    { "name": "Red (Control)", "weight": 1 },
    { "name": "Blue", "weight": 1 }
  ],
  "targetMetric": "conversion"
}
```

**Response (201):** The created experiment object.

---

### GET /api/experiments/:id

Get a single experiment with analysis (conversion rates, leader, statistical significance).

**Auth:** CORS

**Response (200):**

```json
{
  "data": {
    "id": "exp_123",
    "name": "CTA Color Test",
    "status": "running",
    "variants": ["..."],
    "analysis": {
      "totalAssignments": 298,
      "totalConversions": 30,
      "overallConversionRate": 10.07,
      "variants": [
        { "id": "var_0", "name": "Red (Control)", "assignments": 150, "conversions": 12, "conversionRate": 8.0 },
        { "id": "var_1", "name": "Blue", "assignments": 148, "conversions": 18, "conversionRate": 12.16 }
      ],
      "leader": { "id": "var_1", "name": "Blue", "conversionRate": 12.16 },
      "isStatisticallySignificant": true,
      "sampleSizeReached": true
    }
  },
  "error": null,
  "meta": null
}
```

### PATCH /api/experiments/:id

Update an experiment's status, name, or description.

**Auth:** CORS

**Request body:**

```json
{
  "status": "paused"
}
```

| Field | Type | Description |
|-------|------|-------------|
| `status` | string | New status: `draft`, `running`, `paused`, `completed` |
| `name` | string | Updated experiment name |
| `description` | string | Updated description |

---

### POST /api/experiments/:id/assign

Assign a visitor to an experiment variant. Returns a sticky assignment (same visitor always gets the same variant).

**Auth:** CORS

**Request body:**

```json
{
  "visitorId": "visitor-abc-123"
}
```

**Response (201):** New assignment.

```json
{
  "data": {
    "experimentId": "exp_123",
    "visitorId": "visitor-abc-123",
    "variantId": "var_1",
    "variantName": "Blue",
    "isNew": true
  },
  "error": null,
  "meta": null
}
```

**Response (200):** Existing assignment returned.

**Error (409):** Experiment is not in `running` status.

---

### POST /api/experiments/:id/convert

Record a conversion for an assigned visitor.

**Auth:** CORS

**Request body:**

```json
{
  "visitorId": "visitor-abc-123",
  "metric": "purchase",
  "value": 99.00
}
```

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `visitorId` | string | Required | The visitor who converted |
| `metric` | string | experiment's `targetMetric` | Conversion metric name |
| `value` | number | `1` | Conversion value |

**Response (201):** Conversion recorded.

**Error (404):** Visitor has not been assigned to this experiment.

---

### GET /api/attribution

Generate an attribution report for a lead using the specified model.

**Auth:** CORS

**Query parameters:**

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `leadKey` | string | Required | The lead identifier |
| `model` | string | `position-based` | Attribution model: `first-touch`, `last-touch`, `linear`, `time-decay`, `position-based` |

**Response (200):**

```json
{
  "data": {
    "leadKey": "lead-jane-abc123",
    "model": "position-based",
    "touches": [
      { "id": "touch_1", "leadKey": "lead-jane-abc123", "channel": "organic", "source": "google", "...": "..." }
    ],
    "channelCredits": { "organic": 0.4, "paid": 0.2, "email": 0.4 },
    "firstTouch": { "...": "..." },
    "lastTouch": { "...": "..." },
    "totalTouches": 3
  },
  "error": null,
  "meta": null
}
```

### POST /api/attribution

Record an attribution touchpoint for a lead.

**Auth:** CORS

**Request body:**

```json
{
  "leadKey": "lead-jane-abc123",
  "channel": "organic",
  "source": "google",
  "medium": "cpc",
  "campaign": "spring-2026",
  "content": "hero-banner",
  "referrer": "https://google.com",
  "page": "/services/plumbing",
  "eventType": "page_view",
  "timestamp": "2026-01-15T09:30:00Z"
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `leadKey` | string | Yes | Lead identifier |
| `channel` | string | Yes | Attribution channel |
| `source` | string | Yes | Traffic source |
| `medium` | string | No | Traffic medium |
| `campaign` | string | No | Campaign name |
| `eventType` | string | No | Event type (default: `page_view`) |

**Response (201):** The recorded touch object.

---

### GET /api/lead-magnets

List lead magnets from the catalog. Supports filtering and recommendation mode.

**Auth:** CORS

**Query parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `niche` | string | Filter by niche |
| `category` | string | Filter by category |
| `recommend` | string | Set to `true` for AI-scored recommendations |
| `funnelFamily` | string | Filter recommendations by funnel family |
| `source` | string | Filter recommendations by traffic source |
| `limit` | number | Max results (default: 20, max: 100) |

**Response (200):**

```json
{
  "data": [
    {
      "id": "M001",
      "slug": "m001-website-audit-checklist",
      "title": "Website Audit Checklist",
      "category": "assessment",
      "deliveryType": "checklist",
      "formFields": [
        { "name": "email", "label": "Email Address", "type": "email", "required": true }
      ],
      "funnelFamily": "lead-magnet",
      "niche": "general",
      "tags": ["assessment", "tofu", "..."],
      "status": "active"
    }
  ],
  "error": null,
  "meta": { "count": 20, "total": 64 }
}
```

When `recommend=true`, each item includes `score` and `reason`:

```json
{
  "data": [
    { "magnet": { "...": "..." }, "score": 0.85, "reason": "strong niche fit for construction; aligns with lead-magnet funnel" }
  ]
}
```

### GET /api/lead-magnets/:slug

Get a single lead magnet by slug or ID.

**Auth:** CORS

**Response (200):** The lead magnet object.

**Error (404):** Lead magnet not found.

### POST /api/lead-magnets

Record a lead magnet delivery.

**Auth:** CORS

**Request body:**

```json
{
  "leadKey": "lead-jane-abc123",
  "magnetId": "M001",
  "metadata": { "source": "landing-page" }
}
```

**Response (201):** The delivery record.

---

### GET /api/tracking/pixel

Email open tracking pixel. Returns a 1x1 transparent GIF and records the open event.

**Auth:** None

**Query parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `leadKey` | string | Lead identifier |
| `emailId` | string | Email identifier |

**Response:** 1x1 transparent GIF with `Cache-Control: no-cache`.

---

### GET /api/tracking/click

Email click tracking redirect. Records the click event and redirects to the target URL.

**Auth:** None

**Query parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `url` | string | Yes | Target URL to redirect to (must be http/https) |
| `leadKey` | string | No | Lead identifier |
| `emailId` | string | No | Email identifier |

**Response:** 302 redirect to the target URL.

**Error (400):** Missing or unsafe URL.

---

### GET /api/dashboard/analytics

Funnel analytics dashboard with stage progression, score distribution, channel performance, weekly time series, niche performance, and funnel family performance.

**Auth:** Operator session

**Response (200):**

```json
{
  "success": true,
  "data": {
    "metrics": { "totalLeads": 42, "conversionRate": 12.5, "avgScore": 45.3, "hotLeads": 8 },
    "funnelStages": [{ "stage": "captured", "count": 20, "conversionFromPrevious": 47.6 }],
    "scoreDistribution": [{ "label": "0-10", "count": 5 }],
    "channelPerformance": [{ "source": "organic", "leads": 15, "conversions": 3, "conversionRate": 20.0 }],
    "weeklyTimeSeries": [{ "weekStart": "2026-01-08", "weekEnd": "2026-01-15", "count": 12 }],
    "nichePerformance": [{ "niche": "construction", "leads": 10, "conversions": 2, "hotLeads": 3, "avgScore": 55.2 }],
    "funnelPerformance": [{ "family": "qualification", "leads": 8, "conversions": 2, "hotLeads": 2 }]
  }
}
```

---

### GET /api/dashboard/scoring

Lead scoring dashboard showing all leads with temperature classification, score breakdown, and recommended actions.

**Auth:** Operator session

**Response (200):**

```json
{
  "success": true,
  "data": {
    "leads": [
      {
        "leadKey": "email:jane@example.com",
        "score": 85,
        "temperature": "hot",
        "breakdown": { "intent": 70, "fit": 60, "engagement": 80, "urgency": 45 },
        "recommendedActions": ["Schedule immediate call", "Send personalized proposal"]
      }
    ],
    "temperatureDistribution": { "cold": 10, "warm": 15, "hot": 8, "burning": 3 },
    "scoreByNiche": [{ "niche": "construction", "avgScore": 55.2, "count": 10 }]
  }
}
```

---

### GET /api/dashboard/radar

Hot lead radar showing high-score leads, recent high-intent events, and activity feed.

**Auth:** Operator session

**Response (200):**

```json
{
  "success": true,
  "data": {
    "hotLeads": [
      {
        "leadKey": "email:jane@example.com",
        "score": 90,
        "reasons": ["Score above 90", "Return engaged", "3 visits"],
        "lastActivity": "2026-01-15T09:30:00Z"
      }
    ],
    "recentHighIntentEvents": [
      { "eventType": "booking_requested", "leadKey": "email:jane@example.com", "timestamp": "2026-01-15T09:25:00Z" }
    ],
    "activityFeed": [
      { "eventType": "form_submitted", "leadKey": "email:john@example.com", "timestamp": "2026-01-15T09:20:00Z" }
    ]
  }
}
```

---

## Edge Layer Endpoints

Base URL: The deployed edge URL (e.g., `https://neatcircle.com`).

---

### POST /api/intake

Edge lead intake with rate limiting and bot detection.

**Auth:** Rate limited (20 requests per minute per IP)

**Request body:** Same as kernel runtime intake.

**Response (200):** Lead processing result.

**Error (429):**

```json
{ "error": "Too many intake requests. Please slow down." }
```

---

### POST /api/contact

Contact form submission. Requires `firstName`, `lastName`, and `email`.

**Auth:** None

**Request body:**

```json
{
  "firstName": "Jane",
  "lastName": "Doe",
  "email": "jane@example.com",
  "company": "Acme Corp",
  "phone": "+1234567890",
  "service": "process-automation",
  "message": "I need help with..."
}
```

**Response (200):** Lead processing result.

**Error (400):**

```json
{ "error": "First name, last name, and email are required." }
```

---

### POST /api/subscribe

Newsletter subscription. Requires `email`.

**Auth:** None

**Request body:**

```json
{
  "email": "jane@example.com",
  "firstName": "Jane"
}
```

---

### POST /api/track

Behavioral event tracking. Logs visitor interactions to AITable for analytics.

**Auth:** Rate limited (120 requests per minute per IP). Bot requests are accepted with `202` and skipped.

**Request body:**

```json
{
  "visitorId": "visitor-abc-123",
  "type": "cta_click",
  "page": "/services/ai-integration",
  "sessionId": "session-xyz",
  "source": "organic",
  "service": "ai-integration",
  "niche": "construction",
  "blueprintId": "qualification-construction",
  "stepId": "hero_cta",
  "email": "jane@example.com",
  "data": { "ctaText": "Get Started" },
  "scores": { "engagement": 45, "intent": 30, "fit": 50, "urgency": 20, "composite": 38 },
  "timestamp": "2026-01-15T09:30:00Z"
}
```

**Valid event types:**

| Type | Description |
|------|-------------|
| `page_view` | Page load event |
| `scroll_depth` | Scroll milestone reached |
| `time_on_page` | Time threshold reached |
| `exit_intent` | Exit intent detected |
| `assessment_start` | Assessment quiz started |
| `assessment_complete` | Assessment quiz completed |
| `chat_open` | Chat widget opened |
| `chat_message` | Chat message sent |
| `roi_calculator` | ROI calculator used |
| `whatsapp_optin` | WhatsApp opt-in |
| `referral_click` | Referral link clicked |
| `cta_click` | Call-to-action clicked |
| `return_visit` | Returning visitor detected |
| `pricing_view` | Pricing page viewed |
| `email_captured` | Email address captured |
| `phone_captured` | Phone number captured |
| `hero_impression` | Hero section viewed |
| `hero_cta` | Hero CTA clicked |
| `decision_generated` | Decision engine result received |
| `funnel_step_view` | Funnel step page viewed |

---

### POST /api/decision

Edge experience personalization decision. Returns hero experience variants and recommended funnel blueprints based on visitor profile.

**Auth:** None

**Request body:**

```json
{
  "visitorId": "visitor-abc-123",
  "scores": { "engagement": 45, "intent": 30, "composite": 38 },
  "capturedEmail": "jane@example.com",
  "assessmentCompleted": false,
  "roiCalculatorUsed": true,
  "chatEngaged": false,
  "whatsappOptIn": false,
  "sessions": 2,
  "pagesViewed": ["/", "/services", "/pricing"],
  "nicheInterest": "construction",
  "funnelStage": "engaged",
  "referralSource": "google",
  "utmSource": "google",
  "utmMedium": "cpc"
}
```

**Response (200):**

```json
{
  "success": true,
  "hero": { "headline": "...", "subhead": "...", "cta": "...", "variant": "..." },
  "blueprint": { "id": "...", "family": "...", "steps": ["..."] }
}
```

---

### GET /api/dashboard/metrics

Dashboard metrics aggregated from AITable records.

**Auth:** Dashboard secret (Bearer token) or same-origin request.

**Response (200):**

```json
{
  "success": true,
  "generatedAt": "2026-01-15T09:30:00.000Z",
  "summary": {
    "totalRecords": 500,
    "leadsToday": 12,
    "leadsThisWeek": 45,
    "hotLeads": 8,
    "converted": 15,
    "conversionRate": 3,
    "nurtureActive": 20,
    "errors": 2
  },
  "nurtureFunnel": { "NURTURE-DAY-0": 10, "NURTURE-DAY-2": 8 },
  "topNiches": [{ "name": "construction", "total": 50, "converted": 5, "conversionRate": 10, "hotLeads": 3 }],
  "topIntakeSources": [{ "source": "contact_form", "count": 30 }],
  "topBehavioralSignals": [{ "event": "cta_click", "count": 120 }],
  "topBlueprints": [{ "name": "qualification-construction", "count": 25 }],
  "traceCoverage": { "sessionRate": 85, "leadKeyRate": 70, "experimentRate": 30, "blueprintRate": 60 },
  "statusBreakdown": { "LEAD-CAPTURED": 100, "CONVERTED": 15, "NURTURE-DAY-2": 8 }
}
```

---

### POST /api/intelligence/analyze

Analyze a website to extract business profile, funnel strategy, and design attributes.

**Auth:** None

**Request body:**

```json
{
  "url": "https://example-plumbing.com",
  "html": ""
}
```

Provide either `url` (the endpoint fetches the HTML) or `html` (raw HTML string).

**Response (200):**

```json
{
  "success": true,
  "analysis": {
    "business": { "...": "..." },
    "funnel": { "...": "..." },
    "design": { "...": "..." },
    "architecture": { "...": "..." }
  },
  "manifest": { "...": "Lead OS configuration manifest" }
}
```

---

### POST /api/intelligence/manifest

Generate a Lead OS manifest from a pre-computed website analysis.

**Auth:** None

**Request body:**

```json
{
  "analysis": { "business": { "..." }, "funnel": { "..." }, "design": { "..." }, "architecture": { "..." } },
  "input": { "url": "https://example.com" }
}
```

**Response (200):**

```json
{
  "success": true,
  "manifest": { "...": "Lead OS configuration manifest" },
  "envExample": "LEAD_OS_TENANT_ID=...\nNEXT_PUBLIC_BRAND_NAME=..."
}
```

---

### GET /api/automations/health

Integration health and full automation catalog for the edge layer.

**Auth:** None

**Response (200):**

```json
{
  "status": "healthy",
  "summary": {
    "totalRoutes": 25,
    "serviceRoutes": 15,
    "lifecycleRoutes": 5,
    "intelligenceRoutes": 3,
    "systemRoutes": 2,
    "scenarioScripts": 8
  },
  "integrations": {
    "suiteDash": { "configured": true, "connected": true, "status": "healthy" },
    "emailit": { "configured": true, "status": "ready" },
    "aitable": { "configured": true, "status": "ready" }
  },
  "automations": [
    {
      "name": "Construction Lead Intake",
      "slug": "construction",
      "category": "service",
      "method": "POST",
      "route": "/api/automations/construction",
      "dependencies": ["suiteDash", "emailit", "aitable"],
      "description": "...",
      "ready": true
    }
  ],
  "warnings": []
}
```

---

### POST /api/automations/convert

Convert a lead to a client. Updates SuiteDash role, creates a project, sends kickoff email, and logs to AITable.

**Auth:** None

**Request body:**

```json
{
  "email": "jane@example.com",
  "firstName": "Jane",
  "lastName": "Doe",
  "company": "Acme Corp",
  "phone": "+1234567890",
  "scenario": "process-automation",
  "projectTemplate": "standard-onboarding",
  "dealValue": 5000
}
```

**Response (200):**

```json
{
  "success": true,
  "automation": "convert",
  "results": {
    "suitedash": { "success": true, "uid": "company-uid-123" },
    "project": { "success": true },
    "kickoffEmail": { "success": true },
    "aitable": { "success": true }
  },
  "message": "Acme Corp converted to client"
}
```

---

### POST /api/automations/:niche

Niche-specific automation endpoints. Available niches include: `business-intelligence`, `church-management`, `client-portal`, `compliance-productized`, `compliance-training`, `construction`, `creator-management`, `digital-transformation`, `franchise`, `immigration-law`, `managed-services`, `process-automation`, `re-syndication`, `staffing`, `systems-integration`, `training-platform`.

Each endpoint accepts a lead payload and runs the niche-specific automation sequence (CRM sync, email, notifications, AITable logging).

---

## Error Codes

| HTTP Status | Meaning |
|-------------|---------|
| 200 | Success |
| 202 | Accepted (tracking events from bots are skipped) |
| 400 | Bad request (malformed body, missing required fields) |
| 401 | Unauthorized (missing or invalid session/token) |
| 404 | Not found (unknown workflow slug, unknown niche) |
| 429 | Rate limit exceeded |
| 500 | Internal server error |
| 502 | Bad gateway (upstream provider error, e.g., SuiteDash API failure) |
| 503 | Service unavailable (n8n not configured for provisioning) |

## Rate Limiting

Rate limiting is applied on the edge layer (`neatcircle-beta`):

| Endpoint | Limit | Window |
|----------|-------|--------|
| `POST /api/intake` | 20 requests | 60 seconds |
| `POST /api/track` | 120 requests | 60 seconds |

Rate limiting is per-IP. Exceeding the limit returns `429 Too Many Requests`.

The kernel runtime does not apply rate limiting directly. Use a reverse proxy or API gateway for production rate limiting on the runtime.

## CORS Configuration

The kernel runtime applies CORS headers based on `LEAD_OS_WIDGET_ORIGINS`:

- If `LEAD_OS_WIDGET_ORIGINS` is set (comma-separated list), only those origins receive a matching `Access-Control-Allow-Origin` header.
- If `LEAD_OS_WIDGET_ORIGINS` is empty, `Access-Control-Allow-Origin: *` is returned (open CORS).
- Allowed methods: `GET`, `POST`, `OPTIONS`.
- Allowed headers: `Content-Type`, `Authorization`.

All CORS-protected endpoints support `OPTIONS` preflight requests, returning `204 No Content` with the appropriate headers.
