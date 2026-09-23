-- Phase A initial schema for Neural Think Labs
-- Run this against your Supabase project's Postgres database (SQL editor,
-- or `psql "$DATABASE_URL" -f supabase/migrations/0001_init.sql`).
-- This mirrors db/schema.ts (Drizzle). If you change db/schema.ts, prefer
-- generating a fresh migration with `pnpm db:generate` once you have
-- network access, rather than hand-editing this file long-term.

-- ---------------------------------------------------------------------
-- Enums
-- ---------------------------------------------------------------------
create type user_role as enum ('member', 'admin');
create type problem_status as enum ('submitted', 'in_review', 'accepted', 'in_progress', 'resolved', 'declined');
create type goal_status as enum ('planned', 'in_progress', 'completed');
create type milestone_status as enum ('upcoming', 'in_progress', 'completed');
create type registration_status as enum ('registered', 'waitlisted', 'cancelled', 'attended');
create type activity_type as enum ('problem_submitted', 'event_registered', 'event_attended', 'contribution_made', 'achievement_earned', 'goal_supported');

-- ---------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------
create table profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null,
  full_name text,
  avatar_url text,
  bio text,
  role user_role not null default 'member',
  points integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table problems (
  id uuid primary key default gen_random_uuid(),
  submitted_by uuid not null references profiles (id) on delete cascade,
  title text not null,
  category text,
  location text,
  description text not null,
  context text,
  evidence_notes text,
  status problem_status not null default 'submitted',
  admin_notes text,
  reviewed_by uuid references profiles (id),
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table problem_attachments (
  id uuid primary key default gen_random_uuid(),
  problem_id uuid not null references problems (id) on delete cascade,
  storage_path text not null,
  file_name text not null,
  file_type text,
  file_size integer,
  created_at timestamptz not null default now()
);

create table goals (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  problem_summary text,
  objective text,
  responsible_team text,
  status goal_status not null default 'planned',
  funding_target_cents integer not null default 0,
  funding_raised_cents integer not null default 0,
  start_date timestamptz,
  end_date timestamptz,
  hero_image text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table goal_milestones (
  id uuid primary key default gen_random_uuid(),
  goal_id uuid not null references goals (id) on delete cascade,
  name text not null,
  status milestone_status not null default 'upcoming',
  sort_order integer not null default 0,
  due_date timestamptz,
  completed_at timestamptz
);

create table goal_updates (
  id uuid primary key default gen_random_uuid(),
  goal_id uuid not null references goals (id) on delete cascade,
  author_id uuid references profiles (id),
  title text not null,
  body text not null,
  created_at timestamptz not null default now()
);

create table events (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  description text,
  location text,
  is_online boolean not null default false,
  starts_at timestamptz not null,
  ends_at timestamptz,
  capacity integer,
  created_at timestamptz not null default now()
);

create table event_registrations (
  event_id uuid not null references events (id) on delete cascade,
  user_id uuid not null references profiles (id) on delete cascade,
  status registration_status not null default 'registered',
  registered_at timestamptz not null default now(),
  primary key (event_id, user_id)
);

create table stories (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  excerpt text,
  body text,
  cover_image text,
  author_id uuid references profiles (id),
  published_at timestamptz,
  created_at timestamptz not null default now()
);

create table contributions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles (id) on delete cascade,
  goal_id uuid references goals (id) on delete set null,
  amount_cents integer,
  kind text not null default 'donation',
  note text,
  created_at timestamptz not null default now()
);

create table achievements (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  description text,
  icon text,
  points_awarded integer not null default 0
);

create table user_achievements (
  user_id uuid not null references profiles (id) on delete cascade,
  achievement_id uuid not null references achievements (id) on delete cascade,
  earned_at timestamptz not null default now(),
  primary key (user_id, achievement_id)
);

create table activity_records (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles (id) on delete cascade,
  type activity_type not null,
  title text not null,
  meta text,
  points_delta integer not null default 0,
  related_id uuid,
  metadata jsonb,
  created_at timestamptz not null default now()
);

create table contact_enquiries (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null,
  message text not null,
  handled boolean not null default false,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- Indexes
-- ---------------------------------------------------------------------
create index problems_submitted_by_idx on problems (submitted_by);
create index problem_attachments_problem_id_idx on problem_attachments (problem_id);
create index activity_records_user_id_idx on activity_records (user_id, created_at desc);
create index contributions_user_id_idx on contributions (user_id);
create index contributions_goal_id_idx on contributions (goal_id);

-- ---------------------------------------------------------------------
-- Auto-create a profile row whenever a new Supabase Auth user is created.
-- The app also upserts a profile on signup / first problem submission as
-- a belt-and-suspenders measure, so this trigger is optional but keeps
-- profiles in sync even for users created outside the app (e.g. Studio).
-- ---------------------------------------------------------------------
create function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, full_name)
  values (new.id, new.email, new.raw_user_meta_data ->> 'full_name')
  on conflict (id) do nothing;
  return new;
end;
$$ language plpgsql security definer set search_path = public;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ---------------------------------------------------------------------
-- Row Level Security
-- The app's server code connects with a privileged Postgres role (via
-- DATABASE_URL) and enforces authorization in application code, so RLS
-- here is defense-in-depth for any direct/PostgREST access (e.g. if you
-- later query Supabase from the browser with the anon key).
-- ---------------------------------------------------------------------
alter table profiles enable row level security;
alter table problems enable row level security;
alter table problem_attachments enable row level security;
alter table goals enable row level security;
alter table goal_milestones enable row level security;
alter table goal_updates enable row level security;
alter table events enable row level security;
alter table event_registrations enable row level security;
alter table stories enable row level security;
alter table contributions enable row level security;
alter table achievements enable row level security;
alter table user_achievements enable row level security;
alter table activity_records enable row level security;
alter table contact_enquiries enable row level security;

