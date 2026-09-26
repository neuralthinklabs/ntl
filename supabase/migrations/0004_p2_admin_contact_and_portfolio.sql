-- P2 fixes migration — run AFTER 0001_init.sql, 0002_p0_fixes.sql and
-- 0003_p1_fixes.sql. Prefer regenerating with `pnpm db:generate` once you
-- have network access and can diff against db/schema.ts directly.

-- ---------------------------------------------------------------------
-- Portfolio: /portfolio previously stayed on lib/data.ts mock data even
-- after goals/events/stories moved to real tables. This brings it in
-- line with that same pattern (see lib/portfolio.ts).
-- ---------------------------------------------------------------------
create type portfolio_type as enum ('Product', 'Service', 'Venture', 'System', 'Publication');
create type portfolio_status as enum ('Active', 'In Progress', 'Planned', 'Completed');

create table if not exists portfolio_items (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  type portfolio_type not null,
  status portfolio_status not null default 'Planned',
  description text not null,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table portfolio_items enable row level security;
create policy "Portfolio items are publicly readable" on portfolio_items for select using (true);

-- Seed with the exact rows that used to live in lib/data.ts, so the page
-- renders identically after the switch to real data.
insert into portfolio_items (name, type, status, description, sort_order)
values
  ('NeuroLearn', 'Product', 'Active', 'AI-powered learning platform for lifelong learners.', 1),
  ('Community Research Hub', 'Service', 'Active', 'Connects researchers with real-world problems and data.', 2),
  ('Clean Water Initiative', 'Venture', 'In Progress', 'Sustainable water solutions for rural communities.', 3),
  ('Open Knowledge Library', 'Publication', 'Active', 'Free access to research, guides and educational resources.', 4),
  ('Impact Analytics System', 'System', 'Planned', 'Track and measure real-world impact across projects.', 5),
  ('Mentor Network', 'Service', 'Active', 'Pairs experts with grassroots teams solving local problems.', 6);

-- ---------------------------------------------------------------------
-- Admin contact review: contact_enquiries.handled was written by the
-- contact form but had no admin review surface (unlike problems, which
-- got /admin/problems). This index supports the new /admin/contact page
-- efficiently filtering/sorting on that column as the table grows —
-- same pattern as problems_attachments_incomplete_idx in 0001_init.sql.
-- ---------------------------------------------------------------------
create index if not exists contact_enquiries_handled_idx
  on contact_enquiries (handled, created_at desc);
