import { createServiceAutomationRoute } from "@/lib/service-automation";

type Platform = "youtube" | "tiktok" | "instagram" | "twitch" | "podcast";
type CreatorService = "contracts" | "revenue" | "content" | "brand-deals";

interface CreatorManagementRequest {
  agencyName: string;
  contactInfo: {
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
  };
  talentCount?: number;
  platforms?: Platform[];
  services?: CreatorService[];
}

export const POST = createServiceAutomationRoute<CreatorManagementRequest>({
  slug: "creator-management",
  nameFieldLabel: "agencyName",
  successMessage: "Creator management intake recorded in SuiteDash",
  getCompanyName: (body) => body.agencyName,
  getContact: (body) => body.contactInfo,
  buildTags: (body) => [
    ...(body.platforms ?? []).map((platform) => `platform-${platform}`),
    ...(body.services ?? []).map((service) => `service-${service}`),
  ],
  buildBackgroundInfo: (body) => [
    typeof body.talentCount === "number" ? `Talent count: ${body.talentCount}` : "",
    body.platforms?.length ? `Platforms: ${body.platforms.join(", ")}` : "",
    body.services?.length ? `Services: ${body.services.join(", ")}` : "",
  ],
});
