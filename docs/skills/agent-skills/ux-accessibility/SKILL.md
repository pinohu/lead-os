---
name: ux-accessibility
description: Enforce WCAG AA accessibility and UX standards across LeadOS -- color contrast 8:1 minimum, focus-visible rings, semantic HTML roles, form label requirements, no dead buttons, no placeholder content visible to users, emergency page phone numbers, and admin page protection
---

# UX Accessibility Standards

**Tier:** STANDARD (Tier 1 -- Quality)
**Category:** Accessibility & UX Compliance
**Domain:** WCAG AA, color contrast, semantic HTML, form UX, content quality, admin protection

## Overview

This skill enforces a strict set of accessibility and UX standards across all LeadOS pages. LeadOS exceeds WCAG AA minimums by requiring 8:1 color contrast (above the 4.5:1 AA minimum) to ensure readability for all users. Every interactive element must be keyboard-accessible with visible focus rings. No page may ship with placeholder text, dead buttons, or missing phone numbers on emergency service pages. Admin pages must be auth-gated and never accessible to unauthenticated users.

## Core Capabilities

- Audit color contrast ratios against the 8:1 minimum standard
- Verify focus-visible rings on all interactive elements (buttons, links, inputs)
- Check semantic HTML: proper heading hierarchy, landmark roles, list structures
- Validate form labels, error states, and required field indicators
- Detect dead buttons (onClick handlers that do nothing or are undefined)
- Find placeholder content visible to end users (Lorem ipsum, TBD, Coming Soon, example.com)
- Verify emergency pages include a clickable phone number
- Confirm admin pages redirect unauthenticated users to login

## When to Use

Trigger this skill when:
- "accessibility check", "a11y audit", "WCAG compliance"
- "check contrast", "is this readable?"
- "UX review", "check for dead buttons"
- "find placeholder text", "production readiness"
- Creating or modifying any user-facing page
- Before client demos or investor presentations
- After UI theme changes or color palette updates

## Standards

### S1: Color Contrast (8:1 Minimum)
LeadOS standard exceeds WCAG AA (4.5:1). All text must achieve 8:1 contrast against its background.
- Map Tailwind color classes to hex values for computation
- Check both light and dark mode if applicable
- Large text (18px+ or 14px+ bold) still requires 8:1, not the relaxed 3:1
- Gradient backgrounds: measure contrast at the lowest-contrast point

### S2: Focus-Visible Rings
Every interactive element must show a visible focus indicator via `:focus-visible` (2px solid, 2px offset). Never use `outline: none` without a replacement. Ring contrast must be 3:1 minimum. Tab order must follow visual layout.

### S3: Semantic HTML
- Heading hierarchy: exactly one `<h1>` per page, no skipped levels (h1 then h3)
- Landmark roles: `<main>`, `<nav>`, `<header>`, `<footer>` present on every page
- Lists: use `<ul>`/`<ol>` for list content, never styled `<div>` sequences
- Buttons vs links: `<button>` for actions, `<a>` for navigation -- never swap

### S4: Form Requirements
Every form input must have:
- A visible `<label>` element with `htmlFor` matching the input `id`
- `aria-required="true"` on required fields
- An error message element linked via `aria-describedby`
- Keyboard-submittable (Enter key triggers submit)

### S5: No Dead Buttons
A button is "dead" if:
- `onClick` is `undefined`, `null`, or an empty function `() => {}`
- It navigates nowhere and performs no action
- It is visually styled as interactive but is actually a `<div>` or `<span>`
Scan for these patterns and flag as CRITICAL.

### S6: No Placeholder Content
These strings must never appear on any production page outside of test files:
- "Lorem ipsum", "dolor sit amet"
- "Coming soon", "TBD", "TODO", "FIXME"
- "example.com", "test@", "placeholder"
- "XXX", "TEMP", "sample text"

### S7: Emergency Page Phone Numbers
Any page related to emergency services (emergency plumber, emergency electrician, etc.) must include:
- A clickable `tel:` link with a real phone number
- The phone number visible in the hero section, not buried in the footer
- `aria-label` on the link describing the action ("Call for emergency plumbing")

### S8: Admin Page Protection
Every route under `/admin`, `/dashboard`, `/settings`:
- Must redirect to `/login` if no valid auth token is present
- Must never render admin UI content before auth check completes
- Middleware must block these routes for unauthenticated requests

## Edge Cases

- **Dark mode contrast** -- Colors that pass 8:1 in light mode may fail in dark mode. Audit both themes.
- **Dynamic content** -- User-generated text on a colored background may fail contrast. Enforce minimum contrast in the component, not just the theme.
- **Third-party embeds** -- Iframes and embedded widgets are out of scope. Note them as SKIP, not FAIL.
- **SVG icons without text** -- Icon-only buttons need `aria-label`. An SVG `<title>` element alone is insufficient for screen readers.
- **Tailwind arbitrary values** -- Classes like `text-[#abc123]` must be resolved to hex for contrast calculation.
- **SSR flash** -- Admin pages may briefly flash content before client-side redirect. The middleware must block server-side, not rely on client redirect.

## Output Format

```
## UX Accessibility Report

**Pages audited:** [count]
**Standards checked:** 8
**Issues found:** [count]
**Critical:** [count] | **High:** [count] | **Medium:** [count]

### Issues
| # | Standard | Severity | File | Description |
|---|----------|----------|------|-------------|
| 1 | S1 Contrast | HIGH | hero.tsx:12 | 5.2:1 ratio (need 8:1) |
| 2 | S5 Dead Button | CRITICAL | pricing.tsx:45 | onClick is empty function |

### Standards Summary
S1-S8: [PASS/FAIL count per standard]
```
