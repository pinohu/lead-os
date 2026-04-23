import { NextRequest, NextResponse } from "next/server";
import { requireOperatorApiSession } from "@/lib/operator-auth";
import {
  storeCredential,
  deleteCredential,
  listCredentials,
  getAvailableProviders,
  type CredentialEntry,
} from "@/lib/credentials-vault";
import { tenantConfig } from "@/lib/tenant";

// GET — list credentials for tenant
export async function GET(request: NextRequest) {
  const { session, response } = await requireOperatorApiSession(request);
  if (response) return response;

  const tenantId = tenantConfig.tenantId || "default";
  const credentials = listCredentials(tenantId);
  const providers = getAvailableProviders();

  return NextResponse.json({ data: { credentials, providers } });
}

// POST — store or update a credential
export async function POST(request: NextRequest) {
  const { session, response } = await requireOperatorApiSession(request);
  if (response) return response;

  const tenantId = tenantConfig.tenantId || "default";

  let body: { provider?: string; credentialType?: string; credentials?: Record<string, string> };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: { code: "INVALID_JSON", message: "Invalid request body" } }, { status: 400 });
  }

  const { provider, credentialType, credentials } = body;

  if (!provider || typeof provider !== "string") {
    return NextResponse.json({ error: { code: "MISSING_PROVIDER", message: "provider is required" } }, { status: 400 });
  }
  if (!credentials || typeof credentials !== "object") {
    return NextResponse.json({ error: { code: "MISSING_CREDENTIALS", message: "credentials object is required" } }, { status: 400 });
  }

  try {
    const result = storeCredential(
      tenantId,
      provider,
      (credentialType as CredentialEntry["credentialType"]) || "api-key",
      credentials,
    );
    return NextResponse.json({ data: result }, { status: 201 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to store credential";
    return NextResponse.json({ error: { code: "STORE_FAILED", message } }, { status: 400 });
  }
}

// DELETE — remove a credential
export async function DELETE(request: NextRequest) {
  const { session, response } = await requireOperatorApiSession(request);
  if (response) return response;

  const tenantId = tenantConfig.tenantId || "default";
  const { searchParams } = new URL(request.url);
  const provider = searchParams.get("provider");

  if (!provider) {
    return NextResponse.json({ error: { code: "MISSING_PROVIDER", message: "provider query param required" } }, { status: 400 });
  }

  const deleted = deleteCredential(tenantId, provider);
  if (!deleted) {
    return NextResponse.json({ error: { code: "NOT_FOUND", message: "Credential not found" } }, { status: 404 });
  }

  return NextResponse.json({ data: { deleted: true } });
}
