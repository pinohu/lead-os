// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface AdapterConfig {
  apiKey: string;
  baseUrl: string;
}

export interface HealthCheckResult {
  ok: boolean;
  message: string;
}

// ---------------------------------------------------------------------------
// Base adapter class
// ---------------------------------------------------------------------------

/**
 * Abstract base class for third-party integration adapters.
 *
 * Concrete adapters extend this class and implement their own domain-specific
 * methods. The base provides:
 * - Config resolution from environment variables with optional overrides.
 * - Dry-run detection (when no API key is configured, all writes are local).
 * - A standard health-check that probes the upstream `/account` endpoint.
 * - A protected `fetchApi` helper that attaches `Authorization` headers and
 *   throws a descriptive error on non-2xx responses.
 * - An in-memory `store` Map for dry-run / test state.
 *
 * @typeParam TConfig - Adapter-specific config shape extending `AdapterConfig`.
 */
export class BaseAdapter<
  TConfig extends AdapterConfig = AdapterConfig,
> {
  protected store = new Map<string, unknown>();
  protected readonly name: string;
  protected readonly envPrefix: string;
  protected readonly defaultBaseUrl: string;

  /**
   * @param name - Human-readable adapter name used in error messages.
   * @param envPrefix - Prefix for environment variable lookup
   *   (e.g. `"ACTIVEPIECES"` resolves `ACTIVEPIECES_API_KEY` and
   *   `ACTIVEPIECES_BASE_URL`).
   * @param defaultBaseUrl - Fallback base URL when the env var is absent.
   */
  constructor(name: string, envPrefix: string, defaultBaseUrl: string) {
    this.name = name;
    this.envPrefix = envPrefix;
    this.defaultBaseUrl = defaultBaseUrl;
  }

  /**
   * Merges caller-supplied overrides with environment-variable defaults.
   * Returns a fully resolved config object ready for use in API calls.
   *
   * @param config - Partial overrides. Any missing keys fall back to env vars.
   */
  resolveConfig(config?: Partial<TConfig>): TConfig {
    return {
      apiKey: config?.apiKey ?? process.env[`${this.envPrefix}_API_KEY`] ?? "",
      baseUrl:
        config?.baseUrl ??
        process.env[`${this.envPrefix}_BASE_URL`] ??
        this.defaultBaseUrl,
    } as TConfig;
  }

  /**
   * Returns `true` when no API key is configured. In dry-run mode adapters
   * mutate the local `store` only and skip all outbound HTTP calls.
   *
   * @param config - Optional partial config to check.
   */
  isDryRun(config?: Partial<TConfig>): boolean {
    return !this.resolveConfig(config).apiKey;
  }

  /**
   * Probes the upstream service to verify connectivity and credential validity.
   * Returns `{ ok: false }` instead of throwing so callers can surface the
   * result without try/catch.
   *
   * @param config - Optional partial config override.
   */
  async healthCheck(config?: Partial<TConfig>): Promise<HealthCheckResult> {
    const cfg = this.resolveConfig(config);
    if (!cfg.apiKey) {
      return { ok: false, message: `${this.name} API key not configured` };
    }
    try {
      const res = await fetch(`${cfg.baseUrl}/account`, {
        headers: { Authorization: `Bearer ${cfg.apiKey}` },
      });
      return res.ok
        ? { ok: true, message: `${this.name} connection verified` }
        : { ok: false, message: `${this.name} returned ${res.status}` };
    } catch (err) {
      return {
        ok: false,
        message: err instanceof Error ? err.message : "Connection failed",
      };
    }
  }

  /** Clears the in-memory store. Useful between tests or when resetting state. */
  resetStore(): void {
    this.store.clear();
  }

  /**
   * Generates a namespaced UUID suitable for use as an in-memory record ID.
   *
   * @param prefix - Short string prepended to the UUID (e.g. `"flow"`).
   */
  protected generateId(prefix: string): string {
    return `${prefix}_${crypto.randomUUID()}`;
  }

  /**
   * Performs an authenticated HTTP request against the upstream API.
   * Attaches `Content-Type: application/json` and `Authorization: Bearer`
   * headers automatically. Throws a descriptive `Error` on non-2xx responses.
   *
   * @typeParam T - Expected JSON response shape.
   * @param config - Fully resolved adapter config.
   * @param path - API path (e.g. `"/api/v1/flows"`).
   * @param options - Standard `RequestInit` options merged with auth headers.
   */
  protected async fetchApi<T>(
    config: TConfig,
    path: string,
    options: RequestInit = {},
  ): Promise<T> {
    const res = await fetch(`${config.baseUrl}${path}`, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${config.apiKey}`,
        ...options.headers,
      },
    });
    if (!res.ok) {
      throw new Error(
        `${this.name} API error: ${res.status} ${res.statusText}`,
      );
    }
    return res.json() as Promise<T>;
  }
}

// ---------------------------------------------------------------------------
// Bounded array factory
// ---------------------------------------------------------------------------

/**
 * Creates a fixed-capacity array that evicts the oldest entries once `maxSize`
 * is exceeded. Use this instead of a bare `T[]` for stores that accumulate
 * events or log entries over the lifetime of the process.
 *
 * @param maxSize - Maximum number of items to retain.
 *
 * @example
 * const runHistory = createBoundedArray<FlowRun>(10_000);
 * runHistory.push(run);
 * const all = runHistory.getAll();
 */
export function createBoundedArray<T>(maxSize: number): {
  items: T[];
  push: (item: T) => void;
  getAll: () => T[];
  clear: () => void;
} {
  const items: T[] = [];
  return {
    items,
    push(item: T) {
      items.push(item);
      if (items.length > maxSize) {
        items.splice(0, items.length - maxSize);
      }
    },
    getAll: () => [...items],
    clear: () => {
      items.length = 0;
    },
  };
}
