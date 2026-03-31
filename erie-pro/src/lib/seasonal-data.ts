// ────────────────────────────────────────────────────────────────────────────
// Seasonal Maintenance Data — erie.pro
// Erie, PA specific seasonal maintenance tips for all 12 niches.
// Accounts for lake effect snow, freeze-thaw cycles, humid summers, etc.
// ────────────────────────────────────────────────────────────────────────────

export interface SeasonalTask {
  task: string;
  details: string;
  urgency: "essential" | "recommended" | "optional";
}

export interface SeasonalGuide {
  spring: SeasonalTask[];
  summer: SeasonalTask[];
  fall: SeasonalTask[];
  winter: SeasonalTask[];
}

export const SEASONAL_DATA: Record<string, SeasonalGuide> = {
  plumbing: {
    spring: [
      { task: "Test your sump pump", details: "Pour a bucket of water into the sump pit to verify the pump activates, drains, and shuts off. Spring snowmelt is Erie's peak flooding season.", urgency: "essential" },
      { task: "Inspect for frozen pipe damage", details: "Check all visible pipes for cracks, bulges, or slow leaks that may have developed during winter freezes. Pay attention to pipes in crawl spaces and exterior walls.", urgency: "essential" },
      { task: "Clean gutters and downspouts", details: "Clear debris from winter to ensure proper drainage away from your foundation. Clogged gutters during spring rains contribute to basement flooding.", urgency: "essential" },
      { task: "Reconnect outdoor hose bibs", details: "Turn on outdoor faucets and check for leaks. If water trickles or sprays from the wall, the pipe may have frozen and cracked over winter.", urgency: "recommended" },
      { task: "Schedule a water heater flush", details: "Erie's hard water causes sediment buildup. Annual flushing extends the life of your water heater and improves efficiency.", urgency: "recommended" },
    ],
    summer: [
      { task: "Inspect sewer lines", details: "Tree roots grow aggressively in summer and can infiltrate older clay sewer lines common in Erie neighborhoods. Schedule a camera inspection if drains are slow.", urgency: "recommended" },
      { task: "Check water pressure", details: "High summer demand can reveal pressure problems. Ideal residential pressure is 40-60 PSI. Have a PRV inspected if pressure seems inconsistent.", urgency: "optional" },
      { task: "Service your water softener", details: "Erie's municipal water is moderately hard. Summer is ideal for cleaning the brine tank and checking salt levels.", urgency: "recommended" },
      { task: "Inspect washing machine hoses", details: "Replace rubber hoses with braided stainless steel if older than 5 years. Burst washer hoses are a leading cause of home water damage.", urgency: "recommended" },
    ],
    fall: [
      { task: "Winterize outdoor plumbing", details: "Disconnect garden hoses, shut off exterior faucet supply valves, and drain outdoor lines. Erie's first hard freeze typically arrives in late October.", urgency: "essential" },
      { task: "Insulate exposed pipes", details: "Add foam insulation to pipes in unheated areas: crawl spaces, garages, and along exterior walls. Erie winters regularly reach sub-zero temperatures.", urgency: "essential" },
      { task: "Service your sump pump before winter", details: "Test the pump, clean the pit, and consider installing a battery backup. Power outages during winter storms can leave your basement unprotected.", urgency: "essential" },
      { task: "Inspect your water heater", details: "Check the anode rod, test the temperature-pressure relief valve, and verify the thermostat setting (120°F recommended).", urgency: "recommended" },
      { task: "Locate your main shutoff valve", details: "Ensure everyone in the household knows where the main water shutoff is located. In a pipe burst emergency, every second counts.", urgency: "recommended" },
    ],
    winter: [
      { task: "Prevent frozen pipes", details: "Keep your thermostat at 55°F or above, even when away. Open cabinet doors under sinks on exterior walls. Let faucets drip during sub-zero nights.", urgency: "essential" },
      { task: "Monitor your sump pump", details: "Groundwater can still flow during winter thaws. Check that your sump pump and discharge line are not frozen.", urgency: "essential" },
      { task: "Know the signs of a frozen pipe", details: "No water from a faucet, frost on visible pipes, or unusual sounds when running water. Do not use an open flame to thaw — call a plumber.", urgency: "essential" },
      { task: "Check for ice dams affecting plumbing vents", details: "Snow and ice can block plumbing vent pipes on the roof, causing slow drains and gurgling sounds.", urgency: "recommended" },
    ],
  },

  hvac: {
    spring: [
      { task: "Schedule AC tune-up", details: "Have your air conditioning system inspected and serviced before summer. Technicians are less busy in spring, and you avoid emergency calls during the first heat wave.", urgency: "essential" },
      { task: "Replace furnace filter", details: "After running all winter, your filter is loaded with dust and debris. Start the cooling season with a fresh filter for optimal airflow.", urgency: "essential" },
      { task: "Clean around the outdoor unit", details: "Remove leaves, debris, and any protective cover from your condenser. Trim vegetation to maintain at least 2 feet of clearance.", urgency: "recommended" },
      { task: "Test your air conditioning", details: "Run your AC before the first hot day to verify it cools properly. This gives you time to schedule repairs without sweating through a heat wave.", urgency: "recommended" },
      { task: "Check thermostat programming", details: "Update your schedule for spring and summer. Consider upgrading to a smart thermostat if you still have a manual model.", urgency: "optional" },
    ],
    summer: [
      { task: "Change filters monthly", details: "During heavy AC use, check your filter monthly. Erie's summer humidity increases airborne particles, and a clogged filter reduces efficiency and increases energy bills.", urgency: "essential" },
      { task: "Keep the condensate drain clear", details: "The AC condensate line can clog with algae and mold during humid Erie summers. Pour a cup of vinegar through it monthly.", urgency: "recommended" },
      { task: "Monitor your energy bills", details: "A sudden spike often indicates an HVAC problem — refrigerant leak, failing compressor, or ductwork issue. Address early before a complete breakdown.", urgency: "recommended" },
      { task: "Ensure proper attic ventilation", details: "A hot attic makes your AC work harder. Verify soffit and ridge vents are unblocked. Attic temperatures above 150°F indicate a ventilation problem.", urgency: "optional" },
    ],
    fall: [
      { task: "Schedule furnace tune-up", details: "Have your furnace professionally inspected and cleaned before heating season. This is the most important HVAC maintenance task for Erie homeowners.", urgency: "essential" },
      { task: "Test your heating system", details: "Turn on the heat before the first cold snap. A brief burning smell is normal after summer disuse, but persistent odors or no heat need immediate attention.", urgency: "essential" },
      { task: "Seal duct leaks", details: "Leaky ducts waste 20-30% of heating energy. Erie's long heating season means duct sealing pays for itself quickly.", urgency: "recommended" },
      { task: "Check carbon monoxide detectors", details: "Replace batteries and test all CO detectors before furnace season. CO poisoning risk increases when homes are sealed tight for winter.", urgency: "essential" },
      { task: "Consider a humidifier", details: "Erie's winter air is extremely dry indoors. A whole-house humidifier prevents dry skin, static electricity, and protects hardwood floors.", urgency: "optional" },
    ],
    winter: [
      { task: "Change filters every 1-2 months", details: "Your furnace runs almost continuously during Erie's coldest months. Clean filters are critical for efficiency and air quality.", urgency: "essential" },
      { task: "Keep vents and registers clear", details: "Ensure furniture, rugs, and curtains are not blocking supply and return vents. Blocked vents create pressure imbalances and reduce comfort.", urgency: "recommended" },
      { task: "Clear snow from the outdoor unit", details: "If you have a heat pump, keep the outdoor unit free of snow and ice accumulation. Maintain clearance for proper airflow.", urgency: "essential" },
      { task: "Monitor for unusual furnace noises", details: "Banging, squealing, or clicking sounds may indicate a failing blower motor, igniter, or heat exchanger. Do not ignore new sounds.", urgency: "recommended" },
    ],
  },

  electrical: {
    spring: [
      { task: "Test GFCI outlets", details: "Press the test and reset buttons on all GFCI outlets in kitchens, bathrooms, and outdoors. Replace any that fail to trip or reset.", urgency: "essential" },
      { task: "Inspect outdoor electrical", details: "Check outdoor outlets, landscape lighting, and weatherproof covers for winter damage. Lake effect moisture can corrode connections.", urgency: "recommended" },
      { task: "Check smoke and CO detectors", details: "Test all units and replace batteries. Replace any smoke detector over 10 years old and CO detectors over 7 years old.", urgency: "essential" },
      { task: "Schedule a ceiling fan direction change", details: "Switch fans to counter-clockwise rotation for summer cooling. This creates a downward breeze that makes rooms feel cooler.", urgency: "optional" },
    ],
    summer: [
      { task: "Assess your electrical panel capacity", details: "Summer AC, pool pumps, and increased appliance use can strain older panels. If breakers trip frequently, schedule a panel evaluation.", urgency: "recommended" },
      { task: "Install surge protection", details: "Erie's summer thunderstorms bring lightning risk. A whole-house surge protector safeguards electronics and appliances.", urgency: "recommended" },
      { task: "Check outdoor lighting", details: "Verify landscape lights, security lights, and pathway lighting are functioning. Longer daylight hours reveal fixtures that need attention.", urgency: "optional" },
      { task: "Plan major electrical projects", details: "Summer's mild weather is ideal for panel upgrades, EV charger installations, or whole-house generator hookups before winter storm season.", urgency: "optional" },
    ],
    fall: [
      { task: "Test your generator", details: "Run your whole-house or portable generator to verify it starts and produces power. Service it before winter storm season.", urgency: "essential" },
      { task: "Inspect heating system wiring", details: "Before the furnace runs daily, have an electrician inspect connections to your HVAC system, especially in older Erie homes.", urgency: "recommended" },
      { task: "Switch ceiling fan direction", details: "Set fans to clockwise rotation at low speed to push warm air down from the ceiling, reducing heating costs.", urgency: "optional" },
      { task: "Check exterior holiday lighting circuits", details: "Before decorating season, verify outdoor outlets and circuits can handle the planned load safely.", urgency: "recommended" },
      { task: "Update smoke detector batteries", details: "Replace batteries in all smoke and CO detectors when you set clocks back for daylight saving time.", urgency: "essential" },
    ],
    winter: [
      { task: "Avoid overloading circuits", details: "Space heaters, holiday lights, and winter appliances increase electrical demand. Never daisy-chain power strips or exceed circuit capacity.", urgency: "essential" },
      { task: "Keep generator fuel fresh", details: "If using a portable generator, store treated gasoline. Run the generator monthly for 15 minutes to keep it ready for outages.", urgency: "recommended" },
      { task: "Check for flickering lights", details: "Flickering during winter storms may indicate loose connections stressed by temperature changes. Persistent flickering warrants a professional inspection.", urgency: "recommended" },
      { task: "Protect outdoor outlets", details: "Verify all outdoor outlets have weatherproof covers to prevent moisture intrusion from snow and ice.", urgency: "recommended" },
    ],
  },

  roofing: {
    spring: [
      { task: "Inspect for winter storm damage", details: "Check your roof from the ground with binoculars for missing, cracked, or curled shingles after Erie's harsh winter. Look for damaged flashing around chimneys and vents.", urgency: "essential" },
      { task: "Check attic for water stains", details: "Inspect the underside of the roof deck for dark spots, mold, or daylight showing through. Ice dams may have caused water infiltration you cannot see from outside.", urgency: "essential" },
      { task: "Clean gutters thoroughly", details: "Remove all winter debris from gutters and downspouts. Verify water flows freely away from the foundation.", urgency: "essential" },
      { task: "Schedule a professional roof inspection", details: "After Erie's winter, a professional inspection identifies damage before spring rains cause interior water damage.", urgency: "recommended" },
    ],
    summer: [
      { task: "Schedule roof replacement or repairs", details: "Summer offers the best weather for roofing work in Erie. Warm temperatures help shingles seal properly. Book early — roofers fill up quickly.", urgency: "recommended" },
      { task: "Check attic ventilation", details: "Verify soffit and ridge vents are clear. Poor ventilation can raise attic temperatures above 150°F, shortening shingle life.", urgency: "recommended" },
      { task: "Trim overhanging branches", details: "Cut back tree limbs that hang over or touch the roof. Falling branches cause damage, and leaves clog gutters.", urgency: "recommended" },
      { task: "Inspect caulk and sealants", details: "Check around vent boots, skylights, and chimney flashing. UV exposure breaks down sealants over time.", urgency: "optional" },
    ],
    fall: [
      { task: "Pre-winter roof inspection", details: "This is your last opportunity to fix problems before Erie's heaviest snow and ice. Address any issues found during this inspection immediately.", urgency: "essential" },
      { task: "Clean gutters before leaf fall ends", details: "Clean gutters after most leaves have dropped but before the first freeze. Clogged gutters contribute to ice dam formation.", urgency: "essential" },
      { task: "Check attic insulation", details: "Proper attic insulation prevents warm air from reaching the roof deck, reducing ice dam formation. Erie homes should have R-49 or higher.", urgency: "recommended" },
      { task: "Install heat cables if needed", details: "For roofs with recurring ice dam problems, heat cables along the eaves can prevent ice buildup during lake effect snow events.", urgency: "optional" },
    ],
    winter: [
      { task: "Monitor for ice dams", details: "Watch for icicles forming at the roof edge — they indicate ice dams. Large icicles and water stains on interior ceilings require immediate attention.", urgency: "essential" },
      { task: "Remove excess snow safely", details: "Use a roof rake to remove snow from the first 3-4 feet of the eave after heavy snowfalls. Never climb on an icy roof.", urgency: "recommended" },
      { task: "Check for attic condensation", details: "Warm moist air from living spaces can condense in the attic during cold weather, leading to mold and wood rot.", urgency: "recommended" },
      { task: "Document any damage for insurance", details: "Photograph storm damage as it occurs. Erie homeowners should understand their policy's coverage for wind, ice, and snow damage.", urgency: "recommended" },
    ],
  },

  landscaping: {
    spring: [
      { task: "Clean up winter debris", details: "Remove fallen branches, dead leaves, and road salt residue from lawns and beds. Salt damage from snowplows is common along Erie streets.", urgency: "essential" },
      { task: "Aerate and overseed bare patches", details: "Winter damage and salt spray create bare spots. Aerate compacted areas and seed with a cool-season grass mix suitable for Zone 6a.", urgency: "recommended" },
      { task: "Apply pre-emergent weed control", details: "Apply before soil temperature reaches 55°F (typically mid-April in Erie). This prevents crabgrass and other summer weeds.", urgency: "recommended" },
      { task: "Inspect hardscape for frost damage", details: "Check patios, walkways, and retaining walls for cracks or heaving caused by Erie's freeze-thaw cycles.", urgency: "recommended" },
      { task: "Prune dead wood from trees and shrubs", details: "Remove winter-killed branches before new growth begins. Do not prune spring-flowering shrubs until after they bloom.", urgency: "recommended" },
    ],
    summer: [
      { task: "Mow at the right height", details: "Keep cool-season grasses at 3-3.5 inches during Erie summers. Taller grass shades roots, retains moisture, and crowds out weeds.", urgency: "essential" },
      { task: "Water deeply and infrequently", details: "Apply 1 inch of water per week in a single deep watering rather than daily light sprinklings. Erie typically gets adequate summer rainfall, but dry spells require supplemental irrigation.", urgency: "recommended" },
      { task: "Monitor for grubs", details: "Japanese beetle grubs feed on grass roots in summer. Brown patches that peel back like carpet indicate grub damage. Treat with milky spore or grub control.", urgency: "recommended" },
      { task: "Deadhead perennials", details: "Remove spent flowers to encourage continued blooming through Erie's growing season. This is especially effective for coneflowers and daylilies.", urgency: "optional" },
    ],
    fall: [
      { task: "Core aerate and overseed", details: "Early fall is the best time to aerate and seed lawns in Erie. Soil is warm, air is cool, and new grass has months to establish before winter.", urgency: "essential" },
      { task: "Apply fall fertilizer", details: "The most important fertilizer application of the year for Erie lawns. Apply in late October to strengthen roots for winter survival.", urgency: "essential" },
      { task: "Plant trees and shrubs", details: "Fall planting gives roots time to establish before winter dormancy. Choose species rated for USDA Zone 6a or lower.", urgency: "recommended" },
      { task: "Winterize irrigation systems", details: "Have your sprinkler system blown out with compressed air before the first freeze (typically late October in Erie).", urgency: "essential" },
      { task: "Mulch garden beds", details: "Apply 2-3 inches of shredded hardwood mulch to insulate plant roots from Erie's harsh winter temperatures.", urgency: "recommended" },
    ],
    winter: [
      { task: "Protect vulnerable plants", details: "Wrap evergreens in burlap to shield from wind desiccation and heavy snow. Cover tender perennial roots with extra mulch.", urgency: "recommended" },
      { task: "Minimize salt near landscaping", details: "Use calcium chloride or sand instead of rock salt near lawn edges and plant beds. Road salt runoff from Erie's snow removal damages root systems.", urgency: "recommended" },
      { task: "Plan spring projects", details: "Winter is ideal for designing landscape improvements, selecting plants, and scheduling contractors before their spring rush.", urgency: "optional" },
      { task: "Shake heavy snow off branches", details: "Gently brush snow from evergreen branches before the weight causes splitting. Do not shake frozen branches — they are brittle.", urgency: "recommended" },
    ],
  },

  dental: {
    spring: [
      { task: "Schedule your biannual checkup", details: "Start the year with a professional cleaning and exam. Many dental issues are painless in early stages and only caught during routine visits.", urgency: "essential" },
      { task: "Replace your toothbrush", details: "Switch to a new toothbrush or brush head every 3 months, or after any illness. Frayed bristles are less effective at cleaning.", urgency: "recommended" },
      { task: "Review your dental insurance benefits", details: "Many plans reset in January. Schedule any needed procedures early to maximize your annual benefit and avoid December rush.", urgency: "recommended" },
      { task: "Check children for orthodontic needs", details: "The American Association of Orthodontists recommends an evaluation by age 7. Spring appointments avoid school-year scheduling conflicts.", urgency: "optional" },
    ],
    summer: [
      { task: "Get a sports mouthguard", details: "Before summer sports seasons begin, have a custom mouthguard fitted. Custom guards provide far better protection than boil-and-bite options.", urgency: "recommended" },
      { task: "Stay hydrated for oral health", details: "Dehydration reduces saliva production, increasing cavity risk. Drink water throughout the day, especially during Erie's humid summers.", urgency: "recommended" },
      { task: "Schedule kids' dental work", details: "Summer break is the ideal time for children's dental procedures that require recovery time — wisdom teeth removal, orthodontic work, or fillings.", urgency: "recommended" },
      { task: "Watch sugar intake from summer treats", details: "Ice cream, popsicles, and sugary drinks increase during summer. Rinse with water after treats if you cannot brush immediately.", urgency: "optional" },
    ],
    fall: [
      { task: "Schedule your second checkup", details: "If your first visit was in spring, fall is the time for your second biannual cleaning and exam.", urgency: "essential" },
      { task: "Use remaining insurance benefits", details: "Schedule any recommended treatments before your plan year ends. Unused dental benefits do not roll over.", urgency: "recommended" },
      { task: "Protect teeth during sports season", details: "Fall sports like football, soccer, and hockey carry dental injury risk. Ensure student athletes have proper mouthguards.", urgency: "recommended" },
      { task: "Consider cosmetic work before holidays", details: "Teeth whitening, veneers, and other cosmetic procedures typically need 2-4 weeks of healing. Schedule now for holiday photos.", urgency: "optional" },
    ],
    winter: [
      { task: "Maintain oral hygiene during cold and flu season", details: "Replace your toothbrush after illness. Continue flossing even when under the weather — gum disease risk increases during illness.", urgency: "essential" },
      { task: "Address tooth sensitivity", details: "Cold Erie winter air can trigger tooth sensitivity. If breathing cold air causes sharp pain, consult your dentist — it may indicate a crack or decay.", urgency: "recommended" },
      { task: "Protect lips from cold and wind", details: "Erie's cold, windy winters cause chapped lips. Use SPF lip balm and stay hydrated to prevent painful cracking.", urgency: "optional" },
      { task: "Avoid using teeth as tools", details: "Holiday season means extra packages and snacks. Never use teeth to open packaging, crack nuts, or tear tape.", urgency: "recommended" },
    ],
  },

  legal: {
    spring: [
      { task: "Review your estate plan", details: "Tax season is a natural time to review your will, trusts, and beneficiary designations. Update for any life changes — marriage, divorce, new children, or property purchases.", urgency: "recommended" },
      { task: "Check business compliance deadlines", details: "Pennsylvania annual reports and business filings often have spring deadlines. Missing them can result in penalties or loss of good standing.", urgency: "essential" },
      { task: "Review insurance policies", details: "Ensure liability coverage is adequate. Spring is when many insurance policies renew — a good time to consult with an attorney about coverage gaps.", urgency: "recommended" },
      { task: "Document property boundaries", details: "Before landscaping season, verify property boundaries to avoid disputes with neighbors. A boundary survey costs $300-$800 and prevents costly litigation.", urgency: "optional" },
    ],
    summer: [
      { task: "Prepare for real estate transactions", details: "Summer is the busiest season for home sales in Erie. If buying or selling, have an attorney review contracts and handle the closing.", urgency: "recommended" },
      { task: "Create a vacation emergency plan", details: "Before traveling, ensure your power of attorney, healthcare directive, and emergency contacts are current and accessible.", urgency: "recommended" },
      { task: "Review custody arrangements", details: "Summer schedules often differ from school-year custody agreements. Clarify vacation schedules and travel permissions in writing.", urgency: "recommended" },
      { task: "Check statute of limitations on pending claims", details: "If you have an unresolved injury or contract dispute, verify you are within the filing deadline. PA personal injury is 2 years.", urgency: "essential" },
    ],
    fall: [
      { task: "Year-end tax planning", details: "Consult with an attorney or financial advisor about tax-advantaged strategies before December 31. This includes charitable giving, business deductions, and estate planning.", urgency: "recommended" },
      { task: "Review business contracts", details: "Before the new year, review vendor agreements, leases, and employment contracts for renewal terms and renegotiation opportunities.", urgency: "recommended" },
      { task: "Update beneficiary designations", details: "Life insurance, retirement accounts, and bank accounts often pass by beneficiary designation, not your will. Ensure they are current.", urgency: "recommended" },
      { task: "Prepare for PA property tax appeals", details: "If your Erie County property assessment seems high, research comparable values and consider filing an appeal before the deadline.", urgency: "optional" },
    ],
    winter: [
      { task: "New year legal resolutions", details: "Create or update your will, establish a healthcare directive, and organize important legal documents in one secure location.", urgency: "recommended" },
      { task: "Review slip-and-fall liability", details: "Property owners in Erie are responsible for clearing snow and ice from sidewalks within a reasonable time after storms. Understand your liability.", urgency: "essential" },
      { task: "Document winter property damage", details: "Photograph any storm damage to your property immediately. This documentation is essential for insurance claims and potential litigation.", urgency: "recommended" },
      { task: "Plan for business entity filings", details: "Annual reports, LLC renewals, and S-Corp elections have early-year deadlines. Consult your attorney to stay compliant.", urgency: "recommended" },
    ],
  },

  cleaning: {
    spring: [
      { task: "Schedule a deep spring clean", details: "Erie winters mean sealed windows and accumulated dust. A professional deep clean addresses months of reduced ventilation and heavy indoor living.", urgency: "essential" },
      { task: "Clean windows inside and out", details: "After Erie's long winter, windows are coated with salt residue, condensation stains, and grime. Clean glass transforms your home's light and appearance.", urgency: "recommended" },
      { task: "Wash curtains and blinds", details: "Fabric curtains absorb cooking odors, dust, and pet dander all winter. Launder curtains and wipe down blinds thoroughly.", urgency: "recommended" },
      { task: "Deep clean carpets", details: "Winter tracking brings salt, mud, and moisture into carpets. Professional hot water extraction removes embedded dirt and restores fibers.", urgency: "recommended" },
      { task: "Clean the garage and entryways", details: "Remove salt, sand, and winter debris from garages, mudrooms, and entryways. These areas take the brunt of Erie's winter traffic.", urgency: "recommended" },
    ],
    summer: [
      { task: "Focus on outdoor cleaning", details: "Power wash decks, patios, siding, and driveways. Erie's humidity encourages mold and mildew growth on exterior surfaces.", urgency: "recommended" },
      { task: "Clean HVAC vents and returns", details: "Dust and debris accumulate in vents during spring pollen season. Clean vents improve air quality and AC efficiency.", urgency: "recommended" },
      { task: "Deep clean the kitchen", details: "Pull out appliances and clean behind and beneath them. Degrease range hoods and clean the oven interior.", urgency: "recommended" },
      { task: "Address mold-prone areas", details: "Erie's summer humidity creates ideal conditions for mold in bathrooms, basements, and laundry rooms. Clean and treat these areas regularly.", urgency: "essential" },
    ],
    fall: [
      { task: "Pre-winter deep clean", details: "Before sealing up for winter, give your home a thorough cleaning. You will be living with indoor air quality for the next 5-6 months.", urgency: "essential" },
      { task: "Clean and organize closets", details: "Rotate seasonal wardrobes and clean closet shelves and floors before storing summer items.", urgency: "recommended" },
      { task: "Clean the fireplace and chimney area", details: "If you use a fireplace, clean the hearth area and have the chimney swept before the first fire of the season.", urgency: "recommended" },
      { task: "Set up a winter entryway system", details: "Place heavy-duty mats, boot trays, and a cleaning station near entries to manage the salt, snow, and mud that Erie winters bring indoors.", urgency: "recommended" },
    ],
    winter: [
      { task: "Maintain high-touch surfaces", details: "During cold and flu season, regularly disinfect doorknobs, light switches, countertops, and remote controls.", urgency: "essential" },
      { task: "Control humidity and mold", details: "Sealed homes with running furnaces create dry air, but basement areas can still harbor moisture. Monitor with a hygrometer and use dehumidifiers as needed.", urgency: "recommended" },
      { task: "Weekly vacuuming with HEPA filter", details: "Indoor air quality suffers when windows stay closed. HEPA vacuuming removes allergens, dust, and pet dander.", urgency: "recommended" },
      { task: "Clean salt stains promptly", details: "Wipe up road salt tracked inside before it damages hardwood floors, tile grout, and carpet fibers.", urgency: "essential" },
    ],
  },

  "auto-repair": {
    spring: [
      { task: "Switch to all-season tires", details: "If you run dedicated winter tires, swap them out when overnight temperatures consistently stay above 45°F. Store winter tires properly.", urgency: "essential" },
      { task: "Check alignment after pothole season", details: "Erie's spring potholes wreak havoc on alignment and suspension. If your car pulls to one side or the steering wheel is off-center, schedule an alignment.", urgency: "essential" },
      { task: "Wash undercarriage thoroughly", details: "Months of road salt cause corrosion. A thorough undercarriage wash in spring removes salt residue before it causes rust damage.", urgency: "essential" },
      { task: "Inspect brakes and suspension", details: "Winter driving wears brakes faster and potholes stress suspension components. Have both inspected during your spring service.", urgency: "recommended" },
      { task: "Replace wiper blades", details: "Winter ice and freezing rain destroy wiper blades. Start spring with a fresh pair for April showers.", urgency: "recommended" },
    ],
    summer: [
      { task: "Check AC performance", details: "If your AC blows warm or takes a long time to cool, the system may need refrigerant or repair. Address before the hottest months.", urgency: "recommended" },
      { task: "Inspect tires for wear", details: "Check tread depth and look for uneven wear patterns. Summer road trips put extra miles on tires. Replace any tire below 3/32 inch tread.", urgency: "recommended" },
      { task: "Check coolant levels", details: "Overheating is more common in summer. Verify coolant is at the proper level and the reservoir shows the correct color (not rusty).", urgency: "essential" },
      { task: "Prepare for PA state inspection", details: "If your inspection sticker expires in summer, schedule it early. Address known issues beforehand to avoid delays.", urgency: "recommended" },
    ],
    fall: [
      { task: "Install winter tires", details: "Switch to winter tires before the first snow. Erie's lake effect storms can arrive suddenly. Winter tires provide dramatically better traction in snow and ice.", urgency: "essential" },
      { task: "Check battery health", details: "Cold weather is harder on batteries. Have yours tested before winter — a battery that barely starts in fall will fail in January.", urgency: "essential" },
      { task: "Top off all fluids", details: "Ensure antifreeze, windshield washer fluid (rated for -20°F), oil, and brake fluid are all at proper levels.", urgency: "essential" },
      { task: "Inspect heater and defroster", details: "Verify the heater produces warm air and the defroster clears the windshield effectively. Both are safety essentials for Erie winters.", urgency: "essential" },
      { task: "Consider rust protection", details: "Apply undercoating or rust inhibitor before salt season. This is especially valuable for newer vehicles to preserve resale value.", urgency: "recommended" },
    ],
    winter: [
      { task: "Maintain an emergency kit", details: "Keep a blanket, flashlight, jumper cables, ice scraper, sand or kitty litter, and a phone charger in your vehicle.", urgency: "essential" },
      { task: "Wash regularly despite the cold", details: "Regular washes remove road salt that causes rust. Focus on the undercarriage. Many Erie car washes offer unlimited monthly plans.", urgency: "recommended" },
      { task: "Keep the gas tank above half full", details: "A fuller tank reduces condensation that can freeze in fuel lines. It also ensures you have fuel if stranded during a winter storm.", urgency: "recommended" },
      { task: "Check tire pressure monthly", details: "Tire pressure drops about 1 PSI for every 10°F temperature drop. Under-inflated tires reduce traction and fuel economy.", urgency: "essential" },
    ],
  },

  "pest-control": {
    spring: [
      { task: "Schedule a perimeter treatment", details: "As temperatures rise, insects become active. A spring perimeter treatment creates a barrier before ants, spiders, and other pests enter your home.", urgency: "essential" },
      { task: "Inspect for carpenter ant activity", details: "Carpenter ants emerge in spring to expand colonies. Look for sawdust-like frass near wood structures, especially in damp areas.", urgency: "recommended" },
      { task: "Seal entry points", details: "Inspect the foundation, windows, and door frames for gaps. Mice can enter through openings as small as a dime. Caulk and seal before pest season.", urgency: "essential" },
      { task: "Check for termite swarmers", details: "Winged termites (swarmers) appear in spring. Finding wings or swarmers near windows indicates a nearby colony that needs professional treatment.", urgency: "essential" },
    ],
    summer: [
      { task: "Address mosquito breeding areas", details: "Eliminate standing water in gutters, flower pots, birdbaths, and tarps. Erie's proximity to water makes mosquito control important.", urgency: "recommended" },
      { task: "Watch for wasp and hornet nests", details: "Inspect eaves, soffits, decks, and play structures for nests. Early-season nests are small and easier to treat safely.", urgency: "recommended" },
      { task: "Maintain your treatment schedule", details: "Quarterly pest treatments are most effective when maintained consistently. Skipping summer treatment allows populations to rebound.", urgency: "recommended" },
      { task: "Keep food sealed and areas clean", details: "Summer warmth accelerates food spoilage and attracts ants, fruit flies, and roaches. Store food in sealed containers and clean up crumbs promptly.", urgency: "recommended" },
    ],
    fall: [
      { task: "Rodent-proof your home", details: "Mice and rats seek shelter as temperatures drop. Seal gaps around pipes, vents, and utility lines. Install door sweeps on exterior doors.", urgency: "essential" },
      { task: "Remove attractants near the foundation", details: "Clear leaf piles, firewood, and debris from against the house. These provide harborage for rodents and insects seeking winter shelter.", urgency: "essential" },
      { task: "Address stink bug entry points", details: "Brown marmorated stink bugs invade Erie homes in fall. Seal cracks around windows and doors before they enter. Once inside, vacuum rather than crush them.", urgency: "recommended" },
      { task: "Schedule a fall perimeter treatment", details: "A late-fall treatment creates a barrier as pests seek warmth. This is the second most important treatment of the year after spring.", urgency: "recommended" },
    ],
    winter: [
      { task: "Monitor for rodent activity", details: "Listen for scratching in walls and check for droppings in cabinets, basements, and attics. Act immediately — mice reproduce rapidly indoors.", urgency: "essential" },
      { task: "Inspect stored food items", details: "Check pantry items for signs of moth larvae or beetle activity. Indian meal moths and flour beetles thrive in stored grains.", urgency: "recommended" },
      { task: "Maintain exterior bait stations", details: "If your pest control service uses exterior bait stations, ensure they remain accessible and undisturbed by snow and ice.", urgency: "recommended" },
      { task: "Plan for spring", details: "Winter is ideal for scheduling your annual termite inspection and spring perimeter treatment. Early bookings ensure priority scheduling.", urgency: "optional" },
    ],
  },

  painting: {
    spring: [
      { task: "Inspect exterior paint condition", details: "Walk your property and look for peeling, cracking, blistering, or fading paint. Erie's freeze-thaw cycles cause accelerated exterior paint deterioration.", urgency: "essential" },
      { task: "Plan exterior painting projects", details: "Book exterior painting contractors now for summer scheduling. Popular painters fill up quickly — early planning ensures better availability and pricing.", urgency: "recommended" },
      { task: "Touch up interior scuffs", details: "Winter's heavy indoor use leaves wall scuffs, marks, and minor damage. Spring light reveals imperfections for touch-up.", urgency: "optional" },
      { task: "Check caulking around windows and doors", details: "Failed caulk allows water infiltration that damages both the structure and the paint. Re-caulk any gaps before painting.", urgency: "recommended" },
    ],
    summer: [
      { task: "Exterior painting season", details: "June through September is prime exterior painting weather in Erie. Temperatures should be 50-85°F with low humidity for best results.", urgency: "essential" },
      { task: "Power wash before painting", details: "Clean exterior surfaces thoroughly before any painting. Remove mold, mildew, chalking, and dirt for proper paint adhesion.", urgency: "essential" },
      { task: "Address wood rot before painting", details: "Painting over rotted wood traps moisture and accelerates decay. Replace or epoxy-repair damaged wood before priming and painting.", urgency: "essential" },
      { task: "Consider deck and fence staining", details: "Summer is ideal for staining decks and fences. Apply stain when the wood is dry and temperatures will stay above 50°F for 24 hours.", urgency: "recommended" },
    ],
    fall: [
      { task: "Complete exterior projects before October", details: "Erie's painting season ends when overnight temperatures consistently drop below 50°F, typically by mid-October. Finish exterior work before then.", urgency: "essential" },
      { task: "Plan interior winter projects", details: "Fall is the time to select colors, hire painters, and plan interior work for the winter months when outdoor painting is not possible.", urgency: "recommended" },
      { task: "Protect freshly painted surfaces", details: "If you painted this summer, inspect the work before winter. Touch up any areas that need attention while weather permits.", urgency: "recommended" },
      { task: "Store paint properly", details: "Move paint cans to climate-controlled storage. Latex paint freezes and is ruined at 32°F — garages and sheds are not safe for paint storage in Erie.", urgency: "essential" },
    ],
    winter: [
      { task: "Focus on interior painting", details: "Winter is ideal for interior projects. Lower humidity and closed windows create good conditions for paint drying and curing.", urgency: "recommended" },
      { task: "Ensure proper ventilation", details: "When painting indoors with windows closed, use fans and open interior doors for air circulation. Choose low-VOC or zero-VOC paints.", urgency: "essential" },
      { task: "Plan kitchen cabinet refinishing", details: "Winter is perfect for cabinet painting. The project takes 5-10 days and is less disruptive when you are not opening windows frequently.", urgency: "optional" },
      { task: "Research colors for spring projects", details: "Order paint samples and test colors on your walls. Different lighting conditions throughout winter help you make confident color choices.", urgency: "optional" },
    ],
  },

  "real-estate": {
    spring: [
      { task: "Prepare your home for listing season", details: "Spring is the hottest selling season in Erie. If planning to sell, begin decluttering, making repairs, and improving curb appeal in March and April.", urgency: "essential" },
      { task: "Get a pre-listing home inspection", details: "Identify and fix issues before buyers discover them. A pre-listing inspection puts you in control of the repair process and timeline.", urgency: "recommended" },
      { task: "Review your property tax assessment", details: "Erie County property assessments can be challenged. If comparable homes sold for less than your assessed value, consider filing an appeal.", urgency: "recommended" },
      { task: "Boost curb appeal", details: "Fresh mulch, clean gutters, power-washed siding, and a tidy lawn make a strong first impression for spring buyers.", urgency: "essential" },
    ],
    summer: [
      { task: "List your home if selling", details: "Families prefer to move during summer to minimize school disruption. Well-priced Erie homes can receive offers within days during peak season.", urgency: "essential" },
      { task: "Get pre-approved if buying", details: "Before house hunting, obtain a mortgage pre-approval letter. In competitive markets, sellers favor pre-approved buyers.", urgency: "essential" },
      { task: "Research neighborhoods", details: "Spend time in Erie neighborhoods you are considering. Visit at different times of day and talk to residents about the community.", urgency: "recommended" },
      { task: "Budget for closing costs", details: "Buyers should budget 2-5% of the purchase price for closing costs. Sellers should budget 6-10% including agent commissions.", urgency: "recommended" },
    ],
    fall: [
      { task: "Take advantage of reduced competition", details: "Fall sellers face fewer competing listings. Motivated buyers are still active, and fall showings benefit from cozy home staging.", urgency: "recommended" },
      { task: "Prepare for winter closing", details: "If under contract, ensure inspections and appraisals are scheduled promptly. Holiday schedules can delay lender processing.", urgency: "recommended" },
      { task: "Review homeowner's insurance", details: "Before winter, ensure your policy covers winter-specific risks: frozen pipes, ice dams, and snow-related damage.", urgency: "recommended" },
      { task: "Consider rental property opportunities", details: "Fall often brings motivated sellers and rental properties at better prices. Investors should evaluate year-end opportunities.", urgency: "optional" },
    ],
    winter: [
      { task: "Monitor the Erie market", details: "Winter listings are fewer, but so is buyer competition. Watch for new listings that may be priced aggressively for a quick sale.", urgency: "recommended" },
      { task: "Get finances in order for spring", details: "Review your credit report, pay down debt, and save for a down payment. Spring buyers who are financially prepared move fastest.", urgency: "essential" },
      { task: "Plan home improvements for spring", details: "Use winter to plan renovations that increase home value: kitchen updates, bathroom remodels, and curb appeal improvements.", urgency: "recommended" },
      { task: "Protect your investment", details: "Ensure walkways are cleared, pipes are insulated, and the furnace is maintained. Winter property damage can derail a spring sale.", urgency: "essential" },
    ],
  },
};

export function getSeasonalGuide(slug: string): SeasonalGuide | undefined {
  return SEASONAL_DATA[slug];
}
