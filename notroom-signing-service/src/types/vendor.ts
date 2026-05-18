/**
 * Notroom National Vendor Network Type Definitions
 * Types for the multi-state signing service operations
 */

// ============================================
// ENUMS
// ============================================

export type VendorTier = 'bronze' | 'silver' | 'gold' | 'elite';

export type VendorStatus = 'pending' | 'active' | 'suspended' | 'inactive';

export type SigningOrderStatus =
  | 'pending_assignment'
  | 'assigned'
  | 'accepted'
  | 'declined'
  | 'en_route'
  | 'arrived'
  | 'in_progress'
  | 'completed'
  | 'scanback_pending'
  | 'scanback_uploaded'
  | 'qa_review'
  | 'shipped'
  | 'funded'
  | 'cancelled'
  | 'failed';

export type SigningType = 'in_person' | 'ron' | 'hybrid';

export type ServiceTier = 'standard' | 'priority' | 'rescue';

export type LoanType = 
  | 'purchase' 
  | 'refinance' 
  | 'heloc' 
  | 'reverse' 
  | 'commercial' 
  | 'dscr'
  | 'va'
  | 'fha'
  | 'construction'
  | 'other';

export type VendorSpecialization = 
  | 'heloc'
  | 'reverse'
  | 'commercial'
  | 'va'
  | 'hospital'
  | 'jail'
  | 'nursing_home'
  | 'seller_finance'
  | 'private_lending';

// ============================================
// VENDOR TYPES
// ============================================

export interface Vendor {
  id: string;
  user_id: string | null;
  
  // Personal Information
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  secondary_phone: string | null;
  
  // Business Information
  business_name: string | null;
  business_address: string | null;
  city: string;
  state: string;
  zip_code: string;
  
  // Commission Details
  primary_commission_state: string;
  primary_commission_number: string;
  primary_commission_expiry: string;
  
  // Qualifications
  is_nsa_certified: boolean;
  nna_member_id: string | null;
  years_experience: number;
  languages: string[];
  
  // Equipment
  has_dual_tray_printer: boolean;
  has_scanner: boolean;
  has_mobile_hotspot: boolean;
  has_backup_equipment: boolean;
  
  // Insurance & Bonding
  eo_insurance_amount: number | null;
  eo_policy_number: string | null;
  eo_expiry_date: string | null;
  bond_amount: number | null;
  bond_expiry_date: string | null;
  
  // Background Check
  background_check_date: string | null;
  background_check_provider: string | null;
  background_check_passed: boolean;
  
  // RON Capabilities
  ron_certified: boolean;
  ron_platform: string | null;
  ron_registration_states: string[];
  
  // Service Preferences
  max_travel_radius_miles: number;
  available_weekends: boolean;
  available_after_hours: boolean;
  
  // Specializations
  specializations: VendorSpecialization[];
  
  // Scoring & Tier
  tier: VendorTier;
  elite_score: number;
  responsiveness_score: number;
  quality_score: number;
  reliability_score: number;
  compliance_score: number;
  
  // Statistics
  total_signings: number;
  successful_signings: number;
  failed_signings: number;
  first_pass_funding_rate: number;
  average_response_time_seconds: number | null;
  
  // Payment
  preferred_payment_method: string;
  payment_email: string | null;
  fast_pay_eligible: boolean;
  
  // Status
  status: VendorStatus;
  onboarded_at: string | null;
  last_active_at: string | null;
  
  // Metadata
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface VendorStateCommission {
  id: string;
  vendor_id: string;
  state: string;
  commission_number: string;
  commission_expiry: string;
  counties_covered: string[];
  ron_registered: boolean;
  ron_registration_date: string | null;
  created_at: string;
  updated_at: string;
}

// ============================================
// TITLE CLIENT TYPES
// ============================================

export interface TitleClient {
  id: string;
  company_name: string;
  company_type: 'title_company' | 'lender' | 'signing_service' | 'law_firm';
  
