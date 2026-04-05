"use client"

import { useEffect, useState, useRef, useCallback } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import type {
  AgentActivityResponse,
  AgentEntry,
  CostResponse,
  ServiceStatusResponse,
  ServiceEntry,
} from "@/lib/relay-client"

interface DashboardData {
  timestamp: string
  agents: AgentActivityResponse
  costs: CostResponse
  source: string
}

type ConnectionStatus = "connecting" | "connected" | "disconnected" | "error"

export default function Dashboard() {
  const { status: sessionStatus } = useSession()
  const router = useRouter()

  const [data, setData] = useState<DashboardData | null>(null)
  const [services, setServices] = useState<ServiceStatusResponse | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [hasError, setHasError] = useState(false)
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>("connecting")
  const eventSourceRef = useRef<EventSource | null>(null)

  const connectSSE = useCallback(() => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close()
    }

    const es = new EventSource("/api/dashboard/stream")
    eventSourceRef.current = es

    es.onopen = () => setConnectionStatus("connected")

    es.onmessage = (event) => {
      try {
        const parsed = JSON.parse(event.data) as DashboardData
        setData(parsed)
        setIsLoading(false)
        setHasError(false)
      } catch {
        // Malformed SSE data
      }
    }

    es.onerror = () => {
      setConnectionStatus("error")
      es.close()
      setTimeout(connectSSE, 10_000)
    }
  }, [])

  const fetchServices = useCallback(async () => {
    try {
      const res = await fetch("/api/services/status")
      if (res.ok) {
        setServices((await res.json()) as ServiceStatusResponse)
      }
    } catch {
      // Service check failed silently
    }
  }, [])

  useEffect(() => {
    if (sessionStatus === "unauthenticated") {
      router.push("/auth/signin")
      return
    }
    if (sessionStatus !== "authenticated") return

    connectSSE()
    fetchServices()
    const serviceInterval = setInterval(fetchServices, 30_000)

    return () => {
      eventSourceRef.current?.close()
      clearInterval(serviceInterval)
    }
  }, [sessionStatus, router, connectSSE, fetchServices])

  const handleRetry = () => {
    setHasError(false)
    setIsLoading(true)
    connectSSE()
    fetchServices()
  }

  if (sessionStatus === "loading") {
    return (
      <div className="min-h-screen bg-gray-950 text-white flex items-center justify-center" role="status">
        <div className="text-center">
          <div className="inline-block w-8 h-8 border-4 border-blue-400 border-t-transparent rounded-full animate-spin mb-4" />
          <p className="text-gray-300" aria-live="polite">Authenticating...</p>
        </div>
      </div>
    )
  }

  if (sessionStatus === "unauthenticated") return null

  const agents = data?.agents?.agents ?? []
  const costs = data?.costs

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <a href="#main-content" className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:bg-blue-600 focus:text-white focus:px-4 focus:py-2 focus:rounded focus:z-50">
        Skip to main content
      </a>

      <header className="border-b border-gray-800 px-8 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <h1 className="text-2xl font-bold">Dynasty AI Dashboard</h1>
          <div className="flex items-center gap-3">
            <StatusBadge status={connectionStatus} />
          </div>
        </div>
      </header>

      <main id="main-content" className="max-w-7xl mx-auto p-8" role="main">
        {hasError && (
          <div className="bg-red-950 border border-red-800 rounded-lg p-4 mb-8" role="alert">
            <p className="text-red-200 font-medium">Failed to load dashboard data.</p>
            <button
              onClick={handleRetry}
              className="mt-2 text-sm text-red-300 underline hover:text-white focus:outline-none focus:ring-2 focus:ring-red-400 focus:ring-offset-2 focus:ring-offset-gray-950 rounded"
            >
              Retry
            </button>
          </div>
        )}

        {isLoading ? (
          <LoadingSkeleton />
        ) : (
          <>
            {services && <ServiceStatusPanel services={services} />}

            {costs && <CostPanel costs={costs} />}

            <AgentPanel agents={agents} />
          </>
        )}

        {!isLoading && agents.length === 0 && !costs && !services && (
          <div className="text-center text-gray-400 mt-16" role="status">
            <p className="text-lg font-medium">No data available</p>
            <p className="text-sm mt-2">
              Ensure the API relay is running and configured via <code className="bg-gray-800 px-1 rounded">API_RELAY_URL</code>.
            </p>
          </div>
        )}

        <div className="sr-only" aria-live="polite" aria-atomic="true">
          {data ? `Dashboard updated at ${data.timestamp}` : ""}
        </div>
      </main>
    </div>
  )
}

