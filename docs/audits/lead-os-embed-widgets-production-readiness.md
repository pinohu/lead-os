# Production Readiness Audit: lead-os-embed-widgets v0.2.0

**Date:** 2026-04-04
**Scope:** Complete codebase (`src/index.js`, WordPress plugin, tests, build, CI)
**Mode:** Release gate — strict, no optimism

---

## [1] UX EXPERT

**Status: FAIL**

### Critical Issues (must fix before release)

1. **No loading state on the launcher button.** `mountLeadOS` awaits `fetchBootConfig` before appending the launcher to the DOM. If the runtime is slow (2-5s on a cold start), the user sees nothing. There is no spinner, skeleton, or placeholder. Users on the host site have no indication a widget exists.

2. **No success state reset.** After "Lead captured successfully" the feedback text persists indefinitely. There is no auto-dismiss, no visual transition back to idle. If the user returns to submit another lead later, they see stale success text until they interact.

3. **Drawer is not scrollable.** The drawer has `padding: 20px` and fixed `width: 360px` but no `overflow-y: auto` or `max-height`. On a mobile viewport where `bottom: 92px` plus the drawer height exceeds the viewport, the bottom of the form (submit button, feedback, assessment link) is clipped and unreachable.

### High Priority Issues

4. **Launcher button label "LO" is meaningless.** No tooltip, no icon, just two letters. First-time users have zero affordance for what this button does. At minimum, needs a tooltip on hover.

5. **No close button inside the drawer.** The only ways to close are: click outside, press Escape, or re-click the launcher. None of these are discoverable. A visible close/X button is standard for any drawer/modal UI.

### Medium Issues

6. No visual feedback when the submit button is disabled during the 3-second cooldown. The button re-enables but the cooldown message has no timer or visual indicator.

7. No character counter on the message textarea despite having a 2000-char limit.

### Low Issues

8. Assessment link "Open Hosted Assessment" has no visual hierarchy separation from the form. It looks like an afterthought.

**Confidence Score: 40/100**

---

## [2] ACCESSIBILITY (WCAG 2.1 AA) SPECIALIST

**Status: FAIL**

### Critical Issues (must fix before release)

1. **Placeholder contrast FAILS WCAG AA.** Input placeholders (`you@example.com`, `What does the visitor need help with?`) render in the browser's default placeholder color (typically `#a9a9a9` or similar) on `#102447` background. Measured contrast: ~2.73:1. WCAG AA requires 4.5:1 for normal text. Placeholder text is functionally important here because there are no visible default values — users rely on placeholders to understand the fields.

   **Fix:** Add `::placeholder` styling via a `<style>` element injected into the page with `color: #8ba3c7` or lighter to achieve 4.5:1 minimum.

2. **No visible focus indicator on any element.** The widget uses `border: 0` on the launcher and inputs use a subtle `1px solid rgba(255,255,255,0.12)` border. There is no `:focus-visible` outline or ring. Keyboard users cannot tell which element is focused. This is a WCAG 2.4.7 violation (focus visible).

   **Fix:** Inject a `<style>` block: `#lead-os-drawer *:focus-visible, #lead-os-launcher:focus-visible { outline: 2px solid #8de6d8; outline-offset: 2px; }`

3. **Hardcoded IDs will collide.** `lead-os-email`, `lead-os-message`, `lead-os-drawer`, `lead-os-launcher` are static. If two instances of the widget load on the same page (e.g. shortcode + auto-inject, or two separate embed scripts), `id` collision breaks `<label for="">` associations and `aria-*` references. Duplicate IDs are invalid HTML and cause screen readers to malfunction.

   **Fix:** Generate unique IDs per instance (e.g. `lead-os-email-${crypto.randomUUID().slice(0,8)}`).

### High Priority Issues

4. **`aria-modal="true"` without scroll lock.** When a dialog is marked `aria-modal`, assistive tech expects the background to be inert. Currently the host page remains fully interactive and scrollable. Either remove `aria-modal` or implement `inert` on `document.body` children while the drawer is open.

5. **No `aria-describedby` on form inputs linking to error messages.** When validation fails, the error appears in the feedback `div` but screen readers don't associate it with the specific input. The user hears the error via `aria-live` but doesn't know which field it belongs to.

### Medium Issues

6. The `<h3>` inside the drawer is used without an `<h1>` or `<h2>` parent in the dialog context. This creates a heading level skip which violates WCAG 1.3.1 (Info and Relationships).

7. The drawer `display: none` / `display: block` toggle does not trigger screen reader announcement of dialog opening. Should use a technique that causes AT to announce the dialog (e.g. focus management to a labeled element already partially implemented).

### Low Issues

8. `autocomplete="email"` is good but `autocomplete` should also be set on the textarea (`autocomplete="off"`) to prevent browser autofill interference.

**Confidence Score: 35/100**

---

## [3] SENIOR FRONTEND ENGINEER

**Status: FAIL**

### Critical Issues (must fix before release)