  // Contact
  primary_contact_name: string;
  primary_contact_email: string;
  primary_contact_phone: string;
  billing_email: string | null;
  
  // Address
  address: string | null;
  city: string | null;
  state: string | null;
  zip_code: string | null;
  
  // Preferences
  default_signing_type: SigningType;
  requires_dual_scan: boolean;
  scanback_method: 'email' | 'upload' | 'ftp';
  preferred_courier: string | null;
  
  // SLA Configuration
  confirmation_sla_minutes: number;
  contact_sla_minutes: number;
  
  // Billing
  billing_terms: string;
  rate_card: Record<string, number>;
  
  // Status
  is_active: boolean;
  pilot_mode: boolean;
  pilot_signings_remaining: number;
  
  // Statistics
  total_orders: number;
  completed_orders: number;
  satisfaction_score: number | null;
  
  created_at: string;
  updated_at: string;
}

// ============================================
// SIGNING ORDER TYPES
// ============================================

export interface SigningOrder {
  id: string;
  order_number: string;
  
  // Client Reference
  title_client_id: string | null;
  client_reference: string | null;
  
  // Signing Type & Status
  signing_type: SigningType;
  status: SigningOrderStatus;
  
  // Loan/Transaction Details
  loan_type: LoanType | null;
  loan_amount: number | null;
  property_address: string | null;
  property_city: string | null;
  property_state: string;
  property_zip: string | null;
  
  // Signer Information
  signer_name: string;
  signer_email: string | null;
  signer_phone: string;
  co_signer_name: string | null;
  co_signer_phone: string | null;
  number_of_signers: number;
  
  // Appointment Details
  appointment_date: string | null;
  appointment_time: string | null;
  appointment_timezone: string;
  signing_location: string | null;
  special_instructions: string | null;
  
  // Document Package
  documents_received_at: string | null;
  document_count: number | null;
  has_critical_docs_checklist: boolean;
  
  // Assignment
  assigned_vendor_id: string | null;
  assigned_at: string | null;
  accepted_at: string | null;
  declined_at: string | null;
  decline_reason: string | null;
  backup_vendor_id: string | null;
  
  // Execution
  vendor_en_route_at: string | null;
  vendor_arrived_at: string | null;
  signing_started_at: string | null;
  signing_completed_at: string | null;
  
  // Scanback & Delivery
  scanback_uploaded_at: string | null;
  scanback_url: string | null;
  qa_passed: boolean | null;
  qa_notes: string | null;
  shipped_at: string | null;
  tracking_number: string | null;
  courier_service: string | null;
  delivered_at: string | null;
  
  // RON Specific
  ron_session_id: string | null;
  ron_provider: string | null;
  ron_recording_url: string | null;
  
  // Funding
  funded_at: string | null;
  first_pass_funded: boolean | null;
  
  // Issues
  has_issues: boolean;
  issue_description: string | null;
  issue_resolved_at: string | null;
  
  // Pricing
  service_tier: ServiceTier;
  base_fee: number | null;
  rush_fee: number;
  travel_fee: number;
  total_client_fee: number | null;
  vendor_payout: number | null;
  vendor_paid_at: string | null;
  
  // Metadata
  created_at: string;
  updated_at: string;
  
  // Joined data (optional)
  vendor?: Vendor;
  title_client?: TitleClient;
}

// ============================================
// STATE ELIGIBILITY TYPES
// ============================================

export interface StateEligibilityRule {
  id: string;
  state: string;
  state_name: string;
  
  // In-Person Rules
  in_person_allowed: boolean;
  notary_must_be_state_commissioned: boolean;
  witness_requirements: 'none' | 'one' | 'two' | 'varies_by_doc';
  
  // RON Rules
  ron_allowed: boolean;
  ron_provider_approval_required: boolean;
  ron_approved_providers: string[];
  ron_notary_location_restriction: 'any' | 'must_be_in_state' | 'approved_states';
  
