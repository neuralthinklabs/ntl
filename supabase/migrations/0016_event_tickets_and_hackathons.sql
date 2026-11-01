-- 0016: event kinds, venues, ticket types, per-person ticket codes, hackathon teams
-- and submissions. Run AFTER 0015. Safe to run more than once.

do $$ begin
  create type event_kind as enum ('event', 'workshop', 'talk', 'meetup', 'hackathon');
exception when duplicate_object then null; end $$;

alter table events add column if not exists kind event_kind not null default 'event';
alter table events add column if not exists venue_address text;
alter table events add column if not exists venue_map_url text;
alter table events add column if not exists registration_closes_at timestamptz;
-- Hackathon settings (ignored for other kinds)
alter table events add column if not exists team_min integer;
alter table events add column if not exists team_max integer;
alter table events add column if not exists submission_deadline timestamptz;

-- ---------------------------------------------------------------------
-- Ticket types. An event with NO ticket types is simple "register" (general
-- admission). Prices are stored for later but only free (0) is accepted today.
-- ---------------------------------------------------------------------
create table if not exists ticket_types (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references events (id) on delete cascade,
  name text not null,
  description text,
  price_cents integer not null default 0 check (price_cents >= 0),
  quantity integer check (quantity is null or quantity > 0),
  sales_start timestamptz,
  sales_end timestamptz,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);
create index if not exists ticket_types_event_idx on ticket_types (event_id, sort_order);

-- ---------------------------------------------------------------------
-- A ticket code on every registration (used for check-in at the door).
-- ---------------------------------------------------------------------
create or replace function public.generate_ticket_code() returns text
language plpgsql as $$
declare
  alphabet text := 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
  result text;
  i int;
begin
  loop
    result := 'T-';
    for i in 1..6 loop
      result := result || substr(alphabet, 1 + floor(random() * length(alphabet))::int, 1);
    end loop;
    exit when not exists (select 1 from public.event_registrations where ticket_code = result);
  end loop;
  return result;
end $$;

alter table event_registrations add column if not exists ticket_type_id uuid references ticket_types (id) on delete set null;
alter table event_registrations add column if not exists ticket_code text;
update event_registrations set ticket_code = public.generate_ticket_code() where ticket_code is null;
alter table event_registrations alter column ticket_code set default public.generate_ticket_code();
alter table event_registrations alter column ticket_code set not null;
create unique index if not exists event_registrations_ticket_code_key on event_registrations (ticket_code);
create index if not exists event_registrations_ticket_type_idx on event_registrations (ticket_type_id, status);

-- ---------------------------------------------------------------------
-- Hackathons: teams (join by invite code), one team per person per event,
-- and one submission per team.
-- ---------------------------------------------------------------------
create table if not exists event_teams (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references events (id) on delete cascade,
  name text not null,
  invite_code text not null unique,
  created_by uuid references profiles (id) on delete set null,
  created_at timestamptz not null default now()
);
create unique index if not exists event_teams_event_name_key on event_teams (event_id, lower(name));

create table if not exists event_team_members (
  team_id uuid not null references event_teams (id) on delete cascade,
  event_id uuid not null references events (id) on delete cascade,
  user_id uuid not null references profiles (id) on delete cascade,
  joined_at timestamptz not null default now(),
  primary key (team_id, user_id),
  unique (event_id, user_id)
);

create table if not exists event_submissions (
  team_id uuid primary key references event_teams (id) on delete cascade,
  event_id uuid not null references events (id) on delete cascade,
  title text not null,
  description text not null,
  repo_url text,
  demo_url text,
  video_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Server-only tables: no policies, no access through the public API keys.
alter table ticket_types enable row level security;
alter table event_teams enable row level security;
alter table event_team_members enable row level security;
alter table event_submissions enable row level security;
revoke all on table ticket_types, event_teams, event_team_members, event_submissions from anon, authenticated;
