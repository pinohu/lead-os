export function buildOpenApiSpec(): object {
  return {
    openapi: "3.1.0",
    info: {
      title: "Lead OS API",
      version: "2026-03-30",
      description: "Autonomous lead acquisition, scoring, nurturing, and marketplace API. 295+ endpoints across intake, scoring, marketplace, billing, and operator management.",
      contact: { name: "Lead OS Support", url: "https://github.com/pinohu/lead-os" },
      license: { name: "MIT", url: "https://opensource.org/licenses/MIT" },
    },
    servers: [
      { url: process.env.NEXT_PUBLIC_SITE_URL ?? "https://leadgen-os.com", description: "Production" },
      { url: "http://localhost:3000", description: "Development" },
    ],
    components: {
      securitySchemes: {
        bearerAuth: { type: "http", scheme: "bearer", description: "API key (los_*) or session token (sess_*)" },
        apiKeyHeader: { type: "apiKey", in: "header", name: "X-API-Key", description: "API key via header" },
        cookieAuth: { type: "apiKey", in: "cookie", name: "leados_session", description: "Session cookie" },
      },
      schemas: {
        Error: {
          type: "object",
          properties: {
            success: { type: "boolean", example: false },
            error: { type: "string" },
            details: { type: "array", items: { type: "string" }, nullable: true },
          },
        },
        Lead: {
          type: "object",
          properties: {
            leadKey: { type: "string" },
            firstName: { type: "string" },
            lastName: { type: "string" },
            email: { type: "string", format: "email" },
            phone: { type: "string", nullable: true },
            niche: { type: "string" },
            source: { type: "string" },
            score: { type: "number" },
            temperature: { type: "string", enum: ["cold", "warm", "hot", "burning"] },
          },
        },
        HealthCheck: {
          type: "object",
          properties: {
            status: { type: "string", enum: ["ok", "degraded"] },
            service: { type: "string" },
            version: { type: "string" },
            apiVersion: { type: "string" },
            timestamp: { type: "string", format: "date-time" },
            components: { type: "object" },
          },
        },
      },
    },
    security: [{ bearerAuth: [] }],
    tags: [
      { name: "Health", description: "System health and status" },
      { name: "Auth", description: "Authentication, sessions, API keys, 2FA" },
      { name: "Intake", description: "Lead capture and processing" },
      { name: "Scoring", description: "Lead scoring and recalibration" },
      { name: "Marketplace", description: "Lead marketplace operations" },
      { name: "Dashboard", description: "Operator dashboard data" },
      { name: "Analytics", description: "Analytics and attribution" },
      { name: "Experiments", description: "A/B testing and optimization" },
      { name: "Billing", description: "Stripe billing and usage" },
      { name: "Social", description: "Social content generation" },
      { name: "AI", description: "AI-powered generation and analysis" },
      { name: "Agents", description: "AI agent orchestration" },
      { name: "Admin", description: "Administrative operations" },
      { name: "Compliance", description: "SOC 2 controls and audit" },
    ],
    paths: {
      "/api/health": {
        get: { tags: ["Health"], summary: "Basic health check", security: [], responses: { "200": { description: "Service healthy", content: { "application/json": { schema: { "$ref": "#/components/schemas/HealthCheck" } } } } } },
      },
      "/api/health/deep": {
        get: { tags: ["Health"], summary: "Deep health check with dependency status", security: [], responses: { "200": { description: "All components healthy" }, "503": { description: "One or more components degraded" } } },
      },
      "/api/status": {
        get: { tags: ["Health"], summary: "Public status page data with uptime percentages", security: [], responses: { "200": { description: "Status data" } } },
      },
      "/api/intake": {
        post: { tags: ["Intake"], summary: "Capture a new lead", description: "Normalizes, deduplicates, scores, and routes incoming leads.", requestBody: { required: true, content: { "application/json": { schema: { type: "object", required: ["source", "email"], properties: { source: { type: "string", enum: ["contact_form", "assessment", "roi_calculator", "exit_intent", "chat", "webinar", "checkout", "manual"] }, firstName: { type: "string" }, lastName: { type: "string" }, email: { type: "string", format: "email" }, phone: { type: "string" }, niche: { type: "string" }, service: { type: "string" } } } } } }, responses: { "200": { description: "Lead captured" }, "422": { description: "Validation failed" }, "429": { description: "Rate limited" } } },
      },
      "/api/auth/login": { post: { tags: ["Auth"], summary: "Request magic link login", security: [] } },
      "/api/auth/verify": { get: { tags: ["Auth"], summary: "Verify magic link token", security: [] } },
      "/api/auth/session": { get: { tags: ["Auth"], summary: "Get current session info" }, delete: { tags: ["Auth"], summary: "Logout / destroy session" } },
      "/api/auth/api-keys": { get: { tags: ["Auth"], summary: "List API keys" }, post: { tags: ["Auth"], summary: "Create API key" } },
      "/api/auth/team": { get: { tags: ["Auth"], summary: "List team members" }, post: { tags: ["Auth"], summary: "Send team invite" } },
      "/api/auth/2fa/setup": { post: { tags: ["Auth"], summary: "Generate TOTP secret for 2FA setup" } },
      "/api/auth/2fa/verify": { post: { tags: ["Auth"], summary: "Verify TOTP code and enable 2FA" } },
      "/api/auth/2fa/disable": { post: { tags: ["Auth"], summary: "Disable 2FA (requires current code)" } },
      "/api/scoring": { post: { tags: ["Scoring"], summary: "Calculate lead score" } },
      "/api/scoring/recalibrate": { post: { tags: ["Scoring"], summary: "Recalibrate scoring weights" } },
      "/api/marketplace/leads": { get: { tags: ["Marketplace"], summary: "List marketplace leads" }, post: { tags: ["Marketplace"], summary: "List a lead on marketplace" } },
      "/api/dashboard/analytics": { get: { tags: ["Dashboard"], summary: "Dashboard analytics data" } },
      "/api/dashboard/leads": { get: { tags: ["Dashboard"], summary: "Dashboard lead list" } },
      "/api/experiments": { get: { tags: ["Experiments"], summary: "List experiments" }, post: { tags: ["Experiments"], summary: "Create experiment" } },
      "/api/billing/checkout": { post: { tags: ["Billing"], summary: "Create Stripe checkout session" } },
      "/api/billing/usage": { get: { tags: ["Billing"], summary: "Get usage metrics" } },
      "/api/admin/traces": { get: { tags: ["Admin"], summary: "Query request traces" } },
      "/api/admin/compliance": { get: { tags: ["Compliance"], summary: "Generate compliance report" } },
      "/api/docs/openapi.json": { get: { tags: ["Admin"], summary: "This OpenAPI specification", security: [] } },
    },
  };
}
