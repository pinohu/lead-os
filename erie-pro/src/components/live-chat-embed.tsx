// erie-pro/src/components/live-chat-embed.tsx
"use client"

import Script from "next/script"

/**
 * Optional third-party chat (Pickaxe, Crisp, etc.). Set NEXT_PUBLIC_CHAT_WIDGET_URL
 * to the vendor script URL. Erie primary capture remains ConvertBox.
 */
export function LiveChatEmbed() {
  const scriptUrl = process.env.NEXT_PUBLIC_CHAT_WIDGET_URL
  if (!scriptUrl) return null

  return <Script src={scriptUrl} strategy="lazyOnload" />
}
