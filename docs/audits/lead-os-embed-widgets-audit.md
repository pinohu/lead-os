# Audit: lead-os-embed-widgets

**Repository:** https://github.com/pinohu/lead-os-embed-widgets  
**Audit date:** 2026-04-04  
**Commit audited:** `31536ce` (Initial embed widgets scaffold)  
**Total source lines:** ~334 (excluding tests/docs)

---

## 1 — Repository Overview

| Aspect | Detail |
|---|---|
| Purpose | Portable widget/form layer for embedding Lead OS chat, lead-capture forms, and assessment launchers on WordPress and external sites |
| Languages | JavaScript (ES module), PHP (WordPress plugin) |
| Entry point | `src/index.js` — self-executing embed script |
| WordPress plugin | `wordpress-plugin/lead-os-embed/lead-os-embed.php` |
| Tests | `tests/embed.test.js` (1 test, static source-scan only) |
| Dependencies | **Zero** npm runtime/dev dependencies |
| Build system | **None** — raw ES module served directly |
| TypeScript | **Not used** |
| CI/CD | **None** |
| Git history | Single initial commit |

---

## 2 — Security

### 2.1 — Critical: No input validation or sanitization (JS)

`src/index.js` lines 136-148 — the submit handler sends `emailInput.value` and `messageInput.value` directly to the runtime API without any validation.

**Risks:**
- No email format validation — empty strings, garbage, or script payloads can be submitted.
- No length constraints — an attacker can submit arbitrarily large payloads.
- No rate limiting on the client side — the form can be hammered repeatedly.

**Recommendation:** Validate the email with a regex or the `input.validity` API, enforce a max length on both fields, and add a simple client-side debounce/cooldown after submission.

### 2.2 — Medium: Server response rendered unsanitized

`src/index.js` line 153 — `result.error` from the API response is rendered directly into `feedback.textContent`. While `textContent` is safe against XSS (it does not parse HTML), the error string from an untrusted server could display misleading phishing text. If this is ever changed to `innerHTML`, it becomes a stored-XSS vector.

**Recommendation:** Keep `textContent` (good), but consider an allowlist of expected error strings or a generic fallback message rather than echoing server-supplied text.

### 2.3 — Medium: No CORS or origin verification

`postJson` and `fetchBootConfig` make cross-origin requests to `runtimeBaseUrl` without any integrity checks. If `window.LeadOSConfig.runtimeBaseUrl` is tampered with (e.g. via a browser extension or a compromised page), leads could be exfiltrated to an attacker-controlled endpoint.

**Recommendation:** Consider a Content-Security-Policy `connect-src` directive in the embedding page, or validate `runtimeBaseUrl` against an allowlist of known-good origins.

### 2.4 — Medium: `window.LeadOSConfig` is globally writable

Any script running on the host page can overwrite `window.LeadOSConfig` before the widget boots. This is an inherent limitation of any third-party embed script, but it should be documented as a trust boundary.

**Recommendation:** Document that the embedding page's CSP and script hygiene are the first line of defense. Optionally, freeze the config object after reading it.

### 2.5 — Low: WordPress plugin uses `esc_js` without quotes

`lead-os-embed.php` lines 60-61 — `esc_js()` is used to escape `$service` and `$niche`, which is correct for inline JS strings. However, `esc_url()` on line 59 is used for `$runtime_base_url` — this is correct for HTML attribute context but the same value is injected into a JS string on line 67. While `esc_url()` output is safe in this particular case, the dual-context usage should be explicitly documented or a JS-specific escaper should be used consistently.

**Recommendation:** Use `esc_js()` for the JS string context and `esc_url()` only for the HTML `src` attribute. Or use `wp_json_encode()` for all inline JS values for clarity.

### 2.6 — Low: No nonce on the WordPress shortcode

The `[lead_os_embed]` shortcode renders a `<script>` tag. WordPress shortcodes are generally trusted, but there's no nonce or capability check on the shortcode itself. This is standard for output-only shortcodes but worth noting.

---

## 3 — Code Quality & Architecture

### 3.1 — No build step or bundler

The `src/index.js` file is a raw ES module with `export` syntax. The README instructs users to load it via `<script src="..." defer>`, but:

- A `<script>` tag without `type="module"` cannot load ES modules. The file uses `export async function mountLeadOS()`, which will throw a syntax error in non-module script contexts.
- The `examples/wordpress-snippet.html` correctly uses `type="module"`, but the README `<script>` tag and the WordPress plugin `<script>` tag both omit `type="module"` and use `defer` instead.

