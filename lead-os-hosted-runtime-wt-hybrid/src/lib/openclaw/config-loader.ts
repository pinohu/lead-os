import fs from "fs";
import path from "path";

function safeReadJson(filePath) {
  try {
    const raw = fs.readFileSync(filePath, "utf-8");
    const parsed = JSON.parse(raw);
    if (typeof parsed === "object" && parsed !== null) {
      return parsed;
    }
  } catch {}
  return null;
}

export function loadTenantAgentConfig(tenantId) {
  const basePath = path.join(process.cwd(), "config", "tenants");

  try {
    const tenantPath = path.join(basePath, tenantId, "agents.json");
    if (fs.existsSync(tenantPath)) {
      const cfg = safeReadJson(tenantPath);
      if (cfg) return cfg;
    }
  } catch {}

  try {
    const defaultPath = path.join(basePath, "default", "agents.json");
    const fallback = safeReadJson(defaultPath);
    if (fallback) return fallback;
  } catch {}

  // Final safe fallback to prevent runtime crash
  return {
    qualifier: { enabled: true },
    closer: { enabled: true, minScore: 70 }
  };
}
