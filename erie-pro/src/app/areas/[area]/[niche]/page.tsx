// erie-pro/src/app/areas/[area]/[niche]/page.tsx — legacy URL; canonical is /[niche]/areas/[area]
import { permanentRedirect } from "next/navigation"
import { getAreaNicheCanonicalPath } from "@/lib/area-niche-urls"
import { getAreaNicheStaticParams } from "@/lib/seo-matrix"

type Props = { params: Promise<{ area: string; niche: string }> }

export function generateStaticParams() {
  return getAreaNicheStaticParams()
}

export default async function LegacyAreaNicheMatrixRedirect({ params }: Props) {
  const { area, niche } = await params
  permanentRedirect(getAreaNicheCanonicalPath(niche, area))
}
