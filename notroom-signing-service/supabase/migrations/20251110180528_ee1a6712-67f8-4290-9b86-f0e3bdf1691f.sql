-- Create table for CROP applications
CREATE TABLE IF NOT EXISTS public.crop_applications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  
  -- Entity Information
  entity_name TEXT NOT NULL,
  entity_type TEXT NOT NULL, -- LLC, Corporation, Foreign Entity, etc.
  state_of_formation TEXT NOT NULL,
  entity_ein TEXT,
  formation_date DATE,
  
  -- Contact Information
  contact_person TEXT NOT NULL,
  contact_email TEXT NOT NULL,
  contact_phone TEXT NOT NULL,
  current_address TEXT NOT NULL,
  
  -- Mail Preferences
  mail_handling_preference TEXT NOT NULL, -- physical, digital
  mail_forward_address TEXT,
  scan_preferences JSONB, -- {open_scan: true, shred_routine: false, etc}
  
  -- Service Selection
  selected_plan TEXT NOT NULL, -- standard, digital, premium
  plan_price_id TEXT NOT NULL,
  
  -- Status & Metadata
  status TEXT NOT NULL DEFAULT 'pending', -- pending, approved, active, cancelled
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  approved_at TIMESTAMP WITH TIME ZONE,
  activated_at TIMESTAMP WITH TIME ZONE
);

-- Enable Row Level Security
ALTER TABLE public.crop_applications ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own applications
CREATE POLICY "Users can view their own CROP applications"
ON public.crop_applications
FOR SELECT
USING (auth.uid() = user_id);

-- Policy: Users can create their own applications
CREATE POLICY "Users can create their own CROP applications"
ON public.crop_applications
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update their own pending applications
CREATE POLICY "Users can update their own pending CROP applications"
ON public.crop_applications
FOR UPDATE
USING (auth.uid() = user_id AND status = 'pending');

-- Create index for faster lookups
CREATE INDEX idx_crop_applications_user_id ON public.crop_applications(user_id);
CREATE INDEX idx_crop_applications_status ON public.crop_applications(status);
CREATE INDEX idx_crop_applications_stripe_customer ON public.crop_applications(stripe_customer_id);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_crop_application_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_crop_applications_updated_at
BEFORE UPDATE ON public.crop_applications
FOR EACH ROW
EXECUTE FUNCTION public.update_crop_application_updated_at();