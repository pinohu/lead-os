# Erie.Pro ConvertBox Full Draft Audit

Date: 2026-05-10

Source: fresh authenticated ConvertBox API snapshots saved under `audit-snapshots/`.

## Overall Verdict

The 10 ConvertBox drafts are now suitable for preview and stakeholder review, but they are not ready for activation. They have meaningful service-family journeys, branching, profile photos, trust rows, and Erie County-focused copy. Remaining work is visual/mobile QA inside the ConvertBox editor, test submissions, and per-service/subservice expansion.

## High-Level Findings

- The drafts are structurally much stronger than the first shells: service-family routing, branching, photos, trust rows, and inactive status are all present.
- The main residual risk is visual fidelity inside the live ConvertBox canvas: API data confirms the elements, but final activation still requires manual visual/mobile preview.
- The current avatar graphics are functional service-family badges, not polished photography. They solve the empty photo icon problem, but can be upgraded to branded human/team or service imagery later.
- The drafts still use family-level routing, not true per-service/per-subservice flows for all 112 services. They are good preview templates, not the final exhaustive service matrix.

## UX/UI Verdict

The drafts now behave like useful guided mini-journeys instead of generic popup forms. The first screen asks a family-specific question, offers three clear paths, includes a low-pressure fallback, and postpones contact capture until the visitor has given context. This is a major improvement for trust and completion.

The UI system is coherent enough for preview: each family has a label, avatar, trust row, Erie.Pro profile identity, and button choices that signal the type of help being requested. The experience should feel more professional than the earlier text-only drafts.

The remaining design concern is polish, not structure. The current avatars are clean functional SVG badges. They fix the blank photo icons, but they are not yet a premium branded image system. Before full deployment, the best upgrade would be custom Erie.Pro team/concierge portraits or polished service-family illustrations that match the site.

## Conversion Psychology Verdict

The strongest conversion improvement is the addition of a third "not sure / help me choose" path. That matters because many Erie.Pro visitors will not know whether they need plumbing vs drain cleaning, snow removal vs de-icing, legal vs financial help, or an appointment vs consultation. The boxes now reduce anxiety instead of punishing uncertainty.

The emergency boxes are appropriately shorter and direct. The health and professional boxes include privacy/sensitive-detail language. The project boxes gather planning context before pushing for contact. The provider box correctly avoids promising territory before review.

## Journey Verdict

These drafts are appropriate as family-level previews and early launch templates. They are not yet the final 112-service journey system. The next journey layer should duplicate or specialize these family templates for the highest-intent service pages first: plumbing, HVAC, roofing, snow removal, cleaning/turnover, planned remodels, mental health, funeral homes, legal, and provider claims.

## Audit Scorecard

- Boxes audited: 10
- Total issues/risks found: 0
- All boxes inactive: yes
- All boxes have six steps: yes
- All boxes have profile photos: yes
- All boxes have teaser photos: yes

## EP-F04 Cleaning And Turnover - Draft Preview

- Box id: `232594`
- Family: `Cleaning And Turnover`
- Active: `false`
- Profile photo: `erie-pro-cleaning-and-turnover.svg`
- Teaser photo: `erie-pro-cleaning-and-turnover.svg`

Steps:

- What needs to be handled?
- Tell us the size or scope
- When does it need to be ready?
- Where should a pro follow up?
- Not ready yet?
- Request received

First-step choice buttons:

- [spark] Cleaning or turnover
- [box] Moving, junk, or dumpster
- [?] Not sure which cleaning path fits

Strengths:

- Inactive draft state is preserved.
- Service-family metadata matches the intended family.
- Uses six native ConvertBox steps.
- ConvertBox Steps drawer onboarding flag is disabled.
- Branching lessons metadata is present.
- Professional visual-system metadata is present.
- Profile-photo metadata is present.
- Profile photo is attached.
- Teaser photo is attached.
- Trust row markup is present.
- First step has multiple choice buttons.
- Includes a low-pressure alternate path.
- Contains form capture elements.
- Has contact capture.
- No targeted 30-mile/radius copy found.
- No mobile font below 12px found.
- Button configured amount matches populated button text counts.
- Uses specific page targeting.

