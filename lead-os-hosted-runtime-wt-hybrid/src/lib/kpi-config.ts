export interface KPITargetConfig {
  targetConversionRate: number;
  targetCAC?: number;
  targetLTV?: number;
  targetLeadsPerMonth?: number;
  targetRevenuePerMonth?: number;
}

const kpiConfigStore = new Map<string, KPITargetConfig>();

export function getKPIConfig(tenantId: string): KPITargetConfig | undefined {
  return kpiConfigStore.get(tenantId);
}

export function setKPIConfig(tenantId: string, targets: KPITargetConfig): void {
  kpiConfigStore.set(tenantId, targets);
}

export function deleteKPIConfig(tenantId: string): boolean {
  return kpiConfigStore.delete(tenantId);
}

export function resetKPIConfigStore(): void {
  kpiConfigStore.clear();
}
