import { tenantConfig } from "./tenant.ts";

const NICHE_ACCENTS: Record<string, string> = {
  legal: "#14213d", health: "#2a9d8f", tech: "#00d4aa",
  construction: "#e76f51", "real-estate": "#c4632d", education: "#457b9d",
  finance: "#415a77", franchise: "#d62828", staffing: "#0077b6",
  faith: "#7b2d8e", creative: "#e63946", "home-services": "#e76f51",
  coaching: "#264653", fitness: "#e63946", ecommerce: "#00d4aa",
  general: "#c4632d",
};

export function buildOgImageUrl(title: string, subtitle: string, niche = "general"): string {
  const base = tenantConfig.siteUrl || "https://leadgen-os.com";
  const accent = NICHE_ACCENTS[niche] ?? "#c4632d";
  const params = new URLSearchParams({ title, subtitle, niche, accent });
  return `${base}/api/og?${params.toString()}`;
}
