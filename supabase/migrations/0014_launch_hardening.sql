-- 0014: launch hardening. Safe to run more than once. Run AFTER 0012 (and 0013
-- if you applied it).
--
-- The app writes to the database through DATABASE_URL (a privileged role), never
-- through the public anon/authenticated API keys. So those keys should not have
-- write permissions on any table at all. RLS already blocks most writes; this
-- removes the permissions too, so one forgotten policy can never open a hole.

-- ---------------------------------------------------------------------
-- 1. No writes through the public API keys
-- ---------------------------------------------------------------------
revoke insert, update, delete, truncate on all tables in schema public from anon, authenticated;
alter default privileges in schema public
  revoke insert, update, delete, truncate on tables from anon, authenticated;

-- The one thing signed-in users may still change directly (column-limited).
grant update (full_name, bio, avatar_url, show_credit) on profiles to authenticated;

-- ---------------------------------------------------------------------
-- 2. Anonymous visitors cannot read private tables at all
--    (public content tables keep their anon read policies)
-- ---------------------------------------------------------------------
do $$
declare t text;
begin
  foreach t in array array[
    'profiles', 'problems', 'problem_attachments', 'contributions', 'activity_records',
    'user_achievements', 'event_registrations', 'contact_enquiries', 'auth_attempts',
    'admin_audit_log', 'assignments', 'project_contributors', 'portfolio_contributors'
  ] loop
    if to_regclass('public.' || t) is not null then
      execute format('revoke all on table public.%I from anon', t);
    end if;
  end loop;
end $$;

-- ---------------------------------------------------------------------
-- 3. Basic data sanity (new rows only; existing rows are not re-checked)
-- ---------------------------------------------------------------------
do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'contributions_amount_positive') then
    alter table contributions
      add constraint contributions_amount_positive check (amount_cents is null or amount_cents > 0) not valid;
  end if;
  if not exists (select 1 from pg_constraint where conname = 'goals_funding_nonnegative') then
    alter table goals
      add constraint goals_funding_nonnegative check (funding_target_cents >= 0 and funding_raised_cents >= 0) not valid;
  end if;
  if not exists (select 1 from pg_constraint where conname = 'events_capacity_positive') then
    alter table events
      add constraint events_capacity_positive check (capacity is null or capacity > 0) not valid;
  end if;
end $$;

-- ---------------------------------------------------------------------
-- 4. Indexes for the queries the site actually runs
-- ---------------------------------------------------------------------
create index if not exists event_registrations_event_status_idx on event_registrations (event_id, status);
create index if not exists problems_status_created_idx on problems (status, created_at desc);
create index if not exists stories_author_idx on stories (author_id);
create index if not exists goal_milestones_goal_idx on goal_milestones (goal_id, sort_order);
create index if not exists goal_updates_goal_idx on goal_updates (goal_id, created_at desc);
