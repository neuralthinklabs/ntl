-- 0008: NTL IDs, credits (project contributors) and assignments.
-- Run AFTER 0007_roles_enum.sql has completed.

-- ---------------------------------------------------------------------
-- 1. NTL ID: opaque public identifier, e.g. NTL-7K3M-9QX2
--    (alphabet skips 0/O/1/I/L so it can be read aloud)
-- ---------------------------------------------------------------------
create or replace function public.generate_ntl_id() returns text
language plpgsql as $$
declare
  alphabet text := 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
  result text;
  i int;
begin
  loop
    result := 'NTL-';
    for i in 1..4 loop
      result := result || substr(alphabet, 1 + floor(random() * length(alphabet))::int, 1);
    end loop;
    result := result || '-';
    for i in 1..4 loop
      result := result || substr(alphabet, 1 + floor(random() * length(alphabet))::int, 1);
    end loop;
    exit when not exists (select 1 from public.profiles where ntl_id = result);
  end loop;
  return result;
end $$;

alter table profiles add column if not exists ntl_id text;
alter table profiles add column if not exists show_credit boolean not null default true;

update profiles set ntl_id = public.generate_ntl_id() where ntl_id is null;
alter table profiles alter column ntl_id set default public.generate_ntl_id();
alter table profiles alter column ntl_id set not null;
create unique index if not exists profiles_ntl_id_key on profiles (ntl_id);

-- Signed-in users may toggle their own public credit, but never change ntl_id
-- (column-level grants from 0005 already exclude it).
grant update (show_credit) on profiles to authenticated;

-- ---------------------------------------------------------------------
-- 2. Assignments (work given to volunteers / core team by an admin)
-- ---------------------------------------------------------------------
do $$ begin
  create type assignment_kind as enum ('problem_review', 'blog_post', 'campaign', 'event', 'other');
exception when duplicate_object then null; end $$;

do $$ begin
  create type assignment_status as enum ('assigned', 'in_progress', 'submitted', 'done', 'cancelled');
exception when duplicate_object then null; end $$;

create table if not exists assignments (
  id uuid primary key default gen_random_uuid(),
  kind assignment_kind not null,
  assignee_id uuid not null references profiles (id) on delete cascade,
  assigned_by uuid references profiles (id) on delete set null,
  problem_id uuid references problems (id) on delete cascade,
  story_id uuid references stories (id) on delete cascade,
  title text not null,
  brief text,
  status assignment_status not null default 'assigned',
  assignee_note text,
  due_date timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists assignments_assignee_idx on assignments (assignee_id, status);
create index if not exists assignments_created_idx on assignments (created_at desc);
-- A problem can have only one active reviewer at a time.
create unique index if not exists assignments_one_active_review_idx
  on assignments (problem_id) where kind = 'problem_review' and status <> 'cancelled';

alter table assignments enable row level security;
-- Defense in depth only: the app reads/writes through the server connection.
create policy "Assignees can read their own assignments" on assignments
  for select using (auth.uid() = assignee_id);
create policy "Admins can read all assignments" on assignments
  for select using (public.is_admin());

-- ---------------------------------------------------------------------
-- 3. Credits: who worked on a campaign/project
--    (blog authorship already lives in stories.author_id)
-- ---------------------------------------------------------------------
create table if not exists project_contributors (
  goal_id uuid not null references goals (id) on delete cascade,
  user_id uuid not null references profiles (id) on delete cascade,
  role_label text not null default 'Contributor',
  created_at timestamptz not null default now(),
  primary key (goal_id, user_id)
);

alter table project_contributors enable row level security;
-- Holds only ids and a label (no personal data); names are served by the app.
create policy "Contributors are publicly readable" on project_contributors for select using (true);
