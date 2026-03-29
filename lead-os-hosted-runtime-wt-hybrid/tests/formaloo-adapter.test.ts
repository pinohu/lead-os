import test from "node:test";
import assert from "node:assert/strict";
import {
  resolveFormalooConfig,
  isFormalooDryRun,
  createForm,
  getForm,
  listForms,
  updateForm,
  submitForm,
  listSubmissions,
  getFormAnalytics,
  generateEmbedCode,
  convertSubmissionToLead,
  createLeadCaptureForm,
  getFormalooStats,
  formalooResult,
  resetFormalooStore,
} from "../src/lib/integrations/formaloo-adapter.ts";
import type {
  FormField,
  FormalooForm,
  FormSubmission,
  FormAnalytics,
  FormalooStats,
} from "../src/lib/integrations/formaloo-adapter.ts";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeFields(count = 2): FormField[] {
  const types: FormField["type"][] = ["text", "email", "phone", "number", "select"];
  return Array.from({ length: count }, (_, i) => ({
    slug: `field_${i}`,
    title: `Field ${i}`,
    type: types[i % types.length]!,
    required: i < 2,
    placeholder: `Enter field ${i}`,
  }));
}

// ---------------------------------------------------------------------------
// Config & Dry-run
// ---------------------------------------------------------------------------

test("resolveFormalooConfig returns null without env var", () => {
  delete process.env.FORMALOO_API_KEY;
  assert.equal(resolveFormalooConfig(), null);
});

test("isFormalooDryRun returns true without env var", () => {
  delete process.env.FORMALOO_API_KEY;
  assert.equal(isFormalooDryRun(), true);
});

test("resolveFormalooConfig returns config with env var", () => {
  process.env.FORMALOO_API_KEY = "test-key";
  const cfg = resolveFormalooConfig();
  assert.ok(cfg);
  assert.equal(cfg.apiKey, "test-key");
  assert.equal(cfg.baseUrl, "https://api.formaloo.com/v2.0");
  delete process.env.FORMALOO_API_KEY;
});

test("resolveFormalooConfig uses custom base URL", () => {
  process.env.FORMALOO_API_KEY = "test-key";
  process.env.FORMALOO_BASE_URL = "https://custom.formaloo.com/v3";
  const cfg = resolveFormalooConfig();
  assert.ok(cfg);
  assert.equal(cfg.baseUrl, "https://custom.formaloo.com/v3");
  delete process.env.FORMALOO_API_KEY;
  delete process.env.FORMALOO_BASE_URL;
});

test("isFormalooDryRun returns false with env var", () => {
  process.env.FORMALOO_API_KEY = "test-key";
  assert.equal(isFormalooDryRun(), false);
  delete process.env.FORMALOO_API_KEY;
});

// ---------------------------------------------------------------------------
// createForm
// ---------------------------------------------------------------------------

test("createForm creates a form with all fields", async () => {
  resetFormalooStore();
  const fields = makeFields(3);
  const form = await createForm({
    title: "Contact Us",
    description: "Main contact form",
    fields,
    tenantId: "t1",
  });

  assert.ok(form.id);
  assert.equal(form.title, "Contact Us");
  assert.equal(form.description, "Main contact form");
  assert.equal(form.fields.length, 3);
  assert.equal(form.slug, "contact-us");
  assert.equal(form.submissions, 0);
  assert.equal(form.status, "active");
  assert.equal(form.tenantId, "t1");
  assert.ok(form.createdAt);
});

test("createForm works without optional fields", async () => {
  resetFormalooStore();
  const form = await createForm({
    title: "Simple Form",
    fields: makeFields(1),
  });

  assert.ok(form.id);
  assert.equal(form.title, "Simple Form");
  assert.equal(form.description, undefined);
  assert.equal(form.tenantId, undefined);
});

test("createForm generates unique IDs", async () => {
  resetFormalooStore();
  const f1 = await createForm({ title: "Form A", fields: makeFields() });
  const f2 = await createForm({ title: "Form B", fields: makeFields() });
  assert.notEqual(f1.id, f2.id);
});

// ---------------------------------------------------------------------------
// getForm
// ---------------------------------------------------------------------------

test("getForm retrieves an existing form", async () => {
  resetFormalooStore();
  const created = await createForm({ title: "Retrieve Me", fields: makeFields() });
  const retrieved = await getForm(created.id);
  assert.ok(retrieved);
  assert.equal(retrieved.id, created.id);
  assert.equal(retrieved.title, "Retrieve Me");
});

