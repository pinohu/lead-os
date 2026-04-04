-- Add RLS policy for admins to manage CROP applications
CREATE POLICY "Admins can manage all CROP applications"
ON public.crop_applications
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));