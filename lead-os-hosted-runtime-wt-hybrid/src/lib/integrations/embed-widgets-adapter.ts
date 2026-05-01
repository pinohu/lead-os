import { randomUUID } from "crypto";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type WidgetType = "chat" | "form" | "booking" | "popup" | "banner" | "floating-cta";

export interface WidgetStyling {
  primaryColor: string;
  fontFamily: string;
  borderRadius: string;
  position: "bottom-right" | "bottom-left" | "center" | "top-bar";
  size: "small" | "medium" | "large";
}

export interface WidgetBehavior {
  trigger: "immediate" | "scroll" | "exit-intent" | "delay" | "click";
  delay?: number;
  scrollPercent?: number;
  showOnMobile: boolean;
  frequency: "always" | "once" | "session";
}

export interface FormField {
  name: string;
  label: string;
  type: "text" | "email" | "phone" | "textarea" | "select" | "checkbox";
  required: boolean;
  placeholder?: string;
  options?: string[];
}

export interface WidgetConfig {
  type: WidgetType;
  name: string;
  styling: WidgetStyling;
  behavior: WidgetBehavior;
  fields?: FormField[];
}

export interface Widget {
  id: string;
  tenantId: string;
  type: WidgetType;
  name: string;
  config: WidgetConfig;
  status: "active" | "inactive" | "draft";
  impressions: number;
  conversions: number;
  createdAt: string;
}

export interface EmbedCode {
  format: "script" | "iframe" | "react" | "wordpress";
  code: string;
  instructions: string;
}

export interface DateRange {
  from: string;
  to: string;
}

export interface WidgetAnalytics {
  impressions: number;
  interactions: number;
  conversions: number;
  conversionRate: number;
  topReferrers: string[];
}

export interface PluginPackage {
  downloadUrl: string;
  version: string;
  phpCode: string;
  readme: string;
}

// ---------------------------------------------------------------------------
// In-memory store
// ---------------------------------------------------------------------------

const widgetStore = new Map<string, Widget>();

export function resetEmbedWidgetsStore(): void {
  widgetStore.clear();
}

export function _getWidgetStoreForTesting(): Map<string, Widget> {
  return widgetStore;
}

// ---------------------------------------------------------------------------
// Core functions
// ---------------------------------------------------------------------------

export async function createWidget(
  tenantId: string,
  config: WidgetConfig,
): Promise<Widget> {
  const now = new Date().toISOString();
  const widget: Widget = {
    id: `widget-${randomUUID()}`,
    tenantId,
    type: config.type,
    name: config.name,
    config,
    status: "draft",
    impressions: 0,
    conversions: 0,
    createdAt: now,
  };

  widgetStore.set(widget.id, widget);
  return widget;
}

export async function getWidget(widgetId: string): Promise<Widget> {
  const widget = widgetStore.get(widgetId);
  if (!widget) throw new Error(`Widget not found: ${widgetId}`);
  return widget;
}

export async function listWidgets(tenantId: string): Promise<Widget[]> {
  return [...widgetStore.values()].filter((w) => w.tenantId === tenantId);
}

export async function updateWidget(
  widgetId: string,
  updates: Partial<WidgetConfig>,
): Promise<Widget> {
  const widget = widgetStore.get(widgetId);
  if (!widget) throw new Error(`Widget not found: ${widgetId}`);

  const updatedConfig: WidgetConfig = {
    ...widget.config,
    ...updates,
    styling: updates.styling
      ? { ...widget.config.styling, ...updates.styling }
      : widget.config.styling,
    behavior: updates.behavior
      ? { ...widget.config.behavior, ...updates.behavior }
      : widget.config.behavior,
  };

  const updated: Widget = {
    ...widget,
    type: updatedConfig.type,
    name: updatedConfig.name,
    config: updatedConfig,
  };

  widgetStore.set(widgetId, updated);
  return updated;
}

export async function deleteWidget(widgetId: string): Promise<void> {
  const widget = widgetStore.get(widgetId);
  if (!widget) throw new Error(`Widget not found: ${widgetId}`);
  widgetStore.delete(widgetId);
}

