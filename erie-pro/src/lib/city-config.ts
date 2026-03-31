export interface CityConfig {
  slug: string;
  name: string;
  state: string;
  stateCode: string;
  domain: string;
  population: number;
  coordinates: { lat: number; lng: number };
  serviceArea: string[];
  tagline: string;
}

export const cityConfig: CityConfig = {
  slug: "erie",
  name: "Erie",
  state: "Pennsylvania",
  stateCode: "PA",
  domain: "erie.pro",
  population: 95000,
  coordinates: { lat: 42.1292, lng: -80.0851 },
  serviceArea: ["Erie", "Millcreek", "Harborcreek", "Fairview", "Summit Township", "McKean", "Edinboro", "Waterford", "North East", "Girard"],
  tagline: "Erie's local business directory powered by AI",
};
