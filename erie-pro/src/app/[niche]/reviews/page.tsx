import Link from "next/link"
import { notFound } from "next/navigation"
import type { Metadata } from "next"
import { MessageSquare, ArrowRight, Star, ThumbsUp, ShieldCheck, UserCheck } from "lucide-react"
import { cityConfig } from "@/lib/city-config"
import { getNicheBySlug } from "@/lib/niches"
import { getNicheContent, getAllNicheSlugs } from "@/lib/niche-content"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"

type Props = { params: Promise<{ niche: string }> }

export function generateStaticParams() {
  return getAllNicheSlugs().map((slug) => ({ niche: slug }))
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { niche: slug } = await params
  const niche = getNicheBySlug(slug)
  const content = getNicheContent(slug)
  if (!niche || !content) return { title: "Not Found" }
  return {
    title: `${niche.label} Reviews — ${cityConfig.name}, ${cityConfig.stateCode} | ${cityConfig.domain}`,
    description: `Read and leave reviews for ${content.pluralLabel.toLowerCase()} in ${cityConfig.name}, ${cityConfig.stateCode}. Verified reviews from real customers help you make the right hiring decision.`,
    alternates: { canonical: `https://${cityConfig.domain}/${slug}/reviews` },
  }
}

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          className={`h-4 w-4 ${i < rating ? "fill-amber-400 text-amber-400" : "text-muted-foreground/25"}`}
        />
      ))}
    </div>
  )
}

const SAMPLE_REVIEWS = [
  { initials: "JM", name: "Jennifer M.", area: "Millcreek", rating: 5, date: "2 weeks ago", text: "Absolutely outstanding service. They arrived on time, explained everything clearly, and the quality of work exceeded my expectations. Highly recommend to anyone in the Erie area." },
  { initials: "RK", name: "Robert K.", area: "Erie", rating: 5, date: "1 month ago", text: "Called for an emergency on a Saturday and they were here within an hour. Fair pricing, professional work, and they cleaned up after themselves. Will definitely use again." },
  { initials: "SL", name: "Sarah L.", area: "Harborcreek", rating: 4, date: "1 month ago", text: "Very professional and knowledgeable. They took the time to explain my options and helped me make an informed decision. The only reason for 4 stars is the scheduling took a bit longer than expected." },
  { initials: "DW", name: "David W.", area: "Fairview", rating: 5, date: "2 months ago", text: "I got three quotes and this company was the most thorough in their assessment. Not the cheapest, but the best value by far. The work has been flawless." },
  { initials: "AM", name: "Angela M.", area: "Summit Twp", rating: 5, date: "3 months ago", text: "From the initial consultation to the finished project, everything was handled professionally. They even followed up a week later to make sure everything was working perfectly." },
  { initials: "TC", name: "Thomas C.", area: "North East", rating: 4, date: "3 months ago", text: "Great work and fair pricing. The team was courteous and cleaned up thoroughly. I appreciate that they respected my home and property throughout the project." },
]

