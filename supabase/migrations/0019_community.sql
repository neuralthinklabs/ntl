-- 0019: NTL Community & Collaboration (phase 1). Run AFTER 0018. Safe to run more than once.
-- Model: communities (groups) with PER-GROUP membership roles, posts, comments,
-- reactions, polls, notifications, blocks, reports, moderation log and appeals.
-- The app reads/writes through DATABASE_URL and enforces authorization in
-- lib/community/authz.ts. RLS below is defense in depth for anon/authenticated keys:
-- internal groups and private content are never readable without membership.

do $$ begin create type community_kind as enum ('interest','atlas','project','learning','department','leadership','zone','operations'); exception when duplicate_object then null; end $$;
do $$ begin create type community_visibility as enum ('public','private','internal'); exception when duplicate_object then null; end $$;
do $$ begin create type community_member_role as enum ('member','moderator','leader'); exception when duplicate_object then null; end $$;
do $$ begin create type community_member_status as enum ('active','pending','suspended','banned'); exception when duplicate_object then null; end $$;
do $$ begin create type community_post_type as enum ('discussion','idea','poll','announcement','research','event','project_update','resource'); exception when duplicate_object then null; end $$;
do $$ begin create type community_post_status as enum ('published','pending','removed'); exception when duplicate_object then null; end $$;
do $$ begin create type community_comment_status as enum ('published','removed'); exception when duplicate_object then null; end $$;
do $$ begin create type community_report_status as enum ('open','resolved','dismissed'); exception when duplicate_object then null; end $$;
do $$ begin create type moderation_action_type as enum ('approve_post','remove_post','restore_post','remove_comment','restore_comment','warn','suspend','ban','unban','remove_member','role_change','report_resolved','report_dismissed','appeal_upheld','appeal_overturned','global_suspend','global_ban','global_unban'); exception when duplicate_object then null; end $$;
do $$ begin create type appeal_status as enum ('pending','upheld','overturned'); exception when duplicate_object then null; end $$;
do $$ begin create type community_notification_type as enum ('comment','reply','join_request','join_approved','announcement','post_pending','post_approved','post_removed','warning','suspension','ban','appeal_decision','role_changed','report'); exception when duplicate_object then null; end $$;

-- Platform-level flags on profiles (only the server writes these; 0014 already
-- removed write grants from the public keys, and column grants stay as they were).
alter table profiles add column if not exists verified_contributor boolean not null default false;
alter table profiles add column if not exists community_suspended_until timestamptz;
alter table profiles add column if not exists community_banned boolean not null default false;

create table if not exists communities (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  description text,
  kind community_kind not null,
  visibility community_visibility not null default 'public',
  atlas_scope text check (atlas_scope is null or atlas_scope in ('national','zone','region','city')),
  atlas_unit_id uuid references atlas_units (id) on delete set null,
  goal_id uuid references goals (id) on delete set null,
  cover_image text,
  require_post_approval boolean not null default false,
  created_by uuid references profiles (id) on delete set null,
  archived_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  -- internal kinds are always hidden internal spaces, and only they are.
  constraint communities_internal_rule check ((kind in ('department','leadership','zone','operations')) = (visibility = 'internal'))
);
create index if not exists communities_kind_idx on communities (kind, visibility) where archived_at is null;

create table if not exists community_members (
  community_id uuid not null references communities (id) on delete cascade,
  user_id uuid not null references profiles (id) on delete cascade,
  role community_member_role not null default 'member',
  status community_member_status not null default 'active',
  suspended_until timestamptz,
  joined_at timestamptz not null default now(),
  primary key (community_id, user_id)
);
create index if not exists community_members_user_idx on community_members (user_id, status);

