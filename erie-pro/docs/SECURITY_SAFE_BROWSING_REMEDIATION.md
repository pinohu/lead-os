# erie.pro — Google Safe Browsing remediation (social engineering)

**Flag observed:** “Some pages on this site are unsafe” — harmful content that tries to trick visitors into sharing personal info or downloading software.

**ISP impact:** Spectrum CUJO and similar DNS/security filters consume Google Safe Browsing lists; a domain-level social-engineering flag can block the entire site.

## Audit summary (2026-05-20)

### Live site (erie.pro / erie-pro.vercel.app)

| Check | erie.pro | erie-pro.vercel.app |
| --- | --- | --- |
| HTTP reachable from audit host | HEAD 200 (curl); full GET intermittent (TLS) | GET 200 |
| Redirect chain | `www.erie.pro` → `erie.pro` (308, vercel.json) | None |
| Malware patterns in HTML | None found in first-party HTML | Same build |
| Third-party script in HTML | `cdn.convertbox.com/convertbox/js/embed.js` | Same |

**Pages reviewed (code + Vercel mirror):** `/`, `/get-matched`, `/login`, `/plumbing/pricing`, `/pros`.

No evidence in first-party code of: `eval` abuse, `document.write`, crypto miners, obfuscated base64 loaders, or redirects to external domains.

### Third-party script domains (allowed in CSP)

| Domain | Purpose | Risk notes |
| --- | --- | --- |
| `cdn.convertbox.com`, `app.convertbox.com`, `images.convertbox.com` | ConvertBox overlays / iframes | **Highest priority** — exit-intent + multi-step PII modals are a common social-engineering trigger |
| `js.stripe.com`, `api.stripe.com` | Checkout | Low when used only on checkout |
| `*.posthog.com` | Analytics (server-side in repo; CSP allows client) | Low |
| `*.sentry.io` | Error reporting | Low |
| `cloud.umami.is` | Umami (optional; not in CSP — add if enabled in prod) | Low |
| `polyfill-fastly.io` | Polyfill (CSP allowlist) | Review necessity |
| `fonts.bunny.net` | Fonts | Low |

`NEXT_PUBLIC_CHAT_WIDGET_URL` can inject any vendor script — keep unset unless audited.

### Code findings

1. **ConvertBox loaded on every page including `/login`** — contradicts `docs/external-setup/convertbox.md` (“No ConvertBox on login…”). Overlays + credential forms resemble phishing. **Fixed in code:** `ConvertBoxShell` + `shouldLoadConvertBox()`.
2. **ConvertBox globally on 112+ service URLs** with documented triggers: exit-intent, time-on-page, scroll-depth (`placement-matrix.json`). Combined with native lead forms + cookie banner = dense PII capture surface.
3. **`/login`** — Provider email/password form, `robots: noindex`, but was still loading ConvertBox (fixed).
4. **No `/download` route** in app; `/manage-data` has “Download my data” (legitimate GDPR).
5. **Large sitemap** — thousands of SEO URLs; unlikely direct Safe Browsing cause unless a specific URL was reported.

### External reputation checks

- **Google Transparency Report:** Could not confirm status programmatically (page requires JS).
- **VirusTotal API:** 401 without API key — manual check: https://www.virustotal.com/gui/domain/erie.pro
- **Safe Browsing Lookup API (v4):** Requires API key — https://developers.google.com/safe-browsing/v4/lookup-api

## Ranked likely triggers

| Rank | Trigger | Specific URLs | Action |
| --- | --- | --- | --- |
| 1 | **ConvertBox** overlays (exit-intent, full-screen, iframe) collecting phone/email | All pages where box is active in dashboard; especially `/`, `/*/pricing`, `/get-matched` | Audit dashboard; disable aggressive boxes; deploy path gating; optional `NEXT_PUBLIC_CONVERTBOX_ENABLED=false` |
| 2 | **ConvertBox on `/login`** (third-party UI over credentials) | `/login` | **Fixed** — embed blocked on login |
| 3 | **Dual capture** (native form + ConvertBox + cookie banner) | `/get-matched`, service pages | Reduce to one primary capture path per page |
| 4 | **Historical / dashboard misconfiguration** | Unknown path flagged by reporter | Search Console → Security issues for exact URL |
| 5 | **Compromised third-party** (ConvertBox account or CDN) | Any page loading embed | Rotate ConvertBox credentials; contact ConvertBox support |
| 6 | **Stale domain reputation** | Domain-wide | Review request after fixes |

## Remediation checklist

### Immediate (today)

1. Deploy `ConvertBoxShell` path gating (login, admin, dashboard, provider, privacy, terms, checkout).
2. In **ConvertBox dashboard**: pause all boxes; re-enable only service-specific boxes with clear “Erie.pro” branding, no OS/browser mimicry, no fake urgency, no download prompts.
3. Optional kill switch: set Vercel env `NEXT_PUBLIC_CONVERTBOX_ENABLED=false` until review completes.
4. Verify live HTML on `/login` has **no** `cdn.convertbox.com` script tag.

### Short term (1–3 days)

5. **Google Search Console** → Security & Manual Actions → review listed example URLs; fix or remove each.
6. File **false positive / review request:** https://safebrowsing.google.com/safebrowsing/report_error/?url=https://erie.pro/
7. VirusTotal — confirm no AV vendors flag the domain; dispute if false positive.
8. Ask Spectrum/CUJO to refresh category after Google clears (can lag 24–72h).

### Medium term (1–2 weeks)

9. Gate ConvertBox behind cookie consent (Accept only).
10. Tighten CSP: remove `unsafe-eval` when possible; add `cloud.umami.is` if Umami is used.
11. Add Playwright check: `/login` must not load ConvertBox script.

## Delisting / review workflow

1. Fix root cause (dashboard + deploy).
2. Search Console → validate fixes → **Request Review**.
3. Safe Browsing error report (link above) — “I fixed the issue.”
4. **Timeline:** automated recrawl often 24–72 hours; manual review up to **2–3 weeks**; CUJO may lag behind Google.

## Verification commands

```bash
# No ConvertBox on login (after deploy)
curl -sL "https://erie.pro/login" | findstr /i convertbox

npm run test -- src/lib/__tests__/convertbox-placement-policy.test.ts
```
