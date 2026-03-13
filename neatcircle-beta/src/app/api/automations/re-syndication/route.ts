import { createServiceAutomationRoute } from "@/lib/service-automation";

type DealType = "equity" | "debt" | "preferred";

interface ReSyndicationRequest {
  syndicationName: string;
  contactInfo: {
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
  };
  dealType?: DealType;
  targetRaise?: number;
  propertyType?: string;
  investorCount?: number;
}

function raiseRangeTag(amount: number): string {
  if (amount <= 1_000_000) return "raise-under-1m";
  if (amount <= 5_000_000) return "raise-1m-5m";
  if (amount <= 25_000_000) return "raise-5m-25m";
  return "raise-25m-plus";
}

export const POST = createServiceAutomationRoute<ReSyndicationRequest>({
  slug: "re-syndication",
  nameFieldLabel: "syndicationName",
  successMessage: "RE syndication intake recorded in SuiteDash",
  getCompanyName: (body) => body.syndicationName,
  getContact: (body) => body.contactInfo,
  buildTags: (body) => [
    body.dealType ? `deal-${body.dealType}` : "",
    body.propertyType ? body.propertyType.toLowerCase().replace(/\s+/g, "-") : "",
    typeof body.targetRaise === "number" ? raiseRangeTag(body.targetRaise) : "",
  ],
  buildBackgroundInfo: (body) => [
    body.dealType ? `Deal type: ${body.dealType}` : "",
    typeof body.targetRaise === "number" ? `Target raise: $${body.targetRaise.toLocaleString()}` : "",
    body.propertyType ? `Property type: ${body.propertyType}` : "",
    typeof body.investorCount === "number" ? `Investor count: ${body.investorCount}` : "",
  ],
});
