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

## Troubleshooting

| Symptom | Cause | Fix |
|---|---|---|
| Widget does not appear | `runtimeBaseUrl` is empty or missing | Set `window.LeadOSConfig.runtimeBaseUrl` |
| Console warns "Failed to load boot config" | Runtime is down or unreachable | Check the runtime URL and CORS headers |
| Form submits but shows "failed" | `/api/intake` returned non-200 or no `success: true` | Check runtime logs |

## License

[MIT](./LICENSE)
