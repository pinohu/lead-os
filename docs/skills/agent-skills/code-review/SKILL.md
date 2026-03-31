---
name: code-review
description: Perform a comprehensive code review checking TypeScript types, accessibility, security headers, form validation, dead links, placeholder content, console.log statements, and WCAG AA compliance
---

# Code Review

**Tier:** STANDARD (Tier 1 -- Quality)
**Category:** Static Analysis & Review
**Domain:** TypeScript correctness, accessibility, security, content quality

## Overview

This skill performs a systematic code review across LeadOS codebases. It goes beyond linting by checking for business-logic issues like placeholder content that shipped to production, dead internal links, missing accessibility attributes, and security misconfigurations. Every check produces a structured issue with severity, file, line number, and remediation guidance.

## Core Capabilities

- Scan for TypeScript `any` types and untyped function parameters
- Detect `console.log`, `console.warn`, `console.error` statements left in production code
- Find TODO, FIXME, HACK, and XXX comments
- Verify all internal links resolve to real routes
- Flag placeholder text ("Lorem ipsum", "Coming soon", "TBD", "example.com")
- Check for missing `aria-label`, `aria-describedby`, and `alt` attributes
- Verify color contrast meets WCAG AA (4.5:1 for text, 3:1 for large text)
- Check security headers (CSP, X-Frame-Options, HSTS) in middleware and next.config
- Validate form inputs have proper validation, labels, and error states
- Detect unused imports and dead exports

## When to Use

Trigger this skill when:
- "review this code", "check for issues", "PR review"
- "accessibility audit", "a11y check"
- "find placeholder content", "production readiness check"
- "security review", "check headers"
- Before any major release or client demo
- After merging a large feature branch

## Workflow

### Step 1: TypeScript Quality
```bash
grep -rn ": any" --include="*.ts" --include="*.tsx" src/
grep -rn "as any" --include="*.ts" --include="*.tsx" src/
```
Flag every `any` type. Suggest the correct type based on usage context.

### Step 2: Debug Artifacts
```bash
grep -rn "console\.\(log\|warn\|error\|debug\)" --include="*.ts" --include="*.tsx" src/
grep -rn "debugger" --include="*.ts" --include="*.tsx" src/
```
Exclude files in `__tests__/` and `test/` directories.

### Step 3: Unfinished Work
```bash
grep -rn "TODO\|FIXME\|HACK\|XXX\|TEMP\|PLACEHOLDER" --include="*.ts" --include="*.tsx" src/
```
Classify each by urgency: blocking (FIXME/HACK) vs. informational (TODO).

### Step 4: Placeholder Content
```bash
grep -rn "Lorem ipsum\|example\.com\|Coming soon\|TBD\|placeholder\|xxx\|test@" --include="*.tsx" src/
```
Any match in a non-test file is a CRITICAL issue for production.

### Step 5: Accessibility (WCAG AA)
```bash
grep -rn "<img" --include="*.tsx" src/ | grep -v "alt="
grep -rn "<button\|<a " --include="*.tsx" src/ | grep -v "aria-label"
grep -rn "<input\|<select\|<textarea" --include="*.tsx" src/ | grep -v "aria-\|label"
```
Check that interactive elements have accessible names and form inputs have labels.

### Step 6: Dead Links & Routes
Extract all `href=` and `Link href=` values from the codebase. Cross-reference against the actual route files in `app/` directories. Flag any link that points to a non-existent route.

### Step 7: Security Headers
Check `middleware.ts` and `next.config.js` for:
- Content-Security-Policy header
- X-Frame-Options header
- Strict-Transport-Security header
- X-Content-Type-Options header
- Referrer-Policy header

### Step 8: Form Validation
For every `<form>` or form-like component, verify:
- Client-side validation on required fields
- Server-side validation in the API route handler
- Error messages displayed to the user
- CSRF protection if the form mutates data

## Edge Cases

- **Intentional console.log** -- Some API routes use `console.error` for server logging. Flag but mark as LOW severity.
- **Dynamic routes** -- Links to `[slug]` routes cannot be statically validated. Note them as NEEDS_MANUAL_CHECK.
- **Third-party components** -- Do not flag accessibility issues inside `node_modules`. Only scan project source.
- **Tailwind color contrast** -- Map Tailwind classes to hex values before computing contrast ratios.
- **Monorepo paths** -- Run checks in each codebase separately; do not conflate erie-pro routes with kernel routes.

## Output Format

```
## Code Review Report

**Files scanned:** [count]
**Issues found:** [count]
**Critical:** [count] | **High:** [count] | **Medium:** [count] | **Low:** [count]

### Issues

| # | Severity | Category | File | Line | Description | Suggested Fix |
|---|----------|----------|------|------|-------------|---------------|
| 1 | CRITICAL | Placeholder | src/app/page.tsx | 42 | "Lorem ipsum" in hero | Replace with real copy |
| 2 | HIGH | A11y | src/components/Button.tsx | 15 | Missing aria-label | Add aria-label prop |
| 3 | MEDIUM | TypeScript | src/lib/utils.ts | 88 | Parameter typed as `any` | Type as `NicheConfig` |
| 4 | LOW | Debug | src/api/health/route.ts | 3 | console.log in prod | Remove or use logger |

### Summary by Category
| Category | Count |
|----------|-------|
| TypeScript | X |
| Accessibility | X |
| Security | X |
| Placeholder | X |
| Debug Artifacts | X |
| Dead Links | X |
```
