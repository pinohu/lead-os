import Link from "next/link"
import { notFound } from "next/navigation"
import type { Metadata } from "next"
import { CalendarDays, ArrowRight, Snowflake, Sun, Leaf, Flower2, AlertTriangle, CheckCircle2, Info } from "lucide-react"
import { cityConfig } from "@/lib/city-config"
import { getNicheBySlug } from "@/lib/niches"
import { getNicheContent, getAllNicheSlugs } from "@/lib/niche-content"
import { getSeasonalGuide } from "@/lib/seasonal-data"
import type { SeasonalTask } from "@/lib/seasonal-data"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
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
    title: `${niche.label} Seasonal Guide — Year-Round Maintenance for ${cityConfig.name} Homes`,
    description: `Season-by-season ${content.serviceLabel} maintenance guide for ${cityConfig.name}, ${cityConfig.stateCode}. Lake effect snow prep, freeze-thaw protection, spring flooding prevention, and summer storm readiness.`,
    alternates: { canonical: `https://erie.pro/${slug}/seasonal` },
  }
}

const seasonConfig = {
  spring: { icon: Flower2, color: "text-green-600", bgColor: "bg-green-50 dark:bg-green-950/30", label: "Spring", months: "March – May" },
  summer: { icon: Sun, color: "text-amber-500", bgColor: "bg-amber-50 dark:bg-amber-950/30", label: "Summer", months: "June – August" },
  fall: { icon: Leaf, color: "text-orange-600", bgColor: "bg-orange-50 dark:bg-orange-950/30", label: "Fall", months: "September – November" },
  winter: { icon: Snowflake, color: "text-blue-500", bgColor: "bg-blue-50 dark:bg-blue-950/30", label: "Winter", months: "December – February" },
} as const

function UrgencyBadge({ urgency }: { urgency: SeasonalTask["urgency"] }) {
  if (urgency === "essential")
    return (
      <Badge variant="destructive" className="text-xs">
        <AlertTriangle className="mr-1 h-3 w-3" />
        Essential
      </Badge>
    )
  if (urgency === "recommended")
    return (
      <Badge variant="secondary" className="text-xs">
        <CheckCircle2 className="mr-1 h-3 w-3" />
        Recommended
      </Badge>
    )
  return (
    <Badge variant="outline" className="text-xs">
      <Info className="mr-1 h-3 w-3" />
      Optional
    </Badge>
  )
}

export default async function NicheSeasonalPage({ params }: Props) {
  const { niche: slug } = await params
  const niche = getNicheBySlug(slug)
  const content = getNicheContent(slug)
  if (!niche || !content) notFound()

  const guide = getSeasonalGuide(slug)
  if (!guide) notFound()

  // Determine current season for default tab
  const month = new Date().getMonth()
  const currentSeason = month >= 2 && month <= 4 ? "spring" : month >= 5 && month <= 7 ? "summer" : month >= 8 && month <= 10 ? "fall" : "winter"

  return (
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
                <BreadcrumbPage>Seasonal Guide</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>
      </div>

      {/* ── Hero ──────────────────────────────────────────────── */}
      <section className="border-b bg-muted/30 pb-12 pt-10">
        <div className="mx-auto max-w-4xl px-4 text-center sm:px-6">
          <Badge variant="secondary" className="mb-4">
            <CalendarDays className="mr-1.5 h-3 w-3" />
            Seasonal Maintenance
          </Badge>
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
            {niche.label} Seasonal Guide for {cityConfig.name}
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-lg text-muted-foreground">
            Year-round {content.serviceLabel} maintenance tailored to{" "}
            {cityConfig.name}&apos;s lake effect climate. Stay ahead of seasonal
            challenges with these expert-recommended tasks.
          </p>
        </div>
      </section>

      {/* ── Season Tabs ───────────────────────────────────────── */}
      <section className="mx-auto max-w-4xl px-4 py-12 sm:px-6">
        <Tabs defaultValue={currentSeason} className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            {(Object.keys(seasonConfig) as Array<keyof typeof seasonConfig>).map((season) => {
              const cfg = seasonConfig[season]
              const Icon = cfg.icon
              return (
                <TabsTrigger key={season} value={season} className="gap-1.5">
                  <Icon className={`h-4 w-4 ${cfg.color}`} />
                  <span className="hidden sm:inline">{cfg.label}</span>
                </TabsTrigger>
              )
            })}
          </TabsList>

          {(Object.keys(seasonConfig) as Array<keyof typeof seasonConfig>).map((season) => {
            const cfg = seasonConfig[season]
            const Icon = cfg.icon
            const tasks = guide[season]

            return (
              <TabsContent key={season} value={season} className="mt-6">
                <div className={`rounded-lg ${cfg.bgColor} p-4 mb-6`}>
                  <div className="flex items-center gap-3">
                    <Icon className={`h-6 w-6 ${cfg.color}`} />
                    <div>
                      <h2 className="text-lg font-semibold">
                        {cfg.label} {niche.label} Checklist
                      </h2>
                      <p className="text-sm text-muted-foreground">
                        {cfg.months} &middot; {tasks.length} maintenance tasks
                      </p>
                    </div>
                  </div>
                </div>

                <div className="grid gap-4">
                  {tasks.map((task, i) => (
                    <Card key={i}>
                      <CardHeader className="pb-2">
                        <div className="flex items-start justify-between gap-3">
                          <CardTitle className="text-base">{task.task}</CardTitle>
                          <UrgencyBadge urgency={task.urgency} />
                        </div>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-muted-foreground leading-relaxed">
                          {task.details}
                        </p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </TabsContent>
            )
          })}
        </Tabs>
      </section>

      {/* ── CTA ───────────────────────────────────────────────── */}
      <section className="border-t bg-muted/50 py-12">
        <div className="mx-auto max-w-2xl px-4 text-center sm:px-6">
          <CalendarDays className="mx-auto mb-4 h-8 w-8 text-primary/60" />
          <h2 className="text-xl font-bold">
            Ready to schedule seasonal maintenance?
          </h2>
          <p className="mt-2 text-muted-foreground">
            Connect with a verified {niche.label.toLowerCase()} professional in{" "}
            {cityConfig.name} who knows how to protect your home through every
            season.
          </p>
          <div className="mt-6 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
            <Button asChild size="lg">
              <Link href={`/${slug}#quote`}>
                {content.ctaPrimary}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg">
              <Link href={`/${slug}/checklist`}>Hiring Checklist</Link>
            </Button>
          </div>
        </div>
      </section>
    </main>
  )
}
