# UX & Accessibility Audit Report

**Projects audited:** `erie-pro`, `neatcircle-beta`  
**Date:** 2026-04-05  
**Standard:** WCAG 2.1 AA

---

## Part 1: UX Audit

### 1.1 Loading States

#### erie-pro ✅ Good Coverage
| File | Status |
|------|--------|
| `src/app/loading.tsx` | Root-level skeleton loader with breadcrumb, hero, grid, and sidebar skeletons |
| `src/app/dashboard/loading.tsx` | Dashboard-specific skeleton (stat cards, territory, leads table) |
| `src/app/dashboard/settings/loading.tsx` | Settings-specific skeleton |
| `src/app/dashboard/disputes/loading.tsx` | Disputes-specific skeleton |
| `src/app/dashboard/notifications/loading.tsx` | Notifications-specific skeleton |
| `src/app/admin/loading.tsx` | Admin-specific skeleton |

**Missing:** No `loading.tsx` for `src/app/dashboard/leads/`, `src/app/dashboard/billing/`, `src/app/dashboard/profile/`, `src/app/dashboard/analytics/`, `src/app/dashboard/integrations/`, `src/app/dashboard/webhooks/`. These pages fall back to the root `loading.tsx` which doesn't match their layout.

#### neatcircle-beta ❌ No Loading States
- **No `loading.tsx` files exist anywhere** in the project.
- `src/app/dashboard/page.tsx` lines 132-137: Has an inline loading state (`"Loading Lead OS metrics..."`) but it's a plain text message with no skeleton/spinner — just white text on dark background. No reduced-motion consideration.
- All other pages (`/services`, `/locations`, `/assess/*`, `/calculator`, `/webinar`, etc.) have **zero loading feedback**.

### 1.2 Error States

#### erie-pro ✅ Good Coverage
| File | Status |
|------|--------|
| `src/app/error.tsx` | Root error boundary with retry + home buttons |
| `src/app/dashboard/error.tsx` | Dashboard error boundary with retry + "Back to Dashboard" |
| `src/app/admin/error.tsx` | Admin error boundary with retry + "Back to Dashboard" |

**Missing:** No `global-error.tsx` — unhandled root layout errors will show the browser's default error page.

#### neatcircle-beta ❌ No Error Boundaries
- **No `error.tsx` files exist anywhere** in the project. Any runtime error crashes the page silently with the default Next.js error overlay (production) or stack trace (dev).
- No `global-error.tsx`.

### 1.3 Empty States

#### erie-pro ✅ Good
- `src/app/dashboard/page.tsx` line 268-271: Empty state for "No leads in the last 30 days" with descriptive text.
- `src/app/dashboard/page.tsx` lines 199-254: Onboarding checklist shown when provider has zero leads.
- `src/app/dashboard/page.tsx` lines 24-39: "No Territory Linked" empty state with CTA to claim.

#### neatcircle-beta ⚠️ Partial
- `src/app/dashboard/page.tsx` lines 65-66: Empty states in `MetricList` component ("No captured leads yet", etc.).
- `src/app/dashboard/page.tsx` line 140: Returns `null` if metrics are null after loading — shows blank page with no feedback.
- Other pages like `/services`, `/locations`, `/industries` — no empty states for when data might be absent.

### 1.4 User Feedback (Form Submit)

#### erie-pro ✅ Excellent
- **LeadForm** (`src/components/lead-form.tsx`): 
  - Lines 153-176: Success state with `role="alert"` and `aria-live="polite"`, green checkmark, message, and "Submit Another Request" button with cooldown.
  - Lines 181-188: Error state with `role="alert"` and `aria-live="polite"`.
  - Line 271: Button shows "Submitting..." during load, disabled during submission.
- **HomepageLeadForm** (`src/components/homepage-lead-form.tsx`): Same quality patterns.
- **ContactForm** (`src/components/contact-form.tsx`): Same patterns, `aria-label="Contact form"` on the form element.

