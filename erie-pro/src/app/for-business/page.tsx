import type { Metadata } from "next"
import { cityConfig } from "@/lib/city-config"
import { ForBusinessContent } from "@/components/for-business-content"

export const metadata: Metadata = {
  title: `For Businesses -- Claim Your Territory in ${cityConfig.name}`,
  description: `Own your category in ${cityConfig.name}, ${cityConfig.stateCode}. Every lead goes exclusively to you. One provider per niche. Choose Standard, Premium, or Elite.`,
}

export default function ForBusinessPage() {
  return <ForBusinessContent />
}
