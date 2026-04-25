# Multi-Agent Production Readiness Audit

**Repository:** pinohu/dynasty-ai-dashboard (v1.1.0, post-remediation)
**Date:** 2026-04-05
**Methodology:** Independent agent simulation, strict release-gate evaluation

---

## [1] UX EXPERT

**Status: FAIL**

### Critical Issues (must fix before release)

1. **No error state shown to user when API fetch fails.** `page.tsx` line 40-41: if `fetch("/api/dashboard")` throws or returns non-200, the catch block only logs to console. The user sees an empty dashboard with no feedback — no error message, no retry button, no indication anything went wrong.

2. **No data refresh mechanism.** The dashboard loads data once in `useEffect` and never updates. For a "real-time monitoring dashboard," there is no polling, no SSE consumption, no refresh button. The SSE endpoint exists (`/api/dashboard/stream`) but nothing in the UI connects to it.

3. **Loading state is a plain text string.** "Loading..." and "Authenticating..." are unstyled plain divs. For a monitoring dashboard, this is unacceptable — users need skeleton screens or spinners to trust the app is working.

4. **Empty state is misleading.** The empty state (line 121-128) only shows when `agents.length === 0 && !costs`. If costs return `{today:0, thisMonth:0, monthlyTarget:300}` (the fallback), the empty state never shows — the user sees a cost panel with all zeroes and no agents, with no explanation that the relay is down.

### High Priority Issues

5. **No navigation or settings UI.** README documents a Settings endpoint, but there is no settings page, no sidebar, no navigation. The app is a single hardcoded page.

6. **Service status is not displayed.** The `/api/services/status` endpoint exists but the dashboard page never calls it or renders service status cards. A core feature described in README is missing.

7. **Knowledge base is not displayed.** Same — endpoint exists, no UI.

### Medium Issues

8. **`ServiceItem` interface in `page.tsx` line 14-18 is defined but never used.** Dead type definition.

9. **No dark mode toggle despite `darkMode: ["class"]` in Tailwind config.** The dashboard is permanently dark (`bg-gray-900`), the signin page is permanently light. There's no way to switch.

### Low Issues

10. Favicon is the default Next.js favicon. No custom branding.

**Confidence Score: 90/100**

---

## [2] ACCESSIBILITY (WCAG 2.1 AA) SPECIALIST

**Status: FAIL**

### Critical Issues (must fix before release)

1. **Color contrast failure on dashboard.** `text-gray-400` on `bg-gray-900` = #9ca3af on #111827 = contrast ratio ~4.1:1. WCAG AA requires 4.5:1 for normal text. The labels "Today", "This Month", "Monthly Target", "Last active: ..." all fail AA.

