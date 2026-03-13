import { createServiceAutomationRoute } from "@/lib/service-automation";

type VisaType = "h1b" | "eb5" | "family" | "asylum" | "naturalization";

interface ImmigrationLawRequest {
  firmName: string;
  contactInfo: {
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
  };
  visaTypes?: VisaType[];
  caseVolume?: number;
  languages?: string[];
}

export const POST = createServiceAutomationRoute<ImmigrationLawRequest>({
  slug: "immigration-law",
  nameFieldLabel: "firmName",
  successMessage: "Immigration law firm intake recorded in SuiteDash",
  getCompanyName: (body) => body.firmName,
  getContact: (body) => body.contactInfo,
  buildTags: (body) => [
    ...(body.visaTypes ?? []).map((visaType) => `visa-${visaType}`),
    ...(body.languages ?? []).map((language) => `lang-${language.toLowerCase().replace(/\s+/g, "-")}`),
  ],
  buildBackgroundInfo: (body) => [
    body.visaTypes?.length ? `Visa types: ${body.visaTypes.join(", ")}` : "",
    typeof body.caseVolume === "number" ? `Monthly case volume: ${body.caseVolume}` : "",
    body.languages?.length ? `Languages: ${body.languages.join(", ")}` : "",
  ],
});
