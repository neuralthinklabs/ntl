-- 0023: Phase 3. Site announcements, page controls, group resources, task reminders,
-- full-text search. Run AFTER 0022. Safe to run more than once.
-- All new tables are server-only: RLS on, no policies, no access for the public API keys.

create table if not exists site_announcements (
  id uuid primary key default gen_random_uuid(),
  message text not null,
  link_url text,
  link_label text,
  tone text not null default 'info' check (tone in ('info','success','warning','urgent')),
  starts_at timestamptz,
  ends_at timestamptz,
  countdown_to timestamptz,
  countdown_label text,
  countdown_end_text text,
  dismissible boolean not null default true,
  active boolean not null default true,
  created_by uuid references profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists site_announcements_active_idx on site_announcements (active, starts_at, ends_at);

create table if not exists page_controls (
  id uuid primary key default gen_random_uuid(),
  path_prefix text not null unique,          -- '/events', '/community/messages', '/' (home only) or '*' (whole site)
  enabled boolean not null default true,     -- true = rule is on; false = page is open
  title text,
  message text,
  blocks_at timestamptz,                     -- null = from now
  opens_at timestamptz,                      -- null = until an admin opens it
  show_countdown boolean not null default false,
  created_by uuid references profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint page_controls_window check (opens_at is null or blocks_at is null or opens_at > blocks_at)
);

create table if not exists group_resources (
  id uuid primary key default gen_random_uuid(),
  community_id uuid not null references communities (id) on delete cascade,
  created_by uuid references profiles (id) on delete set null,
  title text not null,
  url text,
  description text,
  pinned boolean not null default false,
  created_at timestamptz not null default now()
);
create index if not exists group_resources_group_idx on group_resources (community_id, pinned desc, created_at desc);

alter table community_tasks add column if not exists reminder_sent_at timestamptz;
create index if not exists community_tasks_due_idx on community_tasks (due_date)
  where status <> 'done' and reminder_sent_at is null and assignee_id is not null;

-- Full-text search over posts (the expression must match lib/community/search.ts).
create index if not exists community_posts_fts_idx on community_posts
  using gin (to_tsvector('english', coalesce(title, '') || ' ' || body));
create index if not exists profiles_name_search_idx on profiles (lower(full_name));

alter table site_announcements enable row level security;
alter table page_controls enable row level security;
alter table group_resources enable row level security;
revoke all on table site_announcements, page_controls, group_resources from anon, authenticated;
