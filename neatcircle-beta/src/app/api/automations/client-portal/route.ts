import { createServiceAutomationRoute } from "@/lib/service-automation";

interface ClientPortalRequest {
  companyName: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  domain?: string;
  industry?: string;
  features?: string[];
}

export const POST = createServiceAutomationRoute<ClientPortalRequest>({
  slug: "client-portal",
  nameFieldLabel: "companyName",
  successMessage: "Client portal setup initiated in SuiteDash",
  getCompanyName: (body) => body.companyName,
  getContact: (body) => ({
    firstName: body.firstName,
    lastName: body.lastName,
    email: body.email,
    phone: body.phone,
  }),
  buildTags: (body) => [
    body.industry?.toLowerCase().replace(/\s+/g, "-") ?? "",
    ...(body.features ?? []).map((feature) => feature.toLowerCase().replace(/\s+/g, "-")),
  ],
  buildBackgroundInfo: (body) => [
    "Portal setup request",
    body.domain ? `Portal domain: ${body.domain}` : "",
    body.features?.length ? `Features: ${body.features.join(", ")}` : "",
  ],
});
