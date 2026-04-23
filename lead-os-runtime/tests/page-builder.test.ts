import test from "node:test";
import assert from "node:assert/strict";
import {
  createPage,
  createForm,
  deletePage,
  deleteForm,
  getForm,
  getPage,
  getPageBySlug,
  listForms,
  listPages,
  publishPage,
  renderBlock,
  renderFormToHtml,
  renderPageToHtml,
  updateForm,
  updatePage,
  _getPageStoreForTesting,
  _getFormStoreForTesting,
  type LandingPage,
  type PageBlock,
  type FormDefinition,
} from "../src/lib/page-builder.ts";

// ---------------------------------------------------------------------------
// Page CRUD
// ---------------------------------------------------------------------------

test("createPage stores a page and generates id and timestamps", () => {
  const store = _getPageStoreForTesting();
  store.clear();

  const page = createPage({
    tenantId: "t1",
    slug: "hello-world",
    title: "Hello World",
    description: "A test page",
    blocks: [],
    seo: { title: "Hello", description: "Test" },
    styles: { primaryColor: "#14b8a6", backgroundColor: "#fff", fontFamily: "Inter" },
    status: "draft",
  });

  assert.ok(page.id.length > 0);
  assert.equal(page.slug, "hello-world");
  assert.equal(page.status, "draft");
  assert.ok(page.createdAt.length > 0);

  const retrieved = getPage(page.id);
  assert.ok(retrieved);
  assert.equal(retrieved.title, "Hello World");
});

test("createPage enforces slug uniqueness per tenant", () => {
  const store = _getPageStoreForTesting();
  store.clear();

  createPage({
    tenantId: "t2",
    slug: "unique-slug",
    title: "First",
    description: "",
    blocks: [],
    seo: { title: "", description: "" },
    styles: { primaryColor: "#000", backgroundColor: "#fff", fontFamily: "Inter" },
    status: "draft",
  });

  assert.throws(() => {
    createPage({
      tenantId: "t2",
      slug: "unique-slug",
      title: "Duplicate",
      description: "",
      blocks: [],
      seo: { title: "", description: "" },
      styles: { primaryColor: "#000", backgroundColor: "#fff", fontFamily: "Inter" },
      status: "draft",
    });
  }, /already exists/);
});

test("slug uniqueness is scoped to tenant", () => {
  const store = _getPageStoreForTesting();
  store.clear();

  createPage({
    tenantId: "t3",
    slug: "shared-slug",
    title: "T3 Page",
    description: "",
    blocks: [],
    seo: { title: "", description: "" },
    styles: { primaryColor: "#000", backgroundColor: "#fff", fontFamily: "Inter" },
    status: "draft",
  });

  const page2 = createPage({
    tenantId: "t4",
    slug: "shared-slug",
    title: "T4 Page",
    description: "",
    blocks: [],
    seo: { title: "", description: "" },
    styles: { primaryColor: "#000", backgroundColor: "#fff", fontFamily: "Inter" },
    status: "draft",
  });

  assert.ok(page2.id.length > 0);
});

test("getPageBySlug retrieves page by tenant and slug", () => {
  const store = _getPageStoreForTesting();
  store.clear();

  createPage({
    tenantId: "t5",
    slug: "by-slug",
    title: "Slug Test",
    description: "",
    blocks: [],
    seo: { title: "", description: "" },
    styles: { primaryColor: "#000", backgroundColor: "#fff", fontFamily: "Inter" },
    status: "draft",
  });

  const page = getPageBySlug("t5", "by-slug");
  assert.ok(page);
  assert.equal(page.title, "Slug Test");

  const missing = getPageBySlug("t5", "nonexistent");
  assert.equal(missing, undefined);
});

