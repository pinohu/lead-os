-- Notroom National Vendor Network Schema
-- Migration: Create vendor management tables for multi-state signing service

-- Vendor tier enum
CREATE TYPE vendor_tier AS ENUM ('bronze', 'silver', 'gold', 'elite');

-- Vendor status enum
CREATE TYPE vendor_status AS ENUM ('pending', 'active', 'suspended', 'inactive');

-- Signing order status enum
CREATE TYPE signing_order_status AS ENUM (
  'pending_assignment',
  'assigned',
  'accepted',
  'declined',
  'en_route',
  'arrived',
  'in_progress',
  'completed',
  'scanback_pending',
  'scanback_uploaded',
  'qa_review',
  'shipped',
  'funded',
  'cancelled',
  'failed'
);

-- Signing type enum
CREATE TYPE signing_type AS ENUM ('in_person', 'ron', 'hybrid');

-- ============================================
-- VENDORS TABLE (Notary Network)
-- ============================================
CREATE TABLE IF NOT EXISTS vendors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  
  -- Personal Information
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  phone TEXT NOT NULL,
  secondary_phone TEXT,
  
  -- Business Information
  business_name TEXT,
  business_address TEXT,
  city TEXT NOT NULL,
  state TEXT NOT NULL,
  zip_code TEXT NOT NULL,
  
  -- Commission Details (can have multiple states)
  primary_commission_state TEXT NOT NULL,
  primary_commission_number TEXT NOT NULL,
  primary_commission_expiry DATE NOT NULL,
  
  -- Qualifications
  is_nsa_certified BOOLEAN DEFAULT false,
  nna_member_id TEXT,
  years_experience INTEGER DEFAULT 0,
  languages TEXT[] DEFAULT ARRAY['english'],
  
  -- Equipment Verification
  has_dual_tray_printer BOOLEAN DEFAULT false,
  has_scanner BOOLEAN DEFAULT false,
  has_mobile_hotspot BOOLEAN DEFAULT false,
  has_backup_equipment BOOLEAN DEFAULT false,
  
  -- Insurance & Bonding
  eo_insurance_amount DECIMAL(12, 2),
  eo_policy_number TEXT,
  eo_expiry_date DATE,
  bond_amount DECIMAL(12, 2),
  bond_expiry_date DATE,
  
  -- Background Check
  background_check_date DATE,
  background_check_provider TEXT,
  background_check_passed BOOLEAN DEFAULT false,
  
  -- RON Capabilities
  ron_certified BOOLEAN DEFAULT false,
  ron_platform TEXT, -- 'proof', 'notarycam', 'docverify', etc.
  ron_registration_states TEXT[] DEFAULT ARRAY[]::TEXT[],
  
  -- Service Preferences
  max_travel_radius_miles INTEGER DEFAULT 25,
  available_weekends BOOLEAN DEFAULT true,
  available_after_hours BOOLEAN DEFAULT true,
  
  -- Specializations
  specializations TEXT[] DEFAULT ARRAY[]::TEXT[], -- 'heloc', 'reverse', 'commercial', 'va', 'hospital'
  
  -- Scoring & Tier
  tier vendor_tier DEFAULT 'bronze',
  elite_score INTEGER DEFAULT 50, -- 0-100
  
  -- Score Components (tracked separately for transparency)
  responsiveness_score INTEGER DEFAULT 50,
  quality_score INTEGER DEFAULT 50,
  reliability_score INTEGER DEFAULT 50,
  compliance_score INTEGER DEFAULT 50,
  
  -- Statistics
  total_signings INTEGER DEFAULT 0,
  successful_signings INTEGER DEFAULT 0,
  failed_signings INTEGER DEFAULT 0,
  first_pass_funding_rate DECIMAL(5, 2) DEFAULT 0,
  average_response_time_seconds INTEGER,
  
  -- Payment
  preferred_payment_method TEXT DEFAULT 'ach',
  payment_email TEXT,
  fast_pay_eligible BOOLEAN DEFAULT false,
  
  -- Status
  status vendor_status DEFAULT 'pending',
  onboarded_at TIMESTAMP WITH TIME ZONE,
  last_active_at TIMESTAMP WITH TIME ZONE,
  
  -- Metadata
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- VENDOR STATE COMMISSIONS (Multi-state support)
-- ============================================
CREATE TABLE IF NOT EXISTS vendor_state_commissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id UUID NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,
  
  state TEXT NOT NULL,
  commission_number TEXT NOT NULL,
  commission_expiry DATE NOT NULL,
  counties_covered TEXT[] DEFAULT ARRAY[]::TEXT[], -- Empty means entire state
  
  -- RON specific
  ron_registered BOOLEAN DEFAULT false,
  ron_registration_date DATE,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(vendor_id, state)
);

