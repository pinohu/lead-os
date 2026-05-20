import { Router } from "express";
import { prisma } from "../../../../packages/schemas/src/db.js";

export const auditRouter = Router();

auditRouter.get("/", async (req, res, next) => {
  try {
    const jobId = req.query.jobId as string | undefined;
    const actor = req.query.actor as string | undefined;
    const limit = Math.min(500, Number(req.query.limit ?? 100));
    const logs = await prisma.auditLog.findMany({
      where: {
        jobId: jobId ?? undefined,
        actor: actor ?? undefined,
      },
      orderBy: { createdAt: "desc" },
      take: limit,
    });
    res.json({ logs, count: logs.length });
  } catch (err) {
    next(err);
  }
});
