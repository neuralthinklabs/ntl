# Phase 3: community upgrades + site controls

## Apply
1. Unzip over the repo root (adds new files, replaces `middleware.ts`, `components/site/site-shell.tsx`, `vercel.json`, `app/robots.ts`).
2. `python3 apply-phase3.py` (patches 15 existing files; stops with a list if any anchor has drifted; safe to re-run).
3. Supabase SQL editor, in order, each on its own:
   - `0022_phase3_enums.sql` (wait for it to finish)
   - `0023_phase3.sql`
4. `pnpm typecheck && pnpm test && pnpm build`, then deploy.
5. If you host on Netlify, the new function is `netlify/functions/community-maintenance.ts`. On Vercel the cron is already in `vercel.json` (note: Vercel's free plan allows only 2 cron jobs, you now have 5).

## Admin: Site controls (`/admin/site`)
- **Announcements:** top bar on every page. Tone, optional link, show-from / hide-at times, dismissible or not, optional **countdown** with a label and an "at zero" text. Newest 3 live ones show. A dismissed banner returns if you edit it.
- **Page controls:** block a page and everything under it (`/events`), the home page only (`/`), or the whole site (`*`, maintenance mode). Optional block-from time, optional **opens at** time (page opens by itself, and the countdown on the notice refreshes the page at zero), custom headline and message. "Open now" / "Block now" buttons. Signed-in admins still see blocked pages with an "Admin preview" strip. `/admin`, `/auth`, `/api`, `/oauth`, `/privacy`, `/terms` can never be blocked.
- Blocking `/problems`, `/volunteer`, `/support` or `/goals`, `/contact`, `/community` also stops the matching form submissions (problem, volunteer, pledge, contact, new community post). Other actions (comments, DMs, event registration, etc.) are not covered; say if you want them.
- Each rule/announcement change is written to the audit log.

## Community
- **Search** `/community/search`: posts (full text), groups, people. Same visibility rules as the feed; internal groups never appear; blocked authors hidden.
- **@mentions:** `@NTL-XXXX-XXXX` in posts and comments links to the member and sends a notification (skipped for blocked, banned, and for non-members of private groups).
- **Resources tab** on every group: leaders and moderators pin guidelines, links and notes.
- **Linked campaign card** on project groups (confirmed funding + milestones).
- **Daily maintenance cron:** reactivates expired suspensions, sends one "task due soon" notification per task. Editing a task's due date re-arms its reminder.
- Stale "task boards arrive later" text on project groups fixed.

## Known limits
- Blocked pages return HTTP 200 (a page component cannot set 503). Add a Next `proxy`/middleware rewrite if you need real 503s for search engines during long maintenance.
- Page rules cost one small query per page view (cached per request). Fine at this scale.
- Not compiled or tested here (no network). Run typecheck/build before deploying.
- Not in this phase: recurring meetings, subtasks, meeting `.ics`, admin analytics, per-type notification mutes, bulk moderation.
