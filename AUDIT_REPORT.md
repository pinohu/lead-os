# UX & Accessibility Audit Report (WCAG 2.1 AA)

**Date:** 2026-04-05  
**Scope:** All 4 apps in the monorepo  
**Legend:** APP1 = `lead-os-hosted-runtime-wt-hybrid` (kernel/dashboard), APP2 = `erie-pro` (territory/SEO), APP3 = `neatcircle-beta` (marketing edge), APP4 = `lead-os-hosted-runtime-wt-public` (embed/subdomain)

---

## Part A — UX Audit

### 1. Form Components (Validation, Error Messages, Loading, Success, Disabled States)

#### APP2 — erie-pro ✅ (strong)

| File | Line(s) | Finding |
|---|---|---|
| `src/components/lead-form.tsx` | 41-46 | ✅ `loading`, `result`, `tcpaConsent`, `errors`, `canResubmit` states all tracked |
| `src/components/lead-form.tsx` | 58-67 | ✅ Per-field validation with `validateField()` for name/email/phone |
| `src/components/lead-form.tsx` | 69-78 | ✅ `handleBlur` and `handlePhoneChange` clear/set errors on interaction |
| `src/components/lead-form.tsx` | 153-176 | ✅ Full success state with CheckCircle icon, message, and re-submit button with cooldown |
| `src/components/lead-form.tsx` | 270 | ✅ Submit button `disabled={loading \|\| !isFormValid}` |
| `src/components/lead-form.tsx` | 271 | ✅ Loading text: `"Submitting..."` |
| `src/components/contact-form.tsx` | 51-56 | ✅ Mirrors the same pattern: loading, result, errors, phone, canResubmit |
| `src/components/contact-form.tsx` | 156-179 | ✅ Full success state |
| `src/components/contact-form.tsx` | 248 | ✅ Disabled state on submit |
| `src/app/login/login-form.tsx` | 20-41 | ✅ Handles error from credentials, loading state, try/catch |
| `src/app/login/login-form.tsx` | 98-126 | ✅ Submit disabled during loading, spinner animation shown |
| `src/app/forgot-password/forgot-password-form.tsx` | 12-41 | ✅ Sent state, loading, error, rate-limit (429) handling |
| `src/app/forgot-password/forgot-password-form.tsx` | 44-61 | ✅ Success state with "check your inbox" message |
| `src/app/reset-password/reset-password-form.tsx` | 37-76 | ✅ Client-side password length + match validation |
| `src/app/reset-password/reset-password-form.tsx` | 78-93 | ✅ Success state with "sign in" CTA |
| `src/app/reset-password/reset-password-form.tsx` | 19-34 | ✅ Missing token/email guard with helpful CTA |
| `src/app/dashboard/disputes/dispute-form.tsx` | — | ✅ Uses role="alert" aria-live="polite" for errors |
| `src/components/homepage-lead-form.tsx` | — | ✅ Mirrors lead-form pattern |

#### APP1 — lead-os-hosted-runtime-wt-hybrid ✅ (strong)

| File | Line(s) | Finding |
|---|---|---|
| `src/app/auth/sign-in/page.tsx` | 57-63 | ✅ Error banner with `role="alert" aria-live="assertive"` |
| `src/app/auth/sign-in/page.tsx` | 66-96 | ✅ Sign-in form with label, aria-describedby, email help text |
| `src/components/SetupWizardClient.tsx` | — | ✅ Multi-step wizard with validation per step, error/success states |
| `src/app/onboard/page.tsx` | 340 | ✅ Error state with `role="alert"` |
| `src/app/contact/page.tsx` | 155 | ✅ Per-field error with `role="alert"` |
| `src/components/LPLeadCaptureForm.tsx` | 118, 255 | ✅ aria-live on error/success states |

#### APP3 — neatcircle-beta ⚠️ (gaps)

