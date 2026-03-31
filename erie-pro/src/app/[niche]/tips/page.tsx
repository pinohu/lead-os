import Link from "next/link"
import { notFound } from "next/navigation"
import type { Metadata } from "next"
import { Lightbulb, ArrowRight, Zap } from "lucide-react"
import { cityConfig } from "@/lib/city-config"
import { getNicheBySlug } from "@/lib/niches"
import { getNicheContent, getAllNicheSlugs } from "@/lib/niche-content"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
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
    title: `${niche.label} Tips — Quick Advice for ${cityConfig.name} Homeowners`,
    description: `Actionable ${content.serviceLabel} tips for ${cityConfig.name}, ${cityConfig.stateCode} homeowners. Save money, avoid problems, and know when to call a professional.`,
    alternates: { canonical: `https://erie.pro/${slug}/tips` },
  }
}

// ── Quick tips per niche ──────────────────────────────────────────
const TIPS_DATA: Record<string, { tip: string; detail: string }[]> = {
  plumbing: [
    { tip: "Know where your main shutoff valve is", detail: "In a burst pipe emergency, shutting off water in seconds rather than minutes can prevent thousands of dollars in damage." },
    { tip: "Never pour grease down the drain", detail: "Grease solidifies in pipes and causes stubborn clogs. Collect grease in a container and dispose of it in the trash." },
    { tip: "Run cold water when using the garbage disposal", detail: "Cold water solidifies grease so the disposal can chop it up. Run water for 15 seconds after turning off the disposal." },
    { tip: "Insulate pipes before winter, not during", detail: "Foam pipe insulation costs $1-$3 per 6-foot section. Install it in October before Erie's first freeze, not during a January emergency." },
    { tip: "Test your sump pump before storm season", detail: "Pour a bucket of water into the pit. The pump should activate within seconds, drain the water, and shut off automatically." },
    { tip: "Fix dripping faucets promptly", detail: "A faucet dripping once per second wastes over 3,000 gallons per year. A $5 washer replacement solves most drips." },
    { tip: "Never use chemical drain cleaners", detail: "They damage pipes (especially older Erie homes with cast iron) and rarely clear the underlying problem. Use a drain snake instead." },
    { tip: "Keep your water heater at 120 degrees", detail: "Higher settings waste energy and risk scalding. Lower than 120 risks bacteria growth. Check the dial on your water heater." },
    { tip: "Flush your water heater annually", detail: "Erie's hard water causes sediment buildup. Draining 2-3 gallons from the tank's bottom valve removes sediment and improves efficiency." },
    { tip: "Open cabinet doors during extreme cold", detail: "When temperatures drop below zero, opening kitchen and bathroom cabinet doors lets warm air circulate around pipes on exterior walls." },
    { tip: "Know the difference between a clog and a sewer problem", detail: "One slow drain is usually a clog. Multiple slow drains or sewage backups indicate a sewer line issue requiring professional attention." },
    { tip: "Disconnect outdoor hoses before the first freeze", detail: "Water trapped in a connected hose can freeze backward into the faucet and burst the pipe inside the wall." },
    { tip: "Install water leak detectors", detail: "Battery-powered leak sensors near water heaters, washing machines, and sump pumps alert you before small leaks become major damage." },
    { tip: "Schedule maintenance in the off-season", detail: "Summer is the slow season for plumbers in Erie. You will get faster scheduling and may find better pricing." },
  ],
  hvac: [
    { tip: "Change your filter monthly during peak season", detail: "A dirty filter forces your system to work harder, increasing energy bills and shortening equipment life." },
    { tip: "Keep vents and registers unblocked", detail: "Furniture, rugs, and curtains covering vents create pressure imbalances that reduce comfort and strain the system." },
    { tip: "Set your thermostat and leave it", detail: "Constantly adjusting the thermostat wastes energy. Use a programmable or smart thermostat to automate temperature changes." },
    { tip: "Schedule tune-ups before the season", detail: "A fall furnace tune-up and spring AC tune-up prevent breakdowns when you need the system most." },
    { tip: "Clear 2 feet around the outdoor condenser", detail: "Vegetation, leaves, and debris restrict airflow. Keep the area around your outdoor unit clear year-round." },
    { tip: "Use ceiling fans to complement HVAC", detail: "Counter-clockwise in summer pushes air down. Clockwise in winter at low speed circulates warm air. This can save 10% on heating and cooling." },
    { tip: "Seal duct connections with mastic", detail: "Duct tape (ironically) fails on ducts. Mastic sealant or metal tape creates permanent seals that prevent air leakage." },
    { tip: "Do not close vents in unused rooms", detail: "Closing vents increases pressure in the duct system, which can cause leaks and reduce overall system efficiency." },
    { tip: "Install a carbon monoxide detector near bedrooms", detail: "A cracked heat exchanger can leak odorless, deadly CO gas. Detectors are inexpensive life-saving devices." },
    { tip: "Consider a whole-house humidifier", detail: "Erie's winter air drops to 15-20% humidity indoors. A humidifier protects your health, furniture, and hardwood floors." },
    { tip: "Seal windows and doors before winter", detail: "Air leaks around windows and doors make your furnace work harder. Weatherstripping and caulk are inexpensive fixes." },
    { tip: "Know your furnace age and model", detail: "Record the model number and installation date. Most furnaces last 15-20 years. Plan replacement before emergency failure." },
    { tip: "Upgrade to a programmable thermostat", detail: "Dropping the temperature 7-10 degrees while sleeping or away saves up to 10% on heating bills annually." },
  ],
  electrical: [
    { tip: "Test GFCI outlets monthly", detail: "Press the test button — the outlet should cut power. Press reset to restore. Replace any GFCI that fails this test." },
    { tip: "Never overload outlets or power strips", detail: "Overloaded circuits are a leading cause of electrical fires. Spread high-draw devices across different circuits." },
    { tip: "Replace any outlet that feels warm", detail: "A warm outlet indicates loose connections or overloading — both fire hazards. Have an electrician inspect immediately." },
    { tip: "Know which breaker controls what", detail: "Label your breaker panel clearly. In an emergency, you need to cut power to the right circuit without guessing." },
    { tip: "Use LED bulbs throughout your home", detail: "LEDs use 75% less energy and last 25 times longer than incandescent bulbs. The savings are significant over a year." },
    { tip: "Never ignore flickering lights", detail: "Occasional flicker during storms is normal. Persistent flickering indicates loose wiring — a potential fire hazard." },
    { tip: "Install tamper-resistant outlets in homes with children", detail: "Required by current code in new construction, but older Erie homes may still have standard outlets accessible to kids." },
    { tip: "Keep your electrical panel accessible", detail: "Never store items in front of the panel. You need clear access in an emergency, and electricians need working space." },
    { tip: "Invest in a whole-house surge protector", detail: "Erie's summer thunderstorms can destroy electronics. A whole-house surge protector costs $200-$500 installed and protects everything." },
    { tip: "Test your generator regularly", detail: "Run it monthly for 15 minutes under load. A generator that sits unused may not start when you need it during a winter storm." },
    { tip: "Use outdoor-rated extension cords outside", detail: "Indoor cords degrade in weather and can cause shocks or fires. Look for cords rated for outdoor use." },
    { tip: "Upgrade two-prong outlets to grounded three-prong", detail: "Ungrounded outlets in older Erie homes cannot safely power modern electronics. An electrician can add grounding." },
    { tip: "Check smoke detector batteries twice yearly", detail: "Change batteries when you change clocks for daylight saving time. Replace detectors older than 10 years." },
  ],
  roofing: [
    { tip: "Inspect your roof from the ground with binoculars", detail: "Look for missing, curled, or damaged shingles. Catching problems early prevents costly water damage to your interior." },
    { tip: "Never walk on your roof unless you have proper safety equipment", detail: "Falls from roofs cause serious injuries. Use binoculars for inspections and leave roof work to professionals." },
    { tip: "Keep gutters clean", detail: "Clogged gutters cause water to back up under shingles and contribute to ice dam formation in Erie winters." },
    { tip: "Address moss and algae growth", detail: "Black streaks on shingles are algae. Moss growth traps moisture. Both reduce shingle life. Install zinc strips to prevent regrowth." },
    { tip: "Check attic insulation levels", detail: "Proper insulation (R-49 for Erie) keeps warm air from reaching the roof deck, preventing ice dams and reducing energy costs." },
    { tip: "Trim overhanging tree branches", detail: "Branches that touch or overhang the roof cause abrasion damage, drop debris into gutters, and provide wildlife access." },
    { tip: "Remove snow from the first 3-4 feet of eaves", detail: "Use a roof rake from the ground after heavy snowfalls. This reduces ice dam risk without climbing on the roof." },
    { tip: "Check your attic for daylight", detail: "If you can see light through the roof deck from inside the attic, water can get in too. Investigate immediately." },
    { tip: "Ensure proper attic ventilation", detail: "Balanced intake (soffit) and exhaust (ridge) ventilation prevents moisture buildup and ice dams. Both must be unblocked." },
    { tip: "Document your roof's age and materials", detail: "Know when your roof was installed and what warranty remains. Most Erie asphalt roofs last 20-25 years." },
    { tip: "Inspect flashing after every major storm", detail: "Flashing around chimneys, vents, and valleys is the most common leak source. Check for lifted or corroded metal." },
    { tip: "Do not delay repairs", detail: "A small roof leak becomes a big interior problem fast. Water damage to insulation, drywall, and structure compounds quickly." },
  ],
  landscaping: [
    { tip: "Mow high in summer (3-3.5 inches)", detail: "Taller grass shades roots, retains moisture, and naturally crowds out weeds. Never cut more than one-third of the blade height." },
    { tip: "Water deeply but less frequently", detail: "One inch of water per week encourages deep root growth. Frequent light watering creates shallow, drought-vulnerable roots." },
    { tip: "Fall is the best time to seed and fertilize", detail: "September in Erie offers warm soil and cool air — ideal for grass seed germination. Fall fertilizer is the most important application." },
    { tip: "Choose Zone 6a-rated plants", detail: "Erie is USDA Zone 6a. Plants rated for Zone 5 or lower will survive our coldest winters. Check the tag before buying." },
    { tip: "Mulch is not just decorative", detail: "Two to three inches of mulch regulates soil temperature, retains moisture, and suppresses weeds. Keep mulch 3 inches from tree trunks." },
    { tip: "Grade soil away from your foundation", detail: "Soil should slope at least 6 inches over the first 10 feet from your house. This prevents basement water problems." },
    { tip: "Do not bag grass clippings", detail: "Mulched clippings return nitrogen to the soil, reducing the need for fertilizer. Modern mowers mulch effectively." },
    { tip: "Test your soil before major projects", detail: "A $15 soil test from Penn State Extension reveals pH, nutrient levels, and amendment needs. Guessing wastes money." },
    { tip: "Winterize your irrigation system", detail: "Have your sprinkler system blown out with compressed air before Erie's first freeze. Frozen pipes crack and flood." },
    { tip: "Plant trees in fall for best results", detail: "Fall planting gives roots time to establish before the stress of summer heat. Water new trees weekly until the ground freezes." },
    { tip: "Use native plants for low maintenance", detail: "Plants native to the Lake Erie region require less water, fertilizer, and pest control than exotic species." },
    { tip: "Edge your beds for a clean, professional look", detail: "A defined edge between lawn and beds instantly improves curb appeal and takes just an hour to maintain monthly." },
    { tip: "Never salt near landscaping", detail: "Road salt damages grass, shrubs, and soil structure. Use calcium chloride or sand near plant beds and lawn edges." },
  ],
  dental: [
    { tip: "Brush for two full minutes, twice daily", detail: "Most people brush for 30-45 seconds. Use a timer or an electric toothbrush with a built-in timer to ensure adequate cleaning." },
    { tip: "Floss daily — there is no substitute", detail: "Brushing only cleans 60% of tooth surfaces. Flossing removes plaque and food from between teeth where cavities often start." },
    { tip: "Replace your toothbrush every 3 months", detail: "Frayed bristles clean poorly. Replace sooner if you have been sick. Electric toothbrush heads follow the same timeline." },
    { tip: "Do not skip dental checkups", detail: "Cavities, gum disease, and oral cancer are often painless in early stages. Regular checkups catch problems when treatment is simple and affordable." },
    { tip: "Drink water after meals and snacks", detail: "Water rinses away food particles and acids. It also stimulates saliva production, which is your mouth's natural defense against decay." },
    { tip: "Limit sugary and acidic drinks", detail: "Soda, sports drinks, and fruit juice bathe teeth in sugar and acid. If you drink them, use a straw and rinse with water after." },
    { tip: "Chew sugar-free gum after meals", detail: "Xylitol-sweetened gum stimulates saliva and actually inhibits cavity-causing bacteria. It is not a substitute for brushing but helps between meals." },
    { tip: "Wear a mouthguard for sports", detail: "A custom-fitted mouthguard from your dentist provides far better protection than a store-bought boil-and-bite option." },
    { tip: "Do not use teeth as tools", detail: "Opening packages, tearing tape, or cracking nuts with your teeth risks chips, cracks, and expensive dental repairs." },
    { tip: "Address tooth sensitivity early", detail: "Sensitivity to hot, cold, or sweet often indicates decay, a crack, or gum recession. Early treatment prevents larger problems." },
    { tip: "Ask about dental sealants for children", detail: "Sealants protect the chewing surfaces of back teeth — where most childhood cavities occur. They are painless and cost-effective." },
    { tip: "Know your dental insurance benefits", detail: "Most plans cover two cleanings per year. Use both. Schedule any recommended treatment before your benefit year ends." },
    { tip: "Tell your dentist about all medications", detail: "Many medications cause dry mouth, which increases cavity risk. Your dentist can recommend solutions." },
  ],
  legal: [
    { tip: "Never sign anything you do not understand", detail: "Take contracts home and read them. If language is unclear, have an attorney review it before you sign." },
    { tip: "Keep organized records of everything", detail: "Contracts, correspondence, receipts, and notes from conversations become critical evidence if disputes arise." },
    { tip: "Get legal advice before you need it", detail: "A 30-minute consultation about a contract or business decision is far cheaper than litigation after a problem develops." },
    { tip: "Statute of limitations matters — do not wait", detail: "Pennsylvania has strict deadlines for filing lawsuits. Waiting too long can permanently forfeit your right to legal action." },
    { tip: "Create a will regardless of your age", detail: "Without a will, Pennsylvania law determines who inherits your assets. A basic will costs $300-$600 and gives you control." },
    { tip: "Update your estate plan after major life events", detail: "Marriage, divorce, children, property purchases, and retirement all warrant updates to your will, trusts, and beneficiaries." },
    { tip: "Understand the difference between power of attorney types", detail: "A financial POA handles money matters. A healthcare POA makes medical decisions. You should have both." },
    { tip: "Do not talk to insurance adjusters without understanding your rights", detail: "After an accident, the other party's insurance adjuster works for them, not you. Consider consulting an attorney first." },
    { tip: "Small claims court handles disputes up to $12,000 in PA", detail: "For smaller disputes, small claims court is faster and cheaper than hiring an attorney for full litigation." },
    { tip: "Read the fine print on service contracts", detail: "Auto-renewal clauses, binding arbitration, and liability limitations hide in the fine print. Know what you are agreeing to." },
    { tip: "Photograph and document property damage immediately", detail: "Timestamped photos and written descriptions are powerful evidence for insurance claims and legal disputes." },
    { tip: "Know your tenant rights in Pennsylvania", detail: "PA law covers security deposits, lease terms, maintenance responsibilities, and eviction procedures. Know your rights." },
  ],
  cleaning: [
    { tip: "Clean from top to bottom", detail: "Dust and debris fall downward. Start with ceilings and light fixtures, work through counters and furniture, and finish with floors." },
    { tip: "Microfiber cloths outperform everything else", detail: "They trap dust and bacteria rather than spreading them around. Wash and reuse them hundreds of times." },
    { tip: "Let cleaning products sit before wiping", detail: "Most disinfectants need 3-10 minutes of contact time to kill germs. Spraying and immediately wiping is just wiping." },
    { tip: "Vacuum before you mop", detail: "Mopping over loose dirt creates mud and pushes grit into floor surfaces, causing scratches and dull finishes." },
    { tip: "Clean your dishwasher monthly", detail: "Run an empty cycle with a cup of white vinegar to remove mineral deposits and food buildup from Erie's hard water." },
    { tip: "Wash bath towels every 3-4 uses", detail: "Damp towels harbor bacteria and mildew. Hang them spread out to dry between uses and wash in hot water." },
    { tip: "Use baking soda and vinegar for natural cleaning", detail: "This combination handles most household cleaning tasks without harsh chemicals. Safe for families with children and pets." },
    { tip: "Clean your washing machine quarterly", detail: "Run an empty hot cycle with bleach or washing machine cleaner. Front-loaders especially develop mold around the door gasket." },
    { tip: "Declutter before deep cleaning", detail: "Removing clutter first makes cleaning faster and more effective. You cannot deep clean around piles of stuff." },
    { tip: "Focus on high-touch surfaces daily", detail: "Door handles, light switches, countertops, and faucets accumulate the most germs. A quick daily wipe takes 5 minutes." },
    { tip: "Replace your vacuum filter and bag regularly", detail: "A full bag or clogged filter reduces suction by 50% or more. HEPA filters should be replaced per manufacturer recommendations." },
    { tip: "Open windows when possible", detail: "Even 15 minutes of fresh air dramatically improves indoor air quality. During Erie's winter, crack windows briefly during mild spells." },
    { tip: "Set up entry mats at every door", detail: "A quality mat captures 80% of the dirt that would otherwise spread through your home. Use both exterior and interior mats." },
  ],
  "auto-repair": [
    { tip: "Follow your manufacturer's maintenance schedule", detail: "The owner's manual specifies oil change intervals, timing belt replacement, and other critical service. Follow it, not arbitrary rules." },
    { tip: "Check tire pressure monthly", detail: "Tire pressure drops about 1 PSI for every 10-degree temperature change. Under-inflated tires reduce fuel economy and traction." },
    { tip: "Do not ignore the check engine light", detail: "A check engine light can indicate anything from a loose gas cap to a catalytic converter failure. Get it scanned promptly." },
    { tip: "Use winter tires in Erie", detail: "Winter tires dramatically outperform all-seasons in snow and ice. The investment in safety is well worth the seasonal swap." },
    { tip: "Wash your car regularly in winter", detail: "Road salt causes rust. Regular washes — especially the undercarriage — protect your vehicle's structural integrity." },
    { tip: "Find a mechanic before you need one urgently", detail: "Establish a relationship with a trusted shop during routine maintenance. You will make better decisions than in a panic." },
    { tip: "Keep up with oil changes", detail: "Modern synthetic oil allows longer intervals (5,000-10,000 miles depending on the vehicle), but skipping them causes expensive engine damage." },
    { tip: "Listen to new noises", detail: "Squealing, grinding, clicking, and knocking each indicate specific problems. Describe the noise, when it happens, and where it comes from." },
    { tip: "Check your battery before winter", detail: "Cold weather is brutal on batteries. A battery that barely cranks in November will likely fail in January." },
    { tip: "Apply undercoating to protect against Erie road salt", detail: "Annual rust-proofing treatment costs $100-$200 and can add years to your vehicle's life in our heavy-salt environment." },
    { tip: "Get a second opinion on major repairs", detail: "For repairs over $1,000, a second opinion ensures accuracy and fair pricing. Honest shops welcome this practice." },
    { tip: "Keep a winter emergency kit in your vehicle", detail: "Include a blanket, flashlight, jumper cables, ice scraper, small shovel, and snacks. Erie winters can strand you unexpectedly." },
    { tip: "Understand your PA inspection requirements", detail: "Safety inspection is annual. Emissions inspection is required in Erie County. Know when yours expires and plan ahead." },
  ],
  "pest-control": [
    { tip: "Seal every gap larger than a quarter inch", detail: "Mice need only a dime-sized opening. Inspect your foundation, utility entry points, and door sweeps." },
    { tip: "Eliminate standing water", detail: "Mosquitoes breed in stagnant water. Empty flower pot saucers, birdbaths, and clogged gutters regularly." },
    { tip: "Store food in sealed containers", detail: "Open bags of flour, cereal, and pet food attract pantry moths, beetles, and mice. Glass or plastic containers with tight lids solve this." },
    { tip: "Keep firewood 20 feet from your home", detail: "Woodpiles harbor insects, mice, and snakes. Store wood off the ground and away from the foundation." },
    { tip: "Fix moisture problems immediately", detail: "Carpenter ants, termites, and many other pests are attracted to damp wood. Fix leaks and improve ventilation." },
    { tip: "Trim vegetation away from your house", detail: "Bushes and branches touching your home create pest highways. Maintain at least 12 inches of clearance." },
    { tip: "Do not stack cardboard in the basement", detail: "Cardboard provides food and shelter for silverfish, roaches, and mice. Use plastic storage bins instead." },
    { tip: "Vacuum stink bugs rather than crushing them", detail: "Crushing stink bugs releases their defensive odor. Vacuum them and empty the bag outside immediately." },
    { tip: "Schedule treatments before problems start", detail: "Preventive quarterly treatments cost less than reactive emergency treatments and keep your home consistently pest-free." },
    { tip: "Check packages and groceries for hitchhikers", detail: "Roaches, pantry moths, and other pests commonly enter homes in grocery bags, cardboard boxes, and deliveries." },
    { tip: "Use caulk, not spray foam, for small gaps", detail: "Mice can chew through spray foam. Caulk with steel wool for gaps around pipes, and hardware cloth for larger openings." },
    { tip: "Know when to call a professional", detail: "DIY works for minor ant problems. Termites, bed bugs, carpenter ants, and wildlife require professional treatment." },
    { tip: "Keep your yard maintained", detail: "Tall grass, leaf piles, and overgrown areas provide harborage for ticks, mosquitoes, and rodents." },
  ],
  painting: [
    { tip: "Preparation is 80% of a good paint job", detail: "Proper cleaning, scraping, sanding, patching, and priming determine how long your paint job lasts. Never skip prep." },
    { tip: "Invest in quality paint", detail: "Premium paint ($50-$80/gallon) contains more pigment and resin, providing better coverage and durability. It lasts years longer." },
    { tip: "Use primer when changing colors dramatically", detail: "Going from dark to light (or vice versa) without primer means extra coats. Tinted primer saves time and money." },
    { tip: "Paint in the right conditions", detail: "Ideal temperature is 50-85 degrees with low humidity. In Erie, this means May through October for exteriors." },
    { tip: "Test colors on the actual wall", detail: "Paint samples look different under your home's lighting. Test a 2x2 foot patch and observe it at different times of day." },
    { tip: "Always cut in before rolling", detail: "Brush edges, corners, and trim areas first, then roll the large surfaces while the cut-in is still wet for a seamless finish." },
    { tip: "Use two coats minimum", detail: "One coat rarely provides adequate coverage or durability. Two coats ensures uniform color and a longer-lasting finish." },
    { tip: "Check for lead paint in pre-1978 homes", detail: "Disturbing lead paint creates a health hazard, especially for children. Test before sanding or scraping in older Erie homes." },
    { tip: "Store paint properly for touch-ups", detail: "Keep leftover paint in a cool, dry, climate-controlled space. Freezing ruins latex paint. Label cans with the room and date." },
    { tip: "Do not paint over peeling or flaking paint", detail: "New paint will not adhere to failing old paint. Scrape, sand, prime, and then paint for a lasting result." },
    { tip: "Use the right sheen for each room", detail: "Flat for ceilings, eggshell for living areas, satin for hallways, semi-gloss for kitchens and baths, gloss for trim." },
    { tip: "Clean brushes and rollers properly", detail: "Quality brushes last for years with proper cleaning. Latex paint rinses with water; oil-based requires mineral spirits." },
    { tip: "Ventilate when painting indoors", detail: "Even low-VOC paints need airflow. Use fans and open doors when painting during Erie's closed-window winter months." },
  ],
  "real-estate": [
    { tip: "Get pre-approved before you start looking", detail: "Pre-approval tells you exactly what you can afford and shows sellers you are a serious buyer." },
    { tip: "Research neighborhoods thoroughly", detail: "Visit at different times of day. Check school ratings, crime statistics, flood zones, and planned development." },
    { tip: "Do not skip the home inspection", detail: "A $400-$600 inspection can reveal problems worth tens of thousands. Never waive the inspection contingency to win a bidding war." },
    { tip: "Understand Erie's property tax rates", detail: "Erie County property taxes vary significantly by municipality. Factor taxes into your monthly budget, not just the mortgage." },
    { tip: "Budget for more than the down payment", detail: "Closing costs (2-5% for buyers) plus moving expenses, immediate repairs, and furnishing add up quickly." },
    { tip: "Check the basement carefully in Erie homes", detail: "Water infiltration is common in older Erie homes. Look for stains, patches, dehumidifiers, and sump pumps." },
    { tip: "Ask about the roof age during home tours", detail: "A roof replacement costs $8,000-$15,000 in Erie. Knowing the roof age helps you budget for this inevitable expense." },
    { tip: "Get a sewer scope on older homes", detail: "Clay and cast-iron sewer lines in older Erie neighborhoods fail. A $150-$400 camera inspection prevents $5,000+ surprises." },
    { tip: "Review utility costs before buying", detail: "Ask for 12 months of utility bills. Erie's heating costs vary dramatically based on home age, insulation, and system efficiency." },
    { tip: "Make your offer competitive but not emotional", detail: "Set a maximum price before making an offer and stick to it. There will always be another house." },
    { tip: "Time your sale strategically", detail: "Spring listing season (March-May) typically brings the most buyers and highest prices in the Erie market." },
    { tip: "Invest in professional photography when selling", detail: "Professional photos generate significantly more online interest than phone photos. Most buyers start their search online." },
    { tip: "Consider a pre-listing inspection", detail: "Finding and fixing problems before listing eliminates surprises during negotiations and gives buyers confidence." },
    { tip: "Keep records of all home improvements", detail: "Documented improvements with receipts increase your home's perceived value and support your asking price." },
  ],
}

