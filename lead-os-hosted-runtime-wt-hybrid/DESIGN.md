# Lead OS Design Contract

This file is the product and interface contract for Lead OS. It is inspired by the open-source DESIGN.md practice used by Google projects: every future page, component, workflow, and agent-generated change should be checked against this document before shipping.

## Product Truth

Lead OS is not a generic website builder, CRM, or strategy report. Lead OS is a production system for operators who sell lead-generation packages to clients.

The simplest promise is:

1. The operator sells a specific lead system package.
2. The paying client fills out one setup form.
3. Lead OS provisions the live intake page, embed, routing rules, dashboard, reports, and credential checklist for that package.
4. External providers such as CRM, Stripe, SMS, email, webhooks, and calendars activate only when the required credentials exist.

Every public page must make this promise obvious.

## Primary Audiences

### Operator

The operator is the person using Lead OS to sell and fulfill lead systems. They may be an agency, consultant, lead seller, directory owner, franchise operator, SaaS founder, or partner program owner.

Primary question: "Can I sell this and have the system fulfill it without manual rebuilding?"

### Paying Client

The paying client buys the lead system from the operator. They provide business details, offer details, target market, operator email, domain, and optional integration credentials.

Primary question: "What exactly do I receive after I pay and fill out the form?"

### Lead

The lead is the end user who submits an intake page or embedded form. They need a clear path to request help, book, qualify, claim, or convert.

Primary question: "Is this the right place to ask for the outcome I need?"

## Core Journey

The interface should consistently expose this path:

1. Choose a sellable package.
2. Create or use an operator account.
3. Collect the client's required setup details.
4. Provision the package workspace.
5. Share the intake page or install the embed.
6. Monitor leads, routing, reporting, revenue, and missing credentials.

Any page that introduces a new concept must connect it back to this journey.

## Design Principles

### Plain Operational Clarity

Lead OS should feel like an operator control room: calm, explicit, useful, and ready to work. Avoid vague platform language. Prefer concrete nouns: package, setup form, intake page, embed, routing, dashboard, report, credential, workspace.

### Outcome Before Feature

Every feature should be explained through the user outcome it creates. For example, do not say "AI orchestration"; say "Lead OS routes new leads, flags urgent ones, and tells the operator what to do next."

### No Manual Fulfillment Confusion

If something launches automatically, say so. If something needs credentials, say so. Do not imply CRM sync, Stripe billing, live SMS, or external automation is active without credentials.

### Mobile First

The user must be able to assess the offer from a phone. First viewport content must answer:

- Who is this for?
- What is delivered?
- What do I click next?
- What still needs credentials?

### Honest Production Copy

Marketing copy must match backend behavior. If a deliverable is represented in `src/lib/package-catalog.ts`, it can be sold and shown. If a provider requires secrets or third-party setup, the page must call that out.

## Visual System

### Tone

Use a quiet SaaS/admin visual language: white or near-white surfaces, clear borders, restrained color, readable density, and direct labels.

Avoid oversized decorative hero sections, gradient blobs, ornamental illustrations, vague "future of business" language, nested cards, and generic AI spectacle.

### Layout

- Use full-width bands for major sections.
- Use constrained inner content at `max-w-6xl`.
- Use cards for repeated items, dashboards, plans, package tiles, and status panels.
- Do not put cards inside cards.
- Keep first screen compact enough that the next section is hinted on common mobile and desktop viewports.
- Use predictable two-column layouts only when the right side is functional content, such as status, checklist, preview, or launch path.

### Typography

- Letter spacing must be `0`.
- Do not scale font sizes with viewport width.
- Use strong but compact headings.
- Use smaller headings inside panels and dashboards.
- Paragraphs should be short, direct, and tied to the next user action.

### Color

The default palette is neutral with selective accent:

- Background: white or very light neutral.
- Text: near-black.
- Muted text: slate gray.
- Primary action: indigo.
- Success: green.
- Warning or credential-required state: amber.
- Informational operational panels: slate, blue, or teal used sparingly.

No page should read as a single-hue purple, beige, dark blue, or orange theme.

### Radius And Shadows

- Cards and panels: 8px radius unless inherited components require otherwise.
- Buttons and inputs: 8px radius.
- Use subtle borders before shadows.
- Use shadows only for elevated overlays or important panels.

## Component Rules

### Header

Navigation must prioritize:

1. Packages
2. Pricing
3. Production readiness or dashboard
4. Account setup

Labels must be understandable without insider context.

### Hero Or First Screen

The first screen should behave like a launch console, not an abstract landing page. It should include:

- One literal headline.
- One plain-language paragraph.
- Primary action to view packages or start setup.
- A compact "what gets launched" or "launch path" surface.
- A credential note if external tools are mentioned.

### Package Cards

Each package card must show:

- Customer outcome.
- Buyer persona.
- Number of built pieces.
- Plans where it is available.
- A clear launch action.

### Setup Forms

Forms must explain why each field is needed. Required fields must be visually and semantically clear. Sensitive credential fields must state what turns on when the credential exists.

### Status Panels

Status panels must separate:

- Ready now.
- Credential required.
- Misconfigured.
- Failed.
- Queued or retrying.

Do not use celebratory success states when important provider credentials are missing.

### Dashboards

Dashboards should privilege scanning:

- Counts first.
- Then queues or urgent actions.
- Then revenue and attribution.
- Then configuration gaps.

Avoid marketing copy inside operator dashboards.

## Content Rules

Use this structure for public copy:

1. Who it is for.
2. What they sell or buy.
3. What Lead OS creates.
4. What the user does next.
5. What requires external credentials.

Preferred words:

- "Lead system package"
- "Client setup form"
- "Provision"
- "Launch"
- "Intake page"
- "Embed"
- "Routing"
- "Operator dashboard"
- "Reports"
- "Credential checklist"

Avoid:

- "All-in-one growth platform"
- "AI-powered ecosystem"
- "Manifest"
- "Workflow only"
- "Demo" when the page is only a preview
- Claims that imply third-party integrations are live without credentials

## Open Source Design References

Use these references as working material, not as visual skins:

- Google-style DESIGN.md: one source of truth for product intent, interface behavior, and contributor decisions.
- Material Design 3: accessibility, states, density, and motion discipline.
- IBM Carbon: enterprise dashboard structure, status language, tables, and admin density.
- GitHub Primer: documentation UX, developer surfaces, and predictable navigation.
- Shopify Polaris: merchant/admin setup flows, onboarding clarity, and operational settings.
- GOV.UK Design System and USWDS: plain-language forms, error handling, and public-service clarity.
- Radix UI and shadcn/ui: accessible primitives and composable React components.

## Accessibility

- Every form control needs a label.
- Every button label must explain the action.
- Touch targets should be at least 44px high.
- Do not rely on color alone for status.
- Use semantic lists, headings, tables, and regions.
- Maintain visible focus states.

## Motion

Motion is functional only: loading, progress, disclosure, and status change. Decorative animation should not be used on core pages.

## Agent Instructions

Any AI agent editing this repository must:

1. Read this file before changing public pages, dashboards, onboarding, package flows, or docs.
2. Keep copy aligned with backend-delivered artifacts.
3. Preserve the core journey from package choice to provisioned workspace.
4. Verify mobile layout before deployment.
5. Deploy only after build and critical checks pass.
