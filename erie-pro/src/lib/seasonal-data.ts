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

  "garage-door": {
    spring: [
      { task: "Inspect for winter damage", details: "Check tracks, springs, cables, and panels for damage from Erie's winter cold and ice. Look for bent tracks, frayed cables, and cracked panels.", urgency: "essential" },
      { task: "Lubricate all moving parts", details: "Apply silicone-based lubricant to rollers, hinges, springs, and tracks. Winter cold thickens lubricant, so fresh application restores smooth operation.", urgency: "essential" },
      { task: "Test safety features", details: "Verify the auto-reverse mechanism by placing a board in the door path. Test photo-eye sensors to ensure they stop the door from closing on obstructions.", urgency: "essential" },
      { task: "Check weatherstripping", details: "Inspect the bottom seal and side weatherstripping for cracks, gaps, or compression damage from winter ice. Replace damaged seals before spring rains.", urgency: "recommended" },
    ],
    summer: [
      { task: "Schedule a professional tune-up", details: "A professional inspection includes spring tension testing, track alignment, opener calibration, and safety checks. Summer is the best time for maintenance.", urgency: "recommended" },
      { task: "Consider an insulated door upgrade", details: "If your garage door lacks insulation, summer is ideal for replacement before next winter. Insulated doors (R-12+) save energy and protect against Erie's cold.", urgency: "optional" },
      { task: "Clean and inspect the opener", details: "Wipe down the opener unit, check the chain or belt tension, and test the battery backup if equipped.", urgency: "recommended" },
      { task: "Paint or seal wood doors", details: "If you have a wood garage door, summer's dry weather is perfect for repainting or resealing to protect against Erie's wet fall and winter.", urgency: "recommended" },
    ],
    fall: [
      { task: "Winterize your garage door", details: "Lubricate all moving parts with cold-weather silicone spray. Check springs for signs of fatigue. Ensure the bottom seal makes full contact with the floor.", urgency: "essential" },
      { task: "Test the door in cold weather", details: "As temperatures drop, test the door operation on cold mornings. Sluggish operation may indicate springs losing tension or lubricant thickening.", urgency: "recommended" },
      { task: "Inspect and replace batteries", details: "Replace batteries in remotes, keypads, and opener backup systems. Cold weather drains batteries faster.", urgency: "recommended" },
      { task: "Clear the door path", details: "Remove leaves, debris, and anything stored near the door tracks. Ensure the garage floor is clear for smooth winter operation.", urgency: "recommended" },
    ],
    winter: [
      { task: "Keep the bottom seal ice-free", details: "Break ice buildup between the door and the floor before opening. Forcing the door open against ice can damage seals, cables, and the opener.", urgency: "essential" },
      { task: "Clear snow from the door path", details: "Shovel snow away from the garage door opening so the door can fully close and seal. Snow buildup causes the door to close unevenly.", urgency: "essential" },
      { task: "Listen for unusual noises", details: "Grinding, popping, or squealing sounds in cold weather may indicate a failing spring, worn rollers, or misaligned tracks. Address before a complete failure.", urgency: "recommended" },
      { task: "Monitor spring performance", details: "If the door feels heavy or the opener struggles, springs may be weakening. Erie's cold accelerates metal fatigue in springs.", urgency: "recommended" },
    ],
  },

  fencing: {
    spring: [
      { task: "Inspect for winter damage", details: "Walk the fence line looking for leaning posts, loose boards, frost-heaved posts, and broken hardware. Erie's freeze-thaw cycles shift fence posts significantly.", urgency: "essential" },
      { task: "Reset heaved posts", details: "Posts that have lifted out of the ground due to frost heave need to be reset to the proper depth (below the 32-inch frost line).", urgency: "essential" },
      { task: "Clean vinyl and aluminum fences", details: "Power wash vinyl and aluminum fences to remove winter grime, mold, and salt deposits. Mild soap and a garden hose work for light cleaning.", urgency: "recommended" },
      { task: "Stain or seal wood fences", details: "After wood has dried from spring rains, apply stain or sealer to protect against Erie's summer humidity and fall moisture.", urgency: "recommended" },
    ],
    summer: [
      { task: "Schedule new fence installation", details: "Summer is prime installation season in Erie. Book contractors early — they fill up quickly from May through September.", urgency: "recommended" },
      { task: "Repair loose or damaged sections", details: "Tighten hardware, replace broken pickets, and reinforce sagging gates. Dry summer weather is ideal for fence repairs.", urgency: "recommended" },
      { task: "Treat wood for insects", details: "Check wood fences for signs of carpenter ants or other wood-boring insects. Treat with appropriate products during dry weather.", urgency: "optional" },
      { task: "Trim vegetation along fence lines", details: "Cut back plants, vines, and grass growing against the fence. Vegetation holds moisture against wood and accelerates decay.", urgency: "recommended" },
    ],
    fall: [
      { task: "Final inspection before winter", details: "Check all posts, connections, and hardware. Repair any weak points before Erie's snow and wind put the fence under stress.", urgency: "essential" },
      { task: "Clear debris from fence lines", details: "Remove fallen leaves and yard debris from fence bases. Trapped moisture against wood fencing causes rot.", urgency: "recommended" },
      { task: "Apply protective treatment to wood", details: "A final application of water repellent before winter protects wood fences from Erie's wet, snowy months.", urgency: "recommended" },
      { task: "Secure gates and latches", details: "Ensure gates close and latch securely. Winter wind can slam unsecured gates repeatedly, damaging hinges and posts.", urgency: "recommended" },
    ],
    winter: [
      { task: "Remove heavy snow from fences", details: "Gently brush heavy wet snow off vinyl and wood fence panels. Lake effect snow loads can cause panels to bow, crack, or collapse.", urgency: "recommended" },
      { task: "Avoid piling snow against fences", details: "When shoveling or plowing, direct snow away from fence lines. Snow piles put lateral pressure on posts and panels.", urgency: "recommended" },
      { task: "Monitor for wind damage", details: "After major winter storms, walk the fence line to check for wind-damaged sections that need immediate repair for security.", urgency: "recommended" },
      { task: "Plan spring projects", details: "Winter is ideal for designing new fence layouts, getting estimates, and scheduling spring installation.", urgency: "optional" },
    ],
  },

  flooring: {
    spring: [
      { task: "Inspect for winter moisture damage", details: "Check basement and ground-level floors for warping, buckling, or discoloration caused by winter moisture and snowmelt seepage.", urgency: "essential" },
      { task: "Deep clean all flooring", details: "Remove winter's accumulation of salt, grit, and grime. Salt is corrosive to hardwood finishes and can stain grout.", urgency: "essential" },
      { task: "Schedule hardwood refinishing", details: "Spring's moderate humidity is ideal for hardwood refinishing. Windows can be opened for ventilation during the curing process.", urgency: "recommended" },
      { task: "Check humidity levels", details: "As winter heating ends and spring moisture increases, monitor indoor humidity (35-55% ideal). Excessive swings damage hardwood.", urgency: "recommended" },
    ],
    summer: [
      { task: "Schedule flooring installation", details: "Summer offers stable temperature and humidity — ideal for most flooring installations. LVP, tile, and hardwood all perform best when installed in moderate conditions.", urgency: "recommended" },
      { task: "Address basement flooring needs", details: "Before fall rains, install waterproof flooring (LVP or tile) in basements prone to Erie's seasonal moisture.", urgency: "recommended" },
      { task: "Run a dehumidifier", details: "Erie's humid summers can cause hardwood to expand and cupped. Maintain 35-55% indoor humidity with a dehumidifier if needed.", urgency: "recommended" },
      { task: "Clean tile grout", details: "Summer is ideal for deep-cleaning grout lines. Seal grout after cleaning to prevent fall and winter moisture from staining.", urgency: "optional" },
    ],
    fall: [
      { task: "Prepare floors for winter", details: "Place heavy-duty entry mats at all exterior doors. Erie's winter salt and grit are the biggest enemies of interior flooring.", urgency: "essential" },
      { task: "Apply protective finish to hardwood", details: "A fresh coat of floor finish before heating season protects against winter wear and the drying effects of indoor heat.", urgency: "recommended" },
      { task: "Inspect transitions and thresholds", details: "Check all transition strips and door thresholds for damage or looseness before increased foot traffic during the holidays.", urgency: "recommended" },
      { task: "Address subfloor concerns", details: "Squeaky or soft spots in the subfloor are easier to address before winter. Have a professional evaluate if the subfloor needs repair.", urgency: "optional" },
    ],
    winter: [
      { task: "Maintain indoor humidity", details: "Erie's dry winter air causes hardwood to shrink and develop gaps. Keep humidity between 35-55% with a humidifier.", urgency: "essential" },
      { task: "Protect floors from salt and moisture", details: "Wipe up tracked-in snow and salt immediately. Use boot trays at entries. Salt left on hardwood will damage the finish.", urgency: "essential" },
      { task: "Avoid wet mopping hardwood", details: "Use only damp (nearly dry) mops on hardwood floors. Excess water seeps into seams and causes swelling, especially when winter dry air alternates with wet snow days.", urgency: "recommended" },
      { task: "Check basement floors for moisture", details: "Winter thaw-freeze cycles can cause basement moisture. Monitor LVP and tile for standing water near walls.", urgency: "recommended" },
    ],
  },

  "windows-doors": {
    spring: [
      { task: "Inspect all window seals and caulking", details: "Check for cracked or peeling caulk around all windows and doors. Erie's freeze-thaw cycles degrade sealants faster than milder climates.", urgency: "essential" },
      { task: "Clean windows inside and out", details: "Remove winter grime, salt spray, and condensation residue. Clean tracks and weep holes to ensure proper drainage.", urgency: "recommended" },
      { task: "Test all windows for smooth operation", details: "Open and close every window. Sticking, drafts, or difficulty operating may indicate seal failure or frame damage from winter.", urgency: "recommended" },
      { task: "Schedule window replacement projects", details: "Book summer installation now. Window contractors fill up quickly in Erie once the weather warms.", urgency: "recommended" },
    ],
    summer: [
      { task: "Install replacement windows", details: "Summer's warm, dry weather is ideal for window installation. Caulk and sealants cure properly, and the work area stays dry.", urgency: "recommended" },
      { task: "Check for condensation between panes", details: "Foggy windows indicate a failed seal. The insulating gas has leaked out, reducing energy efficiency. Plan replacement before winter.", urgency: "recommended" },
      { task: "Inspect and maintain storm doors", details: "Switch storm door panels from glass to screen for summer ventilation. Lubricate hinges and clean the door closer mechanism.", urgency: "optional" },
      { task: "Evaluate energy efficiency", details: "If energy bills are high, consider an energy audit. Inefficient windows in older Erie homes can account for 25-30% of heating and cooling costs.", urgency: "optional" },
    ],
    fall: [
      { task: "Replace weatherstripping", details: "Inspect and replace worn weatherstripping on all doors and windows before heating season. Even small gaps waste significant energy in Erie's cold winters.", urgency: "essential" },
      { task: "Switch storm door panels to glass", details: "Replace screen panels with glass inserts for added insulation during Erie's heating season.", urgency: "essential" },
      { task: "Recaulk exterior windows", details: "Apply fresh exterior caulk to any windows with cracked or missing sealant. This is your last chance before Erie's first freeze.", urgency: "essential" },
      { task: "Check entry door hardware", details: "Ensure deadbolts, locks, and door closers function smoothly. Cold weather stiffens mechanisms and can lock you out.", urgency: "recommended" },
    ],
    winter: [
      { task: "Apply window insulation film", details: "For older single-pane windows awaiting replacement, interior shrink film provides temporary insulation and reduces drafts.", urgency: "recommended" },
      { task: "Monitor for ice on window sills", details: "Ice forming on interior window sills indicates insufficient insulation or failed seals. This is a sign the window needs replacement.", urgency: "recommended" },
      { task: "Manage condensation", details: "Lower indoor humidity if condensation forms on windows. Excessive moisture can damage wood frames and promote mold growth.", urgency: "recommended" },
      { task: "Check door thresholds", details: "Ensure door thresholds and sweeps make full contact. Gaps let cold air and snow blow under entry doors.", urgency: "essential" },
    ],
  },

  moving: {
    spring: [
      { task: "Book summer movers early", details: "Erie's peak moving season starts in May. Reserve your preferred moving company 4-6 weeks before your move date.", urgency: "essential" },
      { task: "Begin decluttering", details: "Sort through belongings room by room. Donate, sell, or discard items you do not need. Less stuff means lower moving costs.", urgency: "recommended" },
      { task: "Start collecting packing supplies", details: "Gather boxes, tape, bubble wrap, and packing paper. Ask local Erie stores for free boxes or order supplies online.", urgency: "recommended" },
      { task: "Research moving companies", details: "Get written estimates from at least three licensed Erie movers. Verify PA PUC registration and check online reviews.", urgency: "essential" },
    ],
    summer: [
      { task: "Move on weekdays for savings", details: "Weekday moves cost less than weekends. Mid-month moves are also less expensive than month-end when most leases turn over.", urgency: "recommended" },
      { task: "Hydrate and prepare for the heat", details: "Erie summers can be warm and humid. Keep water on hand for you and your moving crew. Start early to avoid peak afternoon heat.", urgency: "essential" },
      { task: "Protect temperature-sensitive items", details: "Electronics, medications, candles, and perishable foods can be damaged by heat in the moving truck. Transport these in your personal vehicle.", urgency: "recommended" },
      { task: "Update your address early", details: "File a USPS change of address, update your driver's license, and notify utilities, banks, and insurance companies.", urgency: "essential" },
    ],
    fall: [
      { task: "Take advantage of off-season rates", details: "Fall moves in Erie are typically less expensive than summer. Movers have more availability and may offer discounts.", urgency: "recommended" },
      { task: "Plan around weather", details: "Watch the Erie forecast for lake effect rain and early snow. Have contingency plans if your move date coincides with bad weather.", urgency: "recommended" },
      { task: "Protect floors during the move", details: "Use carpet runners and floor protectors. Fall mud and wet leaves tracked in by movers can damage hardwood and carpet.", urgency: "recommended" },
      { task: "Winterize your old home if vacant", details: "If your old home will be unoccupied, set the thermostat to 55°F, drain outdoor faucets, and have someone check on it regularly.", urgency: "essential" },
    ],
    winter: [
      { task: "Plan for lake effect snow delays", details: "Erie's winter storms can dump inches of snow quickly. Build buffer days into your schedule and discuss weather contingency plans with your mover.", urgency: "essential" },
      { task: "Protect walkways from ice", details: "Salt or sand walkways and driveways at both locations on moving day. Icy conditions pose serious injury risk for crews carrying heavy items.", urgency: "essential" },
      { task: "Shield belongings from cold and moisture", details: "Wrap furniture in moving blankets and use plastic wrap to protect against snow and freezing temperatures during transport.", urgency: "essential" },
      { task: "Keep utilities on at both locations", details: "Ensure heat is running at both the old and new home. Cold temperatures can damage electronics and make the move miserable.", urgency: "essential" },
    ],
  },

  "tree-service": {
    spring: [
      { task: "Inspect trees for winter storm damage", details: "Check all trees for cracked limbs, hanging branches, and trunk splits caused by Erie's ice and snow. Damaged trees need prompt attention.", urgency: "essential" },
      { task: "Schedule pruning for damaged limbs", details: "Remove winter-damaged branches before spring growth begins. Proper cuts promote healing and reduce disease risk.", urgency: "essential" },
      { task: "Plant new trees", details: "Spring is ideal for planting in Erie. Choose species rated for Zone 6a and plant before summer heat stresses new root systems.", urgency: "recommended" },
      { task: "Mulch around tree bases", details: "Apply 2-4 inches of mulch in a ring around trees, keeping it 6 inches from the trunk. Mulch retains moisture and protects roots.", urgency: "recommended" },
    ],
    summer: [
      { task: "Water newly planted trees", details: "First-year trees need 1-2 inches of water per week during Erie's dry spells. Deep watering encourages deep root growth.", urgency: "essential" },
      { task: "Watch for signs of disease and pests", details: "Summer is when leaf diseases, boring insects, and other pests are most active. Early detection prevents spread.", urgency: "recommended" },
      { task: "Schedule fall tree removal", details: "If you have dead or hazardous trees, schedule removal for fall before Erie's dangerous winter storm season.", urgency: "recommended" },
      { task: "Avoid heavy pruning", details: "Major pruning in summer stresses trees. Limit summer work to removing dead wood and addressing safety hazards only.", urgency: "recommended" },
    ],
    fall: [
      { task: "Remove dead trees and branches", details: "This is your last opportunity to eliminate hazards before Erie's ice storm and heavy snow season. Dead trees are most dangerous in winter.", urgency: "essential" },
      { task: "Cable or brace weak trees", details: "Have an arborist install support cables on trees with weak branch unions or split trunks before winter wind and ice loads.", urgency: "essential" },
      { task: "Plant trees for spring growth", details: "Fall planting gives roots time to establish before winter dormancy. Choose hardy species suited to Erie's Zone 6a climate.", urgency: "recommended" },
      { task: "Protect young trees from deer", details: "Install trunk guards or deer fencing around young trees before winter when deer browse increases in Erie-area yards.", urgency: "recommended" },
    ],
    winter: [
      { task: "Inspect trees after ice storms", details: "After every significant Erie ice storm, inspect trees from a safe distance. Never stand under damaged trees. Call a professional for hanging branches.", urgency: "essential" },
      { task: "Do not shake ice off branches", details: "Frozen branches are brittle and will break if shaken. Let ice melt naturally unless a branch poses an immediate danger.", urgency: "essential" },
      { task: "Plan spring tree work", details: "Winter is ideal for evaluating your trees and planning removal, planting, or pruning projects for spring.", urgency: "optional" },
      { task: "Schedule dormant pruning", details: "Late winter (February-March) is the best time for major pruning of most tree species. Trees are dormant and branch structure is visible.", urgency: "recommended" },
    ],
  },

  "appliance-repair": {
    spring: [
      { task: "Clean refrigerator condenser coils", details: "Dust and pet hair accumulate on coils through winter. Dirty coils make the refrigerator work harder and use more energy.", urgency: "essential" },
      { task: "Clean dryer vent and duct", details: "After heavy winter use, lint buildup in the dryer vent is a fire hazard. Schedule professional cleaning or clean it yourself.", urgency: "essential" },
      { task: "Service the air conditioner", details: "Have your AC unit inspected and serviced before Erie's first heat wave. Clean filters, check refrigerant levels, and test performance.", urgency: "recommended" },
      { task: "Run a dishwasher cleaning cycle", details: "Use a dishwasher cleaner or vinegar cycle to remove hard water mineral buildup from Erie's water supply.", urgency: "recommended" },
    ],
    summer: [
      { task: "Check refrigerator temperature", details: "Ensure your fridge is at 37-40°F and freezer at 0°F. Warm Erie summer days make your refrigerator work harder.", urgency: "essential" },
      { task: "Clean washing machine", details: "Run a hot cleaning cycle with washing machine cleaner. Front-load washers are prone to mold and odor, especially in Erie's humid summers.", urgency: "recommended" },
      { task: "Inspect garbage disposal", details: "Clean and sharpen the disposal with ice cubes and citrus peels. Check for leaks at plumbing connections.", urgency: "optional" },
      { task: "Test smoke detectors on cooking appliances", details: "Ensure range hood fans and ventilation are working properly before fall and winter when indoor cooking increases.", urgency: "recommended" },
    ],
    fall: [
      { task: "Service your furnace", details: "Schedule a professional furnace inspection before Erie's heating season. Replace the filter and test all safety controls.", urgency: "essential" },
      { task: "Flush the water heater", details: "Drain and flush your water heater to remove sediment from Erie's hard water. This improves efficiency and extends tank life.", urgency: "essential" },
      { task: "Check dryer vent exhaust", details: "Ensure the outdoor dryer vent flap opens freely. Leaves, debris, and bird nests can block the exhaust.", urgency: "recommended" },
      { task: "Test oven accuracy", details: "Before holiday cooking season, verify your oven temperature matches the thermostat setting. An oven thermometer costs a few dollars.", urgency: "recommended" },
    ],
    winter: [
      { task: "Monitor water heater performance", details: "Heavy winter demand may reveal a failing water heater. Lukewarm water, strange noises, or rusty water are warning signs.", urgency: "essential" },
      { task: "Keep dryer vents clear of snow", details: "Check the exterior dryer vent regularly. Snow and ice can block the vent, creating a fire hazard and reducing dryer performance.", urgency: "essential" },
      { task: "Run dishwasher during off-peak hours", details: "Running the dishwasher during off-peak hours reduces energy costs during Erie's high winter heating bills.", urgency: "optional" },
      { task: "Check refrigerator door seals", details: "Cold drafts near the refrigerator can affect its thermostat readings. Ensure door seals are tight and the fridge is not working overtime.", urgency: "recommended" },
    ],
  },

  foundation: {
    spring: [
      { task: "Inspect foundation for new cracks", details: "After Erie's freeze-thaw season, check all foundation walls for new cracks, especially horizontal cracks that indicate lateral soil pressure.", urgency: "essential" },
      { task: "Test sump pump before snowmelt peak", details: "Pour water into the sump pit to verify the pump activates. Check the discharge line for blockages. Spring snowmelt is Erie's peak flooding season.", urgency: "essential" },
      { task: "Check basement for water intrusion", details: "Monitor basement walls and floor for dampness, stains, and efflorescence. Early detection prevents mold and structural damage.", urgency: "essential" },
      { task: "Clean gutters and extend downspouts", details: "Ensure all downspouts discharge at least 6 feet from the foundation. Spring rains and snowmelt overwhelm clogged gutters.", urgency: "essential" },
      { task: "Grade soil away from foundation", details: "Add soil along the foundation so the grade slopes away at 1 inch per foot. Settling from freeze-thaw can reverse proper grading.", urgency: "recommended" },
    ],
    summer: [
      { task: "Address foundation cracks", details: "Summer's dry weather is ideal for exterior foundation repairs, crack injection, and waterproofing. Schedule repairs before fall rains.", urgency: "recommended" },
      { task: "Install or upgrade drainage", details: "French drains, curtain drains, and grading improvements are best completed during dry summer months when the soil is workable.", urgency: "recommended" },
      { task: "Inspect crawl spaces", details: "Check crawl spaces for moisture, standing water, mold, and pest activity. Consider encapsulation if problems are recurring.", urgency: "recommended" },
      { task: "Verify sump pump battery backup", details: "Summer storms can cause power outages. Test your sump pump battery backup and replace batteries if older than 2-3 years.", urgency: "recommended" },
    ],
    fall: [
      { task: "Final foundation inspection before winter", details: "This is your last chance to repair cracks and seal the foundation before Erie's freeze-thaw cycles begin in earnest.", urgency: "essential" },
      { task: "Clean and inspect sump pump", details: "Clean the pump, pit, and check valve. Verify the discharge line is clear and directed away from the foundation.", urgency: "essential" },
      { task: "Insulate exposed pipes in the basement", details: "Pipes near exterior walls and in crawl spaces need insulation before Erie's first freeze to prevent bursting.", urgency: "essential" },
      { task: "Seal basement windows and vents", details: "Close and seal basement windows and foundation vents. Install window well covers to keep out rain, snow, and debris.", urgency: "recommended" },
    ],
    winter: [
      { task: "Monitor for water intrusion during thaws", details: "Mid-winter thaws can cause sudden basement flooding as frozen ground prevents proper drainage. Check the basement frequently during warm spells.", urgency: "essential" },
      { task: "Keep sump pump discharge line clear", details: "The discharge line can freeze in Erie's sub-zero cold. Ensure the line drains to an area that will not freeze and back up.", urgency: "essential" },
      { task: "Watch for foundation wall movement", details: "Heavy snow loads and frozen soil put maximum pressure on foundation walls in winter. New cracks or increased bowing require immediate attention.", urgency: "recommended" },
      { task: "Maintain heat in the basement", details: "Keep the basement above 50°F to prevent pipes from freezing and to keep the foundation walls from experiencing extreme temperature stress.", urgency: "recommended" },
    ],
  },

  "home-security": {
    spring: [
      { task: "Test all sensors and batteries", details: "After winter, test every door sensor, motion detector, and window sensor. Replace batteries in wireless devices that are low.", urgency: "essential" },
      { task: "Update system firmware", details: "Check for and install firmware updates on your control panel, cameras, and smart devices. Updates patch security vulnerabilities.", urgency: "essential" },
      { task: "Clean outdoor cameras", details: "Remove winter grime, cobwebs, and mineral deposits from camera lenses. Verify night vision is working properly.", urgency: "recommended" },
      { task: "Adjust camera angles", details: "Spring landscaping growth may obstruct camera views. Reposition cameras for clear sightlines as trees and shrubs leaf out.", urgency: "recommended" },
    ],
    summer: [
      { task: "Set vacation mode before travel", details: "Program lights, simulate occupancy, and enable push notifications. Inform your monitoring company of your travel dates.", urgency: "essential" },
      { task: "Check smart lock batteries", details: "Summer heat and increased usage can drain smart lock batteries faster. Replace or recharge before a lockout.", urgency: "recommended" },
      { task: "Evaluate outdoor lighting", details: "Longer days reveal dark spots in your exterior lighting. Motion-activated lights deter intruders and improve camera footage quality.", urgency: "recommended" },
      { task: "Test video doorbell performance", details: "Verify the doorbell camera captures clear video, sends timely notifications, and the two-way audio works properly.", urgency: "optional" },
    ],
    fall: [
      { task: "Test battery backup before storm season", details: "Verify your security system's battery backup holds charge for at least 4 hours. Erie's winter storms cause extended outages.", urgency: "essential" },
      { task: "Verify cellular connectivity", details: "Ensure your system's cellular backup communicates with the monitoring center. This is your lifeline during power and internet outages.", urgency: "essential" },
      { task: "Update emergency contact information", details: "Review and update the contacts your monitoring company will call in an emergency. Remove outdated numbers.", urgency: "recommended" },
      { task: "Secure entry points", details: "Check all door and window locks. Ensure sliding door security bars are in place. Review garage door security before winter.", urgency: "recommended" },
    ],
    winter: [
      { task: "Keep camera lenses clear", details: "After snowfall, brush snow off outdoor cameras. Heated camera models prevent ice buildup, but manual clearing may still be needed.", urgency: "essential" },
      { task: "Monitor for freeze-related false alarms", details: "Extreme cold can trigger motion sensors and door sensors. Adjust sensitivity settings if false alarms increase during cold snaps.", urgency: "recommended" },
      { task: "Ensure outdoor sensors are unobstructed", details: "Snow drifts can block motion sensors and cover camera fields of view. Clear snow from sensor areas after storms.", urgency: "recommended" },
      { task: "Review system during holiday travel", details: "Before holiday trips, verify all system components are online. Set up real-time notifications for all alerts.", urgency: "essential" },
    ],
  },

  concrete: {
    spring: [
      { task: "Inspect all concrete for winter damage", details: "Walk every concrete surface looking for new cracks, spalling, heaving, and salt damage. Erie's freeze-thaw cycles cause more concrete damage than almost any other climate factor.", urgency: "essential" },
      { task: "Schedule repairs early", details: "Concrete contractors fill up quickly in spring. Book repair and replacement projects before the rush. Wait for temperatures to stay above 50°F.", urgency: "essential" },
      { task: "Sweep and clean concrete surfaces", details: "Remove winter sand, salt residue, and debris. Salt left on concrete accelerates surface deterioration.", urgency: "recommended" },
      { task: "Evaluate if repair or replacement is needed", details: "Have a professional assess the damage. Minor cracks can be patched, but extensive spalling or heaving may require full replacement.", urgency: "recommended" },
    ],
    summer: [
      { task: "Pour new concrete", details: "Summer provides the best conditions for new concrete work in Erie. Warm temperatures allow proper curing. Schedule pours early in the day to avoid mid-day heat.", urgency: "recommended" },
      { task: "Apply concrete sealer", details: "New concrete should be sealed after 28 days of curing. Existing concrete should be sealed every 2-3 years. Use a penetrating sealer for best freeze-thaw protection.", urgency: "essential" },
      { task: "Address drainage issues", details: "While the ground is dry, fix any areas where water pools on or near concrete. Proper drainage prevents freeze-thaw damage next winter.", urgency: "recommended" },
      { task: "Stain or color concrete", details: "Summer's stable temperatures and dry weather are ideal for decorative concrete finishes like staining, stamping, and coloring.", urgency: "optional" },
    ],
    fall: [
      { task: "Apply sealer before first freeze", details: "If you haven't sealed your concrete this year, do it now. Concrete must be sealed before Erie's first freeze for maximum winter protection.", urgency: "essential" },
      { task: "Complete all repairs before winter", details: "Patches and crack repairs must cure fully before freezing temperatures. In Erie, that means finishing all repair work by mid-October.", urgency: "essential" },
      { task: "Clean and store outdoor concrete furniture", details: "Bring in or cover concrete benches, planters, and decorative items. Even sealed concrete items can crack from extreme freeze-thaw exposure.", urgency: "recommended" },
      { task: "Stock safe deicers", details: "Purchase calcium chloride or sand for winter deicing. Avoid rock salt (sodium chloride) and ammonium-based deicers, which damage concrete surfaces.", urgency: "recommended" },
    ],
    winter: [
      { task: "Use safe deicing products only", details: "Use calcium chloride or sand on concrete surfaces. Sodium chloride (rock salt) and ammonium-based deicers cause severe surface spalling. Never use on concrete less than 1 year old.", urgency: "essential" },
      { task: "Remove snow promptly", details: "Clear snow before it melts and refreezes on the concrete surface. Repeated melt-freeze cycles accelerate damage even on sealed concrete.", urgency: "recommended" },
      { task: "Avoid using metal tools on concrete", details: "Use plastic shovels and rubber-bladed snow blowers on concrete. Metal edges chip and scratch the surface, creating entry points for water.", urgency: "recommended" },
      { task: "Document damage for spring repair", details: "Photograph new cracks, spalling, and heaving through the winter. This helps your contractor assess the full scope of damage in spring.", urgency: "optional" },
    ],
  },

  septic: {
    spring: [
      { task: "Schedule pumping before spring rains", details: "Erie's spring snowmelt and rain raise the water table and stress septic systems. Pumping before peak moisture reduces the risk of failure.", urgency: "essential" },
      { task: "Inspect the drain field", details: "Walk over the drain field looking for soggy areas, standing water, or unusually green patches that indicate the field is not absorbing effluent properly.", urgency: "essential" },
      { task: "Check septic tank access", details: "Locate and verify that tank lids and risers are intact and accessible. Ground settling and frost heave can shift lids out of position.", urgency: "recommended" },
      { task: "Reduce water usage during wet periods", details: "Spread laundry loads over the week and fix any dripping faucets. High water input during saturated soil conditions overwhelms the drain field.", urgency: "recommended" },
    ],
    summer: [
      { task: "Conserve water", details: "Summer gatherings and increased water use stress the septic system. Spread laundry, run full dishwasher loads, and fix leaks promptly.", urgency: "recommended" },
      { task: "Protect the drain field", details: "Do not drive, park, or place heavy items over the drain field. Do not plant trees within 25 feet of the field — roots can damage pipes.", urgency: "essential" },
      { task: "Inspect for odors", details: "Sewage smells near the tank or drain field indicate a problem. Hot summer temperatures make odors more noticeable. Call a professional if odors persist.", urgency: "recommended" },
      { task: "Schedule an inspection if overdue", details: "If your septic system has not been inspected in 3+ years, summer's dry conditions are ideal for a thorough evaluation.", urgency: "recommended" },
    ],
    fall: [
      { task: "Pump the tank if due", details: "Fall pumping before the ground freezes is ideal. Pumping every 3-5 years prevents solids from reaching and clogging the drain field.", urgency: "essential" },
      { task: "Inspect and clean the effluent filter", details: "If your septic tank has an effluent filter, clean it during fall pumping. A clogged filter causes backups into the house.", urgency: "essential" },
      { task: "Insulate exposed septic components", details: "In Erie, exposed pipes and risers can freeze. Insulate them before winter to prevent freezing and cracking.", urgency: "recommended" },
      { task: "Direct roof runoff away from the drain field", details: "Ensure gutters and downspouts discharge away from the drain field area. Excess water saturates the field and reduces treatment capacity.", urgency: "recommended" },
    ],
    winter: [
      { task: "Maintain snow cover over the drain field", details: "Snow acts as natural insulation. Do not plow or shovel snow off the drain field area. Walking paths through the field are fine.", urgency: "essential" },
      { task: "Use water regularly", details: "Regular water flow keeps the system active and prevents freezing in pipes. If the house will be vacant, consider having the system winterized.", urgency: "essential" },
      { task: "Never drive on the drain field", details: "Frozen ground may seem solid, but vehicle weight compresses soil and crushes drain field pipes. Damage may not appear until spring.", urgency: "essential" },
      { task: "Watch for signs of freezing", details: "Slow drains, gurgling sounds, and sewage odors in winter may indicate frozen pipes or a frozen septic tank. Call a professional immediately.", urgency: "recommended" },
    ],
  },

  chimney: {
    spring: [
      { task: "Inspect chimney exterior", details: "Check the chimney for freeze-thaw damage: crumbling mortar joints, cracked crown, damaged flashing, and missing chimney cap. Erie's winters take a heavy toll.", urgency: "essential" },
      { task: "Schedule masonry repairs", details: "Spring is ideal for tuckpointing, crown repair, and flashing replacement. Address damage before spring rains cause further deterioration.", urgency: "essential" },
      { task: "Open the damper and inspect the firebox", details: "Look for cracked fire brick, debris, animal nests, and signs of water damage in the firebox and smoke shelf.", urgency: "recommended" },
      { task: "Apply chimney waterproofing", details: "After masonry repairs, apply a breathable waterproof sealant to protect against Erie's rainy spring and summer months.", urgency: "recommended" },
    ],
    summer: [
      { task: "Schedule chimney relining", details: "If your flue liner is cracked or deteriorating, summer is the ideal time for relining. The fireplace is not in use and contractors are less busy.", urgency: "recommended" },
      { task: "Complete major masonry work", details: "Chimney rebuilds, new caps, and crown replacements are best completed in summer when weather allows mortar to cure properly.", urgency: "recommended" },
      { task: "Address persistent fireplace odors", details: "Summer humidity can amplify creosote odors from the chimney. A thorough cleaning and a chimney deodorizer eliminate the problem.", urgency: "optional" },
      { task: "Install or replace the chimney cap", details: "A chimney cap prevents rain, snow, animals, and debris from entering the flue. An inexpensive investment that prevents costly damage.", urgency: "recommended" },
    ],
    fall: [
      { task: "Schedule chimney cleaning and inspection", details: "The most important chimney maintenance task. Have a CSIA-certified sweep clean and inspect your chimney before the first fire of the season.", urgency: "essential" },
      { task: "Test the damper operation", details: "Open and close the damper to verify it moves freely and seals tightly. A stuck or warped damper wastes heat during Erie's winter.", urgency: "essential" },
      { task: "Stock seasoned firewood", details: "Burn only seasoned hardwood (dried at least 6-12 months). Green or softwood creates excessive creosote that causes chimney fires.", urgency: "recommended" },
      { task: "Check carbon monoxide detectors", details: "Verify all CO detectors near the fireplace and on sleeping levels are working. PA law requires CO detectors in homes with fuel-burning appliances.", urgency: "essential" },
    ],
    winter: [
      { task: "Burn seasoned hardwood only", details: "Oak, maple, and ash produce less creosote than pine or unseasoned wood. Excessive creosote buildup during heavy use months is a fire hazard.", urgency: "essential" },
      { task: "Check for creosote buildup monthly", details: "If you use your fireplace several times a week, check the flue monthly. More than 1/4 inch of creosote requires immediate cleaning.", urgency: "essential" },
      { task: "Monitor for chimney fire signs", details: "A loud roaring sound, dense smoke, or intense heat from the chimney wall indicates a chimney fire. Close the damper, evacuate, and call 911.", urgency: "essential" },
      { task: "Keep the chimney cap clear", details: "After heavy snowfall, verify the chimney cap is not blocked by snow or ice. A blocked flue can cause deadly carbon monoxide buildup indoors.", urgency: "essential" },
    ],
  },
};

export function getSeasonalGuide(slug: string): SeasonalGuide | undefined {
  return SEASONAL_DATA[slug];
}
