# 05 — SuiteDash PDF Release

The $47 SuiteDash PDF (*The Good Parts of SuiteDash*) is the first product in the Operator's Library series and the first product to run on the Erie.pro ThriveCart/ConvertBox revenue infrastructure end-to-end. It serves both as a real revenue stream and as a dogfooding exercise of the same machinery that powers provider subscriptions and lead products.

This document cross-references the assets that live in the `pinohu/SuiteDash` repo's `release/v1.0/` folder. Those assets are the canonical version; this doc is the pointer.

---

## Release inventory

The following are committed to `pinohu/SuiteDash/release/v1.0/`:

| File | What it is |
|------|-----------|
| `suitedash-good-parts-v1.0.pdf` | The 58-page PDF (1.15in margins, 12pt serif, fully bookmarked TOC) |
| `listing.md` | Marketing description, three feature bullets, who-it's-for/not-for, refund policy. ~150 words. |
| `thrivecart-convertbox-setup.md` | Full operator spec — persona, ConvertBox copy variants, sales page copy, ThriveCart product config, post-purchase email, abandonment email, wiring sequence. ~340 lines. |
| `chapter24-playbook.md` | Source of the new closing chapter (the 90-minute playbook). The PDF includes this; the standalone file is for use as a freebie/sample. |
| `README.md` | Release notes — what's in v1.0, what changed from the source repo, license terms. |

To pull updates: `cd ~/SuiteDash && git pull`. The source markdown (the v1.0 PDF was generated from) lives at `pinohu/SuiteDash/SuiteDash_Complete_Architecture_Map.md` (will be private — see manual step D.1).

---

## Production facts (verified)

- **PDF size:** 58 pages, 145,850 bytes
- **PDF title:** "The Good Parts of SuiteDash"
- **PDF author metadata:** Ikechukwu Ohu
- **Word count:** ~9,000 words across the body (7,286 reference + 1,280 playbook + 433 front matter)
- **Chapter count:** 23 reference chapters + 1 playbook chapter = 24 chapters
- **TOC depth:** 2 (chapter + section)
- **Typography:** TeX Gyre Termes (serif) main, TeX Gyre Cursor (monospace) for code
- **Margins:** 1.15in side, 1.2in top/bottom
- **Built with:** pandoc 3.1.3 + xelatex on Ubuntu 24

The PDF was assembled from:
1. Stripped source markdown (`SuiteDash_Complete_Architecture_Map.md` with "Prepared for Ike" front-matter, "NEXT STEPS" addressed to Ike, and the "85-90%" admission all removed).
2. A new 1,280-word closing chapter ("How I'd configure SuiteDash for a 5-client service business in 90 minutes") written from scratch for this release.
3. Cover, copyright, and bio pages.

---

## Who buys this PDF

(Full persona analysis in `release/v1.0/thrivecart-convertbox-setup.md` §1.)

**Not a tire-kicker** evaluating SuiteDash. **A buyer is someone who already paid for SuiteDash** (Pinnacle lifetime or annual subscription) and is stuck configuring it. The acute-pain audience is solopreneurs and small services firms who:

- Bought SuiteDash on impulse during an AppSumo lifetime deal
- Have logged in, opened the dashboard, felt overwhelmed
- Either haven't onboarded a first client, or have clients but the portal feels duct-taped
- Considered hiring a SuiteDash consultant ($750–$2,500) and want a cheaper path

Channels where they congregate: r/suitedash, the SuiteDash Facebook group, the AppSumo SuiteDash product page comments, Twitter/X, Indie Hackers.

---

## Pricing

**$47** at founding tier (first 100 buyers). Goes to **$67** once PDF #2 in the Operator's Library ships.

The price was chosen because:
- A SuiteDash consultant runs $750–$2,500; $47 is a clear value comparison
- It's high enough to filter out non-buyers but low enough to feel like a no-brainer for the target persona
- $47 has the lowest perceived friction in the $40–$60 range based on Hormozi/Brunson copy research

---

## Marketing flow

```
Reddit/Twitter post  -->  ConvertBox capture (Variant C)
                          --> Sales page (erie.pro/suitedash)
                          --> ThriveCart cart
                          --> Success page (erie.pro/thank-you/suitedash)
                          --> Email with PDF download link

Blog post / article  -->  ConvertBox capture (Variant A, inline)
                          --> Free Chapter 24 preview at erie.pro/playbook-preview
                          --> Footer CTA to sales page

Sales page exit       -->  ConvertBox exit-intent (Variant B)
                          --> Email capture
                          --> 14-step checklist email
                          --> Soft CTA to full PDF
```

