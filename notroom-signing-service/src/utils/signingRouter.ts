/**
 * Notroom Signing Router
 * Intelligent routing engine for signing order assignment
 */

import type {
  SigningType,
  LoanType,
  Vendor,
  VendorTier,
  SigningOrder,
  RoutingDecision,
  VendorMatch,
  VendorSpecialization,
} from '@/types/vendor';

import {
  STATE_ELIGIBILITY_MATRIX,
  SCORE_WEIGHTS,
  VENDOR_TIER_THRESHOLDS,
  LOAN_TYPE_CONFIGS,
  isStateActive,
  isRonAllowed,
  getStateConfig,
} from '@/constants/stateEligibility';

// ============================================
// ROUTING DECISION ENGINE
// ============================================

export interface RoutingInput {
  propertyState: string;
  signingType: SigningType;
  loanType?: LoanType;
  appointmentDate?: string;
  appointmentTime?: string;
  serviceTier?: 'standard' | 'priority' | 'rescue';
  specializations?: VendorSpecialization[];
  clientPreferredVendorId?: string;
}

export interface EligibilityResult {
  ronEligible: boolean;
  inPersonEligible: boolean;
  recommendedType: SigningType;
  reason: string;
  warnings: string[];
}

/**
 * Gate 1 & 2: Check document and legal eligibility
 */
export function checkEligibility(input: RoutingInput): EligibilityResult {
  const { propertyState, signingType, loanType } = input;
  const warnings: string[] = [];
  
  // Check if state is active
  if (!isStateActive(propertyState)) {
    return {
      ronEligible: false,
      inPersonEligible: false,
      recommendedType: 'in_person',
      reason: `State ${propertyState} is not yet active in Notroom network`,
      warnings: ['Expand to this state before accepting orders'],
    };
  }
  
  const stateConfig = getStateConfig(propertyState);
  if (!stateConfig) {
    return {
      ronEligible: false,
      inPersonEligible: false,
      recommendedType: 'in_person',
      reason: `No configuration found for state ${propertyState}`,
      warnings: [],
    };
  }
  
  // Check RON eligibility
  const ronEligible = stateConfig.ronAllowed;
  const inPersonEligible = stateConfig.inPersonAllowed;
  
  // Add warnings for specific states
  if (propertyState === 'CA' && signingType === 'ron') {
    warnings.push('California does NOT allow RON. Switching to in-person.');
  }
  
  if (propertyState === 'FL') {
    warnings.push('Florida requires two witnesses. Ensure platform provides witnesses for RON.');
  }
  
  if (propertyState === 'NY') {
    warnings.push('New York has strict compliance requirements. Use experienced notaries only.');
  }
  
  // Check loan type specific restrictions
  if (loanType && LOAN_TYPE_CONFIGS[loanType]?.requiresWitness) {
    warnings.push(`${LOAN_TYPE_CONFIGS[loanType].name} typically requires witnesses.`);
  }
  
  // Determine recommended type
  let recommendedType: SigningType = signingType;
  if (signingType === 'ron' && !ronEligible) {
    recommendedType = 'in_person';
  }
  
  let reason = '';
  if (ronEligible && inPersonEligible) {
    reason = `Both RON and in-person available in ${stateConfig.stateName}`;
  } else if (ronEligible) {
    reason = `Only RON available in ${stateConfig.stateName}`;
  } else if (inPersonEligible) {
    reason = `Only in-person available in ${stateConfig.stateName}`;
  }
  
  if (stateConfig.specialRequirements) {
    warnings.push(stateConfig.specialRequirements);
  }
  
  return {
    ronEligible,
    inPersonEligible,
    recommendedType,
    reason,
    warnings,
  };
}

// ============================================
// VENDOR SCORING
// ============================================

export interface VendorScoreInput {
  vendor: Vendor;
  order: {
    loanType?: LoanType;
    specializations?: VendorSpecialization[];
    signingType: SigningType;
    propertyZip?: string;
  };
}

/**
 * Calculate composite vendor score for routing
 */
