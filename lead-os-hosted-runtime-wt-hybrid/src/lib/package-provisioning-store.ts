import { getPool, queryPostgres } from "./db.ts";
import { tenantConfig } from "./tenant.ts";
import type { ProvisionedPackage } from "./package-provisioner.ts";

export type ProvisionedPackageRecord = ProvisionedPackage & {
  tenantId: string;
  persisted: boolean;
};

const memoryProvisionedPackages = new Map<string, ProvisionedPackageRecord>();

function requirePersistenceAvailable(operation: string): boolean {
  if (getPool()) return true;
  void operation;
  return false;
}

export async function saveProvisionedPackage(
  provisioned: ProvisionedPackage,
  tenantId = tenantConfig.tenantId,
): Promise<ProvisionedPackageRecord> {
  const record: ProvisionedPackageRecord = {
    ...provisioned,
    tenantId,
    persisted: Boolean(getPool()),
  };

  if (!requirePersistenceAvailable("package provisioning persistence")) {
    memoryProvisionedPackages.set(provisioned.launchId, record);
    return record;
  }

  await queryPostgres(
    `
      INSERT INTO lead_os_package_provisioning (
        tenant_id,
        launch_id,
        package_slug,
        package_title,
        workspace_slug,
        status,
        operator_email,
        brand_name,
        customer,
        urls,
        embed,
        credentials,
        artifacts,
        automation_runs,
        acceptance_tests,
        payload,
        launched_at,
        updated_at
      )
      VALUES (
        $1,
        $2,
        $3,
        $4,
        $5,
        $6,
        $7,
        $8,
        $9::jsonb,
        $10::jsonb,
        $11::jsonb,
        $12::jsonb,
        $13::jsonb,
        $14::jsonb,
        $15::jsonb,
        $16::jsonb,
        $17::timestamptz,
        now()
      )
      ON CONFLICT (tenant_id, launch_id)
      DO UPDATE SET
        package_slug = EXCLUDED.package_slug,
        package_title = EXCLUDED.package_title,
        workspace_slug = EXCLUDED.workspace_slug,
        status = EXCLUDED.status,
        operator_email = EXCLUDED.operator_email,
        brand_name = EXCLUDED.brand_name,
        customer = EXCLUDED.customer,
        urls = EXCLUDED.urls,
        embed = EXCLUDED.embed,
        credentials = EXCLUDED.credentials,
        artifacts = EXCLUDED.artifacts,
        automation_runs = EXCLUDED.automation_runs,
        acceptance_tests = EXCLUDED.acceptance_tests,
        payload = EXCLUDED.payload,
        launched_at = EXCLUDED.launched_at,
        updated_at = now()
    `,
    [
      tenantId,
      provisioned.launchId,
      provisioned.packageSlug,
      provisioned.packageTitle,
      provisioned.workspaceSlug,
      provisioned.status,
      provisioned.customer.operatorEmail,
      provisioned.customer.brandName,
      JSON.stringify(provisioned.customer),
      JSON.stringify(provisioned.urls),
      JSON.stringify(provisioned.embed),
      JSON.stringify(provisioned.credentials),
      JSON.stringify(provisioned.artifacts),
      JSON.stringify(provisioned.automationRuns),
      JSON.stringify(provisioned.acceptanceTests),
      JSON.stringify(provisioned),
      provisioned.launchedAt,
    ],
  );

  return { ...record, persisted: true };
}

export async function getProvisionedPackage(
  launchId: string,
  tenantId = tenantConfig.tenantId,
): Promise<ProvisionedPackageRecord | null> {
  if (!requirePersistenceAvailable("package provisioning lookup")) {
    return memoryProvisionedPackages.get(launchId) ?? null;
  }

  const result = await queryPostgres<{ payload: ProvisionedPackage }>(
    `
      SELECT payload
      FROM lead_os_package_provisioning
      WHERE tenant_id = $1 AND launch_id = $2
      LIMIT 1
    `,
    [tenantId, launchId],
  );
  const row = result.rows[0];
  return row ? { ...row.payload, tenantId, persisted: true } : null;
}

export function _resetPackageProvisioningStoreForTests() {
  memoryProvisionedPackages.clear();
}