test("updatePage modifies fields and updates timestamp", () => {
  const store = _getPageStoreForTesting();
  store.clear();

  const page = createPage({
    tenantId: "t6",
    slug: "update-test",
    title: "Original Title",
    description: "",
    blocks: [],
    seo: { title: "", description: "" },
    styles: { primaryColor: "#000", backgroundColor: "#fff", fontFamily: "Inter" },
    status: "draft",
  });

  const updated = updatePage(page.id, { title: "New Title" });
  assert.ok(updated);
  assert.equal(updated.title, "New Title");
  assert.equal(updated.slug, "update-test");
});

test("deletePage removes page from store", () => {
  const store = _getPageStoreForTesting();
  store.clear();

  const page = createPage({
    tenantId: "t7",
    slug: "delete-test",
    title: "Delete Me",
    description: "",
    blocks: [],
    seo: { title: "", description: "" },
    styles: { primaryColor: "#000", backgroundColor: "#fff", fontFamily: "Inter" },
    status: "draft",
  });

  assert.ok(deletePage(page.id));
  assert.equal(getPage(page.id), undefined);
});

test("listPages filters by tenant and status", () => {
  const store = _getPageStoreForTesting();
  store.clear();

  createPage({
    tenantId: "t8",
    slug: "page-a",
    title: "A",
    description: "",
    blocks: [],
    seo: { title: "", description: "" },
    styles: { primaryColor: "#000", backgroundColor: "#fff", fontFamily: "Inter" },
    status: "draft",
  });

  const published = createPage({
    tenantId: "t8",
    slug: "page-b",
    title: "B",
    description: "",
    blocks: [],
    seo: { title: "", description: "" },
    styles: { primaryColor: "#000", backgroundColor: "#fff", fontFamily: "Inter" },
    status: "draft",
  });
  publishPage(published.id);

  const all = listPages("t8");
  assert.equal(all.length, 2);

  const publishedOnly = listPages("t8", "published");
  assert.equal(publishedOnly.length, 1);
  assert.equal(publishedOnly[0].title, "B");
});

test("publishPage sets status and publishedAt", () => {
  const store = _getPageStoreForTesting();
  store.clear();

  const page = createPage({
    tenantId: "t9",
    slug: "pub-test",
    title: "Publish Test",
    description: "",
    blocks: [],
    seo: { title: "", description: "" },
    styles: { primaryColor: "#000", backgroundColor: "#fff", fontFamily: "Inter" },
    status: "draft",
  });

  const published = publishPage(page.id);
  assert.ok(published);
  assert.equal(published.status, "published");
  assert.ok(published.publishedAt);
});

// ---------------------------------------------------------------------------
// renderPageToHtml
// ---------------------------------------------------------------------------

