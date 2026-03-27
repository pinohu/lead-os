import test from "node:test";
import assert from "node:assert/strict";
import {
  detectIngressChannel,
  resolveIngressDecision,
  createIngressRule,
  listIngressRules,
  deleteIngressRule,
  getDefaultIngressMap,
  getIngressAnalytics,
  resetIngressStore,
} from "../src/lib/ingress-engine.ts";

// ---------------------------------------------------------------------------
// detectIngressChannel
// ---------------------------------------------------------------------------

test("detectIngressChannel maps google referrer to seo when no paid medium", () => {
  const channel = detectIngressChannel("", "https://www.google.com/search?q=test");
  assert.equal(channel, "seo");
});

test("detectIngressChannel maps google referrer to paid-search with cpc medium", () => {
  const channel = detectIngressChannel("", "https://www.google.com/search?q=test", "google", "cpc");
  assert.equal(channel, "paid-search");
});

test("detectIngressChannel maps bing with ppc medium to paid-search", () => {
  const channel = detectIngressChannel("", "https://www.bing.com/search", undefined, "ppc");
  assert.equal(channel, "paid-search");
});

test("detectIngressChannel maps facebook referrer to organic-social by default", () => {
  const channel = detectIngressChannel("", "https://facebook.com/post/123");
  assert.equal(channel, "organic-social");
});

test("detectIngressChannel maps facebook with paid-social medium to paid-social", () => {
  const channel = detectIngressChannel("", "https://facebook.com", "facebook", "paid-social");
  assert.equal(channel, "paid-social");
});

test("detectIngressChannel maps instagram referrer to organic-social", () => {
  const channel = detectIngressChannel("", "https://instagram.com/p/abc");
  assert.equal(channel, "organic-social");
});

test("detectIngressChannel maps email utm to email channel", () => {
  const channel = detectIngressChannel("", "", "newsletter", "email");
  assert.equal(channel, "email");
});

test("detectIngressChannel maps partner medium to partner", () => {
  const channel = detectIngressChannel("partner", "", undefined, "partner");
  assert.equal(channel, "partner");
});

test("detectIngressChannel maps unknown referrer domain to referral", () => {
  const channel = detectIngressChannel("", "https://some-blog.com/article");
  assert.equal(channel, "referral");
});

test("detectIngressChannel maps empty source and referrer to direct", () => {
  const channel = detectIngressChannel("");
  assert.equal(channel, "direct");
});

test("detectIngressChannel maps direct source to direct", () => {
  const channel = detectIngressChannel("direct");
  assert.equal(channel, "direct");
});

test("detectIngressChannel maps yelp referrer to directory", () => {
  const channel = detectIngressChannel("", "https://yelp.com/biz/test");
  assert.equal(channel, "directory");
});

test("detectIngressChannel maps paid-social medium explicitly", () => {
  const channel = detectIngressChannel("", "", "meta", "paid-social");
  assert.equal(channel, "paid-social");
});

test("detectIngressChannel maps referral medium to referral", () => {
  const channel = detectIngressChannel("", "", undefined, "referral");
  assert.equal(channel, "referral");
});

// ---------------------------------------------------------------------------
// resolveIngressDecision -- defaults
// ---------------------------------------------------------------------------

test("resolveIngressDecision returns default mapping for seo channel", () => {
  resetIngressStore();
  const decision = resolveIngressDecision("seo", "test-tenant");
  assert.equal(decision.channel, "seo");
  assert.equal(decision.intentLevel, "low");
  assert.equal(decision.funnelType, "lead-magnet");
  assert.equal(decision.scoreBoost, 5);
  assert.equal(decision.matchedRule, undefined);
  assert.ok(decision.confidence > 0);
});

test("resolveIngressDecision returns default mapping for paid-search channel", () => {
  resetIngressStore();
  const decision = resolveIngressDecision("paid-search", "test-tenant");
  assert.equal(decision.intentLevel, "high");
  assert.equal(decision.funnelType, "qualification");
  assert.equal(decision.scoreBoost, 25);
});

test("resolveIngressDecision returns default mapping for referral channel", () => {
  resetIngressStore();
  const decision = resolveIngressDecision("referral", "test-tenant");
  assert.equal(decision.intentLevel, "high");
  assert.equal(decision.scoreBoost, 30);
});

