// erie-pro/src/components/audience/audience-provider.tsx
"use client"

import { createContext, useContext, useMemo } from "react"
import { usePathname } from "next/navigation"
import type { PageAudienceConfig } from "@/lib/audience-context"
import { resolveAudienceFromPathname } from "@/lib/page-audience-registry"

const AudienceContext = createContext<PageAudienceConfig | null>(null)

export function AudienceProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() ?? "/"
  const config = useMemo(() => resolveAudienceFromPathname(pathname), [pathname])

  return (
    <AudienceContext.Provider value={config}>{children}</AudienceContext.Provider>
  )
}

export function usePageAudience(): PageAudienceConfig {
  const config = useContext(AudienceContext)
  if (!config) {
    return resolveAudienceFromPathname("/")
  }
  return config
}
