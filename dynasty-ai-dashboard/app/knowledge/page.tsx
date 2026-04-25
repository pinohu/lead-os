"use client"

import { useEffect, useState, useCallback } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"

interface KBSection {
  title: string
  description: string
  content?: string
  fullPath?: string
  entries?: Array<{ date: string; preview: string }>
}

interface KBResponse {
  sections: KBSection[]
  stats: { totalEntries: number; lastUpdated: string }
}

export default function KnowledgeBasePage() {
  const { status } = useSession()
  const router = useRouter()
  const [data, setData] = useState<KBResponse | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [expandedSection, setExpandedSection] = useState<string | null>(null)

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/knowledge-base")
      if (res.ok) setData(await res.json())
    } catch {
      // Failed
    }
    setIsLoading(false)
  }, [])

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/signin")
      return
    }
    if (status === "authenticated") load()
  }, [status, router, load])

  if (status === "loading" || isLoading) {
    return (
      <div className="p-8" role="status" aria-label="Loading knowledge base">
        <div className="animate-pulse space-y-4">
          <div className="h-8 w-56 bg-gray-800 rounded" />
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-24 bg-gray-800 rounded-lg" />
          ))}
        </div>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="p-8">
        <p className="text-gray-400">Failed to load knowledge base.</p>
      </div>
    )
  }

  return (
    <main className="p-8 max-w-4xl" role="main">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold text-white">Knowledge Base</h1>
        <p className="text-sm text-gray-400">
          {data.stats.totalEntries} entries
        </p>
      </div>

      <div className="space-y-4">
        {data.sections.map((section) => (
          <div
            key={section.title}
            className="bg-gray-900 border border-gray-800 rounded-lg overflow-hidden"
          >
            <button
              onClick={() =>
                setExpandedSection(
                  expandedSection === section.title ? null : section.title
                )
              }
              aria-expanded={expandedSection === section.title}
              className="w-full text-left p-5 flex items-center justify-between hover:bg-gray-800/50 transition-colors"
            >
              <div>
                <h2 className="font-semibold text-white">{section.title}</h2>
                <p className="text-sm text-gray-400 mt-0.5">
                  {section.description}
                </p>
              </div>
              <span className="text-gray-500 text-xl" aria-hidden="true">
                {expandedSection === section.title ? "\u2212" : "+"}
              </span>
            </button>

            {expandedSection === section.title && (
              <div className="border-t border-gray-800 p-5">
                {section.content && (
                  <pre className="text-sm text-gray-300 whitespace-pre-wrap font-mono">
                    {section.content}
                  </pre>
                )}

                {section.entries && section.entries.length > 0 && (
                  <div className="space-y-3">
                    {section.entries.map((entry) => (
                      <div key={entry.date} className="bg-gray-800 rounded p-3">
                        <p className="text-xs font-medium text-gray-400 mb-1">
                          {entry.date}
                        </p>
                        <p className="text-sm text-gray-300 whitespace-pre-wrap">
                          {entry.preview}
                        </p>
                      </div>
                    ))}
                  </div>
                )}

                {!section.content && (!section.entries || section.entries.length === 0) && (
                  <p className="text-sm text-gray-500 italic">
                    No content available for this section.
                  </p>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </main>
  )
}
