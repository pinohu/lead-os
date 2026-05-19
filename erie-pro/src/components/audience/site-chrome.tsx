// erie-pro/src/components/audience/site-chrome.tsx
"use client"

import { AudienceProvider } from "@/components/audience/audience-provider"
import { SiteHeaderNav } from "@/components/audience/site-header-nav"
import { ChatLauncher } from "@/components/chat/chat-launcher"

/** Client shell: pathname-aware audience + adaptive header. */
export function SiteChrome({ children }: { children: React.ReactNode }) {
  return (
    <AudienceProvider>
      <SiteHeaderNav />
      {children}
      <ChatLauncher />
    </AudienceProvider>
  )
}
