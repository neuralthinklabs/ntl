-- 0012: achievements (seed + backfill) and removal of the unused attachments_incomplete flag.
-- Run AFTER 0011_atlas.sql.

-- ---------------------------------------------------------------------
-- 1. Achievement definitions (the app awards these by slug)
-- ---------------------------------------------------------------------
insert into achievements (slug, title, description, icon, points_awarded) values
  ('first-problem', 'Problem Spotter',     'Submitted your first problem.',              'sparkles', 10),
  ('five-problems', 'Persistent Voice',    'Submitted five problems.',                   'sparkles', 25),
  ('first-event',   'Showed Up',           'Attended your first event.',                 'calendar', 10),
  ('regular',       'Regular',             'Attended three events.',                     'calendar', 25),
  ('first-backer',  'Backer',              'Had your first pledge confirmed.',           'heart',    15)
on conflict (slug) do nothing;

-- ---------------------------------------------------------------------
-- 2. Backfill for people who already qualify. No points are granted here,
--    so existing totals do not jump; only the badges appear.
-- ---------------------------------------------------------------------
insert into user_achievements (user_id, achievement_id)
select p.submitted_by, a.id
from problems p join achievements a on a.slug = 'first-problem'
group by p.submitted_by, a.id
on conflict do nothing;

insert into user_achievements (user_id, achievement_id)
select p.submitted_by, a.id
from problems p join achievements a on a.slug = 'five-problems'
group by p.submitted_by, a.id
having count(*) >= 5
on conflict do nothing;

insert into user_achievements (user_id, achievement_id)
select r.user_id, a.id
from event_registrations r join achievements a on a.slug = 'first-event'
where r.status = 'attended'
group by r.user_id, a.id
on conflict do nothing;

insert into user_achievements (user_id, achievement_id)
select r.user_id, a.id
from event_registrations r join achievements a on a.slug = 'regular'
where r.status = 'attended'
group by r.user_id, a.id
having count(*) >= 3
on conflict do nothing;

insert into user_achievements (user_id, achievement_id)
select c.user_id, a.id
from contributions c join achievements a on a.slug = 'first-backer'
where c.status = 'confirmed'
group by c.user_id, a.id
on conflict do nothing;

-- ---------------------------------------------------------------------
-- 3. Attachments are now uploaded BEFORE the problem is saved, so a problem
--    can no longer be "incomplete". Drop the dead flag (irreversible).
-- ---------------------------------------------------------------------
drop index if exists problems_attachments_incomplete_idx;
alter table problems drop column if exists attachments_incomplete;
