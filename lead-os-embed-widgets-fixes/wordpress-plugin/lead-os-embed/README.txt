=== Lead OS Embed ===
Contributors: pinohu
Tags: lead capture, widget, embed
Requires at least: 5.0
Tested up to: 6.5
Requires PHP: 7.4
Stable tag: 0.2.0
License: MIT
License URI: https://opensource.org/licenses/MIT

Injects the Lead OS widget into a WordPress site and points it at a hosted Lead OS runtime.

== Description ==

Lead OS Embed adds a floating lead-capture widget to your WordPress site. The widget connects to your hosted Lead OS runtime to capture leads, launch assessments, and route visitors.

Features:

* Settings page under **Settings > Lead OS Embed**
* Auto-inject into every page footer (toggle in settings)
* `[lead_os_embed]` shortcode for per-page placement
* Clean uninstall — all options are removed when the plugin is deleted

== Installation ==

1. Upload the `lead-os-embed` folder to `wp-content/plugins/`.
2. Activate the plugin in **Plugins > Installed Plugins**.
3. Navigate to **Settings > Lead OS Embed**.
4. Enter your Runtime Base URL (e.g. `https://leads.example.com`).
5. Configure the default service and niche identifiers.

== Configuration ==

* **Runtime Base URL** — the URL of your hosted Lead OS runtime (required)
* **Default Service** — the service identifier sent with lead submissions (default: `lead-capture`)
* **Default Niche** — the niche identifier for routing (default: `general`)
* **Auto Inject** — when checked, the widget script is injected into every page footer

== Shortcode ==

Use `[lead_os_embed]` to inject the widget on specific pages instead of (or in addition to) auto-injection.

== Changelog ==

= 0.2.0 =
* Added sanitize_callback for all settings
* Added uninstall.php for clean option removal
* Added i18n text domain wrapping
* Completed plugin headers (Author, License, Requires, etc.)
* Used esc_js consistently for JS string context

= 0.1.0 =
* Initial release