2. **Color contrast failure — `text-gray-500` on `bg-gray-700`.** The idle status text (#6b7280 on #374151) has a contrast ratio of ~3.4:1. Fails AA.

3. **Status communicated solely by color.** Active = green text, Idle = gray text. There is no icon, no badge, no pattern — just color. Color-blind users cannot distinguish active from idle agents. Violates WCAG 1.4.1 (Use of Color).

4. **No skip navigation link.** Single-page app with no skip-to-content link. Keyboard users must tab through all elements.

5. **No focus-visible styles.** None of the dashboard elements have custom `:focus-visible` outlines. Tailwind's defaults may be stripped by the `bg-gray-900` background. Keyboard navigation is effectively invisible.

### High Priority Issues

6. **Error boundary exposes raw error messages to users.** `error.tsx` line 14: `{error.message}` — this could display stack traces, internal paths, or cryptic Node.js errors. Not a WCAG issue per se, but it degrades usability for all users and could expose system internals.

7. **Loading states have no `aria-live` region.** "Loading..." and "Authenticating..." are static divs. Screen readers won't announce the state change.

8. **Sign-in error message is not associated with the form field.** The error `<p>` (line 81-84 of signin) is not connected to the inputs via `aria-describedby`. Screen readers won't associate the error with the form.

### Medium Issues

9. **`globals.css` body applies `bg-gray-50 text-gray-900`** but `page.tsx` overrides to `bg-gray-900 text-white`. The flash-of-light-background on load before JS hydrates is a photosensitivity concern for dark-mode users.

10. **No `<main>` landmark.** Dashboard content is wrapped in `<div>` elements only. Screen readers can't identify the main content region.

### Low Issues

11. CSS variables for design tokens (ShadCN pattern) are defined in `globals.css` but never used in any component. The actual styling uses hardcoded Tailwind classes.

**Confidence Score: 95/100**

---

## [3] SENIOR FRONTEND ENGINEER

**Status: FAIL**

### Critical Issues (must fix before release)

1. **Client-side auth redirect is a race condition.** `page.tsx` line 28-30: `getSession()` is async. During the await, React renders `<div>Authenticating...</div>`. If the middleware correctly redirects unauthenticated users (it should), then `getSession()` in the client component is redundant. But the middleware uses `withAuth` which by default returns 401 for API routes and redirects for pages — so both mechanisms fight. If middleware fails (misconfigured `NEXTAUTH_SECRET`), the client-side fallback uses `window.location.href` instead of Next.js `router.push`, which loses client-side state and causes a full page reload.

2. **SSE stream endpoint is built but never consumed.** `/api/dashboard/stream` exists and works, but no client component ever creates an `EventSource` to connect to it. The dashboard is not real-time. The README and feature list are false.

3. **`tailwind.config.ts` content paths include `./components/**` and `./pages/**` — directories that do not exist.** This is harmless for build but misleading. More importantly, it does NOT include `./lib/**`, which means if any Tailwind classes were used in `lib/` files they'd be purged.

### High Priority Issues

4. **No data refresh/polling.** `useEffect` with `[]` dependency array runs once. A monitoring dashboard must poll or stream. Without this, the page shows stale data permanently until manual browser refresh.

5. **`getSession()` is a network call on every page load.** The middleware already validates the JWT. The client component re-validates by calling `getSession()` which hits `/api/auth/session`. This is redundant and adds ~200ms to every dashboard load. Should use `useSession()` hook instead, which uses the SessionProvider cache.

6. **`window.location.href = "/"` after signin** (signin page line 28). This forces a full-page navigation instead of `router.push("/")`. User loses any React state and hydration work.

### Medium Issues

7. **Dead interface `ServiceItem`** in `page.tsx` — defined, never used.

8. **No loading skeleton.** "Loading..." text provides zero spatial preview. Users see layout shift when data arrives.

9. **`clsx` and `tailwind-merge` in dependencies but never imported in any file.** Both are unused.

### Low Issues

10. `postcss.config.js` uses CommonJS (`module.exports`) while `tailwind.config.ts` uses ESM (`export default`). Inconsistent but not broken.

**Confidence Score: 92/100**

---

## [4] SENIOR BACKEND ENGINEER

**Status: FAIL**

### Critical Issues (must fix before release)

1. **Settings are stored in a module-level `let` variable** (`settings/route.ts` line 29). In serverless environments (Vercel, Lambda), each invocation may get a cold start with a fresh module context. Settings written via POST will be lost on the next cold start. This is not persistence — it's an illusion of persistence.

2. **FALLBACK `lastUpdate` in `agents/activity/route.ts` line 11 is computed at module load time** (`new Date().toISOString()` at `const FALLBACK = ...`). In serverless, this date could be minutes, hours, or days stale. Same issue in `costs/route.ts` line 6-9.

3. **No input validation on Settings POST.** `(await request.json()) as Partial<AppSettings>` is a type assertion, not runtime validation. A client can POST `{"alerts":{"costThreshold":"DROP TABLE"}}` and it will be merged into the settings object. No Zod, no schema validation, no type checking at runtime.

### High Priority Issues

4. **No rate limiting on any endpoint.** The SSE endpoint (`/api/dashboard/stream`) holds a connection open with a 5-second interval. A malicious or buggy client opening 1000 SSE connections will exhaust server resources. No connection limit, no cleanup on max connections.

5. **Knowledge base reads arbitrary filesystem paths.** `KNOWLEDGE_BASE_PATH` env var controls the base path. If set to `/etc`, the endpoint will happily read and return contents of system files that match the `YYYY-MM-DD.md` pattern. While this requires env var compromise, the code performs no path validation or sandboxing.

6. **No API response caching.** Every `/api/services/status` call pings up to 8 external services with a 2-second timeout each. Under load, this creates N * 8 outbound connections per second. No in-memory cache, no stale-while-revalidate.

### Medium Issues

7. **SSE stream has no heartbeat mechanism.** If the relay is down, `sendUpdate` silently catches the error and sends nothing. The client has no way to distinguish "no updates" from "connection dead." Standard SSE practice is to send a `:heartbeat\n\n` comment periodically.

8. **Error responses have inconsistent shapes.** `/api/dashboard` returns `{error: string}` on 500. `/api/agents/activity` returns `{...FALLBACK, error: string}` on 500. `/api/costs` returns `{...FALLBACK, error: string, timestamp: string}` on 500. No consistent error envelope.

### Low Issues

9. `console.error` in every route. Should use a structured logger for production.

**Confidence Score: 93/100**

---

## [5] SECURITY ENGINEER

**Status: CONDITIONAL PASS**

### Critical Issues

None remaining after remediation. The previous critical issues (exec injection, email-only auth, hardcoded PII, exposed APIs) have all been addressed.

### High Priority Issues

1. **Single shared password for all users.** `ADMIN_PASSWORD_HASH` is one bcrypt hash. Every user in `ALLOWED_EMAILS` authenticates with the same password. This means you can't revoke access for a single user without changing the password for everyone. For a single-admin tool this is acceptable; for multi-user it's a security flaw.

2. **No brute-force protection.** The credentials provider has no rate limiting, no account lockout, no CAPTCHA. An attacker can attempt unlimited password guesses against the `/api/auth/callback/credentials` endpoint.

3. **CSP allows `unsafe-eval` and `unsafe-inline`.** (`next.config.js` line 15). `unsafe-eval` negates most XSS protection from CSP. This is a common Next.js concession (dev mode needs it), but should use nonce-based CSP in production.

4. **JWT secret has no validation on startup.** If `NEXTAUTH_SECRET` is undefined or empty, NextAuth.js v4 will use a default development secret in dev mode and log a warning in prod. But the app won't crash — it will run with a weak secret. Should validate and fail-fast.

### Medium Issues

5. **No CSRF token on the settings POST endpoint.** Middleware validates the JWT via cookie, but there's no CSRF token. A malicious page could issue a `fetch()` to `/api/settings` with `credentials: include` and modify settings. The `Content-Type: application/json` check helps (browsers don't send JSON cross-origin by default due to preflight), but it's not a robust CSRF defense.

