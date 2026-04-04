-- Create feedback table for user feedback submissions
CREATE TABLE IF NOT EXISTS public.feedback (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  feedback TEXT NOT NULL,
  email TEXT,
  page_url TEXT,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.feedback ENABLE ROW LEVEL SECURITY;

-- Create policy to allow anyone to insert feedback (public submissions)
CREATE POLICY "Anyone can submit feedback"
ON public.feedback
FOR INSERT
TO public
WITH CHECK (true);

-- Create index on created_at for efficient querying
CREATE INDEX IF NOT EXISTS idx_feedback_created_at ON public.feedback(created_at DESC);