**This is a critical functional bug.** The embed script will fail in production as documented.

**Recommendation:** Either:
1. Add a build step (esbuild/rollup/vite) to produce an IIFE bundle without `export` statements, or
2. Add `type="module"` to all script tags and remove the `export` keyword from `mountLeadOS`.

### 3.2 — No error handling on boot config fetch

`fetchBootConfig` (line 56-59) does not handle network errors, non-200 responses, or malformed JSON. If the runtime is down, the widget silently fails (the `.catch(() => {})` on line 228 swallows the error).

**Recommendation:** Add response status checking, try/catch around JSON parsing, and a visible fallback UI or console warning when the boot config is unreachable.

### 3.3 — No null-safety on `bootConfig.widget`

`buildDrawer` and `buildLauncher` directly access `bootConfig.widget.brandName` and `bootConfig.widget.accent` without null checks. If the boot endpoint returns an unexpected shape, the widget crashes.

**Recommendation:** Add defensive checks or default values for `bootConfig.widget.*` properties.

### 3.4 — Hardcoded styles, no theming

All CSS is inline via JS objects. There's no way for the embedding site to customize colors, fonts, position, or z-index beyond the boot config's `accent` color.

**Recommendation:** Accept a `theme` object in `LeadOSConfig` with overrides for key style tokens.

### 3.5 — No accessibility beyond aria-label

The launcher button has `aria-label="Open Lead OS widget"`, which is good. However:
- The drawer has no `role="dialog"` or `aria-modal`.
- No focus trap when the drawer is open.
- No keyboard dismiss (Escape key).
- No `aria-live` region for the feedback message.
- Form inputs lack associated `<label>` elements.

**Recommendation:** Add `role="dialog"`, `aria-modal="true"`, focus management, keyboard handlers, and proper labeling.

### 3.6 — z-index at maximum

The launcher uses `z-index: 2147483647` (max 32-bit int) and the drawer uses `2147483646`. This is aggressive and may conflict with other overlays on the embedding site.

**Recommendation:** Use more reasonable z-index values (e.g. 999999) and document the expected stacking context.

---

## 4 — Testing

### 4.1 — Extremely minimal test coverage

The single test in `tests/embed.test.js` reads the source file as a string and checks for the presence of three literal substrings. It does not:
- Import or execute any function.
- Test the DOM manipulation logic.
- Test the form submission flow.
- Test error handling paths.
- Test configuration merging.
- Test the WordPress plugin.

**Effective functional coverage: ~0%.**

### 4.2 — Test runner flag incompatibility

`package.json` uses `--test-isolation=none`, which was added in Node.js 22.8+. This flag is not available in earlier Node.js LTS versions (18.x, 20.x). The `--test-concurrency=1` flag is also relatively new.

**Recommendation:** Document the minimum Node.js version. Add a `"engines"` field to `package.json`.

### 4.3 — No DOM testing infrastructure

Since the code is browser-only DOM manipulation, meaningful tests require a DOM environment (jsdom, happy-dom, Playwright, etc.). None is set up.

**Recommendation:** Add jsdom-based unit tests for `createElement`, `getConfig`, `buildDrawer`, and `buildLauncher`. Add integration tests with a mock fetch for `mountLeadOS`.

---

## 5 — Build & Tooling

### 5.1 — No build pipeline

There is no bundler, minifier, or transpiler. The raw `src/index.js` is served directly. This means:
- No minification — larger payload than necessary.
- No tree-shaking.
- No source maps.
- No polyfills for older browsers.
- The `export` keyword makes the file incompatible with `<script defer>` (see 3.1).

**Recommendation:** Add a minimal build step with esbuild or rollup:
```json
{
  "scripts": {
    "build": "esbuild src/index.js --bundle --minify --format=iife --outfile=dist/lead-os-embed.js"
  }
}
```

### 5.2 — No TypeScript

The entire codebase is plain JavaScript with no type annotations, no JSDoc types, and no TypeScript config. For a library consumed by third parties, type safety would catch many of the null-safety issues identified above.

**Recommendation:** Convert to TypeScript or at minimum add JSDoc type annotations and a `tsconfig.json` with `checkJs: true`.

### 5.3 — No linter or formatter

No ESLint, Biome, or Prettier configuration exists.