-- ============================================
-- TITLE CLIENTS (Companies we serve)
-- ============================================
CREATE TABLE IF NOT EXISTS title_clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Company Information
  company_name TEXT NOT NULL,
  company_type TEXT DEFAULT 'title_company', -- 'title_company', 'lender', 'signing_service', 'law_firm'
  
  -- Contact
  primary_contact_name TEXT NOT NULL,
  primary_contact_email TEXT NOT NULL,
  primary_contact_phone TEXT NOT NULL,
  billing_email TEXT,
  
  -- Address
  address TEXT,
  city TEXT,
  state TEXT,
  zip_code TEXT,
  
  -- Preferences
  default_signing_type signing_type DEFAULT 'in_person',
  requires_dual_scan BOOLEAN DEFAULT false,
  scanback_method TEXT DEFAULT 'email', -- 'email', 'upload', 'ftp'
  preferred_courier TEXT,
  
  -- SLA Configuration
  confirmation_sla_minutes INTEGER DEFAULT 15,
  contact_sla_minutes INTEGER DEFAULT 60,
  
  -- Billing
  billing_terms TEXT DEFAULT 'net_30',
  rate_card JSONB DEFAULT '{}'::JSONB,
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  pilot_mode BOOLEAN DEFAULT true,
  pilot_signings_remaining INTEGER DEFAULT 10,
  
  -- Statistics
  total_orders INTEGER DEFAULT 0,
  completed_orders INTEGER DEFAULT 0,
  satisfaction_score DECIMAL(3, 2),
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- SIGNING ORDERS (Core transaction table)
-- ============================================
CREATE TABLE IF NOT EXISTS signing_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number TEXT UNIQUE NOT NULL, -- NR-2024-001234 format
  
  -- Client Reference
  title_client_id UUID REFERENCES title_clients(id) ON DELETE SET NULL,
  client_reference TEXT, -- Their internal file number
  
  -- Signing Type & Status
  signing_type signing_type NOT NULL DEFAULT 'in_person',
  status signing_order_status DEFAULT 'pending_assignment',
  
  -- Loan/Transaction Details
  loan_type TEXT, -- 'purchase', 'refinance', 'heloc', 'reverse', 'commercial', 'dscr'
  loan_amount DECIMAL(14, 2),
  property_address TEXT,
  property_city TEXT,
  property_state TEXT NOT NULL,
  property_zip TEXT,
  
  -- Borrower/Signer Information
  signer_name TEXT NOT NULL,
  signer_email TEXT,
  signer_phone TEXT NOT NULL,
  co_signer_name TEXT,
  co_signer_phone TEXT,
  number_of_signers INTEGER DEFAULT 1,
  
  -- Appointment Details
  appointment_date DATE,
  appointment_time TIME,
  appointment_timezone TEXT DEFAULT 'America/New_York',
  signing_location TEXT, -- Address or 'RON'
  special_instructions TEXT,
  
  -- Document Package
  documents_received_at TIMESTAMP WITH TIME ZONE,
  document_count INTEGER,
  has_critical_docs_checklist BOOLEAN DEFAULT false,
  
  -- Assignment
  assigned_vendor_id UUID REFERENCES vendors(id) ON DELETE SET NULL,
  assigned_at TIMESTAMP WITH TIME ZONE,
  accepted_at TIMESTAMP WITH TIME ZONE,
  declined_at TIMESTAMP WITH TIME ZONE,
  decline_reason TEXT,
  
  -- Backup Assignment
  backup_vendor_id UUID REFERENCES vendors(id) ON DELETE SET NULL,
  
  -- Execution
  vendor_en_route_at TIMESTAMP WITH TIME ZONE,
  vendor_arrived_at TIMESTAMP WITH TIME ZONE,
  signing_started_at TIMESTAMP WITH TIME ZONE,
  signing_completed_at TIMESTAMP WITH TIME ZONE,
  
  -- Scanback & Delivery
  scanback_uploaded_at TIMESTAMP WITH TIME ZONE,
  scanback_url TEXT,
  qa_passed BOOLEAN,
  qa_notes TEXT,
  shipped_at TIMESTAMP WITH TIME ZONE,
  tracking_number TEXT,
  courier_service TEXT,
  delivered_at TIMESTAMP WITH TIME ZONE,
  
  -- RON Specific
  ron_session_id TEXT,
  ron_provider TEXT,
  ron_recording_url TEXT,
  
  -- Funding
  funded_at TIMESTAMP WITH TIME ZONE,
  first_pass_funded BOOLEAN,
  
  -- Issues
  has_issues BOOLEAN DEFAULT false,
  issue_description TEXT,
  issue_resolved_at TIMESTAMP WITH TIME ZONE,
  
  -- Pricing
  service_tier TEXT DEFAULT 'standard', -- 'standard', 'priority', 'rescue'
  base_fee DECIMAL(10, 2),
  rush_fee DECIMAL(10, 2) DEFAULT 0,
  travel_fee DECIMAL(10, 2) DEFAULT 0,
  total_client_fee DECIMAL(10, 2),
  vendor_payout DECIMAL(10, 2),
  vendor_paid_at TIMESTAMP WITH TIME ZONE,
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- SIGNING ORDER STATUS HISTORY
-- ============================================
CREATE TABLE IF NOT EXISTS signing_order_status_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES signing_orders(id) ON DELETE CASCADE,
  
  previous_status signing_order_status,
  new_status signing_order_status NOT NULL,
  changed_by UUID REFERENCES auth.users(id),
  notes TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- VENDOR PERFORMANCE LOG
