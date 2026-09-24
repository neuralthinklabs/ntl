-- P0 fixes migration — run AFTER 0001_init.sql.
-- Adds idempotency keys (duplicate-submission protection) and an
-- "incomplete" flag for problems whose attachments partially failed.

alter table problems
  add column if not exists client_request_id uuid unique,
  add column if not exists attachments_incomplete boolean not null default false;

alter table contributions
  add column if not exists client_request_id uuid unique;

-- Optional but recommended: index for admins filtering incomplete
-- submissions that need a manual look.
create index if not exists problems_attachments_incomplete_idx
  on problems (attachments_incomplete)
  where attachments_incomplete = true;