export default async function NicheTipsPage({ params }: Props) {
  const { niche: slug } = await params
  const niche = getNicheBySlug(slug)
  const content = getNicheContent(slug)
  if (!niche || !content) notFound()

  const tips = TIPS_DATA[slug] ?? []

  const tipsJsonLd = tips.length > 0 ? {
    "@context": "https://schema.org",
    "@type": "HowTo",
    "@id": `https://erie.pro/${slug}/tips#howto`,
    name: `${niche.label} Tips for ${cityConfig.name} Homeowners`,
    description: `Actionable ${content.serviceLabel} tips for ${cityConfig.name}, ${cityConfig.stateCode} homeowners. Save money, avoid problems, and know when to call a professional.`,
    step: tips.map((item, i) => ({
      "@type": "HowToTip",
      position: i + 1,
      name: item.tip,
      text: item.detail,
    })),
  } : null

  return (
    <>
      {tipsJsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(tipsJsonLd) }}
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
                <BreadcrumbPage>Quick Tips</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>
      </div>

      {/* ── Hero ──────────────────────────────────────────────── */}
      <section className="border-b bg-muted/30 pb-12 pt-10">
        <div className="mx-auto max-w-4xl px-4 text-center sm:px-6">
          <Badge variant="secondary" className="mb-4">
            <Lightbulb className="mr-1.5 h-3 w-3" />
            Quick Tips
          </Badge>
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
            {niche.label} Tips for {cityConfig.name} Homeowners
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-lg text-muted-foreground">
            Actionable {content.serviceLabel} advice you can use today. Save
            money, prevent problems, and know when to call a professional.
          </p>
        </div>
      </section>

      {/* ── Tips Grid ─────────────────────────────────────────── */}
      <section className="mx-auto max-w-4xl px-4 py-12 sm:px-6">
        <div className="grid gap-4 sm:grid-cols-2">
          {tips.map((item, i) => (
            <Card key={i} className="relative">
              <CardContent className="flex gap-4 py-5">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-bold">
                  {i + 1}
                </div>
                <div>
                  <h3 className="font-semibold text-sm mb-1">{item.tip}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {item.detail}
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
          <Zap className="mx-auto mb-4 h-8 w-8 text-primary/60" />
          <h2 className="text-xl font-bold">
            Need professional {content.serviceLabel}?
          </h2>
          <p className="mt-2 text-muted-foreground">
            Some jobs are best left to professionals. Connect with verified{" "}
            {content.pluralLabel.toLowerCase()} in {cityConfig.name} for expert
            help.
          </p>
          <div className="mt-6 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
            <Button asChild size="lg">
              <Link href={`/${slug}#quote`}>
                {content.ctaPrimary}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg">
              <Link href={`/${slug}/guides`}>In-Depth Guides</Link>
            </Button>
          </div>
        </div>
      </section>

      <InternalLinks niche={slug} currentPage="tips" />
    </main>
    </>
  )
}
