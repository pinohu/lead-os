-- Providers
create table providers (
  id uuid primary key,
  email text,
  created_at timestamp default now()
);

-- Nodes (territories)
create table nodes (
  id text primary key,
  state text,
  county text,
  city text,
  niche text
);

-- Ownership
create table node_ownership (
  id uuid default gen_random_uuid() primary key,
  node_id text references nodes(id),
  owner_id uuid references providers(id),
  state text,
  created_at timestamp default now()
);

-- Subscriptions
create table subscriptions (
  id uuid default gen_random_uuid() primary key,
  node_id text,
  owner_id uuid,
  state text,
  stripe_subscription_id text,
  created_at timestamp default now()
);

-- Leads
create table leads (
  id uuid default gen_random_uuid() primary key,
  node_id text,
  owner_id uuid,
  payload jsonb,
  created_at timestamp default now()
);

-- Enable RLS
alter table leads enable row level security;
alter table node_ownership enable row level security;

-- Policies
create policy "providers see own leads"
on leads for select
using (auth.uid() = owner_id);

create policy "providers see own ownership"
on node_ownership for select
using (auth.uid() = owner_id);
