import test from "node:test";
import assert from "node:assert/strict";
import {
  resolveFlowluConfig,
  isFlowluDryRun,
  createContact,
  getContact,
  getContactByEmail,
  listContacts,
  createPipeline,
  listPipelines,
  createDeal,
  moveDealToStage,
  updateDealStatus,
  listDeals,
  createTask,
  listTasks,
  syncLeadToFlowlu,
  getFlowluStats,
  flowluResult,
  resetFlowluStore,
} from "../src/lib/integrations/flowlu-adapter.ts";

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

test("resolveFlowluConfig returns null when no API key is set", () => {
  delete process.env.FLOWLU_API_KEY;
  delete process.env.FLOWLU_DOMAIN;
  const config = resolveFlowluConfig();
  assert.equal(config, null);
});

test("resolveFlowluConfig returns null when no domain is set", () => {
  process.env.FLOWLU_API_KEY = "test-key";
  delete process.env.FLOWLU_DOMAIN;
  const config = resolveFlowluConfig();
  assert.equal(config, null);
  delete process.env.FLOWLU_API_KEY;
});

test("resolveFlowluConfig returns config when API key and domain are set", () => {
  process.env.FLOWLU_API_KEY = "test-key-123";
  process.env.FLOWLU_DOMAIN = "mycompany";
  const config = resolveFlowluConfig();
  assert.ok(config);
  assert.equal(config.apiKey, "test-key-123");
  assert.equal(config.domain, "mycompany");
  assert.equal(config.baseUrl, "https://mycompany.flowlu.com/api/v1");
  delete process.env.FLOWLU_API_KEY;
  delete process.env.FLOWLU_DOMAIN;
});

test("resolveFlowluConfig uses custom base URL when set", () => {
  process.env.FLOWLU_API_KEY = "test-key";
  process.env.FLOWLU_DOMAIN = "myco";
  process.env.FLOWLU_BASE_URL = "https://custom.api.com/v2";
  const config = resolveFlowluConfig();
  assert.ok(config);
  assert.equal(config.baseUrl, "https://custom.api.com/v2");
  delete process.env.FLOWLU_API_KEY;
  delete process.env.FLOWLU_DOMAIN;
  delete process.env.FLOWLU_BASE_URL;
});

// ---------------------------------------------------------------------------
// Dry-run
// ---------------------------------------------------------------------------

test("isFlowluDryRun returns true when no API key", () => {
  delete process.env.FLOWLU_API_KEY;
  assert.equal(isFlowluDryRun(), true);
});

test("isFlowluDryRun returns false when API key is set", () => {
  process.env.FLOWLU_API_KEY = "key";
  assert.equal(isFlowluDryRun(), false);
  delete process.env.FLOWLU_API_KEY;
});

// ---------------------------------------------------------------------------
// Contact CRUD
// ---------------------------------------------------------------------------

test("createContact creates a contact with all fields", async () => {
  resetFlowluStore();
  const contact = await createContact({
    firstName: "Alice",
    lastName: "Smith",
    email: "alice@example.com",
    phone: "+1234567890",
    company: "Acme Inc",
    position: "CTO",
    source: "website",
    tags: ["vip", "enterprise"],
    customFields: { industry: "tech" },
    tenantId: "t1",
  });

  assert.ok(contact.id.startsWith("fl_contact_"));
  assert.equal(contact.firstName, "Alice");
  assert.equal(contact.lastName, "Smith");
  assert.equal(contact.email, "alice@example.com");
  assert.equal(contact.phone, "+1234567890");
  assert.equal(contact.company, "Acme Inc");
  assert.equal(contact.position, "CTO");
  assert.equal(contact.source, "website");
  assert.deepEqual(contact.tags, ["vip", "enterprise"]);
  assert.deepEqual(contact.customFields, { industry: "tech" });
  assert.equal(contact.tenantId, "t1");
  assert.ok(contact.createdAt);
});

test("createContact uses defaults for optional fields", async () => {
  resetFlowluStore();
  const contact = await createContact({
    firstName: "Bob",
    lastName: "Jones",
    email: "bob@example.com",
  });

  assert.equal(contact.source, "api");
  assert.deepEqual(contact.tags, []);
  assert.deepEqual(contact.customFields, {});
  assert.equal(contact.phone, undefined);
  assert.equal(contact.company, undefined);
});

test("getContact retrieves a created contact", async () => {
  resetFlowluStore();
  const created = await createContact({
    firstName: "Get",
    lastName: "Test",
    email: "get@test.com",
  });
  const retrieved = await getContact(created.id);

  assert.ok(retrieved);
  assert.equal(retrieved.id, created.id);
  assert.equal(retrieved.email, "get@test.com");
});

