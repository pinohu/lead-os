import { getPool } from "../db.ts";

export interface SearchIndex {
  name: string;
  primaryKey: string;
  searchableAttributes: string[];
  filterableAttributes: string[];
  sortableAttributes: string[];
}

export interface SearchResult<T> {
  hits: T[];
  query: string;
  processingTimeMs: number;
  estimatedTotalHits: number;
  facets?: Record<string, Record<string, number>>;
}

export interface SearchOptions {
  filters?: string;
  sort?: string[];
  limit?: number;
  offset?: number;
  facets?: string[];
}

// ---------------------------------------------------------------------------
// Pre-configured Lead OS indexes
// ---------------------------------------------------------------------------

export const LEAD_OS_INDEXES: SearchIndex[] = [
  {
    name: "leads",
    primaryKey: "id",
    searchableAttributes: ["name", "email", "company", "niche", "source"],
    filterableAttributes: ["tenantId", "status", "niche", "source", "score"],
    sortableAttributes: ["score", "createdAt", "updatedAt"],
  },
  {
    name: "content",
    primaryKey: "id",
    searchableAttributes: ["title", "hook", "angle", "platform"],
    filterableAttributes: ["tenantId", "platform", "status", "type"],
    sortableAttributes: ["createdAt", "performanceScore"],
  },
  {
    name: "marketplace",
    primaryKey: "id",
    searchableAttributes: ["niche", "temperature", "summary"],
    filterableAttributes: ["tenantId", "temperature", "status"],
    sortableAttributes: ["createdAt", "score"],
  },
];

// ---------------------------------------------------------------------------
// In-memory fallback store
// ---------------------------------------------------------------------------

interface IndexedDoc {
  [key: string]: unknown;
}

const inMemoryIndexes = new Map<string, { config: SearchIndex; docs: IndexedDoc[] }>();

function getOrCreateInMemoryIndex(name: string): { config: SearchIndex; docs: IndexedDoc[] } {
  if (!inMemoryIndexes.has(name)) {
    const builtIn = LEAD_OS_INDEXES.find((i) => i.name === name);
    const config: SearchIndex = builtIn ?? {
      name,
      primaryKey: "id",
      searchableAttributes: [],
      filterableAttributes: [],
      sortableAttributes: [],
    };
    inMemoryIndexes.set(name, { config, docs: [] });
  }
  return inMemoryIndexes.get(name)!;
}

function matchesFilters(doc: IndexedDoc, filters?: string): boolean {
  if (!filters) return true;

  // Support simple key=value and key="value" filter expressions joined by AND/OR.
  // Example: "tenantId = 'abc' AND status = 'active'"
  const andParts = filters.split(/\s+AND\s+/i);
  return andParts.every((part) => {
    const orParts = part.split(/\s+OR\s+/i);
    return orParts.some((expr) => {
      const m = expr.trim().match(/^(\w+)\s*=\s*['"]?([^'"]+)['"]?$/);
      if (!m) return true;
      const [, key, value] = m;
      return String(doc[key]) === value.trim();
    });
  });
}

function scoreDocument(doc: IndexedDoc, query: string, searchableAttributes: string[]): number {
  if (!query) return 1;
  const lower = query.toLowerCase();
  let score = 0;
  for (const attr of searchableAttributes) {
    const val = String(doc[attr] ?? "").toLowerCase();
    if (val === lower) score += 10;
    else if (val.startsWith(lower)) score += 5;
    else if (val.includes(lower)) score += 1;
  }
  return score;
}

