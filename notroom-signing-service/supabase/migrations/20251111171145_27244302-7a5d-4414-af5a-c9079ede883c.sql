-- Create tc_clients table for transaction coordination service
CREATE TABLE IF NOT EXISTS public.tc_clients (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  client_name TEXT NOT NULL,
  client_email TEXT NOT NULL,
  client_phone TEXT NOT NULL,
  business_name TEXT,
  transaction_type TEXT NOT NULL,
  transaction_description TEXT NOT NULL,
  parties_involved TEXT[] DEFAULT '{}',
  key_documents TEXT[],
  target_completion_date TIMESTAMPTZ,
  urgency_level TEXT NOT NULL DEFAULT 'standard',
  selected_plan TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  coordinator_assigned TEXT,
  current_phase TEXT,
  stripe_customer_id TEXT,
  stripe_payment_intent_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  cancelled_at TIMESTAMPTZ
);

-- Enable RLS
ALTER TABLE public.tc_clients ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own TC client records
CREATE POLICY "Users can view own tc_clients"
  ON public.tc_clients
  FOR SELECT
  USING (auth.uid() = user_id);

-- Policy: Users can insert their own TC client records
CREATE POLICY "Users can insert own tc_clients"
  ON public.tc_clients
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Policy: Admins can view all TC client records
CREATE POLICY "Admins can view all tc_clients"
  ON public.tc_clients
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role = 'admin'
    )
  );

-- Policy: Admins can update all TC client records
CREATE POLICY "Admins can update all tc_clients"
  ON public.tc_clients
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role = 'admin'
    )
  );

-- Create index for faster queries
CREATE INDEX idx_tc_clients_user_id ON public.tc_clients(user_id);
CREATE INDEX idx_tc_clients_status ON public.tc_clients(status);
CREATE INDEX idx_tc_clients_created_at ON public.tc_clients(created_at DESC);