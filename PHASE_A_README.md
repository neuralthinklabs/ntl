# Phase A — Production Backend

This build wires the prototype up to a real backend: Supabase (Postgres +
Auth + Storage), Drizzle ORM, Resend for email, and Cloudflare Turnstile for
spam protection. It was written in an environment with no network access, so
**nothing has been installed or run** — follow the steps below in your own
machine/CI where `pnpm install` can reach the internet.

## 1. Create a Supabase project

1. Create a project at https://supabase.com/dashboard.
2. Project Settings → API: copy the Project URL and anon key.
3. Project Settings → Database → Connection string: copy the **Transaction
   pooler** URI (works with serverless/edge — the direct connection string
   will exhaust connections quickly on Vercel).
4. Project Settings → API → copy the `service_role` key (server-only, never
   expose to the browser).

## 2. Set environment variables

```
cp .env.example .env.local
```

Fill in `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`,
`SUPABASE_SERVICE_ROLE_KEY`, and `DATABASE_URL` from step 1.

For email, sign up at https://resend.com, verify a sending domain, and set
`RESEND_API_KEY` + `EMAIL_FROM`. Until you do, emails are skipped (logged to
the console) rather than failing the request.

For spam protection, create a Turnstile widget at
https://dash.cloudflare.com/?to=/:account/turnstile and set
`NEXT_PUBLIC_TURNSTILE_SITE_KEY` + `TURNSTILE_SECRET_KEY`. Until you do,
contact-form verification is skipped (dev mode).

For the volunteer flow, create a Google Form and set
`NEXT_PUBLIC_VOLUNTEER_FORM_URL` to its public link.

## 3. Install dependencies and apply the schema

```
pnpm install
```

Then run the SQL migration against your Supabase database. Easiest path —
paste the contents of `supabase/migrations/0001_init.sql` into the Supabase
Dashboard's SQL Editor and run it. It creates all tables, enums, indexes, Row
Level Security policies, the `problem-attachments` storage bucket, and seeds
the three goals from the original prototype (`clean-water`,
`education-for-everyone`, `open-knowledge-library`).

Alternatively, once `DATABASE_URL` is set:

```
psql "$DATABASE_URL" -f supabase/migrations/0001_init.sql
```

Going forward, prefer editing `db/schema.ts` and generating migrations with
`pnpm db:generate` (Drizzle Kit) rather than hand-editing the SQL file.

## 4. Configure Supabase Auth

Authentication → URL Configuration:
- Site URL: your deployed URL (or `http://localhost:3000` for local dev)
- Redirect URLs: add `<site-url>/auth/callback`

Authentication → Emails: by default Supabase sends auth emails (signup
confirmation, password reset) from its own shared sender. To send them from
your own domain via Resend, go to Authentication → SMTP Settings and enter
Resend's SMTP credentials — this is what makes verification/reset emails
look like they come from you rather than Supabase.

## 5. Make yourself an admin

After signing up through the app once, run in the SQL Editor:

```sql
update profiles set role = 'admin' where email = 'you@example.com';
```

Admins can review problem submissions at `/admin/problems`.

## 6. Run it

```
pnpm dev
```

## What's wired up

- **Auth**: signup, login, logout, password reset, email verification
  (Supabase Auth), protected `/dashboard`, `/profile`, `/problems/mine`, and
  `/admin/*` via `middleware.ts`.
- **Problem submission**: `/problems` → real form → file uploads to Supabase
  Storage → DB record → confirmation email + page → visible at
  `/problems/mine` → admin review/status changes at `/admin/problems`.
- **Contact**: `/contact` → honeypot + Turnstile → DB record → ack email to
  sender + notification email to `CONTACT_INBOX_EMAIL`.
- **Volunteer**: `/volunteer` "Apply Now" links to `NEXT_PUBLIC_VOLUNTEER_FORM_URL`
  (a Google Form) — swap for a native application flow later.
- **Goals**: `/support` and `/goals/[slug]` read real funding/progress,
  milestones, and updates from Postgres; a contribution form records
  pledges and bumps the goal's raised total (no payment processor is wired
  up yet — see "Not yet wired" below).
- **Dashboard**: real authenticated user, real points, submitted-problem
  count, activity feed, "Log out" button.

## Not yet wired (flagged, not silently skipped)

- **Payments**: contributions are recorded in the database but no money
  actually moves — there's no Stripe/PayPal integration. Add one when you're
  ready to accept real donations.
- **Events / Stories**: DB tables (`events`, `event_registrations`,
  `stories`) and RLS policies exist, but the `/events` and `/stories` pages
  still render from `lib/data.ts` mock data, and there's no "Register for
  event" button yet. Same pattern as problems/goals — happy to wire these
  next.
- **Achievements**: table + relations exist; nothing currently awards them
  automatically. Decide the trigger rules (e.g. first problem submitted,
  5 events attended) and add them to the relevant server actions.
- **Volunteer native form**: still a Google Form embed per Phase A scope;
  migrating to a native application table/flow is a Phase B item per the
  original brief.
