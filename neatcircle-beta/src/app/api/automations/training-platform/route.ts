import { createServiceAutomationRoute } from "@/lib/service-automation";

type TrainingType = "employee" | "client" | "certification" | "compliance";

interface TrainingPlatformRequest {
  companyName: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  trainingType?: TrainingType;
  courseCount?: number;
  estimatedLearners?: number;
}

function learnerRangeTag(count: number): string {
  if (count <= 50) return "learners-1-50";
  if (count <= 200) return "learners-51-200";
  if (count <= 500) return "learners-201-500";
  return "learners-500-plus";
}

export const POST = createServiceAutomationRoute<TrainingPlatformRequest>({
  slug: "training-platform",
  nameFieldLabel: "companyName",
  successMessage: "Training platform intake recorded in SuiteDash",
  getCompanyName: (body) => body.companyName,
  getContact: (body) => ({
    firstName: body.firstName,
    lastName: body.lastName,
    email: body.email,
    phone: body.phone,
  }),
  buildTags: (body) => [
    body.trainingType ?? "",
    typeof body.estimatedLearners === "number" ? learnerRangeTag(body.estimatedLearners) : "",
  ],
  buildBackgroundInfo: (body) => [
    body.trainingType ? `Training type: ${body.trainingType}` : "",
    typeof body.courseCount === "number" ? `Course count: ${body.courseCount}` : "",
    typeof body.estimatedLearners === "number"
      ? `Estimated learners: ${body.estimatedLearners}`
      : "",
  ],
});
