/**
 * ViMax planning packet — the JSON we hand off to the ViMax video planning
 * runtime (HKUDS/ViMax). Designed to be readable by ViMax directly *and*
 * by a human operator who is producing the video manually.
 */
export interface VimaxPlanningPacket {
  packetVersion: "kwode/vimax/1";
  jobId: string;
  title: string;
  brand: {
    name: string;
    voiceTone?: string;
    palette?: Record<string, string>;
    typography?: Record<string, unknown>;
    forbidden?: string[];
  };
  brief: {
    objective: string;
    audience: string;
    hook?: string;
    cta?: string;
    trustSignals?: string[];
  };
  constraints: {
    durationSec: number;
    aspectRatio: string;
    platform?: string;
  };
  script: {
    format: string;
    language: string;
    body: string;
  };
  scenes: Array<{
    order: number;
    durationSec: number;
    description: string;
    visualNotes?: string;
    audioNotes?: string;
    cameraNotes?: string;
  }>;
  prompts: Array<{
    sceneOrder: number;
    kind: "image" | "video" | "voice" | "music" | "sfx" | "text-to-3d";
    toolHint?: string;
    body: string;
    params?: Record<string, unknown>;
  }>;
  consistency: {
    keyVisualEntities: string[];
    lockedColors: string[];
    lockedFonts: string[];
    referenceAssets: string[];
  };
  meta: {
    createdAt: string;
    correlationId: string;
  };
}