1. **Click-outside handler races with launcher click.** Line 406: The `document.addEventListener("click", ...)` is registered inside the launcher click handler. Due to event bubbling, the launcher's own click event will propagate to `document`, hit the click-outside handler, and immediately re-close the drawer that was just opened. This happens because `addEventListener` on `document` in the same tick still catches the current event's bubble phase.

   **Fix:** Either: (a) use `{ capture: false }` and add `e.stopPropagation()` in the launcher click handler, or (b) defer the click-outside registration with `setTimeout(() => document.addEventListener(...), 0)`, or (c) track a `justOpened` flag.

   **Verification needed:** Run the actual built bundle in a browser and click the launcher. If the drawer flickers open/closed, this is confirmed.

2. **`label[for]` uses `for` attribute directly.** In the `createElement` helper, `for` is set via `element.setAttribute("for", ...)`. This works in HTML but is incorrect in the DOM API — the property name is `htmlFor`. While `setAttribute("for", ...)` does work in practice for most browsers, it's technically fragile and may fail in some DOM implementations.

### High Priority Issues

3. **No `dist/` in the repository.** The build produces `dist/lead-os-embed.js` but `.gitignore` excludes `dist/`. The CI verifies the build works but the built artifact is never committed or published anywhere. There's no npm publish, no CDN upload, no GitHub Release, no artifact attachment. The WordPress plugin references `$runtime_base_url/embed/lead-os-embed.js` — but how does this file get deployed to the runtime host? This is completely undocumented and the delivery pipeline doesn't exist.

4. **Tests duplicate function implementations instead of importing them.** Every test recreates `validateEmail`, `validateMessage`, `safeWidget`, etc. by copy-pasting the implementation. If the source changes, the tests still pass against the old copy. These tests prove the test copy works, not the actual source code.

   **Fix:** Export the functions and import them in tests, or at minimum use `eval`/`Function` to load from the actual source file.

### Medium Issues

5. The `lint` script references `npx biome check src/ tests/` but Biome is not installed as a dependency. Running `npm run lint` will download Biome on every invocation, which is slow, non-deterministic, and not pinned to a version.

6. No source map generated by the build. When the minified bundle throws an error in production, stack traces are useless.

### Low Issues

7. `package.json` `"type": "module"` but tests use `new Function()` which creates non-module scope. This works but is a footgun for future test refactoring.

8. `build:watch` script doesn't minify (missing `--minify`), which means the dev bundle behaves differently from production.

**Confidence Score: 45/100**

---

## [4] SENIOR BACKEND ENGINEER

**Status: CONDITIONAL PASS**

### Critical Issues

None. This is a frontend-only client library. Backend concerns are limited to the API contract.

### High Priority Issues

1. **No API contract validation.** The widget trusts whatever JSON the `/api/widgets/boot` and `/api/intake` endpoints return. A malformed response (e.g. `bootConfig.widget.accent = "<script>..."`) could be injected into inline styles (`background: <script>...`). While CSS injection via `style` property assignment is limited in damage compared to HTML injection, it can still cause visual defacement.

   **Fix:** Validate that `accent` matches a hex color pattern before using it.

2. **No request timeout.** `fetch()` calls have no `AbortController` timeout. If the runtime host hangs (accepts TCP connection but never responds), the widget stays in a "Submitting lead..." state forever.

### Medium Issues

3. The `POST /api/intake` payload includes `window.location.origin`, `window.location.pathname`, and `document.title`. These are sent to a third-party runtime. This should be documented as a privacy consideration, especially under GDPR where URL path can contain PII (e.g. `/users/john.doe`).

### Low Issues

4. No retry logic for transient network failures on boot config fetch.

**Confidence Score: 72/100**

---

## [5] SECURITY ENGINEER

**Status: CONDITIONAL PASS**

### Critical Issues

None. The current attack surface is small (no `innerHTML`, no `eval`, `textContent` for all dynamic strings).

### High Priority Issues

