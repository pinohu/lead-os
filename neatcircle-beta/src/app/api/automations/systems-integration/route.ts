import { createServiceAutomationRoute } from "@/lib/service-automation";

interface IntegrationMapping {
  source: string;
  destination: string;
  dataType: string;
}

interface SystemsIntegrationRequest {
  companyName: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  existingSystems?: string[];
  desiredIntegrations?: IntegrationMapping[];
  syncFrequency?: string;
}

export const POST = createServiceAutomationRoute<SystemsIntegrationRequest>({
  slug: "systems-integration",
  nameFieldLabel: "companyName",
  successMessage: "Systems integration intake recorded in SuiteDash",
  getCompanyName: (body) => body.companyName,
  getContact: (body) => ({
    firstName: body.firstName,
    lastName: body.lastName,
    email: body.email,
    phone: body.phone,
  }),
  buildTags: (body) => [
    ...(body.existingSystems ?? []).map((system) => system.toLowerCase().replace(/\s+/g, "-")),
    body.syncFrequency ? `sync-${body.syncFrequency.toLowerCase().replace(/\s+/g, "-")}` : "",
  ],
  buildBackgroundInfo: (body) => {
    const integrationNotes = body.desiredIntegrations?.map(
      (integration) => `${integration.source} -> ${integration.destination} (${integration.dataType})`,
    ).join("\n");

    return [
      body.existingSystems?.length ? `Existing systems: ${body.existingSystems.join(", ")}` : "",
      integrationNotes ? `Desired integrations:\n${integrationNotes}` : "",
      body.syncFrequency ? `Sync frequency: ${body.syncFrequency}` : "",
    ];
  },
});