-- ============================================
CREATE TABLE IF NOT EXISTS vendor_performance_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id UUID NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,
  order_id UUID REFERENCES signing_orders(id) ON DELETE SET NULL,
  
  event_type TEXT NOT NULL, -- 'accept', 'decline', 'complete', 'defect', 'late', 'no_show'
  
  -- Metrics captured
  response_time_seconds INTEGER,
  quality_rating INTEGER, -- 1-5
  on_time BOOLEAN,
  first_pass_funded BOOLEAN,
  
  -- Score impact
  score_adjustment INTEGER DEFAULT 0,
  notes TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- STATE ELIGIBILITY RULES
-- ============================================
CREATE TABLE IF NOT EXISTS state_eligibility_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  state TEXT PRIMARY KEY,
  state_name TEXT NOT NULL,
  
  -- In-Person Rules
  in_person_allowed BOOLEAN DEFAULT true,
  notary_must_be_state_commissioned BOOLEAN DEFAULT true,
  witness_requirements TEXT, -- 'none', 'one', 'two', 'varies_by_doc'
  
  -- RON Rules
  ron_allowed BOOLEAN DEFAULT true,
  ron_provider_approval_required BOOLEAN DEFAULT false,
  ron_approved_providers TEXT[] DEFAULT ARRAY[]::TEXT[],
  ron_notary_location_restriction TEXT, -- 'any', 'must_be_in_state', 'approved_states'
  
  -- Witness Rules for RON
  ron_witness_allowed BOOLEAN DEFAULT true,
  ron_witness_can_be_remote BOOLEAN DEFAULT true,
  
  -- Document Restrictions
  restricted_document_types TEXT[] DEFAULT ARRAY[]::TEXT[],
  
  -- Special Requirements
  special_requirements TEXT,
  
  -- Notroom Status
  is_active BOOLEAN DEFAULT false,
  launch_date DATE,
  vendor_count INTEGER DEFAULT 0,
  
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- INDEXES
-- ============================================
CREATE INDEX idx_vendors_state ON vendors(primary_commission_state);
CREATE INDEX idx_vendors_tier ON vendors(tier);
CREATE INDEX idx_vendors_status ON vendors(status);
CREATE INDEX idx_vendors_elite_score ON vendors(elite_score DESC);
CREATE INDEX idx_vendors_zip ON vendors(zip_code);

CREATE INDEX idx_vendor_commissions_state ON vendor_state_commissions(state);
CREATE INDEX idx_vendor_commissions_vendor ON vendor_state_commissions(vendor_id);

CREATE INDEX idx_signing_orders_status ON signing_orders(status);
CREATE INDEX idx_signing_orders_state ON signing_orders(property_state);
CREATE INDEX idx_signing_orders_date ON signing_orders(appointment_date);
CREATE INDEX idx_signing_orders_client ON signing_orders(title_client_id);
CREATE INDEX idx_signing_orders_vendor ON signing_orders(assigned_vendor_id);

CREATE INDEX idx_performance_log_vendor ON vendor_performance_log(vendor_id);
CREATE INDEX idx_performance_log_date ON vendor_performance_log(created_at);