test("getForm returns null for non-existent form", async () => {
  resetFormalooStore();
  const result = await getForm("non-existent-id");
  assert.equal(result, null);
});

// ---------------------------------------------------------------------------
// listForms
// ---------------------------------------------------------------------------

test("listForms returns all forms without tenant filter", async () => {
  resetFormalooStore();
  await createForm({ title: "Form A", fields: makeFields(), tenantId: "t1" });
  await createForm({ title: "Form B", fields: makeFields(), tenantId: "t2" });
  await createForm({ title: "Form C", fields: makeFields(), tenantId: "t1" });

  const all = await listForms();
  assert.equal(all.length, 3);
});

test("listForms filters by tenantId", async () => {
  resetFormalooStore();
  await createForm({ title: "Form A", fields: makeFields(), tenantId: "t1" });
  await createForm({ title: "Form B", fields: makeFields(), tenantId: "t2" });
  await createForm({ title: "Form C", fields: makeFields(), tenantId: "t1" });

  const t1Forms = await listForms("t1");
  assert.equal(t1Forms.length, 2);
  assert.ok(t1Forms.every((f) => f.tenantId === "t1"));

  const t2Forms = await listForms("t2");
  assert.equal(t2Forms.length, 1);
  assert.equal(t2Forms[0]!.title, "Form B");
});

test("listForms returns empty array when no forms exist", async () => {
  resetFormalooStore();
  const forms = await listForms();
  assert.equal(forms.length, 0);
});

// ---------------------------------------------------------------------------
// updateForm
// ---------------------------------------------------------------------------

test("updateForm updates title and slug", async () => {
  resetFormalooStore();
  const form = await createForm({ title: "Old Title", fields: makeFields() });
  const updated = await updateForm(form.id, { title: "New Title" });

  assert.equal(updated.title, "New Title");
  assert.equal(updated.slug, "new-title");
  assert.equal(updated.id, form.id);
});

test("updateForm updates status", async () => {
  resetFormalooStore();
  const form = await createForm({ title: "My Form", fields: makeFields() });
  const updated = await updateForm(form.id, { status: "paused" });
  assert.equal(updated.status, "paused");
});

test("updateForm updates description", async () => {
  resetFormalooStore();
  const form = await createForm({ title: "My Form", fields: makeFields() });
  const updated = await updateForm(form.id, { description: "Updated description" });
  assert.equal(updated.description, "Updated description");
});

test("updateForm updates fields", async () => {
  resetFormalooStore();
  const form = await createForm({ title: "My Form", fields: makeFields(2) });
  const newFields = makeFields(4);
  const updated = await updateForm(form.id, { fields: newFields });
  assert.equal(updated.fields.length, 4);
});

test("updateForm throws for non-existent form", async () => {
  resetFormalooStore();
  await assert.rejects(
    () => updateForm("non-existent", { title: "Nope" }),
    { message: "Form non-existent not found" },
  );
});

test("updateForm preserves unchanged fields", async () => {
  resetFormalooStore();
  const form = await createForm({
    title: "Original",
    description: "Keep this",
    fields: makeFields(3),
    tenantId: "t1",
  });
  const updated = await updateForm(form.id, { status: "archived" });

  assert.equal(updated.title, "Original");
  assert.equal(updated.description, "Keep this");
  assert.equal(updated.fields.length, 3);
  assert.equal(updated.tenantId, "t1");
  assert.equal(updated.status, "archived");
});

// ---------------------------------------------------------------------------
// submitForm
// ---------------------------------------------------------------------------

test("submitForm records a submission", async () => {
  resetFormalooStore();
  const form = await createForm({ title: "Survey", fields: makeFields() });
  const sub = await submitForm(form.id, { field_0: "Alice", field_1: "alice@test.com" });

  assert.ok(sub.id);
  assert.equal(sub.formId, form.id);
  assert.equal(sub.data.field_0, "Alice");
  assert.equal(sub.data.field_1, "alice@test.com");
  assert.ok(sub.submittedAt);
});

test("submitForm increments form submission count", async () => {
  resetFormalooStore();
  const form = await createForm({ title: "Counter", fields: makeFields() });
  assert.equal(form.submissions, 0);

  await submitForm(form.id, { field_0: "A" });
  await submitForm(form.id, { field_1: "B" });

  const updated = await getForm(form.id);
  assert.ok(updated);
  assert.equal(updated.submissions, 2);
});