Issues / risks:

- No structural issue found in JSON audit.

## EP-F01 Emergency Home Response - Draft Preview

- Box id: `232595`
- Family: `Emergency Home Response`
- Active: `false`
- Profile photo: `erie-pro-emergency-home-response.svg`
- Teaser photo: `erie-pro-emergency-home-response.svg`

Steps:

- Choose the urgent issue
- Tell us the risk
- Add location context
- Share contact details
- Not ready yet?
- Urgent request received

First-step choice buttons:

- [!] Leak, backup, no heat, or no power
- [phone] Lockout, towing, or access issue
- [?] Help me choose the urgent path

Strengths:

- Inactive draft state is preserved.
- Service-family metadata matches the intended family.
- Uses six native ConvertBox steps.
- ConvertBox Steps drawer onboarding flag is disabled.
- Branching lessons metadata is present.
- Professional visual-system metadata is present.
- Profile-photo metadata is present.
- Profile photo is attached.
- Teaser photo is attached.
- Trust row markup is present.
- First step has multiple choice buttons.
- Includes a low-pressure alternate path.
- Contains form capture elements.
- Has contact capture.
- No targeted 30-mile/radius copy found.
- No mobile font below 12px found.
- Button configured amount matches populated button text counts.
- Uses specific page targeting.

Issues / risks:

- No structural issue found in JSON audit.

## EP-F02 Planned Home Projects - Draft Preview

- Box id: `232596`
- Family: `Planned Home Projects`
- Active: `false`
- Profile photo: `erie-pro-planned-home-projects.svg`
- Teaser photo: `erie-pro-planned-home-projects.svg`

Steps:

- What are you planning?
- How far along are you?
- Share the project scope
- Add timing and contact
- Not ready yet?
- Project request received

First-step choice buttons:

- [tool] Repair or replacement
- [home] Remodel or build
- [?] Help me scope the project first

Strengths:

- Inactive draft state is preserved.
- Service-family metadata matches the intended family.
- Uses six native ConvertBox steps.
- ConvertBox Steps drawer onboarding flag is disabled.
- Branching lessons metadata is present.
- Professional visual-system metadata is present.
- Profile-photo metadata is present.
- Profile photo is attached.
- Teaser photo is attached.
- Trust row markup is present.
- First step has multiple choice buttons.
- Includes a low-pressure alternate path.
- Contains form capture elements.
- Has contact capture.
- No targeted 30-mile/radius copy found.
- No mobile font below 12px found.
- Button configured amount matches populated button text counts.
- Uses specific page targeting.

Issues / risks:

- No structural issue found in JSON audit.

## EP-F01 Emergency Home Response - Draft Preview

- Box id: `232597`
- Family: `Emergency Home Response`
- Active: `false`
- Profile photo: `erie-pro-emergency-home-response.svg`
- Teaser photo: `erie-pro-emergency-home-response.svg`

Steps:

- What happened?
- Is there active damage or risk?
- Where do you need help?
- How should we reach you?
- Not ready yet?
- Request received

First-step choice buttons:

- [!] Water, heat, power, or storm
- [phone] Lockout, access, or roadside
- [?] Not sure what counts as urgent

Strengths:

- Inactive draft state is preserved.
- Service-family metadata matches the intended family.
- Uses six native ConvertBox steps.
- ConvertBox Steps drawer onboarding flag is disabled.
- Branching lessons metadata is present.
- Professional visual-system metadata is present.
- Profile-photo metadata is present.
- Profile photo is attached.
- Teaser photo is attached.
- Trust row markup is present.
- First step has multiple choice buttons.
- Includes a low-pressure alternate path.
- Contains form capture elements.
- Has contact capture.
- No targeted 30-mile/radius copy found.
- No mobile font below 12px found.
- Button configured amount matches populated button text counts.
- Uses specific page targeting.

Issues / risks:

- No structural issue found in JSON audit.

## EP-F02 Planned Home Projects - Draft Preview

- Box id: `232598`
- Family: `Planned Home Projects`
- Active: `false`
- Profile photo: `erie-pro-planned-home-projects.svg`
- Teaser photo: `erie-pro-planned-home-projects.svg`