test("getContact returns null for non-existent contact", async () => {
  resetFlowluStore();
  const result = await getContact("nonexistent-id");
  assert.equal(result, null);
});

test("getContactByEmail finds a contact by email", async () => {
  resetFlowluStore();
  await createContact({ firstName: "Find", lastName: "Me", email: "findme@example.com" });
  const contact = await getContactByEmail("findme@example.com");

  assert.ok(contact);
  assert.equal(contact.email, "findme@example.com");
});

test("getContactByEmail returns null when no match", async () => {
  resetFlowluStore();
  const result = await getContactByEmail("nothere@example.com");
  assert.equal(result, null);
});

test("listContacts returns all contacts when no filter", async () => {
  resetFlowluStore();
  await createContact({ firstName: "A", lastName: "A", email: "a@test.com" });
  await createContact({ firstName: "B", lastName: "B", email: "b@test.com" });

  const contacts = await listContacts();
  assert.equal(contacts.length, 2);
});

test("listContacts filters by tenantId", async () => {
  resetFlowluStore();
  await createContact({ firstName: "A", lastName: "A", email: "a@test.com", tenantId: "t1" });
  await createContact({ firstName: "B", lastName: "B", email: "b@test.com", tenantId: "t2" });
  await createContact({ firstName: "C", lastName: "C", email: "c@test.com", tenantId: "t1" });

  const contacts = await listContacts("t1");
  assert.equal(contacts.length, 2);
});

// ---------------------------------------------------------------------------
// Pipeline CRUD
// ---------------------------------------------------------------------------

test("createPipeline creates a pipeline with stages", async () => {
  resetFlowluStore();
  const pipeline = await createPipeline({
    name: "Sales Pipeline",
    stages: [
      { name: "New", order: 1 },
      { name: "Qualified", order: 2 },
      { name: "Proposal", order: 3 },
      { name: "Closed", order: 4 },
    ],
    tenantId: "t1",
  });

  assert.ok(pipeline.id.startsWith("fl_pipeline_"));
  assert.equal(pipeline.name, "Sales Pipeline");
  assert.equal(pipeline.stages.length, 4);
  assert.equal(pipeline.stages[0]!.name, "New");
  assert.equal(pipeline.stages[0]!.order, 1);
  assert.ok(pipeline.stages[0]!.id.startsWith("fl_stage_"));
  assert.equal(pipeline.tenantId, "t1");
});

test("listPipelines returns all pipelines", async () => {
  resetFlowluStore();
  await createPipeline({ name: "P1", stages: [{ name: "S1", order: 1 }] });
  await createPipeline({ name: "P2", stages: [{ name: "S1", order: 1 }] });

  const pipelines = await listPipelines();
  assert.equal(pipelines.length, 2);
});

test("listPipelines filters by tenantId", async () => {
  resetFlowluStore();
  await createPipeline({ name: "P1", stages: [{ name: "S1", order: 1 }], tenantId: "t1" });
  await createPipeline({ name: "P2", stages: [{ name: "S1", order: 1 }], tenantId: "t2" });

  const pipelines = await listPipelines("t1");
  assert.equal(pipelines.length, 1);
  assert.equal(pipelines[0]!.name, "P1");
});

// ---------------------------------------------------------------------------
// Deal CRUD
// ---------------------------------------------------------------------------

test("createDeal creates a deal with defaults", async () => {
  resetFlowluStore();
  const contact = await createContact({ firstName: "D", lastName: "D", email: "d@test.com" });
  const deal = await createDeal({
    title: "Big Deal",
    contactId: contact.id,
    stageId: "stage-1",
    stageName: "New",
  });

  assert.ok(deal.id.startsWith("fl_deal_"));
  assert.equal(deal.title, "Big Deal");
  assert.equal(deal.contactId, contact.id);
  assert.equal(deal.stageId, "stage-1");
  assert.equal(deal.stageName, "New");
  assert.equal(deal.amount, 0);
  assert.equal(deal.currency, "USD");
  assert.equal(deal.probability, 0);
  assert.equal(deal.status, "open");
  assert.ok(deal.createdAt);
});

test("createDeal sets provided amount and currency", async () => {
  resetFlowluStore();
  const contact = await createContact({ firstName: "E", lastName: "E", email: "e@test.com" });
  const deal = await createDeal({
    title: "Euro Deal",
    contactId: contact.id,
    stageId: "stage-1",
    stageName: "New",
    amount: 5000,
    currency: "EUR",
    probability: 60,
    expectedCloseDate: "2026-06-01",
    tenantId: "t1",
  });

  assert.equal(deal.amount, 5000);
  assert.equal(deal.currency, "EUR");
  assert.equal(deal.probability, 60);
  assert.equal(deal.expectedCloseDate, "2026-06-01");
  assert.equal(deal.tenantId, "t1");
});

