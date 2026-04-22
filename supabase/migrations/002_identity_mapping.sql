create table billing_identity (
  user_id uuid primary key,
  stripe_customer_id text unique,
  created_at timestamp default now()
);