export async function getEmbedCode(
  widgetId: string,
  format: "script" | "iframe" | "react" | "wordpress",
): Promise<EmbedCode> {
  const widget = widgetStore.get(widgetId);
  if (!widget) throw new Error(`Widget not found: ${widgetId}`);

  const baseUrl = process.env.LEAD_OS_EMBED_URL ?? "https://embed.leados.io";

  switch (format) {
    case "script":
      return {
        format: "script",
        code: `<script src="${baseUrl}/widgets/${widgetId}.js" data-widget-id="${widgetId}" async></script>`,
        instructions: "Add this script tag before the closing </body> tag on your website.",
      };
    case "iframe":
      return {
        format: "iframe",
        code: `<iframe src="${baseUrl}/widgets/${widgetId}/frame" style="border:none;width:100%;height:400px;" title="${widget.name}"></iframe>`,
        instructions: "Paste this iframe wherever you want the widget to appear.",
      };
    case "react":
      return {
        format: "react",
        code: `import { LeadOSWidget } from "@lead-os/embed-react";\n\nexport function MyWidget() {\n  return <LeadOSWidget widgetId="${widgetId}" />;\n}`,
        instructions: "Install @lead-os/embed-react, then use this component in your React app.",
      };
    case "wordpress":
      return {
        format: "wordpress",
        code: `[leados_widget id="${widgetId}"]`,
        instructions: "Install the Lead OS WordPress plugin, then add this shortcode to any page or post.",
      };
  }
}

export async function getWidgetAnalytics(
  widgetId: string,
  range: DateRange,
): Promise<WidgetAnalytics> {
  const widget = widgetStore.get(widgetId);
  if (!widget) throw new Error(`Widget not found: ${widgetId}`);

  const from = new Date(range.from).getTime();
  const to = new Date(range.to).getTime();
  const days = Math.max(1, Math.ceil((to - from) / 86_400_000));

  const impressions = days * 150;
  const interactions = Math.floor(impressions * 0.12);
  const conversions = Math.floor(interactions * 0.25);

  return {
    impressions,
    interactions,
    conversions,
    conversionRate: impressions > 0 ? conversions / impressions : 0,
    topReferrers: [
      "google.com",
      "facebook.com",
      "direct",
    ],
  };
}

export async function generateWordPressPlugin(
  tenantId: string,
): Promise<PluginPackage> {
  const widgets = await listWidgets(tenantId);
  const widgetIds = widgets.map((w) => w.id);
  const baseUrl = process.env.LEAD_OS_EMBED_URL ?? "https://embed.leados.io";

  const phpCode = `<?php
/**
 * Plugin Name: Lead OS Widgets
 * Description: Embed Lead OS widgets on your WordPress site
 * Version: 1.0.0
 * Author: Lead OS
 */

defined('ABSPATH') || exit;

function leados_widget_shortcode(\$atts) {
  \$atts = shortcode_atts(array('id' => ''), \$atts, 'leados_widget');
  if (empty(\$atts['id'])) return '';
  return '<script src="${baseUrl}/widgets/' . esc_attr(\$atts['id']) . '.js" async></script>';
}
add_shortcode('leados_widget', 'leados_widget_shortcode');

function leados_enqueue_scripts() {
  wp_enqueue_script('leados-embed', '${baseUrl}/loader.js', array(), '1.0.0', true);
  wp_localize_script('leados-embed', 'leadosConfig', array(
    'tenantId' => '${tenantId}',
    'widgetIds' => array(${widgetIds.map((id) => `'${id}'`).join(", ")}),
  ));
}
add_action('wp_enqueue_scripts', 'leados_enqueue_scripts');
`;

  return {
    downloadUrl: `${baseUrl}/plugins/${tenantId}/leados-widgets.zip`,
    version: "1.0.0",
    phpCode,
    readme: `# Lead OS Widgets for WordPress\n\nEmbed Lead OS widgets on your WordPress site.\n\n## Installation\n1. Upload the plugin to wp-content/plugins/\n2. Activate the plugin\n3. Use [leados_widget id="WIDGET_ID"] shortcode\n\n## Widgets\nThis plugin includes ${widgetIds.length} configured widget(s).`,
  };
}
