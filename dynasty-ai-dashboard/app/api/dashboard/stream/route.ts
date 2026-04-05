import { type NextRequest } from "next/server"
import { fetchAgentActivity, fetchCosts } from "@/lib/relay-client"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

const UPDATE_INTERVAL_MS = 5000
const HEARTBEAT_INTERVAL_MS = 15000

export async function GET(request: NextRequest) {
  const encoder = new TextEncoder()

  const stream = new ReadableStream({
    async start(controller) {
      let stopped = false

      const sendUpdate = async () => {
        if (stopped) return
        try {
          const [agents, costs] = await Promise.allSettled([
            fetchAgentActivity(),
            fetchCosts(),
          ])

          const payload = {
            timestamp: new Date().toISOString(),
            agents:
              agents.status === "fulfilled" && agents.value
                ? agents.value
                : { totalAgents: 0, activeNow: 0, agents: [], lastUpdate: new Date().toISOString() },
            costs:
              costs.status === "fulfilled" && costs.value
                ? costs.value
                : { today: 0, thisMonth: 0, monthlyTarget: 300 },
          }

          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify(payload)}\n\n`)
          )
        } catch (error) {
          console.error("SSE update error:", error)
        }

        if (!stopped) {
          setTimeout(sendUpdate, UPDATE_INTERVAL_MS)
        }
      }

      const sendHeartbeat = () => {
        if (stopped) return
        try {
          controller.enqueue(encoder.encode(`:heartbeat\n\n`))
        } catch {
          // Stream closed
        }
        if (!stopped) {
          setTimeout(sendHeartbeat, HEARTBEAT_INTERVAL_MS)
        }
      }

      await sendUpdate()
      setTimeout(sendHeartbeat, HEARTBEAT_INTERVAL_MS)

      request.signal.addEventListener("abort", () => {
        stopped = true
        try {
          controller.close()
        } catch {
          // Already closed
        }
      })
    },
  })

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  })
}
