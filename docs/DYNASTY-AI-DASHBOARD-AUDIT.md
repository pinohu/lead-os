# Audit Report: pinohu/dynasty-ai-dashboard

**Date:** 2026-04-04
**Auditor:** Automated Code Audit
**Repository:** https://github.com/pinohu/dynasty-ai-dashboard
**Note:** The requested repository `pinohu/dynasty-developer` does not exist (404). The closest match — `pinohu/dynasty-ai-dashboard` — was audited instead.

---

## Executive Summary

The Dynasty AI Dashboard is a Next.js application for monitoring AI infrastructure: service health, cost tracking, agent activity, and a knowledge base. The project is in early/prototype stage with **critical security vulnerabilities**, significant architectural gaps, hardcoded credentials, shell command injection risks, and pervasive use of mock/placeholder data. It is **not production-ready** in its current state.

**Overall Risk Rating: HIGH**

| Category | Rating | Score |
|---|---|---|
| Security | Critical | 2/10 |
| Code Quality | Poor | 3/10 |
| Architecture | Weak | 3/10 |
| Performance | Fair | 4/10 |
| Testing | None | 0/10 |
| Documentation | Fair | 5/10 |
| Dependency Health | Poor | 3/10 |

---

## 1. CRITICAL: Security Vulnerabilities

### 1.1 Command Injection via `child_process.exec` (SEVERITY: CRITICAL)

Multiple API routes use `exec()` / `execAsync()` to run shell commands directly on the server. While current invocations use hardcoded command strings (not user input), this pattern is extremely dangerous:

**Affected files:**
- `app/api/dashboard/route.ts` (lines 96-98, 149-151)
- `app/api/agents/activity/route.ts` (lines 22-24)
- `app/api/costs/route.ts` (lines 22-24)

```typescript
// Example from dashboard/route.ts
const { stdout } = await execAsync(
  'clawdbot sessions list --json 2>/dev/null | jq "..."',
  { timeout: 5000 }
);
```

**Risk:** If any part of the command string becomes parameterized with user input in the future, this becomes a remote code execution (RCE) vulnerability. The pattern itself violates OWASP A03 (Injection).

**Recommendation:** Replace shell commands with native Node.js SDK calls, a dedicated API client, or at minimum use `execFile()` with argument arrays instead of `exec()` with concatenated strings.

### 1.2 Authentication Bypass — Email-Only Auth Without Password (SEVERITY: CRITICAL)

The NextAuth configuration in `app/api/auth/[...nextauth]/route.ts` uses a `CredentialsProvider` that authenticates users by email alone — **no password, no MFA, no magic-link verification**:

```typescript
async authorize(credentials) {
  if (!credentials?.email) return null;
  if (ALLOWED_EMAILS.includes(credentials.email)) {
    return { id: credentials.email, email: credentials.email, ... };
  }
  return null;
}
```

Anyone who knows (or guesses) the allowed email address (`polycarpohu@gmail.com`) can authenticate. This is functionally equivalent to having no authentication at all.

**Recommendation:** Implement proper authentication: magic-link email verification, OAuth provider (Google/GitHub), or at minimum password + bcrypt hashing.

### 1.3 Hardcoded PII / Credentials in Source Code (SEVERITY: HIGH)

Personal email is hardcoded in multiple files committed to a **public** repository:

- `app/api/auth/[...nextauth]/route.ts` line 4: `const ALLOWED_EMAILS = ["polycarpohu@gmail.com"]`
- `app/api/settings/route.ts` line 8: `costAlertEmail: 'polycarpohu@gmail.com'`

**Recommendation:** Move to environment variables. Use `.env.local` for sensitive values and never commit them.

### 1.4 Missing `NEXTAUTH_SECRET` (SEVERITY: HIGH)

The auth config references `process.env.NEXTAUTH_SECRET` but:
- `.env.example` does not include it
- No default fallback is provided

Without a proper secret, JWT tokens are signed with a predictable/empty key, making session tokens forgeable.

**Recommendation:** Generate a strong random secret (`openssl rand -base64 32`) and add `NEXTAUTH_SECRET` to `.env.example` as a required variable.

