import { type NextRequest, NextResponse } from "next/server"

interface AlertSettings {
  costThreshold: number
  costAlertEnabled: boolean
  serviceDownAlertEnabled: boolean
  agentInactivityThreshold: number
}

interface MonitoringSettings {
  enableRealtime: boolean
  updateInterval: number
  retentionDays: number
  logLevel: string
}

interface AgentSettings {
  maxConcurrent: number
  defaultModel: string
  telemetryEnabled: boolean
}

interface AppSettings {
  alerts: AlertSettings
  monitoring: MonitoringSettings
  agents: AgentSettings
}

let settings: AppSettings = {
  alerts: {
    costThreshold: 300,
    costAlertEnabled: true,
    serviceDownAlertEnabled: true,
    agentInactivityThreshold: 3600000,
  },
  monitoring: {
    enableRealtime: true,
    updateInterval: 5000,
    retentionDays: 30,
    logLevel: "info",
  },
  agents: {
    maxConcurrent: 8,
    defaultModel: "claude-3-5-sonnet-20241022",
    telemetryEnabled: true,
  },
}

export async function GET() {
  return NextResponse.json({
    settings,
    lastUpdated: new Date().toISOString(),
  })
}

export async function POST(request: NextRequest) {
  const contentType = request.headers.get("content-type")
  if (!contentType?.includes("application/json")) {
    return NextResponse.json(
      { error: "Content-Type must be application/json" },
      { status: 415 }
    )
  }

  try {
    const body = (await request.json()) as Partial<AppSettings>

    if (body.alerts) {
      settings = { ...settings, alerts: { ...settings.alerts, ...body.alerts } }
    }
    if (body.monitoring) {
      settings = { ...settings, monitoring: { ...settings.monitoring, ...body.monitoring } }
    }
    if (body.agents) {
      settings = { ...settings, agents: { ...settings.agents, ...body.agents } }
    }

    return NextResponse.json({
      success: true,
      settings,
      lastUpdated: new Date().toISOString(),
    })
  } catch {
    return NextResponse.json(
      { error: "Failed to update settings" },
      { status: 400 }
    )
  }
}
