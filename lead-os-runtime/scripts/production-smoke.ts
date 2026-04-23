import { Pool } from "pg"
import { randomUUID } from "crypto"

interface SmokeAssertion {
  name: string
  ok: boolean
  detail?: unknown
}

function requiredEnv(name: string): string {
  const value = process.env[name]
  if (!value)
    throw new Error(`${name} is required for production smoke test`)
  return value
}

async function getJson(url: string, init?: RequestInit): Promise<Response> {
  return fetch(url, init)
}

async function assertHealth(baseUrl: string): Promise<SmokeAssertion> {
  const response = await getJson(`${baseUrl}/api/health`)
  if (!response.ok) return { name: "health", ok: false, detail: `status=${response.status}` }
  const json = await response.json() as { status?: string }
  return { name: "health", ok: json.status === "ok", detail: json }
}

async function assertDeepHealth(baseUrl: string): Promise<SmokeAssertion> {
  const response = await getJson(`${baseUrl}/api/health/deep`)
  if (!response.ok) return { name: "health-deep", ok: false, detail: `status=${response.status}` }
  const json = await response.json() as { status?: string; components?: { database?: string } }
  const databaseHealthy = json.components?.database === "healthy"
  return { name: "health-deep", ok: json.status === "ok" && databaseHealthy, detail: json }
}

async function createNode(baseUrl: string, authSecret: string): Promise<SmokeAssertion> {
  const response = await getJson(`${baseUrl}/api/operator/nodes`, {
    method: "GET",
    headers: {
      "x-auth-secret": authSecret,
    },
  })
  if (!response.ok) return { name: "create-node", ok: false, detail: `status=${response.status}` }
  const json = await response.json() as { success?: boolean }
  return { name: "create-node", ok: json.success === true, detail: json }
}

async function sendIntake(baseUrl: string): Promise<{
  assertion: SmokeAssertion
  leadKey: string | null
}> {
  const email = `smoke-${Date.now()}@example.com`
  const response = await getJson(`${baseUrl}/api/intake`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "idempotency-key": randomUUID(),
    },
    body: JSON.stringify({
      email,
      firstName: "Smoke",
      message: "Production smoke intake",
    }),
  })
  if (!response.ok) {
    return {
      assertion: { name: "intake", ok: false, detail: `status=${response.status}` },
      leadKey: null,
    }
  }
  const json = await response.json() as { success?: boolean; leadKey?: string }
  return {
    assertion: { name: "intake", ok: json.success === true, detail: json },
    leadKey: json.leadKey ?? null,
  }
}

async function verifyDb(databaseUrl: string, leadKey: string): Promise<SmokeAssertion> {
  const pool = new Pool({
    connectionString: databaseUrl,
    ssl: databaseUrl.includes("sslmode=disable") ? false : { rejectUnauthorized: false },
  })
  try {
    const lead = await pool.query(
      "SELECT lead_key FROM lead_os_leads WHERE lead_key = $1 LIMIT 1",
      [leadKey],
    )
    const workflow = await pool.query(
      "SELECT id FROM lead_os_workflow_runs WHERE lead_key = $1 LIMIT 1",
      [leadKey],
    )
    const delivery = await pool.query(
      "SELECT id FROM lead_os_provider_executions WHERE lead_key = $1 LIMIT 1",
      [leadKey],
    )
    const ok = lead.rows.length === 1 && workflow.rows.length >= 1 && delivery.rows.length >= 1
    return {
      name: "verify-db-state",
      ok,
      detail: {
        leadRows: lead.rows.length,
        assignmentRows: workflow.rows.length,
        deliveryRows: delivery.rows.length,
      },
    }
  } finally {
    await pool.end()
  }
}

async function run(): Promise<void> {
  const baseUrl = requiredEnv("LEAD_OS_SMOKE_BASE_URL").replace(/\/$/, "")
  const databaseUrl = requiredEnv("DATABASE_URL")
  const authSecret = requiredEnv("LEAD_OS_AUTH_SECRET")

  const assertions: SmokeAssertion[] = []
  assertions.push(await assertHealth(baseUrl))
  assertions.push(await assertDeepHealth(baseUrl))
  assertions.push(await createNode(baseUrl, authSecret))

  const intake = await sendIntake(baseUrl)
  assertions.push(intake.assertion)
  if (!intake.leadKey) {
    assertions.push({ name: "verify-db-state", ok: false, detail: "missing leadKey from intake response" })
  } else {
    assertions.push(await verifyDb(databaseUrl, intake.leadKey))
  }

  const failed = assertions.filter((item) => !item.ok)
  for (const assertion of assertions) {
    const prefix = assertion.ok ? "PASS" : "FAIL"
    console.log(`${prefix} ${assertion.name}`, assertion.detail ? JSON.stringify(assertion.detail) : "")
  }

  if (failed.length > 0) {
    process.exitCode = 1
    throw new Error(`Production smoke failed (${failed.length} assertions)`)
  }
}

void run()
