import test from "node:test";
import assert from "node:assert/strict";
import {
  registerTemplate,
  getTemplate,
  listTemplates,
  generateDocument,
  generateProposal,
  generateInvoice,
  LEAD_OS_DOC_TEMPLATES,
  resetDocStore,
} from "../src/lib/integrations/doc-generator.ts";

// ---------------------------------------------------------------------------
// Reset store between tests
// ---------------------------------------------------------------------------

function setup() {
  resetDocStore();
}

// ---------------------------------------------------------------------------
// LEAD_OS_DOC_TEMPLATES
// ---------------------------------------------------------------------------

test("LEAD_OS_DOC_TEMPLATES contains all required template definitions", () => {
  const types = LEAD_OS_DOC_TEMPLATES.map((t) => t.type);
  assert.ok(types.includes("proposal"));
  assert.ok(types.includes("report"));
  assert.ok(types.includes("contract"));
  assert.ok(types.includes("case-study"));
});

test("LEAD_OS_DOC_TEMPLATES entries have variables arrays", () => {
  for (const tmpl of LEAD_OS_DOC_TEMPLATES) {
    assert.ok(Array.isArray(tmpl.variables));
    assert.ok(tmpl.variables.length > 0, `${tmpl.name} should have variables`);
    assert.ok(tmpl.template.length > 0, `${tmpl.name} should have template content`);
  }
});

// ---------------------------------------------------------------------------
// registerTemplate
// ---------------------------------------------------------------------------

test("registerTemplate returns a template with an assigned id", () => {
  setup();
  const registered = registerTemplate({
    name: "Custom Template",
    type: "proposal",
    format: "pdf",
    template: "<p>Hello {name}</p>",
    variables: ["name"],
  });

  assert.ok(typeof registered.id === "string");
  assert.ok(registered.id.startsWith("tpl_"));
  assert.equal(registered.name, "Custom Template");
});

// ---------------------------------------------------------------------------
// getTemplate
// ---------------------------------------------------------------------------

test("getTemplate returns a seeded pre-built template", () => {
  setup();
  const templates = listTemplates();
  const first = templates[0];
  const fetched = getTemplate(first.id);
  assert.ok(fetched);
  assert.equal(fetched.id, first.id);
});

test("getTemplate returns undefined for unknown id", () => {
  setup();
  const tmpl = getTemplate("tpl_nonexistent");
  assert.equal(tmpl, undefined);
});

// ---------------------------------------------------------------------------
// listTemplates
// ---------------------------------------------------------------------------

test("listTemplates returns all seeded templates when no type filter", () => {
  setup();
  const templates = listTemplates();
  assert.ok(templates.length >= LEAD_OS_DOC_TEMPLATES.length);
});

test("listTemplates filters by type when provided", () => {
  setup();
  const proposals = listTemplates("proposal");
  assert.ok(proposals.length >= 1);
  for (const t of proposals) {
    assert.equal(t.type, "proposal");
  }
});

// ---------------------------------------------------------------------------
// generateDocument
// ---------------------------------------------------------------------------

test("generateDocument renders template variables with provided data", async () => {
  setup();
  const tmpl = registerTemplate({
    name: "Simple",
    type: "report",
    format: "pdf",
    template: "<p>Hello {name}, your score is {score}.</p>",
    variables: ["name", "score"],
  });

  const doc = await generateDocument("tenant-1", tmpl.id, {
    name: "Alice",
    score: "95",
  });

  assert.ok(doc.content.includes("Alice"));
  assert.ok(doc.content.includes("95"));
  assert.equal(doc.tenantId, "tenant-1");
  assert.equal(doc.templateId, tmpl.id);
  assert.ok(typeof doc.createdAt === "string");
});

test("generateDocument throws for unknown template id", async () => {
  setup();
  await assert.rejects(
    () => generateDocument("tenant-1", "tpl_nonexistent", {}),
    /Template not found/,
  );
});

// ---------------------------------------------------------------------------
// generateProposal
// ---------------------------------------------------------------------------

test("generateProposal generates a document with lead data substituted", async () => {
  setup();
  const doc = await generateProposal("tenant-1", {
    name: "John Doe",
    company: "Acme Corp",
    niche: "SaaS",
    service: "Lead generation",
    price: 2997,
    guarantee: "60-day results guarantee",
  });

  assert.ok(doc.content.includes("John Doe"));
  assert.ok(doc.content.includes("SaaS"));
  assert.ok(doc.content.includes("2997"));
  assert.equal(doc.tenantId, "tenant-1");
});

test("generateProposal uses default guarantee text when not provided", async () => {
  setup();
  const doc = await generateProposal("tenant-1", {
    name: "Jane Smith",
    niche: "E-commerce",
    service: "SEO",
    price: 1497,
  });

  assert.ok(doc.content.includes("guarantee"));
});

// ---------------------------------------------------------------------------
// generateInvoice
// ---------------------------------------------------------------------------

test("generateInvoice generates a document with items and total", async () => {
  setup();
  const doc = await generateInvoice("tenant-1", {
    clientName: "Bob Corp",
    items: [
      { description: "SEO Package", amount: 500 },
      { description: "Ad Management", amount: 300 },
    ],
    dueDate: "2026-05-01",
  });

  assert.ok(doc.content.includes("Bob Corp"));
  assert.ok(doc.content.includes("800.00"));
  assert.equal(doc.tenantId, "tenant-1");
});

test("generateInvoice calculates total from all line items", async () => {
  setup();
  const doc = await generateInvoice("tenant-1", {
    clientName: "Client X",
    items: [
      { description: "Item 1", amount: 100 },
      { description: "Item 2", amount: 150 },
      { description: "Item 3", amount: 250 },
    ],
    dueDate: "2026-06-01",
  });

  assert.ok(doc.content.includes("500.00"));
});

// ---------------------------------------------------------------------------
// resetDocStore
// ---------------------------------------------------------------------------

test("resetDocStore clears all templates and docs, then re-seeds on next access", async () => {
  registerTemplate({
    name: "Custom Extra",
    type: "report",
    format: "pdf",
    template: "<p>{x}</p>",
    variables: ["x"],
  });

  // Before reset: pre-built + custom
  const beforeCount = listTemplates().length;
  assert.ok(beforeCount > LEAD_OS_DOC_TEMPLATES.length);

  resetDocStore();

  // After reset: lazy re-seed returns only pre-built templates
  const afterTemplates = listTemplates();
  assert.equal(afterTemplates.length, LEAD_OS_DOC_TEMPLATES.length);
});

test("after resetDocStore pre-built templates are re-seeded on next call", () => {
  resetDocStore();
  const templates = listTemplates();
  assert.ok(templates.length >= LEAD_OS_DOC_TEMPLATES.length);
});
