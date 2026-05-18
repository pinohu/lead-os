// ── Educational Content Generator ─────────────────────────────────────
// Per-niche content for the /diy-vs-pro, /red-flags, and /what-to-expect
// pages. Uses slug-pattern matching to surface niche-relevant content with
// a generic fallback for unmatched niches.
//
// Pattern follows the permits page: small set of well-tested heuristics
// keyed on common slug substrings, generic safe defaults otherwise.

import { getNicheBySlug } from "@/lib/niches";
import { getNicheContent } from "@/lib/niche-content";
import { CONCIERGE_PHONE_DISPLAY } from "@/lib/concierge";

// ── DIY-vs-Pro Content ───────────────────────────────────────────────

export interface DiyVsProTier {
  /** Heading e.g. "Safe to DIY" */
  heading: string;
  /** Description sentence */
  description: string;
  /** Example tasks in this tier */
  examples: string[];
  /** Recommendation icon — used by the page to pick a Lucide icon */
  toneSlug: "diy" | "skilled-diy" | "pro-only";
}

export interface DiyVsProContent {
  /** Hero short description for SEO meta */
  intro: string;
  /** Three tiers ordered easiest → hardest */
  tiers: DiyVsProTier[];
  /** Five FAQ items for FAQPage schema */
  faq: Array<{ q: string; a: string }>;
  /** Cost-of-mistake framing — "what could go wrong if I DIY" */
  riskCallout: string;
}

