# Audience and Messaging Audit

Date: 2026-05-01

## Positioning Decision

Lead OS is a B2B solution-fulfillment platform.

The paying audience is a business operator: agencies, consultants, founders, SaaS teams, franchises, lead sellers, service providers, and internal teams that sell or operate client outcomes.

Some launched solutions are B2B2C because the client business's own audience interacts with a downstream surface such as a capture page, booking flow, lead form, marketplace inventory, course, nurture sequence, ad, or content experience.

Lead OS should not be positioned as a standalone B2C consumer product.

## Role Definitions

Business buyer or operator:
The person or team paying for Lead OS capacity and operating the fulfillment system.

Client business:
The business receiving the launched solution, delivery hub, reporting, outputs, and handoffs.

Downstream audience:
The client business's leads, customers, patients, shoppers, applicants, students, partners, or prospects. They only appear in B2B2C solutions.

## Audit Findings

The public site previously mixed the words customer, buyer, client, operator, package, workspace, and credential in ways that made the product feel like it might be speaking to different audiences on different pages.

The largest confusion points were:

- Pricing used "end customer" to mean the client business, while other pages used customer to mean the downstream lead.
- Offers said "the customer wants buyers to act," which blurred the buyer and end-user roles.
- Onboarding used workspace and credentials language before explaining the business role.
- Industry and resource pages overused "package" when the user-facing promise is a complete solution.
- Solution examples did not consistently label which pieces are B2B versus B2B2C.

## Fixes Applied

- Added a shared package audience contract in `src/lib/package-catalog.ts`.
- Updated home, pricing, packages, package detail, deliverables, offers, onboarding, industries, directory, marketplace, calculator, resources, persona pages, demo, and production copy.
- Reframed packages as complete solutions while keeping the existing `/packages` route for compatibility.
- Added B2B and B2B2C labels where buyers compare solution options.
- Replaced "credentials" in customer-facing onboarding copy with "account access" where the meaning is external account approval.
- Softened guarantee language on offer pages so the site does not imply unreviewed legal or financial promises.

## Copy Rules Going Forward

- Use "business buyer" or "operator" for the paying user.
- Use "client business" for the business receiving the solution.
- Use "downstream audience" when leads or customers experience a B2B2C surface.
- Use "solution" in marketing copy; reserve "package" for route names, code names, and internal compatibility.
- Use "account access" for external provider connection requests.
- Do not call Lead OS a B2C app.