export default async function NicheReviewsPage({ params }: Props) {
  const { niche: slug } = await params
  const niche = getNicheBySlug(slug)
  const content = getNicheContent(slug)
  if (!niche || !content) notFound()

  // Note: Schema.org review markup intentionally omitted — sample reviews
  // should not be presented as real structured data to search engines.

  return (
    <>
      <main>
      {/* ── Breadcrumb ────────────────────────────────────────── */}
      <div className="border-b bg-muted/30">
        <div className="mx-auto max-w-4xl px-4 py-3 sm:px-6">
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink asChild>
                  <Link href="/">Home</Link>
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbLink asChild>
                  <Link href={`/${slug}`}>{niche.label}</Link>
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>Reviews</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>
      </div>

      {/* ── Hero ──────────────────────────────────────────────── */}
      <section className="border-b bg-muted/30 pb-12 pt-10">
        <div className="mx-auto max-w-4xl px-4 text-center sm:px-6">
          <Badge variant="secondary" className="mb-4">
            <MessageSquare className="mr-1.5 h-3 w-3" />
            Review Hub
          </Badge>
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
            {niche.label} Reviews in {cityConfig.name},{" "}
            {cityConfig.stateCode}
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-lg text-muted-foreground">
            Real reviews from {cityConfig.name} residents help you find the
            best {content.pluralLabel.toLowerCase()} for your project.
          </p>
        </div>
      </section>

      {/* ── How Reviews Work ──────────────────────────────────── */}
      <section className="mx-auto max-w-4xl px-4 py-12 sm:px-6">
        <h2 className="text-xl font-bold mb-6 text-center">
          How Reviews Work on {cityConfig.domain}
        </h2>
        <div className="grid gap-4 sm:grid-cols-3">
          <Card className="text-center">
            <CardContent className="pt-6">
              <UserCheck className="mx-auto mb-3 h-8 w-8 text-primary" />
              <h3 className="font-semibold mb-1">Verified Customers</h3>
              <p className="text-sm text-muted-foreground">
                Only customers who used a service through our platform can
                leave reviews, preventing fake or biased feedback.
              </p>
            </CardContent>
          </Card>
          <Card className="text-center">
            <CardContent className="pt-6">
              <ShieldCheck className="mx-auto mb-3 h-8 w-8 text-primary" />
              <h3 className="font-semibold mb-1">Unbiased Ratings</h3>
              <p className="text-sm text-muted-foreground">
                Reviews cannot be edited or removed by providers. Every
                rating — positive or negative — stays visible.
              </p>
            </CardContent>
          </Card>
          <Card className="text-center">
            <CardContent className="pt-6">
              <ThumbsUp className="mx-auto mb-3 h-8 w-8 text-primary" />
              <h3 className="font-semibold mb-1">Detailed Feedback</h3>
              <p className="text-sm text-muted-foreground">
                Reviews cover quality, professionalism, pricing, and
                timeliness — the factors that matter most when hiring.
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      <Separator className="mx-auto max-w-4xl" />

      {/* ── Sample Reviews ────────────────────────────────────── */}
      <section className="mx-auto max-w-4xl px-4 py-12 sm:px-6">
        <h2 className="text-xl font-bold mb-4">
          Recent {niche.label} Reviews
        </h2>
        <div className="mb-6 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:border-amber-900/50 dark:bg-amber-950/20 dark:text-amber-300">
          <strong>Note:</strong> The reviews below are sample reviews to illustrate our review format. Real reviews from verified customers will appear here as providers join {cityConfig.domain}.
        </div>
        <div className="space-y-4">
          {SAMPLE_REVIEWS.map((review, i) => (
            <Card key={i}>
              <CardContent className="flex gap-4 py-5">
                <Avatar className="h-10 w-10 shrink-0">
                  <AvatarFallback className="text-xs font-medium">
                    {review.initials}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <span className="font-medium text-sm">{review.name}</span>
                    <Badge variant="outline" className="text-xs">
                      {review.area}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {review.date}
                    </span>
                  </div>
                  <StarRating rating={review.rating} />
                  <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                    {review.text}
                  </p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
        <p className="mt-6 text-center text-sm text-muted-foreground">
          Reviews are collected from verified customers. Submit your own review
          below.
        </p>
      </section>

      <Separator className="mx-auto max-w-4xl" />

      {/* ── For Providers ─────────────────────────────────────── */}
      <section className="mx-auto max-w-4xl px-4 py-12 sm:px-6">
        <Card className="bg-primary/5 border-primary/20">
          <CardHeader className="text-center pb-2">
            <CardTitle className="text-xl">
              {niche.label} Professionals: Build Your Reputation
            </CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <p className="mx-auto max-w-lg text-sm text-muted-foreground mb-6">
              Verified reviews on {cityConfig.domain} help you stand out from
              the competition. Claim your listing and start collecting reviews
              from satisfied customers across the {cityConfig.name} area.
            </p>
            <Button asChild>
              <Link href="/for-business">
                Claim Your Listing
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </CardContent>
        </Card>
      </section>

      {/* ── Consumer CTA ──────────────────────────────────────── */}
      <section className="border-t bg-muted/50 py-12">
        <div className="mx-auto max-w-2xl px-4 text-center sm:px-6">
          <Star className="mx-auto mb-4 h-8 w-8 text-amber-400" />
          <h2 className="text-xl font-bold">
            Ready to find a top-rated {niche.label.toLowerCase()} pro?
          </h2>
          <p className="mt-2 text-muted-foreground">
            Get matched with verified, reviewed {content.pluralLabel.toLowerCase()}{" "}
            in {cityConfig.name}.
          </p>
          <div className="mt-6">
            <Button asChild size="lg">
              <Link href={`/${slug}#quote`}>
                {content.ctaPrimary}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </section>
    </main>
    </>
  )
}
