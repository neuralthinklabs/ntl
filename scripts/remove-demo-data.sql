-- Removes the SAMPLE rows seeded by migrations 0001, 0003 and 0004 so the live
-- site does not show invented numbers or content. Read it, then run it once in
-- the Supabase SQL editor. Every delete is guarded: rows that already have real
-- pledges, registrations or contributors are left alone.
begin;

-- Sample campaigns (with their invented "raised" totals).
delete from goals g
where g.slug in ('clean-water', 'education-for-everyone', 'open-knowledge-library')
  and not exists (select 1 from contributions c where c.goal_id = g.id);

-- Any sample campaign you kept because it has pledges: zero the invented total
-- unless a payment has really been confirmed.
update goals
set funding_raised_cents = 0
where slug in ('clean-water', 'education-for-everyone', 'open-knowledge-library')
  and not exists (select 1 from contributions c where c.goal_id = goals.id and c.status = 'confirmed');

-- Sample event and story.
delete from events e
where e.slug = 'global-innovation-summit-2026'
  and not exists (select 1 from event_registrations r where r.event_id = e.id);

delete from stories
where slug = 'how-community-input-turned-into-a-real-project';

-- Sample portfolio items (only if nobody is credited on them).
delete from portfolio_items p
where p.name in (
    'NeuroLearn', 'Community Research Hub', 'Clean Water Initiative',
    'Open Knowledge Library', 'Impact Analytics System', 'Mentor Network'
  )
  and not exists (select 1 from portfolio_contributors pc where pc.portfolio_item_id = p.id);

commit;
