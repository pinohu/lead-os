export interface NicheTestimonial {
  quote: string;
  author: string;
  role: string;
  company: string;
  metric: string;
}

export const NICHE_TESTIMONIALS: Record<string, NicheTestimonial[]> = {
  general: [
    {
      quote:
        "We replaced four separate tools with Lead OS and cut our lead response time from hours to under two minutes. The pipeline finally runs itself.",
      author: "Marcus Tran",
      role: "Director of Operations",
      company: "Vantage Growth Partners",
      metric: "83% faster response time",
    },
    {
      quote:
        "Our team went from chasing spreadsheets to closing deals. Automation handled the grunt work so we could focus on revenue-generating conversations.",
      author: "Lauren Dietrich",
      role: "VP of Sales",
      company: "Bridgeway Solutions Group",
      metric: "47% more leads converted",
    },
    {
      quote:
        "Within 90 days our cost per acquisition dropped significantly because every lead was scored and routed to the right rep instantly.",
      author: "Devon Sinclair",
      role: "Growth Marketing Manager",
      company: "Apex Demand Co.",
      metric: "34% lower cost per acquisition",
    },
  ],

  legal: [
    {
      quote:
        "Our intake team was overwhelmed with unqualified consultations. Lead OS scores every inquiry and routes only viable cases to attorneys, saving us hours daily.",
      author: "Patricia Nguyen",
      role: "Managing Partner",
      company: "Nguyen & Calloway LLP",
      metric: "52% higher intake conversion",
    },
    {
      quote:
        "We went from losing prospective clients during after-hours to capturing and qualifying them automatically. Signed cases jumped in the first quarter.",
      author: "Robert Harmon",
      role: "Intake Director",
      company: "Harmon Legal Group",
      metric: "38% more signed cases",
    },
    {
      quote:
        "Compliance was our biggest concern when automating client communication. Lead OS handled it seamlessly while keeping follow-up speed under five minutes.",
      author: "Anika Patel",
      role: "Chief Operating Officer",
      company: "Sterling & Associates",
      metric: "4.8-minute avg. follow-up time",
    },
  ],

  health: [
    {
      quote:
        "Patient no-shows were costing our practice thousands each month. The automated reminder sequences cut that dramatically and kept our chairs full.",
      author: "Dr. James Whitfield",
      role: "Practice Owner",
      company: "ClearView Dental Partners",
      metric: "61% reduction in no-shows",
    },
    {
      quote:
        "We needed a HIPAA-conscious system that still moved fast. Lead OS gave us automated follow-up without putting patient data at risk.",
      author: "Samantha Torres",
      role: "Operations Manager",
      company: "Summit Health Collective",
      metric: "29% more appointments booked",
    },
    {
      quote:
        "Our multi-provider practice finally has a single pipeline view. Every referral is tracked, every patient touchpoint is logged, and reactivation campaigns run on autopilot.",
      author: "Dr. Michael Ahn",
      role: "Medical Director",
      company: "LifeBridge Medical Group",
      metric: "3.2x patient reactivation rate",
    },
  ],

  tech: [
    {
      quote:
        "Trial-to-paid conversion was our biggest bottleneck. Behavior-based scoring identified high-intent users so our reps called at exactly the right moment.",
      author: "Priya Ramesh",
      role: "Head of Growth",
      company: "CloudStack.io",
      metric: "41% trial-to-paid lift",
    },
    {
      quote:
        "We used to lose users during onboarding because nobody followed up. Automated nudge sequences now guide every trial through activation milestones.",
      author: "Nathan Cole",
      role: "VP Product",
      company: "Formcraft Labs",
      metric: "55% higher activation rate",
    },
    {
      quote:
        "Attribution across six channels was a nightmare. Lead OS unified everything into one dashboard so we doubled down on what actually drove MRR.",
      author: "Emily Zhao",
      role: "Marketing Director",
      company: "Relay Platform Inc.",
      metric: "27% increase in MRR",
    },
  ],

  construction: [
    {
      quote:
        "Bid follow-up used to fall through the cracks constantly. Now every estimate gets an automated sequence and our close rate speaks for itself.",
      author: "Tony Marchetti",
      role: "Owner",
      company: "Marchetti General Contracting",
      metric: "44% higher bid close rate",
    },
    {
      quote:
        "We were losing jobs to competitors who simply responded faster. Lead OS cut our response time to minutes and the pipeline doubled in six months.",
      author: "Karen Ostrowski",
      role: "Business Development Manager",
      company: "Ironside Builders",
      metric: "2x pipeline volume",
    },
    {
      quote:
        "Coordinating crews, subcontractors, and client expectations used to eat my whole day. Automated scheduling and status updates gave me that time back.",
      author: "Derek Sullivan",
      role: "Project Manager",
      company: "BlueLine Construction Co.",
      metric: "18 hours/week reclaimed",
    },
  ],

  "real-estate": [
    {
      quote:
        "Speed-to-lead is everything in real estate. Our agents now respond to portal inquiries in under a minute and listings move faster because of it.",
      author: "Christina Voss",
      role: "Team Leader",
      company: "Voss Realty Group",
      metric: "58-second avg. lead response",
    },
    {
      quote:
        "We nurture hundreds of buyer leads on autopilot. When they are ready to tour, they already trust our brand because the follow-up was consistent.",
      author: "Marco Reyes",
      role: "Broker",
      company: "Keystone Realty Partners",
      metric: "36% more listings under contract",
    },
    {
      quote:
        "Open house leads used to vanish after the weekend. Now every visitor gets scored and enters a drip sequence tailored to their buying timeline.",
      author: "Jennifer Caldwell",
      role: "Sales Director",
      company: "Caldwell & Co. Real Estate",
      metric: "3.1x open house conversion",
    },
  ],

  education: [
    {
      quote:
        "Our enrollment funnel had a massive drop-off between inquiry and application. Automated nurture emails closed that gap and our cohort sizes grew.",
      author: "Dr. Helen Mbaye",
      role: "Dean of Admissions",
      company: "Pacific Institute of Technology",
      metric: "33% enrollment increase",
    },
    {
      quote:
        "Student retention improved once we triggered intervention sequences the moment engagement metrics dipped. We catch at-risk students weeks earlier now.",
      author: "Kevin Park",
      role: "Student Success Director",
      company: "Horizon Academy Online",
      metric: "22% retention improvement",
    },
    {
      quote:
        "Running campaigns for six different programs used to require six different workflows. Lead OS lets us templatize and launch in a fraction of the time.",
      author: "Sandra Bellingham",
      role: "VP of Marketing",
      company: "Crestwood College",
      metric: "5x faster campaign launches",
    },
  ],

  finance: [
    {
      quote:
        "Client onboarding involved dozens of manual steps. We automated the document collection and scheduling flow and freed our advisors to advise.",
      author: "Richard Dominguez",
      role: "Managing Director",
      company: "Cornerstone Wealth Advisors",
      metric: "70% faster onboarding",
    },
    {
      quote:
        "Compliance tracking used to be a quarterly fire drill. Now every client interaction is logged and auditable without anyone lifting a finger.",
      author: "Leah Fitzpatrick",
      role: "Chief Compliance Officer",
      company: "Meridian Financial Group",
      metric: "100% audit readiness",
    },
    {
      quote:
        "Referral programs drove our best clients, but we never followed up consistently. Automated referral sequences doubled our introductions in one quarter.",
      author: "Andrew Chen",
      role: "Partner",
      company: "Sage Capital Partners",
      metric: "2x referral introductions",
    },
  ],

  franchise: [
    {
      quote:
        "With 40 locations, inconsistent lead handling was damaging our brand. Lead OS gave every franchisee the same playbook and performance visibility.",
      author: "Diane Morales",
      role: "VP of Franchise Development",
      company: "FreshStart Brands Inc.",
      metric: "92% franchise compliance rate",
    },
    {
      quote:
        "We finally have location-level attribution. Corporate can see exactly which marketing dollars drive results at each unit.",
      author: "Greg Thornton",
      role: "Director of Marketing",
      company: "AllStar Service Group",
      metric: "3.4x ROAS across locations",
    },
    {
      quote:
        "Onboarding a new franchisee used to take weeks of setup. Now the entire lead system clones from a template and is live in under a day.",
      author: "Melissa Chung",
      role: "Operations Director",
      company: "ProClean Franchise Corp.",
      metric: "1-day new location launch",
    },
  ],

  staffing: [
    {
      quote:
        "Our recruiters spent half their day sourcing instead of placing. Automated candidate intake and scoring flipped that ratio completely.",
      author: "Brian Kessler",
      role: "Managing Partner",
      company: "TalentBridge Staffing",
      metric: "47% more placements per recruiter",
    },
    {
      quote:
        "Speed-to-submit determines whether we win the req or lose it. Lead OS cut our candidate presentation time and clients noticed immediately.",
      author: "Alicia Drummond",
      role: "Director of Recruiting",
      company: "Pinnacle Workforce Solutions",
      metric: "62% faster candidate submission",
    },
    {
      quote:
        "Redeployment was always an afterthought. Automated end-of-assignment sequences now keep our bench warm and fill rates high.",
      author: "Jason Moreau",
      role: "VP of Operations",
      company: "CoreStaff Group",
      metric: "28% higher redeployment rate",
    },
  ],

  faith: [
    {
      quote:
        "Online giving was stalled because we never followed up with first-time givers. Automated thank-you sequences tripled our recurring donor base.",
      author: "Pastor David Okafor",
      role: "Senior Pastor",
      company: "New Horizon Community Church",
      metric: "3x recurring donors",
    },
    {
      quote:
        "Volunteer coordination was a texting nightmare. Now signups, reminders, and shift confirmations run automatically and our teams show up prepared.",
      author: "Rachel Kim",
      role: "Ministry Coordinator",
      company: "Grace Point Fellowship",
      metric: "45% fewer volunteer no-shows",
    },
    {
      quote:
        "First-time visitor follow-up used to depend on whoever remembered. Automated welcome sequences make every guest feel seen within hours, not weeks.",
      author: "Rev. Thomas Grant",
      role: "Executive Pastor",
      company: "Crossroads Church",
      metric: "67% visitor return rate",
    },
  ],

  creative: [
    {
      quote:
        "Our project intake was a mess of emails and forms. Lead OS gave us a single pipeline from inquiry to signed proposal and our close rate improved fast.",
      author: "Mia Tanaka",
      role: "Creative Director",
      company: "Prism Studio Collective",
      metric: "39% higher proposal close rate",
    },
    {
      quote:
        "Portfolio-to-lead conversion was the missing link. Now every case study page has a scored capture form and the leads actually convert.",
      author: "Daniel Osei",
      role: "Founder",
      company: "BoldFrame Creative Agency",
      metric: "51% more inbound leads",
    },
    {
      quote:
        "Client approvals used to stall projects for weeks. Automated review reminders keep stakeholders accountable and our delivery timelines tight.",
      author: "Sarah Lindquist",
      role: "Account Director",
      company: "Whitespace Design Co.",
      metric: "40% faster approval cycles",
    },
  ],

  "home-services": [
    {
      quote:
        "Missed calls were our biggest revenue leak. Automated callback and text sequences captured those leads and our booking rate jumped immediately.",
      author: "Mike Pelletier",
      role: "Owner",
      company: "Pelletier Plumbing & Heating",
      metric: "53% more booked jobs",
    },
    {
      quote:
        "Seasonal demand spikes used to catch us off guard. Predictive lead scoring helps us staff up and pre-sell before the rush hits.",
      author: "Angela Ruiz",
      role: "General Manager",
      company: "Comfort Zone HVAC Services",
      metric: "31% revenue increase in peak months",
    },
    {
      quote:
        "Our review generation was nonexistent. Automated post-job review requests built our Google profile and referrals followed naturally.",
      author: "Chris Donovan",
      role: "Operations Manager",
      company: "GreenLeaf Landscaping",
      metric: "4.9-star avg. Google rating",
    },
  ],

  coaching: [
    {
      quote:
        "My calendar was either overflowing or empty. Lead OS built a steady pipeline of pre-qualified prospects so every discovery call is worth my time.",
      author: "Tanya Richards",
      role: "Executive Coach",
      company: "Richards Performance Group",
      metric: "74% discovery-to-client rate",
    },
    {
      quote:
        "Authority content was generating traffic but not bookings. Adding a scored assessment funnel turned readers into qualified leads overnight.",
      author: "Jonathan Mercer",
      role: "Business Strategist",
      company: "Catalyst Coaching Institute",
      metric: "3.5x more qualified bookings",
    },
    {
      quote:
        "Group program launches used to be a manual scramble. Automated waitlist and enrollment sequences let me fill cohorts while I sleep.",
      author: "Vanessa Liu",
      role: "Founder",
      company: "Aligned Growth Academy",
      metric: "Cohorts filled 2 weeks faster",
    },
  ],
};
