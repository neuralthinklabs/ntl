-- 0011: NTL Atlas (zones -> subzones -> clusters). Run AFTER 0010.
do $$ begin
  create type atlas_level as enum ('zone', 'subzone', 'cluster');
exception when duplicate_object then null; end $$;

create table if not exists atlas_units (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,                       -- public ID, e.g. Z01, Z01-S02, Z01-S02-C03
  name text not null,
  level atlas_level not null,
  parent_id uuid references atlas_units (id) on delete restrict,
  summary text,
  demographics text,                               -- aggregate indicators only, never personal data
  problem_domains text[] not null default '{}',
  resources text[] not null default '{}',
  initiatives text,
  data_sources text,
  boundary jsonb,                                  -- GeoJSON, reserved for the Phase 2 map
  verified boolean not null default false,
  published boolean not null default false,
  sort_order integer not null default 0,
  last_updated timestamptz not null default now(),
  created_at timestamptz not null default now(),
  constraint atlas_parent_rule check (
    (level = 'zone' and parent_id is null) or (level <> 'zone' and parent_id is not null)
  )
);

create index if not exists atlas_units_parent_idx on atlas_units (parent_id);
create index if not exists atlas_units_level_idx on atlas_units (level, sort_order);

alter table atlas_units enable row level security;
create policy "Published atlas units are publicly readable" on atlas_units
  for select using (published = true);
create policy "Admins can read all atlas units" on atlas_units
  for select using (public.is_admin());
-- Writes happen only through server actions (DATABASE_URL), like everything else.