test("submitForm throws for non-existent form", async () => {
  resetFormalooStore();
  await assert.rejects(
    () => submitForm("missing", { name: "test" }),
    { message: "Form missing not found" },
  );
});

test("submitForm throws for paused form", async () => {
  resetFormalooStore();
  const form = await createForm({ title: "Paused", fields: makeFields() });
  await updateForm(form.id, { status: "paused" });

  await assert.rejects(
    () => submitForm(form.id, { field_0: "test" }),
    /not accepting submissions/,
  );
});

test("submitForm throws for archived form", async () => {
  resetFormalooStore();
  const form = await createForm({ title: "Archived", fields: makeFields() });
  await updateForm(form.id, { status: "archived" });

  await assert.rejects(
    () => submitForm(form.id, { field_0: "test" }),
    /not accepting submissions/,
  );
});

test("submitForm inherits tenantId from form", async () => {
  resetFormalooStore();
  const form = await createForm({ title: "Tenant Form", fields: makeFields(), tenantId: "t1" });
  const sub = await submitForm(form.id, { field_0: "test" });
  assert.equal(sub.tenantId, "t1");
});

// ---------------------------------------------------------------------------
// listSubmissions
// ---------------------------------------------------------------------------

test("listSubmissions returns submissions for a form", async () => {
  resetFormalooStore();
  const form = await createForm({ title: "Subs", fields: makeFields() });
  await submitForm(form.id, { field_0: "A" });
  await submitForm(form.id, { field_0: "B" });
  await submitForm(form.id, { field_0: "C" });

  const subs = await listSubmissions(form.id);
  assert.equal(subs.length, 3);
});

test("listSubmissions does not mix forms", async () => {
  resetFormalooStore();
  const f1 = await createForm({ title: "Form 1", fields: makeFields() });
  const f2 = await createForm({ title: "Form 2", fields: makeFields() });

  await submitForm(f1.id, { field_0: "A" });
  await submitForm(f2.id, { field_0: "B" });
  await submitForm(f1.id, { field_0: "C" });

  assert.equal((await listSubmissions(f1.id)).length, 2);
  assert.equal((await listSubmissions(f2.id)).length, 1);
});

test("listSubmissions filters by tenantId", async () => {
  resetFormalooStore();
  const form = await createForm({ title: "Multi-Tenant", fields: makeFields(), tenantId: "t1" });
  await submitForm(form.id, { field_0: "data" });

  const withTenant = await listSubmissions(form.id, "t1");
  const wrongTenant = await listSubmissions(form.id, "t2");

  assert.equal(withTenant.length, 1);
  assert.equal(wrongTenant.length, 0);
});

// ---------------------------------------------------------------------------
// getFormAnalytics
// ---------------------------------------------------------------------------

test("getFormAnalytics returns analytics with submissions", async () => {
  resetFormalooStore();
  const fields = makeFields(3);
  const form = await createForm({ title: "Analytics Form", fields });

  await submitForm(form.id, { field_0: "Alice", field_1: "alice@test.com", field_2: "123" });
  await submitForm(form.id, { field_0: "Bob", field_1: "bob@test.com" });

  const analytics = await getFormAnalytics(form.id);

  assert.equal(analytics.formId, form.id);
  assert.equal(analytics.totalSubmissions, 2);
  assert.ok(analytics.completionRate >= 0 && analytics.completionRate <= 1);
  assert.ok(analytics.avgTimeSeconds > 0);
  assert.equal(analytics.fieldDropoff.length, 3);
  assert.ok(analytics.submissionsByDay.length > 0);
});

test("getFormAnalytics returns zeros for empty form", async () => {
  resetFormalooStore();
  const form = await createForm({ title: "Empty", fields: makeFields() });
  const analytics = await getFormAnalytics(form.id);

  assert.equal(analytics.totalSubmissions, 0);
  assert.equal(analytics.avgTimeSeconds, 0);
  assert.equal(analytics.submissionsByDay.length, 0);
});

