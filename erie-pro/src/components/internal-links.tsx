"use client"

import Link from "next/link"
import {
  getRelatedNiches,
  getCrossNicheLinks,
  getNicheContentLinks,
  getNicheLabel,
} from "@/lib/internal-linking"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

interface InternalLinksProps {
  niche: string;
  currentPage?: string;
}

export function InternalLinks({ niche, currentPage = "" }: InternalLinksProps) {
  const relatedNiches = getRelatedNiches(niche)
  const nicheContent = getNicheContentLinks(niche).filter(
    (link) => !link.href.endsWith(`/${currentPage}`)
  )
  const crossNicheLinks = getCrossNicheLinks(niche, currentPage)
  const nicheLabel = getNicheLabel(niche)

  return (
    <section className="border-t bg-muted/30 py-12">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="grid gap-8 md:grid-cols-3">
          {/* Related services */}
          <Card className="border-0 bg-transparent shadow-none">
            <CardHeader className="px-0 pb-3 pt-0">
              <CardTitle className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                Related Services in Erie
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-2 px-0">
              {relatedNiches.map((slug) => (
                <Link key={slug} href={`/${slug}`}>
                  <Badge
                    variant="secondary"
                    className="cursor-pointer transition-colors hover:bg-primary hover:text-primary-foreground"
                  >
                    {getNicheLabel(slug)}
                  </Badge>
                </Link>
              ))}
            </CardContent>
          </Card>

          {/* More niche resources */}
          <Card className="border-0 bg-transparent shadow-none">
            <CardHeader className="px-0 pb-3 pt-0">
              <CardTitle className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                More {nicheLabel} Resources
              </CardTitle>
            </CardHeader>
            <CardContent className="px-0">
              <ul className="space-y-1.5">
                {nicheContent.slice(0, 7).map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-sm text-foreground/80 transition-colors hover:text-primary hover:underline"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          {/* Similar guides in other niches */}
          {crossNicheLinks.length > 0 && (
            <Card className="border-0 bg-transparent shadow-none">
              <CardHeader className="px-0 pb-3 pt-0">
                <CardTitle className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                  {currentPage ? "Similar Guides" : "Explore Other Services"}
                </CardTitle>
              </CardHeader>
              <CardContent className="px-0">
                <ul className="space-y-1.5">
                  {crossNicheLinks.map((link) => (
                    <li key={link.href}>
                      <Link
                        href={link.href}
                        className="text-sm text-foreground/80 transition-colors hover:text-primary hover:underline"
                      >
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </section>
  )
}
