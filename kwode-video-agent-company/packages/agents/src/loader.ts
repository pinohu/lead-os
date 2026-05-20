import { readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import yaml from "js-yaml";

export interface AgentDefinition {
  agent_id: string;
  name: string;
  department: string;
  mission: string;
  responsibilities: string[];
  inputs: string[];
  outputs: string[];
  tools_allowed: string[];
  tools_disallowed: string[];
  memory_scope: "global" | "tenant" | "client" | "brand" | "job" | "agent" | "ephemeral";
  escalation_rules: Array<{ on: string; action: string }>;
  quality_gates: string[];
  success_metrics: string[];
  prompt_template: string;
  example_tasks: string[];
}

interface AgentsFile {
  defaults?: Record<string, unknown>;
  agents: AgentDefinition[];
}

let cached: AgentDefinition[] | undefined;

export function loadAgentDefinitions(): AgentDefinition[] {
  if (cached) return cached;
  const path = join(
    fileURLToPath(new URL(".", import.meta.url)),
    "..",
    "definitions",
    "agents.yaml"
  );
  const text = readFileSync(path, "utf8");
  const parsed = yaml.load(text) as AgentsFile;
  if (!parsed?.agents || !Array.isArray(parsed.agents)) {
    throw new Error(`agents.yaml malformed at ${path}`);
  }
  // light validation — fail fast if anything's missing.
  for (const a of parsed.agents) {
    if (!a.agent_id || !a.name || !a.department) {
      throw new Error(`agent definition missing required field: ${JSON.stringify(a).slice(0, 200)}`);
    }
  }
  cached = parsed.agents;
  return cached;
}

export function getAgent(id: string): AgentDefinition | undefined {
  return loadAgentDefinitions().find((a) => a.agent_id === id);
}

export function agentsByDepartment(): Record<string, AgentDefinition[]> {
  const map: Record<string, AgentDefinition[]> = {};
  for (const a of loadAgentDefinitions()) {
    (map[a.department] ??= []).push(a);
  }
  return map;
}
