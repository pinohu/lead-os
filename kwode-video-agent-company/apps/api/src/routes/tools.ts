import { Router } from "express";
import { getToolRegistry, getTool } from "../../../../packages/tool-registry/src/loader.js";

export const toolsRouter = Router();

toolsRouter.get("/", (_req, res) => {
  const tools = getToolRegistry();
  res.json({ tools, count: tools.length });
});

toolsRouter.get("/:id", (req, res) => {
  const t = getTool(req.params.id);
  if (!t) return res.status(404).json({ error: { message: "Tool not found" } });
  res.json(t);
});
