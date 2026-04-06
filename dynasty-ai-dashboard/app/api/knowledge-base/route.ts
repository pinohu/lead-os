import { NextResponse } from "next/server"
import { readdir, readFile, realpath } from "fs/promises"
import { join, resolve, normalize } from "path"

export const dynamic = "force-dynamic"

function getMemoryBasePath(): string {
  const base = process.env.KNOWLEDGE_BASE_PATH
  if (base) return resolve(base)
  const home = process.env.HOME ?? "/home/user"
  return resolve(join(home, "clawd"))
}

function isSafePath(base: string, target: string): boolean {
  const normalizedBase = normalize(base)
  const normalizedTarget = normalize(target)
  return normalizedTarget.startsWith(normalizedBase)
}

export async function GET() {
  try {
    const clawdDir = getMemoryBasePath()
    const memoryDir = join(clawdDir, "memory")

    let memoryContent = ""
    try {
      const memoryPath = join(clawdDir, "MEMORY.md")
      const resolved = await realpath(memoryPath).catch(() => memoryPath)
      if (isSafePath(clawdDir, resolved)) {
        memoryContent = await readFile(resolved, "utf-8")
      } else {
        memoryContent = "Access denied"
      }
    } catch {
      memoryContent = "No MEMORY.md found"
    }

    const dailyMemories: Record<string, string> = {}
    try {
      const files = await readdir(memoryDir)
      const datePattern = /^\d{4}-\d{2}-\d{2}\.md$/
      const sortedFiles = files
        .filter((f) => datePattern.test(f))
        .sort()
        .reverse()
        .slice(0, 7)

      for (const file of sortedFiles) {
        const filePath = join(memoryDir, file)
        const resolved = await realpath(filePath).catch(() => filePath)
        if (!isSafePath(clawdDir, resolved)) continue
        try {
          const content = await readFile(resolved, "utf-8")
          dailyMemories[file] = content.substring(0, 500)
        } catch {
          // Skip unreadable files
        }
      }
    } catch {
      // Memory directory may not exist
    }

    return NextResponse.json({
      sections: [
        {
          title: "Long-Term Memory",
          description: "Curated decisions, lessons, and strategic context",
          content: memoryContent.substring(0, 1000),
          fullPath: "MEMORY.md",
        },
        {
          title: "Daily Logs",
          description: "Recent activity and task completions",
          entries: Object.entries(dailyMemories).map(([date, content]) => ({
            date,
            preview: content,
          })),
        },
        {
          title: "Governance & Rules",
          description: "DEOS policies, autonomy levels, escalation paths",
        },
        {
          title: "Agent Capabilities",
          description: "What each specialist agent does",
        },
        {
          title: "Procedures & Standards",
          description: "Conversion standards, deployment protocols, quality gates",
        },
      ],
      stats: {
        totalEntries: Object.keys(dailyMemories).length + 1,
        lastUpdated: new Date().toISOString(),
      },
    })
  } catch (error) {
    console.error("Knowledge base fetch error:", error)
    return NextResponse.json(
      { error: "Could not fetch knowledge base", sections: [], stats: { totalEntries: 0, lastUpdated: new Date().toISOString() } },
      { status: 500 }
    )
  }
}