// ---------------------------------------------------------------------------
// resolveIngressDecision -- custom rules override defaults
// ---------------------------------------------------------------------------

test("resolveIngressDecision uses custom rule when it matches", async () => {
  resetIngressStore();

  await createIngressRule({
    tenantId: "custom-tenant",
    channel: "seo",
    intentLevel: "high",
    funnelType: "qualification",
    keywords: ["emergency"],
    initialScoreBoost: 25,
    priority: 10,
    active: true,
  });

  const decision = resolveIngressDecision("seo", "custom-tenant", ["emergency plumber"]);
  assert.equal(decision.intentLevel, "high");
  assert.equal(decision.funnelType, "qualification");
  assert.equal(decision.scoreBoost, 25);
  assert.ok(decision.matchedRule !== undefined);
  assert.ok(decision.confidence > 0.9);
});

test("resolveIngressDecision falls back to default when custom rule keywords do not match", async () => {
  resetIngressStore();

  await createIngressRule({
    tenantId: "custom-tenant",
    channel: "seo",
    intentLevel: "high",
    funnelType: "qualification",
    keywords: ["emergency"],
    initialScoreBoost: 25,
    priority: 10,
    active: true,
  });

  const decision = resolveIngressDecision("seo", "custom-tenant", ["best restaurant"]);
  assert.equal(decision.intentLevel, "low");
  assert.equal(decision.funnelType, "lead-magnet");
  assert.equal(decision.matchedRule, undefined);
});

// ---------------------------------------------------------------------------
// CRUD operations
// ---------------------------------------------------------------------------

test("createIngressRule stores rule and listIngressRules returns it", async () => {
  resetIngressStore();

  const rule = await createIngressRule({
    tenantId: "crud-tenant",
    channel: "paid-search",
    intentLevel: "high",
    funnelType: "checkout",
    initialScoreBoost: 20,
    priority: 5,
    active: true,
  });

  assert.ok(rule.id.length > 0);
  assert.equal(rule.channel, "paid-search");

  const rules = await listIngressRules("crud-tenant");
  assert.ok(rules.length >= 1);
  assert.ok(rules.some((r) => r.id === rule.id));
});

test("deleteIngressRule removes the rule", async () => {
  resetIngressStore();

  const rule = await createIngressRule({
    tenantId: "delete-tenant",
    channel: "email",
    intentLevel: "medium",
    funnelType: "nurture",
    initialScoreBoost: 10,
    priority: 1,
    active: true,
  });

  const deleted = await deleteIngressRule(rule.id);
  assert.equal(deleted, true);

  const rules = await listIngressRules("delete-tenant");
  assert.ok(!rules.some((r) => r.id === rule.id));
});

// ---------------------------------------------------------------------------
// getDefaultIngressMap
// ---------------------------------------------------------------------------

test("getDefaultIngressMap covers all 9 channel types", () => {
  const map = getDefaultIngressMap();
  const channels = Object.keys(map);
  assert.equal(channels.length, 9);
  assert.ok(channels.includes("seo"));
  assert.ok(channels.includes("paid-search"));
  assert.ok(channels.includes("paid-social"));
  assert.ok(channels.includes("organic-social"));
  assert.ok(channels.includes("referral"));
  assert.ok(channels.includes("directory"));
  assert.ok(channels.includes("email"));
  assert.ok(channels.includes("partner"));
  assert.ok(channels.includes("direct"));
});

// ---------------------------------------------------------------------------
// getIngressAnalytics
// ---------------------------------------------------------------------------

test("getIngressAnalytics returns an array without DB", async () => {
  resetIngressStore();
  const analytics = await getIngressAnalytics("no-db-tenant");
  assert.ok(Array.isArray(analytics));
  assert.ok(analytics.length > 0);
  for (const entry of analytics) {
    assert.equal(typeof entry.channel, "string");
    assert.equal(typeof entry.leads, "number");
    assert.equal(typeof entry.conversions, "number");
    assert.equal(typeof entry.conversionRate, "number");
    assert.equal(typeof entry.avgScore, "number");
  }
});
