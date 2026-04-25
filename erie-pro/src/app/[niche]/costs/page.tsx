import Link from "next/link"
import { notFound } from "next/navigation"
import type { Metadata } from "next"
import { DollarSign, ArrowRight, TrendingUp, AlertCircle, Lightbulb, Scale } from "lucide-react"
import { cityConfig } from "@/lib/city-config"
import { getNicheBySlug } from "@/lib/niches"
import { getNicheContent, getAllNicheSlugs } from "@/lib/niche-content"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { InternalLinks } from "@/components/internal-links"
import { safeJsonLd } from "@/lib/jsonld"

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
    title: `${niche.label} Costs in ${cityConfig.name}, ${cityConfig.stateCode} — Complete Pricing Guide`,
    description: `Detailed ${content.serviceLabel} cost breakdown for ${cityConfig.name}. Average prices, factors that affect cost, DIY vs. professional comparison, and tips for getting the best value.`,
    alternates: { canonical: `https://${cityConfig.domain}/${slug}/costs` },
  }
}

// ── Cost factors per niche ────────────────────────────────────────
const COST_FACTORS: Record<string, string[]> = {
  plumbing: [
    "Complexity and location of the problem (accessible vs. inside walls or underground)",
    "Time of service — emergency, weekend, and holiday rates are typically 1.5-2x standard rates",
    "Age and condition of existing plumbing — older Erie homes may need additional work to bring pipes to code",
    "Materials required — copper vs. PEX piping, standard vs. high-efficiency fixtures",
    "Permit requirements for major work like water heater replacement or sewer line repair",
    "Accessibility — basement, crawl space, or slab foundation affects labor time significantly",
  ],
  hvac: [
    "System type and efficiency rating — higher SEER/AFUE equipment costs more upfront but saves on energy bills",
    "Home size and insulation quality — poorly insulated Erie homes need larger, more expensive systems",
    "Ductwork condition — existing ducts may need modification, repair, or complete replacement",
    "Installation complexity — multi-zone systems, dual-fuel setups, and humidifiers add cost",
    "Time of year — scheduling in spring or fall off-season can save 10-15% vs. emergency winter replacement",
    "Rebates and incentives — utility rebates and manufacturer promotions can offset $500-$2,000",
  ],
  electrical: [
    "Scope of work — a single outlet addition vs. a whole-house rewire involves vastly different costs",
    "Panel capacity — upgrading from 100-amp to 200-amp involves significant labor and materials",
    "Wiring type — replacing knob-and-tube or aluminum wiring costs more due to safety requirements",
    "Accessibility — fishing wire through finished walls costs more than new construction wiring",
    "Permit and inspection fees — required for most electrical work in Erie",
    "Code compliance — bringing older Erie homes up to current NEC standards may add unexpected costs",
  ],
  roofing: [
    "Roof size and pitch — steeper roofs require more safety equipment and labor time",
    "Material choice — architectural shingles, metal roofing, and premium options vary significantly in cost",
    "Layers to remove — tear-off of existing layers adds $1,000-$3,000 to the project",
    "Deck condition — damaged plywood or OSB must be replaced before new shingles go on",
    "Ventilation upgrades — adding ridge vents and soffit vents improves ice dam prevention",
    "Ice and water shield coverage — Erie code requires minimum coverage, but full coverage is recommended for ice dam prone roofs",
  ],
  landscaping: [
    "Project scope — basic lawn care vs. full landscape design with hardscaping are very different investments",
    "Materials — natural stone vs. pavers, premium vs. standard plant sizes affect total cost",
    "Site conditions — grading, drainage issues, and soil quality in Erie affect preparation costs",
    "Design complexity — custom designs with water features, lighting, and outdoor kitchens increase investment",
    "Seasonal timing — fall planting and spring installations are peak season; off-season work may offer savings",
    "Ongoing maintenance needs — factor in annual maintenance costs when planning your landscape budget",
  ],
  dental: [
    "Type of procedure — preventive cleanings cost far less than restorative work like crowns or implants",
    "Insurance coverage — in-network providers typically cost less out-of-pocket than out-of-network",
    "Materials used — porcelain, zirconia, and composite each have different price points and longevity",
    "Complexity of the case — a straightforward extraction costs less than a surgical extraction of an impacted tooth",
    "Sedation requirements — nitrous oxide, oral sedation, and IV sedation each add to the total cost",
    "Technology used — CEREC same-day crowns and digital impressions may cost slightly more but save time",
  ],
  legal: [
    "Case complexity — a simple will costs far less than contested custody litigation",
    "Fee structure — hourly rates, flat fees, and contingency arrangements affect total cost differently",
    "Attorney experience level — senior partners charge more than junior associates, but may resolve cases faster",
    "Duration of the case — longer cases with multiple hearings and depositions accumulate more fees",
    "Expert witnesses — some cases require paid expert testimony that adds to litigation costs",
    "Court filing fees and administrative costs — these vary by case type and jurisdiction in Erie County",
  ],
  cleaning: [
    "Home size — square footage is the primary factor in cleaning cost",
    "Cleaning type — standard maintenance cleaning costs less than deep cleaning or move-in/move-out service",
    "Frequency — weekly service costs less per visit than biweekly or monthly due to less buildup between visits",
    "Condition of the home — first-time cleaning or homes that have not been cleaned recently take longer",
    "Number of pets — pet hair, dander, and related cleaning adds 10-20% to most estimates",
    "Special requests — interior windows, inside appliances, laundry, and organization add to the base price",
  ],
  "auto-repair": [
    "Vehicle make and model — European and luxury vehicles typically cost more for parts and specialized labor",
    "Parts quality — OEM, quality aftermarket, and budget parts have different price points and warranties",
    "Labor rates — Erie shop rates typically range from $80-$130 per hour depending on specialization",
    "Diagnostic complexity — intermittent problems require more diagnostic time than straightforward failures",
    "Vehicle age and condition — rusted bolts, corroded parts, and lack of maintenance increase repair time",
    "Additional discoveries — once work begins, mechanics may find related problems that need attention",
  ],
  "pest-control": [
    "Pest type — termites and bed bugs require specialized, more expensive treatments than common insects",
    "Infestation severity — a small ant problem costs less to treat than an established colony",
    "Home size and construction — larger homes with more entry points require more extensive treatment",
    "Treatment method — chemical, heat, baiting, and exclusion work have different cost profiles",
    "Service frequency — one-time treatments cost more per visit than quarterly maintenance plans",
    "Accessibility — treating a crawl space, attic, or inside walls requires more labor than perimeter treatment",
  ],
  painting: [
    "Surface area — total square footage of walls, ceilings, and trim determines the bulk of the cost",
    "Surface preparation — scraping, sanding, patching, and priming add significant labor time",
    "Paint quality — premium paints ($50-$80/gallon) last significantly longer than budget options ($25-$35/gallon)",
    "Number of coats — two coats of finish paint is standard; dark-to-light color changes may need three",
    "Height and accessibility — multi-story exteriors and vaulted ceilings require scaffolding or lifts",
    "Lead paint — homes built before 1978 may require lead-safe practices, adding 20-30% to the cost",
  ],
  "real-estate": [
    "Property type — single-family homes, condos, and multi-unit properties have different commission expectations",
    "Market conditions — seller's markets may allow for commission negotiation; buyer's markets may not",
    "Service level — full-service agents charge more than limited-service or flat-fee options",
    "Photography and marketing — professional staging, drone photography, and video tours add value but may increase costs",
    "Transaction complexity — short sales, estate sales, and investor transactions require more expertise",
    "Closing costs — title insurance, transfer taxes, and recording fees are separate from agent commissions",
  ],
}