| File | Line(s) | Finding | Severity |
|---|---|---|---|
| `src/components/Contact.tsx` | 20 | ✅ 4-state tracking: idle/sending/sent/error | — |
| `src/components/Contact.tsx` | 167-173 | ✅ Submit disabled during sending, text changes to "Sending..." | — |
| `src/components/Contact.tsx` | 113-121 | ✅ Success state with green checkmark | — |
| `src/components/Contact.tsx` | 175-178 | ⚠️ **Error message lacks `role="alert"` or `aria-live`** — screen readers won't announce it | Medium |
| `src/components/ROICalculator.tsx` | 82-115 | ⚠️ **No error handling on the `fetch` call** — `.catch(() => {})` silently swallows failures, no user feedback | High |
| `src/components/ExitIntent.tsx` | — | ⚠️ **No error state** for the email capture form — if `fetch` fails the user sees nothing | Medium |
| `src/components/ChatWidget.tsx` | 370-388 | ⚠️ **Send button has no `aria-label`** — only contains an SVG icon, no accessible text | High |

#### APP4 — lead-os-hosted-runtime-wt-public ✅ (solid)

| File | Line(s) | Finding |
|---|---|---|
| `src/components/AdaptiveLeadCaptureForm.tsx` | 38-48 | ✅ step, error, result, isPending via `useTransition` |
| `src/components/AdaptiveLeadCaptureForm.tsx` | 54-77 | ✅ Per-step validation with user-friendly messages |
| `src/components/AdaptiveLeadCaptureForm.tsx` | 163-178 | ✅ Full success state with score, hot-path indicator, CTAs |
| `src/components/AdaptiveLeadCaptureForm.tsx` | 267-271 | ✅ Error with `role="alert"` |
| `src/components/AdaptiveLeadCaptureForm.tsx` | 284 | ✅ `disabled={isPending}` with loading text |

---

### 2. Navigation: 404 Pages, Error Boundaries, Loading Skeletons

| App | 404 Page | Error Boundary (root) | Error Boundary (dashboard) | Loading Skeleton |
|---|---|---|---|---|
| APP1 | ✅ `src/app/not-found.tsx` (L4-35) | ✅ `src/app/error.tsx` (L1-44) | ✅ `src/app/dashboard/error.tsx` | ✅ `src/app/loading.tsx` (spinner) + `src/app/dashboard/loading.tsx` |
| APP2 | ✅ `src/app/not-found.tsx` (L1-36) | ✅ `src/app/error.tsx` (L1-43) | ✅ `src/app/dashboard/error.tsx` + `src/app/admin/error.tsx` | ✅ `src/app/loading.tsx` (rich skeleton) + 4 more loading files |
| APP3 | ❌ **No `not-found.tsx`** | ❌ **No `error.tsx`** | N/A | ❌ **No `loading.tsx`** |
| APP4 | ❌ **No `not-found.tsx`** | ❌ **No `error.tsx`** | N/A | ❌ **No `loading.tsx`** |

**Critical findings:**
- **APP3 (`neatcircle-beta`)**: No 404 page, no error boundary, no loading state. Users hitting a bad URL or a runtime error see the generic Next.js error or a white screen.
- **APP4 (`lead-os-hosted-runtime-wt-public`)**: Same — missing all three. The dashboard section has no loading skeleton; data-dependent pages may flash blank content.

---

### 3. Mobile Responsiveness

#### Viewport Meta Tags

| App | Has `<meta name="viewport">`? | Location |
|---|---|---|
| APP1 | ✅ Explicit in layout `src/app/layout.tsx:77` | `width=device-width, initial-scale=1` |
| APP2 | ✅ Next.js auto-injects viewport | No explicit meta needed (Next.js handles it) |
| APP3 | ⚠️ **No explicit viewport meta** — relies on Next.js default, but `<html>` is plain `<html lang="en">` without `suppressHydrationWarning` | `src/app/layout.tsx:89` |
| APP4 | ⚠️ **No explicit viewport meta, no Tailwind/CSS** — layout is bare: `<html lang="en"><body>` | `src/app/layout.tsx:17-18` |

