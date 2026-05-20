import { flags } from "../../../config/src/flags.js";

export interface ErieProProviderRef {
  externalProviderId: string;
  niche?: string;
  serviceArea?: string;
}

export interface ErieProVideoDeliveryRequest {
  jobId: string;
  provider: ErieProProviderRef;
  assetUri: string;
  caption?: string;
  videoTypeId: string;
}

export interface ErieProVideoDeliveryResult {
  jobId: string;
  status: "queued" | "delivered" | "failed" | "mocked" | "blocked_by_flag";
  externalRef?: string;
  error?: string;
}

/**
 * Deliver a finished video to an Erie.pro provider profile.
 *
 * In MVP this never actually calls Erie.pro. Two gates:
 *   1. ERIE_PRO_ENABLED must be true (operator flag for this connector).
 *   2. SAFE_PUBLIC_PUBLISHING_ENABLED must be true (global irreversible-action gate).
 */
export async function deliverToErieProProvider(req: ErieProVideoDeliveryRequest): Promise<ErieProVideoDeliveryResult> {
  if (!flags.erieProEnabled || !flags.publicPublishingEnabled) {
    return {
      jobId: req.jobId,
      status: "mocked",
      externalRef: `erie.pro://mock/${req.provider.externalProviderId}/${req.jobId}`,
    };
  }
  // Real path is intentionally unimplemented until Ike enables the flag.
  return {
    jobId: req.jobId,
    status: "blocked_by_flag",
    error:
      "Erie.pro delivery is gated. Both ERIE_PRO_ENABLED and SAFE_PUBLIC_PUBLISHING_ENABLED must be true, and a real HTTP implementation must be wired into erieProAdapter.ts.",
  };
}
