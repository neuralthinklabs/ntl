-- 0005: security hardening + admin-portal support.
-- Run AFTER 0001_init, 0002_p0_fixes, 0003_p1_fixes, 0004_p2_admin_contact_and_portfolio.
-- IMPORTANT: delete the Drizzle-generated 0000_superb_timeslip.sql,
-- 0001_busy_eddie_brock.sql and the meta/ folder from supabase/migrations
-- (they duplicate 0001-0004 and would conflict). See APPLY.md.

-- ---------------------------------------------------------------------
-- 1. Admin helper (SECURITY DEFINER so policies on `profiles` never recurse)
-- ---------------------------------------------------------------------
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (select 1 from public.profiles where id = auth.uid() and role = 'admin');
$$;
revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to anon, authenticated;

-- ---------------------------------------------------------------------
-- 2. profiles: stop self-promotion to admin and stop leaking every email
-- ---------------------------------------------------------------------
drop policy if exists "Profiles are publicly readable" on profiles;
drop policy if exists "Users can update their own profile" on profiles;

create policy "Users can read their own profile" on profiles
  for select using (auth.uid() = id);
create policy "Admins can read all profiles" on profiles
  for select using (public.is_admin());
create policy "Users can update their own profile" on profiles
  for update using (auth.uid() = id) with check (auth.uid() = id);

-- Column-level lock: a signed-in user may only change these three columns.
revoke insert, update, delete on profiles from anon, authenticated;
grant update (full_name, bio, avatar_url) on profiles to authenticated;

-- ---------------------------------------------------------------------
-- 3. Writes that must only happen through the server (privileged role)
-- ---------------------------------------------------------------------
drop policy if exists "Users can insert their own problems" on problems;
drop policy if exists "Users can register themselves" on event_registrations;
drop policy if exists "Users can insert their own contributions" on contributions;

alter table auth_attempts enable row level security; -- no policies = deny all via PostgREST

-- ---------------------------------------------------------------------
-- 4. Pledges -> confirmed payments
-- ---------------------------------------------------------------------
do $$ begin
  create type contribution_status as enum ('pledged', 'confirmed', 'rejected', 'refunded');
exception when duplicate_object then null; end $$;

alter table contributions
  add column if not exists status contribution_status not null default 'pledged',
  add column if not exists payment_ref text,
  add column if not exists confirmed_at timestamptz,
  add column if not exists confirmed_by uuid references profiles (id);

create index if not exists contributions_status_idx on contributions (status, created_at desc);

-- Earlier versions added pledged amounts straight to goals.funding_raised_cents
-- with no payment behind them. The seeded totals are also placeholders. Set the
-- real figures in the admin portal (Campaigns -> edit -> "Raised so far"), e.g.:
--   update goals set funding_raised_cents = 0;

-- ---------------------------------------------------------------------
-- 5. Content tagging to the 12 NTLDGs, event time zones, story updated_at
-- ---------------------------------------------------------------------
alter table problems add column if not exists ntldg_slug text;
alter table goals    add column if not exists ntldg_slug text;
alter table stories  add column if not exists ntldg_slug text;
alter table stories  add column if not exists updated_at timestamptz not null default now();
alter table events   add column if not exists timezone text not null default 'UTC';

create index if not exists problems_ntldg_idx on problems (ntldg_slug);
create index if not exists stories_published_idx on stories (published_at desc);

-- ---------------------------------------------------------------------
-- 6. Storage: tighten attachments bucket, add public bucket for site media
-- ---------------------------------------------------------------------
update storage.buckets
set file_size_limit = 10485760,
    allowed_mime_types = array[
      'image/jpeg','image/png','image/gif','image/webp','application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ]
where id = 'problem-attachments';

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('site-media', 'site-media', true, 5242880,
        array['image/jpeg','image/png','image/webp','image/gif'])
on conflict (id) do nothing;

create policy "Anyone can read site media" on storage.objects
  for select using (bucket_id = 'site-media');
create policy "Admins can upload site media" on storage.objects
  for insert with check (bucket_id = 'site-media' and public.is_admin());
create policy "Admins can update site media" on storage.objects
  for update using (bucket_id = 'site-media' and public.is_admin());
create policy "Admins can delete site media" on storage.objects
  for delete using (bucket_id = 'site-media' and public.is_admin());
