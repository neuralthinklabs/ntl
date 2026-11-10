-- 0018: Series and Magazines. Run AFTER 0017. Safe to run more than once.
-- A collection groups stories. Membership lives in collection_stories so the
-- existing `stories` table is untouched. A story belongs to at most one collection.
do $$ begin
  create type collection_kind as enum ('series', 'magazine');
exception when duplicate_object then null; end $$;

create table if not exists collections (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  kind collection_kind not null,
  title text not null,
  description text,
  cover_image text,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists collections_kind_idx on collections (kind, published_at desc);

create table if not exists collection_stories (
  story_id uuid primary key references stories (id) on delete cascade,
  collection_id uuid not null references collections (id) on delete cascade,
  position integer not null default 0,
  issue integer check (issue is null or issue > 0),
  created_at timestamptz not null default now()
);
create index if not exists collection_stories_collection_idx on collection_stories (collection_id, issue, position);

alter table collections enable row level security;

drop policy if exists
  "Published collections are publicly readable"
  on collections;

create policy "Published collections are publicly readable"
on collections
for select
using (
  published_at is not null
  and published_at <= now()
);

drop policy if exists
  "Admins can read all collections"
  on collections;

create policy "Admins can read all collections"
on collections
for select
using (public.is_admin());

-- Server-only table
alter table collection_stories enable row level security;

revoke all on table collection_stories
from anon, authenticated;
