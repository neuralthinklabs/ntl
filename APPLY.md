# NTL rectified build: how to apply

This zip contains every **new or changed** file, laid out at the same paths as your repo.
Unzip it over your project (overwrite when asked), then do the steps below.

## 1. Delete these files (they are replaced or were wrong)
```
components/dashboard/page.tsx            # stray duplicate of app/dashboard/page.tsx
package-lock.json                        # you use pnpm
supabase/migrations/0000_superb_timeslip.sql
supabase/migrations/0001_busy_eddie_brock.sql
supabase/migrations/meta/                # whole folder (Drizzle output that duplicates 0001-0004)
app/design-system/                       # internal page; delete, or keep it behind admin only
```

## 2. Install and check
```
pnpm install          # regenerates pnpm-lock.yaml (package.json changed)
pnpm typecheck        # I could not run this offline: fix anything it reports
pnpm test
pnpm build
```

## 3. Database
Run `supabase/migrations/0005_hardening_and_admin.sql` in the Supabase SQL editor
(after 0001-0004). It:
- stops users promoting themselves to admin (column-level grants on `profiles`)
- stops every user's email being publicly readable
- removes client-side insert policies that let people write status fields directly
- adds contribution status (pledged / confirmed / rejected / refunded)
- adds goal tagging (`ntldg_slug`), event time zones, a public `site-media` bucket (admin-write)
- caps attachment size and file types on the private bucket

Then set real campaign totals in **Admin > Campaigns** (the seeded numbers were placeholders),
and make yourself admin: `update profiles set role='admin' where email='you@example.com';`

## 4. Environment
Copy new keys from `.env.example`: `CRON_SECRET`, `PAYMENT_INSTRUCTIONS`, social URLs,
and use the **pooler** `DATABASE_URL` (port 6543). `SUPABASE_SERVICE_ROLE_KEY` is no longer needed.

## 5. Things to review yourself
- `app/privacy`, `app/terms`: templates only. Fill the [brackets] and have them reviewed.
- Pages I did not touch (about, contact, portfolio page, problems/mine, profile, auth forms)
  still set `title: '... — Neural Think Labs'`; the new title template adds it again.
  Remove the suffix in those `metadata` objects.
- `lib/supabase/*` and `SiteShell` use `supabase.auth.getClaims()`. If your supabase-js
  version lacks it, swap to `getUser()` (works, just slower).
- Next 16 renamed `middleware.ts` to `proxy.ts`. `middleware.ts` still works; rename when convenient.
- Payments are manual by design: pledge -> you receive money -> **Admin > Pledges & payments >
  Confirm payment received** -> progress bar and the donor's points update.