test("renderPageToHtml produces valid HTML with all block types", () => {
  const store = _getPageStoreForTesting();
  store.clear();

  const blocks: PageBlock[] = [
    { id: "b1", type: "hero", props: { headline: "Welcome", subheadline: "Sub", ctaText: "Go", ctaUrl: "/go" }, order: 0 },
    { id: "b2", type: "text", props: { content: "<p>Hello world</p>" }, order: 1 },
    { id: "b3", type: "image", props: { src: "https://img.com/pic.jpg", alt: "A picture", caption: "My pic" }, order: 2 },
    { id: "b4", type: "cta", props: { text: "Click Me", url: "/click", description: "Do it now" }, order: 3 },
    { id: "b5", type: "testimonial", props: { quote: "Great product!", name: "Jane", role: "CEO", avatar: "https://img.com/jane.jpg" }, order: 4 },
    { id: "b6", type: "faq", props: { title: "FAQ", items: [{ question: "Q1?", answer: "A1" }] }, order: 5 },
    { id: "b7", type: "stats", props: { items: [{ value: "100+", label: "Clients" }] }, order: 6 },
    { id: "b8", type: "features", props: { title: "Features", items: [{ title: "Fast", description: "Very fast" }] }, order: 7 },
    { id: "b9", type: "video", props: { src: "https://youtube.com/embed/abc", title: "Demo" }, order: 8 },
    { id: "b10", type: "divider", props: {}, order: 9 },
    { id: "b11", type: "columns", props: { columns: [{ content: "Col 1" }, { content: "Col 2" }] }, order: 10 },
    { id: "b12", type: "countdown", props: { targetDate: "2027-01-01", headline: "Hurry!" }, order: 11 },
    { id: "b13", type: "social-proof", props: { title: "Trusted by", logos: [{ src: "https://img.com/logo.png", alt: "Logo" }] }, order: 12 },
    { id: "b14", type: "pricing", props: { title: "Pricing", plans: [{ name: "Pro", price: "$99", features: ["Feature 1"], ctaText: "Buy", ctaUrl: "/buy", highlighted: true }] }, order: 13 },
  ];

  const page = createPage({
    tenantId: "render-test",
    slug: "render",
    title: "Render Test",
    description: "Test rendering",
    blocks,
    seo: { title: "Render Test", description: "Test rendering", ogImage: "https://img.com/og.jpg" },
    styles: { primaryColor: "#14b8a6", backgroundColor: "#ffffff", fontFamily: "Inter" },
    status: "draft",
  });

  const html = renderPageToHtml(page);

  assert.ok(html.includes("<!DOCTYPE html>"));
  assert.ok(html.includes("</html>"));
  assert.ok(html.includes("Welcome"));
  assert.ok(html.includes("Hello world"));
  assert.ok(html.includes("pic.jpg"));
  assert.ok(html.includes("Click Me"));
  assert.ok(html.includes("Great product!"));
  assert.ok(html.includes("Q1?"));
  assert.ok(html.includes("100+"));
  assert.ok(html.includes("Fast"));
  assert.ok(html.includes("youtube.com/embed/abc"));
  assert.ok(html.includes("<hr"));
  assert.ok(html.includes("Col 1"));
  assert.ok(html.includes("Hurry!"));
  assert.ok(html.includes("Trusted by"));
  assert.ok(html.includes("Most Popular"));
  assert.ok(html.includes("og:image"));
  assert.ok(html.includes("prefers-reduced-motion"));
});

test("renderBlock produces correct HTML for hero block", () => {
  const styles = { primaryColor: "#14b8a6", backgroundColor: "#fff", fontFamily: "Inter" };
  const block: PageBlock = {
    id: "h1",
    type: "hero",
    props: { headline: "Big Headline", subheadline: "Subtext", ctaText: "Start", ctaUrl: "/start" },
    order: 0,
  };

  const html = renderBlock(block, styles);
  assert.ok(html.includes("Big Headline"));
  assert.ok(html.includes("Subtext"));
  assert.ok(html.includes("/start"));
  assert.ok(html.includes("Start"));
  assert.ok(html.includes("<h1"));
});

// ---------------------------------------------------------------------------
// Form rendering
// ---------------------------------------------------------------------------

