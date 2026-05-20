import { flags } from "../../../config/src/flags.js";

export interface SuiteDashDeliverRequest {
  jobId: string;
  clientPortalRef: string;
  assetUri: string;
  description?: string;
}

export interface SuiteDashDeliverResult {
  jobId: string;
  status: "delivered" | "mocked" | "failed";
  externalRef?: string;
  error?: string;
}

export async function deliverToSuiteDash(req: SuiteDashDeliverRequest): Promise<SuiteDashDeliverResult> {
  if (!flags.suitedashEnabled) {
    return { jobId: req.jobId, status: "mocked", externalRef: `suitedash://mock/${req.clientPortalRef}/${req.jobId}` };
  }
  // Real implementation TBD — gated behind SUITEDASH_ENABLED+API_KEY.
  return { jobId: req.jobId, status: "mocked", externalRef: `suitedash://stub/${req.jobId}` };
}
