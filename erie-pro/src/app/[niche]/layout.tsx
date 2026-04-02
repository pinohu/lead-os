import { notFound } from "next/navigation"
import { getNicheBySlug } from "@/lib/niches"
import { NicheSubNav } from "@/components/niche-sub-nav"

type Props = {
  params: Promise<{ niche: string }>
  children: React.ReactNode
}

export default async function NicheLayout({ params, children }: Props) {
  const { niche } = await params
  const nicheData = getNicheBySlug(niche)

  // Don't render sub-nav for invalid niches — let the page handle 404
  if (!nicheData) return <>{children}</>

  return (
    <>
      <NicheSubNav niche={niche} />
      {children}
    </>
  )
}