test("getFormAnalytics calculates field dropoff", async () => {
  resetFormalooStore();
  const fields: FormField[] = [
    { slug: "name", title: "Name", type: "text", required: true },
    { slug: "email", title: "Email", type: "email", required: true },
    { slug: "notes", title: "Notes", type: "textarea", required: false },
  ];
  const form = await createForm({ title: "Dropoff", fields });

  await submitForm(form.id, { name: "Alice", email: "a@b.com", notes: "hi" });
  await submitForm(form.id, { name: "Bob", email: "b@b.com" });
  await submitForm(form.id, { name: "Carol" });

  const analytics = await getFormAnalytics(form.id);
  const nameDropoff = analytics.fieldDropoff.find((f) => f.field === "name");
  const emailDropoff = analytics.fieldDropoff.find((f) => f.field === "email");
  const notesDropoff = analytics.fieldDropoff.find((f) => f.field === "notes");

  assert.ok(nameDropoff);
  assert.equal(nameDropoff.dropoffRate, 0);
  assert.ok(emailDropoff);
  assert.ok(emailDropoff.dropoffRate > 0);
  assert.ok(notesDropoff);
  assert.ok(notesDropoff.dropoffRate > 0);
});

test("getFormAnalytics throws for non-existent form", async () => {
  resetFormalooStore();
  await assert.rejects(
    () => getFormAnalytics("missing"),
    { message: "Form missing not found" },
  );
});

// ---------------------------------------------------------------------------
// generateEmbedCode
// ---------------------------------------------------------------------------

test("generateEmbedCode returns iframe HTML", async () => {
  resetFormalooStore();
  const form = await createForm({ title: "Embeddable", fields: makeFields() });
  const code = await generateEmbedCode(form.id);

  assert.ok(code.includes("<iframe"));
  assert.ok(code.includes(form.slug));
  assert.ok(code.includes('title="Embeddable"'));
});

test("generateEmbedCode stores code on the form", async () => {
  resetFormalooStore();
  const form = await createForm({ title: "Embed Store", fields: makeFields() });
  await generateEmbedCode(form.id);

  const retrieved = await getForm(form.id);
  assert.ok(retrieved);
  assert.ok(retrieved.embedCode);
  assert.ok(retrieved.embedCode.includes("<iframe"));
});

test("generateEmbedCode throws for non-existent form", async () => {
  resetFormalooStore();
  await assert.rejects(
    () => generateEmbedCode("missing"),
    { message: "Form missing not found" },
  );
});

// ---------------------------------------------------------------------------
// convertSubmissionToLead
// ---------------------------------------------------------------------------

test("convertSubmissionToLead converts a submission", async () => {
  resetFormalooStore();
  const form = await createForm({ title: "Lead Form", fields: makeFields(), tenantId: "t1" });
  const sub = await submitForm(form.id, { field_0: "Alice", field_1: "alice@test.com" });

  const result = await convertSubmissionToLead(sub.id);

  assert.equal(result.ok, true);
  assert.equal(result.provider, "Formaloo");
  assert.ok(result.detail.includes("converted to lead"));
  assert.ok(result.payload);
  assert.equal(result.payload.tenantId, "t1");
  assert.equal(result.payload.formId, form.id);
});

test("convertSubmissionToLead uses override tenantId", async () => {
  resetFormalooStore();
  const form = await createForm({ title: "Lead Form", fields: makeFields(), tenantId: "t1" });
  const sub = await submitForm(form.id, { field_0: "Bob" });

  const result = await convertSubmissionToLead(sub.id, "override-tenant");

  assert.ok(result.ok);
  assert.ok(result.payload);
  assert.equal(result.payload.tenantId, "override-tenant");
});

test("convertSubmissionToLead fails for non-existent submission", async () => {
  resetFormalooStore();
  const result = await convertSubmissionToLead("missing-sub");
  assert.equal(result.ok, false);
  assert.ok(result.detail.includes("not found"));
});

// ---------------------------------------------------------------------------
// createLeadCaptureForm
// ---------------------------------------------------------------------------

test("createLeadCaptureForm generates default form", async () => {
  resetFormalooStore();
  const form = await createLeadCaptureForm("consulting", "t1");

  assert.ok(form.title.includes("Consulting"));
  assert.ok(form.description?.includes("consulting"));
  assert.ok(form.fields.length >= 3);
  assert.ok(form.fields.some((f) => f.type === "email"));
  assert.equal(form.tenantId, "t1");
});

test("createLeadCaptureForm generates real_estate form", async () => {
  resetFormalooStore();
  const form = await createLeadCaptureForm("real_estate");

  assert.ok(form.fields.some((f) => f.slug === "property_type"));
  assert.ok(form.fields.some((f) => f.slug === "budget"));
});

