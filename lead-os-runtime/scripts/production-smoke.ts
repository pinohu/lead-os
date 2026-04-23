import { randomUUID } from "crypto"
import { Pool } from "pg"
import { createApiKey, createUser, getUserByEmail } from "../src/lib/auth-system.ts"

interface SmokeAssertion {
  name: string
  ok: boolean
  detail?: unknown
}

function requiredEnv(name: string): string {
  const value = process.env[name]
  if (!value) throw new Error(`${name} is required for production smoke test`)
  return value
}

async function getJson(url: string, init?: RequestInit): Promise<Response> {
  return fetch(url, init)
}

async function assertHealth(baseUrl: string): Promise<SmokeAssertion> {
  const response = await getJson(`${baseUrl}/api/health`)
  if (!response.ok) return { name: "health", ok: false, detail: `status=${response.status}` }
  const json = (await response.json()) as { status?: string }
  return { name: "health", ok: json.status === "ok", detail: json }
}

async function assertDeepHealth(baseUrl: string): Promise<SmokeAssertion> {
  const response = await getJson(`${baseUrl}/api/health/deep`)
  if (!response.ok) return { name: "health-deep", ok: false, detail: `status=${response.status}` }
  const json = (await response.json()) as { status?: string; components?: { database?: string } }
  return {
    name: "health-deep",
    ok: json.status === "ok" && json.components?.database === "healthy",
    detail: json,
  }
}

async function createNode(
  baseUrl: string,
  tenantId: string,
  operatorApiKey: string,
): Promise<SmokeAssertion> {
  const response = await getJson(`${baseUrl}/api/operator/nodes`, {
    method: "GET",
    headers: {
      "x-api-key": operatorApiKey,
      "x-tenant-id": tenantId,
    },
  })
  if (!response.ok) return { name: "create-node", ok: false, detail: `status=${response.status}` }
  const json = (await response.json()) as { success?: boolean }
  return { name: "create-node", ok: json.success === true, detail: json }
}

async function ensureSmokeOperatorApiKey(
  tenantId: string,
  operatorEmail: string,
): Promise<string> {
  const normalizedEmail = operatorEmail.trim().toLowerCase()
  const existingUser = await getUserByEmail(normalizedEmail, tenantId)
  const user =
    existingUser ??
    (await createUser({
      email: normalizedEmail,
      name: "Production Smoke Operator",
      tenantId,
      role: "owner",
      status: "active",
    }))

  const apiKey = await createApiKey(user.id, "production-smoke", ["*"])
  if (!apiKey) throw new Error("Unable to create smoke-test operator API key")
  return apiKey.rawKey
}

async function sendIntake(baseUrl: string, tenantId: string): Promise<{
  assertion: SmokeAssertion
  leadKey: string | null
  email: string | null
}> {
  const email = `smoke-${Date.now()}@example.com`
  const response = await getJson(`${baseUrl}/api/intake`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "idempotency-key": randomUUID(),
      "x-tenant-id": tenantId,
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
      email: null,
    }
  }

  const json = (await response.json()) as {
    success?: boolean
    leadKey?: string
    id?: number
  }

  return {
    assertion: { name: "intake", ok: json.success === true, detail: json },
    leadKey: json.leadKey ?? null,
    email,
  }
}

async function verifyDb(databaseUrl: string, leadKey: string, email: string): Promise<SmokeAssertion> {
  const pool = new Pool({
    connectionString: databaseUrl,
    ssl: databaseUrl.includes("sslmode=disable") ? false : { rejectUnauthorized: false },
  })

  try {
    const lead = await pool.query(
      "SELECT lead_key FROM lead_os_leads WHERE lead_key = $1 LIMIT 1",
      [leadKey],
    )
    const legacyLead = await pool.query(
      "SELECT id FROM leads WHERE lower(email) = $1 LIMIT 1",
      [email.toLowerCase()],
    )
    const workflow = await pool.query(
      "SELECT id FROM lead_os_workflow_runs WHERE lead_key = $1 LIMIT 1",
      [leadKey],
    )
    const delivery = await pool.query(
      "SELECT id FROM lead_os_provider_executions WHERE lead_key = $1 LIMIT 1",
      [leadKey],
    )

    const ok =
      (lead.rows.length === 1 || legacyLead.rows.length === 1) &&
      workflow.rows.length >= 1 &&
      delivery.rows.length >= 1

    return {
      name: "verify-db-state",
      ok,
      detail: {
        leadRows: lead.rows.length,
        legacyLeadRows: legacyLead.rows.length,
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
  requiredEnv("LEAD_OS_AUTH_SECRET")
  const tenantId = process.env.LEAD_OS_SMOKE_TENANT_ID?.trim() || "default-tenant"
  const operatorEmail = process.env.LEAD_OS_SMOKE_OPERATOR_EMAIL?.trim() || "smoke-operator@leados.local"
  const operatorApiKey = await ensureSmokeOperatorApiKey(tenantId, operatorEmail)

  const assertions: SmokeAssertion[] = []
  assertions.push(await assertHealth(baseUrl))
  assertions.push(await assertDeepHealth(baseUrl))
  assertions.push(await createNode(baseUrl, tenantId, operatorApiKey))

  const intake = await sendIntake(baseUrl, tenantId)
  assertions.push(intake.assertion)

  if (!intake.leadKey || !intake.email) {
    assertions.push({
      name: "verify-db-state",
      ok: false,
      detail: "missing lead identity from intake response",
    })
  } else {
    assertions.push(await verifyDb(databaseUrl, intake.leadKey, intake.email))
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