#### neatcircle-beta ⚠️ Needs Improvement
- **Contact** (`src/components/Contact.tsx`):
  - Line 113-122: Success state shows checkmark + message, but **no `role="alert"` or `aria-live`** — screen readers won't announce the state change.
  - Lines 175-179: Error message displayed but **no `role="alert"` or `aria-live`**.
  - Line 170: Button shows "Sending..." but no disabled visual state beyond `disabled:opacity-60`.
- **AssessmentQuiz** (`src/components/AssessmentQuiz.tsx`): No `aria-live` on step transitions or results.
- **ROICalculator** (`src/components/ROICalculator.tsx`): No `aria-live` on calculation results or email submission confirmation.
- **ExitIntent** (`src/components/ExitIntent.tsx`): No `aria-live` on submission confirmation.
- **WhatsAppOptIn** (`src/components/WhatsAppOptIn.tsx`): No `aria-live` on submission, just removes self via `setSubmitted(true)`.
- **ChatWidget** (`src/components/ChatWidget.tsx`): No `aria-live` region for incoming messages — screen readers won't announce new chat messages.

### 1.5 Form Validation UX

#### erie-pro ✅ Excellent
- All three forms (LeadForm, HomepageLeadForm, ContactForm) implement:
  - Inline validation on blur (`handleBlur`)
  - Error clearing on change (`clearError`)
  - Phone number auto-formatting
  - Final validation pass on submit
  - Clear error messages per field
  - `aria-required="true"` on required fields
  - Visual required indicators (`*` with `text-destructive`)

#### neatcircle-beta ❌ No Client-Side Validation
- **Contact** (`src/components/Contact.tsx`): Uses only HTML `required` attribute. No inline validation, no error messages, no blur validation. Lines 128-164.
- **AssessmentQuiz** email capture (`src/components/AssessmentQuiz.tsx` lines 145-175): Only HTML `required`, no validation feedback.
- **ROICalculator** (`src/components/ROICalculator.tsx` lines 239-256): Only HTML `required`.
- **ExitIntent** (`src/components/ExitIntent.tsx` lines 173-195): Only HTML `required`.

### 1.6 Navigation: 404 Pages, Error Boundaries

#### erie-pro ✅ Good
- `src/app/not-found.tsx`: Custom 404 page with "Go home" and "Browse services" CTAs.
- Dynamic routes use `notFound()` properly: `src/app/[niche]/page.tsx` line 73, `src/app/dashboard/page.tsx` line 49.

#### neatcircle-beta ❌ Missing
- **No `not-found.tsx`** anywhere. Invalid routes show the default Next.js 404 page.

### 1.7 Mobile Responsiveness

#### erie-pro ✅ Good
- Responsive grid patterns throughout (`sm:grid-cols-2`, `md:grid-cols-3`, `lg:grid-cols-4`).
- Mobile navigation via Sheet component (`src/components/mobile-nav.tsx`).
- Dashboard layout has mobile header with icon-only nav (`src/app/dashboard/layout.tsx` lines 82-103).
- Admin layout has mobile header (`src/app/admin/layout.tsx` lines 146-178).
- **Note:** No explicit `<meta name="viewport">` tag — relies on Next.js default (which includes it automatically).

#### neatcircle-beta ⚠️ Mixed
- Uses responsive classes (`sm:`, `md:`, `lg:`) throughout components.
- Navbar has mobile hamburger menu (`src/components/Navbar.tsx` lines 49-63).
- **No explicit `<meta name="viewport">`** — relies on Next.js default.
- **Dashboard page** (`src/app/dashboard/page.tsx`): Uses inline styles with fixed `gridTemplateColumns` at line 186 (`"1fr 1fr"`) — **will not stack on mobile**. The two-column grid never becomes single-column.
- Dashboard inline styles generally bypass Tailwind's responsive system entirely (lines 159-327).

