-- Track when we last sent a "claim your listing" outreach email to each
-- directory listing's contact address, so /api/contact can throttle
-- outreach to at most once per N days per listing and can't be used to
-- mail-bomb listing owners through repeat contact-form submissions.
ALTER TABLE "directory_listings" ADD COLUMN IF NOT EXISTS "lastOutreachAt" TIMESTAMP(3);
