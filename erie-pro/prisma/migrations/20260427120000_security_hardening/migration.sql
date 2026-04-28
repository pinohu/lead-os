-- Shared credential-attempt limiter state.
-- This replaces the previous per-process Map so failed-login protection works
-- across serverless instances.
CREATE TABLE IF NOT EXISTS login_attempts (
  key_hash TEXT PRIMARY KEY,
  email_hash TEXT NOT NULL,
  ip_hash TEXT NOT NULL,
  attempt_count INTEGER NOT NULL DEFAULT 0,
  first_attempt_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  last_attempt_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS login_attempts_email_hash_idx ON login_attempts(email_hash);
CREATE INDEX IF NOT EXISTS login_attempts_last_attempt_at_idx ON login_attempts(last_attempt_at);
