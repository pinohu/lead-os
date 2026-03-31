---
name: nextjs-architecture
description: Apply Next.js 16 App Router patterns for LeadOS -- generateStaticParams for SSG, Promise-based params, middleware auth with PUBLIC_EXACT whitelist, subdomain routing, dual CSS systems, and security headers via next.config.ts
---

# Next.js Architecture

**Tier:** METHODOLOGY (Tier 2 -- Patterns & Standards)
**Category:** Framework Architecture
**Domain:** App Router patterns, SSG, middleware, routing, CSS strategy, security headers

## Overview

This skill codifies the Next.js patterns used across all three LeadOS codebases. It covers the App Router conventions for static generation at scale (660+ niche pages), the Promise-based params pattern required by Next.js 15+, middleware-driven auth with an explicit PUBLIC_EXACT whitelist, subdomain-aware routing for multi-tenant operation, the dual CSS system (Tailwind + CSS modules), and security header injection via next.config.ts. Apply this skill whenever creating new pages, routes, or middleware logic.

## Core Capabilities

- Generate static pages at build time using `generateStaticParams` with hardcoded arrays (no DB calls)
- Handle `params` as a Promise: `const { city, niche } = await params`
- Configure middleware auth using a PUBLIC_EXACT Set for exact-match whitelisting
- Route subdomains to tenant-specific content without separate deployments
- Apply dual CSS: Tailwind for layout/utilities, CSS modules for component-scoped styles
- Inject security headers (CSP, HSTS, X-Frame-Options) in next.config.ts

## When to Use

Trigger this skill when:
- Creating a new page, layout, or route group in any LeadOS codebase
- Adding or modifying middleware logic (auth, redirects, subdomain routing)
- Troubleshooting "params is not iterable" or Promise-related type errors
- Adding static pages to erie-pro's niche/city matrix
- Configuring security headers or CSP policies
- Choosing between Tailwind classes and CSS modules for a component

## Methodology

### Pattern 1: Static Generation with generateStaticParams
Every erie-pro niche page uses hardcoded arrays -- never fetch from a database at build time:
```typescript
export async function generateStaticParams() {
  const niches = ['plumber', 'electrician', /* ... 44 total */];
  const types = ['home', 'faq', 'pricing', /* ... 15 total */];
  return niches.flatMap(niche => types.map(type => ({ niche, type })));
}
```
This produces 660 static pages. The arrays live in a shared config file, not inline.

### Pattern 2: Promise-Based Params (Next.js 15+)
All page components must await params:
```typescript
export default async function Page({ params }: { params: Promise<{ city: string; niche: string }> }) {
  const { city, niche } = await params;
  // use city and niche
}
```
Never destructure params synchronously -- it will break in Next.js 15+.

### Pattern 3: Middleware Auth with PUBLIC_EXACT
```typescript
const PUBLIC_EXACT = new Set(['/', '/login', '/pricing', '/api/health']);
export function middleware(request: NextRequest) {
  if (PUBLIC_EXACT.has(request.nextUrl.pathname)) return NextResponse.next();
  // check auth token, redirect to /login if missing
}
```
Use exact match, not startsWith. Add prefix sets separately for route groups like `/api/public/*`.

### Pattern 4: Subdomain Routing
Extract subdomain from the Host header in middleware. Map subdomains to tenant config. Rewrite the URL to include tenant context without changing the visible path.

### Pattern 5: Dual CSS System
- **Tailwind** -- Use for layout (flex, grid, spacing, responsive breakpoints), color utilities, typography scale
- **CSS Modules** -- Use for component-scoped animations, complex pseudo-selectors, hover states that need more than Tailwind provides
- Never mix: a single element should use one system, not both

### Pattern 6: Security Headers in next.config.ts
```typescript
const securityHeaders = [
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Strict-Transport-Security', value: 'max-age=31536000; includeSubDomains' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
];
```
Apply to all routes via the `headers()` async function in next.config.ts.

## Edge Cases

- **generateStaticParams returning empty array** -- Build succeeds but creates zero pages. Always assert array length > 0 in tests.
- **Middleware matching static assets** -- Exclude `_next/static`, `_next/image`, and `favicon.ico` from middleware using the matcher config.
- **Subdomain in localhost** -- Use `lvh.me` or hosts file entries for local subdomain testing since `localhost` does not support subdomains.
- **CSP breaking inline styles** -- Tailwind injects inline styles for some utilities. Add `'unsafe-inline'` for styles in CSP or use nonce-based approach.
- **params type mismatch** -- If a route has `[...slug]`, params.slug is `string[]`, not `string`. Always match the type to the bracket syntax.
- **CSS module class name collisions** -- Module names are scoped automatically, but importing the wrong module file causes silent style failures. Verify import paths.

## Output Format

When applying this skill, report which patterns were used:

```
## Architecture Decisions Applied

| Pattern | File(s) | Notes |
|---------|---------|-------|
| generateStaticParams | app/[niche]/[type]/page.tsx | 660 paths generated |
| Promise params | app/[city]/page.tsx | Awaited correctly |
| PUBLIC_EXACT | middleware.ts | Added /new-route to whitelist |
| Security headers | next.config.ts | CSP updated for new domain |

### Warnings
- [any pattern violations detected and corrected]
```
