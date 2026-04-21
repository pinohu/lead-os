import { CountyProfile } from "./county-schema";

export function resolveNode(params: {
  state: string;
  county: string;
  city: string;
  niche: string;
}) {
  return {
    id: `${params.county}-${params.city}-${params.niche}`,
    state: params.state,
    county: params.county,
    city: params.city,
    niche: params.niche,
    pageType: "directory",
  };
}
