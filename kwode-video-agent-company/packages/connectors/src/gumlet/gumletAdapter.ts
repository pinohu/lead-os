import { flags } from "../../../config/src/flags.js";

export interface GumletUploadRequest {
  jobId: string;
  assetUri: string;
  title: string;
}

export interface GumletUploadResult {
  jobId: string;
  status: "queued" | "uploaded" | "mocked" | "failed";
  externalRef?: string;
  playbackUrl?: string;
  error?: string;
}

export async function uploadToGumlet(req: GumletUploadRequest): Promise<GumletUploadResult> {
  if (!flags.gumletEnabled) {
    return {
      jobId: req.jobId,
      status: "mocked",
      externalRef: `gumlet://mock/${req.jobId}`,
      playbackUrl: `https://example.com/mock/gumlet/${req.jobId}.m3u8`,
    };
  }
  // Real Gumlet upload requires a multi-step async pipeline (create asset
  // → upload URL → finalize). Wire that into a worker once enabled.
  return { jobId: req.jobId, status: "mocked", externalRef: `gumlet://stub/${req.jobId}` };
}
