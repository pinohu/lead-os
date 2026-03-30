// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type PersonaType =
  | "expert"
  | "technician"
  | "advisor"
  | "educator"
  | "storyteller"
  | "local-authority";

export interface CreatorPersona {
  id: string;
  tenantId: string;
  name: string;
  type: PersonaType;
  niche: string;
  voiceTone: string;
  backstory: string;
  expertise: string[];
  contentStyle: string;
  catchphrases: string[];
  avatarDescription: string;
  trustSignals: string[];
}

export interface PersonaRecommendation {
  personaType: PersonaType;
  reason: string;
  confidence: number;
}

// ---------------------------------------------------------------------------
// In-memory store
// ---------------------------------------------------------------------------

const personaStore = new Map<string, CreatorPersona>();

function generateId(): string {
  return `persona-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

// ---------------------------------------------------------------------------
// Pre-built templates: 14 niches x 6 persona types
// ---------------------------------------------------------------------------

type NicheKey =
  | "real-estate"
  | "fitness"
  | "finance"
  | "coaching"
  | "health"
  | "ecommerce"
  | "saas"
  | "legal"
  | "construction"
  | "education"
  | "franchise"
  | "staffing"
  | "faith"
  | "creative";

type PersonaTemplate = Omit<CreatorPersona, "id" | "tenantId" | "niche">;

const PERSONA_TEMPLATES: Record<NicheKey, Record<PersonaType, PersonaTemplate>> = {
  "real-estate": {
    expert: {
      name: "Alex Morgan",
      type: "expert",
      voiceTone: "authoritative and direct",
      backstory: "Closed over 500 deals in 12 years across residential and commercial markets.",
      expertise: ["market analysis", "negotiation", "investment properties", "first-time buyers"],
      contentStyle: "Data-driven insights with clear action steps",
      catchphrases: ["The numbers never lie.", "Buy the neighborhood, not just the house."],
      avatarDescription: "Professional headshot in blazer, confident posture",
      trustSignals: ["Licensed Realtor since 2012", "Top 1% producer", "$200M in closed deals"],
    },
    technician: {
      name: "Jordan Lee",
      type: "technician",
      voiceTone: "precise and methodical",
      backstory: "Former property appraiser turned buyer's agent with deep valuation expertise.",
      expertise: ["property valuation", "inspection analysis", "zoning laws", "title issues"],
      contentStyle: "Step-by-step breakdowns with checklists",
      catchphrases: ["Always inspect the foundation first.", "Details make or break a deal."],
      avatarDescription: "Casual professional with blueprint or property documents",
      trustSignals: ["Certified Appraiser", "10 years valuation experience"],
    },
    advisor: {
      name: "Sam Rivera",
      type: "advisor",
      voiceTone: "warm, consultative",
      backstory:
        "Helped 300+ families navigate their first home purchase with zero stress and zero surprises.",
      expertise: ["buyer strategy", "financing options", "neighborhood selection", "relocation"],
      contentStyle: "Question-led content that uncovers client goals",
      catchphrases: ["Your home should fit your life.", "Let us make this simple."],
      avatarDescription: "Approachable smile, home office background",
      trustSignals: ["300+ families served", "5-star reviews on Zillow", "No-pressure process"],
    },
    educator: {
      name: "Chris Patel",
      type: "educator",
      voiceTone: "clear and patient",
      backstory: "Taught real estate investing workshops to 5,000+ students online.",
      expertise: ["real estate fundamentals", "investing 101", "cash flow analysis", "BRRRR method"],
      contentStyle: "Explainer videos with graphics and analogies",
      catchphrases: ["If I can explain it simply, you can act on it.", "Knowledge is leverage."],
      avatarDescription: "Teaching pose with whiteboard or slides visible",
      trustSignals: ["5,000+ students taught", "Author of 'Real Estate Made Simple'"],
    },
    storyteller: {
      name: "Riley Chen",
      type: "storyteller",
      voiceTone: "relatable and engaging",
      backstory:
        "Bought my first property at 24 with just $5k down. Now I help others do the same.",
      expertise: ["low down payment strategies", "house hacking", "creative financing"],
      contentStyle: "Personal narratives tied to practical lessons",
      catchphrases: ["I made this mistake so you do not have to.", "Your story starts with a key."],
      avatarDescription: "Candid lifestyle photo at a property or coffee shop",
      trustSignals: ["Personal investor journey documented publicly", "Community of 20k followers"],
    },
    "local-authority": {
      name: "Taylor Brooks",
      type: "local-authority",
      voiceTone: "community-focused and proud",
      backstory: "Born and raised locally. Knows every street, school, and hidden gem in the area.",
      expertise: ["local market trends", "neighborhood insights", "school districts", "commute routes"],
      contentStyle: "Local market reports and neighborhood tours",
      catchphrases: ["This is my city — I know every corner.", "Hyperlocal knowledge, real results."],
      avatarDescription: "Out in the community, recognizable local landmarks in background",
      trustSignals: ["Born and raised locally", "50+ local transactions", "Community board member"],
    },
  },
  fitness: {
    expert: {
      name: "Dr. Marcus Webb",
      type: "expert",
      voiceTone: "scientific and credible",
      backstory: "Exercise physiologist with a PhD and 15 years of applied sports science research.",
      expertise: ["periodization", "VO2 max training", "body composition", "injury prevention"],
      contentStyle: "Research-backed frameworks with practical protocols",
      catchphrases: ["Science says, your body responds.", "Train with evidence, not emotion."],
      avatarDescription: "Lab or gym setting, professional attire",
      trustSignals: ["PhD Exercise Physiology", "15 peer-reviewed publications", "NSCA certified"],
    },
    technician: {
      name: "Casey Flynn",
      type: "technician",
      voiceTone: "detailed and instructional",
      backstory: "Certified strength coach specializing in biomechanics and movement quality.",
      expertise: ["movement assessment", "form correction", "programming design", "mobility"],
      contentStyle: "Form breakdowns and technique drills",
      catchphrases: ["Form first, weight second.", "Move better, perform better."],
      avatarDescription: "In gym, demonstrating technique",
      trustSignals: ["CSCS certified", "Used by pro athletes", "10k+ successful form corrections"],
    },
    advisor: {
      name: "Morgan Ellis",
      type: "advisor",
      voiceTone: "supportive and personalized",
      backstory:
        "Online coach who has helped 1,000+ clients reach their goals with sustainable habits.",
      expertise: ["habit formation", "accountability", "lifestyle fitness", "nutrition basics"],
      contentStyle: "Client transformation stories and habit frameworks",
      catchphrases: [
        "Progress over perfection, always.",
        "Sustainable beats extreme every time.",
      ],
      avatarDescription: "Warm, approachable, before-after transformation context",
      trustSignals: ["1,000+ transformations", "Featured in Shape Magazine"],
    },
    educator: {
      name: "Jamie Russo",
      type: "educator",
      voiceTone: "enthusiastic and clear",
      backstory: "Fitness educator dedicated to demystifying nutrition and exercise for beginners.",
      expertise: ["nutrition fundamentals", "beginner programming", "sleep optimization", "stress"],
      contentStyle: "Myth-busting and explainer content",
      catchphrases: ["Let us cut through the noise.", "Simple beats complex."],
      avatarDescription: "Clean background, educational props",
      trustSignals: ["50k YouTube subscribers", "Certified Nutritionist", "Free course library"],
    },
    storyteller: {
      name: "Avery Kim",
      type: "storyteller",
      voiceTone: "vulnerable and motivational",
      backstory: "Lost 80 pounds after years of failed diets. Now coaches others from lived experience.",
      expertise: ["weight loss mindset", "emotional eating", "sustainable habits"],
      contentStyle: "Raw personal story woven with actionable lessons",
      catchphrases: ["I have been exactly where you are.", "Your body is not the enemy."],
      avatarDescription: "Authentic candid shots, relatable environments",
      trustSignals: ["Personal journey documented", "Community of 30k", "Certified life coach"],
    },
    "local-authority": {
      name: "Devon Price",
      type: "local-authority",
      voiceTone: "community-driven",
      backstory: "Own a local gym and lead weekend outdoor fitness groups in the community.",
      expertise: ["group fitness", "outdoor training", "community wellness", "local events"],
      contentStyle: "Local event coverage and community challenge content",
      catchphrases: ["Fitness is better together.", "Your neighborhood gym, your community."],
      avatarDescription: "Group shot outdoors or in the local gym",
      trustSignals: ["Local gym owner 8 years", "500+ local members", "City wellness ambassador"],
    },
  },
  finance: {
    expert: {
      name: "Victoria Grant",
      type: "expert",
      voiceTone: "precise and authoritative",
      backstory: "Former Goldman Sachs analyst turned independent wealth strategist.",
      expertise: ["portfolio construction", "tax optimization", "estate planning", "alternatives"],
      contentStyle: "Deep-dive analysis with concrete data",
      catchphrases: ["Wealth is built in spreadsheets, not headlines.", "Optimize every dollar."],
      avatarDescription: "Polished professional in financial district setting",
      trustSignals: ["CFA charterholder", "15 years Wall Street", "$500M AUM managed"],
    },
    technician: {
      name: "Nathan Cruz",
      type: "technician",
      voiceTone: "methodical",
      backstory: "CPA specializing in tax strategy for entrepreneurs and investors.",
      expertise: ["tax planning", "entity structures", "depreciation", "1031 exchanges"],
      contentStyle: "Step-by-step walkthroughs of complex strategies",
      catchphrases: ["Every dollar saved in taxes is a dollar compounding.", "Know the code."],
      avatarDescription: "Office setting with charts and tax forms",
      trustSignals: ["CPA, 12 years", "Saved clients $10M+ in taxes", "IRS Enrolled Agent"],
    },
    advisor: {
      name: "Priya Nair",
      type: "advisor",
      voiceTone: "empathetic and straightforward",
      backstory: "Fee-only financial planner helping families build real security without jargon.",
      expertise: ["financial planning", "retirement", "debt payoff", "insurance review"],
      contentStyle: "Plain-English advice tied to real family scenarios",
      catchphrases: ["A plan beats a product every time.", "You deserve to understand your money."],
      avatarDescription: "Welcoming, home office or cafe setting",
      trustSignals: ["CFP certified", "Fee-only fiduciary", "500+ financial plans delivered"],
    },
    educator: {
      name: "Isaiah Turner",
      type: "educator",
      voiceTone: "accessible and engaging",
      backstory:
        "Built a personal finance YouTube channel from scratch to teach money skills schools never taught.",
      expertise: ["budgeting", "investing basics", "credit building", "emergency fund"],
      contentStyle: "Animated explainers and beginner-friendly frameworks",
      catchphrases: ["Money is a skill, not a talent.", "Start with $1 if that is all you have."],
      avatarDescription: "Casual, energetic, whiteboard or animation style",
      trustSignals: ["500k YouTube subscribers", "Free budgeting course with 100k completions"],
    },
    storyteller: {
      name: "Brianna Hayes",
      type: "storyteller",
      voiceTone: "honest and relatable",
      backstory: "Went from $80k in debt to financially free in 5 years. Documenting every step.",
      expertise: ["debt payoff", "side income", "frugal living", "financial independence"],
      contentStyle: "Transparent monthly money updates and lessons learned",
      catchphrases: [
        "I owe you the whole truth, not just the wins.",
        "Debt free is the new rich.",
      ],
      avatarDescription: "Relatable everyday setting, authentic",
      trustSignals: ["Debt payoff journey public since 2020", "Community of 50k"],
    },
    "local-authority": {
      name: "Leo Santos",
      type: "local-authority",
      voiceTone: "trusted neighbor tone",
      backstory:
        "Local financial advisor serving the community for 20 years. Everyone knows Leo.",
      expertise: ["local business finance", "community banking", "SBA loans", "retirement local plans"],
      contentStyle: "Community Q&A, local business spotlights, events",
      catchphrases: [
        "Your neighbor, your advisor.",
        "I am invested in this community like you are.",
      ],
      avatarDescription: "Community event, local business context",
      trustSignals: [
        "20 years local practice",
        "Chamber of Commerce board member",
        "BBB A+ rated",
      ],
    },
  },
  coaching: {
    expert: {
      name: "Dr. Simone Park",
      type: "expert",
      voiceTone: "research-grounded and inspiring",
      backstory: "Organizational psychologist turned executive coach with Fortune 500 clients.",
      expertise: ["leadership development", "executive presence", "team dynamics", "performance psychology"],
      contentStyle: "Frameworks with academic backing and case studies",
      catchphrases: ["Leadership is a skill, not a title.", "Behavior shapes culture."],
      avatarDescription: "Professional, conference or corporate environment",
      trustSignals: ["PhD Organizational Psychology", "Coached 200+ executives", "Harvard extension faculty"],
    },
    technician: {
      name: "Hunter Mills",
      type: "technician",
      voiceTone: "structured and systematic",
      backstory: "Productivity coach who built a methodology used by 10,000+ clients.",
      expertise: ["time blocking", "systems design", "goal frameworks", "habit stacking"],
      contentStyle: "Template walkthroughs and system demonstrations",
      catchphrases: ["Systems beat willpower.", "Design your day or someone else will."],
      avatarDescription: "Clean desk, digital tools visible",
      trustSignals: ["Designed 5 proprietary productivity frameworks", "Featured in Forbes"],
    },
    advisor: {
      name: "Stella Vance",
      type: "advisor",
      voiceTone: "empathetic and direct",
      backstory:
        "Life and business coach helping overwhelmed entrepreneurs clarify and execute their vision.",
      expertise: ["business clarity", "mindset", "decision-making", "work-life integration"],
      contentStyle: "Coaching conversations and client success spotlights",
      catchphrases: ["Clarity is the strategy.", "You do not need more time, you need a decision."],
      avatarDescription: "Welcoming, natural light, approachable setting",
      trustSignals: ["ICF certified", "400+ clients", "Certified professional coach"],
    },
    educator: {
      name: "Omar Rashid",
      type: "educator",
      voiceTone: "clear and motivational",
      backstory: "Built a coaching education platform teaching coaches how to build their practice.",
      expertise: ["coaching methodology", "client acquisition", "pricing", "program design"],
      contentStyle: "How-to guides and course-style content",
      catchphrases: ["Teach what you know, earn what you deserve.", "Coaching is a business."],
      avatarDescription: "Educational, course-style backdrop",
      trustSignals: ["Trained 2,000+ coaches", "Certified coach trainer"],
    },
    storyteller: {
      name: "Camille Foster",
      type: "storyteller",
      voiceTone: "vulnerable and empowering",
      backstory:
        "Burned out corporate executive who rebuilt her life through coaching and now helps others do the same.",
      expertise: ["burnout recovery", "career transitions", "identity", "reinvention"],
      contentStyle: "Personal story arcs with transformation themes",
      catchphrases: ["The breakdown was the breakthrough.", "You are not starting over, you are starting fresh."],
      avatarDescription: "Candid, natural, real-life moments",
      trustSignals: ["Personal story documented publicly", "Community of 40k", "TEDx speaker"],
    },
    "local-authority": {
      name: "Marcus Bell",
      type: "local-authority",
      voiceTone: "grounded and community-focused",
      backstory: "Local entrepreneur and business coach known for turning around local businesses.",
      expertise: ["local business growth", "community entrepreneurship", "mentorship", "small business"],
      contentStyle: "Local success stories, community spotlights, live workshops",
      catchphrases: [
        "Your city needs your business to succeed.",
        "Local mentorship changes communities.",
      ],
      avatarDescription: "Out in the community, local business context",
      trustSignals: ["20+ local businesses mentored", "Local business of the year award"],
    },
  },
  health: {
    expert: {
      name: "Dr. Alicia Howe",
      type: "expert",
      voiceTone: "clinical and trustworthy",
      backstory: "Board-certified physician with a focus on functional and preventive medicine.",
      expertise: ["preventive care", "metabolic health", "lab interpretation", "longevity protocols"],
      contentStyle: "Clinical insights translated into actionable lifestyle guidance",
      catchphrases: ["Test, do not guess.", "Prevention is the highest form of medicine."],
      avatarDescription: "White coat, clean clinical setting",
      trustSignals: ["MD, Board Certified", "15 years clinical practice", "Published researcher"],
    },
    technician: {
      name: "Tyler Marsh",
      type: "technician",
      voiceTone: "precise",
      backstory: "Registered dietitian specializing in medical nutrition therapy.",
      expertise: ["macros", "micronutrients", "supplement protocols", "meal planning"],
      contentStyle: "Nutrient deep dives and protocol walkthroughs",
      catchphrases: ["Food is information for your cells.", "Precision nutrition changes outcomes."],
      avatarDescription: "Kitchen or clinical setting",
      trustSignals: ["RD credential", "Specialized in metabolic health", "10 years clinical nutrition"],
    },
    advisor: {
      name: "Grace Li",
      type: "advisor",
      voiceTone: "compassionate and personalized",
      backstory:
        "Health coach helping busy professionals reverse lifestyle diseases without extreme changes.",
      expertise: ["stress management", "sleep", "nutrition basics", "sustainable wellness"],
      contentStyle: "Client Q&A, protocol recommendations, personalized tips",
      catchphrases: ["Your health is your most valuable asset.", "Small consistent wins compound."],
      avatarDescription: "Calm, wellness-inspired setting",
      trustSignals: ["NBC-HWC certified", "500+ clients", "Featured in Healthline"],
    },
    educator: {
      name: "Felix Odom",
      type: "educator",
      voiceTone: "enthusiastic and myth-busting",
      backstory: "Health journalist turned educator, exposing wellness myths and teaching real science.",
      expertise: ["health literacy", "supplement myths", "gut health", "immune system"],
      contentStyle: "Myth vs. fact series and explainer videos",
      catchphrases: ["Wellness should not be confusing.", "Science first, trends second."],
      avatarDescription: "Studio educational setting",
      trustSignals: ["10 years health journalism", "100k subscribers", "Peer-reviewed fact-checker"],
    },
    storyteller: {
      name: "Natalie Reyes",
      type: "storyteller",
      voiceTone: "personal and hopeful",
      backstory:
        "Reversed autoimmune condition through lifestyle changes after conventional medicine had no answers.",
      expertise: ["autoimmune healing", "anti-inflammatory lifestyle", "integrative health"],
      contentStyle: "Personal healing narrative with evidence-based lessons",
      catchphrases: [
        "I chose to believe healing was possible.",
        "Your body wants to heal — help it.",
      ],
      avatarDescription: "Authentic, natural setting showing vitality",
      trustSignals: ["Documented healing journey", "Community of 25k", "Integrative health certified"],
    },
    "local-authority": {
      name: "Sandra West",
      type: "local-authority",
      voiceTone: "community health champion",
      backstory: "Public health nurse running community wellness programs for 15 years.",
      expertise: ["community health", "preventive screenings", "local wellness resources", "health equity"],
      contentStyle: "Local health event coverage and community wellness tips",
      catchphrases: ["Healthy communities start with healthy neighbors.", "Let us take care of our own."],
      avatarDescription: "Community clinic or local event setting",
      trustSignals: ["RN, 15 years community health", "City health department partner"],
    },
  },
  ecommerce: {
    expert: {
      name: "Ryan Zhao",
      type: "expert",
      voiceTone: "strategic and results-driven",
      backstory: "Scaled 3 DTC brands to 8-figures. Now advises ecommerce founders on growth levers.",
      expertise: ["DTC growth", "paid acquisition", "LTV optimization", "retention strategy"],
      contentStyle: "Case studies and growth playbooks",
      catchphrases: ["CAC:LTV is the only metric that matters.", "Retention beats acquisition."],
      avatarDescription: "Modern workspace, brand assets visible",
      trustSignals: ["3 x 8-figure exits", "Advisor to 20+ DTC brands"],
    },
    technician: {
      name: "Kira Stone",
      type: "technician",
      voiceTone: "detailed and procedural",
      backstory:
        "Ecommerce operations specialist who has set up 100+ Shopify stores and optimized fulfillment.",
      expertise: ["Shopify setup", "fulfillment optimization", "inventory management", "CRO"],
      contentStyle: "Technical walkthroughs and setup tutorials",
      catchphrases: ["Operations are the backbone of profit.", "Automate the repetitive, personalize the important."],
      avatarDescription: "Tech setup with Shopify dashboard visible",
      trustSignals: ["100+ stores optimized", "Shopify Partner certified"],
    },
    advisor: {
      name: "Jade Monroe",
      type: "advisor",
      voiceTone: "supportive and strategic",
      backstory: "Ecommerce consultant helping small brands compete with large players through brand clarity.",
      expertise: ["brand positioning", "product launches", "customer experience", "pricing strategy"],
      contentStyle: "Brand audits and strategic recommendations",
      catchphrases: ["Your brand is your moat.", "Compete on identity, not price."],
      avatarDescription: "Creative studio, brand mood board visible",
      trustSignals: ["50+ brands advised", "Featured in Shopify blog"],
    },
    educator: {
      name: "Carlos Diaz",
      type: "educator",
      voiceTone: "practical and motivating",
      backstory:
        "Went from $0 to $1M in ecommerce revenue in 18 months, documented the whole journey.",
      expertise: ["product research", "supplier sourcing", "ads strategy", "scaling operations"],
      contentStyle: "Course-style step-by-step launch guides",
      catchphrases: ["Speed of execution is your edge.", "The market rewards action takers."],
      avatarDescription: "Casual educational setting with data screens",
      trustSignals: ["$1M journey documented", "Course taught 5,000+ students"],
    },
    storyteller: {
      name: "Mia Walsh",
      type: "storyteller",
      voiceTone: "authentic and inspiring",
      backstory:
        "Single mom who built a six-figure handmade goods brand from her kitchen table.",
      expertise: ["handmade product business", "Etsy to DTC transition", "brand story", "community building"],
      contentStyle: "Behind-the-scenes and business journey storytelling",
      catchphrases: [
        "Built this with my own hands, one order at a time.",
        "Your story sells the product.",
      ],
      avatarDescription: "Authentic workspace showing handmade products",
      trustSignals: ["6-figure revenue documented", "Community of 15k makers"],
    },
    "local-authority": {
      name: "Hank Morrison",
      type: "local-authority",
      voiceTone: "proud local business owner",
      backstory:
        "Third-generation local retailer who took the family business online and doubled revenue.",
      expertise: ["local to online transition", "community retail", "local SEO", "omnichannel"],
      contentStyle: "Local business success stories and community commerce content",
      catchphrases: [
        "Shop local, think global.",
        "We have been serving this community for 60 years.",
      ],
      avatarDescription: "In the local store, community-focused imagery",
      trustSignals: ["60 year family business", "200+ 5-star local reviews"],
    },
  },
  saas: {
    expert: {
      name: "Elena Marsh",
      type: "expert",
      voiceTone: "strategic and data-driven",
      backstory: "Former VP of Growth at two SaaS unicorns, now advising founders on go-to-market.",
      expertise: ["PLG strategy", "pricing models", "ARR expansion", "churn analysis"],
      contentStyle: "Deep GTM teardowns and growth frameworks",
      catchphrases: [
        "Distribution is the product.",
        "The best SaaS companies are media companies.",
      ],
      avatarDescription: "Modern tech office, confident",
      trustSignals: ["VP Growth at 2 unicorns", "Advisor to 30+ SaaS companies", "10k LinkedIn followers"],
    },
    technician: {
      name: "Sanjay Patel",
      type: "technician",
      voiceTone: "technical and thorough",
      backstory: "Full-stack developer who has built and sold 4 SaaS products.",
      expertise: ["SaaS architecture", "onboarding flows", "API design", "performance optimization"],
      contentStyle: "Code walkthroughs and architecture deep dives",
      catchphrases: ["Ship fast, but ship right.", "Great onboarding reduces churn more than features."],
      avatarDescription: "Coding setup, IDE visible",
      trustSignals: ["4 products built and sold", "Open source contributor", "10M+ users served"],
    },
    advisor: {
      name: "Claire Donovan",
      type: "advisor",
      voiceTone: "customer-focused and strategic",
      backstory:
        "Customer success leader who reduced churn by 40% across multiple SaaS companies.",
      expertise: ["customer success", "onboarding", "NPS improvement", "expansion revenue"],
      contentStyle: "Customer journey frameworks and retention playbooks",
      catchphrases: [
        "Retention is a revenue strategy.",
        "Your best sales rep is a happy customer.",
      ],
      avatarDescription: "Collaborative workspace, customer-focused materials",
      trustSignals: ["40% churn reduction results", "CS leader at 3 SaaS companies"],
    },
    educator: {
      name: "Derek Lim",
      type: "educator",
      voiceTone: "accessible and encouraging",
      backstory:
        "Bootstrapped three SaaS products while documenting every step for aspiring founders.",
      expertise: ["SaaS validation", "no-code SaaS", "solo founder", "launch strategy"],
      contentStyle: "Build-in-public content and founder education",
      catchphrases: ["You do not need a team to start.", "Validate before you build."],
      avatarDescription: "Home office, building something visible on screen",
      trustSignals: ["3 bootstrapped SaaS products", "Build-in-public community of 20k"],
    },
    storyteller: {
      name: "Keisha Roberts",
      type: "storyteller",
      voiceTone: "honest and transparent",
      backstory:
        "Took a SaaS from $0 to $50k MRR and documented every failure and success publicly.",
      expertise: ["early stage growth", "founder mindset", "product-market fit", "fundraising reality"],
      contentStyle: "Monthly public revenue updates and raw founder reflections",
      catchphrases: ["Here is what the highlight reel does not show.", "Failing publicly is underrated."],
      avatarDescription: "Candid, real founder environment",
      trustSignals: ["$50k MRR documented journey", "Community of 35k SaaS builders"],
    },
    "local-authority": {
      name: "Tobias Green",
      type: "local-authority",
      voiceTone: "community-oriented tech builder",
      backstory:
        "Built a SaaS specifically for local service businesses in the region. Know every customer personally.",
      expertise: ["local SaaS", "niche vertical software", "community-based GTM", "word-of-mouth growth"],
      contentStyle: "Customer spotlights and local tech community content",
      catchphrases: ["Built for us, by one of us.", "Software that knows your industry because I lived it."],
      avatarDescription: "Local tech meetup or co-working space",
      trustSignals: ["200+ local business customers", "Regional tech award winner"],
    },
  },
  legal: {
    expert: {
      name: "Diane Forte",
      type: "expert",
      voiceTone: "authoritative and precise",
      backstory: "Partner-level attorney with 20 years of practice in business and contract law.",
      expertise: ["business contracts", "corporate structure", "IP protection", "litigation strategy"],
      contentStyle: "Legal analysis translated into business strategy",
      catchphrases: ["Your contract is your protection.", "The most expensive legal advice is none."],
      avatarDescription: "Law office, professional attire",
      trustSignals: ["20 years practice", "Bar certified in 3 states", "Super Lawyers designation"],
    },
    technician: {
      name: "Marcus Webb",
      type: "technician",
      voiceTone: "step-by-step and procedural",
      backstory: "Business attorney specializing in startup formation and compliance procedures.",
      expertise: ["LLC formation", "compliance checklists", "regulatory filings", "trademark registration"],
      contentStyle: "Legal how-to guides and filing walkthroughs",
      catchphrases: ["Get the structure right the first time.", "Compliance is not optional."],
      avatarDescription: "Organized office with legal documents",
      trustSignals: ["500+ businesses formed", "LegalZoom featured partner"],
    },
    advisor: {
      name: "Sophie Laurent",
      type: "advisor",
      voiceTone: "protective and strategic",
      backstory: "Business attorney who focuses on helping entrepreneurs avoid the legal landmines that kill companies.",
      expertise: ["legal risk assessment", "founder agreements", "partnership disputes", "contract review"],
      contentStyle: "Scenario-based advice and risk education",
      catchphrases: ["Know your risks before they become your problems.", "A handshake is not a contract."],
      avatarDescription: "Approachable but professional, consultation setting",
      trustSignals: ["300+ entrepreneurs advised", "Saved clients $5M in avoidable legal costs"],
    },
    educator: {
      name: "Jerome King",
      type: "educator",
      voiceTone: "accessible and empowering",
      backstory:
        "Attorney who believes everyone should understand their basic legal rights and built a channel to prove it.",
      expertise: ["legal basics", "tenant rights", "consumer law", "small business law 101"],
      contentStyle: "Plain-English legal explainers and myth-busting",
      catchphrases: ["Legal literacy is power.", "You do not need a lawyer to understand your rights."],
      avatarDescription: "Educational studio setup",
      trustSignals: ["200k YouTube subscribers", "Free legal basics course", "Bar certified"],
    },
    storyteller: {
      name: "Alexis Bond",
      type: "storyteller",
      voiceTone: "honest and cautionary",
      backstory:
        "Lost my first business to a legal dispute I did not see coming. Now I teach others to avoid my mistakes.",
      expertise: ["business dissolution", "contract disputes", "partnership breakdowns", "recovery"],
      contentStyle: "War story narratives with practical lessons",
      catchphrases: [
        "I paid for this lesson so you do not have to.",
        "Every legal mistake has a warning sign.",
      ],
      avatarDescription: "Candid, reflective setting",
      trustSignals: ["Personal business survival story", "Community of 10k founders"],
    },
    "local-authority": {
      name: "Patricia Owens",
      type: "local-authority",
      voiceTone: "trusted community attorney",
      backstory: "Local attorney serving the business community for 25 years. Knows every local regulation.",
      expertise: ["local business law", "zoning", "municipal compliance", "local licensing"],
      contentStyle: "Local regulation updates, community business Q&A",
      catchphrases: [
        "I know this city's laws because I have lived them.",
        "Your local attorney is your first line of defense.",
      ],
      avatarDescription: "Local community setting, recognizable",
      trustSignals: ["25 years local practice", "Local bar association president", "BBB member"],
    },
  },
  construction: {
    expert: {
      name: "Mike Harmon",
      type: "expert",
      voiceTone: "authoritative and practical",
      backstory: "Licensed general contractor with 25 years building residential and commercial projects across the Southeast.",
      expertise: ["project estimation", "code compliance", "subcontractor management", "value engineering"],
      contentStyle: "Job-site lessons backed by hard numbers and real bids",
      catchphrases: ["Measure twice, bid once.", "The cheapest contractor is the most expensive mistake."],
      avatarDescription: "Hard hat and blueprints, active job-site background",
      trustSignals: ["Licensed GC 25 years", "500+ projects completed", "$150M in delivered work"],
    },
    technician: {
      name: "Dana Kowalski",
      type: "technician",
      voiceTone: "detailed and safety-focused",
      backstory: "Former OSHA inspector turned construction safety consultant and project scheduler.",
      expertise: ["safety compliance", "scheduling software", "punch-list management", "material takeoffs"],
      contentStyle: "Step-by-step SOPs and inspection checklists",
      catchphrases: ["If it is not documented, it did not happen.", "Safety is a system, not a slogan."],
      avatarDescription: "High-vis vest, clipboard in hand, organized job trailer",
      trustSignals: ["OSHA 30 certified", "Zero lost-time incidents on 200+ projects"],
    },
    advisor: {
      name: "Rosa Medina",
      type: "advisor",
      voiceTone: "consultative and solution-oriented",
      backstory: "Construction business consultant who has helped 150+ contractors scale from one crew to multi-crew operations.",
      expertise: ["business scaling", "cash flow management", "bid strategy", "client relations"],
      contentStyle: "Client scenario breakdowns with clear next steps",
      catchphrases: ["A full pipeline means nothing if cash flow is broken.", "Grow the business, not just the backlog."],
      avatarDescription: "Professional office with project boards visible",
      trustSignals: ["150+ contractors coached", "Average client revenue growth 40%", "AGC member"],
    },
    educator: {
      name: "Troy Jennings",
      type: "educator",
      voiceTone: "hands-on and encouraging",
      backstory: "Trade school instructor and YouTuber teaching the next generation of builders essential skills.",
      expertise: ["trade skills fundamentals", "apprenticeship programs", "tool mastery", "blueprint reading"],
      contentStyle: "On-site demonstrations and how-to tutorials",
      catchphrases: ["The trades built this country and they will build your career.", "Learn the fundamentals, master the craft."],
      avatarDescription: "Workshop setting with tools and teaching aids",
      trustSignals: ["15 years trade education", "4,000+ apprentices trained", "75k YouTube subscribers"],
    },
    storyteller: {
      name: "Jake Sutherland",
      type: "storyteller",
      voiceTone: "gritty and motivational",
      backstory: "Started as a laborer at 18, now owns a multimillion-dollar contracting firm. Documents the journey raw.",
      expertise: ["bootstrapping a trades business", "crew leadership", "overcoming setbacks", "bidding wars"],
      contentStyle: "Raw job-site stories tied to business lessons",
      catchphrases: ["I built this company with calloused hands and a calculator.", "Every slab starts with showing up."],
      avatarDescription: "Candid job-site photo, dusty boots, real environment",
      trustSignals: ["Built company from $0 to $5M documented", "Community of 30k tradespeople"],
    },
    "local-authority": {
      name: "Carla Briggs",
      type: "local-authority",
      voiceTone: "community-proud and dependable",
      backstory: "Third-generation local builder. Her family has shaped the skyline of the region for 60 years.",
      expertise: ["local building codes", "municipal permitting", "community development", "historical renovation"],
      contentStyle: "Local project showcases and code-update bulletins",
      catchphrases: ["We do not just build structures, we build this community.", "Permit first, pour second."],
      avatarDescription: "Standing in front of a recognized local project",
      trustSignals: ["60-year family legacy", "200+ local projects", "City planning board advisor"],
    },
  },
  education: {
    expert: {
      name: "Dr. Lorraine Ames",
      type: "expert",
      voiceTone: "research-driven and articulate",
      backstory: "Former school superintendent with a doctorate in educational leadership and 20 years in K-12 administration.",
      expertise: ["curriculum design", "accreditation", "student outcomes", "institutional strategy"],
      contentStyle: "Data-backed policy analysis and best-practice frameworks",
      catchphrases: ["Outcomes are the only metric that matters.", "Great schools are engineered, not accidental."],
      avatarDescription: "Academic setting, professional attire, library background",
      trustSignals: ["EdD Educational Leadership", "20 years K-12 admin", "3 schools turned around"],
    },
    technician: {
      name: "Kevin Tran",
      type: "technician",
      voiceTone: "systematic and resourceful",
      backstory: "EdTech integration specialist who has deployed LMS platforms and digital classrooms across 50+ schools.",
      expertise: ["LMS deployment", "digital classroom setup", "data dashboards", "accessibility compliance"],
      contentStyle: "Platform walkthroughs and integration tutorials",
      catchphrases: ["Technology should simplify teaching, not complicate it.", "Configure once, teach forever."],
      avatarDescription: "Tech lab with screens showing LMS dashboards",
      trustSignals: ["50+ school deployments", "Google Certified Educator", "ISTE presenter"],
    },
    advisor: {
      name: "Maria Sandoval",
      type: "advisor",
      voiceTone: "empathetic and strategic",
      backstory: "Enrollment and retention consultant helping schools and training programs fill seats and keep students engaged.",
      expertise: ["enrollment strategy", "student retention", "program marketing", "financial aid guidance"],
      contentStyle: "Consultation-style advice with enrollment funnel breakdowns",
      catchphrases: ["Enrollment starts with trust, retention starts with results.", "Every empty seat is a missed mission."],
      avatarDescription: "Welcoming campus office, student success materials visible",
      trustSignals: ["300+ programs advised", "Average enrollment lift 25%", "NACAC member"],
    },
    educator: {
      name: "Professor David Osei",
      type: "educator",
      voiceTone: "passionate and accessible",
      backstory: "Award-winning professor who built an open-access online course library reaching 100k learners worldwide.",
      expertise: ["instructional design", "online pedagogy", "learner engagement", "assessment design"],
      contentStyle: "Lesson design breakdowns and teaching methodology explainers",
      catchphrases: ["If students are not learning, we are not teaching.", "Engagement is the prerequisite to education."],
      avatarDescription: "Lecture hall or recording studio, educational props",
      trustSignals: ["100k online learners", "National teaching excellence award", "Open courseware pioneer"],
    },
    storyteller: {
      name: "Jasmine Cole",
      type: "storyteller",
      voiceTone: "inspiring and personal",
      backstory: "First-generation college student who became a school founder. Documents the mission to close opportunity gaps.",
      expertise: ["school founding journey", "equity in education", "community partnerships", "fundraising"],
      contentStyle: "Mission-driven narratives with student success spotlights",
      catchphrases: ["Every child deserves a school that believes in them.", "I built the school I wish I had."],
      avatarDescription: "Candid shot with students or at a community event",
      trustSignals: ["Founded charter school serving 400 students", "Community of 20k educators"],
    },
    "local-authority": {
      name: "Principal Ray Dalton",
      type: "local-authority",
      voiceTone: "trusted and community-centered",
      backstory: "Beloved local principal for 18 years. Parents, alumni, and staff trust his vision for the community's children.",
      expertise: ["local school improvement", "parent engagement", "community partnerships", "district advocacy"],
      contentStyle: "Community updates, parent Q&A, and local education news",
      catchphrases: ["This school belongs to this community.", "Our kids, our mission, our future."],
      avatarDescription: "School entrance, surrounded by students and staff",
      trustSignals: ["18 years local principal", "PTA partnership award", "District leader of the year"],
    },
  },
  franchise: {
    expert: {
      name: "Grant Holloway",
      type: "expert",
      voiceTone: "strategic and systems-minded",
      backstory: "Franchise development executive who has launched 12 franchise brands and opened 800+ units nationally.",
      expertise: ["franchise development", "FDD compliance", "unit economics", "multi-unit scaling"],
      contentStyle: "Franchise growth blueprints and unit-level P&L analysis",
      catchphrases: ["A franchise is a system, not a store.", "Scale the system and the units follow."],
      avatarDescription: "Corporate setting, franchise map on wall",
      trustSignals: ["800+ units launched", "12 brands developed", "IFA board member"],
    },
    technician: {
      name: "Lisa Brennan",
      type: "technician",
      voiceTone: "process-oriented and thorough",
      backstory: "Franchise operations manager who built the playbooks behind three nationally recognized franchise systems.",
      expertise: ["operations manuals", "training systems", "quality audits", "technology stack rollout"],
      contentStyle: "SOP deep dives and compliance checklists",
      catchphrases: ["The manual is the brand.", "Consistency is the franchise promise."],
      avatarDescription: "Office with binders, checklists, and training screens",
      trustSignals: ["Built ops for 3 national brands", "Certified Franchise Executive"],
    },
    advisor: {
      name: "Derek Simmons",
      type: "advisor",
      voiceTone: "candid and protective",
      backstory: "Franchise attorney and consultant who has reviewed 500+ FDDs and advises prospective franchisees on due diligence.",
      expertise: ["FDD review", "franchise selection", "territory analysis", "exit strategy"],
      contentStyle: "Due-diligence frameworks and red-flag spotlights",
      catchphrases: ["Read the FDD before you sign the check.", "The best franchise is the one that fits your life."],
      avatarDescription: "Professional consultation setting, documents on desk",
      trustSignals: ["500+ FDDs reviewed", "Saved clients $10M in bad investments", "Franchise attorney 15 years"],
    },
    educator: {
      name: "Tanya Ruiz",
      type: "educator",
      voiceTone: "clear and empowering",
      backstory: "Former multi-unit franchisee turned educator, teaching aspiring owners how to evaluate, buy, and operate franchises.",
      expertise: ["franchise evaluation", "financing options", "owner-operator transition", "multi-unit management"],
      contentStyle: "Course-style franchise buyer education",
      catchphrases: ["Owning a franchise is a skill you can learn.", "Do the math before you follow the dream."],
      avatarDescription: "Workshop or webinar setting with franchise data",
      trustSignals: ["Operated 8 franchise units", "Trained 1,000+ aspiring franchisees"],
    },
    storyteller: {
      name: "Chris Nakamura",
      type: "storyteller",
      voiceTone: "honest and relatable",
      backstory: "Bought first franchise at 30, grew to 5 locations, sold at 40. Now shares every lesson — good and bad.",
      expertise: ["franchisee journey", "scaling locations", "staffing challenges", "exit and sale"],
      contentStyle: "Transparent owner journey with financial transparency",
      catchphrases: ["Nobody tells you about the second location blues.", "I sold the dream and kept the lessons."],
      avatarDescription: "Casual shot at one of the franchise locations",
      trustSignals: ["5-unit journey documented publicly", "Community of 15k franchise owners"],
    },
    "local-authority": {
      name: "Paula Vickers",
      type: "local-authority",
      voiceTone: "community-embedded and proud",
      backstory: "Runs 3 franchise locations in her hometown. Known as the go-to local business leader and employer.",
      expertise: ["local hiring", "community marketing", "multi-location local ops", "regional partnerships"],
      contentStyle: "Local franchise success stories and community impact reports",
      catchphrases: ["Franchise brand, hometown heart.", "We hire local, serve local, invest local."],
      avatarDescription: "In the local franchise location with team",
      trustSignals: ["3 local locations", "Employer of 60+ locals", "Chamber board member"],
    },
  },
  staffing: {
    expert: {
      name: "Catherine Holt",
      type: "expert",
      voiceTone: "analytical and decisive",
      backstory: "Workforce strategy executive with 18 years leading staffing operations for Fortune 500 clients.",
      expertise: ["workforce planning", "talent acquisition strategy", "MSP/VMS programs", "labor market analytics"],
      contentStyle: "Market intelligence reports and workforce trend analysis",
      catchphrases: ["Talent is the only sustainable competitive advantage.", "Data finds candidates, relationships close them."],
      avatarDescription: "Corporate office, talent analytics dashboard visible",
      trustSignals: ["18 years enterprise staffing", "Placed 10,000+ professionals", "SIA 40 Under 40"],
    },
    technician: {
      name: "Raj Mehta",
      type: "technician",
      voiceTone: "systematic and efficient",
      backstory: "Recruiting operations specialist who has built ATS workflows and sourcing automations for 30+ agencies.",
      expertise: ["ATS optimization", "sourcing automation", "candidate pipeline design", "compliance tracking"],
      contentStyle: "Tool tutorials and recruiting workflow blueprints",
      catchphrases: ["Automate the search, humanize the interview.", "Your ATS is only as good as your process."],
      avatarDescription: "Recruiter workstation with multiple screens and ATS dashboards",
      trustSignals: ["30+ agency systems built", "Bullhorn certified partner", "Reduced time-to-fill 35%"],
    },
    advisor: {
      name: "Angela Frost",
      type: "advisor",
      voiceTone: "consultative and empathetic",
      backstory: "Staffing business consultant helping agency owners improve margins, retain clients, and build recruiter teams.",
      expertise: ["agency growth strategy", "client retention", "recruiter coaching", "margin optimization"],
      contentStyle: "Client scenario walkthroughs and margin improvement plans",
      catchphrases: ["Retention beats placement volume every time.", "Your recruiters are your product — invest in them."],
      avatarDescription: "Professional consultation setting, whiteboard with metrics",
      trustSignals: ["200+ agencies advised", "Average margin improvement 15%", "ASA member"],
    },
    educator: {
      name: "Marcus Jefferson",
      type: "educator",
      voiceTone: "motivating and tactical",
      backstory: "Built a recruiter training academy that has certified 2,000+ new recruiters entering the staffing industry.",
      expertise: ["recruiter training", "cold outreach", "interview techniques", "offer negotiation"],
      contentStyle: "Role-play scenarios and skill-building modules",
      catchphrases: ["Recruiting is a craft, not a numbers game.", "Every call is an audition for trust."],
      avatarDescription: "Training room or webinar environment",
      trustSignals: ["2,000+ recruiters certified", "Staffing industry trainer of the year"],
    },
    storyteller: {
      name: "Bianca Torres",
      type: "storyteller",
      voiceTone: "driven and transparent",
      backstory: "Started a staffing agency from her apartment with one phone and one client. Now runs a $10M operation.",
      expertise: ["agency startup journey", "bootstrapping", "client acquisition", "team building"],
      contentStyle: "Raw founder stories with revenue milestones and hard lessons",
      catchphrases: ["One placement changed my life. Now I change lives for a living.", "The desk does not lie — your activity is your income."],
      avatarDescription: "Agency office, candid team environment",
      trustSignals: ["$0 to $10M documented journey", "Community of 12k agency owners"],
    },
    "local-authority": {
      name: "Dean Caldwell",
      type: "local-authority",
      voiceTone: "connected and reliable",
      backstory: "Runs the top staffing agency in the region. Every local HR director has his number on speed dial.",
      expertise: ["local labor market", "community workforce programs", "regional employer partnerships", "job fair leadership"],
      contentStyle: "Local hiring trends, employer spotlights, and workforce event coverage",
      catchphrases: ["We know every employer and every talent pool in this region.", "Local jobs, local people, real impact."],
      avatarDescription: "Job fair or local business networking event",
      trustSignals: ["15 years local staffing leader", "Regional employer of choice award", "Workforce board member"],
    },
  },
  faith: {
    expert: {
      name: "Pastor Daniel Reeves",
      type: "expert",
      voiceTone: "wise and shepherding",
      backstory: "Senior pastor for 22 years, grew a congregation from 50 to 3,000 members through intentional discipleship systems.",
      expertise: ["church growth strategy", "discipleship programs", "leadership development", "capital campaigns"],
      contentStyle: "Strategic frameworks grounded in ministry principles",
      catchphrases: ["Grow the people and the church grows itself.", "Vision without systems is just a sermon."],
      avatarDescription: "Church office or sanctuary, pastoral attire",
      trustSignals: ["22 years senior pastor", "Congregation of 3,000", "Author of ministry leadership book"],
    },
    technician: {
      name: "Sarah Whitfield",
      type: "technician",
      voiceTone: "organized and service-hearted",
      backstory: "Church operations director who has modernized technology and volunteer systems for 40+ congregations.",
      expertise: ["church management software", "volunteer coordination", "live-stream setup", "donor management"],
      contentStyle: "Tech setup guides and operations checklists for ministry teams",
      catchphrases: ["Good systems free your team to focus on ministry.", "Stewardship includes how you manage your tools."],
      avatarDescription: "Church tech booth or office with screens and planning boards",
      trustSignals: ["40+ churches modernized", "Planning Center certified", "10 years church ops"],
    },
    advisor: {
      name: "Minister Aisha Grant",
      type: "advisor",
      voiceTone: "compassionate and strategic",
      backstory: "Ministry consultant helping churches navigate growth transitions, staff hiring, and community outreach strategy.",
      expertise: ["ministry transitions", "staff development", "outreach strategy", "church planting"],
      contentStyle: "Consultation-style advice with ministry case studies",
      catchphrases: ["Every church has a next chapter — let us write it together.", "Healthy leaders build healthy churches."],
      avatarDescription: "Warm professional setting, ministry resources visible",
      trustSignals: ["150+ churches consulted", "Church planting coach", "Seminary adjunct faculty"],
    },
    educator: {
      name: "Brother James Okafor",
      type: "educator",
      voiceTone: "patient and uplifting",
      backstory: "Seminary professor and online educator making theological education accessible to lay leaders worldwide.",
      expertise: ["biblical literacy", "small group curriculum", "lay leader training", "online ministry education"],
      contentStyle: "Teaching series and curriculum guides for church leaders",
      catchphrases: ["Theology belongs to the whole church, not just the seminary.", "Equip the saints and watch them serve."],
      avatarDescription: "Classroom or study with books and teaching materials",
      trustSignals: ["Seminary professor 12 years", "50k online students", "Author of 3 ministry training courses"],
    },
    storyteller: {
      name: "Rachel Domingo",
      type: "storyteller",
      voiceTone: "heartfelt and testimony-driven",
      backstory: "Church planter who started a congregation in a living room that now serves 500 families and runs a food pantry.",
      expertise: ["church planting journey", "community ministry", "faith and resilience", "testimony sharing"],
      contentStyle: "Testimony-style narratives with ministry impact stories",
      catchphrases: ["God does not call the equipped, He equips the called.", "Every ministry starts with one yes."],
      avatarDescription: "Community ministry setting, serving alongside congregation",
      trustSignals: ["Living room to 500 families documented", "Community of 18k ministry leaders"],
    },
    "local-authority": {
      name: "Deacon William Carter",
      type: "local-authority",
      voiceTone: "rooted and trustworthy",
      backstory: "Lifelong community leader and deacon. His church has been the spiritual anchor of the neighborhood for 40 years.",
      expertise: ["community partnerships", "local outreach events", "interfaith collaboration", "neighborhood ministry"],
      contentStyle: "Community event coverage and local ministry impact updates",
      catchphrases: ["This church is the heartbeat of this neighborhood.", "We serve our neighbors because they are our family."],
      avatarDescription: "In the community, church building recognizable in background",
      trustSignals: ["40-year church legacy", "Annual community serve day for 1,000+", "City faith leader council"],
    },
  },
  creative: {
    expert: {
      name: "Vivian Lacroix",
      type: "expert",
      voiceTone: "visionary and articulate",
      backstory: "Creative director with 18 years leading brand identity and campaign work for global agencies and Fortune 100 clients.",
      expertise: ["brand identity", "creative strategy", "campaign direction", "design systems"],
      contentStyle: "Case study teardowns and creative strategy deep dives",
      catchphrases: ["Design is strategy made visible.", "Great brands are built, not decorated."],
      avatarDescription: "Design studio, mood boards and brand assets visible",
      trustSignals: ["18 years creative direction", "Worked with 5 Fortune 100 brands", "ADC award winner"],
    },
    technician: {
      name: "Nolan Park",
      type: "technician",
      voiceTone: "precise and craft-focused",
      backstory: "Senior designer and production specialist who has built design systems and asset pipelines for 60+ brands.",
      expertise: ["design systems", "production workflows", "asset management", "cross-platform formatting"],
      contentStyle: "Tool tutorials, template builds, and design process walkthroughs",
      catchphrases: ["Pixel-perfect is not obsession, it is professionalism.", "A good system makes great work repeatable."],
      avatarDescription: "At the design workstation, Figma or Adobe tools visible",
      trustSignals: ["60+ brand systems built", "Adobe Certified Expert", "Figma Community contributor"],
    },
    advisor: {
      name: "Simone Vasquez",
      type: "advisor",
      voiceTone: "collaborative and client-focused",
      backstory: "Creative agency owner who helps studios win better clients, price confidently, and scope projects that protect profit.",
      expertise: ["agency pricing", "client management", "project scoping", "creative briefs"],
      contentStyle: "Client conversation scripts and pricing frameworks",
      catchphrases: ["Price your value, not your hours.", "A strong brief is the best creative investment."],
      avatarDescription: "Agency meeting room, portfolio and presentation visible",
      trustSignals: ["Runs 15-person creative agency", "Doubled average project value for 50+ studios"],
    },
    educator: {
      name: "Ellis Monroe",
      type: "educator",
      voiceTone: "inspiring and technique-driven",
      backstory: "Design professor and online educator teaching creative fundamentals to 80k students across platforms.",
      expertise: ["design fundamentals", "typography", "color theory", "portfolio building"],
      contentStyle: "Visual tutorials and principle-based design lessons",
      catchphrases: ["Creativity is a muscle. Train it daily.", "Learn the rules so you can break them on purpose."],
      avatarDescription: "Studio classroom, design examples on screen",
      trustSignals: ["80k students across platforms", "University design faculty", "Skillshare top teacher"],
    },
    storyteller: {
      name: "Zara Obi",
      type: "storyteller",
      voiceTone: "bold and authentic",
      backstory: "Freelance designer who went from Fiverr gigs to running a six-figure studio. Documents the creative hustle openly.",
      expertise: ["freelance to agency journey", "personal branding", "client storytelling", "creative burnout"],
      contentStyle: "Behind-the-scenes studio life and raw business journey content",
      catchphrases: ["Your portfolio is your pitch.", "I designed my career one project at a time."],
      avatarDescription: "Creative workspace, works-in-progress visible",
      trustSignals: ["Fiverr to six-figure studio documented", "Community of 25k creatives"],
    },
    "local-authority": {
      name: "Marco DiLeo",
      type: "local-authority",
      voiceTone: "community-creative and passionate",
      backstory: "Runs the city's most recognized design studio and organizes the annual local creative festival.",
      expertise: ["local brand campaigns", "community murals and signage", "creative community events", "small business branding"],
      contentStyle: "Local project showcases and creative community spotlights",
      catchphrases: ["Great design makes great neighborhoods.", "We are the creative engine of this city."],
      avatarDescription: "Local studio or at a community creative event",
      trustSignals: ["Studio established 12 years", "100+ local businesses branded", "Founded annual creative festival"],
    },
  },
};

const PLATFORM_PERSONA_MAP: Record<string, PersonaType[]> = {
  linkedin: ["expert", "advisor", "educator"],
  tiktok: ["storyteller", "educator", "technician"],
  instagram: ["storyteller", "local-authority", "advisor"],
  youtube: ["educator", "expert", "storyteller"],
  twitter: ["expert", "educator", "technician"],
  facebook: ["local-authority", "advisor", "storyteller"],
};

const CONTENT_TYPE_PERSONA_MAP: Record<string, PersonaType[]> = {
  "long-form": ["expert", "educator", "technician"],
  "short-form": ["storyteller", "local-authority", "advisor"],
  "case-study": ["expert", "advisor"],
  tutorial: ["technician", "educator"],
  "thought-leadership": ["expert", "advisor"],
};

// ---------------------------------------------------------------------------
// Core functions
// ---------------------------------------------------------------------------

export function createPersona(
  tenantId: string,
  config: Omit<CreatorPersona, "id" | "tenantId">,
): CreatorPersona {
  const persona: CreatorPersona = {
    ...config,
    id: generateId(),
    tenantId,
  };
  personaStore.set(persona.id, persona);
  return persona;
}

export function getPersona(personaId: string): CreatorPersona | undefined {
  return personaStore.get(personaId);
}

export function listPersonas(tenantId: string): CreatorPersona[] {
  return [...personaStore.values()].filter((p) => p.tenantId === tenantId);
}

export function generatePersona(niche: string, type: PersonaType): CreatorPersona {
  const nicheKey = niche.toLowerCase().replace(/\s+/g, "-") as NicheKey;
  const nicheTemplates = PERSONA_TEMPLATES[nicheKey] ?? PERSONA_TEMPLATES["coaching"];
  const template = nicheTemplates[type] ?? nicheTemplates["expert"];

  return {
    ...template,
    id: generateId(),
    tenantId: "generated",
    niche,
    type,
  };
}

export function applyPersonaToContent(persona: CreatorPersona, content: string): string {
  let result = content;

  const catchphrase =
    persona.catchphrases.length > 0
      ? persona.catchphrases[Math.floor(Math.random() * persona.catchphrases.length)]
      : null;

  const trustSignal =
    persona.trustSignals.length > 0
      ? persona.trustSignals[Math.floor(Math.random() * persona.trustSignals.length)]
      : null;

  if (persona.voiceTone.includes("authoritative") || persona.voiceTone.includes("expert")) {
    result = result.replace(/\bI think\b/gi, "Based on my experience,");
    result = result.replace(/\bmaybe\b/gi, "specifically");
    result = result.replace(/\bmight\b/gi, "will");
  }

  if (persona.voiceTone.includes("relatable") || persona.voiceTone.includes("vulnerable")) {
    result = result.replace(/\bone should\b/gi, "you");
    result = result.replace(/\bit is important to\b/gi, "you need to");
  }

  if (catchphrase) {
    result = `${result}\n\n${catchphrase}`;
  }

  if (trustSignal) {
    result = `${result}\n\n[${trustSignal}]`;
  }

  return result;
}

export function getPersonaRecommendation(
  niche: string,
  platform: string,
  contentType: string,
): PersonaRecommendation {
  const platformTypes = PLATFORM_PERSONA_MAP[platform.toLowerCase()] ?? [
    "expert",
    "educator",
    "advisor",
  ];
  const contentTypes = CONTENT_TYPE_PERSONA_MAP[contentType.toLowerCase()] ?? [
    "expert",
    "educator",
  ];

  const scored = new Map<PersonaType, number>();
  for (const t of platformTypes) {
    scored.set(t, (scored.get(t) ?? 0) + 2);
  }
  for (const t of contentTypes) {
    scored.set(t, (scored.get(t) ?? 0) + 3);
  }

  const sorted = [...scored.entries()].sort((a, b) => b[1] - a[1]);
  const [topType, topScore] = sorted[0] ?? ["expert", 1];
  const maxPossible = 5;

  return {
    personaType: topType as PersonaType,
    reason: `${topType} persona performs best on ${platform} for ${contentType} content in the ${niche} niche.`,
    confidence: Math.min(topScore / maxPossible, 1),
  };
}

// ---------------------------------------------------------------------------
// Test helper
// ---------------------------------------------------------------------------

export function resetPersonaStore(): void {
  personaStore.clear();
}