test("renderFormToHtml includes all field types", () => {
  const formStore = _getFormStoreForTesting();
  formStore.clear();

  const form: FormDefinition = {
    id: "form-1",
    tenantId: "t10",
    name: "Contact Form",
    fields: [
      { id: "f1", name: "first_name", label: "First Name", type: "text", required: true, placeholder: "John", order: 0 },
      { id: "f2", name: "email", label: "Email", type: "email", required: true, placeholder: "john@example.com", order: 1 },
      { id: "f3", name: "phone", label: "Phone", type: "phone", required: false, order: 2 },
      { id: "f4", name: "service", label: "Service", type: "select", required: true, options: [{ label: "Option A", value: "a" }, { label: "Option B", value: "b" }], order: 3 },
      { id: "f5", name: "message", label: "Message", type: "textarea", required: false, placeholder: "Tell us more", order: 4 },
      { id: "f6", name: "agree", label: "I agree to terms", type: "checkbox", required: true, order: 5 },
      { id: "f7", name: "priority", label: "Priority", type: "radio", required: false, options: [{ label: "Low", value: "low" }, { label: "High", value: "high" }], order: 6 },
      { id: "f8", name: "count", label: "Count", type: "number", required: false, validation: { min: 1, max: 100 }, order: 7 },
      { id: "f9", name: "date", label: "Date", type: "date", required: false, order: 8 },
      { id: "f10", name: "source", label: "Source", type: "hidden", placeholder: "website", required: false, order: 9 },
    ],
    submitAction: "intake",
    successMessage: "Thanks!",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const html = renderFormToHtml(form, "/api/intake");

  assert.ok(html.includes('action="/api/intake"'));
  assert.ok(html.includes('name="first_name"'));
  assert.ok(html.includes('type="email"'));
  assert.ok(html.includes('type="phone"'));
  assert.ok(html.includes("<select"));
  assert.ok(html.includes("Option A"));
  assert.ok(html.includes("<textarea"));
  assert.ok(html.includes('type="checkbox"'));
  assert.ok(html.includes('type="radio"'));
  assert.ok(html.includes('type="number"'));
  assert.ok(html.includes('min="1"'));
  assert.ok(html.includes('max="100"'));
  assert.ok(html.includes('type="date"'));
  assert.ok(html.includes('type="hidden"'));
  assert.ok(html.includes("Contact Form"));
  assert.ok(html.includes("required"));
  assert.ok(html.includes("Submit"));
});

test("renderFormToHtml includes conditional field attributes", () => {
  const form: FormDefinition = {
    id: "form-cond",
    tenantId: "t11",
    name: "Conditional Form",
    fields: [
      { id: "f1", name: "type", label: "Type", type: "select", required: true, options: [{ label: "A", value: "a" }, { label: "B", value: "b" }], order: 0 },
      { id: "f2", name: "detail", label: "Detail", type: "text", required: false, conditionalOn: { field: "type", value: "b" }, order: 1 },
    ],
    submitAction: "subscribe",
    successMessage: "Subscribed!",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const html = renderFormToHtml(form, "/subscribe");

  assert.ok(html.includes('data-conditional-field="type"'));
  assert.ok(html.includes('data-conditional-value="b"'));
  assert.ok(html.includes('display:none'));
});

// ---------------------------------------------------------------------------
// Form CRUD
// ---------------------------------------------------------------------------

test("createForm stores and retrieves a form", () => {
  const formStore = _getFormStoreForTesting();
  formStore.clear();

  const form = createForm({
    tenantId: "fc1",
    name: "Test Form",
    fields: [{ id: "f1", name: "name", label: "Name", type: "text", required: true, order: 0 }],
    submitAction: "intake",
    successMessage: "Done",
  });

  assert.ok(form.id.length > 0);

  const retrieved = getForm(form.id);
  assert.ok(retrieved);
  assert.equal(retrieved.name, "Test Form");
});

test("updateForm modifies form fields", () => {
  const formStore = _getFormStoreForTesting();
  formStore.clear();

  const form = createForm({
    tenantId: "fc2",
    name: "Original Form",
    fields: [],
    submitAction: "subscribe",
    successMessage: "Thanks",
  });

  const updated = updateForm(form.id, { name: "Updated Form" });
  assert.ok(updated);
  assert.equal(updated.name, "Updated Form");
});

test("deleteForm removes form", () => {
  const formStore = _getFormStoreForTesting();
  formStore.clear();

  const form = createForm({
    tenantId: "fc3",
    name: "Delete Form",
    fields: [],
    submitAction: "intake",
    successMessage: "OK",
  });

  assert.ok(deleteForm(form.id));
  assert.equal(getForm(form.id), undefined);
});

test("listForms filters by tenant", () => {
  const formStore = _getFormStoreForTesting();
  formStore.clear();

  createForm({ tenantId: "fc4", name: "Form A", fields: [], submitAction: "intake", successMessage: "OK" });
  createForm({ tenantId: "fc4", name: "Form B", fields: [], submitAction: "subscribe", successMessage: "OK" });
  createForm({ tenantId: "fc5", name: "Form C", fields: [], submitAction: "intake", successMessage: "OK" });

  const forms = listForms("fc4");
  assert.equal(forms.length, 2);
  assert.ok(forms.every((f) => f.tenantId === "fc4"));
});
