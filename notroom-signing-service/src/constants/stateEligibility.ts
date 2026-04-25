/**
 * Notroom State Eligibility Constants
 * 50-State Routing & Eligibility Matrix (First 10 States Active)
 */

import type { SigningType, LoanType } from '@/types/vendor';

// ============================================
// STATE CODES & NAMES
// ============================================

export const STATE_NAMES: Record<string, string> = {
  AL: 'Alabama',
  AK: 'Alaska',
  AZ: 'Arizona',
  AR: 'Arkansas',
  CA: 'California',
  CO: 'Colorado',
  CT: 'Connecticut',
  DE: 'Delaware',
  FL: 'Florida',
  GA: 'Georgia',
  HI: 'Hawaii',
  ID: 'Idaho',
  IL: 'Illinois',
  IN: 'Indiana',
  IA: 'Iowa',
  KS: 'Kansas',
  KY: 'Kentucky',
  LA: 'Louisiana',
  ME: 'Maine',
  MD: 'Maryland',
  MA: 'Massachusetts',
  MI: 'Michigan',
  MN: 'Minnesota',
  MS: 'Mississippi',
  MO: 'Missouri',
  MT: 'Montana',
  NE: 'Nebraska',
  NV: 'Nevada',
  NH: 'New Hampshire',
  NJ: 'New Jersey',
  NM: 'New Mexico',
  NY: 'New York',
  NC: 'North Carolina',
  ND: 'North Dakota',
  OH: 'Ohio',
  OK: 'Oklahoma',
  OR: 'Oregon',
  PA: 'Pennsylvania',
  RI: 'Rhode Island',
  SC: 'South Carolina',
  SD: 'South Dakota',
  TN: 'Tennessee',
  TX: 'Texas',
  UT: 'Utah',
  VT: 'Vermont',
  VA: 'Virginia',
  WA: 'Washington',
  WV: 'West Virginia',
  WI: 'Wisconsin',
  WY: 'Wyoming',
  DC: 'District of Columbia',
};

// ============================================
// WITNESS REQUIREMENTS
// ============================================

export type WitnessRequirement = 'none' | 'one' | 'two' | 'varies_by_doc';

export const WITNESS_REQUIREMENTS: Record<string, WitnessRequirement> = {
  PA: 'varies_by_doc',
  OH: 'varies_by_doc',
  NJ: 'varies_by_doc',
  NY: 'varies_by_doc',
  MD: 'none',
  VA: 'none',
  NC: 'varies_by_doc',
  FL: 'two',
  TX: 'none',
  CA: 'one',
  IL: 'none',
};

// ============================================
// RON LOCATION RESTRICTIONS
// ============================================

export type RonLocationRestriction = 'any' | 'must_be_in_state' | 'approved_states';

export const RON_LOCATION_RESTRICTIONS: Record<string, RonLocationRestriction> = {
  PA: 'must_be_in_state',
  OH: 'any',
  NJ: 'any',
  NY: 'any',
  MD: 'any',
  VA: 'any',
  NC: 'any',
  FL: 'any',
  TX: 'any',
  CA: 'must_be_in_state', // RON not allowed anyway
  IL: 'any',
};

// ============================================
// STATE ELIGIBILITY MATRIX (First 10 States)
// ============================================

export interface StateEligibilityConfig {
  state: string;
  stateName: string;
  inPersonAllowed: boolean;
  ronAllowed: boolean;
  witnessRequirements: WitnessRequirement;
  ronLocationRestriction: RonLocationRestriction;
  ronApprovedProviders: string[];
  specialRequirements: string;
  isActive: boolean;
  launchPhase: number; // 1 = immediate, 2 = month 2, 3 = month 3+
  routingNotes: string;
}

