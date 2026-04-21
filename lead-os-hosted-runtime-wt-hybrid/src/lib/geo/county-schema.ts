export type CountyProfile = {
  id: string;
  name: string;
  state: string;
  populationBand?: "low" | "medium" | "high";
  majorCities: string[];
  seasonality?: string[];
  regulatoryNotes?: string[];
  monetizationPriority?: "high" | "medium" | "low";
  affiliateAllowed?: boolean;
};

export function createCountyId(name: string, state: string) {
  return `${name.toLowerCase().replace(/\s+/g, "-")}-${state.toLowerCase()}`;
}