// ── DIY vs Pro comparison points ──────────────────────────────────
const DIY_VS_PRO: Record<string, { scenario: string; diy: string; pro: string }[]> = {
  plumbing: [
    { scenario: "Unclog a simple drain", diy: "$5-$20 (drain snake)", pro: "$125-$350" },
    { scenario: "Replace a faucet", diy: "$50-$200 (part cost)", pro: "$150-$350" },
    { scenario: "Replace a toilet", diy: "$150-$400 (toilet cost)", pro: "$250-$600" },
    { scenario: "Water heater replacement", diy: "Not recommended — gas/permits required", pro: "$1,200-$2,500" },
    { scenario: "Sewer line repair", diy: "Not possible — requires equipment & permits", pro: "$1,500-$5,000" },
  ],
  hvac: [
    { scenario: "Replace air filter", diy: "$5-$30 (filter cost)", pro: "Included in tune-up" },
    { scenario: "Clean condenser coils", diy: "$10-$20 (coil cleaner)", pro: "$75-$150" },
    { scenario: "Annual tune-up", diy: "Not recommended — certification required", pro: "$80-$150" },
    { scenario: "Furnace replacement", diy: "Not possible — gas, electrical, permits", pro: "$3,500-$7,500" },
    { scenario: "Full system replacement", diy: "Not possible", pro: "$7,000-$15,000" },
  ],
  electrical: [
    { scenario: "Replace a light switch", diy: "$3-$10 (switch cost)", pro: "$75-$150" },
    { scenario: "Install a ceiling fan", diy: "$50-$200 (fan cost)", pro: "$150-$400" },
    { scenario: "Add a new outlet", diy: "Not recommended — code/permit required", pro: "$150-$400" },
    { scenario: "Panel upgrade (200 amp)", diy: "Not permitted — licensed electrician required", pro: "$1,500-$3,000" },
    { scenario: "Whole-house rewire", diy: "Not permitted", pro: "$8,000-$15,000" },
  ],
  roofing: [
    { scenario: "Replace a few shingles", diy: "$20-$50 (materials)", pro: "$150-$400" },
    { scenario: "Clean gutters", diy: "$0 (your time)", pro: "$100-$250" },
    { scenario: "Minor flashing repair", diy: "$20-$50 (materials)", pro: "$200-$500" },
    { scenario: "Full roof replacement", diy: "Extremely dangerous — not recommended", pro: "$8,000-$15,000" },
    { scenario: "Ice dam removal", diy: "Roof rake only ($30-$60)", pro: "$300-$600" },
  ],
  landscaping: [
    { scenario: "Weekly lawn mowing", diy: "$0 (your time) + equipment", pro: "$30-$60/visit" },
    { scenario: "Mulch garden beds", diy: "$50-$150 (materials)", pro: "$200-$500" },
    { scenario: "Build a patio", diy: "$500-$2,000 (materials)", pro: "$2,000-$8,000" },
    { scenario: "Plant a tree", diy: "$50-$200 (tree cost)", pro: "$200-$800" },
    { scenario: "Full landscape design/install", diy: "Very challenging without expertise", pro: "$5,000-$25,000" },
  ],
  dental: [
    { scenario: "Daily brushing and flossing", diy: "$20-$50/year (supplies)", pro: "N/A — this is your job" },
    { scenario: "Teeth whitening", diy: "$20-$50 (over-the-counter)", pro: "$300-$800 (professional)" },
    { scenario: "Fill a cavity", diy: "Not possible", pro: "$150-$400" },
    { scenario: "Root canal", diy: "Not possible", pro: "$700-$1,500" },
    { scenario: "Dental implant", diy: "Not possible", pro: "$3,000-$5,000" },
  ],
  legal: [
    { scenario: "Simple will (no estate)", diy: "$20-$100 (online template)", pro: "$300-$1,000" },
    { scenario: "LLC formation", diy: "$125 (PA filing fee)", pro: "$500-$1,500" },
    { scenario: "Uncontested divorce", diy: "$350 (filing fees)", pro: "$1,500-$3,000" },
    { scenario: "Personal injury claim", diy: "Not recommended — usually get less", pro: "33-40% contingency" },
    { scenario: "Criminal defense", diy: "Not possible — right to counsel exists for a reason", pro: "$2,500-$10,000+" },
  ],
  cleaning: [
    { scenario: "Weekly maintenance clean", diy: "$0 (your time)", pro: "$100-$200" },
    { scenario: "Deep clean (whole house)", diy: "$50-$100 (supplies)", pro: "$200-$500" },
    { scenario: "Carpet steam cleaning", diy: "$50-$75 (rental)", pro: "$150-$400" },
    { scenario: "Move-out clean", diy: "$30-$60 (supplies)", pro: "$200-$500" },
    { scenario: "Post-construction clean", diy: "Very difficult without equipment", pro: "$300-$800" },
  ],
  "auto-repair": [
    { scenario: "Oil change", diy: "$25-$50 (oil + filter)", pro: "$40-$80" },
    { scenario: "Replace air filter", diy: "$15-$30 (filter cost)", pro: "$40-$75" },
    { scenario: "Brake pad replacement", diy: "$50-$100 (parts)", pro: "$150-$350/axle" },
    { scenario: "Timing belt replacement", diy: "Very complex — not recommended", pro: "$500-$1,200" },
    { scenario: "Transmission repair", diy: "Not feasible for most people", pro: "$1,500-$4,000" },
  ],
  "pest-control": [
    { scenario: "Ant baits (small problem)", diy: "$5-$15 (bait traps)", pro: "$100-$200" },
    { scenario: "Mouse traps", diy: "$10-$30 (traps)", pro: "$150-$300" },
    { scenario: "Perimeter spray", diy: "$30-$60 (products)", pro: "$100-$200/treatment" },
    { scenario: "Termite treatment", diy: "Not effective — professional treatment required", pro: "$500-$2,500" },
    { scenario: "Bed bug elimination", diy: "Rarely effective", pro: "$500-$1,500/room" },
  ],
  painting: [
    { scenario: "Paint one room", diy: "$50-$150 (paint + supplies)", pro: "$300-$800" },
    { scenario: "Paint entire interior", diy: "$300-$800 (materials)", pro: "$2,000-$6,000" },
    { scenario: "Exterior trim painting", diy: "$100-$300 (materials)", pro: "$500-$2,000" },
    { scenario: "Full exterior repaint", diy: "$500-$1,500 (materials + equipment rental)", pro: "$3,000-$10,000" },
    { scenario: "Cabinet refinishing", diy: "$200-$500 (materials)", pro: "$2,000-$5,000" },
  ],
  "real-estate": [
    { scenario: "Sell FSBO (by owner)", diy: "$0-$500 (listing sites)", pro: "5-6% commission" },
    { scenario: "Market analysis (pricing)", diy: "Free online estimates (less accurate)", pro: "CMA included with agent" },
    { scenario: "Contract negotiation", diy: "Risky without expertise", pro: "Included with agent" },
    { scenario: "Buyer representation", diy: "Possible but challenging", pro: "Typically seller pays commission" },
    { scenario: "Real estate closing", diy: "Title company can handle", pro: "Agent coordinates all parties" },
  ],
}

