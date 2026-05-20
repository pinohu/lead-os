import { VimaxPlanningPacket } from "./vimaxPlanningPacket.js";
import { VimaxResult } from "./vimaxResultParser.js";

/**
 * Mock ViMax runner.
 *
 * Returns one "planned" asset per prompt without producing any real media.
 * The corresponding GenerationRun row will be marked `mode = "mock"` so
 * downstream QA can distinguish planned-only assets from real ones.
 */
export async function runVimaxMock(packet: VimaxPlanningPacket): Promise<VimaxResult> {
  return {
    packetVersion: "kwode/vimax/1",
    jobId: packet.jobId,
    status: "mocked",
    notes:
      "ViMax is disabled (VIMAX_ENABLED=false). Returning a planning-only manifest so the pipeline can advance. Real media generation will not occur until ViMax is wired up.",
    assets: packet.prompts.map((p) => ({
      sceneOrder: p.sceneOrder,
      kind: p.kind === "video" ? "video" : p.kind === "voice" ? "audio" : "image",
      uri: `vimax://planned/${packet.jobId}/scene-${p.sceneOrder}-${p.kind}`,
      mimeType:
        p.kind === "video"
          ? "video/mp4"
          : p.kind === "voice"
          ? "audio/mpeg"
          : "image/png",
      notes: `Mock asset — prompt: ${p.body.slice(0, 80)}`,
    })),
  };
}
