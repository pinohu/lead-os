import test from "node:test";
import assert from "node:assert/strict";
import {
  createN8NWorkflow,
  getN8NWorkflow,
  listN8NWorkflows,
  activateWorkflow,
  deactivateWorkflow,
  executeWorkflow,
  getExecution,
  listExecutions,
  importWorkflowFromJSON,
  exportWorkflowToJSON,
  resetN8NEnhancedStore,
} from "../src/lib/integrations/n8n-enhanced-adapter.ts";

const SAMPLE_NODES = [
  { id: "n1", type: "n8n-nodes-base.webhook", position: [0, 0] as [number, number], parameters: { path: "/test" } },
  { id: "n2", type: "n8n-nodes-base.httpRequest", position: [200, 0] as [number, number], parameters: { url: "https://api.example.com" } },
];

const SAMPLE_CONNECTIONS = [
  { sourceNode: "n1", sourceOutput: 0, targetNode: "n2", targetInput: 0 },
];

// ---------------------------------------------------------------------------
// createN8NWorkflow + getN8NWorkflow
// ---------------------------------------------------------------------------

test("createN8NWorkflow creates a workflow and getN8NWorkflow retrieves it", async () => {
  resetN8NEnhancedStore();
  const wf = await createN8NWorkflow("n8e-t1", {
    name: "Test N8N Flow",
    nodes: SAMPLE_NODES,
    connections: SAMPLE_CONNECTIONS,
  });

  assert.ok(wf.id.startsWith("n8n-wf-"));
  assert.equal(wf.tenantId, "n8e-t1");
  assert.equal(wf.name, "Test N8N Flow");
  assert.equal(wf.active, false);
  assert.equal(wf.nodes.length, 2);
  assert.equal(wf.connections.length, 1);
  assert.equal(wf.executionCount, 0);
  assert.ok(wf.createdAt);

  const retrieved = await getN8NWorkflow(wf.id);
  assert.equal(retrieved.id, wf.id);
});

// ---------------------------------------------------------------------------
// listN8NWorkflows
// ---------------------------------------------------------------------------

test("listN8NWorkflows returns workflows scoped to tenant", async () => {
  resetN8NEnhancedStore();
  await createN8NWorkflow("n8e-ta", { name: "WF A", nodes: SAMPLE_NODES, connections: [] });
  await createN8NWorkflow("n8e-tb", { name: "WF B", nodes: SAMPLE_NODES, connections: [] });
  await createN8NWorkflow("n8e-ta", { name: "WF C", nodes: SAMPLE_NODES, connections: [] });

  const taWfs = await listN8NWorkflows("n8e-ta");
  const tbWfs = await listN8NWorkflows("n8e-tb");
  assert.equal(taWfs.length, 2);
  assert.equal(tbWfs.length, 1);
});

// ---------------------------------------------------------------------------
// activateWorkflow + deactivateWorkflow
// ---------------------------------------------------------------------------

test("activateWorkflow and deactivateWorkflow toggle active state", async () => {
  resetN8NEnhancedStore();
  const wf = await createN8NWorkflow("n8e-t2", { name: "Toggle Test", nodes: SAMPLE_NODES, connections: [] });
  assert.equal(wf.active, false);

  const activated = await activateWorkflow(wf.id);
  assert.equal(activated.active, true);

  const deactivated = await deactivateWorkflow(wf.id);
  assert.equal(deactivated.active, false);
});

// ---------------------------------------------------------------------------
// executeWorkflow
// ---------------------------------------------------------------------------

test("executeWorkflow runs an active workflow and records execution", async () => {
  resetN8NEnhancedStore();
  const wf = await createN8NWorkflow("n8e-t3", { name: "Execute Test", nodes: SAMPLE_NODES, connections: SAMPLE_CONNECTIONS });
  await activateWorkflow(wf.id);

  const exec = await executeWorkflow(wf.id, { key: "value" });
  assert.ok(exec.id.startsWith("n8n-exec-"));
  assert.equal(exec.workflowId, wf.id);
  assert.equal(exec.status, "success");
  assert.deepEqual(exec.data, { key: "value" });
  assert.ok(exec.startedAt);
  assert.ok(exec.finishedAt);

  const updatedWf = await getN8NWorkflow(wf.id);
  assert.equal(updatedWf.executionCount, 1);
  assert.ok(updatedWf.lastExecutionAt);
});

test("executeWorkflow rejects inactive workflows", async () => {
  resetN8NEnhancedStore();
  const wf = await createN8NWorkflow("n8e-t4", { name: "Inactive Test", nodes: SAMPLE_NODES, connections: [] });

  await assert.rejects(
    () => executeWorkflow(wf.id),
    /not active/,
  );
});

// ---------------------------------------------------------------------------
// getExecution + listExecutions
// ---------------------------------------------------------------------------

test("getExecution retrieves a specific execution", async () => {
  resetN8NEnhancedStore();
  const wf = await createN8NWorkflow("n8e-t5", { name: "Exec Lookup", nodes: SAMPLE_NODES, connections: [] });
  await activateWorkflow(wf.id);

  const exec = await executeWorkflow(wf.id, { run: 1 });
  const retrieved = await getExecution(exec.id);
  assert.equal(retrieved.id, exec.id);
  assert.equal(retrieved.status, "success");
});

test("listExecutions returns executions with limit", async () => {
  resetN8NEnhancedStore();
  const wf = await createN8NWorkflow("n8e-t6", { name: "Limit Test", nodes: SAMPLE_NODES, connections: [] });
  await activateWorkflow(wf.id);

  await executeWorkflow(wf.id, { run: 1 });
  await executeWorkflow(wf.id, { run: 2 });
  await executeWorkflow(wf.id, { run: 3 });

  const all = await listExecutions(wf.id);
  assert.equal(all.length, 3);

  const limited = await listExecutions(wf.id, 2);
  assert.equal(limited.length, 2);
});

// ---------------------------------------------------------------------------
// importWorkflowFromJSON + exportWorkflowToJSON
// ---------------------------------------------------------------------------

test("importWorkflowFromJSON and exportWorkflowToJSON round-trip", async () => {
  resetN8NEnhancedStore();
  const json = JSON.stringify({
    name: "Imported Workflow",
    nodes: SAMPLE_NODES,
    connections: SAMPLE_CONNECTIONS,
  });

  const imported = await importWorkflowFromJSON("n8e-t7", json);
  assert.equal(imported.name, "Imported Workflow");
  assert.equal(imported.nodes.length, 2);

  const exported = await exportWorkflowToJSON(imported.id);
  const parsed = JSON.parse(exported);
  assert.equal(parsed.name, "Imported Workflow");
  assert.equal(parsed.nodes.length, 2);
  assert.equal(parsed.connections.length, 1);
});

test("importWorkflowFromJSON rejects invalid JSON", async () => {
  resetN8NEnhancedStore();
  await assert.rejects(
    () => importWorkflowFromJSON("n8e-t8", "not json"),
    /Invalid JSON/,
  );
});