### 1.8 Dead Links / Broken Routes

#### erie-pro ⚠️ Potential Issues
- `src/app/page.tsx` line 231: `<Link href="/#get-quote">` — hash link may not work with Next.js Link component depending on version.
- Footer links to `/for-business#faq` (layout.tsx line 326) — hash links through Next.js Link.
- `src/app/[niche]/page.tsx` lines 244-264: Links to 14 sub-routes per niche (`/[niche]/seasonal`, `/[niche]/pricing`, etc.) — all have corresponding `page.tsx` files, routes appear valid.
- Mobile nav CTA links to `/#services` (line 118) while desktop CTA links to `/#get-quote` (line 231) — **inconsistent CTA targets**.

#### neatcircle-beta ⚠️ Potential Issues
- `src/components/Footer.tsx`: All 8 service links point to `/services` (lines 62-69) — not to individual service pages. This is misleading since the links show distinct service names.
- All 8 industry links point to `/#industries` (lines 79-89) — same misleading pattern.
- No `/privacy` or `/terms` pages exist — footer has no legal links at all.

---

## Part 2: Accessibility Audit (WCAG 2.1 AA)

### 2.1 Layout & Document Structure

#### erie-pro ✅ Good
- `src/app/layout.tsx` line 96: `<html lang="en">` ✅
- Skip navigation link at line 111-116 ✅
- Semantic landmarks: `<nav aria-label="Main navigation">` (line 121), `<footer role="contentinfo">` (line 252), `<div id="main-content" role="main">` (line 244) ✅
- Proper heading hierarchy throughout pages ✅

**Issue:** `src/app/layout.tsx` line 244: `<div id="main-content" role="main">` — using `role="main"` on a `<div>` instead of a `<main>` element. Should use `<main>` tag instead. The individual pages then also wrap content in `<main>`, creating **nested main landmarks**.

#### neatcircle-beta ✅ Mostly Good
- `src/app/layout.tsx` line 89: `<html lang="en">` ✅
- Skip navigation link at lines 99-104 ✅
- `<div id="main-content">` (line 105) — **no `role="main"` and not a `<main>` element**. The skip link targets this div but it lacks landmark role.

**Issues:**
- `src/app/layout.tsx` line 105: Skip link target `#main-content` is a `<div>` with no landmark role and no `tabindex="-1"` — keyboard focus won't land here after activating the skip link.
- No `<footer>` landmark on the layout level — the Footer component uses `<footer>` but is rendered inside the page, not the layout.

### 2.2 Missing ARIA Labels & Roles

#### neatcircle-beta — Critical Issues

| File | Line | Issue |
|------|------|-------|
| `src/components/Navbar.tsx` | 20 | `<nav>` has no `aria-label` — should be `aria-label="Main navigation"` |
| `src/components/Navbar.tsx` | 68-89 | Mobile menu panel has no `aria-label`, not marked as a navigation region |
| `src/components/Navbar.tsx` | 49-63 | Mobile toggle button says "Toggle menu" but doesn't use `aria-expanded` |
| `src/components/ChatWidget.tsx` | 371 | Chat input has no `aria-label` — relies on placeholder only |
| `src/components/ChatWidget.tsx` | 380-387 | Send button has no `aria-label` — icon-only button |
| `src/components/ChatWidget.tsx` | 341 | Chat panel has no `role="dialog"` or `aria-label` |
| `src/components/ExitIntent.tsx` | 150-155 | Modal backdrop uses `onClick` on a `<div>` but has no keyboard dismiss (Escape key) |
| `src/components/ExitIntent.tsx` | 156 | Modal content has no `role="dialog"`, no `aria-modal="true"`, no `aria-labelledby` |
| `src/components/WhatsAppOptIn.tsx` | 111-115 | Phone input has no `<label>` element — only placeholder text |
| `src/components/AssessmentQuiz.tsx` | 145-175 | Email, company, phone inputs have no `<label>` elements — placeholders only |
| `src/components/ROICalculator.tsx` | 133-144 | `<label>` elements use `class` text but lack `htmlFor` on the `<select>` (line 134) |
| `src/components/ROICalculator.tsx` | 148-157 | Range input label at line 148 has no `htmlFor`; range input has no `id` |
| `src/components/ROICalculator.tsx` | 161-171 | Number input label at line 161 has no `htmlFor`; input has no `id` |
| `src/components/ROICalculator.tsx` | 176-186 | Range input labels missing `htmlFor`; inputs missing `id` |
| `src/components/ROICalculator.tsx` | 190-199 | Same pattern — labels not associated with inputs |
| `src/components/ROICalculator.tsx` | 241-247 | Email input has no `<label>`, placeholder only |
| `src/components/Footer.tsx` | 35 | `<footer>` has no `role="contentinfo"` (semantic element is fine, but no `aria-label`) |
| `src/components/Services.tsx` | 51 | `<section>` landmark has no `aria-label` |
| `src/components/Testimonials.tsx` | 27 | `<section>` landmark has no `aria-label` |
| `src/components/Pricing.tsx` | 58-59 | `<section>` landmark has no `aria-label` |
| `src/components/Stats.tsx` | 12 | `<section>` landmark has no `aria-label` |

