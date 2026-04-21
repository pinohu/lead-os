import { CountyProfile } from "./county-schema";

export function generateNodesForCounty(county: CountyProfile, niches: string[]) {
  const nodes = [];

  for (const niche of niches) {
    nodes.push({
      id: `${county.id}-${niche}`,
      county: county.name,
      state: county.state,
      niche,
      type: "county_hub",
    });

    for (const city of county.majorCities) {
      nodes.push({
        id: `${county.id}-${city.toLowerCase()}-${niche}`,
        county: county.name,
        city,
        state: county.state,
        niche,
        type: "city_node",
      });
    }
  }

  return nodes;
}