test("createLeadCaptureForm generates saas form", async () => {
  resetFormalooStore();
  const form = await createLeadCaptureForm("saas");

  assert.ok(form.fields.some((f) => f.slug === "company"));
  assert.ok(form.fields.some((f) => f.slug === "team_size"));
});

test("createLeadCaptureForm generates healthcare form", async () => {
  resetFormalooStore();
  const form = await createLeadCaptureForm("healthcare");

  assert.ok(form.fields.some((f) => f.slug === "insurance"));
  assert.ok(form.fields.some((f) => f.slug === "preferred_date"));
});

test("createLeadCaptureForm falls back to default for unknown niche", async () => {
  resetFormalooStore();
  const form = await createLeadCaptureForm("underwater-basket-weaving");

  assert.ok(form.fields.some((f) => f.slug === "full_name"));
  assert.ok(form.fields.some((f) => f.slug === "email"));
  assert.ok(form.fields.some((f) => f.slug === "service"));
});

// ---------------------------------------------------------------------------
// getFormalooStats
// ---------------------------------------------------------------------------

test("getFormalooStats returns aggregate stats", async () => {
  resetFormalooStore();
  const f1 = await createForm({ title: "Stats A", fields: makeFields(), tenantId: "t1" });
  const f2 = await createForm({ title: "Stats B", fields: makeFields(), tenantId: "t1" });

  await submitForm(f1.id, { field_0: "a" });
  await submitForm(f1.id, { field_0: "b" });
  await submitForm(f2.id, { field_0: "c" });

  const stats = await getFormalooStats("t1");

  assert.equal(stats.totalForms, 2);
  assert.equal(stats.totalSubmissions, 3);
  assert.ok(stats.avgCompletionRate >= 0);
  assert.ok(stats.topForms.length <= 5);
  assert.equal(stats.topForms[0]!.submissions, 2);
});

test("getFormalooStats returns zeros for empty store", async () => {
  resetFormalooStore();
  const stats = await getFormalooStats();

  assert.equal(stats.totalForms, 0);
  assert.equal(stats.totalSubmissions, 0);
  assert.equal(stats.avgCompletionRate, 0);
  assert.equal(stats.topForms.length, 0);
});

test("getFormalooStats filters by tenantId", async () => {
  resetFormalooStore();
  await createForm({ title: "T1 Form", fields: makeFields(), tenantId: "t1" });
  await createForm({ title: "T2 Form", fields: makeFields(), tenantId: "t2" });

  const t1Stats = await getFormalooStats("t1");
  const t2Stats = await getFormalooStats("t2");

  assert.equal(t1Stats.totalForms, 1);
  assert.equal(t2Stats.totalForms, 1);
});

// ---------------------------------------------------------------------------
// formalooResult
// ---------------------------------------------------------------------------

test("formalooResult returns dry-run mode without env var", () => {
  delete process.env.FORMALOO_API_KEY;
  const result = formalooResult("test-op", "test detail");

  assert.equal(result.ok, true);
  assert.equal(result.provider, "Formaloo");
  assert.equal(result.mode, "dry-run");
  assert.ok(result.detail.includes("test-op"));
  assert.ok(result.detail.includes("test detail"));
});

test("formalooResult returns live mode with env var", () => {
  process.env.FORMALOO_API_KEY = "test-key";
  const result = formalooResult("test-op", "test detail");
  assert.equal(result.mode, "live");
  delete process.env.FORMALOO_API_KEY;
});

test("formalooResult supports ok=false", () => {
  const result = formalooResult("fail-op", "something failed", false);
  assert.equal(result.ok, false);
});

test("formalooResult includes payload when provided", () => {
  const result = formalooResult("op", "detail", true, { key: "value" });
  assert.ok(result.payload);
  assert.equal(result.payload.key, "value");
});

// ---------------------------------------------------------------------------
// resetFormalooStore
// ---------------------------------------------------------------------------

test("resetFormalooStore clears all data", async () => {
  resetFormalooStore();
  const form = await createForm({ title: "To Delete", fields: makeFields() });
  await submitForm(form.id, { field_0: "data" });

  resetFormalooStore();

  const forms = await listForms();
  assert.equal(forms.length, 0);
  assert.equal(await getForm(form.id), null);
});