#### erie-pro — Minor Issues

| File | Line | Issue |
|------|------|-------|
| `src/components/lead-form.tsx` | 245-251 | `<textarea>` is a native HTML element styled manually instead of using the Textarea component — styling is consistent but it's an inconsistency |
| `src/components/homepage-lead-form.tsx` | 278-284 | Same `<textarea>` inconsistency |
| `src/app/dashboard/page.tsx` | 343-358 | `StatusBadge` uses color-only differentiation (see 2.6 below) |
| `src/app/dashboard/page.tsx` | 361-375 | `TemperatureBadge` uses color-only differentiation (see 2.6 below) |
| `src/app/layout.tsx` | 244 | Nested `<main>` landmarks — layout has `role="main"` on a div, pages also use `<main>` |

### 2.3 Missing Alt Text on Images

#### erie-pro ✅ 
- No `<img>` tags found in components. Uses Lucide icons with `aria-hidden="true"` properly (e.g., `src/app/page.tsx` lines 39-51).
- `src/components/photo-gallery-dialog.tsx` lines 49, 70: `<img>` tags have descriptive `alt` text (`"${providerName} photo ${i + 2}"`).

#### neatcircle-beta ✅
- No `<img>` tags found in components (uses SVG icons inline).

### 2.4 Color Contrast Issues

#### neatcircle-beta — Critical Issues

| File | Line | Issue | Detail |
|------|------|-------|--------|
| `src/components/Hero.tsx` | 100-101 | `text-slate-300` on dark navy background | `#cbd5e1` on `#1B2A4A` ≈ 5.2:1 — passes AA for normal text ✅ |
| `src/components/Hero.tsx` | 121 | `text-slate-400` on dark navy | `#94a3b8` on `#1B2A4A` ≈ 3.4:1 — **fails AA for normal text** (needs 4.5:1) |
| `src/components/Navbar.tsx` | 35 | `text-slate-300` on `bg-navy/95` | Borderline, may fail with transparency |
| `src/components/Footer.tsx` | 47-48 | `text-slate-400` on `bg-slate-900` | `#94a3b8` on `#0f172a` ≈ 4.4:1 — **fails AA for normal text** by a small margin |
| `src/components/Footer.tsx` | 52 | `text-slate-500` on `bg-slate-900` | `#64748b` on `#0f172a` ≈ 2.8:1 — **fails AA** |
| `src/components/Pricing.tsx` | 104-105 | `text-slate-400` on dark navy gradient | ~3.4:1 — **fails AA** |
| `src/components/Pricing.tsx` | 155-157 | `text-slate-300` on `bg-white/5` (near-transparent) | Context-dependent, likely OK |
| `src/app/dashboard/page.tsx` | 46-48 | Inline style `color: "#8b8ba7"` on `background: "#1a1a2e"` | `#8b8ba7` on `#1a1a2e` ≈ 3.6:1 — **fails AA** |
| `src/app/dashboard/page.tsx` | 169 | `color: "#8b8ba7"` on `background: "#0f0f23"` | `#8b8ba7` on `#0f0f23` ≈ 4.0:1 — **fails AA** |
| `src/components/WhatsAppOptIn.tsx` | 128 | `text-[10px]` with `text-gray-400` | Font size + low contrast — **fails AA for small text** |
| `src/components/ExitIntent.tsx` | 198 | `text-gray-400` on white background | `#9ca3af` on `#fff` ≈ 2.9:1 — **fails AA** |
| `src/components/ReferralBanner.tsx` | 79 | `text-gray-300` on dark navy gradient | Approximately 5.5:1 — likely passes ✅ |

