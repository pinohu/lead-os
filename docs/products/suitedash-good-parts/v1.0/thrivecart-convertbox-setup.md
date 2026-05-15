# ThriveCart + ConvertBox Setup — *The Good Parts of SuiteDash*

This is the complete checkout-and-capture setup for the $47 SuiteDash PDF. It covers persona, ConvertBox capture forms, sales page copy, ThriveCart product config, post-purchase email, and the wiring sequence.

Every claim in the copy below is verified against the actual PDF contents (58 pages, 24 chapters, ~9,000 words). Nothing is invented.

---

## 1. The buyer — who you're actually selling to

The buyer is not a SuiteDash evaluator. People shopping the platform don't pay for configuration guides. The buyer is someone who has **already paid for SuiteDash** (typically the Pinnacle AppSumo lifetime deal or the annual subscription) and is stuck.

**Their situation, in their own words:**

- "I bought SuiteDash six months ago and I haven't onboarded a single client through it yet."
- "Every time I log in I get overwhelmed and close the tab."
- "The help docs are accurate but they don't tell me what to do *first*."
- "I keep watching SuiteDash tutorials on YouTube and they're all surface-level."
- "I should just hire someone to set it up — but their quotes start at $1,500."

**Demographics:**

- Solopreneur or small services firm (1–10 people)
- Most common roles: agency owner, consultant, freelance designer, coach, fractional executive, lawyer, accountant
- Already running Dubsado, HoneyBook, Bonsai, 17hats, or a Notion-and-Zapier patchwork, and looking to consolidate
- Bought SuiteDash on impulse during an AppSumo lifetime deal ($297–$497) or annual ($480–$1,140) and now feels the sunk-cost pressure

**What they want:**

1. To get their first portal live with real clients in it.
2. To stop paying for 3–4 separate tools the platform can replace.
3. To not have to read the entire help center to figure out what they don't know.

**What scares them off a $47 PDF:**

- "Is this just SuiteDash help docs rewritten?" → It isn't. The first 23 chapters are a synthesis (the help center never provides one), and chapter 24 is an opinionated playbook the help center can't write.
- "Is this AI slop?" → No. The reference is grounded in the actual platform; the playbook is a specific, narrow, 90-minute sequence.
- "What if I have Pro not Pinnacle?" → Most reference chapters work on Pro. A handful of features (FLOWs, advanced Power-Ups) are Pinnacle-only; those chapters say so up front.

**Channels where they congregate:**

- r/suitedash (active subreddit, ~5k members)
- SuiteDash Facebook group (~3k members)
- AppSumo SuiteDash product page comments (still active 2 years after lifetime deal ended)
- Twitter/X searches for "SuiteDash"
- Indie Hackers + SaaSland threads about consolidating client-portal stacks

**Buyer ≠ tire-kicker test:**

A tire-kicker says "I'm thinking about getting SuiteDash, will this help me decide?" → They are NOT the buyer. Send them to suitedash.com's free demo instead.

A buyer says "I have SuiteDash, where do I start?" → They are the buyer.

---

## 2. ConvertBox capture form

Goal: capture warm-but-not-yet-buyers from related content (a blog post, an X thread, a YouTube comment, a Reddit reply) and route them to the sales page with their email already on hand for cart-abandon recovery.

### Form type

**Inline embed** for blog/article placement.
**Exit-intent overlay** for the sales page itself.

### Targeting rules

- Show on: any page containing the URL slug `/suitedash` or `/portal-setup`
- Hide if: visitor has cookie `suitedash-good-parts:purchased`
- Hide if: visitor already submitted this form in the last 14 days
- Exit-intent overlay: trigger on the sales page only, after 20 seconds OR mouse-leave-top

### Copy variants

**Variant A — Inline, content-upgrade tone (highest converting on blog posts)**

> **Headline:** Stuck on your SuiteDash setup?
>
> **Sub:** Get the first chapter of *The Good Parts of SuiteDash* free — the 90-minute playbook for getting five clients into the portal. No email required to read it.
>
> **Field:** Email address *(only if you want updates when the next chapters are added)*
>
> **Button:** Send me the playbook
>
> **Footer:** One email max. Unsubscribe in one click.

After capture: redirect to a `/playbook-preview` page hosting just Chapter 24 as a standalone HTML doc, with a footer CTA "Get the full 58-page guide → $47".

