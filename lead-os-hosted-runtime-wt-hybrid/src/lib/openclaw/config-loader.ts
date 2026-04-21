import fs from "fs";
import path from "path";

export function loadTenantAgentConfig(tenantId) {
  try {
    const filePath = path.join(process.cwd(), "config", "tenants", tenantId, "agents.json");
    if (fs.existsSync(filePath)) {
      return JSON.parse(fs.readFileSync(filePath, "utf-8"));
    }
  } catch (e) {}

  // fallback to default
  const defaultPath = path.join(process.cwd(), "config", "tenants", "default", "agents.json");
  return JSON.parse(fs.readFileSync(defaultPath, "utf-8"));
}
