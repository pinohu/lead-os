import test from "node:test";
import assert from "node:assert/strict";
import {
  createProject,
  getProject,
  updateProject,
  listProjects,
  deleteProject,
  exportToHtml,
  exportToDeployable,
  getTemplates,
  createFromTemplate,
  LEAD_OS_TEMPLATES,
  resetBuilderStore,
} from "../src/lib/integrations/visual-builder.ts";

// ---------------------------------------------------------------------------
// Reset store between tests
// ---------------------------------------------------------------------------

function setup() {
  resetBuilderStore();
}

// ---------------------------------------------------------------------------
// LEAD_OS_TEMPLATES
// ---------------------------------------------------------------------------

test("LEAD_OS_TEMPLATES contains all required templates", () => {
  const ids = LEAD_OS_TEMPLATES.map((t) => t.id);
  assert.ok(ids.includes("landing-page"));
  assert.ok(ids.includes("lead-capture"));
  assert.ok(ids.includes("booking-page"));
  assert.ok(ids.includes("pricing-page"));
  assert.ok(ids.includes("testimonial-wall"));
  assert.ok(ids.includes("comparison-table"));
});

// ---------------------------------------------------------------------------
// createProject
// ---------------------------------------------------------------------------

test("createProject returns a project with generated id", async () => {
  setup();
  const project = await createProject("tenant-1", "My Page");
  assert.ok(project.id.startsWith("proj_"));
  assert.equal(project.tenantId, "tenant-1");
  assert.equal(project.name, "My Page");
  assert.ok(typeof project.html === "string");
  assert.ok(project.html.includes("<!DOCTYPE html>"));
  assert.ok(typeof project.createdAt === "string");
  assert.ok(typeof project.updatedAt === "string");
});

test("createProject uses provided initialHtml when given", async () => {
  setup();
  const html = "<html><body><h1>Custom</h1></body></html>";
  const project = await createProject("tenant-1", "Custom", html);
  assert.equal(project.html, html);
});

// ---------------------------------------------------------------------------
// getProject
// ---------------------------------------------------------------------------

test("getProject returns a previously created project", async () => {
  setup();
  const project = await createProject("tenant-1", "Test");
  const fetched = await getProject(project.id);
  assert.ok(fetched);
  assert.equal(fetched.id, project.id);
});

test("getProject returns undefined for unknown project", async () => {
  setup();
  const project = await getProject("proj_nonexistent");
  assert.equal(project, undefined);
});

// ---------------------------------------------------------------------------
// updateProject
// ---------------------------------------------------------------------------

test("updateProject updates html and css fields", async () => {
  setup();
  const project = await createProject("tenant-1", "Edit Me");
  const updated = await updateProject(project.id, {
    html: "<html><body><h1>Updated</h1></body></html>",
    css: "h1 { color: red; }",
  });
  assert.equal(updated.html, "<html><body><h1>Updated</h1></body></html>");
  assert.equal(updated.css, "h1 { color: red; }");
});

test("updateProject updates the updatedAt timestamp", async () => {
  setup();
  const project = await createProject("tenant-1", "Timestamp Test");
  const beforeUpdate = project.updatedAt;

  await new Promise((res) => setTimeout(res, 5));
  const updated = await updateProject(project.id, { css: "body { margin: 0; }" });
  assert.notEqual(updated.updatedAt, beforeUpdate);
});

test("updateProject throws for unknown project", async () => {
  setup();
  await assert.rejects(
    () => updateProject("proj_nonexistent", { css: "" }),
    /Project not found/,
  );
});

// ---------------------------------------------------------------------------
// listProjects
// ---------------------------------------------------------------------------

test("listProjects returns only projects for the given tenantId", async () => {
  setup();
  await createProject("tenant-A", "Page 1");
  await createProject("tenant-A", "Page 2");
  await createProject("tenant-B", "Other Page");

  const tenantAProjects = await listProjects("tenant-A");
  assert.equal(tenantAProjects.length, 2);
  for (const p of tenantAProjects) {
    assert.equal(p.tenantId, "tenant-A");
  }
});

// ---------------------------------------------------------------------------
// deleteProject
// ---------------------------------------------------------------------------

test("deleteProject removes the project and returns true", async () => {
  setup();
  const project = await createProject("tenant-1", "Delete Me");
  const result = await deleteProject(project.id);
  assert.equal(result, true);

  const fetched = await getProject(project.id);
  assert.equal(fetched, undefined);
});

test("deleteProject returns false for unknown project", async () => {
  setup();
  const result = await deleteProject("proj_nonexistent");
  assert.equal(result, false);
});

// ---------------------------------------------------------------------------
// exportToHtml
// ---------------------------------------------------------------------------

test("exportToHtml returns the project html with css injected", async () => {
  setup();
  const project = await createProject("tenant-1", "Export Test");
  await updateProject(project.id, {
    html: "<!DOCTYPE html><html><head></head><body></body></html>",
    css: "body { background: #fff; }",
  });

  const html = await exportToHtml(project.id);
  assert.ok(html.includes("body { background: #fff; }"));
  assert.ok(html.includes("<style>"));
});

test("exportToHtml throws for unknown project", async () => {
  setup();
  await assert.rejects(
    () => exportToHtml("proj_nonexistent"),
    /Project not found/,
  );
});

// ---------------------------------------------------------------------------
// exportToDeployable
// ---------------------------------------------------------------------------

test("exportToDeployable returns html, css, and assets array", async () => {
  setup();
  const project = await createProject("tenant-1", "Deploy Test");
  const deployable = await exportToDeployable(project.id);

  assert.ok(typeof deployable.html === "string");
  assert.ok(typeof deployable.css === "string");
  assert.ok(Array.isArray(deployable.assets));
});

// ---------------------------------------------------------------------------
// getTemplates
// ---------------------------------------------------------------------------

test("getTemplates returns all lead OS templates with thumbnail URLs", () => {
  const templates = getTemplates();
  assert.equal(templates.length, LEAD_OS_TEMPLATES.length);
  for (const t of templates) {
    assert.ok(typeof t.id === "string");
    assert.ok(typeof t.thumbnail === "string");
    assert.ok(typeof t.category === "string");
  }
});

// ---------------------------------------------------------------------------
// createFromTemplate
// ---------------------------------------------------------------------------

test("createFromTemplate creates a project using a valid template", async () => {
  setup();
  const project = await createFromTemplate("tenant-1", "landing-page", "New Landing Page");
  assert.equal(project.tenantId, "tenant-1");
  assert.equal(project.name, "New Landing Page");
  assert.ok(project.html.includes("<!DOCTYPE html>"));
});

test("createFromTemplate throws for unknown template", async () => {
  setup();
  await assert.rejects(
    () => createFromTemplate("tenant-1", "nonexistent-template", "Test"),
    /Template not found/,
  );
});

// ---------------------------------------------------------------------------
// resetBuilderStore
// ---------------------------------------------------------------------------

test("resetBuilderStore clears all projects", async () => {
  await createProject("tenant-1", "Persistent Page");
  resetBuilderStore();
  const projects = await listProjects("tenant-1");
  assert.equal(projects.length, 0);
});