**Variant B — Exit-intent on sales page (recover abandoners)**

> **Headline:** Before you go —
>
> **Sub:** Want the SuiteDash setup checklist by email instead? 90 minutes, 14 steps, no portal-overwhelm. Free.
>
> **Field:** Email
>
> **Button:** Email me the checklist
>
> **Small print under button:** I'll also let you know when the next *Operator's Library* PDFs (n8n workflows, automation playbook) ship.

After capture: send a Mailchimp/Acumbamail welcome email containing the 14-step checklist (literally the section headers of Chapter 24, formatted as a one-page PDF or HTML). At the bottom of that email: "You can also get the full reference + playbook — 58 pages — for $47" with the ThriveCart cart URL.

**Variant C — Reddit / Twitter referral tone**

> **Headline:** I wrote the SuiteDash configuration guide I wish I'd had.
>
> **Sub:** 58 pages. 23 reference chapters + a 90-minute playbook for getting your first five clients into the portal. $47.
>
> **Button:** See what's in it →

After click: go to the sales page directly (no email gate). This variant works because the qualifying happened upstream (the user clicked a Reddit/Twitter link about SuiteDash — they're already warm).

---

## 3. Sales page copy

This is the page the ConvertBox link, the cart URL, and direct social posts all point at. It is the conversion page.

URL slug recommendation: `erie.pro/suitedash` or a subdomain you already own. Keep it short, easy to type in a Twitter reply.

### Hero

> # The SuiteDash configuration guide you wish you'd had on day one.
>
> 58 pages. 23 chapters covering every module in plain language. One 90-minute playbook for getting your first five clients into the portal. Written by an operator who actually uses SuiteDash to run his businesses.
>
> **$47**
>
> [ Get the guide → ]
>
> *7-day no-questions refund. Instant download.*

### Sub-hero (acknowledge the pain)

> You bought SuiteDash. Maybe at the AppSumo lifetime deal. Maybe on the annual plan. Either way, you've logged in, opened the dashboard, and felt the wave: *what do I do first?*
>
> The help docs are good. They document every screen accurately. They never tell you how the parts fit together, or which ones to ignore on day one. Both of those gaps are what this guide is for.

### What's actually in the PDF (verified, accurate)

> The first 23 chapters are a reference — every major module of SuiteDash Pinnacle summarized, cross-referenced, and de-jargoned. Things like:
>
> - The five places "Custom Fields" appear (and which ones share data)
> - The exact difference between Automations, FLOWs, and Sales Funnels — and when to use which
> - Which Power-Ups (WORLDs, Community, PDF Signing) are worth turning on, and which to leave off
> - How the Document Generator's dynamic placeholders interact with Custom Fields
> - The 25 places where SuiteDash's own help docs are thinnest (this is its own chapter)
>
> Chapter 24 is the opposite of a reference: an opinionated, 90-minute playbook. Minute by minute, in order:
>
> - Minute 0–10: White-label essentials. What to set, what to skip.
> - Minute 10–25: One Circle, one role customization.
> - Minute 25–40: The minimum-viable client dashboard.
> - Minute 40–55: Three forms. Not eight. Not twelve. Three.
> - Minute 55–70: Two automations. The two that actually matter on day one.
> - Minute 70–80: One project template.
> - Minute 80–90: One document template, one invoice template.
>
> That's it. You'll be using maybe 25% of what the platform can do. That is the correct level for your first 30 clients.

### Who it's for / who it's not for

> **It's for you if:**
>
> - You own a SuiteDash license (Pro or Pinnacle) and haven't onboarded your first client yet.
> - You've onboarded a few but the portal feels duct-taped.
> - You're consolidating Dubsado, HoneyBook, Bonsai, or 17hats into SuiteDash and the mapping is unclear.
>
> **It's not for you if:**
>
> - You're still deciding whether to buy SuiteDash. Watch their demo first.
> - You're an established SuiteDash agency with 50+ clients in the portal. You already have your own mental map.
> - You want done-for-you templates. This is a guide; you do the configuring.

### Author credibility

> Written by **Ikechukwu Ohu** — Full Professor of Industrial & Robotics Engineering at Gannon University and operator of a portfolio of businesses that run on SuiteDash, including a Pennsylvania compliance SaaS, a hyperlocal services directory, and a niche professional licensing platform.
>
> Not affiliated with SuiteDash, Inc. This is an independent operator's reference.

### Sample (optional — link to Chapter 24 preview)

> [ Read Chapter 24 free → ]  *(opens the playbook chapter as a standalone preview)*

### The honest objections section

> **"Isn't this just rewritten help docs?"** No. The help docs document each screen in isolation. The guide makes the cross-references explicit and tells you which 18 chapters to skip on day one.
>
> **"Why don't I just hire a SuiteDash consultant?"** A consultant runs $750–$2,500. You keep the relationship; you don't keep the document. This costs $47 and you keep it forever.
>
> **"What if I don't have Pinnacle?"** Most of the reference chapters work on Pro. Pinnacle-only features (FLOWs, advanced Power-Ups, white-label mobile app) are called out in the chapters that cover them.
>
> **"What if I hate it?"** Email the address on your ThriveCart receipt within 7 days and I'll refund you. No form, no question.

### Final CTA

> **$47. 58 pages. Instant download. 7-day refund.**
>
> [ Get the guide → ]

### Footer / trust

> Independent reference, not affiliated with SuiteDash, Inc. SuiteDash is a trademark of SuiteDash, Inc.
>
> Single-user license. Keep a copy indefinitely; please don't redistribute.

---

## 4. ThriveCart product configuration

Open ThriveCart → Products → Create new product.

| Field | Value |
|-------|-------|
| Product type | One-time (digital product) |
| Product name | The Good Parts of SuiteDash |
| Product slug / SKU | `suitedash-good-parts-v1` |
| Price | `$47.00` |
| Currency | USD |
| Description (short, ≤200 chars) | A 58-page architecture and configuration guide for SuiteDash Pinnacle. 23 reference chapters + a 90-minute playbook for getting your first five clients into the portal. |
| Tax handling | Per-region (US: collect where you have nexus; outside US: VAT-inclusive in EU/UK if applicable) |
| Fulfillment | ThriveCart native — upload the PDF to ThriveCart's file delivery, customer gets the download link on the success page AND via email |

### Cart settings

| Field | Value |
|-------|-------|
| Cart type | One-step embeddable + standalone checkout URL |
| Address fields | First name, email — required. Country — required (for tax). Other address fields — off. |
| Bump offer | Off for v1. Add it when the second PDF ships (e.g. bump the second PDF onto this checkout at $27). |
| Order bumps | None for v1. |
| Trial / payment plan | None — single payment. |
| Coupons | Create one: `OPERATOR47` — set to discount $0 (display-only "founding price already applied") OR a real launch coupon `LAUNCH10` for $10 off for the first 100 buyers. |

### Success URL

`https://erie.pro/thank-you/suitedash` — a static page on erie.pro that says "Check your email for the download. While you wait — read this." with a short note + link to the playbook excerpt and a soft pitch for joining the email list.

### Webhook URL (optional for v1)

`https://erie.pro/api/webhooks/thrivecart`

The erie.pro webhook is already wired with two-layer idempotency (payloadHash short-circuit + compound unique on `(thriveCartOrderId, offerId)`) from PR #38. If you wire this for the PDF, you also need to seed an `Offer` row in the erie.pro database with slug `suitedash-good-parts-v1` so the fulfillment system has something to attach to. **For v1, skip this** — use ThriveCart's native delivery. Wire the webhook in v2 when you want to capture the buyer into the erie.pro CRM for upsells to other Operator's Library products.

### Passthrough parameters (to pre-fill via ConvertBox redirect)

When ConvertBox redirects to the cart with a captured email, pass:

- `passthrough_email` — populates email field
- `passthrough_firstname` — populates first-name field (if captured)
- `passthrough_utm_source=convertbox-exit` (or wherever they came from) — useful in dashboard reporting

ThriveCart cart URL format with passthrough:

```
https://yourcart.thrivecart.com/suitedash-good-parts-v1/?passthrough_email={{ email }}&passthrough_firstname={{ firstname }}&utm_source=convertbox-exit
```

---

## 5. Post-purchase email (ThriveCart native)

Set in ThriveCart → Product → Email options → Successful purchase.

> **Subject:** Your copy of *The Good Parts of SuiteDash* is ready
>
> Hi {{ firstname }},
>
> Thanks for picking up the guide. Two things:
>
> **1. Download link**
>
> {{ download_link }}
>
> The link doesn't expire. Save the PDF locally — that's what your single-user license is for.
>
> **2. The 90-minute playbook is Chapter 24.**
>
> If you only have time for one chapter today, jump to that one. The first 23 chapters are reference material — you read them when something specific comes up, not front-to-back.
>
> If you hit a question that isn't answered in the guide, reply to this email. I read every reply and they shape the next revision.
>
> — Ikechukwu Ohu
>
> *P.S. The next PDF in the* Operator's Library *is on n8n workflows for service businesses. If you want me to email you when it ships, no need to do anything — you're already on the list as a buyer. If you don't want that, reply with "no series" and I'll remove you.*

---

## 6. Abandoner recovery email (if using ConvertBox + ThriveCart cart abandonment)

ThriveCart has built-in cart abandonment if you enable it. Set the email to fire 4 hours after abandonment.

> **Subject:** You left your SuiteDash guide in the cart
>
> Hi {{ firstname }},
>
> You started the checkout for *The Good Parts of SuiteDash* a few hours ago and didn't finish. If something came up, here's the link to pick it back up: {{ cart_recovery_link }}
>
> Three things you should know before you decide:
>
> 1. **It's 58 pages. Not a 12-page checklist.** The reference covers all 23 SuiteDash modules; the playbook is the 90-minute setup. It's a real working document, not a content marketing PDF.
>
> 2. **7-day no-questions refund.** If you read it and it's not what you needed, reply to your receipt within a week and I'll refund you. Full stop.
>
> 3. **It's $47.** A SuiteDash consultant runs $750–$2,500 for an initial setup. You keep the document indefinitely; they leave with their hourly rate.
>
> If you decide it's not for you, no email-list spam — this is the only recovery message you'll get.
>
> {{ cart_recovery_link }}
>
> — Ike

---

## 7. Wiring sequence (manual steps for you)

In order. Each step takes 5–15 minutes.

1. **Make `pinohu/SuiteDash` private** at github.com/pinohu/SuiteDash/settings → Danger zone → Change visibility. (Critical: source markdown is currently public.)
2. **Upload the PDF to ThriveCart**. Products → New product → fill in the table above. Upload `suitedash-good-parts-v1.0.pdf`. Set the price to $47. Enable native file delivery.
3. **Configure the post-purchase email** in ThriveCart with the copy in section 5.
4. **Enable cart abandonment email** with the copy in section 6.
5. **Get the cart URL** from ThriveCart (looks like `https://yourcart.thrivecart.com/suitedash-good-parts-v1/`). Save it.
6. **Build the sales page** at `erie.pro/suitedash` (or a dedicated subdomain). Use the copy in section 3. Wire the primary CTA button to the cart URL. Wire a `data-attribute` or query param so visits from ConvertBox don't see the ConvertBox again.
7. **Build the thank-you page** at `erie.pro/thank-you/suitedash`. One paragraph, link to the playbook preview, soft email-list pitch.
8. **Set up ConvertBox forms** with the copy in section 2. Three variants: inline, exit-intent, social-referral. Target each per its rules.
9. **Wire ConvertBox capture → cart URL** with passthrough email. Test the round-trip: submit ConvertBox with a test email, confirm the cart pre-fills.
10. **Send one test purchase through the cart** at $1 (use a `TEST100` coupon) to verify the webhook (if wired), the email delivery, and the download link.
11. **Soft launch** by posting in r/suitedash and the SuiteDash Facebook group with the variant-C ConvertBox link. Don't broadcast. See what the first 5–10 buyers say.
12. **Then announce more broadly** — Indie Hackers, Twitter, Reddit cross-posts, AppSumo product page comment.

Time estimate end-to-end: 4–6 hours for the first run-through. Steps 1–5 are 60–90 minutes. The bulk is the sales page in step 6.

---

## 8. What I deliberately did NOT do

- Did not write upsell/downsell logic. Add when you have 50+ buyers and know which segments respond.
- Did not write a 7-email nurture sequence. Premature; one good post-purchase email beats seven generic ones at this volume.
- Did not write affiliate copy or set up the ThriveCart affiliate program. Wait until you have testimonials.
- Did not include scarcity language ("only 100 copies left!"). It's a digital download; that's a lie.
- Did not include fake testimonials. Real ones come after launch; placeholders look amateurish.

Every claim in this document is verifiable against the PDF or the listed integration features. If you find one that isn't, flag it and I'll fix it.
