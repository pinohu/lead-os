import { type NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { readFile, writeFile, mkdir } from "fs/promises"
import { join } from "path"

export const dynamic = "force-dynamic"

const alertsSchema = z.object({
  costThreshold: z.number().min(0).max(100_000).optional(),
  costAlertEnabled: z.boolean().optional(),
  serviceDownAlertEnabled: z.boolean().optional(),
  agentInactivityThreshold: z.number().min(0).max(86_400_000).optional(),
})

const monitoringSchema = z.object({
  enableRealtime: z.boolean().optional(),
  updateInterval: z.number().min(1_000).max(600_000).optional(),
  retentionDays: z.number().min(1).max(365).optional(),
  logLevel: z.enum(["debug", "info", "warn", "error"]).optional(),
})

const agentSchema = z.object({
  maxConcurrent: z.number().min(1).max(100).optional(),
  defaultModel: z.string().max(100).optional(),
  telemetryEnabled: z.boolean().optional(),
})

const settingsUpdateSchema = z.object({
  alerts: alertsSchema.optional(),
  monitoring: monitoringSchema.optional(),
  agents: agentSchema.optional(),
})

interface AppSettings {
  alerts: {
    costThreshold: number
    costAlertEnabled: boolean
    serviceDownAlertEnabled: boolean
    agentInactivityThreshold: number
  }
  monitoring: {
    enableRealtime: boolean
    updateInterval: number
    retentionDays: number
    logLevel: string
  }
  agents: {
    maxConcurrent: number
    defaultModel: string
    telemetryEnabled: boolean
  }
}

const DEFAULT_SETTINGS: AppSettings = {
  alerts: {
    costThreshold: 300,
    costAlertEnabled: true,
    serviceDownAlertEnabled: true,
    agentInactivityThreshold: 3_600_000,
  },
  monitoring: {
    enableRealtime: true,
    updateInterval: 5_000,
    retentionDays: 30,
    logLevel: "info",
  },
  agents: {
    maxConcurrent: 8,
    defaultModel: "claude-3-5-sonnet-20241022",
    telemetryEnabled: true,
  },
}

function getSettingsPath(): string {
  const dir = process.env.SETTINGS_DIR ?? join(process.cwd(), ".data")
  return join(dir, "settings.json")
}

async function loadSettings(): Promise<AppSettings> {
  try {
    const raw = await readFile(getSettingsPath(), "utf-8")
    const parsed = JSON.parse(raw) as AppSettings
    return { ...DEFAULT_SETTINGS, ...parsed }
  } catch {
    return { ...DEFAULT_SETTINGS }
  }
}

async function saveSettings(settings: AppSettings): Promise<void> {
  const filePath = getSettingsPath()
  const dir = filePath.slice(0, filePath.lastIndexOf("/"))
  await mkdir(dir, { recursive: true })
  await writeFile(filePath, JSON.stringify(settings, null, 2), "utf-8")
}

export async function GET() {
  const settings = await loadSettings()
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

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 })
  }

  const result = settingsUpdateSchema.safeParse(body)
  if (!result.success) {
    return NextResponse.json(
      { error: "Validation failed", details: result.error.flatten() },
      { status: 422 }
    )
  }

  try {
    const current = await loadSettings()
    const update = result.data

    if (update.alerts) {
      current.alerts = { ...current.alerts, ...update.alerts }
    }
    if (update.monitoring) {
      current.monitoring = { ...current.monitoring, ...update.monitoring }
    }
    if (update.agents) {
      current.agents = { ...current.agents, ...update.agents }
    }

    await saveSettings(current)

    return NextResponse.json({
      success: true,
      settings: current,
      lastUpdated: new Date().toISOString(),
    })
  } catch (error) {
    console.error("Settings save error:", error)
    return NextResponse.json(
      { error: "Failed to save settings" },
      { status: 500 }
    )
  }
}
