/**
 * Notroom Smart Routing Engine
 * Handles vendor assignment based on state eligibility, scoring, and specialization
 */

import { supabase } from "@/integrations/supabase/client";
import { 
  STATE_ELIGIBILITY_MATRIX, 
  SCORE_WEIGHTS, 
  SLA_CONFIGS,
  LOAN_TYPE_CONFIGS,
  SERVICE_TIERS,
} from "@/constants/stateEligibility";
import type { 
  Vendor, 
  SigningOrder, 
  VendorMatch, 
  RoutingDecision,
  SigningType,
  LoanType,
  ServiceTier,
  VendorTier,
} from "@/types/vendor";

// ============================================
// ELIGIBILITY CHECK
// ============================================

export interface EligibilityResult {
  ronEligible: boolean;
  inPersonEligible: boolean;
  reason: string;
  stateConfig: typeof STATE_ELIGIBILITY_MATRIX[string] | null;
}

export function checkStateEligibility(
  state: string,
  signingType: SigningType,
  documentType?: string
): EligibilityResult {
  const stateConfig = STATE_ELIGIBILITY_MATRIX[state.toUpperCase()];

  if (!stateConfig) {
    return {
      ronEligible: false,
      inPersonEligible: false,
      reason: `State ${state} is not in the Notroom active network`,
      stateConfig: null,
    };
  }

  if (!stateConfig.isActive) {
    return {
      ronEligible: false,
      inPersonEligible: false,
      reason: `State ${state} is not yet launched (Phase ${stateConfig.launchPhase})`,
      stateConfig,
    };
  }

  return {
    ronEligible: stateConfig.ronAllowed,
    inPersonEligible: stateConfig.inPersonAllowed,
    reason: stateConfig.ronAllowed 
      ? `RON and In-Person available in ${state}` 
      : `In-Person only in ${state} (RON not authorized)`,
    stateConfig,
  };
}

// ============================================
// VENDOR MATCHING
// ============================================

export interface VendorSearchOptions {
  state: string;
  signingType: SigningType;
  loanType?: LoanType;
  serviceTier: ServiceTier;
  appointmentDate?: string;
  appointmentTime?: string;
  requiresRon?: boolean;
  specializations?: string[];
  limit?: number;
}

export async function findMatchingVendors(
  options: VendorSearchOptions
): Promise<VendorMatch[]> {
  const { 
    state, 
    signingType, 
    loanType, 
    serviceTier,
    requiresRon,
    specializations,
    limit = 10,
  } = options;

  // Get service tier config
  const tierConfig = SERVICE_TIERS.find(t => t.id === serviceTier);
  const requiresElite = tierConfig?.requiresEliteTier ?? false;

  // Build query — Supabase types are stale; regenerate with `supabase gen types`
  let query = (supabase as any)
    .from("vendors")
    .select("*")
    .eq("status", "active")
    .eq("primary_commission_state", state)
    .order("elite_score", { ascending: false })
    .limit(limit);

  // Filter by tier if required
  if (requiresElite) {
    query = query.in("tier", ["elite", "gold"]);
  }

  // Filter by RON capability if needed
  if (requiresRon || signingType === "ron") {
    query = query.eq("ron_certified", true);
  }

  const { data: vendorsRaw, error } = await query;

  if (error || !vendorsRaw) {
    console.error("Error fetching vendors:", error);
    return [];
  }

  const vendors = vendorsRaw as unknown as Vendor[];

  // Calculate match scores
  const matches: VendorMatch[] = vendors.map((vendor) => {
    const matchScore = calculateMatchScore(vendor, options);
    
    return {
      vendor_id: vendor.id,
      vendor_name: `${vendor.first_name} ${vendor.last_name}`,
      tier: vendor.tier,
      elite_score: vendor.elite_score,
      distance_miles: null as null, // Would require geocoding
      estimated_response_time: vendor.average_response_time_seconds || 180,
      specialty_match_score: matchScore.specialtyScore,
      total_match_score: matchScore.total,
      is_available: true, // Would need availability check
      availability_reason: undefined as undefined,
    };
  });

  // Sort by total match score
  return matches.sort((a, b) => b.total_match_score - a.total_match_score);
}

