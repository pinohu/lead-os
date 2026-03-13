import { createServiceAutomationRoute } from "@/lib/service-automation";

type ChurchNeed = "member-portal" | "volunteer" | "donations" | "events";

interface ChurchManagementRequest {
  organizationName: string;
  contactInfo: {
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
  };
  memberCount?: number;
  ministries?: string[];
  needs?: ChurchNeed[];
}

function memberRangeTag(count: number) {
  if (count <= 100) return "members-1-100";
  if (count <= 500) return "members-101-500";
  if (count <= 2000) return "members-501-2000";
  return "members-2000-plus";
}

export const POST = createServiceAutomationRoute<ChurchManagementRequest>({
  slug: "church-management",
  nameFieldLabel: "organizationName",
  successMessage: "Church management intake recorded in SuiteDash",
  getCompanyName: (body) => body.organizationName,
  getContact: (body) => body.contactInfo,
  buildTags: (body) => [
    ...(body.needs ?? []).map((need) => `need-${need}`),
    typeof body.memberCount === "number" ? memberRangeTag(body.memberCount) : "",
  ],
  buildBackgroundInfo: (body) => [
    typeof body.memberCount === "number" ? `Member count: ${body.memberCount}` : "",
    body.ministries?.length ? `Ministries: ${body.ministries.join(", ")}` : "",
    body.needs?.length ? `Needs: ${body.needs.join(", ")}` : "",
  ],
});