### 1.5 No API Route Authentication (SEVERITY: HIGH)

None of the API routes (`/api/dashboard`, `/api/costs`, `/api/agents/activity`, `/api/services/status`, `/api/settings`, `/api/knowledge-base`) verify the user's session. All are publicly accessible without authentication:

```typescript
// Every route handler — no session check
export async function GET() {
  // Immediately returns data, no auth verification
}
```

**Recommendation:** Add middleware or per-route session verification using `getServerSession(authOptions)`.

### 1.6 Filesystem Traversal Risk (SEVERITY: MEDIUM)

`app/api/knowledge-base/route.ts` reads files from the server filesystem using a hardcoded but user-home-relative path:

```typescript
const homeDir = process.env.HOME || '/home/pinohu';
const clawdDir = join(homeDir, 'clawd');
```

While not directly exploitable via user input today, combining this with any future parameter-based file selection could lead to path traversal attacks.

### 1.7 Internal IP Addresses Exposed (SEVERITY: MEDIUM)

Internal infrastructure IPs are hardcoded in source:

- `app/api/services/status/route.ts` line 10: `http://172.20.192.47:30678`
- `app/api/dashboard/route.ts` line 61: `http://172.20.192.47:30678/healthz`

This leaks internal network topology in a public repository.

### 1.8 No CSRF Protection on Settings POST (SEVERITY: MEDIUM)

`app/api/settings/route.ts` accepts POST requests to modify settings with no CSRF token validation and no authentication check.

### 1.9 No Content Security Policy (SEVERITY: LOW)

No CSP headers are configured in `next.config.js` or middleware, leaving the app vulnerable to XSS if any user-generated content is rendered.

---

## 2. Dependency Issues

### 2.1 Major Version Incompatibility (SEVERITY: HIGH)

```json
"next": "^16.1.6",
"react": "^18.2.0",
"react-dom": "^18.2.0",
"eslint-config-next": "14.1.0"
```

- **Next.js 16** requires **React 19**. The project pins React 18, which is incompatible. This will cause build failures or runtime errors.
- `eslint-config-next` is pinned to `14.1.0` while Next.js is `^16.1.6` — a 2-major-version mismatch.

### 2.2 Unused Dependencies (SEVERITY: LOW)

The following dependencies are declared but never imported in any source file:

| Package | Status |
|---|---|
| `@prisma/client` | No Prisma schema exists, no import found |
| `axios` | Never imported; all HTTP calls use native `fetch` |
| `nodemailer` | Never imported |
| `recharts` | Never imported |
| `date-fns` | Never imported |
| `swr` | Never imported; all data fetching uses `useState` + `useEffect` + `fetch` |

**Impact:** Inflated bundle size, unnecessary attack surface, misleading dependency manifest.

### 2.3 Missing Type Definitions (SEVERITY: LOW)

- No `@types/nodemailer` in devDependencies (if nodemailer were actually used)
- No `prisma` CLI in devDependencies despite `@prisma/client` being listed

---

## 3. Architecture & Code Quality

### 3.1 Pervasive `any` Types (SEVERITY: HIGH)

Despite `"strict": true` in `tsconfig.json`, `any` is used liberally:

- `app/page.tsx` lines 7-9: `useState<any>(null)`, `useState<any>(null)` for session and data
- `app/api/dashboard/route.ts` line 114: `sessions.forEach((session: any) => ...)`
- `app/api/agents/activity/route.ts` lines 31-34: Multiple `(s: any)`, `(session: any)`, `(a: any)`
- `app/api/costs/route.ts` line 57: `sessions.forEach((session: any) => ...)`

This defeats the purpose of TypeScript's strict mode and makes runtime errors likely.

### 3.2 Dead Code (SEVERITY: MEDIUM)

`app/api/dashboard/route.ts` contains 4 functions that are **never called**:
- `getServiceStatus()` (line 57)
- `getCostMetrics()` (line 93)
- `getAgentActivity()` (line 147)
- `getSystemHealth()` (line 181)

These functions are defined but the `GET` handler uses completely different logic (relay fetch + fallback mock data). ~130 lines of dead code.