Cart abandonment recovery happens via ThriveCart's built-in mechanism, fires 4 hours after abandon.

---

## What's blocking the PDF launch

In order. From `03-MANUAL-STEPS-REQUIRED.md` §D:

1. 🔴 **D.1 — Make `pinohu/SuiteDash` private.** The source markdown is public; once the PDF is for sale, anyone could download the un-polished version for free.
2. 🔴 **D.2 — Create the ThriveCart product** per `release/v1.0/thrivecart-convertbox-setup.md` §4.
3. 🔴 **D.3 — Configure post-purchase and abandonment emails** in ThriveCart with the copy in §5 and §6.
4. 🔴 **D.4 — Build the sales page** at `erie.pro/suitedash` (or chosen URL) with the copy in §3.
5. 🟡 **D.5 — Set up ConvertBox capture forms** with the copy in §2.
6. 🔴 **D.6 — Test purchase** end-to-end before announcing.
7. 🔴 **D.7 — Soft launch** on r/suitedash + SuiteDash Facebook group with the social-referral ConvertBox variant.
8. 🟢 **D.8 — Broader announcement** after 5–10 buyers and at least one positive review.

Estimated total time: 4–6 hours for the first launch.

---

## What the existing Erie.pro infrastructure provides

The PDF can use existing Erie.pro infrastructure for free (no additional code or schema changes):

| Capability | Provided by |
|------------|-------------|
| ThriveCart webhook ingestion | `/api/webhooks/thrivecart` route, already wired with two-layer idempotency |
| Customer record creation | `offer_purchase` table; webhook handler creates rows |
| Email delivery | ThriveCart native (preferred for v1) or Resend via the webhook handler |
| Sales page hosting | Next.js page at `erie.pro/suitedash` (to be built) |
| Thank-you page hosting | Next.js page at `erie.pro/thank-you/suitedash` (to be built) |
| Playbook preview hosting | Next.js page at `erie.pro/playbook-preview` (optional, for Variant A) |
| Operator dashboard view | `/dashboard/offers` already shows offer purchases |

What is NOT provided automatically and must be added:

- A new `Offer` row in the database with slug `suitedash-good-parts-v1` and the canonical price ($47). Only needed if you want the webhook to capture the purchase into Erie.pro's CRM for upsells. **Skippable for v1**: use ThriveCart native delivery and rely on ThriveCart's customer record. Add the `Offer` row when you're ready to wire the PDF into the Operator's Library upsell flow.

---

## Revenue projection (for sanity, not forecasting)

Assume the soft-launch hits 1,000 unique sales-page visitors in the first 30 days from Reddit + Twitter + AppSumo comment replies. Conversion rates for niche-PDF cold traffic typically run 0.5%–2%. At 1%: 10 buyers × $47 = $470 in the first month.

Better signals come from a 90-day window once the sales page has SEO presence: niche-PDF organic traffic can compound 3–5× over the first quarter as Google indexes the page. A reasonable 90-day target is $1,000–$3,000 if marketing is consistent.

The first PDF is not the revenue centerpiece. It is:
1. **Proof of concept** for the Operator's Library publishing model.
2. **First dollar** through the Erie.pro revenue infrastructure (real money, real webhook, real fulfillment).
3. **Lead magnet** for the second PDF (every buyer gets onto the email list for PDF #2's launch).

The Operator's Library has 6 more PDFs scoped after this one (full pipeline in past chat history). The compounding revenue is the series, not the single PDF.

---

## v1.1 and beyond

Once the PDF has 50+ buyers, the v1.1 revision should include:

- Section corrections from buyer feedback (3–5 typo / accuracy fixes typically)
- One real testimonial pulled into the sales page
- A new "what's changed in SuiteDash since publication" appendix as the platform evolves
- Affiliate link in the bio for buyers who want to actually buy SuiteDash (referral revenue stack)

Any v1.x revision should bump the file version in the filename (`suitedash-good-parts-v1.1.pdf`) and re-render via the pandoc pipeline. The source markdown stays in `pinohu/SuiteDash` private repo.
