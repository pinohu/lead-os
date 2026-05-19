// erie-pro/src/lib/chatbot/orchestrator.ts

import { prisma } from "@/lib/db"
import { buildChatSystemPrompt } from "@/lib/chatbot/prompt-builder"
import { getPolicyForPersona } from "@/lib/chatbot/policies"
import {
  executeChatTool,
  getToolDefinitionsForPersona,
} from "@/lib/chatbot/tool-registry"
import { shouldBlockUngroundedStatusReply, sanitizeUserMessage } from "@/lib/chatbot/guardrails"
import { appendChatMessage, loadRecentMessages } from "@/lib/chatbot/memory"
import { runChatLlmTurn, type LlmMessage } from "@/lib/chatbot/llm"
import { recordChatAnalytics } from "@/lib/chatbot/analytics"
import type { ChatPersona } from "@/lib/chatbot/personas"
import type { ChatToolContext, ToolResult } from "@/lib/chatbot/tools/types"

function buildToolContext(session: {
  id: string
  persona: ChatPersona
  userId: string | null
  providerId: string | null
  serviceRequestId: string | null
  contextJson: unknown
}): ChatToolContext {
  const ctx = (session.contextJson ?? {}) as Record<string, unknown>
  return {
    persona: session.persona as ChatPersona,
    sessionId: session.id,
    userId: session.userId,
    providerId: session.providerId,
    serviceRequestId: session.serviceRequestId,
    statusToken: typeof ctx.statusToken === "string" ? ctx.statusToken : null,
    isAdmin:
      session.persona === "admin_operations" &&
      (ctx.isAdmin === true || ctx.isAdmin === "true"),
  }
}

function toLlmMessages(rows: Array<{ role: string; content: string }>): LlmMessage[] {
  const out: LlmMessage[] = []
  for (const r of rows) {
    if (r.role === "user") out.push({ role: "user", content: r.content })
    if (r.role === "assistant") out.push({ role: "assistant", content: r.content })
  }
  return out
}

function fallbackReply(persona: ChatPersona, userText: string): string {
  const lower = userText.toLowerCase()
  if (persona === "consumer_status" || /\bstatus\b/.test(lower)) {
    return "I can check your request status from our database, but I need your request ID and the access token from your confirmation email. You can also view the timeline on your request status page."
  }
  if (persona === "provider_growth") {
    return "I can help with provider plans and checkout links. Tell me your business goals (starter vs growth), or ask for a checkout URL for a specific plan."
  }
  return "I'm here to help. Ask a specific question and I'll use our system tools when needed — I won't guess about delivery or account status."
}

async function runToolLoop(
  session: {
    id: string
    persona: ChatPersona
    userId: string | null
    providerId: string | null
    serviceRequestId: string | null
    contextJson: unknown
  },
  userText: string,
): Promise<string> {
  const persona = session.persona as ChatPersona
  const policy = getPolicyForPersona(persona)
  const toolCtx = buildToolContext(session)
  const tools = getToolDefinitionsForPersona(persona)
  const context = (session.contextJson ?? {}) as Record<string, unknown>

  await appendChatMessage({ sessionId: session.id, role: "user", content: userText })

  const history = await loadRecentMessages(session.id, 24)
  const llmMessages = toLlmMessages(history)
  const systemPrompt = buildChatSystemPrompt(persona, context)

  let rounds = 0
  let toolsUsed = false
  let messages: LlmMessage[] = llmMessages

  while (rounds < policy.maxToolRounds) {
    rounds += 1
    const turn = await runChatLlmTurn({ systemPrompt, messages, tools })

    if (!turn) break

    if (turn.toolCalls.length === 0) {
      const draft = turn.text ?? fallbackReply(persona, userText)
      const blocked = shouldBlockUngroundedStatusReply(persona, userText, draft, toolsUsed)
      const finalText = blocked ?? draft
      await appendChatMessage({ sessionId: session.id, role: "assistant", content: finalText })
      return finalText
    }

    const assistantBlocks: LlmMessage = {
      role: "assistant",
      content: [
        ...(turn.text ? [{ type: "text" as const, text: turn.text }] : []),
        ...turn.toolCalls.map((tc) => ({
          type: "tool_use" as const,
          id: tc.id,
          name: tc.name,
          input: tc.input,
        })),
      ],
    }
    messages = [...messages, assistantBlocks]

    const toolResults: Array<{ type: "tool_result"; tool_use_id: string; content: string }> = []

    for (const tc of turn.toolCalls) {
      toolsUsed = true
      const action = await prisma.chatAction.create({
        data: {
          sessionId: session.id,
          toolName: tc.name,
          input: tc.input as object,
          status: "pending",
        },
      })

      const policyAllows = policy.allowedToolNames.includes(tc.name)
      const result: ToolResult = policyAllows
        ? ((await executeChatTool(tc.name, tc.input, toolCtx)) as ToolResult)
        : { ok: false, error: "Tool not allowed for this persona" }

      await prisma.chatAction.update({
        where: { id: action.id },
        data: {
          status: result.ok ? "completed" : "failed",
          output: result as object,
          error: result.ok ? null : result.error ?? "failed",
        },
      })

      await recordChatAnalytics({
        sessionId: session.id,
        persona,
        eventType: "tool_called",
        metadata: { toolName: tc.name, ok: result.ok },
      })

      toolResults.push({
        type: "tool_result",
        tool_use_id: tc.id,
        content: JSON.stringify(result),
      })
    }

    messages = [...messages, { role: "user", content: toolResults }]
  }

  const finalText = fallbackReply(persona, userText)
  await appendChatMessage({ sessionId: session.id, role: "assistant", content: finalText })
  return finalText
}

export async function handleChatMessage({
  sessionId,
  message,
}: {
  sessionId: string
  message: string
}) {
  const session = await prisma.chatSession.findUnique({ where: { id: sessionId } })
  if (!session || session.status !== "active") {
    throw new Error("session-not-found")
  }

  const userText = sanitizeUserMessage(message)
  if (!userText) throw new Error("empty-message")

  await recordChatAnalytics({
    sessionId,
    persona: session.persona as ChatPersona,
    eventType: "message_sent",
  })

  const reply = await runToolLoop(
    {
      id: session.id,
      persona: session.persona as ChatPersona,
      userId: session.userId,
      providerId: session.providerId,
      serviceRequestId: session.serviceRequestId,
      contextJson: session.contextJson,
    },
    userText,
  )

  return { reply }
}
