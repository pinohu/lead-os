"use client"

import Link from "next/link"
import { Star, Phone, Shield, Award, CheckCircle2 } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { getPerkStatus } from "@/lib/perk-manager"
import { getProviderByNicheAndCity } from "@/lib/provider-store"
import {
  getBadgeLabel,
  getTierColor,
  type ProviderTier,
} from "@/lib/premium-rewards"

interface FeaturedProviderProps {
  niche: string
  city: string
}

export function FeaturedProvider({ niche, city }: FeaturedProviderProps) {
  // ── Perk-based check: is there an active subscription with featured badge? ──
  const perkStatus = getPerkStatus(niche, city)

  // No active subscription or no featured badge perk → don't render
  if (!perkStatus.subscriptionActive || !perkStatus.perks.featuredBadge) {
    return null
  }

  // Fetch the full provider profile for display details
  const provider = getProviderByNicheAndCity(niche, city)

  // Graceful handling: subscription is active in perk-manager but provider
  // record might have been removed or changed — don't crash, just skip
  if (!provider) return null

  const tier = perkStatus.tier as ProviderTier
  const badgeLabel = getBadgeLabel(tier)
  const badgeColors = getTierColor(tier)
  const isElite = tier === "elite"

  // If tier doesn't warrant a badge (standard), don't render
  if (!badgeLabel) return null

  return (
    <section className="mx-auto max-w-4xl px-4 pt-8 sm:px-6">
      <Card
        className={`relative overflow-hidden border-2 ${
          isElite
            ? "border-purple-400 dark:border-purple-600"
            : "border-amber-400 dark:border-amber-600"
        }`}
      >
        {/* Decorative gradient bar */}
        <div
          className={`absolute inset-x-0 top-0 h-1 ${
            isElite
              ? "bg-gradient-to-r from-purple-500 via-purple-400 to-indigo-500"
              : "bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-500"
          }`}
        />

        <CardContent className="flex flex-col gap-5 p-6 sm:flex-row sm:items-center sm:justify-between">
          {/* Left: Provider info */}
          <div className="flex-1 space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <Badge
                className={`text-xs font-semibold ${badgeColors}`}
              >
                {isElite ? (
                  <Award className="mr-1 h-3 w-3" />
                ) : (
                  <Shield className="mr-1 h-3 w-3" />
                )}
                {badgeLabel}
              </Badge>

              {/* Show extra perk indicators for elite */}
              {perkStatus.perks.nationalListing && (
                <Badge variant="outline" className="text-xs">
                  National Directory
                </Badge>
              )}
            </div>

            <h3 className="text-xl font-bold tracking-tight">
              {provider.businessName}
            </h3>

            <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
              {provider.avgRating > 0 && (
                <span className="flex items-center gap-1">
                  <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                  <span className="font-semibold text-foreground">
                    {provider.avgRating.toFixed(1)}
                  </span>
                  ({provider.reviewCount} reviews)
                </span>
              )}
              <span className="flex items-center gap-1">
                <Phone className="h-4 w-4" />
                {provider.phone}
              </span>
            </div>

            <p className="max-w-lg text-sm text-muted-foreground">
              {provider.description.length > 160
                ? provider.description.substring(0, 160) + "..."
                : provider.description}
            </p>

            {/* Quick trust signals */}
            <div className="flex flex-wrap gap-3 pt-1">
              {provider.insurance && (
                <span className="flex items-center gap-1 text-xs text-muted-foreground">
                  <CheckCircle2 className="h-3 w-3 text-green-600" />
                  Insured
                </span>
              )}
              {provider.license && (
                <span className="flex items-center gap-1 text-xs text-muted-foreground">
                  <CheckCircle2 className="h-3 w-3 text-green-600" />
                  Licensed
                </span>
              )}
              <span className="flex items-center gap-1 text-xs text-muted-foreground">
                <CheckCircle2 className="h-3 w-3 text-green-600" />
                Est. {provider.yearEstablished}
              </span>
              {perkStatus.perks.reviewAutomation && (
                <span className="flex items-center gap-1 text-xs text-muted-foreground">
                  <CheckCircle2 className="h-3 w-3 text-green-600" />
                  Automated Reviews
                </span>
              )}
            </div>
          </div>

          {/* Right: CTA */}
          <div className="flex flex-col gap-2 sm:items-end">
            <Button asChild size="lg" className="w-full sm:w-auto">
              <Link href={`/${niche}/${provider.slug}`}>
                Get a Free Quote
              </Link>
            </Button>
            {provider.website && (
              <a
                href={provider.website}
                target="_blank"
                rel="noopener noreferrer"
                className="text-center text-xs text-muted-foreground hover:text-primary"
              >
                Visit website
              </a>
            )}
          </div>
        </CardContent>
      </Card>
    </section>
  )
}