#### Tailwind Breakpoints Usage

| App | Uses responsive breakpoints? | Details |
|---|---|---|
| APP1 | ✅ Extensive | `sm:`, `md:`, `lg:` throughout pages and components |
| APP2 | ✅ Extensive | `sm:`, `md:`, `lg:` used consistently in grid layouts, navigation, forms |
| APP3 | ✅ Good | `sm:`, `md:`, `lg:` in hero, grids, forms |
| APP4 | ⚠️ **No Tailwind classes** | Uses plain CSS classes (`capture-shell`, `panel`, `auth-form`). Responsive behavior depends on external stylesheet. |

#### Touch Targets

| File | Line | Finding | Severity |
|---|---|---|---|
| APP2 `src/app/login/login-form.tsx` | 129-138 | ⚠️ "Forgot password?" and "Claim your territory" links are `text-xs` with no padding — likely **< 44×44px touch target** | Medium |
| APP3 `src/components/Navbar.tsx` | 31-38 | ⚠️ Desktop nav links are `text-sm` but mobile hamburger button (`p-2`) is borderline at ~32px | Low |
| APP3 `src/components/ChatWidget.tsx` | 380-388 | ⚠️ Send button in chat is `px-3 py-2` — may be below 44px minimum | Medium |

---

### 4. User-Facing Flows

#### Onboarding

| App | Onboarding Flow | Details |
|---|---|---|
| APP1 | ✅ Full wizard at `src/app/onboard/page.tsx` | 6-step wizard: email → niche → plan → branding → integrations → review |
| APP1 | ✅ Setup wizard at `src/components/SetupWizardClient.tsx` | 5-step progressive wizard with nav progress bar |
| APP2 | ✅ Provider claim flow at `src/app/for-business/claim/page.tsx` | Business claim → verification → success |
| APP3 | ❌ **No onboarding flow** | Direct marketing pages; no guided first-run experience |
| APP4 | ❌ **No onboarding flow** | Sign-in page exists but no guided setup after first login |

#### Auth (Login/Signup/Reset)

| App | Login | Signup | Forgot Password | Reset Password |
|---|---|---|---|---|
| APP1 | ✅ `src/app/auth/sign-in/page.tsx` (magic link) | ✅ via onboard flow | N/A (passwordless) | N/A |
| APP2 | ✅ `src/app/login/` (credentials) | ✅ via claim | ✅ `src/app/forgot-password/` | ✅ `src/app/reset-password/` |
| APP3 | ❌ **No auth flow** | ❌ **No auth** | ❌ | ❌ |
| APP4 | ✅ `src/app/auth/sign-in/page.tsx` (magic link) | N/A | N/A | N/A |

#### Dashboard Navigation

| App | Sidebar/Nav | Breadcrumbs |
|---|---|---|
| APP1 | ✅ `src/app/dashboard/DashboardSidebar.tsx` — collapsible sidebar with keyboard support, 27+ pages | No breadcrumbs found |
| APP2 | ✅ `src/app/dashboard/layout.tsx` — sidebar layout with nested routes | Skeleton includes breadcrumbs |
| APP3 | ⚠️ `src/app/dashboard/page.tsx` exists but is a single metrics page | No dashboard nav |
| APP4 | ⚠️ Dashboard pages exist but no shared nav component found | No sidebar/breadcrumbs |

---

### 5. Empty States

