// ────────────────────────────────────────────────────────────────────────────
// Niche Content System — erie.pro
// Provides all UI strings, labels, CTAs, descriptions, and structured content
// per niche. Replaces hardcoded strings throughout the app.
// ────────────────────────────────────────────────────────────────────────────

export interface NicheFaqItem {
  question: string;
  answer: string;
}

export interface NichePricingRange {
  service: string;
  range: string;
}

export interface LocalNicheContent {
  // Identity
  slug: string;
  label: string;
  pluralLabel: string;
  serviceLabel: string;

  // Hero
  heroHeadline: string;
  heroSubheadline: string;

  // SEO
  metaTitle: string;
  metaDescription: string;
  primaryKeywords: string[];
  secondaryKeywords: string[];

  // Content
  aboutDescription: string;
  commonServices: string[];
  faqItems: NicheFaqItem[];

  // Blog/Guide topics
  blogTopics: string[];
  guideTopics: string[];

  // Comparison data
  comparisonPoints: string[];

  // Trust signals
  certifications: string[];
  trustSignals: string[];

  // Pricing
  pricingRanges: NichePricingRange[];

  // Emergency/urgency
  emergencyServices: string[];
  seasonalTips: string[];

  // UI Labels
  ctaPrimary: string;
  ctaSecondary: string;
  quoteFormTitle: string;
  quoteFormDescription: string;
}

// ────────────────────────────────────────────────────────────────────────────
// All 12 niches with comprehensive Erie, PA specific content
// ────────────────────────────────────────────────────────────────────────────

