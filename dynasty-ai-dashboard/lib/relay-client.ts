interface RelayRequestOptions {
  timeout?: number
}

const DEFAULT_TIMEOUT = 5000

async function fetchWithTimeout(
  url: string,
  options: RelayRequestOptions = {}
): Promise<Response> {
  const { timeout = DEFAULT_TIMEOUT } = options
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeout)

  try {
    const response = await fetch(url, { signal: controller.signal })
    return response
  } finally {
    clearTimeout(timer)
  }
}

function getRelayUrl(): string {
  return process.env.API_RELAY_URL ?? "http://localhost:9001"
}

interface CacheEntry<T> {
  data: T
  expiresAt: number
}

const cache = new Map<string, CacheEntry<unknown>>()
const CACHE_TTL_MS = 10_000

function getCached<T>(key: string): T | null {
  const entry = cache.get(key)
  if (!entry) return null
  if (Date.now() > entry.expiresAt) {
    cache.delete(key)
    return null
  }
  return entry.data as T
}

function setCache<T>(key: string, data: T): void {
  cache.set(key, { data, expiresAt: Date.now() + CACHE_TTL_MS })
}

export async function fetchAgentActivity(): Promise<AgentActivityResponse | null> {
  const cached = getCached<AgentActivityResponse>("agents")
  if (cached) return cached

  try {
    const res = await fetchWithTimeout(`${getRelayUrl()}/api/agents/activity`)
    if (res.ok) {
      const data = (await res.json()) as AgentActivityResponse
      setCache("agents", data)
      return data
    }
  } catch {
    // Relay unavailable
  }
  return null
}

export async function fetchCosts(): Promise<CostResponse | null> {
  const cached = getCached<CostResponse>("costs")
  if (cached) return cached

  try {
    const res = await fetchWithTimeout(`${getRelayUrl()}/api/costs`)
    if (res.ok) {
      const data = (await res.json()) as CostResponse
      setCache("costs", data)
      return data
    }
  } catch {
    // Relay unavailable
  }
  return null
}

export async function fetchServiceHealth(
  url: string,
  timeout = 2000
): Promise<{ ok: boolean; latency: number }> {
  const start = performance.now()
  try {
    const res = await fetchWithTimeout(url, { timeout })
    const latency = Math.round(performance.now() - start)
    return { ok: res.ok || res.status < 500, latency }
  } catch {
    return { ok: false, latency: Math.round(performance.now() - start) }
  }
}

export interface AgentActivityResponse {
  totalAgents: number
  activeNow: number
  agents: AgentEntry[]
  lastUpdate: string
}

export interface AgentEntry {
  id: string
  name: string
  type: string
  status: "active" | "idle"
  lastActive: string
  model: string
  tokens: number
  tasks: number
  updated: string
}

export interface CostResponse {
  today: number
  thisMonth: number
  monthlyTarget: number
  savings?: number
  costBreakdown?: Record<string, number>
  dailyTrend?: Record<string, number>
}

export interface ServiceEntry {
  name: string
  status: "online" | "offline"
  latency: number | null
  timestamp: string
}

export interface ServiceStatusResponse {
  status: "all-healthy" | "degraded"
  onlineCount: number
  totalCount: number
  services: ServiceEntry[]
  timestamp: string
}

export interface ServiceEndpoint {
  name: string
  url: string
  timeout: number
}

export function getServiceEndpoints(): ServiceEndpoint[] {
  const raw = process.env.SERVICE_ENDPOINTS ?? ""
  if (!raw) return []

  return raw.split(",").map((entry) => {
    const firstColon = entry.indexOf(":")
    const name = entry.slice(0, firstColon)
    const fullUrl = entry.slice(firstColon + 1)
    return { name: name.trim(), url: fullUrl.trim(), timeout: 2000 }
  })
}