6. **`Strict-Transport-Security` header missing.** The security headers in `next.config.js` include `X-Frame-Options`, `X-Content-Type-Options`, `Referrer-Policy`, and CSP, but no HSTS. This means the first HTTP request is unprotected from SSL stripping.

### Low Issues

7. `Permissions-Policy` header not set. Should disable camera, microphone, geolocation.

**Confidence Score: 82/100** (Conditional: acceptable for single-admin internal tool. NOT acceptable for multi-user SaaS.)

---

## [6] PERFORMANCE ENGINEER

**Status: CONDITIONAL PASS**

### Critical Issues

None. Bundle size is reasonable (98kB first load), build succeeds, no N+1 patterns.

### High Priority Issues

1. **No caching on relay client calls.** Every API route calls the relay on every request. With SSE streaming every 5 seconds per connected client, and N clients, the relay receives 2N requests every 5 seconds (agents + costs). Add `/api/services/status` which pings 8 services per call. Should implement a simple TTL cache (even 10-30 seconds) to prevent thundering herd.

2. **SSE stream has no backpressure.** If the relay is slow (>5s response time), `sendUpdate` calls will stack up because `setInterval` fires regardless of whether the previous call completed. Should use `setTimeout` after completion instead of `setInterval`.

### Medium Issues

3. **`Promise.all` in dashboard route** — if one relay call is slow, both are slow. Should use `Promise.allSettled` and return partial data.

4. **No `Cache-Control` headers on API responses.** Every API response is implicitly `no-store` (dynamic routes), but explicit cache headers would allow CDN edge caching for read-only endpoints.

### Low Issues

5. `Inter` font is loaded from Google Fonts. Should self-host for privacy and performance (eliminates external DNS lookup + connection).

6. `tailwind.config.ts` references `./pages/**` and `./components/**` directories that don't exist. Tailwind scans these paths on every build — harmless but unnecessary work.

**Confidence Score: 78/100** (OK for low-traffic internal tool. Would fail under any meaningful concurrent load.)

