# Erie.Pro ConvertBox Copy And Persona Audit

Date: 2026-05-10

Source: latest authenticated ConvertBox draft snapshots in `audit-snapshots/` after pseudo-icon removal.

## Verdict

The current ConvertBox drafts are mechanically complete but not copy-complete. They are much better than the earlier shells, but several strings still sound like internal routing, product taxonomy, or developer explanation rather than a calm Erie.Pro concierge speaking to a real visitor.

Do not activate these boxes as final customer-facing copy yet.

## Main Copy Problems

### 1. Internal taxonomy is visible to visitors

Examples found:

- `Emergency Home Response`
- `Planned Home Projects`
- `Provider Territory Claim`
- `Returning And Exit Rescue`
- `Professional Legal And Financial`

Problem: these are useful internal family names, but they are stiff on-screen labels. A visitor wants to know, "Can you help me with my leak, appointment, estimate, or business listing?" not "which funnel family am I in?"

Rule: keep taxonomy in metadata, not visitor copy.

### 2. The helper chips read like product notes

Current chip row:

- `Private request`
- `Erie County focused`
- `One routed path`

Problem: `One routed path` sounds like operations language. It may reassure us, but it does not sell the visitor on comfort, speed, or control.

Better pattern:

- `Private until you submit`
- `Erie County only`
- `One clear next step`

For urgent flows, remove the chip row if it slows comprehension.

### 3. Routing language is overused

Examples found:

- `route urgent jobs`
- `Where should help be routed?`
- `right lane`
- `category review`
- `Help classify my service`
- `provider family`
- `Category and territory fit will be reviewed`

Problem: visitors are not trying to route a record. They are trying to get help, protect their time, avoid embarrassment, or make a good decision.

Better language:

- `send this to the right local pro`
- `help us point you to the right service`
- `check whether your category is open`
- `we will review your service area and follow up`

### 4. Some copy speaks about Erie.Pro instead of to the visitor

Examples found:

- `How should Erie.Pro help next?`
- `What should Erie.Pro do next?`
- `Who should Erie.Pro contact?`

Problem: this feels like a support workflow. ConvertBox should feel like a person helping the visitor complete the next step.

Better language:

- `What would you like help with next?`
- `Choose the easiest next step.`
- `Who is the best person to contact?`

### 5. The 112-service reality is still compressed too far

The drafts are family-level templates. They do not yet speak directly enough to live service contexts like plumbing, funeral homes, mental health counseling, vacation rental cleaning, snow plowing, dock repair, estate sale services, or hearing aids.

Problem: a visitor arriving from `/mental-health-counseling`, `/funeral-homes`, `/snow-removal`, or `/drain-cleaning` should see words that prove Erie.Pro understands that specific situation.

Rule: each box should support service-page variants using the page/service context. The family-level copy can be the fallback, not the primary experience.

### 6. Sensitive services need a warmer register

Affected families:

- Health and wellness appointments.
- Professional, legal, and financial.
- Funeral homes.
- Senior care and home health.
- Mental health counseling.
- Estate sale services.

Problem: the copy is careful, but still somewhat procedural. Sensitive visitors need privacy, control, and respect before efficiency.

Better tone:

- `Share only what you are comfortable sharing here.`
- `A brief note is enough.`
- `We will keep this focused on finding the right next conversation.`
- `For urgent danger or medical emergency, call emergency services first.`

### 7. Button labels are mostly categories, not visitor actions

Examples found:

- `Repair or replacement`
- `Remodel or build`
- `Cleaning or turnover`
- `Legal, tax, insurance, or financial`

Problem: category buttons are acceptable, but higher-converting buttons often mirror the visitor's intent.

Better pattern:

- `I need a repair`
- `I am planning a remodel`
- `I need cleaning or turnover help`
- `I need legal, tax, or money help`

## Box-by-Box Findings

### 232597 and 232595: Emergency Home Response

Current strength: shortest path, phone-first logic, 911 warning in one variant, Erie County location context.

Copy concerns:

- `Emergency Home Response` is an internal category label.
- `right lane` and `routed` are operational.
- `Where should help be routed?` should be more human.
- `Keep your phone nearby` is good and should remain.

Recommended rewrite direction:

- Headline: `Need urgent local help?`
- Body: `Tell us what happened and where you are in Erie County. If anyone is in immediate danger, call 911 first.`
- Step label: `What happened?`
- Location step: `Where is the help needed?`
- Contact step: `What is the fastest safe way to reach you?`
- Confirmation: `Thanks. Keep your phone nearby while the request is sent through the right Erie County service path.`

### 232596 and 232598: Planned Home Projects

Current strength: correctly asks stage, scope, timing, constraints, and contact preference.

Copy concerns:

- `project family` sounds internal.
- `How should Erie.Pro help next?` is brand-centered.
- `The request is more specific than a generic project quote` is accurate but not emotionally satisfying.

