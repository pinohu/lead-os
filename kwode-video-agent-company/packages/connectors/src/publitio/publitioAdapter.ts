import { flags } from "../../../config/src/flags.js";

export interface PublitioUploadRequest {
  jobId: string;
  assetUri: string;
}

export interface PublitioUploadResult {
  jobId: string;
  status: "queued" | "uploaded" | "mocked" | "failed";
  externalRef?: string;
  playbackUrl?: string;
  error?: string;
}

export async function uploadToPublitio(req: PublitioUploadRequest): Promise<PublitioUploadResult> {
  if (!flags.publitioEnabled) {
    return {
      jobId: req.jobId,
      status: "mocked",
      externalRef: `publitio://mock/${req.jobId}`,
      playbackUrl: `https://example.com/mock/publitio/${req.jobId}.mp4`,
    };
  }
  return { jobId: req.jobId, status: "mocked", externalRef: `publitio://stub/${req.jobId}` };
}
