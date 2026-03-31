"use client"

import Link from "next/link"
import { useParams } from "next/navigation"
import { useState, useMemo } from "react"
import { ClipboardCheck, ArrowRight, ShieldCheck } from "lucide-react"
import { cityConfig } from "@/lib/city-config"
import { getNicheBySlug } from "@/lib/niches"
import { getNicheContent } from "@/lib/niche-content"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Progress } from "@/components/ui/progress"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"

// ── Checklist data per niche ──────────────────────────────────
interface ChecklistItem {
  label: string
  tip: string
}

const CHECKLIST_DATA: Record<string, ChecklistItem[]> = {
  plumbing: [
    { label: "Verify Pennsylvania state plumbing license", tip: "Check through the PA Department of Labor & Industry website or ask for the license number directly." },
    { label: "Confirm liability insurance and workers' comp", tip: "Request a certificate of insurance. Coverage should be at least $500,000 for residential work." },
    { label: "Get at least three written estimates", tip: "Compare scope of work, materials, timeline, and warranty — not just price." },
    { label: "Check online reviews and ratings", tip: "Look at Google, BBB, and Angi. Pay attention to how the company responds to negative reviews." },
    { label: "Ask about experience with Erie-area homes", tip: "Older Erie homes have unique plumbing challenges. Experience with local housing stock matters." },
    { label: "Request references from recent local jobs", tip: "Ask for 2-3 references from jobs similar to yours completed in the past year." },
    { label: "Confirm upfront pricing (not hourly billing)", tip: "Flat-rate pricing protects you from unexpected costs. Get the total in writing before work begins." },
    { label: "Ask about warranty on parts and labor", tip: "Reputable plumbers offer at least a 1-year labor warranty and pass through manufacturer warranties on parts." },
    { label: "Verify emergency service availability", tip: "Ask about after-hours, weekend, and holiday rates. Erie winters make emergency plumbing a real concern." },
    { label: "Confirm they pull required permits", tip: "Major plumbing work in Erie requires permits. A contractor who skips permits is a red flag." },
    { label: "Check for Better Business Bureau complaints", tip: "Search the BBB website for unresolved complaints. A good BBB rating indicates reliable dispute resolution." },
    { label: "Get a written contract before work starts", tip: "The contract should include scope, cost, timeline, payment schedule, and warranty terms." },
  ],
  hvac: [
    { label: "Verify EPA 608 certification", tip: "Required for handling refrigerants. Ask for their certification card or number." },
    { label: "Confirm PA contractor registration", tip: "HVAC contractors must be registered in Pennsylvania. Verify through the state Attorney General's office." },
    { label: "Get at least three written estimates", tip: "For system replacement, estimates should include a Manual J load calculation, not just a rule of thumb." },
    { label: "Check NATE certification", tip: "North American Technician Excellence certification indicates advanced training beyond minimum requirements." },
    { label: "Ask about experience with Erie's climate", tip: "Erie's extreme temperatures demand properly sized systems. Ask about their cold-climate heat pump experience." },
    { label: "Confirm liability insurance and bond", tip: "Request a certificate of insurance. HVAC work involves gas lines and electrical — insurance is critical." },
    { label: "Ask about available maintenance plans", tip: "Annual maintenance plans typically include priority scheduling, discounts, and bi-annual tune-ups." },
    { label: "Check online reviews and references", tip: "Focus on reviews that mention similar work to what you need, especially winter emergency response." },
    { label: "Verify they size systems properly", tip: "A Manual J load calculation is the only accurate way to size an HVAC system. Avoid contractors who guess." },
    { label: "Ask about rebates and financing", tip: "Many manufacturers and utilities offer rebates for high-efficiency equipment. Good contractors help you claim them." },
    { label: "Confirm warranty coverage", tip: "Separate manufacturer warranty (parts) from labor warranty. Ensure the installer registers the equipment." },
    { label: "Get a written contract with all details", tip: "Include equipment model numbers, SEER/AFUE ratings, ductwork scope, timeline, and total cost." },
  ],
  electrical: [
    { label: "Verify PA electrical contractor license", tip: "Pennsylvania requires electricians to be licensed. Verify through the PA Department of Labor & Industry." },
    { label: "Confirm liability insurance and workers' comp", tip: "Electrical work carries fire risk. Ensure coverage of at least $1 million for liability." },
    { label: "Get at least three written estimates", tip: "Estimates should detail the scope of work, materials, permit costs, and timeline." },
    { label: "Check for master electrician credentials", tip: "A master electrician has the highest level of licensing and can sign off on permits." },
    { label: "Ask about experience with older Erie homes", tip: "Many Erie homes have knob-and-tube or aluminum wiring that requires specialized knowledge." },
    { label: "Request references from similar projects", tip: "Panel upgrades, rewiring, and generator installs each require different expertise." },
    { label: "Verify they obtain required permits", tip: "Electrical work in Erie requires permits and inspection. Unpermitted work creates liability and resale issues." },
    { label: "Ask about code compliance approach", tip: "Good electricians bring work up to current code, not just patch the immediate problem." },
    { label: "Check online reviews and BBB rating", tip: "Look for reviews that mention professionalism, cleanliness, and clear communication." },
    { label: "Confirm cleanup is included", tip: "Electrical work can create drywall dust and debris. Verify the contractor cleans up after the job." },
    { label: "Ask about warranty on workmanship", tip: "Quality electricians warranty their labor for at least one year. Material warranties vary by product." },
    { label: "Get a detailed written contract", tip: "Include scope, materials, permit costs, timeline, payment terms, and warranty information." },
  ],
  roofing: [
    { label: "Verify PA home improvement contractor registration", tip: "Pennsylvania requires roofers to register with the Attorney General's office. Ask for their registration number." },
    { label: "Confirm liability insurance and workers' comp", tip: "Roofing is high-risk work. Verify coverage of at least $1 million liability and active workers' comp." },
    { label: "Get at least three detailed written estimates", tip: "Estimates should specify shingle brand/model, underlayment type, ice and water shield coverage, and ventilation." },
    { label: "Ask about ice and water shield installation", tip: "Critical for Erie roofs. Ice and water shield should extend at least 3 feet from eaves and cover all valleys." },
    { label: "Check manufacturer certifications", tip: "GAF Master Elite, CertainTeed SELECT, and Owens Corning Preferred contractors offer enhanced warranties." },
    { label: "Ask about ventilation assessment", tip: "Proper attic ventilation prevents ice dams. Your roofer should evaluate soffit and ridge ventilation." },
    { label: "Verify they handle permits and inspections", tip: "Roof replacement in Erie requires a building permit. The contractor should obtain it." },
    { label: "Ask about storm damage experience", tip: "Erie's lake effect weather causes unique roof damage. Ask about their experience with insurance claims." },
    { label: "Request references from the past 12 months", tip: "Roofing quality is best judged after one full Erie winter. Ask for references at least one season old." },
    { label: "Confirm waste removal is included", tip: "Old shingles, nails, and debris should be removed. Ask about their magnetic nail sweep process." },
    { label: "Understand the warranty structure", tip: "Manufacturer warranty covers materials; workmanship warranty covers installation. Get both in writing." },
    { label: "Get a written contract with start date", tip: "Include materials, ventilation plan, payment schedule, start/completion dates, and cleanup terms." },
  ],
  landscaping: [
    { label: "Verify business license and insurance", tip: "Confirm general liability insurance. Ask about coverage for property damage during work." },
    { label: "Review their portfolio of completed projects", tip: "Ask for photos of work similar to what you want, especially projects in the Erie area." },
    { label: "Get at least three detailed estimates", tip: "Estimates should include a design plan, plant list with sizes, hardscape materials, and timeline." },
    { label: "Ask about Zone 6a plant knowledge", tip: "Erie is USDA Zone 6a. Your landscaper should know which plants survive our winters." },
    { label: "Check knowledge of local drainage issues", tip: "Erie's heavy rainfall and snowmelt create drainage challenges. Ask about their grading experience." },
    { label: "Verify they handle hardscape frost protection", tip: "Patios and walls must have proper base depth for Erie's freeze-thaw cycles (minimum 12 inches of compacted base)." },
    { label: "Ask about maintenance programs", tip: "Many landscapers offer seasonal maintenance packages that include mowing, fertilization, and cleanup." },
    { label: "Check online reviews and references", tip: "Look for reviews that mention reliability, communication, and quality of ongoing maintenance." },
    { label: "Ask about irrigation winterization", tip: "If you have a sprinkler system, verify they offer fall blowout service before Erie's first freeze." },
    { label: "Confirm a written warranty on plantings", tip: "Reputable landscapers warranty trees and shrubs for at least one growing season." },
    { label: "Discuss a phased approach if needed", tip: "Large projects can be completed in phases across seasons to spread costs and ensure quality." },
    { label: "Get everything in a written contract", tip: "Include design plan, plant species and sizes, materials, timeline, warranty, and payment schedule." },
  ],
  dental: [
    { label: "Verify dentist is licensed in Pennsylvania", tip: "Check through the PA State Board of Dentistry at the Department of State website." },
    { label: "Check credentials and specializations", tip: "For specific procedures, look for board certification in that specialty (orthodontics, periodontics, etc.)." },
    { label: "Verify accepted insurance plans", tip: "Call ahead and confirm your specific plan is accepted. Ask about out-of-pocket costs for your procedure." },
    { label: "Read patient reviews online", tip: "Check Google, Healthgrades, and Zocdoc for reviews. Focus on reviews mentioning your specific concern." },
    { label: "Evaluate the office environment", tip: "A clean, modern office with current technology indicates investment in quality care." },
    { label: "Ask about emergency availability", tip: "Dental emergencies happen. Ask if the practice offers same-day emergency appointments." },
    { label: "Inquire about sedation options", tip: "If dental anxiety is a concern, ask about nitrous oxide, oral sedation, or IV sedation availability." },
    { label: "Ask about payment plans and financing", tip: "Many dental offices offer CareCredit or in-house payment plans for larger procedures." },
    { label: "Verify they use digital X-rays", tip: "Digital X-rays use up to 90% less radiation than traditional film and provide instant results." },
    { label: "Check the practice's sterilization protocols", tip: "Ask about their infection control procedures. Reputable practices welcome these questions." },
    { label: "Schedule a consultation first", tip: "For major procedures, get a consultation before committing. A good dentist explains options clearly." },
    { label: "Ask about continuing education", tip: "Dentistry evolves rapidly. Ask if the dentist pursues ongoing training beyond minimum requirements." },
  ],
  legal: [
    { label: "Verify PA bar admission", tip: "Check the attorney's status through the Pennsylvania Disciplinary Board of the Supreme Court." },
    { label: "Check for specialization in your issue", tip: "Attorneys often focus on specific areas. A personal injury lawyer is different from an estate planning attorney." },
    { label: "Ask about experience with similar cases", tip: "Ask how many cases like yours they have handled and what outcomes they typically achieve." },
    { label: "Understand the fee structure", tip: "Get clarity on hourly rates, retainers, contingency fees, or flat fees. Ask about all potential costs." },
    { label: "Request a free initial consultation", tip: "Many Erie attorneys offer free consultations. Use this meeting to evaluate their approach and expertise." },
    { label: "Check online reviews and peer ratings", tip: "Avvo, Martindale-Hubbell, and Super Lawyers provide attorney ratings and reviews." },
    { label: "Ask about communication expectations", tip: "Clarify how often you will receive updates, whether by email, phone, or portal. Responsiveness matters." },
    { label: "Verify malpractice insurance", tip: "While not required in PA, malpractice insurance protects you if errors occur. Ask if they carry it." },
    { label: "Ask about their familiarity with Erie courts", tip: "Local attorneys know the judges, procedures, and opposing counsel in Erie County courts." },
    { label: "Confirm who will handle your case", tip: "In larger firms, a junior associate may do most of the work. Ask who your primary contact will be." },
    { label: "Get a written engagement letter", tip: "Before hiring, you should receive a written agreement outlining scope, fees, and mutual obligations." },
    { label: "Trust your instincts", tip: "You need to feel comfortable and confident in your attorney. If something feels off, keep looking." },
  ],
  cleaning: [
    { label: "Verify the company is bonded and insured", tip: "A surety bond protects against theft; liability insurance covers accidental property damage." },
    { label: "Ask about employee screening", tip: "Reputable cleaning companies run background checks on all employees who enter your home." },
    { label: "Get a detailed written estimate", tip: "The estimate should list specific rooms, tasks, and any exclusions. 'Whole house cleaning' is too vague." },
    { label: "Ask about their cleaning products", tip: "If you have allergies, pets, or children, ask about eco-friendly and non-toxic product options." },
    { label: "Check online reviews for consistency", tip: "Look for patterns in reviews — consistent quality, reliability, and attention to detail matter most." },
    { label: "Ask about their satisfaction guarantee", tip: "Reputable companies offer to re-clean areas you are not satisfied with at no additional cost." },
    { label: "Clarify what is included vs. extra", tip: "Standard cleaning often excludes inside appliances, windows, and baseboards. Know what costs extra." },
    { label: "Verify the same team each visit", tip: "Consistent teams learn your home's needs. Ask if the same cleaners will be assigned to your account." },
    { label: "Ask about cancellation and rescheduling policies", tip: "Understand the notice required for cancellations and any fees that may apply." },
    { label: "Confirm they bring their own supplies", tip: "Most professional cleaners bring supplies, but some expect you to provide products. Clarify upfront." },
    { label: "Start with a one-time deep clean", tip: "Before committing to recurring service, try a one-time deep clean to evaluate quality." },
    { label: "Get references from current clients", tip: "Ask for references from clients who have used the service for at least 6 months." },
  ],
  "auto-repair": [
    { label: "Verify ASE certification", tip: "Automotive Service Excellence certification indicates the mechanic has passed rigorous competency tests." },
    { label: "Check for PA state inspection license", tip: "Not all shops can perform PA safety and emissions inspections. Verify if you need this service." },
    { label: "Read online reviews on Google and Yelp", tip: "Look for reviews mentioning your specific vehicle make or type of repair needed." },
    { label: "Ask about warranty on parts and labor", tip: "Quality shops offer at least a 12-month or 12,000-mile warranty on parts and labor." },
    { label: "Request a written estimate before work begins", tip: "PA law requires shops to provide a written estimate and get your authorization before performing work." },
    { label: "Ask about diagnostic fees", tip: "Some shops waive diagnostic fees if you have the repair done there. Clarify upfront." },
    { label: "Check if they specialize in your vehicle", tip: "Some shops focus on specific makes (domestic, European, Asian). Specialization often means better expertise." },
    { label: "Ask about parts quality (OEM vs. aftermarket)", tip: "OEM parts match the original; quality aftermarket parts are often comparable at lower cost. Avoid cheap knockoffs." },
    { label: "Verify they have modern diagnostic equipment", tip: "Today's vehicles require computerized diagnostics. Ask about their scanner and programming capabilities." },
    { label: "Ask about their turnaround time", tip: "Get an estimated completion time in writing. Ask if loaner vehicles or shuttle service are available." },
    { label: "Check BBB and AAA approval", tip: "AAA Approved Auto Repair shops meet quality standards and offer dispute resolution. BBB ratings indicate complaint history." },
    { label: "Keep all documentation", tip: "Save every receipt, estimate, and warranty document. Organized records help with future warranty claims." },
  ],
  "pest-control": [
    { label: "Verify PA pesticide applicator license", tip: "Pennsylvania requires pest control operators to hold a current applicator license. Ask for the license number." },
    { label: "Confirm liability insurance", tip: "Pesticide application carries risk. Verify the company has adequate liability coverage." },
    { label: "Ask about their IPM approach", tip: "Integrated Pest Management focuses on prevention and targeted treatment, minimizing unnecessary chemical use." },
    { label: "Get a free inspection first", tip: "Reputable companies inspect your property before recommending treatment. Be wary of phone-only quotes." },
    { label: "Request a written treatment plan", tip: "The plan should identify the pest, explain the treatment method, and outline follow-up visits." },
    { label: "Ask about product safety", tip: "If you have children, pets, or food gardens, ask about the products used and any safety precautions." },
    { label: "Check online reviews and ratings", tip: "Look for reviews mentioning your specific pest issue and the effectiveness of the treatment." },
    { label: "Understand the warranty/guarantee", tip: "Many companies guarantee their treatments for 30-90 days. Ask what happens if pests return." },
    { label: "Ask about recurring service options", tip: "Quarterly maintenance is more effective and cost-efficient than reactive treatments." },
    { label: "Verify experience with your pest type", tip: "Termites, bed bugs, and wildlife each require specialized knowledge. Confirm relevant experience." },
    { label: "Ask about structural repair recommendations", tip: "Good pest control companies identify entry points and conditions that attract pests — not just treat symptoms." },
    { label: "Get everything in writing", tip: "Written agreement should include treatment type, products used, schedule, warranty terms, and total cost." },
  ],
  painting: [
    { label: "Verify PA home improvement contractor registration", tip: "Pennsylvania requires painters to register with the Attorney General for jobs over $500." },
    { label: "Confirm liability insurance", tip: "Request a certificate of insurance. Coverage should protect against property damage and worker injuries." },
    { label: "Get at least three written estimates", tip: "Estimates should detail prep work, primer, number of coats, paint brand/grade, and timeline." },
    { label: "Check for EPA lead-safe certification", tip: "For homes built before 1978, EPA requires lead-safe certified renovators. This is federal law." },
    { label: "Ask about surface preparation", tip: "Proper prep (scraping, sanding, priming, caulking) determines how long the paint job lasts. It should be detailed in the estimate." },
    { label: "Verify paint quality and brand", tip: "Ask what paint brand and product line they use. Professional-grade paint costs more but lasts years longer." },
    { label: "Request references with before/after photos", tip: "Photos from similar Erie projects show actual work quality better than reviews alone." },
    { label: "Ask about their weather contingency plan", tip: "Exterior painting in Erie depends on weather. Ask how they handle delays from rain or cold temperatures." },
    { label: "Check online reviews and ratings", tip: "Look for reviews mentioning attention to detail, cleanliness, and whether the job was finished on time." },
    { label: "Confirm furniture protection and cleanup", tip: "Interior painters should move and protect furniture. Exterior painters should protect landscaping and surfaces." },
    { label: "Understand the warranty terms", tip: "Quality painters warranty their work for 2-5 years against peeling, blistering, and fading." },
    { label: "Get a detailed written contract", tip: "Include colors, brands, prep scope, number of coats, timeline, payment schedule, and warranty." },
  ],
  "real-estate": [
    { label: "Verify PA real estate license", tip: "Check through the PA Real Estate Commission at the Department of State website." },
    { label: "Ask about local Erie market expertise", tip: "An agent who specializes in Erie County understands neighborhood values, school districts, and market trends." },
    { label: "Review their recent transaction history", tip: "Ask how many homes they have sold in the past 12 months and their average days on market." },
    { label: "Understand their commission structure", tip: "Typical commission is 5-6% split between buyer and seller agents. Negotiate terms that work for your situation." },
    { label: "Ask about their marketing strategy (sellers)", tip: "Professional photography, virtual tours, and MLS syndication are minimum expectations. Ask about their social media reach." },
    { label: "Check online reviews and testimonials", tip: "Google, Zillow, and Realtor.com reviews from past clients reveal communication style and effectiveness." },
    { label: "Ask about their network of professionals", tip: "Good agents have relationships with inspectors, lenders, title companies, and contractors." },
    { label: "Evaluate their communication style", tip: "Ask how they prefer to communicate and how quickly they respond. Responsiveness matters in competitive markets." },
    { label: "Ask about dual agency disclosure", tip: "PA law requires agents to disclose if they represent both buyer and seller. Understand the implications." },
    { label: "Request a comparative market analysis", tip: "A CMA helps you understand your home's value relative to recent sales and current competition." },
    { label: "Verify they work full-time in real estate", tip: "Full-time agents are typically more available and responsive than part-time agents with other careers." },
    { label: "Review the listing agreement carefully", tip: "Understand the contract length, commission, cancellation terms, and exclusivity before signing." },
  ],
}

