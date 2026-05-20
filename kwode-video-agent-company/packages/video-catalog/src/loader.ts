import { readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import yaml from "js-yaml";

export interface VideoType {
  video_type_id: string;
  category: string;
  title: string;
  description: string;
  target_audience: string;
  funnel_stage: string;
  recommended_duration: number;
  recommended_aspect_ratios: string[];
  required_inputs: string[];
  optional_inputs: string[];
  ideal_tools: string[];
  agent_chain: string[];
  qa_requirements: string[];
  monetization_path: string[];
}

export interface NicheOverride {
  extends_types: string[];
  pinned_hooks?: string[];
  forbidden_phrases?: string[];
  recommended_durations_sec?: number[];
  recommended_tools?: string[];
  age_gating_required?: boolean;
  requires_clinician_or_attorney_review?: boolean;
}

let masterCache: VideoType[] | undefined;
let nicheCache: Record<string, NicheOverride> | undefined;

function dir(): string {
  return join(fileURLToPath(new URL(".", import.meta.url)), "..", "catalog");
}

export function loadMasterVideoTypes(): VideoType[] {
  if (masterCache) return masterCache;
  const text = readFileSync(join(dir(), "master-types.yaml"), "utf8");
  const parsed = yaml.load(text) as { video_types: VideoType[] };
  if (!parsed?.video_types) throw new Error("master-types.yaml missing video_types[]");
  masterCache = parsed.video_types;
  return masterCache;
}

export function loadNicheOverrides(): Record<string, NicheOverride> {
  if (nicheCache) return nicheCache;
  const text = readFileSync(join(dir(), "niche-overrides.yaml"), "utf8");
  const parsed = yaml.load(text) as { niches: Record<string, NicheOverride> };
  nicheCache = parsed?.niches ?? {};
  return nicheCache;
}

export function getVideoType(id: string): VideoType | undefined {
  return loadMasterVideoTypes().find((v) => v.video_type_id === id);
}

export function getVideoTypesForNiche(niche: string): VideoType[] {
  const override = loadNicheOverrides()[niche];
  if (!override) return [];
  const master = loadMasterVideoTypes();
  return override.extends_types
    .map((id) => master.find((v) => v.video_type_id === id))
    .filter((v): v is VideoType => v !== undefined);
}
