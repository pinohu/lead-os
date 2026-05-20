import "dotenv/config";
import express from "express";
import { pinoHttp } from "pino-http";
import pino from "pino";
import { videoJobsRouter } from "./routes/video-jobs.js";
import { agentsRouter } from "./routes/agents.js";
import { toolsRouter } from "./routes/tools.js";
import { catalogRouter } from "./routes/catalog.js";
import { auditRouter } from "./routes/audit.js";
import { healthRouter } from "./routes/health.js";

const log = pino({ level: process.env.LOG_LEVEL ?? "info" });

const app = express();
app.use(express.json({ limit: "2mb" }));
app.use(pinoHttp({ logger: log }));

app.use("/api/health", healthRouter);
app.use("/api/video-jobs", videoJobsRouter);
app.use("/api/video-types", catalogRouter);
app.use("/api/agents", agentsRouter);
app.use("/api/tools", toolsRouter);
app.use("/api/audit-logs", auditRouter);

app.get("/", (_req, res) => {
  res.json({
    service: "kwode-video-agent-company",
    version: "0.1.0-mvp",
    docs: "/api/health/deep",
  });
});

// Last-resort error handler.
app.use((err: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  log.error({ err }, "unhandled");
  const status = (err as { status?: number })?.status ?? 500;
  const message = err instanceof Error ? err.message : "Internal error";
  res.status(status).json({ error: { message } });
});

const port = Number(process.env.API_PORT ?? 3000);
app.listen(port, () => {
  log.info({ port }, "kwode-video-factory api listening");
});
