-- 0021: Community phase 2 (edit own posts, file attachments, direct messages,
-- meetings, tasks, email digests). Run AFTER 0020. Safe to run more than once.
-- Every new table is server-only: RLS on, no policies, no access for the public API keys.

alter table community_posts add column if not exists edited_at timestamptz;

-- ---------------------------------------------------------------------
-- Post attachments (files live in the private community-media bucket)
-- ---------------------------------------------------------------------
create table if not exists post_attachments (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references community_posts (id) on delete cascade,
  community_id uuid not null references communities (id) on delete cascade,
  storage_path text not null,
  file_name text not null,
  file_type text,
  file_size integer,
  created_at timestamptz not null default now()
);
create index if not exists post_attachments_post_idx on post_attachments (post_id);

-- ---------------------------------------------------------------------
-- Direct messages: one conversation per pair of people (user_low < user_high)
-- ---------------------------------------------------------------------
create table if not exists dm_conversations (
  id uuid primary key default gen_random_uuid(),
  user_low uuid not null references profiles (id) on delete cascade,
  user_high uuid not null references profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  last_message_at timestamptz not null default now(),
  low_read_at timestamptz,
  high_read_at timestamptz,
  constraint dm_pair_order check (user_low < user_high),
  constraint dm_pair_unique unique (user_low, user_high)
);
create index if not exists dm_conversations_low_idx on dm_conversations (user_low, last_message_at desc);
create index if not exists dm_conversations_high_idx on dm_conversations (user_high, last_message_at desc);

create table if not exists dm_messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references dm_conversations (id) on delete cascade,
  sender_id uuid references profiles (id) on delete set null,
  body text not null,
  deleted_at timestamptz,
  created_at timestamptz not null default now()
);
create index if not exists dm_messages_conv_idx on dm_messages (conversation_id, created_at desc);

-- A report stores a short snapshot (the reported message and the few before it)
-- so admins never need general access to anyone's inbox.
create table if not exists dm_reports (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references dm_conversations (id) on delete cascade,
  message_id uuid references dm_messages (id) on delete set null,
  reporter_id uuid references profiles (id) on delete set null,
  reported_user_id uuid references profiles (id) on delete set null,
  reason text not null,
  details text,
  snapshot text not null,
  status text not null default 'open' check (status in ('open', 'resolved', 'dismissed')),
  handled_by uuid references profiles (id) on delete set null,
  handled_at timestamptz,
  handler_note text,
  created_at timestamptz not null default now()
);
create index if not exists dm_reports_queue_idx on dm_reports (status, created_at);
create unique index if not exists dm_reports_once on dm_reports (reporter_id, message_id) where status = 'open' and message_id is not null;

-- ---------------------------------------------------------------------
-- Meetings and RSVPs
-- ---------------------------------------------------------------------
create table if not exists community_meetings (
  id uuid primary key default gen_random_uuid(),
  community_id uuid not null references communities (id) on delete cascade,
  created_by uuid references profiles (id) on delete set null,
  title text not null,
  description text,
  agenda text,
  location text,
  meeting_url text,
  timezone text not null default 'UTC',
  starts_at timestamptz not null,
  ends_at timestamptz,
  status text not null default 'scheduled' check (status in ('scheduled', 'cancelled')),
  cancel_reason text,
  minutes text,
  reminder_sent_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists community_meetings_group_idx on community_meetings (community_id, starts_at desc);
create index if not exists community_meetings_reminder_idx on community_meetings (starts_at) where status = 'scheduled' and reminder_sent_at is null;

create table if not exists meeting_rsvps (
  meeting_id uuid not null references community_meetings (id) on delete cascade,
  user_id uuid not null references profiles (id) on delete cascade,
  response text not null check (response in ('going', 'maybe', 'no')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (meeting_id, user_id)
);

-- ---------------------------------------------------------------------
-- Tasks (project groups and internal workspaces)
-- ---------------------------------------------------------------------
create table if not exists community_tasks (
  id uuid primary key default gen_random_uuid(),
  community_id uuid not null references communities (id) on delete cascade,
  created_by uuid references profiles (id) on delete set null,
  assignee_id uuid references profiles (id) on delete set null,
  title text not null,
  description text,
  status text not null default 'todo' check (status in ('todo', 'in_progress', 'review', 'done')),
  priority text not null default 'normal' check (priority in ('low', 'normal', 'high')),
  due_date timestamptz,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists community_tasks_group_idx on community_tasks (community_id, status);
create index if not exists community_tasks_assignee_idx on community_tasks (assignee_id, status);

create table if not exists task_comments (
  id uuid primary key default gen_random_uuid(),
  task_id uuid not null references community_tasks (id) on delete cascade,
  author_id uuid references profiles (id) on delete set null,
  body text not null,
  created_at timestamptz not null default now()
);
create index if not exists task_comments_task_idx on task_comments (task_id, created_at);

-- ---------------------------------------------------------------------
-- Email digest preference (off by default; opt-in only)
-- ---------------------------------------------------------------------
create table if not exists community_email_prefs (
  user_id uuid primary key references profiles (id) on delete cascade,
  digest text not null default 'off' check (digest in ('off', 'daily', 'weekly')),
  last_digest_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table post_attachments enable row level security;
alter table dm_conversations enable row level security;
alter table dm_messages enable row level security;
alter table dm_reports enable row level security;
alter table community_meetings enable row level security;
alter table meeting_rsvps enable row level security;
alter table community_tasks enable row level security;
alter table task_comments enable row level security;
alter table community_email_prefs enable row level security;
revoke all on table post_attachments, dm_conversations, dm_messages, dm_reports, community_meetings,
  meeting_rsvps, community_tasks, task_comments, community_email_prefs from anon, authenticated;

-- ---------------------------------------------------------------------
-- Storage: uploads must go to <community_id>/<your user id>/..., only ACTIVE
-- members may upload (the old policy also let suspended members in), and
-- people may delete their own uploads.
-- ---------------------------------------------------------------------
create or replace function public.is_community_active(cid uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.community_members m
    where m.community_id = cid and m.user_id = auth.uid() and m.status = 'active'
  );
$$;
revoke all on function public.is_community_active(uuid) from public;
grant execute on function public.is_community_active(uuid) to anon, authenticated;

drop policy if exists "Active members upload community media" on storage.objects;
create policy "Active members upload community media" on storage.objects for insert
  with check (
    bucket_id = 'community-media'
    and (storage.foldername(name))[2] = auth.uid()::text
    and case when (storage.foldername(name))[1] ~ '^[0-9a-f-]{36}$'
      then public.is_community_active(((storage.foldername(name))[1])::uuid) else false end
  );

drop policy if exists "Uploaders delete their community media" on storage.objects;
create policy "Uploaders delete their community media" on storage.objects for delete
  using (bucket_id = 'community-media' and (storage.foldername(name))[2] = auth.uid()::text);