test("moveDealToStage updates stage fields", async () => {
  resetFlowluStore();
  const contact = await createContact({ firstName: "F", lastName: "F", email: "f@test.com" });
  const deal = await createDeal({
    title: "Move Deal",
    contactId: contact.id,
    stageId: "stage-1",
    stageName: "New",
  });

  const moved = await moveDealToStage(deal.id, "stage-2", "Qualified");
  assert.ok(moved);
  assert.equal(moved.stageId, "stage-2");
  assert.equal(moved.stageName, "Qualified");
});

test("moveDealToStage returns null for non-existent deal", async () => {
  resetFlowluStore();
  const result = await moveDealToStage("fake-id", "stage-2", "Qualified");
  assert.equal(result, null);
});

test("updateDealStatus sets won status and probability 100", async () => {
  resetFlowluStore();
  const contact = await createContact({ firstName: "G", lastName: "G", email: "g@test.com" });
  const deal = await createDeal({
    title: "Win Deal",
    contactId: contact.id,
    stageId: "stage-1",
    stageName: "New",
    amount: 1000,
  });

  const won = await updateDealStatus(deal.id, "won");
  assert.ok(won);
  assert.equal(won.status, "won");
  assert.equal(won.probability, 100);
});

test("updateDealStatus sets lost status and probability 0", async () => {
  resetFlowluStore();
  const contact = await createContact({ firstName: "H", lastName: "H", email: "h@test.com" });
  const deal = await createDeal({
    title: "Lost Deal",
    contactId: contact.id,
    stageId: "stage-1",
    stageName: "New",
    probability: 50,
  });

  const lost = await updateDealStatus(deal.id, "lost");
  assert.ok(lost);
  assert.equal(lost.status, "lost");
  assert.equal(lost.probability, 0);
});

test("updateDealStatus returns null for non-existent deal", async () => {
  resetFlowluStore();
  const result = await updateDealStatus("fake-id", "won");
  assert.equal(result, null);
});

test("listDeals returns all deals when no filter", async () => {
  resetFlowluStore();
  const c = await createContact({ firstName: "I", lastName: "I", email: "i@test.com" });
  await createDeal({ title: "D1", contactId: c.id, stageId: "s1", stageName: "New" });
  await createDeal({ title: "D2", contactId: c.id, stageId: "s2", stageName: "Qualified" });

  const deals = await listDeals();
  assert.equal(deals.length, 2);
});

test("listDeals filters by stageId", async () => {
  resetFlowluStore();
  const c = await createContact({ firstName: "J", lastName: "J", email: "j@test.com" });
  await createDeal({ title: "D1", contactId: c.id, stageId: "s1", stageName: "New" });
  await createDeal({ title: "D2", contactId: c.id, stageId: "s2", stageName: "Qualified" });

  const deals = await listDeals({ stageId: "s1" });
  assert.equal(deals.length, 1);
  assert.equal(deals[0]!.stageName, "New");
});

test("listDeals filters by status", async () => {
  resetFlowluStore();
  const c = await createContact({ firstName: "K", lastName: "K", email: "k@test.com" });
  const d1 = await createDeal({ title: "D1", contactId: c.id, stageId: "s1", stageName: "New" });
  await createDeal({ title: "D2", contactId: c.id, stageId: "s1", stageName: "New" });
  await updateDealStatus(d1.id, "won");

  const wonDeals = await listDeals({ status: "won" });
  assert.equal(wonDeals.length, 1);
});

test("listDeals filters by contactId", async () => {
  resetFlowluStore();
  const c1 = await createContact({ firstName: "L", lastName: "L", email: "l@test.com" });
  const c2 = await createContact({ firstName: "M", lastName: "M", email: "m@test.com" });
  await createDeal({ title: "D1", contactId: c1.id, stageId: "s1", stageName: "New" });
  await createDeal({ title: "D2", contactId: c2.id, stageId: "s1", stageName: "New" });

  const deals = await listDeals({ contactId: c1.id });
  assert.equal(deals.length, 1);
});

test("listDeals filters by tenantId", async () => {
  resetFlowluStore();
  const c = await createContact({ firstName: "N", lastName: "N", email: "n@test.com" });
  await createDeal({ title: "D1", contactId: c.id, stageId: "s1", stageName: "New", tenantId: "t1" });
  await createDeal({ title: "D2", contactId: c.id, stageId: "s1", stageName: "New", tenantId: "t2" });

  const deals = await listDeals({ tenantId: "t1" });
  assert.equal(deals.length, 1);
});