Recommended rewrite direction:

- Headline: `Planning a home project?`
- Body: `Share the scope so the first conversation starts prepared.`
- Step label: `What are you planning?`
- Decision step: `Where are you in the decision?`
- Guidance step: `What would make the next step easier?`
- Confirmation: `Thanks. Your scope, timing, and constraints are ready for a more useful Erie County provider conversation.`

### 232594: Cleaning And Turnover

Current strength: timing, access, size, and job type fit the persona well.

Copy concerns:

- `Cleaning And Turnover` is okay internally but awkward as a visible label.
- `Start with the work type so we can ask the right timing question` sounds like form logic.
- The copy should emphasize readiness: move-out, guest-ready, office-ready, or haul-away.

Recommended rewrite direction:

- Headline: `What needs to be ready?`
- Body: `Tell us what needs cleaning, moving, hauling, or turning over and when it has to be done.`
- Button: `I need cleaning or turnover help`
- Button: `I need moving, junk, or dumpster help`
- Confirmation: `Thanks. Your timing, size, and access details are ready for a useful quote.`

### 232599: Health And Wellness Appointments

Current strength: privacy-safe language exists and medical-history caution is good.

Copy concerns:

- `Health And Wellness Appointments` is too broad and clinical as a visible label.
- Pet grooming is included beside health care, which can feel odd on the same first screen.
- Mental health, senior care, home health, dental urgency, and pet care need different emotional registers.

Recommended rewrite direction:

- Headline: `Looking for an appointment?`
- Body: `Choose the closest care type. A brief note is enough here.`
- Sensitive-service body: `Share only what you are comfortable sharing. We will keep this focused on the right next conversation.`
- Pet variant: `Tell us about your pet and what kind of visit or grooming help you need.`
- Confirmation: `Thanks. Your request stays brief, private, and focused on the appointment path.`

### 232600: Professional Legal And Financial

Current strength: deadline/date question is useful; warning not to upload documents is important.

Copy concerns:

- The visible family label is stiff.
- Funeral homes and estate sales need gentler copy than financial advisors or mortgage brokers.
- `routing summary` is internal.

Recommended rewrite direction:

- Headline: `Need a local professional?`
- Body: `Tell us the type of help you need and when you would like to speak with someone.`
- Sensitive variant: `A brief note is enough. Please do not include private documents or detailed confidential facts here.`
- Step label: `What kind of help do you need?`
- Confirmation: `Thanks. The next conversation can start with the right context and a respectful pace.`

### 232601: Provider Territory Claim

Current strength: the flow asks service, territory, business, response speed, and owner contact.

Copy concerns:

- `Provider Territory Claim` is strong internally but sounds adversarial or land-grabby to a provider.
- `provider family`, `category review`, and `classify my service` sound bureaucratic.
- The first screen should sell the provider benefit before asking them to categorize themselves.

Recommended rewrite direction:

- Headline: `Serve Erie County?`
- Body: `Check whether your service category is open for local requests.`
- Button: `I provide home or property services`
- Button: `I provide health, professional, or appointment services`
- Button: `Help me choose my category`
- Step label: `Where do you serve?`
- Confirmation: `Thanks. We will review your service category and follow up about profile claim or availability.`

### 232602 and 232603: Returning And Exit Rescue

Current strength: short flows and low-pressure choices fit returning/exit behavior.

Copy concerns:

- `Returning And Exit Rescue` must not be visible to visitors.
- `What should Erie.Pro do next?` is support-ticket language.
- The flow should feel like a saved continuation, not an interruption.

Recommended rewrite direction:

- Headline: `Want to keep this moving?`
- Body: `Choose the easiest next step and we will keep it simple.`
- Button: `Help me choose the right service`
- Button: `Send me price or timing help`
- Button: `Have someone call me`
- Step label: `What would help now?`
- Confirmation: `Thanks. Your next step is saved for follow-up.`

## Activation Gate

Before activation, the boxes need a copy rewrite pass that does all of the following:

- Replaces visible internal family labels with visitor-native headlines.
- Removes or rewrites routing/product jargon.
- Converts category labels into action-oriented visitor choices where possible.
- Adds service-page variants for high-intent services from the 112-service inventory.
- Gives sensitive categories their own privacy-aware wording.
- Keeps provider-facing language benefit-led and business-owner friendly.
- Verifies desktop and mobile previews after copy changes.

## Recommended Next Pass

Create a new script that applies a copy-only rewrite to the existing inactive drafts. It should preserve the working structure, steps, targeting, photos, inactive status, and metadata while replacing only visitor-facing text.

Recommended metadata after that pass:

- `ep_persona_copy_rewrite_applied=true`
- `ep_persona_copy_rewrite_at=<timestamp>`
- `ep_persona_copy_audit_source=COPY-PERSONA-AUDIT-2026-05-10.md`

