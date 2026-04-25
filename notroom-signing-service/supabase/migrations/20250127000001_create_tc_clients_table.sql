-- Create table for Transaction Coordination clients
CREATE TABLE IF NOT EXISTS public.tc_clients (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  
  -- Client Information
  client_name TEXT NOT NULL CHECK (char_length(client_name) > 0 AND char_length(client_name) <= 200),
  client_email TEXT NOT NULL CHECK (char_length(client_email) > 0 AND char_length(client_email) <= 255 AND client_email ~* '^[^\s@]+@[^\s@]+\.[^\s@]+$'),
  client_phone TEXT NOT NULL CHECK (char_length(client_phone) >= 10 AND char_length(client_phone) <= 20),
  business_name TEXT CHECK (char_length(business_name) <= 200),
  
  -- Transaction Details
  transaction_type TEXT NOT NULL CHECK (transaction_type IN ('real_estate', 'business_sale', 'merger_acquisition', 'contract_negotiation', 'settlement', 'other')),
  transaction_description TEXT CHECK (char_length(transaction_description) <= 2000),
  parties_involved TEXT[] DEFAULT ARRAY[]::TEXT[],
  key_documents TEXT[] DEFAULT ARRAY[]::TEXT[],
  target_completion_date DATE,
  urgency_level TEXT NOT NULL DEFAULT 'standard' CHECK (urgency_level IN ('standard', 'expedited', 'rush')),
  
  -- Service Selection
  selected_plan TEXT NOT NULL CHECK (selected_plan IN ('basic', 'standard', 'premium')),
  plan_price_id TEXT NOT NULL,
  
  -- Status & Metadata
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'completed', 'cancelled', 'on_hold')),
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  stripe_payment_intent_id TEXT,
  
  -- Coordination Details
  coordinator_assigned TEXT,
  current_phase TEXT CHECK (current_phase IN ('intake', 'document_review', 'negotiation', 'execution', 'closing', 'post_closing')),
  notes TEXT CHECK (char_length(notes) <= 5000),
  admin_notes TEXT CHECK (char_length(admin_notes) <= 5000),
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  cancelled_at TIMESTAMP WITH TIME ZONE
);

-- Enable Row Level Security
ALTER TABLE public.tc_clients ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can create TC client records (public form submissions)
CREATE POLICY "Anyone can create TC client records"
ON public.tc_clients
FOR INSERT
TO anon, authenticated
WITH CHECK (true);

-- Policy: Users can view their own TC client records
CREATE POLICY "Users can view their own TC client records"
ON public.tc_clients
FOR SELECT
TO authenticated
USING (auth.uid() = user_id OR user_id IS NULL);

-- Policy: Users can update their own pending TC client records
CREATE POLICY "Users can update their own pending TC client records"
ON public.tc_clients
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id AND status = 'pending')
WITH CHECK (auth.uid() = user_id AND status = 'pending');

-- Policy: Admins can view all TC client records
CREATE POLICY "Admins can view all TC client records"
ON public.tc_clients
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role));

-- Policy: Admins can update all TC client records
CREATE POLICY "Admins can update all TC client records"
ON public.tc_clients
FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

-- Policy: Admins can delete TC client records
CREATE POLICY "Admins can delete TC client records"
ON public.tc_clients
FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role));

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_tc_clients_user_id ON public.tc_clients(user_id);
CREATE INDEX IF NOT EXISTS idx_tc_clients_status ON public.tc_clients(status);
CREATE INDEX IF NOT EXISTS idx_tc_clients_stripe_customer ON public.tc_clients(stripe_customer_id);
CREATE INDEX IF NOT EXISTS idx_tc_clients_created_at ON public.tc_clients(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_tc_clients_transaction_type ON public.tc_clients(transaction_type);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_tc_clients_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Create trigger
CREATE TRIGGER update_tc_clients_updated_at
BEFORE UPDATE ON public.tc_clients
FOR EACH ROW
EXECUTE FUNCTION public.update_tc_clients_updated_at();

-- Add comment to table
COMMENT ON TABLE public.tc_clients IS 'Transaction Coordination service clients - manages complex transaction coordination services';