  // Witness Rules for RON
  ron_witness_allowed: boolean;
  ron_witness_can_be_remote: boolean;
  
  // Document Restrictions
  restricted_document_types: string[];
  
  // Special Requirements
  special_requirements: string | null;
  
  // Notroom Status
  is_active: boolean;
  launch_date: string | null;
  vendor_count: number;
  
  updated_at: string;
}

// ============================================
// SCORING & PERFORMANCE TYPES
// ============================================

export interface VendorPerformanceLog {
  id: string;
  vendor_id: string;
  order_id: string | null;
  event_type: 'accept' | 'decline' | 'complete' | 'defect' | 'late' | 'no_show';
  response_time_seconds: number | null;
  quality_rating: number | null;
  on_time: boolean | null;
  first_pass_funded: boolean | null;
  score_adjustment: number;
  notes: string | null;
  created_at: string;
}

export interface VendorScoreCalculation {
  vendor_id: string;
  
  // Component Scores (0-100)
  responsiveness: number;
  quality: number;
  reliability: number;
  compliance: number;
  specialty_match: number;
  
  // Weighted Total
  total_score: number;
  
  // Derived Tier
  tier: VendorTier;
}

// ============================================
// ROUTING TYPES
// ============================================

export interface RoutingDecision {
  order_id: string;
  signing_type: SigningType;
  state: string;
  
  // Eligibility Check Results
  ron_eligible: boolean;
  in_person_eligible: boolean;
  eligibility_reason: string;
  
  // Selected Vendors (ranked)
  recommended_vendors: VendorMatch[];
  
  // Assignment
  assigned_vendor_id: string | null;
  backup_vendor_id: string | null;
}

export interface VendorMatch {
  vendor_id: string;
  vendor_name: string;
  tier: VendorTier;
  elite_score: number;
  distance_miles: number | null;
  estimated_response_time: number;
  specialty_match_score: number;
  total_match_score: number;
  is_available: boolean;
  availability_reason?: string;
}

// ============================================
// FORM TYPES
// ============================================

export interface VendorOnboardingForm {
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  business_name?: string;
  city: string;
  state: string;
  zip_code: string;
  primary_commission_state: string;
  primary_commission_number: string;
  primary_commission_expiry: string;
  is_nsa_certified: boolean;
  years_experience: number;
  languages: string[];
  has_dual_tray_printer: boolean;
  has_scanner: boolean;
  has_mobile_hotspot: boolean;
  eo_insurance_amount: number;
  eo_policy_number: string;
  eo_expiry_date: string;
  ron_certified: boolean;
  ron_platform?: string;
  max_travel_radius_miles: number;
  available_weekends: boolean;
  available_after_hours: boolean;
  specializations: VendorSpecialization[];
}

export interface SigningOrderForm {
  title_client_id?: string;
  client_reference?: string;
  signing_type: SigningType;
  loan_type?: LoanType;
  loan_amount?: number;
  property_address: string;
  property_city: string;
  property_state: string;
  property_zip: string;
  signer_name: string;
  signer_email?: string;
  signer_phone: string;
  co_signer_name?: string;
  co_signer_phone?: string;
  number_of_signers: number;
  appointment_date: string;
  appointment_time: string;
  signing_location?: string;
  special_instructions?: string;
  service_tier: ServiceTier;
}

// ============================================
// API RESPONSE TYPES
// ============================================

export interface VendorSearchParams {
  state: string;
  zip_code?: string;
  signing_type?: SigningType;
  loan_type?: LoanType;
  specializations?: VendorSpecialization[];
  min_tier?: VendorTier;
  available_date?: string;
  available_time?: string;
}

export interface OrderAssignmentResult {
  success: boolean;
  order_id: string;
  assigned_vendor_id?: string;
  backup_vendor_id?: string;
  message: string;
  sla_timers: {
    confirmation_deadline: string;
    contact_deadline: string;
  };
}

