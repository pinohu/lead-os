import { createServiceAutomationRoute } from "@/lib/service-automation";

interface DigitalTransformationRequest {
  companyName: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  currentState?: string;
  goals?: string[];
  timeline?: string;
  budgetRange?: string;
}

function budgetRangeTag(range: string): string {
  return `budget-${range.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/-+$/, "")}`;
}

export const POST = createServiceAutomationRoute<DigitalTransformationRequest>({
  slug: "digital-transformation",
  nameFieldLabel: "companyName",
  successMessage: "Digital transformation intake recorded in SuiteDash",
  getCompanyName: (body) => body.companyName,
  getContact: (body) => ({
    firstName: body.firstName,
    lastName: body.lastName,
    email: body.email,
    phone: body.phone,
  }),
  buildTags: (body) => [
    ...(body.goals ?? []).map((goal) => goal.toLowerCase().replace(/\s+/g, "-")),
    body.timeline ? `timeline-${body.timeline.toLowerCase().replace(/\s+/g, "-")}` : "",
    body.budgetRange ? budgetRangeTag(body.budgetRange) : "",
  ],
  buildBackgroundInfo: (body) => [
    body.currentState ? `Current state: ${body.currentState}` : "",
    body.goals?.length ? `Goals: ${body.goals.join(", ")}` : "",
    body.timeline ? `Timeline: ${body.timeline}` : "",
    body.budgetRange ? `Budget range: ${body.budgetRange}` : "",
  ],
});
