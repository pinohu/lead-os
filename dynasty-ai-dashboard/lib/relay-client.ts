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

export async function fetchAgentActivity(): Promise<AgentActivityResponse | null> {
  try {
    const res = await fetchWithTimeout(`${getRelayUrl()}/api/agents/activity`)
    if (res.ok) return (await res.json()) as AgentActivityResponse
  } catch {
    // Relay unavailable
  }
  return null
}

export async function fetchCosts(): Promise<CostResponse | null> {
  try {
    const res = await fetchWithTimeout(`${getRelayUrl()}/api/costs`)
    if (res.ok) return (await res.json()) as CostResponse
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

export interface AgentSession {
  sessionId: string
  key: string
  model: string
  totalTokens: number
  updatedAt: string
  kind?: string
  channel?: string
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

export interface ServiceEndpoint {
  name: string
  url: string
  timeout: number
}

export function getServiceEndpoints(): ServiceEndpoint[] {
  const raw = process.env.SERVICE_ENDPOINTS ?? ""
  if (!raw) return []

  return raw.split(",").map((entry) => {
    const [name, url] = entry.split(":")
    const fullUrl = entry.slice(name.length + 1)
    return { name: name.trim(), url: fullUrl.trim(), timeout: 2000 }
  })
}