---

## [7] PRODUCT / VALUE STRATEGIST

**Status: FAIL**

### Core Promise

"A real-time monitoring dashboard for Dynasty AI infrastructure and agents."

### Evaluation

**The current implementation does NOT deliver the core promise.**

1. **"Real-time" — FALSE.** The dashboard fetches data once on page load and never updates. The SSE endpoint exists but is not consumed by the frontend. The word "real-time" appears in the README, the metadata description, and the feature list, but the app shows static data from the moment of page load.

2. **"Monitoring" — PARTIAL.** The dashboard shows costs and agents if the relay is online. It does NOT show service status (endpoint exists, no UI). It does NOT show the knowledge base (endpoint exists, no UI). It does NOT show settings (endpoint exists, no UI). 3 of 5 documented features have no frontend.

3. **"Dashboard" — MINIMAL.** One page, three cost cards, one agent list. No charts, no trends, no historical data, no alerts, no notifications. Compare to any real monitoring tool (Grafana, Datadog, even a basic status page) — this is a data dump, not a dashboard.

4. **Settings are useless.** The settings API exists but: (a) no UI to access it, (b) settings are lost on cold start, (c) settings don't actually affect anything — no code reads `settings.alerts.costThreshold` to trigger alerts, no code reads `settings.monitoring.updateInterval` to change polling.

5. **Zero tests means zero confidence.** For a monitoring tool — the one thing that should be reliable above all else — there is no verification that anything works correctly. The relay client could silently swallow errors, the SSE stream could leak intervals, the auth could fail open, and there would be no automated way to catch any of it.

### Value Delivered vs. Promised

| Promised Feature | Delivered | Works |
|---|---|---|
| Real-time updates | SSE endpoint only | No UI consumer |
| Service status monitoring | API endpoint only | No UI |
| Cost tracking | API + basic UI | Relay-dependent |
| Agent activity | API + basic UI | Relay-dependent |
| Knowledge base | API only | No UI |
| Settings management | API only | No UI, no persistence |
| Alerts | Not implemented | N/A |

**Confidence Score: 95/100**

---

## FINAL VERDICT

```
UX Expert:              FAIL
Accessibility:          FAIL
Senior Frontend:        FAIL
Senior Backend:         FAIL
Security:               CONDITIONAL PASS (single-admin internal only)
Performance:            CONDITIONAL PASS (low-traffic only)
Product/Value:          FAIL
```

### **SYSTEM = NOT PRODUCTION READY**

5 of 7 agents issued FAIL. The 2 conditional passes are scoped to "single admin, low traffic" — the narrowest possible deployment scenario.

---

## VALUE VALIDATION

**Core Promise:** "A real-time monitoring dashboard for Dynasty AI infrastructure and agents."

**Verdict: FAIL**

The application does not deliver real-time anything. It does not render 3 of 5 documented features. The settings system has no persistence and no effect. The SSE infrastructure is built but orphaned. This is a **partially-functional prototype**, not a production monitoring tool.

---

## BLOCKING ISSUES SUMMARY (Minimum to ungate)

| # | Issue | Agent | Fix |
|---|---|---|---|
| 1 | Dashboard never refreshes data | UX, Frontend, Product | Connect SSE stream or add polling in `page.tsx` |
| 2 | No error state shown to user | UX | Add error state with retry button when fetch fails |
| 3 | Service status not displayed in UI | Product | Call `/api/services/status` and render cards |
| 4 | Settings lost on cold start | Backend | Use filesystem, SQLite, or external store |
| 5 | No input validation on Settings POST | Backend | Add Zod schema validation |
| 6 | WCAG color contrast failures | A11y | Fix `text-gray-400`/`text-gray-500` contrast ratios |
| 7 | Status conveyed by color alone | A11y | Add icons/badges for active/idle |
| 8 | No caching on relay calls | Perf | Add TTL cache to relay-client |
| 9 | SSE setInterval stacking | Perf, Backend | Replace with setTimeout-after-completion |
| 10 | `clsx` and `tailwind-merge` unused | Frontend | Remove from dependencies |
| 11 | Stale FALLBACK timestamps | Backend | Compute `lastUpdate` at call time, not module load |
| 12 | No brute-force protection on login | Security | Add rate limiting or exponential backoff |