Steps:

- Choose the project type
- Tell us your planning stage
- Add scope details
- Share contact details
- Not ready yet?
- Project request received

First-step choice buttons:

- [tool] Kitchen, bath, basement, or remodel
- [home] Roof, siding, windows, or exterior
- [?] Help me compare project options

Strengths:

- Inactive draft state is preserved.
- Service-family metadata matches the intended family.
- Uses six native ConvertBox steps.
- ConvertBox Steps drawer onboarding flag is disabled.
- Branching lessons metadata is present.
- Professional visual-system metadata is present.
- Profile-photo metadata is present.
- Profile photo is attached.
- Teaser photo is attached.
- Trust row markup is present.
- First step has multiple choice buttons.
- Includes a low-pressure alternate path.
- Contains form capture elements.
- Has contact capture.
- No targeted 30-mile/radius copy found.
- No mobile font below 12px found.
- Button configured amount matches populated button text counts.
- Uses specific page targeting.

Issues / risks:

- No structural issue found in JSON audit.

## EP-F07 Health And Wellness Appointments - Draft Preview

- Box id: `232599`
- Family: `Health And Wellness Appointments`
- Active: `false`
- Profile photo: `erie-pro-health-and-wellness-appointments.svg`
- Teaser photo: `erie-pro-health-and-wellness-appointments.svg`

Steps:

- What kind of appointment?
- Tell us the care type
- Choose a contact window
- Share contact details
- Review your request
- Appointment request received

First-step choice buttons:

- [cal] Dental, vision, skin, hearing, or therapy
- [pet] Pet care or grooming
- [?] I want help choosing privately

Strengths:

- Inactive draft state is preserved.
- Service-family metadata matches the intended family.
- Uses six native ConvertBox steps.
- ConvertBox Steps drawer onboarding flag is disabled.
- Branching lessons metadata is present.
- Professional visual-system metadata is present.
- Profile-photo metadata is present.
- Profile photo is attached.
- Teaser photo is attached.
- Trust row markup is present.
- First step has multiple choice buttons.
- Includes a low-pressure alternate path.
- Contains form capture elements.
- Has contact capture.
- Sensitive-service privacy language is present.
- No targeted 30-mile/radius copy found.
- No mobile font below 12px found.
- Button configured amount matches populated button text counts.
- Uses specific page targeting.

Issues / risks:

- No structural issue found in JSON audit.

## EP-F08 Professional Legal And Financial - Draft Preview

- Box id: `232600`
- Family: `Professional Legal And Financial`
- Active: `false`
- Profile photo: `erie-pro-professional-legal-and-financial.svg`
- Teaser photo: `erie-pro-professional-legal-and-financial.svg`

Steps:

- What kind of help?
- Is there a deadline?
- Share a brief summary
- Choose contact preference
- Review your request
- Consultation request received

First-step choice buttons:

- [doc] Legal, tax, insurance, or financial
- [home] Real estate, inspection, or mortgage
- [?] Help me choose the right professional

Strengths:

- Inactive draft state is preserved.
- Service-family metadata matches the intended family.
- Uses six native ConvertBox steps.
- ConvertBox Steps drawer onboarding flag is disabled.
- Branching lessons metadata is present.
- Professional visual-system metadata is present.
- Profile-photo metadata is present.
- Profile photo is attached.
- Teaser photo is attached.
- Trust row markup is present.
- First step has multiple choice buttons.
- Includes a low-pressure alternate path.
- Contains form capture elements.
- Has contact capture.
- Sensitive-service privacy language is present.
- No targeted 30-mile/radius copy found.
- No mobile font below 12px found.
- Button configured amount matches populated button text counts.
- Uses specific page targeting.

Issues / risks:

- No structural issue found in JSON audit.

## EP-F09 Provider Territory Claim - Draft Preview

- Box id: `232601`
- Family: `Provider Territory Claim`
- Active: `false`
- Profile photo: `erie-pro-provider-territory-claim.svg`
- Teaser photo: `erie-pro-provider-territory-claim.svg`

Steps:

