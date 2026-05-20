import { Router } from "express";
import { loadAgentDefinitions, getAgent } from "../../../../packages/agents/src/loader.js";
import { RunAgentInput } from "../../../../packages/schemas/src/zod.js";
import { runOneAgent } from "../../../../packages/workflow-engine/src/agent-chain.js";

export const agentsRouter = Router();

agentsRouter.get("/", (_req, res) => {
  const defs = loadAgentDefinitions();
  res.json({
    agents: defs.map((a) => ({
      agent_id: a.agent_id,
      name: a.name,
      department: a.department,
      mission: a.mission,
    })),
    count: defs.length,
  });
});

agentsRouter.get("/:id", (req, res) => {
  const a = getAgent(req.params.id);
  if (!a) return res.status(404).json({ error: { message: "Agent not found" } });
  res.json(a);
});

agentsRouter.post("/:id/run", async (req, res, next) => {
  try {
    const body = RunAgentInput.parse(req.body ?? {});
    if (!body.jobId) {
      return res.status(400).json({ error: { message: "jobId is required to run an agent against a job" } });
    }
    const result = await runOneAgent({ jobId: body.jobId, agentId: req.params.id, actor: "system" });
    res.json({ ok: true, agentId: req.params.id, ...result });
  } catch (err) {
    next(err);
  }
});