export const STATE_ELIGIBILITY_MATRIX: Record<string, StateEligibilityConfig> = {
  // Phase 1 - Immediate Adjacency (Months 1-2)
  PA: {
    state: 'PA',
    stateName: 'Pennsylvania',
    inPersonAllowed: true,
    ronAllowed: true,
    witnessRequirements: 'varies_by_doc',
    ronLocationRestriction: 'must_be_in_state',
    ronApprovedProviders: ['proof', 'notarycam', 'docverify', 'pavaso'],
    specialRequirements: 'Must use PA-approved RON providers. PA is your RON hub.',
    isActive: true,
    launchPhase: 1,
    routingNotes: 'Home state - full capability. RON hub for national operations.',
  },
  OH: {
    state: 'OH',
    stateName: 'Ohio',
    inPersonAllowed: true,
    ronAllowed: true,
    witnessRequirements: 'varies_by_doc',
    ronLocationRestriction: 'any',
    ronApprovedProviders: [],
    specialRequirements: 'Strong hybrid candidate. Large NSA pool.',
    isActive: true,
    launchPhase: 1,
    routingNotes: 'First expansion state. Recruit Cleveland, Columbus, Cincinnati.',
  },
  NJ: {
    state: 'NJ',
    stateName: 'New Jersey',
    inPersonAllowed: true,
    ronAllowed: true,
    witnessRequirements: 'varies_by_doc',
    ronLocationRestriction: 'any',
    ronApprovedProviders: [],
    specialRequirements: 'High-value transactions. Elite-only routing recommended.',
    isActive: true,
    launchPhase: 1,
    routingNotes: 'Premium market. Focus on quality over volume.',
  },
  MD: {
    state: 'MD',
    stateName: 'Maryland',
    inPersonAllowed: true,
    ronAllowed: true,
    witnessRequirements: 'none',
    ronLocationRestriction: 'any',
    ronApprovedProviders: [],
    specialRequirements: 'RON friendly state. Ideal for hybrid.',
    isActive: true,
    launchPhase: 1,
    routingNotes: 'Easy geographic expansion from PA. Good pilot state.',
  },

  // Phase 2 - East Coast Expansion (Months 3-4)
  NY: {
    state: 'NY',
    stateName: 'New York',
    inPersonAllowed: true,
    ronAllowed: true,
    witnessRequirements: 'varies_by_doc',
    ronLocationRestriction: 'any',
    ronApprovedProviders: [],
    specialRequirements: 'Complex state = competitive moat. Strict compliance expectations.',
    isActive: true,
    launchPhase: 2,
    routingNotes: 'Use senior notaries only. Complexity is your advantage.',
  },
  VA: {
    state: 'VA',
    stateName: 'Virginia',
    inPersonAllowed: true,
    ronAllowed: true,
    witnessRequirements: 'none',
    ronLocationRestriction: 'any',
    ronApprovedProviders: [],
    specialRequirements: 'RON mature state. Excellent for expansion.',
    isActive: true,
    launchPhase: 2,
    routingNotes: 'Integrate into Mid-Atlantic cluster. Good long-term relationships.',
  },
  NC: {
    state: 'NC',
    stateName: 'North Carolina',
    inPersonAllowed: true,
    ronAllowed: true,
    witnessRequirements: 'varies_by_doc',
    ronLocationRestriction: 'any',
    ronApprovedProviders: [],
    specialRequirements: 'Some document types restricted for RON. Growing market.',
    isActive: true,
    launchPhase: 2,
    routingNotes: 'Fewer ultra-professional signing services. Opportunity to become preferred vendor.',
  },

  // Phase 3 - National Scale (Months 5-6+)
  FL: {
    state: 'FL',
    stateName: 'Florida',
    inPersonAllowed: true,
    ronAllowed: true,
    witnessRequirements: 'two',
    ronLocationRestriction: 'any',
    ronApprovedProviders: [],
    specialRequirements: 'Witnesses often required. Platform-provided witnesses critical.',
    isActive: true,
    launchPhase: 3,
    routingNotes: 'Massive volume. Build Florida Elite Network (top 5-10% only).',
  },
  TX: {
    state: 'TX',
    stateName: 'Texas',
    inPersonAllowed: true,
    ronAllowed: true,
    witnessRequirements: 'none',
    ronLocationRestriction: 'any',
    ronApprovedProviders: [],
    specialRequirements: 'High volume, decentralized geography. Performance routing essential.',
    isActive: true,
    launchPhase: 3,
    routingNotes: 'Multi-city hub model: Dallas, Houston, Austin, San Antonio.',
  },
  CA: {
    state: 'CA',
    stateName: 'California',
    inPersonAllowed: true,
    ronAllowed: false, // RON NOT authorized in CA
    witnessRequirements: 'one',
    ronLocationRestriction: 'must_be_in_state',
    ronApprovedProviders: [],
    specialRequirements: 'RON NOT authorized. In-person only. Strict doc QA.',
    isActive: true,
    launchPhase: 3,
    routingNotes: 'Premium positioning. Select metros only, not statewide chaos.',
  },
  IL: {
    state: 'IL',
    stateName: 'Illinois',
    inPersonAllowed: true,
    ronAllowed: true,
    witnessRequirements: 'none',
    ronLocationRestriction: 'any',
    ronApprovedProviders: [],
    specialRequirements: 'Chicago metro drives consistent volume.',
    isActive: true,
    launchPhase: 3,
    routingNotes: 'Central US anchor. Test Midwest expansion playbooks.',
  },
};

