-- P1/P2 fixes migration — run AFTER 0001_init.sql and 0002_p0_fixes.sql.
-- Prefer regenerating this with `pnpm db:generate` once you have network
-- access and can diff against db/schema.ts directly; this hand-written
-- version exists because the environment that produced it has none.

-- P1 #6 — auth rate limiting: one row per signup/login/reset/resend attempt.
create table if not exists auth_attempts (
  id uuid primary key default gen_random_uuid(),
  identifier text not null,
  created_at timestamptz not null default now()
);

create index if not exists auth_attempts_identifier_created_at_idx
  on auth_attempts (identifier, created_at);

-- No RLS policy is added for auth_attempts on purpose: it's written to and
-- read from exclusively by server actions using the privileged DATABASE_URL
-- connection, never from the browser/anon key, so there is nothing for RLS
-- to protect against here. If you ever query it via PostgREST/anon key,
-- add `alter table auth_attempts enable row level security;` with no
-- select/insert policies (deny-by-default) first.

-- P2 #15 — stories.category, to drive the existing /stories category filter
-- (Project Stories / Research / News / Education) from real rows instead of
-- a hardcoded "News" for everything.
alter table stories
  add column if not exists category text;

-- Backfill any existing rows so the filter doesn't show blank chips.
update stories set category = 'News' where category is null;

-- Optional sample rows so /events and /stories aren't empty immediately
-- after migrating — delete these once you have real content.
insert into events (slug, title, description, location, is_online, starts_at, ends_at)
values (
  'global-innovation-summit-2026',
  'Global Innovation Summit 2026',
  'Speakers, workshops and networking with changemakers from around the world.',
  null, true, now() + interval '30 days', now() + interval '30 days' + interval '8 hours'
)
on conflict (slug) do nothing;

insert into stories (slug, title, excerpt, body, category, cover_image, published_at)
values (
  'how-community-input-turned-into-a-real-project',
  'How Community Input Turned Into a Real Project',
  'From a local problem submission to a funded initiative — here is how it happened.',
  'Full story body goes here.',
  'Project Stories',
  '/images/story-community.png',
  now()
)
on conflict (slug) do nothing;
