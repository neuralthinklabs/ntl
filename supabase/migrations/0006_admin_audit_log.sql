-- 0006: audit trail for admin mutations (used by lib/audit.ts).
create table if not exists admin_audit_log (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references profiles (id) on delete set null,
  action text not null,
  entity text not null,
  entity_id text,
  summary text,
  created_at timestamptz not null default now()
);

create index if not exists admin_audit_log_created_at_idx
  on admin_audit_log (created_at desc);

alter table admin_audit_log enable row level security;

-- Written only by server actions via the privileged DATABASE_URL connection.
-- Admins may read it through PostgREST; nobody can write through it.
create policy "Admins can read the audit log" on admin_audit_log
  for select using (public.is_admin());