create policy "Profiles are publicly readable" on profiles for select using (true);
create policy "Users can update their own profile" on profiles for update using (auth.uid() = id);

create policy "Users can view their own problems" on problems for select using (auth.uid() = submitted_by);
create policy "Admins can view all problems" on problems for select using (
  exists (select 1 from profiles where id = auth.uid() and role = 'admin')
);
create policy "Users can insert their own problems" on problems for insert with check (auth.uid() = submitted_by);
create policy "Admins can update problems" on problems for update using (
  exists (select 1 from profiles where id = auth.uid() and role = 'admin')
);

create policy "Users can view attachments on their problems" on problem_attachments for select using (
  exists (select 1 from problems where problems.id = problem_id and problems.submitted_by = auth.uid())
);
create policy "Admins can view all attachments" on problem_attachments for select using (
  exists (select 1 from profiles where id = auth.uid() and role = 'admin')
);

create policy "Goals are publicly readable" on goals for select using (true);
create policy "Goal milestones are publicly readable" on goal_milestones for select using (true);
create policy "Goal updates are publicly readable" on goal_updates for select using (true);
create policy "Events are publicly readable" on events for select using (true);
create policy "Stories are publicly readable" on stories for select using (true);
create policy "Achievements are publicly readable" on achievements for select using (true);

create policy "Users can view their own registrations" on event_registrations for select using (auth.uid() = user_id);
create policy "Users can register themselves" on event_registrations for insert with check (auth.uid() = user_id);

create policy "Users can view their own contributions" on contributions for select using (auth.uid() = user_id);
create policy "Users can insert their own contributions" on contributions for insert with check (auth.uid() = user_id);

create policy "Users can view their own achievements" on user_achievements for select using (auth.uid() = user_id);

create policy "Users can view their own activity" on activity_records for select using (auth.uid() = user_id);

-- Contact enquiries: no public select policy — only accessible via the
-- service role / direct DB connection (the contact form server action).

-- ---------------------------------------------------------------------
-- Storage bucket for problem attachments
-- ---------------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('problem-attachments', 'problem-attachments', false)
on conflict (id) do nothing;

create policy "Users can upload their own attachments"
  on storage.objects for insert
  with check (bucket_id = 'problem-attachments' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "Users can view their own attachments"
  on storage.objects for select
  using (bucket_id = 'problem-attachments' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "Admins can view all attachments in storage"
  on storage.objects for select
  using (
    bucket_id = 'problem-attachments'
    and exists (select 1 from profiles where id = auth.uid() and role = 'admin')
  );

-- ---------------------------------------------------------------------
-- Seed data — matches the goals shown in the original prototype so
-- /support and /goals/[slug] have real rows to render.
-- ---------------------------------------------------------------------
insert into goals (slug, title, problem_summary, objective, responsible_team, status, funding_target_cents, funding_raised_cents, start_date, end_date, hero_image)
values
  ('clean-water', 'Clean Water for Rural Communities',
   'Millions of people in rural communities still lack access to clean, safe water. This leads to preventable illness, limits education and economic opportunity, and puts vulnerable groups at risk.',
   'Build sustainable, community-managed water systems in 5 rural regions over 3 years.',
   'Water & Health Initiative', 'in_progress', 5000000, 3100000, '2025-01-01', '2027-12-31', '/images/water-community.png'),
  ('education-for-everyone', 'Education for Everyone',
   'Many children and adults lack access to quality, affordable learning resources.',
   'Expand access to free, high-quality educational content and mentorship.',
   'Learning Access Team', 'in_progress', 4000000, 1630000, '2025-02-01', '2026-12-31', null),
  ('open-knowledge-library', 'Open Knowledge Library',
   'Research and educational materials are often locked behind paywalls, limiting who can learn from them.',
   'Build a free, open library of vetted research and learning material.',
   'Open Knowledge Team', 'planned', 2500000, 750000, '2025-04-01', '2026-06-30', null);

insert into goal_milestones (goal_id, name, status, sort_order)
select id, m.name, m.status::milestone_status, m.sort_order
from goals, (values
  ('Feasibility Study', 'completed', 1),
  ('Infrastructure Build', 'in_progress', 2),
  ('Community Training', 'upcoming', 3),
  ('Full Deployment', 'upcoming', 4)
) as m(name, status, sort_order)
where goals.slug = 'clean-water';

insert into goal_updates (goal_id, title, body)
select id, u.title, u.body
from goals, (values
  ('Site survey completed', 'Our team finished mapping water sources across 3 target regions.'),
  ('Local partnership secured', 'Partnered with two regional NGOs to support long-term maintenance.')
) as u(title, body)
where goals.slug = 'clean-water';

-- To make yourself an admin after signing up, run:
-- update profiles set role = 'admin' where email = 'you@example.com';
