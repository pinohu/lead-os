export interface Asset {
  id: string;
  tenantId: string;
  name: string;
  url: string;
  type: "image" | "pdf" | "video" | "document" | "other";
  mimeType: string;
  sizeBytes?: number;
  alt?: string;
  tags: string[];
  createdAt: string;
}

const assetStore = new Map<string, Asset>();

function generateId(): string {
  return `asset-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

export function createAsset(input: Omit<Asset, "id" | "createdAt">): Asset {
  const asset: Asset = {
    ...input,
    id: generateId(),
    createdAt: new Date().toISOString(),
  };
  assetStore.set(asset.id, asset);
  return asset;
}

export function getAsset(id: string): Asset | undefined {
  return assetStore.get(id);
}

export function listAssets(tenantId: string, type?: Asset["type"]): Asset[] {
  let results = [...assetStore.values()].filter((a) => a.tenantId === tenantId);
  if (type) {
    results = results.filter((a) => a.type === type);
  }
  return results.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export function deleteAsset(id: string): boolean {
  return assetStore.delete(id);
}

export function searchAssets(tenantId: string, query: string): Asset[] {
  const lowerQuery = query.toLowerCase();
  return [...assetStore.values()]
    .filter((a) => a.tenantId === tenantId)
    .filter(
      (a) =>
        a.name.toLowerCase().includes(lowerQuery) ||
        (a.alt && a.alt.toLowerCase().includes(lowerQuery)) ||
        a.tags.some((tag) => tag.toLowerCase().includes(lowerQuery)),
    )
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}
