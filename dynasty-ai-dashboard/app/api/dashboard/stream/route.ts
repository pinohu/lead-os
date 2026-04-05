import { type NextRequest } from "next/server"
import { fetchAgentActivity, fetchCosts } from "@/lib/relay-client"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function GET(request: NextRequest) {
  const encoder = new TextEncoder()

  const stream = new ReadableStream({
    async start(controller) {
      const sendUpdate = async () => {
        try {
          const [agents, costs] = await Promise.all([
            fetchAgentActivity(),
            fetchCosts(),
          ])

          const payload = {
            timestamp: new Date().toISOString(),
            agents: agents ?? { totalAgents: 0, activeNow: 0, agents: [] },
            costs: costs ?? { today: 0, thisMonth: 0, monthlyTarget: 300 },
          }

          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify(payload)}\n\n`)
          )
        } catch (error) {
          console.error("SSE update error:", error)
        }
      }

      await sendUpdate()

      const interval = setInterval(sendUpdate, 5000)

      request.signal.addEventListener("abort", () => {
        clearInterval(interval)
        controller.close()
      })
    },
  })

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  })
}
