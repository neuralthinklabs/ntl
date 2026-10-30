-- 0015: native volunteer applications (replaces the Google Form) and event upgrades.
-- Run AFTER 0014. Safe to run more than once.

do $$ begin
  create type volunteer_status as enum ('new', 'reviewing', 'accepted', 'declined');
exception when duplicate_object then null; end $$;

create table if not exists volunteer_applications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles (id) on delete cascade,
  client_request_id uuid unique,
  full_name text not null,
  phone text,
  location text not null,
  skills text not null,
  ntldg_slugs text[] not null default '{}',
  hours_per_week integer check (hours_per_week is null or (hours_per_week between 1 and 80)),
  availability text,
  experience text,
  motivation text not null,
  links text,
  status volunteer_status not null default 'new',
  admin_notes text,
  reviewed_by uuid references profiles (id) on delete set null,
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists volunteer_applications_status_idx on volunteer_applications (status, created_at desc);
create index if not exists volunteer_applications_user_idx on volunteer_applications (user_id);

-- Server-only table: no policies, and no access through the public API keys.
alter table volunteer_applications enable row level security;
revoke all on table volunteer_applications from anon, authenticated;

-- Events: a private meeting link (shown only to registered people) and a flag
-- so each registrant gets exactly one reminder email.
alter table events add column if not exists meeting_url text;
alter table event_registrations add column if not exists reminder_sent_at timestamptz;
