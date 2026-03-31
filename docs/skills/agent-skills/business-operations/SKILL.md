---
name: business-operations
description: Manage LeadOS as a business platform — territory claim flow (form -> Stripe -> provider activation), lead routing with SLA timers, 3-tier premium rewards (Standard 1x, Premium 1.5x, Elite 2.5x), and perk auto-toggle on subscription changes
---

# Business Operations

**Tier:** METHODOLOGY (Tier 2)
**Category:** Business Logic & Platform Operations
**Domain:** Provider lifecycle, lead distribution, subscription management, rewards

## When to Use

Trigger this skill when:
- Modifying the territory claim or provider onboarding flow
- Changing lead routing rules or SLA timers
- Updating premium tier benefits or multipliers
- Debugging perk activation/deactivation issues
- Adding new subscription-triggered behaviors

## Territory Claim Flow

The claim flow is the primary revenue event. It follows this exact sequence:

### Step 1: Claim Form Submission
Provider selects niche + territory (zip code or neighborhood). Form validates:
- Territory is not already claimed at same tier
- Provider email is not already registered for this niche
- Selected tier pricing matches current `niches.ts` rates

### Step 2: Stripe Checkout Session
System creates a Stripe Checkout session with:
- `mode: "subscription"`
- `line_items`: tier-specific price ID from `stripe-integration.ts`
- `metadata`: `{ nicheSlug, territory, providerEmail, tier }`
- `success_url`: `/providers/welcome?session_id={CHECKOUT_SESSION_ID}`
- `cancel_url`: `/providers/signup?cancelled=true`

### Step 3: Webhook Processing
On `checkout.session.completed` webhook:
1. Extract metadata from session
2. Create provider record in database with `status: "active"`
3. Assign territory exclusivity based on tier (Elite = exclusive, others = shared)
4. Trigger perk-manager to activate tier benefits
5. Send welcome email with dashboard access link
6. Update provider count on niche listing page

### Step 4: Provider Activation
Provider is now live. Their listing appears on:
- Niche provider directory page
- Neighborhood-specific pages for claimed territory
- Search results within their niche

**Failure handling:** If webhook fails, a retry queue processes it within 5 minutes. If Stripe session expires (24hr), the claim is released and territory becomes available again.

## Lead Routing Logic

Leads (consumer inquiries) are routed through a priority cascade with SLA timers:

### Routing Cascade
```
1. Primary Provider (territory owner)
   -> 90 second SLA to acknowledge
   -> If no response...

2. Backup Provider (same niche, adjacent territory)
   -> 90 second SLA to acknowledge
   -> If no response...

3. Overflow Pool (all active providers in niche, round-robin)
   -> No SLA, first to claim wins
   -> If unclaimed after 15 minutes, marked as "missed"
```

### Lead Data Structure
Each lead contains: `consumerName`, `phone`, `email`, `nicheSlug`, `territory`, `urgency` (low/medium/high/emergency), `description`, `timestamp`

### SLA Rules
- **Standard tier**: Receives leads after 5-second delay (Premium/Elite get first look)
- **Premium tier**: Receives leads immediately, 90s SLA
- **Elite tier**: Receives leads immediately, 90s SLA, exclusive territory means no competition
- **Emergency leads** (urgency=emergency): Skip cascade, broadcast to all active providers simultaneously

## Premium Tier Benefits Matrix

| Benefit                  | Standard (1x) | Premium (1.5x) | Elite (2.5x) |
|--------------------------|---------------|-----------------|---------------|
| Monthly base fee         | 1.0x base     | 1.5x base       | 2.5x base     |
| Listing position         | Natural order  | Priority (top 3) | Featured #1   |
| Territory exclusivity    | Shared         | Shared          | Exclusive      |
| Lead routing priority    | 5s delay       | Immediate       | Immediate      |
| Review badge             | None           | "Verified Pro"  | "Elite Provider"|
| Analytics dashboard      | Basic (leads)  | Advanced (+conv) | Full (+revenue)|
| Profile customization    | Name, phone    | + Photos, bio   | + Video, certs |
| Seasonal promotion spots | None           | 2 per year      | Unlimited      |
| Dedicated support        | Email only     | Priority email   | Phone + email  |

## Perk Manager Auto-Toggle

The perk-manager service watches for subscription changes and automatically enables/disables benefits.

### Trigger Events
- `subscription.created` -- Activate all perks for purchased tier
- `subscription.updated` -- Diff old vs new tier, toggle perks accordingly
- `subscription.deleted` -- Deactivate all perks, set provider status to "inactive"
- `invoice.payment_failed` -- Set 7-day grace period, send warning email
- `invoice.payment_failed` (after grace) -- Downgrade to Standard perks, pause listing

### Toggle Behavior
On **upgrade** (e.g., Standard -> Premium):
1. Activate new perks immediately
2. Adjust lead routing priority in real-time
3. Update listing badge and position on next page rebuild
4. Log change in provider activity history

On **downgrade** (e.g., Elite -> Standard):
1. Remove higher-tier perks at end of current billing period
2. Release territory exclusivity immediately (Elite -> shared)
3. Adjust lead routing delay (immediate -> 5s)
4. Preserve existing reviews and content, just remove badges

On **cancellation**:
1. Keep listing visible for 30 days with "Inactive" badge
2. Stop all lead routing immediately
3. Release territory claim after 30-day grace period
4. Archive (do not delete) provider data

## Edge Cases

- **Double-claim race condition**: Two providers claiming same Elite territory simultaneously. Stripe webhook processing must be idempotent -- first successful payment wins, second gets auto-refunded.
- **Mid-cycle upgrade**: Provider upgrades from Standard to Elite. Stripe prorates automatically. Perk-manager must activate Elite perks immediately, not wait for next billing cycle.
- **Niche price change**: Existing subscribers keep their rate. New claims use new pricing. Never retroactively change active subscription amounts.
- **Lead routing with zero providers**: If a niche/territory has no active providers, lead is held in queue for 24 hours. If still unclaimed, consumer receives "no providers available" email with alternative niche suggestions.

## Output Format

When reporting operations changes:
1. Affected flow (claim, routing, perks, or subscription)
2. Before/after behavior comparison
3. Stripe webhook events that trigger the change
4. Perk-manager toggle actions with timing (immediate vs. end-of-period)
5. Edge cases tested and confirmed handled
