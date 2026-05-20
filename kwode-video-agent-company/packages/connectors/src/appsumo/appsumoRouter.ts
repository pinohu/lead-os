/**
 * AppSumo Tool Router
 *
 * Given a video job's video type + context, recommend a tool chain from the
 * tool registry. This is a deterministic decision tree the AppSumo Video
 * Tool Router Agent consults. It does NOT execute any tools — execution is
 * scheduled by the GenerationRun layer.
 */

import { getToolRegistry } from "../../../tool-registry/src/loader.js";
import type { ToolEntry } from "../../../tool-registry/src/loader.js";

export interface RouteContext {
  videoTypeId: string;
  category?: string;
  durationSec?: number;
  aspectRatio?: string;
  needsTalkingHead?: boolean;
  needsAvatar?: boolean;
  needsLongFormRepurpose?: boolean;
  needsDirectoryListing?: boolean;
}

export interface ToolChainStep {
  tool: ToolEntry;
  stage: string;
  reason: string;
}

export interface ToolChainRecommendation {
  chain: ToolChainStep[];
  fallbackChain: string[];
  notes: string;
}

export function recommendToolChain(ctx: RouteContext): ToolChainRecommendation {
  const registry = getToolRegistry();
  const byId = (id: string) => registry.find((t) => t.tool_id === id);

  const stages: ToolChainStep[] = [];
  const push = (id: string, stage: string, reason: string) => {
    const tool = byId(id);
    if (tool) stages.push({ tool, stage, reason });
  };

  // Research / writing stage
  push("neuronwriter", "research-seo", "SEO research for the topic");
  push("katteb", "fact-check", "Fact verification on the generated copy");

  // Planning stage
  push("vimax", "planning", "Script / scene plan / prompt pack");

  // Visual generation stage
  if (ctx.needsTalkingHead) {
    push("bigvu", "talking-head", "Teleprompter + face capture");
    push("facepop", "talking-head-overlay", "Face overlay for repurposed content");
  } else {
    push("supermachine", "image-generation", "Stylized base images");
    push("vadoo", "video-generation", "Short-form vertical generation");
    push("zebracat", "video-generation-alt", "Alternative short-form generation");
  }

  // Long-form repurposing
  if (ctx.needsLongFormRepurpose) {
    push("castmagic", "transcription", "Transcribe + extract highlights");
    push("minvo", "repurpose-clip", "Clip extraction from long-form source");
    push("onetakeai", "repurpose-edit", "Auto-edit long-form into shorts");
  }

  // Assembly
  push("flexclip", "assembly", "Template-based assembly + branding");

  // Hosting
  push("gumlet", "hosting", "Adaptive video hosting + analytics");
  push("publitio", "hosting-alt", "Alternative media hosting");

  // Distribution
  if (ctx.needsDirectoryListing) {
    push("brilliant-directories", "directory", "Directory listing distribution");
    push("viloud", "channel-embed", "24/7 channel embed on niche pages");
  }

  // Delivery
  push("suitedash", "delivery", "Client portal delivery + assets");

  const fallbackChain = ["vimax", "supermachine", "flexclip", "gumlet", "suitedash"];

  return {
    chain: stages,
    fallbackChain,
    notes:
      `Routed ${stages.length} tool(s) for video type ${ctx.videoTypeId}. ` +
      "All tool runs route through GenerationRun rows so swapping a tool only updates the registry.",
  };
}
