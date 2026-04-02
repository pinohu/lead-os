import Link from "next/link"
import { notFound } from "next/navigation"
import type { Metadata } from "next"
import { Award, ArrowRight, ShieldCheck, ExternalLink, CheckCircle2 } from "lucide-react"
import { cityConfig } from "@/lib/city-config"
import { getNicheBySlug } from "@/lib/niches"
import { getNicheContent, getAllNicheSlugs } from "@/lib/niche-content"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { InternalLinks } from "@/components/internal-links"

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
    title: `${niche.label} Certifications — What to Look for in ${cityConfig.name}, ${cityConfig.stateCode}`,
    description: `Essential ${content.serviceLabel} certifications and licenses to verify when hiring in ${cityConfig.name}. What each certification means, why it matters, and how to verify.`,
    alternates: { canonical: `https://${cityConfig.domain}/${slug}/certifications` },
  }
}

// ── Certification details per niche ───────────────────────────────
const CERT_DETAILS: Record<string, { name: string; what: string; why: string; verify: string }[]> = {
  plumbing: [
    { name: "Pennsylvania State Plumbing License", what: "State-issued license demonstrating that the plumber has completed required apprenticeship hours, passed a competency exam, and meets ongoing education requirements.", why: "PA law requires plumbers to be licensed. Unlicensed plumbing work can void insurance claims, create code violations, and result in substandard repairs.", verify: "Check through the PA Department of Labor & Industry or ask the plumber for their license number and verify it online." },
    { name: "EPA Lead-Safe Certified", what: "Federal certification required for contractors working on homes built before 1978 where lead paint may be disturbed during renovations.", why: "Many Erie homes predate 1978 and contain lead paint. Disturbing lead paint without proper procedures creates serious health hazards, especially for children.", verify: "Search the EPA's Lead-Safe Certified Firm database at epa.gov/lead or ask for the firm's EPA certification number." },
    { name: "Backflow Prevention Certification", what: "Specialized training in the installation, testing, and maintenance of backflow prevention devices that protect water supplies.", why: "Erie requires annual backflow testing for certain installations. Only certified technicians can perform this testing.", verify: "Ask for their backflow certification card. Check with the Erie Water Works for approved testers." },
    { name: "Natural Gas Line Certification", what: "Additional certification for working on gas piping systems, including gas water heaters, furnaces, and gas line installations.", why: "Improper gas work creates explosion and carbon monoxide risks. Gas line work requires specific training beyond standard plumbing.", verify: "Ask for documentation of their gas line certification. Verify they carry appropriate liability insurance for gas work." },
    { name: "OSHA Safety Certification", what: "Occupational Safety and Health Administration training in workplace safety practices for construction and service trades.", why: "OSHA-certified plumbers follow proper safety protocols, reducing risk of injury on your property and demonstrating professional standards.", verify: "Ask for their OSHA training card or certificate. Most reputable companies require this for all technicians." },
  ],
  hvac: [
    { name: "EPA 608 Certification", what: "Federal certification required for technicians who handle refrigerants used in air conditioning and heat pump systems.", why: "It is illegal to work with refrigerants without this certification. Improper handling damages the ozone layer and can be dangerous.", verify: "Ask to see their EPA 608 card. There are four types: I, II, III, and Universal. Universal covers all equipment types." },
    { name: "NATE Certification", what: "North American Technician Excellence certification — the leading third-party certification for HVAC technicians, covering installation and service competency.", why: "NATE-certified technicians have demonstrated advanced knowledge beyond minimum licensing requirements, typically delivering higher-quality work.", verify: "Search the NATE directory at natex.org or ask for the technician's NATE certification number." },
    { name: "PA Contractor Registration", what: "Registration with the Pennsylvania Attorney General's office required for HVAC contractors performing home improvement work over $500.", why: "Registration provides consumer protection through the PA Home Improvement Consumer Protection Act, including access to the recovery fund.", verify: "Search the PA Attorney General's Home Improvement Contractor database online." },
    { name: "Manufacturer Certifications", what: "Training and certification from specific equipment manufacturers like Carrier, Trane, Lennox, or Mitsubishi for installation and service.", why: "Manufacturer-certified installers ensure proper installation, which is critical for warranty validity and system performance in Erie's climate.", verify: "Ask which manufacturers they are certified with and verify through the manufacturer's dealer locator." },
    { name: "OSHA 10/30 Hour Training", what: "OSHA safety training covering hazard recognition, electrical safety, fall protection, and other construction safety topics.", why: "HVAC work involves electrical, gas, and elevated work. OSHA training reduces accident risk on your property.", verify: "Ask for their OSHA completion card. The 30-hour course indicates more comprehensive safety training." },
  ],
  electrical: [
    { name: "Pennsylvania Electrical License", what: "State license issued after completing apprenticeship requirements, passing a comprehensive exam, and demonstrating competency in the National Electrical Code.", why: "Unlicensed electrical work is illegal in PA and dangerous. It can void insurance, create fire hazards, and cause problems when selling your home.", verify: "Check through the PA Department of Labor & Industry. Ask for the license number and verify the license type (journeyman vs. master)." },
    { name: "Master Electrician License", what: "The highest level of electrical licensing, requiring additional years of experience and a more advanced examination.", why: "Master electricians can sign off on permits, supervise other electricians, and handle the most complex residential and commercial work.", verify: "Verify through the PA Department of Labor & Industry. Only master electricians can pull certain permits." },
    { name: "EPA Lead Renovator Certification", what: "Required for electrical work in homes built before 1978 that may disturb lead paint during rewiring, panel upgrades, or fixture installation.", why: "Electrical work in older Erie homes often requires cutting into walls where lead paint is present. Certified renovators follow safe practices.", verify: "Check the EPA's Lead-Safe Certified Firm database. The certification covers the firm, not individual workers." },
    { name: "OSHA Safety Training", what: "Occupational safety training covering electrical safety, lockout/tagout procedures, fall protection, and other construction hazards.", why: "Electrical work is inherently dangerous. OSHA-trained electricians follow protocols that protect both themselves and your property.", verify: "Ask for their OSHA training certificate. Most professional electrical companies require this for all field personnel." },
    { name: "Generator Installation Certification", what: "Manufacturer-specific training for installing whole-house standby generators from brands like Generac, Kohler, or Briggs & Stratton.", why: "Generator installation involves gas, electrical, and automatic transfer switch work. Proper installation is critical for safety and warranty coverage.", verify: "Check the manufacturer's authorized dealer/installer directory. Only certified installers maintain full warranty coverage." },
  ],
  roofing: [
    { name: "PA Home Improvement Contractor Registration", what: "Registration with the Pennsylvania Attorney General's office, required for roofing contractors performing residential work.", why: "Registered contractors are subject to the PA Home Improvement Consumer Protection Act, giving you legal recourse through the state recovery fund.", verify: "Search the PA Attorney General's contractor database. Every legitimate roofer should have this registration." },
    { name: "GAF Master Elite Certification", what: "GAF's highest contractor tier, limited to the top 2% of roofers nationally. Requires proven track record, licensing, insurance, and ongoing training.", why: "Master Elite contractors offer GAF's best warranties, including the Golden Pledge limited warranty covering both materials and workmanship.", verify: "Search GAF's contractor directory at gaf.com. Verify the contractor is currently active, not just previously certified." },
    { name: "CertainTeed SELECT ShingleMaster", what: "CertainTeed's premium contractor program requiring product knowledge certification, proper insurance, and quality standards.", why: "SELECT ShingleMaster contractors can offer CertainTeed's SureStart Plus extended warranty, providing better protection for your investment.", verify: "Search CertainTeed's contractor locator at certainteed.com." },
    { name: "OSHA Fall Protection Certification", what: "Specialized safety training for working at heights, including harness use, guardrail systems, and rescue procedures.", why: "Roofing is one of the most dangerous trades. OSHA-trained crews are less likely to have accidents on your property, which protects you from liability.", verify: "Ask about their fall protection program and OSHA training documentation." },
    { name: "Liability Insurance and Workers' Compensation", what: "Insurance covering property damage caused by the contractor and injuries to workers on your property.", why: "Without workers' comp, you could be liable for a roofer injured on your property. Without liability insurance, damage to your home has no coverage.", verify: "Request a certificate of insurance and call the insurer to verify it is current. Do this before any work begins." },
  ],
  landscaping: [
    { name: "PA Pesticide Applicator License", what: "State license required for applying pesticides, herbicides, and fertilizers commercially. Issued by the PA Department of Agriculture.", why: "Improper chemical application damages lawns, contaminates water, and poses health risks. Licensed applicators know proper rates, timing, and safety.", verify: "Check with the PA Department of Agriculture. Ask for their license category — Category 6 covers lawn and turf." },
    { name: "ISA Certified Arborist", what: "Certification from the International Society of Arboriculture demonstrating expertise in tree care, including planting, pruning, and removal.", why: "Tree work is dangerous and expensive to fix if done wrong. Certified arborists protect your trees and property from amateur damage.", verify: "Search the ISA directory at treesaregood.org. Certification requires ongoing education to maintain." },
    { name: "ICPI Certified Installer", what: "Certification from the Interlocking Concrete Pavement Institute for paver and retaining wall installation.", why: "Proper base preparation and installation are critical in Erie's freeze-thaw climate. ICPI-certified installers follow industry best practices.", verify: "Search the ICPI contractor directory at icpi.org. Ask to see their certification card." },
    { name: "Landscape Industry Certified", what: "Certification from the National Association of Landscape Professionals demonstrating comprehensive landscape knowledge.", why: "This certification covers horticulture, design, installation, and maintenance — indicating a well-rounded professional.", verify: "Search the NALP directory at landscapeprofessionals.org." },
    { name: "General Liability Insurance", what: "Insurance covering damage to your property caused during landscaping work, including equipment damage, broken irrigation, and plant replacement.", why: "Landscaping equipment can damage buried utilities, irrigation systems, and existing plantings. Insurance protects you from bearing these costs.", verify: "Request a certificate of insurance before work begins. Verify the coverage amount is adequate for your project scope." },
  ],
  dental: [
    { name: "Pennsylvania Dental License", what: "License issued by the PA State Board of Dentistry after completing an accredited dental program and passing national and state board examinations.", why: "A dental license is the minimum requirement to practice. It confirms the dentist completed accredited education and demonstrated clinical competency.", verify: "Search the PA Department of State license verification portal at pals.pa.gov." },
    { name: "Board Certification (Specialty)", what: "Additional certification from a specialty board (orthodontics, periodontics, endodontics, etc.) requiring additional years of residency training.", why: "Board-certified specialists have completed advanced training beyond general dentistry. For complex procedures, specialty training matters.", verify: "Check the relevant specialty board's directory (ABO for orthodontics, ABP for periodontics, ABE for endodontics)." },
    { name: "Invisalign Certified Provider", what: "Certification from Align Technology to provide Invisalign clear aligner treatment. Different tiers indicate experience volume.", why: "Higher-tier Invisalign providers (Gold, Platinum, Diamond) have treated more cases and typically deliver better results for complex alignment issues.", verify: "Search the Invisalign doctor locator at invisalign.com. Provider tier is listed with each profile." },
    { name: "AAID Implant Certification", what: "Credentialing from the American Academy of Implant Dentistry, demonstrating advanced training and experience in dental implant placement.", why: "Dental implants require surgical skill and precision. AAID-credentialed dentists have demonstrated competency through case presentation and examination.", verify: "Search the AAID member directory at aaid.com." },
    { name: "Sedation Dentistry Certification", what: "State-issued permit for administering sedation, from nitrous oxide (minimal) to IV sedation (moderate/deep). Requires additional training and facility requirements.", why: "If you need sedation for dental anxiety, verify the dentist holds the appropriate sedation permit. Different levels have different safety requirements.", verify: "Check with the PA State Board of Dentistry for the dentist's sedation permit level." },
  ],
  legal: [
    { name: "Pennsylvania Bar Admission", what: "Admission to practice law in Pennsylvania after passing the PA bar examination and character and fitness review.", why: "Only attorneys admitted to the PA bar can practice law in Pennsylvania. Practicing without admission is a crime.", verify: "Search the Pennsylvania Disciplinary Board of the Supreme Court attorney database at padisciplinaryboard.org." },
    { name: "Board Certification (Specialty)", what: "Recognition from specialty boards in areas like trial advocacy, family law, or estate planning, indicating advanced expertise.", why: "Board-certified attorneys have demonstrated exceptional competence in their specialty area through examination and peer review.", verify: "Check the relevant certification body. The National Board of Trial Advocacy and American Board of Certification are common certifiers." },
    { name: "Super Lawyers Selection", what: "A peer-nominated and research-verified listing of outstanding attorneys, with no more than 5% of attorneys in each state selected.", why: "Super Lawyers selection is based on peer recognition, professional achievement, and independent research — not advertising dollars.", verify: "Search superlawyers.com. Verify the year of selection is current." },
    { name: "Martindale-Hubbell AV Rating", what: "The highest peer review rating from Martindale-Hubbell, indicating the highest level of professional excellence and ethical standards.", why: "AV ratings reflect peer assessment of legal ability and ethical conduct. An AV-rated attorney is highly regarded by other lawyers.", verify: "Search martindale.com. Ratings include AV Preeminent, BV Distinguished, and peer-reviewed." },
    { name: "Malpractice Insurance", what: "Professional liability insurance that covers attorneys against claims of professional negligence or errors.", why: "While not required in PA, attorneys who carry malpractice insurance protect their clients against financial loss from professional mistakes.", verify: "Ask directly. Most reputable attorneys voluntarily carry this coverage and will confirm upon request." },
  ],
  cleaning: [
    { name: "Surety Bond", what: "A financial guarantee that the cleaning company will compensate clients for theft or dishonesty by their employees.", why: "A bond provides financial protection beyond what insurance covers. It specifically addresses employee dishonesty — important when workers are in your home.", verify: "Ask for the bond number and the surety company. You can verify by contacting the surety directly." },
    { name: "General Liability Insurance", what: "Insurance covering accidental property damage during cleaning, such as broken items, water damage, or chemical damage to surfaces.", why: "Without insurance, you would have to sue the cleaning company to recover costs from accidental damage. Insurance streamlines the claims process.", verify: "Request a certificate of insurance. Verify coverage amount is at least $1 million for residential cleaning." },
    { name: "IICRC Certification", what: "Institute of Inspection, Cleaning and Restoration Certification — the leading credentialing body for carpet cleaning, water damage restoration, and mold remediation.", why: "IICRC-certified technicians have trained in proper methods and products for specific cleaning challenges. This matters for carpet cleaning and restoration work.", verify: "Search the IICRC certified firm directory at iicrc.org." },
    { name: "Green Seal Certification", what: "Certification verifying that a cleaning company uses environmentally responsible products and practices.", why: "If you have health concerns, children, pets, or simply prefer eco-friendly service, Green Seal certification ensures genuine green practices.", verify: "Search the Green Seal certified products and services directory at greenseal.org." },
    { name: "Background Check Program", what: "A documented program of criminal background screening for all employees who enter client homes.", why: "Cleaning workers have access to your home, valuables, and personal space. Background checks provide an essential layer of trust and safety.", verify: "Ask about their screening process. Reputable companies will describe their program and may provide documentation." },
  ],
  "auto-repair": [
    { name: "ASE Certification", what: "Automotive Service Excellence certifications in specific areas like engine repair, brakes, electrical systems, and more. Master Technician designation requires all major certifications.", why: "ASE certification proves a mechanic has passed rigorous standardized tests in their specialty areas. It is the industry's primary quality indicator.", verify: "Ask for their ASE credentials. Search the ASE Blue Seal directory at ase.com for recognized shops." },
    { name: "PA State Inspection License", what: "Authorization from PennDOT to perform Pennsylvania annual safety and emissions inspections.", why: "Not all shops can perform PA inspections. If you need inspection service, verify the shop holds a current inspection license.", verify: "Look for the PennDOT inspection station sign. Verify through the PennDOT station locator." },
    { name: "AAA Approved Auto Repair", what: "Designation from AAA for shops meeting their quality standards, including customer satisfaction, technician certification, and warranty offerings.", why: "AAA-approved shops agree to arbitration for disputes and maintain customer satisfaction scores. This provides built-in consumer protection.", verify: "Search the AAA Approved Auto Repair directory at aaa.com." },
    { name: "Manufacturer Dealer Certification", what: "Factory training and certification to service specific vehicle brands (Ford, GM, Toyota, etc.) using factory diagnostic tools and procedures.", why: "Dealer-certified technicians have brand-specific training and access to the latest factory technical bulletins and diagnostic software.", verify: "Ask which brands they are factory-trained for. Check the manufacturer's service center locator." },
    { name: "I-CAR Certification (Body Shops)", what: "Inter-Industry Conference on Auto Collision Repair certification for collision repair facilities and technicians.", why: "Modern vehicles use advanced materials and technology that require specialized repair knowledge. I-CAR certification ensures proper repair procedures.", verify: "Search the I-CAR Gold Class directory at i-car.com." },
  ],
  "pest-control": [
    { name: "PA Pesticide Applicator License", what: "State license from the PA Department of Agriculture required for commercial application of pesticides. Requires exam passage and continuing education.", why: "Unlicensed pesticide application is illegal and dangerous. Licensed applicators understand proper products, application rates, and safety procedures.", verify: "Ask for their license number and verify with the PA Department of Agriculture pesticide compliance office." },
    { name: "QualityPro Certification", what: "Certification from the National Pest Management Association requiring companies to meet standards for employee screening, training, insurance, and service quality.", why: "QualityPro companies exceed minimum industry standards and follow best practices for safe, effective pest management.", verify: "Search the QualityPro directory at npmpestworld.org." },
    { name: "GreenPro Certification", what: "NPMA certification for companies offering environmentally responsible pest management using IPM principles and reduced-risk products.", why: "If you prefer eco-friendly pest control — especially around children, pets, and gardens — GreenPro certification ensures genuine IPM practices.", verify: "Search the GreenPro directory at npmpestworld.org." },
    { name: "Termite Specialist Certification", what: "Additional training and certification specifically for termite identification, treatment, and prevention methods.", why: "Termite treatment is highly specialized. Improper treatment wastes money and allows continued structural damage to your home.", verify: "Ask about their termite-specific training and which treatment systems they are certified to install (Sentricon, Termidor, etc.)." },
    { name: "Wildlife Control Operator License", what: "PA Game Commission license required for trapping and relocating wildlife such as raccoons, squirrels, and bats.", why: "Pennsylvania has specific regulations protecting wildlife. Licensed operators follow legal and humane removal practices.", verify: "Ask for their WCO license number. Verify with the PA Game Commission." },
  ],
  painting: [
    { name: "PA Home Improvement Contractor Registration", what: "Registration with the PA Attorney General's office required for painting contractors performing residential work over $500.", why: "Registered contractors are subject to consumer protection laws. The registration provides access to the PA recovery fund for disputes.", verify: "Search the PA Attorney General's Home Improvement Contractor database online." },
    { name: "EPA Lead-Safe Certified Firm", what: "Federal certification required for any contractor disturbing more than 6 square feet of lead paint in homes built before 1978.", why: "Erie has thousands of pre-1978 homes with lead paint. Non-certified contractors who disturb lead paint create health hazards and face federal fines.", verify: "Search the EPA Lead-Safe Certified Firm database at epa.gov/lead. Verify the firm's certification is current." },
    { name: "Manufacturer Certified Applicator", what: "Training and certification from premium paint manufacturers like Sherwin-Williams, Benjamin Moore, or PPG for proper product application.", why: "Manufacturer-trained painters know the specific preparation, application, and curing requirements for each product, delivering longer-lasting results.", verify: "Ask which manufacturer programs they have completed. Check with the manufacturer's contractor program." },
    { name: "OSHA Safety Training", what: "Safety training covering ladder safety, fall protection, respiratory protection, and hazardous material handling.", why: "Painting involves ladder work, chemical exposure, and sometimes elevated access. OSHA-trained crews work safely on your property.", verify: "Ask about their safety training program. Companies with strong safety cultures typically highlight this." },
    { name: "General Liability Insurance", what: "Insurance covering property damage caused during painting work, including paint spills, ladder damage, and accidental breakage.", why: "Painting involves moving furniture, using ladders against surfaces, and applying chemicals. Insurance protects you from bearing the cost of accidents.", verify: "Request a certificate of insurance before work begins. Verify the policy is active by calling the insurer." },
  ],
  "real-estate": [
    { name: "Pennsylvania Real Estate License", what: "State license issued by the PA Real Estate Commission after completing 75 hours of pre-licensing education and passing the state exam.", why: "Only licensed agents can represent buyers and sellers in real estate transactions. Working with an unlicensed individual provides no legal protections.", verify: "Search the PA Department of State license verification portal at pals.pa.gov." },
    { name: "Realtor Designation (NAR Member)", what: "Membership in the National Association of Realtors, requiring adherence to a strict Code of Ethics above and beyond state licensing requirements.", why: "Realtors follow a code of ethics that includes honesty, fair dealing, and putting client interests first. Not all licensed agents are Realtors.", verify: "Search the NAR member directory at realtor.com. The Realtor designation indicates NAR membership." },
    { name: "CRS (Certified Residential Specialist)", what: "Advanced certification from the Residential Real Estate Council, held by only 3% of agents. Requires proven transaction volume and advanced training.", why: "CRS agents have demonstrated extensive experience and advanced knowledge in residential transactions, typically outperforming non-certified agents.", verify: "Search the CRS directory at crs.com." },
    { name: "ABR (Accredited Buyer Representative)", what: "Certification demonstrating specialized training in representing home buyers throughout the purchase process.", why: "ABR agents understand buyer-specific strategies, including negotiation, inspection contingencies, and protecting buyer interests.", verify: "Search the ABR directory through the Real Estate Buyer's Agent Council (REBAC)." },
    { name: "SRS (Seller Representative Specialist)", what: "Certification demonstrating specialized training in representing home sellers, including pricing strategy, marketing, and negotiation.", why: "SRS agents bring specific expertise in listing strategy, staging, pricing, and seller-side negotiation tactics.", verify: "Search the SRS directory through the Real Estate Buyer's Agent Council." },
  ],
}

