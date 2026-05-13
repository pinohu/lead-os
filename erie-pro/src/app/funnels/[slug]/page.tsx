import type { Metadata } from "next"
import { getFunnelBySlug, salesFunnels } from "@/lib/sales-funnels"
import FunnelLandingPage from "./landing/page"

type Props = {
  params: Promise<{ slug: string }>
  searchParams: Promise<{ service?: string }>
}

export function generateStaticParams() {
  return salesFunnels.map((funnel) => ({ slug: funnel.slug }))
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const funnel = getFunnelBySlug(slug)
  if (!funnel) return { title: "Page not found" }
  return {
    title: `${funnel.headline} | Erie.Pro`,
    description: funnel.subheadline,
  }
}

export default async function FunnelDetailPage({ params, searchParams }: Props) {
  const { slug } = await params
  const funnel = getFunnelBySlug(slug)
  if (!funnel) return null
  return <FunnelLandingPage params={Promise.resolve({ slug: funnel.slug })} searchParams={searchParams} />
}
