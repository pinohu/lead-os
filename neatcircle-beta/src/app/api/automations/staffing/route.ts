import { createServiceAutomationRoute } from "@/lib/service-automation";

interface StaffingRequest {
  agencyName: string;
  contactInfo: {
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
  };
  specialties?: string[];
  placementsPerMonth?: number;
  clientCount?: number;
}

function volumeRangeTag(placements: number): string {
  if (placements <= 10) return "volume-1-10";
  if (placements <= 50) return "volume-11-50";
  if (placements <= 200) return "volume-51-200";
  return "volume-200-plus";
}

export const POST = createServiceAutomationRoute<StaffingRequest>({
  slug: "staffing",
  nameFieldLabel: "agencyName",
  successMessage: "Staffing agency intake recorded in SuiteDash",
  getCompanyName: (body) => body.agencyName,
  getContact: (body) => body.contactInfo,
  buildTags: (body) => [
    ...(body.specialties ?? []).map((specialty) => `specialty-${specialty.toLowerCase().replace(/\s+/g, "-")}`),
    typeof body.placementsPerMonth === "number" ? volumeRangeTag(body.placementsPerMonth) : "",
  ],
  buildBackgroundInfo: (body) => [
    body.specialties?.length ? `Specialties: ${body.specialties.join(", ")}` : "",
    typeof body.placementsPerMonth === "number" ? `Placements/month: ${body.placementsPerMonth}` : "",
    typeof body.clientCount === "number" ? `Client count: ${body.clientCount}` : "",
  ],
});
