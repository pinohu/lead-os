# Changelog

All notable changes to this project will be documented in this file.

## [0.2.0] - 2026-04-04

### Added

- **Build pipeline** — esbuild produces a minified IIFE bundle (`dist/lead-os-embed.js`, ~6.7KB), fixing the critical `<script defer>` loading bug caused by ES module `export` syntax.
- **Input validation** — email format regex, 254-char email limit, 2000-char message limit, 3-second submit cooldown.
- **Error handling** — `fetchBootConfig` checks HTTP status, try/catch with `console.warn` fallback.
- **Null-safety** — `safeWidget()` provides defaults when `bootConfig.widget` is missing.
- **Accessibility** — `role="dialog"`, `aria-modal`, focus trap (dynamic), Escape key dismiss, click-outside-to-close, `aria-live` feedback region, `aria-haspopup`/`aria-expanded` on launcher, `<label>` elements for form inputs.
- **Boot config caching** — `sessionStorage` with 5-minute TTL to avoid redundant requests.
- **Lazy drawer** — drawer DOM is built on first launcher click, not at page load.
- **Config freeze** — `Object.freeze` on the merged config object to prevent runtime tampering.
- **CI/CD** — GitHub Actions workflow running tests + build on Node 20 and 22.
- **LICENSE** — MIT license.
- **WordPress plugin improvements:**
  - `sanitize_callback` on all registered settings.
  - `uninstall.php` for clean option removal on plugin deletion.
  - i18n text domain wrapping (`__()`, `esc_html_e()`).
  - Complete plugin headers (Author, License, Requires at least, Requires PHP, Text Domain).
  - Consistent `esc_js()` for JavaScript string contexts.
- **Tests** — 17 tests covering DOM creation, input validation, null-safety, config merge/freeze, boot config caching, and accessibility attribute presence.
- **Documentation** — comprehensive README with configuration reference, API contract, browser compatibility, troubleshooting, and WordPress installation guide.

### Changed

- z-index reduced from `2147483647` to `999999` to avoid conflicts with host-page overlays.
- Server error messages are no longer echoed to users; generic fallback messages are shown instead.
- Test runner flags updated for Node 20+ compatibility (`--test-isolation=none` removed).
- `engines` field added to `package.json` requiring Node >= 20.

## [0.1.0] - 2025-01-01

### Added

- Initial embed widgets scaffold with chat launcher, lead form, and assessment link.
- WordPress plugin for no-code widget injection.