**Recommendation:** Add at minimum a linter config. The code style is already clean, but automated enforcement prevents drift.

### 5.4 — No lock file

`package-lock.json` is not committed. While there are currently zero dependencies, the lock file should exist to pin the Node.js test runner behavior and any future additions.

### 5.5 — No CI/CD

No GitHub Actions, no branch protection, no automated test runs on PR.

**Recommendation:** Add a minimal CI workflow that runs the test suite and (once a build step exists) verifies the build succeeds.

---

## 6 — Performance

### 6.1 — No lazy loading of the drawer

The drawer DOM is built immediately on page load, even if the user never clicks the launcher. For a third-party embed on a performance-sensitive host page, this adds unnecessary DOM nodes and computation at startup.

**Recommendation:** Defer drawer construction to the first launcher click.

### 6.2 — Boot config fetch blocks widget rendering

`mountLeadOS` awaits `fetchBootConfig` before rendering anything. If the runtime is slow or down, the widget never appears.

**Recommendation:** Show the launcher immediately with default styling, then update after boot config arrives.

### 6.3 — No caching of boot config

Every page load makes a fresh `GET /api/widgets/boot` request. There's no `Cache-Control` awareness or local storage caching.

**Recommendation:** Cache the boot config in `sessionStorage` with a short TTL.

---

## 7 — WordPress Plugin

### 7.1 — No `sanitize_callback` on registered settings

`register_setting()` calls on lines 13-16 do not specify a `sanitize_callback`. While the output is escaped properly, input sanitization at the point of save is a WordPress best practice.

**Recommendation:** Add `sanitize_callback` for each setting (e.g. `'sanitize_callback' => 'esc_url_raw'` for the URL field).

### 7.2 — No uninstall hook

The plugin registers options but does not clean them up on uninstall. After deactivation and deletion, four orphan rows remain in `wp_options`.

**Recommendation:** Add an `uninstall.php` file or `register_uninstall_hook` to delete the options.

### 7.3 — No text domain or i18n

Strings are hardcoded in English with no `__()` or `_e()` wrappers.

**Recommendation:** Add a text domain and wrap user-facing strings for translation readiness.

### 7.4 — Plugin headers incomplete

Missing `Author`, `Author URI`, `License`, `License URI`, `Text Domain`, and `Requires at least` / `Requires PHP` headers.

---

## 8 — Documentation

### 8.1 — README is minimal

The README provides a quick start but lacks:
- API reference for `LeadOSConfig` options.
- Description of the boot config endpoint contract.
- Browser compatibility information.
- Troubleshooting section.
- Contributing guidelines.
- License information.

### 8.2 — No CHANGELOG

### 8.3 — No LICENSE file

The repository has no license, meaning it is technically "all rights reserved" by default. If this is intended to be open-source or used by third parties, a license must be added.

---

## 9 — Summary of Findings by Severity

| Severity | Count | Key Items |
|---|---|---|
| **Critical** | 1 | ES module `export` breaks `<script defer>` loading (3.1) |
| **High** | 2 | No input validation (2.1), ~0% test coverage (4.1) |
| **Medium** | 5 | No error handling on fetch (3.2), no null-safety (3.3), no build pipeline (5.1), no CORS/origin checks (2.3), globally writable config (2.4) |
| **Low** | 10 | Missing accessibility (3.5), no lazy loading (6.1), no caching (6.3), WP sanitize_callback (7.1), no uninstall hook (7.2), no i18n (7.3), no license (8.3), no linter (5.3), no CI (5.5), no lock file (5.4) |

---

## 10 — Recommended Priority Actions

1. **Fix the critical script loading bug** — add a build step producing an IIFE bundle, or remove the `export` keyword.
2. **Add input validation** on the email and message fields before submission.
3. **Add error handling** for `fetchBootConfig` — check response status, handle network failures gracefully.
4. **Add null-safety** for `bootConfig.widget.*` access.
5. **Set up a minimal build pipeline** (esbuild one-liner) for minification and IIFE output.
6. **Add meaningful tests** with jsdom for DOM functions and mock-fetch for the submission flow.
7. **Add a GitHub Actions CI workflow** to run tests and build on every push/PR.
8. **Add a LICENSE file.**
9. **Add `sanitize_callback`** to WordPress settings registration and an uninstall hook.
10. **Improve accessibility** — `role="dialog"`, focus trap, keyboard dismiss, labels.