// ---------------------------------------------------------------------------
// Tasks
// ---------------------------------------------------------------------------

test("createTask creates a task with defaults", async () => {
  resetFlowluStore();
  const task = await createTask({ title: "Follow up" });

  assert.ok(task.id.startsWith("fl_task_"));
  assert.equal(task.title, "Follow up");
  assert.equal(task.status, "todo");
  assert.equal(task.priority, "medium");
  assert.ok(task.createdAt);
});

test("createTask sets all provided fields", async () => {
  resetFlowluStore();
  const task = await createTask({
    title: "Call client",
    description: "Discuss proposal",
    assigneeId: "user-1",
    dealId: "deal-1",
    contactId: "contact-1",
    status: "in-progress",
    priority: "high",
    dueDate: "2026-04-15",
    tenantId: "t1",
  });

  assert.equal(task.description, "Discuss proposal");
  assert.equal(task.assigneeId, "user-1");
  assert.equal(task.dealId, "deal-1");
  assert.equal(task.contactId, "contact-1");
  assert.equal(task.status, "in-progress");
  assert.equal(task.priority, "high");
  assert.equal(task.dueDate, "2026-04-15");
  assert.equal(task.tenantId, "t1");
});

test("listTasks returns all tasks when no filter", async () => {
  resetFlowluStore();
  await createTask({ title: "T1" });
  await createTask({ title: "T2" });

  const tasks = await listTasks();
  assert.equal(tasks.length, 2);
});

test("listTasks filters by dealId", async () => {
  resetFlowluStore();
  await createTask({ title: "T1", dealId: "d1" });
  await createTask({ title: "T2", dealId: "d2" });

  const tasks = await listTasks({ dealId: "d1" });
  assert.equal(tasks.length, 1);
  assert.equal(tasks[0]!.title, "T1");
});

test("listTasks filters by status", async () => {
  resetFlowluStore();
  await createTask({ title: "T1", status: "todo" });
  await createTask({ title: "T2", status: "done" });

  const tasks = await listTasks({ status: "done" });
  assert.equal(tasks.length, 1);
  assert.equal(tasks[0]!.title, "T2");
});

test("listTasks filters by tenantId", async () => {
  resetFlowluStore();
  await createTask({ title: "T1", tenantId: "t1" });
  await createTask({ title: "T2", tenantId: "t2" });

  const tasks = await listTasks({ tenantId: "t1" });
  assert.equal(tasks.length, 1);
});

// ---------------------------------------------------------------------------
// Lead sync
// ---------------------------------------------------------------------------

test("syncLeadToFlowlu creates contact and deal from lead", async () => {
  resetFlowluStore();
  const result = await syncLeadToFlowlu({
    email: "sync@example.com",
    name: "John Doe",
    phone: "+1555000111",
    company: "SyncCo",
    source: "landing-page",
  }, "t1");

  assert.equal(result.ok, true);
  assert.equal(result.provider, "Flowlu");
  assert.ok(result.payload);
  assert.equal(result.payload.email, "sync@example.com");
  assert.equal(result.payload.tenantId, "t1");
  assert.ok(result.payload.contactId);
  assert.ok(result.payload.dealId);

  const contact = await getContactByEmail("sync@example.com");
  assert.ok(contact);
  assert.equal(contact.firstName, "John");
  assert.equal(contact.lastName, "Doe");
  assert.equal(contact.company, "SyncCo");
  assert.equal(contact.source, "landing-page");
});

test("syncLeadToFlowlu reuses existing contact by email", async () => {
  resetFlowluStore();
  await createContact({
    firstName: "Existing",
    lastName: "User",
    email: "existing@test.com",
  });

  const result = await syncLeadToFlowlu({
    email: "existing@test.com",
    name: "Existing User",
  });

  assert.equal(result.ok, true);
  const contacts = await listContacts();
  assert.equal(contacts.length, 1);
});

test("syncLeadToFlowlu handles single-word names", async () => {
  resetFlowluStore();
  await syncLeadToFlowlu({ email: "mono@test.com", name: "Cher" });

  const contact = await getContactByEmail("mono@test.com");
  assert.ok(contact);
  assert.equal(contact.firstName, "Cher");
  assert.equal(contact.lastName, "");
});

test("syncLeadToFlowlu uses dry-run mode when no API key", async () => {
  resetFlowluStore();
  delete process.env.FLOWLU_API_KEY;
  const result = await syncLeadToFlowlu({ email: "dry@test.com", name: "Dry Run" });
  assert.equal(result.mode, "dry-run");
});

