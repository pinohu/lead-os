import { NextResponse } from "next/server"
import {
  fetchServiceHealth,
  getServiceEndpoints,
  type ServiceEndpoint,
} from "@/lib/relay-client"

export const dynamic = "force-dynamic"

const DEFAULT_SERVICES: ServiceEndpoint[] = [
  { name: "Dashboard", url: "http://localhost:3000", timeout: 2000 },
]

export async function GET() {
  const configured = getServiceEndpoints()
  const services = configured.length > 0 ? configured : DEFAULT_SERVICES

  const results = await Promise.allSettled(
    services.map(async (service) => {
      const { ok, latency } = await fetchServiceHealth(
        service.url,
        service.timeout
      )
      return {
        name: service.name,
        status: ok ? ("online" as const) : ("offline" as const),
        latency,
        timestamp: new Date().toISOString(),
      }
    })
  )

  const resolved = results.map((r) =>
    r.status === "fulfilled"
      ? r.value
      : { name: "Unknown", status: "offline" as const, latency: null, timestamp: new Date().toISOString() }
  )

  const onlineCount = resolved.filter((s) => s.status === "online").length

  return NextResponse.json({
    status: onlineCount === resolved.length ? "all-healthy" : "degraded",
    onlineCount,
    totalCount: resolved.length,
    services: resolved,
    timestamp: new Date().toISOString(),
  })
}
