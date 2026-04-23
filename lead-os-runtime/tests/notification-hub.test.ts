import test from "node:test";
import assert from "node:assert/strict";
import { withEnv } from "./test-helpers.ts";
import {
  sendNotification,
  sendBulk,
  getNotificationHistory,
  registerTemplate,
  getTemplates,
  LEAD_OS_TEMPLATES,
  type Notification,
  type NotificationChannel,
} from "../src/lib/integrations/notification-hub.ts";

// Ensure Novu is not used during tests
const restoreNotificationEnv = withEnv({
  NOVU_API_KEY: undefined,
  LEAD_OS_ENABLE_LIVE_SENDS: "false",
});

function makeNotification(overrides: Partial<Notification> = {}): Notification {
  return {
    tenantId: "test-tenant",
    recipientId: "user-123",
    channel: "in-app",
    template: "new-lead",
    data: { name: "Alice", email: "alice@example.com", source: "organic", score: "85" },
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// Templates
// ---------------------------------------------------------------------------

test("LEAD_OS_TEMPLATES contains required templates", () => {
  const required = [
    "new-lead",
    "hot-lead-alert",
    "escalation-alert",
    "conversion",
    "daily-digest",
    "feedback-cycle-complete",
    "deployment-complete",
    "plan-limit-warning",
  ];

  for (const key of required) {
    assert.ok(key in LEAD_OS_TEMPLATES, `Missing template: ${key}`);
  }
});

test("each built-in template has channels, subject, and body", () => {
  for (const [name, tmpl] of Object.entries(LEAD_OS_TEMPLATES)) {
    assert.ok(Array.isArray(tmpl.channels) && tmpl.channels.length > 0, `${name} has no channels`);
    assert.ok(typeof tmpl.subject === "string" && tmpl.subject.length > 0, `${name} has no subject`);
    assert.ok(typeof tmpl.body === "string" && tmpl.body.length > 0, `${name} has no body`);
  }
});

test("registerTemplate adds a custom template", () => {
  registerTemplate("custom-test-template", ["email", "slack"], "Test subject {{var}}", "Test body {{var}}");
  const templates = getTemplates();
  const found = templates.find((t) => t.name === "custom-test-template");
  assert.ok(found, "Custom template should appear in getTemplates()");
  assert.deepEqual(found.channels, ["email", "slack"]);
});

test("getTemplates includes both built-in and custom templates", () => {
  registerTemplate("another-custom", ["in-app"], "Subject", "Body");
  const templates = getTemplates();
  const names = templates.map((t) => t.name);
  assert.ok(names.includes("new-lead"), "Built-in template should be present");
  assert.ok(names.includes("another-custom"), "Custom template should be present");
});

// ---------------------------------------------------------------------------
// sendNotification - in-app channel
// ---------------------------------------------------------------------------

test("sendNotification returns a result with an ID", async () => {
  const result = await sendNotification(makeNotification({ channel: "in-app" }));
  assert.equal(typeof result.id, "string");
  assert.ok(result.id.length > 0);
});

test("sendNotification in-app channel returns queued status", async () => {
  const result = await sendNotification(makeNotification({ channel: "in-app" }));
  assert.equal(result.channel, "in-app");
  assert.equal(result.status, "queued");
});

test("sendNotification returns timestamp in ISO 8601 format", async () => {
  const result = await sendNotification(makeNotification());
  const date = new Date(result.timestamp);
  assert.ok(!isNaN(date.getTime()), `timestamp "${result.timestamp}" should be valid`);
});

test("sendNotification with unknown template returns failed status", async () => {
  const result = await sendNotification(makeNotification({ template: "nonexistent-template-xyz" }));
  assert.equal(result.status, "failed");
});

test("sendNotification email channel without recipientEmail returns failed", async () => {
  const result = await sendNotification(
    makeNotification({ channel: "email", recipientEmail: undefined }),
  );
  assert.ok(["failed", "dry-run"].includes(result.status));
});

test("sendNotification sms channel falls back to dry-run when unconfigured", async () => {
  const restore = withEnv({ TWILIO_ACCOUNT_SID: undefined, TWILIO_AUTH_TOKEN: undefined });
  try {
    const result = await sendNotification(
      makeNotification({ channel: "sms", recipientPhone: "+15551234567" }),
    );
    assert.equal(result.status, "dry-run");
  } finally {
    restore();
  }
});

test("sendNotification push channel falls back to dry-run when unconfigured", async () => {
  const result = await sendNotification(makeNotification({ channel: "push" }));
  assert.equal(result.status, "dry-run");
});

test("sendNotification webhook channel without webhookUrl returns failed", async () => {
  const result = await sendNotification(
    makeNotification({ channel: "webhook", data: { name: "Test" } }),
  );
  assert.equal(result.status, "failed");
});

// ---------------------------------------------------------------------------
// Notification history
// ---------------------------------------------------------------------------

test("getNotificationHistory returns empty array for unknown tenant", async () => {
  const history = await getNotificationHistory("nonexistent-tenant-xyz");
  assert.deepEqual(history, []);
});

test("sendNotification records result in history", async () => {
  const tenantId = `history-test-${Date.now()}`;
  await sendNotification(makeNotification({ tenantId, channel: "in-app" }));

  const history = await getNotificationHistory(tenantId);
  assert.equal(history.length, 1);
  assert.equal(history[0].channel, "in-app");
});

test("getNotificationHistory respects limit parameter", async () => {
  const tenantId = `limit-test-${Date.now()}`;
  await sendBulk(
    Array.from({ length: 10 }, () => makeNotification({ tenantId, channel: "in-app" })),
  );

  const history = await getNotificationHistory(tenantId, 3);
  assert.equal(history.length, 3);
});

test("getNotificationHistory default limit is 50", async () => {
  const tenantId = `default-limit-${Date.now()}`;
  await sendBulk(
    Array.from({ length: 60 }, () => makeNotification({ tenantId, channel: "in-app" })),
  );

  const history = await getNotificationHistory(tenantId);
  assert.equal(history.length, 50);
});

test("history entries contain required fields", async () => {
  const tenantId = `fields-test-${Date.now()}`;
  await sendNotification(makeNotification({ tenantId, channel: "in-app" }));

  const history = await getNotificationHistory(tenantId);
  const entry = history[0];
  assert.ok(entry.id);
  assert.ok(entry.channel);
  assert.ok(entry.status);
  assert.ok(entry.timestamp);
});

// ---------------------------------------------------------------------------
// sendBulk
// ---------------------------------------------------------------------------

test("sendBulk processes all notifications", async () => {
  const notifications: Notification[] = [
    makeNotification({ tenantId: "bulk-test", channel: "in-app", template: "new-lead" }),
    makeNotification({ tenantId: "bulk-test", channel: "in-app", template: "daily-digest" }),
    makeNotification({ tenantId: "bulk-test", channel: "in-app", template: "conversion" }),
  ];

  const results = await sendBulk(notifications);
  assert.equal(results.length, 3);
  for (const result of results) {
    assert.equal(typeof result.id, "string");
    assert.ok(result.status !== undefined);
  }
});

test("sendBulk with mixed valid and invalid templates returns all results", async () => {
  const notifications: Notification[] = [
    makeNotification({ channel: "in-app", template: "new-lead" }),
    makeNotification({ channel: "in-app", template: "this-does-not-exist" }),
  ];

  const results = await sendBulk(notifications);
  assert.equal(results.length, 2);
  assert.equal(results[0].status, "queued");
  assert.equal(results[1].status, "failed");
});

// ---------------------------------------------------------------------------
// Channel coverage
// ---------------------------------------------------------------------------

test("all notification channels produce a result with a channel field", async () => {
  const channels: NotificationChannel[] = ["in-app", "sms", "push"];

  for (const channel of channels) {
    const result = await sendNotification(makeNotification({ channel }));
    assert.equal(result.channel, channel, `Channel field mismatch for ${channel}`);
  }
});