// ============================================
// PA APPROVED RON PROVIDERS
// (Per Pennsylvania DOS approved list)
// ============================================

export const PA_APPROVED_RON_PROVIDERS = [
  { id: 'proof', name: 'Proof (formerly Notarize)', isPrimary: true },
  { id: 'notarycam', name: 'NotaryCam', isPrimary: false },
  { id: 'docverify', name: 'DocVerify', isPrimary: false },
  { id: 'pavaso', name: 'Pavaso', isPrimary: false },
  { id: 'nexsys', name: 'Nexsys Technologies', isPrimary: false },
  { id: 'safedocs', name: 'SafeDocs', isPrimary: false },
];

// ============================================
// SERVICE TIER CONFIGURATION
// ============================================

export interface ServiceTierConfig {
  id: string;
  name: string;
  confirmationSlaMins: number;
  contactSlaMins: number;
  baseFeeRange: [number, number];
  rushFeeMultiplier: number;
  requiresEliteTier: boolean;
  description: string;
}

export const SERVICE_TIERS: ServiceTierConfig[] = [
  {
    id: 'standard',
    name: 'Notroom Standard',
    confirmationSlaMins: 60,
    contactSlaMins: 120,
    baseFeeRange: [125, 150],
    rushFeeMultiplier: 1,
    requiresEliteTier: false,
    description: '60-minute confirmation, next-day scanbacks',
  },
  {
    id: 'priority',
    name: 'Notroom Priority',
    confirmationSlaMins: 15,
    contactSlaMins: 60,
    baseFeeRange: [175, 225],
    rushFeeMultiplier: 1.5,
    requiresEliteTier: true,
    description: '15-minute confirmation, same-day scanbacks, Elite notaries only',
  },
  {
    id: 'rescue',
    name: 'Notroom Rescue',
    confirmationSlaMins: 3,
    contactSlaMins: 15,
    baseFeeRange: [250, 350],
    rushFeeMultiplier: 2,
    requiresEliteTier: true,
    description: 'Immediate dispatch, failed signing recovery, after-hours/weekend',
  },
];

// ============================================
// LOAN TYPE DOCUMENT REQUIREMENTS
// ============================================

export interface LoanTypeConfig {
  id: LoanType;
  name: string;
  typicalDocCount: number;
  averageDuration: number; // minutes
  requiresWitness: boolean;
  complexityLevel: 'low' | 'medium' | 'high';
  specializations: string[];
}

export const LOAN_TYPE_CONFIGS: Record<LoanType, LoanTypeConfig> = {
  purchase: {
    id: 'purchase',
    name: 'Purchase',
    typicalDocCount: 150,
    averageDuration: 60,
    requiresWitness: false,
    complexityLevel: 'medium',
    specializations: [],
  },
  refinance: {
    id: 'refinance',
    name: 'Refinance',
    typicalDocCount: 120,
    averageDuration: 45,
    requiresWitness: false,
    complexityLevel: 'medium',
    specializations: [],
  },
  heloc: {
    id: 'heloc',
    name: 'HELOC',
    typicalDocCount: 80,
    averageDuration: 30,
    requiresWitness: false,
    complexityLevel: 'low',
    specializations: ['heloc'],
  },
  reverse: {
    id: 'reverse',
    name: 'Reverse Mortgage',
    typicalDocCount: 200,
    averageDuration: 90,
    requiresWitness: true,
    complexityLevel: 'high',
    specializations: ['reverse'],
  },
  commercial: {
    id: 'commercial',
    name: 'Commercial',
    typicalDocCount: 250,
    averageDuration: 120,
    requiresWitness: false,
    complexityLevel: 'high',
    specializations: ['commercial'],
  },
  dscr: {
    id: 'dscr',
    name: 'DSCR / Investor',
    typicalDocCount: 100,
    averageDuration: 45,
    requiresWitness: false,
    complexityLevel: 'medium',
    specializations: ['commercial'],
  },
  va: {
    id: 'va',
    name: 'VA Loan',
    typicalDocCount: 160,
    averageDuration: 60,
    requiresWitness: false,
    complexityLevel: 'medium',
    specializations: ['va'],
  },
  fha: {
    id: 'fha',
    name: 'FHA Loan',
    typicalDocCount: 150,
    averageDuration: 60,
    requiresWitness: false,
    complexityLevel: 'medium',
    specializations: [],
  },
  construction: {
    id: 'construction',
    name: 'Construction Loan',
    typicalDocCount: 180,
    averageDuration: 75,
    requiresWitness: false,
    complexityLevel: 'high',
    specializations: ['commercial'],
  },
  other: {
    id: 'other',
    name: 'Other',
    typicalDocCount: 100,
    averageDuration: 45,
    requiresWitness: false,
    complexityLevel: 'medium',
    specializations: [],
  },
};