| File | Line | What | Finding |
|---|---|---|---|
| APP1 `src/app/dashboard/page.tsx` | 252-253 | No funnel traffic | ✅ "No funnel traffic yet" message |
| APP1 `src/app/dashboard/page.tsx` | 272-273 | No leads | ✅ "No leads have been captured in this runtime yet" |
| APP1 `src/app/dashboard/page.tsx` | 298+ | No milestone events | ✅ Handled |
| APP2 `src/app/dashboard/leads/page.tsx` | — | No leads | ⚠️ **Not checked** — server component renders table directly from DB; if no leads, user sees empty table with headers but no explicit empty state message |
| APP2 `src/app/lead-status/page.tsx` | 154 | No tracking results | ✅ "text-center text-gray-500 py-8" message shown |
| APP3 `src/app/dashboard/page.tsx` | — | Metrics page | ⚠️ **No empty state** — fetches from API; if zero data, cards show `0` values but no contextual guidance |
| APP4 `src/app/dashboard/page.tsx` | — | Dashboard | ⚠️ **Unknown** — depends on API response; no explicit empty-state component found |

---

### 6. Toast/Notification System

| App | System | Details |
|---|---|---|
| APP1 | ✅ `src/components/ui/sonner.tsx` + `<Toaster />` in layout (L211) | Sonner toast library integrated at root layout |
| APP2 | ✅ Dual: `src/components/ui/sonner.tsx` AND `src/components/ui/toaster.tsx` + `src/components/ui/toast.tsx` | Has both Radix toast and Sonner. ⚠️ **Inconsistency risk** — two different toast systems |
| APP3 | ❌ **No toast system** | No `<Toaster />` in layout, no toast components. Errors shown inline only |
| APP4 | ❌ **No toast system** | No `<Toaster />` in layout, no toast components |

---

### 7. Layout Files (Metadata, Fonts, Viewport)

| App | File | Metadata | Font | Viewport | lang | suppressHydrationWarning |
|---|---|---|---|---|---|---|
| APP1 | `src/app/layout.tsx` | ✅ Full (title template, OG, Twitter, icons) | ✅ Inter w/ swap | ✅ Explicit L77 | ✅ `en` | ✅ |
| APP2 | `src/app/layout.tsx` | ✅ Full (title template, OG, Twitter, icons, manifest) | ✅ Inter | ✅ (Next.js default) | ✅ `en` | ✅ |
| APP3 | `src/app/layout.tsx` | ✅ Full (title, OG, Twitter, keywords) | ✅ Geist + Geist_Mono | ⚠️ No explicit viewport | ✅ `en` | ❌ **Missing** |
| APP4 | `src/app/layout.tsx` | ⚠️ **Minimal** — title + description only. No OG, no Twitter, no icons | ❌ **No font loaded** | ❌ **No explicit viewport** | ✅ `en` | ❌ **Missing** |

---

## Part B — Accessibility Audit (WCAG 2.1 AA)

### 1. Images Without `alt` Attributes

All `<img>` tags in the four primary apps have `alt` attributes:

| File | Line | alt Value | Status |
|---|---|---|---|
| APP2 `src/components/photo-gallery-dialog.tsx` | 47-51 | `alt={\`${providerName} photo ${i + 2}\`}` | ✅ |
| APP2 `src/components/photo-gallery-dialog.tsx` | 69-73 | `alt={\`${providerName} photo ${i + 1}\`}` | ✅ |
| APP2 `src/components/ui/optimized-image.tsx` | 22-26 | `alt={alt}` (prop pass-through) | ✅ |
| APP2 `src/app/dashboard/profile/photo-upload.tsx` | 84-88 | `alt={\`${businessName} profile photo\`}` | ✅ |
| APP2 `src/app/[niche]/[provider]/page.tsx` | 411-416 | `alt=""` with `aria-hidden="true"` (decorative) | ✅ |

**No native `<img>` tags found in APP1, APP3, or APP4** (they use Next.js `<Image>` or SVG icons instead).

---

### 2. Buttons/Links Without Accessible Labels

