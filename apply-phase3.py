#!/usr/bin/env python3
"""Phase 3 patcher. Run from the repo root AFTER unzipping the new files over it:
    python3 apply-phase3.py
Every edit checks that its anchor text exists exactly once and stops loudly if not,
so a file that has drifted is reported instead of being silently mangled.
Safe to run twice: an edit that is already applied is skipped."""
import sys, pathlib

root = pathlib.Path('.')
problems = []

def patch(path, old, new):
    p = root / path
    if not p.exists():
        problems.append(f'{path}: file not found'); return
    s = p.read_text()
    if new in s and old not in s:
        print(f'skip   {path} (already applied)'); return
    n = s.count(old)
    if n != 1:
        problems.append(f'{path}: anchor found {n} times, expected 1:\n    {old[:90]!r}'); return
    p.write_text(s.replace(old, new))
    print(f'patched {path}')

def guard_action(path, signature, paths):
    args = ', '.join(repr(x) for x in paths)
    patch(path, signature, signature + f"\n  const closed = await actionBlockedMessage({args})\n  if (closed) return {{ error: closed }}")
    patch(path, "import type { ActionState } from './auth'", "import type { ActionState } from './auth'\nimport { actionBlockedMessage } from '@/lib/site-controls'")

SIG = '(_prev: ActionState, formData: FormData): Promise<ActionState> {'

# --- Admin can block pages: matching submit actions stop too ------------------
guard_action('actions/problems.ts', 'export async function submitProblem' + SIG, ['/problems'])
guard_action('actions/volunteer.ts', 'export async function submitVolunteer' + SIG, ['/volunteer'])
guard_action('actions/goals.ts', 'export async function recordContribution' + SIG, ['/goals', '/support'])
guard_action('actions/contact.ts', 'export async function submitContact' + SIG, ['/contact'])
guard_action('actions/community.ts', 'export async function createPost' + SIG, ['/community'])

# --- Mentions -----------------------------------------------------------------
patch('actions/community.ts', "import { notify, notifyStaff } from '@/lib/community/notify'",
      "import { notify, notifyStaff } from '@/lib/community/notify'\nimport { notifyMentions } from '@/lib/community/mentions'")
patch('actions/community.ts',
      "  refresh(community.slug, community.visibility)\n  return { success: needsApproval ?",
      "  if (!needsApproval) await notifyMentions({ text: `${d.title ?? ''} ${d.body}`, actor: viewer, community, link })\n  refresh(community.slug, community.visibility)\n  return { success: needsApproval ?")
patch('actions/community.ts',
      "  await notify(rows)\n  revalidatePath(link)",
      "  await notify(rows)\n  await notifyMentions({ text: p.data.body, actor: viewer, community, link })\n  revalidatePath(link)")
patch('db/community-schema.ts',
      "'meeting_scheduled', 'meeting_cancelled', 'meeting_reminder',\n])",
      "'meeting_scheduled', 'meeting_cancelled', 'meeting_reminder',\n  'mention', 'task_due',\n])")
patch('components/community/post-card.tsx', "import { ActionButton } from './action-button'",
      "import { ActionButton } from './action-button'\nimport { MentionText } from './mention-text'")
patch('components/community/post-card.tsx', "!detail && 'line-clamp-6')}>{post.body}</p>",
      "!detail && 'line-clamp-6')}><MentionText text={post.body} /></p>")
patch('app/community/post/[id]/page.tsx', "import { ActionButton } from '@/components/community/action-button'",
      "import { ActionButton } from '@/components/community/action-button'\nimport { MentionText } from '@/components/community/mention-text'")
patch('app/community/post/[id]/page.tsx', 'text-slate-800">{c.body}</p>',
      'text-slate-800"><MentionText text={c.body} /></p>')

# --- Task due reminders -------------------------------------------------------
patch('db/collab-schema.ts',
      "  completedAt: timestamp('completed_at', { withTimezone: true }),\n",
      "  completedAt: timestamp('completed_at', { withTimezone: true }),\n  reminderSentAt: timestamp('reminder_sent_at', { withTimezone: true }),\n")
patch('actions/tasks.ts',
      "dueDate: toDate(p.data.dueDate), updatedAt: new Date() }).where(eq(communityTasks.id, t.id))",
      "dueDate: toDate(p.data.dueDate), reminderSentAt: null, updatedAt: new Date() }).where(eq(communityTasks.id, t.id))")

# --- Group page: resources tab, linked campaign, stale copy -------------------
G = 'components/community/group-view.tsx'
patch(G, "import { hasTasks } from '@/lib/collab/constants'",
      "import { hasTasks } from '@/lib/collab/constants'\nimport { ResourcesTab } from './resources-tab'\nimport { LinkedCampaign } from './linked-campaign'")
patch(G, "    : sp.tab === 'tasks' && member && hasTasks(c.kind) ? 'tasks'",
      "    : sp.tab === 'tasks' && member && hasTasks(c.kind) ? 'tasks'\n    : sp.tab === 'resources' ? 'resources'")
patch(G, "          {member && hasTasks(c.kind) && <Link href={qs({ tab: 'tasks' })} className={pill(tab === 'tasks')}>Tasks</Link>}",
      "          {member && hasTasks(c.kind) && <Link href={qs({ tab: 'tasks' })} className={pill(tab === 'tasks')}>Tasks</Link>}\n          <Link href={qs({ tab: 'resources' })} className={pill(tab === 'resources')}>Resources</Link>")
patch(G, "        {tab === 'tasks' && <TasksTab community={c} viewer={viewer} access={access} mine={sp.mine === '1'} />}",
      "        {tab === 'tasks' && <TasksTab community={c} viewer={viewer} access={access} mine={sp.mine === '1'} />}\n        {tab === 'resources' && <ResourcesTab community={c} access={access} />}")
patch(G, '              {access.role && <p className="rounded-2xl bg-brand/5',
      "              {c.kind === 'project' && c.goalId && <LinkedCampaign goalId={c.goalId} />}\n"
      '              {access.role && <p className="rounded-2xl bg-brand/5')
patch(G, '. Shared task boards arrive in a later phase; use project updates and discussions for now.',
      '. Tasks, meetings and resources are in the tabs above.')

# --- Community search box, admin nav ------------------------------------------
patch('app/community/page.tsx', '<aside className="flex flex-col gap-3 text-sm">',
      '<aside className="flex flex-col gap-3 text-sm">\n'
      '            <form action="/community/search" role="search" className="flex gap-2">\n'
      '              <label htmlFor="community-search" className="sr-only">Search the community</label>\n'
      '              <input id="community-search" name="q" placeholder="Search posts, groups, people" className="min-w-0 flex-1 rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-ink outline-none focus:border-brand-muted focus:ring-2 focus:ring-brand/30" />\n'
      '              <button type="submit" className="rounded-xl bg-ink px-3 py-2 text-sm font-semibold text-white">Go</button>\n'
      '            </form>')
patch('components/admin/admin-nav.tsx', "  MessagesSquare,\n} from 'lucide-react'",
      "  MessagesSquare,\n  SlidersHorizontal,\n} from 'lucide-react'")
patch('components/admin/admin-nav.tsx', "  { href: '/admin/events', label: 'Events', icon: CalendarDays },",
      "  { href: '/admin/site', label: 'Site controls', icon: SlidersHorizontal },\n  { href: '/admin/events', label: 'Events', icon: CalendarDays },")

if problems:
    print('\nSTOPPED WITH PROBLEMS (nothing below this was lost, fix and re-run):')
    for x in problems: print(' -', x)
    sys.exit(1)
print('\nAll edits applied.')