// ============================================
// VENDOR TIER THRESHOLDS
// ============================================

export interface VendorTierThreshold {
  tier: string;
  minScore: number;
  maxScore: number;
  routingPriority: number;
  benefits: string[];
}

export const VENDOR_TIER_THRESHOLDS: VendorTierThreshold[] = [
  {
    tier: 'elite',
    minScore: 90,
    maxScore: 100,
    routingPriority: 1,
    benefits: [
      'First offer on all orders',
      '2-day fast pay',
      'Premium rate card',
      'Rescue signing priority',
    ],
  },
  {
    tier: 'gold',
    minScore: 80,
    maxScore: 89,
    routingPriority: 2,
    benefits: [
      'Second wave offers',
      '5-day fast pay',
      'Standard+ rate card',
    ],
  },
  {
    tier: 'silver',
    minScore: 70,
    maxScore: 79,
    routingPriority: 3,
    benefits: [
      'Overflow orders',
      '7-day payment',
      'Standard rate card',
    ],
  },
  {
    tier: 'bronze',
    minScore: 0,
    maxScore: 69,
    routingPriority: 4,
    benefits: [
      'Limited orders',
      'Net 14 payment',
      'Entry rate card',
    ],
  },
];

// ============================================
// SCORE WEIGHT CONFIGURATION
// ============================================

export const SCORE_WEIGHTS = {
  responsiveness: 0.25, // 25 points max
  quality: 0.30, // 30 points max
  reliability: 0.20, // 20 points max
  compliance: 0.15, // 15 points max
  specialtyMatch: 0.10, // 10 points max
} as const;

// ============================================
// SLA CONFIGURATIONS
// ============================================

export const SLA_CONFIGS = {
  // Vendor Response SLAs
  vendorAcceptDeclineMins: 3,
  vendorBorrowerContactMins: 10,
  vendorAppointmentConfirmMins: 60,

  // Scanback SLAs
  scanbackUploadHours: 4,
  scanbackQaReviewHours: 2,

  // Shipping SLAs
  courierDropoffHours: 2,

  // Escalation Thresholds
  autoReassignAfterMins: 5,
  alertAdminAfterMins: 10,
} as const;

// ============================================
// ACTIVE STATES HELPER
// ============================================

export function getActiveStates(): StateEligibilityConfig[] {
  return Object.values(STATE_ELIGIBILITY_MATRIX).filter((s) => s.isActive);
}

export function getStatesByPhase(phase: number): StateEligibilityConfig[] {
  return Object.values(STATE_ELIGIBILITY_MATRIX).filter(
    (s) => s.launchPhase === phase && s.isActive
  );
}

export function isStateActive(stateCode: string): boolean {
  const config = STATE_ELIGIBILITY_MATRIX[stateCode.toUpperCase()];
  return config?.isActive ?? false;
}

export function isRonAllowed(stateCode: string): boolean {
  const config = STATE_ELIGIBILITY_MATRIX[stateCode.toUpperCase()];
  return config?.ronAllowed ?? false;
}

export function getStateConfig(stateCode: string): StateEligibilityConfig | null {
  return STATE_ELIGIBILITY_MATRIX[stateCode.toUpperCase()] ?? null;
}