| File | Line | Element | Finding | Severity |
|---|---|---|---|---|
| APP3 `src/components/ChatWidget.tsx` | 380-388 | `<button>` with only SVG child | ❌ **No `aria-label`, no text content** — inaccessible send button | **High** |
| APP3 `src/components/ExitIntent.tsx` | (close button) | `<button>` | ⚠️ Needs verification — may contain only "×" character | Medium |
| APP1 `src/app/dashboard/DashboardSidebar.tsx` | 347-354 | `<button>` | ✅ Has `aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}` |
| APP2 `src/components/mobile-nav.tsx` | 27 | `<Button>` | ✅ Has `aria-label="Open menu"` |
| APP3 `src/components/Navbar.tsx` | 49-53 | `<button>` | ✅ Has `aria-label="Toggle menu"` |
| APP3 `src/components/FunnelOrchestrator.tsx` | 214-219 | `<button>` | ✅ Has `aria-label="Dismiss"` |

---

### 3. Heading Hierarchy

#### APP3 — neatcircle-beta ⚠️

| File | Heading Levels Used | Finding |
|---|---|---|
| `src/app/page.tsx` (homepage) | Uses h1 (Hero), h2 (sections), h3 (cards) | ✅ Correct hierarchy |
| `src/components/Footer.tsx` | 58, 75, 94 | ⚠️ **Uses `<h4>` directly** — skips h2/h3 in context of the page hierarchy. Should use a styled lower-weight element or ensure h2/h3 precede it | Low |
| `src/components/AssessmentQuiz.tsx` | 139 (h3), 196 (h3), 215 (h4), 265 (h3) | ⚠️ Multiple h3 then h4 — context-dependent but the component jumps between levels | Low |
| `src/app/locations/[slug]/page.tsx` | 92 (h1), 109 (h3) | ⚠️ **Skips h2** — goes h1 → h3 | Medium |

#### APP2 — erie-pro ✅

Footer uses `<h4>` elements (L279, 304, 336) within sections that have implied h2/h3 context. Generally well-structured.

#### APP1 — lead-os-hosted-runtime-wt-hybrid ✅

Uses proper h1 → h2 → h3 hierarchy across pages. `aria-labelledby` used for section headings.

#### APP4 — lead-os-hosted-runtime-wt-public ✅

Simple page structure with h1 → h2 → h3.

---

### 4. Form Inputs With Associated Labels

| File | Line | Input | Finding | Severity |
|---|---|---|---|---|
| APP3 `src/components/ROICalculator.tsx` | 133 | `<select>` | ⚠️ Uses `<label className="...">Industry</label>` but **label is not associated** — no `htmlFor` and `id` pairing | **High** |
| APP3 `src/components/ROICalculator.tsx` | 148 | range input | ⚠️ Same — **label text "Number of Employees" not associated via `htmlFor`/`id`** | **High** |
| APP3 `src/components/ROICalculator.tsx` | 148-160 | All range inputs | ⚠️ **4 more range inputs** with same pattern — label text present but not programmatically associated | **High** |
| APP4 `src/components/AdaptiveLeadCaptureForm.tsx` | 210-241 | All text inputs | ⚠️ Uses wrapping `<label>` pattern (label text + input child). **This is valid HTML** but the inputs lack `id` attributes — works for click-to-focus but may not be optimal for all AT | Low |
| APP3 `src/components/ChatWidget.tsx` | 371-378 | Text input | ⚠️ **No `<label>` or `aria-label`** — only has `placeholder="Type a message..."` | **High** |
| APP2 forms | All | All | ✅ All use `htmlFor`/`id` pairing or `<Label>` component from shadcn | — |
| APP1 forms | All | All | ✅ Uses `<label htmlFor>` + `id` consistently | — |

---

### 5. Color Contrast Issues

**Potential WCAG AA failures (4.5:1 ratio for normal text, 3:1 for large text):**

