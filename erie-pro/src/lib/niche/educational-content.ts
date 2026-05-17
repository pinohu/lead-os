// ── Educational Content Generator ─────────────────────────────────────
// Per-niche content for the /diy-vs-pro, /red-flags, and /what-to-expect
// pages. Uses slug-pattern matching to surface niche-relevant content with
// a generic fallback for unmatched niches.
//
// Pattern follows the permits page: small set of well-tested heuristics
// keyed on common slug substrings, generic safe defaults otherwise.

import { getNicheBySlug } from "@/lib/niches";
import { getNicheContent } from "@/lib/niche-content";

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
  if (matches(nicheSlug, ["plumb", "drain", "sewer", "septic"])) {
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

  if (matches(nicheSlug, ["electric", "wiring", "panel"])) {
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

  if (matches(nicheSlug, ["hvac", "heating", "cooling", "furnace"])) {
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

  if (matches(nicheSlug, ["restor", "flood", "mold", "water-damage", "fire"])) {
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

  if (matches(nicheSlug, ["plumb", "drain", "sewer", "septic"])) {
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

  if (matches(nicheSlug, ["electric", "wiring", "panel"])) {
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

  if (matches(nicheSlug, ["hvac", "heating", "cooling", "furnace"])) {
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

  if (matches(nicheSlug, ["restor", "flood", "mold", "water-damage", "fire"])) {
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
  if (matches(nicheSlug, ["plumb", "drain", "sewer"])) {
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