#### erie-pro — Minor Issues

| File | Line | Issue |
|------|------|-------|
| `src/app/page.tsx` | 309 | `opacity-0` on "Get a Quote" text — invisible until hover, not accessible without hover |
| `src/components/lead-form.tsx` | 265 | TCPA text is `text-xs text-muted-foreground` — very small with reduced contrast |

### 2.5 Keyboard Navigation & Focus Management

#### neatcircle-beta — Critical Issues

| File | Line | Issue |
|------|------|-------|
| `src/components/ExitIntent.tsx` | 150-219 | **No focus trap in modal** — Tab key will navigate behind the modal overlay. No Escape key handler. Focus not returned to trigger on close. |
| `src/components/ChatWidget.tsx` | 340-392 | **No focus trap in chat panel** — can tab out of the floating chat window. No Escape key to close. |
| `src/components/WhatsAppOptIn.tsx` | 87-133 | **No focus trap** — popup has no keyboard dismiss mechanism. |
| `src/components/Navbar.tsx` | 68-89 | Mobile menu has no focus trap, no Escape key handler, focus not managed on open/close. |
| `src/components/FunnelOrchestrator.tsx` | — | CTA overlay appears dynamically but no focus management — keyboard users may not notice it. |

#### erie-pro ✅ Good
- Dialog component uses Radix UI (`@radix-ui/react-dialog`) which provides proper focus trapping (`src/components/ui/dialog.tsx`).
- Sheet component uses Radix UI for the mobile nav — proper focus trapping (`src/components/ui/sheet.tsx`).
- Service search has full keyboard navigation (Arrow keys, Enter, Escape) at `src/components/service-search.tsx` lines 68-87.
- Cookie banner is accessible but has **no focus trap** — not required for a non-modal banner, so this is acceptable.

### 2.6 Color-Only Information Conveyance

#### erie-pro ⚠️ Issues

| File | Line | Issue |
|------|------|-------|
| `src/app/dashboard/page.tsx` | 343-358 | `StatusBadge` differentiates statuses by color only (`green` = active, `blue` = trial, `red` = past_due, `gray` = expired/cancelled). The status text is included (`{status.replace("_", " ")}`) ✅ — **text label present, passes**. |
| `src/app/dashboard/page.tsx` | 361-375 | `TemperatureBadge` uses color-coded badges for lead temperature (`cold` = blue, `warm` = amber, `hot` = orange, `burning` = red). Text label `{temperature}` is included ✅ — **passes**. |
| `src/app/dashboard/page.tsx` | 232-233 | Onboarding checklist uses green circle (done) vs empty circle (not done). The SVG checkmark is the only visual indicator — **no text alternative for "completed" vs "incomplete"**. Screen reader users see the label but not the completion status. |

#### neatcircle-beta ⚠️ Issues

