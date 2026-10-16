-- 0009: credits for portfolio projects (same idea as project_contributors for campaigns).
create table if not exists portfolio_contributors (
  portfolio_item_id uuid not null references portfolio_items (id) on delete cascade,
  user_id uuid not null references profiles (id) on delete cascade,
  role_label text not null default 'Contributor',
  created_at timestamptz not null default now(),
  primary key (portfolio_item_id, user_id)
);

create index if not exists portfolio_contributors_user_idx on portfolio_contributors (user_id);

alter table portfolio_contributors enable row level security;
-- No public policy on purpose: people who turned off public credit must not be
-- linkable to a project through the anon key. The app serves names from the
-- server and filters on show_credit.
create policy "Admins can read portfolio contributors" on portfolio_contributors
  for select using (public.is_admin());