function inMemorySearch<T>(
  indexName: string,
  query: string,
  options: SearchOptions = {},
): SearchResult<T> {
  const start = Date.now();
  const index = getOrCreateInMemoryIndex(indexName);
  const { searchableAttributes } = index.config;
  const limit = options.limit ?? 20;
  const offset = options.offset ?? 0;

  let results = index.docs.filter((doc) => matchesFilters(doc, options.filters));

  if (query) {
    results = results
      .map((doc) => ({ doc, score: scoreDocument(doc, query, searchableAttributes) }))
      .filter(({ score }) => score > 0)
      .sort((a, b) => b.score - a.score)
      .map(({ doc }) => doc);
  }

  if (options.sort?.length) {
    const [sortField, sortDir] = options.sort[0].split(":");
    const dir = sortDir === "desc" ? -1 : 1;
    results = results.slice().sort((a, b) => {
      const av = a[sortField];
      const bv = b[sortField];
      if (av === bv) return 0;
      if (av === undefined || av === null) return 1;
      if (bv === undefined || bv === null) return -1;
      return av < bv ? -dir : dir;
    });
  }

  const estimatedTotalHits = results.length;
  const hits = results.slice(offset, offset + limit) as T[];

  const facets: Record<string, Record<string, number>> | undefined = options.facets?.length
    ? buildFacets(results, options.facets)
    : undefined;

  return {
    hits,
    query,
    processingTimeMs: Date.now() - start,
    estimatedTotalHits,
    facets,
  };
}

function buildFacets(
  docs: IndexedDoc[],
  facetAttributes: string[],
): Record<string, Record<string, number>> {
  const result: Record<string, Record<string, number>> = {};
  for (const attr of facetAttributes) {
    const counts: Record<string, number> = {};
    for (const doc of docs) {
      const val = String(doc[attr] ?? "unknown");
      counts[val] = (counts[val] ?? 0) + 1;
    }
    result[attr] = counts;
  }
  return result;
}

// ---------------------------------------------------------------------------
// Meilisearch HTTP adapter
// ---------------------------------------------------------------------------

function isMeilisearchConfigured(): boolean {
  return Boolean(process.env.MEILI_URL && process.env.MEILI_MASTER_KEY);
}

