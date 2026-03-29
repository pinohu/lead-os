/**
 * Simple generic LRU cache with optional TTL expiry.
 * Uses the native Map insertion-order guarantee for eviction.
 */

interface LruCacheOptions {
  maxSize?: number;
  ttlMs?: number;
}

interface CacheEntry<V> {
  value: V;
  expiresAt: number | null;
}

export class LruCache<K, V> {
  private readonly map = new Map<K, CacheEntry<V>>();
  private readonly maxSize: number;
  private readonly ttlMs: number | null;

  constructor(options: LruCacheOptions = {}) {
    this.maxSize = options.maxSize ?? 10_000;
    this.ttlMs = options.ttlMs ?? null;
  }

  get(key: K): V | undefined {
    const entry = this.map.get(key);
    if (!entry) return undefined;

    if (entry.expiresAt !== null && Date.now() > entry.expiresAt) {
      this.map.delete(key);
      return undefined;
    }

    // Move to end (most recently used)
    this.map.delete(key);
    this.map.set(key, entry);
    return entry.value;
  }

  set(key: K, value: V): void {
    // Remove old entry if exists (to refresh position)
    this.map.delete(key);

    // Evict oldest entry if at capacity
    if (this.map.size >= this.maxSize) {
      const oldest = this.map.keys().next().value;
      if (oldest !== undefined) {
        this.map.delete(oldest);
      }
    }

    this.map.set(key, {
      value,
      expiresAt: this.ttlMs ? Date.now() + this.ttlMs : null,
    });
  }

  has(key: K): boolean {
    const entry = this.map.get(key);
    if (!entry) return false;
    if (entry.expiresAt !== null && Date.now() > entry.expiresAt) {
      this.map.delete(key);
      return false;
    }
    return true;
  }

  delete(key: K): boolean {
    return this.map.delete(key);
  }

  clear(): void {
    this.map.clear();
  }

  get size(): number {
    return this.map.size;
  }

  keys(): IterableIterator<K> {
    return this.map.keys();
  }

  values(): V[] {
    const result: V[] = [];
    const now = Date.now();
    for (const [key, entry] of this.map) {
      if (entry.expiresAt !== null && now > entry.expiresAt) {
        this.map.delete(key);
        continue;
      }
      result.push(entry.value);
    }
    return result;
  }

  entries(): [K, V][] {
    const result: [K, V][] = [];
    const now = Date.now();
    for (const [key, entry] of this.map) {
      if (entry.expiresAt !== null && now > entry.expiresAt) {
        this.map.delete(key);
        continue;
      }
      result.push([key, entry.value]);
    }
    return result;
  }
}
