// Community-specific data for SEO optimization and localized content
export interface CommunityData {
  name: string;
  slug: string;
  county: string;
  zipCodes: string[];
  nearbyComm: string[];
  landmarks: string[];
  description: string;
  population?: string;
  uniqueTrait: string;
  historicalNarrative?: string;
  favoriteThings?: string[];
  imagePrompt?: string;
}

export const communityData: Record<string, CommunityData> = {
  // Erie County Communities
  erie: {
    name: "Erie",
    slug: "erie",
    county: "Erie County",
    zipCodes: ["16501", "16502", "16503", "16504", "16505", "16506", "16507", "16508", "16509", "16510", "16511", "16512", "16514", "16515", "16522", "16530", "16531", "16534", "16538", "16544", "16546", "16550", "16553", "16563"],
    nearbyComm: ["Millcreek", "Harborcreek", "Wesleyville", "Lawrence Park", "Fairview"],
    landmarks: ["Presque Isle State Park", "Erie Maritime Museum", "Bayfront Convention Center", "UPMC Park", "Waldameer Park", "Erie Insurance Arena", "Blasco Library", "Downtown Erie"],
    description: "Pennsylvania's fourth-largest city and the Gem City of the Great Lakes, Erie is a vibrant waterfront community with rich history and modern amenities",
    population: "~95,000",
    uniqueTrait: "Home to Presque Isle State Park, one of PA's most visited attractions, and Lake Erie's stunning waterfront with beaches, marinas, and year-round activities",
    historicalNarrative: "Founded in 1795, Erie played a crucial role in the War of 1812 when Commodore Oliver Hazard Perry built his fleet here and defeated the British at the Battle of Lake Erie. The city's strategic location on Lake Erie made it a vital shipping hub during the canal era and later a manufacturing powerhouse. Today, Erie preserves its maritime heritage while embracing its role as northwestern Pennsylvania's cultural and economic center.",
    favoriteThings: [
      "Watching sunset over Lake Erie from Presque Isle State Park's beaches",
      "Summer concerts and festivals at Liberty Park on the bayfront",
      "Fresh perch and walleye at local waterfront restaurants",
      "Historic Perry's Monument and Maritime Museum",
      "Waldameer's iconic Ravine Flyer II wooden roller coaster",
      "Ice skating and hockey games at Erie Insurance Arena"
    ],
    imagePrompt: "Exact photorealistic view of Presque Isle State Park's Beach 6 at sunset with the distinctive Presque Isle Lighthouse (1872) visible, families walking the Sidewalk Trail, sailboats anchored at Presque Isle Bay, Perry Monument across the water, wooden boardwalk, actual sand dunes with beach grass. Iconic Erie scene residents recognize instantly."
  },
  millcreek: {
    name: "Millcreek",
    slug: "millcreek",
    county: "Erie County",
    zipCodes: ["16509", "16565"],
    nearbyComm: ["Erie", "Fairview", "Edinboro", "Girard", "Lake City"],
    landmarks: ["Millcreek Mall Complex", "Splash Lagoon Indoor Waterpark", "LECOM Institute", "Asbury Woods Nature Center", "I-79 Commercial District", "Millcreek Township Building"],
    description: "Erie County's largest and most populous township, featuring major commercial centers, family entertainment, healthcare facilities, and excellent schools",
    population: "~55,000",
    uniqueTrait: "Pennsylvania's largest township by population, home to Millcreek Mall (one of PA's largest shopping centers), Splash Lagoon waterpark resort, and thriving business community",
    historicalNarrative: "Originally settled in the early 1800s as farming communities, Millcreek transformed dramatically in the post-WWII era as Erie's suburbs expanded southward. The opening of Millcreek Mall in 1975 marked the township's evolution into Erie County's commercial hub. Today, Millcreek balances its residential character with modern amenities, maintaining green spaces like Asbury Woods while serving as the region's shopping and healthcare center.",
    favoriteThings: [
      "Year-round fun at Splash Lagoon Indoor Waterpark",
      "Shopping and dining at Millcreek Mall Complex",
      "Nature trails and wildlife at Asbury Woods Nature Center",
      "Community events at Millcreek Township parks",
      "Excellent schools in the Millcreek Township School District",
      "Convenient access to every amenity you need"
    ],
    imagePrompt: "Exact photorealistic view of Asbury Woods Nature Center's Brown's Farm entrance and the distinctive elevated boardwalk over Anna's Pond wetlands in autumn, families on wooden walkway, interpretive signs, pawpaw trees with fall colors, Asbury Woods environmental education building visible, Walnut Creek watershed area. Recognizable Millcreek landmark."
  },
  harborcreek: {
    name: "Harborcreek",
    slug: "harborcreek",
    county: "Erie County",
    zipCodes: ["16421", "16510"],
    nearbyComm: ["Erie", "North East", "Wesleyville", "Lawrence Park"],
    landmarks: ["Woodlands Golf Course", "Lake Erie Coastline", "Harborcreek Township Park", "Route 5 (Lake Road)", "Harborcreek Youth Services", "Harborcreek School District"],
    description: "Premier lakeside township in eastern Erie County offering beautiful Lake Erie views, top-rated schools, and quiet residential neighborhoods",
    population: "~15,000",
    uniqueTrait: "Boasts scenic Lake Erie shoreline, award-winning Harborcreek School District consistently ranked among PA's best, and peaceful suburban living with easy access to Erie",
    historicalNarrative: "Harborcreek's history stretches to 1795 when Pennsylvania's General Assembly created the township. Originally an agricultural community, it gradually transformed into one of Erie County's most desirable residential areas. The township's commitment to education excellence made Harborcreek School District one of Pennsylvania's top-ranked systems, attracting families seeking quality schools and lakefront living.",
    favoriteThings: [
      "Morning walks along Lake Erie's peaceful shoreline",
      "Top-ranked Harborcreek School District academics and sports",
      "Golfing at scenic Woodlands Golf Course",
      "Community events at Harborcreek Township Park",
      "Safe, family-friendly neighborhoods",
      "Beautiful sunrises over Lake Erie"
    ],
    imagePrompt: "Exact photorealistic sunrise view along Route 5 (Lake Road) in Harborcreek Township showing actual lakefront homes, Lake Erie's rocky shoreline at Freeport Beach access, joggers on the paved path, Harborcreek School District building visible, distinctive lake views residents know. Dawn light over calm waters."
  },
  fairview: {
    name: "Fairview",
    slug: "fairview",
    county: "Erie County",
    zipCodes: ["16415", "16428"],
    nearbyComm: ["Millcreek", "Girard", "Erie", "Lake City"],
    landmarks: ["Fairview Township Park", "West Ridge School District", "Lake Erie shoreline", "Route 20 Commercial Corridor", "Avonia Beach", "Fairview Fire Department"],
    description: "Fast-growing lakeside township in western Erie County, known for excellent schools, family-friendly atmosphere, and Lake Erie beach access",
    population: "~11,000",
    uniqueTrait: "One of Erie County's fastest-growing communities, featuring top-rated Fairview School District, direct Lake Erie beach access at Avonia, and strong sense of community",
    historicalNarrative: "Fairview Township was formed in 1832 from Girard Township, establishing itself as an agricultural community along Lake Erie's shore. The township grew steadily throughout the 20th century, but experienced rapid residential growth in the 1990s-2010s as families sought excellent schools and lakefront access. The Fairview School District's academic reputation and the township's small-town feel continue attracting new residents.",
    favoriteThings: [
      "Summer days at Avonia Beach on Lake Erie",
      "Fairview School District's award-winning programs",
      "Community festivals at Fairview Township Park",
      "Local businesses along Route 20",
      "Friendly neighbors and strong community spirit",
      "Convenient location between Erie and lake towns"
    ],
    imagePrompt: "Exact photorealistic view of Avonia Beach in Fairview Township showing the actual public beach access at Route 20 and Avonia Road, Lake Erie waves, the beach pavilion and parking area, families on sandy shore, distinctive bluffs, Fairview Water Authority water tower visible in distance. Recognizable local summer spot."
  },
  northEast: {
    name: "North East",
    slug: "north-east",
    county: "Erie County",
    zipCodes: ["16428"],
    nearbyComm: ["Harborcreek", "North East Township", "Erie"],
    landmarks: ["Wine Country Trail", "Gibson Park", "Lake Erie beaches"],
    description: "Charming borough in Pennsylvania's wine country",
    population: "~4,300",
    uniqueTrait: "Heart of Erie County's wine region with 20+ wineries",
    historicalNarrative: "Founded in 1794, North East Borough became the center of Erie County's grape-growing region due to Lake Erie's moderating climate. What started as a fruit-growing community transformed in the late 1960s when local farmers began establishing wineries. Today, North East anchors Pennsylvania's wine country with over 20 wineries producing award-winning vintages, while maintaining its charming small-town character.",
    favoriteThings: [
      "Wine tasting tours along the Lake Erie Wine Country Trail",
      "Annual Wine Country Harvest Festival in September",
      "Summer concerts at Gibson Park bandstand",
      "Fresh grape pies from local bakeries",
      "Lake Erie beaches just minutes away",
      "Historic downtown shops and restaurants"
    ],
    imagePrompt: "Exact photorealistic view of North East's vineyard country along Route 5 showing Mazza Vineyards or Heritage Wine Cellars tasting room, actual rows of Concord grapes with Lake Erie visible in background, Gibson Park's bandstand in town center, Route 20 (Main Street) historic storefronts. Wine Country Trail scenery residents recognize."
  },
  edinboro: {
    name: "Edinboro",
    slug: "edinboro",
    county: "Erie County",
    zipCodes: ["16412", "16444"],
    nearbyComm: ["Millcreek", "Cambridge Springs", "Waterford", "Erie"],
    landmarks: ["Edinboro University (PennWest Edinboro)", "Edinboro Lake", "Downtown Historic District", "Porreco College Center", "Route 6N", "Edinboro Borough Hall"],
    description: "Vibrant college town in southern Erie County, centered around PennWest Edinboro campus and the scenic natural Edinboro Lake",
    population: "~6,500",
    uniqueTrait: "Home to PennWest Edinboro University with 5,000+ students, and Edinboro Lake - Pennsylvania's largest natural lake. Offers unique college-town culture with small-town charm",
    historicalNarrative: "Edinboro was founded in 1825 and became home to Edinboro Normal School in 1857, which evolved into PennWest Edinboro University. The town grew around Pennsylvania's largest natural lake and the university, creating a unique blend of academic culture and natural beauty. Today, Edinboro retains its college-town vibrancy while offering year-round lake recreation and a tight-knit community feel.",
    favoriteThings: [
      "Ice skating and fishing on Edinboro Lake",
      "College sporting events and cultural programs at PennWest",
      "Coffee shops and restaurants catering to students and locals",
      "Summer concerts and community events downtown",
      "Walking and biking around Edinboro Lake",
      "Affordable housing and friendly neighborhood atmosphere"
    ],
    imagePrompt: "Exact photorealistic view of PennWest Edinboro's Reeder Hall and Porreco College Center near Edinboro Lake's west shore, students walking on campus paths in autumn, the actual natural lake with dock and swimming area, historic downtown buildings on Plum Street, Van Doren Hall visible. Recognizable college town scene."
  },
  wesleyville: {
    name: "Wesleyville",
    slug: "wesleyville",
    county: "Erie County",
    zipCodes: ["16510"],
    nearbyComm: ["Erie", "Harborcreek", "Lawrence Park"],
    landmarks: ["East Erie Commercial District", "Wesleyville Elementary School", "Buffalo Road (Route 20)", "Wesleyville Borough Building", "Lake Erie shoreline"],
    description: "Compact, close-knit borough in eastern Erie County along Lake Erie, offering easy access to Erie city amenities",
    population: "~3,300",
    uniqueTrait: "Small but strategic location on Buffalo Road corridor between Erie and Harborcreek, providing residents with hometown feel and big-city convenience",
    historicalNarrative: "Wesleyville was incorporated in 1887 as a small residential community along Lake Erie's shore. The borough developed along Buffalo Road (Route 20), Erie's eastern commercial corridor, allowing residents to enjoy small-town living while working in Erie's industries. Today, Wesleyville maintains its close-knit community character while benefiting from its prime location between Erie and Harborcreek.",
    favoriteThings: [
      "Quick access to Erie's jobs and entertainment",
      "Friendly neighbors in a tight-knit community",
      "Lake Erie views and shoreline access",
      "Convenient Buffalo Road shopping and dining",
      "Small-town feel with big-city convenience",
      "Safe streets and community pride"
    ],
    imagePrompt: "Exact photorealistic view of Wesleyville Borough along Buffalo Road (Route 20) showing actual residential streets, Lake Erie shoreline visible north, Wesleyville Elementary School building, small neighborhood homes, East Erie Commercial district, proximity to Erie city limits. Recognizable tight-knit borough."
  },
  girard: {
    name: "Girard",
    slug: "girard",
    county: "Erie County",
    zipCodes: ["16417"],
    nearbyComm: ["Fairview", "Lake City", "Cranberry Township", "Millcreek"],
    landmarks: ["Girard Borough Park", "Dan Rice Days Festival", "Historic Downtown Square", "Girard High School", "Route 20 Main Street", "Battles Museums of Rural Life"],
    description: "Historic borough in southwestern Erie County, celebrating its Victorian heritage and famous resident Dan Rice with annual festival",
    population: "~3,100",
    uniqueTrait: "Birthplace of Dan Rice, 19th century circus performer who inspired Uncle Sam. Annual Dan Rice Days celebrates local history with parades and festivities",
    historicalNarrative: "Girard was founded in 1832 and quickly became an important stop on stagecoach routes. The borough's most famous resident, Dan Rice, was a 19th-century circus owner and entertainer whose patriotic costume and white goatee inspired the Uncle Sam image. Girard's Victorian downtown and annual Dan Rice Days festival preserve this colorful heritage while serving as a charming residential community.",
    favoriteThings: [
      "Annual Dan Rice Days parade and festival",
      "Historic Victorian architecture downtown",
      "Battles Museums showcasing rural Pennsylvania life",
      "Community events at Girard Borough Park",
      "Local restaurants and shops on Main Street",
      "Small-town festivals and tight-knit community"
    ],
    imagePrompt: "Exact photorealistic view of Girard's Dan Rice Days parade on Main Street (Route 20) with actual Victorian storefronts, Uncle Sam characters, Girard Borough Park, historic Battles Museums building, American flags decorating 1880s-era downtown architecture. Annual festival residents cherish."
  },
  waterford: {
    name: "Waterford",
    slug: "waterford",
    county: "Erie County",
    zipCodes: ["16441"],
    nearbyComm: ["Edinboro", "Union City", "Wattsburg", "Erie"],
    landmarks: ["Fort LeBoeuf Museum", "Eagle Historic District", "LeBoeuf Creek", "Waterford Community Park", "Route 19 & Route 97 Junction", "Historic Downtown Waterford"],
    description: "Historic borough at the crossroads of southern Erie County, featuring French & Indian War heritage and small-town Pennsylvania charm",
    population: "~1,500",
    uniqueTrait: "Home to Fort LeBoeuf, a strategic French fort during French & Indian War (1753). George Washington visited here on his first military mission. Rich Erie Canal and early American history",
    historicalNarrative: "Waterford's history dates to 1753 when the French built Fort LeBoeuf, making it one of Pennsylvania's oldest European settlements. A young George Washington visited in 1753 on his first military mission. After the French & Indian War, American settlers arrived, and Waterford became an Erie Canal town in the 1840s. The beautifully preserved Eagle Historic District showcases this rich heritage.",
    favoriteThings: [
      "Exploring Fort LeBoeuf Museum and Revolutionary War history",
      "Walking through Eagle Historic District's Victorian homes",
      "Annual Fort LeBoeuf Days heritage festival",
      "Fishing and nature along LeBoeuf Creek",
      "Small-town shops and cafes downtown",
      "Rich American history at every turn"
    ],
    imagePrompt: "Exact photorealistic view of Fort LeBoeuf Museum's reconstructed 1753 French fort and blockhouse, Eagle Hotel historic building on High Street, LeBoeuf Creek flowing through town, actual Victorian homes in Eagle Historic District, Route 19/97 intersection. George Washington visited here in 1753."
  },

  // Crawford County Communities
  meadville: {
    name: "Meadville",
    slug: "meadville",
    county: "Crawford County",
    zipCodes: ["16335", "16388"],
    nearbyComm: ["Cochranton", "Saegertown", "Cambridge Springs", "Conneaut Lake"],
    landmarks: ["Allegheny College", "Diamond Park", "Market House Historic District", "Baldwin Reynolds House Museum", "Talon Conference Center", "Meadville Medical Center", "Downtown Meadville"],
    description: "Crawford County's vibrant seat and largest city, home to historic Allegheny College and a thriving downtown with arts, culture, and commerce",
    population: "~13,000",
    uniqueTrait: "Home to prestigious Allegheny College (founded 1815), birthplace of the zipper, and Crawford County's economic and cultural hub with historic architecture and college-town atmosphere",
    historicalNarrative: "Meadville's history dates to 1788 when David Mead established the first settlement. The city flourished as a manufacturing center in the 19th century and became famous as the birthplace of the modern zipper, invented here by Whitcomb Judson and perfected by Gideon Sundback. Allegheny College, founded in 1815, brought intellectual vitality that continues today. The city's beautiful Victorian architecture and Diamond Park remain testaments to its prosperous past.",
    favoriteThings: [
      "Exploring Diamond Park's historic bandstand and seasonal events",
      "College football games at Allegheny College's Robertson Athletic Complex",
      "Discovering local art at the Market House galleries",
      "Dining at downtown Meadville's diverse restaurants",
      "Touring Baldwin Reynolds House Museum and Victorian heritage",
      "Annual Meadville Market House Arts Festival"
    ],
    imagePrompt: "Exact photorealistic view of Meadville's Diamond Park showing the iconic Victorian bandstand, Allegheny College's Bentley Hall in background, historic Market House building, downtown shops on Chestnut Street, families enjoying the green space, autumn foliage. Crawford County seat's historic heart."
  },

  // Warren County Communities  
  warren: {
    name: "Warren",
    slug: "warren",
    county: "Warren County",
    zipCodes: ["16365"],
    nearbyComm: ["North Warren", "Russell", "Youngsville", "Clarendon"],
    landmarks: ["Warren County Courthouse", "Allegheny River", "Hickory Street Historic District", "Struthers Library Theatre", "Warren Mall", "Chapman State Park nearby"],
    description: "Warren County's seat and largest city, a gateway to Allegheny National Forest with Victorian architecture, outdoor recreation, and small-city amenities",
    population: "~9,500",
    uniqueTrait: "Northwestern Pennsylvania's premier outdoor recreation hub - gateway to 500,000+ acres of Allegheny National Forest, Kinzua Reservoir muskie fishing, and year-round forest adventures. Beautiful Victorian downtown with modern conveniences",
    historicalNarrative: "Warren was founded in 1795 and became the county seat in 1800. The city prospered as a lumber and oil boom town in the 1800s, with fortunes made harvesting vast forests and drilling for petroleum. Victorian mansions along Hickory Street reflect that golden era. The lumber industry brought Scandinavian and Eastern European immigrants who built tight-knit ethnic neighborhoods. When the Allegheny National Forest was established in 1923, Warren evolved into northwestern Pennsylvania's outdoor recreation capital. Today, the city balances its Victorian heritage with modern amenities, serving as base camp for Allegheny National Forest visitors while maintaining vibrant downtown shops, restaurants, and cultural attractions.",
    favoriteThings: [
      "Gateway to Allegheny National Forest's 500,000+ acres",
      "World-class muskie fishing on Kinzua Reservoir",
      "Victorian architecture along Hickory Street Historic District",
      "Struthers Library Theatre performances and events",
      "Downtown Warren's shops, restaurants, and festivals",
      "Chapman State Park camping and recreation",
      "ATV trails, hiking, hunting in surrounding forest",
      "Allegheny River Water Trail paddling",
      "Warren County Courthouse and historic downtown square"
    ],
    imagePrompt: "Exact photorealistic view of downtown Warren showing Warren County Courthouse, Hickory Street's Victorian mansions, Allegheny River flowing through city, Struthers Library Theatre, downtown Pennsylvania Avenue shops, autumn colors, Allegheny National Forest visible on horizon. Gateway to Pennsylvania's northern forest."
  },

  northWarren: {
    name: "North Warren",
    slug: "north-warren",
    county: "Warren County",
    zipCodes: ["16365"],
    nearbyComm: ["Warren", "Clarendon", "Sheffield", "Russell"],
    landmarks: ["Allegheny National Forest access points", "Kinzua Dam overlook", "Chapman State Park (10 miles)", "Route 6 Scenic Byway", "ATV trail network", "North Warren Fire Department", "Warren County forest lands", "Tionesta Creek watershed"],
    description: "Outdoor recreation paradise in Warren County serving as primary gateway to Allegheny National Forest's northern wilderness, world-class fishing, and year-round forest adventures",
    population: "~2,200",
    uniqueTrait: "Warren County's ultimate outdoor lifestyle community - closest residential area to Kinzua Dam, Allegheny National Forest recreation, Chapman State Park camping, and 200+ miles of ATV trails. Perfect base camp for forest living",
    historicalNarrative: "North Warren developed as a residential community for Warren's lumber industry workers who wanted to live near the vast forests they harvested. As the lumber era ended and Allegheny National Forest was established in 1923, the area evolved into an outdoor recreation community. The U.S. Army Corps of Engineers' completion of Kinzua Dam in 1965, creating the massive 12,080-acre reservoir, transformed North Warren into a premier fishing and recreation destination. Today, residents embrace the outdoor lifestyle - hunting, fishing, hiking, ATV riding, and snowmobiling are woven into daily life. The community serves families seeking affordable homes with wilderness access, retirees wanting four-season recreation, and outdoor enthusiasts who live to fish, hunt, and explore. North Warren represents Pennsylvania's northern tier outdoor culture - pickup trucks with boat trailers, hunting camps, fishing tales, and neighbors who share venison.",
    favoriteThings: [
      "Direct access to 200+ miles of Allegheny National Forest ATV trails",
      "15 minutes to Kinzua Dam and world-class muskie fishing",
      "Chapman State Park camping, swimming, and hiking nearby",
      "Hunting deer, bear, turkey in vast surrounding forest",
      "Snowmobiling through forest on 300+ miles of trails",
      "Affordable homes with large wooded lots",
      "Tight-knit outdoor community - neighbors share hunting stories",
      "Allegheny River fishing for smallmouth bass and walleye",
      "Dark night skies perfect for stargazing - no light pollution",
      "Four-season recreation right outside your door"
    ],
    imagePrompt: "Exact photorealistic view of North Warren showing homes nestled in forest, ATV riders on trail system, Kinzua Dam visible in distance, Chapman State Park lake, pickup trucks with boat trailers, deer crossing road, dense Allegheny National Forest, autumn wilderness colors. Outdoor lifestyle community."
  },

  youngsville: {
    name: "Youngsville",
    slug: "youngsville",
    county: "Warren County",
    zipCodes: ["16371"],
    nearbyComm: ["Warren", "Sugar Grove", "Pittsfield", "Irvine"],
    landmarks: ["Brokenstraw Creek", "Youngsville Dam", "Downtown Youngsville", "Route 6 corridor", "Youngsville Area School", "Community Park"],
    description: "Family-friendly Warren County borough along Brokenstraw Creek offering small-town living with excellent schools and outdoor recreation",
    population: "~1,800",
    uniqueTrait: "Warren County's premier family community - top-rated Youngsville School District, safe neighborhoods, Brokenstraw Creek recreation, and genuine small-town Pennsylvania atmosphere. Perfect balance of countryside and convenience",
    historicalNarrative: "Youngsville was founded in the early 1800s along Brokenstraw Creek, a vital transportation route for lumber. The borough grew as a residential community for workers in Warren's lumber and oil industries who wanted small-town living. The Youngsville Dam, built by the Army Corps of Engineers for flood control, created recreational opportunities that enhanced the borough's appeal. As Warren County's population declined in the late 20th century, Youngsville maintained stability by becoming the family-friendly residential choice - combining excellent schools, safe neighborhoods, and outdoor recreation. Today, Youngsville attracts young families seeking quality education, retirees downsizing from larger homes, and anyone wanting genuine small-town Pennsylvania community.",
    favoriteThings: [
      "Outstanding Youngsville School District academics and sports",
      "Safe, family-friendly neighborhoods perfect for raising kids",
      "Brokenstraw Creek fishing for trout and smallmouth bass",
      "Small-town festivals and community events",
      "Affordable housing - homes under $150K common",
      "Quick access to Warren jobs and shopping (10 minutes)",
      "Community Park playgrounds and recreation",
      "Tight-knit community where neighbors know each other",
      "Near Allegheny National Forest outdoor recreation"
    ],
    imagePrompt: "Exact photorealistic view of Youngsville showing families at Community Park, Brokenstraw Creek flowing through town, Youngsville School District building, downtown Main Street shops, children playing, safe residential streets, Route 6 corridor, autumn colors. Warren County family community."
  },

  bearLake: {
    name: "Bear Lake",
    slug: "bear-lake",
    county: "Warren County",
    zipCodes: ["16402"],
    nearbyComm: ["Edinboro", "Waterford", "Union City", "Spartansburg"],
    landmarks: ["Bear Lake (238-acre spring-fed lake)", "Bear Lake General Store (historic)", "Lake access points and boat launches", "Bear Lake Road scenic drive", "Lakefront cottages and homes", "Warren-Erie County border", "Fishing piers and swimming areas", "Wooded shoreline trails"],
    description: "Hidden gem spring-fed lake community on Erie-Warren County border offering exceptional fishing, peaceful no-wake boating, and affordable lakefront living in pristine natural setting",
    population: "~250",
    uniqueTrait: "Hidden gem spring-fed lake community uniquely positioned on Erie-Warren border. 238-acre Bear Lake offers excellent fishing (bass, bluegill, perch), quiet no-wake boating, and affordable lakefront living in stunning natural setting",
    historicalNarrative: "Bear Lake's crystal-clear spring-fed waters have drawn settlers since the 1800s when farmers discovered this natural oasis along the Erie-Warren border. By the early 1900s, families built summer cottages, creating a seasonal lake community tradition that continues today. Unlike crowded Erie beaches or distant Warren forests, Bear Lake offered an intimate, accessible waterfront escape. The historic Bear Lake General Store became the community's heart, where locals gathered for supplies and conversation. As paved roads improved access in the 1950s-60s, more families converted summer cottages to year-round homes, creating today's unique blend of seasonal and permanent residents who share deep appreciation for the lake's natural beauty and tranquil atmosphere.",
    favoriteThings: [
      "Exceptional bass, bluegill, and perch fishing in spring-fed waters",
      "Peaceful no-wake boating perfect for kayaks, canoes, and pontoons",
      "Stunning sunsets reflecting off the calm lake surface",
      "Swimming from private and public lake access points",
      "Tight-knit lake community with annual traditions and gatherings",
      "Affordable lakefront property compared to larger lakes",
      "Winter ice fishing and skating on frozen lake",
      "Natural beauty and wildlife - loons, eagles, herons, deer",
      "Historic Bear Lake General Store community gathering spot"
    ],
    imagePrompt: "Exact photorealistic view of Bear Lake at sunset showing spring-fed crystal waters reflecting orange and pink sky, families fishing from wooden pier, kayakers paddling near shore, lakefront cottages with lights glowing, wooded shoreline, eagle soaring overhead, absolute serenity. Hidden gem Pennsylvania lake community."
  },

  russell: {
    name: "Russell",
    slug: "russell",
    county: "Warren County",
    zipCodes: ["16345"],
    nearbyComm: ["Warren", "Clarendon", "North Warren", "Sheffield"],
    landmarks: ["Kinzua Reservoir (12,080 acres)", "Kinzua-Wolf Run Marina", "Allegheny River Water Trail", "Kinzua Beach day-use area", "Russell Borough Fishing Pier", "Route 59 Scenic Byway", "Allegheny National Forest access points", "Historic Kinzua Dam overlook"],
    description: "Premier outdoor recreation gateway borough on Kinzua Reservoir, world-renowned for trophy muskie fishing, boating, and Allegheny National Forest adventures",
    population: "~350",
    uniqueTrait: "International muskie fishing capital - Kinzua Reservoir produces Pennsylvania's largest muskellunge (50+ inches common). Perfect base camp for anglers, boaters, and forest explorers with full-service marina and lodging",
    historicalNarrative: "Russell's destiny changed dramatically when the U.S. Army Corps of Engineers completed Kinzua Dam in 1965, creating the massive 12,080-acre Kinzua Reservoir. The tiny lumber town transformed overnight into an outdoor recreation mecca as anglers discovered the reservoir's extraordinary muskie, walleye, and bass fishery. The Kinzua-Wolf Run Marina opened, providing full services for boaters exploring the reservoir's 91-mile shoreline. Fishing guides established operations, and Russell became internationally known among muskie anglers as the place to catch the fish of a lifetime. Today, anglers travel from across the globe to Russell, hoping to land a 50-inch-plus muskie from Kinzua's fertile waters. The borough embraces its role as gateway to both reservoir fishing and Allegheny National Forest recreation.",
    favoriteThings: [
      "World-record-class muskie fishing - 50+ inch fish caught regularly",
      "Full-service Kinzua-Wolf Run Marina with boat rentals and guides",
      "91 miles of pristine reservoir shoreline to explore by boat",
      "Kinzua Beach swimming, picnicking, and sandy shore recreation",
      "Walleye, smallmouth bass, and crappie fishing excellence",
      "Allegheny National Forest hiking, hunting, and camping nearby",
      "Professional fishing guides specializing in muskie tactics",
      "Ice fishing tournaments in winter for walleye and perch",
      "Kinzua Dam tours and stunning overlook views of the reservoir"
    ],
    imagePrompt: "Exact photorealistic view of Russell's Kinzua-Wolf Run Marina at dawn showing muskie fishing tournament boats launching, the massive Kinzua Reservoir stretching to forested horizons, angler holding trophy 52-inch muskie, marina docks and facilities, autumn forest colors reflecting in calm waters, fishing guides prepping clients. World-class fishing destination."
  },

  tidioute: {
    name: "Tidioute",
    slug: "tidioute",
    county: "Warren County",
    zipCodes: ["16351"],
    nearbyComm: ["Warren", "Irvine", "Tionesta"],
    landmarks: ["Allegheny River", "Historic downtown", "Hunter Station Bridge", "Tidioute Borough Park", "River access"],
    description: "Scenic historic borough along Allegheny River, popular with paddlers and outdoor enthusiasts",
    population: "~680",
    uniqueTrait: "Picturesque Allegheny River location - popular kayaking/canoeing destination. Historic downtown with Victorian charm. Gateway to Allegheny River Islands Wilderness",
    historicalNarrative: "Tidioute sits at a strategic bend in the Allegheny River and grew as a lumber town in the 1800s. The borough's Victorian downtown reflects that prosperous era. Today, Tidioute is beloved by paddlers on the Allegheny River Water Trail and serves as gateway to the Allegheny River Islands Wilderness, a pristine island ecosystem.",
    favoriteThings: [
      "Kayaking and canoeing the Allegheny River Water Trail",
      "Exploring Allegheny River Islands Wilderness",
      "Fishing for smallmouth bass and walleye",
      "Historic Victorian downtown architecture",
      "Hunter Station Bridge scenic views",
      "Peaceful river town atmosphere"
    ],
    imagePrompt: "Exact photorealistic view of Tidioute's Allegheny River waterfront showing the historic Hunter Station Bridge, Victorian downtown buildings along riverbank, kayakers paddling, wooded river islands, autumn reflections in calm water. Paddler's paradise."
  },

  sugarGrove: {
    name: "Sugar Grove",
    slug: "sugar-grove",
    county: "Warren County",
    zipCodes: ["16350"],
    nearbyComm: ["Youngsville", "Bear Lake", "Warren", "Columbus"],
    landmarks: ["Century-old family dairy farms", "Sugar Grove Township Building", "Route 69 Scenic Agricultural Corridor", "Amish farmsteads and roadside stands", "Rolling countryside vistas", "Historic one-room schoolhouse (preserved)", "Community Grange Hall", "Farm-to-table produce stands"],
    description: "Quintessential agricultural township in Warren County preserving multi-generational farming heritage, Amish community presence, and picture-perfect rural Pennsylvania countryside character",
    population: "~700",
    uniqueTrait: "Last remaining active Amish farming community in Warren County. Multi-generational family dairy and crop farms that have worked the same land for 150+ years. True rural Pennsylvania agricultural heritage",
    historicalNarrative: "Sugar Grove earned its sweet name from the abundant sugar maple trees early settlers tapped for syrup production in the early 1800s. As Warren County industrialized with lumber and oil, Sugar Grove resisted change, with families choosing to preserve their agricultural way of life. German and Amish settlers arrived in the mid-1800s, establishing dairy farms and crop production that continues today through direct descendants. The township watched neighboring areas transform while Sugar Grove families passed farms from grandparents to grandchildren, maintaining traditions of hard work, self-sufficiency, and connection to the land. Today, visitors driving Route 69 through Sugar Grove experience rural Pennsylvania as it existed a century ago - Holstein cattle grazing rolling hills, red barns weathered by time, Amish buggies on country roads, and roadside stands selling fresh produce. Sugar Grove represents what much of rural America has lost - a living, working agricultural community where farming isn't a business venture but a generational calling.",
    favoriteThings: [
      "Buying fresh produce, eggs, and baked goods from Amish roadside stands",
      "Watching traditional farming with horse-drawn equipment",
      "Scenic drives through rolling agricultural countryside on Route 69",
      "Fall foliage against red barns and golden harvest fields",
      "Supporting multi-generational family dairy farms",
      "Maple syrup production continuing the 'Sugar Grove' namesake tradition",
      "Experiencing authentic rural Pennsylvania agricultural lifestyle",
      "Community Grange dinners and harvest festivals",
      "Country roads perfect for cycling through pastoral landscapes"
    ],
    imagePrompt: "Exact photorealistic view of Sugar Grove showing Holstein dairy cows grazing on rolling green hills, classic red dairy barn with silo, Amish horse and buggy on country road, roadside stand selling fresh corn and tomatoes, farmers harvesting hay, Warren County countryside stretching to forest horizon, golden afternoon light. Living agricultural heritage."
  },

  sheffield: {
    name: "Sheffield",
    slug: "sheffield",
    county: "Warren County",
    zipCodes: ["16347"],
    nearbyComm: ["Clarendon", "Warren", "Kinzua"],
    landmarks: ["Allegheny National Forest access", "Kinzua Reservoir", "Sheffield Township", "Forest recreation areas"],
    description: "Forest township community serving as gateway to Allegheny National Forest recreation",
    population: "~1,100",
    uniqueTrait: "Located in heart of Allegheny National Forest region. Base for hunting, fishing, hiking, and ATV recreation. Outdoor lifestyle community",
    historicalNarrative: "Sheffield grew as a lumber town deep in Pennsylvania's northern forest and later became a base camp for oil drilling. When the Allegheny National Forest was established, Sheffield evolved into a recreation community. Today, residents embrace outdoor lifestyles - hunting, fishing, hiking, and ATV riding in the vast surrounding forest.",
    favoriteThings: [
      "Hunting in Allegheny National Forest",
      "ATV trail riding through forest lands",
      "Fishing on Kinzua Reservoir",
      "Hiking endless forest trails",
      "Outdoor lifestyle year-round",
      "Remote living surrounded by wilderness"
    ],
    imagePrompt: "Exact photorealistic view of Sheffield Township showing hunters in camouflage in Allegheny National Forest, ATV riders on forest trails, Kinzua Reservoir visible, deer and wildlife, remote cabins, dense autumn forest. Outdoor enthusiast and hunting culture."
  },

  clarendon: {
    name: "Clarendon",
    slug: "clarendon",
    county: "Warren County",
    zipCodes: ["16313"],
    nearbyComm: ["Warren", "Sheffield", "Russell"],
    landmarks: ["Allegheny Reservoir", "Kinzua Dam area", "Forest lands", "Allegheny National Forest"],
    description: "Small rural borough near Allegheny Reservoir and Kinzua Dam",
    population: "~475",
    uniqueTrait: "Small community near Allegheny Reservoir created by Kinzua Dam. Gateway to reservoir fishing, boating, and forest recreation",
    historicalNarrative: "Clarendon's history changed dramatically when the Army Corps of Engineers built Kinzua Dam in 1965, creating the massive Allegheny Reservoir. The small community became a gateway to the reservoir's recreation opportunities - boating, fishing, camping, and forest access.",
    favoriteThings: [
      "Boating and fishing on Allegheny Reservoir",
      "Kinzua Dam tours and overlooks",
      "Forest camping and outdoor recreation",
      "Hunting and fishing in season",
      "Remote living near wilderness",
      "Water sports and reservoir activities"
    ],
    imagePrompt: "Exact photorealistic view of Allegheny Reservoir near Clarendon showing Kinzua Dam structure, boats fishing and cruising, forested reservoir shores, Kinzua Dam visitor overlook, camping areas visible, the massive concrete dam. Engineering marvel meets outdoor recreation."
  },

  kinzua: {
    name: "Kinzua",
    slug: "kinzua",
    county: "Warren County",
    zipCodes: ["16365"],
    nearbyComm: ["Warren", "Sheffield", "Mount Jewett"],
    landmarks: ["Kinzua Bridge State Park", "Kinzua Bridge Skywalk", "Allegheny National Forest", "Kinzua viaduct ruins"],
    description: "Forest community near world-famous Kinzua Bridge and skywalk attraction",
    population: "~300",
    uniqueTrait: "Home to world-famous Kinzua Bridge Skywalk - former railroad viaduct now popular tourist attraction. Deep in Allegheny National Forest with spectacular views",
    historicalNarrative: "Kinzua was a remote forest community until the spectacular Kinzua Viaduct railroad bridge was built in 1882, once the world's highest. After a 2003 tornado partially destroyed the bridge, it was reimagined as the Kinzua Bridge Skywalk, attracting thousands of visitors to walk out over the 300-foot gorge and experience breathtaking forest views.",
    favoriteThings: [
      "Walking the thrilling Kinzua Bridge Skywalk 300 feet above the gorge",
      "Photographing the dramatic ruins of the viaduct",
      "Hiking trails through spectacular forest scenery",
      "Visitor center exhibits on railroad history",
      "Autumn foliage from the skywalk",
      "Remote forest living and natural beauty"
    ],
    imagePrompt: "Exact photorealistic view of Kinzua Bridge State Park showing the iconic Kinzua Skywalk extending over the 300-foot gorge, tornado-damaged viaduct ruins, visitors walking the glass-floored skywalk, dense Allegheny National Forest autumn colors, spectacular gorge views. Breathtaking engineering meets natural beauty."
  },

  springCreek: {
    name: "Spring Creek",
    slug: "spring-creek",
    county: "Erie County",
    zipCodes: ["16436"],
    nearbyComm: ["Albion", "Edinboro", "Waterford", "Girard"],
    landmarks: ["Century-old dairy farms", "Spring Creek watershed flowing through township", "Historic farmsteads dating to 1820s", "Rolling agricultural hills", "Spring Creek Township Municipal Building", "Agricultural preservation areas", "Country roads and covered bridge history", "Northwestern School District reach"],
    description: "Peaceful agricultural township in southwestern Erie County preserving multi-generational farming heritage and quintessential rural Pennsylvania countryside character",
    population: "~1,100",
    uniqueTrait: "Erie County's agricultural heartland where 5th and 6th-generation family farms still work land their ancestors cleared in the 1820s. Spring Creek's waters feed local farms producing corn, soybeans, dairy, and the county's farm-fresh character",
    historicalNarrative: "Spring Creek Township earned its name from the life-giving creek that flows through rich agricultural land settlers discovered in the 1810s-20s. German and English farming families claimed plots, cleared forests, built stone farmhouses and bank barns that still stand today. Unlike Erie's industrial boom that urbanized surrounding areas, Spring Creek families chose agriculture, passing farms through generations. By the early 1900s, Spring Creek was Erie County's breadbasket - dairy farms supplied Erie's growing population with milk, cheese, and butter while crop farms fed livestock and filled grain elevators. The township resisted suburban sprawl that consumed nearby farmland, with families viewing their land as heritage, not real estate. Today, Spring Creek remains remarkably unchanged - the same family names on mailboxes as 150 years ago, red bank barns weathered but standing, Holstein cattle grazing hills their ancestors cleared, and Spring Creek flowing through countryside as it has for centuries.",
    favoriteThings: [
      "Multi-generational family farms - same families farming since 1820s",
      "Pristine Spring Creek watershed with native brook trout",
      "Scenic country roads perfect for cycling and autumn drives",
      "Historic 1800s stone farmhouses and bank barns still standing",
      "Farm-fresh produce, eggs, and honey from family farms",
      "Genuine agricultural community - neighbors help with harvest",
      "Dark starry skies unpolluted by city lights",
      "Four-season rural beauty and agricultural rhythms",
      "Strong agricultural preservation ethic protecting farmland"
    ],
    imagePrompt: "Exact photorealistic view of Spring Creek Township showing picturesque dairy farm with historic red bank barn and 1820s stone farmhouse, Holstein cattle grazing rolling hills, Spring Creek meandering through green pasture, farmer on tractor harvesting hay, golden afternoon sunlight, forest-covered hills in distance, pure rural Pennsylvania agricultural landscape. Timeless farming heritage."
  },

  // Mercer County Communities
  sharon: {
    name: "Sharon",
    slug: "sharon",
    county: "Mercer County",
    zipCodes: ["16146"],
    nearbyComm: ["Hermitage", "Farrell", "Sharpsville"],
    landmarks: ["Shenango River", "Downtown Sharon", "Reyers"],
    description: "Historic steel town on the Shenango River",
    population: "~13,000",
    uniqueTrait: "Steel heritage and Reyers shoe store landmark"
  },
  hermitage: {
    name: "Hermitage",
    slug: "hermitage",
    county: "Mercer County",
    zipCodes: ["16148"],
    nearbyComm: ["Sharon", "Farrell", "Sharpsville"],
    landmarks: ["Shenango River", "Buhl Park", "Hermitage Community Center"],
    description: "Growing city in Mercer County",
    population: "~16,000",
    uniqueTrait: "Largest city in Mercer County with strong retail sector"
  },
  groveCity: {
    name: "Grove City",
    slug: "grove-city",
    county: "Mercer County",
    zipCodes: ["16127"],
    nearbyComm: ["Mercer", "Slippery Rock", "Harrisville"],
    landmarks: ["Grove City College", "Grove City Premium Outlets", "Downtown Grove City"],
    description: "College town and shopping destination",
    population: "~8,000",
    uniqueTrait: "Home to Grove City College and major outlet mall"
  },
  greenville: {
    name: "Greenville",
    slug: "greenville",
    county: "Mercer County",
    zipCodes: ["16125"],
    nearbyComm: ["Mercer", "Jamestown", "Clark"],
    landmarks: ["Downtown Greenville", "Shenango River", "Canal Museum"],
    description: "Historic borough in Mercer County",
    population: "~5,900",
    uniqueTrait: "Canal heritage and small-town charm"
  },
  mercer: {
    name: "Mercer",
    slug: "mercer",
    county: "Mercer County",
    zipCodes: ["16137"],
    nearbyComm: ["Grove City", "Hermitage", "Greenville"],
    landmarks: ["Mercer County Courthouse", "Magoffin House Museum"],
    description: "County seat of Mercer County",
    population: "~2,000",
    uniqueTrait: "Historic county seat with beautiful courthouse"
  },
  farrell: {
    name: "Farrell",
    slug: "farrell",
    county: "Mercer County",
    zipCodes: ["16121"],
    nearbyComm: ["Sharon", "Hermitage", "Wheatland"],
    landmarks: ["Shenango River", "Downtown Farrell"],
    description: "Former steel city with rich immigrant heritage",
    population: "~4,900",
    uniqueTrait: "Steel industry heritage and working-class pride"
  },
  sharpsville: {
    name: "Sharpsville",
    slug: "sharpsville",
    county: "Mercer County",
    zipCodes: ["16150"],
    nearbyComm: ["Sharon", "Hermitage", "Clark"],
    landmarks: ["Shenango River", "Historic downtown"],
    description: "Historic manufacturing borough along Shenango River",
    population: "~4,400",
    uniqueTrait: "Manufacturing heritage and community traditions"
  },
  clark: {
    name: "Clark",
    slug: "clark",
    county: "Mercer County",
    zipCodes: ["16113"],
    nearbyComm: ["Sharon", "Sharpsville", "Greenville"],
    landmarks: ["Rural Clark borough", "Agricultural lands"],
    description: "Small agricultural borough in Mercer County",
    population: "~620",
    uniqueTrait: "Rural farming community"
  },
  stoneboro: {
    name: "Stoneboro",
    slug: "stoneboro",
    county: "Mercer County",
    zipCodes: ["16153"],
    nearbyComm: ["Sandy Lake", "Mercer", "Jackson Center"],
    landmarks: ["Sandy Lake area", "Lakeview School District", "Rural farmland"],
    description: "Small rural borough serving as gateway to Sandy Lake",
    population: "~1,050",
    uniqueTrait: "Gateway to Sandy Lake with agricultural heritage"
  },
  sandyLake: {
    name: "Sandy Lake",
    slug: "sandy-lake",
    county: "Mercer County",
    zipCodes: ["16145"],
    nearbyComm: ["Stoneboro", "Greenville", "Mercer"],
    landmarks: ["Sandy Lake", "Lake community", "Sandy Lake Park"],
    description: "Peaceful lake community borough",
    population: "~700",
    uniqueTrait: "Lakeside living and year-round recreation"
  },

  // Venango County Communities
  oilCity: {
    name: "Oil City",
    slug: "oil-city",
    county: "Venango County",
    zipCodes: ["16301"],
    nearbyComm: ["Franklin", "Titusville", "Rouseville"],
    landmarks: ["Oil Creek State Park", "Venango Museum", "Historic downtown"],
    description: "Historic oil boom town at Oil Creek and Allegheny River",
    population: "~10,000",
    uniqueTrait: "Birthplace of American oil industry"
  },
  franklin: {
    name: "Franklin",
    slug: "franklin",
    county: "Venango County",
    zipCodes: ["16323"],
    nearbyComm: ["Oil City", "Sugarcreek", "Cooperstown"],
    landmarks: ["DeBence Antique Music World", "Allegheny River", "Historic downtown Franklin"],
    description: "Historic city at the confluence of French Creek and Allegheny River",
    population: "~6,500",
    uniqueTrait: "Rich oil heritage and antique music museum"
  },
  titusville: {
    name: "Titusville",
    slug: "titusville",
    county: "Crawford County",
    zipCodes: ["16354"],
    nearbyComm: ["Oil City", "Hydetown", "Pleasantville"],
    landmarks: ["Drake Well Museum", "Oil Creek State Park", "Historic downtown"],
    description: "Birthplace of American oil industry",
    population: "~5,400",
    uniqueTrait: "Home to Drake Well Museum - site of first commercial oil well"
  },
  sugarcreek: {
    name: "Sugarcreek",
    slug: "sugarcreek",
    county: "Venango County",
    zipCodes: ["16323"],
    nearbyComm: ["Franklin", "Oil City", "Polk"],
    landmarks: ["Allegheny River access", "Sugarcreek Borough", "Route 8 corridor"],
    description: "Growing borough in Venango County",
    population: "~5,200",
    uniqueTrait: "Largest borough in Venango County with growing development"
  },
  rouseville: {
    name: "Rouseville",
    slug: "rouseville",
    county: "Venango County",
    zipCodes: ["16344"],
    nearbyComm: ["Oil City", "Franklin", "Pleasantville"],
    landmarks: ["Oil Creek", "Oil heritage sites", "Route 8 corridor"],
    description: "Historic oil creek community",
    population: "~510",
    uniqueTrait: "Oil industry heritage on Oil Creek"
  },
  pleasantville: {
    name: "Pleasantville",
    slug: "pleasantville",
    county: "Venango County",
    zipCodes: ["16341"],
    nearbyComm: ["Titusville", "Oil City", "Hydetown"],
    landmarks: ["Oil Creek", "Historic downtown", "Route 227"],
    description: "Small borough in Pennsylvania's oil country",
    population: "~860",
    uniqueTrait: "Oil heritage community in Oil Creek Valley"
  },
  emlenton: {
    name: "Emlenton",
    slug: "emlenton",
    county: "Venango County",
    zipCodes: ["16373"],
    nearbyComm: ["Franklin", "Clintonville", "Parker"],
    landmarks: ["Allegheny River", "Historic downtown", "Emlenton Bridge"],
    description: "Scenic river borough along Allegheny River",
    population: "~620",
    uniqueTrait: "Scenic Allegheny River location with historic bridge"
  },
  clintonville: {
    name: "Clintonville",
    slug: "clintonville",
    county: "Venango County",
    zipCodes: ["16372"],
    nearbyComm: ["Franklin", "Emlenton", "Grove City"],
    landmarks: ["Allegheny River area", "Route 8 corridor"],
    description: "Small borough on Venango-Mercer border",
    population: "~470",
    uniqueTrait: "Strategic location between Franklin and Grove City"
  },
  polk: {
    name: "Polk",
    slug: "polk",
    county: "Venango County",
    zipCodes: ["16342"],
    nearbyComm: ["Franklin", "Cooperstown", "Emlenton"],
    landmarks: ["Allegheny River", "Polk Borough Park", "Route 62 corridor"],
    description: "Small borough maintaining rural character",
    population: "~850",
    uniqueTrait: "Small-town charm with Allegheny River access"
  },
  utica: {
    name: "Utica",
    slug: "utica",
    county: "Venango County",
    zipCodes: ["16362"],
    nearbyComm: ["Franklin", "Polk", "Cooperstown"],
    landmarks: ["Rural Venango County", "Agricultural area"],
    description: "Small rural borough in Venango County",
    population: "~210",
    uniqueTrait: "Quintessential rural Pennsylvania atmosphere"
  },
  hydetown: {
    name: "Hydetown",
    slug: "hydetown",
    county: "Crawford County",
    zipCodes: ["16328"],
    nearbyComm: ["Titusville", "Meadville", "Pleasantville"],
    landmarks: ["Oil Creek watershed", "Historic oil region"],
    description: "Small oil region community",
    population: "~700",
    uniqueTrait: "Oil boom heritage village"
  },
  cooperstown: {
    name: "Cooperstown",
    slug: "cooperstown",
    county: "Venango County",
    zipCodes: ["16317"],
    nearbyComm: ["Franklin", "Oil City", "Polk"],
    landmarks: ["Allegheny River", "Rural borough", "Route 257 corridor"],
    description: "Small riverside borough in Venango County",
    population: "~440",
    uniqueTrait: "Quiet Allegheny River community"
  },
  venangoCrawford: {
    name: "Venango Crawford",
    slug: "venango-crawford",
    county: "Venango County",
    zipCodes: ["16365"],
    nearbyComm: ["Franklin", "Meadville", "Oil City"],
    landmarks: ["County border region", "Rural area", "French Creek watershed"],
    description: "Rural region straddling Venango and Crawford county border",
    population: "N/A",
    uniqueTrait: "Border region between two counties"
  },

  // More Crawford County Communities
  cambridgeSprings: {
    name: "Cambridge Springs",
    slug: "cambridge-springs",
    county: "Crawford County",
    zipCodes: ["16403"],
    nearbyComm: ["Edinboro", "Meadville", "Saegertown"],
    landmarks: ["Alliance College", "Riverside Hotel", "French Creek", "Historic spa district"],
    description: "Historic mineral springs resort town",
    population: "~2,600",
    uniqueTrait: "Victorian-era mineral springs resort with historic spa architecture"
  },
  saegertown: {
    name: "Saegertown",
    slug: "saegertown",
    county: "Crawford County",
    zipCodes: ["16433"],
    nearbyComm: ["Meadville", "Cambridge Springs", "Edinboro"],
    landmarks: ["Woodcock Creek Lake", "Downtown Saegertown", "Saegertown Area School District"],
    description: "Small rural borough near Woodcock Creek Lake",
    population: "~1,050",
    uniqueTrait: "Gateway to Woodcock Creek Lake recreation"
  },
  linesville: {
    name: "Linesville",
    slug: "linesville",
    county: "Crawford County",
    zipCodes: ["16424"],
    nearbyComm: ["Conneautville", "Conneaut Lake", "Harmonsburg"],
    landmarks: ["Pymatuning Reservoir", "Linesville Spillway", "Pymatuning State Park"],
    description: "Famous lake town home to Pymatuning Spillway",
    population: "~1,000",
    uniqueTrait: "Where the ducks walk on the fish at Pymatuning Spillway"
  },
  conneautLake: {
    name: "Conneaut Lake",
    slug: "conneaut-lake",
    county: "Crawford County",
    zipCodes: ["16316"],
    nearbyComm: ["Meadville", "Linesville", "Harmonsburg"],
    landmarks: ["Conneaut Lake (largest natural lake in PA)", "Conneaut Lake Park", "Historic hotel"],
    description: "Resort town on Pennsylvania's largest natural lake",
    population: "~700",
    uniqueTrait: "Pennsylvania's largest natural lake with historic amusement park"
  },
  conneautville: {
    name: "Conneautville",
    slug: "conneautville",
    county: "Crawford County",
    zipCodes: ["16406"],
    nearbyComm: ["Linesville", "Meadville", "Springboro"],
    landmarks: ["Downtown square", "Conneautville Area School", "Agricultural community"],
    description: "Small agricultural borough",
    population: "~760",
    uniqueTrait: "Small-town charm with agricultural heritage"
  },
  cochranton: {
    name: "Cochranton",
    slug: "cochranton",
    county: "Crawford County",
    zipCodes: ["16314"],
    nearbyComm: ["Meadville", "Saegertown", "Cambridge Springs"],
    landmarks: ["French Creek", "Downtown Cochranton", "Cochranton Area School"],
    description: "Small borough along French Creek",
    population: "~1,150",
    uniqueTrait: "French Creek flows through town"
  },
  harmonsburg: {
    name: "Harmonsburg",
    slug: "harmonsburg",
    county: "Crawford County",
    zipCodes: ["16422"],
    nearbyComm: ["Conneaut Lake", "Meadville", "Linesville"],
    landmarks: ["Rural crossroads", "Agricultural lands"],
    description: "Tiny rural borough",
    population: "~560",
    uniqueTrait: "Peaceful rural living"
  },
  spartansburg: {
    name: "Spartansburg",
    slug: "spartansburg",
    county: "Crawford County",
    zipCodes: ["16434"],
    nearbyComm: ["Corry", "Titusville", "Riceville"],
    landmarks: ["Downtown Spartansburg", "Spartansburg Area School", "Route 6 corridor"],
    description: "Small rural borough along Route 6",
    population: "~290",
    uniqueTrait: "Small-town living along historic Route 6"
  },
  bloomingValley: {
    name: "Blooming Valley",
    slug: "blooming-valley",
    county: "Crawford County",
    zipCodes: ["16335"],
    nearbyComm: ["Meadville", "Guys Mills", "Townville"],
    landmarks: ["Rural valley", "Agricultural lands"],
    description: "Small rural hamlet in scenic valley",
    population: "~120",
    uniqueTrait: "Tiny rural hamlet in picturesque valley"
  },
  townville: {
    name: "Townville",
    slug: "townville",
    county: "Crawford County",
    zipCodes: ["16360"],
    nearbyComm: ["Meadville", "Edinboro", "Cambridge Springs"],
    landmarks: ["Rural farmland", "Townville Borough"],
    description: "One of Pennsylvania's smallest boroughs",
    population: "~320",
    uniqueTrait: "One of PA's smallest incorporated boroughs"
  },
  riceville: {
    name: "Riceville",
    slug: "riceville",
    county: "Crawford County",
    zipCodes: ["16427"],
    nearbyComm: ["Meadville", "Cambridge Springs", "Venango"],
    landmarks: ["Rural hamlet", "Agricultural lands"],
    description: "Tiny rural hamlet",
    population: "~150",
    uniqueTrait: "Peaceful country living in farm country"
  },
  guysMills: {
    name: "Guys Mills",
    slug: "guys-mills",
    county: "Crawford County",
    zipCodes: ["16327"],
    nearbyComm: ["Meadville", "Blooming Valley", "Saegertown"],
    landmarks: ["Woodcock Creek Lake", "Rural crossroads", "Historic country store"],
    description: "Historic rural crossroads community",
    population: "~100",
    uniqueTrait: "Gateway to Woodcock Creek Lake"
  },

  // More Erie County Communities
  corry: {
    name: "Corry",
    slug: "corry",
    county: "Erie County",
    zipCodes: ["16407"],
    nearbyComm: ["Union City", "Columbus", "Spartansburg"],
    landmarks: ["Mead Avenue Historic District", "Corry Area Historical Society", "Wright Park"],
    description: "Third-largest city in Erie County with industrial heritage",
    population: "~6,600",
    uniqueTrait: "Once known as 'Edge Tool Capital of the World' with zipper manufacturing heritage"
  },
  albion: {
    name: "Albion",
    slug: "albion",
    county: "Erie County",
    zipCodes: ["16401"],
    nearbyComm: ["Cranberry Township", "Girard", "Conneaut OH"],
    landmarks: ["Downtown Albion Square", "Northwestern School District", "Albion Area Fair Grounds"],
    description: "Westernmost borough in Erie County near Ohio border",
    population: "~1,500",
    uniqueTrait: "Annual Albion Area Fair celebrating agricultural heritage"
  },
  mckean: {
    name: "McKean",
    slug: "mckean",
    county: "Erie County",
    zipCodes: ["16426", "16505"],
    nearbyComm: ["Edinboro", "Waterford", "Erie"],
    landmarks: ["McKean Township Municipal Building", "Lake Pleasant", "Route 99 Corridor"],
    description: "Growing township in southern Erie County",
    population: "~4,500",
    uniqueTrait: "Suburban township with Lake Pleasant recreation"
  },
  cranberryTownship: {
    name: "Cranberry Township",
    slug: "cranberry-township",
    county: "Erie County",
    zipCodes: ["16319"],
    nearbyComm: ["Albion", "Girard", "Meadville"],
    landmarks: ["Cranberry Mall", "Cranberry Township Park", "Route 18 Corridor"],
    description: "Growing residential township in western Erie County",
    population: "~7,000",
    uniqueTrait: "Fast-growing suburb with Northwestern School District"
  },
  lakeCity: {
    name: "Lake City",
    slug: "lake-city",
    county: "Erie County",
    zipCodes: ["16423"],
    nearbyComm: ["Girard", "Fairview", "Edinboro"],
    landmarks: ["Historic downtown Lake City", "Route 20 corridor", "Lake City Borough Park"],
    description: "Charming small borough in southwestern Erie County",
    population: "~2,900",
    uniqueTrait: "Small-town charm with Northwestern School District"
  },
  wattsburg: {
    name: "Wattsburg",
    slug: "wattsburg",
    county: "Erie County",
    zipCodes: ["16442"],
    nearbyComm: ["Erie", "Edinboro", "Union City"],
    landmarks: ["Wattsburg Area School District", "Downtown square", "Route 8 corridor"],
    description: "Small rural borough in southeastern Erie County",
    population: "~380",
    uniqueTrait: "Rural community with excellent Seneca High School"
  },
  unionCity: {
    name: "Union City",
    slug: "union-city",
    county: "Erie County",
    zipCodes: ["16438"],
    nearbyComm: ["Waterford", "Edinboro", "Corry"],
    landmarks: ["Union City Dam & Reservoir", "Downtown Union City", "Route 6/8 junction"],
    description: "Borough straddling Erie and Crawford county line",
    population: "~3,300",
    uniqueTrait: "Located in both Erie and Crawford counties"
  },
  lawrencePark: {
    name: "Lawrence Park",
    slug: "lawrence-park",
    county: "Erie County",
    zipCodes: ["16511"],
    nearbyComm: ["Erie", "Wesleyville", "Harborcreek"],
    landmarks: ["Buffalo Road Commercial Corridor", "East Erie neighborhoods", "Lake Erie proximity"],
    description: "Established residential borough in eastern Erie",
    population: "~3,900",
    uniqueTrait: "Strategic location on Buffalo Road commercial corridor"
  },

  // Additional Communities
  pittsfield: {
    name: "Pittsfield",
    slug: "pittsfield",
    county: "Warren County",
    zipCodes: ["16340"],
    nearbyComm: ["Youngsville", "Sugar Grove", "Columbus"],
    landmarks: ["Brokenstraw Creek", "Rural borough", "Agricultural area"],
    description: "Small rural borough along Brokenstraw Creek",
    population: "~230",
    uniqueTrait: "Peaceful agricultural area"
  },
  irvine: {
    name: "Irvine",
    slug: "irvine",
    county: "Warren County",
    zipCodes: ["16329"],
    nearbyComm: ["Warren", "Sheffield", "Clarendon"],
    landmarks: ["Allegheny River", "Irvine Borough Park", "Forest lands"],
    description: "Small Warren County borough along Allegheny River",
    population: "~600",
    uniqueTrait: "Allegheny River community surrounded by forest"
  },
  chandlersValley: {
    name: "Chandlers Valley",
    slug: "chandlers-valley",
    county: "Warren County",
    zipCodes: ["16312"],
    nearbyComm: ["Warren", "Clarendon", "Sugar Grove"],
    landmarks: ["Rural valley", "Allegheny National Forest proximity", "Remote countryside"],
    description: "Remote unincorporated community in forest region",
    population: "~100",
    uniqueTrait: "Remote forest community near Allegheny National Forest"
  }
};

export const getCommunityData = (slug: string): CommunityData | undefined => {
  return communityData[slug];
};

export const getNearbyLinks = (nearbyComm: string[]): Array<{ name: string; slug: string }> => {
  return nearbyComm.map(name => {
    const entry = Object.values(communityData).find(c => c.name === name);
    return entry ? { name: entry.name, slug: entry.slug } : { name, slug: name.toLowerCase().replace(/\s+/g, '-') };
  });
};