import { readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import yaml from "js-yaml";

export interface ToolEntry {
  tool_id: string;
  name: string;
  category: string;
  role_in_video_factory?: string;
  best_use_cases?: string[];
  input_types?: string[];
  output_types?: string[];
  automation_possible?: boolean;
  api_available?: "yes" | "no" | "unknown";
  manual_workflow_supported?: boolean;
  connector_status?: "planned" | "mock" | "manual" | "api";
  env_keys?: string[];
  notes?: string;
}

let cache: ToolEntry[] | undefined;

export function getToolRegistry(): ToolEntry[] {
  if (cache) return cache;
  const path = join(
    fileURLToPath(new URL(".", import.meta.url)),
    "..",
    "registry",
    "tools.yaml"
  );
  const text = readFileSync(path, "utf8");
  const parsed = yaml.load(text) as { tools: ToolEntry[] };
  if (!parsed?.tools) throw new Error("tools.yaml missing tools[]");
  cache = parsed.tools;
  return cache;
}

export function getTool(id: string): ToolEntry | undefined {
  return getToolRegistry().find((t) => t.tool_id === id);
}

export function toolsByCategory(category: string): ToolEntry[] {
  return getToolRegistry().filter((t) => t.category === category);
}
