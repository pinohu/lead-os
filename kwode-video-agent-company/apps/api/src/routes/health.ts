import { Router } from "express";
import { prisma } from "../../../../packages/schemas/src/db.js";
import { flags } from "../../../../packages/config/src/flags.js";

export const healthRouter = Router();

healthRouter.get("/", (_req, res) => {
  res.json({ ok: true, service: "kwode-video-factory-api", time: new Date().toISOString() });
});

healthRouter.get("/deep", async (_req, res) => {
  let dbOk = false;
  let dbError: string | undefined;
  try {
    await prisma.$queryRaw`SELECT 1`;
    dbOk = true;
  } catch (err) {
    dbError = err instanceof Error ? err.message : String(err);
  }

  res.json({
    service: "kwode-video-factory-api",
    time: new Date().toISOString(),
    dependencies: {
      database: { ok: dbOk, error: dbError ?? null },
    },
    runtimes: {
      hermes: { enabled: flags.hermesEnabled, mode: flags.hermesEnabled ? "real" : "mock" },
      vimax: { enabled: flags.vimaxEnabled, mode: flags.vimaxEnabled ? "real" : "mock" },
      comfyui: { enabled: flags.comfyuiEnabled, mode: flags.comfyuiEnabled ? "real" : "mock" },
    },
    connectors: {
      suitedash: { enabled: flags.suitedashEnabled, mode: flags.suitedashEnabled ? "real" : "mock" },
      thrivecart: { enabled: flags.thrivecartEnabled, mode: flags.thrivecartEnabled ? "real" : "mock" },
      productdyno: { enabled: flags.productdynoEnabled, mode: flags.productdynoEnabled ? "real" : "mock" },
      gumlet: { enabled: flags.gumletEnabled, mode: flags.gumletEnabled ? "real" : "mock" },
      publitio: { enabled: flags.publitioEnabled, mode: flags.publitioEnabled ? "real" : "mock" },
      erieProEnabled: { enabled: flags.erieProEnabled, mode: flags.erieProEnabled ? "real" : "mock" },
      yourDeputyEnabled: { enabled: flags.yourDeputyEnabled, mode: flags.yourDeputyEnabled ? "real" : "mock" },
    },
    safetyFlags: {
      publicPublishingEnabled: flags.publicPublishingEnabled,
      liveBillingEnabled: flags.liveBillingEnabled,
      outreachEnabled: flags.outreachEnabled,
    },
  });
});