- What service do you provide?
- Where do you serve?
- Tell us about the business
- Add owner contact
- Review territory interest
- Claim request received

First-step choice buttons:

- [home] Home or property service
- [brief] Health, professional, or appointment service
- [?] Help classify my service

Strengths:

- Inactive draft state is preserved.
- Service-family metadata matches the intended family.
- Uses six native ConvertBox steps.
- ConvertBox Steps drawer onboarding flag is disabled.
- Branching lessons metadata is present.
- Professional visual-system metadata is present.
- Profile-photo metadata is present.
- Profile photo is attached.
- Teaser photo is attached.
- Trust row markup is present.
- First step has multiple choice buttons.
- Includes a low-pressure alternate path.
- Contains form capture elements.
- Has contact capture.
- No targeted 30-mile/radius copy found.
- No mobile font below 12px found.
- Button configured amount matches populated button text counts.
- Uses specific page targeting.

Issues / risks:

- No structural issue found in JSON audit.

## EP-F10 Returning And Exit Rescue - Draft Preview

- Box id: `232602`
- Family: `Returning And Exit Rescue`
- Active: `false`
- Profile photo: `erie-pro-returning-and-exit-rescue.svg`
- Teaser photo: `erie-pro-returning-and-exit-rescue.svg`

Steps:

- What got in the way?
- What service were you looking for?
- Pick the better next step
- Leave a contact option
- Review your request
- Saved for follow-up

First-step choice buttons:

- [?] Not sure which service fits
- [$] Still comparing price or providers
- [phone] Need help today

Strengths:

- Inactive draft state is preserved.
- Service-family metadata matches the intended family.
- Uses six native ConvertBox steps.
- ConvertBox Steps drawer onboarding flag is disabled.
- Branching lessons metadata is present.
- Professional visual-system metadata is present.
- Profile-photo metadata is present.
- Profile photo is attached.
- Teaser photo is attached.
- Trust row markup is present.
- First step has multiple choice buttons.
- Includes a low-pressure alternate path.
- Contains form capture elements.
- Has contact capture.
- No targeted 30-mile/radius copy found.
- No mobile font below 12px found.
- Button configured amount matches populated button text counts.
- Uses specific page targeting.

Issues / risks:

- No structural issue found in JSON audit.

## EP-F10 Returning And Exit Rescue - Draft Preview

- Box id: `232603`
- Family: `Returning And Exit Rescue`
- Active: `false`
- Profile photo: `erie-pro-returning-and-exit-rescue.svg`
- Teaser photo: `erie-pro-returning-and-exit-rescue.svg`

Steps:

- What were you working on?
- What changed?
- Choose the next step
- Confirm contact details
- Review your request
- We will help from here

First-step choice buttons:

- [?] Finish a service request
- [$] Ask about price or timing
- [phone] Request a callback

Strengths:

- Inactive draft state is preserved.
- Service-family metadata matches the intended family.
- Uses six native ConvertBox steps.
- ConvertBox Steps drawer onboarding flag is disabled.
- Branching lessons metadata is present.
- Professional visual-system metadata is present.
- Profile-photo metadata is present.
- Profile photo is attached.
- Teaser photo is attached.
- Trust row markup is present.
- First step has multiple choice buttons.
- Includes a low-pressure alternate path.
- Contains form capture elements.
- Has contact capture.
- No targeted 30-mile/radius copy found.
- No mobile font below 12px found.
- Button configured amount matches populated button text counts.
- Uses specific page targeting.

Issues / risks:

- No structural issue found in JSON audit.

## Required Before Activation

- Open every box in the ConvertBox visual editor and preview desktop and mobile.
- Confirm profile photos render, not only exist in JSON.
- Click through each step path, including alternate/no-path choices.
- Submit test leads for each family and confirm payload routing.
- Confirm no box appears immediately on public pages except direct CTA click flows.
- Confirm suppression rules and page targeting against live Erie.Pro URLs.
- Replace functional SVG badges with more polished branded/person/service imagery if the preview still feels too plain.
- Expand from family-level templates into service/subservice variants for highest-priority Erie.Pro services before full deployment.
