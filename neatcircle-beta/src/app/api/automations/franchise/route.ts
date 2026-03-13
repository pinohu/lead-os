import { createServiceAutomationRoute } from "@/lib/service-automation";

interface FranchiseRequest {
  brandName: string;
  contactInfo: {
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
  };
  locationCount?: number;
  expansionPlans?: string;
  trainingNeeds?: string[];
}

function locationRangeTag(count: number): string {
  if (count <= 5) return "locations-1-5";
  if (count <= 25) return "locations-6-25";
  if (count <= 100) return "locations-26-100";
  return "locations-100-plus";
}

export const POST = createServiceAutomationRoute<FranchiseRequest>({
  slug: "franchise",
  nameFieldLabel: "brandName",
  successMessage: "Franchise intake recorded in SuiteDash",
  getCompanyName: (body) => body.brandName,
  getContact: (body) => body.contactInfo,
  buildTags: (body) => [
    typeof body.locationCount === "number" ? locationRangeTag(body.locationCount) : "",
    ...(body.trainingNeeds ?? []).map((trainingNeed) => `training-${trainingNeed.toLowerCase().replace(/\s+/g, "-")}`),
  ],
  buildBackgroundInfo: (body) => [
    typeof body.locationCount === "number" ? `Location count: ${body.locationCount}` : "",
    body.expansionPlans ? `Expansion plans: ${body.expansionPlans}` : "",
    body.trainingNeeds?.length ? `Training needs: ${body.trainingNeeds.join(", ")}` : "",
  ],
});
