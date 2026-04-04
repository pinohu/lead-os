-- Create feedback table for user feedback widget
CREATE TABLE IF NOT EXISTS public.feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  feedback TEXT NOT NULL CHECK (char_length(feedback) > 0 AND char_length(feedback) <= 5000),
  email TEXT CHECK (email IS NULL OR (char_length(email) <= 255 AND email ~* '^[^\s@]+@[^\s@]+\.[^\s@]+$')),
  page_url TEXT NOT NULL,
  user_agent TEXT,
  status TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'reviewed', 'resolved', 'archived')),
  admin_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.feedback ENABLE ROW LEVEL SECURITY;

-- Anyone can insert feedback (public submissions)
CREATE POLICY "Anyone can submit feedback"
ON public.feedback
FOR INSERT
TO anon, authenticated
WITH CHECK (true);

-- Only authenticated admins can view feedback
CREATE POLICY "Admins can view all feedback"
ON public.feedback
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role));

-- Only authenticated admins can update feedback
CREATE POLICY "Admins can update feedback"
ON public.feedback
FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role));

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_feedback_status ON public.feedback(status);
CREATE INDEX IF NOT EXISTS idx_feedback_created_at ON public.feedback(created_at DESC);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_feedback_updated_at()
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
CREATE TRIGGER update_feedback_updated_at
BEFORE UPDATE ON public.feedback
FOR EACH ROW
EXECUTE FUNCTION public.update_feedback_updated_at();

