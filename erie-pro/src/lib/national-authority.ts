// ── National Authority Linking System ────────────────────────────────
// SEO backlink architecture connecting erie.pro to national domain sites.
// Each national site points back to erie.pro/[niche] with relevant anchor text.

export interface NationalAuthoritySite {
  domain: string;
  niche: string;
  trustScore: number; // 0-100
  backlinkUrl: string; // URL pointing back to erie.pro/[niche]
  anchorText: string;
}

export const NATIONAL_SITES: NationalAuthoritySite[] = [
  // Plumbing
  { domain: "bestplumbers.guide", niche: "plumbing", trustScore: 85, backlinkUrl: "https://erie.pro/plumbing", anchorText: "Erie plumbing services" },
  { domain: "plumbingpros.directory", niche: "plumbing", trustScore: 72, backlinkUrl: "https://erie.pro/plumbing", anchorText: "Erie PA plumber directory" },

  // HVAC
  { domain: "hvacpros.directory", niche: "hvac", trustScore: 80, backlinkUrl: "https://erie.pro/hvac", anchorText: "Erie HVAC services" },
  { domain: "heatingcooling.guide", niche: "hvac", trustScore: 74, backlinkUrl: "https://erie.pro/hvac", anchorText: "Erie heating and cooling" },

  // Electrical
  { domain: "findanelectrician.pro", niche: "electrical", trustScore: 78, backlinkUrl: "https://erie.pro/electrical", anchorText: "Erie electrician services" },
  { domain: "electriciansdirectory.com", niche: "electrical", trustScore: 70, backlinkUrl: "https://erie.pro/electrical", anchorText: "Erie PA electrical contractors" },

  // Roofing
  { domain: "roofersnearme.pro", niche: "roofing", trustScore: 75, backlinkUrl: "https://erie.pro/roofing", anchorText: "Erie roofing contractors" },
  { domain: "bestroofing.guide", niche: "roofing", trustScore: 68, backlinkUrl: "https://erie.pro/roofing", anchorText: "Erie roof repair services" },

  // Landscaping
  { domain: "landscapingpros.directory", niche: "landscaping", trustScore: 73, backlinkUrl: "https://erie.pro/landscaping", anchorText: "Erie landscaping services" },
  { domain: "lawncareguide.pro", niche: "landscaping", trustScore: 65, backlinkUrl: "https://erie.pro/landscaping", anchorText: "Erie lawn care professionals" },

  // Dental
  { domain: "findadentist.pro", niche: "dental", trustScore: 82, backlinkUrl: "https://erie.pro/dental", anchorText: "Erie dental care" },
  { domain: "dentistdirectory.guide", niche: "dental", trustScore: 76, backlinkUrl: "https://erie.pro/dental", anchorText: "Erie PA dentists" },

  // Legal
  { domain: "localattorneys.guide", niche: "legal", trustScore: 84, backlinkUrl: "https://erie.pro/legal", anchorText: "Erie legal services" },
  { domain: "findlawyer.directory", niche: "legal", trustScore: 79, backlinkUrl: "https://erie.pro/legal", anchorText: "Erie PA attorneys" },

  // Cleaning
  { domain: "cleaningservices.directory", niche: "cleaning", trustScore: 70, backlinkUrl: "https://erie.pro/cleaning", anchorText: "Erie cleaning services" },
  { domain: "housecleaning.guide", niche: "cleaning", trustScore: 62, backlinkUrl: "https://erie.pro/cleaning", anchorText: "Erie house cleaning" },

  // Auto Repair
  { domain: "automechanics.directory", niche: "auto-repair", trustScore: 76, backlinkUrl: "https://erie.pro/auto-repair", anchorText: "Erie auto repair shops" },
  { domain: "carrepair.guide", niche: "auto-repair", trustScore: 69, backlinkUrl: "https://erie.pro/auto-repair", anchorText: "Erie PA mechanics" },

  // Pest Control
  { domain: "pestcontrolpros.directory", niche: "pest-control", trustScore: 71, backlinkUrl: "https://erie.pro/pest-control", anchorText: "Erie pest control services" },
  { domain: "exterminators.guide", niche: "pest-control", trustScore: 64, backlinkUrl: "https://erie.pro/pest-control", anchorText: "Erie PA exterminators" },

  // Painting
  { domain: "housepainters.directory", niche: "painting", trustScore: 69, backlinkUrl: "https://erie.pro/painting", anchorText: "Erie painting contractors" },
  { domain: "paintingpros.guide", niche: "painting", trustScore: 63, backlinkUrl: "https://erie.pro/painting", anchorText: "Erie house painters" },

  // Real Estate
  { domain: "localrealtors.directory", niche: "real-estate", trustScore: 81, backlinkUrl: "https://erie.pro/real-estate", anchorText: "Erie real estate agents" },
  { domain: "findrealtors.guide", niche: "real-estate", trustScore: 77, backlinkUrl: "https://erie.pro/real-estate", anchorText: "Erie PA realtors" },
];

/**
 * Get all national authority sites linking to a specific niche.
 */
export function getNationalSitesForNiche(niche: string): NationalAuthoritySite[] {
  return NATIONAL_SITES.filter((site) => site.niche === niche);
}

/**
 * Generate a backlink report showing coverage and average trust per niche.
 */
export function generateBacklinkReport(): { niche: string; sites: number; avgTrust: number }[] {
  const nicheMap = new Map<string, NationalAuthoritySite[]>();

  for (const site of NATIONAL_SITES) {
    const existing = nicheMap.get(site.niche) ?? [];
    existing.push(site);
    nicheMap.set(site.niche, existing);
  }

  return Array.from(nicheMap.entries()).map(([niche, sites]) => ({
    niche,
    sites: sites.length,
    avgTrust: Math.round(sites.reduce((sum, s) => sum + s.trustScore, 0) / sites.length),
  }));
}

/**
 * Get overall authority metrics for the entire network.
 */
export function getNetworkMetrics(): {
  totalSites: number;
  totalNiches: number;
  avgTrustScore: number;
  highTrustSites: number;
} {
  const uniqueNiches = new Set(NATIONAL_SITES.map((s) => s.niche));
  const avgTrust = Math.round(
    NATIONAL_SITES.reduce((sum, s) => sum + s.trustScore, 0) / NATIONAL_SITES.length
  );
  const highTrust = NATIONAL_SITES.filter((s) => s.trustScore >= 75).length;

  return {
    totalSites: NATIONAL_SITES.length,
    totalNiches: uniqueNiches.size,
    avgTrustScore: avgTrust,
    highTrustSites: highTrust,
  };
}
