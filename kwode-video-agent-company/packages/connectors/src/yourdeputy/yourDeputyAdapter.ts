import { flags } from "../../../config/src/flags.js";

export interface YourDeputyVideoDeliveryRequest {
  jobId: string;
  clientRef: string;
  pack: "core" | "lead-capture" | "scheduling" | "reviews" | "billing" | "retention" | "suite";
  assetUri: string;
}

export interface YourDeputyDeliveryResult {
  jobId: string;
  status: "queued" | "delivered" | "mocked" | "blocked_by_flag";
  externalRef?: string;
  error?: string;
}

export async function deliverToYourDeputy(
  req: YourDeputyVideoDeliveryRequest
): Promise<YourDeputyDeliveryResult> {
  if (!flags.yourDeputyEnabled || !flags.publicPublishingEnabled) {
    return {
      jobId: req.jobId,
      status: "mocked",
      externalRef: `yourdeputy://mock/${req.clientRef}/${req.pack}/${req.jobId}`,
    };
  }
  return {
    jobId: req.jobId,
    status: "blocked_by_flag",
    error:
      "YourDeputy delivery is gated. Both YOURDEPUTY_ENABLED and SAFE_PUBLIC_PUBLISHING_ENABLED must be true, and an HTTP implementation must be added.",
  };
}
