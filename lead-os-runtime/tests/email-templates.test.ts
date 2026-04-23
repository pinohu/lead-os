import test from "node:test";
import assert from "node:assert/strict";
import {
  createTemplate,
  deleteTemplate,
  getDefaultTemplates,
  getTemplate,
  listTemplates,
  renderEmail,
  updateTemplate,
  type EmailContext,
  type EmailTemplate,
} from "../src/lib/email-templates.ts";
import {
  addToSuppressionList,
  isEmailSuppressed,
  removeFromSuppressionList,
  getSuppressionList,
  _getSuppressionStoreForTesting,
} from "../src/lib/email-sender.ts";

// ---------------------------------------------------------------------------
// renderEmail
// ---------------------------------------------------------------------------

test("renderEmail replaces all {{variable}} placeholders in subject, html, and text", () => {
  const template: EmailTemplate = {
    id: "test-render",
    name: "Test",
    subject: "Hello {{firstName}}, welcome to {{brandName}}",
    category: "transactional",
    htmlTemplate: "<h1>Hi {{firstName}} {{lastName}}</h1><p>Visit {{siteUrl}}</p>",
    textTemplate: "Hi {{firstName}} {{lastName}}, visit {{siteUrl}}",
    variables: ["firstName", "lastName", "brandName", "siteUrl"],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const context: EmailContext = {
    firstName: "Alice",
    lastName: "Smith",
    brandName: "TestBrand",
    siteUrl: "https://test.com",
    supportEmail: "help@test.com",
    unsubscribeUrl: "https://test.com/unsub",
    currentYear: "2026",
  };

  const result = renderEmail(template, context);

  assert.equal(result.subject, "Hello Alice, welcome to TestBrand");
  assert.ok(result.html.includes("Hi Alice Smith"));
  assert.ok(result.html.includes("https://test.com"));
  assert.ok(result.text.includes("Hi Alice Smith, visit https://test.com"));
});

test("renderEmail adds tracking pixel when trackingPixelUrl is provided", () => {
  const template: EmailTemplate = {
    id: "test-pixel",
    name: "Pixel Test",
    subject: "Test",
    category: "nurture",
    htmlTemplate: "<p>Body</p>",
    textTemplate: "Body",
    variables: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const context: EmailContext = {
    brandName: "Brand",
    siteUrl: "https://site.com",
    supportEmail: "s@s.com",
    unsubscribeUrl: "https://site.com/unsub",
    trackingPixelUrl: "https://site.com/api/tracking/pixel?eid=abc123",
    currentYear: "2026",
  };

  const result = renderEmail(template, context);

  assert.ok(result.html.includes("https://site.com/api/tracking/pixel?eid=abc123"));
  assert.ok(result.html.includes('width="1"'));
  assert.ok(result.html.includes('height="1"'));
});

test("renderEmail adds unsubscribe link in footer and headers", () => {
  const template: EmailTemplate = {
    id: "test-unsub",
    name: "Unsub Test",
    subject: "Test",
    category: "nurture",
    htmlTemplate: "<p>Content</p>",
    textTemplate: "Content",
    variables: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const context: EmailContext = {
    brandName: "Brand",
    siteUrl: "https://site.com",
    supportEmail: "s@s.com",
    unsubscribeUrl: "https://site.com/unsubscribe?email=test@test.com",
    currentYear: "2026",
  };

  const result = renderEmail(template, context);

  assert.ok(result.html.includes("Unsubscribe"));
  assert.ok(result.html.includes("https://site.com/unsubscribe?email=test@test.com"));
  assert.equal(result.headers["List-Unsubscribe"], "<https://site.com/unsubscribe?email=test@test.com>");
  assert.equal(result.headers["List-Unsubscribe-Post"], "List-Unsubscribe=One-Click");
});

test("renderEmail produces responsive HTML layout with max-width 600px", () => {
  const template: EmailTemplate = {
    id: "test-responsive",
    name: "Responsive",
    subject: "Test",
    category: "transactional",
    htmlTemplate: "<p>Hello</p>",
    textTemplate: "Hello",
    variables: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const context: EmailContext = {
    brandName: "Brand",
    siteUrl: "https://site.com",
    supportEmail: "s@s.com",
    unsubscribeUrl: "https://site.com/unsub",
    currentYear: "2026",
  };

  const result = renderEmail(template, context);

  assert.ok(result.html.includes('width="600"'));
  assert.ok(result.html.includes("max-width"));
  assert.ok(result.html.includes("<!DOCTYPE html>"));
  assert.ok(result.html.includes("</html>"));
});

test("renderEmail replaces missing variables with empty string", () => {
  const template: EmailTemplate = {
    id: "test-missing",
    name: "Missing Vars",
    subject: "Hi {{firstName}} from {{companyName}}",
    category: "nurture",
    htmlTemplate: "<p>{{unknownVar}}</p>",
    textTemplate: "{{unknownVar}}",
    variables: ["firstName", "companyName", "unknownVar"],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const context: EmailContext = {
    firstName: "Bob",
    brandName: "Brand",
    siteUrl: "https://site.com",
    supportEmail: "s@s.com",
    unsubscribeUrl: "https://site.com/unsub",
    currentYear: "2026",
  };

  const result = renderEmail(template, context);

  assert.equal(result.subject, "Hi Bob from ");
  assert.ok(result.text.length === 0 || result.text === "");
});

// ---------------------------------------------------------------------------
// getDefaultTemplates
// ---------------------------------------------------------------------------

test("getDefaultTemplates returns 18 built-in templates", () => {
  const defaults = getDefaultTemplates();

  assert.equal(defaults.length, 18);

  const ids = defaults.map((t) => t.id);
  assert.ok(ids.includes("welcome"));
  assert.ok(ids.includes("magic-link"));
  assert.ok(ids.includes("nurture-day-0"));
  assert.ok(ids.includes("nurture-day-3"));
  assert.ok(ids.includes("nurture-day-7"));
  assert.ok(ids.includes("nurture-day-10"));
  assert.ok(ids.includes("nurture-day-14"));
  assert.ok(ids.includes("nurture-day-21"));
  assert.ok(ids.includes("nurture-day-30"));
  assert.ok(ids.includes("hot-lead-alert"));
  assert.ok(ids.includes("booking-confirmation"));
  assert.ok(ids.includes("lead-magnet-delivery"));
});

test("default templates have correct categories", () => {
  const defaults = getDefaultTemplates();
  const byId = new Map(defaults.map((t) => [t.id, t]));

  assert.equal(byId.get("welcome")?.category, "transactional");
  assert.equal(byId.get("magic-link")?.category, "system");
  assert.equal(byId.get("hot-lead-alert")?.category, "notification");
  assert.equal(byId.get("nurture-day-0")?.category, "nurture");
  assert.equal(byId.get("booking-confirmation")?.category, "transactional");
  assert.equal(byId.get("lead-magnet-delivery")?.category, "transactional");
});

test("default templates have non-empty htmlTemplate and textTemplate", () => {
  const defaults = getDefaultTemplates();

  for (const template of defaults) {
    assert.ok(template.htmlTemplate.length > 0, `${template.id} should have htmlTemplate`);
    assert.ok(template.textTemplate.length > 0, `${template.id} should have textTemplate`);
    assert.ok(template.subject.length > 0, `${template.id} should have subject`);
  }
});

// ---------------------------------------------------------------------------
// Template CRUD
// ---------------------------------------------------------------------------

test("createTemplate stores and retrieves a template", () => {
  const template = createTemplate({
    id: "crud-test-1",
    name: "CRUD Test",
    subject: "Test Subject",
    category: "marketing",
    htmlTemplate: "<p>Test</p>",
    textTemplate: "Test",
    variables: [],
  });

  assert.equal(template.id, "crud-test-1");
  assert.ok(template.createdAt.length > 0);
  assert.ok(template.updatedAt.length > 0);

  const retrieved = getTemplate("crud-test-1");
  assert.ok(retrieved);
  assert.equal(retrieved.name, "CRUD Test");
});

test("updateTemplate modifies fields and updates timestamp", () => {
  createTemplate({
    id: "crud-test-2",
    name: "Original",
    subject: "Original Subject",
    category: "transactional",
    htmlTemplate: "<p>Original</p>",
    textTemplate: "Original",
    variables: [],
  });

  const updated = updateTemplate("crud-test-2", { name: "Updated", subject: "New Subject" });

  assert.ok(updated);
  assert.equal(updated.name, "Updated");
  assert.equal(updated.subject, "New Subject");
  assert.equal(updated.htmlTemplate, "<p>Original</p>");
});

test("deleteTemplate removes template from store", () => {
  createTemplate({
    id: "crud-test-3",
    name: "To Delete",
    subject: "Delete Me",
    category: "system",
    htmlTemplate: "<p>Delete</p>",
    textTemplate: "Delete",
    variables: [],
  });

  assert.ok(getTemplate("crud-test-3"));
  assert.ok(deleteTemplate("crud-test-3"));
  assert.equal(getTemplate("crud-test-3"), undefined);
});

test("listTemplates filters by category", () => {
  createTemplate({
    id: "filter-test-1",
    name: "Nurture A",
    subject: "A",
    category: "nurture",
    htmlTemplate: "<p>A</p>",
    textTemplate: "A",
    variables: [],
    tenantId: "filter-tenant",
  });

  createTemplate({
    id: "filter-test-2",
    name: "System B",
    subject: "B",
    category: "system",
    htmlTemplate: "<p>B</p>",
    textTemplate: "B",
    variables: [],
    tenantId: "filter-tenant",
  });

  const nurture = listTemplates("filter-tenant", "nurture");
  assert.ok(nurture.some((t) => t.id === "filter-test-1"));
  assert.ok(!nurture.some((t) => t.id === "filter-test-2"));
});

// ---------------------------------------------------------------------------
// Suppression list
// ---------------------------------------------------------------------------

test("suppression list blocks sends", async () => {
  const store = _getSuppressionStoreForTesting();
  store.clear();

  await addToSuppressionList("blocked@test.com", "unsubscribe", "test-tenant");

  const suppressed = await isEmailSuppressed("blocked@test.com", "test-tenant");
  assert.ok(suppressed);

  const notSuppressed = await isEmailSuppressed("allowed@test.com", "test-tenant");
  assert.ok(!notSuppressed);
});

test("suppression list is case-insensitive", async () => {
  const store = _getSuppressionStoreForTesting();
  store.clear();

  await addToSuppressionList("Upper@Test.COM", "bounce", "tenant-1");

  const suppressed = await isEmailSuppressed("upper@test.com", "tenant-1");
  assert.ok(suppressed);
});

test("removeFromSuppressionList unsuppresses email", async () => {
  const store = _getSuppressionStoreForTesting();
  store.clear();

  await addToSuppressionList("remove@test.com", "manual", "tenant-2");
  assert.ok(await isEmailSuppressed("remove@test.com", "tenant-2"));

  await removeFromSuppressionList("remove@test.com", "tenant-2");
  assert.ok(!(await isEmailSuppressed("remove@test.com", "tenant-2")));
});

test("getSuppressionList returns entries for tenant", async () => {
  const store = _getSuppressionStoreForTesting();
  store.clear();

  await addToSuppressionList("a@test.com", "bounce", "list-tenant");
  await addToSuppressionList("b@test.com", "complaint", "list-tenant");
  await addToSuppressionList("c@test.com", "unsubscribe", "other-tenant");

  const entries = await getSuppressionList("list-tenant");
  assert.equal(entries.length, 2);
  assert.ok(entries.every((e) => e.tenantId === "list-tenant"));
});
