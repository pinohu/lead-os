import type { Metadata } from "next"
import { getNicheBySlug } from "@/lib/niches"
import { getNicheContent } from "@/lib/niche-content"
import { cityConfig } from "@/lib/city-config"

type Props = { params: Promise<{ niche: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { niche: slug } = await params
  const niche = getNicheBySlug(slug)
  const content = getNicheContent(slug)
  if (!niche || !content) return { title: "Not Found" }
  return {
    title: `${niche.label} Hiring Checklist for ${cityConfig.name} Homeowners`,
    description: `Interactive checklist for hiring a ${niche.label.toLowerCase()} provider in ${cityConfig.name}, ${cityConfig.stateCode}. Verify licenses, insurance, estimates, and warranties before signing.`,
    alternates: { canonical: `https://erie.pro/${slug}/checklist` },
  }
}

export default function ChecklistLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
