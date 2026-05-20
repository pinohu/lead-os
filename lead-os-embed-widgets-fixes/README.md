# Lead OS Embed Widgets

Portable widget and form layer for embedding Lead OS chat, lead-capture forms, and assessment launchers on WordPress and external websites.

Designed to work with a hosted Lead OS runtime (e.g. `https://leads.example.com`).

## Features

- Embeddable lead capture form with email + message fields
- Embeddable assessment launcher link
- Boot manifest loading from the hosted runtime with sessionStorage caching
- Client-side input validation (email format, length limits, cooldown)
- Accessible drawer UI (ARIA dialog, focus trap, keyboard dismiss)
- WordPress plugin for no-code injection via settings page or `[lead_os_embed]` shortcode

## Quick Start

```html
<script>
  window.LeadOSConfig = {
    runtimeBaseUrl: "https://leads.example.com",
    service: "process-automation",
    niche: "general"
  };
</script>
<script src="https://leads.example.com/embed/lead-os-embed.js" defer></script>
```

The built file (`dist/lead-os-embed.js`) is an IIFE bundle — no `type="module"` required.

## Configuration

Set `window.LeadOSConfig` before the embed script loads:

| Property | Type | Default | Description |
|---|---|---|---|
| `runtimeBaseUrl` | `string` | `""` | **Required.** URL of the hosted Lead OS runtime |
| `service` | `string` | `"lead-capture"` | Service identifier sent with lead submissions |
| `niche` | `string` | `"general"` | Niche identifier for routing and assessment links |
| `mode` | `string` | `"chat"` | Widget mode (reserved for future use) |
| `position` | `string` | `"bottom-right"` | Widget position (reserved for future use) |
| `theme` | `object` | `{}` | Theme overrides (reserved for future use) |

## Runtime API Contract

The widget expects two endpoints on the runtime:

### `GET /api/widgets/boot`

Returns the boot configuration. Expected shape:

```json
{
  "widget": {
    "brandName": "My Brand",
    "accent": "#3b82f6"
  }
}
```

If the endpoint is unreachable, the widget falls back to default brand name ("Lead OS") and accent color.

### `POST /api/intake`

Accepts a lead submission. Payload:

```json
{
  "source": "embedded_widget",
  "email": "user@example.com",
  "message": "...",
  "service": "lead-capture",
  "niche": "general",
  "metadata": {
    "origin": "https://host-site.com",
    "pathname": "/page",
    "title": "Page Title"
  }
}
```

Expected response: `{ "success": true }` or `{ "success": false, "error": "..." }`.

## Development

```bash
npm install
npm run build          # produces dist/lead-os-embed.js
npm run build:watch    # rebuild on changes
npm test               # run test suite
```

Requires Node.js >= 20.

## Browser Compatibility

The built bundle targets ES2020. Supports all modern browsers (Chrome 80+, Firefox 80+, Safari 14+, Edge 80+).

## WordPress

Use the plugin in [`wordpress-plugin/lead-os-embed`](./wordpress-plugin/lead-os-embed) to inject the widget without editing theme files.

1. Upload the `lead-os-embed` folder to `wp-content/plugins/`.
2. Activate the plugin in **Plugins > Installed Plugins**.
3. Configure in **Settings > Lead OS Embed**.
4. Optionally use the `[lead_os_embed]` shortcode on specific pages.

## Deployment

The build produces `dist/lead-os-embed.js` (IIFE bundle) and `dist/lead-os-embed.js.map` (source map). To deploy:

1. **GitHub Releases** — push a `v*` tag to trigger the release workflow, which attaches the built files as release artifacts.
2. **Manual** — run `npm run build` and copy `dist/lead-os-embed.js` to your runtime host's `/embed/` path.
3. **CI artifact** — the CI workflow verifies the build succeeds on every push/PR.

The WordPress plugin loads the script from `$runtime_base_url/embed/lead-os-embed.js`, so the built file must be accessible at that URL on your hosted runtime.

## Privacy & Security Notes

- The widget sends `window.location.origin`, `window.location.pathname`, and `document.title` to the runtime's `/api/intake` endpoint with each lead submission. Under GDPR, URL paths may contain PII (e.g. `/users/john.doe`). Ensure your runtime's privacy policy covers this data collection.
- The `runtimeBaseUrl` should use HTTPS. The widget warns in the console if HTTP is detected (except `localhost`).
- Boot config is cached in `sessionStorage` (readable by same-origin scripts). This contains only brand name and accent color — no sensitive data.
- The 3-second submit cooldown is client-side only and cannot prevent automated abuse. Implement server-side rate limiting on your `/api/intake` endpoint.
- The `accent` color from the boot config is validated as a hex color (`#RGB` / `#RRGGBB` format) before use to prevent CSS injection.

## Troubleshooting

| Symptom | Cause | Fix |
|---|---|---|
| Widget does not appear | `runtimeBaseUrl` is empty or missing | Set `window.LeadOSConfig.runtimeBaseUrl` |
| Console warns "Failed to load boot config" | Runtime is down or unreachable | Check the runtime URL and CORS headers |
| Form submits but shows "failed" | `/api/intake` returned non-200 or no `success: true` | Check runtime logs |

## License

[MIT](./LICENSE)