export default function NicheChecklistPage() {
  const { niche: slug } = useParams<{ niche: string }>()
  const niche = getNicheBySlug(slug)
  const content = getNicheContent(slug)

  const items = CHECKLIST_DATA[slug] ?? CHECKLIST_DATA.plumbing
  const [checked, setChecked] = useState<Set<number>>(new Set())

  const progress = useMemo(
    () => Math.round((checked.size / items.length) * 100),
    [checked.size, items.length],
  )

  if (!niche || !content) return null

  function toggle(index: number) {
    setChecked((prev) => {
      const next = new Set(prev)
      if (next.has(index)) next.delete(index)
      else next.add(index)
      return next
    })
  }

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
                <BreadcrumbPage>Hiring Checklist</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>
      </div>

      {/* ── Hero ──────────────────────────────────────────────── */}
      <section className="border-b bg-muted/30 pb-12 pt-10">
        <div className="mx-auto max-w-4xl px-4 text-center sm:px-6">
          <Badge variant="secondary" className="mb-4">
            <ClipboardCheck className="mr-1.5 h-3 w-3" />
            Hiring Checklist
          </Badge>
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
            How to Hire a {niche.label} Pro in {cityConfig.name}
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-lg text-muted-foreground">
            Use this interactive checklist to ensure you hire the right{" "}
            {niche.label.toLowerCase()} professional. Check off each item as you
            vet candidates.
          </p>
        </div>
      </section>

      {/* ── Progress Bar ──────────────────────────────────────── */}
      <section className="border-b bg-background">
        <div className="mx-auto max-w-3xl px-4 py-6 sm:px-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">
              {checked.size} of {items.length} completed
            </span>
            <span className="text-sm font-medium text-primary">{progress}%</span>
          </div>
          <Progress value={progress} className="h-3" />
          {progress === 100 && (
            <p className="mt-3 text-center text-sm font-medium text-green-600">
              You have completed the entire checklist. You are ready to hire with
              confidence.
            </p>
          )}
        </div>
      </section>

      {/* ── Checklist Items ───────────────────────────────────── */}
      <section className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
        <div className="space-y-3">
          {items.map((item, i) => (
            <Card
              key={i}
              className={`transition-colors ${checked.has(i) ? "bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-900" : ""}`}
            >
              <CardContent className="flex items-start gap-4 py-4">
                <Checkbox
                  id={`check-${i}`}
                  checked={checked.has(i)}
                  onCheckedChange={() => toggle(i)}
                  className="mt-0.5"
                />
                <div className="flex-1">
                  <label
                    htmlFor={`check-${i}`}
                    className={`cursor-pointer text-sm font-medium leading-tight ${checked.has(i) ? "line-through text-muted-foreground" : ""}`}
                  >
                    {item.label}
                  </label>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {item.tip}
                  </p>
                </div>
                <Badge variant="outline" className="shrink-0 text-xs">
                  {i + 1}
                </Badge>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* ── CTA ───────────────────────────────────────────────── */}
      <section className="border-t bg-muted/50 py-12">
        <div className="mx-auto max-w-2xl px-4 text-center sm:px-6">
          <ShieldCheck className="mx-auto mb-4 h-8 w-8 text-primary/60" />
          <h2 className="text-xl font-bold">
            Ready to find verified professionals?
          </h2>
          <p className="mt-2 text-muted-foreground">
            Every {niche.label.toLowerCase()} professional on {cityConfig.domain}{" "}
            is verified for licensing, insurance, and reputation.
          </p>
          <div className="mt-6 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
            <Button asChild size="lg">
              <Link href={`/${slug}#quote`}>
                {content.ctaPrimary}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg">
              <Link href={`/${slug}/compare`}>Compare Providers</Link>
            </Button>
          </div>
        </div>
      </section>
    </main>
  )
}