export function calculateVendorScore(input: VendorScoreInput): number {
  const { vendor, order } = input;
  
  // Component scores (already 0-100)
  const responsivenessScore = vendor.responsiveness_score * SCORE_WEIGHTS.responsiveness;
  const qualityScore = vendor.quality_score * SCORE_WEIGHTS.quality;
  const reliabilityScore = vendor.reliability_score * SCORE_WEIGHTS.reliability;
  const complianceScore = vendor.compliance_score * SCORE_WEIGHTS.compliance;
  
  // Specialty match score
  let specialtyMatchScore = 50; // Default
  if (order.loanType && order.specializations) {
    const loanConfig = LOAN_TYPE_CONFIGS[order.loanType];
    if (loanConfig) {
      const requiredSpecs = loanConfig.specializations;
      const vendorSpecs = vendor.specializations || [];
      const matchCount = requiredSpecs.filter((s) => 
        vendorSpecs.includes(s as VendorSpecialization)
      ).length;
      if (requiredSpecs.length > 0) {
        specialtyMatchScore = (matchCount / requiredSpecs.length) * 100;
      } else {
        specialtyMatchScore = 100; // No specialty required
      }
    }
  }
  
  // RON capability bonus
  if (order.signingType === 'ron' && vendor.ron_certified) {
    specialtyMatchScore = Math.min(100, specialtyMatchScore + 20);
  }
  
  const specialtyScore = specialtyMatchScore * SCORE_WEIGHTS.specialtyMatch;
  
  // Total score
  const totalScore = 
    responsivenessScore + 
    qualityScore + 
    reliabilityScore + 
    complianceScore + 
    specialtyScore;
  
  return Math.round(totalScore);
}

/**
 * Determine tier from score
 */
export function getTierFromScore(score: number): VendorTier {
  for (const threshold of VENDOR_TIER_THRESHOLDS) {
    if (score >= threshold.minScore && score <= threshold.maxScore) {
      return threshold.tier as VendorTier;
    }
  }
  return 'bronze';
}

/**
 * Update vendor scores based on performance event
 */
export function calculateScoreAdjustment(
  eventType: 'accept' | 'decline' | 'complete' | 'defect' | 'late' | 'no_show',
  currentScore: number,
  additionalData?: {
    responseTimeSeconds?: number;
    qualityRating?: number;
    firstPassFunded?: boolean;
  }
): number {
  let adjustment = 0;
  
  switch (eventType) {
    case 'accept':
      // Fast response bonus
      if (additionalData?.responseTimeSeconds) {
        if (additionalData.responseTimeSeconds < 60) adjustment = 2;
        else if (additionalData.responseTimeSeconds < 180) adjustment = 1;
        else adjustment = 0;
      }
      break;
      
    case 'decline':
      // Small penalty for decline (not severe - legitimate reasons exist)
      adjustment = -1;
      break;
      
    case 'complete':
      // Base completion bonus
      adjustment = 1;
      // First-pass funding bonus
      if (additionalData?.firstPassFunded) {
        adjustment += 2;
      }
      // Quality rating bonus
      if (additionalData?.qualityRating) {
        if (additionalData.qualityRating === 5) adjustment += 2;
        else if (additionalData.qualityRating === 4) adjustment += 1;
        else if (additionalData.qualityRating < 3) adjustment -= 2;
      }
      break;
      
    case 'defect':
      // Package defect penalty
      adjustment = -5;
      break;
      
    case 'late':
      // Late arrival penalty
      adjustment = -3;
      break;
      
    case 'no_show':
      // No-show severe penalty
      adjustment = -15;
      break;
  }
  
  // Ensure score stays in bounds
  const newScore = Math.max(0, Math.min(100, currentScore + adjustment));
  return newScore - currentScore; // Return actual adjustment applied
}

// ============================================
// VENDOR MATCHING
// ============================================

export interface VendorMatchInput {
  vendors: Vendor[];
  order: {
    propertyState: string;
    propertyZip?: string;
    signingType: SigningType;
    loanType?: LoanType;
    serviceTier: 'standard' | 'priority' | 'rescue';
    appointmentDate?: string;
    appointmentTime?: string;
  };
}

/**
 * Match and rank vendors for an order
 */