| File | Line | Issue |
|------|------|-------|
| `src/app/dashboard/page.tsx` | 224 | Niche table: `color: niche.conversionRate > 10 ? "#22c55e" : "#f59e0b"` — **green/yellow color-only indicator** for good/bad conversion rates. No text or icon alternative. |
| `src/app/dashboard/page.tsx` | 310-319 | Status breakdown badges: `status.startsWith("ERROR") ? "#3b1219" : status === "CONVERTED" ? "#14532d" : "#1e1e3f"` — color differentiation, though status text is included in the badge ✅. |
| `src/components/AssessmentQuiz.tsx` | 199-208 | Progress bar uses gradient colors (green → cyan for low scores, orange → red for high scores) — **color is the only indicator of score quality**. No text saying "good" or "needs improvement". |

### 2.7 Form Label Associations

#### erie-pro ✅ Excellent
- All form inputs have proper `<Label htmlFor="...">` associations.
- Required fields marked with `aria-required="true"`.
- Contact form uses `aria-label="required"` on asterisks (`src/components/contact-form.tsx` lines 200, 215, 244).

#### neatcircle-beta ❌ Critical Issues

| File | Line | Issue |
|------|------|-------|
| `src/components/ROICalculator.tsx` | 133 | `<label>` element but no `htmlFor` attribute; `<select>` at line 134 has no `id` |
| `src/components/ROICalculator.tsx` | 148 | `<label>` without `htmlFor`; `<input type="range">` at line 153 has no `id` |
| `src/components/ROICalculator.tsx` | 161 | `<label>` without `htmlFor`; `<input type="number">` at line 165 has no `id` |
| `src/components/ROICalculator.tsx` | 176 | `<label>` without `htmlFor`; `<input type="range">` at line 180 has no `id` |
| `src/components/ROICalculator.tsx` | 190 | `<label>` without `htmlFor`; `<input type="range">` at line 194 has no `id` |
| `src/components/ROICalculator.tsx` | 241 | Email input has **no label at all** — only a `<p>` with "Get your full personalized ROI report:" |
| `src/components/WhatsAppOptIn.tsx` | 111-115 | Phone input has **no label** — placeholder only |
| `src/components/AssessmentQuiz.tsx` | 148-166 | Email, company, phone inputs have **no labels** — placeholders only |
| `src/components/ExitIntent.tsx` | 175-186 | Email and company inputs have **no labels** — placeholders only |

### 2.8 Skip Navigation Links

- **erie-pro** ✅: `src/app/layout.tsx` lines 111-116 — proper skip link with `sr-only focus:not-sr-only` pattern.
- **neatcircle-beta** ✅: `src/app/layout.tsx` lines 99-104 — proper skip link.

**Issue in neatcircle-beta**: The skip link target (`#main-content`) at line 105 is a `<div>` without `tabindex="-1"` — in some browsers, activating the skip link won't move keyboard focus to the target.

### 2.9 Screen Reader Announcements for Dynamic Content

#### erie-pro ✅ Good
- Form success/error states use `role="alert"` + `aria-live="polite"` (lead-form.tsx lines 156-157, 182-184; contact-form.tsx lines 159-160, 191-192).

#### neatcircle-beta ❌ Missing Throughout
- **No `aria-live` regions** in any component.
- Contact form success (line 113-122), error (lines 175-179) — no announcements.
- Chat widget messages — no `aria-live` on message container.
- Assessment quiz step transitions — no announcements.
- ROI calculator results — no announcements when calculation completes.
- Exit intent modal appearance — no announcement.
- WhatsApp opt-in appearance — no announcement.
- Funnel orchestrator CTA appearance — no announcement.

### 2.10 `tabIndex` Misuse

- **erie-pro**: `src/components/ui/sidebar.tsx` line 297 uses `tabIndex={-1}` — standard pattern in Radix UI sidebar, acceptable.
- **neatcircle-beta**: No `tabIndex` usage found — not applicable.

### 2.11 Focus Trapping in Modals/Dialogs

