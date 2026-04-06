import { getPool } from "./db.ts";

const VALID_IDENTIFIER = /^[a-z_][a-z0-9_]*$/;

function assertValidIdentifier(name: string, label: string): void {
  if (!VALID_IDENTIFIER.test(name)) {
    throw new Error(`Invalid SQL identifier for ${label}: "${name}"`);
  }
}

export interface PersistentStoreOptions<T> {
  tableName: string;
  keyColumn?: string;
  valueColumn?: string;
  tenantColumn?: string;
  serialize?: (value: T) => string;
  deserialize?: (raw: string) => T;
  maxMemory?: number;
}

export class PersistentStore<T> {
  private memory = new Map<string, T>();
  private tableName: string;
  private keyCol: string;
  private valueCol: string;
  private tenantCol: string;
  private serialize: (value: T) => string;
  private deserialize: (raw: string) => T;
  private maxMemory: number;

  constructor(options: PersistentStoreOptions<T>) {
    this.tableName = options.tableName;
    this.keyCol = options.keyColumn ?? "key";
    this.valueCol = options.valueColumn ?? "value";
    this.tenantCol = options.tenantColumn ?? "tenant_id";
    assertValidIdentifier(this.tableName, "tableName");
    assertValidIdentifier(this.keyCol, "keyColumn");
    assertValidIdentifier(this.valueCol, "valueColumn");
    assertValidIdentifier(this.tenantCol, "tenantColumn");
    this.serialize = options.serialize ?? JSON.stringify;
    this.deserialize = options.deserialize ?? JSON.parse;
    this.maxMemory = options.maxMemory ?? 10000;
  }

  get(key: string): T | undefined {
    return this.memory.get(key);
  }

  set(key: string, value: T, tenantId?: string): void {
    this.memory.set(key, value);
    if (this.memory.size > this.maxMemory) {
      const firstKey = this.memory.keys().next().value;
      if (firstKey) this.memory.delete(firstKey);
    }
    // Write-through to Postgres (fire and forget)
    this.persist(key, value, tenantId).catch(() => {});
  }

  delete(key: string): boolean {
    const existed = this.memory.delete(key);
    this.unpersist(key).catch(() => {});
    return existed;
  }

  has(key: string): boolean {
    return this.memory.has(key);
  }

  get size(): number {
    return this.memory.size;
  }

  values(): T[] {
    return [...this.memory.values()];
  }

  entries(): [string, T][] {
    return [...this.memory.entries()];
  }

  clear(): void {
    this.memory.clear();
  }

  async loadFromDb(tenantId?: string): Promise<number> {
    try {
      const pool = getPool();
      if (!pool) return 0;
      const query = tenantId
        ? `SELECT ${this.keyCol}, ${this.valueCol} FROM ${this.tableName} WHERE ${this.tenantCol} = $1 ORDER BY created_at DESC LIMIT $2`
        : `SELECT ${this.keyCol}, ${this.valueCol} FROM ${this.tableName} ORDER BY created_at DESC LIMIT $1`;
      const params = tenantId ? [tenantId, this.maxMemory] : [this.maxMemory];
      const result = await pool.query(query, params);
      for (const row of result.rows) {
        try {
          this.memory.set(row[this.keyCol], this.deserialize(row[this.valueCol]));
        } catch { /* skip invalid rows */ }
      }
      return result.rows.length;
    } catch {
      return 0;
    }
  }

  private async persist(key: string, value: T, tenantId?: string): Promise<void> {
    try {
      const pool = getPool();
      if (!pool) return;
      const serialized = this.serialize(value);
      await pool.query(
        `INSERT INTO ${this.tableName} (${this.keyCol}, ${this.valueCol}, ${this.tenantCol}, created_at)
         VALUES ($1, $2, $3, NOW())
         ON CONFLICT (${this.keyCol}) DO UPDATE SET ${this.valueCol} = $2, created_at = NOW()`,
        [key, serialized, tenantId ?? "default"],
      );
    } catch { /* DB persistence failure must not break the store */ }
  }

  private async unpersist(key: string): Promise<void> {
    try {
      const pool = getPool();
      if (!pool) return;
      await pool.query(`DELETE FROM ${this.tableName} WHERE ${this.keyCol} = $1`, [key]);
    } catch { /* silent */ }
  }
}