function StatusBadge({ status }: { status: ConnectionStatus }) {
  const labels: Record<ConnectionStatus, string> = {
    connecting: "Connecting",
    connected: "Live",
    disconnected: "Disconnected",
    error: "Reconnecting",
  }
  const colors: Record<ConnectionStatus, string> = {
    connecting: "bg-yellow-500",
    connected: "bg-green-500",
    disconnected: "bg-gray-500",
    error: "bg-red-500",
  }

  return (
    <span className="flex items-center gap-2 text-sm text-gray-300" role="status" aria-label={`Connection status: ${labels[status]}`}>
      <span className={`w-2 h-2 rounded-full ${colors[status]} ${status === "connected" ? "animate-pulse" : ""}`} aria-hidden="true" />
      {labels[status]}
    </span>
  )
}

function LoadingSkeleton() {
  return (
    <div className="space-y-8 animate-pulse" role="status" aria-label="Loading dashboard">
      <div>
        <div className="h-6 w-40 bg-gray-800 rounded mb-4" />
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-20 bg-gray-800 rounded-lg" />
          ))}
        </div>
      </div>
      <div>
        <div className="h-6 w-32 bg-gray-800 rounded mb-4" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-28 bg-gray-800 rounded-lg" />
          ))}
        </div>
      </div>
      <div>
        <div className="h-6 w-36 bg-gray-800 rounded mb-4" />
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-14 bg-gray-800 rounded-lg" />
          ))}
        </div>
      </div>
    </div>
  )
}

function ServiceStatusPanel({ services }: { services: ServiceStatusResponse }) {
  return (
    <section className="mb-8" aria-labelledby="services-heading">
      <h2 id="services-heading" className="text-xl font-bold text-gray-100 mb-4">
        Service Status
        <span className="ml-3 text-sm font-normal text-gray-400">
          {services.onlineCount}/{services.totalCount} online
        </span>
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {services.services.map((svc: ServiceEntry) => (
          <div
            key={svc.name}
            className="bg-gray-900 border border-gray-800 rounded-lg p-4 flex items-center justify-between"
          >
            <div>
              <p className="font-medium text-gray-100">{svc.name}</p>
              {svc.latency !== null && (
                <p className="text-sm text-gray-400">{svc.latency}ms</p>
              )}
            </div>
            <span
              className={`inline-flex items-center gap-1.5 text-sm font-medium ${
                svc.status === "online" ? "text-green-400" : "text-red-400"
              }`}
              role="status"
              aria-label={`${svc.name} is ${svc.status}`}
            >
              <span aria-hidden="true">{svc.status === "online" ? "\u25CF" : "\u25CB"}</span>
              {svc.status === "online" ? "Online" : "Offline"}
            </span>
          </div>
        ))}
      </div>
    </section>
  )
}

function CostPanel({ costs }: { costs: CostResponse }) {
  return (
    <section className="mb-8" aria-labelledby="costs-heading">
      <h2 id="costs-heading" className="text-xl font-bold text-gray-100 mb-4">
        Cost Tracking
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <CostCard label="Today" value={costs.today} />
        <CostCard label="This Month" value={costs.thisMonth} />
        <CostCard label="Monthly Target" value={costs.monthlyTarget} />
      </div>
    </section>
  )
}

function CostCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
      <p className="text-sm text-gray-300 mb-1">{label}</p>
      <p className="text-3xl font-bold text-white">${value.toFixed(2)}</p>
    </div>
  )
}

function AgentPanel({ agents }: { agents: AgentEntry[] }) {
  if (agents.length === 0) return null

  return (
    <section className="mb-8" aria-labelledby="agents-heading">
      <h2 id="agents-heading" className="text-xl font-bold text-gray-100 mb-4">
        Agent Activity
      </h2>
      <div className="space-y-2">
        {agents.slice(0, 15).map((agent) => (
          <div
            key={agent.id}
            className="bg-gray-900 border border-gray-800 rounded-lg p-3 flex items-center justify-between"
          >
            <div className="flex items-center gap-3">
              <span
                className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold ${
                  agent.status === "active"
                    ? "bg-green-900 text-green-300"
                    : "bg-gray-800 text-gray-400"
                }`}
                role="img"
                aria-label={agent.status === "active" ? "Active" : "Idle"}
              >
                {agent.status === "active" ? "\u2713" : "\u2014"}
              </span>
              <div>
                <p className="font-medium text-gray-100">{agent.name}</p>
                <p className="text-sm text-gray-400">Last active: {agent.lastActive}</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm font-medium text-gray-200">{agent.tasks} tasks</p>
              <p className="text-xs text-gray-500">{agent.model}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