#### erie-pro ✅ 
- Uses Radix UI Dialog and Sheet primitives which provide built-in focus trapping.
- `src/components/ui/dialog.tsx`: Uses `@radix-ui/react-dialog` ✅
- `src/components/ui/sheet.tsx`: Uses `@radix-ui/react-dialog` ✅
- Cookie banner (`src/components/cookie-banner.tsx`): Properly uses `role="dialog"` + `aria-label` (non-modal, focus trap not required).

#### neatcircle-beta ❌ Critical
- **ExitIntent** (`src/components/ExitIntent.tsx`): Custom modal with no focus trap, no `role="dialog"`, no `aria-modal`, no Escape key handler, no focus restoration.
- **ChatWidget** (`src/components/ChatWidget.tsx`): Custom panel with no focus trap, no dialog role.
- **WhatsAppOptIn** (`src/components/WhatsAppOptIn.tsx`): Floating popup with no focus management.
- **FunnelOrchestrator** (`src/components/FunnelOrchestrator.tsx`): CTA overlay with no focus management.

### 2.12 `role="button"` on Non-Button Elements

No instances found in either project ✅. Both projects use native `<button>` or `<a>` elements for interactive controls.

---

## Summary of Critical Findings

### neatcircle-beta — High Priority Fixes

| # | Category | Severity | Description |
|---|----------|----------|-------------|
| 1 | UX | Critical | No `error.tsx` error boundaries — runtime errors crash pages silently |
| 2 | UX | Critical | No `loading.tsx` files — no loading feedback for any route |
| 3 | UX | Critical | No `not-found.tsx` — invalid URLs show default Next.js 404 |
| 4 | A11y | Critical | ExitIntent modal: no focus trap, no `role="dialog"`, no Escape dismiss, no `aria-modal` |
| 5 | A11y | Critical | ChatWidget: no focus trap, no dialog role, no `aria-live` for messages, send button missing `aria-label` |
| 6 | A11y | Critical | ROICalculator: 5 `<label>` elements not associated with inputs (missing `htmlFor`/`id` pairs) |
| 7 | A11y | Critical | Multiple form inputs across ExitIntent, WhatsAppOptIn, AssessmentQuiz, ROICalculator have **no labels at all** |
| 8 | A11y | Critical | Zero `aria-live` regions — no dynamic content is announced to screen readers |
| 9 | A11y | High | 6+ color contrast failures (text on dark backgrounds below 4.5:1 ratio) |
| 10 | A11y | High | Navbar mobile menu: no focus management, no Escape handler |
| 11 | UX | High | Dashboard page uses inline styles with fixed 2-column grid — breaks on mobile |
| 12 | UX | Medium | Footer service/industry links all point to same URL — misleading |
| 13 | UX | Medium | No form validation beyond HTML `required` — no inline error messages |
| 14 | A11y | Medium | Skip link target not focusable (missing `tabindex="-1"` on target div) |
| 15 | UX | Medium | No privacy policy or terms of service pages |

### erie-pro — Lower Priority Fixes

| # | Category | Severity | Description |
|---|----------|----------|-------------|
| 1 | UX | Low | Missing `loading.tsx` for 6 dashboard sub-routes (leads, billing, profile, analytics, integrations, webhooks) |
| 2 | UX | Low | No `global-error.tsx` for root layout errors |
| 3 | A11y | Low | Nested main landmarks: layout uses `role="main"` on div, pages use `<main>` |
| 4 | A11y | Low | Homepage "Get a Quote" link text (`opacity-0` on hover) not accessible without hover/mouse |
| 5 | A11y | Low | Onboarding checklist completion status not conveyed to screen readers (visual-only checkmarks) |
| 6 | UX | Low | Mobile nav CTA links to `/#services` while desktop CTA links to `/#get-quote` — inconsistent |
| 7 | A11y | Info | TCPA consent text is very small (`text-xs`) — consider slightly larger size for readability |