| Class Pattern | Where Used | Concern | Severity |
|---|---|---|---|
| `text-slate-400` on dark bg (`bg-navy`, `bg-slate-900`) | APP3: Footer (L47, 64, 83, 103), Hero (L121), Contact (L78, 92, 105), Testimonials (L70), About (L98) | ⚠️ `slate-400` (#94a3b8) on `slate-900` (#0f172a) = ~4.4:1 — **borderline AA for body text** | Medium |
| `text-slate-400` on white bg | APP3: Pricing (L105, 120), Industries page (L55, 86) | ⚠️ `slate-400` (#94a3b8) on white (#fff) = ~3.3:1 — **fails AA for normal text** | **High** |
| `text-slate-500` on `bg-slate-900` | APP3: Footer (L50-51, 130) | ⚠️ `slate-500` (#64748b) on `slate-900` = ~3.2:1 — **fails AA** | **High** |
| `text-gray-400` on light bg | APP2: `setup-form.tsx` (L168), `lead-status/page.tsx` (L32, 41) | ⚠️ `gray-400` (#9ca3af) on white = ~3.0:1 — **fails AA** | **High** |
| `text-gray-500` on white bg | APP2: login, forgot-password, settings — multiple files | ⚠️ `gray-500` (#6b7280) on white = ~4.6:1 — **passes** but barely | Low |
| `text-muted-foreground` | All apps | ✅ Uses CSS variable — passes if configured correctly | — |
| `text-gray-300` on white bg | APP2: `setup-form.tsx` (L103, 123, 144, 165) as label text | ❌ **NOT contrast-failing** — these are paired with `dark:text-gray-300` (dark mode only). Light mode uses `text-gray-700`. | ✅ |

---

### 6. Focus Indicators

| App | Status | Details |
|---|---|---|
| APP1 | ✅ Excellent | `focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2` on buttons, inputs, and interactive elements (L131-360 of page.tsx, contact/page.tsx, error.tsx) |
| APP2 | ✅ Good | shadcn/ui components include `focus-visible:ring-2` by default. Custom forms (login, reset-password) use `focus:outline-none focus:ring-1 focus:ring-blue-500` |
| APP3 | ⚠️ **Inconsistent** | Contact form inputs use `focus:ring-2 focus:ring-cyan/40` ✅, but Navbar links (`text-slate-300 hover:text-white`) have **no visible focus indicator** ❌. ROI Calculator inputs use `focus:ring-2 focus:ring-cyan/20` (very subtle). ChatWidget input uses `focus:ring-1 focus:ring-cyan/20` (extremely subtle) | **High** |
| APP4 | ⚠️ **Relies on browser defaults** | Uses custom CSS classes (`primary`, `secondary`) — no explicit `focus-visible` styles found in components. Browser default outline may be suppressed | Medium |

---

### 7. Keyboard Navigation

| File | Line | Finding |
|---|---|---|
| APP1 `src/app/dashboard/leads/page.tsx` | 350-377 | ✅ Sort headers have `tabIndex={0}` + `onKeyDown` (Enter/Space) |
| APP1 `src/app/dashboard/tenants/page.tsx` | 125-126 | ✅ `tabIndex={0}` + `onKeyDown` for expand/collapse |
| APP1 `src/app/dashboard/DashboardSidebar.tsx` | 272 | ✅ Traps focus in sidebar with `querySelectorAll('a[href], button:not([disabled]), [tabindex]')` |
| APP1 `src/app/onboard/page.tsx` | 358, 423, 487 | ✅ `onKeyDown` for Enter key on interactive elements |
| APP1 `src/components/getting-started-checklist.tsx` | 258 | ✅ `onKeyDown` for checklist items |
| APP2 `src/components/service-search.tsx` | 111 | ✅ `onKeyDown={handleKeyDown}` for search |
| APP3 `src/components/ChatWidget.tsx` | 376 | ✅ Enter key sends message |
| APP3 `src/components/Navbar.tsx` | — | ⚠️ **Mobile menu toggle and links lack keyboard close** (Escape key handler) | Medium |
| APP4 | — | ⚠️ **No explicit keyboard handlers found** — relies on native form behavior | Low |

---

### 8. `aria-live` Regions for Dynamic Content

| App | Usage | Assessment |
|---|---|---|
| APP1 | ✅ Extensive: 15+ instances across SetupWizardClient, calculator, error pages, dashboard pages, forms | Properly uses `aria-live="polite"` for status updates and `aria-live="assertive"` for errors |
| APP2 | ✅ Excellent: Every form error/success uses `role="alert" aria-live="polite"` | `lead-form.tsx` (L157, 184), `contact-form.tsx` (L160, 192), `login-form.tsx` (L49), `forgot-password-form.tsx` (L68), all dashboard forms |
| APP3 | ⚠️ **No `aria-live` regions found in any component** | Contact.tsx error (L176) is plain `<p>` without `role="alert"` or `aria-live`. ChatWidget messages appear dynamically without announcement. | **High** |
| APP4 | ✅ Good: `AdaptiveLeadCaptureForm.tsx` (L157) uses `aria-live="polite"` on sticky summary, sign-in page uses `role="alert"` | — |

---

### 9. Skip Navigation Links

| App | Has Skip Link? | Location | Quality |
|---|---|---|---|
| APP1 | ✅ | `src/app/layout.tsx:135-137` | `sr-only focus:not-sr-only` with proper styling, links to `#main-content` |
| APP2 | ✅ | `src/app/layout.tsx:111-116` | `sr-only focus:not-sr-only focus:fixed` — excellent implementation |
| APP3 | ✅ | `src/app/layout.tsx:99-104` | Present and functional |
| APP4 | ✅ | `src/app/layout.tsx:19-21` | Present but uses `className="skip-link"` — ⚠️ **requires external CSS** to be visually hidden/shown. If CSS is missing, skip link is always visible or broken |

---

### 10. Semantic HTML

| App | `<main>` | `<nav>` | `<header>` | `<footer>` | `<section>` | `<article>` | Assessment |
|---|---|---|---|---|---|---|---|
| APP1 | ✅ `page.tsx:115`, error pages, pricing, sites | ✅ Footer navs with `aria-label`, setup wizard | ✅ Via SiteHeader | ✅ `layout.tsx:155` with `role="contentinfo"` | ✅ Extensive with `aria-labelledby` | ✅ In offers, industries, sites pages | **Excellent** |
| APP2 | ✅ `not-found.tsx:7`, error pages, loading | ✅ Mobile nav (`aria-label="Mobile navigation"`), footer navs (`aria-label`) | ✅ Layout header with `<nav aria-label="Main navigation">` | ✅ `layout.tsx:252` with `role="contentinfo"` | ✅ Used in content pages | ✅ Limited usage | **Good** |
| APP3 | ❌ **No `<main>` element** in layout or page components | ✅ Navbar `<nav>` (L20) | ❌ **No `<header>` element** — Navbar is a `<nav>` directly | ✅ Footer.tsx (L35) | ✅ Used in sections (Contact, Hero) | ❌ No `<article>` elements | **Poor** |
| APP4 | ✅ `sign-in/page.tsx:15` | ❌ **No `<nav>`** element | ❌ **No `<header>`** | ❌ **No `<footer>`** | ✅ Used in sign-in, forms | ✅ In AdaptiveLeadCaptureForm | **Poor** |

#### Specific findings:

| File | Line | Finding | Severity |
|---|---|---|---|
| APP3 `src/app/layout.tsx` | 105 | `<div id="main-content">` — should be `<main id="main-content">` | **High** |
| APP4 `src/app/layout.tsx` | 31 | `<div id="main-content">` — should be `<main id="main-content">` | **High** |
| APP2 `src/app/layout.tsx` | 244 | `<div id="main-content" role="main">` — ⚠️ `role="main"` is redundant if changed to `<main>`, but the current `<div>` with `role="main"` is acceptable | Low |
| APP1 `src/app/layout.tsx` | 152 | `<div id="main-content">` — should be `<main>` but layout includes header/footer outside the div | Medium |

---

## Summary of Critical Findings (Release Blockers)

### P0 — Must Fix Before Release

| # | App | Issue | File:Line |
|---|---|---|---|
| 1 | APP3 | **No `not-found.tsx`** — bad URLs show generic error | `src/app/` (missing file) |
| 2 | APP3 | **No `error.tsx`** — runtime errors crash with no recovery | `src/app/` (missing file) |
| 3 | APP3 | **No `loading.tsx`** — no loading feedback | `src/app/` (missing file) |
| 4 | APP4 | **No `not-found.tsx`** — bad URLs show generic error | `src/app/` (missing file) |
| 5 | APP4 | **No `error.tsx`** — runtime errors crash with no recovery | `src/app/` (missing file) |
| 6 | APP4 | **No `loading.tsx`** — no loading feedback | `src/app/` (missing file) |
| 7 | APP3 | **ChatWidget send button inaccessible** — SVG-only, no aria-label | `src/components/ChatWidget.tsx:380-388` |
| 8 | APP3 | **ChatWidget input has no label** — only placeholder | `src/components/ChatWidget.tsx:371-378` |
| 9 | APP3 | **ROICalculator inputs not labeled** — 6 inputs missing `htmlFor`/`id` | `src/components/ROICalculator.tsx:133-160` |
| 10 | APP3 | **No `aria-live` anywhere** — dynamic content invisible to screen readers | All components |
| 11 | APP3 | **`<div>` instead of `<main>`** — skip link target is not a landmark | `src/app/layout.tsx:105` |
| 12 | APP4 | **`<div>` instead of `<main>`** — skip link target is not a landmark | `src/app/layout.tsx:31` |
| 13 | APP3 | **Color contrast failures** — `text-slate-400` on white, `text-slate-500` on dark | Multiple (see Section B.5) |

### P1 — Should Fix Before Release

| # | App | Issue | File:Line |
|---|---|---|---|
| 14 | APP3 | Contact form error lacks `role="alert"` | `src/components/Contact.tsx:175-178` |
| 15 | APP3 | ROI Calculator swallows fetch errors silently | `src/components/ROICalculator.tsx:111` |
| 16 | APP3 | ExitIntent email form has no error state | `src/components/ExitIntent.tsx` |
| 17 | APP3 | Navbar links have no focus indicators | `src/components/Navbar.tsx:31-38` |
| 18 | APP3 | No `<header>` semantic element | `src/components/Navbar.tsx` |
| 19 | APP3 | No `<main>` semantic element | `src/app/layout.tsx` |
| 20 | APP4 | Minimal metadata — no OG, no Twitter, no icons | `src/app/layout.tsx:7-10` |
| 21 | APP4 | No font loaded — falls back to system fonts | `src/app/layout.tsx` |
| 22 | APP4 | No `suppressHydrationWarning` on `<html>` | `src/app/layout.tsx:17` |
| 23 | APP4 | No toast/notification system | Layout level |
| 24 | APP3 | No toast/notification system | Layout level |
| 25 | APP2 | Two different toast systems (Sonner + Radix) — inconsistency risk | `src/components/ui/sonner.tsx` + `src/components/ui/toaster.tsx` |
| 26 | APP3 | Heading skip h1→h3 in locations page | `src/app/locations/[slug]/page.tsx:92,109` |
| 27 | APP4 | Skip link relies on external CSS class | `src/app/layout.tsx:19-21` |
| 28 | APP2 | `text-gray-400` used on light backgrounds | Multiple files (see Section B.5) |

### P2 — Nice to Have

| # | App | Issue | File:Line |
|---|---|---|---|
| 29 | APP3 | Footer `<h4>` elements skip heading levels | `src/components/Footer.tsx:58,75,94` |
| 30 | APP2 | Login "Forgot password?" touch target too small | `src/app/login/login-form.tsx:129-138` |
| 31 | APP1 | Main content wrapper is `<div>` not `<main>` | `src/app/layout.tsx:152` |
| 32 | APP4 | No Tailwind/responsive framework — responsiveness unverified | `src/app/layout.tsx` |
| 33 | APP3 | `suppressHydrationWarning` missing on `<html>` | `src/app/layout.tsx:89` |
