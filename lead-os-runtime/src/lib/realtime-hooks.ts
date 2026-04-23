import { publish } from "./realtime.ts";

export function onLeadCaptured(tenantId: string, leadKey: string, score: number, hot: boolean): void {
  publish({
    type: "lead.captured",
    tenantId,
    payload: { leadKey, score, hot },
  });

  if (hot) {
    publish({
      type: "lead.hot",
      tenantId,
      payload: { leadKey, score },
    });
  }
}

export function onLeadScored(tenantId: string, leadKey: string, score: number, temperature: string): void {
  publish({
    type: "lead.scored",
    tenantId,
    payload: { leadKey, score, temperature },
  });
}

export function onExperimentConversion(tenantId: string, experimentId: string, variantId: string): void {
  publish({
    type: "experiment.conversion",
    tenantId,
    payload: { experimentId, variantId },
  });
}

export function onMarketplaceLeadClaimed(tenantId: string, leadId: string, buyerId: string): void {
  publish({
    type: "marketplace.claimed",
    tenantId,
    payload: { leadId, buyerId },
  });
}

export function onProvisioningStep(tenantId: string, stepName: string, status: string): void {
  publish({
    type: "provisioning.step",
    tenantId,
    payload: { stepName, status },
  });
}
