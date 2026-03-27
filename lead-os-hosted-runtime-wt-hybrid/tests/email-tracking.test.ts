import test from "node:test";
import assert from "node:assert/strict";
import {
  generateTrackingPixel,
  generateTrackedLinks,
  recordEmailEvent,
  getEmailMetrics,
} from "../src/lib/email-tracking.ts";

// ---------------------------------------------------------------------------
// generateTrackingPixel
// ---------------------------------------------------------------------------

test("generateTrackingPixel produces a valid pixel URL with base64url tracking ID", () => {
  const result = generateTrackingPixel("lead-123", "email-456", "https://api.example.com");
  assert.ok(result.trackingId.length > 0);
  assert.ok(result.pixelUrl.startsWith("https://api.example.com/api/email/pixel/"));
  assert.ok(result.pixelUrl.endsWith(".gif"));
});

test("generateTrackingPixel strips trailing slashes from base URL", () => {
  const result = generateTrackingPixel("lead-1", "email-1", "https://api.example.com///");
  assert.ok(result.pixelUrl.includes("api.example.com/api/email/pixel/"));
  assert.ok(!result.pixelUrl.includes("///"));
});

test("generateTrackingPixel produces deterministic tracking IDs for same inputs", () => {
  const a = generateTrackingPixel("lead-x", "email-y", "https://api.example.com");
  const b = generateTrackingPixel("lead-x", "email-y", "https://api.example.com");
  assert.equal(a.trackingId, b.trackingId);
  assert.equal(a.pixelUrl, b.pixelUrl);
});

test("generateTrackingPixel produces different IDs for different lead/email pairs", () => {
  const a = generateTrackingPixel("lead-a", "email-1", "https://api.example.com");
  const b = generateTrackingPixel("lead-b", "email-1", "https://api.example.com");
  assert.notEqual(a.trackingId, b.trackingId);
});

// ---------------------------------------------------------------------------
// generateTrackedLinks
// ---------------------------------------------------------------------------

test("generateTrackedLinks wraps all links with tracking URLs", () => {
  const links = [
    "https://example.com/page-1",
    "https://example.com/page-2",
  ];
  const result = generateTrackedLinks(links, "lead-1", "email-1", "https://api.example.com");

  assert.equal(result.length, 2);
  for (const tracked of result) {
    assert.ok(tracked.trackedUrl.startsWith("https://api.example.com/api/email/click/"));
    assert.ok(tracked.trackedUrl.includes("?url="));
    assert.ok(tracked.trackingId.length > 0);
    assert.ok(links.includes(tracked.originalUrl));
  }
});

test("generateTrackedLinks URL-encodes the original link in the redirect parameter", () => {
  const result = generateTrackedLinks(
    ["https://example.com/path?a=1&b=2"],
    "lead-1",
    "email-1",
    "https://api.example.com",
  );
  const tracked = result[0];
  assert.ok(tracked.trackedUrl.includes(encodeURIComponent("https://example.com/path?a=1&b=2")));
});

test("generateTrackedLinks handles empty link array", () => {
  const result = generateTrackedLinks([], "lead-1", "email-1", "https://api.example.com");
  assert.equal(result.length, 0);
});

test("generateTrackedLinks uses the same tracking ID across all links for one email", () => {
  const result = generateTrackedLinks(
    ["https://a.com", "https://b.com", "https://c.com"],
    "lead-1",
    "email-1",
    "https://api.example.com",
  );
  const ids = new Set(result.map((r) => r.trackingId));
  assert.equal(ids.size, 1, "All links in the same email should share the same tracking ID");
});

// ---------------------------------------------------------------------------
// recordEmailEvent + getEmailMetrics
// ---------------------------------------------------------------------------

test("recordEmailEvent returns a record with generated id and createdAt", async () => {
  const record = await recordEmailEvent({
    leadKey: "metrics-test-lead",
    emailId: "metrics-test-email-1",
    eventType: "sent",
  });
  assert.ok(record.id.length > 0);
  assert.ok(record.createdAt.length > 0);
  assert.equal(record.eventType, "sent");
  assert.equal(record.leadKey, "metrics-test-lead");
});

test("getEmailMetrics computes correct rates from recorded events", async () => {
  const leadKey = `metrics-lead-${Date.now()}`;

  await recordEmailEvent({ leadKey, emailId: "e1", eventType: "sent" });
  await recordEmailEvent({ leadKey, emailId: "e2", eventType: "sent" });
  await recordEmailEvent({ leadKey, emailId: "e1", eventType: "delivered" });
  await recordEmailEvent({ leadKey, emailId: "e2", eventType: "delivered" });
  await recordEmailEvent({ leadKey, emailId: "e1", eventType: "opened" });
  await recordEmailEvent({ leadKey, emailId: "e1", eventType: "clicked" });
  await recordEmailEvent({ leadKey, emailId: "e2", eventType: "bounced" });

  const metrics = await getEmailMetrics(leadKey);

  assert.equal(metrics.sent, 2);
  assert.equal(metrics.delivered, 2);
  assert.equal(metrics.opened, 1);
  assert.equal(metrics.clicked, 1);
  assert.equal(metrics.bounced, 1);
  assert.equal(metrics.unsubscribed, 0);
  assert.equal(metrics.openRate, 0.5);
  assert.equal(metrics.clickRate, 0.5);
});

test("getEmailMetrics returns zero rates when no events exist", async () => {
  const metrics = await getEmailMetrics(`no-events-${Date.now()}`);
  assert.equal(metrics.sent, 0);
  assert.equal(metrics.delivered, 0);
  assert.equal(metrics.openRate, 0);
  assert.equal(metrics.clickRate, 0);
});

test("getEmailMetrics uses delivered count as denominator when available", async () => {
  const leadKey = `delivered-denom-${Date.now()}`;

  await recordEmailEvent({ leadKey, emailId: "e1", eventType: "sent" });
  await recordEmailEvent({ leadKey, emailId: "e2", eventType: "sent" });
  await recordEmailEvent({ leadKey, emailId: "e3", eventType: "sent" });
  await recordEmailEvent({ leadKey, emailId: "e1", eventType: "delivered" });
  await recordEmailEvent({ leadKey, emailId: "e2", eventType: "delivered" });
  await recordEmailEvent({ leadKey, emailId: "e1", eventType: "opened" });

  const metrics = await getEmailMetrics(leadKey);
  assert.equal(metrics.openRate, 0.5, "Open rate should be 1/2 (opened/delivered)");
});
