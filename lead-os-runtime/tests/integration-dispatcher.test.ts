import test from "node:test"
import assert from "node:assert/strict"
import { readFile } from "node:fs/promises"
import { withEnv } from "./test-helpers.ts"
import { callIntegration } from "../src/integrations/dispatcher.ts"

test("unauthorized integration is blocked", async () => {
  const result = await callIntegration({
    agent: "routing-agent",
    integration: "unknown-system",
    action: "post",
    payload: {},
  })
  assert.equal(result.ok, false)
  assert.equal(result.blocked, true)
  assert.equal(result.status, 403)
  assert.equal(result.data.error, "unknown_integration")
})

test("permission denied integration is blocked", async () => {
  const result = await callIntegration({
    agent: "pricing-agent",
    integration: "webhook",
    action: "post",
    payload: {},
  })
  assert.equal(result.ok, false)
  assert.equal(result.blocked, true)
  assert.equal(result.status, 403)
  assert.equal(result.data.error, "agent_permission_denied")
})

test("valid integration action succeeds with configured webhook", async () => {
  const restoreEnv = withEnv({
    EMAIL_WEBHOOK_API_KEY: "test-webhook-key",
  })
  const originalFetch = globalThis.fetch
  const logs: string[] = []
  const originalConsoleLog = console.log
  console.log = (...args: unknown[]) => {
    logs.push(args.map((item) => String(item)).join(" "))
  }
  globalThis.fetch = (async () =>
    new Response(JSON.stringify({ accepted: true }), {
      status: 200,
      headers: { "content-type": "application/json" },
    })) as typeof fetch
  try {
    const result = await callIntegration({
      agent: "routing-agent",
      integration: "webhook",
      action: "post",
      payload: {
        url: "https://example.com",
        body: { ok: true },
      },
    })
    assert.equal(result.blocked, undefined)
    assert.equal(result.status, 200)
    assert.equal(result.ok, true)
    assert.equal(
      logs.some((line) => line.includes("integration.dispatch.request")),
      true,
    )
    assert.equal(
      logs.some((line) => line.includes("integration.dispatch.response")),
      true,
    )
  } finally {
    globalThis.fetch = originalFetch
    console.log = originalConsoleLog
    restoreEnv()
  }
})

test("agent code cannot bypass dispatcher with fetch or raw env", async () => {
  const source = await readFile(
    new URL("../src/agents/action-engine.ts", import.meta.url),
    "utf8",
  )
  assert.equal(source.includes("fetch("), false)
  assert.equal(source.includes("process.env."), false)
  assert.equal(source.includes('from "@/integrations/dispatcher"'), true)
})