function calculateMatchScore(
  vendor: Vendor,
  options: VendorSearchOptions
): { total: number; specialtyScore: number } {
  let specialtyScore = 50; // Base score

  // Specialty match
  if (options.loanType) {
    const loanConfig = LOAN_TYPE_CONFIGS[options.loanType];
    if (loanConfig?.specializations.length > 0) {
      const hasMatch = loanConfig.specializations.some(
        spec => vendor.specializations?.includes(spec as any)
      );
      if (hasMatch) {
        specialtyScore += 30;
      }
    }
  }

  // Additional specialization matches
  if (options.specializations && vendor.specializations) {
    const matchCount = options.specializations.filter(
      s => vendor.specializations.includes(s as any)
    ).length;
    specialtyScore += matchCount * 10;
  }

  // Cap specialty score at 100
  specialtyScore = Math.min(100, specialtyScore);

  // Calculate total weighted score
  const total = 
    vendor.elite_score * 0.6 + // Primary weight on elite score
    specialtyScore * 0.3 + // Specialty match
    (vendor.first_pass_funding_rate || 0) * 0.1; // Funding rate

  return { total, specialtyScore };
}

// ============================================
// VENDOR ASSIGNMENT
// ============================================

export interface AssignmentResult {
  success: boolean;
  orderId: string;
  assignedVendorId?: string;
  backupVendorId?: string;
  message: string;
  slaTimers?: {
    confirmationDeadline: Date;
    contactDeadline: Date;
  };
}

export async function assignVendorToOrder(
  orderId: string,
  vendorId: string,
  backupVendorId?: string
): Promise<AssignmentResult> {
  const now = new Date();
  
  const { error } = await (supabase as any)
    .from("signing_orders")
    .update({
      assigned_vendor_id: vendorId,
      backup_vendor_id: backupVendorId || null,
      status: "assigned",
      assigned_at: now.toISOString(),
    })
    .eq("id", orderId);

  if (error) {
    return {
      success: false,
      orderId,
      message: `Failed to assign vendor: ${error.message}`,
    };
  }

  // Calculate SLA deadlines
  const confirmationDeadline = new Date(
    now.getTime() + SLA_CONFIGS.vendorAcceptDeclineMins * 60 * 1000
  );
  const contactDeadline = new Date(
    now.getTime() + SLA_CONFIGS.vendorBorrowerContactMins * 60 * 1000
  );

  // Log the assignment
  await (supabase as any).from("signing_order_status_history").insert({
    order_id: orderId,
    previous_status: "pending_assignment",
    new_status: "assigned",
    notes: `Assigned to vendor ${vendorId}`,
  });

  return {
    success: true,
    orderId,
    assignedVendorId: vendorId,
    backupVendorId,
    message: "Vendor assigned successfully",
    slaTimers: {
      confirmationDeadline,
      contactDeadline,
    },
  };
}

// ============================================
// AUTO-ROUTING (Full Workflow)
// ============================================

export async function autoRouteOrder(
  order: SigningOrder
): Promise<RoutingDecision> {
  // Step 1: Check state eligibility
  const eligibility = checkStateEligibility(
    order.property_state,
    order.signing_type,
    order.loan_type || undefined
  );

  // Step 2: Determine signing type
  let effectiveSigningType = order.signing_type;
  if (order.signing_type === "ron" && !eligibility.ronEligible) {
    // Fallback to in-person if RON not available
    effectiveSigningType = "in_person";
  }

  // Step 3: Find matching vendors
  const matches = await findMatchingVendors({
    state: order.property_state,
    signingType: effectiveSigningType,
    loanType: order.loan_type as LoanType | undefined,
    serviceTier: order.service_tier,
    requiresRon: effectiveSigningType === "ron",
  });

  // Step 4: Build routing decision
  const decision: RoutingDecision = {
    order_id: order.id,
    signing_type: effectiveSigningType,
    state: order.property_state,
    ron_eligible: eligibility.ronEligible,
    in_person_eligible: eligibility.inPersonEligible,
    eligibility_reason: eligibility.reason,
    recommended_vendors: matches,
    assigned_vendor_id: matches.length > 0 ? matches[0].vendor_id : null,
    backup_vendor_id: matches.length > 1 ? matches[1].vendor_id : null,
  };

  // Step 5: Auto-assign if vendors available
  if (decision.assigned_vendor_id) {
    await assignVendorToOrder(
      order.id,
      decision.assigned_vendor_id,
      decision.backup_vendor_id || undefined
    );
  }

  return decision;
}

// ============================================
// SCORE RECALCULATION
// ============================================

interface PerformanceLogRow {
  event_type?: string;
  response_time_seconds?: number | null;
  first_pass_funded?: boolean;
}