/** Get DIY-vs-pro content for a niche, with patterned defaults. */
export function getDiyVsProContent(nicheSlug: string): DiyVsProContent {
  const niche = getNicheBySlug(nicheSlug);
  const label = niche?.label ?? "service";
  const labelLower = label.toLowerCase();
  const content = getNicheContent(nicheSlug);

  // Niche-pattern matching for tier examples
  if (matches(nicheSlug, ["plumb", "drain", "sewer", "septic", "water-heater"])) {
    return {
      intro: `Knowing when to grab a wrench versus call a licensed Erie plumber saves money on the easy stuff and prevents disasters on the hard stuff.`,
      tiers: [
        {
          heading: "Safe to DIY",
          description: `Tasks any homeowner can handle with basic tools and a YouTube video.`,
          examples: [
            "Plunging a clogged toilet or sink",
            "Replacing a worn-out shower head or faucet aerator",
            "Tightening a leaky compression fitting (hand tools only)",
            "Snaking a hair clog from a tub or sink trap",
            "Replacing a toilet flapper or fill valve",
          ],
          toneSlug: "diy",
        },
        {
          heading: "Skilled DIY (if you have experience)",
          description: `Doable if you've done plumbing work before, have the right tools, and can shut off water confidently.`,
          examples: [
            "Replacing a single faucet (kitchen or bathroom)",
            "Swapping a toilet (if subfloor is sound)",
            "Replacing a P-trap or extending a drain line under a sink",
            "Installing a new shut-off valve on accessible copper or PEX",
          ],
          toneSlug: "skilled-diy",
        },
        {
          heading: "Always call a licensed pro",
          description: `Pennsylvania code, safety, or scope makes these unsuitable for DIY.`,
          examples: [
            "Anything involving the main water shutoff or meter",
            "Water heater replacement (gas, electric, or tankless)",
            "Sewer line repair or replacement",
            "Repiping or main supply line work",
            "Anything inside a wall, floor, or ceiling cavity",
            "Frozen or burst pipe with active leak",
          ],
          toneSlug: "pro-only",
        },
      ],
      faq: [
        {
          q: `Can I replace a water heater myself in ${"Erie"}?`,
          a: `Pennsylvania requires gas water-heater work to be done by a licensed contractor with permits in most municipalities. Electric units have fewer code restrictions but still involve hot water under pressure, gas valves (if dual-fuel), and 240V electrical — most homeowners' insurance won't cover damage from a DIY install gone wrong. The labor portion of a pro install is usually $400–$800; that's cheap insurance.`,
        },
        {
          q: `What's the cheapest plumbing repair I can do myself?`,
          a: `Replacing a toilet flapper or fill valve costs $5–$25 in parts and takes 15 minutes. It also fixes 80% of "running toilet" problems that drive up water bills by $20–$40/month if ignored. Highest ROI DIY job in plumbing.`,
        },
        {
          q: `When does a DIY repair void my insurance?`,
          a: `Most homeowners' policies don't void coverage for DIY repairs by default, but they will deny claims for damage caused by negligent work — including work that should have required a permit. If you DIY anything that legally needed a permit (like a water-heater install in most PA municipalities), expect the claim to be denied.`,
        },
        {
          q: `How do I know if I'm in over my head mid-job?`,
          a: `Three flags: you can't shut off water cleanly, you've cut into something and water keeps flowing, or the part isn't matching specs. Stop, photograph everything, and call. Most Erie plumbers will charge a normal service call to finish a botched DIY rather than mark it up.`,
        },
        {
          q: `Is it cheaper to DIY and call a pro to fix mistakes?`,
          a: `Almost never. Fixing a botched DIY usually costs 1.5–3× the original job because the plumber has to undo work before redoing it. Water damage from leaks during the DIY adds restoration costs separately. The math only works for the truly trivial stuff (flapper, aerator, snake).`,
        },
      ],
      riskCallout: `A botched plumbing DIY can flood a single room in under 30 minutes and cause $5,000–$15,000 in water damage. Pennsylvania municipalities require permits for most major plumbing work — DIY without one can affect insurance claims.`,
    };
  }

  if (matches(nicheSlug, ["electric", "wiring", "panel", "ev-charger", "generator-install", "smart-home"])) {
    return {
      intro: `Electrical DIY is one of the highest-stakes home-improvement decisions. Some things are perfectly safe for a careful homeowner; others can kill you or burn down your house. Here's the line.`,
      tiers: [
        {
          heading: "Safe to DIY",
          description: `Low-voltage, no panel access, can't be wired wrong in a dangerous way.`,
          examples: [
            "Replacing a light fixture (with breaker off)",
            "Swapping an outlet or switch in an existing box",
            "Installing a ceiling fan in an existing rated box",
            "Resetting a tripped GFCI or breaker",
            "Replacing a thermostat (low-voltage HVAC control)",
          ],
          toneSlug: "diy",
        },
        {
          heading: "Skilled DIY (with caution)",
          description: `Possible for experienced homeowners, but the cost of error is high. Permit check first.`,
          examples: [
            "Adding a new outlet on an existing circuit (if not overloaded)",
            "Running new low-voltage wiring (security, doorbell, network)",
            "Installing a smart switch with neutral wire",
          ],
          toneSlug: "skilled-diy",
        },
        {
          heading: "Always call a licensed electrician",
          description: `Safety, code, and permit requirements make these strictly pro-only.`,
          examples: [
            "Anything in the breaker panel (adding circuits, replacing breakers)",
            "Service upgrades (100A → 200A)",
            "EV charger installation",
            "Generator installation or transfer switch",
            "Aluminum wiring repairs",
            "Anything in a wall after the wall is closed",
            "Knob-and-tube work in older Erie homes",
          ],
          toneSlug: "pro-only",
        },
      ],
      faq: [
        {
          q: `Why can't I add a circuit to my own panel?`,
          a: `Pennsylvania municipalities almost universally require a permit and inspection for panel work. The risk isn't just code — it's that a wrong torque on a breaker lug or a backfed circuit can start a fire weeks or months later. Electricians carry insurance specifically for this; homeowners typically don't.`,
        },
        {
          q: `Is installing a ceiling fan DIY-safe?`,
          a: `Yes, if there's already a rated electrical box in the ceiling. If you're going from a light fixture to a fan, verify the box is fan-rated (says so on the box). Non-rated boxes hold ~10 lbs; a fan with motor can be 30+ lbs and rip out of drywall.`,
        },
        {
          q: `Can I DIY my EV charger install?`,
          a: `Strictly no. EV chargers pull 32–80 amps continuously. They almost always require a new dedicated circuit in the panel, often a service upgrade, and a permit. Bad installs are a leading cause of EVSE fires. Pro install in Erie typically runs $700–$2,000 not counting the charger.`,
        },
        {
          q: `What about smart switches and outlets?`,
          a: `Replacing a switch with a smart switch is generally fine if you can shut off the breaker, identify hot/neutral/load/ground correctly, and the box has a neutral (many older Erie homes don't). Without a neutral, you need a different switch type or a pro to add one.`,
        },
        {
          q: `Do I need a permit to swap an outlet?`,
          a: `Most PA municipalities don't require a permit for a like-for-like outlet replacement. Adding new outlets, however, usually does. Check with the City of Erie's Bureau of Code Enforcement before starting if you're unsure.`,
        },
      ],
      riskCallout: `Electrical mistakes kill 400+ people in the US per year and cause $1B+ in fire damage. If you're working in the panel, on a service entrance, or doing anything that needed a permit and didn't pull one, insurance will deny the claim.`,
    };
  }

  if (matches(nicheSlug, ["roof", "siding"])) {
    return {
      intro: `Most roofing work isn't DIY-able for a few practical reasons: height, weight of materials, the speed at which a leak can destroy a ceiling, and Pennsylvania's licensed-contractor requirements for any substantial work.`,
      tiers: [
        {
          heading: "Safe to DIY",
          description: `Surface inspection and minor cosmetic fixes from a stable surface.`,
          examples: [
            "Photographing your roof with a drone or zoom lens (from the ground)",
            "Cleaning gutters (if you can do it from a stable ladder)",
            "Removing a tree branch resting on shingles (small ones only)",
            "Caulking a small flashing gap from an attic vent below",
          ],
          toneSlug: "diy",
        },
        {
          heading: "Skilled DIY (rare and risky)",
          description: `Possible for experienced DIYers on a low-pitch roof with proper fall protection. Most homeowners shouldn't attempt.`,
          examples: [
            "Replacing 1–2 shingles in an accessible area",
            "Installing a small roof patch (tarp) in an emergency",
            "Replacing a vent boot if you're already comfortable on roofs",
          ],
          toneSlug: "skilled-diy",
        },
        {
          heading: "Always call a licensed roofer",
          description: `Scope, safety, code, or insurance makes these pro-only.`,
          examples: [
            "Anything involving more than 5–10 shingles",
            "Anything on a roof steeper than 6/12 pitch",
            "Active leak repairs (water finds paths that aren't obvious)",
            "Full or partial replacements",
            "Anything on a 2-story+ roof",
            "Insurance claims (insurers want pro documentation)",
            "Storm damage assessments",
            "Underlayment or decking work",
          ],
          toneSlug: "pro-only",
        },
      ],
      faq: [
        {
          q: `Can I patch a small roof leak myself?`,
          a: `Emergency tarping (covering the area to stop water until a pro arrives) is reasonable DIY. Actual leak repair is rarely DIY because the source of a leak is often several feet from where you see the drip — you can patch the visible spot and still have water entering elsewhere.`,
        },
        {
          q: `What kills most DIY roofers — the height or the work?`,
          a: `Height. Falls from roofs kill 300+ people in the US per year. Most are experienced homeowners doing "quick" tasks. The work itself is intermediate-difficulty; the surface is what makes it dangerous.`,
        },
        {
          q: `Will my insurance claim be denied if I DIY repairs first?`,
          a: `Often, yes. Insurers want a contractor's assessment to scope the claim. DIY repairs can compromise the assessment and lead to a denied or reduced claim — particularly for storm damage where the timeline of when damage occurred matters.`,
        },
        {
          q: `How much can I save by DIYing a full roof?`,
          a: `Materials are 30–40% of a full reroof cost; labor is the rest. You could theoretically save 60% — but you'd also be on a roof for 40–80 hours, rent a dumpster, and lose any warranty manufacturers offer (most require licensed installation). Net savings are usually 10–20% with significant risk.`,
        },
        {
          q: `Do I need a permit for a roof replacement in Erie?`,
          a: `Yes. The City of Erie requires a building permit for any reroof (full or partial). Some surrounding townships have similar requirements. Pulling a permit also gives you an inspection — valuable if you sell the house later.`,
        },
      ],
      riskCallout: `Falls from roofs kill more DIYers than any other home-improvement task. Beyond safety, Pennsylvania requires licensed contractors for substantial roofing work, and missing permits or manufacturer warranty requirements can cost more than the labor savings.`,
    };
  }

  if (matches(nicheSlug, ["hvac", "heating", "cooling", "furnace", "ac-repair", "duct-clean"])) {
    return {
      intro: `HVAC is a mixed bag: maintenance is largely DIY, repairs are sometimes, replacements basically never. Refrigerant work is federally restricted.`,
      tiers: [
        {
          heading: "Safe to DIY",
          description: `Routine maintenance that any homeowner should be doing.`,
          examples: [
            "Replacing air filters monthly/quarterly",
            "Cleaning return vents and grilles",
            "Clearing debris from outdoor AC condenser units",
            "Pouring vinegar down the condensate drain to prevent algae",
            "Setting up a programmable / smart thermostat",
          ],
          toneSlug: "diy",
        },
        {
          heading: "Skilled DIY (limited)",
          description: `Some diagnostic and minor repair work is doable with care.`,
          examples: [
            "Replacing a failed capacitor on the outdoor unit (caution: stored charge)",
            "Replacing a thermostat with proper labeling",
            "Resetting tripped float switches or pressure switches",
            "Identifying a broken belt or motor for a pro to fix",
          ],
          toneSlug: "skilled-diy",
        },
        {
          heading: "Always call a licensed HVAC tech",
          description: `Refrigerant work is federally regulated; gas work is dangerous; equipment is expensive.`,
          examples: [
            "Anything involving refrigerant (EPA 608 certification legally required)",
            "Gas furnace repairs",
            "Heat exchanger inspections (cracked exchangers leak CO)",
            "System replacements or sizing decisions",
            "Ductwork modifications",
            "Annual tune-ups (catches small problems before they become large ones)",
          ],
          toneSlug: "pro-only",
        },
      ],
      faq: [
        {
          q: `Why can't I add refrigerant myself?`,
          a: `EPA Section 608 makes it a federal violation to handle most refrigerants without certification. Beyond the law: a system that's low on refrigerant has a leak — adding more just delays the inevitable while wasting an expensive (and increasingly restricted) chemical. The leak needs to be found and fixed.`,
        },
        {
          q: `How much does a DIY filter change save?`,
          a: `A pro charges $80–$150 for a maintenance visit that includes filter change. Filters cost $5–$25. Doing it yourself monthly saves $200–$300 per year and extends system life by reducing strain.`,
        },
        {
          q: `Is replacing a capacitor really DIY-doable?`,
          a: `For experienced DIYers, yes — but the capacitor stores charge even after the unit is unplugged, and shorting one across yourself can stop your heart. Discharge it with an insulated screwdriver across the terminals before touching. Most pros charge $150–$300 for what's a 10-minute job; many homeowners find that fair.`,
        },
        {
          q: `Can I install a new thermostat myself?`,
          a: `Usually yes. Label every wire on the old thermostat before removing it. Take a photo. Smart thermostats sometimes need a "C wire" for power; older furnaces may not have one. If you don't have a C wire, options include a power adapter kit or running new wire — the latter is a pro job.`,
        },
        {
          q: `What HVAC mistakes do DIYers regret most?`,
          a: `Three biggies: (1) Adding refrigerant to a leaky system without fixing the leak — wastes money, ruins the system. (2) Ignoring annual tune-ups — small problems compound into expensive failures. (3) Buying an oversized unit thinking "bigger is better" — actually creates humidity problems and short-cycles the equipment.`,
        },
      ],
      riskCallout: `Federal law restricts refrigerant work to EPA-certified technicians. Gas furnace work without expertise can leak carbon monoxide. HVAC equipment failures from DIY mistakes often void manufacturer warranties.`,
    };
  }

  if (matches(nicheSlug, ["restor", "flood", "mold", "water-damage", "fire", "storm-damage", "emergency-board"])) {
    return {
      intro: `Water and fire damage compound by the hour. The DIY question isn't really "should I" — it's "can I get a pro on site fast enough that I shouldn't bother starting." For most situations the answer is no.`,
      tiers: [
        {
          heading: "Safe to DIY",
          description: `Immediate triage before pros arrive. Don't wait — start now.`,
          examples: [
            "Stopping the source (turn off water main, kill the breaker)",
            "Moving valuables to a dry area",
            "Documenting damage with photos for insurance",
            "Opening windows and running fans to start drying (clean water only)",
            "Lifting curtains and pulling rugs off wet floors",
          ],
          toneSlug: "diy",
        },
        {
          heading: "Skilled DIY (small scope only)",
          description: `Minor incidents with clean water and immediate response can be DIYed.`,
          examples: [
            "Drying a single room from a contained appliance leak caught in minutes",
            "Removing wet carpet pad if you have replacement ready",
          ],
          toneSlug: "skilled-diy",
        },
        {
          heading: "Always call a restoration pro",
          description: `Anything beyond a contained, clean-water, minor incident needs pros within hours.`,
          examples: [
            "Water sitting more than 24 hours (mold starts)",
            "Sewage backups (Category 3 water, biohazard)",
            "Fire damage of any size",
            "Mold visible on more than a 10 sq ft area",
            "Damage covered by insurance (insurer-required documentation)",
            "Water inside walls or under flooring",
            "Smoke odor remediation",
          ],
          toneSlug: "pro-only",
        },
      ],
      faq: [
        {
          q: `Can I just rent a wet/dry vac and handle it myself?`,
          a: `For a small, fresh, clean-water spill (broken cup, briefly overflowing toilet), yes. For anything beyond that, no — the issue isn't pulling water up, it's drying the structure (subfloor, drywall, framing) to <16% moisture content. Without commercial-grade air movers and dehumidifiers running for 3–5 days, mold starts at 48 hours.`,
        },
        {
          q: `Why is sewage water different from rain water?`,
          a: `Sewage is Category 3 ("black water") — contaminated with bacteria, viruses, and chemicals. Cleanup requires PPE, antimicrobials, and disposal of porous materials (carpet, drywall, pads). DIY exposure can cause serious illness. Insurance almost always covers sewage damage; use them.`,
        },
        {
          q: `How fast does mold actually grow after water damage?`,
          a: `48–72 hours under typical conditions. By day 4–5 it's visible. By day 7 it's spreading inside walls. This is why restoration companies in Erie run 24/7 — every hour matters.`,
        },
        {
          q: `Will insurance pay if I start the cleanup myself?`,
          a: `Initial mitigation (turning off water, removing wet items) is expected and won't hurt your claim. But major DIY restoration can hurt — the insurer typically wants a pro assessment to scope the claim. Document everything before, during, and after.`,
        },
        {
          q: `How much does professional restoration cost vs. DIY?`,
          a: `Typical residential water mitigation in Erie runs $1,500–$5,000. Insurance usually covers this fully if the cause is "sudden and accidental" (burst pipe, appliance failure). DIY costs less out-of-pocket but skipping mitigation leads to $10,000–$50,000+ in mold remediation and rebuilding 6 months later. Don't optimize for the wrong cost.`,
        },
      ],
      riskCallout: `Mold begins growing in water-damaged structures at 48 hours. Category 2 and 3 water (gray and black) are health hazards requiring PPE and antimicrobial cleanup. Insurance typically covers professional restoration in full; DIY rarely makes financial sense.`,
    };
  }

  // ── outdoor-seasonal: landscaping / snow / tree / irrigation / gutters ──
  if (matches(nicheSlug, ["landscap", "lawn", "snow", "tree-service", "tree-removal", "irrigation", "sprinkler", "gutter", "ice-dam", "salt-deicing", "outdoor-light", "holiday-light", "asphalt-seal", "driveway-pav", "decks-patio", "lakefront", "retaining-wall"])) {
    const isSnow = matches(nicheSlug, ["snow"]);
    const isTree = matches(nicheSlug, ["tree"]);
    return {
      intro: `Outdoor work is one of the highest-DIY categories in home services. Most ${labelLower} tasks reward effort over expertise — but there's a line where the right equipment, training, or insurance becomes non-negotiable.`,
      tiers: [
        {
          heading: "Safe to DIY",
          description: `Routine outdoor tasks that reward time more than expertise.`,
          examples: isSnow
            ? ["Shoveling residential driveways and walkways", "Applying rock salt or ice melt", "Snowblowing if you own the equipment", "Clearing snow off vehicles"]
            : isTree
            ? ["Pruning branches under 2 inches from the ground", "Clearing dropped sticks and debris", "Watering newly planted trees per care guide"]
            : ["Mowing your own lawn on flat ground", "Edge trimming, weeding, mulching beds", "Planting annuals and small shrubs", "Routine seasonal cleanup", "Light gutter cleaning from a stable ladder under 1 story"],
          toneSlug: "diy",
        },
        {
          heading: "Skilled DIY (with the right gear)",
          description: `Doable if you've done it before and have the equipment.`,
          examples: isSnow
            ? ["Plowing your driveway with a personal plow", "Roof-raking single-story roofs", "De-icing dams on accessible eaves"]
            : isTree
            ? ["Felling small trees (under 30 ft) on flat ground with no obstacles", "Stump grinding with rented equipment", "Mid-size branch trimming on a stable ladder"]
            : ["Small hardscaping (paver paths, raised beds)", "Sprinkler-head replacement on existing systems", "Sodding a prepped area", "Low-voltage landscape lighting"],
          toneSlug: "skilled-diy",
        },
        {
          heading: `Always call a ${labelLower} pro`,
          description: `Safety, scale, or specialized equipment makes these unsuitable for DIY.`,
          examples: isTree
            ? ["Any tree near power lines", "Removing leaning, dead, or storm-damaged trees", "Trees larger than 30 feet", "Working from height in the tree", "Storm emergency response"]
            : isSnow
            ? ["Commercial-property plowing (liability)", "2+ story or steep-pitch roof snow", "Major storm response", "Ice dams that have caused interior leaks"]
            : ["Major regrading or drainage problem solving", "Tree removal of any substantial size", "Full irrigation installation", "Retaining walls over 4 feet (PA permit)", "Gutter installation or replacement", "Any work requiring underground utility line marking (PA 811)"],
          toneSlug: "pro-only",
        },
      ],
      faq: [
        { q: `What's the most common DIY ${labelLower} mistake?`, a: `Underestimating scale. A "quick weekend project" routinely becomes three weekends plus rental-yard trips. Pros are 2-4× faster because they do this daily with the right equipment.` },
        { q: `When is DIY actually cheaper?`, a: `For very small projects (under ~$500 of pro labor) you'll usually save money. Above that, your time + rental costs + redo risk erode the savings.` },
        { q: `Do I need a permit for outdoor work in Erie?`, a: `For most ${labelLower}, no — but retaining walls over 4 feet, structural pergolas, and drainage tied to municipal systems often require permits. Check with the City of Erie Bureau of Code Enforcement if unsure.` },
        { q: `What about hitting a buried utility line?`, a: `Pennsylvania law (PA One Call/811) requires utility marking 3 business days before digging. Hitting a line is dangerous and you pay for the repair. The 811 call is free.` },
        { q: `Will homeowner's insurance cover DIY mistakes?`, a: `Usually no for damage to your own property; yes (with deductible) for damage to a neighbor's. Liability for informal "helpers" who get hurt is gray.` },
      ],
      riskCallout: `${label} DIY accidents account for thousands of ER visits each year — chainsaw injuries, ladder falls, equipment cuts top the list. Pennsylvania's 811 law requires utility marking before any digging; ignoring it can mean expensive repairs and serious safety risk.`,
    };
  }

  // ── cleaning: house cleaning / carpet / pressure-washing ───────
  if (matches(nicheSlug, ["clean", "maid", "janitor", "pressure-wash", "power-wash"])) {
    const isCarpet = matches(nicheSlug, ["carpet"]);
    const isPressure = matches(nicheSlug, ["pressure", "power-wash"]);
    return {
      intro: `Cleaning is the most DIY-able category in home services — but specialty cleaning has equipment and chemistry that homeowners rarely match. Knowing what's worth doing yourself vs. paying for is the whole game.`,
      tiers: [
        {
          heading: "Safe to DIY",
          description: `Anything routine homeowners should be doing themselves.`,
          examples: isCarpet
            ? ["Spot cleaning small stains immediately", "Vacuuming twice weekly in high-traffic areas", "Renting a Rug Doctor for annual whole-house clean"]
            : isPressure
            ? ["Light pressure-washing on concrete patios (rent the unit)", "Cleaning low-rise siding with garden hose and brush", "Oil-stain spot-cleaning with degreaser"]
            : ["Day-to-day tidying, dusting, sweeping, mopping", "Weekly bathroom and kitchen deep-clean", "Laundry and bedding", "Annual deep-clean before holidays"],
          toneSlug: "diy",
        },
        {
          heading: "Skilled DIY (rentable tools)",
          description: `Some semi-pro cleaning is possible with rented equipment.`,
          examples: isCarpet
            ? ["Whole-house carpet shampoo with a rented machine (slower than a pro, 1.5-2× the cleaner used)", "Single-room cleanup before an event", "Pet-accident cleanup with enzymatic cleaners"]
            : isPressure
            ? ["Light pressure-washing of vinyl/aluminum siding (wrong tip damages stucco, brick, or wood)", "Deck cleaning before staining", "Driveway cleaning before sealing"]
            : ["Move-out / move-in deep clean (slower than a pro crew)", "Post-renovation dust cleanup", "Wall and ceiling washing"],
          toneSlug: "skilled-diy",
        },
        {
          heading: `Always call a ${labelLower} pro`,
          description: `Specialty equipment or chemistry needs make pro service worth it.`,
          examples: isCarpet
            ? ["Wool or natural-fiber rugs", "Antique or Persian rug cleaning", "Severe pet contamination or mold remediation", "Commercial-grade soil DIY can't lift"]
            : isPressure
            ? ["Roof washing (DIY damages shingles)", "2nd-story siding (ladder + reactive force = falls)", "Wood requiring soft-wash chemistry", "Anything with mold or algae requiring biocides"]
            : ["Move-out cleans with deadline pressure", "Post-construction final cleaning", "Anything with biohazard involvement", "Mold remediation", "Recurring service where consistency matters more than DIY effort"],
          toneSlug: "pro-only",
        },
      ],
      faq: [
        { q: `Why hire a cleaning service if I can clean myself?`, a: `Two reasons: time and consistency. Pros are 1.5-2× faster and don't get tired, distracted, or skip the parts they hate. A weekly cleaner buys 3-5 hours of your time back per visit.` },
        { q: `What's the difference between regular and deep cleaning?`, a: `Regular = maintenance (surfaces, floors, bathrooms, kitchen). Deep = everything regular + baseboards, behind appliances, inside oven, light fixtures, walls. Deep cleans cost 1.5-2× the regular rate.` },
        { q: `Why is pressure washing more dangerous than it looks?`, a: `Modern consumer units run 1,500-3,000 PSI — enough to cut skin, damage siding, drive water under shingles, and tear caulk. Even on concrete, the wrong tip leaves visible "wand marks" for years.` },
        { q: `Is tipping cleaning crews expected?`, a: `Not required, but common — $5-20 per cleaner for recurring service, more for one-time deep cleans. If you're happy, tipping reduces turnover.` },
        { q: `How do I vet a cleaning service?`, a: `Ask for proof of insurance and bonding, references from current clients, and clarity about what's included. Many Erie services offer a free walkthrough estimate.` },
      ],
      riskCallout: `Pressure-washing accidents send 6,000+ people to ERs annually. Chemicals in specialty cleaning (mold, biohazard, specialty rugs) require training and PPE. Bonded, insured services protect you from theft and damage claims.`,
    };
  }

  // ── specialty-repair: appliance / garage-door / chimney / locksmith / handyman ──
  if (matches(nicheSlug, ["appliance-repair", "garage-door", "chimney", "fireplace", "locksmith", "handyman"])) {
    const isChimney = matches(nicheSlug, ["chimney", "fireplace"]);
    const isLock = matches(nicheSlug, ["locksmith"]);
    const isGarage = matches(nicheSlug, ["garage-door"]);
    const isHandy = matches(nicheSlug, ["handyman"]);
    return {
      intro: `Specialty repair runs a wide gamut. Some of it is DIY-friendly with a YouTube video and basic tools; some involves stored energy, gas, or fire codes that should stop a homeowner cold.`,
      tiers: [
        {
          heading: "Safe to DIY",
          description: `Routine maintenance and obvious problem-solving.`,
          examples: isChimney
            ? ["Inspect fireplace screen and damper seasonally", "Clean the firebox before each season", "Remove ash buildup"]
            : isLock
            ? ["Replace a doorknob or deadbolt like-for-like", "Re-tension hinges or strike plates", "Clean and lubricate locks (graphite, not WD-40)"]
            : isGarage
            ? ["Lubricate rollers, hinges, tracks (silicone spray, NOT WD-40)", "Reset the keypad code", "Replace the remote battery", "Clean photo-eye sensors"]
            : isHandy
            ? ["Hang shelves, mirrors, curtain rods", "Replace light bulbs, switch plates, smoke detector batteries", "Caulking and touch-up painting", "Furniture assembly"]
            : ["Clean lint traps, vent hoses, refrigerator coils", "Replace filters, water filters, ice-maker components", "Reset GFCIs serving appliances", "Power-cycle and reset for 'won't start' issues"],
          toneSlug: "diy",
        },
        {
          heading: "Skilled DIY (with proper tools)",
          description: `Doable with experience and the right gear.`,
          examples: isChimney
            ? ["Cleaning a wood-stove flue if safely accessible from outside", "Replacing a damper handle", "Spot-pointing minor masonry cracks"]
            : isLock
            ? ["Re-keying a lock with a $25 kit (20 minutes)", "Installing a smart lock", "Repairing a stuck deadbolt"]
            : isGarage
            ? ["Replacing a damaged section panel (one only, like-for-like)", "Installing a new opener (with a friend; heavy)", "Replacing photo-eyes or limit switches"]
            : isHandy
            ? ["Mounting a TV (proper studs + hardware)", "Building basic shelving units", "Installing baby gates / child-proofing", "Replacing a doorbell or smart doorbell"]
            : ["Replacing dryer belt, dishwasher hose, refrigerator water valve", "Washer hoses, oven heating elements, microwave bulbs", "Resetting circuit boards on smart appliances"],
          toneSlug: "skilled-diy",
        },
        {
          heading: `Always call a ${labelLower} pro`,
          description: `Specialized knowledge, safety risks, or equipment requirements.`,
          examples: isChimney
            ? ["Annual chimney sweep + inspection (NFPA recommends yearly)", "Anything involving the chimney liner", "Creosote buildup beyond a light coating (fire hazard)", "Crown, cap, or flashing repairs requiring rooftop work", "Gas-fireplace work or conversion"]
            : isLock
            ? ["Lockout situations with lock damage", "Safes — opening, repair, combination changes", "Commercial / multi-tenant systems", "High-security locks (Medeco, ASSA)", "Locked vehicles"]
            : isGarage
            ? ["Spring replacement (springs store enormous energy; deaths from DIY)", "Cable or drum replacement", "Door realignment after damage", "Anything requiring releasing torsion-spring tension"]
            : isHandy
            ? ["Anything electrical beyond switch/outlet replacement", "Plumbing beyond visible supply-line connections", "Roofing or anything requiring ladders over 1 story", "HVAC, gas, or fuel-burning appliance work", "Structural work in walls, floors, or ceilings"]
            : ["Compressor diagnostics (refrigerant + EPA cert required)", "Sealed-system repair on refrigerators or freezers", "Front-load washer drum-bearing replacement", "Gas-range/oven gas-side work", "Microwave magnetron replacement (X-ray hazard)"],
          toneSlug: "pro-only",
        },
      ],
      faq: [
        { q: `Is it worth fixing a 10-year-old ${labelLower} item or replacing it?`, a: `Rule of thumb: if repair quote exceeds 50% of replacement cost and unit is past 60% of expected life, replace. Otherwise repair. A pro should give an honest assessment.` },
        { q: `Why is garage-door spring replacement so dangerous?`, a: `Torsion springs store 200+ ft-lbs of energy. Uncontrolled release can break bones or kill. A pro replacement ($150-$350) is far below ER cost.` },
        { q: `How often should I really get my chimney inspected?`, a: `NFPA 211 says annually. For wood-burning fireplaces used regularly, yes. Gas-only with sealed inserts: every 2-3 years usually. Skipping inspections is a leading cause of chimney fires in Erie's heating season.` },
        { q: `Can a handyman do anything I need?`, a: `For most small tasks, yes. They generally don't (and shouldn't) do code-regulated trade work like electrical-in-walls, gas-line work, or structural carpentry.` },
        { q: `What should I have on hand for emergency lockouts?`, a: `Spare keys with neighbors or family. A keypad or smart lock. Photos of your locks for the locksmith. Lockouts cost $75-$200 in normal hours; 1.5-2× after hours.` },
      ],
      riskCallout: `Specialty repair has high-variance risk: torsion springs and stored-energy mechanisms cause serious injuries each year; chimney issues are a top cause of residential fires; gas appliance work without expertise can cause CO poisoning. Match scope to skill honestly.`,
    };
  }

  // ── trades-interior: drywall / flooring / painting ─────────────
  if (matches(nicheSlug, ["drywall", "plaster", "flooring", "hardwood", "tile", "paint", "epoxy-floor", "cabinet-refin", "countertop", "closet-storage", "bathroom-remodel", "kitchen-remodel", "basement-finish"])) {
    const isPaint = matches(nicheSlug, ["paint"]);
    const isFloor = matches(nicheSlug, ["floor", "hardwood", "tile"]);
    return {
      intro: `Interior finishing trades are some of the most DIY-friendly home improvement work — but the difference between a DIY job and a pro job shows for years. Knowing where to save and where to pay is the whole game.`,
      tiers: [
        {
          heading: "Safe to DIY",
          description: `Cosmetic and prep work that requires patience more than skill.`,
          examples: isPaint
            ? ["Interior wall and ceiling painting in a single room", "Touching up trim, doors, cabinets", "Caulking gaps before paint", "Painting an accent wall", "Color sampling"]
            : isFloor
            ? ["Refinishing a piece of furniture", "Installing floating LVP/laminate in a small room", "Replacing damaged backsplash tiles", "Removing old carpet or vinyl"]
            : ["Patching small holes (under 2 inches) with spackle", "Sanding rough drywall before paint", "Cleaning before paint or new finish"],
          toneSlug: "diy",
        },
        {
          heading: "Skilled DIY (with patience)",
          description: `Doable for committed DIYers with realistic time expectations.`,
          examples: isPaint
            ? ["Exterior painting of a small detached structure", "Cabinet refinishing", "Multi-room interior repaints", "Wallpaper removal"]
            : isFloor
            ? ["Full LVP install in a moderate room", "Carpet install with kicker and seam iron", "Hardwood refinishing", "Small backsplash or floor tile work"]
            : ["Drywall holes 4-12 inches with a patch piece", "Skim-coating smaller areas", "Replacing a damaged ceiling panel", "Texturing techniques on small areas"],
          toneSlug: "skilled-diy",
        },
        {
          heading: `Always call a ${labelLower} pro`,
          description: `Scope, finish quality, or technical complexity makes these worth paying for.`,
          examples: isPaint
            ? ["Multi-story exterior painting (height + ladder safety)", "Lead-paint scenarios in pre-1978 Erie homes (EPA RRP rules)", "Spray-finish work where finish quality matters", "Substantial water-damaged surface restoration"]
            : isFloor
            ? ["Hardwood installation in any but the smallest rooms", "Wet-area tile work (showers, full bathrooms)", "Stair flooring", "Anything involving subfloor repair or leveling", "Whole-home replacements"]
            : ["Whole-room or whole-house drywall installation", "Ceiling repairs over 4 sq ft", "Smooth-finish (level 5) walls where lighting reveals flaws", "Plaster restoration in older Erie homes", "Any work tied to water damage or mold"],
          toneSlug: "pro-only",
        },
      ],
      faq: [
        { q: `Why does a DIY ${labelLower} job often look DIY?`, a: `Pros develop muscle memory for the dozens of small movements that produce a clean finish. Prep work is also where pros pull ahead — they spend more time prepping than amateurs spend on the entire job.` },
        { q: `What's the financial break-even for hiring?`, a: `Total cost (including your time, materials waste from learning, and tool rental) usually favors a pro once the job exceeds ~$1,500 in pro labor.` },
        { q: `Is lead paint really a concern for Erie homes?`, a: `Yes for any home built before 1978. The EPA Renovation, Repair and Painting (RRP) rule requires lead-safe work practices. DIYing in a pre-1978 home isn't illegal but improper disturbance can spread lead dust — a health risk especially for kids and pregnant household members.` },
        { q: `What's the most overlooked prep step?`, a: `Cleaning the surface. Paint, adhesive, and joint compound all bond to clean, dust-free surfaces; bonding failures show up months later as peeling, lifting, or cracking. Pros TSP-wash walls before painting; most DIYers skip it.` },
        { q: `Can I DIY half and have a pro finish?`, a: `Most pros prefer not. They warranty their work and don't want to inherit problems from someone else's prep. Some will work with you on a prep-yourself, finish-with-me basis — ask upfront.` },
      ],
      riskCallout: `${label} DIY damage often shows up at sale time — buyers and inspectors notice the difference. Pre-1978 Erie homes are subject to EPA RRP lead-paint rules; non-compliance can affect insurance and resale. Subfloor problems hidden under DIY flooring become major future expenses.`,
    };
  }

  // ── trades-exterior: concrete / fencing / windows-doors / glass ────
  if (matches(nicheSlug, ["concrete", "masonry", "brick", "fenc", "windows-door", "glass", "storm-window"])) {
    const isFence = matches(nicheSlug, ["fenc"]);
    const isGlass = matches(nicheSlug, ["glass", "window"]);
    return {
      intro: `Exterior project work has higher consequence than interior — weather exposure, structural loads, and street visibility all magnify the difference between DIY and pro.`,
      tiers: [
        {
          heading: "Safe to DIY",
          description: `Cosmetic touch-ups and very small projects.`,
          examples: isFence
            ? ["Replacing 1-2 fence boards on an existing fence", "Painting or staining a wood fence", "Tightening gate hardware"]
            : isGlass
            ? ["Removing a cracked window screen for replacement", "Caulking around exterior windows", "Cleaning storm windows and weatherstripping"]
            : ["Patching small cracks in concrete with hardware-store sealant", "Cleaning concrete patios and driveways", "Regular driveway sealing"],
          toneSlug: "diy",
        },
        {
          heading: "Skilled DIY (with experience)",
          description: `Possible for committed DIYers with the right tools.`,
          examples: isFence
            ? ["Building a small (under 50 ft) wood privacy fence on flat ground", "Replacing a damaged fence section", "Simple chain-link installation"]
            : isGlass
            ? ["Replacing a single broken pane in a storm window or small fixed window", "Installing pre-made storm windows"]
            : ["Pouring small concrete pads (under 100 sq ft)", "Brick or stone repair on small areas", "Installing edging or pavers in a small area"],
          toneSlug: "skilled-diy",
        },
        {
          heading: `Always call a ${labelLower} pro`,
          description: `Scope, equipment, code, or structural concerns make these pro-only.`,
          examples: isFence
            ? ["Full property-line fencing (survey + permit + neighbor coordination)", "Fencing on slopes or near grade changes", "Iron, vinyl, or composite installs", "Pool fencing (PA code is strict)"]
            : isGlass
            ? ["Whole-window replacements", "Energy-efficient window installs (matters for tax credits)", "Patio doors, French doors, entry doors", "Insulated glass unit replacement", "Tempered or laminated safety-glass work"]
            : ["Concrete driveways, garage floors, large patios", "Anything structural (footings, foundations, retaining walls over 4 ft)", "Stamped, colored, or decorative concrete", "Concrete repair where rebar is exposed or settling is visible", "Brick or stone work on chimneys or load-bearing structures"],
          toneSlug: "pro-only",
        },
      ],
      faq: [
        { q: `Why does ${labelLower} DIY age poorly?`, a: `Weather and ground movement are unforgiving. A small mistake in pitch, drainage, base prep, or sealing manifests as cracks, sag, or rot within 1-3 years. Pros build to last 15-30 years; DIY usually lasts 5-10.` },
        { q: `What permits do I need in Erie for ${labelLower} work?`, a: `Substantial projects typically require permits: concrete pours over 100 sq ft, retaining walls over 4 ft, structural fence work near setbacks, anything tying into a public sidewalk or right-of-way. Check with City of Erie Code Enforcement.` },
        { q: `How much do I save DIYing vs. hiring?`, a: `Materials are 30-50% of project cost; DIY saves the rest. But factor in: tool rental ($100-500), waste from learning, time (2-5× longer than a pro), and the cost of redoing it if it fails in 3 years.` },
        { q: `Should I just hire someone "off the books"?`, a: `Risky. Unlicensed contractors usually carry no insurance — if they get hurt on your property, you can be liable. PA requires registration for home improvement contractors over $500/year.` },
        { q: `What's the biggest cost of getting it wrong?`, a: `Resale. Buyers and inspectors notice obvious DIY exterior work. A bad concrete driveway, mismatched fence sections, or DIY window install can knock $2,000-$10,000 off resale value or trigger inspection concessions.` },
      ],
      riskCallout: `Pennsylvania requires home-improvement contractor registration (PA HICPA) for work over $500/year. Unlicensed contractors lack insurance protections; DIY work without permits may affect homeowner's coverage and resale value.`,
    };
  }

  // ── install-bigticket: solar / pool-spa / home-security / insulation ─
  if (matches(nicheSlug, ["solar", "pool-spa", "spa", "home-security", "alarm", "insulation"])) {
    const isSolar = matches(nicheSlug, ["solar"]);
    const isPool = matches(nicheSlug, ["pool", "spa"]);
    const isSecurity = matches(nicheSlug, ["security", "alarm"]);
    return {
      intro: `Big-ticket installations are almost entirely pro territory — not because the physical work is impossible to DIY, but because permits, tax credits, manufacturer warranties, and financing usually require licensed installation. DIY savings rarely overcome those structural losses.`,
      tiers: [
        {
          heading: "Safe to DIY",
          description: `Research, planning, and maintenance — homeowner roles in the project.`,
          examples: isSolar
            ? ["Getting bids from 3+ installers", "Verifying your roof's age and condition", "Reviewing 12 months of energy bills", "Researching tax credits (federal + PA)", "Cleaning panels seasonally"]
            : isPool
            ? ["Regular water testing and chemical balancing", "Skimming, vacuuming, routine maintenance", "Replacing filter cartridges", "Winterizing or de-winterizing if experienced"]
            : isSecurity
            ? ["Researching system options (self-install kits vs. monitored)", "Self-installing camera-only systems (no monitoring)", "Battery changes, firmware updates, password rotation", "Adding smart door/window sensors yourself"]
            : ["Identifying obvious air gaps (around outlets, attic hatches, basement rim joists)", "Caulking small leaks", "Installing weather stripping", "DIY blower-door test with a window kit"],
          toneSlug: "diy",
        },
        {
          heading: "Self-install DIY (kit-based products)",
          description: `Possible for some categories with off-the-shelf consumer products — but with real tradeoffs.`,
          examples: isSolar
            ? ["Off-grid or RV solar (no grid-tie, no permitting concerns)", "Small portable solar generators", "DIY ground-mount if you're an experienced electrician"]
            : isPool
            ? ["Above-ground pool installation (Intex-style or kit pools under 4 ft)", "Hot tub setup on existing electrical infrastructure", "Filter pump replacement like-for-like"]
            : isSecurity
            ? ["Wireless DIY systems (SimpliSafe, Ring Alarm) without pro monitoring", "Smart-camera setups for self-monitoring", "Smart-lock + keypad installs"]
            : ["Batt insulation in accessible attic spaces", "Spray-foam can use for small gaps (per product instructions)", "Rim-joist or attic-hatch insulation upgrades"],
          toneSlug: "skilled-diy",
        },
        {
          heading: `Always call a ${labelLower} pro`,
          description: `Permits, tax credits, warranties, monitoring, code compliance — pro install protects all of these.`,
          examples: isSolar
            ? ["Grid-tied residential solar (permit + utility interconnect + inspection)", "Battery storage (Tesla Powerwall, Enphase)", "Anything touching the breaker panel", "Anything claiming the federal tax credit", "Roof-mount on anything over 6/12 pitch"]
            : isPool
            ? ["In-ground pool installation (excavation + electrical + plumbing + permitting)", "Major resurfacing (plaster, pebble, fiberglass)", "Heater installation (gas or heat pump)", "Salt-water conversion or major equipment upgrades", "Pool fence installation (PA code is strict)"]
            : isSecurity
            ? ["Professionally monitored systems with central station service", "Hard-wired pre-construction security", "Commercial security with access control", "Anything requiring an alarm permit", "Integration with existing fire/smoke detection"]
            : ["Whole-house insulation upgrades (energy audit + tax-credit eligible)", "Spray foam in enclosed wall cavities or crawl spaces", "Blown-in cellulose retrofits", "Removing pre-1980 insulation (asbestos potential)", "Anything tied to an energy-improvement loan or rebate"],
          toneSlug: "pro-only",
        },
      ],
      faq: [
        { q: `Why can't I DIY a grid-tied solar install?`, a: `Three reasons: (1) Your utility requires a licensed-electrician sign-off for grid interconnect. (2) The federal tax credit (30%) and PA programs require permitted professional installation. (3) Manufacturer warranties typically require certified install. DIY savings usually evaporate against these losses.` },
        { q: `Are DIY security systems as effective as monitored?`, a: `For deterrence and self-monitoring, often yes. Differences: (1) Professional monitoring contacts emergency services for you. (2) Most insurance discounts (10-20% off premium) require professional monitoring. (3) Some Erie alarm-permit rules specify monitored systems.` },
        { q: `What's the real cost of a DIY in-ground pool?`, a: `In Erie, in-ground pool installs run $40k-$80k pro. DIYing labor saves maybe $10k-$20k, but you'd need to manage excavation, plumbing, electrical, concrete, plaster/liner, deck, fence, and inspection across 8-12 weeks. Few finish successfully.` },
        { q: `Can I install attic insulation myself?`, a: `Yes — batts in accessible attic floors are DIY-friendly. Catch: most insulation tax credits and energy-efficiency rebates (federal IRA + PA) require professional installation. Run the numbers first.` },
        { q: `What about hot tubs?`, a: `Closest to true DIY in this category. You need a 240V outlet (often new circuit + permit), a level base, and patience for fill/balance. Total DIY setup costs: $300-$1,500 above tub purchase.` },
      ],
      riskCallout: `Big-ticket installs often have ten- to twenty-year financial implications through tax credits, rebates, manufacturer warranties, and insurance. DIY savings frequently disappear when those benefits don't apply to non-permitted, non-certified work.`,
    };
  }

  // ── auto: auto-repair / towing ──────────────────────────────────
  if (matches(nicheSlug, ["auto-repair", "auto-body", "mechanic", "towing"])) {
    const isTowing = matches(nicheSlug, ["towing"]);
    return {
      intro: `Modern cars are split between "anyone with basic tools" service items and "computer-controlled, manufacturer-specific" repairs. The era of full DIY car maintenance is past, but everyday items still pay off doing yourself.`,
      tiers: [
        {
          heading: "Safe to DIY",
          description: `Routine maintenance any owner can handle with $50 of tools.`,
          examples: isTowing
            ? ["Basic roadside prep: jumper cables, jack, spare in good shape", "Knowing how to safely change a flat", "Carrying an emergency kit (flares, blanket, water)", "AAA or roadside-coverage subscription"]
            : ["Oil changes (with $20 ramp set and $30 in oil + filter)", "Air and cabin filter replacement", "Wiper blade replacement", "Battery replacement on most modern cars", "Headlight bulb replacement (varies by car)", "Tire pressure checks"],
          toneSlug: "diy",
        },
        {
          heading: "Skilled DIY (with experience and a manual)",
          description: `Doable with a service manual and patience.`,
          examples: isTowing
            ? ["Self-recovery from a snowbank with traction mats", "Pulling a small trailer (within license + tow rating)"]
            : ["Brake pad replacement (rotors and pads, not ABS)", "Spark plug replacement on accessible engines", "Coolant flush and refill", "Serpentine belt replacement", "OBD2 diagnostic code reading"],
          toneSlug: "skilled-diy",
        },
        {
          heading: `Always call a ${labelLower} pro`,
          description: `Specialized tools, safety, or warranty requirements.`,
          examples: isTowing
            ? ["Vehicle stuck in any unsafe location", "Vehicle disabled by mechanical failure", "Accidents requiring documented recovery", "Heavy-duty or commercial vehicle towing", "Locked vehicles, jump-starts in unsafe areas"]
            : ["Anything under manufacturer warranty (DIY voids it)", "Transmission, drivetrain, or torque converter", "A/C and refrigerant work (EPA cert)", "Persistent check-engine codes", "Airbags, ABS, or active-safety systems", "Body work and frame repair", "Emissions inspection failures (PA-specific test centers)", "Anything needing a lift to do safely"],
          toneSlug: "pro-only",
        },
      ],
      faq: [
        { q: `Is DIY auto maintenance still worth it?`, a: `For oil changes, filters, and brake pads — yes. Each oil change saves $40-60 over a shop visit. Beyond those, modern cars increasingly require dealer-level diagnostic tools.` },
        { q: `How much can a single tow cost?`, a: `In Erie, basic local tow $75-$150. After-hours, weekends, or longer distances push to $200-$400. AAA membership or insurance roadside add-on is usually $50-$100/year and covers 4-6 tows. The math favors coverage.` },
        { q: `What's the cost of voiding a warranty by DIYing?`, a: `Depends on car age. A 2-year-old car under warranty: probably nothing for an oil change but potentially everything for a transmission flush. A 6-year-old out of warranty: irrelevant.` },
        { q: `Should I tow my own car if it breaks down?`, a: `Strongly discouraged. Unprotected tow-strapping a modern car can damage bumper, frame, or drivetrain — easily costing more than the tow saved. Flat tires you can change; everything else, call a tow.` },
        { q: `How do I find an honest mechanic?`, a: `Look for ASE certification, BBB rating, willingness to show the old part being replaced. Get a second opinion for any repair over $500. PA's State Inspection program separates inspecting and repairing — useful for finding shops not motivated to find problems.` },
      ],
      riskCallout: `Cars are heavy. Most DIY car-repair fatalities come from improper jacks (no jack stands), unstable vehicles, or working under a car held only by a hydraulic jack. Modern airbag systems, hybrid/EV batteries, and high-pressure fuel systems add unique safety risks.`,
    };
  }

  // ── healthcare: dental / chiropractic / veterinary ─────────────
  if (matches(nicheSlug, ["dental", "dentist", "chiropract", "veterinary", "vet", "dermatology", "optometry", "physical-therapy", "mental-health", "home-health", "senior-home", "hearing", "audiology"])) {
    const isDental = matches(nicheSlug, ["dental", "dentist"]);
    const isChiro = matches(nicheSlug, ["chiropract"]);
    const isVet = matches(nicheSlug, ["vet"]);
    return {
      intro: `Healthcare DIY is almost entirely about prevention. There's plenty you can and should do yourself — and a clear line where professional care becomes the only sensible option.`,
      tiers: [
        {
          heading: "Safe to DIY (prevention + self-care)",
          description: `What healthy patients do on their own to avoid problems and reduce visit frequency.`,
          examples: isDental
            ? ["Twice-daily brushing and once-daily flossing", "Fluoride toothpaste and antibacterial mouthwash", "Tongue scraping and gum massage", "Cold compresses for minor jaw discomfort", "Sensitivity toothpaste for known issues"]
            : isChiro
            ? ["Daily stretching and posture awareness", "Heat/ice for muscle tension or strain", "OTC pain reliever for acute discomfort", "Workplace ergonomics (chair, monitor, keyboard)", "Supportive mattress and proper pillow"]
            : isVet
            ? ["Daily care: feeding, watering, exercise, hygiene", "Brushing your pet's teeth (huge dental savings over time)", "Vet-recommended flea/tick prevention", "Nail trimming on calm pets", "Recognizing normal vs. abnormal behavior, eating, elimination"]
            : ["Daily preventive care and self-monitoring", "Maintaining records of changes or symptoms", "Research before appointments"],
          toneSlug: "diy",
        },
        {
          heading: "Skilled self-care (research-required)",
          description: `Things informed patients can do to supplement professional care.`,
          examples: isDental
            ? ["Using a water flosser daily", "Following grinding-guard or retainer instructions", "Tracking food triggers for sensitivity", "Self-administering medications during treatments"]
            : isChiro
            ? ["Foam-rolling and self-massage", "Yoga or Pilates programs targeted at known issues", "Strength training to support spine and joints", "Posture-correction exercises with proper form"]
            : isVet
            ? ["Subcutaneous fluids for senior pets (under vet guidance)", "Wound cleaning and bandage changes for minor injuries", "Administering oral medications correctly", "First-aid for minor cuts or hot spots"]
            : ["Medication administration per guidance", "Minor wound or skin-care management", "Tracking metrics relevant to your condition"],
          toneSlug: "skilled-diy",
        },
        {
          heading: `Always see a ${labelLower} pro`,
          description: `Diagnosis, treatment, and professional judgment that can't be safely replaced.`,
          examples: isDental
            ? ["Tooth pain lasting more than 2-3 days", "Bleeding, swollen, or receding gums", "Cracked or chipped teeth", "Annual cleanings and X-rays", "Any orthodontic, cosmetic, or implant work", "Trauma to teeth or jaw"]
            : isChiro
            ? ["Sudden severe back or neck pain", "Numbness, tingling, or shooting pain (nerve involvement)", "Pain that wakes you at night or doesn't ease with rest", "Unfamiliar headache patterns", "Post-injury assessment"]
            : isVet
            ? ["Any sudden change in eating, drinking, or behavior", "Bleeding, vomiting, or diarrhea lasting more than 24 hours", "Difficulty breathing or unsteady gait", "Annual wellness exams", "Dental cleanings (anesthesia required)", "Spay/neuter and vaccinations", "Any pet not eating for >24 hours"]
            : ["Any symptom you can't explain or that's worsening", "Annual preventive check-ups", "Anything getting worse over days", "Changes that are out of character"],
          toneSlug: "pro-only",
        },
      ],
      faq: [
        { q: `Why are annual visits worth it if nothing's wrong?`, a: `Most ${isDental ? "tooth decay" : isVet ? "feline kidney disease" : isChiro ? "chronic spinal misalignments" : "serious conditions"} is caught at a routine check-up before any symptoms appear. Catching things early reduces both treatment cost and chance of permanent damage by orders of magnitude.` },
        { q: `What's a sign I'm waiting too long?`, a: `Three signals: (1) you've changed your behavior to avoid the symptom, (2) it's been present more than 1-2 weeks, or (3) you find yourself searching the symptom online regularly. Any of those = book the appointment.` },
        { q: `Are second opinions normal in this field?`, a: `Yes. For anything involving surgery, expensive treatment, or significant lifestyle change, second opinions are standard and most providers expect them. Most will share imaging/records to support this.` },
        { q: `How much can DIY prevention actually save?`, a: `${isDental ? "Daily brushing + flossing reduces lifetime dental costs by $500-2,000." : isVet ? "Brushing pet teeth saves $300-800/cleaning; weight management saves $1k+ in joint issues." : isChiro ? "Posture and ergonomics often eliminate the need for ongoing care entirely." : "Significant — prevention is the highest-ROI healthcare spending."}` },
        { q: `When is "watchful waiting" reasonable vs. risky?`, a: `Reasonable for mild intermittent symptoms with clear triggers you can control. Risky for pain worsening, anything affecting daily activities, or symptoms you've never had before. When in doubt, call — most offices triage by phone for free.` },
      ],
      riskCallout: `Healthcare DIY is mostly prevention, not treatment. Avoid "doctor Google" diagnoses and especially DIY treatment of conditions you can't accurately self-diagnose. Pennsylvania has specific licensing for these fields; do not seek shortcuts through unlicensed practitioners.`,
    };
  }

  // ── professional-services: legal / accounting / real-estate ────
  if (matches(nicheSlug, ["legal", "lawyer", "attorney", "accounting", "tax", "real-estate", "financial-advisor", "insurance-agent", "mortgage-broker", "property-management", "airbnb-property", "estate-sale", "funeral-home", "home-inspection"])) {
    const isLegal = matches(nicheSlug, ["legal", "lawyer", "attorney"]);
    const isAcct = matches(nicheSlug, ["accounting", "tax"]);
    const isRE = matches(nicheSlug, ["real-estate"]);
    return {
      intro: `Professional services have a wider DIY range than most categories — many tasks are accessible with online tools and time. The question is usually: what does it cost if I get it wrong, and is the savings worth that risk?`,
      tiers: [
        {
          heading: "Safe to DIY",
          description: `Routine tasks where pre-built tools handle the work well.`,
          examples: isLegal
            ? ["Routine wills with simple assets and clear beneficiaries", "Power of attorney forms (state-provided)", "Standard residential lease (PA Realtors form)", "Filing a simple LLC in PA", "Reading documents before signing"]
            : isAcct
            ? ["W-2-only tax filing with standard deduction", "Tracking personal expenses for tax/budget", "QuickBooks setup for a simple sole proprietorship", "Reading your own financial statements", "Estimated tax payments using prior-year safe harbor"]
            : isRE
            ? ["Researching neighborhoods, schools, comps, market trends", "Touring open houses and getting bearings", "Pre-mortgage shopping (rate comparison, pre-approval)", "Initial price/feature negotiation with your partner"]
            : ["Self-education on basics of your situation", "Research before paying for a consultation", "Document organization and pre-meeting prep"],
          toneSlug: "diy",
        },
        {
          heading: "Skilled DIY (with experience)",
          description: `Possible for people with background or significant time investment.`,
          examples: isLegal
            ? ["Uncontested divorce paperwork in PA (no kids, no disputed assets)", "Small-claims court filings (PA up to $12,000)", "Trademark applications for simple marks", "Drafting standard business contracts with template guidance"]
            : isAcct
            ? ["Self-employment Schedule C with simple expenses", "Tax returns with itemized deductions and one investment account", "Bookkeeping for businesses under ~$200k revenue with clean records", "S-Corp election timing analysis"]
            : isRE
            ? ["FSBO for property you understand and a buyer you find directly", "Self-managing rental properties (basic landlording)", "Negotiating with another agent if well-prepared"]
            : ["Routine work where you've done it before", "Situations where you know the rules and risks"],
          toneSlug: "skilled-diy",
        },
        {
          heading: `Always hire a ${labelLower} pro`,
          description: `Stakes too high, complexity too great, or specialized knowledge required.`,
          examples: isLegal
            ? ["Anything involving children (custody, support, adoption)", "Contested divorces or complex estates", "Criminal defense (any charge — never DIY)", "Real estate closings", "Personal-injury cases", "Immigration matters", "Business beyond simple LLCs", "Contracts over $25k with significant obligations", "Anything involving regulators"]
            : isAcct
            ? ["Multi-state tax filings", "Audits, notices, IRS/PA Dept of Revenue correspondence", "Business returns (1120, 1120S, 1065)", "Major life events affecting taxes (divorce, inheritance, major sale)", "Real estate investment / 1031 exchanges", "Retirement / succession planning", "Anything where questionable tax positions need evaluation"]
            : isRE
            ? ["Buying or selling property (representation matters in negotiation)", "New construction", "Foreclosure, short sale, distressed property", "Multi-family or commercial properties", "Out-of-area transactions where local knowledge matters", "Estate or trust property transactions", "Disputes over condition, easements, or title"]
            : ["High-stakes decisions affecting finances long-term", "Anything requiring specialized PA licensing", "Adversarial situations with legal or regulatory exposure"],
          toneSlug: "pro-only",
        },
      ],
      faq: [
        { q: `When does DIY save real money?`, a: `For ${isLegal ? "routine documents costing $200-500 to have drafted" : isAcct ? "simple tax returns where you'd otherwise pay $200-400" : isRE ? "private transactions where you'd pay $5,000-15,000 in agent fees" : "routine work"}. Above those thresholds, the cost-of-mistake usually exceeds the fee savings.` },
        { q: `What's the actual risk of DIY going wrong?`, a: `Varies dramatically. ${isLegal ? "A bad will can cost your heirs 10× the will-drafting fee in probate fights." : isAcct ? "An IRS audit triggered by DIY mistakes can cost 5-10× the tax-prep fee in penalties + interest + resolution costs." : isRE ? "Bad negotiation on a $300k house costs $5k-30k; bad disclosures expose you to post-closing litigation." : "Mistakes here compound over time."}` },
        { q: `Can I do part myself and pay a pro for the rest?`, a: `Usually yes — many providers offer "review-only" or "advise-and-document" services at hourly rates. You do the data entry/research, the pro reviews and signs off. Pricing is typically 30-50% of full service.` },
        { q: `How do I find a competent ${labelLower} pro?`, a: `Three signals: (1) State bar / PA CPA association membership in good standing, (2) clear specialization in your specific need, and (3) willingness to give a 30-minute free consultation before commitment.` },
        { q: `Is online software (LegalZoom, TurboTax, Zillow) good enough?`, a: `Excellent for the simplest 70% of situations. Worse than a pro for the complex 20%, dangerous in the most-complex 10%. Knowing which category you fall in is the most important skill.` },
      ],
      riskCallout: `${label} mistakes often have very long tails. A bad will affects heirs decades later. A bad tax position can trigger audits years afterward. A bad real estate transaction can affect title for the life of the property. Pay for professional help when stakes are high.`,
    };
  }

  // ── underground-structural: septic / foundation ────────────────
  if (matches(nicheSlug, ["septic", "foundation", "basement-waterproof", "radon", "well-water"])) {
    const isSeptic = matches(nicheSlug, ["septic"]);
    return {
      intro: `${label} work involves systems that are buried, structural, or both. DIY is mostly limited to monitoring and prevention; once anything is wrong, the cost-benefit strongly favors a pro.`,
      tiers: [
        {
          heading: "Safe to DIY",
          description: `Monitoring, prevention, and basic maintenance.`,
          examples: isSeptic
            ? ["Tracking how much water enters the system (high water = system stress)", "Avoiding non-degradable materials in drains (wipes, hygiene products)", "Watching for warning signs (slow drains, gurgling, outdoor odor)", "Recording date of last pump-out (most systems: every 3-5 years)", "Keeping drain field clear of vehicles, structures, deep-rooted plants"]
            : ["Walking the perimeter quarterly for new cracks", "Photographing existing cracks with a coin for scale, monthly", "Maintaining proper grading away from foundation", "Cleaning gutters; extending downspouts away from foundation", "Running a dehumidifier in basements during humid months"],
          toneSlug: "diy",
        },
        {
          heading: "Limited DIY (small fixes only)",
          description: `Some minor repairs are doable for handy homeowners.`,
          examples: isSeptic
            ? ["Locating tank lids (mark them; saves the pumper time)", "Distress reset on sump pumps tied to septic systems", "Clearing tank-side filters per manufacturer instructions"]
            : ["Filling small (<1/16-inch) cracks in poured concrete with sealant", "Painting basement walls with waterproofing paint (cosmetic)", "Installing a sump pump where infrastructure exists", "Improving exterior drainage with downspout extensions"],
          toneSlug: "skilled-diy",
        },
        {
          heading: `Always call a ${labelLower} pro`,
          description: `Specialized equipment, code, or structural concerns.`,
          examples: isSeptic
            ? ["Tank pumping (specialized vacuum trucks)", "Field inspections and percolation tests", "Drain field repair or expansion", "New septic system installation (requires PA permits)", "Real-estate transaction inspections", "Any backup or surface failure", "Connecting to public sewer"]
            : ["Cracks larger than 1/4 inch, widening cracks, or stairstep cracks", "Active water entry through walls or floor", "Bowing or leaning basement walls", "Settlement causing doors/windows to misalign", "Sump-pump replacements or system upgrades", "Interior or exterior waterproofing systems", "Egress window installations", "French drains, tile drains, or major drainage work"],
          toneSlug: "pro-only",
        },
      ],
      faq: isSeptic
        ? [
            { q: `How do I know my septic system is failing?`, a: `Five signs: slow drains throughout the house, sewage odor inside or outside, wet spots over the drain field even in dry weather, lush green grass over the drain field, backups in the lowest drains. Any of these = call.` },
            { q: `How often should I really pump my septic tank?`, a: `Erie-area rule of thumb: every 3-5 years for a typical residential system. More often for high-water households or systems with garbage disposals. Pumping is $300-600; a failed drain field is $10,000+.` },
            { q: `Can I plant trees over my drain field?`, a: `No deep-rooted trees within 30 feet. Roots seek the moisture and nutrients and will clog the field. Shallow-rooted grasses are ideal.` },
            { q: `What chemicals damage septic systems?`, a: `Avoid: bleach in large quantities (kills the bacteria your tank needs), drain cleaners, antibacterial cleaners in excess. Septic additives are usually unnecessary and sometimes harmful.` },
            { q: `What's the cost of letting a problem go?`, a: `A $400 pumping today vs. a $15,000-$30,000 drain field replacement tomorrow. Catastrophic failures can contaminate well water (very expensive) or cause sewage backups in your home.` },
          ]
        : [
            { q: `How do I know if a foundation crack is serious?`, a: `Cracks under 1/8 inch wide that haven't grown in 6 months are usually fine — concrete settles. Cracks over 1/4 inch, growing cracks, stairstep cracks, or any horizontal cracks are urgent. Photograph with a coin for scale and call.` },
            { q: `Why do basement walls bow inward?`, a: `Hydrostatic pressure from saturated soil pushing on the wall. Untreated, it leads to wall failure. Solutions range from drainage improvements (cheap) to wall anchors or carbon fiber straps (medium) to wall replacement (expensive). Catch it early.` },
            { q: `Is interior or exterior waterproofing better?`, a: `Exterior is the gold standard but very expensive (excavation around the foundation). Interior systems (tile drains, sump pumps, vapor barriers) are 30-50% the cost and effective for most Erie homes. A pro should evaluate before recommending one.` },
            { q: `Does foundation work require permits?`, a: `In Erie, structural foundation work almost always requires permits. Waterproofing without structural work usually doesn't. Always check before starting; permitted work also adds value at resale.` },
            { q: `What's the cost of waiting on foundation issues?`, a: `Small cracks now: $200-500 to seal. Bowing walls now: $5k-15k. Failed wall later: $30k-80k. The math always favors early intervention.` },
          ],
      riskCallout: `${label} problems compound rapidly and silently. ${isSeptic ? "Septic backups can damage interior finishes and contaminate water; failed drain fields contaminate groundwater." : "Foundation failures threaten the entire structure and are excluded from most homeowner's insurance policies."} Annual visual inspection is the cheapest insurance available.`,
    };
  }

  // ── niche-services: pest / pet-grooming / photography / moving / demolition ──
  if (matches(nicheSlug, ["pest", "pet-grooming", "photograph", "moving", "demolition", "excavat", "bat-removal", "bee-wasp", "wildlife", "junk-removal", "dumpster", "general-contractor", "home-builder", "home-remodel", "boat-repair", "marine", "dock-install", "marina"])) {
    const isPest = matches(nicheSlug, ["pest"]);
    const isPet = matches(nicheSlug, ["pet-grooming"]);
    const isPhoto = matches(nicheSlug, ["photograph"]);
    const isMoving = matches(nicheSlug, ["moving"]);
    const isDemo = matches(nicheSlug, ["demolition", "excavat"]);
    const intro = isPest
      ? `Pest control sits at an interesting threshold: prevention is almost entirely your job, while serious infestations need pros with regulated chemistry and equipment.`
      : isPet
      ? `Pet grooming runs from "absolutely DIY" to "specialty work only pros should do" — primarily depending on coat type, temperament, and what you're trying to achieve.`
      : isPhoto
      ? `Photography has the widest skill range of any niche on this list — from "anyone with a phone" to "professional crew with $50k of gear." Knowing where the line falls for your specific need is the whole question.`
      : isMoving
      ? `Moving DIY is a real-world cost-benefit calculation: rent a truck and recruit friends (cheap, exhausting, risky) or hire pros (expensive, fast, insured). Most owners do one or the other once or twice in their lives.`
      : `Demolition and excavation are heavily pro-territory: most work involves permits, utility marking, specialized equipment, and disposal logistics that homeowners rarely have access to.`;
    const tier1 = isPest
      ? ["Sealing entry points: caulking gaps, screen replacement, door sweeps", "Sanitation: clean kitchens, sealed food, regular trash removal", "Reducing harborage: declutter basements, garages, sheds", "Hardware-store traps and bait stations for occasional rodents", "OTC ant baits and roach traps for limited sightings"]
      : isPet
      ? ["Brushing 2-3 times per week (or daily for long coats)", "Basic bathing with pet-safe shampoo at home", "Ear cleaning per vet recommendation", "Teeth brushing (huge dental savings over time)", "Eye and tear-stain cleaning"]
      : isPhoto
      ? ["Family photos in good lighting (modern phones are great)", "Real estate listings for FSBO or reference photos", "Inventory documentation", "Social media content of your own life", "Documentation photos (for insurance, projects)"]
      : isMoving
      ? ["Single-room or studio moves", "Local moves (under 30 miles)", "Moves where you have time across a weekend", "Renting a truck + recruiting friends", "Packing fragile items carefully ahead of time"]
      : ["Removing a non-load-bearing piece of trim or molding", "Digging a fence-post hole or small landscape hole (after 811 call)", "Tearing out an old vanity or small fixture for replacement"];
    const tier2 = isPest
      ? ["Targeted boric acid or gel baits for sustained ant or roach issues", "Wasp/hornet nest removal (very small accessible nests only; at dusk)", "Mouse-trap deployment with proper placement and bait", "Mosquito control through standing-water elimination"]
      : isPet
      ? ["Nail trimming on calm dogs and cats (with proper clippers)", "Light coat trimming for less-fussy breeds (no specific style)", "Coat de-shedding with the right tools (FURminator, etc.)", "Sanitary trims with scissors (careful work)"]
      : isPhoto
      ? ["Family portraits for personal use", "Casual event photography for friends", "Pet photography for personal use", "Improved real-estate photos with wide-angle lens", "Product photography for small online businesses"]
      : isMoving
      ? ["Full-house local moves with 4-6 friends and a 26-ft truck", "Moves where you've moved 3+ times and have a system", "Self-moves with PODS or similar storage-pod services"]
      : ["Removing interior non-load-bearing walls (with permit + verified non-bearing)", "Tearing out tile, flooring, or cabinets for renovation", "Small concrete pad removal (under 50 sq ft) with rented tools", "Backyard projects with hand tools"];
    const tier3 = isPest
      ? ["Termites (PA-regulated; misdiagnosis or DIY treatment voids warranties)", "Bed bugs (DIY rarely solves; can spread the problem to neighbors)", "Rat infestations (sanitation + structural exclusion needed)", "Wasps/hornets in walls, soffits, or large nests", "Carpenter ants (look like nuisance ants but cause structural damage)", "Stinging insect allergic reactions in household", "Anything in restaurants, daycares, or regulated facilities", "Recurring problems despite DIY efforts"]
      : isPet
      ? ["Breed-standard grooming (Poodle, Schnauzer, Yorkie, etc.)", "Matted coats (DIY brushing causes pain)", "Aggressive or fearful animals", "Senior pets requiring careful handling", "Show-grooming or breed-specific haircuts", "Any procedure requiring sedation (vet office only)"]
      : isPhoto
      ? ["Weddings and milestone events (can't be reshot)", "Professional headshots for business use", "Senior portraits, family portraits with formal use", "Newborn photography (safety-trained pros only)", "Real estate listings over $300k", "Product photography for serious e-commerce", "Anything intended for print at large size", "Drone photography (FAA-licensed for commercial use)"]
      : isMoving
      ? ["Long-distance moves (over 100 miles)", "Multi-story moves with stairs", "Time-pressured moves (closing dates, lease end)", "Heavy/awkward items: pianos, safes, large appliances", "Older adults or those with physical limitations", "When your time is worth more than the labor savings", "Anything involving moving company insurance"]
      : ["Structural demolition (load-bearing walls, support beams)", "Any whole-building or major-portion demolition", "Excavation deeper than 12 inches (utility marking + safety)", "Foundation, pool, or basement excavation", "Anything involving asbestos, lead paint, or hazmat", "Pre-1978 building demolition (EPA RRP rules)", "Anything requiring a dumpster larger than 10 yards", "Anywhere near gas, electric, water, fiber lines"];
    const faqList = isPest
      ? [
          { q: `Why don't DIY products work as well as pro treatments?`, a: `Two reasons: pros use products with different active ingredients than retail (some restricted), and they find sources DIYers miss. A pro spending 30 minutes inspecting finds harborage you'd never check.` },
          { q: `What's the difference between sporadic ants and an infestation?`, a: `Sporadic = a few ants in spring, easily explained. Infestation = persistent trails, multiple entry points, multiple species, or multiple rooms affected. Sporadic = DIY. Infestation = pro.` },
          { q: `Are pest sprays safe around kids and pets?`, a: `Modern professional products are very safe when applied per label — usually requiring a 30-60 minute drying period before re-entry. DIY hardware-store products are also generally safe with proper application but easier to misuse.` },
          { q: `How often do I need ongoing pest service?`, a: `Most Erie homes do well with quarterly or seasonal preventive service ($35-$75 per visit). Comparable to DIY product spending plus saves a major flare-up.` },
          { q: `What about natural / "green" pest control?`, a: `Effective for prevention and minor issues; mixed results on established infestations. Most reputable Erie pest services offer green-friendly options; professional application is what matters most.` },
        ]
      : isPet
      ? [
          { q: `How often should my dog be professionally groomed?`, a: `Depends on breed. Short-coat (Lab, Beagle): every 8-12 weeks. Medium-coat (Golden, Spaniel): every 4-8 weeks. Long-coat (Poodle, Maltese, Shih Tzu): every 4-6 weeks. Long-haired cats: every 6-12 weeks.` },
          { q: `Can I cut my dog's nails myself?`, a: `For calm dogs, yes — with proper clippers and styptic powder ready in case you nick the quick. For nervous or dark-nailed dogs, professional or vet trim is safer ($10-20 add-on at most groomers).` },
          { q: `What's the worst grooming DIY mistake?`, a: `Brushing through matts without de-matting tools — incredibly painful for the pet and often makes the matting worse. If you see matting, get to a groomer; don't pull at it.` },
          { q: `Is mobile grooming worth the premium?`, a: `For nervous pets, senior pets, or multi-pet households, often yes. Mobile groomers in Erie typically charge 30-50% more than salon-based but eliminate salon stress.` },
          { q: `How do I find a groomer who's good with my breed?`, a: `Ask. Most groomers specialize informally. Look for breed-specific photos in their portfolio. National Dog Groomers Association certification is also a quality signal.` },
        ]
      : isPhoto
      ? [
          { q: `Why do wedding photos cost so much?`, a: `A wedding photographer's actual delivery includes 8-10 hours on-site + 20-40 hours of editing + insurance, gear depreciation, backup equipment, and the irreplaceability of the work. The $3k-8k typical wedding cost reflects total time, not just the day.` },
          { q: `Are smartphone photos really good enough for real estate?`, a: `For homes under $200k or rental listings, often yes. For homes over $300k, professional photography is shown to reduce time-on-market by 30-50% in most studies.` },
          { q: `What's the cheapest way to get professional-quality headshots?`, a: `Mini-session events ($100-200 for 30 minutes) or sharing a session with a colleague. Most photographers offer these at reduced rates compared to full sessions.` },
          { q: `When should I hire a videographer vs. photographer?`, a: `Photo for static moments and shareable assets; video for narrative, motion, or social-media shorts. Many events benefit from both.` },
          { q: `How do I avoid bad photographers?`, a: `Look at full galleries (not just highlight reels), check Google reviews with photos, verify insurance and contracts. Beware of dramatically below-market pricing.` },
        ]
      : isMoving
      ? [
          { q: `What does professional moving really cost?`, a: `In Erie: $300-700 for studio/1-bedroom local; $700-2,000 for 2-3 bedroom local; $2,000-8,000 for long-distance. Add packing services for 20-30%. Get 3 estimates.` },
          { q: `What's the most underestimated cost of a DIY move?`, a: `Time. Most people undercount by 50-100%. A "weekend move" routinely becomes a week of cleanup and unpacking. Opportunity cost often exceeds the labor savings.` },
          { q: `Are movers insured for damaged items?`, a: `Yes, with two tiers: basic Released Value Protection ($0.60/lb/item — typically inadequate) and Full Value Protection (covers actual replacement value). DIYers have zero insurance on items they damage.` },
          { q: `How early should I book movers in Erie?`, a: `4-6 weeks for regular weekdays; 8 weeks for weekends or end-of-month dates. Summer is busiest — book earlier.` },
          { q: `What about hybrid (you pack, they move)?`, a: `Often the best value. Packing is 40-60% of moving labor cost. Doing it yourself can save $500-2,000 and gives you control over fragile items.` },
        ]
      : [
          { q: `Why does demolition cost so much?`, a: `Disposal is 30-40% of the cost. Dumpsters, debris hauling, and landfill tipping fees add up. Labor, equipment, and permits make up the rest. Residential projects often hit $2k-10k.` },
          { q: `Can I rent equipment and do excavation myself?`, a: `Risky. Renting a mini-excavator is cheap ($300-500/day). The actual cost is what happens when you hit a utility line ($500-50,000+) or damage your property. The 811 utility marking call is free and mandatory.` },
          { q: `What about salvage value?`, a: `Some demolition jobs have salvage value (vintage doors, wood, fixtures) — discuss with your contractor; they may discount labor for salvage rights.` },
          { q: `Do I need a permit for interior demolition?`, a: `In Erie, anything affecting structural elements, electrical, plumbing, or HVAC needs a permit. Non-load-bearing wall removal often needs permit + engineer sign-off.` },
          { q: `What's the biggest hazard in DIY demolition?`, a: `Three: (1) Asbestos in pre-1980 materials. (2) Hidden utilities (live wires, gas lines, plumbing) inside walls. (3) Structural cascade (removing the wrong thing). Pros know what to look for.` },
        ];
    const tier1Heading = isPest ? "Safe to DIY" : isPet ? "Safe to DIY" : isPhoto ? "Safe to DIY" : isMoving ? "Safe to DIY" : "Safe to DIY";
    const tier2Heading = isPest ? "Skilled DIY (research-required)" : isPet ? "Skilled DIY (with practice)" : isPhoto ? "Skilled DIY (camera + practice required)" : isMoving ? "Skilled DIY (with truck + crew)" : "Skilled DIY (with experience)";
    const tier3Heading = isPest ? "Always call a pest control pro" : isPet ? "Always call a groomer" : isPhoto ? "Always hire a photographer" : isMoving ? "Always hire movers" : "Always call a pro";
    return {
      intro,
      tiers: [
        { heading: tier1Heading, description: `Prevention, routine work, and small-scale tasks any homeowner can handle.`, examples: tier1, toneSlug: "diy" },
        { heading: tier2Heading, description: `Doable for committed homeowners with the right gear or experience.`, examples: tier2, toneSlug: "skilled-diy" },
        { heading: tier3Heading, description: `Specialty work, regulated chemistry, structural risk, or insurance/safety concerns.`, examples: tier3, toneSlug: "pro-only" },
      ],
      faq: faqList,
      riskCallout: isPest
        ? `Pesticide misapplication can harm kids, pets, and pollinators. Pennsylvania regulates pesticide application; professional licensing exists for a reason. Termite and carpenter ant misdiagnosis can lead to thousands in undetected structural damage.`
        : isPet
        ? `Improper grooming can cause pain (matting, cut nails, ear injuries) and lasting fear of grooming. Patient, gradual exposure to grooming from puppyhood — combined with occasional professional grooming — produces well-adjusted, easy-to-care-for pets.`
        : isPhoto
        ? `Wedding and milestone photos can't be redone. Underqualified photographers in these categories produce stress that lasts as long as the disappointment in the photos. The cost difference between adequate and great is usually 20-40% of the total — small relative to the impact.`
        : isMoving
        ? `DIY moves cause more injuries than most home-improvement work — back injuries, dropped objects, vehicle accidents with rented trucks. Damaged items have no insurance coverage. The "savings" can easily disappear with one bad incident.`
        : `Demolition combines structural risk, hazmat exposure, and disposal liability. Pennsylvania regulates asbestos and lead-paint disturbance; non-compliant removal can trigger major fines. Hidden utilities cause both direct injury and expensive repair liability.`,
    };
  }

  // ── Generic fallback for non-tuned niches ──────────────────────
  const services = content?.commonServices?.slice(0, 3) ?? [];
  return {
    intro: `Knowing what you can handle yourself and what needs a ${labelLower} professional saves money on the easy stuff and prevents trouble on the hard stuff.`,
    tiers: [
      {
        heading: "Safe to DIY",
        description: `Routine tasks most homeowners can handle.`,
        examples: services.length
          ? [
              `Basic ${labelLower} maintenance and upkeep`,
              `Researching options before contacting a pro`,
              `Following manufacturer instructions for products you own`,
            ]
          : [
              `Routine maintenance per manufacturer instructions`,
              `Cleaning and minor care`,
              `Research and price comparison`,
            ],
        toneSlug: "diy",
      },
      {
        heading: "Skilled DIY (with caution)",
        description: `Doable if you have experience and the right tools.`,
        examples: services.slice(0, 2).length
          ? services.slice(0, 2).map((s) => `Minor ${s.toLowerCase()} work`)
          : [`Minor repairs with proper tools and prep`, `Cosmetic or surface-level work`],
        toneSlug: "skilled-diy",
      },
      {
        heading: `Always call a ${labelLower} pro`,
        description: `Scope, code, or expertise requirements make these pro-only.`,
        examples: [
          `Major ${labelLower} installations or replacements`,
          `Anything requiring a permit in Pennsylvania`,
          `Work where mistakes are expensive or dangerous`,
          `Insurance claims requiring documentation`,
        ],
        toneSlug: "pro-only",
      },
    ],
    faq: [
      {
        q: `When is it worth calling a ${labelLower} pro instead of DIYing?`,
        a: `Three signals: the task requires a permit, the cost of a mistake exceeds the cost of the pro visit, or you'd be working on something safety-critical. When any one is true, the pro pays for themselves.`,
      },
      {
        q: `How much can I save by DIYing ${labelLower} work?`,
        a: `Labor is typically 50–70% of the cost on most ${labelLower} jobs. DIY can save that — but only if you have the skill, time, and tools. Factor in opportunity cost and the risk of needing a pro to fix mistakes.`,
      },
      {
        q: `What's the most common DIY ${labelLower} mistake?`,
        a: `Underestimating scope. Most homeowners assume a job will take half as long as it does and cost less than projected. Get a pro quote first; then decide if the savings justify the time.`,
      },
      {
        q: `Will doing my own ${labelLower} work affect my insurance?`,
        a: `Maintenance and minor work generally won't. Major work that should have required a permit and didn't can void coverage for related damage. Check with your insurer before starting anything substantial.`,
      },
      {
        q: `Where do I draw the line on ${labelLower} DIY?`,
        a: `If you're asking the question, you're probably already past the line. Pros do this every day; you do it once. The pro is faster, has the right parts, and carries insurance if something goes wrong.`,
      },
    ],
    riskCallout: `${label} work that should have required a permit but didn't can affect insurance claims. Mistakes on substantial projects often cost more to fix than the original pro visit would have.`,
  };
}