function meiliHeaders(): HeadersInit {
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${process.env.MEILI_MASTER_KEY}`,
  };
}

function meiliUrl(path: string): string {
  const base = (process.env.MEILI_URL ?? "").replace(/\/$/, "");
  return `${base}${path}`;
}

async function waitForMeiliTask(taskUid: number): Promise<void> {
  for (let i = 0; i < 30; i++) {
    const res = await fetch(meiliUrl(`/tasks/${taskUid}`), { headers: meiliHeaders() });
    if (!res.ok) return;
    const data = (await res.json()) as { status: string };
    if (data.status === "succeeded" || data.status === "failed") return;
    await new Promise((r) => setTimeout(r, 200));
  }
}

// ---------------------------------------------------------------------------
// Index management
// ---------------------------------------------------------------------------

export async function createIndex(index: SearchIndex): Promise<void> {
  if (isMeilisearchConfigured()) {
    const res = await fetch(meiliUrl("/indexes"), {
      method: "POST",
      headers: meiliHeaders(),
      body: JSON.stringify({ uid: index.name, primaryKey: index.primaryKey }),
    });

    if (!res.ok && res.status !== 409) {
      throw new Error(`Meilisearch createIndex failed: ${res.status}`);
    }

    if (res.ok) {
      const task = (await res.json()) as { taskUid: number };
      await waitForMeiliTask(task.taskUid);
    }

    // Configure settings
    const settingsRes = await fetch(meiliUrl(`/indexes/${index.name}/settings`), {
      method: "PATCH",
      headers: meiliHeaders(),
      body: JSON.stringify({
        searchableAttributes: index.searchableAttributes,
        filterableAttributes: index.filterableAttributes,
        sortableAttributes: index.sortableAttributes,
      }),
    });

    if (settingsRes.ok) {
      const settingsTask = (await settingsRes.json()) as { taskUid: number };
      await waitForMeiliTask(settingsTask.taskUid);
    }

    return;
  }

  // In-memory fallback
  inMemoryIndexes.set(index.name, {
    config: index,
    docs: inMemoryIndexes.get(index.name)?.docs ?? [],
  });
}

export async function deleteIndex(name: string): Promise<void> {
  if (isMeilisearchConfigured()) {
    await fetch(meiliUrl(`/indexes/${name}`), {
      method: "DELETE",
      headers: meiliHeaders(),
    });
    return;
  }

  inMemoryIndexes.delete(name);
}

export async function indexDocuments(
  indexName: string,
  documents: Record<string, unknown>[],
): Promise<{ indexed: number }> {
  if (!documents.length) return { indexed: 0 };

  if (isMeilisearchConfigured()) {
    const res = await fetch(meiliUrl(`/indexes/${indexName}/documents`), {
      method: "POST",
      headers: meiliHeaders(),
      body: JSON.stringify(documents),
    });

    if (!res.ok) {
      throw new Error(`Meilisearch indexDocuments failed: ${res.status}`);
    }

    const task = (await res.json()) as { taskUid: number };
    await waitForMeiliTask(task.taskUid);
    return { indexed: documents.length };
  }

  const index = getOrCreateInMemoryIndex(indexName);
  const { primaryKey } = index.config;

  for (const doc of documents) {
    const pk = doc[primaryKey];
    const existing = index.docs.findIndex((d) => d[primaryKey] === pk);
    if (existing >= 0) {
      index.docs[existing] = { ...index.docs[existing], ...doc };
    } else {
      index.docs.push(doc as IndexedDoc);
    }
  }

  return { indexed: documents.length };
}

// ---------------------------------------------------------------------------
// Search
// ---------------------------------------------------------------------------

export async function search<T>(
  indexName: string,
  query: string,
  options: SearchOptions = {},
): Promise<SearchResult<T>> {
  if (isMeilisearchConfigured()) {
    const start = Date.now();
    const body: Record<string, unknown> = {
      q: query,
      limit: options.limit ?? 20,
      offset: options.offset ?? 0,
    };
    if (options.filters) body.filter = options.filters;
    if (options.sort?.length) body.sort = options.sort;
    if (options.facets?.length) body.facets = options.facets;

    const res = await fetch(meiliUrl(`/indexes/${indexName}/search`), {
      method: "POST",
      headers: meiliHeaders(),
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      throw new Error(`Meilisearch search failed: ${res.status}`);
    }

    const data = (await res.json()) as {
      hits: T[];
      estimatedTotalHits?: number;
      totalHits?: number;
      facetDistribution?: Record<string, Record<string, number>>;
    };

    return {
      hits: data.hits,
      query,
      processingTimeMs: Date.now() - start,
      estimatedTotalHits: data.estimatedTotalHits ?? data.totalHits ?? data.hits.length,
      facets: data.facetDistribution,
    };
  }

  return inMemorySearch<T>(indexName, query, options);
}

// ---------------------------------------------------------------------------
// Lead OS index initialization and sync
// ---------------------------------------------------------------------------

export async function initializeLeadOSIndexes(): Promise<void> {
  await Promise.all(LEAD_OS_INDEXES.map(createIndex));
}

export async function syncLeadsToIndex(tenantId: string): Promise<{ indexed: number }> {
  const pool = getPool();
  if (!pool) {
    // No DB available; nothing to sync
    return { indexed: 0 };
  }

  const result = await pool.query(
    `SELECT
       id, tenant_id AS "tenantId", name, email, company, niche, source,
       status, score, created_at AS "createdAt", updated_at AS "updatedAt"
     FROM lead_os_leads
     WHERE tenant_id = $1
     ORDER BY updated_at DESC
     LIMIT 5000`,
    [tenantId],
  );

  if (!result.rows.length) return { indexed: 0 };

  return indexDocuments("leads", result.rows);
}

export async function syncContentToIndex(tenantId: string): Promise<{ indexed: number }> {
  const pool = getPool();
  if (!pool) return { indexed: 0 };

  try {
    const result = await pool.query(
      `SELECT
         id, tenant_id AS "tenantId", title, hook, angle, platform,
         status, type, created_at AS "createdAt"
       FROM lead_os_creative_jobs
       WHERE tenant_id = $1
       ORDER BY created_at DESC
       LIMIT 5000`,
      [tenantId],
    );

    if (!result.rows.length) return { indexed: 0 };

    return indexDocuments("content", result.rows);
  } catch {
    // Table may not exist in all deployments
    return { indexed: 0 };
  }
}

// ---------------------------------------------------------------------------
// Testing helper
// ---------------------------------------------------------------------------

export function resetSearchEngine(): void {
  inMemoryIndexes.clear();
}
