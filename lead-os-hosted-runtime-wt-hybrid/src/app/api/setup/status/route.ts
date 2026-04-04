import { NextResponse } from "next/server";

interface SetupChecks {
  database: boolean;
  tenant: boolean;
  brand: boolean;
}

interface SetupStatusResponse {
  configured: boolean;
  checks: SetupChecks;
}

async function checkDatabase(): Promise<boolean> {
  try {
    const { getPool } = await import("@/lib/db");
    const pool = getPool();
    if (!pool) return false;
    const client = await pool.connect();
    await client.query("SELECT 1");
    client.release();
    return true;
  } catch {
    return false;
  }
}

function checkTenant(): boolean {
  const tenantId = process.env.LEAD_OS_TENANT_ID;
  return Boolean(tenantId) && tenantId !== "default-tenant";
}

function checkBrand(): boolean {
  const brandName = process.env.NEXT_PUBLIC_BRAND_NAME;
  return Boolean(brandName) && brandName !== "My Brand" && brandName !== "CX React";
}

export async function GET(): Promise<NextResponse<SetupStatusResponse>> {
  const [database, tenant, brand] = await Promise.all([
    checkDatabase(),
    Promise.resolve(checkTenant()),
    Promise.resolve(checkBrand()),
  ]);

  const checks: SetupChecks = { database, tenant, brand };
  const configured = database && tenant && brand;

  return NextResponse.json({ configured, checks });
}
