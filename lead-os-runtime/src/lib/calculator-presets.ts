export interface CalculatorPreset {
  niche: string;
  label: string;
  inputs: Array<{
    id: string;
    label: string;
    type: "currency" | "number" | "percentage";
    defaultValue: number;
    min: number;
    max: number;
    step: number;
    helpText: string;
  }>;
  formula: string;
  resultLabel: string;
  proofPoint: string;
}

export const CALCULATOR_PRESETS: Record<string, CalculatorPreset> = {
  general: {
    niche: "general",
    label: "Business Automation ROI",
    inputs: [
      {
        id: "monthly-leads",
        label: "Monthly leads",
        type: "number",
        defaultValue: 200,
        min: 10,
        max: 10000,
        step: 10,
        helpText: "Total inbound leads your business receives per month.",
      },
      {
        id: "avg-deal-value",
        label: "Average deal value",
        type: "currency",
        defaultValue: 2500,
        min: 100,
        max: 500000,
        step: 100,
        helpText: "Typical revenue from a single closed deal.",
      },
      {
        id: "close-rate",
        label: "Current close rate",
        type: "percentage",
        defaultValue: 15,
        min: 1,
        max: 80,
        step: 1,
        helpText: "Percentage of leads that become paying customers today.",
      },
      {
        id: "response-time-hours",
        label: "Avg. response time (hours)",
        type: "number",
        defaultValue: 4,
        min: 0,
        max: 72,
        step: 1,
        helpText: "Hours before a new lead receives first contact.",
      },
    ],
    formula:
      "Projects new revenue by estimating close-rate improvement from faster response time and automated follow-up. Each hour shaved off response time lifts close rate by ~1.5%.",
    resultLabel: "Estimated monthly revenue gain",
    proofPoint:
      "Businesses that respond in under 5 minutes are 21x more likely to qualify a lead.",
  },

  legal: {
    niche: "legal",
    label: "Legal Intake ROI",
    inputs: [
      {
        id: "consultations-per-month",
        label: "Consultations per month",
        type: "number",
        defaultValue: 80,
        min: 5,
        max: 2000,
        step: 5,
        helpText: "Number of initial consultations or inquiry calls per month.",
      },
      {
        id: "avg-case-value",
        label: "Average case value",
        type: "currency",
        defaultValue: 8000,
        min: 500,
        max: 500000,
        step: 500,
        helpText: "Average revenue generated from a signed case.",
      },
      {
        id: "intake-conversion-rate",
        label: "Intake conversion rate",
        type: "percentage",
        defaultValue: 25,
        min: 5,
        max: 80,
        step: 1,
        helpText: "Percentage of consultations that become signed cases.",
      },
    ],
    formula:
      "Calculates additional signed cases from improving intake conversion by 15-25% through automated qualification and faster follow-up, multiplied by average case value.",
    resultLabel: "Additional monthly case revenue",
    proofPoint:
      "Law firms using automated intake see 35-52% higher consultation-to-signed-case rates.",
  },

  health: {
    niche: "health",
    label: "Healthcare Practice Growth ROI",
    inputs: [
      {
        id: "monthly-appointments",
        label: "Monthly appointments",
        type: "number",
        defaultValue: 400,
        min: 50,
        max: 5000,
        step: 10,
        helpText: "Total patient appointments scheduled per month.",
      },
      {
        id: "no-show-rate",
        label: "Current no-show rate",
        type: "percentage",
        defaultValue: 18,
        min: 1,
        max: 50,
        step: 1,
        helpText: "Percentage of scheduled appointments that are missed.",
      },
      {
        id: "avg-visit-revenue",
        label: "Revenue per visit",
        type: "currency",
        defaultValue: 350,
        min: 50,
        max: 5000,
        step: 25,
        helpText: "Average revenue collected per completed appointment.",
      },
      {
        id: "reactivation-pool",
        label: "Inactive patients",
        type: "number",
        defaultValue: 500,
        min: 0,
        max: 50000,
        step: 50,
        helpText: "Patients who haven't visited in 12+ months.",
      },
    ],
    formula:
      "Combines recovered no-show revenue (reducing no-show rate by 40-60%) with reactivation campaign revenue (5-12% of inactive patients return) to project total monthly gain.",
    resultLabel: "Monthly recovered + new revenue",
    proofPoint:
      "Automated appointment reminders reduce no-shows by 38-61% across healthcare practices.",
  },

  tech: {
    niche: "tech",
    label: "SaaS Growth ROI",
    inputs: [
      {
        id: "monthly-trials",
        label: "Monthly trial signups",
        type: "number",
        defaultValue: 500,
        min: 20,
        max: 50000,
        step: 10,
        helpText: "New trial or freemium signups per month.",
      },
      {
        id: "trial-to-paid",
        label: "Trial-to-paid rate",
        type: "percentage",
        defaultValue: 8,
        min: 1,
        max: 50,
        step: 1,
        helpText: "Percentage of trials that convert to paid plans.",
      },
      {
        id: "avg-mrr-per-account",
        label: "Avg. MRR per account",
        type: "currency",
        defaultValue: 99,
        min: 5,
        max: 10000,
        step: 5,
        helpText: "Average monthly recurring revenue per paying customer.",
      },
      {
        id: "monthly-churn",
        label: "Monthly churn rate",
        type: "percentage",
        defaultValue: 5,
        min: 0,
        max: 30,
        step: 1,
        helpText: "Percentage of paying customers lost each month.",
      },
    ],
    formula:
      "Projects MRR gain by improving trial-to-paid conversion by 30-50% through activation sequences, plus revenue saved by reducing churn by 20-35% via automated health scoring.",
    resultLabel: "Projected monthly MRR increase",
    proofPoint:
      "Behavior-based onboarding sequences improve trial-to-paid conversion by 41% on average.",
  },

  construction: {
    niche: "construction",
    label: "Construction Pipeline ROI",
    inputs: [
      {
        id: "monthly-estimates",
        label: "Estimates sent per month",
        type: "number",
        defaultValue: 30,
        min: 5,
        max: 500,
        step: 5,
        helpText: "Number of bids or estimates your team sends monthly.",
      },
      {
        id: "avg-project-value",
        label: "Average project value",
        type: "currency",
        defaultValue: 45000,
        min: 1000,
        max: 5000000,
        step: 1000,
        helpText: "Typical revenue from a single won contract.",
      },
      {
        id: "bid-close-rate",
        label: "Bid close rate",
        type: "percentage",
        defaultValue: 22,
        min: 5,
        max: 70,
        step: 1,
        helpText: "Percentage of estimates that convert to signed contracts.",
      },
    ],
    formula:
      "Estimates additional won projects from lifting bid close rate by 15-25% through automated follow-up sequences and faster proposal delivery, multiplied by average project value.",
    resultLabel: "Additional monthly project revenue",
    proofPoint:
      "Contractors who follow up within 24 hours close 44% more bids than those who wait 3+ days.",
  },

  "real-estate": {
    niche: "real-estate",
    label: "Real Estate Lead Conversion ROI",
    inputs: [
      {
        id: "monthly-portal-leads",
        label: "Portal leads per month",
        type: "number",
        defaultValue: 120,
        min: 10,
        max: 5000,
        step: 10,
        helpText: "Leads received from Zillow, Realtor.com, and similar portals.",
      },
      {
        id: "avg-commission",
        label: "Average commission",
        type: "currency",
        defaultValue: 9000,
        min: 1000,
        max: 100000,
        step: 500,
        helpText: "Gross commission income per closed transaction.",
      },
      {
        id: "lead-to-close-rate",
        label: "Lead-to-close rate",
        type: "percentage",
        defaultValue: 3,
        min: 1,
        max: 20,
        step: 1,
        helpText: "Percentage of portal leads that result in a closed transaction.",
      },
      {
        id: "avg-nurture-months",
        label: "Avg. nurture cycle (months)",
        type: "number",
        defaultValue: 8,
        min: 1,
        max: 24,
        step: 1,
        helpText: "Average months from first contact to closing.",
      },
    ],
    formula:
      "Projects additional GCI from improving lead-to-close rate by 40-60% through instant response, AI scoring, and long-term drip automation that shortens the nurture cycle.",
    resultLabel: "Additional monthly GCI",
    proofPoint:
      "Agents who respond in under 60 seconds are 58% more likely to win the listing appointment.",
  },

  education: {
    niche: "education",
    label: "Enrollment Growth ROI",
    inputs: [
      {
        id: "monthly-inquiries",
        label: "Monthly inquiries",
        type: "number",
        defaultValue: 300,
        min: 20,
        max: 10000,
        step: 10,
        helpText: "Prospective students who request information each month.",
      },
      {
        id: "inquiry-to-enrollment",
        label: "Inquiry-to-enrollment rate",
        type: "percentage",
        defaultValue: 12,
        min: 2,
        max: 50,
        step: 1,
        helpText: "Percentage of inquiries that result in paid enrollment.",
      },
      {
        id: "avg-tuition-value",
        label: "Average tuition value",
        type: "currency",
        defaultValue: 8500,
        min: 500,
        max: 200000,
        step: 500,
        helpText: "Total tuition or program fee per enrolled student.",
      },
    ],
    formula:
      "Calculates additional tuition revenue from improving inquiry-to-enrollment rate by 20-35% through automated nurture campaigns, application reminders, and personalized follow-up.",
    resultLabel: "Additional monthly tuition revenue",
    proofPoint:
      "Institutions with automated enrollment nurture see 33% higher inquiry-to-enrollment rates.",
  },

  finance: {
    niche: "finance",
    label: "Financial Practice Efficiency ROI",
    inputs: [
      {
        id: "monthly-prospects",
        label: "Monthly prospects",
        type: "number",
        defaultValue: 40,
        min: 5,
        max: 1000,
        step: 5,
        helpText: "New prospective clients entering your pipeline each month.",
      },
      {
        id: "avg-client-aum",
        label: "Avg. AUM per client",
        type: "currency",
        defaultValue: 350000,
        min: 10000,
        max: 50000000,
        step: 10000,
        helpText: "Average assets under management per new client relationship.",
      },
      {
        id: "prospect-conversion-rate",
        label: "Prospect conversion rate",
        type: "percentage",
        defaultValue: 18,
        min: 5,
        max: 60,
        step: 1,
        helpText: "Percentage of prospects that become advisory clients.",
      },
      {
        id: "advisory-fee",
        label: "Annual advisory fee",
        type: "percentage",
        defaultValue: 1,
        min: 0.25,
        max: 3,
        step: 0.25,
        helpText: "Annual percentage fee charged on assets under management.",
      },
    ],
    formula:
      "Projects additional annual advisory revenue from improving conversion by 20-30% through automated onboarding, compliance-safe follow-up, and referral program automation.",
    resultLabel: "Additional annual advisory revenue",
    proofPoint:
      "Advisory firms using automated onboarding close 70% faster and retain 95% of new clients.",
  },

  franchise: {
    niche: "franchise",
    label: "Franchise Network ROI",
    inputs: [
      {
        id: "location-count",
        label: "Number of locations",
        type: "number",
        defaultValue: 25,
        min: 2,
        max: 1000,
        step: 1,
        helpText: "Total franchise locations in your network.",
      },
      {
        id: "leads-per-location",
        label: "Leads per location/month",
        type: "number",
        defaultValue: 50,
        min: 5,
        max: 500,
        step: 5,
        helpText: "Average monthly leads generated per location.",
      },
      {
        id: "avg-ticket",
        label: "Average ticket",
        type: "currency",
        defaultValue: 180,
        min: 10,
        max: 10000,
        step: 10,
        helpText: "Average transaction value across all locations.",
      },
    ],
    formula:
      "Calculates network-wide revenue lift by standardizing lead handling to top-performer close rates. Projects additional monthly revenue if all locations match 75th-percentile conversion.",
    resultLabel: "Network-wide monthly revenue lift",
    proofPoint:
      "Franchises with standardized lead routing see 92% brand compliance and 3.4x better ROAS.",
  },

  staffing: {
    niche: "staffing",
    label: "Staffing Agency ROI",
    inputs: [
      {
        id: "open-reqs",
        label: "Open requisitions",
        type: "number",
        defaultValue: 60,
        min: 5,
        max: 5000,
        step: 5,
        helpText: "Active job orders your agency is working to fill.",
      },
      {
        id: "avg-placement-fee",
        label: "Average placement fee",
        type: "currency",
        defaultValue: 4500,
        min: 500,
        max: 50000,
        step: 500,
        helpText: "Revenue per successful candidate placement.",
      },
      {
        id: "fill-rate",
        label: "Current fill rate",
        type: "percentage",
        defaultValue: 42,
        min: 10,
        max: 90,
        step: 1,
        helpText: "Percentage of open reqs successfully filled.",
      },
      {
        id: "time-to-fill-days",
        label: "Avg. time-to-fill (days)",
        type: "number",
        defaultValue: 28,
        min: 3,
        max: 120,
        step: 1,
        helpText: "Average days from job order to candidate start date.",
      },
    ],
    formula:
      "Projects additional placement revenue from improving fill rate by 15-25% through automated candidate scoring and faster submission, plus value of shortened time-to-fill.",
    resultLabel: "Additional monthly placement revenue",
    proofPoint:
      "Staffing agencies with automated candidate scoring achieve 47% more placements per recruiter.",
  },

  faith: {
    niche: "faith",
    label: "Ministry Engagement ROI",
    inputs: [
      {
        id: "weekly-attendance",
        label: "Weekly attendance",
        type: "number",
        defaultValue: 350,
        min: 20,
        max: 20000,
        step: 10,
        helpText: "Average weekly in-person and online service attendance.",
      },
      {
        id: "avg-monthly-giving",
        label: "Avg. monthly giving per giver",
        type: "currency",
        defaultValue: 120,
        min: 10,
        max: 2000,
        step: 10,
        helpText: "Average monthly donation amount per active giver.",
      },
      {
        id: "giving-participation-rate",
        label: "Giving participation rate",
        type: "percentage",
        defaultValue: 35,
        min: 5,
        max: 80,
        step: 1,
        helpText: "Percentage of regular attendees who give monthly.",
      },
    ],
    formula:
      "Projects additional monthly giving from increasing participation rate by 10-20% through automated first-time giver follow-up, recurring giving nudges, and engagement sequences.",
    resultLabel: "Additional monthly giving revenue",
    proofPoint:
      "Churches using automated giving follow-up triple their recurring donor base within 6 months.",
  },

  creative: {
    niche: "creative",
    label: "Creative Agency Pipeline ROI",
    inputs: [
      {
        id: "monthly-inquiries",
        label: "Monthly project inquiries",
        type: "number",
        defaultValue: 25,
        min: 5,
        max: 500,
        step: 5,
        helpText: "New project inquiries or RFPs received per month.",
      },
      {
        id: "avg-project-fee",
        label: "Average project fee",
        type: "currency",
        defaultValue: 12000,
        min: 500,
        max: 500000,
        step: 500,
        helpText: "Typical revenue from a single creative engagement.",
      },
      {
        id: "proposal-win-rate",
        label: "Proposal win rate",
        type: "percentage",
        defaultValue: 28,
        min: 5,
        max: 70,
        step: 1,
        helpText: "Percentage of proposals that convert to signed projects.",
      },
    ],
    formula:
      "Estimates additional project revenue from improving proposal win rate by 15-30% through faster response, portfolio-driven qualification, and automated proposal follow-up.",
    resultLabel: "Additional monthly project revenue",
    proofPoint:
      "Agencies with automated intake close 39% more proposals and shorten sales cycles by 40%.",
  },

  "home-services": {
    niche: "home-services",
    label: "Home Services Revenue ROI",
    inputs: [
      {
        id: "monthly-calls",
        label: "Monthly calls and inquiries",
        type: "number",
        defaultValue: 150,
        min: 10,
        max: 5000,
        step: 10,
        helpText: "Phone calls, form submissions, and messages received per month.",
      },
      {
        id: "avg-job-value",
        label: "Average job value",
        type: "currency",
        defaultValue: 650,
        min: 50,
        max: 50000,
        step: 50,
        helpText: "Average revenue per completed service job.",
      },
      {
        id: "booking-rate",
        label: "Call-to-booking rate",
        type: "percentage",
        defaultValue: 35,
        min: 5,
        max: 80,
        step: 1,
        helpText: "Percentage of inquiries that result in a booked job.",
      },
      {
        id: "missed-call-rate",
        label: "Missed call rate",
        type: "percentage",
        defaultValue: 22,
        min: 0,
        max: 60,
        step: 1,
        helpText: "Percentage of incoming calls that go unanswered.",
      },
    ],
    formula:
      "Combines revenue from recaptured missed calls (auto-text callback) with booking rate improvement from faster follow-up to project total monthly revenue lift.",
    resultLabel: "Additional monthly revenue",
    proofPoint:
      "Home service companies using auto-callback capture 53% more booked jobs from missed calls.",
  },

  coaching: {
    niche: "coaching",
    label: "Coaching Practice ROI",
    inputs: [
      {
        id: "monthly-discovery-calls",
        label: "Discovery calls per month",
        type: "number",
        defaultValue: 20,
        min: 2,
        max: 200,
        step: 2,
        helpText: "Number of discovery or strategy calls booked monthly.",
      },
      {
        id: "avg-engagement-value",
        label: "Avg. engagement value",
        type: "currency",
        defaultValue: 5000,
        min: 500,
        max: 100000,
        step: 500,
        helpText: "Total revenue from a typical coaching engagement or package.",
      },
      {
        id: "discovery-to-client-rate",
        label: "Discovery-to-client rate",
        type: "percentage",
        defaultValue: 30,
        min: 5,
        max: 80,
        step: 1,
        helpText: "Percentage of discovery calls that result in a paying client.",
      },
    ],
    formula:
      "Projects additional coaching revenue from improving discovery-to-client rate by 20-40% through pre-call qualification, automated nurture, and authority-building content sequences.",
    resultLabel: "Additional monthly coaching revenue",
    proofPoint:
      "Coaches with pre-qualified discovery funnels achieve a 74% close rate vs. 30% industry average.",
  },
};
