"use client"

import { useEffect, useState } from "react"
import { getSession } from "next-auth/react"
import type { AgentActivityResponse, CostResponse } from "@/lib/relay-client"

interface DashboardData {
  timestamp: string
  agents: AgentActivityResponse
  costs: CostResponse
  source: string
}

interface ServiceItem {
  name: string
  status: "online" | "offline"
  latency: number | null
}

export default function Dashboard() {
  const [data, setData] = useState<DashboardData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [hasSession, setHasSession] = useState(false)

  useEffect(() => {
    async function load() {
      const session = await getSession()
      if (!session) {
        window.location.href = "/auth/signin"
        return
      }
      setHasSession(true)

      try {
        const res = await fetch("/api/dashboard")
        if (res.ok) {
          const dashData = (await res.json()) as DashboardData
          setData(dashData)
        }
      } catch (err) {
        console.error("Error loading dashboard:", err)
      }
      setIsLoading(false)
    }
    load()
  }, [])

  if (!hasSession) {
    return <div className="text-center mt-8">Authenticating...</div>
  }

  if (isLoading) {
    return <div className="text-center mt-8">Loading...</div>
  }

  const agents = data?.agents?.agents ?? []
  const costs = data?.costs

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-4xl font-bold mb-8">Dynasty AI Stack Dashboard</h1>

        {costs && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <h2 className="col-span-full text-2xl font-bold text-blue-400">
              Cost Tracking
            </h2>
            <div className="bg-gray-800 p-6 rounded border border-gray-700">
              <div className="text-gray-400">Today</div>
              <div className="text-3xl font-bold">${costs.today}</div>
            </div>
            <div className="bg-gray-800 p-6 rounded border border-gray-700">
              <div className="text-gray-400">This Month</div>
              <div className="text-3xl font-bold">${costs.thisMonth}</div>
            </div>
            <div className="bg-gray-800 p-6 rounded border border-gray-700">
              <div className="text-gray-400">Monthly Target</div>
              <div className="text-3xl font-bold">${costs.monthlyTarget}</div>
            </div>
          </div>
        )}

        {agents.length > 0 && (
          <div className="bg-gray-800 p-6 rounded border border-gray-700 mb-8">
            <h2 className="text-2xl font-bold text-purple-400 mb-4">
              Agent Activity
            </h2>
            <div className="space-y-2">
              {agents.slice(0, 10).map((agent) => (
                <div
                  key={agent.id}
                  className="flex justify-between items-center p-2 bg-gray-700 rounded"
                >
                  <div>
                    <div className="font-semibold">{agent.name}</div>
                    <div className="text-sm text-gray-400">
                      Last active: {agent.lastActive}
                    </div>
                  </div>
                  <div className="text-right">
                    <div
                      className={
                        agent.status === "active"
                          ? "text-green-400"
                          : "text-gray-500"
                      }
                    >
                      {agent.status === "active" ? "Active" : "Idle"}
                    </div>
                    <div className="text-sm text-gray-400">
                      {agent.tasks} tasks
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {agents.length === 0 && !costs && (
          <div className="text-center text-gray-500 mt-16">
            <p className="text-lg">No data available.</p>
            <p className="text-sm mt-2">
              Ensure the API relay is running and configured in your environment.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
