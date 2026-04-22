alter table leads add column status text default 'new';
alter table leads add column revenue numeric default 0;
alter table leads add column closed_at timestamp;

create table deal_events (
  id uuid default gen_random_uuid() primary key,
  lead_id uuid,
  status text,
  note text,
  created_at timestamp default now()
);