// ── Red-Flags Content ────────────────────────────────────────────────

export interface RedFlag {
  /** Short title of the warning sign */
  sign: string;
  /** What it likely means */
  meaning: string;
  /** What to do — "watch", "schedule", or "call now" */
  action: "watch" | "schedule" | "urgent";
}

export interface RedFlagsContent {
  intro: string;
  /** Early warning signs (low urgency) */
  earlyWarnings: RedFlag[];
  /** Mid-severity (schedule soon) */
  midSeverity: RedFlag[];
  /** Call-now signs */
  urgent: RedFlag[];
  /** Cost-of-delay framing */
  costOfDelay: string;
  /** FAQ for schema */
  faq: Array<{ q: string; a: string }>;
}

export function getRedFlagsContent(nicheSlug: string): RedFlagsContent {
  const niche = getNicheBySlug(nicheSlug);
  const label = niche?.label ?? "service";
  const labelLower = label.toLowerCase();

  if (matches(nicheSlug, ["plumb", "drain", "sewer", "septic", "water-heater"])) {
    return {
      intro: `Plumbing issues rarely fix themselves. The signs below escalate from "interesting" to "call now" — knowing the difference between them can save thousands.`,
      earlyWarnings: [
        { sign: "Faucet drips occasionally", meaning: "Worn washer or cartridge. Costs ~$5/month in water but signals other fixtures are wearing too.", action: "watch" },
        { sign: "Slightly slow drain in one fixture", meaning: "Hair or soap buildup in the trap. DIY-fixable with a snake.", action: "watch" },
        { sign: "Toilet runs intermittently", meaning: "Flapper failing. Causes a ~$20–$40/month water bill spike.", action: "schedule" },
        { sign: "Lower water pressure throughout house", meaning: "Sediment in pipes, partially closed valve, or main supply issue.", action: "schedule" },
      ],
      midSeverity: [
        { sign: "Multiple slow drains", meaning: "Main line is partially blocked — clog is past the trap. Roots in line are common in older Erie homes.", action: "schedule" },
        { sign: "Brown or yellow water at any faucet", meaning: "Pipe corrosion (galvanized supply lines in older homes) or water heater sediment. Health concern over time.", action: "schedule" },
        { sign: "Water heater making popping or banging sounds", meaning: "Sediment buildup. Reduces efficiency. Predicts tank failure within 6–18 months.", action: "schedule" },
        { sign: "Gurgling sound from a drain when another fixture runs", meaning: "Vent stack blocked or main line restriction. Sewer gas can enter the house.", action: "schedule" },
        { sign: "Damp patches on ceiling, walls, or floor far from any fixture", meaning: "Hidden leak in a wall or under a slab. Compounds daily.", action: "schedule" },
      ],
      urgent: [
        { sign: "Water actively running where it shouldn't be", meaning: "Burst pipe, failed connection, or appliance leak. Damage rate measured in dollars per minute.", action: "urgent" },
        { sign: "Sewage backing up into any fixture", meaning: "Main line is fully blocked. Sewage is biohazardous. Stop using all water immediately.", action: "urgent" },
        { sign: "No water anywhere in the house", meaning: "Main supply failure, frozen line, or municipal issue. Frozen lines burst as they thaw.", action: "urgent" },
        { sign: "Smell of natural gas near a water heater or boiler", meaning: "Gas leak. Leave the house, call 911 and the gas utility from outside.", action: "urgent" },
        { sign: "Water pooling near the foundation outside", meaning: "Burst main supply line. Affects all utilities entering the home.", action: "urgent" },
      ],
      costOfDelay: `Plumbing problems compound exponentially. A $200 fix at the "schedule" stage becomes a $5,000–$15,000 fix once water damage is involved. Most insurance policies only cover "sudden and accidental" plumbing damage — leaks ignored for weeks may not be covered.`,
      faq: [
        { q: `What's the most-ignored plumbing red flag?`, a: `Slow drains. Homeowners live with them for months. They almost always indicate main-line restriction that will eventually back up sewage into the house. A $250 main-line clearing prevents a $3,000+ backup.` },
        { q: `Is a small drip worth a service call?`, a: `Not on its own, but a drip means the fixture is wearing — and usually others are too. Get a plumber to do a 30-minute walkthrough every 2–3 years; they'll catch failing components before they fail.` },
        { q: `How quickly should I call about water in the basement?`, a: `Same day if it's clean water; within the hour if it's sewage. Mold starts at 48 hours; sewage cleanup gets expensive faster than that.` },
        { q: `What's the cost of waiting on a water heater that's making noise?`, a: `A noisy tank typically fails within 6–18 months. Replacement cost is the same either way — but a planned replacement is $1,800–$3,500; an emergency one with water damage is $5,000–$10,000.` },
        { q: `Should I worry about brown water in the morning only?`, a: `Sometimes yes (galvanized pipe corrosion), sometimes no (sediment kicked up after a city main flush). Run cold water for 2 minutes; if it clears, monitor for repeat. If it persists or affects hot water too, call.` },
      ],
    };
  }

  if (matches(nicheSlug, ["electric", "wiring", "panel", "ev-charger", "generator-install", "smart-home"])) {
    return {
      intro: `Electrical problems often telegraph their failures in subtle ways. Knowing the warning signs separates "small fix now" from "house fire later."`,
      earlyWarnings: [
        { sign: "Outlet feels slightly warm to the touch", meaning: "Slight overload or loose connection. Worth flagging at your next service call.", action: "watch" },
        { sign: "Mild flicker when a large appliance starts", meaning: "Normal voltage drop, but worth noting if frequent.", action: "watch" },
        { sign: "GFCI trips occasionally and resets fine", meaning: "Sometimes moisture, sometimes a worn GFCI. Replace the GFCI ($25 part) before assuming worse.", action: "watch" },
      ],
      midSeverity: [
        { sign: "Breaker trips repeatedly on the same circuit", meaning: "Genuine overload, short, or failing breaker. Don't keep resetting — diagnose.", action: "schedule" },
        { sign: "Discoloration around an outlet or switch plate", meaning: "Heat damage. Loose connection inside the box is arcing.", action: "schedule" },
        { sign: "Two-prong outlets in any room", meaning: "Ungrounded circuits. Common in pre-1965 Erie homes. Hazard with modern electronics.", action: "schedule" },
        { sign: "Aluminum wiring (if home built ~1965–1973)", meaning: "Aluminum-to-copper junction failures are a leading cause of house fires.", action: "schedule" },
        { sign: "Persistent buzzing from any electrical box", meaning: "Loose neutral or failing breaker. Diagnose within days.", action: "schedule" },
      ],
      urgent: [
        { sign: "Burning smell from any outlet, switch, or the panel", meaning: "Active arc fault. Shut off the breaker if you can identify it; call immediately.", action: "urgent" },
        { sign: "Sparks from an outlet or switch", meaning: "Visible arcing. Don't reset; don't use.", action: "urgent" },
        { sign: "Charred or melted outlet/switch", meaning: "Past arc event. Don't touch; cut power at panel.", action: "urgent" },
        { sign: "Tingling from any metal surface (appliance, faucet)", meaning: "Stray voltage. Could indicate a hot-to-ground fault. Shock risk.", action: "urgent" },
        { sign: "Power loss in part of the house with no breaker tripped", meaning: "Open neutral. Can cause voltage swings that destroy electronics and start fires.", action: "urgent" },
      ],
      costOfDelay: `Electrical fires kill ~400 people and cause $1.4B in damage in the US annually. Most start at "small" problems homeowners noticed but didn't address. A $250 diagnostic visit is one of the highest-ROI maintenance dollars in homeownership.`,
      faq: [
        { q: `Should I worry about an outlet that's warm but works fine?`, a: `Yes. Outlets shouldn't be warm. Warmth means resistance — usually a loose wire connection arcing intermittently. That's how electrical fires start. Replace the outlet ($15 part + 15 minutes) or have an electrician do it.` },
        { q: `Why does my breaker keep tripping?`, a: `Three usual causes: too many devices on one circuit (move some), short circuit somewhere (find it), or the breaker itself is failing (replace it). Repeatedly resetting a tripping breaker is dangerous — it's designed to protect you from heat, not be a nuisance.` },
        { q: `Is aluminum wiring really a fire hazard?`, a: `Yes, particularly at the connection points where aluminum meets copper or brass. CPSC estimates aluminum-wired homes are 55× more likely to have fire-hazard conditions than copper-wired. Many insurance carriers in PA require remediation.` },
        { q: `How fast can a small electrical issue become a fire?`, a: `Arc faults can smolder undetected for weeks before igniting. By the time you see scorch marks, you're already at high risk. Speed matters less than not ignoring it.` },
        { q: `What about flickering lights — is that always serious?`, a: `Brief flickers when a big appliance kicks in are normal. Sustained flickers, flickers across multiple rooms, or flickers paired with a buzzing sound are not. Don't wait on those.` },
      ],
    };
  }

  if (matches(nicheSlug, ["roof", "siding"])) {
    return {
      intro: `Roof problems are mostly invisible until they aren't. By the time you see a stain on the ceiling, water has been entering for weeks. The signs below give you earlier warning.`,
      earlyWarnings: [
        { sign: "Granules in gutters or downspouts", meaning: "Shingles shedding their protective layer. Normal in moderation; concerning if extensive.", action: "watch" },
        { sign: "Roof is approaching 18–20 years old (asphalt)", meaning: "End of useful life. Start budgeting for replacement.", action: "watch" },
        { sign: "Moss or algae growth on shingles", meaning: "Holds moisture against shingles, shortens life. Cosmetic but worth treating.", action: "watch" },
      ],
      midSeverity: [
        { sign: "Curling, cracked, or missing shingles visible from the ground", meaning: "Wind or age damage. Adjacent shingles will lift next.", action: "schedule" },
        { sign: "Dark streaking or stains on the roof", meaning: "Trapped moisture or algae. Diagnoses underlying issues.", action: "schedule" },
        { sign: "Sagging anywhere on the roof line", meaning: "Decking damage or structural issue. Compounds fast.", action: "schedule" },
        { sign: "Rusty or damaged flashing around chimney, vents, skylights", meaning: "Primary water entry point. Flashing fails before shingles in most leaks.", action: "schedule" },
        { sign: "Daylight visible through the roof from the attic", meaning: "Hole. Water is entering when it rains, even if you don't see it inside.", action: "schedule" },
      ],
      urgent: [
        { sign: "Active drip or water stain on a ceiling", meaning: "Roof is currently leaking. Damage accruing every storm.", action: "urgent" },
        { sign: "Roof sagging visible from the ground", meaning: "Structural compromise. Risk of collapse in heavy snow.", action: "urgent" },
        { sign: "Large area of missing shingles after a storm", meaning: "Insurance event. Document immediately; tarp; call.", action: "urgent" },
        { sign: "Tree limb resting on roof", meaning: "Active or imminent damage. Don't try to remove yourself.", action: "urgent" },
        { sign: "Smell of mildew in the attic", meaning: "Active water intrusion. Mold conditions established.", action: "urgent" },
      ],
      costOfDelay: `A $400–$1,500 roof repair caught early prevents a $6,000–$15,000 interior repair plus restoration. Storm damage claims have time limits — most policies require reporting within 60 days. Erie's winters compound roof problems faster than warmer climates.`,
      faq: [
        { q: `Should I worry about a few missing shingles?`, a: `Yes — not because of the gap (often small), but because adjacent shingles are now exposed to wind uplift and will follow. Spot repairs are $200–$600; waiting until 30% of the roof is affected pushes you toward replacement.` },
        { q: `How long can I wait if I see a small ceiling stain?`, a: `Don't wait. The stain is the third or fourth phase of the leak (water in roof → soaked decking → wet insulation → drywall stain). Damage is already inside the structure. Call within days.` },
        { q: `Are roof inspections worth the cost?`, a: `Yes, particularly on roofs 12+ years old, after major storms, and before selling. Most Erie roofers do free inspections for prospective work or $150–$300 for documented inspections.` },
        { q: `What's the most overlooked roofing red flag?`, a: `Granules in gutters. Homeowners notice them every spring during gutter cleaning and shrug. Heavy granule loss means shingles are 5–10 years past their prime even if they look OK from the ground.` },
        { q: `Is a tarp safe to leave on a roof?`, a: `For 1–2 weeks during repair coordination, yes. Beyond that, tarps shred, channel water unpredictably, and can damage shingles underneath. Get the actual repair done within 30 days.` },
      ],
    };
  }

  if (matches(nicheSlug, ["hvac", "heating", "cooling", "furnace", "ac-repair", "duct-clean"])) {
    return {
      intro: `HVAC systems telegraph their failures clearly if you know what to listen for. Small symptoms now usually mean larger repairs in 6–18 months.`,
      earlyWarnings: [
        { sign: "Slight rise in heating or cooling bills with same usage", meaning: "Efficiency loss. Filter, coils, or refrigerant level. Schedule a tune-up.", action: "watch" },
        { sign: "System runs longer than it used to", meaning: "Equipment losing capacity. Filter check first, then pro inspection.", action: "watch" },
        { sign: "Some rooms warmer or cooler than others", meaning: "Duct issues or balancing problem. Worth investigating before next season.", action: "watch" },
      ],
      midSeverity: [
        { sign: "Unusual smells from vents when system runs", meaning: "Mold in coils, burning dust on heating elements, or electrical issue. Diagnose.", action: "schedule" },
        { sign: "Knocking, squealing, or grinding sounds", meaning: "Belt, motor, or bearing wear. Cheaper to fix than to wait for failure.", action: "schedule" },
        { sign: "Short-cycling (system turns on and off frequently)", meaning: "Oversized system, low refrigerant, or thermostat issue. Wears equipment fast.", action: "schedule" },
        { sign: "Water near the indoor unit", meaning: "Condensate drain blocked or pan rusted through. Will overflow eventually.", action: "schedule" },
        { sign: "Furnace flame is yellow instead of blue", meaning: "Incomplete combustion. Carbon monoxide risk.", action: "schedule" },
      ],
      urgent: [
        { sign: "No heat in winter or no AC in summer extreme weather", meaning: "Real emergency. Frozen pipes (winter) or heat illness (summer) follow within hours.", action: "urgent" },
        { sign: "Smell of natural gas near furnace", meaning: "Gas leak. Leave the house; call 911 and gas utility from outside.", action: "urgent" },
        { sign: "Carbon monoxide alarm going off near a fuel-burning appliance", meaning: "CO leak. Leave the house; ventilate; call 911.", action: "urgent" },
        { sign: "Burning smell from the furnace at startup that lasts", meaning: "Brief dust burn-off is normal in fall; sustained burning smell is electrical or motor failure.", action: "urgent" },
        { sign: "Visible ice on AC components in summer", meaning: "Low refrigerant or airflow problem. Compressor will be destroyed if it runs.", action: "urgent" },
      ],
      costOfDelay: `An annual tune-up costs $80–$150 and typically catches small issues before they become major. Skipping tune-ups saves the labor cost but routinely leads to mid-season failures — when emergency-call rates are 1.5–2× normal and parts may be backordered.`,
      faq: [
        { q: `What's the most ignored HVAC warning sign?`, a: `Gradually rising energy bills. Homeowners attribute them to weather or rate changes. Compare year-over-year usage at similar temperatures — a 15%+ increase usually means the system is degrading.` },
        { q: `When should I worry about HVAC noises?`, a: `New noises are the signal. Squealing usually means a belt. Grinding means a bearing. Banging means something is loose. All three are 5–10× cheaper to fix in the schedule phase than after the part fails.` },
        { q: `Is short-cycling really damaging?`, a: `Yes. Each startup is the most stressful moment for a compressor or furnace. A short-cycling system can wear out in 8–10 years instead of 15–20. Diagnose quickly.` },
        { q: `What does it cost to ignore a small refrigerant leak?`, a: `Direct cost: $200–$400 in refrigerant per top-off (and increasingly restricted refrigerants are pricier). Indirect cost: the leak grows, the compressor runs low-charge and overheats, and you replace the system in 5 years instead of 15.` },
        { q: `My system is making a smell only sometimes — should I call?`, a: `Yes. Intermittent smells often mean intermittent electrical contact (worn relay) or a mold spore release. Both compound over time. The fix at intermittent stage is cheap; the fix after continuous symptom is not.` },
      ],
    };
  }

  if (matches(nicheSlug, ["restor", "flood", "mold", "water-damage", "fire", "storm-damage", "emergency-board"])) {
    return {
      intro: `Water and fire damage often start subtly. By the time it's obvious, mitigation costs have already multiplied. Catching the early signs is the difference between $1,500 and $15,000.`,
      earlyWarnings: [
        { sign: "Slight musty smell in basement, crawl space, or closet", meaning: "Moisture above normal humidity. Could be ventilation, could be a slow leak.", action: "watch" },
        { sign: "Soft or warped baseboards", meaning: "Past or present moisture. Could be old; worth verifying.", action: "watch" },
        { sign: "Small water stain on a ceiling that hasn't grown", meaning: "Old, dried leak — but verify it's truly dry, not periodic.", action: "watch" },
      ],
      midSeverity: [
        { sign: "Persistent musty smell that worsens after rain", meaning: "Active water intrusion. Mold has started.", action: "schedule" },
        { sign: "Visible mold on more than a 6×6 inch area", meaning: "Established colony. DIY cleanup risks spreading spores.", action: "schedule" },
        { sign: "Discolored grout, paint, or drywall", meaning: "Sustained moisture. Material is compromised; needs assessment.", action: "schedule" },
        { sign: "Soft drywall when pressed", meaning: "Water damage active or recent. Drywall doesn't recover; it gets replaced.", action: "schedule" },
        { sign: "Respiratory symptoms that improve when away from home", meaning: "Possible mold or air quality issue. Test before assuming.", action: "schedule" },
      ],
      urgent: [
        { sign: "Active water intrusion anywhere", meaning: "Mitigation starts within hours, not days. Mold begins at 48h.", action: "urgent" },
        { sign: "Sewage anywhere in the house", meaning: "Category 3 biohazard. PPE required for cleanup.", action: "urgent" },
        { sign: "Active fire or recent fire damage", meaning: "Soot is corrosive and gets worse for days after the fire.", action: "urgent" },
        { sign: "Visible mold across an entire wall or ceiling", meaning: "Major colony. Possible structural damage underneath.", action: "urgent" },
        { sign: "Smoke smell that won't dissipate", meaning: "Smoke residue in HVAC, insulation, fabrics. Compounds.", action: "urgent" },
      ],
      costOfDelay: `Every 24 hours after water intrusion doubles the cost trajectory. Day 1: $1,500–$3,000 to mitigate. Day 3: mold starts. Day 7: $10,000–$25,000 to remediate. Most homeowners' insurance covers prompt mitigation but limits coverage for "neglected" damage.`,
      faq: [
        { q: `How quickly does mold actually start growing?`, a: `48 hours under typical conditions. Visible by day 4–5. Inside walls by day 7. This is why restoration contractors run 24/7 — every hour after a water event matters.` },
        { q: `Is a musty smell always mold?`, a: `Usually some level of microbial growth, though not always toxic mold. Don't assume; verify. Air-quality testing is $150–$400 and gives you a definitive answer before paying for remediation.` },
        { q: `Can I just dry it out myself and skip mitigation?`, a: `For a small, clean-water event caught within 24 hours and dried within 72, sometimes yes. For anything beyond that — including all sewage, all fire damage, and most "I'm not sure how long it's been wet" cases — no.` },
        { q: `What's the most overlooked early warning sign?`, a: `Slightly stained or soft baseboards. Homeowners assume they're cosmetic — but they're often the visible edge of a hidden leak in the wall above. Press them. If they give, water is or was active.` },
        { q: `Will insurance cover this?`, a: `Almost always for "sudden and accidental" damage (burst pipe, appliance failure, fire). Rarely for "gradual" damage (long-standing leak, deferred maintenance). The faster you act, the easier it is to document as sudden.` },
      ],
    };
  }

  // ── outdoor-seasonal cluster ──────────────────────────────────
  if (matches(nicheSlug, ["landscap", "lawn", "snow", "tree-service", "tree-removal", "irrigation", "sprinkler", "gutter", "ice-dam", "salt-deicing", "outdoor-light", "holiday-light", "asphalt-seal", "driveway-pav", "decks-patio", "lakefront", "retaining-wall"])) {
    const isTree = matches(nicheSlug, ["tree"]);
    const isGutter = matches(nicheSlug, ["gutter"]);
    const isIrrigation = matches(nicheSlug, ["irrigation", "sprinkler"]);
    return {
      intro: `${label} problems often telegraph their failures before they become catastrophic. The signs below help you tell "monitor this" from "call before the storm."`,
      earlyWarnings: isTree
        ? [
            { sign: "Small dead branches in the canopy", meaning: "Normal in moderation, but watch the pattern. Many small dead branches signal stress.", action: "watch" },
            { sign: "Bark cracking or peeling in spots", meaning: "Could be normal seasonal shedding or early disease.", action: "watch" },
            { sign: "Mushrooms or fungi at the base", meaning: "Often indicates root rot under way. Worth a pro consult.", action: "watch" },
          ]
        : isGutter
        ? [
            { sign: "Granules from shingles in the gutter", meaning: "Roof aging normally, but extensive granule loss signals the roof is well past its prime.", action: "watch" },
            { sign: "Slight sag in one gutter section", meaning: "A loose hanger or weight from accumulated debris. Easy fix if caught early.", action: "watch" },
            { sign: "Water marks on siding below gutter", meaning: "Gutter is overflowing somewhere. Clean and verify pitch.", action: "watch" },
          ]
        : isIrrigation
        ? [
            { sign: "One zone looks browner than the others", meaning: "Sprinkler head misaligned, clogged, or broken. Easy fix.", action: "watch" },
            { sign: "Slightly higher water bill than last year", meaning: "Small leak in a line or a stuck valve. Find it before peak season.", action: "watch" },
            { sign: "Geyser-like spray from one head", meaning: "Broken sprinkler riser. Replace the head; cheap fix.", action: "watch" },
          ]
        : [
            { sign: "Bare patches in lawn that don't fill in", meaning: "Compacted soil, drainage issue, or grub damage. Diagnose before reseeding.", action: "watch" },
            { sign: "Mulch washing away after rain", meaning: "Bed pitch or drainage problem. Address before structural soil loss.", action: "watch" },
            { sign: "Edges of beds creeping into lawn", meaning: "Normal seasonal expansion. Re-edge annually.", action: "watch" },
          ],
      midSeverity: isTree
        ? [
            { sign: "Visible cavity, hollow, or large wound in trunk", meaning: "Structural integrity compromised. Get an arborist assessment.", action: "schedule" },
            { sign: "Leaning more than it used to", meaning: "Root system failing or soil eroding. High-risk situation, especially before storms.", action: "schedule" },
            { sign: "Heavy dead branches over the house, driveway, or sidewalk", meaning: "Target zone. Remove now, before wind brings them down.", action: "schedule" },
            { sign: "Large branches with no leaves while the rest is green", meaning: "Branch is dead but still attached. Will fall in next windstorm.", action: "schedule" },
          ]
        : isGutter
        ? [
            { sign: "Gutter pulling away from fascia at multiple points", meaning: "Fascia rotting from sustained moisture or hangers failing. Repair before next heavy rain.", action: "schedule" },
            { sign: "Plants growing in the gutter", meaning: "Years of debris and standing water. Significant overflow already happening.", action: "schedule" },
            { sign: "Rust streaks running down a gutter", meaning: "Steel gutter corroding from inside. Replacement window opening.", action: "schedule" },
            { sign: "Downspout disconnected or terminating at foundation", meaning: "Funneling water directly to your foundation. Extend or repair immediately.", action: "schedule" },
          ]
        : isIrrigation
        ? [
            { sign: "Backflow preventer leaking or hissing", meaning: "PA-required device failing. Compliance issue plus water waste.", action: "schedule" },
            { sign: "Multiple zones not running", meaning: "Controller, valve manifold, or main electrical issue. Pre-season check.", action: "schedule" },
            { sign: "Wet patches in lawn when system isn't running", meaning: "Underground leak. Get it located and repaired before next bill.", action: "schedule" },
            { sign: "Pump short-cycling (well-fed systems)", meaning: "Pressure tank failing. Will damage pump if ignored.", action: "schedule" },
          ]
        : [
            { sign: "Standing water in lawn 24+ hours after rain", meaning: "Drainage failure. Reseeding won't fix root cause.", action: "schedule" },
            { sign: "Retaining wall starting to bulge or tilt", meaning: "Failing. Costs grow exponentially as it progresses.", action: "schedule" },
            { sign: "Erosion channels cutting through beds or lawn", meaning: "Active soil loss. Address grading and drainage.", action: "schedule" },
            { sign: "Trees touching the roof or close to power lines", meaning: "Trim before next storm or utility forced trim.", action: "schedule" },
          ],
      urgent: isTree
        ? [
            { sign: "Large tree fallen or partially fallen across property", meaning: "Emergency tree service. Don't approach if power lines are involved.", action: "urgent" },
            { sign: "Tree split at trunk after storm", meaning: "Imminent additional failure. Remove before next wind event.", action: "urgent" },
            { sign: "Crack opening in trunk you can see growing", meaning: "Active structural failure. Stay clear; call now.", action: "urgent" },
            { sign: "Tree touching power lines or in contact with structure", meaning: "Utility emergency. Call power company first, then arborist.", action: "urgent" },
          ]
        : isGutter
        ? [
            { sign: "Water entering the house at fascia or soffit", meaning: "Gutter overflow is now an interior leak. Damage accumulating.", action: "urgent" },
            { sign: "Ice dam with active interior water staining", meaning: "Common in Erie winters. Causes ceiling and wall damage fast.", action: "urgent" },
            { sign: "Section of gutter detached and hanging", meaning: "Will fall or finish detaching in next storm. Re-secure now.", action: "urgent" },
            { sign: "Gutter overflowing in moderate rain (not torrential)", meaning: "Major blockage or capacity issue. Foundation damage accruing.", action: "urgent" },
          ]
        : isIrrigation
        ? [
            { sign: "Water bubbling up through lawn from underground", meaning: "Main line burst. Shut off at the main and call.", action: "urgent" },
            { sign: "Zone refuses to shut off", meaning: "Stuck valve. Manually shut off at the main while you wait.", action: "urgent" },
            { sign: "Backflow preventer geysering", meaning: "Failed assembly. Water loss and code violation.", action: "urgent" },
          ]
        : [
            { sign: "Trees down or large branches blocking driveway/entry", meaning: "Emergency removal. Don't drive over or under.", action: "urgent" },
            { sign: "Active erosion threatening foundation", meaning: "Heavy rain causing structural exposure. Immediate intervention.", action: "urgent" },
            { sign: "Retaining wall actively failing or fallen", meaning: "Cascading hazard. Stay back; call.", action: "urgent" },
          ],
      costOfDelay: `${label} issues escalate with weather. A $300 trim becomes a $3,000 emergency removal after a wind event. A $200 gutter repair becomes $5,000+ in foundation or interior damage. Pennsylvania's storm season punishes deferred maintenance.`,
      faq: [
        { q: `What's the most ignored ${labelLower} warning sign?`, a: `${isTree ? "Visible cavities or hollow sounds in trunks — homeowners think because the tree is leafing it's fine, but the structure is failing internally." : isGutter ? "Slight gutter sag — homeowners shrug at it, then a heavy rain rips the whole run off the fascia." : isIrrigation ? "Small annual increase in water bills — usually a slow underground leak that doubles within a season." : "Standing water 24 hours after rain — drainage failures only get worse."}` },
        { q: `Should I worry about pre-storm tree assessment?`, a: `Yes, especially in Erie's lakefront and snow-belt zones. A pre-season assessment from an arborist is typically $0-$150 and identifies what you don't see from the ground.` },
        { q: `How quickly should I respond to water at the foundation?`, a: `Within days. Erie's freeze-thaw cycles compound foundation damage faster than most regions. Once water is getting in, mold timeline (48-72 hours) starts.` },
        { q: `Does my insurance cover storm-damaged trees?`, a: `Generally yes if the tree damages a structure (house, fence, vehicle). Generally no if it falls in your yard without damaging anything — homeowner pays for removal. Document with photos before cleanup.` },
        { q: `When should I plan vs. emergency-call for ${labelLower}?`, a: `Plan: any of the "watch" or "schedule" items above. Emergency: anything labeled urgent, anything actively causing damage, anything involving safety. Call concierge at ${CONCIERGE_PHONE_DISPLAY} if unsure.` },
      ],
    };
  }

  // ── cleaning cluster ──────────────────────────────────────────
  if (matches(nicheSlug, ["clean", "maid", "janitor", "pressure-wash", "power-wash"])) {
    const isCarpet = matches(nicheSlug, ["carpet"]);
    const isPressure = matches(nicheSlug, ["pressure", "power-wash"]);
    return {
      intro: `Cleaning red flags are mostly about catching deeper problems early — surfaces that don't respond to cleaning often signal mold, moisture, or contamination beneath.`,
      earlyWarnings: [
        { sign: isCarpet ? "Carpet feels gritty even after vacuuming" : isPressure ? "Surface looks dingy but you can't tell why" : "Dust returning faster than usual", meaning: "Soil load building up, or HVAC filter overdue.", action: "watch" },
        { sign: isCarpet ? "Slight musty smell from one area when humid" : isPressure ? "Moss growth on shaded surfaces" : "Slight musty smell in one closet or corner", meaning: "Moisture above normal. Worth investigating the source.", action: "watch" },
        { sign: isCarpet ? "Visible traffic pattern on lighter carpet" : isPressure ? "Green/black streaks on north side of house" : "Spider webs returning constantly in same spots", meaning: isCarpet ? "Soil compacted into fibers. Annual deep clean before it becomes permanent." : "Algae or mildew establishing. Treat before it spreads.", action: "watch" },
      ],
      midSeverity: [
        { sign: isCarpet ? "Stains that come back after cleaning" : isPressure ? "Paint or stain peeling after a wash" : "Mold or mildew visible in tile grout or caulk", meaning: isCarpet ? "Wicking from the carpet pad. Pad replacement may be needed." : isPressure ? "Wrong pressure or chemistry damaged the surface. Recover with proper coating." : "Active microbial growth. Clean, address moisture source.", action: "schedule" },
        { sign: isCarpet ? "Smell that returns within a week of cleaning" : isPressure ? "Wood surfaces feel furry or rough after washing" : "Persistent odor that returns after cleaning", meaning: isCarpet ? "Pet or biological contamination in the pad. Surface clean doesn't reach it." : isPressure ? "Pressure raised the grain. Sand and reseal before further damage." : "Source is deeper than surface — check HVAC, drains, hidden moisture.", action: "schedule" },
        { sign: isCarpet ? "Tack strip showing or carpet pulling at edges" : isPressure ? "Mortar washing out from between bricks" : "Black spots inside cabinets or behind appliances", meaning: isCarpet ? "Restretching needed. Don't wait — carpet damages from continued wear." : isPressure ? "Pressure too high for the substrate. Have a mason re-point before water entry." : "Moisture and mold inside walls or under appliances. Investigate now.", action: "schedule" },
        { sign: "Surfaces that don't come clean despite repeated effort", meaning: "Something underneath is bleeding through. Could be contamination, water damage, or material failure.", action: "schedule" },
        { sign: "Strong chemical smell from cleaning supplies in confined space", meaning: "Over-application or wrong product mix. Ventilate; reduce concentration.", action: "schedule" },
      ],
      urgent: [
        { sign: "Visible mold on more than a 6×6 inch area", meaning: "Cleaning isn't enough — this needs remediation. DIY scrubbing spreads spores.", action: "urgent" },
        { sign: "Sewage smell or sewage residue anywhere", meaning: "Category 3 biohazard. PPE required. Professional cleanup only.", action: "urgent" },
        { sign: "Pressure-washing exposed a soft spot in siding or trim", meaning: "Rot underneath. Stop washing; investigate the structural damage.", action: "urgent" },
        { sign: "Carpet wet from underneath (not from a spill)", meaning: "Plumbing leak, foundation seepage, or HVAC condensate failure. Source first, then clean.", action: "urgent" },
      ],
      costOfDelay: `Surface cleaning ignores the source. Mold doubles every 24-48 hours in suitable conditions; sewage contamination becomes biohazardous within hours; pressure-washing damage compounds with the next rain. $150 of professional diagnosis often saves $5,000-$15,000 in remediation.`,
      faq: [
        { q: `When should I switch from DIY cleaning to a pro?`, a: `When the same problem keeps returning. Repeated DIY cleaning that doesn't last means you're treating symptoms; a pro identifies and addresses the source.` },
        { q: `Is professional cleaning worth it for a one-time deep clean?`, a: `Often yes — move-out, post-renovation, or pre-sale cleans benefit from commercial-grade equipment and chemistry. Cost is $200-$600 vs. DIY 8-12 hours of weekend.` },
        { q: `How do I know if a cleaning service is doing a thorough job?`, a: `Check the things they can't easily reach — behind toilets, top of refrigerator, baseboards, return-air grilles. If those are clean, the visible work probably is too.` },
        { q: `What's the difference between cleaning and disinfecting?`, a: `Cleaning removes dirt and visible matter. Disinfecting kills germs on already-clean surfaces. Most homes need cleaning; high-risk situations (illness, food prep, daycare) need both.` },
        { q: `Are "natural" cleaners as effective as conventional?`, a: `For routine cleaning, yes — vinegar, baking soda, and dish soap handle most needs. For disinfection or specialty soil, conventional products are usually more effective and faster.` },
      ],
    };
  }

  // ── specialty-repair cluster ──────────────────────────────────
  if (matches(nicheSlug, ["appliance-repair", "garage-door", "chimney", "fireplace", "locksmith", "handyman"])) {
    const isChimney = matches(nicheSlug, ["chimney", "fireplace"]);
    const isGarage = matches(nicheSlug, ["garage-door"]);
    const isAppliance = matches(nicheSlug, ["appliance"]);
    return {
      intro: `Specialty-repair red flags often look minor but signal expensive (or dangerous) failures ahead. Catch them early — these systems telegraph their problems.`,
      earlyWarnings: isChimney
        ? [
            { sign: "Smoke entering the room briefly at startup", meaning: "Cold flue stack effect — usually self-resolves once warm. Persistent = problem.", action: "watch" },
            { sign: "Light creosote on smoke shelf or damper", meaning: "Normal seasonal buildup. Schedule sweep.", action: "watch" },
            { sign: "Slight masonry discoloration above firebox opening", meaning: "Soot deposit. Annual cleaning recommended.", action: "watch" },
          ]
        : isGarage
        ? [
            { sign: "Slight squeaking when opening", meaning: "Rollers need lubrication. Silicone spray, not WD-40.", action: "watch" },
            { sign: "Remote works sometimes, not always", meaning: "Battery or distance issue. Verify before assuming opener problem.", action: "watch" },
            { sign: "Door doesn't close all the way then reverses", meaning: "Photo-eye alignment or sensor needs cleaning.", action: "watch" },
          ]
        : isAppliance
        ? [
            { sign: "Refrigerator running more than it used to", meaning: "Coils may need cleaning, or door seal worn. DIY fix.", action: "watch" },
            { sign: "Dishwasher leaving spots on glasses", meaning: "Rinse aid empty or hard water issue. Maintenance, not repair.", action: "watch" },
            { sign: "Washer slightly off-balance more often", meaning: "Leveling feet or load distribution. Adjustable.", action: "watch" },
          ]
        : [
            { sign: "Loose hinge or hardware feeling normal", meaning: "Tightening, lubrication, or shim. Routine maintenance.", action: "watch" },
            { sign: "Minor stuck door or window", meaning: "Seasonal expansion. Will work itself out or needs a small adjustment.", action: "watch" },
            { sign: "Light bulbs burning out fast in one fixture", meaning: "Bad fixture wiring or wrong bulb wattage. Diagnose before replacing.", action: "watch" },
          ],
      midSeverity: isChimney
        ? [
            { sign: "Heavy creosote (1/4 inch+) anywhere in flue", meaning: "Fire hazard. Don't use until cleaned.", action: "schedule" },
            { sign: "Water stains on ceiling near chimney", meaning: "Flashing or crown failure. Repair before winter freeze-thaw.", action: "schedule" },
            { sign: "Mortar dropping from chimney exterior", meaning: "Re-pointing needed. Will worsen rapidly with each freeze.", action: "schedule" },
            { sign: "Smoke entering room during normal use", meaning: "Draft issue, blockage, or damper problem. Stop using; investigate.", action: "schedule" },
            { sign: "Chimney cap missing or damaged", meaning: "Animals, rain, and debris entering flue. Replace promptly.", action: "schedule" },
          ]
        : isGarage
        ? [
            { sign: "Door starts opening then reverses", meaning: "Force settings off, or photo-eyes misaligned. Diagnose before bigger issue.", action: "schedule" },
            { sign: "Door visibly off-track or scraping", meaning: "Cable, drum, or roller problem. Stop using until fixed.", action: "schedule" },
            { sign: "Spring shows visible gap or kink", meaning: "Spring failure imminent. Don't operate; replace immediately by pro.", action: "schedule" },
            { sign: "Loud bang from garage area", meaning: "Could be spring failure. Inspect carefully before operating door.", action: "schedule" },
            { sign: "Opener motor running but door not moving", meaning: "Gear stripped or trolley disconnected. Stop using.", action: "schedule" },
          ]
        : isAppliance
        ? [
            { sign: "Refrigerator warm but compressor running constantly", meaning: "Sealed system failure starting. Get diagnosis; may indicate replacement.", action: "schedule" },
            { sign: "Washer leaking under or around base", meaning: "Hose, seal, or pump failing. Diagnose before water damage.", action: "schedule" },
            { sign: "Dryer takes 2× normal time to dry", meaning: "Vent blocked or heating element failing. Vent fire risk.", action: "schedule" },
            { sign: "Dishwasher not draining", meaning: "Drain hose, pump, or air gap. Standing water risks gasket failure.", action: "schedule" },
            { sign: "Oven temperature off by 25°F+", meaning: "Calibration or sensor problem. Repair-vs-replace decision point.", action: "schedule" },
          ]
        : [
            { sign: "Lock requires jiggling key", meaning: "Internal wear. Replace before it fails locked.", action: "schedule" },
            { sign: "Door not closing properly", meaning: "Hinge, frame, or weatherstripping issue. Affects energy and security.", action: "schedule" },
            { sign: "Cabinet door or drawer increasingly hard to use", meaning: "Hardware failing or alignment off. Easy fix now; bigger job later.", action: "schedule" },
            { sign: "Smoke detector chirping intermittently", meaning: "Battery, age, or sensor. Replace promptly.", action: "schedule" },
          ],
      urgent: isChimney
        ? [
            { sign: "Chimney fire (roaring sound, sparks, flames from top)", meaning: "Active emergency. Call 911; close damper if safe; evacuate.", action: "urgent" },
            { sign: "Chimney leaning, cracked, or partially collapsed", meaning: "Imminent collapse. Stay clear; call structural inspection.", action: "urgent" },
            { sign: "Carbon monoxide alarm near fireplace", meaning: "CO leak. Evacuate; ventilate; call 911.", action: "urgent" },
            { sign: "Visible flame from gas fireplace not contained in firebox", meaning: "Gas leak or fire spread. Shut off gas; evacuate; call 911.", action: "urgent" },
          ]
        : isGarage
        ? [
            { sign: "Garage door stuck open or closed", meaning: "Spring or cable failure. Don't try to force; serious injury risk.", action: "urgent" },
            { sign: "Cable hanging loose or visible broken cable", meaning: "Tension released improperly. Do not operate.", action: "urgent" },
            { sign: "Door falls or drops when opened", meaning: "Spring failure. Stay clear; call now.", action: "urgent" },
          ]
        : isAppliance
        ? [
            { sign: "Gas appliance smells like gas", meaning: "Gas leak. Evacuate; call 911 and gas utility from outside.", action: "urgent" },
            { sign: "Active water leaking from any appliance", meaning: "Shut off water supply at fixture; call.", action: "urgent" },
            { sign: "Smoke or burning smell from any appliance", meaning: "Electrical fire risk. Unplug if safe; call.", action: "urgent" },
            { sign: "Refrigerator suddenly very warm (food temperature)", meaning: "System failure. Save what you can; call same-day for repair.", action: "urgent" },
          ]
        : [
            { sign: "Locked out with no spare access", meaning: "Locksmith call. After-hours 1.5-2× normal rate.", action: "urgent" },
            { sign: "Broken window or door with security implications", meaning: "Board-up service same day; permanent fix next day.", action: "urgent" },
            { sign: "Smoke detector alarming with no apparent cause", meaning: "Investigate immediately. Could be CO or hidden fire.", action: "urgent" },
          ],
      costOfDelay: `Specialty-repair items have non-linear cost curves. ${isChimney ? "Annual chimney sweep ($150-250) prevents chimney fires ($30k+ damage). Crown failures progress 5-10× faster with each freeze-thaw cycle." : isGarage ? "Spring failure ignored sends people to the ER. Damaged door panels cost $300-800 each; full door replacement $1,500-4,000." : isAppliance ? "Appliances usually fail near their expected life. Repair-vs-replace math is sensitive to age — a $400 repair on a 12-year-old fridge often isn't worth it." : "Small fixes compound. A loose hinge becomes a damaged frame; a worn lock becomes a security incident."}`,
      faq: [
        { q: `When is repair vs. replace the right call?`, a: `Common rule: if the repair quote exceeds 50% of replacement cost and the item is past 60% of expected life, replace. Below either threshold, repair.` },
        { q: `${isChimney ? "How often do I really need chimney service?" : isGarage ? "How often should garage doors be serviced?" : isAppliance ? "Are extended warranties worth it?" : "Should I hire a handyman or a specialist?"}`, a: `${isChimney ? "NFPA 211 says annually for wood-burning. Gas with sealed inserts every 2-3 years is usually fine. Skipping inspections is a leading cause of Erie chimney fires." : isGarage ? "Annual tune-up ($75-150) catches most issues before failure. Most pros bundle lube, balance test, and inspection." : isAppliance ? "Usually no for premium brands; sometimes yes for premium appliances ($2k+) where parts and labor are expensive." : "Handyman for non-code-regulated work under $500. Specialist for anything code-regulated, safety-critical, or high-value."}` },
        { q: `How much do emergency rates differ from scheduled?`, a: `Typically 1.5-2× for after-hours, 2-3× for weekends or holidays. A scheduled tune-up is almost always cheaper than an emergency call.` },
        { q: `What's the most-ignored warning sign in this category?`, a: `${isChimney ? "Mortar dropping from the chimney exterior. People assume it's cosmetic until water enters the structure." : isGarage ? "Cables showing wear. Cable failure can drop the door violently — serious injury risk." : isAppliance ? "Refrigerator running constantly. Most people just hear it; few realize compressor is failing." : "Smoke detector chirping intermittently. People remove the battery instead of replacing the detector."}` },
        { q: `Can I get a free diagnostic visit?`, a: `Most ${labelLower} pros charge $50-150 for diagnostic that's typically applied to the repair if you proceed. Many will waive it for first-time customers or compete on it during slow seasons.` },
      ],
    };
  }

  // ── trades-interior cluster ───────────────────────────────────
  if (matches(nicheSlug, ["drywall", "plaster", "flooring", "hardwood", "tile", "paint", "epoxy-floor", "cabinet-refin", "countertop", "closet-storage", "bathroom-remodel", "kitchen-remodel", "basement-finish"])) {
    const isPaint = matches(nicheSlug, ["paint"]);
    const isFloor = matches(nicheSlug, ["floor", "hardwood", "tile"]);
    return {
      intro: `Interior finish problems usually look cosmetic until you investigate the cause. Many surface symptoms point to hidden moisture, structural movement, or substrate failure.`,
      earlyWarnings: [
        { sign: isPaint ? "Slight color difference where you patched" : isFloor ? "One floor section feels softer than the rest" : "Hairline cracks reappearing where you patched", meaning: isPaint ? "Sheen mismatch — normal for spot patches. Full-wall paint will resolve." : isFloor ? "Subfloor issue starting. Investigate before refinishing." : "House settling normally, or substrate failing. Monitor for growth.", action: "watch" },
        { sign: isPaint ? "Color fading on one wall" : isFloor ? "Squeak in a small area" : "Single small hole where door knob hit wall", meaning: isPaint ? "Sun exposure or moisture. Repaint if cosmetic concern." : isFloor ? "Subfloor fastener loose. Tighten or repair before flooring damage." : "Easy DIY patch.", action: "watch" },
        { sign: isPaint ? "Slight wallpaper edges curling" : isFloor ? "One tile showing hairline crack" : "Texture flattening from heavy washing", meaning: "Cosmetic issue developing. Address before becoming larger problem.", action: "watch" },
      ],
      midSeverity: [
        { sign: isPaint ? "Paint peeling in sheets in one area" : isFloor ? "Multiple boards or tiles showing damage" : "Drywall tape lifting along a seam", meaning: isPaint ? "Moisture or substrate failure. Find and address cause before recoating." : isFloor ? "Material or installation failure. Repair affected area; investigate cause." : "Movement or moisture beneath. Diagnose before re-mudding.", action: "schedule" },
        { sign: isPaint ? "Mildew spots reappearing in bathroom or basement" : isFloor ? "Floor cupping (boards curl up at edges)" : "Cracks growing visibly month to month", meaning: isPaint ? "Ventilation problem. Address before mold establishes." : isFloor ? "Moisture from below or excess humidity. Find moisture source first." : "Structural movement. Could be settling, framing failure, or foundation issue.", action: "schedule" },
        { sign: isPaint ? "Yellow or brown staining bleeding through paint" : isFloor ? "Gaps opening between flooring planks" : "Soft drywall when pressed", meaning: isPaint ? "Water damage staining. Stain-blocking primer needed; investigate water source." : isFloor ? "Humidity swings or installation issue. Address humidity; gaps may close." : "Water damage active or recent. Drywall is compromised.", action: "schedule" },
        { sign: isPaint ? "Cracking paint following a pattern (alligator, checking)" : isFloor ? "Buckling or tenting flooring" : "Visible black or green staining on drywall", meaning: isPaint ? "Coating failure. Strip and recoat properly." : isFloor ? "Severe moisture event. Major repair likely needed." : "Mold growth. Requires remediation, not just paint over.", action: "schedule" },
      ],
      urgent: [
        { sign: "Active water staining or bubbling drywall", meaning: "Active leak above. Find source; mitigate before structural damage.", action: "urgent" },
        { sign: isFloor ? "Floor sagging or feeling unsupportive" : "Ceiling visibly sagging", meaning: "Structural failure. Don't walk on / under. Call structural inspector.", action: "urgent" },
        { sign: "Black mold (Stachybotrys) visible — slimy, dark green/black", meaning: "Health hazard requiring professional remediation. Don't disturb.", action: "urgent" },
        { sign: "Strong chemical or paint fumes in confined space", meaning: "Ventilation hazard. Open windows, leave area; address before continuing.", action: "urgent" },
      ],
      costOfDelay: `Interior finish problems caught at "watch" stage cost $100-500. At "schedule" stage, $1,000-5,000 (often requires removal and rebuild). At "urgent" stage, $5,000-25,000+ (structural, mold, multi-trade work). The surface is always the cheapest part.`,
      faq: [
        { q: `Why do drywall cracks keep coming back?`, a: `Settlement and seasonal movement. Houses move with humidity changes. Small recurring cracks are normal; growing cracks signal real movement that needs structural investigation.` },
        { q: `Is mildew on drywall really mold?`, a: `Mildew is a type of mold. Small spots (under 6 sq ft, surface-only) can be DIY-cleaned with proper safety. Larger areas or visible inside-wall growth requires remediation.` },
        { q: `How do I tell if paint peeling is moisture or product failure?`, a: `Moisture-caused peeling usually has discoloration underneath. Product failure peels cleanly to bare substrate. Moisture damage requires source-fixing before recoating.` },
        { q: `What's worth fixing before selling vs. disclosing?`, a: `Cosmetic items under $1,000 typically pay back at sale. Structural or moisture-related items should be fixed AND disclosed — buyers' inspectors find them either way.` },
        { q: `Can I just paint over problem areas?`, a: `For pure cosmetic issues, yes. For anything with moisture, mold, water staining, or movement, no — the problem grows underneath and reappears within months.` },
      ],
    };
  }

  // ── trades-exterior cluster ───────────────────────────────────
  if (matches(nicheSlug, ["concrete", "masonry", "brick", "fenc", "windows-door", "glass", "storm-window"])) {
    const isFence = matches(nicheSlug, ["fenc"]);
    const isGlass = matches(nicheSlug, ["glass", "window"]);
    return {
      intro: `Exterior projects fail in ways that compound with weather. Erie's freeze-thaw cycles punish small problems faster than warmer climates; catching them early is the difference between $200 and $5,000.`,
      earlyWarnings: [
        { sign: isFence ? "Slight lean in one fence section after wind" : isGlass ? "Slight fog inside a double-pane window occasionally" : "Hairline crack in driveway or sidewalk", meaning: isFence ? "Post movement starting. Easier to repair than rebuild." : isGlass ? "Seal beginning to fail in insulated glass unit. Replacement window opens within a year or two." : "Normal concrete behavior. Seal cracks to prevent water entry.", action: "watch" },
        { sign: isFence ? "Single board loose or warped" : isGlass ? "Caulking shrinking or pulling from window edges" : "Spalling (surface flaking) on concrete corners", meaning: isFence ? "Easy DIY replacement. Don't let it spread." : isGlass ? "Routine maintenance — recaulk before water entry." : "Salt or freeze-thaw damage. Apply concrete sealer.", action: "watch" },
        { sign: isFence ? "Slight green growth at base of wood fence" : isGlass ? "Condensation forming between panes briefly" : "Slight settlement at one corner of a slab", meaning: "Early signs of larger problem. Address while cheap.", action: "watch" },
      ],
      midSeverity: [
        { sign: isFence ? "Multiple posts wobbling or rotting at base" : isGlass ? "Persistent fog or moisture between panes" : "Cracks wider than 1/4 inch in any concrete", meaning: isFence ? "Foundation rot. Repair before whole fence section fails." : isGlass ? "IGU has failed. Replacement glass unit needed." : "Structural concern starting. Investigate cause.", action: "schedule" },
        { sign: isFence ? "Gate dragging on the ground" : isGlass ? "Glass cracked or broken from impact" : "Driveway or walkway pitching toward house", meaning: isFence ? "Post or hinge failure. Realign before bigger damage." : isGlass ? "Replace promptly — broken safety glass is a hazard." : "Drainage problem. Water entering foundation. Repair grading.", action: "schedule" },
        { sign: isFence ? "Rust streaks on iron fence or chain-link top rail" : isGlass ? "Window or door not closing properly" : "Visible separation between concrete pad and foundation", meaning: isFence ? "Corrosion starting. Treat before structural failure." : isGlass ? "Frame moving or shifting. Adjust before glass breaks under stress." : "Settlement or movement. Major project if ignored.", action: "schedule" },
        { sign: isFence ? "Sections leaning more after each storm" : isGlass ? "Drafts you can feel near windows or doors" : "Stairstep cracks in block or brick walls", meaning: isFence ? "Foundation failing. Full repair needed before collapse." : isGlass ? "Major air leak. Worth replacement for energy savings." : "Foundation movement showing in masonry. Structural assessment needed.", action: "schedule" },
        { sign: "Mortar joints crumbling in brick or block", meaning: "Re-pointing window opening. Untreated leads to water entry and structural damage.", action: "schedule" },
      ],
      urgent: [
        { sign: isFence ? "Entire fence section down or imminently failing" : isGlass ? "Window or door won't open (emergency exit)" : "Driveway sinkhole or major settling", meaning: isFence ? "Emergency rebuild. Security and pet/child concerns." : isGlass ? "Egress emergency. Fire code requires functioning emergency exits." : "Possible underground void or drainage failure. Don't drive over.", action: "urgent" },
        { sign: isFence ? "Pool fence section damaged (PA code violation)" : isGlass ? "Sliding glass door off track or unsafe" : "Retaining wall actively bulging or fallen", meaning: isFence ? "Liability and code emergency." : isGlass ? "Safety hazard; could shatter. Don't operate." : "Imminent failure. Stay back; call.", action: "urgent" },
        { sign: "Brick or stone falling from chimney or wall", meaning: "Public-safety concern. Stay back; cordon off; call structural mason.", action: "urgent" },
      ],
      costOfDelay: `Exterior work in Erie's climate is uniquely punishing. Small cracks become large cracks in one freeze-thaw season. A $200 repointing job becomes a $4,000 brick rebuild. A $300 fence post becomes a $3,000 full fence section. Pennsylvania's PA HICPA requires registered contractors for work over $500/year; insurance coverage often hinges on proper installation.`,
      faq: [
        { q: `How often does Erie's freeze-thaw cycle damage masonry?`, a: `Erie averages 60-80 freeze-thaw cycles per winter. Each one expands water in any crack or pore. Even hairline cracks let water in; one season can turn a 1/16-inch crack into 1/4-inch.` },
        { q: `What's the most-ignored exterior warning sign?`, a: `Mortar joint crumbling. Homeowners notice the dust at the base of brick walls and shrug. Untreated, it leads to water entering the structure within 2-5 years.` },
        { q: `Should I repair or replace failed concrete?`, a: `Cracks under 1/4 inch: sealer repair ($50-200). 1/4 to 1 inch with no settlement: repair ($300-1,500). Settlement or larger cracks: replace ($1,500-15,000 depending on area).` },
        { q: `When do exterior issues affect home value?`, a: `Always. Buyers' inspectors flag exterior issues prominently. A bowed retaining wall or active drainage issue can knock $5,000-$30,000 off offer prices or kill deals.` },
        { q: `Do exterior repairs need permits in Erie?`, a: `Driveways, sidewalks tied to public right-of-way, retaining walls over 4 feet, structural masonry work, and most window/door replacements — yes. Cosmetic work usually doesn't.` },
      ],
    };
  }

  // ── install-bigticket cluster ─────────────────────────────────
  if (matches(nicheSlug, ["solar", "pool-spa", "spa", "home-security", "alarm", "insulation"])) {
    const isSolar = matches(nicheSlug, ["solar"]);
    const isPool = matches(nicheSlug, ["pool", "spa"]);
    const isSecurity = matches(nicheSlug, ["security", "alarm"]);
    return {
      intro: `Big-ticket installations have long failure curves. Most warning signs aren't urgent — but worth catching because the systems are expensive to replace and warranty windows are specific.`,
      earlyWarnings: isSolar
        ? [
            { sign: "Slight drop in monthly production vs. last year", meaning: "Normal degradation (~0.5%/year) or panel soiling. Clean and measure again.", action: "watch" },
            { sign: "One panel showing different production than its row", meaning: "Single panel issue or shading change. Diagnose if production drop is significant.", action: "watch" },
            { sign: "Inverter status light not green occasionally", meaning: "Brief grid disconnect — normal. Persistent = problem.", action: "watch" },
          ]
        : isPool
        ? [
            { sign: "Slight water-level drop over a week", meaning: "Normal evaporation in summer (~1/4 inch/day). Beyond that, look for leaks.", action: "watch" },
            { sign: "Chemistry harder to balance lately", meaning: "Source water changing or refill volume up. Stabilize before peak season.", action: "watch" },
            { sign: "Slight discoloration in liner or plaster", meaning: "Stain forming. Treat early before becoming permanent.", action: "watch" },
          ]
        : isSecurity
        ? [
            { sign: "Single sensor offline occasionally", meaning: "Battery low or signal interference. Replace battery; verify mounting.", action: "watch" },
            { sign: "Cameras showing pixel issues briefly", meaning: "Network bandwidth or environmental issue. Usually resolves; monitor.", action: "watch" },
            { sign: "Smart lock occasionally not responding", meaning: "Battery, Wi-Fi, or hub issue. Check basics first.", action: "watch" },
          ]
        : [
            { sign: "Heating or cooling bill slightly higher year-over-year", meaning: "Insulation aging, air sealing degraded, or HVAC needing service. Audit before peak season.", action: "watch" },
            { sign: "Slight drafts you can feel at outlets or windows", meaning: "Air sealing gaps. DIY caulking + foam gaskets address most.", action: "watch" },
            { sign: "Attic feels much hotter than expected in summer", meaning: "Insulation or ventilation issue. Diagnose before AC strain becomes failure.", action: "watch" },
          ],
      midSeverity: isSolar
        ? [
            { sign: "Production down 10%+ year-over-year", meaning: "System issue (failed panel, inverter, soiling). Diagnose.", action: "schedule" },
            { sign: "Inverter showing error codes regularly", meaning: "Component failing. Most have 10-12 year warranties — check before paying.", action: "schedule" },
            { sign: "Visible damage to a panel", meaning: "Panel failure or hot spot. Replace if under warranty (typically 25 years).", action: "schedule" },
            { sign: "Mounting hardware showing rust or movement", meaning: "Roof integrity affected. Repair before water entry.", action: "schedule" },
          ]
        : isPool
        ? [
            { sign: "Cracks in pool plaster or liner", meaning: "Pool leaking. Schedule repair before structural damage.", action: "schedule" },
            { sign: "Pump making new noises", meaning: "Bearing or seal failing. Replace before catastrophic failure.", action: "schedule" },
            { sign: "Heater not reaching set temperature", meaning: "Component or efficiency issue. Diagnose before peak season.", action: "schedule" },
            { sign: "Pool fence damaged or non-compliant", meaning: "PA pool fence code is strict. Repair before liability or inspection.", action: "schedule" },
            { sign: "Chlorinator failing", meaning: "Salt cell or feeder issue. Chemistry will collapse without it.", action: "schedule" },
          ]
        : isSecurity
        ? [
            { sign: "Multiple sensors offline simultaneously", meaning: "Hub or central panel issue. Security compromised.", action: "schedule" },
            { sign: "Camera storage filling but old footage not deleting", meaning: "Storage settings or cloud subscription issue. Verify.", action: "schedule" },
            { sign: "False alarms increasing in frequency", meaning: "Sensor failing or environmental change. Diagnose before central station fines.", action: "schedule" },
            { sign: "System panel showing low battery for >1 week", meaning: "Backup battery failing. Replace before next power outage.", action: "schedule" },
          ]
        : [
            { sign: "Visible mold or moisture in insulation areas", meaning: "Moisture intrusion problem. Investigate before whole area compromised.", action: "schedule" },
            { sign: "Ice dams forming repeatedly each winter", meaning: "Insulation and ventilation issue. Address before roof damage.", action: "schedule" },
            { sign: "Insulation visibly compressed, displaced, or missing", meaning: "Effectiveness reduced. Top off or replace.", action: "schedule" },
            { sign: "Pest activity in insulation", meaning: "Likely rodent or insect intrusion. Pest control first, then re-insulate.", action: "schedule" },
          ],
      urgent: isSolar
        ? [
            { sign: "Burning smell or visible damage at inverter", meaning: "Electrical fire risk. Shut off; call.", action: "urgent" },
            { sign: "Roof leak at panel mounting points", meaning: "Active water entry. Tarp from inside; call.", action: "urgent" },
            { sign: "Major production drop (>50%) suddenly", meaning: "Inverter failure or large panel issue. Lost production accumulates daily.", action: "urgent" },
          ]
        : isPool
        ? [
            { sign: "Major pool leak (losing inches per day)", meaning: "Structural concern; foundation damage possible. Stop using; call.", action: "urgent" },
            { sign: "Pool electrical safety issue (shock from water)", meaning: "Bonding/grounding failure. Empty pool; do not use; emergency call.", action: "urgent" },
            { sign: "Pool fence damaged with children present", meaning: "Drowning hazard. Secure pool until repaired.", action: "urgent" },
            { sign: "Chemistry severely out of range with visible cloudiness", meaning: "Algae bloom or contamination. Don't swim; address immediately.", action: "urgent" },
          ]
        : isSecurity
        ? [
            { sign: "System won't arm with no apparent reason", meaning: "Security compromised. Call monitoring company; verify status.", action: "urgent" },
            { sign: "Central station signaling alarm with no apparent cause", meaning: "Verify before dismissing — could be intrusion or fire.", action: "urgent" },
            { sign: "Smoke detection sensor triggered", meaning: "Fire emergency — follow evacuation protocol; call 911.", action: "urgent" },
          ]
        : [
            { sign: "Active mold growth visible in attic or wall cavity", meaning: "Insulation removal and remediation needed before continuing.", action: "urgent" },
            { sign: "Pre-1980 insulation that may contain asbestos", meaning: "Don't disturb. Hire EPA-licensed abatement before continuing.", action: "urgent" },
            { sign: "Strong chemical smell from spray foam installation", meaning: "Off-gassing concern. Ventilate and avoid space.", action: "urgent" },
          ],
      costOfDelay: `${isSolar ? "Solar production loss accumulates daily. A failed panel ignored for 6 months can lose $200-800; under warranty costs $0 to replace." : isPool ? "Pool leaks worsen exponentially. A small leak becomes structural damage in months." : isSecurity ? "Security failures compound. Every day without proper coverage is exposure." : "Insulation problems waste energy continuously. A 20% deficit in Erie adds $400-800/year to heating costs."}`,
      faq: [
        { q: `${isSolar ? "How long do solar panels actually last?" : isPool ? "How long should a pool liner last?" : isSecurity ? "Do I need to replace my whole system if one part fails?" : "When is re-insulating worth it?"}`, a: `${isSolar ? "Panels carry 25-year warranties and last 30+ years. Inverters typically last 10-15 years and are the most common replacement." : isPool ? "Vinyl liners: 8-12 years. Plaster: 10-15 years. Fiberglass: 20-30 years. Replacement is a major project — schedule before failure." : isSecurity ? "Usually no. Most modern systems are modular; replace failed components individually." : "When insulation is below current code (R-49 attics in PA Climate Zone 5), or when bills are high year-over-year."}` },
        { q: `What about manufacturer warranties?`, a: `${isSolar ? "Panel warranties (25 years) and inverter warranties (10-12 years) are separate. Inverter replacement under warranty is usually free; out of warranty, $1,500-3,500." : isPool ? "Vary by component. Pumps usually 1-3 years; heaters 1-5 years; liners 5-10 years. Keep installation paperwork." : isSecurity ? "Hardware typically 1-3 year manufacturer warranties; monitoring service is separate." : "Insulation materials typically lifetime; installation labor 1-2 years. Spray foam carries longer installation warranties (5-10 years)."}` },
        { q: `${isSolar ? "Should I clean my own solar panels?" : isPool ? "How much should pool maintenance cost monthly?" : isSecurity ? "What's the cost of professional monitoring?" : "Does my insurance discount for these upgrades?"}`, a: `${isSolar ? "Yes — gentle hose rinse seasonally is fine. Avoid harsh chemicals or pressure-washing." : isPool ? "In Erie: $100-200/month for weekly service + chemicals. DIY can be $30-80/month plus your time." : isSecurity ? "Typically $20-60/month. Insurance discounts of 10-20% often offset most of the cost." : "Many policies discount for security systems (10-20%) and energy-efficiency upgrades (smaller)."}` },
        { q: `What's the most overlooked warning sign?`, a: `${isSolar ? "Single-panel production drift. Most systems can't auto-detect underperforming panels; monitor your inverter dashboard occasionally." : isPool ? "Plaster discoloration spreading slowly. Often pH-related but signals chemistry that's been off for months." : isSecurity ? "Low-battery warnings on sensors. People ignore them for weeks; reliability drops." : "Bills creeping up year over year. Most owners attribute to weather or rates, not deferred maintenance."}` },
        { q: `When is upgrading vs. repairing right?`, a: `When the system is past 70% of expected life AND has had multiple repairs in the past year. Otherwise repair almost always wins on cost.` },
      ],
    };
  }

  // ── auto cluster ──────────────────────────────────────────────
  if (matches(nicheSlug, ["auto-repair", "auto-body", "mechanic", "towing"])) {
    const isTowing = matches(nicheSlug, ["towing"]);
    return {
      intro: `Cars telegraph their problems clearly if you know what to listen and watch for. The signs below sort "investigate next service" from "don't drive."`,
      earlyWarnings: isTowing
        ? [
            { sign: "Slight delay in starting", meaning: "Battery aging or alternator weakening. Test before getting stranded.", action: "watch" },
            { sign: "Tire pressure dropping slightly more often", meaning: "Small leak or seasonal change. Check valve stems and beads.", action: "watch" },
            { sign: "Slight pull or wander on highway", meaning: "Alignment or tire pressure. Address before tire wear.", action: "watch" },
          ]
        : [
            { sign: "Slight rise in fuel consumption", meaning: "Tire pressure, air filter, or sensor issue. Check basics first.", action: "watch" },
            { sign: "Mild noise on cold start that goes away", meaning: "Often normal hydraulic lifters or belt. Monitor if persistent.", action: "watch" },
            { sign: "Check engine light on briefly then off", meaning: "Loose gas cap or transient sensor event. Watch for return.", action: "watch" },
          ],
      midSeverity: isTowing
        ? [
            { sign: "Battery struggling to start more than once", meaning: "Battery near end of life. Replace before failure.", action: "schedule" },
            { sign: "Persistent tire pressure loss", meaning: "Active leak. Repair before tire damage or roadside stranding.", action: "schedule" },
            { sign: "Brake warning light on dash", meaning: "Brake fluid low or pad-wear sensor triggered. Service before stopping issues.", action: "schedule" },
          ]
        : [
            { sign: "Check engine light steady on", meaning: "Stored fault code. Read with OBD2; address before related parts fail.", action: "schedule" },
            { sign: "New noise that's persistent", meaning: "Bearing, belt, exhaust, or suspension. Diagnose before further damage.", action: "schedule" },
            { sign: "Brake pedal feels different (soft, hard, low)", meaning: "Brake fluid leak, pad wear, or master cylinder. Don't drive far.", action: "schedule" },
            { sign: "Steering pulling, vibrating, or wandering", meaning: "Alignment, suspension, or tire issue. Tire and component damage compounds.", action: "schedule" },
            { sign: "Coolant or oil leaks visible under car", meaning: "Investigate before damage. Coolant leaks are urgent in summer.", action: "schedule" },
          ],
      urgent: isTowing
        ? [
            { sign: "Car won't start with full battery", meaning: "Starter, ignition, or electrical issue. Call for tow.", action: "urgent" },
            { sign: "Car overheating on roadside", meaning: "Pull over; turn off engine; call for tow before engine damage.", action: "urgent" },
            { sign: "Flat tire without spare or ability to change", meaning: "Roadside assistance call. Don't drive on a flat.", action: "urgent" },
            { sign: "Engine making serious knocking or grinding", meaning: "Major mechanical failure imminent. Stop and call.", action: "urgent" },
          ]
        : [
            { sign: "Engine overheating gauge", meaning: "Pull over immediately. Continued driving causes catastrophic damage.", action: "urgent" },
            { sign: "Brake failure or severely degraded brakes", meaning: "Don't drive. Tow to a shop.", action: "urgent" },
            { sign: "Smoke or fire from any part of the vehicle", meaning: "Stop, exit, call 911. Don't open the hood if smoking heavily.", action: "urgent" },
            { sign: "Airbag warning light on dash", meaning: "Safety system disabled. Critical if you have an accident.", action: "urgent" },
            { sign: "Loss of steering or throttle response", meaning: "Major mechanical or electrical failure. Pull over, call for tow.", action: "urgent" },
          ],
      costOfDelay: `Car problems compound predictably. A $200 brake-pad replacement becomes a $500 rotor + pads job. A $100 belt becomes a $1,500 cooling system rebuild. Pennsylvania requires annual safety inspections that catch most issues at the cheap stage.`,
      faq: [
        { q: `Should I trust the check engine light?`, a: `Yes, but urgency varies. Steady = code stored, fix soon. Flashing = misfire in progress, stop driving as soon as safe. Most auto parts stores read codes free.` },
        { q: `What's the most-ignored car warning sign?`, a: `Slight pull or wander on highway. Owners adapt to it. Meanwhile alignment and suspension issues wear tires and components 2-3× faster than they should.` },
        { q: `How fast can a small issue become catastrophic?`, a: `Cooling system issues can destroy an engine in minutes once overheating starts. Brake fluid leaks can fail in days. Transmission slipping can self-destruct in weeks. Speed matters.` },
        { q: `When is a tow always the right call?`, a: `When you can't safely operate the vehicle, when continued driving could damage components, or when you're in an unsafe location. $150 tow vs. $3,000+ in damage favors the tow.` },
        { q: `What about PA safety and emissions inspections?`, a: `Annual safety inspections required statewide. Emissions in certain counties (including Erie). Failing requires re-inspection within 60 days; driving with expired inspection brings fines and insurance issues.` },
      ],
    };
  }

  // ── healthcare cluster ────────────────────────────────────────
  if (matches(nicheSlug, ["dental", "dentist", "chiropract", "veterinary", "vet", "dermatology", "optometry", "physical-therapy", "mental-health", "home-health", "senior-home", "hearing", "audiology"])) {
    const isDental = matches(nicheSlug, ["dental", "dentist"]);
    const isChiro = matches(nicheSlug, ["chiropract"]);
    const isVet = matches(nicheSlug, ["vet"]);
    return {
      intro: `Healthcare red flags often start subtly. The signs below help you decide between "watch and see" and "make the appointment."`,
      earlyWarnings: isDental
        ? [
            { sign: "Mild sensitivity to hot or cold occasionally", meaning: "Slight enamel wear or gum recession. Sensitivity toothpaste helps.", action: "watch" },
            { sign: "Gums slightly tender during flossing", meaning: "Early gum inflammation. Improve flossing technique; should resolve in 1-2 weeks.", action: "watch" },
            { sign: "Slight tooth-colored stain on a single tooth", meaning: "Could be staining or early decay. Mention at next cleaning.", action: "watch" },
          ]
        : isChiro
        ? [
            { sign: "Mild stiffness after long sitting or sleeping wrong", meaning: "Usually resolves with movement. Address ergonomics if recurring.", action: "watch" },
            { sign: "Occasional cracking sounds when stretching", meaning: "Normal joint gases. Concerning only if associated with pain.", action: "watch" },
            { sign: "Slight muscle tension after stressful days", meaning: "Common; respond with stretching, heat, hydration.", action: "watch" },
          ]
        : isVet
        ? [
            { sign: "Pet sleeping slightly more than usual", meaning: "Aging or seasonal change. Track baseline.", action: "watch" },
            { sign: "Mild change in appetite", meaning: "Many causes — heat, stress, food preference. Monitor 24-48 hours.", action: "watch" },
            { sign: "Slight increase in water consumption", meaning: "Hot weather, salt, or activity. Persistent increase = call.", action: "watch" },
          ]
        : [
            { sign: "Mild new symptom that comes and goes", meaning: "Worth tracking. Pattern often indicates the cause.", action: "watch" },
            { sign: "Slight change in your normal", meaning: "Note when, what, and trends. Useful at your next visit.", action: "watch" },
          ],
      midSeverity: isDental
        ? [
            { sign: "Tooth pain persisting more than 2-3 days", meaning: "Decay, infection, or crack. Fixes get more expensive with time.", action: "schedule" },
            { sign: "Persistent bad breath despite good hygiene", meaning: "Gum disease, decay, or systemic issue. Investigate.", action: "schedule" },
            { sign: "Visible cavity or hole in tooth", meaning: "Decay has reached dentin. Fillings cheaper than crowns; crowns cheaper than root canals.", action: "schedule" },
            { sign: "Receding gums showing tooth root", meaning: "Periodontal disease likely. Treatable; ignoring leads to tooth loss.", action: "schedule" },
            { sign: "Tooth feels loose or shifted", meaning: "Periodontal disease or trauma. Save the tooth — appointment within days.", action: "schedule" },
          ]
        : isChiro
        ? [
            { sign: "Pain lasting more than 1-2 weeks", meaning: "Beyond expected acute timeline. Get assessment.", action: "schedule" },
            { sign: "Recurring headaches in a new pattern", meaning: "Could be cervicogenic. Differentiate before treatment.", action: "schedule" },
            { sign: "Pain that radiates down arm or leg", meaning: "Possible nerve involvement. Evaluate before chronic.", action: "schedule" },
            { sign: "Activities you used to do are now uncomfortable", meaning: "Functional change. Address before permanent limitation.", action: "schedule" },
          ]
        : isVet
        ? [
            { sign: "Pet not eating for 24 hours", meaning: "Many causes — some serious. Same-day for cats; next-day for dogs.", action: "schedule" },
            { sign: "Vomiting or diarrhea persisting >24 hours", meaning: "Investigate before dehydration or worse develops.", action: "schedule" },
            { sign: "Limp that doesn't resolve in 24-48 hours", meaning: "Injury or arthritis. Earlier diagnosis prevents compensation injuries.", action: "schedule" },
            { sign: "Significant weight loss or gain", meaning: "Many possibilities, several serious. Annual wellness should catch.", action: "schedule" },
            { sign: "New lump or bump anywhere", meaning: "Most are benign but a small percentage aren't. Get them checked.", action: "schedule" },
          ]
        : [
            { sign: "Symptom present more than 1-2 weeks", meaning: "Not resolving on its own. Get evaluated.", action: "schedule" },
            { sign: "Pain affecting normal activities", meaning: "Beyond manageable. Address before compensation issues develop.", action: "schedule" },
            { sign: "New symptom different from anything before", meaning: "Worth investigating to establish baseline.", action: "schedule" },
          ],
      urgent: isDental
        ? [
            { sign: "Severe tooth pain with swelling in face or jaw", meaning: "Infection spreading. Could become medical emergency.", action: "urgent" },
            { sign: "Knocked-out adult tooth", meaning: "Put in milk; see dentist in <30 minutes for reimplantation chance.", action: "urgent" },
            { sign: "Bleeding that won't stop", meaning: "Trauma or systemic issue. ER if dental office closed.", action: "urgent" },
            { sign: "Visible abscess or swelling under tongue", meaning: "Can affect airway. ER immediately.", action: "urgent" },
          ]
        : isChiro
        ? [
            { sign: "Sudden severe back or neck pain", meaning: "Disc herniation, fracture, or muscle tear. Evaluate today.", action: "urgent" },
            { sign: "Numbness or weakness in arms or legs", meaning: "Possible nerve compression. ER if severe; same-day otherwise.", action: "urgent" },
            { sign: "Loss of bladder or bowel control", meaning: "Cauda equina syndrome — surgical emergency. ER now.", action: "urgent" },
            { sign: "Pain after a fall or accident", meaning: "Rule out fracture before chiropractic adjustment.", action: "urgent" },
          ]
        : isVet
        ? [
            { sign: "Difficulty breathing", meaning: "Emergency vet immediately.", action: "urgent" },
            { sign: "Severe vomiting / diarrhea with blood", meaning: "Same-day emergency. Watch for dehydration.", action: "urgent" },
            { sign: "Bloated, distended abdomen", meaning: "Possible bloat (GDV) in large dogs — surgical emergency.", action: "urgent" },
            { sign: "Unable to urinate", meaning: "Urinary blockage in cats — life-threatening within 24 hours.", action: "urgent" },
            { sign: "Suspected poisoning", meaning: "Pet poison helpline + emergency vet. Bring packaging if possible.", action: "urgent" },
            { sign: "Trauma (hit by car, fall, attack)", meaning: "Even if pet seems okay, internal injuries possible.", action: "urgent" },
          ]
        : [
            { sign: "Severe pain that came on suddenly", meaning: "Get evaluated today. Don't wait.", action: "urgent" },
            { sign: "Symptoms suggesting heart, stroke, or serious illness", meaning: "Call 911 or go to ER. Don't try to assess yourself.", action: "urgent" },
            { sign: "Anything getting rapidly worse over hours", meaning: "Same-day medical attention.", action: "urgent" },
          ],
      costOfDelay: `Healthcare delays compound. ${isDental ? "A filling caught early costs $150-300. Same tooth ignored until root canal: $1,200-2,500. Then crown: $1,000-1,500. Tooth loss: $3,000-6,000." : isChiro ? "Acute pain treated within 2 weeks usually resolves in 3-6 visits. Chronic pain (3+ months) often requires 12-24 visits. Same condition." : isVet ? "Early detection of feline kidney disease (caught at wellness) extends life 2-4 years at $200-500/month. Caught at crisis: weeks of life, $5,000+ emergency care." : "Most chronic conditions cost 5-10× more after they become chronic. Prevention is the highest-ROI healthcare spending."}`,
      faq: [
        { q: `Should I go to the ER or wait for an appointment?`, a: `ER for: airway compromise, severe bleeding, severe pain, loss of function, suspected stroke/heart attack, anything worsening rapidly. Appointment for: persistent but stable symptoms, slow-progressing changes.` },
        { q: `How can I track changes effectively?`, a: `Photos with dates. Notes (what, when, severity 1-10). Triggers and patterns. This data is more valuable to providers than your verbal description.` },
        { q: `What's worth a phone call rather than appointment?`, a: `${isDental ? "Most dental offices triage by phone — lost filling, mild sensitivity, post-procedure questions." : isChiro ? "Pain flare-ups, technique questions about home exercises, scheduling after acute episodes." : isVet ? "Behavior questions, dose confirmations, post-procedure concerns. Keep pet poison helpline number handy." : "Many providers offer phone triage. When in doubt, call."}` },
        { q: `${isDental ? "Are dental insurance plans worth it?" : isVet ? "Is pet insurance worth it?" : isChiro ? "Is chiropractic insurance coverage standard?" : "Should I get supplemental insurance?"}`, a: `${isDental ? "Generally yes for routine care; closer math for major work. Most PA plans have $1,000-2,000 annual max." : isVet ? "Math depends on pet age, breed, lifestyle. Young pets: often yes. Older pets with pre-existing conditions: often no." : isChiro ? "Many PA plans cover 10-20 visits annually; some require physician referral. Verify before treatment." : "Depends on situation. Most people overestimate insurance value and underestimate maintenance value."}` },
        { q: `How often should I see this provider for preventive care?`, a: `${isDental ? "Twice yearly cleanings; X-rays annually. Higher-risk patients more often." : isChiro ? "Acute: as needed. Maintenance: monthly or quarterly. Preventive: 2-4 times yearly." : isVet ? "Annual wellness for healthy pets under 7. Semi-annual for seniors. More often for chronic conditions." : "Follow recommended schedule; preventive care has the best ROI in healthcare."}` },
      ],
    };
  }

  // ── professional-services cluster ─────────────────────────────
  if (matches(nicheSlug, ["legal", "lawyer", "attorney", "accounting", "tax", "real-estate", "financial-advisor", "insurance-agent", "mortgage-broker", "property-management", "airbnb-property", "estate-sale", "funeral-home", "home-inspection"])) {
    const isLegal = matches(nicheSlug, ["legal", "lawyer", "attorney"]);
    const isAcct = matches(nicheSlug, ["accounting", "tax"]);
    const isRE = matches(nicheSlug, ["real-estate"]);
    return {
      intro: `Professional services red flags are often subtle — paperwork delays, vague communication, missed deadlines. Recognizing them early protects you from much larger consequences.`,
      earlyWarnings: [
        { sign: "Provider taking longer than usual to respond", meaning: "Possibly overloaded or transitioning. Verify your matter has attention.", action: "watch" },
        { sign: "Bills slightly higher than estimated", meaning: "Scope creep or hourly creep. Ask for an updated estimate.", action: "watch" },
        { sign: "Communications becoming briefer or less detailed", meaning: "Capacity issue or disengagement. Address before missing important issues.", action: "watch" },
      ],
      midSeverity: isLegal
        ? [
            { sign: "Missed court dates or filing deadlines", meaning: "Could be fatal to your case. Demand immediate explanation.", action: "schedule" },
            { sign: "Opposing counsel calls you directly", meaning: "Indicates your attorney isn't responding to them either. Major red flag.", action: "schedule" },
            { sign: "Vague or evasive answers about case status", meaning: "Either case isn't progressing or you're being shielded from bad news. Get specifics.", action: "schedule" },
            { sign: "Fees significantly above retainer agreement", meaning: "Get written explanation. Some jurisdictions require fee dispute processes.", action: "schedule" },
            { sign: "Pressure to accept a settlement quickly", meaning: "Could be wisdom or laziness. Get second opinion if significant.", action: "schedule" },
          ]
        : isAcct
        ? [
            { sign: "IRS notices not being addressed", meaning: "Tax problems compound with interest and penalties. Immediate response required.", action: "schedule" },
            { sign: "Returns filed extension after extension", meaning: "Could mean missing information or accountant overloaded. Verify status.", action: "schedule" },
            { sign: "Tax positions you don't understand", meaning: "Aggressive positions create audit risk. Get explanations or second opinion.", action: "schedule" },
            { sign: "Bookkeeping errors or inconsistencies", meaning: "Compounds over time and affects all subsequent tax filings.", action: "schedule" },
            { sign: "Provider not sending estimated tax reminders", meaning: "Quarterly estimated taxes are common penalty triggers. Take ownership if provider isn't.", action: "schedule" },
          ]
        : isRE
        ? [
            { sign: "Agent not following up after listings or showings", meaning: "Either agent isn't engaged or buyers aren't interested. Both need address.", action: "schedule" },
            { sign: "Price reductions suggested without market evidence", meaning: "Could be appropriate or agent wanting quick close. Ask for comps.", action: "schedule" },
            { sign: "Significant commission discount with limited service", meaning: "Reduced marketing, lower priority, fewer showings. Calculate true cost.", action: "schedule" },
            { sign: "Inspection issues being downplayed", meaning: "Material defects must be disclosed. Don't sign acknowledgments without understanding.", action: "schedule" },
            { sign: "Closing date slipping multiple times", meaning: "Title, financing, or inspection issue underneath. Get clear root cause.", action: "schedule" },
          ]
        : [
            { sign: "Significant delays without explanation", meaning: "Problem of some kind. Demand specifics.", action: "schedule" },
            { sign: "Recommendations that don't make sense to you", meaning: "Get them explained until you understand. Right to a second opinion always exists.", action: "schedule" },
            { sign: "Fee structure that's unclear or changing", meaning: "Get it in writing before continuing.", action: "schedule" },
          ],
      urgent: isLegal
        ? [
            { sign: "Statute of limitations or filing deadline approaching with no action", meaning: "Could permanently bar your claim or defense. Consider new counsel.", action: "urgent" },
            { sign: "Attorney's license suspended or disbarred during representation", meaning: "Find new counsel immediately; preserve all communications.", action: "urgent" },
            { sign: "Conflict of interest discovered mid-representation", meaning: "Demand disclosure; may require withdrawal and new counsel.", action: "urgent" },
          ]
        : isAcct
        ? [
            { sign: "Notice of IRS audit or significant assessment", meaning: "Same-week response. Get a tax attorney or enrolled agent if complex.", action: "urgent" },
            { sign: "Discovered fraud or significant error in past returns", meaning: "Amended returns may be required. Some situations have voluntary disclosure programs.", action: "urgent" },
            { sign: "Wage garnishment or lien notices", meaning: "Tax debt collection action. Stop the bleeding now.", action: "urgent" },
          ]
        : isRE
        ? [
            { sign: "Earnest money at risk due to other party's delays", meaning: "Time-sensitive. Get attorney involved if necessary.", action: "urgent" },
            { sign: "Material defect discovered after offer accepted but before closing", meaning: "Negotiating window is small. Get legal advice quickly.", action: "urgent" },
            { sign: "Closing day delays preventing move", meaning: "Logistics emergency. May need temporary housing or storage.", action: "urgent" },
          ]
        : [
            { sign: "Provider unreachable in time-sensitive matter", meaning: "Find emergency alternative. Some matters have hard deadlines.", action: "urgent" },
            { sign: "Discovered error has financial or legal consequences", meaning: "Document everything; consider second opinion or new provider.", action: "urgent" },
            { sign: "Confidentiality breach or unauthorized disclosure", meaning: "Professional responsibility violation. Document and escalate; may need regulator complaint.", action: "urgent" },
          ],
      costOfDelay: `Professional service issues compound. ${isLegal ? "A missed filing deadline can be irreversible. A statute of limitations that runs costs you the entire claim." : isAcct ? "Unpaid taxes accumulate penalty and interest at 0.5% + 3-7%/year. A $1,000 tax bill ignored for 2 years becomes $1,400-1,600." : isRE ? "Real estate timing matters. A missed contingency date can lose earnest money. A closing delay can lose your buyer." : "Most professional service problems become harder and more expensive to fix the longer they're ignored."}`,
      faq: [
        { q: `When is firing a professional and starting over right?`, a: `When trust has broken (missed deadlines, dishonest answers, conflict of interest), when fees significantly exceed estimates without explanation, or when you have material disagreement about strategy. Switching costs time but often saves more.` },
        { q: `How do I evaluate a second opinion?`, a: `Pay for an independent consultation (not from the same firm). Bring all documents. Ask specifically: "What would you do differently?" The answer reveals competence levels.` },
        { q: `What's the right escalation path for problems?`, a: `1) Direct conversation with provider. 2) Conversation with managing partner / firm leadership. 3) Professional licensing board complaint. 4) Civil action. Most resolve at step 1 or 2.` },
        { q: `How do I avoid red flags before hiring?`, a: `Verify license status with PA professional boards. Read full reviews. Ask for client references. Get fee structure in writing. Avoid pressure to commit quickly.` },
        { q: `What documentation should I keep?`, a: `All written communications. All bills with detail. All work product. Original documents. The paper trail is your protection.` },
      ],
    };
  }

  // ── underground-structural cluster ────────────────────────────
  if (matches(nicheSlug, ["septic", "foundation", "basement-waterproof", "radon", "well-water"])) {
    const isSeptic = matches(nicheSlug, ["septic"]);
    return {
      intro: `${label} issues telegraph their failures before they become catastrophic — but they often look minor until they aren't. The signs below help separate "monitor" from "act now."`,
      earlyWarnings: isSeptic
        ? [
            { sign: "Mild sewage odor outdoors on warm days", meaning: "Normal occasionally; persistent = check vent or schedule next pump-out.", action: "watch" },
            { sign: "Grass slightly greener directly over drain field", meaning: "Normal — drain field provides moisture and nutrients. Watch for unusual lushness.", action: "watch" },
            { sign: "One slow drain in the house, others fine", meaning: "Localized blockage, not septic. Snake the line.", action: "watch" },
          ]
        : [
            { sign: "Hairline crack in poured concrete that doesn't grow", meaning: "Normal settlement. Mark with date; check annually.", action: "watch" },
            { sign: "Slight efflorescence (white powder) on basement walls", meaning: "Mineral deposits from moisture. Sign of past or minor current moisture.", action: "watch" },
            { sign: "Basement feels slightly damp in humid weather", meaning: "Normal in Erie summers. Run a dehumidifier; monitor with hygrometer.", action: "watch" },
          ],
      midSeverity: isSeptic
        ? [
            { sign: "Multiple slow drains throughout house", meaning: "Main line or septic backing up. Schedule inspection / pumping.", action: "schedule" },
            { sign: "Gurgling drains when fixtures run", meaning: "Vent issue or main blockage. Diagnose before backup.", action: "schedule" },
            { sign: "Wet spots over drain field in dry weather", meaning: "Drain field failure starting. Schedule professional inspection.", action: "schedule" },
            { sign: "Last pump-out more than 5 years ago", meaning: "Overdue for routine pump-out. Schedule before backup.", action: "schedule" },
            { sign: "Lush, unusually green grass over drain field", meaning: "Sewage may be surfacing — drain field stressed.", action: "schedule" },
          ]
        : [
            { sign: "Cracks wider than 1/8 inch or growing month to month", meaning: "Active movement. Diagnose cause before deciding repair.", action: "schedule" },
            { sign: "Persistent damp spots on basement walls or floor", meaning: "Active moisture entry. Address source before mold establishes.", action: "schedule" },
            { sign: "Sump pump running more frequently than last year", meaning: "Increased water entry or pump aging. Verify both before failure.", action: "schedule" },
            { sign: "Doors or windows sticking that didn't before", meaning: "Settlement or movement affecting frame. Document; structural assessment.", action: "schedule" },
            { sign: "Stairstep cracks in block walls", meaning: "Foundation movement. Always pro-evaluate.", action: "schedule" },
          ],
      urgent: isSeptic
        ? [
            { sign: "Sewage backing up into the house", meaning: "Stop using all water. Septic emergency. Pump-out or main-line clearing now.", action: "urgent" },
            { sign: "Standing sewage visible over drain field", meaning: "System failure. Public health concern. Don't access the area.", action: "urgent" },
            { sign: "Strong sewage smell inside the house", meaning: "Drain trap dry, vent blocked, or backup imminent. Diagnose immediately.", action: "urgent" },
          ]
        : [
            { sign: "Active water entering through walls or floor", meaning: "Mitigation within hours. Mold begins at 48 hours.", action: "urgent" },
            { sign: "Visible wall bowing or leaning", meaning: "Structural failure imminent. Stay clear of wall; structural engineer same day.", action: "urgent" },
            { sign: "Crack wider than 1/4 inch and growing", meaning: "Active movement. Structural assessment immediately.", action: "urgent" },
            { sign: "Floor settling visibly (doors and walls misaligned)", meaning: "Foundation failure underway. Structural emergency.", action: "urgent" },
            { sign: "Smell of mildew with no visible source", meaning: "Hidden moisture. Investigate before mold spreads.", action: "urgent" },
          ],
      costOfDelay: `${isSeptic ? "Septic failures compound rapidly. A $400 pumping ignored becomes a $3,000 main-line clearing plus interior cleanup. A failing drain field caught early ($1,500) becomes full replacement ($15,000-$30,000)." : "Foundation problems are uniquely expensive when ignored. A $300 crack-seal becomes a $5,000 wall stabilization becomes a $30,000-$80,000 wall replacement. Insurance typically excludes 'gradual' foundation damage."}`,
      faq: [
        { q: `${isSeptic ? "How often should I pump my septic tank?" : "How often should I inspect my foundation?"}`, a: `${isSeptic ? "Erie-area rule: every 3-5 years for typical residential systems. More often for high-water households or systems with garbage disposals." : "Visually quarterly. Mark cracks with date. Annual structural walk-through. Erie's freeze-thaw cycles compound issues faster than warmer climates."}` },
        { q: `Is insurance involved in ${labelLower} problems?`, a: `${isSeptic ? "Generally no — septic is considered maintenance. Major sudden failures may have coverage; gradual aging is not covered." : "Almost never. Standard homeowner's policies explicitly exclude foundation damage. Some endorsements available; expensive."}` },
        { q: `What's the most-ignored warning sign?`, a: `${isSeptic ? "Pump-out dates. Homeowners forget when their tank was last serviced. Establish a 3-5 year recurring reminder." : "Cracks that haven't grown. People assume they're fine — but Erie's freeze-thaw can turn a stable hairline crack into an active problem in one season."}` },
        { q: `How do I find a reputable ${labelLower} pro?`, a: `Ask for proof of insurance. Check PA HICPA registration. Ask for references from completed projects. Get 2-3 quotes — these specialists have wide pricing ranges.` },
        { q: `What's the timing of problems?`, a: `${isSeptic ? "Most septic emergencies happen in winter (frozen drain fields) and after major rain. Schedule pumping before peak risk." : "Most foundation issues appear in spring (after winter freeze damage) and after major rain events. Inspect after both."}` },
      ],
    };
  }

  // ── niche-services cluster ────────────────────────────────────
  if (matches(nicheSlug, ["pest", "pet-grooming", "photograph", "moving", "demolition", "excavat", "bat-removal", "bee-wasp", "wildlife", "junk-removal", "dumpster", "general-contractor", "home-builder", "home-remodel", "boat-repair", "marine", "dock-install", "marina"])) {
    const isPest = matches(nicheSlug, ["pest"]);
    const isPet = matches(nicheSlug, ["pet-grooming"]);
    const isPhoto = matches(nicheSlug, ["photograph"]);
    const isMoving = matches(nicheSlug, ["moving"]);
    return {
      intro: isPest
        ? `Pest red flags often look like one-off events that turn out to be patterns. Spotting the pattern early is most of the work.`
        : isPet
        ? `Grooming red flags often reveal health or behavioral issues before they become serious. Owners who notice subtle changes save vet visits.`
        : isPhoto
        ? `Photography red flags are mostly about choosing the right vendor. Most disasters are predictable from due diligence.`
        : isMoving
        ? `Moving red flags appear in pre-booking and the days before the move. Catching them early is the difference between smooth and disaster.`
        : `Demolition red flags often involve safety, code compliance, and hidden conditions. Vigilance is mandatory because the stakes include personal injury and property damage.`,
      earlyWarnings: isPest
        ? [
            { sign: "Single ant or roach sighting", meaning: "Could be one wanderer or scout. Watch for repeats.", action: "watch" },
            { sign: "Slight droppings in one cabinet", meaning: "Rodent visitation. Clean, monitor, seal entry points.", action: "watch" },
            { sign: "Brief uptick in flying insects near light", meaning: "Seasonal or breeding season. Address attraction sources.", action: "watch" },
          ]
        : isPet
        ? [
            { sign: "Slight increase in shedding", meaning: "Seasonal, dietary, or stress. Track baseline.", action: "watch" },
            { sign: "Mild ear odor", meaning: "Cleaning needed or early ear issue. Monitor.", action: "watch" },
            { sign: "Slight tartar buildup on teeth", meaning: "Brushing or dental treats can help. Schedule cleaning if accelerating.", action: "watch" },
          ]
        : isPhoto
        ? [
            { sign: "Photographer slow to return inquiry", meaning: "Possibly overbooked or transitioning. Verify capacity before contract.", action: "watch" },
            { sign: "Contract has unusual cancellation or rights clauses", meaning: "Read carefully; understand who owns what.", action: "watch" },
            { sign: "Portfolio shows mostly highlights from few events", meaning: "Ask to see full deliveries from comparable events.", action: "watch" },
          ]
        : isMoving
        ? [
            { sign: "Quote significantly below other estimates", meaning: "Could be specialty pricing or undercutting that becomes upcharge later.", action: "watch" },
            { sign: "Slow communication during booking process", meaning: "May indicate the day-of experience too.", action: "watch" },
            { sign: "Mover doesn't ask detailed inventory questions", meaning: "Inadequate scoping leads to surprise upcharges.", action: "watch" },
          ]
        : [
            { sign: "Contractor reluctant to pull permits", meaning: "May save money short-term but creates resale and insurance issues.", action: "watch" },
            { sign: "Site preparation taking longer than expected", meaning: "Could be hidden conditions, weather, or scheduling.", action: "watch" },
            { sign: "Equipment showing wear or maintenance issues", meaning: "Affects timeline and safety. Verify backup plans.", action: "watch" },
          ],
      midSeverity: isPest
        ? [
            { sign: "Multiple sightings same species over weeks", meaning: "Established population. DIY may have time-limited effectiveness.", action: "schedule" },
            { sign: "Trails or evidence indicating organized colony", meaning: "Established harborage somewhere. Professional inspection finds it.", action: "schedule" },
            { sign: "Spring termite swarms inside the house", meaning: "PA-regulated; misdiagnosis is expensive. Get inspection.", action: "schedule" },
            { sign: "Carpenter ant activity in walls or structure", meaning: "Different from nuisance ants — structural damage potential.", action: "schedule" },
            { sign: "Bed bug evidence", meaning: "DIY rarely effective. Professional treatment essential.", action: "schedule" },
          ]
        : isPet
        ? [
            { sign: "Matting forming in coat", meaning: "Cannot be brushed out at home without pain. Schedule grooming.", action: "schedule" },
            { sign: "Skin irritation under coat", meaning: "Possible allergy, parasite, or infection. Vet consult; not just grooming.", action: "schedule" },
            { sign: "Ears red, smelly, or scratching frequently", meaning: "Ear infection likely. Vet visit; cleaning alone insufficient.", action: "schedule" },
            { sign: "Nails clicking on floors (clearly long)", meaning: "Overdue trim. Affects gait and joints.", action: "schedule" },
            { sign: "Tear stains worsening", meaning: "May indicate eye health issue. Vet check.", action: "schedule" },
          ]
        : isPhoto
        ? [
            { sign: "Photographer not responsive 30+ days before event", meaning: "Verify availability and engagement.", action: "schedule" },
            { sign: "Sample delivery times exceed industry norms (6-12 weeks for weddings)", meaning: "Verify expected delivery before contract.", action: "schedule" },
            { sign: "Equipment seems outdated for the type of work", meaning: "Old gear is fine if used well; verify with portfolio quality.", action: "schedule" },
            { sign: "Reviews mention communication issues", meaning: "Specific pattern of complaints. Don't dismiss as isolated.", action: "schedule" },
          ]
        : isMoving
        ? [
            { sign: "Last-minute scheduling changes from mover", meaning: "Capacity issues. May escalate on move day.", action: "schedule" },
            { sign: "Estimate revised significantly upward before move", meaning: "Common scam pattern. Get documented reasons.", action: "schedule" },
            { sign: "No PA-required disclosures provided", meaning: "PA regulates moving services; missing paperwork is concerning.", action: "schedule" },
            { sign: "Movers ask for cash up front", meaning: "Mainstream movers don't operate this way. Investigate.", action: "schedule" },
          ]
        : [
            { sign: "Permits not pulled when required", meaning: "Inspection failures and resale problems. Halt work until resolved.", action: "schedule" },
            { sign: "Asbestos or lead paint not tested in pre-1980 buildings", meaning: "Mandatory testing in PA. Halt work; get testing.", action: "schedule" },
            { sign: "Excavation without 811 utility marking", meaning: "Illegal in PA. Stop work until marked.", action: "schedule" },
            { sign: "Hidden conditions discovered changing scope significantly", meaning: "Change orders should be written. Get cost and time impact.", action: "schedule" },
          ],
      urgent: isPest
        ? [
            { sign: "Allergic reaction to stinging insect in household", meaning: "Medical emergency. After medical care, professional nest removal.", action: "urgent" },
            { sign: "Active infestation in food prep area", meaning: "Regulatory and health emergency. Same-day response.", action: "urgent" },
            { sign: "Aggressive wasps/hornets near entry points", meaning: "Safety issue. Don't disturb; professional removal.", action: "urgent" },
          ]
        : isPet
        ? [
            { sign: "Pet bleeding from a grooming incident", meaning: "Vet immediately. Document for groomer follow-up.", action: "urgent" },
            { sign: "Severe coat matting that's pulling on skin", meaning: "Pain and skin damage. Emergency groomer or vet shave-down.", action: "urgent" },
            { sign: "Pet refusing food or hiding after grooming", meaning: "Could indicate injury or trauma. Vet check.", action: "urgent" },
          ]
        : isPhoto
        ? [
            { sign: "Photographer cancels in the days before event", meaning: "Same-day backup needed. Check insurance and contracts.", action: "urgent" },
            { sign: "Photographer not responding day of event", meaning: "Backup plan essential. Document for refund/dispute.", action: "urgent" },
            { sign: "Files lost or corrupted post-event", meaning: "Recovery service if possible; document for insurance.", action: "urgent" },
          ]
        : isMoving
        ? [
            { sign: "Movers hold belongings hostage demanding more money", meaning: "Illegal in PA. Call police and PA Public Utility Commission.", action: "urgent" },
            { sign: "Movers don't show up on move day", meaning: "Emergency backup needed. Time-critical for closings.", action: "urgent" },
            { sign: "Significant damage discovered during unpacking", meaning: "Document everything; file insurance claim within carrier's window.", action: "urgent" },
          ]
        : [
            { sign: "Worker injury or accident on site", meaning: "Stop work; call 911 if needed; document for OSHA and insurance.", action: "urgent" },
            { sign: "Hidden utility line struck during excavation", meaning: "Evacuate area; call utility emergency line; do not approach.", action: "urgent" },
            { sign: "Structural collapse or near-miss during demolition", meaning: "Evacuate; structural engineer; halt work until safe.", action: "urgent" },
          ],
      costOfDelay: isPest
        ? `Pest problems compound exponentially. A $150 single-treatment ant call ignored becomes a $500 colony elimination. Termite damage ignored: $5,000-$20,000 in structural repair.`
        : isPet
        ? `Grooming-related health issues caught early cost $50-200 at the vet. Ignored, they become $500-2,000 problems requiring sedation or surgery.`
        : isPhoto
        ? `Photography problems are usually unrecoverable. A bad photographer at a wedding doesn't redo the event. Due diligence is the only protection.`
        : isMoving
        ? `Moving problems compound on move day. A bad mover discovered too late costs the move plus damages plus time. Vet thoroughly before booking.`
        : `Demolition mistakes are expensive and dangerous. Hidden utilities, asbestos, and structural cascade can turn a $5,000 demo into a $50,000+ disaster.`,
      faq: isPest
        ? [
            { q: `Why don't DIY products work as well as pro treatments?`, a: `Pros use products with different active ingredients than retail (some restricted), and they find sources DIYers miss. A pro spending 30 minutes inspecting finds harborage you'd never check.` },
            { q: `What's the difference between sporadic ants and an infestation?`, a: `Sporadic = a few ants in spring, easily explained. Infestation = persistent trails, multiple entry points, multiple species, or multiple rooms affected.` },
            { q: `Are pest sprays safe around kids and pets?`, a: `Modern professional products are very safe when applied per label — usually requiring 30-60 minute drying before re-entry.` },
            { q: `How often do I need ongoing pest service?`, a: `Most Erie homes do well with quarterly or seasonal preventive service ($35-$75 per visit).` },
            { q: `What about natural / "green" pest control?`, a: `Effective for prevention and minor issues; mixed results on established infestations. Most reputable Erie services offer green-friendly options.` },
          ]
        : isPet
        ? [
            { q: `How often should my dog be professionally groomed?`, a: `Short-coat: every 8-12 weeks. Medium-coat: every 4-8 weeks. Long-coat: every 4-6 weeks. Long-haired cats: every 6-12 weeks.` },
            { q: `Can I cut my dog's nails myself?`, a: `For calm dogs, yes. For nervous or dark-nailed dogs, professional or vet trim is safer ($10-20 add-on at most groomers).` },
            { q: `What's the worst grooming DIY mistake?`, a: `Brushing through matts without de-matting tools — painful and often worsens the matting. See a groomer; don't pull at matts.` },
            { q: `Is mobile grooming worth the premium?`, a: `For nervous pets, senior pets, or multi-pet households, often yes. 30-50% more than salon-based but eliminates salon stress.` },
            { q: `How do I find a groomer who's good with my breed?`, a: `Ask. Look for breed-specific photos in their portfolio. National Dog Groomers Association certification is also a quality signal.` },
          ]
        : isPhoto
        ? [
            { q: `Why do wedding photos cost so much?`, a: `8-10 hours on-site + 20-40 hours of editing + insurance, gear, backup equipment, and the irreplaceability of the work. The $3k-8k typical cost reflects total time.` },
            { q: `Are smartphone photos really good enough for real estate?`, a: `For under $200k homes or rental listings, often yes. Over $300k, professional photography reduces time-on-market 30-50% in most studies.` },
            { q: `What's the cheapest way to get professional-quality headshots?`, a: `Mini-session events ($100-200 for 30 minutes) or sharing a session with a colleague.` },
            { q: `When should I hire a videographer vs. photographer?`, a: `Photo for static moments; video for narrative or social-media shorts. Many events benefit from both.` },
            { q: `How do I avoid bad photographers?`, a: `Full galleries (not highlights), Google reviews with photos, verify insurance and contracts. Beware below-market pricing.` },
          ]
        : isMoving
        ? [
            { q: `What does professional moving really cost?`, a: `In Erie: $300-700 for studio/1-bedroom local; $700-2,000 for 2-3 bedroom local; $2,000-8,000 for long-distance. Add 20-30% for packing.` },
            { q: `What's the most underestimated cost of a DIY move?`, a: `Time. Most people undercount by 50-100%. A "weekend move" routinely becomes a week of cleanup and unpacking.` },
            { q: `Are movers insured for damaged items?`, a: `Yes, with two tiers: basic Released Value ($0.60/lb/item — typically inadequate) and Full Value Protection (actual replacement). DIYers have zero insurance.` },
            { q: `How early should I book movers in Erie?`, a: `4-6 weeks for weekdays; 8 weeks for weekends or end-of-month. Summer is busiest — book even earlier.` },
            { q: `What about hybrid (you pack, they move)?`, a: `Often best value. Packing is 40-60% of labor cost. Doing it yourself saves $500-2,000 with control over fragile items.` },
          ]
        : [
            { q: `Why does demolition cost so much?`, a: `Disposal is 30-40% of cost. Dumpsters, debris hauling, and tipping fees. Residential projects often hit $2k-10k.` },
            { q: `Can I rent equipment and excavate myself?`, a: `Risky. Renting a mini-excavator is cheap ($300-500/day). Hitting a utility line costs $500-50,000+. The 811 call is free and mandatory.` },
            { q: `What about salvage value?`, a: `Some jobs have salvage value — discuss with your contractor; they may discount labor for salvage rights.` },
            { q: `Do I need a permit for interior demolition?`, a: `In Erie, anything affecting structural, electrical, plumbing, or HVAC needs a permit. Non-load-bearing wall removal often needs permit + engineer sign-off.` },
            { q: `What's the biggest hazard in DIY demolition?`, a: `Three: asbestos in pre-1980 materials, hidden utilities inside walls, structural cascade. Pros know what to look for.` },
          ],
    };
  }

  // Generic fallback
  return {
    intro: `${label} problems often telegraph their failures before they become emergencies. Knowing the difference between "monitor" and "call now" saves money and prevents escalation.`,
    earlyWarnings: [
      { sign: `Minor change in performance or appearance`, meaning: `Equipment or material aging. Worth noting but not urgent.`, action: "watch" },
      { sign: `Unusual but mild sound, smell, or behavior`, meaning: `Early symptom. Establish whether it's worsening.`, action: "watch" },
    ],
    midSeverity: [
      { sign: `Repeated minor symptoms that don't resolve`, meaning: `Pattern indicates an underlying issue. Diagnose within weeks.`, action: "schedule" },
      { sign: `Noticeable performance degradation`, meaning: `Equipment failing or material wearing. Scheduled service prevents emergency call.`, action: "schedule" },
      { sign: `Visible damage or wear`, meaning: `Past the point of preventive maintenance; needs targeted repair.`, action: "schedule" },
    ],
    urgent: [
      { sign: `Complete loss of function`, meaning: `Active failure. Likely cascading effects.`, action: "urgent" },
      { sign: `Safety symptom (smoke, sparks, water, smell)`, meaning: `Don't wait. Real risk of larger damage or injury.`, action: "urgent" },
      { sign: `Sudden severe change`, meaning: `Something specific failed. Immediate attention prevents secondary damage.`, action: "urgent" },
    ],
    costOfDelay: `${label} issues caught at the "watch" stage often cost 5–10× less to fix than the same issue at the "urgent" stage. Most cascading damage isn't the original failure — it's what fails next because of it.`,
    faq: [
      { q: `When should I call about minor ${labelLower} symptoms?`, a: `If a symptom is new, recurring, or worsening, call. Most ${labelLower} pros do free or low-cost initial assessments. The cost of a "false alarm" is small; the cost of waiting through a real issue is large.` },
      { q: `How do I know if something is actually urgent?`, a: `Three signals: safety risk (you, your family, your home), cascading damage (one failure causing others), or active loss of function. If any are true, treat it as urgent.` },
      { q: `What's the cost of waiting?`, a: `Varies by severity. As a rule of thumb: maintenance is 1×, scheduled repair is 2–3×, emergency repair is 5–10×, and damage repair from a deferred issue can be 20–50×.` },
      { q: `Should I get a second opinion before calling?`, a: `For non-urgent items, yes — comparing 2–3 ${labelLower} pros is a smart practice. For anything in the "urgent" tier, call first; second opinions later if scope warrants.` },
      { q: `How do I avoid being talked into unneeded work?`, a: `Get the diagnosis in writing. Ask "what happens if I wait 6 months?" Reputable pros will tell you which items are urgent, which can wait, and why.` },
    ],
  };
}

