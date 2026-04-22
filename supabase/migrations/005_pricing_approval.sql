create table pricing_recommendations (
  id uuid default gen_random_uuid() primary key,
  node_id text,
  owner_id uuid,
  current_price_cents int,
  recommended_price_cents int,
  mode text,
  status text default 'proposed',
  rationale jsonb,
  created_at timestamp default now(),
  approved_by uuid,
  approved_at timestamp,
  applied_at timestamp
);

create table pricing_history (
  id uuid default gen_random_uuid() primary key,
  node_id text,
  owner_id uuid,
  old_price_cents int,
  new_price_cents int,
  mode text,
  changed_at timestamp default now(),
  note text
);