### 3.3 Components Never Used (SEVERITY: MEDIUM)

The following components are defined but never imported/rendered anywhere:
- `components/ServiceStatus.tsx`
- `components/CostTracking.tsx`
- `components/AgentActivity.tsx`
- `components/QuickActions.tsx`
- `components/DashboardLayout.tsx`

The main `app/page.tsx` renders inline JSX instead of using these components. These appear to be from an earlier iteration that was abandoned.

### 3.4 Stale File: `page-old.tsx` (SEVERITY: LOW)

`app/page-old.tsx` contains only `// Backup of old page` — a commented-out backup file committed to the repo.

### 3.5 Broken Navigation Links (SEVERITY: MEDIUM)

`DashboardLayout.tsx` links to routes that don't exist:
- `/langfuse` — no page exists
- `/knowledge` — no page exists
- `/memory` — no page exists
- `/settings` — no page exists
- `/ollama/generate` — no page exists (referenced in `QuickActions.tsx`)

### 3.6 Mock/Hardcoded Data Throughout (SEVERITY: MEDIUM)

- `components/CostTracking.tsx` uses entirely hardcoded mock data (`$5.42`, `$152.34`, `$2847.66`)
- `components/AgentActivity.tsx` uses hardcoded mock agent list with static timestamps
- `app/api/dashboard/route.ts` fallback returns hardcoded `savings: 2847.66`
- `app/api/costs/route.ts` hardcodes `savings.amount: 2847.66`

The same magic number `2847.66` appears in 4 different places with no shared constant.

### 3.7 SSE Stream Calls Itself (SEVERITY: MEDIUM)

`app/api/dashboard/stream/route.ts` fetches from `http://localhost:3000/api/dashboard` — the same server. This creates a self-referencing loop that:
- Wastes server resources (each SSE client spawns a new HTTP request every 5 seconds)
- Fails in production where the server may not be at localhost:3000
- Could cause cascading failures under load

### 3.8 Misspelled Service Names (SEVERITY: LOW)

`app/api/services/status/route.ts` contains what appear to be misspelled service names:
- `Languase` — likely "Langfuse"
- `Anythinglin` — likely "AnythingLLM"
- `Oliama` — likely "Ollama" (which itself is commonly "Ollama" for the Ollama project)
- `Odrant` — likely "Qdrant"
- `Searxng` — likely "SearXNG"

---

## 4. Performance Issues

### 4.1 No Caching (SEVERITY: MEDIUM)

API routes perform expensive operations (shell commands, external HTTP calls) on every request with no caching. The service status endpoint pings 8 services on every call.

### 4.2 Client-Side Auth Check with Redirect (SEVERITY: MEDIUM)

`app/page.tsx` uses client-side session checking:
```typescript
const sess = await getSession();
if (!sess) {
  window.location.href = '/auth/signin';
  return;
}
```

This means:
1. The full page JS bundle downloads
2. React hydrates
3. An API call to check the session fires
4. Only then does a redirect happen

Should use Next.js middleware for server-side auth redirects.

### 4.3 No Error Boundaries (SEVERITY: LOW)

No `error.tsx` or `global-error.tsx` files exist. Unhandled errors will crash the entire app.

### 4.4 Non-Standard `fetch` Options (SEVERITY: LOW)

Multiple routes use `{ timeout: 5000 }` in `fetch()` options, which is not a standard Fetch API option. This is silently ignored and provides no timeout protection.

```typescript
const res = await fetch(`${relayUrl}/api/costs`, { timeout: 5000 });
```

---

## 5. Testing

### 5.1 Zero Tests (SEVERITY: HIGH)

There are no test files, no test configuration, no test dependencies, and no test scripts beyond the default `next lint`. No unit tests, integration tests, or e2e tests exist.

---

## 6. Documentation

**Positive:** The repo includes extensive markdown documentation (README, API Reference, Integration Audit, multiple deployment guides).

**Issues:**
- README references features that don't exist (Zustand store, WebSocket support, hooks like `useDashboardState()`)
- README claims WCAG 2.1 AA compliance — not verified and unlikely given the simple implementation
- Multiple deployment-related markdown files suggest deployment was attempted repeatedly with issues