// ── What-to-Expect Content ───────────────────────────────────────────

export interface WhatToExpectStep {
  /** Step heading */
  title: string;
  /** Description */
  description: string;
  /** Specific things the customer should look for or do */
  bullets: string[];
}

export interface WhatToExpectContent {
  intro: string;
  beforeAppointment: WhatToExpectStep;
  atArrival: WhatToExpectStep;
  duringWork: WhatToExpectStep;
  afterCompletion: WhatToExpectStep;
  /** Red flags from the pro side */
  proRedFlags: string[];
  /** Typical pricing/quoting practices */
  pricingNorms: string;
  faq: Array<{ q: string; a: string }>;
}

export function getWhatToExpectContent(nicheSlug: string): WhatToExpectContent {
  const niche = getNicheBySlug(nicheSlug);
  const label = niche?.label ?? "service";
  const labelLower = label.toLowerCase();

  // Specialized content where it really matters (emergency-prone niches)
  if (matches(nicheSlug, ["plumb", "drain", "sewer", "water-heater"])) {
    return {
      intro: `What a plumbing visit actually looks like — from the first call to the final invoice. Knowing what's normal makes it easier to spot what isn't.`,
      beforeAppointment: {
        title: "Before the plumber arrives",
        description: "5–10 minutes of prep saves diagnostic time and money on the visit.",
        bullets: [
          "Locate your main water shutoff (basement, utility closet, or near the meter)",
          "Clear a path to the work area — under-sink cabinets emptied, basement access cleared",
          "Note when the problem started and what changes preceded it",
          "Take photos of the affected area and any visible damage",
          "If it's an emergency: shut off water at the main if you can do so safely",
        ],
      },
      atArrival: {
        title: "When they show up",
        description: "Most plumbing visits start with a brief walkthrough and diagnosis.",
        bullets: [
          "Expect them to introduce themselves and put on shoe covers in finished spaces",
          "They'll ask you to walk them through the problem",
          "They'll inspect the affected area plus related systems (e.g. for a kitchen leak, they'll also check supply lines and shutoff valves)",
          "Diagnostic fee is typically $75–$150; applied to the repair cost if you proceed",
          "You should receive a written estimate before any work begins",
        ],
      },
      duringWork: {
        title: "While they're working",
        description: "Standard practice in Erie. Anything materially different is worth asking about.",
        bullets: [
          "Drop cloths or absorbent pads under the work area",
          "Communication when they uncover anything unexpected (rotted subfloor, broken vent, etc.)",
          "A second estimate if scope changes significantly",
          "Photos before they close up walls or hidden areas — ask for these",
          "Water turned back on and tested at the work area before they leave",
        ],
      },
      afterCompletion: {
        title: "After the work is done",
        description: "Cleanup, invoice, warranty, and what's expected of you afterward.",
        bullets: [
          "Work area cleaner than they found it (within reason)",
          "Demonstration that the fix works — turn it on, run water, flush",
          "Written invoice with parts and labor itemized",
          "Warranty information (most parts have 1-year labor warranty; manufacturer warranty on the parts)",
          "Recommendations for follow-up monitoring or preventive maintenance",
        ],
      },
      proRedFlags: [
        "Pushes for cash-only payment, especially on substantial jobs",
        "Cannot or will not provide a written estimate before starting",
        "Cannot show proof of license or insurance",
        "Pressure to add unrelated repairs without showing you the issue",
        "Quote dramatically lower than 2–3 other quotes (usually means under-scoping)",
        "Wants payment in full before completion",
      ],
      pricingNorms: `Most Erie plumbers charge a $75–$150 service-call fee that's applied to the repair if you proceed. Hourly rates run $90–$175. Emergency / after-hours rates are typically 1.25–1.5× standard. Major jobs (water-heater replacement, repipe) are quoted flat-rate after diagnosis. Always get the scope and price in writing before work starts.`,
      faq: [
        { q: `Should I tip the plumber?`, a: `Not expected. For exceptional service or unusual circumstances (Saturday evening emergency, going significantly above scope), a $20–$50 tip is appreciated but never required.` },
        { q: `How long should a typical service call take?`, a: `Most diagnostic-and-fix calls are 1–3 hours. Water heater replacement is 4–8 hours. Repipes are multi-day. If your quoted time was 1 hour and you're at hour 3, ask for an update.` },
        { q: `Should I get a second quote on a $1,000+ job?`, a: `Yes, almost always. Plumbing prices vary considerably between Erie providers. For non-emergency jobs over $1,000, two or three quotes is normal due diligence and often saves real money.` },
        { q: `What happens if the fix doesn't work?`, a: `Most reputable plumbers offer a labor warranty (typically 90 days to 1 year). If the same issue recurs in that window, the return visit should be free. Get this in writing.` },
        { q: `Can I watch them work?`, a: `Yes, and most plumbers appreciate the company. It's also a good way to learn what's involved. Just stay out of their immediate work area and let them concentrate on tricky steps.` },
      ],
    };
  }

  // ── HVAC priority cluster ──────────────────────────────────────
  if (matches(nicheSlug, ["hvac", "heating", "cooling", "furnace", "ac-repair", "duct-clean"])) {
    return {
      intro: `A typical ${labelLower} visit is diagnostic-first, then repair or maintenance. Knowing the standard flow helps you verify good service.`,
      beforeAppointment: {
        title: "Before the tech arrives",
        description: "Quick prep makes the visit go faster.",
        bullets: [
          "Note when the problem started and any patterns",
          "Have the system's make, model, and age handy",
          "Check air filters; replace if visibly dirty (sometimes resolves the issue)",
          "Clear access to the indoor and outdoor units",
          "Look up any maintenance records or prior service",
        ],
      },
      atArrival: {
        title: "When the tech arrives",
        description: "Initial inspection and diagnosis usually take 30-60 minutes.",
        bullets: [
          "Introduction and discussion of symptoms",
          "Visual inspection of indoor and outdoor units",
          "Diagnostic measurements (pressures, temperatures, electrical)",
          "Diagnostic fee disclosure ($80-$150 typically applied to repair)",
          "Written estimate before any repair work proceeds",
        ],
      },
      duringWork: {
        title: "While work happens",
        description: "Standard practice during HVAC repair.",
        bullets: [
          "Drop cloths and surface protection around indoor unit",
          "Communication when secondary issues are found",
          "Old parts shown to you before disposal",
          "Updated estimate if scope expands",
          "Functional test cycle before they leave",
        ],
      },
      afterCompletion: {
        title: "Wrapping up",
        description: "Final test, paperwork, and warranty.",
        bullets: [
          "System tested through full operation cycle",
          "Itemized invoice with parts, refrigerant, and labor",
          "Warranty info (typically 90 days - 1 year labor, longer on major parts)",
          "Recommendations for ongoing maintenance",
          "Filter change schedule and any other DIY follow-up",
        ],
      },
      proRedFlags: [
        "Cannot show EPA Section 608 certification (required for refrigerant work)",
        "Won't quote in writing before starting work",
        "Pressures replacement when repair is reasonable",
        "Won't show you the failed part",
        "Cash-only demands",
        "Estimate dramatically lower than 2-3 other quotes",
        "Refuses to provide warranty in writing",
      ],
      pricingNorms: `In Erie: Service call $80-$150. Common repairs $200-$1,200. Full system replacement $5,000-$15,000+. Annual maintenance plans $150-$300/year. After-hours emergency 1.5-2× standard.`,
      faq: [
        { q: `Should I get multiple quotes?`, a: `For replacement (over $3,000), absolutely yes — savings often 20-40%. For repair under $500, usually not worth the time.` },
        { q: `Is annual maintenance worth it?`, a: `Yes for most systems. Tune-ups catch small problems before failure and maintain efficiency. Many plans include priority scheduling during peak demand seasons.` },
        { q: `Should I tip the tech?`, a: `Not standard, but appreciated for unusual circumstances. $20-$50 is generous; never required.` },
        { q: `What about extended warranties?`, a: `Often included with new installation (5-10 year parts is common). Aftermarket extended warranties less commonly worth it.` },
        { q: `When is it time for full replacement?`, a: `Three signs: system is past 12-15 years old, repair quote exceeds 50% of replacement cost, or you're getting frequent service calls.` },
      ],
    };
  }

  // ── Electrical priority cluster ────────────────────────────────
  if (matches(nicheSlug, ["electric", "wiring", "panel", "ev-charger", "generator-install", "smart-home"])) {
    return {
      intro: `An ${labelLower} visit involves diagnostic, work, and (often) inspection. Knowing the standard flow protects you from corner-cutting.`,
      beforeAppointment: {
        title: "Before the electrician arrives",
        description: "Prep that saves time and improves safety.",
        bullets: [
          "Note exactly what isn't working and when it started",
          "Identify the affected breaker(s) and whether they trip",
          "Clear the electrical panel for inspection access",
          "List any recent changes (new appliances, renovations, lightning events)",
          "Know your home's age (affects code compliance considerations)",
        ],
      },
      atArrival: {
        title: "When the electrician arrives",
        description: "Initial inspection and diagnosis.",
        bullets: [
          "Introduction and walkthrough of the issue",
          "Inspection at affected fixtures and at the panel",
          "Discussion of code compliance for any planned changes",
          "Permit requirements identified for substantial work",
          "Written estimate before work begins",
        ],
      },
      duringWork: {
        title: "While work happens",
        description: "What's standard during electrical work.",
        bullets: [
          "Power shut off at the panel during work",
          "Communication when hidden conditions are found (old wiring, code issues)",
          "Permits posted and inspections scheduled if required",
          "Daily cleanup keeping work areas safe",
          "Old parts and materials retained for inspection if you request",
        ],
      },
      afterCompletion: {
        title: "Wrapping up",
        description: "Testing, inspection, and documentation.",
        bullets: [
          "All work tested with power restored",
          "Inspection scheduled or completed if required",
          "Itemized invoice with parts and labor",
          "Warranty information (typically 1 year on labor; longer on installed equipment)",
          "Documentation for insurance or utility programs",
        ],
      },
      proRedFlags: [
        "Not licensed for electrical work in Erie",
        "Won't pull permits when work clearly requires them",
        "Cash-only demand to avoid permits or taxes",
        "Pressures upgrades unrelated to the original problem",
        "Won't provide written estimate",
        "Quote dramatically lower than 2-3 other electricians",
        "Refuses to coordinate with inspection process",
      ],
      pricingNorms: `In Erie: Service call $80-$150. Common repairs $150-$600. Panel upgrade $1,500-$4,000. EV charger install $500-$2,000 (plus possible panel work). Whole-house generator $5,000-$15,000+ installed.`,
      faq: [
        { q: `Do I really need permits for electrical work?`, a: `For new circuits, panel work, and most additions: yes. For simple swaps of like-for-like: usually no. Erie code is strict; non-permitted work affects insurance and resale.` },
        { q: `How can I verify my electrician is licensed?`, a: `Verify with Erie Bureau of Code Enforcement. Insurance documentation should also be available on request.` },
        { q: `Should I get multiple quotes for major work?`, a: `For projects over $2,000, definitely. Pricing varies 20-40% for the same scope; quality varies more.` },
        { q: `Are smart-home installations a different specialty?`, a: `Sometimes. Most licensed electricians handle them; some specialize. For complex integrations specialty matters.` },
        { q: `What about old (knob-and-tube or aluminum) wiring?`, a: `Both common in older Erie homes. Knob-and-tube: insurance often excludes coverage; rewiring is significant. Aluminum: pigtailing fixes are standard.` },
      ],
    };
  }

  // ── Roofing priority cluster ───────────────────────────────────
  if (matches(nicheSlug, ["roof", "siding"])) {
    return {
      intro: `A roofing visit ranges from quick inspection to multi-day replacement. Knowing the typical flow helps you spot good work.`,
      beforeAppointment: {
        title: "Before the appointment",
        description: "Prep makes the assessment productive.",
        bullets: [
          "Document current symptoms (leaks, stains, missing shingles) with photos",
          "Have the roof's age and material handy",
          "Check attic for any visible water staining or daylight",
          "Have any warranty paperwork from prior installation",
          "List any recent storm events that may correlate",
        ],
      },
      atArrival: {
        title: "When the contractor arrives",
        description: "Inspection typically takes 30-90 minutes.",
        bullets: [
          "Exterior inspection from ground and ladder",
          "Roof walk where safe",
          "Attic inspection for moisture and ventilation",
          "Flashing, vents, and chimney inspection",
          "Written assessment with recommendations and pricing",
        ],
      },
      duringWork: {
        title: "During the project",
        description: "Replacement typically takes 1-3 days.",
        bullets: [
          "Property protection (tarps, gutter protection, magnetic nail sweeps)",
          "Tear-off of old material",
          "Decking inspection — change orders if rot found",
          "Underlayment, flashing, ice & water shield",
          "Shingle install with attention to flashing and ventilation",
        ],
      },
      afterCompletion: {
        title: "Wrapping up",
        description: "Cleanup, inspection, and warranty.",
        bullets: [
          "Magnetic nail sweep of property",
          "Final walkthrough showing completed work",
          "Disposal of all old materials",
          "Manufacturer warranty registration",
          "Workmanship warranty in writing (5-10 years typical)",
        ],
      },
      proRedFlags: [
        "Cannot show proof of insurance or PA HICPA registration",
        "Demands large upfront payment (more than 25% before work)",
        "Won't pull permits when required",
        "Pressures decision with 'storm chaser' urgency tactics",
        "Quote significantly below market",
        "No written contract or warranty",
        "Won't allow inspection by independent third party",
      ],
      pricingNorms: `In Erie: Asphalt shingle roof replacement $6,000-$15,000 for typical residential. Metal roof $15,000-$40,000+. Siding replacement $8,000-$25,000+. Repairs $300-$3,000 depending on scope. PA HICPA registration required.`,
      faq: [
        { q: `Should I get multiple quotes?`, a: `Always for replacement. Get 3 minimum. Pricing and quality vary significantly.` },
        { q: `What about insurance claims?`, a: `For storm or wind damage: file with your homeowner's insurance. Reputable Erie contractors will work with adjusters; beware "storm chasers".` },
        { q: `When is repair vs. replacement right?`, a: `Repair if: roof under 15 years old, isolated damage, deck and underlayment intact. Replace if: over 20 years old or widespread aging signs.` },
        { q: `What about manufacturer warranties?`, a: `Material warranties typically 25-50 years (full warranty often only 10-15 years; rest is prorated). Workmanship warranty is separate.` },
        { q: `How do I find a reputable roofer?`, a: `Manufacturer-certified installers, BBB rating, local references on completed installs, PA HICPA registration, clear insurance documentation.` },
      ],
    };
  }

  // ── Restoration priority cluster ───────────────────────────────
  if (matches(nicheSlug, ["restor", "flood", "mold", "water-damage", "fire", "storm-damage", "emergency-board"])) {
    return {
      intro: `A restoration visit is fast — these are usually emergencies. Knowing the standard flow helps you make smart decisions under stress.`,
      beforeAppointment: {
        title: "Before the team arrives",
        description: "Critical actions while waiting for response.",
        bullets: [
          "Stop water at the source if possible (main water shutoff)",
          "Document everything with photos and video for insurance",
          "Move valuables out of affected areas if safe",
          "Don't disturb mold or fire-damaged areas",
          "Contact insurance — most companies have 24-hour claim lines",
        ],
      },
      atArrival: {
        title: "When the team arrives",
        description: "Emergency response is typically 1-4 hours for water; longer for fire/mold.",
        bullets: [
          "Initial assessment and safety check",
          "Documentation with moisture meters, thermal cameras, hygrometers",
          "Discussion of insurance coordination",
          "Written scope and pricing",
          "Immediate mitigation if water damage is active",
        ],
      },
      duringWork: {
        title: "While mitigation and restoration happen",
        description: "Water dry-out 3-5 days; mold remediation 1-2 weeks; fire restoration 2-12 weeks.",
        bullets: [
          "Containment of affected areas (plastic sheeting, negative air pressure)",
          "Daily moisture monitoring for water damage",
          "Equipment running 24/7 during dry-out (loud — plan accordingly)",
          "Communication with insurance adjuster throughout",
          "Photo and moisture documentation maintained for the claim",
        ],
      },
      afterCompletion: {
        title: "Wrapping up",
        description: "Clearance testing, restoration work, and documentation.",
        bullets: [
          "Final moisture and clearance verification (third-party testing for mold)",
          "Restoration of finishes (drywall, flooring, paint)",
          "Final walkthrough and acceptance",
          "Complete documentation for insurance final settlement",
          "Warranty on the restoration work (typically 1-5 years)",
        ],
      },
      proRedFlags: [
        "Cannot show IICRC certification",
        "Won't work directly with your insurance",
        "Demands large upfront payment",
        "Skips containment for mold remediation",
        "No written scope or pricing",
        "Pressures you to sign immediate contracts during the crisis",
        "Sub-contracts without disclosure",
      ],
      pricingNorms: `In Erie: Water dry-out $1,000-$5,000 for typical residential event. Mold remediation $1,500-$10,000+. Fire restoration $10,000-$50,000+. Most restoration is insurance-covered; your out-of-pocket is the deductible.`,
      faq: [
        { q: `Will my homeowner's insurance cover this?`, a: `Generally yes for sudden events (burst pipe, storm damage, fire). Generally no for gradual damage. File the claim immediately.` },
        { q: `What if water entered more than 48 hours ago?`, a: `Mold growth has likely started. Restoration company should test, contain, and remediate before reconstruction.` },
        { q: `Can I pick my own restoration company?`, a: `Yes — you choose, not your insurance company. Many insurers have "preferred" vendors, but you can decline.` },
        { q: `How long does the whole process take?`, a: `Water: 3-7 days dry-out + 1-4 weeks restoration. Mold: 1-3 weeks. Fire (significant): 2-6 months.` },
        { q: `What about my belongings?`, a: `Restoration companies handle "contents" — cleaning, deodorizing, or replacing damaged personal property. Insurance covers contents separately from structure.` },
      ],
    };
  }

  // ── outdoor-seasonal cluster ──────────────────────────────────
  if (matches(nicheSlug, ["landscap", "lawn", "snow", "tree-service", "tree-removal", "irrigation", "sprinkler", "gutter", "ice-dam", "salt-deicing", "outdoor-light", "holiday-light", "asphalt-seal", "driveway-pav", "decks-patio", "lakefront", "retaining-wall"])) {
    return {
      intro: `An ${labelLower} appointment is a mix of property assessment, scope discussion, and the actual physical work. Knowing what's normal makes it easier to spot what isn't.`,
      beforeAppointment: {
        title: "Before the appointment",
        description: "A few minutes of prep makes the visit faster and the quote more accurate.",
        bullets: [
          "Walk the property and note specific areas of concern",
          "Take photos of problem areas (helps with phone quotes too)",
          "Identify any access points the crew will need (gate codes, fence keys)",
          "Note where utilities are marked (or call 811 if work involves digging)",
          "Have your property survey or plat map available if you have one",
        ],
      },
      atArrival: {
        title: "When the crew arrives",
        description: "Most outdoor work starts with a walkthrough and scope confirmation.",
        bullets: [
          "Introduction and credentials check on request",
          "Property walkthrough — they'll show you what they're seeing",
          "Confirmation of scope, equipment access, and timeline",
          "Discussion of cleanup, debris disposal, and follow-up",
          "Written estimate before work begins (for anything substantial)",
        ],
      },
      duringWork: {
        title: "While work happens",
        description: "Standard practice in Erie outdoor work.",
        bullets: [
          "Protection of lawn, beds, and surfaces from equipment damage",
          "Communication when unexpected issues arise (buried debris, drainage problems, hidden roots)",
          "Updated estimate if scope expands significantly",
          "Photos before and after for documentation",
          "Adherence to noise ordinances (typically 7 AM - 8 PM in Erie residential)",
        ],
      },
      afterCompletion: {
        title: "Wrapping up",
        description: "Cleanup, payment, and follow-up.",
        bullets: [
          "Site cleaned of debris, equipment, and materials",
          "Final walkthrough showing completed work",
          "Demonstration of any installed equipment (irrigation controllers, etc.)",
          "Itemized invoice with parts, materials, and labor",
          "Recommendations for ongoing maintenance",
        ],
      },
      proRedFlags: [
        "Cannot show proof of insurance (essential for tree work, demolition, excavation)",
        "Cash-only demand on substantial jobs",
        "Pressure to add unrelated services or upgrades",
        "Won't call 811 before digging (illegal in PA)",
        "Quote dramatically lower than 2-3 other quotes (usually means scope cut)",
        "Wants full payment before completion",
        "Damages property and refuses to file insurance claim",
      ],
      pricingNorms: `Most Erie ${labelLower} contractors offer free walkthroughs and quotes. Major work (tree removal, hardscaping, irrigation installs) is typically flat-rate after assessment. Hourly maintenance rates run $50-$150 per crew member. Emergency / after-hours rates are typically 1.5-2× standard. PA HICPA registration is required for work over $500/year.`,
      faq: [
        { q: `Should I tip the crew?`, a: `Not standard for substantial work; appreciated for exceptional service or unusual circumstances. A modest tip ($10-30 per crew member on a multi-person day) is generous but not required.` },
        { q: `How do I know if the work is complete?`, a: `Final walkthrough with the foreman. Verify scope items match the original estimate. Note any items deferred or modified.` },
        { q: `What about damage to my property?`, a: `Reputable contractors carry insurance that covers property damage. Document immediately with photos; file claims through their insurance, not yours.` },
        { q: `When should I get multiple quotes?`, a: `For any work over $1,000 — almost always. Pricing varies significantly in outdoor trades; 2-3 quotes often save 20-30%.` },
        { q: `Should I be on-site during the work?`, a: `For initial walkthrough yes. After that, depends on scope. Major projects benefit from your presence for mid-day decisions; routine maintenance doesn't require it.` },
      ],
    };
  }

  // ── trades-interior cluster ───────────────────────────────────
  if (matches(nicheSlug, ["drywall", "plaster", "flooring", "hardwood", "tile", "paint", "epoxy-floor", "cabinet-refin", "countertop", "closet-storage", "bathroom-remodel", "kitchen-remodel", "basement-finish"])) {
    return {
      intro: `Interior finish trades involve prep, application, and cleanup phases. Knowing what each looks like helps you verify quality work.`,
      beforeAppointment: {
        title: "Before the appointment",
        description: "Prep makes the work go faster and protects your belongings.",
        bullets: [
          "Move furniture out of work areas or to the center of the room",
          "Remove valuables, electronics, and artwork from walls",
          "Identify any color, style, or material decisions ahead of time",
          "Set expectations with family members about noise, dust, and access",
          "Note any specific concerns or trouble areas",
        ],
      },
      atArrival: {
        title: "When the crew arrives",
        description: "Quality interior work starts with extensive prep.",
        bullets: [
          "Introduction and credentials check on request",
          "Walkthrough confirming scope and color/material choices",
          "Plastic sheeting, drop cloths, and protective coverings installed",
          "Discussion of work hours and access during the project",
          "Final written estimate before any prep begins",
        ],
      },
      duringWork: {
        title: "While work happens",
        description: "What you should see and hear during interior finish work.",
        bullets: [
          "Surface prep that takes longer than you expected (this is good)",
          "Communication about color matching, sheen choices, or unexpected conditions",
          "Mid-project check-ins where you can review progress",
          "Updated estimate if scope expands (water damage discovered, additional repair needed)",
          "Daily cleanup keeping the rest of your home livable",
        ],
      },
      afterCompletion: {
        title: "Wrapping up",
        description: "Final inspection, touch-ups, and warranty.",
        bullets: [
          "Final walkthrough in good lighting to spot any issues",
          "Touch-up work on minor flaws identified",
          "All protective coverings, materials, and debris removed",
          "Written warranty information (most pros warrant their work for 1-3 years)",
          "Care instructions for the finished surface",
        ],
      },
      proRedFlags: [
        "Skipping prep work to move faster",
        "Cannot show proof of insurance or PA HICPA registration",
        "Pre-1978 home work without lead-paint protocols (EPA RRP violation)",
        "Pressure to upgrade materials beyond what you discussed",
        "Cash-only demands on substantial work",
        "Wants final payment before final walkthrough",
        "Won't provide written warranty",
      ],
      pricingNorms: `Most Erie ${labelLower} pros offer free estimates with detailed scope. Pricing is typically per-square-foot for floors and wall paint, per-room for trim work, and hourly + materials for repairs. Major projects (whole-room flooring, full-house painting) should be itemized and warrantied. PA HICPA registration required for work over $500/year.`,
      faq: [
        { q: `How long should a typical job take?`, a: `Single-room paint: 1-2 days. Whole-house paint: 5-10 days. Hardwood install: 3-5 days per room. Drywall repair: 1-3 days. If your quoted time is significantly off, ask why.` },
        { q: `Should I get multiple quotes?`, a: `For projects over $1,500, yes. Quality varies as much as price; 2-3 quotes let you compare both.` },
        { q: `What about lead paint in older Erie homes?`, a: `Pre-1978 homes require EPA RRP-certified contractors. Verify certification before work begins; non-compliance is both a health risk and a regulatory violation.` },
        { q: `Can I supply my own materials?`, a: `Sometimes — many pros will, with markup adjustment. Trade-off: pro-supplied means single-source warranty; owner-supplied means you absorb material defects.` },
        { q: `How do I know the work was done right?`, a: `Inspect in good lighting (sunlight reveals what artificial lighting hides). Run your hand over surfaces. Look at corners and transitions where amateur work shows.` },
      ],
    };
  }

  // ── trades-exterior cluster ───────────────────────────────────
  if (matches(nicheSlug, ["concrete", "masonry", "brick", "fenc", "windows-door", "glass", "storm-window"])) {
    return {
      intro: `Exterior trade projects involve site work, material delivery, installation, and often inspection. Knowing the phases helps you plan and verify.`,
      beforeAppointment: {
        title: "Before the appointment",
        description: "Site prep makes major exterior work go smoothly.",
        bullets: [
          "Clear access to work areas (vehicles, lawn equipment, debris)",
          "Mark utilities if work involves digging (call 811 if contractor hasn't)",
          "Verify permit status if the work requires one",
          "Confirm any HOA or neighbor coordination needed",
          "Note where deliveries should be staged",
        ],
      },
      atArrival: {
        title: "When the crew arrives",
        description: "Substantial exterior work starts with verification and setup.",
        bullets: [
          "Introduction, credentials, and insurance certificate",
          "Site walkthrough confirming scope and any boundary concerns",
          "Verification of utility marking (if applicable)",
          "Material delivery and staging area setup",
          "Final written estimate before work begins",
        ],
      },
      duringWork: {
        title: "While work happens",
        description: "Standard practice for exterior trade work.",
        bullets: [
          "Daily site cleanup keeping the property accessible",
          "Communication when hidden conditions surface (rot, drainage, settling)",
          "Permits posted and inspections scheduled if required",
          "Updated estimate if scope changes materially",
          "Photo documentation of work in progress (especially anything that will be covered)",
        ],
      },
      afterCompletion: {
        title: "Wrapping up",
        description: "Final inspection, debris removal, and warranty.",
        bullets: [
          "All materials, debris, and equipment removed from site",
          "Final walkthrough confirming scope items completed",
          "Inspection (if required) scheduled or completed",
          "Itemized invoice and warranty documentation",
          "Care and maintenance instructions for the new installation",
        ],
      },
      proRedFlags: [
        "Cannot show proof of insurance or PA HICPA registration",
        "No permits pulled when work clearly requires them",
        "Won't call 811 before digging",
        "Won't provide written contract before work begins",
        "Pressure to pay cash to avoid permits or taxes",
        "Quote far below market (usually means under-scoping or under-insurance)",
        "Demands full payment before completion",
      ],
      pricingNorms: `Major exterior projects in Erie are typically flat-rate after detailed scope. Pricing varies significantly by material and complexity: concrete $8-$15/sq ft installed; fencing $25-$60/linear ft installed; windows $500-$2,500 installed each. PA HICPA registration required for work over $500/year. Get 2-3 quotes for any substantial project.`,
      faq: [
        { q: `Do I really need a permit?`, a: `For substantial exterior work in Erie: usually yes. Concrete over 100 sq ft, retaining walls over 4 ft, structural masonry, most window/door replacements. Skipping permits affects resale and insurance.` },
        { q: `How long does substantial exterior work take?`, a: `Concrete pour and cure: 7-14 days. Full fence install: 2-5 days. Whole-house windows: 1-3 days. Weather delays are common in Erie spring and fall.` },
        { q: `What about Erie's freeze-thaw cycles?`, a: `Choose materials and installation methods rated for PA Climate Zone 5. Improper installation shows in 1-2 seasons; proper installation lasts 20-30 years. Ask specifically about freeze-thaw rating.` },
        { q: `Can I do the demo myself to save money?`, a: `Sometimes possible to save 10-20% on labor. Trade-off: contractor warranties may exclude your prep work. Discuss before deciding.` },
        { q: `How do I verify the work is up to code?`, a: `Pull permits. Pass inspections. Keep documentation. Erie's Bureau of Code Enforcement records become permanent property records and protect resale value.` },
      ],
    };
  }

  // ── cleaning cluster ──────────────────────────────────────────
  if (matches(nicheSlug, ["clean", "maid", "janitor", "pressure-wash", "power-wash"])) {
    return {
      intro: `A cleaning appointment is fast, focused work. Knowing what's standard helps you set expectations and recognize good service.`,
      beforeAppointment: {
        title: "Before the appointment",
        description: "Small prep makes the visit faster and the result better.",
        bullets: [
          "Pick up clutter — cleaning is cleaning, not organizing",
          "Note specific concerns or trouble areas",
          "Identify any surfaces requiring special care (fine wood, marble, antique fabrics)",
          "Secure or relocate valuables, jewelry, or fragile items",
          "Plan to be home for first visit, or arrange access",
        ],
      },
      atArrival: {
        title: "When the cleaner arrives",
        description: "Most cleaning visits start with a quick walkthrough.",
        bullets: [
          "Introduction and review of any special instructions",
          "Walkthrough of priority areas and any new concerns",
          "Discussion of any equipment or product preferences (your supplies vs. theirs)",
          "Estimated time confirmation",
          "Any payment or invoicing logistics",
        ],
      },
      duringWork: {
        title: "While work happens",
        description: "What you should expect during typical cleaning service.",
        bullets: [
          "Systematic top-to-bottom, room-by-room approach",
          "Care with belongings — items returned to where they were found",
          "Communication about anything broken or stained that they encounter",
          "Reasonable noise level (especially for ongoing services)",
          "Respect for pets and other household members",
        ],
      },
      afterCompletion: {
        title: "Wrapping up",
        description: "Quick walkthrough and payment.",
        bullets: [
          "Final walkthrough so you can spot anything missed",
          "Touch-up on any areas you flag",
          "All supplies and equipment removed from the home",
          "Receipt or invoice provided",
          "Schedule confirmation for next visit (recurring services)",
        ],
      },
      proRedFlags: [
        "Cannot show proof of insurance or bonding",
        "Significant pricing changes after a first visit (some adjustment is normal)",
        "Damages property and refuses responsibility",
        "Cleaners changing every visit (turnover signals service quality issues)",
        "Won't follow specific instructions you've given multiple times",
        "Asks for cash payment outside of normal invoicing",
        "Concerns about missing items after visits",
      ],
      pricingNorms: `In Erie: Regular cleaning $25-$45/hour per cleaner, or $100-$250 per visit depending on home size. Deep cleaning 1.5-2× regular rate. Pressure washing $0.15-$0.45/sq ft. Carpet cleaning $0.25-$0.75/sq ft. Most services offer discounts for recurring schedules.`,
      faq: [
        { q: `Should I tip cleaning crews?`, a: `Not required, but common — $5-20 per cleaner for recurring service, more for one-time deep cleans. Reduces turnover; you keep the team that knows your home.` },
        { q: `Should I be home during cleaning?`, a: `First visit yes (so you can give the tour and set expectations). After that, depends on your preference. Many recurring clients give keys or access codes.` },
        { q: `What if something is broken or missing?`, a: `Reputable services have insurance and clear policies. Report immediately with photos. Bonded services have additional theft protection.` },
        { q: `How do I switch cleaning services?`, a: `Give the current service notice (typically 2 weeks for recurring). Provide a final-cleaning checklist if they need one. Most transitions are smooth.` },
        { q: `Is professional cleaning worth it?`, a: `For most working households, yes — buys back 3-5 hours/week of time and produces more consistent results than DIY. The math favors hiring for households earning more than $50/hour at their day jobs.` },
      ],
    };
  }

  // ── specialty-repair cluster ──────────────────────────────────
  if (matches(nicheSlug, ["appliance-repair", "garage-door", "chimney", "fireplace", "locksmith", "handyman"])) {
    return {
      intro: `Specialty-repair visits are typically diagnostic-first, then repair if the customer proceeds. Knowing the standard flow helps you spot when something's off.`,
      beforeAppointment: {
        title: "Before the appointment",
        description: "A few minutes of prep saves diagnostic time on the visit.",
        bullets: [
          "Note when the problem started and any changes preceding it",
          "Have model and serial numbers ready (usually on a sticker)",
          "Clear access to the affected equipment or area",
          "Make a list of all symptoms you've noticed",
          "Identify any warranty paperwork or prior service records",
        ],
      },
      atArrival: {
        title: "When the tech arrives",
        description: "Most service calls follow a standard diagnostic flow.",
        bullets: [
          "Introduction and brief discussion of the symptoms you've noticed",
          "Inspection and diagnostic process (10-30 minutes typically)",
          "Diagnostic fee usually $50-$150, applied to repair if you proceed",
          "Written estimate showing parts and labor before any repair work",
          "Discussion of repair-vs-replace if the unit is older",
        ],
      },
      duringWork: {
        title: "While the repair happens",
        description: "What's standard during typical repair work.",
        bullets: [
          "Drop cloths or protection for finished surfaces",
          "Communication when secondary problems are found",
          "Updated estimate if scope changes",
          "Old parts shown to you before disposal (legitimate pros do this)",
          "Functional test before they leave",
        ],
      },
      afterCompletion: {
        title: "Wrapping up",
        description: "Final test, invoice, and warranty.",
        bullets: [
          "Demonstration that the repair works",
          "Itemized invoice with parts and labor",
          "Warranty info (most parts have 90 days to 1 year labor warranty)",
          "Recommendations for ongoing maintenance",
          "Documentation for any insurance or extended-warranty claims",
        ],
      },
      proRedFlags: [
        "Cannot show proof of license or insurance",
        "Won't provide diagnostic findings before quoting repair",
        "Cash-only payment demand",
        "Pressure to replace when repair is reasonable",
        "Quote dramatically different from 2-3 other quotes (either too low or too high)",
        "Won't show you the failed part",
        "Demands full payment before completion",
      ],
      pricingNorms: `Most Erie specialty-repair pros charge $50-$150 diagnostic fee (applied to repair). Hourly rates run $80-$175. Common appliance repairs $150-$500; garage door spring replacement $150-$350; chimney sweep $150-$300; locksmith service $75-$200; handyman work $50-$150/hour. After-hours rates 1.5-2× standard.`,
      faq: [
        { q: `Should I get a second opinion?`, a: `For repairs over $500, yes. For routine repairs under $200, usually not worth the time. Many pros will provide quotes by photo for simple issues.` },
        { q: `What's a fair diagnostic fee?`, a: `$50-$150 is standard in Erie. Should be applied to the repair if you proceed. Free diagnostics are sometimes available as competitive promotions but rare.` },
        { q: `Should I tip the tech?`, a: `Not standard, but appreciated for unusual circumstances (after-hours, going above scope). $20-$50 is a generous gesture; never required.` },
        { q: `What if the repair doesn't last?`, a: `Most reputable pros offer 30-90 day labor warranty. If the same problem recurs in that window, the return visit should be free. Get this in writing.` },
        { q: `Can I supply my own parts?`, a: `Sometimes, with markup adjustment. Trade-off: pro-supplied parts come with their warranty; owner-supplied means you absorb part failures.` },
      ],
    };
  }

  // ── install-bigticket cluster ─────────────────────────────────
  if (matches(nicheSlug, ["solar", "pool-spa", "spa", "home-security", "alarm", "insulation"])) {
    return {
      intro: `Big-ticket installations involve multiple phases: assessment, design, permitting, install, and commissioning. Knowing the standard timeline helps you plan and verify quality.`,
      beforeAppointment: {
        title: "Before the appointment",
        description: "Research and prep make the assessment more productive.",
        bullets: [
          "Have utility bills (12 months) ready if relevant",
          "Note your goals (energy savings, security level, etc.)",
          "Identify any constraints (HOA, roof age, structural limits)",
          "Research tax credits and rebates that might apply",
          "Prepare questions about warranties, ongoing maintenance, and references",
        ],
      },
      atArrival: {
        title: "When the rep arrives",
        description: "Initial assessment is typically a 1-2 hour appointment.",
        bullets: [
          "Site assessment with measurements and inspection",
          "Discussion of your goals and constraints",
          "Review of available systems, materials, and options",
          "Initial pricing discussion (formal proposal usually within 1-2 weeks)",
          "Explanation of permitting, timeline, and warranty terms",
        ],
      },
      duringWork: {
        title: "During the project",
        description: "Major installs typically take 1-5 days of on-site work.",
        bullets: [
          "Material delivery and staging (usually 1-3 days before install)",
          "Permits posted and inspections scheduled",
          "Daily progress communication (especially multi-day projects)",
          "Protection of property during install (drop cloths, scaffolding, etc.)",
          "Walkthroughs at key milestones (rough-in, finish, final)",
        ],
      },
      afterCompletion: {
        title: "Wrapping up",
        description: "Commissioning, training, and documentation.",
        bullets: [
          "System commissioning and testing",
          "Training on operation and maintenance",
          "All warranty documentation in writing",
          "Final inspection and certificate of completion (if required)",
          "Follow-up schedule for ongoing maintenance",
        ],
      },
      proRedFlags: [
        "Pressure to sign quickly with limited-time discounts",
        "Quote significantly below market (often means under-spec'd system)",
        "Won't provide references from completed installs",
        "No NABCEP certification (solar) or industry equivalent",
        "Won't pull permits",
        "Demands large upfront payment (more than 25-30% before work begins)",
        "Subcontracted work without disclosure",
      ],
      pricingNorms: `In Erie: Solar $2.50-$4.00/watt installed (before tax credits); pool install $40k-$80k+ in-ground; security system $500-$5,000 install + $20-$60/month monitoring; whole-house insulation $1,500-$5,000. Tax credits and rebates often reduce net cost 25-40%. Permit costs are typically passed through.`,
      faq: [
        { q: `How many quotes should I get?`, a: `For installs over $5,000: minimum 3. Pricing varies 30-50% for the same scope, and quality varies more.` },
        { q: `What's the payment structure?`, a: `Typical: 10-30% deposit, 30-50% at mid-project milestones, balance at completion. Avoid contractors demanding more than 30% upfront on large projects.` },
        { q: `What about manufacturer warranties?`, a: `Verify warranty terms — typically: 25 years on solar panels, 10-15 years on inverters; 1-5 years on pool equipment; 1-3 years on security hardware; lifetime on most insulation materials.` },
        { q: `Are tax credits really worth it?`, a: `Yes. Federal solar credit is 30%. PA programs add more. Energy-efficiency credits available for insulation, windows, HVAC. Verify eligibility before signing.` },
        { q: `How long does the project take?`, a: `Solar: 1-3 days install + 1-2 months permitting/interconnect. Pool: 4-12 weeks. Security: 1-2 days. Insulation: 1-3 days. Permits and inspections extend timelines.` },
      ],
    };
  }

  // ── auto cluster ──────────────────────────────────────────────
  if (matches(nicheSlug, ["auto-repair", "auto-body", "mechanic", "towing"])) {
    const isTowing = matches(nicheSlug, ["towing"]);
    return {
      intro: `${isTowing ? "A tow call is a quick logistics interaction; the value is in the dispatcher and driver knowing what they're doing." : "An auto repair visit is typically drop-off, diagnostic, repair, and pickup. Knowing the flow helps you verify good work."}`,
      beforeAppointment: {
        title: "Before the appointment",
        description: isTowing
          ? "What to have ready when calling for a tow."
          : "A few minutes of prep saves shop time.",
        bullets: isTowing
          ? [
              "Your exact location (cross streets, mile markers, parking lot details)",
              "Vehicle details (make, model, year, license plate)",
              "Description of the problem",
              "Whether you have AAA, insurance roadside, or other coverage",
              "Where you want the vehicle towed",
            ]
          : [
              "Note when symptoms started and any patterns",
              "Bring all relevant maintenance records",
              "Have your insurance card if claim-related",
              "Know your warranty status",
              "Be ready to authorize diagnostic fees",
            ],
      },
      atArrival: {
        title: isTowing ? "When the tow arrives" : "When you drop off",
        description: isTowing
          ? "Standard tow procedure."
          : "Initial diagnostic and authorization.",
        bullets: isTowing
          ? [
              "Driver verification of vehicle, location, and destination",
              "Visual inspection before loading",
              "Documentation of existing damage with photos",
              "Loading procedure appropriate for the vehicle (flatbed vs. wheel lift)",
              "Authorization and payment method confirmation",
            ]
          : [
              "Service writer takes detailed symptom information",
              "Diagnostic fee disclosed and authorized",
              "Estimated time for diagnosis",
              "Loaner or transport options discussed if needed",
              "Communication method confirmed (call, text, email)",
            ],
      },
      duringWork: {
        title: isTowing ? "During the tow" : "While work happens",
        description: isTowing ? "Standard transport process." : "Standard repair process.",
        bullets: isTowing
          ? [
              "Driver maintains contact if you've requested updates",
              "Vehicle delivered to destination",
              "Final inspection at destination",
              "Documentation and signoff",
            ]
          : [
              "Diagnostic findings communicated before repair work",
              "Written estimate before authorization to proceed",
              "Communication when secondary problems are found",
              "Old parts retained for inspection if you request",
              "Estimated completion time confirmed",
            ],
      },
      afterCompletion: {
        title: isTowing ? "After the tow" : "Pickup and follow-up",
        description: isTowing ? "Documentation and payment." : "Final inspection and warranty.",
        bullets: isTowing
          ? [
              "Final inspection at destination",
              "Receipt with itemized charges",
              "Documentation for insurance if applicable",
              "Damage claim documentation if anything happened",
            ]
          : [
              "Test drive before pickup (especially for major repairs)",
              "Itemized invoice with parts and labor",
              "Warranty information (most repairs 90 days - 1 year)",
              "Old parts available for inspection",
              "Recommendations for future maintenance",
            ],
      },
      proRedFlags: isTowing
        ? [
            "No insurance or company info provided",
            "Refuses to inspect vehicle before loading",
            "Significantly above-market pricing on-site",
            "Won't take vehicle where you want",
            "Demands cash payment outside normal billing",
          ]
        : [
            "Diagnoses without explaining the diagnostic process",
            "Pushes for premium parts when standard is appropriate",
            "Won't show you the failed parts",
            "Pressure to authorize work without written estimate",
            "Quote dramatically lower than 2-3 other shops (often means under-scoping)",
            "Adds work without explicit authorization",
            "Won't provide warranty information",
          ],
      pricingNorms: isTowing
        ? `In Erie: Local tow $75-$150. After-hours, weekends, holidays 1.5-2×. Long-distance 2-3×. Heavy-duty tows for trucks 2-5×. AAA or roadside-coverage policies often cap or eliminate these costs.`
        : `Hourly labor rates in Erie: $90-$150 for independent shops, $120-$200 for dealerships. Diagnostic fees $80-$150 typically applied to repair if you proceed. Common services: brake job $250-$700; alternator $400-$800; transmission repair $1,000-$4,000.`,
      faq: isTowing
        ? [
            { q: `Should I tip the tow driver?`, a: `Common: $5-$10 for routine tow, $20+ for difficult situations. Never required.` },
            { q: `Who pays for the tow?`, a: `Depends on situation. Accident: insurance often pays. Breakdown: you (unless covered by roadside assistance). Police-ordered tow: you.` },
            { q: `Can I refuse the tow?`, a: `Sometimes, depending on location and circumstances. Police-ordered tows are not refusable. Voluntary tows you can decline if you find another solution.` },
            { q: `What if the driver damages my vehicle?`, a: `Document immediately with photos. Reputable companies have insurance; file through them. Don't sign delivery acknowledgment if damage occurred.` },
            { q: `How do I find a reputable tow company?`, a: `AAA-approved if you're a member. Insurance-approved if filing a claim. Local Google reviews otherwise. Avoid solicitations at accident scenes.` },
          ]
        : [
            { q: `Should I get a second opinion?`, a: `For repairs over $500, yes. Most independent shops do free or low-cost second opinions. The PA State Inspection program separates inspection from repair — useful for unbiased second opinions.` },
            { q: `What's a fair diagnostic fee?`, a: `$80-$150 in Erie, typically applied to repair if you proceed. Free diagnostics are sometimes promotional but uncommon for complex issues.` },
            { q: `Should I trust the check engine light?`, a: `Yes, but understand the urgency varies. Most auto parts stores read codes free. Steady light = fix soon; flashing light = stop driving when safe.` },
            { q: `What about extended warranties?`, a: `Math depends on car age and reliability. For premium brands at high mileage, often worth it. For mainstream brands under 80k miles, usually not.` },
            { q: `How do I find an honest mechanic?`, a: `ASE certification, BBB rating, willingness to show old parts, separate inspection-and-repair (PA program). Avoid shops that pressure quick decisions.` },
          ],
    };
  }

  // ── healthcare cluster ────────────────────────────────────────
  if (matches(nicheSlug, ["dental", "dentist", "chiropract", "veterinary", "vet", "dermatology", "optometry", "physical-therapy", "mental-health", "home-health", "senior-home", "hearing", "audiology"])) {
    const isDental = matches(nicheSlug, ["dental", "dentist"]);
    const isChiro = matches(nicheSlug, ["chiropract"]);
    const isVet = matches(nicheSlug, ["vet"]);
    return {
      intro: `A ${labelLower} visit follows a standard flow: intake, examination, diagnosis, and treatment plan. Knowing what's normal helps you ask the right questions.`,
      beforeAppointment: {
        title: "Before the appointment",
        description: "Prep makes the visit more productive.",
        bullets: isDental
          ? [
              "Brush and floss before the visit",
              "List any sensitivity, pain, or symptoms with timing",
              "Have insurance card and ID ready",
              "Note all medications you take",
              "Bring questions about treatment options",
            ]
          : isChiro
          ? [
              "Note when pain started and what triggers it",
              "Wear comfortable, easy-to-adjust clothing",
              "Bring any imaging (X-rays, MRIs) you have",
              "List medications and prior treatments",
              "Be ready for a movement evaluation",
            ]
          : isVet
          ? [
              "Note when symptoms started and any changes",
              "Bring a fresh stool or urine sample if requested",
              "Have vaccination records available",
              "List all medications and supplements",
              "Bring pet on leash or in carrier",
            ]
          : [
              "List your symptoms with timing and severity",
              "Have insurance and ID ready",
              "Note medications and supplements",
              "Bring questions written down",
              "Arrive a bit early for paperwork",
            ],
      },
      atArrival: {
        title: "When you arrive",
        description: "Intake and initial assessment.",
        bullets: isDental
          ? [
              "Check-in and insurance verification",
              "Hygienist or assistant gathers medical history",
              "X-rays if due (annually for adults typically)",
              "Cleaning if it's a routine visit",
              "Dentist exam after cleaning",
            ]
          : isChiro
          ? [
              "Intake forms or update of prior history",
              "Initial consultation with provider",
              "Physical examination including range of motion",
              "Imaging if needed (X-rays often in-office)",
              "Initial adjustment usually on first visit",
            ]
          : isVet
          ? [
              "Check-in and weight verification",
              "Tech gathers history and reason for visit",
              "Vet examination with vital signs",
              "Diagnostics if needed (bloodwork, X-rays, urinalysis)",
              "Treatment plan discussion",
            ]
          : [
              "Check-in and insurance verification",
              "Brief history and symptom review with intake staff",
              "Provider examination",
              "Discussion of findings and recommendations",
              "Treatment plan with options and pricing",
            ],
      },
      duringWork: {
        title: "During treatment",
        description: "What's standard during procedures.",
        bullets: isDental
          ? [
              "Numbing for any drilling or invasive work",
              "Explanation of what they're doing throughout",
              "Frequent check-ins about comfort",
              "Time estimates if running longer than expected",
              "Aftercare instructions during the procedure",
            ]
          : isChiro
          ? [
              "Adjustments with explanation of each technique",
              "Soft-tissue work as needed (massage, stretching)",
              "Patient feedback request after each adjustment",
              "Discussion of home-care exercises",
              "Treatment plan progression visit-to-visit",
            ]
          : isVet
          ? [
              "Procedures explained as performed",
              "Comfort care for the pet (warming, calm handling)",
              "Updates on diagnostics as they come in",
              "Discussion of options if multiple treatments available",
              "Discharge instructions during pickup",
            ]
          : [
              "Procedures explained before performed",
              "Comfort and consent checks throughout",
              "Updates on findings as they emerge",
              "Discussion of options for treatment",
              "Aftercare and follow-up instructions",
            ],
      },
      afterCompletion: {
        title: "Wrapping up",
        description: "Treatment plan, follow-up, and payment.",
        bullets: isDental
          ? [
              "Discussion of any treatment needed",
              "Quotes for major work",
              "Insurance coordination for major procedures",
              "Scheduling next cleaning",
              "Aftercare instructions in writing",
            ]
          : isChiro
          ? [
              "Treatment plan with visit frequency",
              "Home exercises and stretches",
              "Scheduling follow-up visits",
              "Insurance coordination",
              "Self-care instructions",
            ]
          : isVet
          ? [
              "Discharge instructions in writing",
              "Medications dispensed if needed",
              "Follow-up scheduling",
              "Costs explained and paid",
              "Records updated for future visits",
            ]
          : [
              "Treatment plan in writing",
              "Prescriptions or referrals",
              "Follow-up scheduling",
              "Insurance and payment processed",
              "Patient portal access for records",
            ],
      },
      proRedFlags: [
        "Pressure to commit to expensive treatment immediately",
        "Won't provide a written treatment plan",
        "Refuses to discuss alternatives",
        "Won't share imaging or records with another provider",
        "Significantly different recommendations from prior providers without explanation",
        "Bills significantly above prior visits without scope change",
        "Pressure to skip insurance and pay cash for 'discount'",
      ],
      pricingNorms: isDental
        ? `In Erie: Routine cleaning + exam $150-$300 (insurance often covers fully). Filling $150-$400. Crown $1,000-$1,800. Root canal $1,000-$1,700. Implant $3,000-$5,000.`
        : isChiro
        ? `In Erie: Initial visit $50-$150 (often with X-rays). Follow-up adjustments $30-$80. Most PA insurance covers 10-20 visits annually; some require referral.`
        : isVet
        ? `In Erie: Wellness visit $50-$100. Vaccinations $25-$80 each. Sick visit with bloodwork $200-$500. Surgery $500-$5,000+ depending on procedure.`
        : `In Erie: Office visit copay typically $20-$50 with insurance, $100-$300 without. Specialist visits 1.5-2× general practice.`,
      faq: [
        { q: `Should I get a second opinion?`, a: `Yes for any procedure over $1,500 or surgery. Yes if recommendations don't match prior provider's. Most providers will share records to support a second opinion.` },
        { q: `What if I can't afford recommended treatment?`, a: `Discuss alternatives, payment plans, and prioritization. ${isDental ? "Many dental schools offer reduced-cost services." : isVet ? "Many vet schools offer reduced-cost services. CareCredit is a healthcare financing option." : "Sliding-scale clinics and community health centers serve Erie."}` },
        { q: `Are payment plans available?`, a: `Most ${labelLower} offices offer in-house payment plans or third-party financing (CareCredit, Cherry, etc.). Ask before treatment.` },
        { q: `How do I switch providers?`, a: `Request records from current provider (they're legally required to share). Schedule new patient appointment with new provider. Most transitions are smooth.` },
        { q: `When should I go to ER vs. wait for an appointment?`, a: `ER for: airway compromise, severe bleeding, severe pain, suspected emergency conditions. Appointment for: persistent but stable symptoms, slow-progressing changes.` },
      ],
    };
  }

  // ── professional-services cluster ─────────────────────────────
  if (matches(nicheSlug, ["legal", "lawyer", "attorney", "accounting", "tax", "real-estate", "financial-advisor", "insurance-agent", "mortgage-broker", "property-management", "airbnb-property", "estate-sale", "funeral-home", "home-inspection"])) {
    const isLegal = matches(nicheSlug, ["legal", "lawyer", "attorney"]);
    const isAcct = matches(nicheSlug, ["accounting", "tax"]);
    const isRE = matches(nicheSlug, ["real-estate"]);
    return {
      intro: `A ${labelLower} engagement typically starts with consultation, scopes the work, and then proceeds through engagement. Knowing the flow helps you stay informed.`,
      beforeAppointment: {
        title: "Before the appointment",
        description: "Documentation makes the consultation productive.",
        bullets: isLegal
          ? [
              "Gather all relevant documents (contracts, correspondence, evidence)",
              "Write a timeline of events",
              "List your goals (best outcome, acceptable outcome, walk-away point)",
              "Note any deadlines you're aware of",
              "Have questions about fees, timeline, and process ready",
            ]
          : isAcct
          ? [
              "Bring prior 2-3 years of returns",
              "Have all current-year tax documents (W-2s, 1099s, receipts)",
              "List any major life events (marriage, divorce, home purchase, business changes)",
              "Identify any specific tax situations needing attention",
              "Bring banking and investment statements",
            ]
          : isRE
          ? [
              "Have property details (address, MLS number, purchase contract if applicable)",
              "Know your budget and financing pre-approval status",
              "List your must-haves vs. nice-to-haves",
              "Research neighborhoods and schools",
              "Have questions about process and timeline",
            ]
          : [
              "Gather all relevant documents",
              "Write down your goals and constraints",
              "List your questions",
              "Note any deadlines",
              "Have payment method ready for retainer if engaging",
            ],
      },
      atArrival: {
        title: "Initial consultation",
        description: "Usually 30-60 minutes for first meeting.",
        bullets: [
          "Introduction and understanding of your situation",
          "Review of documents you brought",
          "Discussion of options and approach",
          "Explanation of fees, billing, and timeline",
          "Decision about whether to engage",
        ],
      },
      duringWork: {
        title: "During the engagement",
        description: "What you should expect throughout the work.",
        bullets: [
          "Regular communication appropriate to the matter (weekly, milestone-based, or as-needed)",
          "Written updates for significant developments",
          "Itemized billing if hourly, milestone payments if flat-fee",
          "Documentation of all important decisions",
          "Notification before any unusual expenses or scope changes",
        ],
      },
      afterCompletion: {
        title: "Conclusion",
        description: "Wrap-up, payment, and ongoing access to records.",
        bullets: [
          "Final deliverables (documents, returns, transaction completion)",
          "Final invoice with itemization",
          "Records and documentation provided",
          "Discussion of any ongoing needs",
          "Access to portal or file storage for future reference",
        ],
      },
      proRedFlags: [
        "Won't provide written engagement letter or fee structure",
        "Pressure to commit quickly without time to review",
        "Vague answers about fees or timeline",
        "Cannot show licensing in good standing with PA professional board",
        "Conflict of interest not disclosed",
        "Requests for large upfront retainers without explanation",
        "Difficult to reach during the engagement",
      ],
      pricingNorms: isLegal
        ? `In Erie: Initial consultations $0-$300 (often free for personal injury, often paid for transactional). Hourly rates $150-$500 for most practices, $500-$1,000+ for specialized. Flat fees common for routine matters (will: $300-$800, simple LLC: $300-$600).`
        : isAcct
        ? `In Erie: Simple W-2 return $150-$300. Self-employed Schedule C $300-$600. Business returns $500-$2,500+. Bookkeeping $200-$1,000/month. Hourly $100-$300.`
        : isRE
        ? `Agent commissions typically 5-6% of sale price, split between buyer and seller agents. Closing costs 2-4% additional. Many fees negotiable; pricing models evolving.`
        : `Initial consultations $0-$300 depending on practice. Hourly $100-$500+ depending on specialization.`,
      faq: [
        { q: `What's a reasonable consultation fee?`, a: `Most professionals charge $0-$300 for initial consultations. Higher fees signal high-demand specialists; not paying often means limited time. Know what you're paying for before booking.` },
        { q: `Should I negotiate fees?`, a: `Yes, for substantial engagements. Hourly rates are less negotiable; flat fees, retainers, and scope are more so. Ask about alternative fee structures.` },
        { q: `What if I don't understand something?`, a: `Ask for explanations until you do. A good professional will explain repeatedly. If you feel rushed or dismissed, that's a red flag.` },
        { q: `When should I get a second opinion?`, a: `For any major decision, before signing substantial contracts, when recommendations don't match prior advisors, or when fees significantly exceed estimates. Pay for the second opinion — it's worth it.` },
        { q: `How do I find the right professional?`, a: `Specialization matters. A general practitioner is fine for routine work; for specialized matters, find someone whose practice focuses on your specific issue. PA bar and CPA society directories are useful starting points.` },
      ],
    };
  }

  // ── underground-structural cluster ────────────────────────────
  if (matches(nicheSlug, ["septic", "foundation", "basement-waterproof", "radon", "well-water"])) {
    const isSeptic = matches(nicheSlug, ["septic"]);
    return {
      intro: `${label} work involves assessment, often regulated inspection, and then remediation or installation. The standard flow helps you verify good work.`,
      beforeAppointment: {
        title: "Before the appointment",
        description: "Prep makes the assessment more productive.",
        bullets: isSeptic
          ? [
              "Locate your septic tank lids (look for risers or use a probe)",
              "Note when the tank was last pumped",
              "Document any symptoms (slow drains, odors, wet spots)",
              "Have the system as-built drawing if available",
              "Identify drain field area boundaries",
            ]
          : [
              "Document cracks with photos including date and measurement",
              "Note any water entry points and timing",
              "Have basement clear of stored items where possible",
              "Identify any prior repair work and documentation",
              "Note any recent ground or weather events that may correlate",
            ],
      },
      atArrival: {
        title: "When the pro arrives",
        description: "Initial assessment is usually 1-2 hours.",
        bullets: isSeptic
          ? [
              "Inspection of tank, baffles, and outlet",
              "Drain field walk and probing if accessible",
              "Discussion of symptoms and history",
              "Recommendations based on findings",
              "Written estimate for pumping or repair work",
            ]
          : [
              "Walk-around exterior of foundation",
              "Interior basement inspection",
              "Measurement of cracks and bowing if present",
              "Moisture and humidity readings",
              "Written assessment with recommendations and pricing",
            ],
      },
      duringWork: {
        title: "While work happens",
        description: "Standard practice for these projects.",
        bullets: isSeptic
          ? [
              "Tank pumping with vacuum truck (1-2 hours typically)",
              "Inspection of tank condition during pumping",
              "Documentation of tank capacity and condition",
              "Drain field assessment if relevant",
              "Communication about any concerns found",
            ]
          : [
              "Site protection (drop cloths, plastic sheeting)",
              "Excavation if needed (rare for interior systems)",
              "Installation of waterproofing, drainage, or repair systems",
              "Daily cleanup keeping basement accessible",
              "Photo documentation of work progress",
            ],
      },
      afterCompletion: {
        title: "Wrapping up",
        description: "Documentation and warranty.",
        bullets: isSeptic
          ? [
              "Pumping documentation for your records",
              "Recommendations for next service interval",
              "Discussion of any concerns found",
              "Invoice with detail of work performed",
              "Any required PA DEP documentation",
            ]
          : [
              "Final walkthrough showing completed work",
              "Warranty documentation in writing",
              "Photos before and after for your records",
              "Care instructions for the new system",
              "Permit and inspection documentation if applicable",
            ],
      },
      proRedFlags: [
        "Cannot show proof of insurance or PA HICPA registration",
        "No written estimate or scope before work",
        "Cash-only payment demand",
        "Significantly different price from 2-3 other quotes (these vary widely; be cautious)",
        "Pressure to commit immediately ('special pricing today only')",
        "Won't pull permits for work requiring them",
        "Demands full payment before completion",
      ],
      pricingNorms: isSeptic
        ? `In Erie: Pumping $300-$600 for typical residential. Inspection $300-$500. Drain field repair $1,500-$5,000. Drain field replacement $10,000-$30,000+. New system installation $15,000-$40,000+.`
        : `In Erie: Crack repair $200-$1,000. Interior waterproofing system $3,000-$10,000. Exterior waterproofing $10,000-$30,000. Wall stabilization (anchors, carbon fiber) $5,000-$15,000. Wall replacement $30,000-$80,000+.`,
      faq: [
        { q: `How long do these projects take?`, a: `${isSeptic ? "Pumping: 2-3 hours. Drain field repair: 1-3 days. New system installation: 3-7 days plus inspection." : "Crack repair: 1-2 days. Interior system install: 2-5 days. Exterior waterproofing: 5-10 days plus weather delays."}` },
        { q: `Should I get multiple quotes?`, a: `Always. These services have very wide pricing ranges; 2-3 quotes can save $1,000-$5,000+ on substantial work.` },
        { q: `What about insurance?`, a: `${isSeptic ? "Septic problems are generally considered maintenance and not covered by homeowner's insurance unless caused by a covered event." : "Foundation damage is almost always excluded from standard homeowner's policies. Endorsements available but expensive."}` },
        { q: `Do I need permits?`, a: `${isSeptic ? "New systems require PA DEP permits. Repairs sometimes do." : "Structural foundation work almost always requires Erie building permits. Waterproofing without structural work usually doesn't."}` },
        { q: `What's the warranty?`, a: `${isSeptic ? "Pumping doesn't carry warranty. Drain field installation typically 1-3 years. New systems 5-10 years." : "Workmanship warranties 5-25 years are common. Materials warranties separate (often lifetime on certain products)."}` },
      ],
    };
  }

  // ── niche-services cluster ────────────────────────────────────
  if (matches(nicheSlug, ["pest", "pet-grooming", "photograph", "moving", "demolition", "excavat", "bat-removal", "bee-wasp", "wildlife", "junk-removal", "dumpster", "general-contractor", "home-builder", "home-remodel", "boat-repair", "marine", "dock-install", "marina"])) {
    const isPest = matches(nicheSlug, ["pest"]);
    const isPet = matches(nicheSlug, ["pet-grooming"]);
    const isPhoto = matches(nicheSlug, ["photograph"]);
    const isMoving = matches(nicheSlug, ["moving"]);
    return {
      intro: isPest
        ? `A pest control visit follows a standard flow: inspection, treatment plan, application, and follow-up. Knowing the phases helps you verify effective service.`
        : isPet
        ? `A grooming appointment involves drop-off, the actual grooming, and pickup. Knowing what's standard helps you spot quality service.`
        : isPhoto
        ? `A photography engagement spans booking, the shoot day, and post-production delivery. Knowing each phase helps you set expectations.`
        : isMoving
        ? `A moving day follows a predictable sequence: arrival, inventory, packing/loading, transport, unloading, and signoff. Knowing the flow keeps you in control.`
        : `Demolition and excavation work involves assessment, permits, site prep, work execution, and final cleanup. Each phase has standard markers.`,
      beforeAppointment: {
        title: "Before the appointment",
        description: "Prep that makes the work go well.",
        bullets: isPest
          ? [
              "Note all sighting locations and frequencies",
              "Identify any kids, pets, or sensitivities in the household",
              "Have a clear access path to affected areas",
              "Note any prior treatments and what didn't work",
              "List specific questions about products being used",
            ]
          : isPet
          ? [
              "Ensure pet has had bathroom break before drop-off",
              "Bring any medications pet takes during grooming",
              "Confirm the style or service you want",
              "Mention any sensitivities, fears, or medical conditions",
              "Have updated vaccination records ready",
            ]
          : isPhoto
          ? [
              "Confirm shot list, locations, and timeline 1-2 weeks before",
              "Verify contract terms and any deliverables",
              "Plan outfits, props, and locations",
              "Coordinate with other vendors if event-based",
              "Have backup contact methods for day-of communication",
            ]
          : isMoving
          ? [
              "Pack as much as possible before move day (saves time and cost)",
              "Label all boxes by room",
              "Disassemble what you can",
              "Confirm move-in / move-out logistics with both properties",
              "Have payment ready and clear understanding of total cost",
            ]
          : [
              "Confirm permits are in place",
              "Verify utility marking (811) is done",
              "Clear access for equipment",
              "Coordinate with HOA, neighbors, or municipal authorities",
              "Have final scope and pricing in writing",
            ],
      },
      atArrival: {
        title: "When they arrive",
        description: "Initial check-in and setup.",
        bullets: isPest
          ? [
              "Introduction and inspection of property",
              "Discussion of findings and treatment plan",
              "Application of treatments with explanation",
              "Schedule for follow-up if needed",
              "Documentation of products used",
            ]
          : isPet
          ? [
              "Pet check-in with intake notes",
              "Discussion of services and any concerns",
              "Estimated pickup time",
              "Any extra services discussed",
              "Payment authorization or method confirmed",
            ]
          : isPhoto
          ? [
              "On-time arrival with all equipment",
              "Brief discussion of timeline and shot list",
              "Setup time built into schedule",
              "Backup equipment visible (signals professionalism)",
              "Coordination with you or event planner",
            ]
          : isMoving
          ? [
              "Crew arrival on-time with all equipment",
              "Walkthrough of property and inventory",
              "Confirmation of scope and pricing",
              "Protection of floors and doorways",
              "Start of packing or loading process",
            ]
          : [
              "Equipment delivery and staging",
              "Site walkthrough and safety briefing",
              "Confirmation of permits and inspections",
              "Final review of scope and timeline",
              "Property protection (fencing, signage, dust control)",
            ],
      },
      duringWork: {
        title: "While work happens",
        description: "What's standard during the work.",
        bullets: isPest
          ? [
              "Systematic treatment of identified problem areas",
              "Communication about anything unexpected",
              "Appropriate dwell time before re-entry (30-60 minutes typically)",
              "Documentation of treatments and locations",
              "Discussion of recurrence schedule",
            ]
          : isPet
          ? [
              "Careful handling and frequent rest breaks for nervous pets",
              "Communication if any issues come up (matting, skin issues)",
              "Photos at progress milestones (some salons share)",
              "Time-appropriate to the service (full groom: 1-3 hours)",
              "Final styling per your request",
            ]
          : isPhoto
          ? [
              "Direction and posing as needed",
              "Backup shots and angles",
              "Communication about timing and remaining shots",
              "Light adjustments as conditions change",
              "Brief image review with you when possible",
            ]
          : isMoving
          ? [
              "Careful handling and protection of items",
              "Communication when scope changes",
              "Inventory updates as items are loaded",
              "Reasonable break schedule for long days",
              "Updates on timeline if delays arise",
            ]
          : [
              "Adherence to permitted scope",
              "Daily cleanup and dust control",
              "Communication about hidden conditions or scope changes",
              "Inspector visits as required",
              "Photo documentation of progress",
            ],
      },
      afterCompletion: {
        title: "Wrapping up",
        description: "Final review and documentation.",
        bullets: isPest
          ? [
              "Review of areas treated",
              "Care and re-entry instructions",
              "Follow-up schedule if recurring service",
              "Documentation of products and applications",
              "Invoice with itemized treatment details",
            ]
          : isPet
          ? [
              "Pickup with brief discussion of grooming",
              "Notes on any concerns observed",
              "Care instructions for any sensitive areas",
              "Scheduling next appointment if regular client",
              "Invoice and payment processed",
            ]
          : isPhoto
          ? [
              "Brief review of shots captured",
              "Confirmation of delivery timeline",
              "Discussion of editing preferences",
              "Final payment if applicable",
              "Access to client gallery when delivered (typically 2-6 weeks for portraits, 6-12 weeks for weddings)",
            ]
          : isMoving
          ? [
              "Final walkthrough of empty origin",
              "Unload at destination with item placement",
              "Walkthrough of destination for damages or missing items",
              "Final invoice and payment",
              "Documentation for any claims",
            ]
          : [
              "Final inspection and signoff",
              "All equipment and debris removed",
              "Permit close-out and inspection documentation",
              "Final invoice with all costs itemized",
              "Photo documentation of completion",
            ],
      },
      proRedFlags: isPest
        ? [
            "Cannot show PA pesticide applicator license",
            "Won't disclose products being applied",
            "Pressure to sign long-term contracts immediately",
            "Vague answers about safety for kids/pets",
            "Cash-only payment requests",
          ]
        : isPet
        ? [
            "Won't show grooming area or let you visit before booking",
            "No vaccination policy enforced",
            "Cannot explain what went wrong if pet returns stressed or injured",
            "Refuses to discuss specific concerns",
            "Pricing changes significantly without scope changes",
          ]
        : isPhoto
        ? [
            "No written contract",
            "Demands full payment upfront",
            "Won't show full galleries from comparable past work",
            "Vague about delivery timeline",
            "No backup equipment or contingency plan",
            "Cannot show insurance documentation",
          ]
        : isMoving
        ? [
            "No written estimate before move day",
            "Quote changes significantly on move day",
            "Won't provide PA-required disclosures",
            "Cash demands or threats to hold belongings",
            "Cannot show PA Public Utility Commission registration",
            "Damage claims process unclear",
          ]
        : [
            "Cannot show proof of insurance or PA HICPA registration",
            "No permits when work clearly requires them",
            "Won't call 811 before excavation",
            "Asbestos / lead-paint testing skipped in pre-1980 buildings",
            "Pressure to skip inspections",
            "Cash-only demands",
          ],
      pricingNorms: isPest
        ? `In Erie: One-time treatment $100-$400. Quarterly preventive $35-$75. Termite treatment $1,000-$3,500. Bed bug treatment $1,000-$2,500.`
        : isPet
        ? `In Erie: Bath $25-$60. Full groom $50-$150 depending on breed and coat. Add-ons (de-shedding, teeth brushing, nail grinding) $5-$30 each. Mobile grooming 30-50% premium.`
        : isPhoto
        ? `In Erie: Headshots $150-$500. Family portraits $300-$800. Wedding photography $2,500-$7,500. Real estate listings $150-$500. Event photography $500-$2,500.`
        : isMoving
        ? `In Erie: Studio/1-bedroom local $300-$700. 2-3 bedroom local $700-$2,000. Long-distance $2,000-$8,000. Packing add-ons 20-30%.`
        : `In Erie: Interior demo $2,000-$10,000. Full residential demo $8,000-$25,000. Excavation $50-$200/cubic yard. Permit costs typically passed through.`,
      faq: isPest
        ? [
            { q: `How quickly will pests be gone?`, a: `Ants and roaches: usually within 7-14 days of treatment. Rodents: 30 days for full elimination. Bed bugs: 2-3 treatments over 4-6 weeks. Termites: ongoing treatment, results over months.` },
            { q: `Are treatments safe for kids and pets?`, a: `Modern professional products are safe when applied per label. Most require 30-60 minutes drying time before re-entry. Discuss specifically with your applicator.` },
            { q: `Do I need ongoing service?`, a: `Recommended for most Erie homes given the climate. Quarterly preventive ($35-$75 per visit) prevents major flare-ups.` },
            { q: `What about natural / green options?`, a: `Available from most reputable services. Less effective for established infestations; good for prevention.` },
            { q: `Should I leave during treatment?`, a: `For exterior or limited indoor treatment: not necessary. For whole-house treatment, fogging, or extensive interior work: typically 4 hours away with pets and kids.` },
          ]
        : isPet
        ? [
            { q: `How long should the appointment take?`, a: `Full groom for small dog: 1-2 hours. Medium dog: 2-3 hours. Large dog: 3-4 hours. Cats: 1-2 hours. Express service available for additional fee.` },
            { q: `Should I tip the groomer?`, a: `Common: 15-20% of service cost. More for unusual circumstances (large or matted dog, special handling needed).` },
            { q: `What if my pet has special needs?`, a: `Discuss before booking. Senior pets, anxious pets, and pets with medical conditions may need specialized groomers. Vet recommendations are often the best source.` },
            { q: `How often should pets be groomed?`, a: `Depends on breed and coat type. Short-coat: every 8-12 weeks. Medium: 4-8 weeks. Long-coat or special: 4-6 weeks.` },
            { q: `What about mobile grooming?`, a: `Premium of 30-50% but eliminates salon stress. Good for nervous pets, senior pets, multi-pet households.` },
          ]
        : isPhoto
        ? [
            { q: `When should I book?`, a: `Weddings: 6-12 months ahead. Senior portraits: 2-3 months. Family portraits: 4-6 weeks. Real estate: 2-7 days. Event: 1-3 months.` },
            { q: `What's the deposit / payment structure?`, a: `Typical: 25-50% deposit to reserve the date, balance due before or at the event. Wedding photographers may have payment plans.` },
            { q: `When will I get my photos?`, a: `Portraits: 2-6 weeks. Weddings: 6-12 weeks (sometimes 4 weeks for sneak peeks). Real estate: 24-48 hours. Events: 1-3 weeks.` },
            { q: `What about rights and usage?`, a: `Read the contract. Most photographers retain copyright but grant personal-use license. Commercial use, large prints, or social media may have separate terms.` },
            { q: `What if I don't like the photos?`, a: `Most photographers will discuss edits. Major dissatisfaction is rare with good vetting; contracts usually don't include re-shoots.` },
          ]
        : isMoving
        ? [
            { q: `How early should I book?`, a: `4-6 weeks for weekday moves in Erie. 8 weeks for weekends or month-end. Summer is busiest — book even earlier.` },
            { q: `Should I tip movers?`, a: `Common: $10-$20 per mover for a half-day move, $20-$50 for a full day. More for challenging conditions (stairs, heat, special items).` },
            { q: `What if items are damaged?`, a: `Document immediately with photos. File claim within carrier's window (typically 9 months for interstate). Full Value Protection coverage is worth the upgrade.` },
            { q: `What's the difference between binding and non-binding estimates?`, a: `Binding: price won't change unless scope changes. Non-binding: actual cost based on actual weight or time. Binding is safer for fixed budgets.` },
            { q: `Can I save by packing myself?`, a: `Yes — typically 20-30% of moving cost is packing labor. DIY packing is the best place to save.` },
          ]
        : [
            { q: `How long does demolition take?`, a: `Interior gut: 1-3 days. Full residential demo: 3-7 days. Excavation: 1-3 days. Permits and inspections extend timelines.` },
            { q: `What about disposal?`, a: `Included in most contractor quotes. Dumpster size determines cost. Hazmat (asbestos, lead) requires special disposal at additional cost.` },
            { q: `Do I need to be present?`, a: `For initial walkthrough and final inspection, yes. During work, depends on scope and trust.` },
            { q: `What about hidden conditions?`, a: `Asbestos in pre-1980 materials, lead paint, hidden utilities. Reputable contractors test before starting; surprises lead to change orders.` },
            { q: `Who pulls permits?`, a: `Contractor typically pulls and posts permits. Verify before work begins; missing permits affect insurance and resale.` },
          ],
    };
  }

  // Generic fallback covers all other niches
  return {
    intro: `What a ${labelLower} appointment actually looks like, from first contact to follow-up. Knowing what's normal makes it easier to spot what isn't.`,
    beforeAppointment: {
      title: "Before the appointment",
      description: "A few minutes of prep makes the visit faster and the quote more accurate.",
      bullets: [
        "Note when the issue started and any changes preceding it",
        "Take photos of the affected area or current state",
        "Clear physical access to the work area",
        "Have any relevant documents handy (warranty info, prior service receipts)",
        "List your questions in advance",
      ],
    },
    atArrival: {
      title: "When they arrive",
      description: "Most appointments start with introductions and an assessment.",
      bullets: [
        "Expect a brief introduction and credentials check on request",
        "Walkthrough or assessment of the issue or scope",
        "Diagnostic or consultation fee (often applied to the work if you proceed)",
        "Written estimate before substantial work begins",
        "Discussion of timeline, materials, and any decisions you need to make",
      ],
    },
    duringWork: {
      title: "While work happens",
      description: "Standard practice in Erie. Significant deviations are worth questioning.",
      bullets: [
        "Reasonable protection of your property (drop cloths, shoe covers, etc.)",
        "Communication if anything unexpected surfaces during the work",
        "Updated estimate if scope expands materially",
        "Documentation (photos) of anything they cover up or close",
        "Demonstration that the work is done correctly before they leave",
      ],
    },
    afterCompletion: {
      title: "Wrapping up",
      description: "Cleanup, paperwork, warranty, and your post-visit responsibilities.",
      bullets: [
        "Work area returned to reasonable condition",
        "Walkthrough of what was done and how it works",
        "Itemized invoice with parts and labor",
        "Warranty information in writing",
        "Recommendations for follow-up or preventive maintenance",
      ],
    },
    proRedFlags: [
      "Refuses to provide a written estimate before starting",
      "Cannot show proof of license or insurance",
      "Pushes for cash-only payment, especially on substantial work",
      "Pressures you to add unrelated services or upgrades",
      "Quote far below market — often means under-scoping",
      "Demands full payment before completion",
    ],
    pricingNorms: `Most Erie ${labelLower} providers charge an initial consultation or service fee ($50–$200 range, often applied to the work if you proceed). Quotes for substantial projects should be written, itemized, and include timeline, materials, and warranty terms. Get the price agreed in writing before work starts.`,
    faq: [
      { q: `How long should the appointment take?`, a: `Varies by scope. A simple assessment is typically 30–60 minutes. Repairs vary widely. If you were quoted a time and you're significantly past it without updates, ask for an explanation.` },
      { q: `Is a second opinion worth getting?`, a: `For non-urgent work over $1,000, almost always yes. Two or three quotes is standard due diligence. For urgent or emergency work, a second opinion is usually impractical — pick a reputable provider and verify scope as you go.` },
      { q: `What if I'm not satisfied with the work?`, a: `Discuss it with the provider first; most will return to address legitimate issues. If unresolved, your options include a chargeback (if paid by card), an online review, and — for licensed trades — a complaint to the Pennsylvania licensing board.` },
      { q: `Should I tip the ${labelLower} pro?`, a: `Not standard. For exceptional service or unusual circumstances, a modest tip is appreciated but never required. Many trade pros prefer a good online review.` },
      { q: `What documentation should I keep?`, a: `The estimate, the final invoice, any warranty information, and photos of the completed work. For substantial work, also keep records of permits and inspections (if applicable).` },
    ],
  };
}

// ── Helper ────────────────────────────────────────────────────────────

function matches(slug: string, patterns: string[]): boolean {
  const lower = slug.toLowerCase();
  return patterns.some((p) => lower.includes(p));
}