// ---------------------------------------------------------------------------
// Stats
// ---------------------------------------------------------------------------

test("getFlowluStats returns aggregate statistics", async () => {
  resetFlowluStore();
  const c1 = await createContact({ firstName: "S", lastName: "1", email: "s1@test.com" });
  const c2 = await createContact({ firstName: "S", lastName: "2", email: "s2@test.com" });

  const d1 = await createDeal({ title: "D1", contactId: c1.id, stageId: "s1", stageName: "New", amount: 1000 });
  const d2 = await createDeal({ title: "D2", contactId: c2.id, stageId: "s2", stageName: "Qualified", amount: 2000 });
  await createDeal({ title: "D3", contactId: c1.id, stageId: "s1", stageName: "New", amount: 3000 });

  await updateDealStatus(d1.id, "won");
  await updateDealStatus(d2.id, "lost");

  const stats = await getFlowluStats();

  assert.equal(stats.totalContacts, 2);
  assert.equal(stats.totalDeals, 3);
  assert.equal(stats.openDeals, 1);
  assert.equal(stats.wonDeals, 1);
  assert.equal(stats.lostDeals, 1);
  assert.equal(stats.totalRevenue, 1000);
  assert.equal(stats.avgDealSize, 1000);
  assert.equal(stats.winRate, 50);
  assert.equal(stats.byStage.New, 2);
  assert.equal(stats.byStage.Qualified, 1);
});

test("getFlowluStats filters by tenantId", async () => {
  resetFlowluStore();
  const c1 = await createContact({ firstName: "T", lastName: "1", email: "t1@test.com", tenantId: "t1" });
  const c2 = await createContact({ firstName: "T", lastName: "2", email: "t2@test.com", tenantId: "t2" });
  await createDeal({ title: "D1", contactId: c1.id, stageId: "s1", stageName: "New", tenantId: "t1" });
  await createDeal({ title: "D2", contactId: c2.id, stageId: "s1", stageName: "New", tenantId: "t2" });

  const stats = await getFlowluStats("t1");
  assert.equal(stats.totalContacts, 1);
  assert.equal(stats.totalDeals, 1);
});

test("getFlowluStats returns zeros when no data", async () => {
  resetFlowluStore();
  const stats = await getFlowluStats();

  assert.equal(stats.totalContacts, 0);
  assert.equal(stats.totalDeals, 0);
  assert.equal(stats.openDeals, 0);
  assert.equal(stats.wonDeals, 0);
  assert.equal(stats.lostDeals, 0);
  assert.equal(stats.totalRevenue, 0);
  assert.equal(stats.avgDealSize, 0);
  assert.equal(stats.winRate, 0);
  assert.deepEqual(stats.byStage, {});
});

// ---------------------------------------------------------------------------
// ProviderResult
// ---------------------------------------------------------------------------

test("flowluResult returns correctly shaped ProviderResult", () => {
  delete process.env.FLOWLU_API_KEY;
  const result = flowluResult("test-op", "some detail");

  assert.equal(result.ok, true);
  assert.equal(result.provider, "Flowlu");
  assert.equal(result.mode, "dry-run");
  assert.equal(result.detail, "[test-op] some detail");
});

test("flowluResult returns live mode when API key is set", () => {
  process.env.FLOWLU_API_KEY = "key";
  const result = flowluResult("op", "detail");

  assert.equal(result.mode, "live");
  delete process.env.FLOWLU_API_KEY;
});

// ---------------------------------------------------------------------------
// Reset
// ---------------------------------------------------------------------------

test("resetFlowluStore clears all stores", async () => {
  await createContact({ firstName: "X", lastName: "X", email: "x@test.com" });
  await createDeal({ title: "D", contactId: "c1", stageId: "s1", stageName: "New" });
  await createPipeline({ name: "P", stages: [{ name: "S", order: 1 }] });
  await createTask({ title: "T" });

  resetFlowluStore();

  const contacts = await listContacts();
  const deals = await listDeals();
  const pipelines = await listPipelines();
  const tasks = await listTasks();

  assert.equal(contacts.length, 0);
  assert.equal(deals.length, 0);
  assert.equal(pipelines.length, 0);
  assert.equal(tasks.length, 0);
});

test("resetFlowluStore resets ID sequences", async () => {
  await createContact({ firstName: "A", lastName: "A", email: "a@test.com" });
  resetFlowluStore();
  const contact = await createContact({ firstName: "B", lastName: "B", email: "b@test.com" });
  assert.equal(contact.id, "fl_contact_1");
});