export async function recalculateVendorScore(vendorId: string): Promise<number> {
  // Fetch performance logs (last 90 days)
  const ninetyDaysAgo = new Date();
  ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

  const { data: logs } = await (supabase as any)
    .from("vendor_performance_log")
    .select("*")
    .eq("vendor_id", vendorId)
    .gte("created_at", ninetyDaysAgo.toISOString());

  if (!logs || logs.length === 0) {
    // No recent data, return default
    return 50;
  }

  const typedLogs = logs as PerformanceLogRow[];

  // Calculate component scores
  const responsiveness = calculateResponsivenessScore(typedLogs);
  const quality = calculateQualityScore(typedLogs);
  const reliability = calculateReliabilityScore(typedLogs);
  const compliance = calculateComplianceScore(typedLogs);

  // Weighted total
  const total = Math.round(
    responsiveness * SCORE_WEIGHTS.responsiveness * 100 +
    quality * SCORE_WEIGHTS.quality * 100 +
    reliability * SCORE_WEIGHTS.reliability * 100 +
    compliance * SCORE_WEIGHTS.compliance * 100
  );

  // Update vendor record
  const tier = getTierFromScore(total);
  
  await (supabase as any)
    .from("vendors")
    .update({
      elite_score: total,
      responsiveness_score: Math.round(responsiveness * 100),
      quality_score: Math.round(quality * 100),
      reliability_score: Math.round(reliability * 100),
      compliance_score: Math.round(compliance * 100),
      tier,
    })
    .eq("id", vendorId);

  return total;
}

function calculateResponsivenessScore(logs: PerformanceLogRow[]): number {
  const acceptLogs = logs.filter(l => l.event_type === "accept");
  if (acceptLogs.length === 0) return 0.5;

  const avgResponseTime = acceptLogs.reduce(
    (sum, l) => sum + (l.response_time_seconds || 180), 0
  ) / acceptLogs.length;

  // Under 3 minutes = 100%, over 10 minutes = 0%
  if (avgResponseTime <= 180) return 1;
  if (avgResponseTime >= 600) return 0;
  return 1 - ((avgResponseTime - 180) / (600 - 180));
}

function calculateQualityScore(logs: PerformanceLogRow[]): number {
  const completeLogs = logs.filter(l => l.event_type === "complete");
  if (completeLogs.length === 0) return 0.5;

  const fundedCount = completeLogs.filter(l => l.first_pass_funded).length;
  return fundedCount / completeLogs.length;
}

function calculateReliabilityScore(logs: PerformanceLogRow[]): number {
  const allLogs = logs.length;
  if (allLogs === 0) return 0.5;

  const noShows = logs.filter(l => l.event_type === "no_show").length;
  const lates = logs.filter(l => l.event_type === "late").length;

  const badEvents = noShows * 2 + lates; // No-shows weighted more heavily
  return Math.max(0, 1 - (badEvents / allLogs) * 2);
}

function calculateComplianceScore(logs: PerformanceLogRow[]): number {
  const defects = logs.filter(l => l.event_type === "defect").length;
  const total = logs.length;
  if (total === 0) return 0.5;

  return Math.max(0, 1 - (defects / total) * 3);
}

function getTierFromScore(score: number): VendorTier {
  if (score >= 90) return "elite";
  if (score >= 80) return "gold";
  if (score >= 70) return "silver";
  return "bronze";
}

// ============================================
// ESCALATION & FALLBACK
// ============================================

export async function handleVendorDecline(orderId: string): Promise<void> {
  // Fetch order with backup vendor
  const { data: orderRow } = await (supabase as any)
    .from("signing_orders")
    .select("*, backup_vendor:backup_vendor_id(*)")
    .eq("id", orderId)
    .single();

  const order = orderRow as unknown as SigningOrder | null;
  if (!order) return;

  if (order.backup_vendor_id) {
    // Assign to backup vendor
    await (supabase as any).from("signing_orders").update({
      assigned_vendor_id: order.backup_vendor_id,
      backup_vendor_id: null,
      status: "assigned",
      assigned_at: new Date().toISOString(),
    }).eq("id", orderId);

    await (supabase as any).from("signing_order_status_history").insert({
      order_id: orderId,
      previous_status: "declined",
      new_status: "assigned",
      notes: "Auto-assigned to backup vendor after primary declined",
    });
  } else {
    // Find new vendor
    const decision = await autoRouteOrder(order);
    
    if (!decision.assigned_vendor_id) {
      // No vendors available - alert admin
      await (supabase as any).from("signing_orders").update({
        status: "pending_assignment",
        has_issues: true,
        issue_description: "No available vendors for this state/time",
      }).eq("id", orderId);
    }
  }
}