export const NICHE_CONTENT: Record<string, LocalNicheContent> = {
  // ── Plumbing ─────────────────────────────────────────────────────────────
  plumbing: {
    slug: "plumbing",
    label: "Plumbing",
    pluralLabel: "Plumbers",
    serviceLabel: "plumbing services",

    heroHeadline: "Find the Best Plumber in Erie, PA",
    heroSubheadline:
      "Licensed plumbers serving Erie, Millcreek, Harborcreek, and surrounding communities. Get fast, reliable plumbing service with free estimates.",

    metaTitle: "Best Plumbers in Erie, PA — Licensed & Insured | erie.pro",
    metaDescription:
      "Find top-rated plumbers in Erie, PA. Emergency repairs, drain cleaning, water heater installation. Licensed, insured professionals with free quotes.",
    primaryKeywords: [
      "plumber erie pa",
      "plumbing services erie",
      "emergency plumber erie",
      "drain cleaning erie pa",
    ],
    secondaryKeywords: [
      "water heater repair erie",
      "sewer line repair erie pa",
      "bathroom remodel plumber erie",
      "frozen pipe repair erie",
      "plumber near me erie",
    ],

    aboutDescription:
      "Erie's harsh winters and aging housing stock make reliable plumbing essential. From frozen pipe emergencies during lake effect storms to sewer line repairs in older Millcreek neighborhoods, Erie homeowners need plumbers who understand local challenges. Pennsylvania requires all plumbers to hold a valid state license, ensuring the professionals on our platform meet rigorous standards.",

    commonServices: [
      "Emergency pipe repair and leak detection",
      "Drain cleaning and sewer line service",
      "Water heater installation and repair",
      "Bathroom and kitchen remodeling",
      "Frozen pipe thawing and prevention",
      "Sump pump installation and maintenance",
      "Water softener installation",
      "Gas line installation and repair",
    ],

    faqItems: [
      {
        question: "How much does a plumber cost in Erie, PA?",
        answer:
          "Most Erie plumbers charge $75 to $150 per hour for standard service calls. Emergency and after-hours rates typically run $150 to $250 per hour. A basic drain cleaning starts around $125, while a water heater replacement averages $1,200 to $2,500 depending on the unit type.",
      },
      {
        question: "What should I do if my pipes freeze in Erie?",
        answer:
          "Erie's lake effect winters make frozen pipes a common problem. First, turn off the main water supply. Then try gently warming the affected pipe with a hair dryer or space heater — never use an open flame. If you can't locate the freeze or if a pipe has already burst, call an emergency plumber immediately. Prevention is key: insulate pipes in unheated areas and keep cabinet doors open during extreme cold.",
      },
      {
        question: "Do plumbers in Pennsylvania need a license?",
        answer:
          "Yes. Pennsylvania requires plumbers to hold a valid license issued through the state or local municipality. In Erie County, plumbers must demonstrate experience, pass an exam, and carry liability insurance. Always verify a plumber's license before hiring — you can check through the PA Department of Labor & Industry.",
      },
      {
        question: "How often should I have my sewer line inspected?",
        answer:
          "For Erie homes, we recommend a sewer camera inspection every 2 to 3 years, especially for homes built before 1980. Older Erie neighborhoods often have clay or cast-iron sewer lines susceptible to tree root intrusion and deterioration. An inspection typically costs $150 to $400 and can prevent costly emergency repairs.",
      },
      {
        question: "Why is my water heater not producing enough hot water?",
        answer:
          "Common causes include a failing heating element, sediment buildup in the tank, a broken dip tube, or an undersized unit for your household. Erie's hard water accelerates sediment buildup, so annual flushing is recommended. If your water heater is over 10 years old, replacement is often more cost-effective than repeated repairs.",
      },
      {
        question: "Should I get a tankless water heater in Erie?",
        answer:
          "Tankless water heaters can work well in Erie, but there are considerations. The incoming water temperature in winter can drop to 35-40 degrees, requiring more energy to heat. A properly sized unit handles this fine, but installation costs run $3,000 to $5,500 — higher than traditional tanks. The energy savings typically offset the cost within 5 to 8 years.",
      },
      {
        question: "What is the best sump pump for an Erie basement?",
        answer:
          "Given Erie's heavy rainfall and snowmelt, we recommend a primary pump rated for at least 1/2 HP with a battery backup system. A combination setup runs $800 to $1,500 installed. Homes near Presque Isle Bay or in lower-lying areas of Millcreek may need a more robust system with dual pumps.",
      },
    ],

    blogTopics: [
      "How to Winterize Your Plumbing Before Erie's First Freeze",
      "5 Signs Your Water Heater Is Failing (Don't Wait for a Cold Shower)",
      "Erie's Hard Water Problem: What It Does to Your Pipes and How to Fix It",
      "Sump Pump Maintenance Checklist for Erie Homeowners",
      "Why Your Basement Floods Every Spring (And How to Stop It)",
      "Frozen Pipe Emergency: What to Do Before the Plumber Arrives",
      "Is Your Home's Main Sewer Line at Risk? Warning Signs for Erie Homes",
      "Tankless vs. Tank Water Heaters: Which Is Right for Erie's Climate?",
      "How to Choose a Licensed Plumber in Erie, PA",
      "The True Cost of Ignoring a Small Leak",
      "Kitchen Remodel Plumbing: What Erie Homeowners Need to Know",
      "Water Softener Guide for Erie's Municipal Water Supply",
    ],

    guideTopics: [
      "The Complete Guide to Hiring a Plumber in Erie, PA",
      "Erie Homeowner's Guide to Sewer Line Replacement",
      "Water Heater Buyer's Guide: Sizing, Types, and Costs for Erie Homes",
      "Basement Waterproofing Guide for Erie's Climate",
      "Understanding Erie's Plumbing Codes and Permit Requirements",
    ],

    comparisonPoints: [
      "Pennsylvania state plumbing license verification",
      "Liability insurance and workers' compensation coverage",
      "Emergency response time (especially during winter storms)",
      "Warranty on parts and labor",
      "Experience with older Erie-area homes",
      "Upfront pricing vs. hourly billing",
      "Online reviews and Better Business Bureau rating",
      "Availability for weekend and after-hours calls",
    ],

    certifications: [
      "Pennsylvania State Plumbing License",
      "EPA Lead-Safe Certified (for pre-1978 homes)",
      "Backflow Prevention Certification",
      "Natural Gas Line Certification",
      "OSHA Safety Certification",
    ],
    trustSignals: [
      "Licensed in Pennsylvania",
      "Fully insured",
      "Background checked",
      "Free estimates",
      "Emergency service available",
    ],

    pricingRanges: [
      { service: "Service call / diagnostic", range: "$75 – $150" },
      { service: "Drain cleaning", range: "$125 – $350" },
      { service: "Water heater replacement", range: "$1,200 – $2,500" },
      { service: "Sump pump installation", range: "$800 – $1,500" },
      { service: "Faucet replacement", range: "$150 – $350" },
      { service: "Sewer line repair", range: "$1,500 – $5,000" },
    ],

    emergencyServices: [
      "Burst pipe repair",
      "Frozen pipe thawing",
      "Sewer backup cleanup",
      "Gas leak detection",
      "No hot water restoration",
      "Flooding and water damage mitigation",
    ],

    seasonalTips: [
      "Fall: Insulate exposed pipes and disconnect outdoor hoses before the first freeze",
      "Winter: Keep thermostat above 55°F and open cabinet doors during sub-zero nights",
      "Spring: Test your sump pump before snowmelt and heavy rain season",
      "Summer: Schedule water heater maintenance during the off-season for faster service",
    ],

    ctaPrimary: "Get a Free Plumbing Quote",
    ctaSecondary: "Compare Erie Plumbers",
    quoteFormTitle: "Get Your Free Plumbing Quote",
    quoteFormDescription:
      "Tell us about your plumbing needs and we'll connect you with the best licensed plumber in Erie for the job.",
  },

  // ── HVAC ─────────────────────────────────────────────────────────────────
  hvac: {
    slug: "hvac",
    label: "HVAC",
    pluralLabel: "HVAC Technicians",
    serviceLabel: "heating and cooling services",

    heroHeadline: "Find the Best HVAC Service in Erie, PA",
    heroSubheadline:
      "Expert heating and cooling technicians for Erie's extreme weather. From furnace repairs in January to AC installations in July — get reliable HVAC service.",

    metaTitle: "Best HVAC Companies in Erie, PA — Heating & Cooling | erie.pro",
    metaDescription:
      "Find top HVAC contractors in Erie, PA. Furnace repair, AC installation, heat pumps. Licensed technicians, emergency service, free estimates.",
    primaryKeywords: [
      "hvac erie pa",
      "furnace repair erie",
      "ac installation erie pa",
      "heating and cooling erie",
    ],
    secondaryKeywords: [
      "heat pump erie pa",
      "ductwork repair erie",
      "hvac maintenance plan erie",
      "emergency furnace repair",
      "central air conditioning erie",
    ],

    aboutDescription:
      "Erie's climate demands a high-performance HVAC system. With winter temperatures regularly dropping below zero and lake effect snow creating extended cold snaps, your furnace is critical infrastructure. Erie summers also bring humid days in the 80s and 90s. Local HVAC professionals understand the unique demands of heating and cooling homes near Lake Erie, from proper humidity control to sizing systems for our climate zone.",

    commonServices: [
      "Furnace repair and replacement",
      "Central air conditioning installation",
      "Heat pump systems",
      "Ductwork design and repair",
      "Annual maintenance plans",
      "Indoor air quality systems",
      "Thermostat installation (smart and programmable)",
      "Boiler service and repair",
    ],

    faqItems: [
      {
        question: "How much does furnace replacement cost in Erie?",
        answer:
          "A new furnace in Erie typically costs $3,500 to $7,500 installed, depending on efficiency rating, brand, and home size. High-efficiency models (96%+ AFUE) cost more upfront but can save $300 to $500 per year on heating bills — significant given Erie's 6-month heating season.",
      },
      {
        question: "When should I replace my furnace?",
        answer:
          "Most furnaces last 15 to 20 years. If your furnace is over 15 years old, needs frequent repairs, or your heating bills are steadily climbing, it's time to consider replacement. Don't wait until mid-winter — schedule replacement in fall for the best availability and pricing from Erie HVAC companies.",
      },
      {
        question: "Are heat pumps effective in Erie's cold climate?",
        answer:
          "Modern cold-climate heat pumps work effectively down to -15°F, making them viable for Erie. However, most Erie HVAC professionals recommend a dual-fuel system: a heat pump paired with a gas furnace backup for the coldest days. This setup maximizes efficiency while ensuring comfort during extreme cold snaps.",
      },
      {
        question: "How often should I change my furnace filter in Erie?",
        answer:
          "During Erie's heating season (October through April), check your filter monthly and replace it every 1 to 3 months. Standard 1-inch filters need changing more frequently than 4-inch media filters. Pet owners and allergy sufferers should lean toward monthly replacement.",
      },
      {
        question: "What size AC unit do I need for my Erie home?",
        answer:
          "Erie homes generally need 1 ton of cooling capacity per 500 to 600 square feet. A 1,500 sq ft home typically needs a 2.5 to 3 ton unit. However, factors like insulation quality, window count, and sun exposure affect sizing. An HVAC professional should perform a Manual J load calculation for accurate sizing.",
      },
      {
        question: "Should I get an annual HVAC maintenance plan?",
        answer:
          "Yes, especially in Erie. An annual plan typically costs $150 to $300 and includes fall furnace tune-up and spring AC inspection. Maintenance extends equipment life, maintains warranty coverage, and catches small issues before they become emergency repairs during a blizzard.",
      },
    ],

    blogTopics: [
      "Preparing Your Furnace for Erie's Brutal Winters: A Pre-Season Checklist",
      "Heat Pump vs. Gas Furnace: What's Best for Erie Homes?",
      "Why Your Upstairs Is Always Hot and Your Basement Is Freezing",
      "The Real Cost of Running Your Furnace Through an Erie Winter",
      "Indoor Air Quality: How Erie's Lake Effect Impacts Your Home",
      "Smart Thermostats That Actually Save Money in Cold Climates",
      "Ductwork Problems You Can't See (But Definitely Feel)",
      "When to Repair vs. Replace Your Central Air Conditioner",
      "Understanding HVAC Efficiency Ratings: SEER, AFUE, and HSPF",
      "How Proper Insulation Reduces Your HVAC Costs in Erie",
      "Emergency Furnace Repair: What to Do When Your Heat Goes Out at 2 AM",
    ],

    guideTopics: [
      "The Complete Guide to Furnace Replacement in Erie, PA",
      "Erie Homeowner's Guide to Heat Pump Systems",
      "HVAC Maintenance Calendar for Erie's Four-Season Climate",
      "Energy Efficiency Upgrades That Pay for Themselves in Erie",
      "Understanding HVAC Warranties: What's Covered and What Isn't",
    ],

    comparisonPoints: [
      "EPA 608 certification and PA contractor license",
      "Emergency response time for no-heat calls",
      "Brand partnerships (Carrier, Trane, Lennox, etc.)",
      "Financing options for equipment replacement",
      "Annual maintenance plan inclusions and pricing",
      "Warranty on installation labor",
      "Experience with Erie's climate-specific challenges",
      "Energy audit and Manual J load calculation capability",
    ],

    certifications: [
      "EPA 608 Certification",
      "NATE Certification (North American Technician Excellence)",
      "PA Home Improvement Contractor Registration",
      "ENERGY STAR Partner",
      "Factory Authorized Dealer certification",
    ],
    trustSignals: [
      "NATE-certified technicians",
      "Fully insured",
      "24/7 emergency service",
      "Free in-home estimates",
      "Financing available",
    ],

    pricingRanges: [
      { service: "Furnace tune-up", range: "$80 – $150" },
      { service: "Furnace replacement", range: "$3,500 – $7,500" },
      { service: "AC installation (central)", range: "$4,000 – $8,000" },
      { service: "Heat pump system", range: "$5,000 – $10,000" },
      { service: "Ductwork repair", range: "$300 – $1,500" },
      { service: "Thermostat installation", range: "$150 – $400" },
    ],

    emergencyServices: [
      "No-heat emergency repair",
      "Furnace ignition failure",
      "Carbon monoxide alarm response",
      "Frozen heating system repair",
      "Gas smell investigation",
    ],

    seasonalTips: [
      "Fall: Schedule your furnace tune-up before the heating season rush in October",
      "Winter: Keep vents clear of furniture and snow away from exterior units",
      "Spring: Schedule AC maintenance and replace the filter before summer",
      "Summer: Set thermostat to 78°F when away to balance comfort and efficiency",
    ],

    ctaPrimary: "Get a Free HVAC Quote",
    ctaSecondary: "Compare HVAC Companies",
    quoteFormTitle: "Get Your Free HVAC Quote",
    quoteFormDescription:
      "Describe your heating or cooling needs and we'll connect you with a certified HVAC technician in Erie.",
  },

  // ── Electrical ───────────────────────────────────────────────────────────
  electrical: {
    slug: "electrical",
    label: "Electrical",
    pluralLabel: "Electricians",
    serviceLabel: "electrical services",

    heroHeadline: "Find the Best Electrician in Erie, PA",
    heroSubheadline:
      "Licensed electricians serving Erie County. Panel upgrades, rewiring, lighting, and emergency electrical repair with guaranteed workmanship.",

    metaTitle: "Best Electricians in Erie, PA — Licensed & Insured | erie.pro",
    metaDescription:
      "Find top-rated electricians in Erie, PA. Panel upgrades, rewiring, EV charger installation, and emergency repair. Licensed, insured, free estimates.",
    primaryKeywords: [
      "electrician erie pa",
      "electrical services erie",
      "panel upgrade erie pa",
      "emergency electrician erie",
    ],
    secondaryKeywords: [
      "ev charger installation erie",
      "rewiring old home erie pa",
      "generator installation erie",
      "lighting installation erie",
      "electrical inspection erie",
    ],

    aboutDescription:
      "Many Erie homes were built in the early-to-mid 1900s with electrical systems that can't handle modern demands. From knob-and-tube wiring in West Erie bungalows to overloaded panels in Millcreek ranches, local electricians understand the unique challenges of upgrading older Erie-area homes. Pennsylvania requires all electricians to be licensed, and Erie's municipal code enforces strict permitting for electrical work.",

    commonServices: [
      "Electrical panel upgrades (100A to 200A)",
      "Whole-home rewiring",
      "EV charger installation",
      "Generator installation and transfer switches",
      "Lighting design and installation",
      "Outlet and switch replacement (GFCI/AFCI)",
      "Ceiling fan installation",
      "Electrical safety inspections",
    ],

    faqItems: [
      {
        question: "How much does a panel upgrade cost in Erie?",
        answer:
          "Upgrading from a 100-amp to a 200-amp panel in Erie typically costs $1,800 to $3,500, depending on the complexity. If your home has an older fuse box, the cost may be higher due to additional wiring updates required to meet current Pennsylvania electrical code.",
      },
      {
        question: "Does my Erie home need rewiring?",
        answer:
          "If your home was built before 1960, it may have outdated wiring (knob-and-tube or aluminum). Signs you need rewiring include frequent breaker trips, flickering lights, warm outlets, and a burning smell near switches. Many pre-war homes in Erie's east and west side neighborhoods benefit from full or partial rewiring.",
      },
      {
        question: "Can I install a Level 2 EV charger at my Erie home?",
        answer:
          "Yes, but most Erie homes need a 240V circuit added and possibly a panel upgrade. A Level 2 charger installation typically costs $800 to $2,000 including the circuit. If your panel is at capacity, budget an additional $1,800 to $3,500 for a panel upgrade.",
      },
      {
        question: "Do I need a permit for electrical work in Erie?",
        answer:
          "Yes, Erie requires permits for most electrical work beyond simple fixture replacements. Panel upgrades, new circuits, rewiring, and generator installations all require permits and inspection. Your electrician should handle the permitting process — be cautious of any contractor who suggests skipping permits.",
      },
      {
        question: "Should I get a whole-home generator for my Erie house?",
        answer:
          "Given Erie's winter storms and occasional power outages from lake effect weather, a whole-home generator is a worthwhile investment for many homeowners. A standby generator with automatic transfer switch costs $5,000 to $15,000 installed. Portable generator setups with manual transfer switches start around $1,500.",
      },
      {
        question: "How do I know if my electrician is properly licensed?",
        answer:
          "Pennsylvania-licensed electricians carry a valid journeyman or master electrician license. Ask for the license number and verify it through Erie's Bureau of Building, Housing, and Zoning or the PA Department of Labor. Licensed electricians also carry liability insurance and workers' compensation coverage.",
      },
    ],

    blogTopics: [
      "Is Your Erie Home's Electrical Panel Ready for Modern Life?",
      "EV Charger Installation Guide for Erie Homeowners",
      "Whole-Home Generator: A Smart Investment for Erie's Storm Season",
      "Signs Your Home Has Dangerous Wiring (What to Look For)",
      "LED Lighting Upgrades That Slash Your Electric Bill",
      "Understanding GFCI and AFCI Protection in Your Home",
      "Outdoor Lighting Ideas for Erie's Short Winter Days",
      "How to Prepare Your Electrical System for a Home Addition",
      "Smart Home Wiring: What Erie Homeowners Need to Know",
      "The Hidden Dangers of DIY Electrical Work",
      "Surge Protection: Defending Your Electronics from Erie's Storms",
    ],

    guideTopics: [
      "The Complete Guide to Electrical Panel Upgrades in Erie",
      "Erie Homeowner's Guide to Whole-Home Rewiring",
      "Generator Buyer's Guide for Erie's Climate",
      "Understanding Electrical Permits and Inspections in Erie, PA",
      "EV Charger Installation: Everything Erie Drivers Need to Know",
    ],

    comparisonPoints: [
      "Pennsylvania electrician license (journeyman or master)",
      "Experience with older Erie-area homes and wiring",
      "Permit handling and inspection coordination",
      "Emergency response availability",
      "Warranty on workmanship",
      "Upfront written estimates",
      "Specializations (residential, commercial, industrial)",
      "Cleanup and job site respect",
    ],

    certifications: [
      "PA Master Electrician License",
      "PA Journeyman Electrician License",
      "OSHA 10 or 30 Hour Safety Certification",
      "Arc Flash Safety Certification",
      "EV Charger Installation Certification",
    ],
    trustSignals: [
      "PA-licensed electrician",
      "Fully insured",
      "Free written estimates",
      "Permit handling included",
      "Code-compliant work guaranteed",
    ],

    pricingRanges: [
      { service: "Service call / diagnostic", range: "$75 – $150" },
      { service: "Panel upgrade (200A)", range: "$1,800 – $3,500" },
      { service: "Whole-home rewiring", range: "$8,000 – $20,000" },
      { service: "EV charger installation", range: "$800 – $2,000" },
      { service: "Generator installation", range: "$5,000 – $15,000" },
      { service: "Ceiling fan installation", range: "$150 – $350" },
    ],

    emergencyServices: [
      "Power outage troubleshooting",
      "Burning smell from outlets or panel",
      "Sparking outlets or switches",
      "Exposed wiring hazards",
      "Circuit breaker won't reset",
    ],

    seasonalTips: [
      "Fall: Test your generator and stock up on fuel before winter storms",
      "Winter: Avoid overloading circuits with space heaters — they draw 1,500 watts each",
      "Spring: Schedule an electrical inspection before starting home renovation projects",
      "Summer: Install outdoor GFCI outlets for seasonal activities and pool equipment",
    ],

    ctaPrimary: "Get a Free Electrical Quote",
    ctaSecondary: "Compare Erie Electricians",
    quoteFormTitle: "Get Your Free Electrical Quote",
    quoteFormDescription:
      "Describe your electrical project and we'll connect you with a licensed electrician in Erie.",
  },

  // ── Roofing ──────────────────────────────────────────────────────────────
  roofing: {
    slug: "roofing",
    label: "Roofing",
    pluralLabel: "Roofers",
    serviceLabel: "roofing services",

    heroHeadline: "Find the Best Roofer in Erie, PA",
    heroSubheadline:
      "Erie's lake effect snow demands a tough roof. Find licensed roofing contractors for repairs, replacements, and storm damage restoration.",

    metaTitle: "Best Roofing Companies in Erie, PA — Free Estimates | erie.pro",
    metaDescription:
      "Find trusted roofers in Erie, PA. Roof repair, replacement, storm damage, and gutter installation. Licensed contractors with free inspections.",
    primaryKeywords: [
      "roofing erie pa",
      "roof repair erie",
      "roof replacement erie pa",
      "roofer near me erie",
    ],
    secondaryKeywords: [
      "storm damage roof repair erie",
      "ice dam removal erie pa",
      "gutter installation erie",
      "metal roofing erie pa",
      "shingle replacement erie",
    ],

    aboutDescription:
      "Erie consistently ranks among the snowiest cities in America, receiving over 100 inches of lake effect snow annually. This punishing weather tests every roof. Ice dams, heavy snow loads, and freeze-thaw cycles create unique challenges that Erie roofers address daily. Local contractors understand which materials and techniques stand up to Lake Erie's climate and can navigate insurance claims for storm damage efficiently.",

    commonServices: [
      "Roof replacement (asphalt, metal, flat)",
      "Emergency storm damage repair",
      "Ice dam removal and prevention",
      "Gutter installation and repair",
      "Roof inspection and maintenance",
      "Skylight installation and repair",
      "Attic ventilation improvement",
      "Insurance claim assistance",
    ],

    faqItems: [
      {
        question: "How much does a new roof cost in Erie, PA?",
        answer:
          "A full roof replacement in Erie ranges from $8,000 to $18,000 for an average-sized home (1,500 to 2,500 sq ft). Architectural shingles run $350 to $500 per square (100 sq ft), while metal roofing costs $600 to $1,200 per square. Erie's steep roof pitches and snow-related requirements can add 10 to 20% compared to national averages.",
      },
      {
        question: "What roofing material is best for Erie's weather?",
        answer:
          "Impact-resistant architectural shingles (Class 3 or 4) are the most popular choice for Erie homes. They handle ice, wind, and heavy snow well. Metal roofing is gaining popularity due to its superior snow-shedding ability and 50+ year lifespan, though it costs more upfront. Avoid 3-tab shingles — they don't hold up well to Erie's freeze-thaw cycles.",
      },
      {
        question: "How do I prevent ice dams on my Erie roof?",
        answer:
          "Ice dams form when heat escapes through your roof, melting snow that refreezes at the eaves. Prevention involves proper attic insulation (R-49 minimum for Erie's climate zone), adequate soffit and ridge ventilation, and ice-and-water shield membrane along the eaves. An Erie roofer can assess your specific situation and recommend the most effective solution.",
      },
      {
        question: "Will my homeowner's insurance cover storm damage?",
        answer:
          "Most Erie homeowner's policies cover sudden storm damage including wind, hail, and fallen trees. However, they typically won't cover damage from deferred maintenance. A reputable Erie roofer can inspect your roof, document storm damage, and help you file a successful insurance claim. Be wary of storm chasers who pressure you into signing contracts immediately.",
      },
      {
        question: "How long does a roof last in Erie?",
        answer:
          "Due to Erie's harsh climate, roofing materials may not reach their maximum rated lifespan. Architectural shingles typically last 20 to 25 years (vs. 30 years in milder climates), 3-tab shingles last 12 to 18 years, and metal roofing lasts 40 to 60 years. Proper ventilation and maintenance can extend your roof's life significantly.",
      },
      {
        question: "How do I know if my roof needs replacing vs. repair?",
        answer:
          "If your roof has widespread granule loss, multiple leaks, sagging decking, or is over 20 years old, replacement is usually more cost-effective. Isolated damage from a single storm or a few missing shingles can typically be repaired. A professional inspection (usually free from Erie roofers) will give you an honest assessment.",
      },
    ],

    blogTopics: [
      "How Erie's Lake Effect Snow Destroys Roofs (And How to Protect Yours)",
      "Ice Dam Prevention: The Erie Homeowner's Complete Guide",
      "Metal Roofing in Erie: Is It Worth the Investment?",
      "What to Do After a Windstorm Damages Your Roof",
      "How to Choose Between Roof Repair and Replacement",
      "Gutter Guards: Do They Really Work in Heavy Snow?",
      "Attic Ventilation: The Hidden Key to a Longer-Lasting Roof",
      "How to Spot a Storm Chaser Scam After Severe Weather",
      "Erie Insurance Claims for Roof Damage: A Step-by-Step Guide",
      "The Best Time of Year to Replace Your Roof in Erie",
      "Roof Maintenance Checklist for Every Season",
    ],

    guideTopics: [
      "The Complete Guide to Roof Replacement in Erie, PA",
      "Erie Homeowner's Guide to Insurance Claims for Roof Damage",
      "Roofing Materials Comparison for Lake Erie's Climate",
      "Understanding Roof Ventilation for Erie's Snow Country",
      "Gutter Installation and Maintenance Guide for Erie Homes",
    ],

    comparisonPoints: [
      "PA Home Improvement Contractor registration",
      "Manufacturer certifications (GAF, CertainTeed, Owens Corning)",
      "Insurance claim handling experience",
      "Workmanship warranty length and terms",
      "Experience with Erie's climate-specific challenges",
      "Crew size and project timeline estimates",
      "Material quality and brand options offered",
      "Cleanup and debris removal process",
    ],

    certifications: [
      "PA Home Improvement Contractor Registration",
      "GAF Master Elite Contractor",
      "CertainTeed SELECT ShingleMaster",
      "Owens Corning Preferred Contractor",
      "OSHA Fall Protection Certification",
    ],
    trustSignals: [
      "PA-registered contractor",
      "Fully insured",
      "Manufacturer-certified",
      "Free roof inspections",
      "Written warranty included",
    ],

    pricingRanges: [
      { service: "Roof inspection", range: "Free – $250" },
      { service: "Shingle repair (small area)", range: "$300 – $800" },
      { service: "Full roof replacement (shingle)", range: "$8,000 – $15,000" },
      { service: "Metal roof installation", range: "$12,000 – $25,000" },
      { service: "Gutter installation", range: "$1,000 – $3,000" },
      { service: "Ice dam removal", range: "$400 – $1,500" },
    ],

    emergencyServices: [
      "Storm damage tarping and repair",
      "Fallen tree branch removal from roof",
      "Active leak emergency repair",
      "Ice dam water intrusion mitigation",
      "Wind damage shingle repair",
    ],

    seasonalTips: [
      "Fall: Clean gutters and schedule a roof inspection before winter",
      "Winter: Use a roof rake to remove heavy snow accumulation (never go on a snow-covered roof)",
      "Spring: Check for winter damage — missing shingles, flashing issues, gutter damage",
      "Summer: Schedule roof replacement during the peak season for best weather conditions",
    ],

    ctaPrimary: "Get a Free Roof Estimate",
    ctaSecondary: "Compare Erie Roofers",
    quoteFormTitle: "Get Your Free Roofing Estimate",
    quoteFormDescription:
      "Describe your roofing needs — repair, replacement, or inspection — and we'll connect you with a qualified Erie roofer.",
  },

  // ── Landscaping ──────────────────────────────────────────────────────────
  landscaping: {
    slug: "landscaping",
    label: "Landscaping",
    pluralLabel: "Landscapers",
    serviceLabel: "landscaping services",

    heroHeadline: "Find the Best Landscaper in Erie, PA",
    heroSubheadline:
      "Professional lawn care and landscape design for Erie's unique growing conditions. From spring cleanups to snow removal, find your perfect landscaper.",

    metaTitle: "Best Landscapers in Erie, PA — Lawn Care & Design | erie.pro",
    metaDescription:
      "Find professional landscapers in Erie, PA. Lawn care, landscape design, hardscaping, seasonal cleanup, and snow removal. Free estimates.",
    primaryKeywords: [
      "landscaper erie pa",
      "lawn care erie",
      "landscape design erie pa",
      "landscaping services erie",
    ],
    secondaryKeywords: [
      "hardscaping erie pa",
      "snow removal erie",
      "lawn mowing erie",
      "patio installation erie pa",
      "tree service erie",
    ],

    aboutDescription:
      "Erie's USDA Zone 6a climate, combined with lake effect moisture, creates both opportunities and challenges for landscaping. The growing season runs from mid-May through October, with abundant rainfall supporting lush lawns and gardens. Erie landscapers work year-round — lawn care and hardscaping in the warm months, leaf cleanup in fall, and snow removal through winter. The best local landscapers understand Erie's clay-heavy soils, native plant options, and drainage considerations.",

    commonServices: [
      "Lawn mowing and maintenance programs",
      "Landscape design and installation",
      "Patio and walkway hardscaping",
      "Spring and fall cleanup",
      "Mulching and garden bed maintenance",
      "Tree and shrub trimming",
      "Snow plowing and removal",
      "Irrigation system installation",
    ],

    faqItems: [
      {
        question: "How much does lawn mowing cost in Erie?",
        answer:
          "Weekly lawn mowing in Erie typically costs $35 to $75 per visit for an average-sized residential lot (1/4 to 1/2 acre). Full-season contracts running April through October offer better per-cut rates, averaging $30 to $60 per visit. Most Erie landscapers offer package deals that include trimming, edging, and blowing.",
      },
      {
        question: "When should I start spring cleanup in Erie?",
        answer:
          "Erie's spring can be unpredictable. Generally, plan for spring cleanup in late March to mid-April, once the snow has melted and the ground begins to dry. Don't walk on soggy lawns — this compacts Erie's clay soil. Schedule aeration and overseeding for late April or May when soil temperatures reach 50 to 55 degrees.",
      },
      {
        question: "What grass type grows best in Erie?",
        answer:
          "Cool-season grasses thrive in Erie. Kentucky Bluegrass is the most popular choice for its rich color and density. Tall Fescue offers better drought tolerance and works well in partial shade. For shady areas under mature trees, Fine Fescue blends perform well. A mix of these varieties provides the most resilient lawn for Erie's conditions.",
      },
      {
        question: "Do I need a retaining wall for my Erie property?",
        answer:
          "Many Erie properties, especially in hilly areas of Millcreek and Summit Township, benefit from retaining walls for erosion control. If your yard has slopes greater than 3:1, a retaining wall helps manage Erie's heavy rainfall and snowmelt. Natural stone walls start around $20 to $40 per square foot; engineered block walls cost $15 to $30 per square foot.",
      },
      {
        question: "How often should I fertilize my Erie lawn?",
        answer:
          "For Erie's climate, we recommend 4 applications: early spring (April), late spring (May), early fall (September), and late fall (November). The fall applications are the most important — they help grass recover from summer stress and build root reserves for Erie's harsh winter. Avoid heavy nitrogen in summer when heat stress can damage lawns.",
      },
      {
        question: "What hardscaping projects work best in Erie?",
        answer:
          "Patios with proper drainage are popular, as are fire pits for extending outdoor season into cool Erie evenings. Permeable pavers help manage stormwater — important given Erie's rainfall. Any hardscaping project needs a proper base (typically 6 to 8 inches of compacted gravel) to handle freeze-thaw cycles without heaving.",
      },
    ],

    blogTopics: [
      "Erie Lawn Care Calendar: Month-by-Month Guide for a Perfect Lawn",
      "Dealing with Erie's Clay Soil: Lawn and Garden Tips",
      "Hardscaping Ideas That Survive Erie's Freeze-Thaw Cycles",
      "Native Plants That Thrive in Erie's Lake Effect Climate",
      "Fall Lawn Care: How to Prepare Your Yard for Erie's Winter",
      "Snow Removal Services: What to Expect and What to Pay",
      "Patio Design Ideas for Short-Season Outdoor Living",
      "Spring Cleanup Checklist After a Harsh Erie Winter",
      "Drought-Tolerant Landscaping for Erie's Summer Dry Spells",
      "How to Fix a Lawn Destroyed by Winter Salt and Snow",
    ],

    guideTopics: [
      "The Complete Guide to Lawn Care in Erie's Climate",
      "Hardscaping Buyer's Guide for Erie Homeowners",
      "Erie Homeowner's Guide to Landscape Design on a Budget",
      "Year-Round Property Maintenance Guide for Erie",
      "Choosing a Snow Removal Service in Erie, PA",
    ],

    comparisonPoints: [
      "Full-season service vs. per-visit billing",
      "Snow removal included in annual contract",
      "Insurance and liability coverage",
      "Equipment quality and crew size",
      "Design consultation included",
      "Hardscaping warranty and references",
      "Organic and sustainable practice options",
      "Communication and reliability track record",
    ],

    certifications: [
      "PA Pesticide Applicator License (for chemical lawn treatments)",
      "Interlocking Concrete Pavement Institute Certification",
      "ISA Certified Arborist (for tree services)",
      "Landscape Industry Certified Technician",
    ],
    trustSignals: [
      "Fully insured",
      "Free estimates",
      "Reliable scheduling",
      "Local Erie crews",
      "Year-round service available",
    ],

    pricingRanges: [
      { service: "Weekly lawn mowing (per visit)", range: "$35 – $75" },
      { service: "Spring / fall cleanup", range: "$200 – $500" },
      { service: "Mulch installation (per yard)", range: "$75 – $100" },
      { service: "Patio installation (per sq ft)", range: "$15 – $40" },
      { service: "Full landscape design", range: "$1,500 – $10,000" },
      { service: "Snow plowing (per visit)", range: "$50 – $150" },
    ],

    emergencyServices: [
      "Storm damage tree removal",
      "Emergency snow plowing",
      "Flooding and drainage issues",
    ],

    seasonalTips: [
      "Fall: Aerate and overseed in September; schedule leaf removal for October/November",
      "Winter: Apply salt sparingly — excess damages lawns and landscaping near walkways",
      "Spring: Wait for the ground to dry before walking on or working the lawn",
      "Summer: Water deeply but infrequently (1 inch per week) during dry spells",
    ],

    ctaPrimary: "Get a Free Landscaping Quote",
    ctaSecondary: "Compare Erie Landscapers",
    quoteFormTitle: "Get Your Free Landscaping Quote",
    quoteFormDescription:
      "Tell us about your landscaping project and we'll connect you with the best landscaper in Erie for the job.",
  },

  // ── Dental ───────────────────────────────────────────────────────────────
  dental: {
    slug: "dental",
    label: "Dental",
    pluralLabel: "Dentists",
    serviceLabel: "dental care",

    heroHeadline: "Find the Best Dentist in Erie, PA",
    heroSubheadline:
      "Top-rated general and cosmetic dentists serving Erie, Millcreek, and surrounding communities. Accepting new patients with flexible scheduling.",

    metaTitle: "Best Dentists in Erie, PA — Family & Cosmetic Dentistry | erie.pro",
    metaDescription:
      "Find trusted dentists in Erie, PA. Family dentistry, cosmetic procedures, orthodontics, emergency dental care. Accepting new patients, insurance-friendly.",
    primaryKeywords: [
      "dentist erie pa",
      "dental care erie",
      "family dentist erie pa",
      "cosmetic dentist erie",
    ],
    secondaryKeywords: [
      "orthodontist erie pa",
      "dental implants erie",
      "teeth whitening erie pa",
      "emergency dentist erie",
      "pediatric dentist erie pa",
    ],

    aboutDescription:
      "Finding a great dentist in Erie means finding someone who understands our community's needs — from family-friendly practices that see patients of all ages to specialists in cosmetic and restorative dentistry. Erie dentists are known for their personable, patient-first approach, and many offices offer flexible payment plans alongside traditional insurance. Whether you need a routine cleaning or a complex procedure, Erie has excellent dental professionals ready to help.",

    commonServices: [
      "Routine cleanings and preventive care",
      "Cosmetic dentistry (veneers, whitening, bonding)",
      "Dental implants and bridges",
      "Orthodontics (braces and Invisalign)",
      "Root canals and endodontic treatment",
      "Pediatric dentistry",
      "Oral surgery and extractions",
      "Emergency dental care",
    ],

    faqItems: [
      {
        question: "How much does a dental cleaning cost in Erie without insurance?",
        answer:
          "A routine dental cleaning in Erie typically costs $100 to $200 without insurance. Many Erie dental offices offer new patient specials that include a cleaning, exam, and X-rays for $99 to $150. Some practices also offer in-house membership plans at $200 to $400 per year that cover preventive care and provide discounts on other services.",
      },
      {
        question: "How do I find a dentist accepting new patients in Erie?",
        answer:
          "Erie has a strong dental community with practices regularly accepting new patients. Through erie.pro, you can compare dentists by specialty, insurance acceptance, location, and patient reviews. Offices in Millcreek and the Peach Street corridor tend to have the most availability for new patient appointments.",
      },
      {
        question: "How much do dental implants cost in Erie?",
        answer:
          "A single dental implant in Erie ranges from $3,000 to $5,500, including the implant, abutment, and crown. Full-mouth reconstruction with implants runs $20,000 to $45,000. Several Erie dental offices offer financing through CareCredit or in-house payment plans to make implants more accessible.",
      },
      {
        question: "What should I look for in a pediatric dentist in Erie?",
        answer:
          "Look for a dentist with specific pediatric training (residency in pediatric dentistry), a child-friendly office environment, and experience with children's behavioral management. Erie has several dedicated pediatric practices and many family dentists who excel with young patients. Ask about their approach to anxious children and their policy on parents in the treatment room.",
      },
      {
        question: "Is Invisalign available from Erie dentists?",
        answer:
          "Yes, many Erie general dentists and orthodontists are certified Invisalign providers. Treatment costs $3,500 to $6,500 depending on complexity. Traditional braces remain slightly less expensive at $3,000 to $5,500. Most Erie orthodontic offices offer free consultations to discuss which option is best for your situation.",
      },
      {
        question: "What constitutes a dental emergency?",
        answer:
          "A dental emergency includes severe toothache, a knocked-out or cracked tooth, uncontrollable bleeding, jaw injury, or significant swelling. Several Erie dental offices offer same-day emergency appointments during business hours. For after-hours emergencies, UPMC Hamot and Saint Vincent Hospital both have emergency departments that can address acute dental issues.",
      },
    ],

    blogTopics: [
      "How to Choose the Right Dentist for Your Family in Erie",
      "What to Expect During Your First Visit to a New Erie Dentist",
      "Dental Insurance vs. Membership Plans: Which Saves You More?",
      "Teeth Whitening Options: In-Office vs. At-Home Kits",
      "The Truth About Dental Implants: Are They Worth the Investment?",
      "How Fluoride in Erie's Water Affects Your Dental Health",
      "Teaching Kids Good Dental Habits: Tips from Erie Pediatric Dentists",
      "Cosmetic Dentistry Options to Improve Your Smile",
      "What to Do in a Dental Emergency (Before You Get to the Office)",
      "How to Manage Dental Anxiety: Sedation Options in Erie",
    ],

    guideTopics: [
      "The Complete Guide to Finding a Dentist in Erie, PA",
      "Dental Implant Guide: Costs, Process, and Recovery",
      "Invisalign vs. Traditional Braces: A Complete Comparison",
      "Understanding Dental Insurance in Pennsylvania",
      "Erie Parent's Guide to Children's Dental Health",
    ],

    comparisonPoints: [
      "Insurance plans accepted",
      "Emergency appointment availability",
      "Sedation dentistry options",
      "Technology (digital X-rays, 3D imaging, same-day crowns)",
      "New patient specials and pricing transparency",
      "Office hours (evening and weekend availability)",
      "Patient reviews and satisfaction ratings",
      "Specialization and continuing education",
    ],

    certifications: [
      "PA State Dental License",
      "ADA (American Dental Association) Member",
      "Board Certified Specialist (for specialists)",
      "Invisalign Certified Provider",
      "AAFE Certified in Facial Aesthetics",
    ],
    trustSignals: [
      "PA-licensed dentist",
      "Accepting new patients",
      "Insurance accepted",
      "Flexible payment plans",
      "Modern technology and sterilization",
    ],

    pricingRanges: [
      { service: "Dental cleaning (no insurance)", range: "$100 – $200" },
      { service: "Dental exam and X-rays", range: "$150 – $300" },
      { service: "Tooth filling", range: "$150 – $400" },
      { service: "Dental crown", range: "$800 – $1,500" },
      { service: "Dental implant (single)", range: "$3,000 – $5,500" },
      { service: "Teeth whitening (in-office)", range: "$300 – $600" },
    ],

    emergencyServices: [
      "Severe toothache or abscess",
      "Knocked-out or broken tooth",
      "Lost crown or filling",
      "Jaw injury or swelling",
    ],

    seasonalTips: [
      "January: Use your new dental insurance benefits — schedule cleanings early",
      "Spring: Sports season — get a custom mouthguard for student athletes",
      "Summer: Schedule major dental work when kids are out of school",
      "December: Use remaining insurance benefits before they reset January 1",
    ],

    ctaPrimary: "Find a Dentist Near You",
    ctaSecondary: "Compare Erie Dentists",
    quoteFormTitle: "Request a Dental Appointment",
    quoteFormDescription:
      "Tell us what you need and we'll connect you with the right Erie dentist for your situation.",
  },

  // ── Legal ────────────────────────────────────────────────────────────────
  legal: {
    slug: "legal",
    label: "Legal",
    pluralLabel: "Attorneys",
    serviceLabel: "legal services",

    heroHeadline: "Find the Best Attorney in Erie, PA",
    heroSubheadline:
      "Experienced attorneys in personal injury, family law, criminal defense, and more. Get a free consultation from a qualified Erie lawyer.",

    metaTitle: "Best Lawyers in Erie, PA — Free Consultations | erie.pro",
    metaDescription:
      "Find experienced attorneys in Erie, PA. Personal injury, family law, criminal defense, estate planning. Free consultations, proven results.",
    primaryKeywords: [
      "lawyer erie pa",
      "attorney erie pa",
      "law firm erie",
      "personal injury lawyer erie",
    ],
    secondaryKeywords: [
      "family law attorney erie pa",
      "criminal defense lawyer erie",
      "estate planning attorney erie pa",
      "divorce lawyer erie",
      "dui attorney erie pa",
    ],

    aboutDescription:
      "Erie's legal community includes experienced attorneys across all major practice areas. From personal injury cases on I-90 and I-79 to family law matters in Erie County Court of Common Pleas, local attorneys understand the courts, the judges, and the community. Many Erie attorneys offer free initial consultations, and several firms work on contingency for personal injury cases, meaning no fees unless you win.",

    commonServices: [
      "Personal injury and accident claims",
      "Family law (divorce, custody, support)",
      "Criminal defense",
      "Estate planning and wills",
      "Real estate closings",
      "DUI and traffic defense",
      "Workers' compensation",
      "Business law and formation",
    ],

    faqItems: [
      {
        question: "How much does a lawyer cost in Erie, PA?",
        answer:
          "Legal fees in Erie vary widely by practice area. Personal injury attorneys typically work on contingency (25 to 40% of your settlement). Family law attorneys charge $200 to $350 per hour. Criminal defense retainers start at $2,500 to $10,000 depending on charge severity. Estate planning documents (will, power of attorney, living will) cost $500 to $2,000 as a flat fee.",
      },
      {
        question: "Do I need a lawyer for a car accident in Erie?",
        answer:
          "If you were injured in a car accident, consulting an attorney is strongly recommended. Pennsylvania's choice no-fault system and complex insurance rules can significantly affect your recovery. Erie personal injury attorneys offer free consultations and work on contingency, so there's no upfront cost to explore your options.",
      },
      {
        question: "How do I file for divorce in Erie County?",
        answer:
          "Divorce in Pennsylvania can be no-fault (mutual consent after 90 days, or after 1 year of separation) or fault-based. You file a Complaint in Divorce at the Erie County Court of Common Pleas. While uncontested divorces can sometimes be handled without an attorney ($300 to $500 in filing fees), contested divorces with property, custody, or support issues almost always require legal representation.",
      },
      {
        question: "What should I do if I'm charged with a DUI in Erie?",
        answer:
          "Contact a criminal defense attorney immediately — ideally before your preliminary hearing. Pennsylvania DUI penalties are tiered based on BAC level and prior offenses. A first-offense general impairment DUI can mean probation, while higher tiers carry mandatory jail time. An experienced Erie DUI attorney may be able to negotiate reduced charges or alternative sentencing.",
      },
      {
        question: "Do I need a will in Pennsylvania?",
        answer:
          "Yes. Without a will, Pennsylvania's intestacy laws determine who receives your assets, which may not match your wishes. If you have minor children, a will is essential for naming a guardian. A basic will package from an Erie estate planning attorney costs $500 to $1,500 and provides invaluable peace of mind.",
      },
      {
        question: "How do I find the right attorney for my case?",
        answer:
          "Start by identifying your legal need (personal injury, family law, criminal defense, etc.), then compare attorneys who specialize in that area. Check their experience, case results, and client reviews. Most Erie attorneys offer free initial consultations, so meeting with 2 to 3 lawyers before deciding costs nothing and helps you find the best fit.",
      },
    ],

    blogTopics: [
      "What to Do After a Car Accident on I-90 or I-79",
      "Understanding Pennsylvania's Divorce Process: A Timeline",
      "DUI in Pennsylvania: Penalties, Defenses, and What to Expect",
      "Do I Need an Estate Plan? (Hint: Yes, and Here's Why)",
      "Workers' Comp in Erie: Your Rights After a Workplace Injury",
      "Child Custody in Pennsylvania: How Courts Decide",
      "Slip and Fall Accidents: When Is a Property Owner Liable?",
      "Starting a Business in Erie: LLC vs. Corporation",
      "Understanding Pennsylvania's Statute of Limitations for Lawsuits",
      "How to Choose Between a Solo Practitioner and a Law Firm",
    ],

    guideTopics: [
      "The Complete Guide to Personal Injury Claims in Erie, PA",
      "Erie Resident's Guide to Divorce and Family Law",
      "Estate Planning Essentials for Erie Families",
      "Understanding Criminal Defense in Erie County",
      "Small Business Legal Guide for Erie Entrepreneurs",
    ],

    comparisonPoints: [
      "Practice area specialization and case experience",
      "Fee structure (contingency, hourly, flat fee)",
      "Free initial consultation offered",
      "Case results and settlement track record",
      "Client reviews and peer recognition",
      "Accessibility and communication style",
      "Office location and meeting flexibility",
      "Bar association standing and disciplinary history",
    ],

    certifications: [
      "PA Bar Association Member",
      "Erie County Bar Association Member",
      "Board Certified Legal Specialist (if applicable)",
      "Super Lawyers or Best Lawyers recognition",
      "AV Preeminent Martindale-Hubbell rating",
    ],
    trustSignals: [
      "PA Bar-licensed attorney",
      "Free consultations",
      "Proven case results",
      "Contingency fee available",
      "Local Erie courtroom experience",
    ],

    pricingRanges: [
      { service: "Initial consultation", range: "Free – $250" },
      { service: "Personal injury (contingency)", range: "25% – 40% of award" },
      { service: "Family law (hourly)", range: "$200 – $350/hour" },
      { service: "Criminal defense retainer", range: "$2,500 – $10,000" },
      { service: "Estate plan (will package)", range: "$500 – $2,000" },
      { service: "Real estate closing", range: "$500 – $1,500" },
    ],

    emergencyServices: [
      "Criminal arrest and arraignment",
      "Protection from abuse (PFA) orders",
      "Emergency custody hearings",
      "Accident and injury consultation",
    ],

    seasonalTips: [
      "January: Review and update your estate plan at the start of each year",
      "Spring: Busy season for real estate closings — book your attorney early",
      "Summer: Review custody arrangements before the school year changes",
      "Winter: Icy road accidents increase — know your rights if you're injured",
    ],

    ctaPrimary: "Get a Free Legal Consultation",
    ctaSecondary: "Compare Erie Attorneys",
    quoteFormTitle: "Request a Free Legal Consultation",
    quoteFormDescription:
      "Briefly describe your legal situation and we'll connect you with an experienced Erie attorney.",
  },

  // ── Cleaning ─────────────────────────────────────────────────────────────
  cleaning: {
    slug: "cleaning",
    label: "Cleaning",
    pluralLabel: "Cleaning Services",
    serviceLabel: "cleaning services",

    heroHeadline: "Find the Best Cleaning Service in Erie, PA",
    heroSubheadline:
      "Professional house cleaning and commercial janitorial services in Erie. Trusted, background-checked cleaners with flexible scheduling.",

    metaTitle: "Best Cleaning Services in Erie, PA — House & Commercial | erie.pro",
    metaDescription:
      "Find reliable cleaning services in Erie, PA. House cleaning, deep cleaning, move-in/out, commercial janitorial. Background-checked, insured, free quotes.",
    primaryKeywords: [
      "cleaning service erie pa",
      "house cleaning erie",
      "maid service erie pa",
      "commercial cleaning erie",
    ],
    secondaryKeywords: [
      "deep cleaning erie pa",
      "move out cleaning erie",
      "office cleaning erie",
      "carpet cleaning erie pa",
      "janitorial service erie",
    ],

    aboutDescription:
      "Erie homeowners and businesses rely on professional cleaning services to maintain healthy, comfortable spaces. Whether it's a weekly house cleaning, a deep clean after Erie's muddy spring season, or commercial janitorial services for offices along Peach Street, local cleaning professionals deliver reliable, thorough service. Background-checked and insured cleaning teams give you peace of mind while keeping your space spotless.",

    commonServices: [
      "Regular house cleaning (weekly, biweekly, monthly)",
      "Deep cleaning and sanitization",
      "Move-in and move-out cleaning",
      "Commercial and office cleaning",
      "Carpet and upholstery cleaning",
      "Post-construction cleanup",
      "Window cleaning (interior and exterior)",
      "Seasonal deep cleaning",
    ],

    faqItems: [
      {
        question: "How much does house cleaning cost in Erie?",
        answer:
          "Regular house cleaning in Erie costs $120 to $250 per visit for a standard 3-bedroom home. Deep cleaning runs $200 to $400. Biweekly service is most popular and often comes with a lower per-visit rate than one-time cleanings. Most Erie cleaning services price based on home size, condition, and cleaning frequency.",
      },
      {
        question: "What's included in a standard cleaning?",
        answer:
          "A standard cleaning typically includes dusting, vacuuming, mopping, bathroom sanitization, kitchen cleaning (counters, sink, appliance exteriors), and trash removal. Deep cleaning adds baseboards, inside cabinets, window sills, ceiling fans, and detailed scrubbing. Always confirm the scope with your cleaning service upfront.",
      },
      {
        question: "Are cleaning services in Erie insured?",
        answer:
          "Reputable Erie cleaning services carry general liability insurance and bonding. This protects you if anything is damaged or stolen during a cleaning. Always ask for proof of insurance before hiring. The cleaners listed on erie.pro are verified for insurance coverage.",
      },
      {
        question: "How do I prepare my home for a cleaning service?",
        answer:
          "Pick up clutter, personal items, and valuables before your cleaner arrives. This allows them to focus on actual cleaning rather than tidying. Put away items on counters if you want them cleaned underneath. Communicate any special instructions or focus areas — good cleaning services appreciate clear direction.",
      },
      {
        question: "Should I provide cleaning supplies?",
        answer:
          "Most professional cleaning services in Erie bring their own supplies and equipment. If you prefer specific products (eco-friendly, fragrance-free, or particular brands), let your service know in advance — many will accommodate preferences. Some offer green cleaning at no additional charge.",
      },
      {
        question: "How often should I schedule cleaning?",
        answer:
          "For most Erie households, biweekly cleaning strikes the best balance of cleanliness and cost. Families with kids or pets may prefer weekly service. Monthly cleaning works for smaller households or as a supplement to regular tidying. Erie's muddy spring and salt-tracked winter may warrant extra sessions during these seasons.",
      },
    ],

    blogTopics: [
      "How to Choose a Reliable Cleaning Service in Erie",
      "Deep Cleaning Checklist for Every Room in Your Home",
      "Spring Cleaning After Erie's Long Winter: A Complete Guide",
      "Green Cleaning: Eco-Friendly Options for Erie Homes",
      "How Often Should You Really Clean Everything in Your House?",
      "Move-Out Cleaning Tips to Get Your Full Security Deposit Back",
      "Tackling Salt Stains and Winter Grime in Your Erie Home",
      "The Benefits of Professional Carpet Cleaning",
      "Commercial Cleaning: What Erie Business Owners Should Know",
      "Allergy Season Cleaning Tips for Erie Residents",
    ],

    guideTopics: [
      "The Complete Guide to Hiring a Cleaning Service in Erie",
      "Erie Homeowner's Deep Cleaning Guide: Room-by-Room",
      "Commercial Cleaning Standards for Erie Businesses",
      "Move-In/Move-Out Cleaning Guide for Erie Renters",
      "Seasonal Cleaning Calendar for Erie's Climate",
    ],

    comparisonPoints: [
      "Background checks and employee screening",
      "Insurance and bonding coverage",
      "Cleaning product quality and eco-friendliness",
      "Satisfaction guarantee policy",
      "Scheduling flexibility and cancellation policy",
      "Consistency (same cleaner each visit)",
      "Online booking and payment options",
      "Communication and reliability track record",
    ],

    certifications: [
      "ISSA Certification (Cleaning Industry Management Standard)",
      "Green Seal Certified",
      "OSHA Bloodborne Pathogen Training",
      "Carpet and Rug Institute Seal of Approval",
    ],
    trustSignals: [
      "Background checked",
      "Fully insured and bonded",
      "Satisfaction guaranteed",
      "Eco-friendly options",
      "Flexible scheduling",
    ],

    pricingRanges: [
      { service: "Standard cleaning (3 BR)", range: "$120 – $250" },
      { service: "Deep cleaning (3 BR)", range: "$200 – $400" },
      { service: "Move-out cleaning", range: "$250 – $500" },
      { service: "Carpet cleaning (per room)", range: "$50 – $100" },
      { service: "Office cleaning (monthly)", range: "$300 – $800" },
      { service: "Window cleaning (whole home)", range: "$150 – $350" },
    ],

    emergencyServices: [],

    seasonalTips: [
      "Spring: Schedule a deep clean to clear winter's dust, salt, and grime",
      "Summer: Focus on windows and outdoor-accessible areas while the weather is nice",
      "Fall: Deep clean before the holidays and winter shutdown",
      "Winter: Add entryway and mudroom cleaning to tackle salt and slush",
    ],

    ctaPrimary: "Get a Free Cleaning Quote",
    ctaSecondary: "Compare Cleaning Services",
    quoteFormTitle: "Get Your Free Cleaning Quote",
    quoteFormDescription:
      "Tell us about your space and cleaning needs — we'll connect you with a trusted Erie cleaning service.",
  },

  // ── Auto Repair ──────────────────────────────────────────────────────────
  "auto-repair": {
    slug: "auto-repair",
    label: "Auto Repair",
    pluralLabel: "Auto Repair Shops",
    serviceLabel: "auto repair services",

    heroHeadline: "Find the Best Auto Repair Shop in Erie, PA",
    heroSubheadline:
      "Trusted mechanics for all makes and models. From oil changes to engine rebuilds, find a reliable auto repair shop in Erie.",

    metaTitle: "Best Auto Repair Shops in Erie, PA — Mechanics | erie.pro",
    metaDescription:
      "Find trusted auto repair shops in Erie, PA. Oil changes, brakes, engine repair, transmission, diagnostics. ASE-certified mechanics, fair pricing.",
    primaryKeywords: [
      "auto repair erie pa",
      "mechanic erie pa",
      "car repair erie",
      "brake repair erie pa",
    ],
    secondaryKeywords: [
      "transmission repair erie",
      "oil change erie pa",
      "auto body shop erie",
      "tire shop erie pa",
      "engine repair erie",
    ],

    aboutDescription:
      "Erie's roads take a toll on vehicles. Potholes from freeze-thaw cycles, road salt corrosion, and harsh winter driving conditions mean Erie drivers need mechanics who understand local challenges. From the experienced shops along West 12th Street to newer facilities on Peach Street, Erie's auto repair community offers honest, skilled service for every make and model.",

    commonServices: [
      "Oil changes and fluid services",
      "Brake inspection and repair",
      "Engine diagnostics and repair",
      "Transmission service and repair",
      "Tire sales, rotation, and alignment",
      "Exhaust and emission systems",
      "Electrical system diagnostics",
      "Pre-purchase vehicle inspections",
    ],

    faqItems: [
      {
        question: "How much does an oil change cost in Erie?",
        answer:
          "Conventional oil changes in Erie run $30 to $50, while synthetic oil changes cost $60 to $100. Many Erie shops offer oil change specials that include a tire rotation and multi-point inspection. Given Erie's stop-and-go driving and cold starts in winter, follow your manufacturer's recommended interval — typically every 5,000 to 7,500 miles for synthetic.",
      },
      {
        question: "How do I find an honest mechanic in Erie?",
        answer:
          "Look for ASE-certified mechanics, check online reviews (Google, BBB), and ask for written estimates before authorizing work. A trustworthy Erie shop will explain the problem clearly, show you the worn parts, and never pressure you into unnecessary repairs. Word of mouth from friends and family remains one of the best ways to find reliable mechanics in Erie.",
      },
      {
        question: "Does Erie's road salt damage my car?",
        answer:
          "Yes, significantly. Erie's heavy road salt use accelerates undercarriage corrosion, damages brake lines, and deteriorates exhaust systems. We recommend undercarriage washes every 2 to 3 weeks during winter and an annual undercoating or rust-proofing treatment. Many Erie auto shops offer seasonal rust-proofing packages for $100 to $300.",
      },
      {
        question: "How often do I need a PA state inspection?",
        answer:
          "Pennsylvania requires annual safety inspection and emissions testing. Your inspection is due by the last day of the month shown on your sticker. Erie shops charge $30 to $60 for inspection plus $35 for emissions testing. Schedule your inspection early in the month — if it fails, you have time to make repairs and re-test.",
      },
      {
        question: "How do I know if my brakes need replacing?",
        answer:
          "Warning signs include squealing or grinding noise when braking, a pulsating brake pedal, longer stopping distances, or the brake warning light on your dashboard. Erie's hilly terrain and winter driving put extra stress on brakes. Most brake pads last 30,000 to 70,000 miles depending on driving habits. A brake inspection at an Erie shop typically costs $0 to $50.",
      },
      {
        question: "Should I go to a dealer or an independent shop?",
        answer:
          "Independent Erie shops typically charge 20 to 40% less than dealerships for the same work. For routine maintenance (oil changes, brakes, tires), independent shops are usually the best value. For warranty work, recalls, or complex computer programming, the dealer may be necessary. Many independent Erie shops use the same diagnostic tools and OEM-quality parts as dealers.",
      },
    ],

    blogTopics: [
      "Protecting Your Car from Erie's Road Salt: A Complete Guide",
      "Pennsylvania State Inspection: What They Check and How to Prepare",
      "Winter Tire Guide for Erie Drivers: When and What to Buy",
      "5 Warning Signs Your Transmission Is Failing",
      "How to Extend Your Car's Life in Erie's Harsh Climate",
      "Dealer vs. Independent Mechanic: Where Should You Go?",
      "Understanding Your Check Engine Light: Common Causes",
      "Pre-Winter Car Maintenance Checklist for Erie",
      "How to Handle a Pothole-Damaged Tire or Rim",
      "Essential Emergency Kit for Erie Winter Driving",
    ],

    guideTopics: [
      "The Complete Guide to Finding a Mechanic in Erie, PA",
      "Erie Driver's Guide to Winter Vehicle Maintenance",
      "Understanding PA State Inspection and Emissions Requirements",
      "New vs. Used Tires in Erie: What You Need to Know",
      "Rust Prevention and Treatment for Erie Vehicles",
    ],

    comparisonPoints: [
      "ASE certifications held by mechanics",
      "Warranty on parts and labor",
      "Specialization (domestic, import, diesel, hybrid)",
      "Pricing transparency and written estimates",
      "Parts quality (OEM, aftermarket, or both)",
      "Turnaround time for common repairs",
      "Loaner vehicle or shuttle service availability",
      "Online reviews and reputation",
    ],

    certifications: [
      "ASE (Automotive Service Excellence) Certification",
      "PA State Inspection Station License",
      "PA Emission Inspection Station License",
      "AAA Approved Auto Repair",
      "I-CAR Certification (for collision repair)",
    ],
    trustSignals: [
      "ASE-certified mechanics",
      "Written estimates",
      "Parts warranty included",
      "PA inspection station",
      "Fair and transparent pricing",
    ],

    pricingRanges: [
      { service: "Oil change (synthetic)", range: "$60 – $100" },
      { service: "Brake pad replacement (per axle)", range: "$200 – $400" },
      { service: "PA state inspection + emissions", range: "$65 – $95" },
      { service: "Tire rotation and balance", range: "$40 – $80" },
      { service: "Engine diagnostic", range: "$80 – $150" },
      { service: "Transmission service", range: "$150 – $400" },
    ],

    emergencyServices: [
      "Towing and roadside assistance coordination",
      "Emergency brake repair",
      "Overheating and coolant system repair",
      "Battery jump-start and replacement",
    ],

    seasonalTips: [
      "Fall: Switch to winter tires before the first snow and check antifreeze levels",
      "Winter: Wash your undercarriage regularly to remove road salt buildup",
      "Spring: Get an alignment check — Erie's potholes wreak havoc on suspension",
      "Summer: Check your AC system and have your cooling system inspected",
    ],

    ctaPrimary: "Get a Free Auto Repair Quote",
    ctaSecondary: "Compare Erie Mechanics",
    quoteFormTitle: "Get Your Free Auto Repair Quote",
    quoteFormDescription:
      "Describe the issue with your vehicle and we'll connect you with a trusted Erie mechanic.",
  },

  // ── Pest Control ─────────────────────────────────────────────────────────
  "pest-control": {
    slug: "pest-control",
    label: "Pest Control",
    pluralLabel: "Pest Control Companies",
    serviceLabel: "pest control services",

    heroHeadline: "Find the Best Pest Control in Erie, PA",
    heroSubheadline:
      "Professional extermination and prevention for Erie homes and businesses. Rodents, insects, termites, and wildlife — handled safely and effectively.",

    metaTitle: "Best Pest Control in Erie, PA — Extermination & Prevention | erie.pro",
    metaDescription:
      "Find trusted pest control companies in Erie, PA. Rodent removal, termite treatment, bed bug elimination, wildlife control. Licensed, safe, effective.",
    primaryKeywords: [
      "pest control erie pa",
      "exterminator erie",
      "rodent control erie pa",
      "termite treatment erie",
    ],
    secondaryKeywords: [
      "bed bug treatment erie pa",
      "ant control erie",
      "mouse exterminator erie",
      "wildlife removal erie pa",
      "mosquito control erie",
    ],

    aboutDescription:
      "Erie's location near Lake Erie and its older housing stock create unique pest challenges. Cold winters drive rodents indoors, while humid summers bring ant infestations and mosquitoes. Older homes in Erie's urban core are susceptible to termite damage. Professional pest control companies in Erie understand local pest patterns and use integrated pest management (IPM) strategies that are effective and environmentally responsible.",

    commonServices: [
      "Rodent control and exclusion",
      "Termite inspection and treatment",
      "Bed bug heat treatment and elimination",
      "Ant and roach control",
      "Mosquito and tick yard treatment",
      "Wildlife removal (raccoons, squirrels, bats)",
      "Preventive pest management plans",
      "Commercial pest control",
    ],

    faqItems: [
      {
        question: "How much does pest control cost in Erie?",
        answer:
          "A one-time pest treatment in Erie typically costs $150 to $400 depending on the pest type and infestation severity. Annual pest prevention plans run $300 to $600 per year with quarterly treatments. Termite treatment costs $500 to $2,500 depending on the method and area treated. Bed bug heat treatment ranges from $1,000 to $3,000 for a whole home.",
      },
      {
        question: "What pests are most common in Erie homes?",
        answer:
          "Erie's most common household pests include mice (especially in fall and winter), carpenter ants, pavement ants, spiders, stink bugs, and wasps. Termites are present in Erie but less common than in warmer climates. Bed bugs can occur in any Erie neighborhood regardless of cleanliness. Mosquitoes are a summer concern, especially near Presque Isle and bayfront areas.",
      },
      {
        question: "Are pest control chemicals safe for my family and pets?",
        answer:
          "Licensed Erie pest control companies use EPA-registered products applied by trained technicians at safe concentrations. Many offer low-toxicity and green pest control options. For treatments inside your home, your technician will advise on any precautions — typically staying out of treated areas for 1 to 2 hours. Always inform your pest control provider about children and pets.",
      },
      {
        question: "How do I keep mice out of my Erie home in winter?",
        answer:
          "Mice enter through gaps as small as a dime. Seal all exterior openings with steel wool, caulk, or metal flashing. Focus on where pipes and wires enter, garage door seals, and foundation cracks. Keep food stored in airtight containers and eliminate clutter where mice nest. If you already have mice, professional exclusion work combined with trapping is the most effective approach.",
      },
      {
        question: "Does Erie have a termite problem?",
        answer:
          "Erie is in a moderate termite risk zone. Subterranean termites are present and can cause significant damage to homes with wood-to-ground contact or moisture issues. We recommend a termite inspection every 1 to 2 years, especially for homes built before 1970. Treatment options include liquid barriers ($500 to $1,500) and bait systems ($1,000 to $2,500).",
      },
      {
        question: "Should I get a preventive pest control plan?",
        answer:
          "For most Erie homes, a quarterly preventive plan is cost-effective. It typically includes perimeter treatment, interior treatment as needed, and coverage for common pests (ants, spiders, mice, wasps). Plans run $300 to $600 per year and prevent infestations before they become expensive problems.",
      },
    ],

    blogTopics: [
      "Keeping Mice Out of Your Erie Home This Winter",
      "The Truth About Bed Bugs: How They Spread and How to Stop Them",
      "Carpenter Ants vs. Termites: How to Tell the Difference",
      "Natural Pest Prevention Tips for Erie Homeowners",
      "Why Stink Bugs Love Erie (And How to Keep Them Out)",
      "Mosquito Control for Lakefront and Bayfront Properties",
      "Signs of a Rodent Infestation You Shouldn't Ignore",
      "How to Choose a Pest Control Company in Erie",
      "Spring Pest Prevention: Getting Ahead of Bug Season",
      "Bat Removal in Erie: When to Call a Professional",
    ],

    guideTopics: [
      "The Complete Guide to Pest Control in Erie, PA",
      "Erie Homeowner's Guide to Termite Prevention and Treatment",
      "Bed Bug Elimination Guide: Detection, Treatment, and Prevention",
      "Seasonal Pest Calendar for Erie, PA",
      "Wildlife Removal Guide for Erie Properties",
    ],

    comparisonPoints: [
      "PA pesticide applicator license",
      "Integrated Pest Management (IPM) approach",
      "Guarantee and re-treatment policy",
      "Treatment methods offered (chemical, heat, exclusion)",
      "Family and pet safety protocols",
      "Emergency response availability",
      "Annual plan pricing and coverage",
      "Online reviews and BBB rating",
    ],

    certifications: [
      "PA Pesticide Applicator License",
      "QualityPro Certification",
      "GreenPro Certification (eco-friendly)",
      "Wildlife Control Operator License",
      "National Pest Management Association Member",
    ],
    trustSignals: [
      "PA-licensed applicators",
      "Fully insured",
      "Satisfaction guaranteed",
      "Pet and family safe options",
      "Free inspections",
    ],

    pricingRanges: [
      { service: "One-time pest treatment", range: "$150 – $400" },
      { service: "Annual prevention plan", range: "$300 – $600/year" },
      { service: "Termite treatment", range: "$500 – $2,500" },
      { service: "Bed bug heat treatment", range: "$1,000 – $3,000" },
      { service: "Rodent exclusion", range: "$300 – $1,000" },
      { service: "Wildlife removal", range: "$200 – $800" },
    ],

    emergencyServices: [
      "Active rodent infestation",
      "Bee or wasp nest near living areas",
      "Bat colony in attic",
      "Wildlife intrusion into living spaces",
    ],

    seasonalTips: [
      "Fall: Seal entry points before mice seek shelter for winter",
      "Winter: Monitor for rodent activity in attics, basements, and garages",
      "Spring: Schedule perimeter treatment before ant and insect season begins",
      "Summer: Treat yard for mosquitoes and ticks, especially near standing water",
    ],

    ctaPrimary: "Get a Free Pest Inspection",
    ctaSecondary: "Compare Pest Control Companies",
    quoteFormTitle: "Request a Free Pest Inspection",
    quoteFormDescription:
      "Describe your pest concern and we'll connect you with a licensed pest control professional in Erie.",
  },

  // ── Painting ─────────────────────────────────────────────────────────────
  painting: {
    slug: "painting",
    label: "Painting",
    pluralLabel: "Painters",
    serviceLabel: "painting services",

    heroHeadline: "Find the Best Painter in Erie, PA",
    heroSubheadline:
      "Professional interior and exterior painting for homes and businesses. Quality prep work, premium paints, and clean results — guaranteed.",

    metaTitle: "Best Painters in Erie, PA — Interior & Exterior | erie.pro",
    metaDescription:
      "Find professional painters in Erie, PA. Interior painting, exterior painting, deck staining, commercial painting. Licensed, insured, free estimates.",
    primaryKeywords: [
      "painter erie pa",
      "house painting erie",
      "interior painting erie pa",
      "exterior painting erie",
    ],
    secondaryKeywords: [
      "cabinet painting erie pa",
      "deck staining erie",
      "commercial painting erie",
      "painting contractor erie pa",
      "wallpaper removal erie",
    ],

    aboutDescription:
      "Erie's weather is tough on exterior paint. Lake effect moisture, freeze-thaw cycles, and intense summer sun demand high-quality paint and thorough prep work. Experienced Erie painters know that proper surface preparation — scraping, priming, and caulking — is what separates a paint job that lasts 2 years from one that lasts 10. Inside, Erie's older homes with plaster walls and ornate trim require skilled painters who appreciate the character of the architecture.",

    commonServices: [
      "Interior painting (walls, ceilings, trim)",
      "Exterior house painting",
      "Cabinet painting and refinishing",
      "Deck and fence staining",
      "Wallpaper removal and installation",
      "Drywall repair and texture matching",
      "Commercial and office painting",
      "Color consultation and selection",
    ],

    faqItems: [
      {
        question: "How much does it cost to paint a room in Erie?",
        answer:
          "Painting a standard 12x12 room in Erie costs $300 to $600 including paint and labor. A full interior (3 bedroom home) runs $2,500 to $5,000 depending on ceiling height, trim work, and prep needed. Erie painters typically charge $2 to $4 per square foot for interior work. Higher costs apply for homes with plaster walls or extensive trim.",
      },
      {
        question: "How much does exterior painting cost in Erie?",
        answer:
          "Exterior painting for an average Erie home costs $3,000 to $8,000 depending on home size, siding material, condition, and paint quality. Two-story homes cost more due to ladder and scaffold work. Proper prep work (scraping, priming, caulking) often accounts for 50% or more of the total cost — but it's what makes the job last.",
      },
      {
        question: "What's the best time to paint the exterior of an Erie home?",
        answer:
          "Late spring through early fall (May through October) is the ideal window for exterior painting in Erie. The temperature should be above 50 degrees with low humidity. Avoid painting during Erie's rainy stretches. Most professional Erie painters book exterior jobs months in advance, so schedule early — ideally in March or April for a summer paint job.",
      },
      {
        question: "How long does exterior paint last in Erie?",
        answer:
          "Quality exterior paint in Erie lasts 5 to 10 years on siding and 3 to 5 years on trim and doors (which take more weather beating). The key factors are surface preparation, paint quality, and sun exposure. South and west-facing walls fade and wear faster. Using premium paint (Sherwin-Williams Duration, Benjamin Moore Aura) can extend life by 2 to 3 years.",
      },
      {
        question: "Should I paint or stain my deck in Erie?",
        answer:
          "For Erie's climate, semi-transparent or solid stain typically outperforms paint on horizontal deck surfaces. Paint on decks tends to peel in freeze-thaw conditions, while stain absorbs into the wood and wears more gracefully. Plan on re-staining every 2 to 3 years. Railings and vertical surfaces can be painted successfully.",
      },
      {
        question: "Do Erie painters need a license?",
        answer:
          "Pennsylvania requires painting contractors doing over $500 in work to register with the PA Attorney General as a Home Improvement Contractor. This isn't a license per se, but it's a legal requirement that provides consumer protection. For homes built before 1978, painters should also hold EPA Lead-Safe Certification for any work that disturbs old paint.",
      },
    ],

    blogTopics: [
      "How Erie's Weather Affects Your Paint Job (And What to Do About It)",
      "Choosing the Right Exterior Paint for Lake Erie's Climate",
      "Interior Painting Trends: Popular Colors for Erie Homes",
      "Cabinet Painting vs. Replacement: Cost Comparison for Erie Homeowners",
      "Lead Paint in Erie's Older Homes: What You Need to Know",
      "How Much Prep Work Does Your House Really Need?",
      "Deck Staining Guide for Erie's Harsh Winters",
      "How to Get a Professional-Looking Paint Job",
      "Color Consultation: Working with Erie's Natural Light",
      "When to DIY and When to Hire a Professional Painter",
    ],

    guideTopics: [
      "The Complete Guide to Hiring a Painter in Erie, PA",
      "Exterior Paint Buyer's Guide for Erie's Climate",
      "Interior Painting Guide: Prep, Technique, and Color Selection",
      "Cabinet Painting and Refinishing Guide",
      "Lead Paint Safety Guide for Pre-1978 Erie Homes",
    ],

    comparisonPoints: [
      "PA Home Improvement Contractor registration",
      "EPA Lead-Safe Certification (for older homes)",
      "Surface preparation process and thoroughness",
      "Paint brand and quality options offered",
      "Warranty on workmanship",
      "Clean-up and furniture protection process",
      "Timeline and crew size",
      "Portfolio and references from Erie projects",
    ],

    certifications: [
      "PA Home Improvement Contractor Registration",
      "EPA Lead-Safe Certified Renovator",
      "Sherwin-Williams Preferred Painter",
      "Benjamin Moore Certified Applicator",
    ],
    trustSignals: [
      "PA-registered contractor",
      "Fully insured",
      "Lead-safe certified",
      "Free color consultation",
      "Written warranty",
    ],

    pricingRanges: [
      { service: "Single room (interior)", range: "$300 – $600" },
      { service: "Full interior (3 BR home)", range: "$2,500 – $5,000" },
      { service: "Exterior (full house)", range: "$3,000 – $8,000" },
      { service: "Cabinet painting (kitchen)", range: "$1,500 – $4,000" },
      { service: "Deck staining", range: "$500 – $1,500" },
      { service: "Wallpaper removal (per room)", range: "$200 – $500" },
    ],

    emergencyServices: [],

    seasonalTips: [
      "Spring: Book your exterior painting project early — summer slots fill fast in Erie",
      "Summer: Ideal weather for exterior painting; tackle the south and west walls first",
      "Fall: Finish exterior touch-ups before temperatures drop below 50 degrees",
      "Winter: Great time for interior painting projects — painters have more availability",
    ],

    ctaPrimary: "Get a Free Painting Quote",
    ctaSecondary: "Compare Erie Painters",
    quoteFormTitle: "Get Your Free Painting Quote",
    quoteFormDescription:
      "Tell us about your painting project — interior, exterior, or both — and we'll connect you with the right Erie painter.",
  },

  // ── Real Estate ──────────────────────────────────────────────────────────
  "real-estate": {
    slug: "real-estate",
    label: "Real Estate",
    pluralLabel: "Real Estate Agents",
    serviceLabel: "real estate services",

    heroHeadline: "Find the Best Real Estate Agent in Erie, PA",
    heroSubheadline:
      "Top-rated realtors for buying, selling, and investing in Erie County real estate. Local market expertise, personalized service.",

    metaTitle: "Best Real Estate Agents in Erie, PA — Buy & Sell | erie.pro",
    metaDescription:
      "Find top real estate agents in Erie, PA. Buying, selling, investment properties. Local market experts, free consultations, proven results.",
    primaryKeywords: [
      "realtor erie pa",
      "real estate agent erie",
      "homes for sale erie pa",
      "real estate erie pa",
    ],
    secondaryKeywords: [
      "sell my house erie pa",
      "buy a home erie",
      "erie pa housing market",
      "investment property erie pa",
      "property management erie",
    ],

    aboutDescription:
      "Erie's real estate market offers exceptional value compared to major metro areas, with a median home price well below the national average. From historic homes in the downtown grid to newer developments in Millcreek and Harborcreek, Erie has options for every buyer. The market's affordability makes it attractive for first-time buyers, investors, and remote workers. Erie's top real estate agents bring deep local knowledge of neighborhoods, schools, and property values.",

    commonServices: [
      "Buyer representation and home search",
      "Seller representation and listing",
      "Comparative market analysis (CMA)",
      "Investment property consultation",
      "First-time homebuyer guidance",
      "Relocation assistance",
      "Property management referrals",
      "New construction representation",
    ],

    faqItems: [
      {
        question: "What is the median home price in Erie, PA?",
        answer:
          "The median home price in Erie is approximately $140,000 to $170,000, significantly below the national median of over $400,000. Prices vary by neighborhood: downtown Erie and older urban areas start under $100,000, Millcreek ranges from $150,000 to $350,000, and lakefront or Harborcreek properties can exceed $400,000.",
      },
      {
        question: "How do I choose a real estate agent in Erie?",
        answer:
          "Look for an agent with strong local knowledge, recent transaction history in your target area, and good communication skills. Check their reviews, ask about their marketing strategy (for sellers) or search process (for buyers), and interview at least 2 to 3 agents. Erie's market moves fast for well-priced homes, so you need an agent who's responsive and proactive.",
      },
      {
        question: "Is Erie a good market for first-time homebuyers?",
        answer:
          "Erie is one of the most affordable markets in the Northeast for first-time buyers. Low home prices mean lower down payments and monthly payments. Several Pennsylvania programs offer down payment assistance, and FHA loans are widely available. A first-time buyer can find a solid home in a good neighborhood for $120,000 to $180,000.",
      },
      {
        question: "How long does it take to sell a house in Erie?",
        answer:
          "Well-priced homes in desirable Erie neighborhoods sell in 2 to 6 weeks on average. Homes priced above market or in less desirable areas may take 3 to 6 months. Spring and early summer (April through July) are the strongest selling seasons. Your agent's pricing strategy and marketing plan significantly impact time on market.",
      },
      {
        question: "What are the best neighborhoods to buy in Erie?",
        answer:
          "It depends on your priorities. Millcreek offers suburban living with top-rated schools. Harborcreek provides rural character with lake access. The West Bayfront is undergoing revitalization with attractive prices. Glenwood and Frontier offer mid-range family neighborhoods. Downtown Erie appeals to those wanting walkability and historic character.",
      },
      {
        question: "How much does a real estate agent cost?",
        answer:
          "Sellers typically pay the full commission (5 to 6% of the sale price), which is split between the listing and buyer's agents. Buyers traditionally pay no direct agent fees. On a $150,000 Erie home, the seller pays approximately $7,500 to $9,000 in commission. Some agents offer reduced commission structures — compare options through erie.pro.",
      },
    ],

    blogTopics: [
      "Erie Real Estate Market Update: Prices, Trends, and Predictions",
      "Best Neighborhoods in Erie for Families with School-Age Kids",
      "First-Time Homebuyer's Guide to Erie, PA",
      "Investment Properties in Erie: Where to Buy for Best Returns",
      "How to Sell Your Erie Home Fast and for Top Dollar",
      "Moving to Erie: What New Residents Need to Know",
      "Erie's Most Affordable Neighborhoods for Starter Homes",
      "Downtown Erie Revitalization: Is Now the Time to Buy?",
      "Home Inspection Red Flags Every Erie Buyer Should Know",
      "Understanding Property Taxes in Erie County",
    ],

    guideTopics: [
      "The Complete Guide to Buying a Home in Erie, PA",
      "Erie Seller's Guide: Maximizing Your Home's Value",
      "Erie Neighborhood Guide: Finding Your Perfect Fit",
      "Real Estate Investing in Erie County: A Beginner's Guide",
      "Understanding Erie's Property Tax Assessment System",
    ],

    comparisonPoints: [
      "Recent transaction volume in your target area",
      "Average days on market for their listings",
      "Sale-to-list price ratio",
      "Marketing plan and online presence",
      "Communication frequency and responsiveness",
      "Local market knowledge and neighborhood expertise",
      "Commission structure and fees",
      "Client reviews and satisfaction ratings",
    ],

    certifications: [
      "PA Real Estate License",
      "National Association of Realtors (NAR) Member",
      "Accredited Buyer's Representative (ABR)",
      "Seller Representative Specialist (SRS)",
      "Certified Residential Specialist (CRS)",
    ],
    trustSignals: [
      "Licensed PA realtor",
      "NAR member",
      "Free market analysis",
      "Local market expert",
      "Proven sales record",
    ],

    pricingRanges: [
      { service: "Buyer agent fee", range: "Typically $0 (paid by seller)" },
      { service: "Listing agent commission", range: "2.5% – 3% of sale price" },
      { service: "Comparative market analysis", range: "Free" },
      { service: "Home staging consultation", range: "$200 – $500" },
      { service: "Professional photography", range: "$200 – $400" },
      { service: "Property management (monthly)", range: "8% – 12% of rent" },
    ],

    emergencyServices: [],

    seasonalTips: [
      "Spring: Peak listing season — prepare your home in winter for a spring sale",
      "Summer: Most competitive buying season; be ready with pre-approval",
      "Fall: Good time to buy — less competition and motivated sellers",
      "Winter: Lowest prices but limited inventory; great for patient buyers",
    ],

    ctaPrimary: "Find a Real Estate Agent",
    ctaSecondary: "Compare Erie Realtors",
    quoteFormTitle: "Connect with an Erie Realtor",
    quoteFormDescription:
      "Tell us whether you're buying, selling, or investing, and we'll match you with a top Erie real estate agent.",
  },

  // ── Garage Door ──────────────────────────────────────────────────────────
  "garage-door": {
    slug: "garage-door",
    label: "Garage Door",
    pluralLabel: "Garage Door Companies",
    serviceLabel: "garage door services",
    heroHeadline: "Find the Best Garage Door Service in Erie, PA",
    heroSubheadline: "Expert garage door installation, repair, and maintenance serving Erie, Millcreek, Harborcreek, and all of Erie County. Fast response, fair pricing.",
    metaTitle: "Best Garage Door Repair & Installation in Erie, PA | erie.pro",
    metaDescription: "Find top-rated garage door companies in Erie, PA. Spring replacement, opener repair, new installations. Licensed, insured pros with free estimates.",
    primaryKeywords: ["garage door repair erie pa", "garage door installation erie", "garage door opener repair erie", "garage door spring replacement erie pa", "garage door service erie"],
    secondaryKeywords: ["overhead door erie pa", "garage door company near me erie", "insulated garage door erie", "garage door cable repair erie", "emergency garage door repair erie"],
    aboutDescription: "Erie's heavy snowfall and freeze-thaw cycles take a serious toll on garage doors. Ice buildup warps tracks, cold temperatures crack springs, and salt spray corrodes hardware. Erie homeowners rely on dependable garage door professionals who understand the demands of a lake-effect climate and can respond quickly when a door fails in the middle of winter.",
    commonServices: ["Garage door spring replacement (torsion and extension)", "Garage door opener installation and repair", "New garage door installation", "Panel replacement and dent repair", "Track alignment and roller replacement", "Weatherstripping and insulation upgrades", "Emergency garage door service", "Keypad and remote programming"],
    faqItems: [
      { question: "How much does garage door repair cost in Erie, PA?", answer: "A typical garage door service call in Erie runs $75 to $150 for diagnostics. Spring replacement averages $200 to $400 for a pair of torsion springs installed. Opener repair ranges from $150 to $350, and a full new garage door installation costs $800 to $2,500 depending on material and insulation level." },
      { question: "Why won't my garage door open in cold weather?", answer: "Erie's sub-zero winter temperatures cause several garage door problems. Metal springs lose tension and can snap, lubricant thickens and slows the opener, weather seals freeze to the ground, and tracks contract and misalign. Keeping the door lubricated with a silicone-based spray and the bottom seal free of ice helps prevent most cold-weather failures." },
      { question: "How long do garage door springs last in Erie?", answer: "Standard torsion springs are rated for about 10,000 cycles, which translates to 7 to 10 years for most Erie households. However, Erie's temperature extremes accelerate metal fatigue, and springs may fail sooner. High-cycle springs rated for 25,000 to 50,000 cycles are a worthwhile upgrade for our climate." },
      { question: "Should I get an insulated garage door in Erie?", answer: "Absolutely. An insulated garage door (R-12 or higher) makes a significant difference in Erie where winter temperatures regularly drop below 20 degrees. If your garage is attached to your house, an insulated door reduces heat loss and lowers energy bills. Even for detached garages, insulation protects vehicles and stored items from extreme cold." },
      { question: "Can I replace a garage door spring myself?", answer: "We strongly advise against DIY spring replacement. Torsion springs are under extreme tension and can cause serious injury or death if mishandled. Professional technicians have the tools, training, and insurance to replace springs safely. In Erie, a professional spring replacement typically costs $200 to $400 — a small price for safety." },
      { question: "How do I maintain my garage door for Erie winters?", answer: "Before winter, lubricate all moving parts with silicone spray, inspect springs and cables for wear, check the weather seal along the bottom, and test the auto-reverse safety feature. During winter, keep the bottom seal free of ice and clear snow away from the door path. Schedule a professional tune-up each fall." },
    ],
    blogTopics: ["Winterizing Your Garage Door for Erie's Lake Effect Snow", "Torsion vs. Extension Springs: Which Does Your Erie Home Need?", "Signs Your Garage Door Opener Is Failing", "The Benefits of Insulated Garage Doors in Cold Climates", "Garage Door Safety: What Every Erie Homeowner Should Know", "How to Choose the Right Garage Door Material for Erie Weather", "Smart Garage Door Openers: Features Worth Paying For", "Emergency Garage Door Repair: What to Do When It Won't Open", "Garage Door Maintenance Checklist for Erie Homeowners", "When to Repair vs. Replace Your Garage Door"],
    guideTopics: ["Complete Guide to Garage Door Replacement in Erie, PA", "Erie Homeowner's Guide to Garage Door Spring Repair", "How to Choose the Best Garage Door Opener for Erie's Climate", "Insulated Garage Doors: A Buyer's Guide for Cold Climates", "Hiring a Garage Door Technician in Erie: What to Look For"],
    comparisonPoints: ["PA Home Improvement Contractor Registration", "Warranty on parts and labor", "Emergency/same-day response availability", "Experience with insulated and high-wind-rated doors", "Manufacturer partnerships and product selection", "Online reviews and local reputation"],
    certifications: ["PA Home Improvement Contractor Registration (HICPA)", "International Door Association (IDA) Certified", "Manufacturer-Certified Installer (LiftMaster, Chamberlain, etc.)", "OSHA Safety Certified"],
    trustSignals: ["Licensed in Pennsylvania", "Fully insured", "Free estimates", "Emergency service available", "Warranty on all work"],
    pricingRanges: [
      { service: "Service call / diagnostic", range: "$75 – $150" },
      { service: "Spring replacement (pair)", range: "$200 – $400" },
      { service: "Opener repair", range: "$150 – $350" },
      { service: "New opener installation", range: "$300 – $600" },
      { service: "Single garage door (installed)", range: "$800 – $1,500" },
      { service: "Double garage door (installed)", range: "$1,200 – $2,500" },
    ],
    emergencyServices: ["Broken spring repair", "Door off track", "Stuck door (open or closed)", "Broken cable repair", "Opener failure"],
    seasonalTips: ["Fall: Lubricate all moving parts and inspect springs before Erie's winter cold sets in", "Winter: Clear ice from the bottom seal and keep the door path free of snow and debris", "Spring: Inspect for winter damage — look for bent tracks, worn cables, and cracked panels", "Summer: Schedule a professional tune-up and consider upgrading to an insulated door before next winter"],
    ctaPrimary: "Find Garage Door Service",
    ctaSecondary: "Compare Garage Door Companies",
    quoteFormTitle: "Get a Free Garage Door Quote",
    quoteFormDescription: "Describe your garage door issue or project and we'll connect you with top-rated Erie technicians.",
  },

  // ── Fencing ──────────────────────────────────────────────────────────────
  fencing: {
    slug: "fencing",
    label: "Fencing",
    pluralLabel: "Fence Companies",
    serviceLabel: "fencing services",
    heroHeadline: "Find the Best Fence Company in Erie, PA",
    heroSubheadline: "Professional fence installation and repair serving Erie, Millcreek, Harborcreek, and surrounding communities. Wood, vinyl, aluminum, and chain link.",
    metaTitle: "Best Fence Companies in Erie, PA — Installation & Repair | erie.pro",
    metaDescription: "Find top-rated fence companies in Erie, PA. Wood, vinyl, aluminum, chain link installation and repair. Licensed, insured professionals with free quotes.",
    primaryKeywords: ["fence company erie pa", "fence installation erie", "fence repair erie pa", "vinyl fence erie", "wood fence erie pa"],
    secondaryKeywords: ["aluminum fence erie pa", "chain link fence erie", "privacy fence erie pa", "fence contractor near me erie", "fence replacement erie"],
    aboutDescription: "Erie's wind off Lake Erie, heavy snowfall, and freeze-thaw cycles demand sturdy fence construction. From privacy fences in Millcreek to aluminum fencing in Harborcreek, Erie homeowners need fence builders who understand local soil conditions, frost lines, and municipal setback requirements. A properly installed fence withstands Erie weather and adds lasting value to your property.",
    commonServices: ["Wood fence installation (cedar, pine, pressure-treated)", "Vinyl fence installation", "Aluminum and ornamental iron fencing", "Chain link fence installation", "Fence repair and post replacement", "Gate installation and repair", "Snow fence installation", "Property line surveys and permit assistance"],
    faqItems: [
      { question: "How much does a new fence cost in Erie, PA?", answer: "Fence costs in Erie vary by material and length. Pressure-treated wood fencing runs $20 to $35 per linear foot installed. Vinyl fencing costs $25 to $45 per linear foot. Aluminum fencing ranges from $30 to $55 per linear foot. Chain link is the most affordable at $12 to $25 per linear foot. A typical 150-foot residential fence costs $3,000 to $7,500 depending on material." },
      { question: "What is the best fence material for Erie's climate?", answer: "Vinyl and aluminum fences perform best in Erie's harsh climate because they resist moisture, do not rot, and withstand freeze-thaw cycles. Cedar is the best wood option, as it naturally resists decay. Pressure-treated pine is more affordable but requires regular staining or sealing to last in Erie's wet, snowy winters." },
      { question: "Do I need a permit for a fence in Erie?", answer: "Yes. The City of Erie and most Erie County townships require permits for new fence installations. Typical regulations include maximum height limits (6 feet for backyard, 4 feet for front yard), setback requirements from property lines and sidewalks, and restrictions on materials in certain zoning districts. Your fence contractor should handle the permit process." },
      { question: "How deep should fence posts be set in Erie?", answer: "In Erie County, fence posts should be set at least 36 inches deep — below the local frost line of approximately 32 inches. Posts that are too shallow will heave out of the ground during freeze-thaw cycles. Using gravel at the base of each post hole improves drainage and reduces frost heave risk." },
      { question: "How long does a fence last in Erie?", answer: "Lifespan depends on material and maintenance. Vinyl fences last 20 to 30 years with minimal maintenance. Aluminum lasts 20-plus years. Cedar fences last 15 to 20 years with proper staining. Pressure-treated wood lasts 10 to 15 years. Chain link lasts 15 to 20 years. Erie's heavy snow, wind, and moisture shorten the lifespan of unmaintained wood fences significantly." },
      { question: "When is the best time to install a fence in Erie?", answer: "Late spring through early fall (May to October) is ideal for fence installation in Erie. The ground is thawed and workable, and concrete can cure properly. Some contractors install during mild winter stretches, but frozen ground makes digging difficult and concrete curing unreliable. Book spring installations early — fence contractors fill up fast." },
    ],
    blogTopics: ["Best Fence Materials for Erie's Lake Effect Climate", "How Deep Should Fence Posts Be in Erie County?", "Privacy Fence Options for Erie Homeowners", "Erie Fence Permit Requirements: What You Need to Know", "Wood vs. Vinyl Fencing: Which Lasts Longer in Erie?", "How to Protect Your Fence from Erie's Winter Weather", "Snow Fences: Do Erie Homeowners Need Them?", "Choosing the Right Gate for Your Erie Fence", "Fence Maintenance Checklist for Erie's Four Seasons", "Aluminum Fencing: The Low-Maintenance Choice for Erie Yards"],
    guideTopics: ["Complete Guide to Fence Installation in Erie, PA", "Erie Homeowner's Guide to Fence Materials and Costs", "Understanding Erie's Fence Permit and Zoning Requirements", "How to Choose a Fence Contractor in Erie, PA", "Fence Maintenance Guide for Erie's Climate"],
    comparisonPoints: ["PA Home Improvement Contractor Registration", "Material options and quality grades offered", "Warranty on posts, panels, and labor", "Permit handling and survey coordination", "Experience with Erie's frost line and soil conditions", "Timeline and availability during peak season"],
    certifications: ["PA Home Improvement Contractor Registration (HICPA)", "American Fence Association (AFA) Member", "Manufacturer-Certified Installer", "OSHA Safety Certified"],
    trustSignals: ["Licensed in Pennsylvania", "Fully insured", "Free estimates", "Warranty on materials and labor", "Permit handling included"],
    pricingRanges: [
      { service: "Chain link (per linear ft)", range: "$12 – $25" },
      { service: "Pressure-treated wood (per linear ft)", range: "$20 – $35" },
      { service: "Vinyl (per linear ft)", range: "$25 – $45" },
      { service: "Aluminum (per linear ft)", range: "$30 – $55" },
      { service: "Gate installation", range: "$200 – $800" },
      { service: "Fence repair (per section)", range: "$150 – $500" },
    ],
    emergencyServices: ["Storm-damaged fence repair", "Fallen fence removal", "Emergency gate repair"],
    seasonalTips: ["Spring: Inspect for winter damage — look for leaning posts, loose boards, and frost-heaved posts", "Summer: Stain or seal wood fences during dry weather for maximum protection", "Fall: Clear leaves and debris from fence lines; check for loose hardware before snow arrives", "Winter: Brush heavy snow off vinyl and wood fences to prevent bowing or panel damage"],
    ctaPrimary: "Find a Fence Company",
    ctaSecondary: "Compare Fence Contractors",
    quoteFormTitle: "Get a Free Fence Quote",
    quoteFormDescription: "Tell us about your fencing project and we'll connect you with top-rated Erie fence contractors.",
  },

  // ── Flooring ─────────────────────────────────────────────────────────────
  flooring: {
    slug: "flooring",
    label: "Flooring",
    pluralLabel: "Flooring Companies",
    serviceLabel: "flooring services",
    heroHeadline: "Find the Best Flooring Company in Erie, PA",
    heroSubheadline: "Expert flooring installation, repair, and refinishing serving Erie, Millcreek, Harborcreek, and all of Erie County. Hardwood, LVP, tile, and carpet.",
    metaTitle: "Best Flooring Companies in Erie, PA — Installation & Refinishing | erie.pro",
    metaDescription: "Find top-rated flooring companies in Erie, PA. Hardwood, LVP, tile, carpet installation and refinishing. Licensed professionals with free estimates.",
    primaryKeywords: ["flooring company erie pa", "flooring installation erie", "hardwood floor refinishing erie pa", "lvp flooring erie", "tile installation erie pa"],
    secondaryKeywords: ["carpet installation erie pa", "flooring contractor near me erie", "waterproof flooring erie", "laminate flooring erie pa", "floor repair erie"],
    aboutDescription: "Erie's climate presents unique flooring challenges. Winter salt tracked indoors, basement moisture from spring snowmelt, and humidity swings from Lake Erie all affect flooring performance. Erie homeowners need flooring professionals who understand which materials handle these conditions and how to prepare subfloors in older homes throughout Millcreek, Downtown Erie, and surrounding communities.",
    commonServices: ["Hardwood floor installation and refinishing", "Luxury vinyl plank (LVP) installation", "Tile and stone installation", "Carpet installation and replacement", "Laminate flooring installation", "Subfloor repair and preparation", "Waterproof flooring for basements", "Commercial flooring installation"],
    faqItems: [
      { question: "How much does new flooring cost in Erie, PA?", answer: "Flooring costs in Erie vary by material. Carpet runs $3 to $8 per square foot installed. Laminate costs $4 to $8 per square foot. Luxury vinyl plank ranges from $5 to $10 per square foot. Hardwood installation costs $8 to $15 per square foot. Tile runs $7 to $15 per square foot. A typical 300-square-foot room costs $900 to $4,500 depending on material choice." },
      { question: "What is the best flooring for Erie basements?", answer: "Luxury vinyl plank (LVP) is the top choice for Erie basements because it is fully waterproof, handles temperature swings, and installs as a floating floor over concrete. Tile is another excellent option but costs more. Avoid solid hardwood and standard laminate in Erie basements — moisture from the high water table and spring snowmelt will damage them." },
      { question: "Can I install hardwood floors in Erie?", answer: "Yes, but with precautions. Hardwood performs well on upper floors and main levels in Erie homes. Choose engineered hardwood over solid hardwood for better dimensional stability through humidity changes. Maintain indoor humidity between 35 and 55 percent year-round. Avoid hardwood in basements or over concrete slabs unless using an engineered product with a proper moisture barrier." },
      { question: "How often should hardwood floors be refinished?", answer: "In Erie homes, hardwood floors typically need refinishing every 7 to 10 years depending on traffic and maintenance. Salt and grit tracked in during winter accelerate wear. Using entry mats, removing shoes, and sweeping regularly extends the time between refinishing. Solid hardwood can be refinished 3 to 5 times over its lifetime." },
      { question: "Is LVP really waterproof?", answer: "Quality LVP is 100 percent waterproof at the plank level — water will not damage the core material. However, water can seep between seams if planks are not properly installed. For Erie basements prone to moisture, choose an LVP with a locking system rated for wet environments and ensure the subfloor is level and dry before installation." },
      { question: "How long does flooring installation take?", answer: "A typical room (200 to 300 square feet) takes 1 to 2 days for most flooring types. Hardwood refinishing requires 3 to 5 days including drying time. Whole-house flooring projects take 1 to 2 weeks. Subfloor repair or leveling adds time. Schedule installations during spring or fall when humidity levels are moderate for the best results in Erie." },
    ],
    blogTopics: ["Best Flooring Options for Erie's Wet Basements", "LVP vs. Hardwood: Which Is Better for Erie Homes?", "How to Protect Your Floors from Erie's Winter Salt and Snow", "Tile Flooring for Erie Bathrooms and Kitchens: A Complete Guide", "Hardwood Floor Refinishing: When and How in Erie's Climate", "Choosing Waterproof Flooring for Erie's High Water Table", "Carpet vs. Hard Flooring: Pros and Cons for Erie Homeowners", "Subfloor Preparation: Why It Matters in Older Erie Homes", "Engineered vs. Solid Hardwood: The Right Choice for Erie", "Flooring Trends for Erie Homes"],
    guideTopics: ["Complete Guide to Flooring Installation in Erie, PA", "Erie Homeowner's Guide to Basement Flooring Options", "Hardwood Floor Buyer's Guide for Erie's Climate", "How to Choose a Flooring Contractor in Erie, PA", "Flooring Maintenance Guide for Erie's Four Seasons"],
    comparisonPoints: ["PA Home Improvement Contractor Registration", "Material brands and quality grades offered", "Subfloor preparation and moisture testing included", "Warranty on materials and installation labor", "Experience with older Erie homes and uneven subfloors", "Showroom availability for viewing samples"],
    certifications: ["PA Home Improvement Contractor Registration (HICPA)", "National Wood Flooring Association (NWFA) Certified", "Certified Flooring Installer (CFI)", "Manufacturer-Certified Installer"],
    trustSignals: ["Licensed in Pennsylvania", "Fully insured", "Free in-home estimates", "Warranty on all installations", "Showroom available"],
    pricingRanges: [
      { service: "Carpet (per sq ft installed)", range: "$3 – $8" },
      { service: "Laminate (per sq ft installed)", range: "$4 – $8" },
      { service: "LVP (per sq ft installed)", range: "$5 – $10" },
      { service: "Hardwood (per sq ft installed)", range: "$8 – $15" },
      { service: "Tile (per sq ft installed)", range: "$7 – $15" },
      { service: "Hardwood refinishing (per sq ft)", range: "$3 – $6" },
    ],
    emergencyServices: ["Water-damaged floor repair", "Flood damage flooring removal"],
    seasonalTips: ["Spring: Inspect for winter moisture damage; schedule hardwood refinishing during mild weather", "Summer: Ideal time for installations — humidity is stable and adhesives cure properly", "Fall: Prepare floors for winter — add entry mats and apply protective coatings to high-traffic areas", "Winter: Keep indoor humidity between 35 and 55 percent to prevent hardwood shrinkage and gapping"],
    ctaPrimary: "Find a Flooring Company",
    ctaSecondary: "Compare Flooring Contractors",
    quoteFormTitle: "Get a Free Flooring Quote",
    quoteFormDescription: "Tell us about your flooring project and we'll connect you with top-rated Erie flooring professionals.",
  },

  // ── Windows & Doors ──────────────────────────────────────────────────────
  "windows-doors": {
    slug: "windows-doors",
    label: "Windows & Doors",
    pluralLabel: "Window & Door Companies",
    serviceLabel: "window and door services",
    heroHeadline: "Find the Best Window & Door Company in Erie, PA",
    heroSubheadline: "Expert window and door installation, replacement, and repair serving Erie, Millcreek, Harborcreek, and all of Erie County. Energy-efficient upgrades.",
    metaTitle: "Best Window & Door Companies in Erie, PA — Replacement & Installation | erie.pro",
    metaDescription: "Find top-rated window and door companies in Erie, PA. Energy-efficient replacements, new installations, storm doors. Licensed pros with free estimates.",
    primaryKeywords: ["window replacement erie pa", "door installation erie", "window company erie pa", "energy efficient windows erie", "storm doors erie pa"],
    secondaryKeywords: ["vinyl windows erie pa", "entry door replacement erie", "sliding door installation erie pa", "window repair erie", "door contractor near me erie"],
    aboutDescription: "Energy efficiency is a top priority for Erie homeowners facing 100-plus inches of annual snowfall and winter heating bills. Many older homes in Downtown Erie, Little Italy, and Glenwood still have original single-pane windows that waste energy and let in drafts. Upgrading to double or triple-pane windows and insulated entry doors reduces heating costs and improves comfort throughout Erie's long winters.",
    commonServices: ["Window replacement (vinyl, wood, fiberglass)", "Entry door replacement and installation", "Storm door installation", "Sliding and patio door installation", "Window repair and glass replacement", "Energy audits and window assessments", "Bay and bow window installation", "Egress window installation for basements"],
    faqItems: [
      { question: "How much do replacement windows cost in Erie, PA?", answer: "Replacement window costs in Erie range from $300 to $800 per window installed for standard vinyl double-hung windows. Higher-end fiberglass or triple-pane windows run $600 to $1,200 per window. A typical Erie home with 15 to 20 windows costs $5,000 to $15,000 for a full replacement. Energy savings of $200 to $500 per year help offset the investment." },
      { question: "What type of windows are best for Erie's climate?", answer: "For Erie's cold winters, look for windows with a U-factor of 0.25 or lower and an ENERGY STAR Northern Zone rating. Double-pane windows with Low-E coating and argon gas fill are the standard. Triple-pane windows offer even better insulation for exposed lakefront properties. Vinyl and fiberglass frames perform best in Erie because they resist condensation and do not conduct cold like aluminum." },
      { question: "Are triple-pane windows worth it in Erie?", answer: "Triple-pane windows cost about 25 to 35 percent more than double-pane but provide noticeably better insulation and noise reduction. For Erie homes with north-facing windows, lakefront exposure, or rooms that are always cold, triple-pane is often worth the investment. The energy savings and comfort improvement are most significant during Erie's coldest months." },
      { question: "Do I need a permit for window replacement in Erie?", answer: "In most cases, yes. The City of Erie and Erie County require permits for window replacements, especially if the opening size changes. Same-size replacements in existing frames may not require a permit in some jurisdictions. Your window contractor should handle all permit requirements and ensure the installation meets Pennsylvania Uniform Construction Code standards." },
      { question: "How long do replacement windows last?", answer: "Quality vinyl windows last 20 to 30 years. Fiberglass windows can last 30 to 40 years. Wood windows last 20-plus years with proper maintenance. Choosing ENERGY STAR rated windows designed for cold climates ensures they hold up to Erie's temperature extremes. Most reputable manufacturers offer lifetime or 20-year warranties." },
      { question: "Should I replace windows or just add storm windows?", answer: "If your windows are original single-pane in an older Erie home, full replacement is usually the better long-term investment. Storm windows are a lower-cost option that can reduce energy loss by 25 to 50 percent, making them a good interim solution. However, they do not address issues like failed seals, rot, or air leakage around the frame." },
    ],
    blogTopics: ["Energy-Efficient Window Options for Erie's Harsh Winters", "Double-Pane vs. Triple-Pane Windows: What Erie Homeowners Should Know", "Signs Your Windows Need Replacement in Erie", "Best Entry Doors for Erie's Lake Effect Weather", "How to Reduce Condensation on Windows During Erie Winters", "Storm Doors vs. Full Door Replacement: Making the Right Choice", "Egress Window Requirements for Erie Basements", "Window Maintenance Tips for Erie's Climate", "Bay and Bow Windows: Adding Value to Erie Homes", "Understanding Window Energy Ratings for Erie's Climate Zone"],
    guideTopics: ["Complete Guide to Window Replacement in Erie, PA", "Erie Homeowner's Guide to Entry Door Selection", "Energy-Efficient Window Buyer's Guide for Cold Climates", "How to Choose a Window Contractor in Erie, PA", "Understanding Window U-Factor and ENERGY STAR Ratings"],
    comparisonPoints: ["PA Home Improvement Contractor Registration", "Window brands and product lines offered", "Energy efficiency ratings of products installed", "Warranty on windows, doors, and installation labor", "Experience with older Erie homes", "Financing options available"],
    certifications: ["PA Home Improvement Contractor Registration (HICPA)", "ENERGY STAR Partner", "Manufacturer-Certified Installer", "EPA Lead-Safe Certified (for pre-1978 homes)"],
    trustSignals: ["Licensed in Pennsylvania", "Fully insured", "ENERGY STAR products", "Free in-home estimates", "Manufacturer warranties honored"],
    pricingRanges: [
      { service: "Vinyl window replacement (each)", range: "$300 – $800" },
      { service: "Fiberglass window (each)", range: "$600 – $1,200" },
      { service: "Entry door replacement", range: "$1,500 – $4,000" },
      { service: "Storm door installation", range: "$300 – $700" },
      { service: "Sliding/patio door", range: "$1,200 – $3,500" },
      { service: "Egress window installation", range: "$2,500 – $5,000" },
    ],
    emergencyServices: ["Broken window board-up and replacement", "Forced entry door repair", "Storm damage window repair"],
    seasonalTips: ["Spring: Check window seals and caulking for winter damage; schedule replacements before summer rush", "Summer: Best time for window installation — warm weather allows proper caulking and sealing", "Fall: Inspect weatherstripping on all doors and windows; replace before heating season", "Winter: Use window insulation kits on any drafty windows as a temporary measure until replacement"],
    ctaPrimary: "Find a Window & Door Company",
    ctaSecondary: "Compare Window Contractors",
    quoteFormTitle: "Get a Free Window & Door Quote",
    quoteFormDescription: "Tell us about your window or door project and we'll connect you with top-rated Erie professionals.",
  },

  // ── Moving ───────────────────────────────────────────────────────────────
  moving: {
    slug: "moving",
    label: "Moving",
    pluralLabel: "Moving Companies",
    serviceLabel: "moving services",
    heroHeadline: "Find the Best Moving Company in Erie, PA",
    heroSubheadline: "Professional local and long-distance moving services serving Erie, Millcreek, Harborcreek, and all of Erie County. Licensed, insured, and reliable.",
    metaTitle: "Best Moving Companies in Erie, PA — Local & Long Distance | erie.pro",
    metaDescription: "Find top-rated movers in Erie, PA. Local moves, long-distance moving, packing services. Licensed, insured moving companies with free estimates.",
    primaryKeywords: ["moving company erie pa", "movers erie pa", "local moving erie", "long distance moving erie pa", "moving services erie"],
    secondaryKeywords: ["packing services erie pa", "piano moving erie", "storage services erie pa", "commercial moving erie", "moving company near me erie"],
    aboutDescription: "Moving in Erie presents unique challenges, from navigating narrow streets in older neighborhoods like Little Italy and Downtown Erie to handling winter moves during lake effect snowstorms. Erie's affordable housing market attracts new residents from across the region, and local movers who know the area can make relocation smooth regardless of the season.",
    commonServices: ["Local residential moving", "Long-distance moving", "Packing and unpacking services", "Commercial and office moving", "Piano and specialty item moving", "Storage solutions (short and long term)", "Senior and assisted moving", "Loading and unloading help"],
    faqItems: [
      { question: "How much do movers cost in Erie, PA?", answer: "Local moves in Erie typically cost $80 to $150 per hour for a two-person crew with a truck. A typical 2-bedroom apartment move takes 3 to 5 hours, costing $300 to $750. Long-distance moves from Erie are quoted by weight and distance, typically $2,000 to $5,000 for a 2-to-3-bedroom home. Costs increase during summer peak season." },
      { question: "Can I move during Erie's winter?", answer: "Yes, but winter moves require extra planning. Erie's lake effect snow and icy conditions can slow down the process and pose safety risks. Choose movers experienced with Erie winters who carry floor protection and have equipment for navigating icy walkways. Winter moves often cost less than summer moves due to lower demand." },
      { question: "How far in advance should I book movers in Erie?", answer: "For summer moves (May through September), book at least 4 to 6 weeks ahead. Erie's affordable housing market stays active, and reputable movers fill up quickly during peak season. For off-season moves, 2 to 3 weeks notice is usually sufficient." },
      { question: "Do movers in Pennsylvania need to be licensed?", answer: "Yes. Moving companies operating within Pennsylvania must register with the PA Public Utility Commission (PUC) for intrastate moves. Interstate movers must be registered with the Federal Motor Carrier Safety Administration (FMCSA) and carry a USDOT number. Always verify a mover's credentials before hiring." },
      { question: "What should I look for in an Erie moving company?", answer: "Verify PA PUC registration for local moves and USDOT number for interstate moves. Check for liability insurance and workers compensation coverage. Read recent reviews from Erie customers. Get written estimates from at least three companies. Avoid movers who demand large cash deposits or refuse to provide written contracts." },
      { question: "Should I buy moving insurance?", answer: "Pennsylvania movers provide basic liability coverage (typically $0.60 per pound per item), but this is minimal. For a 50-pound item worth $1,000, you would only receive $30 in basic coverage. Full value protection costs extra but covers the actual value of your belongings. Consider it for long-distance moves and high-value items." },
    ],
    blogTopics: ["Moving in Erie During Winter: Tips for a Smooth Lake Effect Move", "How to Choose a Licensed Mover in Erie, PA", "Complete Moving Checklist for Erie Homeowners", "Local vs. Long-Distance Moving: What Erie Residents Need to Know", "Packing Tips for Protecting Your Belongings in Erie Weather", "Senior Moving Services in Erie: What to Expect", "Moving with Pets: A Guide for Erie Families", "Storage Options in Erie, PA: Short-Term and Long-Term Solutions", "How to Move a Piano in Erie: What You Need to Know", "Moving Day Parking in Downtown Erie and Older Neighborhoods"],
    guideTopics: ["Complete Guide to Hiring Movers in Erie, PA", "Erie Resident's Guide to Long-Distance Moving", "Moving Budget Guide for Erie Homeowners", "How to Plan a Winter Move in Erie", "Downsizing Guide for Erie Seniors"],
    comparisonPoints: ["PA PUC registration and USDOT number", "Insurance and liability coverage options", "Crew size and truck availability", "Experience with Erie's older neighborhoods", "Online reviews and BBB rating", "Transparent pricing and written estimates"],
    certifications: ["PA Public Utility Commission (PUC) Registration", "USDOT Number (for interstate moves)", "American Moving & Storage Association (AMSA) Member", "ProMover Certified"],
    trustSignals: ["Licensed and insured", "PA PUC registered", "Free estimates", "No hidden fees", "Background-checked crews"],
    pricingRanges: [
      { service: "Local move (2-person crew/hr)", range: "$80 – $150" },
      { service: "Local move (3-person crew/hr)", range: "$120 – $200" },
      { service: "Packing services (per room)", range: "$50 – $100" },
      { service: "Piano moving", range: "$200 – $600" },
      { service: "Storage (monthly, 10x10 unit)", range: "$75 – $150" },
      { service: "Long-distance (2-3 bed home)", range: "$2,000 – $5,000" },
    ],
    emergencyServices: [],
    seasonalTips: ["Spring: Book summer movers early — Erie's peak moving season fills up fast", "Summer: Schedule moves on weekdays for lower rates and better availability", "Fall: Great time for off-season rates — weather is usually mild through October", "Winter: Plan for lake effect snow delays; protect floors with mats and coverings"],
    ctaPrimary: "Find a Moving Company",
    ctaSecondary: "Compare Erie Movers",
    quoteFormTitle: "Get a Free Moving Quote",
    quoteFormDescription: "Tell us about your move and we'll connect you with top-rated Erie moving companies.",
  },

  // ── Tree Service ─────────────────────────────────────────────────────────
  "tree-service": {
    slug: "tree-service",
    label: "Tree Service",
    pluralLabel: "Tree Service Companies",
    serviceLabel: "tree services",
    heroHeadline: "Find the Best Tree Service in Erie, PA",
    heroSubheadline: "Professional tree removal, trimming, and stump grinding serving Erie, Millcreek, Harborcreek, and all of Erie County. Licensed, insured arborists.",
    metaTitle: "Best Tree Service Companies in Erie, PA — Removal & Trimming | erie.pro",
    metaDescription: "Find top-rated tree service companies in Erie, PA. Tree removal, trimming, stump grinding, emergency service. Licensed, insured professionals.",
    primaryKeywords: ["tree service erie pa", "tree removal erie", "tree trimming erie pa", "stump grinding erie", "arborist erie pa"],
    secondaryKeywords: ["emergency tree removal erie", "tree cutting erie pa", "tree pruning erie", "lot clearing erie pa", "tree service near me erie"],
    aboutDescription: "Erie's lake effect storms, heavy ice accumulation, and aging tree canopy make professional tree service critical for homeowner safety and property protection. Mature trees in Glenwood, Academy, and Frontier neighborhoods are vulnerable to storm damage, and downed trees can block roads, damage roofs, and knock out power lines. Licensed arborists keep Erie's urban forest healthy and homeowners safe.",
    commonServices: ["Tree removal (including large and hazardous trees)", "Tree trimming and pruning", "Stump grinding and removal", "Emergency storm damage cleanup", "Lot and land clearing", "Tree health assessment and diagnosis", "Cabling and bracing for weak limbs", "Firewood delivery"],
    faqItems: [
      { question: "How much does tree removal cost in Erie, PA?", answer: "Tree removal costs in Erie depend on size, location, and complexity. Small trees (under 30 feet) cost $200 to $500. Medium trees (30 to 60 feet) cost $500 to $1,500. Large trees (over 60 feet) cost $1,500 to $4,000. Hazardous removals near power lines or structures cost more. Stump grinding adds $100 to $300 per stump." },
      { question: "Do I need a permit to remove a tree in Erie?", answer: "The City of Erie requires a permit to remove trees on public property or in the public right-of-way. For trees on private property, no permit is typically required, but there may be restrictions in historic districts or if the tree is protected. Always check with the Erie City Arborist or your township before removing large trees." },
      { question: "When is the best time to trim trees in Erie?", answer: "Late winter to early spring (February to April) is the best time for most tree pruning in Erie. Trees are dormant, branch structure is visible, and disease transmission is lower. Avoid pruning oaks from April through July to prevent oak wilt. Dead or hazardous branches can and should be removed at any time of year." },
      { question: "How do I know if a tree is dangerous?", answer: "Warning signs include large dead branches, cracks or splits in the trunk, fungal growth at the base, leaning more than 15 degrees, root heaving, and hollow areas in the trunk. After Erie's ice storms, inspect trees for broken limbs and hanging branches. When in doubt, have a certified arborist assess the tree." },
      { question: "Should I hire an arborist or a tree removal company?", answer: "For trimming, health assessments, and preservation, hire an ISA-certified arborist. For straightforward removals and stump grinding, a licensed tree removal company is fine. Many Erie tree companies employ certified arborists on staff. Always verify insurance — tree work is dangerous and property damage is common without proper coverage." },
      { question: "Does insurance cover tree removal in Erie?", answer: "Homeowner's insurance typically covers tree removal if the tree falls on a structure (house, garage, fence). It usually does not cover removal of a standing dead or hazardous tree, or a tree that falls in the yard without hitting anything. After major Erie storms, check with your insurer before hiring a tree service." },
    ],
    blogTopics: ["Storm Damage and Tree Safety: What Erie Homeowners Need to Know", "Best Time to Prune Trees in Erie's Climate", "Signs Your Tree Is Dying: A Guide for Erie Property Owners", "Ice Storm Tree Damage: Prevention and Recovery in Erie", "Stump Grinding vs. Stump Removal: Which Is Right for You?", "How to Choose a Tree Service Company in Erie, PA", "Erie's Best Shade Trees for Lake Effect Resilience", "Tree Cabling and Bracing: Saving Valuable Trees in Erie", "Lot Clearing in Erie: What to Expect and What It Costs", "Emergency Tree Service: What to Do After an Erie Storm"],
    guideTopics: ["Complete Guide to Tree Removal in Erie, PA", "Erie Homeowner's Guide to Tree Maintenance", "How to Choose a Certified Arborist in Erie", "Storm-Proofing Your Trees for Erie's Lake Effect Weather", "Tree Planting Guide for Erie's Climate Zone 6a"],
    comparisonPoints: ["ISA Certified Arborist on staff", "Liability insurance and workers' compensation", "Emergency response availability", "Equipment for large and hazardous removals", "Cleanup and debris removal included", "Customer reviews and local reputation"],
    certifications: ["ISA Certified Arborist", "PA Home Improvement Contractor Registration (HICPA)", "Tree Care Industry Association (TCIA) Accredited", "OSHA Safety Certified"],
    trustSignals: ["Certified arborist on staff", "Fully insured", "Free estimates", "Emergency service available", "Cleanup included"],
    pricingRanges: [
      { service: "Small tree removal (under 30 ft)", range: "$200 – $500" },
      { service: "Medium tree removal (30-60 ft)", range: "$500 – $1,500" },
      { service: "Large tree removal (over 60 ft)", range: "$1,500 – $4,000" },
      { service: "Tree trimming", range: "$200 – $800" },
      { service: "Stump grinding", range: "$100 – $300" },
      { service: "Emergency storm cleanup", range: "$300 – $1,500" },
    ],
    emergencyServices: ["Fallen tree removal", "Hanging limb removal", "Storm damage cleanup", "Tree on structure removal", "Power line clearance (coordination with utility)"],
    seasonalTips: ["Spring: Inspect trees for winter storm damage and schedule pruning for damaged limbs", "Summer: Water newly planted trees and watch for signs of disease or pest infestation", "Fall: Remove dead wood and have weak trees cabled or braced before ice storm season", "Winter: After ice storms, inspect trees from a safe distance and call a professional for hanging branches"],
    ctaPrimary: "Find a Tree Service",
    ctaSecondary: "Compare Tree Companies",
    quoteFormTitle: "Get a Free Tree Service Quote",
    quoteFormDescription: "Describe your tree service needs and we'll connect you with top-rated Erie arborists and tree companies.",
  },

  // ── Appliance Repair ─────────────────────────────────────────────────────
  "appliance-repair": {
    slug: "appliance-repair",
    label: "Appliance Repair",
    pluralLabel: "Appliance Repair Companies",
    serviceLabel: "appliance repair services",
    heroHeadline: "Find the Best Appliance Repair in Erie, PA",
    heroSubheadline: "Expert appliance repair and service for all major brands serving Erie, Millcreek, Harborcreek, and all of Erie County. Fast, affordable repairs.",
    metaTitle: "Best Appliance Repair Services in Erie, PA | erie.pro",
    metaDescription: "Find top-rated appliance repair technicians in Erie, PA. Washer, dryer, refrigerator, dishwasher, oven repair. Same-day service available.",
    primaryKeywords: ["appliance repair erie pa", "washer repair erie", "dryer repair erie pa", "refrigerator repair erie", "dishwasher repair erie pa"],
    secondaryKeywords: ["oven repair erie pa", "appliance service near me erie", "samsung repair erie pa", "whirlpool repair erie", "appliance technician erie"],
    aboutDescription: "Erie homeowners depend on working appliances year-round, especially during long winters when furnaces, water heaters, and dryers run constantly. The region's hard water shortens appliance lifespans, and older homes in Downtown Erie and Millcreek often have electrical and plumbing configurations that complicate modern appliance installation. Local technicians who know these challenges provide faster, more accurate repairs.",
    commonServices: ["Washing machine repair", "Dryer repair and vent cleaning", "Refrigerator and freezer repair", "Dishwasher repair", "Oven and range repair", "Microwave repair", "Ice maker repair", "Garbage disposal repair and replacement"],
    faqItems: [
      { question: "How much does appliance repair cost in Erie, PA?", answer: "A typical appliance repair service call in Erie costs $75 to $125 for diagnostics. Most repairs range from $150 to $400 including parts and labor. Refrigerator compressor replacement is the most expensive common repair at $300 to $600. When the repair cost exceeds 50 percent of the appliance's value, replacement usually makes more sense." },
      { question: "Should I repair or replace my broken appliance?", answer: "The general rule: if the appliance is less than halfway through its expected lifespan and the repair costs less than 50 percent of a new unit, repair it. For example, a 5-year-old refrigerator (expected life 13 years) with a $300 repair is worth fixing. Erie's hard water can shorten lifespans, so factor in the appliance's overall condition." },
      { question: "How long do major appliances last?", answer: "Average lifespans: refrigerators 13 to 15 years, washers 10 to 14 years, dryers 13 years, dishwashers 9 to 12 years, ovens/ranges 13 to 15 years. Erie's hard water and heavy winter usage can shorten these spans. Regular maintenance, such as cleaning dryer vents and descaling, extends appliance life significantly." },
      { question: "Can you repair all brands?", answer: "Most Erie appliance repair companies service all major brands including Whirlpool, GE, Samsung, LG, Maytag, Kenmore, Frigidaire, KitchenAid, and Bosch. Some brands like Sub-Zero, Viking, and Miele require factory-certified technicians. Always confirm that the technician has experience with your specific brand." },
      { question: "How quickly can I get an appliance repaired in Erie?", answer: "Many Erie appliance repair companies offer same-day or next-day service for common issues. During peak winter months when heating-related appliances fail frequently, wait times may extend to 2 to 3 days. For faster service, call early in the day and have the appliance's make, model, and a description of the problem ready." },
      { question: "Why does Erie's hard water affect my appliances?", answer: "Erie's moderately hard municipal water causes mineral buildup (scale) inside water heaters, dishwashers, and washing machines. This buildup reduces efficiency, increases energy costs, and shortens appliance lifespan. A water softener helps, and regular descaling of appliances extends their working life by several years." },
    ],
    blogTopics: ["How Erie's Hard Water Affects Your Appliances", "Repair or Replace? A Guide for Erie Homeowners", "Dryer Vent Cleaning: Why It Matters More Than You Think", "Top 5 Refrigerator Problems and What to Do About Them", "Dishwasher Maintenance Tips for Hard Water Areas", "When Your Washing Machine Won't Drain: Troubleshooting Guide", "How to Extend the Life of Your Appliances in Erie's Climate", "Choosing Energy-Efficient Appliances for Erie Homes", "Oven Not Heating? Common Causes and Fixes", "Smart Appliances: Are They Worth the Investment?"],
    guideTopics: ["Complete Guide to Appliance Repair in Erie, PA", "Erie Homeowner's Guide to Appliance Maintenance", "How to Choose an Appliance Repair Technician in Erie", "Appliance Lifespan Guide: When to Repair vs. Replace", "Water Softener Guide for Protecting Erie Appliances"],
    comparisonPoints: ["Brands and appliance types serviced", "Factory-authorized service certifications", "Same-day service availability", "Diagnostic fee and whether it applies to repair cost", "Parts warranty and labor guarantee", "Customer reviews and repeat service rate"],
    certifications: ["EPA 608 Certification (for refrigerant-handling appliances)", "Factory-Authorized Service (brand-specific)", "NASTeC Certified Technician", "OSHA Safety Certified"],
    trustSignals: ["Factory-authorized service", "Fully insured", "Same-day service available", "Parts and labor warranty", "Transparent pricing"],
    pricingRanges: [
      { service: "Service call / diagnostic", range: "$75 – $125" },
      { service: "Washer or dryer repair", range: "$150 – $350" },
      { service: "Refrigerator repair", range: "$150 – $400" },
      { service: "Dishwasher repair", range: "$125 – $300" },
      { service: "Oven or range repair", range: "$150 – $400" },
      { service: "Garbage disposal replacement", range: "$150 – $350" },
    ],
    emergencyServices: ["Refrigerator not cooling (food safety)", "Gas appliance leak or smell", "Washing machine flooding"],
    seasonalTips: ["Spring: Clean dryer vents and behind refrigerators; service your AC before summer", "Summer: Check refrigerator coils and ensure the unit is not working overtime in the heat", "Fall: Service your furnace and water heater before Erie's long heating season", "Winter: Keep dryer vents clear of snow and ice; check water heater performance during heavy use"],
    ctaPrimary: "Find Appliance Repair",
    ctaSecondary: "Compare Repair Services",
    quoteFormTitle: "Get a Free Appliance Repair Quote",
    quoteFormDescription: "Describe your appliance issue and we'll connect you with top-rated Erie repair technicians.",
  },

  // ── Foundation ───────────────────────────────────────────────────────────
  foundation: {
    slug: "foundation",
    label: "Foundation",
    pluralLabel: "Foundation Repair Companies",
    serviceLabel: "foundation repair services",
    heroHeadline: "Find the Best Foundation Repair in Erie, PA",
    heroSubheadline: "Expert foundation repair, waterproofing, and structural services serving Erie, Millcreek, Harborcreek, and all of Erie County. Free inspections.",
    metaTitle: "Best Foundation Repair Companies in Erie, PA | erie.pro",
    metaDescription: "Find top-rated foundation repair companies in Erie, PA. Crack repair, waterproofing, structural stabilization. Licensed professionals with free inspections.",
    primaryKeywords: ["foundation repair erie pa", "basement waterproofing erie", "foundation crack repair erie pa", "structural repair erie", "foundation company erie"],
    secondaryKeywords: ["basement leak repair erie pa", "foundation contractor near me erie", "bowed wall repair erie", "crawl space repair erie pa", "house leveling erie"],
    aboutDescription: "Erie's freeze-thaw cycles, high water table, and heavy precipitation create serious foundation challenges for homeowners. Basement flooding is common in low-lying neighborhoods like Glenwood and parts of South Erie, especially during spring snowmelt. Homes built before 1970 in Downtown Erie and Little Italy often need crack sealing, waterproofing, and structural reinforcement to stay dry and stable.",
    commonServices: ["Foundation crack repair (epoxy and polyurethane injection)", "Basement waterproofing (interior and exterior)", "Bowed and leaning wall stabilization", "Sump pump installation and repair", "French drain and drainage systems", "Crawl space encapsulation", "House leveling and pier installation", "Structural inspections and assessments"],
    faqItems: [
      { question: "How much does foundation repair cost in Erie, PA?", answer: "Foundation repair costs in Erie vary widely depending on the problem. Minor crack sealing runs $250 to $800. Interior basement waterproofing with a drainage system costs $3,000 to $8,000. Bowed wall stabilization with carbon fiber strips or wall anchors runs $3,000 to $12,000. Full exterior waterproofing costs $8,000 to $15,000. Always get multiple inspections." },
      { question: "Why do Erie basements leak so much?", answer: "Erie's combination of heavy precipitation (over 100 inches of snow plus rain), a high water table, and older construction creates a perfect storm for basement water problems. Freeze-thaw cycles crack foundation walls, hydrostatic pressure pushes water through cracks, and many older Erie homes lack modern drainage and waterproofing. Spring snowmelt is the peak season for basement flooding." },
      { question: "What are signs of foundation problems?", answer: "Watch for horizontal or stair-step cracks in foundation walls, doors and windows that stick or do not close properly, uneven or sloping floors, gaps between walls and ceilings, water stains or efflorescence on basement walls, and bowing or leaning basement walls. If you notice any of these in your Erie home, schedule a professional inspection promptly." },
      { question: "Is a wet basement a sign of foundation failure?", answer: "Not necessarily. Many Erie basements experience water intrusion due to poor drainage, clogged gutters, or insufficient grading rather than structural failure. However, persistent water can weaken a foundation over time. A professional inspection distinguishes between drainage issues (fixable) and structural problems (more serious)." },
      { question: "Do I need a permit for foundation repair in Erie?", answer: "Structural repairs in Erie County typically require a building permit, especially for pier installation, wall stabilization, or any work that affects the structural integrity of the home. Interior waterproofing and crack injection usually do not require permits. Your contractor should know the requirements and handle the permitting process." },
      { question: "How does Erie's freeze-thaw cycle affect my foundation?", answer: "When water in the soil around your foundation freezes, it expands and pushes against the walls. When it thaws, the soil contracts and leaves gaps. Over hundreds of freeze-thaw cycles each winter, this pressure cracks concrete, displaces walls, and creates pathways for water. Proper drainage and exterior waterproofing are the best defenses." },
    ],
    blogTopics: ["Why Erie Basements Leak: Causes and Solutions", "Foundation Crack Types: What's Serious and What's Normal", "Interior vs. Exterior Waterproofing for Erie Homes", "How Freeze-Thaw Cycles Damage Erie Foundations", "Sump Pump Guide for Erie's High Water Table", "Signs Your Erie Home Has Foundation Problems", "Crawl Space Encapsulation: Is It Worth It in Erie?", "French Drain Installation for Erie Properties", "Spring Basement Flooding: Prevention Checklist for Erie", "How to Choose a Foundation Repair Company in Erie"],
    guideTopics: ["Complete Guide to Foundation Repair in Erie, PA", "Erie Homeowner's Guide to Basement Waterproofing", "Understanding Foundation Cracks: A Guide for Erie Homeowners", "Sump Pump Buyer's Guide for Erie's Climate", "Crawl Space Solutions for Erie Homes"],
    comparisonPoints: ["PA Home Improvement Contractor Registration", "Structural engineer on staff or affiliated", "Warranty terms (transferable to new owners)", "Methods offered (carbon fiber, steel braces, piers, injection)", "Experience with Erie's soil and water conditions", "Free inspections and written estimates"],
    certifications: ["PA Home Improvement Contractor Registration (HICPA)", "Structural Waterproofing Certification", "Foundation Repair Network Certified", "OSHA Safety Certified"],
    trustSignals: ["Licensed in Pennsylvania", "Fully insured", "Free inspections", "Transferable warranty", "Structural engineer consultation available"],
    pricingRanges: [
      { service: "Crack injection repair", range: "$250 – $800" },
      { service: "Interior drain system", range: "$3,000 – $8,000" },
      { service: "Sump pump installation", range: "$800 – $2,000" },
      { service: "Wall stabilization", range: "$3,000 – $12,000" },
      { service: "Exterior waterproofing", range: "$8,000 – $15,000" },
      { service: "Crawl space encapsulation", range: "$3,000 – $8,000" },
    ],
    emergencyServices: ["Active basement flooding", "Bowed wall emergency stabilization", "Sump pump failure during storms", "Sewer backup into basement"],
    seasonalTips: ["Spring: Inspect foundation for new cracks after freeze-thaw season; test sump pumps before snowmelt peak", "Summer: Grade soil away from foundation walls; clean and extend downspout drainage", "Fall: Clear gutters and verify drainage before winter; inspect sump pump and backup battery", "Winter: Monitor basement for water intrusion during thaws; keep sump pump discharge line clear of ice"],
    ctaPrimary: "Find Foundation Repair",
    ctaSecondary: "Compare Foundation Companies",
    quoteFormTitle: "Get a Free Foundation Inspection",
    quoteFormDescription: "Describe your foundation or basement issue and we'll connect you with top-rated Erie foundation repair professionals.",
  },

  // ── Home Security ────────────────────────────────────────────────────────
  "home-security": {
    slug: "home-security",
    label: "Home Security",
    pluralLabel: "Home Security Companies",
    serviceLabel: "home security services",
    heroHeadline: "Find the Best Home Security in Erie, PA",
    heroSubheadline: "Professional home security installation and monitoring serving Erie, Millcreek, Harborcreek, and all of Erie County. Smart systems, 24/7 monitoring.",
    metaTitle: "Best Home Security Companies in Erie, PA | erie.pro",
    metaDescription: "Find top-rated home security companies in Erie, PA. Alarm systems, cameras, smart locks, 24/7 monitoring. Professional installation with free quotes.",
    primaryKeywords: ["home security erie pa", "security system erie", "home alarm erie pa", "security cameras erie", "home security installation erie"],
    secondaryKeywords: ["smart home security erie pa", "security monitoring erie", "doorbell camera erie pa", "security company near me erie", "burglar alarm erie"],
    aboutDescription: "Erie residents across Millcreek, Downtown, and Harborcreek invest in home security for protection and peace of mind. With variable weather conditions that can knock out power and affect connectivity, Erie homeowners need security systems designed for reliability in all seasons. Modern systems include smart locks, cameras, and 24/7 professional monitoring that works even during lake effect storms.",
    commonServices: ["Home security system installation", "Security camera installation (indoor and outdoor)", "24/7 professional monitoring", "Smart lock and access control installation", "Video doorbell installation", "Alarm system upgrades and modernization", "Home automation integration", "Fire and carbon monoxide monitoring"],
    faqItems: [
      { question: "How much does a home security system cost in Erie, PA?", answer: "A basic home security system in Erie costs $200 to $500 for equipment and installation. Mid-range systems with cameras and smart features run $500 to $1,500. Premium whole-home systems cost $1,500 to $3,000 or more. Monthly monitoring fees range from $15 to $60 depending on the service level. Some companies offer free equipment with a monitoring contract." },
      { question: "Do security cameras work in Erie's winter weather?", answer: "Yes, but choose cameras rated for cold weather operation (at least -20 degrees Fahrenheit). Look for models with heated lenses to prevent frost buildup and infrared night vision for Erie's short winter days. Wired cameras are more reliable than wireless in extreme cold because batteries lose capacity in frigid temperatures." },
      { question: "What happens to my security system during a power outage?", answer: "Quality security systems include battery backups that keep the system running for 4 to 24 hours during outages. Cellular-connected systems continue communicating with the monitoring center even when power and internet are down. This is important for Erie where lake effect storms can cause extended outages." },
      { question: "Is professional monitoring worth it?", answer: "Professional monitoring typically costs $20 to $50 per month and provides 24/7 response even when you are not home. The monitoring center contacts you and dispatches police or fire if an alarm is triggered. For Erie homeowners who travel or have vacation properties, professional monitoring provides essential peace of mind." },
      { question: "Can I install a security system myself?", answer: "DIY systems from companies like Ring, SimpliSafe, and Wyze are available and work well for basic security. However, professional installation ensures optimal camera placement, proper wiring, and integration with your home's electrical system. Professional systems also typically offer more reliable monitoring and longer equipment warranties." },
      { question: "Do security systems really deter burglars?", answer: "Studies consistently show that homes with visible security systems are significantly less likely to be burglarized. Security cameras, alarm signs, and smart lighting all serve as deterrents. In Erie, combining a monitored alarm system with security cameras and smart locks provides the most comprehensive protection." },
    ],
    blogTopics: ["Best Security Cameras for Erie's Cold Weather", "Home Security During Power Outages: A Guide for Erie Homeowners", "Smart Locks vs. Traditional Locks: What Erie Residents Should Know", "How to Choose a Home Security System for Erie's Climate", "Video Doorbell Guide for Erie Homeowners", "Professional vs. DIY Home Security: Pros and Cons", "Home Security Tips for Erie Vacation Homeowners", "Fire and CO Monitoring: Essential Safety for Erie Homes", "Securing Your Home Before an Erie Winter Storm", "Neighborhood Watch and Home Security in Erie Communities"],
    guideTopics: ["Complete Guide to Home Security in Erie, PA", "Erie Homeowner's Guide to Security Camera Systems", "Smart Home Security Buyer's Guide", "How to Choose a Security Monitoring Service in Erie", "Home Security Checklist for Erie Homeowners"],
    comparisonPoints: ["Monitoring options (professional, self, hybrid)", "Equipment quality and warranty", "Contract terms and cancellation policy", "Cold-weather rated equipment", "Cellular backup during power outages", "Smart home integration capabilities"],
    certifications: ["PA Licensed Alarm Business", "UL Listed Monitoring Center", "Electronic Security Association (ESA) Member", "NICET Certified (fire alarm systems)"],
    trustSignals: ["Licensed alarm business", "24/7 monitoring", "Free security assessment", "No-obligation quotes", "Cellular backup included"],
    pricingRanges: [
      { service: "Basic alarm system (installed)", range: "$200 – $500" },
      { service: "Camera system (4 cameras)", range: "$500 – $1,500" },
      { service: "Smart lock installation", range: "$150 – $400" },
      { service: "Video doorbell (installed)", range: "$150 – $350" },
      { service: "Whole-home system (installed)", range: "$1,500 – $3,000" },
      { service: "Monthly monitoring", range: "$15 – $60/month" },
    ],
    emergencyServices: ["Alarm system failure repair", "Break-in damage repair and system restoration", "Emergency camera installation"],
    seasonalTips: ["Spring: Test all sensors, replace batteries, and update system firmware", "Summer: Adjust camera angles for longer daylight; set vacation mode when traveling", "Fall: Test battery backups before winter storm season; verify cellular connectivity", "Winter: Keep camera lenses clear of ice and snow; ensure outdoor sensors are not obstructed"],
    ctaPrimary: "Find Home Security",
    ctaSecondary: "Compare Security Companies",
    quoteFormTitle: "Get a Free Security Assessment",
    quoteFormDescription: "Tell us about your home security needs and we'll connect you with top-rated Erie security professionals.",
  },

  // ── Concrete ─────────────────────────────────────────────────────────────
  concrete: {
    slug: "concrete",
    label: "Concrete",
    pluralLabel: "Concrete Contractors",
    serviceLabel: "concrete services",
    heroHeadline: "Find the Best Concrete Contractor in Erie, PA",
    heroSubheadline: "Professional concrete installation, repair, and replacement serving Erie, Millcreek, Harborcreek, and all of Erie County. Driveways, patios, foundations.",
    metaTitle: "Best Concrete Contractors in Erie, PA — Driveways, Patios, Repair | erie.pro",
    metaDescription: "Find top-rated concrete contractors in Erie, PA. Driveways, patios, sidewalks, foundations, repair. Licensed, insured professionals with free estimates.",
    primaryKeywords: ["concrete contractor erie pa", "concrete driveway erie", "concrete repair erie pa", "concrete patio erie", "stamped concrete erie pa"],
    secondaryKeywords: ["concrete sidewalk erie pa", "concrete foundation erie", "concrete contractor near me erie", "concrete slab erie pa", "concrete replacement erie"],
    aboutDescription: "Erie's 101 inches of annual snowfall, road salt, and relentless freeze-thaw cycles are extremely hard on concrete surfaces. Driveways, sidewalks, and patios throughout Millcreek, Fairview, and Summit Township frequently crack, spall, and heave. Proper installation with air-entrained concrete, adequate reinforcement, and correct joint spacing is essential for long-lasting results in Erie's demanding climate.",
    commonServices: ["Driveway installation and replacement", "Patio and outdoor living areas", "Sidewalk and walkway installation", "Foundation and footing work", "Stamped and decorative concrete", "Concrete repair and resurfacing", "Retaining walls", "Garage floor installation and coating"],
    faqItems: [
      { question: "How much does a concrete driveway cost in Erie, PA?", answer: "A standard concrete driveway in Erie costs $6 to $12 per square foot for a plain finish. A typical two-car driveway (600 square feet) runs $3,600 to $7,200. Stamped or colored concrete adds $3 to $6 per square foot. Removal of the old driveway adds $2 to $4 per square foot. Always specify air-entrained concrete for Erie's freeze-thaw resistance." },
      { question: "Why does concrete crack so much in Erie?", answer: "Erie's freeze-thaw cycles are the primary culprit. Water seeps into pores and cracks in concrete, freezes and expands, then thaws and contracts. This happens dozens of times each winter. Road salt accelerates the damage by increasing the number of freeze-thaw cycles at the concrete surface. Proper installation with air-entrained concrete, control joints, and good drainage minimizes cracking." },
      { question: "What is the best time to pour concrete in Erie?", answer: "May through October is the ideal window for concrete work in Erie. Concrete needs temperatures above 50 degrees for proper curing, and the mix should not freeze within the first 48 hours. Spring and fall pours require cold-weather precautions. Winter pours are possible but require heated enclosures and insulating blankets, adding significant cost." },
      { question: "Should I seal my concrete in Erie?", answer: "Absolutely. A quality concrete sealer protects against Erie's salt damage, freeze-thaw spalling, and moisture penetration. Apply a penetrating sealer every 2 to 3 years for the best protection. New concrete should be sealed 28 days after pouring. Sealing is the single most effective step to extend the life of any concrete surface in Erie." },
      { question: "Can cracked concrete be repaired or does it need replacement?", answer: "Minor cracks (hairline to 1/4 inch) can be repaired with epoxy or polyurethane injection. Moderate cracking with some displacement can be addressed with mudjacking or foam leveling. Severe cracking, heaving, or spalling across large areas generally requires full replacement. A professional assessment determines the most cost-effective approach." },
      { question: "What is air-entrained concrete and why does it matter in Erie?", answer: "Air-entrained concrete contains tiny air bubbles that give the mix room to expand when water inside freezes. This dramatically reduces cracking and spalling in freeze-thaw climates. In Erie, air-entrained concrete (4 to 7 percent air content) is essential for any exterior concrete work. Always confirm your contractor uses it." },
    ],
    blogTopics: ["Why Erie's Climate Is So Hard on Concrete", "Concrete Driveway Guide for Erie Homeowners", "Stamped Concrete: Options and Costs for Erie Properties", "How to Protect Your Concrete from Erie's Salt and Freeze-Thaw Cycles", "Concrete vs. Pavers: Which Is Better for Erie Driveways?", "When to Repair vs. Replace Concrete in Erie", "The Importance of Concrete Sealing in Lake Effect Climates", "Garage Floor Coatings for Erie's Wet and Salty Winters", "Retaining Walls: Concrete Options for Erie Slopes", "Decorative Concrete Ideas for Erie Outdoor Living Spaces"],
    guideTopics: ["Complete Guide to Concrete Installation in Erie, PA", "Erie Homeowner's Guide to Driveway Replacement", "Concrete Maintenance Guide for Erie's Climate", "How to Choose a Concrete Contractor in Erie", "Understanding Concrete Grades and Mixes for Cold Climates"],
    comparisonPoints: ["PA Home Improvement Contractor Registration", "Experience with Erie's freeze-thaw conditions", "Use of air-entrained concrete for all exterior work", "Warranty terms and coverage", "Concrete mix quality and reinforcement standards", "Customer reviews and project portfolio"],
    certifications: ["PA Home Improvement Contractor Registration (HICPA)", "American Concrete Institute (ACI) Certified", "OSHA Safety Certified", "Stamped Concrete Certification"],
    trustSignals: ["Licensed in Pennsylvania", "Fully insured", "Free estimates", "Air-entrained concrete standard", "Warranty on all work"],
    pricingRanges: [
      { service: "Plain concrete (per sq ft)", range: "$6 – $12" },
      { service: "Stamped concrete (per sq ft)", range: "$10 – $18" },
      { service: "Sidewalk (per linear ft)", range: "$8 – $16" },
      { service: "Concrete repair (per sq ft)", range: "$3 – $8" },
      { service: "Concrete sealing (per sq ft)", range: "$0.50 – $2" },
      { service: "Retaining wall (per linear ft)", range: "$25 – $60" },
    ],
    emergencyServices: ["Trip hazard sidewalk grinding", "Emergency foundation work"],
    seasonalTips: ["Spring: Inspect all concrete surfaces for winter damage; schedule repairs before the pouring season begins", "Summer: Ideal time for new concrete installation; schedule early to secure your preferred contractor", "Fall: Apply concrete sealer before the first freeze for maximum winter protection", "Winter: Avoid deicing chemicals containing ammonium nitrate or ammonium sulfate; use calcium chloride or sand instead"],
    ctaPrimary: "Find a Concrete Contractor",
    ctaSecondary: "Compare Concrete Companies",
    quoteFormTitle: "Get a Free Concrete Quote",
    quoteFormDescription: "Describe your concrete project and we'll connect you with top-rated Erie concrete contractors.",
  },

  // ── Septic ───────────────────────────────────────────────────────────────
  septic: {
    slug: "septic",
    label: "Septic",
    pluralLabel: "Septic Companies",
    serviceLabel: "septic services",
    heroHeadline: "Find the Best Septic Service in Erie, PA",
    heroSubheadline: "Professional septic pumping, inspection, and repair serving Erie County, Harborcreek, Fairview, and Summit Township. Licensed, certified technicians.",
    metaTitle: "Best Septic Services in Erie, PA — Pumping, Repair, Installation | erie.pro",
    metaDescription: "Find top-rated septic companies in Erie County, PA. Pumping, inspection, repair, installation. Licensed professionals with free estimates.",
    primaryKeywords: ["septic service erie pa", "septic pumping erie", "septic repair erie pa", "septic inspection erie county", "septic tank erie pa"],
    secondaryKeywords: ["septic installation erie pa", "septic company near me erie", "drain field repair erie pa", "septic system inspection erie", "grease trap pumping erie"],
    aboutDescription: "Many homes in Erie County's outer communities of Harborcreek, Fairview, and Summit Township rely on septic systems rather than municipal sewer. Erie's high water table, heavy precipitation, and clay-heavy soils create unique demands on septic systems. Regular pumping, proper maintenance, and professional inspections are essential to prevent failures that can contaminate groundwater and create costly emergencies.",
    commonServices: ["Septic tank pumping", "Septic system inspection", "Drain field repair and replacement", "Septic system installation", "Grease trap pumping", "Septic tank repair", "Septic system design and permitting", "Emergency septic service"],
    faqItems: [
      { question: "How much does septic pumping cost in Erie County?", answer: "Septic tank pumping in Erie County typically costs $300 to $550 for a standard 1,000 to 1,500-gallon tank. Larger tanks or tanks requiring extra access work cost more. Pumping should be done every 3 to 5 years for a typical household. Waiting too long leads to solids entering the drain field, which is far more expensive to repair." },
      { question: "How often should my septic tank be pumped in Erie?", answer: "For a typical Erie County household (3 to 4 people), pumping every 3 to 5 years is recommended. Larger families or homes with garbage disposals should pump more frequently. Erie's heavy precipitation and high water table can increase the load on your system, so erring on the side of more frequent pumping is wise." },
      { question: "What are signs of septic system failure?", answer: "Warning signs include slow-draining sinks and toilets throughout the house, sewage odors near the tank or drain field, standing water or soggy ground over the drain field, unusually lush green grass over the drain field area, and sewage backups into the house. If you notice any of these in your Erie home, call a septic professional immediately." },
      { question: "Do septic systems need inspections in Pennsylvania?", answer: "Pennsylvania recommends septic inspections every 3 years and requires them for real estate transactions in many jurisdictions. Erie County requires a satisfactory septic inspection for property sales involving septic systems. Some townships require periodic inspections and pump-out certifications. Check your local requirements." },
      { question: "How long does a septic system last?", answer: "A well-maintained septic tank can last 20 to 40 years. Concrete tanks may last longer than plastic. The drain field typically lasts 15 to 25 years. Erie's clay soils and high water table can shorten drain field life if the system was not properly designed for local conditions. Regular pumping and careful water use are the keys to longevity." },
      { question: "Can I use a garbage disposal with a septic system?", answer: "You can, but it increases the solids load in your tank significantly. If you use a garbage disposal, plan on pumping your septic tank every 2 to 3 years instead of every 3 to 5. Some Erie homeowners choose composting over disposal use to protect their septic system. At minimum, avoid putting grease, bones, and fibrous foods down the disposal." },
    ],
    blogTopics: ["Septic System Maintenance Guide for Erie County Homeowners", "How Erie's Soil and Water Table Affect Your Septic System", "Signs Your Septic System Is Failing: What to Watch For", "Septic Inspection Requirements for Erie County Real Estate Sales", "Winter Septic Care Tips for Erie's Cold Climate", "Drain Field Problems: Causes and Solutions for Erie Homes", "How to Extend the Life of Your Septic System in Erie", "Septic vs. Municipal Sewer: What Erie County Homebuyers Should Know", "Grease Trap Maintenance for Erie Restaurants and Homes", "Choosing the Right Septic System Design for Erie County Soils"],
    guideTopics: ["Complete Guide to Septic Systems in Erie County", "Erie Homeowner's Guide to Septic Maintenance", "Septic System Buyer's Guide for Erie County Properties", "How to Choose a Septic Service Company in Erie", "Understanding Erie County Septic Regulations and Permits"],
    comparisonPoints: ["PA Sewage Enforcement Officer (SEO) certification", "Experience with Erie County soil conditions", "Emergency service availability", "Pumping equipment capacity and modern inspection tools", "Customer reviews and service history", "Transparent pricing and written estimates"],
    certifications: ["PA Certified Sewage Enforcement Officer (SEO)", "PA Home Improvement Contractor Registration (HICPA)", "National Onsite Wastewater Recycling Association (NOWRA) Member", "OSHA Safety Certified"],
    trustSignals: ["Certified SEO technicians", "Fully insured", "Free estimates", "Emergency service available", "Proper waste disposal certified"],
    pricingRanges: [
      { service: "Septic pumping (1,000 gal)", range: "$300 – $550" },
      { service: "Septic inspection", range: "$200 – $400" },
      { service: "Drain field repair", range: "$2,000 – $10,000" },
      { service: "New septic system", range: "$10,000 – $25,000" },
      { service: "Septic tank repair", range: "$500 – $3,000" },
      { service: "Grease trap pumping", range: "$200 – $400" },
    ],
    emergencyServices: ["Septic backup into home", "Sewage surfacing in yard", "Failed pump or alarm", "Overflowing septic tank"],
    seasonalTips: ["Spring: Schedule pumping before spring rains raise the water table and strain your system", "Summer: Conserve water during high-use months to reduce the load on your drain field", "Fall: Have your system inspected and pumped if due; insulate exposed pipes before winter", "Winter: Maintain snow cover over the drain field for insulation; avoid driving or parking on the field"],
    ctaPrimary: "Find Septic Service",
    ctaSecondary: "Compare Septic Companies",
    quoteFormTitle: "Get a Free Septic Quote",
    quoteFormDescription: "Describe your septic needs and we'll connect you with top-rated Erie County septic professionals.",
  },

  // ── Chimney ──────────────────────────────────────────────────────────────
  chimney: {
    slug: "chimney",
    label: "Chimney",
    pluralLabel: "Chimney Companies",
    serviceLabel: "chimney services",
    heroHeadline: "Find the Best Chimney Service in Erie, PA",
    heroSubheadline: "Professional chimney cleaning, inspection, and repair serving Erie, Millcreek, Harborcreek, and all of Erie County. Certified sweeps and masons.",
    metaTitle: "Best Chimney Services in Erie, PA — Cleaning, Repair, Inspection | erie.pro",
    metaDescription: "Find top-rated chimney companies in Erie, PA. Chimney cleaning, inspection, repair, relining. Certified chimney sweeps with free estimates.",
    primaryKeywords: ["chimney cleaning erie pa", "chimney repair erie", "chimney sweep erie pa", "chimney inspection erie", "chimney service erie pa"],
    secondaryKeywords: ["chimney relining erie pa", "chimney cap installation erie", "chimney mason erie pa", "fireplace repair erie", "chimney company near me erie"],
    aboutDescription: "Erie homeowners rely heavily on fireplaces and wood stoves during long, cold winters. Lake effect moisture accelerates chimney deterioration, and freeze-thaw cycles crack mortar joints and damage flue liners. Annual chimney inspections and cleanings are critical for fire safety, and Erie's older homes in Downtown, Glenwood, and Academy often need tuckpointing, relining, or complete chimney rebuilds.",
    commonServices: ["Chimney cleaning and sweeping", "Chimney inspection (Level 1, 2, and 3)", "Chimney cap and crown repair", "Tuckpointing and masonry repair", "Chimney relining (stainless steel and clay)", "Fireplace repair and restoration", "Chimney waterproofing", "Creosote removal"],
    faqItems: [
      { question: "How much does chimney cleaning cost in Erie, PA?", answer: "A standard chimney cleaning (sweep) in Erie costs $150 to $300 depending on the chimney type and condition. A Level 1 inspection is typically included with a cleaning. Level 2 inspections with camera scoping cost $200 to $500 additional. Chimney repairs vary widely from $200 for minor mortar work to $5,000 or more for a full reline or rebuild." },
      { question: "How often should I have my chimney cleaned in Erie?", answer: "The National Fire Protection Association recommends annual chimney inspections and cleaning as needed. If you use your fireplace or wood stove regularly during Erie's long winters, you will likely need cleaning every year. Creosote — the flammable residue that builds up inside chimneys — is the leading cause of chimney fires." },
      { question: "What are signs my chimney needs repair?", answer: "Watch for crumbling mortar between bricks, white staining (efflorescence) on exterior brickwork, a damaged or missing chimney cap, water stains on the ceiling near the chimney, a strong odor from the fireplace during summer, and pieces of flue tile in the firebox. Erie's freeze-thaw cycles accelerate all of these problems." },
      { question: "Why is my chimney leaking water?", answer: "The most common causes of chimney leaks in Erie are a cracked or deteriorated chimney crown, missing or damaged chimney cap, failed flashing where the chimney meets the roof, and damaged mortar joints. Erie's heavy precipitation and freeze-thaw cycles make chimney waterproofing and proper maintenance essential to prevent leaks." },
      { question: "Do I need a chimney liner?", answer: "All chimneys need a functional liner to safely vent combustion gases and protect the chimney structure from heat and corrosion. Many older Erie homes have clay tile liners that may be cracked or deteriorating. Stainless steel relining costs $1,500 to $3,500 and provides a safe, long-lasting solution. A Level 2 inspection can determine your liner's condition." },
      { question: "Can I use my chimney if I see cracks in the flue?", answer: "No. A cracked flue liner is a serious fire and carbon monoxide hazard. Combustion gases and heat can escape through cracks into the surrounding wood framing. If an inspection reveals flue damage, stop using the fireplace immediately and have the chimney relined. This is especially critical during Erie's heating season." },
    ],
    blogTopics: ["Chimney Safety for Erie's Long Heating Season", "How Freeze-Thaw Cycles Damage Erie Chimneys", "Creosote Buildup: Why Annual Cleaning Matters in Erie", "Chimney Relining: When Your Erie Home Needs It", "How to Prevent Chimney Leaks in Lake Effect Snow Country", "Chimney Cap Installation: Protecting Your Erie Chimney", "Tuckpointing: Restoring Erie's Aging Chimney Masonry", "Wood Stove vs. Fireplace: Chimney Considerations for Erie Homes", "Carbon Monoxide Safety and Your Chimney", "How to Choose a Chimney Sweep in Erie, PA"],
    guideTopics: ["Complete Guide to Chimney Maintenance in Erie, PA", "Erie Homeowner's Guide to Chimney Inspections", "Chimney Relining Guide for Older Erie Homes", "How to Choose a Certified Chimney Sweep in Erie", "Fireplace Safety Guide for Erie's Heating Season"],
    comparisonPoints: ["CSIA Certified Chimney Sweep", "NFI Certified (for fireplace and stove work)", "Insurance and liability coverage", "Experience with older Erie chimney construction", "Masonry repair and relining capabilities", "Customer reviews and inspection thoroughness"],
    certifications: ["Chimney Safety Institute of America (CSIA) Certified", "National Fireplace Institute (NFI) Certified", "PA Home Improvement Contractor Registration (HICPA)", "OSHA Safety Certified"],
    trustSignals: ["CSIA certified sweep", "Fully insured", "Free estimates", "Annual inspection reports provided", "Before and after documentation"],
    pricingRanges: [
      { service: "Chimney cleaning (sweep)", range: "$150 – $300" },
      { service: "Level 2 inspection (with camera)", range: "$200 – $500" },
      { service: "Chimney cap installation", range: "$150 – $400" },
      { service: "Tuckpointing (per linear ft)", range: "$15 – $30" },
      { service: "Chimney relining", range: "$1,500 – $3,500" },
      { service: "Crown repair or replacement", range: "$300 – $1,500" },
    ],
    emergencyServices: ["Chimney fire response and assessment", "Carbon monoxide leak investigation", "Storm-damaged chimney stabilization", "Animal removal from chimney"],
    seasonalTips: ["Fall: Schedule chimney cleaning and inspection before the first fire of the season", "Winter: Burn only seasoned hardwood; check for creosote buildup monthly during heavy use", "Spring: Inspect chimney exterior for freeze-thaw damage to mortar and crown", "Summer: Schedule masonry repairs, waterproofing, and relining during the off-season for best pricing"],
    ctaPrimary: "Find Chimney Service",
    ctaSecondary: "Compare Chimney Companies",
    quoteFormTitle: "Get a Free Chimney Quote",
    quoteFormDescription: "Describe your chimney needs and we'll connect you with top-rated Erie chimney professionals.",
  },

  // ── Pool & Spa Services ──────────────────────────────────────────────────
  "pool-spa": {
    slug: "pool-spa",
    label: "Pool & Spa",
    pluralLabel: "Pool & Spa Companies",
    serviceLabel: "pool and spa services",
    heroHeadline: "Find the Best Pool & Spa Service in Erie, PA",
    heroSubheadline: "Professional pool maintenance, repair, and installation serving Erie, Millcreek, Harborcreek, and surrounding communities. Keep your pool pristine year-round.",
    metaTitle: "Best Pool & Spa Services in Erie, PA — Maintenance & Repair | erie.pro",
    metaDescription: "Find top-rated pool and spa companies in Erie, PA. Pool maintenance, repair, installation, hot tub service. Licensed professionals with free estimates.",
    primaryKeywords: ["pool service erie pa", "spa repair erie", "pool maintenance erie pa", "hot tub repair erie"],
    secondaryKeywords: ["pool installation erie pa", "pool cleaning erie", "pool opening erie", "pool closing erie", "inground pool erie"],
    aboutDescription: "Erie's short but intense summers make pool ownership a prized luxury, and the harsh winters demand proper closing and winterization. From pool openings in May to closings in October, Erie pool owners need reliable service professionals who understand the unique challenges of maintaining pools in a lake effect climate with dramatic temperature swings.",
    commonServices: ["Pool opening and closing", "Weekly pool maintenance", "Pool equipment repair", "Hot tub and spa service", "Pool liner replacement", "Pool heater installation", "Water chemistry balancing", "Pool leak detection"],
    faqItems: [
      { question: "How much does pool maintenance cost in Erie, PA?", answer: "Weekly pool maintenance in Erie typically costs $100 to $200 per month. Pool opening in spring runs $200 to $400, and closing for winter costs $250 to $500. Equipment repairs like pump or filter replacement range from $300 to $1,500." },
      { question: "When should I open my pool in Erie?", answer: "Most Erie pool owners open their pools between mid-May and early June, once overnight temperatures consistently stay above 50°F. Opening too early wastes chemicals and energy, while waiting too long allows algae growth under winter covers." },
      { question: "How do I winterize my pool in Erie?", answer: "Erie's harsh winters require thorough winterization: balance water chemistry, lower the water level, blow out plumbing lines, add winterizing chemicals, and install a quality winter cover. Most Erie pool companies recommend closing by mid-October before the first hard freeze." },
      { question: "Can I have an inground pool in Erie?", answer: "Yes, inground pools are popular in Erie suburbs like Millcreek and Harborcreek. The frost line in Erie is about 42 inches, so pool plumbing must be properly buried and winterized. Vinyl liner pools are most common due to cost, though fiberglass and concrete are also options." },
      { question: "How often should hot tub water be changed in Erie?", answer: "Hot tub water should be drained and refilled every 3 to 4 months, or more often with heavy use. Erie's hard water can cause scale buildup, so using a pre-filter when filling and maintaining proper chemical balance is important." },
      { question: "What does a pool leak detection service cost?", answer: "Professional pool leak detection in Erie ranges from $200 to $500. If you notice your pool losing more than a quarter inch of water per day beyond normal evaporation, a leak is likely. Early detection prevents costly structural damage." },
    ],
    blogTopics: ["Pool Opening Checklist for Erie Homeowners", "How Erie's Climate Affects Pool Maintenance", "Hot Tub Maintenance Tips for Erie Winters", "Choosing the Right Pool Type for Erie's Climate", "Energy-Efficient Pool Heating in Northwest PA"],
    guideTopics: ["Complete Pool Winterization Guide for Erie, PA", "Erie Homeowner's Guide to Pool Installation", "Hot Tub Buying Guide for Erie's Climate", "Pool Chemical Balance Guide for Erie Water"],
    comparisonPoints: ["Licensed and insured", "Experience with Erie's climate challenges", "Service response time", "Chemical delivery and supply options"],
    certifications: ["Certified Pool Operator (CPO)", "Association of Pool & Spa Professionals (APSP)", "PA Home Improvement Contractor Registration (HICPA)", "Manufacturer-certified technician"],
    trustSignals: ["Certified pool operators", "Fully insured", "Free estimates", "Seasonal service contracts available"],
    pricingRanges: [
      { service: "Weekly maintenance (monthly)", range: "$100 – $200" },
      { service: "Pool opening", range: "$200 – $400" },
      { service: "Pool closing / winterization", range: "$250 – $500" },
      { service: "Liner replacement", range: "$2,000 – $5,000" },
      { service: "Pool heater installation", range: "$1,500 – $4,000" },
    ],
    emergencyServices: ["Emergency pool pump failure", "Pool leak emergency", "Hot tub electrical issues"],
    seasonalTips: ["Spring: Schedule pool opening and equipment inspection early to beat the rush", "Summer: Maintain consistent chemical levels and run the pump 8-12 hours daily", "Fall: Close and winterize before Erie's first hard freeze in October", "Winter: Monitor winter cover for snow and ice buildup; remove standing water"],
    ctaPrimary: "Find Pool Service",
    ctaSecondary: "Compare Pool Companies",
    quoteFormTitle: "Get a Free Pool & Spa Quote",
    quoteFormDescription: "Describe your pool or spa needs and we'll connect you with top-rated Erie professionals.",
  },

  // ── Locksmith Services ───────────────────────────────────────────────────
  locksmith: {
    slug: "locksmith",
    label: "Locksmith",
    pluralLabel: "Locksmiths",
    serviceLabel: "locksmith services",
    heroHeadline: "Find the Best Locksmith in Erie, PA",
    heroSubheadline: "Licensed locksmiths serving Erie, Millcreek, Harborcreek, and surrounding communities. 24/7 emergency lockout service with fast response times.",
    metaTitle: "Best Locksmiths in Erie, PA — 24/7 Emergency Lockout | erie.pro",
    metaDescription: "Find top-rated locksmiths in Erie, PA. Emergency lockout, lock installation, rekeying, key cutting. 24/7 service with fast response times.",
    primaryKeywords: ["locksmith erie pa", "emergency lockout erie", "lock installation erie pa", "locksmith near me erie"],
    secondaryKeywords: ["car lockout erie pa", "lock rekey erie", "key cutting erie pa", "commercial locksmith erie", "smart lock installation erie"],
    aboutDescription: "Erie residents need reliable locksmith services year-round, from emergency lockouts during frigid winter nights to lock upgrades for home security. Cold temperatures can cause locks to freeze and keys to break, making 24/7 availability essential in Northwest PA. A licensed locksmith ensures your home, business, and vehicle security.",
    commonServices: ["Emergency lockout service", "Lock installation and repair", "Lock rekeying", "Key cutting and duplication", "Smart lock installation", "Commercial lock service", "Automotive locksmith", "Master key systems"],
    faqItems: [
      { question: "How much does a locksmith cost in Erie, PA?", answer: "A standard lockout service in Erie costs $50 to $100 during business hours and $100 to $200 for after-hours emergency calls. Lock rekeying runs $20 to $50 per lock. New lock installation costs $75 to $200 per lock depending on the hardware." },
      { question: "How fast can a locksmith respond in Erie?", answer: "Most Erie locksmiths offer 15 to 30 minute response times within the city. Response times to Millcreek, Harborcreek, and surrounding areas are typically 20 to 45 minutes. 24/7 emergency service is standard." },
      { question: "Should I rekey or replace my locks?", answer: "Rekeying is cheaper ($20 to $50 per lock) and sufficient when you want to prevent old keys from working, such as after moving into a new home. Replace locks ($75 to $200 per lock) when they are worn, damaged, or you want to upgrade security." },
      { question: "Can a locksmith program a car key fob in Erie?", answer: "Yes, most Erie automotive locksmiths can cut and program transponder keys and key fobs. This is often 30-50% cheaper than dealership pricing. Costs range from $100 to $300 depending on the vehicle make and model." },
      { question: "Are smart locks worth it in Erie?", answer: "Smart locks offer keyless convenience and can prevent frozen-key issues during Erie winters. They allow remote access, temporary codes for visitors, and integrate with home security systems. Professional installation ensures proper setup and costs $150 to $400 including the lock." },
      { question: "How do I prevent frozen locks in Erie winters?", answer: "Apply graphite lubricant or a silicone-based lock de-icer before winter. Avoid using WD-40 as it attracts moisture. Cover exterior lock cylinders when possible. Keep a lock de-icer in your car or purse during Erie's sub-zero temperature stretches." },
    ],
    blogTopics: ["Preventing Frozen Locks During Erie Winters", "Smart Lock Options for Erie Homeowners", "When to Rekey vs Replace Locks", "Home Security Upgrades for Erie Properties"],
    guideTopics: ["Erie Homeowner's Guide to Lock Security", "Locksmith Services Explained: What You Need to Know", "Smart Lock Installation Guide for Erie Homes"],
    comparisonPoints: ["24/7 emergency availability", "Response time", "Licensed and bonded", "Automotive key programming capability"],
    certifications: ["Associated Locksmiths of America (ALOA)", "PA Locksmith License", "Bonded and Insured", "Automotive locksmith certified"],
    trustSignals: ["Licensed and bonded", "24/7 emergency service", "No hidden fees", "Fast response times"],
    pricingRanges: [
      { service: "Emergency lockout", range: "$50 – $200" },
      { service: "Lock rekeying (per lock)", range: "$20 – $50" },
      { service: "New lock installation", range: "$75 – $200" },
      { service: "Car key replacement", range: "$100 – $300" },
      { service: "Smart lock installation", range: "$150 – $400" },
    ],
    emergencyServices: ["24/7 home lockout", "Car lockout service", "Business lockout", "Broken key extraction"],
    seasonalTips: ["Fall: Lubricate all exterior locks before winter with graphite", "Winter: Keep lock de-icer accessible; avoid forcing frozen locks", "Spring: Inspect and maintain all exterior locks after winter", "Summer: Upgrade to smart locks for vacation monitoring"],
    ctaPrimary: "Find Locksmith",
    ctaSecondary: "Compare Locksmiths",
    quoteFormTitle: "Get a Free Locksmith Quote",
    quoteFormDescription: "Describe your locksmith needs and we'll connect you with top-rated Erie professionals.",
  },

  // ── Towing & Roadside Assistance ─────────────────────────────────────────
  towing: {
    slug: "towing",
    label: "Towing",
    pluralLabel: "Towing Companies",
    serviceLabel: "towing services",
    heroHeadline: "Find the Best Towing Service in Erie, PA",
    heroSubheadline: "24/7 towing and roadside assistance serving Erie, Millcreek, Harborcreek, and all of Erie County. Fast response for emergencies.",
    metaTitle: "Best Towing Services in Erie, PA — 24/7 Roadside Assistance | erie.pro",
    metaDescription: "Find top-rated towing companies in Erie, PA. Emergency towing, roadside assistance, vehicle recovery. 24/7 fast response with competitive rates.",
    primaryKeywords: ["towing erie pa", "tow truck erie", "roadside assistance erie pa", "emergency towing erie"],
    secondaryKeywords: ["flatbed tow erie pa", "car towing erie", "vehicle recovery erie", "jump start erie pa", "tire change erie"],
    aboutDescription: "Erie's lake effect winters create hazardous driving conditions that make reliable towing and roadside assistance essential. From I-90 breakdowns to snowy side street recoveries, Erie drivers need fast, dependable towing services year-round. Heavy snowfall, icy roads, and extreme cold mean more vehicles need tows, jumps, and tire changes during the winter months.",
    commonServices: ["Emergency towing", "Flatbed towing", "Roadside assistance", "Jump starts", "Tire changes", "Vehicle recovery", "Long-distance towing", "Lockout assistance"],
    faqItems: [
      { question: "How much does towing cost in Erie, PA?", answer: "Local towing in Erie typically starts at $75 to $125 for the first 5 miles, with $3 to $5 per additional mile. Flatbed towing costs $100 to $200 for local service. After-hours and winter storm rates may be higher due to demand." },
      { question: "How fast can a tow truck arrive in Erie?", answer: "Average response time in the City of Erie is 15 to 30 minutes. During winter storms or high-demand periods, wait times can increase to 45 to 90 minutes. Suburban and rural Erie County may take 20 to 45 minutes under normal conditions." },
      { question: "Do I need a flatbed tow?", answer: "Flatbed towing is recommended for all-wheel-drive vehicles, luxury cars, and vehicles with low ground clearance. It is also preferred for vehicles involved in accidents or those stuck in deep snow, which is common during Erie's lake effect storms." },
      { question: "What should I do if I break down on I-90 near Erie?", answer: "Pull as far off the road as safely possible, turn on hazard lights, and stay in your vehicle if conditions are dangerous. Call 911 if on the interstate, then contact a towing service. During winter storms, staying in your vehicle with the engine running (crack a window) is safest while waiting." },
      { question: "Does roadside assistance include jump starts?", answer: "Yes, most Erie towing companies offer jump starts as part of roadside assistance, typically $50 to $75. Erie's extreme cold (temperatures regularly below 0°F) is hard on batteries, making jump starts one of the most common service calls in winter." },
      { question: "Can a tow truck pull my car out of a ditch in the snow?", answer: "Yes, vehicle recovery from ditches and snowbanks is a standard service. Recovery fees in Erie range from $75 to $300 depending on the vehicle size and situation. During major lake effect storms, recovery services are in very high demand." },
    ],
    blogTopics: ["Winter Driving Safety Tips for Erie's Lake Effect Snow", "What to Keep in Your Erie Winter Emergency Kit", "Flatbed vs. Dolly Towing: Which Is Right for Your Vehicle", "Erie's Most Common Roadside Emergencies"],
    guideTopics: ["Erie Driver's Guide to Roadside Emergencies", "How to Choose a Reliable Towing Service in Erie", "Winter Breakdown Preparedness for Erie Drivers"],
    comparisonPoints: ["24/7 availability", "Average response time", "Flatbed capability", "Insurance and licensing"],
    certifications: ["PA Motor Vehicle Towing License", "WreckMaster Certified", "TRAA Member (Towing & Recovery Association)", "Fully insured and bonded"],
    trustSignals: ["24/7 dispatch", "GPS-tracked trucks", "Transparent pricing", "Fully insured"],
    pricingRanges: [
      { service: "Local towing (first 5 miles)", range: "$75 – $125" },
      { service: "Flatbed towing (local)", range: "$100 – $200" },
      { service: "Jump start", range: "$50 – $75" },
      { service: "Tire change", range: "$50 – $75" },
      { service: "Vehicle recovery (ditch/snow)", range: "$75 – $300" },
    ],
    emergencyServices: ["24/7 emergency towing", "Accident scene towing", "Snow/ice vehicle recovery", "Interstate breakdown response"],
    seasonalTips: ["Fall: Get a battery test before winter; check tires and antifreeze", "Winter: Keep an emergency kit with blankets, flashlight, and jumper cables", "Spring: Inspect tires for winter damage and check alignment after pothole season", "Summer: Ensure coolant levels are adequate for hot weather driving"],
    ctaPrimary: "Find Towing Service",
    ctaSecondary: "Compare Towing Companies",
    quoteFormTitle: "Get a Towing Quote",
    quoteFormDescription: "Describe your towing needs and we'll connect you with top-rated Erie towing professionals.",
  },

  // ── Carpet Cleaning ──────────────────────────────────────────────────────
  "carpet-cleaning": {
    slug: "carpet-cleaning",
    label: "Carpet Cleaning",
    pluralLabel: "Carpet Cleaners",
    serviceLabel: "carpet cleaning services",
    heroHeadline: "Find the Best Carpet Cleaner in Erie, PA",
    heroSubheadline: "Professional carpet and upholstery cleaning serving Erie, Millcreek, Harborcreek, and surrounding communities. Deep cleaning that removes dirt, stains, and allergens.",
    metaTitle: "Best Carpet Cleaning in Erie, PA — Deep Clean & Stain Removal | erie.pro",
    metaDescription: "Find top-rated carpet cleaners in Erie, PA. Deep cleaning, stain removal, upholstery cleaning. Eco-friendly options with free estimates.",
    primaryKeywords: ["carpet cleaning erie pa", "carpet cleaner erie", "upholstery cleaning erie pa", "rug cleaning erie"],
    secondaryKeywords: ["steam cleaning erie pa", "stain removal erie", "commercial carpet cleaning erie", "pet stain cleaning erie", "carpet shampooing erie"],
    aboutDescription: "Erie homes endure heavy foot traffic with mud, snow, salt, and sand tracked in during the long winter months. Professional carpet cleaning removes embedded dirt, salt residue, and allergens that regular vacuuming misses. Spring cleaning after winter is especially important for Erie households to restore carpets damaged by months of winter grime.",
    commonServices: ["Deep steam cleaning", "Stain and spot removal", "Upholstery cleaning", "Area rug cleaning", "Pet stain and odor removal", "Commercial carpet cleaning", "Carpet protection treatment", "Tile and grout cleaning"],
    faqItems: [
      { question: "How much does carpet cleaning cost in Erie, PA?", answer: "Professional carpet cleaning in Erie costs $25 to $50 per room or $0.20 to $0.40 per square foot. Most companies have a minimum charge of $100 to $150. Whole-house cleaning for a typical 3-bedroom Erie home runs $200 to $400." },
      { question: "How often should carpets be cleaned in Erie?", answer: "Erie homeowners should have carpets professionally cleaned at least once a year, ideally in spring after winter's salt and dirt accumulation. Homes with pets, children, or allergy sufferers benefit from cleaning every 6 months." },
      { question: "Is steam cleaning or dry cleaning better for carpets?", answer: "Hot water extraction (steam cleaning) is the method recommended by most carpet manufacturers and is most effective for Erie homes where winter grime is deeply embedded. Dry cleaning methods offer faster drying times but may not remove deep soil as effectively." },
      { question: "Can carpet cleaning remove salt stains from Erie winters?", answer: "Yes, professional carpet cleaning effectively removes road salt and calcium chloride stains. The longer salt sits, the harder it is to remove, so scheduling a spring cleaning is recommended for all Erie homes with carpeting near entryways." },
      { question: "How long does carpet take to dry after cleaning?", answer: "Steam-cleaned carpets typically dry in 6 to 12 hours depending on humidity, airflow, and carpet thickness. Erie's humid summers may extend drying times. Professional cleaners use high-powered extraction to minimize moisture." },
      { question: "Do carpet cleaners move furniture?", answer: "Most Erie carpet cleaners will move light furniture (chairs, small tables) at no extra charge. Heavy items like beds, dressers, and entertainment centers usually require an additional fee or should be moved beforehand." },
    ],
    blogTopics: ["Spring Carpet Cleaning: Why Erie Homes Need It", "Removing Road Salt Stains from Erie Carpets", "Pet-Friendly Carpet Cleaning Solutions", "How Often Should Erie Homeowners Clean Carpets"],
    guideTopics: ["Complete Carpet Cleaning Guide for Erie Homeowners", "Stain Removal Tips Between Professional Cleanings", "How to Choose a Carpet Cleaner in Erie, PA"],
    comparisonPoints: ["Cleaning method (steam vs dry)", "Eco-friendly products available", "Satisfaction guarantee", "Pricing transparency"],
    certifications: ["IICRC Certified Firm", "Carpet and Rug Institute (CRI) Seal of Approval", "EPA Safer Choice Partner", "BBB Accredited"],
    trustSignals: ["IICRC certified", "Eco-friendly options", "Satisfaction guaranteed", "Free estimates"],
    pricingRanges: [
      { service: "Per room cleaning", range: "$25 – $50" },
      { service: "Whole house (3 bedroom)", range: "$200 – $400" },
      { service: "Upholstery (sofa)", range: "$100 – $200" },
      { service: "Stain treatment (per spot)", range: "$20 – $50" },
      { service: "Carpet protection treatment", range: "$0.10 – $0.25/sq ft" },
    ],
    emergencyServices: ["Emergency flood extraction", "Water damage carpet drying", "Pet accident cleanup"],
    seasonalTips: ["Spring: Schedule deep cleaning to remove winter salt and grime", "Summer: Clean before humidity peaks to prevent mold under carpet", "Fall: Pre-treat high-traffic areas before winter boot season", "Winter: Use entry mats and shoe removal to reduce salt tracking"],
    ctaPrimary: "Find Carpet Cleaner",
    ctaSecondary: "Compare Carpet Cleaners",
    quoteFormTitle: "Get a Free Carpet Cleaning Quote",
    quoteFormDescription: "Describe your carpet cleaning needs and we'll connect you with top-rated Erie professionals.",
  },

  // ── Pressure Washing ─────────────────────────────────────────────────────
  "pressure-washing": {
    slug: "pressure-washing",
    label: "Pressure Washing",
    pluralLabel: "Pressure Washing Companies",
    serviceLabel: "pressure washing services",
    heroHeadline: "Find the Best Pressure Washing Service in Erie, PA",
    heroSubheadline: "Professional power washing serving Erie, Millcreek, Harborcreek, and surrounding communities. Restore your home's curb appeal.",
    metaTitle: "Best Pressure Washing in Erie, PA — Power Washing & Deck Cleaning | erie.pro",
    metaDescription: "Find top-rated pressure washing companies in Erie, PA. House washing, driveway cleaning, deck restoration. Licensed professionals with free estimates.",
    primaryKeywords: ["pressure washing erie pa", "power washing erie", "house washing erie pa", "driveway cleaning erie"],
    secondaryKeywords: ["deck cleaning erie pa", "exterior cleaning erie", "concrete cleaning erie", "commercial pressure washing erie", "soft washing erie"],
    aboutDescription: "Erie's combination of lake effect moisture, harsh winters, and humid summers creates ideal conditions for mold, mildew, algae, and grime buildup on home exteriors, driveways, and decks. Professional pressure washing removes years of accumulated dirt and biological growth, restoring surfaces and preventing long-term damage from Erie's demanding climate.",
    commonServices: ["House exterior washing", "Driveway and sidewalk cleaning", "Deck and patio cleaning", "Fence cleaning", "Gutter exterior cleaning", "Commercial building washing", "Roof soft washing", "Concrete sealing after cleaning"],
    faqItems: [
      { question: "How much does pressure washing cost in Erie, PA?", answer: "House washing in Erie costs $200 to $500 depending on size. Driveway cleaning runs $100 to $250. Deck cleaning and restoration costs $150 to $400. Most companies offer package pricing for multiple surfaces." },
      { question: "When is the best time to pressure wash in Erie?", answer: "Spring (April-May) is the ideal time to pressure wash in Erie, removing winter grime before summer. Fall cleaning before winter is also beneficial. Avoid pressure washing when temperatures are below 40°F as water can freeze on surfaces." },
      { question: "What is the difference between pressure washing and soft washing?", answer: "Pressure washing uses high-pressure water for hard surfaces like concrete and brick. Soft washing uses low pressure with biodegradable cleaning solutions for delicate surfaces like vinyl siding, roofs, and wood. Most Erie homes benefit from soft washing for siding and pressure washing for concrete." },
      { question: "Can pressure washing damage my home?", answer: "Improper pressure washing can damage vinyl siding, strip paint, etch concrete, and damage wood. Professional Erie pressure washers use appropriate pressure settings and nozzles for each surface. They also know to avoid forcing water behind siding and trim." },
      { question: "Should I pressure wash before painting my Erie home?", answer: "Yes, pressure washing or soft washing is essential prep before exterior painting. It removes dirt, mildew, and loose paint, ensuring proper adhesion. Wait 24-48 hours after washing for surfaces to fully dry before applying paint." },
      { question: "Does pressure washing remove oil stains from driveways?", answer: "Professional pressure washing can significantly reduce or remove oil stains from concrete driveways. Fresh stains respond best. Older, deeply penetrated stains may require pre-treatment with degreaser before pressure washing for complete removal." },
    ],
    blogTopics: ["Spring Cleaning: Pressure Washing Your Erie Home", "Soft Washing vs Pressure Washing for Erie Homes", "Deck Restoration Guide for Erie Homeowners", "How Erie's Climate Affects Your Home's Exterior"],
    guideTopics: ["Complete Pressure Washing Guide for Erie Homeowners", "Deck Cleaning and Staining Guide for Erie's Climate", "How to Choose a Pressure Washing Company in Erie"],
    comparisonPoints: ["Equipment quality and PSI range", "Soft washing capability", "Insurance and liability coverage", "Environmental practices"],
    certifications: ["PWNA Certified (Power Washers of North America)", "EPA Compliant", "Fully insured and bonded", "OSHA Safety Certified"],
    trustSignals: ["Fully insured", "Eco-friendly cleaning solutions", "Free estimates", "Satisfaction guaranteed"],
    pricingRanges: [
      { service: "House washing (exterior)", range: "$200 – $500" },
      { service: "Driveway cleaning", range: "$100 – $250" },
      { service: "Deck cleaning", range: "$150 – $400" },
      { service: "Fence cleaning", range: "$100 – $300" },
      { service: "Commercial building washing", range: "$500 – $2,000" },
    ],
    emergencyServices: [],
    seasonalTips: ["Spring: Schedule house and driveway washing to remove winter grime", "Summer: Clean decks and patios for outdoor entertaining season", "Fall: Remove mildew and prepare surfaces before winter", "Winter: Not recommended — wait for temperatures above 40°F"],
    ctaPrimary: "Find Pressure Washer",
    ctaSecondary: "Compare Pressure Washing Companies",
    quoteFormTitle: "Get a Free Pressure Washing Quote",
    quoteFormDescription: "Describe your pressure washing needs and we'll connect you with top-rated Erie professionals.",
  },

  // ── Drywall & Plastering ─────────────────────────────────────────────────
  drywall: {
    slug: "drywall",
    label: "Drywall",
    pluralLabel: "Drywall Contractors",
    serviceLabel: "drywall services",
    heroHeadline: "Find the Best Drywall Contractor in Erie, PA",
    heroSubheadline: "Professional drywall installation, repair, and finishing serving Erie, Millcreek, Harborcreek, and surrounding communities.",
    metaTitle: "Best Drywall Contractors in Erie, PA — Repair & Installation | erie.pro",
    metaDescription: "Find top-rated drywall contractors in Erie, PA. Drywall repair, installation, texturing, plastering. Licensed professionals with free estimates.",
    primaryKeywords: ["drywall repair erie pa", "drywall contractor erie", "drywall installation erie pa", "plastering erie"],
    secondaryKeywords: ["drywall finishing erie pa", "texture repair erie", "ceiling repair erie", "sheetrock erie pa", "drywall company near me erie"],
    aboutDescription: "Erie homes frequently need drywall repair due to water damage from frozen pipes, ice dams, and basement flooding. Older homes in neighborhoods like Downtown, Glenwood, and Academy may also have plaster walls that need restoration or conversion to drywall. Professional drywall work ensures seamless repairs that match existing textures and finishes.",
    commonServices: ["Drywall repair and patching", "New drywall installation", "Drywall finishing and taping", "Ceiling repair", "Texture matching", "Plaster repair", "Water damage drywall replacement", "Soundproofing installation"],
    faqItems: [
      { question: "How much does drywall repair cost in Erie, PA?", answer: "Small patch repairs in Erie cost $100 to $300 per patch. Larger repairs from water damage run $300 to $1,000. Full room drywall installation costs $1.50 to $3.00 per square foot including finishing and painting prep." },
      { question: "Can water-damaged drywall be repaired or must it be replaced?", answer: "Minor water staining can sometimes be repaired and sealed, but drywall that has been saturated, warped, or shows any signs of mold must be cut out and replaced. In Erie, water damage from frozen pipes and ice dams is common and usually requires full replacement of affected sections." },
      { question: "How long does drywall repair take?", answer: "A small patch repair takes 1 to 2 days (including drying time between coats). Larger projects like water damage restoration may take 3 to 5 days. Full room installation typically takes 2 to 4 days before it is ready for paint." },
      { question: "Can you match my existing wall texture?", answer: "Professional drywall contractors can match most textures including orange peel, knockdown, smooth, and skip trowel. Matching texture on older Erie homes with plaster walls requires more skill and may cost more. Request a texture sample before the full repair." },
      { question: "Should I repair plaster or convert to drywall?", answer: "Plaster repair preserves the character of older Erie homes and is cost-effective for small areas. Large damaged sections may be more economical to replace with drywall. Some historic homes in Erie may have preservation guidelines that favor plaster repair." },
      { question: "Is mold behind drywall common in Erie homes?", answer: "Yes, Erie's humidity and frequent water intrusion make mold behind drywall a common problem. If you see water stains, notice musty odors, or have had any flooding, have the area inspected. Mold remediation must be completed before new drywall is installed." },
    ],
    blogTopics: ["Water Damage Drywall Repair Guide for Erie Homes", "Plaster vs Drywall in Older Erie Homes", "How to Identify Mold Behind Drywall", "Drywall Finishing Levels Explained"],
    guideTopics: ["Erie Homeowner's Guide to Drywall Repair", "Water Damage Restoration: Drywall Edition", "Choosing a Drywall Contractor in Erie"],
    comparisonPoints: ["Texture matching skill", "Water damage experience", "Licensing and insurance", "Turnaround time"],
    certifications: ["PA Home Improvement Contractor Registration (HICPA)", "EPA Lead-Safe Certified (for pre-1978 homes)", "Fully insured and bonded", "OSHA Safety Certified"],
    trustSignals: ["Licensed and insured", "Free estimates", "Texture matching guaranteed", "Clean worksite policy"],
    pricingRanges: [
      { service: "Small patch repair", range: "$100 – $300" },
      { service: "Water damage repair (per room)", range: "$300 – $1,000" },
      { service: "New installation (per sq ft)", range: "$1.50 – $3.00" },
      { service: "Ceiling repair", range: "$200 – $800" },
      { service: "Plaster repair (per sq ft)", range: "$5 – $15" },
    ],
    emergencyServices: ["Emergency water damage drywall removal", "Burst pipe drywall restoration"],
    seasonalTips: ["Spring: Inspect for winter water damage from ice dams and frozen pipes", "Summer: Ideal season for large drywall projects with good drying conditions", "Fall: Address any repairs before heating season seals the house", "Winter: Monitor for condensation and moisture damage near exterior walls"],
    ctaPrimary: "Find Drywall Contractor",
    ctaSecondary: "Compare Drywall Companies",
    quoteFormTitle: "Get a Free Drywall Quote",
    quoteFormDescription: "Describe your drywall needs and we'll connect you with top-rated Erie professionals.",
  },

  // ── Insulation Services ──────────────────────────────────────────────────
  insulation: {
    slug: "insulation",
    label: "Insulation",
    pluralLabel: "Insulation Contractors",
    serviceLabel: "insulation services",
    heroHeadline: "Find the Best Insulation Contractor in Erie, PA",
    heroSubheadline: "Professional insulation installation serving Erie, Millcreek, Harborcreek, and surrounding communities. Save energy and stay warm during Erie's harsh winters.",
    metaTitle: "Best Insulation Services in Erie, PA — Attic, Spray Foam, Blown-In | erie.pro",
    metaDescription: "Find top-rated insulation contractors in Erie, PA. Attic insulation, spray foam, blown-in, energy audits. Save on heating costs with free estimates.",
    primaryKeywords: ["insulation erie pa", "attic insulation erie", "spray foam insulation erie pa", "insulation contractor erie"],
    secondaryKeywords: ["blown-in insulation erie pa", "energy audit erie", "crawl space insulation erie", "wall insulation erie pa", "insulation company near me erie"],
    aboutDescription: "Erie's extreme winters with lake effect snow and sub-zero temperatures make proper insulation critical for comfort and energy savings. Many older Erie homes are severely under-insulated by modern standards. Upgrading insulation in the attic, walls, and crawl spaces can reduce heating costs by 20-40% and keep Erie homes warm during the coldest months.",
    commonServices: ["Attic insulation installation", "Spray foam insulation", "Blown-in insulation", "Crawl space insulation", "Wall insulation retrofitting", "Energy audits", "Air sealing", "Insulation removal and replacement"],
    faqItems: [
      { question: "How much does insulation cost in Erie, PA?", answer: "Blown-in attic insulation in Erie costs $1.00 to $2.50 per square foot. Spray foam insulation runs $1.50 to $4.50 per square foot. A typical Erie attic insulation project (1,000-1,500 sq ft) costs $1,500 to $4,000 depending on the material and existing conditions." },
      { question: "How much insulation do Erie homes need?", answer: "Erie is in Climate Zone 5, which requires R-49 to R-60 in attics, R-20 to R-25 in walls, and R-25 to R-30 in floors over unconditioned spaces. Many older Erie homes have only R-11 to R-19 in the attic — far below current recommendations." },
      { question: "What type of insulation is best for Erie's climate?", answer: "For attics, blown-in fiberglass or cellulose at R-49 to R-60 provides excellent performance. Spray foam is ideal for rim joists, crawl spaces, and where air sealing is needed. Erie's cold climate benefits from spray foam's superior air sealing properties." },
      { question: "Can I add insulation over existing insulation?", answer: "Yes, you can add new insulation over existing material in most cases. The old insulation must be dry, mold-free, and not compressed. In Erie, check for moisture damage from ice dams before adding insulation to the attic." },
      { question: "How much can insulation save on Erie heating bills?", answer: "Properly insulating an under-insulated Erie home can reduce heating costs by 20-40%. With average Erie heating costs of $1,500 to $3,000 per winter, that translates to $300 to $1,200 in annual savings. Most insulation projects pay for themselves within 3-5 years." },
      { question: "Are there rebates for insulation in Erie?", answer: "Pennsylvania offers various energy efficiency rebates and incentives. Penelec (FirstEnergy) customers may qualify for rebates on insulation upgrades. Federal tax credits for energy efficiency improvements may also apply. Ask your insulation contractor about current programs." },
    ],
    blogTopics: ["Why Insulation Is Critical for Erie's Climate Zone 5", "Spray Foam vs Blown-In: Best Choice for Erie Homes", "How to Detect Under-Insulation in Your Erie Home", "Energy Savings from Insulation Upgrades in Northwest PA"],
    guideTopics: ["Complete Insulation Guide for Erie Homeowners", "Attic Insulation Upgrade Guide for Erie's Climate", "How to Choose an Insulation Contractor in Erie"],
    comparisonPoints: ["Material options offered", "Energy audit capability", "Rebate assistance", "Warranty on installation"],
    certifications: ["BPI Certified (Building Performance Institute)", "EPA Lead-Safe Certified", "ENERGY STAR Partner", "Spray Foam Alliance Member"],
    trustSignals: ["BPI certified", "Energy audit included", "Free estimates", "Rebate assistance"],
    pricingRanges: [
      { service: "Blown-in attic insulation (per sq ft)", range: "$1.00 – $2.50" },
      { service: "Spray foam insulation (per sq ft)", range: "$1.50 – $4.50" },
      { service: "Crawl space insulation", range: "$1,500 – $5,000" },
      { service: "Air sealing (attic)", range: "$500 – $1,500" },
      { service: "Energy audit", range: "$200 – $500" },
    ],
    emergencyServices: [],
    seasonalTips: ["Spring: Inspect attic insulation for moisture from winter ice dams", "Summer: Best season for attic insulation — warm temps help materials settle", "Fall: Schedule insulation upgrades before winter heating season", "Winter: Identify cold spots and drafts to plan insulation improvements"],
    ctaPrimary: "Find Insulation Contractor",
    ctaSecondary: "Compare Insulation Companies",
    quoteFormTitle: "Get a Free Insulation Quote",
    quoteFormDescription: "Describe your insulation needs and we'll connect you with top-rated Erie professionals.",
  },

  // ── Solar & Energy ───────────────────────────────────────────────────────
  solar: {
    slug: "solar",
    label: "Solar & Energy",
    pluralLabel: "Solar Companies",
    serviceLabel: "solar energy services",
    heroHeadline: "Find the Best Solar Installer in Erie, PA",
    heroSubheadline: "Professional solar panel installation and energy solutions serving Erie, Millcreek, Harborcreek, and surrounding communities.",
    metaTitle: "Best Solar Installers in Erie, PA — Panels, Battery Storage | erie.pro",
    metaDescription: "Find top-rated solar companies in Erie, PA. Solar panel installation, energy audits, battery storage. Federal tax credits available. Free estimates.",
    primaryKeywords: ["solar panels erie pa", "solar installation erie", "solar energy erie pa", "solar company erie"],
    secondaryKeywords: ["solar battery storage erie pa", "energy audit erie", "solar panel cost erie", "solar contractor erie pa", "renewable energy erie"],
    aboutDescription: "Despite Erie's cloudy reputation, solar energy is increasingly viable thanks to falling panel costs, generous federal tax credits, and Pennsylvania's Solar Renewable Energy Credits (SRECs). Erie receives enough annual sunlight for solar to produce meaningful savings, especially when paired with battery storage for grid independence during winter storms.",
    commonServices: ["Solar panel installation", "Energy audits", "Battery storage systems", "Solar panel maintenance", "System monitoring", "EV charger integration", "Grid-tie systems", "Off-grid solar solutions"],
    faqItems: [
      { question: "Is solar worth it in Erie, PA?", answer: "Yes, despite cloudier conditions, Erie receives approximately 3.5 peak sun hours per day on average. With the 30% federal tax credit, net metering, and Pennsylvania SRECs, most Erie solar systems pay for themselves in 8-12 years. A typical system lasts 25-30 years." },
      { question: "How much do solar panels cost in Erie?", answer: "A typical residential solar system in Erie costs $15,000 to $25,000 before incentives. After the 30% federal tax credit, the net cost drops to $10,500 to $17,500. The exact cost depends on system size, roof orientation, and equipment quality." },
      { question: "How much can solar save on Erie electric bills?", answer: "A properly sized solar system can offset 80-100% of an Erie home's electricity bill. With Penelec rates and net metering, this translates to $1,000 to $2,000 in annual savings. Battery storage adds resilience during winter power outages." },
      { question: "Do solar panels work in Erie's cloudy weather?", answer: "Yes, solar panels produce electricity even on cloudy days, though at reduced output. Modern panels are more efficient in diffuse light. Erie's cooler temperatures actually improve panel efficiency compared to hotter climates. Annual production is about 80% of sunbelt locations." },
      { question: "What about snow on solar panels in Erie?", answer: "Snow on panels is a temporary issue. Panels are installed at an angle, and their dark surface absorbs heat, causing snow to slide off relatively quickly. Most Erie solar owners lose only 2-5% of annual production to snow coverage." },
      { question: "Does Erie offer net metering for solar?", answer: "Yes, Pennsylvania requires net metering for residential solar installations. Excess electricity your panels produce is credited to your Penelec bill. You effectively run your meter backward during sunny days and use those credits during cloudy periods and nighttime." },
    ],
    blogTopics: ["Solar Energy Viability in Erie's Climate", "Federal Tax Credits for Erie Solar Installation", "Battery Storage: Worth It for Erie Homeowners?", "How Snow Affects Solar Panel Performance in Erie"],
    guideTopics: ["Erie Homeowner's Complete Solar Guide", "Solar Financing Options for Erie Residents", "How to Choose a Solar Installer in Erie"],
    comparisonPoints: ["NABCEP certification", "Equipment brands offered", "Warranty coverage", "Financing options"],
    certifications: ["NABCEP Certified Installer", "PA Licensed Electrical Contractor", "ENERGY STAR Partner", "Tesla Powerwall Certified"],
    trustSignals: ["NABCEP certified", "25-year warranty", "Free solar assessment", "Financing available"],
    pricingRanges: [
      { service: "Residential solar system (before credits)", range: "$15,000 – $25,000" },
      { service: "Battery storage system", range: "$8,000 – $15,000" },
      { service: "Energy audit", range: "$200 – $500" },
      { service: "Solar panel cleaning", range: "$150 – $300" },
    ],
    emergencyServices: [],
    seasonalTips: ["Spring: Clean panels after winter and check for storm damage", "Summer: Monitor system production during peak sun hours", "Fall: Schedule inspection before winter; trim trees that may shade panels", "Winter: Clear heavy snow if accessible; monitor production dips"],
    ctaPrimary: "Find Solar Installer",
    ctaSecondary: "Compare Solar Companies",
    quoteFormTitle: "Get a Free Solar Quote",
    quoteFormDescription: "Describe your solar energy goals and we'll connect you with top-rated Erie solar professionals.",
  },

  // ── Gutter Services ──────────────────────────────────────────────────────
  gutters: {
    slug: "gutters",
    label: "Gutters",
    pluralLabel: "Gutter Companies",
    serviceLabel: "gutter services",
    heroHeadline: "Find the Best Gutter Service in Erie, PA",
    heroSubheadline: "Professional gutter installation, cleaning, and repair serving Erie, Millcreek, Harborcreek, and surrounding communities.",
    metaTitle: "Best Gutter Services in Erie, PA — Installation, Cleaning, Guards | erie.pro",
    metaDescription: "Find top-rated gutter companies in Erie, PA. Gutter installation, cleaning, repair, gutter guards. Protect your home from Erie's heavy precipitation.",
    primaryKeywords: ["gutter service erie pa", "gutter cleaning erie", "gutter installation erie pa", "gutter guards erie"],
    secondaryKeywords: ["seamless gutters erie pa", "gutter repair erie", "gutter company near me erie", "downspout installation erie", "leaf guard erie pa"],
    aboutDescription: "Erie receives over 40 inches of rain and 100+ inches of snow annually, making functioning gutters absolutely critical for protecting your home's foundation, siding, and landscaping. Clogged or damaged gutters lead to basement flooding, ice dams, and foundation erosion. Regular gutter maintenance is one of the most important home care tasks for Erie homeowners.",
    commonServices: ["Gutter cleaning", "Seamless gutter installation", "Gutter guard installation", "Gutter repair", "Downspout installation and extension", "Gutter replacement", "Ice dam prevention systems", "Fascia board repair"],
    faqItems: [
      { question: "How much does gutter cleaning cost in Erie, PA?", answer: "Gutter cleaning in Erie typically costs $100 to $250 for a standard home. Larger homes or those with significant debris may cost $250 to $400. Most Erie homes need cleaning at least twice a year — spring and fall." },
      { question: "How much do new gutters cost in Erie?", answer: "Seamless aluminum gutters cost $4 to $9 per linear foot installed. A typical Erie home needs 150 to 200 linear feet, putting the total at $600 to $1,800. Copper gutters cost $15 to $30 per linear foot for a premium look." },
      { question: "Are gutter guards worth it in Erie?", answer: "Gutter guards are a smart investment in Erie given the heavy tree cover and high precipitation. They cost $6 to $15 per linear foot installed. While no guard eliminates all maintenance, quality guards significantly reduce cleaning frequency from twice yearly to every 2-3 years." },
      { question: "How often should gutters be cleaned in Erie?", answer: "Erie homes should have gutters cleaned at least twice per year: once in late spring after tree pollen and seed pods, and once in late fall after leaves drop. Homes surrounded by trees may need three or four cleanings per year." },
      { question: "Can clogged gutters cause basement flooding in Erie?", answer: "Absolutely. Clogged gutters overflow and dump water directly at your foundation. Combined with Erie's heavy rainfall and snowmelt, this is one of the most common causes of basement water problems. Proper gutters and downspout extensions are your first defense." },
      { question: "Do gutters cause ice dams in Erie?", answer: "Gutters do not cause ice dams, but clogged gutters can make them worse by trapping water that then freezes. Proper attic insulation and ventilation prevent ice dams. Clean gutters allow snowmelt to drain properly rather than refreezing at the roof edge." },
    ],
    blogTopics: ["Why Gutter Maintenance Is Critical in Erie's Climate", "Gutter Guard Options for Erie Homeowners", "How Clogged Gutters Cause Basement Flooding", "Ice Dam Prevention Starts with Your Gutters"],
    guideTopics: ["Complete Gutter Maintenance Guide for Erie Homes", "Gutter Guard Buying Guide for Erie's Climate", "How to Choose a Gutter Company in Erie"],
    comparisonPoints: ["Material options", "Gutter guard brands offered", "Warranty coverage", "Emergency repair availability"],
    certifications: ["PA Home Improvement Contractor Registration (HICPA)", "Manufacturer-certified installer", "Fully insured and bonded", "OSHA Safety Certified"],
    trustSignals: ["Fully insured", "Free estimates", "Warranty included", "Same-day repair available"],
    pricingRanges: [
      { service: "Gutter cleaning", range: "$100 – $250" },
      { service: "Seamless gutter installation (per linear ft)", range: "$4 – $9" },
      { service: "Gutter guard installation (per linear ft)", range: "$6 – $15" },
      { service: "Gutter repair", range: "$75 – $300" },
      { service: "Downspout extension", range: "$50 – $150" },
    ],
    emergencyServices: ["Emergency gutter reattachment", "Storm damage repair", "Overflowing gutter resolution"],
    seasonalTips: ["Spring: Clean gutters after spring debris and check for winter damage", "Summer: Inspect for sagging and ensure proper slope toward downspouts", "Fall: Major cleaning after leaves drop — most critical cleaning of the year", "Winter: Monitor for ice buildup; do not attempt to remove ice from gutters"],
    ctaPrimary: "Find Gutter Service",
    ctaSecondary: "Compare Gutter Companies",
    quoteFormTitle: "Get a Free Gutter Quote",
    quoteFormDescription: "Describe your gutter needs and we'll connect you with top-rated Erie professionals.",
  },

  // ── Handyman Services ────────────────────────────────────────────────────
  handyman: {
    slug: "handyman",
    label: "Handyman",
    pluralLabel: "Handymen",
    serviceLabel: "handyman services",
    heroHeadline: "Find the Best Handyman in Erie, PA",
    heroSubheadline: "Reliable handyman services serving Erie, Millcreek, Harborcreek, and surrounding communities. No job too small.",
    metaTitle: "Best Handyman Services in Erie, PA — Repairs & Maintenance | erie.pro",
    metaDescription: "Find top-rated handymen in Erie, PA. General repairs, maintenance, odd jobs, home improvement. Reliable professionals with fair pricing.",
    primaryKeywords: ["handyman erie pa", "handyman services erie", "home repair erie pa", "handyman near me erie"],
    secondaryKeywords: ["odd jobs erie pa", "home maintenance erie", "furniture assembly erie", "fix-it service erie pa", "small repairs erie"],
    aboutDescription: "Erie homeowners face a constant stream of small repairs and maintenance tasks, from fixing drafty windows before winter to patching drywall damaged by moisture. A reliable handyman handles the jobs that are too small for specialized contractors but too important to ignore, especially in Erie's older housing stock where something always needs attention.",
    commonServices: ["General home repairs", "Furniture assembly", "Fixture installation", "Door and window adjustments", "Caulking and weatherstripping", "Minor plumbing and electrical", "Shelving and storage installation", "Seasonal maintenance tasks"],
    faqItems: [
      { question: "How much does a handyman charge in Erie, PA?", answer: "Most Erie handymen charge $50 to $100 per hour with a typical 1-2 hour minimum. Simple tasks like fixture installation cost $75 to $200. Larger projects like bathroom updates or multiple repairs are often quoted as flat-rate jobs." },
      { question: "What can a handyman do vs a licensed contractor?", answer: "In Pennsylvania, a handyman can handle general repairs, installations, and maintenance. Work requiring permits — such as electrical panel changes, plumbing rough-ins, or structural modifications — requires a licensed contractor. A good handyman knows when to refer you to a specialist." },
      { question: "Do Erie handymen handle seasonal preparation?", answer: "Yes, many Erie handymen offer seasonal preparation services: winterizing windows and doors, installing storm windows, caulking and weatherstripping, and spring maintenance checks. These services are especially valuable for Erie's extreme temperature swings." },
      { question: "Should I hire a handyman or do it myself?", answer: "For simple tasks you are comfortable with, DIY saves money. Hire a handyman for jobs requiring tools you do not own, tasks on ladders, anything involving plumbing or electrical basics, or when your time is more valuable than the service cost." },
      { question: "Can a handyman help prepare my Erie home for winter?", answer: "Absolutely. Popular winter prep tasks include caulking windows and doors, installing storm windows, replacing weatherstripping, insulating pipes, fixing drafts, and reversing ceiling fans. A handyman can complete a full winterization checklist in a few hours." },
      { question: "How do I find a reliable handyman in Erie?", answer: "Look for handymen with PA Home Improvement Contractor Registration, liability insurance, and positive local reviews. Ask for references from recent Erie clients. Avoid handymen who demand large upfront deposits or refuse to provide written estimates." },
    ],
    blogTopics: ["Winter Preparation Tasks for Erie Homeowners", "When to Hire a Handyman vs DIY", "Top Maintenance Tasks for Older Erie Homes", "Seasonal Home Maintenance Calendar for Erie"],
    guideTopics: ["Erie Homeowner's Handyman Hiring Guide", "Home Maintenance Checklist for Erie's Climate", "How to Budget for Home Repairs in Erie"],
    comparisonPoints: ["Hourly rate vs flat rate pricing", "Range of skills offered", "Insurance and registration", "Availability and scheduling flexibility"],
    certifications: ["PA Home Improvement Contractor Registration (HICPA)", "General liability insurance", "EPA Lead-Safe Certified (for pre-1978 homes)", "First Aid/CPR Certified"],
    trustSignals: ["Registered PA contractor", "Insured", "No job too small", "Fair upfront pricing"],
    pricingRanges: [
      { service: "Hourly rate", range: "$50 – $100" },
      { service: "Fixture installation", range: "$75 – $200" },
      { service: "Furniture assembly", range: "$50 – $150" },
      { service: "Caulking / weatherstripping (whole house)", range: "$200 – $500" },
      { service: "Minor repair visit", range: "$75 – $200" },
    ],
    emergencyServices: [],
    seasonalTips: ["Spring: Inspect exterior caulking, clean windows, check screens", "Summer: Tackle outdoor repair projects and deck maintenance", "Fall: Weatherstrip doors, caulk windows, install storm windows", "Winter: Address interior repairs; fix drafts and insulation gaps"],
    ctaPrimary: "Find Handyman",
    ctaSecondary: "Compare Handymen",
    quoteFormTitle: "Get a Free Handyman Quote",
    quoteFormDescription: "Describe your repair or maintenance needs and we'll connect you with top-rated Erie handymen.",
  },

  // ── Veterinary Services ──────────────────────────────────────────────────
  veterinary: {
    slug: "veterinary",
    label: "Veterinary",
    pluralLabel: "Veterinarians",
    serviceLabel: "veterinary services",
    heroHeadline: "Find the Best Veterinarian in Erie, PA",
    heroSubheadline: "Trusted veterinary care serving Erie, Millcreek, Harborcreek, and surrounding communities. Comprehensive pet healthcare for dogs, cats, and more.",
    metaTitle: "Best Veterinarians in Erie, PA — Pet Healthcare & Emergency Vet | erie.pro",
    metaDescription: "Find top-rated veterinarians in Erie, PA. Wellness exams, vaccinations, surgery, emergency vet care. Compassionate professionals for your pets.",
    primaryKeywords: ["veterinarian erie pa", "vet erie pa", "animal hospital erie", "emergency vet erie pa"],
    secondaryKeywords: ["pet wellness erie pa", "dog vet erie", "cat vet erie pa", "pet surgery erie", "veterinary clinic near me erie"],
    aboutDescription: "Erie's pet-owning families need veterinary professionals who understand local health concerns, from tick-borne diseases common in the Lake Erie region to cold-weather paw care during harsh winters. Reliable veterinary care includes wellness exams, vaccinations, dental care, surgery, and emergency services for beloved family pets.",
    commonServices: ["Wellness exams and vaccinations", "Spay and neuter surgery", "Dental cleaning and oral care", "Emergency and urgent care", "Diagnostic imaging", "Surgical services", "Senior pet care", "Microchipping"],
    faqItems: [
      { question: "How much does a vet visit cost in Erie, PA?", answer: "A standard wellness exam in Erie costs $50 to $100. Vaccinations run $20 to $50 each. Annual wellness packages including exam, vaccinations, and basic bloodwork typically cost $200 to $400. Emergency visits start at $100 to $200 for the exam fee alone." },
      { question: "Is there an emergency vet in Erie?", answer: "Yes, Erie has emergency veterinary services available. Some animal hospitals offer after-hours emergency care, while others refer to regional emergency facilities. Know your nearest emergency vet before an emergency happens — response time matters." },
      { question: "How often should my pet see a vet in Erie?", answer: "Healthy adult pets should see a vet annually for wellness exams and vaccinations. Puppies and kittens need visits every 3-4 weeks until about 16 weeks old. Senior pets (7+ years) benefit from twice-yearly checkups to catch age-related issues early." },
      { question: "What vaccinations does my dog need in Erie?", answer: "Core vaccinations for Erie dogs include rabies (required by PA law), DHPP (distemper, hepatitis, parvo, parainfluenza), and bordetella. Lyme disease vaccination is recommended for Erie dogs due to the high tick population in the Lake Erie region." },
      { question: "How much does spaying or neutering cost in Erie?", answer: "Spaying costs $200 to $500 and neutering costs $150 to $400 in Erie, depending on the pet's size and the clinic. Some Erie organizations offer low-cost spay/neuter programs. The procedure includes anesthesia, surgery, and basic pain management." },
      { question: "How do I protect my pet during Erie winters?", answer: "Protect paws from road salt with booties or paw wax. Limit outdoor time during extreme cold. Watch for antifreeze, which is toxic and common in winter. Provide extra calories for outdoor pets. Watch for frostbite on ears, tail, and paws during sub-zero temperatures." },
    ],
    blogTopics: ["Tick Prevention for Erie Pets", "Winter Pet Safety Tips for Erie Families", "When to See an Emergency Vet in Erie", "Senior Pet Care in Northwest PA"],
    guideTopics: ["Erie Pet Owner's Complete Vet Guide", "Vaccination Schedule for Erie Pets", "How to Choose a Veterinarian in Erie"],
    comparisonPoints: ["Emergency and after-hours availability", "Range of services offered", "Payment plans and pet insurance accepted", "Facility accreditation"],
    certifications: ["AAHA Accredited (American Animal Hospital Association)", "Licensed DVM in Pennsylvania", "Fear Free Certified", "AAFP Cat Friendly Practice"],
    trustSignals: ["AAHA accredited", "Licensed veterinarians", "Compassionate care", "Payment plans available"],
    pricingRanges: [
      { service: "Wellness exam", range: "$50 – $100" },
      { service: "Vaccinations (each)", range: "$20 – $50" },
      { service: "Spay / neuter", range: "$150 – $500" },
      { service: "Dental cleaning", range: "$300 – $800" },
      { service: "Emergency exam fee", range: "$100 – $200" },
    ],
    emergencyServices: ["After-hours emergency care", "Toxin ingestion treatment", "Trauma and injury care", "Acute illness stabilization"],
    seasonalTips: ["Spring: Start tick and flea prevention; schedule annual wellness exam", "Summer: Ensure fresh water and shade; watch for heatstroke and blue-green algae at Lake Erie", "Fall: Update vaccinations before boarding season; check for ticks after hikes", "Winter: Protect paws from salt; limit exposure during sub-zero temperatures"],
    ctaPrimary: "Find Veterinarian",
    ctaSecondary: "Compare Vet Clinics",
    quoteFormTitle: "Find a Veterinarian",
    quoteFormDescription: "Tell us about your pet's needs and we'll connect you with top-rated Erie veterinarians.",
  },

  // ── Chiropractic Care ────────────────────────────────────────────────────
  chiropractic: {
    slug: "chiropractic",
    label: "Chiropractic",
    pluralLabel: "Chiropractors",
    serviceLabel: "chiropractic services",
    heroHeadline: "Find the Best Chiropractor in Erie, PA",
    heroSubheadline: "Licensed chiropractors serving Erie, Millcreek, Harborcreek, and surrounding communities. Pain relief and wellness care for the whole family.",
    metaTitle: "Best Chiropractors in Erie, PA — Spinal Adjustments & Pain Relief | erie.pro",
    metaDescription: "Find top-rated chiropractors in Erie, PA. Spinal adjustments, back pain, neck pain, wellness care. Licensed professionals accepting most insurance.",
    primaryKeywords: ["chiropractor erie pa", "chiropractic care erie", "back pain erie pa", "spinal adjustment erie"],
    secondaryKeywords: ["neck pain erie pa", "chiropractor near me erie", "sports chiropractic erie", "prenatal chiropractic erie pa", "sciatica treatment erie"],
    aboutDescription: "Erie residents deal with back and neck pain exacerbated by long winters, snow shoveling, and slippery conditions. Chiropractic care offers drug-free pain relief and wellness maintenance. From snow-shoveling injuries to workplace ergonomic issues, Erie chiropractors help patients restore mobility and reduce pain through spinal adjustments and therapeutic techniques.",
    commonServices: ["Spinal adjustments", "Back pain treatment", "Neck pain treatment", "Sciatica relief", "Sports injury rehabilitation", "Prenatal chiropractic", "Pediatric chiropractic", "Posture correction"],
    faqItems: [
      { question: "How much does a chiropractor cost in Erie, PA?", answer: "An initial chiropractic consultation and exam in Erie costs $75 to $200. Follow-up adjustment visits run $40 to $75. Most Erie chiropractors accept major insurance plans, and many offer affordable cash-pay rates and package pricing for uninsured patients." },
      { question: "Does insurance cover chiropractic in Erie?", answer: "Most major insurance plans cover chiropractic care in Pennsylvania, including Medicare and many Medicaid plans. Coverage typically includes a set number of visits per year. Contact your insurer for specifics. Many Erie chiropractors verify benefits before your first visit." },
      { question: "How often should I see a chiropractor?", answer: "Treatment frequency depends on your condition. Acute pain may require 2-3 visits per week initially, tapering to weekly, then monthly. Wellness maintenance visits are typically once or twice a month. Your Erie chiropractor will create a personalized care plan." },
      { question: "Is chiropractic safe?", answer: "Chiropractic care is recognized as safe and effective by the American Medical Association. Licensed Pennsylvania chiropractors complete extensive education including a Doctor of Chiropractic degree. Serious complications are extremely rare." },
      { question: "Can a chiropractor help with snow shoveling injuries?", answer: "Yes, snow shoveling is one of the most common causes of back injury in Erie. Chiropractors treat muscle strains, spinal misalignments, and nerve irritation caused by the repetitive twisting and lifting involved in shoveling heavy lake effect snow." },
      { question: "Do I need a referral to see a chiropractor in Erie?", answer: "No, Pennsylvania does not require a referral to see a chiropractor. You can schedule directly. However, some insurance plans may require a referral for coverage. Check with your insurance provider." },
    ],
    blogTopics: ["Preventing Snow Shoveling Back Injuries in Erie", "Chiropractic Care for Erie's Active Families", "Ergonomic Tips for Work-From-Home Erie Residents", "How Chiropractic Helps Winter Sports Injuries"],
    guideTopics: ["Erie Resident's Guide to Chiropractic Care", "What to Expect at Your First Chiropractic Visit", "How to Choose a Chiropractor in Erie"],
    comparisonPoints: ["Technique specializations", "Insurance plans accepted", "Same-day appointments", "X-ray and diagnostic capability"],
    certifications: ["Pennsylvania Chiropractic License", "National Board of Chiropractic Examiners", "Sports Chiropractic Certification (CCSP)", "Prenatal Certification (Webster Technique)"],
    trustSignals: ["Licensed in PA", "Most insurance accepted", "Same-day appointments", "Family-friendly practice"],
    pricingRanges: [
      { service: "Initial consultation and exam", range: "$75 – $200" },
      { service: "Adjustment visit", range: "$40 – $75" },
      { service: "X-rays (if needed)", range: "$50 – $150" },
      { service: "Massage therapy add-on", range: "$40 – $80" },
    ],
    emergencyServices: ["Acute pain same-day appointments", "Work injury immediate care", "Auto accident injury treatment"],
    seasonalTips: ["Spring: Address snow-shoveling injuries accumulated over winter", "Summer: Stay active with proper form to maintain spinal health", "Fall: Pre-winter spinal tune-up before heavy shoveling season", "Winter: Use proper shoveling techniques; see chiropractor promptly after any strain"],
    ctaPrimary: "Find Chiropractor",
    ctaSecondary: "Compare Chiropractors",
    quoteFormTitle: "Find a Chiropractor",
    quoteFormDescription: "Tell us about your pain or wellness goals and we'll connect you with top-rated Erie chiropractors.",
  },

  // ── Accounting & Tax ─────────────────────────────────────────────────────
  accounting: {
    slug: "accounting",
    label: "Accounting & Tax",
    pluralLabel: "Accountants",
    serviceLabel: "accounting services",
    heroHeadline: "Find the Best Accountant in Erie, PA",
    heroSubheadline: "Licensed CPAs and accountants serving Erie, Millcreek, Harborcreek, and surrounding communities. Tax preparation, bookkeeping, and financial planning.",
    metaTitle: "Best Accountants in Erie, PA — Tax Prep, CPA, Bookkeeping | erie.pro",
    metaDescription: "Find top-rated accountants and CPAs in Erie, PA. Tax preparation, bookkeeping, financial planning, small business accounting. Free consultations.",
    primaryKeywords: ["accountant erie pa", "tax preparation erie", "CPA erie pa", "bookkeeping erie"],
    secondaryKeywords: ["tax services erie pa", "small business accountant erie", "financial planning erie pa", "payroll services erie", "tax filing erie"],
    aboutDescription: "Erie businesses and individuals need accountants who understand Pennsylvania's unique tax landscape, including the flat 3.07% state income tax, local earned income taxes, and business privilege taxes. From small businesses on State Street to manufacturing firms along the Bayfront, Erie's diverse economy requires experienced accounting professionals.",
    commonServices: ["Individual tax preparation", "Business tax preparation", "Bookkeeping services", "Payroll processing", "Financial planning", "Business formation consulting", "IRS representation", "QuickBooks setup and training"],
    faqItems: [
      { question: "How much does tax preparation cost in Erie, PA?", answer: "Simple individual tax returns in Erie cost $150 to $300. More complex returns with itemized deductions, investments, or rental income run $300 to $600. Small business returns cost $500 to $1,500 depending on complexity." },
      { question: "When should I use a CPA vs tax preparer?", answer: "A CPA is recommended for complex tax situations including business ownership, rental properties, investments, or IRS issues. For straightforward W-2 returns, a qualified tax preparer or enrolled agent is sufficient. CPAs can also represent you before the IRS." },
      { question: "What is Erie's local income tax rate?", answer: "Erie City residents pay a 1.68% earned income tax (combined city and school district). Millcreek Township residents pay 1.4%. These local taxes are in addition to Pennsylvania's flat 3.07% state income tax. A local accountant ensures all local obligations are met." },
      { question: "Do I need an accountant for my small business in Erie?", answer: "If you earn more than $10,000 annually from self-employment, have employees, or operate as an LLC, S-Corp, or corporation, professional accounting is strongly recommended. An Erie accountant familiar with local business taxes saves money through proper deductions and structure." },
      { question: "What records should I keep for taxes?", answer: "Keep W-2s, 1099s, receipts for deductible expenses, mortgage interest statements, property tax bills, medical expenses over 7.5% of AGI, and charitable donation receipts. For businesses, maintain income records, expense receipts, mileage logs, and bank statements." },
      { question: "Can an accountant help with Pennsylvania property taxes?", answer: "Yes, Erie County property taxes can be complex. An accountant can help you understand your assessment, identify applicable exemptions (homestead, senior citizen), and ensure you are claiming all available deductions on your federal and state returns." },
    ],
    blogTopics: ["Understanding Erie's Local Tax Obligations", "Tax Deductions Every Erie Homeowner Should Know", "Small Business Tax Planning for Erie Entrepreneurs", "Year-End Tax Moves for Erie Residents"],
    guideTopics: ["Erie Resident's Complete Tax Guide", "Small Business Accounting Guide for Erie", "How to Choose an Accountant in Erie"],
    comparisonPoints: ["CPA vs enrolled agent vs tax preparer", "Year-round availability", "Industry specialization", "Technology and online capabilities"],
    certifications: ["Certified Public Accountant (CPA)", "Enrolled Agent (EA)", "QuickBooks ProAdvisor", "PA Licensed Tax Preparer"],
    trustSignals: ["Licensed CPA", "Year-round availability", "Free initial consultation", "E-filing available"],
    pricingRanges: [
      { service: "Individual tax return (simple)", range: "$150 – $300" },
      { service: "Individual tax return (complex)", range: "$300 – $600" },
      { service: "Small business tax return", range: "$500 – $1,500" },
      { service: "Monthly bookkeeping", range: "$200 – $500" },
      { service: "Payroll processing (monthly)", range: "$50 – $200" },
    ],
    emergencyServices: ["IRS audit representation", "Late filing assistance", "Tax penalty resolution"],
    seasonalTips: ["Spring: File taxes by April 15; review withholdings for the new year", "Summer: Mid-year tax planning review; organize receipts", "Fall: Maximize retirement contributions; plan year-end deductions", "Winter: Gather tax documents; schedule early filing appointment"],
    ctaPrimary: "Find Accountant",
    ctaSecondary: "Compare Accountants",
    quoteFormTitle: "Get a Free Consultation",
    quoteFormDescription: "Describe your accounting or tax needs and we'll connect you with top-rated Erie CPAs and accountants.",
  },

  // ── Photography Services ─────────────────────────────────────────────────
  photography: {
    slug: "photography",
    label: "Photography",
    pluralLabel: "Photographers",
    serviceLabel: "photography services",
    heroHeadline: "Find the Best Photographer in Erie, PA",
    heroSubheadline: "Professional photographers serving Erie, Millcreek, Harborcreek, and surrounding communities. Capturing life's moments in Northwest PA.",
    metaTitle: "Best Photographers in Erie, PA — Portraits, Events, Real Estate | erie.pro",
    metaDescription: "Find top-rated photographers in Erie, PA. Portraits, weddings, events, real estate photography. Professional quality with competitive rates.",
    primaryKeywords: ["photographer erie pa", "photography erie", "portrait photographer erie pa", "wedding photographer erie"],
    secondaryKeywords: ["event photography erie pa", "real estate photography erie", "headshots erie pa", "family photographer erie", "senior portraits erie"],
    aboutDescription: "Erie's stunning Lake Erie sunsets, Presque Isle beaches, and historic architecture provide a beautiful backdrop for photography. From Presque Isle engagement shoots to downtown Erie business headshots, local photographers know the best locations and lighting conditions unique to Northwest PA's seasons and landscapes.",
    commonServices: ["Portrait photography", "Wedding photography", "Event photography", "Real estate photography", "Headshots and branding", "Family photography", "Senior portraits", "Commercial product photography"],
    faqItems: [
      { question: "How much does a photographer cost in Erie, PA?", answer: "Portrait sessions in Erie start at $150 to $400. Wedding photography packages range from $1,500 to $5,000. Real estate photography costs $100 to $300 per property. Headshot sessions run $100 to $300. Pricing varies by experience and deliverables." },
      { question: "Where are the best photo locations in Erie?", answer: "Popular Erie photo locations include Presque Isle State Park (beaches, lighthouse, sunset points), downtown Erie's historic buildings, the Erie Bayfront, Perry Square, the Erie Art Museum area, and local vineyards. Each season offers unique backdrops." },
      { question: "How far in advance should I book a photographer in Erie?", answer: "For weddings, book 8-12 months in advance. Senior portraits should be booked 2-3 months ahead. Event and portrait sessions can often be booked 2-4 weeks out. Summer and fall are Erie's busiest photography seasons." },
      { question: "What should I wear for a photo session in Erie?", answer: "Coordinate but do not match exactly. Solid colors photograph better than busy patterns. Consider the season and location — layers work well for Erie's changeable weather. Your photographer will provide specific guidance based on the planned setting." },
      { question: "Do Erie photographers shoot in winter?", answer: "Yes, winter offers unique photography opportunities in Erie. Snow-covered Presque Isle, frost-covered trees, and cozy indoor settings create dramatic images. Outdoor winter sessions are typically kept shorter due to cold temperatures." },
      { question: "How long does it take to get photos back?", answer: "Most Erie photographers deliver final edited images in 2-4 weeks for portrait sessions and 4-8 weeks for weddings. Rush delivery is often available for an additional fee. Discuss timelines and delivery format during booking." },
    ],
    blogTopics: ["Best Photo Locations in Erie, PA", "Planning Your Presque Isle Photo Session", "Real Estate Photography Tips for Erie Listings", "Seasonal Photography Guide for Erie"],
    guideTopics: ["Erie Wedding Photography Planning Guide", "How to Choose a Photographer in Erie", "Real Estate Photography Guide for Erie Agents"],
    comparisonPoints: ["Portfolio quality and style", "Packages and pricing", "Turnaround time", "Print and album options"],
    certifications: ["Professional Photographers of America (PPA)", "Certified Professional Photographer (CPP)", "FAA Part 107 (for drone photography)", "Insured and bonded"],
    trustSignals: ["Professional portfolio", "Insured", "Satisfaction guaranteed", "Digital and print delivery"],
    pricingRanges: [
      { service: "Portrait session", range: "$150 – $400" },
      { service: "Wedding package", range: "$1,500 – $5,000" },
      { service: "Real estate photography", range: "$100 – $300" },
      { service: "Headshot session", range: "$100 – $300" },
      { service: "Event coverage (per hour)", range: "$150 – $300" },
    ],
    emergencyServices: [],
    seasonalTips: ["Spring: Book summer and fall sessions early; cherry blossom locations", "Summer: Golden hour at Presque Isle; book fall sessions", "Fall: Peak season for senior portraits and family photos with fall foliage", "Winter: Snow sessions at Presque Isle; holiday family portraits"],
    ctaPrimary: "Find Photographer",
    ctaSecondary: "Compare Photographers",
    quoteFormTitle: "Get a Photography Quote",
    quoteFormDescription: "Describe your photography needs and we'll connect you with top-rated Erie photographers.",
  },

  // ── Pet Grooming ─────────────────────────────────────────────────────────
  "pet-grooming": {
    slug: "pet-grooming",
    label: "Pet Grooming",
    pluralLabel: "Pet Groomers",
    serviceLabel: "pet grooming services",
    heroHeadline: "Find the Best Pet Groomer in Erie, PA",
    heroSubheadline: "Professional pet grooming serving Erie, Millcreek, Harborcreek, and surrounding communities. Expert care for dogs and cats.",
    metaTitle: "Best Pet Grooming in Erie, PA — Dog & Cat Grooming | erie.pro",
    metaDescription: "Find top-rated pet groomers in Erie, PA. Dog grooming, cat grooming, bathing, haircuts, nail trimming. Experienced groomers with gentle handling.",
    primaryKeywords: ["pet grooming erie pa", "dog grooming erie", "cat grooming erie pa", "pet groomer near me erie"],
    secondaryKeywords: ["dog haircut erie pa", "pet bath erie", "nail trimming erie pa", "mobile grooming erie", "dog groomer erie"],
    aboutDescription: "Erie pet owners need groomers who understand the challenges of Northwest PA's climate on pet coats and skin. Winter's dry air and road salt irritate paws, while summer's humidity can lead to matting and skin issues. Regular grooming keeps Erie pets comfortable, healthy, and looking their best year-round.",
    commonServices: ["Full-service dog grooming", "Cat grooming", "Bathing and blow-dry", "Haircuts and styling", "Nail trimming and grinding", "Ear cleaning", "De-shedding treatments", "Medicated baths"],
    faqItems: [
      { question: "How much does dog grooming cost in Erie, PA?", answer: "Small dog grooming in Erie costs $30 to $50, medium dogs $40 to $65, and large dogs $60 to $100. Full-service grooming includes bath, haircut, nail trim, and ear cleaning. Prices vary by coat condition and breed." },
      { question: "How often should I groom my dog in Erie?", answer: "Most dogs should be groomed every 4-8 weeks. Breeds with continuously growing hair (poodles, doodles, Yorkies) need grooming every 4-6 weeks. Short-haired breeds can go 8-12 weeks between professional grooming. Winter coats may need more frequent de-matting." },
      { question: "Do Erie groomers handle anxious pets?", answer: "Yes, many Erie groomers specialize in handling anxious or nervous pets. Ask about experience with fearful animals. Some offer calming techniques, breaks during grooming, and quiet environments. Mobile grooming services eliminate car ride stress for anxious pets." },
      { question: "Is mobile pet grooming available in Erie?", answer: "Yes, several Erie pet groomers offer mobile grooming services. A fully equipped grooming van comes to your home. Mobile grooming costs $10 to $30 more than salon grooming but offers convenience and reduced stress for pets." },
      { question: "Should I bathe my dog more in Erie winters?", answer: "No, over-bathing in winter strips natural oils from your dog's coat and worsens dry skin. Stick to regular grooming intervals. Between groomings, wipe paws after walks to remove road salt, which irritates paw pads." },
      { question: "Can groomers help with my dog's matted coat?", answer: "Yes, professional groomers can de-mat coats, though severely matted fur may need to be shaved for the dog's comfort. Matting is common in Erie during seasonal coat transitions. Regular brushing between grooming appointments prevents mats." },
    ],
    blogTopics: ["Winter Coat Care for Erie Dogs", "How Road Salt Affects Your Pet's Paws", "De-Shedding Tips for Erie Pet Owners", "Choosing the Right Grooming Schedule for Erie's Climate"],
    guideTopics: ["Erie Pet Owner's Grooming Guide", "Dog Breed Grooming Needs Guide", "How to Choose a Pet Groomer in Erie"],
    comparisonPoints: ["Experience with your breed", "Handling anxious pets", "Mobile grooming availability", "Products used (natural/medicated options)"],
    certifications: ["National Dog Groomers Association Certified", "International Professional Groomers (IPG)", "Pet First Aid Certified", "Fear Free Grooming Certified"],
    trustSignals: ["Certified groomers", "Gentle handling", "Natural products available", "Clean facility"],
    pricingRanges: [
      { service: "Small dog grooming", range: "$30 – $50" },
      { service: "Medium dog grooming", range: "$40 – $65" },
      { service: "Large dog grooming", range: "$60 – $100" },
      { service: "Cat grooming", range: "$50 – $80" },
      { service: "Nail trim only", range: "$10 – $20" },
    ],
    emergencyServices: [],
    seasonalTips: ["Spring: De-shedding treatment as winter coat blows out", "Summer: Shorter cuts for comfort; check for ticks after outdoor time", "Fall: Prepare coat for winter; address any skin issues before dry season", "Winter: Paw balm after walks; maintain coat length for warmth"],
    ctaPrimary: "Find Pet Groomer",
    ctaSecondary: "Compare Groomers",
    quoteFormTitle: "Get a Grooming Quote",
    quoteFormDescription: "Tell us about your pet and we'll connect you with top-rated Erie pet groomers.",
  },

  // ── Snow Removal ─────────────────────────────────────────────────────────
  "snow-removal": {
    slug: "snow-removal",
    label: "Snow Removal",
    pluralLabel: "Snow Removal Companies",
    serviceLabel: "snow removal services",
    heroHeadline: "Find the Best Snow Removal Service in Erie, PA",
    heroSubheadline: "Professional snow plowing and de-icing serving Erie, Millcreek, Harborcreek, and surrounding communities. Reliable service during lake effect storms.",
    metaTitle: "Best Snow Removal in Erie, PA — Plowing, De-Icing, Commercial | erie.pro",
    metaDescription: "Find top-rated snow removal companies in Erie, PA. Snow plowing, de-icing, commercial snow removal. Reliable service during lake effect storms.",
    primaryKeywords: ["snow removal erie pa", "snow plowing erie", "de-icing erie pa", "snow plow service erie"],
    secondaryKeywords: ["commercial snow removal erie pa", "residential plowing erie", "ice removal erie pa", "snow clearing erie", "snow contractor erie"],
    aboutDescription: "Erie averages over 100 inches of snow per year, making it one of the snowiest cities in the United States. Lake effect snow bands can drop 2-3 feet in a single storm. Reliable snow removal is not a luxury in Erie — it is a necessity for safety, accessibility, and compliance with city sidewalk clearing ordinances.",
    commonServices: ["Residential driveway plowing", "Commercial lot clearing", "Sidewalk clearing", "De-icing and salt application", "Roof snow removal", "Snow hauling", "Seasonal contracts", "24/7 storm response"],
    faqItems: [
      { question: "How much does snow plowing cost in Erie, PA?", answer: "Residential driveway plowing in Erie costs $30 to $75 per push depending on driveway size. Seasonal contracts run $300 to $800 for the full winter. Commercial lots cost $100 to $500 per push depending on size. De-icing is often additional at $50 to $150." },
      { question: "Should I get a seasonal snow removal contract in Erie?", answer: "Absolutely. With 100+ inches of annual snowfall, a seasonal contract in Erie is almost always more cost-effective than per-push pricing. Contracts guarantee priority service during major storms and lock in pricing for the entire winter." },
      { question: "When does snow removal start and end in Erie?", answer: "Erie's snow season typically runs from mid-November through mid-April, though lake effect snow has been recorded in October and May. Most seasonal contracts cover November 1 through April 15." },
      { question: "What is Erie's sidewalk clearing ordinance?", answer: "Erie City requires property owners to clear sidewalks within 24 hours after snowfall ends. Failure to comply can result in fines. Many snow removal companies offer sidewalk clearing as part of their service package." },
      { question: "Can snow removal companies clear my roof?", answer: "Yes, roof snow removal is a specialized service important for Erie homes after major lake effect storms. Heavy snow loads can exceed the structural capacity of older roofs. Roof clearing typically costs $200 to $600 depending on roof size and accessibility." },
      { question: "How do I prepare for lake effect snow storms?", answer: "Sign a seasonal snow removal contract before November. Keep 3-5 days of supplies at home. Know your plow company's trigger depth (usually 2-3 inches). Have a backup plan for your driveway. Keep ice melt and a quality shovel for walkways between plow visits." },
    ],
    blogTopics: ["Surviving Lake Effect Snow: Erie's Complete Guide", "Residential vs Commercial Snow Removal in Erie", "Roof Snow Removal: When Is It Necessary?", "De-Icing Best Practices for Erie Properties"],
    guideTopics: ["Erie Homeowner's Snow Removal Guide", "Commercial Snow Removal Planning for Erie Businesses", "How to Choose a Snow Removal Company in Erie"],
    comparisonPoints: ["Response time during storms", "Equipment fleet size", "De-icing included or extra", "Seasonal contract terms"],
    certifications: ["Snow & Ice Management Association (SIMA)", "Certified Snow Professional (CSP)", "Fully insured and bonded", "Commercial liability coverage"],
    trustSignals: ["SIMA member", "24/7 storm response", "Seasonal contracts available", "Fully insured"],
    pricingRanges: [
      { service: "Residential driveway (per push)", range: "$30 – $75" },
      { service: "Seasonal residential contract", range: "$300 – $800" },
      { service: "De-icing application", range: "$50 – $150" },
      { service: "Roof snow removal", range: "$200 – $600" },
      { service: "Commercial lot (per push)", range: "$100 – $500" },
    ],
    emergencyServices: ["24/7 storm response plowing", "Emergency roof snow removal", "Ice dam emergency clearing"],
    seasonalTips: ["Fall: Sign seasonal contracts before November; service equipment", "Winter: Maintain clear communication with plow company; keep walkways salted", "Spring: Assess property for winter damage; cancel service when season ends", "Summer: Research and lock in contractors for next season early"],
    ctaPrimary: "Find Snow Removal",
    ctaSecondary: "Compare Snow Removal Companies",
    quoteFormTitle: "Get a Snow Removal Quote",
    quoteFormDescription: "Describe your snow removal needs and we'll connect you with top-rated Erie professionals.",
  },

  // ── Water Damage Restoration ─────────────────────────────────────────────
  restoration: {
    slug: "restoration",
    label: "Restoration",
    pluralLabel: "Restoration Companies",
    serviceLabel: "restoration services",
    heroHeadline: "Find the Best Restoration Service in Erie, PA",
    heroSubheadline: "Professional water damage, fire, and mold restoration serving Erie, Millcreek, Harborcreek, and surrounding communities. 24/7 emergency response.",
    metaTitle: "Best Restoration Services in Erie, PA — Water Damage, Mold, Fire | erie.pro",
    metaDescription: "Find top-rated restoration companies in Erie, PA. Water damage, flood cleanup, mold remediation, fire restoration. 24/7 emergency response.",
    primaryKeywords: ["water damage restoration erie pa", "restoration company erie", "mold remediation erie pa", "flood cleanup erie"],
    secondaryKeywords: ["fire restoration erie pa", "water damage erie", "storm damage erie pa", "disaster recovery erie", "restoration service near me erie"],
    aboutDescription: "Erie's combination of heavy precipitation, lake effect storms, aging infrastructure, and freeze-thaw cycles creates frequent water damage emergencies. Basement flooding from spring snowmelt, frozen pipe bursts in winter, and storm damage are common. Professional restoration companies provide 24/7 emergency response, water extraction, drying, mold remediation, and complete rebuilding.",
    commonServices: ["Water damage restoration", "Flood cleanup and extraction", "Mold remediation", "Fire and smoke damage restoration", "Storm damage repair", "Sewage cleanup", "Content restoration", "Structural drying"],
    faqItems: [
      { question: "How much does water damage restoration cost in Erie?", answer: "Minor water damage restoration in Erie costs $1,000 to $4,000. Major flooding or extensive damage can cost $5,000 to $20,000 or more. Most homeowner insurance policies cover sudden water damage. The cost depends on the amount of affected area and severity." },
      { question: "Does insurance cover water damage restoration in Erie?", answer: "Most homeowner policies cover sudden and accidental water damage (burst pipes, appliance failures). Gradual damage and flood damage typically are not covered by standard policies. Separate flood insurance is available through NFIP. A restoration company can help document damage for insurance claims." },
      { question: "How quickly should water damage be addressed?", answer: "Immediately. Mold can begin growing within 24-48 hours in Erie's humidity. The longer water sits, the more extensive and expensive the damage becomes. Call a restoration company as soon as you discover water damage — most offer 24/7 emergency response." },
      { question: "Can water-damaged areas of my Erie home be saved?", answer: "Many water-damaged materials can be saved with prompt professional response. Drywall, carpet, and insulation that have been soaked for under 48 hours can often be dried and saved. Hardwood floors may be salvageable with proper drying equipment." },
      { question: "How long does mold remediation take in Erie?", answer: "Small mold remediation projects take 1-3 days. Larger projects with extensive contamination can take 1-2 weeks. Erie's humidity can complicate mold removal, as moisture must be fully controlled to prevent regrowth. Post-remediation testing confirms complete removal." },
      { question: "What should I do while waiting for restoration professionals?", answer: "Stop the water source if possible. Turn off electricity to affected areas. Remove valuables from standing water. Do not use household vacuums on water. Open windows for ventilation if weather permits. Document damage with photos for insurance." },
    ],
    blogTopics: ["Preventing Basement Flooding in Erie Homes", "Mold Prevention in Erie's Humid Climate", "What to Do After a Pipe Burst in Your Erie Home", "Understanding Water Damage Insurance Claims"],
    guideTopics: ["Erie Homeowner's Water Damage Response Guide", "Mold Remediation Guide for Erie Properties", "How to Choose a Restoration Company in Erie"],
    comparisonPoints: ["24/7 response time", "IICRC certification", "Insurance claim assistance", "Scope of services"],
    certifications: ["IICRC Certified Firm", "IICRC Water Restoration Technician (WRT)", "IICRC Applied Microbial Remediation Technician (AMRT)", "EPA Lead-Safe Certified"],
    trustSignals: ["IICRC certified", "24/7 emergency response", "Insurance claim assistance", "Free damage assessment"],
    pricingRanges: [
      { service: "Water damage (minor)", range: "$1,000 – $4,000" },
      { service: "Water damage (major)", range: "$5,000 – $20,000" },
      { service: "Mold remediation", range: "$1,500 – $9,000" },
      { service: "Fire/smoke restoration", range: "$3,000 – $30,000" },
      { service: "Emergency water extraction", range: "$500 – $2,000" },
    ],
    emergencyServices: ["24/7 water extraction", "Emergency board-up", "Burst pipe response", "Storm damage emergency", "Sewage backup cleanup"],
    seasonalTips: ["Spring: Monitor basement for snowmelt flooding; test sump pumps", "Summer: Address humidity to prevent mold; check AC condensation", "Fall: Winterize pipes to prevent bursting; clean gutters", "Winter: Know how to shut off water main; monitor for frozen pipes"],
    ctaPrimary: "Find Restoration Service",
    ctaSecondary: "Compare Restoration Companies",
    quoteFormTitle: "Get Emergency Restoration Help",
    quoteFormDescription: "Describe your damage situation and we'll connect you with top-rated Erie restoration professionals.",
  },

  // ── Glass & Glazing ──────────────────────────────────────────────────────
  glass: {
    slug: "glass",
    label: "Glass & Glazing",
    pluralLabel: "Glass Companies",
    serviceLabel: "glass services",
    heroHeadline: "Find the Best Glass Company in Erie, PA",
    heroSubheadline: "Professional glass repair and installation serving Erie, Millcreek, Harborcreek, and surrounding communities.",
    metaTitle: "Best Glass Companies in Erie, PA — Window Repair, Shower Enclosures | erie.pro",
    metaDescription: "Find top-rated glass companies in Erie, PA. Window repair, glass replacement, shower enclosures, mirrors. Professional glaziers with free estimates.",
    primaryKeywords: ["glass repair erie pa", "glass company erie", "window glass erie pa", "glazier erie"],
    secondaryKeywords: ["shower enclosure erie pa", "glass replacement erie", "mirror installation erie", "storefront glass erie pa", "auto glass erie"],
    aboutDescription: "Erie's extreme weather puts tremendous stress on glass, from thermal shock during rapid temperature changes to breakage from hail and windborne debris during lake effect storms. Professional glass companies handle everything from emergency window board-ups to custom shower enclosures and commercial storefront glass, using materials rated for Erie's demanding climate.",
    commonServices: ["Window glass repair and replacement", "Shower enclosures and doors", "Mirror installation", "Storefront and commercial glass", "Tabletop glass cutting", "Insulated glass unit replacement", "Emergency board-up service", "Auto glass repair"],
    faqItems: [
      { question: "How much does glass replacement cost in Erie?", answer: "Single-pane window glass replacement costs $100 to $300. Double-pane insulated glass units (IGUs) cost $200 to $500 per window. Shower enclosures range from $500 to $2,500. Storefront glass starts at $300 per panel. Emergency service may carry additional fees." },
      { question: "Can fogged double-pane windows be repaired?", answer: "Fogged or cloudy double-pane windows indicate a failed seal. The insulated glass unit (IGU) must be replaced, but the window frame can often be reused. In Erie's climate, failed seals are common due to extreme temperature swings. Replacement IGUs cost $200 to $500." },
      { question: "How long does glass replacement take?", answer: "Standard window glass replacement takes 1-2 hours per window. Custom sizes, shower enclosures, and commercial projects require measurement first, with glass fabrication taking 3-7 days followed by installation." },
      { question: "Do glass companies handle emergency board-ups?", answer: "Yes, most Erie glass companies offer 24/7 emergency board-up service for broken windows from storms, break-ins, or accidents. Temporary board-up costs $75 to $200. Permanent replacement is scheduled afterward." },
      { question: "What type of glass is best for Erie's climate?", answer: "Low-E (low-emissivity) glass with argon gas fill provides the best insulation for Erie's winters. Impact-resistant glass is recommended for storm-prone areas. Look for ENERGY STAR rated glass to maximize energy efficiency." },
      { question: "Can auto glass be repaired or does it need replacement?", answer: "Chips smaller than a quarter and cracks under 6 inches can usually be repaired for $50 to $100. Larger damage requires full windshield replacement at $200 to $500. Erie's road debris and temperature swings can turn small chips into cracks quickly." },
    ],
    blogTopics: ["Why Energy-Efficient Glass Matters in Erie's Climate", "Shower Enclosure Options for Erie Bathroom Remodels", "Emergency Glass Repair: What to Do After Storm Damage", "Auto Glass Repair vs Replacement Guide"],
    guideTopics: ["Erie Homeowner's Guide to Window Glass", "Shower Enclosure Buying Guide", "How to Choose a Glass Company in Erie"],
    comparisonPoints: ["Emergency response availability", "Custom fabrication capability", "Energy-efficient glass options", "Warranty coverage"],
    certifications: ["Auto Glass Safety Council (AGSC)", "National Glass Association Member", "PA Home Improvement Contractor Registration", "Fully insured and bonded"],
    trustSignals: ["Emergency service available", "Custom fabrication", "Free estimates", "Warranty included"],
    pricingRanges: [
      { service: "Window glass replacement (single pane)", range: "$100 – $300" },
      { service: "Insulated glass unit (IGU)", range: "$200 – $500" },
      { service: "Shower enclosure", range: "$500 – $2,500" },
      { service: "Emergency board-up", range: "$75 – $200" },
      { service: "Auto glass repair", range: "$50 – $100" },
    ],
    emergencyServices: ["24/7 emergency board-up", "Storm damage glass replacement", "Break-in window repair"],
    seasonalTips: ["Spring: Replace cracked windows before storm season", "Summer: Install shower enclosures during bathroom renovation season", "Fall: Check all windows for failed seals before winter", "Winter: Address fogged IGUs for energy savings; keep emergency board-up number handy"],
    ctaPrimary: "Find Glass Company",
    ctaSecondary: "Compare Glass Companies",
    quoteFormTitle: "Get a Free Glass Quote",
    quoteFormDescription: "Describe your glass needs and we'll connect you with top-rated Erie glass professionals.",
  },

  // ── Irrigation & Sprinklers ──────────────────────────────────────────────
  irrigation: {
    slug: "irrigation",
    label: "Irrigation & Sprinklers",
    pluralLabel: "Irrigation Companies",
    serviceLabel: "irrigation services",
    heroHeadline: "Find the Best Irrigation Service in Erie, PA",
    heroSubheadline: "Professional sprinkler installation and irrigation repair serving Erie, Millcreek, Harborcreek, and surrounding communities.",
    metaTitle: "Best Irrigation Services in Erie, PA — Sprinkler Installation & Repair | erie.pro",
    metaDescription: "Find top-rated irrigation companies in Erie, PA. Sprinkler installation, irrigation repair, winterization. Licensed professionals with free estimates.",
    primaryKeywords: ["irrigation erie pa", "sprinkler installation erie", "sprinkler repair erie pa", "irrigation company erie"],
    secondaryKeywords: ["lawn sprinkler erie pa", "irrigation winterization erie", "sprinkler system erie", "drip irrigation erie pa", "irrigation contractor erie"],
    aboutDescription: "Erie's hot summers and strict winterization requirements make professional irrigation management essential. Sprinkler systems must be properly winterized by mid-October to prevent freeze damage, and spring startup requires careful inspection after Erie's harsh winter. Professional irrigation companies ensure systems run efficiently through summer while surviving winter safely.",
    commonServices: ["Sprinkler system installation", "Irrigation repair", "System winterization", "Spring startup and inspection", "Head and nozzle replacement", "Controller programming", "Drip irrigation installation", "Backflow preventer testing"],
    faqItems: [
      { question: "How much does a sprinkler system cost in Erie?", answer: "A new residential sprinkler system in Erie costs $2,500 to $5,000 for a typical quarter-acre lot. The cost depends on zones needed, water pressure, and landscaping complexity. Larger properties cost $5,000 to $10,000 or more." },
      { question: "When should I winterize my sprinkler system in Erie?", answer: "Winterize your Erie sprinkler system by mid-October, before the first hard freeze. Professional blowout service costs $50 to $100 and uses compressed air to purge all water from pipes. Failure to winterize causes cracked pipes and damaged valves." },
      { question: "When should I start up my sprinkler system in Erie?", answer: "Spring startup in Erie is typically late April to mid-May, after the threat of hard freezes passes. Professional startup includes system pressurization, head inspection, controller programming, and leak checks. Startup costs $50 to $100." },
      { question: "How much water does a sprinkler system use?", answer: "A typical Erie lawn needs about 1 inch of water per week during summer, including rainfall. A sprinkler system uses roughly 1,000-2,000 gallons per watering cycle. Smart controllers with rain sensors can reduce water use by 20-40% by adjusting for rainfall." },
      { question: "Can I install drip irrigation in my Erie garden?", answer: "Yes, drip irrigation is excellent for Erie gardens, flower beds, and foundation plantings. It delivers water directly to roots, reducing waste. Drip systems must also be winterized. Installation costs $300 to $1,000 depending on the area covered." },
      { question: "How do I know if my sprinkler system has a leak?", answer: "Signs of a leak include unexplained wet spots in the yard, reduced water pressure in certain zones, higher than normal water bills, and zones that run longer than programmed. Professional leak detection costs $100 to $200. Erie's freeze-thaw cycles are a common cause of underground leaks." },
    ],
    blogTopics: ["Sprinkler Winterization Guide for Erie Homeowners", "Water-Efficient Irrigation for Erie Lawns", "Smart Irrigation Controllers: Worth It in Erie?", "Spring Sprinkler Startup Checklist"],
    guideTopics: ["Complete Sprinkler System Guide for Erie Homes", "Irrigation Winterization Guide for Erie", "How to Choose an Irrigation Company in Erie"],
    comparisonPoints: ["Smart controller expertise", "Winterization included in service", "Warranty on parts and labor", "Emergency repair availability"],
    certifications: ["Irrigation Association Certified", "EPA WaterSense Partner", "PA Backflow Prevention Certified", "Licensed and insured"],
    trustSignals: ["IA certified", "Free estimates", "Warranty on work", "Winterization packages"],
    pricingRanges: [
      { service: "New sprinkler system (1/4 acre)", range: "$2,500 – $5,000" },
      { service: "Winterization blowout", range: "$50 – $100" },
      { service: "Spring startup", range: "$50 – $100" },
      { service: "Sprinkler head replacement", range: "$50 – $100" },
      { service: "Leak detection and repair", range: "$100 – $300" },
    ],
    emergencyServices: ["Broken pipe repair", "Valve failure emergency", "Main line break repair"],
    seasonalTips: ["Spring: Schedule startup after last freeze risk (late April); check all heads", "Summer: Monitor for dry spots; adjust controller for weather conditions", "Fall: Schedule winterization by mid-October; final mowing height adjustment", "Winter: System should be fully winterized; plan any upgrades for spring"],
    ctaPrimary: "Find Irrigation Service",
    ctaSecondary: "Compare Irrigation Companies",
    quoteFormTitle: "Get a Free Irrigation Quote",
    quoteFormDescription: "Describe your irrigation needs and we'll connect you with top-rated Erie professionals.",
  },

  // ── Demolition & Excavation ──────────────────────────────────────────────
  demolition: {
    slug: "demolition",
    label: "Demolition & Excavation",
    pluralLabel: "Demolition Companies",
    serviceLabel: "demolition and excavation services",
    heroHeadline: "Find the Best Demolition Service in Erie, PA",
    heroSubheadline: "Professional demolition and excavation serving Erie, Millcreek, Harborcreek, and all of Erie County. Licensed and insured contractors.",
    metaTitle: "Best Demolition & Excavation in Erie, PA — Site Clearing & Grading | erie.pro",
    metaDescription: "Find top-rated demolition and excavation companies in Erie, PA. Building demolition, site clearing, excavation, grading. Licensed contractors with free estimates.",
    primaryKeywords: ["demolition erie pa", "excavation erie", "site clearing erie pa", "demolition contractor erie"],
    secondaryKeywords: ["building demolition erie pa", "excavator erie", "grading erie pa", "land clearing erie", "concrete removal erie"],
    aboutDescription: "Erie's aging building stock, combined with new development in areas like the Bayfront and Millcreek, drives steady demand for demolition and excavation services. From tearing down abandoned structures to preparing sites for new construction, Erie demolition contractors must navigate local permitting, environmental regulations, and the challenges of working in clay-heavy soils common throughout Erie County.",
    commonServices: ["Building demolition", "Interior demolition", "Site clearing", "Excavation and grading", "Concrete removal", "Pool removal", "Foundation excavation", "Land clearing"],
    faqItems: [
      { question: "How much does demolition cost in Erie, PA?", answer: "Interior demolition (gutting a room) costs $1,000 to $5,000. Full house demolition in Erie runs $8,000 to $25,000 depending on size, materials, and disposal requirements. Garage demolition costs $2,000 to $6,000. Pool removal costs $5,000 to $15,000." },
      { question: "Do I need a permit for demolition in Erie?", answer: "Yes, Erie requires a demolition permit from the City Code Enforcement office for any structural demolition. The permit process includes asbestos inspection requirements for buildings built before 1980. Your demolition contractor typically handles permit applications." },
      { question: "How long does a house demolition take in Erie?", answer: "A typical residential demolition in Erie takes 3-7 days for the demolition itself, plus 1-2 weeks for permitting, utility disconnection, and site cleanup. Environmental testing may add additional time for older homes with asbestos or lead paint." },
      { question: "What about asbestos in older Erie homes?", answer: "Pennsylvania law requires an asbestos inspection before demolishing any building built before 1980. Many older Erie homes contain asbestos in siding, insulation, flooring, and pipe wrap. Asbestos removal must be performed by a licensed abatement contractor before demolition." },
      { question: "Can I keep the lot after demolition?", answer: "Yes. After demolition, the site is graded and can be left as open land, prepared for new construction, or converted to a lawn or garden. Erie requires proper grading to ensure drainage away from neighboring properties." },
      { question: "How deep can you excavate in Erie?", answer: "Excavation depth depends on the project. Foundation excavation typically goes 4-8 feet. Utility trenching runs 3-6 feet. Erie's clay-heavy soil and high water table can complicate deep excavation, requiring dewatering and proper shoring." },
    ],
    blogTopics: ["Demolition Permitting in Erie: What You Need to Know", "Asbestos Considerations for Older Erie Buildings", "Pool Removal Options for Erie Homeowners", "Site Preparation for New Construction in Erie"],
    guideTopics: ["Erie Property Owner's Demolition Guide", "Excavation Planning for Erie Construction Projects", "How to Choose a Demolition Contractor in Erie"],
    comparisonPoints: ["Licensing and permits handled", "Asbestos abatement capability", "Equipment fleet", "Disposal and recycling practices"],
    certifications: ["PA Demolition Contractor License", "EPA Asbestos Abatement Certified", "OSHA 30-Hour Safety", "Fully insured and bonded"],
    trustSignals: ["Licensed and bonded", "Permits handled", "Environmental compliance", "Free estimates"],
    pricingRanges: [
      { service: "Interior demolition (per room)", range: "$1,000 – $5,000" },
      { service: "House demolition", range: "$8,000 – $25,000" },
      { service: "Garage demolition", range: "$2,000 – $6,000" },
      { service: "Pool removal", range: "$5,000 – $15,000" },
      { service: "Excavation and grading (per hour)", range: "$100 – $300" },
    ],
    emergencyServices: ["Emergency structural demolition", "Storm-damaged building tear-down", "Unsafe structure removal"],
    seasonalTips: ["Spring: Best season to start demolition and excavation projects as ground thaws", "Summer: Peak construction season; book early for best scheduling", "Fall: Complete excavation before ground freezes in late November", "Winter: Interior demolition can continue; exterior work limited by frozen ground"],
    ctaPrimary: "Find Demolition Contractor",
    ctaSecondary: "Compare Demolition Companies",
    quoteFormTitle: "Get a Free Demolition Quote",
    quoteFormDescription: "Describe your demolition or excavation project and we'll connect you with top-rated Erie contractors.",
  },
};

// ────────────────────────────────────────────────────────────────────────────
// Helper functions
// ────────────────────────────────────────────────────────────────────────────

/**
 * Get niche content by slug. Returns undefined if the niche doesn't exist.
 */
export function getNicheContent(slug: string): LocalNicheContent | undefined {
  return NICHE_CONTENT[slug];
}

/**
 * Get all niche slugs for static params generation.
 */
export function getAllNicheSlugs(): string[] {
  // Return ALL niche slugs from niches.ts (source of truth for all 24 niches),
  // not just the ones with content entries. Pages that need content should
  // call getNicheContent() and handle undefined gracefully.
  try {
    const { niches } = require("./niches");
    return niches.map((n: { slug: string }) => n.slug);
  } catch {
    return Object.keys(NICHE_CONTENT);
  }
}

/**
 * Check if a niche has emergency services.
 */
export function hasEmergencyServices(slug: string): boolean {
  const content = NICHE_CONTENT[slug];
  return !!content && content.emergencyServices.length > 0;
}