create table if not exists community_posts (
  id uuid primary key default gen_random_uuid(),
  community_id uuid not null references communities (id) on delete cascade,
  author_id uuid references profiles (id) on delete set null,
  client_request_id uuid unique,
  type community_post_type not null default 'discussion',
  title text,
  body text not null,
  link_url text,
  event_starts_at timestamptz,
  event_location text,
  poll_closes_at timestamptz,
  status community_post_status not null default 'published',
  pinned boolean not null default false,
  removed_reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists community_posts_feed_idx on community_posts (community_id, status, created_at desc);
create index if not exists community_posts_author_idx on community_posts (author_id, created_at desc);

create table if not exists poll_options (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references community_posts (id) on delete cascade,
  label text not null,
  sort_order integer not null default 0
);
create index if not exists poll_options_post_idx on poll_options (post_id, sort_order);

create table if not exists poll_votes (
  post_id uuid not null references community_posts (id) on delete cascade,
  user_id uuid not null references profiles (id) on delete cascade,
  option_id uuid not null references poll_options (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (post_id, user_id)
);
create index if not exists poll_votes_option_idx on poll_votes (option_id);

create table if not exists community_comments (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references community_posts (id) on delete cascade,
  parent_id uuid references community_comments (id) on delete cascade,
  author_id uuid references profiles (id) on delete set null,
  body text not null,
  status community_comment_status not null default 'published',
  created_at timestamptz not null default now()
);
create index if not exists community_comments_post_idx on community_comments (post_id, created_at);

create table if not exists post_reactions (
  post_id uuid not null references community_posts (id) on delete cascade,
  user_id uuid not null references profiles (id) on delete cascade,
  kind text not null check (kind in ('like','insightful','support')),
  created_at timestamptz not null default now(),
  primary key (post_id, user_id)
);

create table if not exists notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles (id) on delete cascade,
  type community_notification_type not null,
  title text not null,
  body text,
  link text,
  actor_id uuid references profiles (id) on delete set null,
  read_at timestamptz,
  created_at timestamptz not null default now()
);
create index if not exists notifications_user_idx on notifications (user_id, read_at, created_at desc);

create table if not exists user_blocks (
  blocker_id uuid not null references profiles (id) on delete cascade,
  blocked_id uuid not null references profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (blocker_id, blocked_id),
  check (blocker_id <> blocked_id)
);

create table if not exists community_reports (
  id uuid primary key default gen_random_uuid(),
  community_id uuid not null references communities (id) on delete cascade,
  reporter_id uuid references profiles (id) on delete set null,
  post_id uuid references community_posts (id) on delete cascade,
  comment_id uuid references community_comments (id) on delete cascade,
  reason text not null,
  details text,
  status community_report_status not null default 'open',
  handled_by uuid references profiles (id) on delete set null,
  handled_at timestamptz,
  handler_note text,
  created_at timestamptz not null default now(),
  check ((post_id is not null) <> (comment_id is not null))
);
create index if not exists community_reports_queue_idx on community_reports (community_id, status, created_at desc);
-- One open report per person per item.
create unique index if not exists community_reports_once_post on community_reports (reporter_id, post_id) where post_id is not null and status = 'open';
create unique index if not exists community_reports_once_comment on community_reports (reporter_id, comment_id) where comment_id is not null and status = 'open';

create table if not exists moderation_actions (
  id uuid primary key default gen_random_uuid(),
  community_id uuid references communities (id) on delete set null,
  actor_id uuid references profiles (id) on delete set null,
  target_user_id uuid references profiles (id) on delete set null,
  post_id uuid references community_posts (id) on delete set null,
  comment_id uuid references community_comments (id) on delete set null,
  action moderation_action_type not null,
  reason text,
  expires_at timestamptz,
  created_at timestamptz not null default now()
);
create index if not exists moderation_actions_group_idx on moderation_actions (community_id, created_at desc);
create index if not exists moderation_actions_target_idx on moderation_actions (target_user_id, created_at desc);

create table if not exists community_appeals (
  id uuid primary key default gen_random_uuid(),
  action_id uuid not null references moderation_actions (id) on delete cascade,
  user_id uuid not null references profiles (id) on delete cascade,
  message text not null,
  status appeal_status not null default 'pending',
  decided_by uuid references profiles (id) on delete set null,
  decision_note text,
  decided_at timestamptz,
  created_at timestamptz not null default now(),
  unique (action_id, user_id)
);
create index if not exists community_appeals_status_idx on community_appeals (status, created_at);

-- ---------------------------------------------------------------------
-- Row Level Security (defense in depth; the app uses the server connection)
-- ---------------------------------------------------------------------
create or replace function public.is_community_member(cid uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.community_members m
    where m.community_id = cid and m.user_id = auth.uid() and m.status in ('active','suspended')
  );
$$;
revoke all on function public.is_community_member(uuid) from public;
grant execute on function public.is_community_member(uuid) to anon, authenticated;

create or replace function public.community_is_public(cid uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.communities c where c.id = cid and c.visibility = 'public' and c.archived_at is null);
$$;
revoke all on function public.community_is_public(uuid) from public;
grant execute on function public.community_is_public(uuid) to anon, authenticated;

alter table communities enable row level security;
alter table community_members enable row level security;
alter table community_posts enable row level security;
alter table poll_options enable row level security;
alter table poll_votes enable row level security;
alter table community_comments enable row level security;
alter table post_reactions enable row level security;
alter table notifications enable row level security;
alter table user_blocks enable row level security;
alter table community_reports enable row level security;
alter table moderation_actions enable row level security;
alter table community_appeals enable row level security;

-- Internal groups do not exist for anyone who is not a member or an admin.
create policy "Listed communities are readable" on communities for select
  using ((visibility in ('public','private') and archived_at is null) or public.is_community_member(id) or public.is_admin());
create policy "Members see their own membership" on community_members for select
  using (user_id = auth.uid() or public.is_admin());
create policy "Visible posts are readable" on community_posts for select
  using (
    public.is_admin()
    or author_id = auth.uid()
    or (status = 'published' and (public.community_is_public(community_id) or public.is_community_member(community_id)))
  );
create policy "Poll options follow their post" on poll_options for select
  using (exists (select 1 from community_posts p where p.id = post_id));
create policy "Comments follow their post" on community_comments for select
  using (status = 'published' and exists (select 1 from community_posts p where p.id = post_id and p.status = 'published'));
create policy "Own votes" on poll_votes for select using (user_id = auth.uid());
create policy "Own reactions" on post_reactions for select using (user_id = auth.uid());
create policy "Own notifications" on notifications for select using (user_id = auth.uid());
create policy "Own blocks" on user_blocks for select using (blocker_id = auth.uid());
create policy "Admins read reports" on community_reports for select using (public.is_admin() or reporter_id = auth.uid());
create policy "Own moderation history" on moderation_actions for select using (public.is_admin() or target_user_id = auth.uid());
create policy "Own appeals" on community_appeals for select using (public.is_admin() or user_id = auth.uid());

revoke all on table community_members, poll_votes, post_reactions, notifications, user_blocks,
  community_reports, moderation_actions, community_appeals from anon;

-- ---------------------------------------------------------------------
-- Storage: private bucket, folder per community: <community_id>/<file>
-- (upload UI arrives in the next increment; the permissions are ready now)
-- ---------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('community-media', 'community-media', false, 5242880,
        array['image/jpeg','image/png','image/webp','image/gif','application/pdf'])
on conflict (id) do nothing;

create policy "Active members upload community media" on storage.objects for insert
  with check (
    bucket_id = 'community-media'
    and case when (storage.foldername(name))[1] ~ '^[0-9a-f-]{36}$'
      then public.is_community_member(((storage.foldername(name))[1])::uuid) else false end
  );
create policy "Members and public readers view community media" on storage.objects for select
  using (
    bucket_id = 'community-media'
    and case when (storage.foldername(name))[1] ~ '^[0-9a-f-]{36}$'
      then (public.is_community_member(((storage.foldername(name))[1])::uuid)
            or public.community_is_public(((storage.foldername(name))[1])::uuid)
            or public.is_admin())
      else false end
  );
