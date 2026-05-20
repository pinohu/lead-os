import { flags } from "../../../config/src/flags.js";

export interface ThriveCartChargeRequest {
  tenantSlug: string;
  planId: string;
  amountUSDCents: number;
  customerEmail: string;
  description?: string;
}

export interface ThriveCartChargeResult {
  status: "queued" | "succeeded" | "failed" | "mocked" | "blocked_by_flag";
  externalRef?: string;
  error?: string;
}

export async function chargeViaThriveCart(req: ThriveCartChargeRequest): Promise<ThriveCartChargeResult> {
  if (!flags.thrivecartEnabled || !flags.liveBillingEnabled) {
    return {
      status: "mocked",
      externalRef: `thrivecart://mock/${req.tenantSlug}/${req.planId}`,
    };
  }
  return {
    status: "blocked_by_flag",
    error:
      "ThriveCart charges are gated. Both THRIVECART_ENABLED and SAFE_LIVE_BILLING_ENABLED must be true, plus a real HTTP implementation.",
  };
}