export default async function NicheCertificationsPage({ params }: Props) {
  const { niche: slug } = await params
  const niche = getNicheBySlug(slug)
  const content = getNicheContent(slug)
  if (!niche || !content) notFound()

  const certDetails = CERT_DETAILS[slug] ?? []

  const certJsonLd = certDetails.length > 0 ? {
    "@context": "https://schema.org",
    "@type": "ItemList",
    "@id": `https://${cityConfig.domain}/${slug}/certifications#certlist`,
    name: `${niche.label} Certifications to Look For in ${cityConfig.name}, ${cityConfig.stateCode}`,
    description: `Essential ${content.serviceLabel} certifications and licenses to verify when hiring in ${cityConfig.name}.`,
    numberOfItems: certDetails.length,
    itemListElement: certDetails.map((cert, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: cert.name,
      description: cert.what,
    })),
  } : null

  return (
    <>
      {certJsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(certJsonLd) }}
        />
      )}
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
                <BreadcrumbPage>Certifications</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>
      </div>

      {/* ── Hero ──────────────────────────────────────────────── */}
      <section className="border-b bg-muted/30 pb-12 pt-10">
        <div className="mx-auto max-w-4xl px-4 text-center sm:px-6">
          <Badge variant="secondary" className="mb-4">
            <Award className="mr-1.5 h-3 w-3" />
            Certifications Guide
          </Badge>
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
            {niche.label} Certifications to Look For
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-lg text-muted-foreground">
            Know which certifications and licenses matter when hiring{" "}
            {content.pluralLabel.toLowerCase()} in {cityConfig.name},{" "}
            {cityConfig.stateCode}. What each one means, why it matters, and
            how to verify.
          </p>
        </div>
      </section>

      {/* ── Quick Reference Badges ────────────────────────────── */}
      <section className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
        <div className="flex flex-wrap justify-center gap-2">
          {content.certifications.map((cert, i) => (
            <Badge key={i} variant="outline" className="py-1.5 px-3 text-sm">
              <CheckCircle2 className="mr-1.5 h-3.5 w-3.5 text-green-600" />
              {cert}
            </Badge>
          ))}
        </div>
      </section>

      {/* ── Detailed Certification Cards ──────────────────────── */}
      <section className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
        <div className="space-y-6">
          {certDetails.map((cert, i) => (
            <Card key={i}>
              <CardHeader className="pb-3">
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                    <Award className="h-5 w-5 text-primary" />
                  </div>
                  <CardTitle className="text-lg">{cert.name}</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="text-sm font-semibold mb-1">What It Is</h4>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {cert.what}
                  </p>
                </div>
                <div>
                  <h4 className="text-sm font-semibold mb-1">Why It Matters</h4>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {cert.why}
                  </p>
                </div>
                <div>
                  <h4 className="text-sm font-semibold mb-1 flex items-center gap-1">
                    <ExternalLink className="h-3.5 w-3.5" />
                    How to Verify
                  </h4>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {cert.verify}
                  </p>
                </div>
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
            Every provider on {cityConfig.domain} is verified
          </h2>
          <p className="mt-2 text-muted-foreground">
            We verify licensing, insurance, and credentials for every{" "}
            {niche.label.toLowerCase()} professional on our platform, so you do
            not have to.
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

      <InternalLinks niche={slug} currentPage="certifications" />
    </main>
    </>
  )
}
