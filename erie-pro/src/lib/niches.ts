export interface LocalNiche {
  slug: string;
  label: string;
  icon: string; // emoji
  description: string;
  searchTerms: string[];
  avgProjectValue: string;
  monthlyFee: number;
  exclusiveAvailable: boolean;
  subscriberSlug: string | null; // null = no exclusive subscriber yet
  subscriberName: string | null;
}

export const niches: LocalNiche[] = [
  { slug: "plumbing", label: "Plumbing", icon: "\uD83D\uDD27", description: "Emergency repairs, installations, drain cleaning, and water heater services", searchTerms: ["plumber", "plumbing", "drain", "water heater", "pipe repair"], avgProjectValue: "$150-$5,000", monthlyFee: 500, exclusiveAvailable: true, subscriberSlug: null, subscriberName: null },
  { slug: "hvac", label: "HVAC", icon: "\u2744\uFE0F", description: "Heating, cooling, ventilation, and air quality services", searchTerms: ["hvac", "heating", "cooling", "air conditioning", "furnace"], avgProjectValue: "$200-$10,000", monthlyFee: 500, exclusiveAvailable: true, subscriberSlug: null, subscriberName: null },
  { slug: "electrical", label: "Electrical", icon: "\u26A1", description: "Wiring, panel upgrades, lighting, and electrical repairs", searchTerms: ["electrician", "electrical", "wiring", "panel upgrade"], avgProjectValue: "$150-$8,000", monthlyFee: 500, exclusiveAvailable: true, subscriberSlug: null, subscriberName: null },
  { slug: "roofing", label: "Roofing", icon: "\uD83C\uDFE0", description: "Roof repair, replacement, gutters, and storm damage restoration", searchTerms: ["roofer", "roofing", "roof repair", "gutters"], avgProjectValue: "$500-$15,000", monthlyFee: 400, exclusiveAvailable: true, subscriberSlug: null, subscriberName: null },
  { slug: "landscaping", label: "Landscaping", icon: "\uD83C\uDF3F", description: "Lawn care, landscape design, hardscaping, and seasonal maintenance", searchTerms: ["landscaper", "landscaping", "lawn care", "hardscape"], avgProjectValue: "$100-$5,000", monthlyFee: 400, exclusiveAvailable: true, subscriberSlug: null, subscriberName: null },
  { slug: "dental", label: "Dental", icon: "\uD83E\uDDB7", description: "General dentistry, cosmetic procedures, orthodontics, and oral surgery", searchTerms: ["dentist", "dental", "orthodontist", "oral surgeon"], avgProjectValue: "$200-$5,000", monthlyFee: 800, exclusiveAvailable: true, subscriberSlug: null, subscriberName: null },
  { slug: "legal", label: "Legal", icon: "\u2696\uFE0F", description: "Personal injury, family law, criminal defense, estate planning, and immigration", searchTerms: ["lawyer", "attorney", "law firm", "legal"], avgProjectValue: "$500-$25,000", monthlyFee: 1000, exclusiveAvailable: true, subscriberSlug: null, subscriberName: null },
  { slug: "cleaning", label: "Cleaning", icon: "\u2728", description: "House cleaning, commercial cleaning, and deep cleaning services", searchTerms: ["cleaning", "maid service", "house cleaning", "janitorial"], avgProjectValue: "$100-$500", monthlyFee: 300, exclusiveAvailable: true, subscriberSlug: null, subscriberName: null },
  { slug: "auto-repair", label: "Auto Repair", icon: "\uD83D\uDE97", description: "Mechanical repair, body work, oil changes, and diagnostics", searchTerms: ["auto repair", "mechanic", "car repair", "body shop"], avgProjectValue: "$100-$5,000", monthlyFee: 400, exclusiveAvailable: true, subscriberSlug: null, subscriberName: null },
  { slug: "pest-control", label: "Pest Control", icon: "\uD83D\uDC1B", description: "Insect control, rodent removal, termite treatment, and prevention", searchTerms: ["pest control", "exterminator", "termite", "rodent"], avgProjectValue: "$100-$2,000", monthlyFee: 350, exclusiveAvailable: true, subscriberSlug: null, subscriberName: null },
  { slug: "painting", label: "Painting", icon: "\uD83C\uDFA8", description: "Interior and exterior painting, staining, and wallpaper", searchTerms: ["painter", "painting", "house painting", "commercial painting"], avgProjectValue: "$500-$10,000", monthlyFee: 350, exclusiveAvailable: true, subscriberSlug: null, subscriberName: null },
  { slug: "real-estate", label: "Real Estate", icon: "\uD83C\uDFE1", description: "Buyer and seller representation, property management, and appraisals", searchTerms: ["realtor", "real estate", "property", "homes for sale"], avgProjectValue: "$3,000-$15,000", monthlyFee: 600, exclusiveAvailable: true, subscriberSlug: null, subscriberName: null },
];

export function getNicheBySlug(slug: string): LocalNiche | undefined {
  return niches.find(n => n.slug === slug);
}
