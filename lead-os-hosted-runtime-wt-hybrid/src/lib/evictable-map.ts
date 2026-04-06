const DEFAULT_MAX_SIZE = 10_000;
const DEFAULT_EVICTION_INTERVAL_MS = 120_000;

interface EvictableMapOptions {
  maxSize?: number;
  evictionIntervalMs?: number;
}

export class EvictableMap<K, V> extends Map<K, V> {
  private readonly maxSize: number;
  private readonly evictionIntervalMs: number;
  private lastEviction = Date.now();

  constructor(options?: EvictableMapOptions) {
    super();
    this.maxSize = options?.maxSize ?? DEFAULT_MAX_SIZE;
    this.evictionIntervalMs = options?.evictionIntervalMs ?? DEFAULT_EVICTION_INTERVAL_MS;
  }

  override set(key: K, value: V): this {
    this.maybeEvict();
    return super.set(key, value);
  }

  override get(key: K): V | undefined {
    this.maybeEvict();
    return super.get(key);
  }

  private maybeEvict() {
    if (this.size <= this.maxSize) return;
    const now = Date.now();
    if (now - this.lastEviction < this.evictionIntervalMs) return;
    this.lastEviction = now;

    const excess = this.size - Math.floor(this.maxSize * 0.8);
    if (excess <= 0) return;

    const iter = this.keys();
    for (let i = 0; i < excess; i++) {
      const next = iter.next();
      if (next.done) break;
      this.delete(next.value);
    }
  }
}
