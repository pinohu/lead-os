import { createServiceAutomationRoute } from "@/lib/service-automation";

type TargetMarket = "hr-consulting" | "peo" | "payroll" | "insurance";
type PricingModel = "per-employee" | "flat-rate" | "tiered";

interface ComplianceProductizedRequest {
  resellerName: string;
  contactInfo: {
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
  };
  targetMarket?: TargetMarket;
  clientCount?: number;
  pricingModel?: PricingModel;
}

export const POST = createServiceAutomationRoute<ComplianceProductizedRequest>({
  slug: "compliance-productized",
  nameFieldLabel: "resellerName",
  successMessage: "Compliance productized reseller intake recorded in SuiteDash",
  getCompanyName: (body) => body.resellerName,
  getContact: (body) => body.contactInfo,
  buildTags: (body) => [
    body.targetMarket ? `market-${body.targetMarket}` : "",
    body.pricingModel ? `pricing-${body.pricingModel}` : "",
  ],
  buildBackgroundInfo: (body) => [
    body.targetMarket ? `Target market: ${body.targetMarket}` : "",
    typeof body.clientCount === "number" ? `Client count: ${body.clientCount}` : "",
    body.pricingModel ? `Pricing model: ${body.pricingModel}` : "",
  ],
});
