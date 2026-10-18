-- 0010: stop anon-key reads of unpublished drafts and hidden credits.
-- Run AFTER 0009. The app reads via DATABASE_URL (bypasses RLS), so nothing breaks.

drop policy if exists "Stories are publicly readable" on stories;
create policy "Published stories are publicly readable" on stories
  for select using (published_at is not null and published_at <= now());
create policy "Admins can read all stories" on stories
  for select using (public.is_admin());

-- Same approach as portfolio_contributors (0009): people with show_credit off
-- must not be linkable to a project through the anon key.
drop policy if exists "Contributors are publicly readable" on project_contributors;
create policy "Admins can read project contributors" on project_contributors
  for select using (public.is_admin());