export default async function NicheCostsPage({ params }: Props) {
  const { niche: slug } = await params
  const niche = getNicheBySlug(slug)
  const content = getNicheContent(slug)
  if (!niche || !content) notFound()

  const factors = COST_FACTORS[slug] ?? []
  const diyComparison = DIY_VS_PRO[slug] ?? []

  const costsJsonLd = {
    "@context": "https://schema.org",
    "@type": "Service",
    "@id": `https://${cityConfig.domain}/${slug}/costs#service`,
    name: `${niche.label} Services in ${cityConfig.name}, ${cityConfig.stateCode}`,
    provider: {
      "@type": "LocalBusiness",
      "@id": `https://${cityConfig.domain}/${slug}/#business`,
      name: cityConfig.domain,
      address: {
        "@type": "PostalAddress",
        addressLocality: cityConfig.name,
        addressRegion: cityConfig.stateCode,
        addressCountry: "US",
      },
    },
    areaServed: { "@type": "City", name: cityConfig.name },
    hasOfferCatalog: {
      "@type": "OfferCatalog",
      name: `${niche.label} Pricing in ${cityConfig.name}`,
      itemListElement: content.pricingRanges.map((pr, i) => ({
        "@type": "Offer",
        position: i + 1,
        name: pr.service,
        description: pr.range,
      })),
    },
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: safeJsonLd(costsJsonLd) }}
      />
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
                <BreadcrumbPage>Cost Guide</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>
      </div>

      {/* ── Hero ──────────────────────────────────────────────── */}
      <section className="border-b bg-muted/30 pb-12 pt-10">
        <div className="mx-auto max-w-4xl px-4 text-center sm:px-6">
          <Badge variant="secondary" className="mb-4">
            <DollarSign className="mr-1.5 h-3 w-3" />
            Cost Guide
          </Badge>
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
            {niche.label} Costs in {cityConfig.name},{" "}
            {cityConfig.stateCode}
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-lg text-muted-foreground">
            A comprehensive guide to {content.serviceLabel} pricing in the Erie
            area. Average costs, what affects price, and how to get the best
            value for your investment.
          </p>
        </div>
      </section>

      {/* ── Average Costs Table ────────────────────────────────── */}
      <section className="mx-auto max-w-4xl px-4 py-12 sm:px-6">
        <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
          <DollarSign className="h-5 w-5 text-primary" />
          Average {niche.label} Costs in {cityConfig.name}
        </h2>
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[60%]">Service</TableHead>
                  <TableHead>Average Cost Range</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {content.pricingRanges.map((pr, i) => (
                  <TableRow key={i}>
                    <TableCell className="font-medium">{pr.service}</TableCell>
                    <TableCell>{pr.range}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
        <p className="mt-3 text-sm text-muted-foreground">
          * Prices reflect the {cityConfig.name} metro area as of 2024-2025.
          Actual costs vary based on project specifics.
        </p>
      </section>

      <Separator className="mx-auto max-w-4xl" />

      {/* ── Factors That Affect Cost ──────────────────────────── */}
      <section className="mx-auto max-w-4xl px-4 py-12 sm:px-6">
        <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-primary" />
          Factors That Affect {niche.label} Pricing in {cityConfig.name}
        </h2>
        <div className="grid gap-4 sm:grid-cols-2">
          {factors.map((factor, i) => (
            <Card key={i}>
              <CardContent className="flex items-start gap-3 py-4">
                <Badge variant="outline" className="shrink-0 mt-0.5">
                  {i + 1}
                </Badge>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {factor}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <Separator className="mx-auto max-w-4xl" />

      {/* ── DIY vs Professional ────────────────────────────────── */}
      <section className="mx-auto max-w-4xl px-4 py-12 sm:px-6">
        <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
          <Scale className="h-5 w-5 text-primary" />
          DIY vs. Professional: Cost Comparison
        </h2>
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Scenario</TableHead>
                  <TableHead>DIY Cost</TableHead>
                  <TableHead>Professional Cost</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {diyComparison.map((row, i) => (
                  <TableRow key={i}>
                    <TableCell className="font-medium">{row.scenario}</TableCell>
                    <TableCell className="text-sm">{row.diy}</TableCell>
                    <TableCell className="text-sm">{row.pro}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </section>

      <Separator className="mx-auto max-w-4xl" />

      {/* ── When to Invest More ────────────────────────────────── */}
      <section className="mx-auto max-w-4xl px-4 py-12 sm:px-6">
        <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
          <AlertCircle className="h-5 w-5 text-primary" />
          When to Invest More
        </h2>
        <Card className="bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800">
          <CardContent className="py-6">
            <ul className="space-y-3 text-sm leading-relaxed">
              <li className="flex items-start gap-2">
                <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-amber-500" />
                <span>Safety is involved — electrical, gas, structural, or health-related work should always be handled by licensed professionals.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-amber-500" />
                <span>The project affects your home&apos;s value — quality work by reputable {content.pluralLabel.toLowerCase()} protects and increases property value.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-amber-500" />
                <span>Permits are required — work that requires {cityConfig.name} building permits must be done by licensed contractors to pass inspection.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-amber-500" />
                <span>Long-term cost matters more than upfront price — investing in quality materials and workmanship reduces expensive callbacks and premature replacement.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-amber-500" />
                <span>Erie&apos;s climate demands durability — cheap solutions that work in mild climates often fail under lake effect snow, sub-zero temperatures, and freeze-thaw stress.</span>
              </li>
            </ul>
          </CardContent>
        </Card>
      </section>

      <Separator className="mx-auto max-w-4xl" />

      {/* ── How to Get the Best Value ─────────────────────────── */}
      <section className="mx-auto max-w-4xl px-4 py-12 sm:px-6">
        <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
          <Lightbulb className="h-5 w-5 text-primary" />
          How to Get the Best Value
        </h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Get Multiple Quotes</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Always compare at least three written estimates. Look beyond
                price — compare scope, materials, timeline, and warranty terms.
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Schedule Off-Peak</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                When possible, schedule non-emergency work during the slower
                season. Many {cityConfig.name} {content.pluralLabel.toLowerCase()}{" "}
                offer better pricing outside their busiest months.
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Bundle Services</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Combining multiple projects into one visit often reduces the
                per-project cost. Ask your contractor about discounts for
                bundled work.
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Invest in Prevention</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Regular maintenance prevents costly emergencies. A $150
                tune-up today can prevent a $3,000 repair tomorrow —
                especially in {cityConfig.name}&apos;s demanding climate.
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* ── CTA ───────────────────────────────────────────────── */}
      <section className="border-t bg-muted/50 py-12">
        <div className="mx-auto max-w-2xl px-4 text-center sm:px-6">
          <DollarSign className="mx-auto mb-4 h-8 w-8 text-primary/60" />
          <h2 className="text-xl font-bold">
            Get accurate pricing for your project
          </h2>
          <p className="mt-2 text-muted-foreground">
            Every project is unique. Connect with verified{" "}
            {content.pluralLabel.toLowerCase()} in {cityConfig.name} for a free,
            detailed estimate tailored to your specific needs.
          </p>
          <div className="mt-6 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
            <Button asChild size="lg">
              <Link href={`/${slug}#quote`}>
                {content.ctaPrimary}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg">
              <Link href={`/${slug}/pricing`}>Quick Price Reference</Link>
            </Button>
          </div>
        </div>
      </section>

      <InternalLinks niche={slug} currentPage="costs" />
    </main>
    </>
  )
}