---

## 7. Build & Configuration

### 7.1 `next.config.js` Env Leak (SEVERITY: MEDIUM)

```javascript
env: {
  NEXTAUTH_URL: process.env.NEXTAUTH_URL,
}
```

Passing server-side environment variables through `next.config.js` `env` option inlines them into the client-side JavaScript bundle. `NEXTAUTH_URL` should remain server-side only.

### 7.2 `tsconfig.json` Target Mismatch (SEVERITY: LOW)

```json
"target": "es5",
"jsx": "react-jsx"
```

`target: "es5"` is unnecessarily conservative for a modern Next.js app. Next.js handles transpilation via SWC; this setting can cause larger output and slower builds.

---

## 8. Summary of Recommendations

### Immediate (P0 — Security Critical)
1. **Remove hardcoded email from source code.** Use environment variables.
2. **Implement proper authentication** — add password, magic-link, or OAuth. Email-only check is not auth.
3. **Add `NEXTAUTH_SECRET`** to `.env.example` and ensure it's set in all environments.
4. **Add session verification** to all API routes via middleware.
5. **Remove `child_process.exec` calls.** Replace with proper API clients.
6. **Remove internal IP addresses** from source code.

### High Priority (P1 — Functionality)
7. **Fix React/Next.js version compatibility.** Either downgrade Next.js to 14/15 or upgrade React to 19.
8. **Remove unused dependencies** (`@prisma/client`, `axios`, `nodemailer`, `recharts`, `date-fns`, `swr`).
9. **Replace `any` types** with proper TypeScript interfaces.
10. **Remove dead code** — unused functions in dashboard route, unused components, `page-old.tsx`.

### Medium Priority (P2 — Quality)
11. **Add error boundaries** (`error.tsx`, `global-error.tsx`).
12. **Fix SSE stream** — don't self-reference localhost.
13. **Add API response caching** for service status checks.
14. **Use server-side auth redirects** via Next.js middleware.
15. **Fix broken navigation links** or remove non-existent pages.
16. **Add automated tests** — at minimum, API route unit tests.

### Low Priority (P3 — Polish)
17. Fix misspelled service names.
18. Update `tsconfig.json` target to `es2017` or later.
19. Remove `NEXTAUTH_URL` from `next.config.js` client env exposure.
20. Update README to reflect actual implemented features.

---

## File Inventory

| File | Lines | Status |
|---|---|---|
| `app/page.tsx` | 100 | Active — main dashboard page |
| `app/layout.tsx` | 25 | Active — root layout |
| `app/providers.tsx` | 7 | Active — SessionProvider wrapper |
| `app/globals.css` | 32 | Active — Tailwind + CSS variables |
| `app/page-old.tsx` | 1 | Dead — empty backup |
| `app/auth/signin/page.tsx` | 69 | Active — login form |
| `app/api/auth/[...nextauth]/route.ts` | 52 | Active — **insecure auth** |
| `app/api/dashboard/route.ts` | 188 | Active — **130 lines dead code**, exec() |
| `app/api/dashboard/stream/route.ts` | 45 | Active — **self-referencing SSE** |
| `app/api/agents/activity/route.ts` | 97 | Active — exec() shell commands |
| `app/api/costs/route.ts` | 123 | Active — exec() shell commands |
| `app/api/services/status/route.ts` | 68 | Active — service health pings |
| `app/api/settings/route.ts` | 71 | Active — **no auth, in-memory store** |
| `app/api/knowledge-base/route.ts` | 90 | Active — filesystem reads |
| `components/ServiceStatus.tsx` | 81 | **Unused** — never imported |
| `components/CostTracking.tsx` | 73 | **Unused** — hardcoded mock data |
| `components/AgentActivity.tsx` | 83 | **Unused** — hardcoded mock data |
| `components/DashboardLayout.tsx` | 90 | **Unused** — broken nav links |
| `components/QuickActions.tsx` | 54 | **Unused** — broken nav links |

**Total source lines:** ~1,343
**Dead/unused lines:** ~511 (38%)
