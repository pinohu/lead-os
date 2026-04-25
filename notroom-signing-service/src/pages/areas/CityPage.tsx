import { useParams, Navigate } from "react-router-dom"
import CommunityPage from "@/components/CommunityPage"
import { communityData } from "@/data/communityData"

const slugToKey: Record<string, string> = {
  "erie-pa": "erie",
  "millcreek-pa": "millcreek",
  "harborcreek-pa": "harborcreek",
  "fairview-pa": "fairview",
  "north-east-pa": "northEast",
  "edinboro-pa": "edinboro",
  "wesleyville-pa": "wesleyville",
  "girard-pa": "girard",
  "waterford-pa": "waterford",
  "meadville-pa": "meadville",
  "warren-pa": "warren",
  "north-warren-pa": "northWarren",
  "youngsville-pa": "youngsville",
  "bear-lake-pa": "bearLake",
  "russell-pa": "russell",
  "tidioute-pa": "tidioute",
  "sugar-grove-pa": "sugarGrove",
  "sheffield-pa": "sheffield",
  "clarendon-pa": "clarendon",
  "kinzua-pa": "kinzua",
  "spring-creek-pa": "springCreek",
  "sharon-pa": "sharon",
  "hermitage-pa": "hermitage",
  "grove-city-pa": "groveCity",
  "greenville-pa": "greenville",
  "mercer-pa": "mercer",
  "farrell-pa": "farrell",
  "sharpsville-pa": "sharpsville",
  "clark-pa": "clark",
  "stoneboro-pa": "stoneboro",
  "sandy-lake-pa": "sandyLake",
  "oil-city-pa": "oilCity",
  "franklin-pa": "franklin",
  "titusville-pa": "titusville",
  "sugarcreek-pa": "sugarcreek",
  "rouseville-pa": "rouseville",
  "pleasantville-pa": "pleasantville",
  "emlenton-pa": "emlenton",
  "clintonville-pa": "clintonville",
  "polk-pa": "polk",
  "utica-pa": "utica",
  "hydetown-pa": "hydetown",
  "cooperstown-pa": "cooperstown",
  "venango-pa": "venangoCrawford",
  "cambridge-springs-pa": "cambridgeSprings",
  "saegertown-pa": "saegertown",
  "linesville-pa": "linesville",
  "conneaut-lake-pa": "conneautLake",
  "conneautville-pa": "conneautville",
  "cochranton-pa": "cochranton",
  "harmonsburg-pa": "harmonsburg",
  "spartansburg-pa": "spartansburg",
  "blooming-valley-pa": "bloomingValley",
  "townville-pa": "townville",
  "riceville-pa": "riceville",
  "guys-mills-pa": "guysMills",
  "corry-pa": "corry",
  "albion-pa": "albion",
  "mckean-pa": "mckean",
  "cranberry-township-pa": "cranberryTownship",
  "lake-city-pa": "lakeCity",
  "wattsburg-pa": "wattsburg",
  "union-city-pa": "unionCity",
  "lawrence-park-pa": "lawrencePark",
  "pittsfield-pa": "pittsfield",
  "irvine-pa": "irvine",
  "chandlers-valley-pa": "chandlersValley",
}

export const validCitySlugs = Object.keys(slugToKey)

function CityPage() {
  const { citySlug } = useParams<{ citySlug: string }>()

  if (!citySlug) return <Navigate to="/areas/erie-county" replace />

  const dataKey = slugToKey[citySlug]
  if (!dataKey) return <Navigate to="/areas/erie-county" replace />

  const community = communityData[dataKey]
  if (!community) return <Navigate to="/areas/erie-county" replace />

  return <CommunityPage community={community} />
}

export default CityPage