export function matchVendors(input: VendorMatchInput): VendorMatch[] {
  const { vendors, order } = input;
  
  // Filter eligible vendors
  const eligibleVendors = vendors.filter((vendor) => {
    // Must be active
    if (vendor.status !== 'active') return false;
    
    // Must be commissioned in the state
    const hasStateCommission = 
      vendor.primary_commission_state === order.propertyState ||
      (vendor.ron_registration_states || []).includes(order.propertyState);
    
    if (!hasStateCommission) return false;
    
    // For RON, must be RON certified
    if (order.signingType === 'ron' && !vendor.ron_certified) return false;
    
    // For priority/rescue tiers, require Elite or Gold
    if (order.serviceTier === 'priority' || order.serviceTier === 'rescue') {
      if (vendor.tier !== 'elite' && vendor.tier !== 'gold') return false;
    }
    
    return true;
  });
  
  // Score and rank vendors
  const matches: VendorMatch[] = eligibleVendors.map((vendor) => {
    const score = calculateVendorScore({
      vendor,
      order: {
        loanType: order.loanType,
        signingType: order.signingType,
        propertyZip: order.propertyZip,
      },
    });
    
    // Estimate response time based on history
    const estimatedResponseTime = vendor.average_response_time_seconds || 300;
    
    // Calculate specialty match
    let specialtyMatchScore = 100;
    if (order.loanType) {
      const loanConfig = LOAN_TYPE_CONFIGS[order.loanType];
      if (loanConfig?.specializations.length > 0) {
        const matchCount = loanConfig.specializations.filter((s) =>
          (vendor.specializations || []).includes(s as VendorSpecialization)
        ).length;
        specialtyMatchScore = (matchCount / loanConfig.specializations.length) * 100;
      }
    }
    
    return {
      vendor_id: vendor.id,
      vendor_name: `${vendor.first_name} ${vendor.last_name}`,
      tier: vendor.tier,
      elite_score: vendor.elite_score,
      distance_miles: null as null, // Would calculate from ZIP if available
      estimated_response_time: estimatedResponseTime,
      specialty_match_score: specialtyMatchScore,
      total_match_score: score,
      is_available: true,
    };
  });
  
  // Sort by tier priority, then score
  matches.sort((a, b) => {
    // Tier priority first
    const tierOrder: Record<VendorTier, number> = {
      elite: 1,
      gold: 2,
      silver: 3,
      bronze: 4,
    };
    const tierDiff = tierOrder[a.tier] - tierOrder[b.tier];
    if (tierDiff !== 0) return tierDiff;
    
    // Then by total match score
    return b.total_match_score - a.total_match_score;
  });
  
  return matches;
}

// ============================================
// ROUTING DECISION
// ============================================

/**
 * Make a complete routing decision for an order
 */
export function makeRoutingDecision(
  order: Partial<SigningOrder>,
  availableVendors: Vendor[]
): RoutingDecision {
  const eligibility = checkEligibility({
    propertyState: order.property_state || '',
    signingType: order.signing_type || 'in_person',
    loanType: order.loan_type as LoanType,
    serviceTier: order.service_tier,
  });
  
  const matches = matchVendors({
    vendors: availableVendors,
    order: {
      propertyState: order.property_state || '',
      propertyZip: order.property_zip || undefined,
      signingType: eligibility.recommendedType,
      loanType: order.loan_type as LoanType,
      serviceTier: order.service_tier || 'standard',
      appointmentDate: order.appointment_date || undefined,
      appointmentTime: order.appointment_time || undefined,
    },
  });
  
  return {
    order_id: order.id || '',
    signing_type: eligibility.recommendedType,
    state: order.property_state || '',
    ron_eligible: eligibility.ronEligible,
    in_person_eligible: eligibility.inPersonEligible,
    eligibility_reason: eligibility.reason,
    recommended_vendors: matches,
    assigned_vendor_id: matches[0]?.vendor_id || null,
    backup_vendor_id: matches[1]?.vendor_id || null,
  };
}

// ============================================
// SLA HELPERS
// ============================================

export function calculateSlaDeadlines(
  assignedAt: Date,
  serviceTier: 'standard' | 'priority' | 'rescue'
): { confirmationDeadline: Date; contactDeadline: Date } {
  const confirmationMins = 
    serviceTier === 'rescue' ? 3 :
    serviceTier === 'priority' ? 15 : 60;
  
  const contactMins =
    serviceTier === 'rescue' ? 15 :
    serviceTier === 'priority' ? 60 : 120;
  
  const confirmationDeadline = new Date(assignedAt.getTime() + confirmationMins * 60 * 1000);
  const contactDeadline = new Date(assignedAt.getTime() + contactMins * 60 * 1000);
  
  return { confirmationDeadline, contactDeadline };
}

export function isOverdue(deadline: Date): boolean {
  return new Date() > deadline;
}

export function getMinutesRemaining(deadline: Date): number {
  const now = new Date();
  const diff = deadline.getTime() - now.getTime();
  return Math.max(0, Math.floor(diff / 60000));
}