-- ============================================
-- TRIGGERS
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_vendors_updated_at
  BEFORE UPDATE ON vendors
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_title_clients_updated_at
  BEFORE UPDATE ON title_clients
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_signing_orders_updated_at
  BEFORE UPDATE ON signing_orders
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================
ALTER TABLE vendors ENABLE ROW LEVEL SECURITY;
ALTER TABLE vendor_state_commissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE title_clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE signing_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE signing_order_status_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE vendor_performance_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE state_eligibility_rules ENABLE ROW LEVEL SECURITY;

-- Admin can do everything
CREATE POLICY "Admin full access to vendors" ON vendors
  FOR ALL USING (has_role('admin', auth.uid()));

CREATE POLICY "Admin full access to title_clients" ON title_clients
  FOR ALL USING (has_role('admin', auth.uid()));

CREATE POLICY "Admin full access to signing_orders" ON signing_orders
  FOR ALL USING (has_role('admin', auth.uid()));

CREATE POLICY "Admin full access to state_eligibility_rules" ON state_eligibility_rules
  FOR ALL USING (has_role('admin', auth.uid()));

-- Vendors can view their own data
CREATE POLICY "Vendors view own profile" ON vendors
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Vendors view assigned orders" ON signing_orders
  FOR SELECT USING (
    assigned_vendor_id IN (SELECT id FROM vendors WHERE user_id = auth.uid())
  );

-- Public can view state eligibility rules
CREATE POLICY "Public view state rules" ON state_eligibility_rules
  FOR SELECT USING (true);

-- ============================================
-- SEED STATE ELIGIBILITY DATA (First 10 States)
-- ============================================
INSERT INTO state_eligibility_rules (state, state_name, in_person_allowed, ron_allowed, witness_requirements, ron_notary_location_restriction, special_requirements, is_active, launch_date)
VALUES
  ('PA', 'Pennsylvania', true, true, 'varies_by_doc', 'must_be_in_state', 'Must use PA-approved RON providers', true, '2024-01-01'),
  ('OH', 'Ohio', true, true, 'varies_by_doc', 'any', 'Strong hybrid candidate', true, '2024-01-01'),
  ('NJ', 'New Jersey', true, true, 'varies_by_doc', 'any', 'Elite-only routing recommended', true, '2024-01-01'),
  ('MD', 'Maryland', true, true, 'none', 'any', 'RON friendly state', true, '2024-01-01'),
  ('NY', 'New York', true, true, 'varies_by_doc', 'any', 'Strict compliance expectations - use senior notaries', true, '2024-02-01'),
  ('VA', 'Virginia', true, true, 'none', 'any', 'Excellent RON expansion state', true, '2024-02-01'),
  ('NC', 'North Carolina', true, true, 'varies_by_doc', 'any', 'Some document types restricted for RON', true, '2024-02-01'),
  ('FL', 'Florida', true, true, 'two', 'any', 'Witnesses often required - platform provided', true, '2024-03-01'),
  ('TX', 'Texas', true, true, 'none', 'any', 'High volume - performance routing essential', true, '2024-03-01'),
  ('CA', 'California', true, false, 'one', 'must_be_in_state', 'RON NOT authorized - IP only', true, '2024-03-01'),
  ('IL', 'Illinois', true, true, 'none', 'any', 'Central US anchor', true, '2024-04-01')
ON CONFLICT (state) DO UPDATE SET
  state_name = EXCLUDED.state_name,
  in_person_allowed = EXCLUDED.in_person_allowed,
  ron_allowed = EXCLUDED.ron_allowed,
  witness_requirements = EXCLUDED.witness_requirements,
  ron_notary_location_restriction = EXCLUDED.ron_notary_location_restriction,
  special_requirements = EXCLUDED.special_requirements,
  is_active = EXCLUDED.is_active,
  launch_date = EXCLUDED.launch_date;

-- Generate order number function
CREATE OR REPLACE FUNCTION generate_order_number()
RETURNS TEXT AS $$
DECLARE
  year_part TEXT;
  seq_num INTEGER;
  new_number TEXT;
BEGIN
  year_part := TO_CHAR(NOW(), 'YYYY');
  
  SELECT COALESCE(MAX(
    CAST(SUBSTRING(order_number FROM 9) AS INTEGER)
  ), 0) + 1
  INTO seq_num
  FROM signing_orders
  WHERE order_number LIKE 'NR-' || year_part || '-%';
  
  new_number := 'NR-' || year_part || '-' || LPAD(seq_num::TEXT, 6, '0');
  RETURN new_number;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-generate order number
CREATE OR REPLACE FUNCTION set_order_number()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.order_number IS NULL THEN
    NEW.order_number := generate_order_number();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_signing_order_number
  BEFORE INSERT ON signing_orders
  FOR EACH ROW EXECUTE FUNCTION set_order_number();

