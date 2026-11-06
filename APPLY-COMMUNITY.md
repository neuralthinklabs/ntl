# NTL Community & Collaboration: phase 1

## Apply
1. Copy every file in this folder over your repo (same paths). Nothing existing is overwritten except via step 2.
2. From the repo root: `python3 apply-community.py` (adds 3 profile columns to db/schema.ts, the Community nav link, the admin nav item, route protection, robots and sitemap entries).
3. Supabase SQL editor: run `supabase/migrations/0019_community.sql` (after 0018).
4. `pnpm typecheck && pnpm test && pnpm build`.
5. Sign in as admin > Admin > Community > New group. Create at least one public group; create internal spaces (Core team, Leadership, Zone leaders, Operations...) and invite people by NTL ID from the group's Members tab.

## What is in phase 1
| Area | Where |
|---|---|
| Community feed (discussion, idea, poll, announcement, research, event, project update, resource) | /community |
| Discover (interest, Atlas national/zone/region/city, project, learning) | /community/discover |
| My groups, join requests | /community/groups |
| Group page: feed, type filters, members, moderation | /community/g/[slug] |
| Project groups: leaders shown, project updates, discussions, resources | same page, kind = project |
| Internal NTL workspace (invisible to non-members) | /workspace, /workspace/[slug] |
| Post detail, comments, replies, reactions, poll voting | /community/post/[id] |
| Member profile + participation history (public groups only) | /community/members/[ntlId] |
| Notifications, blocked people | /community/notifications |
| Appeals | /community/appeals |
| Admin: groups, people (verify/suspend/ban), reports, appeals, log | /admin/community, /admin/community/moderation |

## Permissions (per group, not one global role)
Roles live in `community_members.role` (member, moderator, leader), so one person can lead one group and be a plain member of another. `lib/community/authz.ts` is the single decision point:
- Public visitor: reads public groups only.
- Registered member: joins public groups instantly, private groups by approval; comments, reacts and votes.
- Verified contributor (`profiles.verified_contributor`, set by admin): skips post approval, can post events.
- Moderator: approves/removes posts and comments, handles reports, warns, suspends, bans, approves joins.
- Leader: all of the above plus roles, invites, acting on moderators.
- NTL admin: everything, including internal spaces, platform-wide suspension/ban, appeal decisions.
Appeals are decided by admins only, so a moderator never reviews their own decision.

## Security notes
- Every server action calls `guard()`; the client is never trusted. Internal groups return "not found" to outsiders, in pages and in actions.
- Rate limits reuse `lib/rate-limit.ts` (join, post, comment, react, report).
- RLS in 0019 is defense in depth (app uses DATABASE_URL): internal and private content is unreadable with the anon/authenticated keys; membership, notifications, blocks, reports, moderation log and appeals are private tables.
- Storage bucket `community-media` (private, per-community folder, members only) is created with policies; the upload UI is not built yet.

## Deliberately not in phase 1
Direct messaging, meetings, task boards (project workspaces show leaders, updates, discussions, resources), file uploads in posts, email digests, edit-own-post.

## Not yet verified
The sandbox had no network, so this was written against your code but not compiled or run. Run typecheck and click through: create a group, join, post, comment, report, moderate, appeal.
