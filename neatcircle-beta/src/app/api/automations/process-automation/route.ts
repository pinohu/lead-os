import { createServiceAutomationRoute } from "@/lib/service-automation";

interface ProcessAutomationRequest {
  companyName: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  currentProcesses?: string[];
  painPoints?: string[];
  estimatedManualHours?: number;
  targetTools?: string[];
}

function hoursRangeTag(hours: number): string {
  if (hours <= 10) return "hours-0-10";
  if (hours <= 40) return "hours-11-40";
  if (hours <= 100) return "hours-41-100";
  return "hours-100-plus";
}

export const POST = createServiceAutomationRoute<ProcessAutomationRequest>({
  slug: "process-automation",
  nameFieldLabel: "companyName",
  successMessage: "Process automation intake recorded in SuiteDash",
  getCompanyName: (body) => body.companyName,
  getContact: (body) => ({
    firstName: body.firstName,
    lastName: body.lastName,
    email: body.email,
    phone: body.phone,
  }),
  buildTags: (body) => [
    ...(body.targetTools ?? []).map((tool) => tool.toLowerCase().replace(/\s+/g, "-")),
    typeof body.estimatedManualHours === "number" ? hoursRangeTag(body.estimatedManualHours) : "",
  ],
  buildBackgroundInfo: (body) => [
    body.currentProcesses?.length ? `Current processes: ${body.currentProcesses.join(", ")}` : "",
    body.painPoints?.length ? `Pain points: ${body.painPoints.join(", ")}` : "",
    typeof body.estimatedManualHours === "number"
      ? `Est. manual hours/week: ${body.estimatedManualHours}`
      : "",
    body.targetTools?.length ? `Target tools: ${body.targetTools.join(", ")}` : "",
  ],
});
