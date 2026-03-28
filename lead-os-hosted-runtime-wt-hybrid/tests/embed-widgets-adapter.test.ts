import test from "node:test";
import assert from "node:assert/strict";
import {
  createWidget,
  getWidget,
  listWidgets,
  updateWidget,
  deleteWidget,
  getEmbedCode,
  getWidgetAnalytics,
  generateWordPressPlugin,
  resetEmbedWidgetsStore,
} from "../src/lib/integrations/embed-widgets-adapter.ts";

const DEFAULT_STYLING = {
  primaryColor: "#3b82f6",
  fontFamily: "Inter",
  borderRadius: "8px",
  position: "bottom-right" as const,
  size: "medium" as const,
};

const DEFAULT_BEHAVIOR = {
  trigger: "immediate" as const,
  showOnMobile: true,
  frequency: "always" as const,
};

// ---------------------------------------------------------------------------
// createWidget + getWidget
// ---------------------------------------------------------------------------

test("createWidget creates a widget and getWidget retrieves it", async () => {
  resetEmbedWidgetsStore();
  const widget = await createWidget("ew-t1", {
    type: "chat",
    name: "Support Chat",
    styling: DEFAULT_STYLING,
    behavior: DEFAULT_BEHAVIOR,
  });

  assert.ok(widget.id.startsWith("widget-"));
  assert.equal(widget.tenantId, "ew-t1");
  assert.equal(widget.type, "chat");
  assert.equal(widget.name, "Support Chat");
  assert.equal(widget.status, "draft");
  assert.equal(widget.impressions, 0);
  assert.ok(widget.createdAt);

  const retrieved = await getWidget(widget.id);
  assert.equal(retrieved.id, widget.id);
});

// ---------------------------------------------------------------------------
// listWidgets
// ---------------------------------------------------------------------------

test("listWidgets returns widgets scoped to tenant", async () => {
  resetEmbedWidgetsStore();
  await createWidget("ew-ta", { type: "form", name: "Form A", styling: DEFAULT_STYLING, behavior: DEFAULT_BEHAVIOR });
  await createWidget("ew-tb", { type: "popup", name: "Popup B", styling: DEFAULT_STYLING, behavior: DEFAULT_BEHAVIOR });
  await createWidget("ew-ta", { type: "banner", name: "Banner C", styling: DEFAULT_STYLING, behavior: DEFAULT_BEHAVIOR });

  const taWidgets = await listWidgets("ew-ta");
  const tbWidgets = await listWidgets("ew-tb");

  assert.equal(taWidgets.length, 2);
  assert.equal(tbWidgets.length, 1);
});

// ---------------------------------------------------------------------------
// updateWidget
// ---------------------------------------------------------------------------

test("updateWidget modifies widget config", async () => {
  resetEmbedWidgetsStore();
  const widget = await createWidget("ew-t2", {
    type: "chat",
    name: "Chat Widget",
    styling: DEFAULT_STYLING,
    behavior: DEFAULT_BEHAVIOR,
  });

  const updated = await updateWidget(widget.id, { name: "Updated Chat" });
  assert.equal(updated.name, "Updated Chat");
  assert.equal(updated.type, "chat");
});

// ---------------------------------------------------------------------------
// deleteWidget
// ---------------------------------------------------------------------------

test("deleteWidget removes a widget from the store", async () => {
  resetEmbedWidgetsStore();
  const widget = await createWidget("ew-t3", {
    type: "popup",
    name: "Delete Me",
    styling: DEFAULT_STYLING,
    behavior: DEFAULT_BEHAVIOR,
  });

  await deleteWidget(widget.id);
  await assert.rejects(() => getWidget(widget.id), /not found/);
});

// ---------------------------------------------------------------------------
// getEmbedCode
// ---------------------------------------------------------------------------

test("getEmbedCode returns script embed code", async () => {
  resetEmbedWidgetsStore();
  const widget = await createWidget("ew-t4", {
    type: "form",
    name: "Lead Form",
    styling: DEFAULT_STYLING,
    behavior: DEFAULT_BEHAVIOR,
  });

  const embed = await getEmbedCode(widget.id, "script");
  assert.equal(embed.format, "script");
  assert.ok(embed.code.includes("<script"));
  assert.ok(embed.code.includes(widget.id));
  assert.ok(embed.instructions.length > 0);
});

test("getEmbedCode returns wordpress shortcode", async () => {
  resetEmbedWidgetsStore();
  const widget = await createWidget("ew-t5", {
    type: "form",
    name: "WP Form",
    styling: DEFAULT_STYLING,
    behavior: DEFAULT_BEHAVIOR,
  });

  const embed = await getEmbedCode(widget.id, "wordpress");
  assert.equal(embed.format, "wordpress");
  assert.ok(embed.code.includes("leados_widget"));
  assert.ok(embed.code.includes(widget.id));
});

// ---------------------------------------------------------------------------
// getWidgetAnalytics
// ---------------------------------------------------------------------------

test("getWidgetAnalytics returns analytics data", async () => {
  resetEmbedWidgetsStore();
  const widget = await createWidget("ew-t6", {
    type: "chat",
    name: "Analytics Test",
    styling: DEFAULT_STYLING,
    behavior: DEFAULT_BEHAVIOR,
  });

  const analytics = await getWidgetAnalytics(widget.id, { from: "2026-01-01", to: "2026-01-08" });
  assert.ok(analytics.impressions > 0);
  assert.ok(analytics.interactions > 0);
  assert.ok(analytics.conversions >= 0);
  assert.ok(analytics.conversionRate >= 0);
  assert.ok(analytics.topReferrers.length > 0);
});

// ---------------------------------------------------------------------------
// generateWordPressPlugin
// ---------------------------------------------------------------------------

test("generateWordPressPlugin returns a plugin package", async () => {
  resetEmbedWidgetsStore();
  await createWidget("ew-t7", { type: "chat", name: "WP Chat", styling: DEFAULT_STYLING, behavior: DEFAULT_BEHAVIOR });

  const plugin = await generateWordPressPlugin("ew-t7");
  assert.ok(plugin.downloadUrl.length > 0);
  assert.equal(plugin.version, "1.0.0");
  assert.ok(plugin.phpCode.includes("leados_widget_shortcode"));
  assert.ok(plugin.readme.includes("Lead OS"));
});
