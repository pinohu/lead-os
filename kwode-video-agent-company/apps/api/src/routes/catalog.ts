import { Router } from "express";
import {
  loadMasterVideoTypes,
  getVideoType,
  getVideoTypesForNiche,
} from "../../../../packages/video-catalog/src/loader.js";

export const catalogRouter = Router();

catalogRouter.get("/", (req, res) => {
  const niche = req.query.niche as string | undefined;
  if (niche) {
    const types = getVideoTypesForNiche(niche);
    return res.json({ niche, types, count: types.length });
  }
  const types = loadMasterVideoTypes();
  res.json({ types, count: types.length });
});

catalogRouter.get("/:id", (req, res) => {
  const t = getVideoType(req.params.id);
  if (!t) return res.status(404).json({ error: { message: "Video type not found" } });
  res.json(t);
});