1. **CSS injection via `bootConfig.widget.accent`.** This value flows directly into `element.style.background`. An attacker who controls the boot config endpoint (or MITM's the response) can inject arbitrary CSS via the `style` property. While `Object.assign(element.style, { background: value })` is safer than setting `cssText`, certain values like `url(javascript:...)` or extremely long strings could cause issues in older browsers.

   **Fix:** Validate accent matches `/^#[0-9a-fA-F]{3,8}$/` before use. Fallback to default if invalid.

2. **`runtimeBaseUrl` is not validated as HTTPS.** An attacker-configured or misconfigured `runtimeBaseUrl` using `http://` sends lead data (emails, messages) over plain text. The WordPress plugin uses `esc_url()` which allows `http://`.

   **Fix:** Warn in console and/or reject non-HTTPS URLs in production environments (allow `http://localhost` for dev).

### Medium Issues

3. **No Subresource Integrity (SRI) hash.** The `<script>` tag in the WordPress plugin and README has no `integrity` attribute. If the runtime host is compromised, the embed script can be replaced with a malicious version.

4. **`sessionStorage` cache is readable by any same-origin script.** The boot config (including brand name) is stored in plain text. Low risk but worth documenting.

### Low Issues

5. The cooldown is client-side only. A trivial `fetch()` loop bypasses it. Server-side rate limiting is the real defense (out of scope for this repo but should be documented).

**Confidence Score: 68/100**

---

## [6] PERFORMANCE ENGINEER

**Status: PASS**

### Critical Issues

None.

### High Priority Issues

1. **No `AbortController` timeout on fetch calls.** A hanging runtime causes the widget to block indefinitely. The launcher never appears if boot config hangs, because `mountLeadOS` awaits the fetch before rendering.

   **Fix:** Add a 5-second `AbortController` timeout to `fetchBootConfig`. Show launcher with defaults on timeout.

### Medium Issues

2. Bundle size is 6.9KB unminified-equivalent (gzipped likely ~2.5KB). Acceptable for an embed widget. No issues here.

3. The `document.addEventListener("click", ...)` for click-outside is registered globally and never removed. On a long-lived SPA host page, this listener accumulates if `mountLeadOS` is called multiple times.

### Low Issues

4. `sessionStorage.setItem` is called synchronously in the critical path. On very slow devices this is negligible but technically suboptimal.

5. CSS is applied via `Object.assign(element.style, ...)` which triggers style recalc per property. A single `cssText` assignment or injected `<style>` block would be faster for the initial paint.

**Confidence Score: 82/100**

---

## [7] PRODUCT / VALUE STRATEGIST

**Status: FAIL**

### Core Promise

"A portable, plug-and-play widget that lets any WordPress or external site capture leads, launch assessments, and route visitors to a hosted Lead OS runtime — without engineering effort."

### Does the current implementation deliver?

**No.** The following gaps break the core promise:

1. **No delivery mechanism.** The build produces `dist/lead-os-embed.js` but there is no way to get this file onto the runtime host's `/embed/` path. There is no CDN, no npm package, no GitHub Release artifact, no deployment script. The WordPress plugin points to `$runtime_base_url/embed/lead-os-embed.js` — a URL that doesn't exist unless someone manually copies the file. This is the single biggest gap: **the widget cannot actually be used by anyone without undocumented manual steps**.

2. **Zero real-world validation.** There is no integration test that loads the built bundle in a browser, mocks the API, and verifies the widget actually renders and submits a lead. All 17 tests are unit-level. Nobody has proven this widget works end-to-end in a browser.

3. **No multi-tenant isolation.** The hardcoded `id` values, single global `window.LeadOSConfig`, and global event listeners mean you can only have one widget instance per page. This blocks any use case where a site owner wants different configs on different pages via shortcodes.

4. **"Widget" is misleading.** This is a form with two fields and a link. It doesn't do "chat" (the `mode: "chat"` config does nothing). It doesn't do real-time assessment. It's a lead form with aspirational naming.

### Verdict

The widget is a well-structured prototype. It is not a product. The distance between "code exists in a repository" and "a WordPress admin can install a plugin and have a working widget on their site" has not been bridged.

**Confidence Score: 30/100**

---

## FINAL VERDICT

| Agent | Status | Confidence |
|---|---|---|
| UX Expert | **FAIL** | 40 |
| Accessibility (WCAG 2.1 AA) | **FAIL** | 35 |
| Senior Frontend Engineer | **FAIL** | 45 |
| Senior Backend Engineer | CONDITIONAL PASS | 72 |
| Security Engineer | CONDITIONAL PASS | 68 |
| Performance Engineer | PASS | 82 |
| Product/Value Strategist | **FAIL** | 30 |

### SYSTEM = NOT PRODUCTION READY

4 of 7 agents issued FAIL. Average confidence: 53%.

### Top 10 Fixes Required Before Release (priority order)

1. **Fix click-outside race condition** — launcher click bubbles to document and immediately re-closes the drawer. Add `e.stopPropagation()` or deferred registration.
2. **Add visible focus indicators** — inject a `<style>` block with `:focus-visible` outlines.
3. **Fix placeholder contrast** — inject `::placeholder` CSS with a color that achieves 4.5:1 on `#102447`.
4. **Add a close button** inside the drawer.
5. **Make drawer scrollable** — add `overflow-y: auto; max-height: calc(100vh - 120px)`.
6. **Add fetch timeout** — `AbortController` with 5s timeout on boot config, show launcher immediately with defaults.
7. **Validate `accent` as hex color** before injecting into styles.
8. **Generate unique element IDs** per widget instance to prevent collisions.
9. **Fix test isolation** — tests must import/eval actual source code, not copy-pasted duplicates.
10. **Document the deployment pipeline** — how does `dist/lead-os-embed.js` get to the runtime's `/embed/` path?

### VALUE VALIDATION: FAIL

The core promise is "plug-and-play lead capture widget." The current state is "well-coded source files with no delivery pipeline." The gap between the two is the entire product.
