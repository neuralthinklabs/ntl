import Link from 'next/link'
import { notFound } from 'next/navigation'
import { BadgeCheck, Lock, ShieldCheck, Users } from 'lucide-react'
import { SiteShell } from '@/components/site/site-shell'
import { PageHero } from '@/components/site/page-hero'
import { Pager } from '@/components/site/pager'
import { PostCard } from './post-card'
import { Composer } from './composer'
import { JoinButton } from './join-button'
import { ActionButton } from './action-button'
import { AddMemberForm, RoleSelect } from './member-tools'
import { loadGroup } from '@/lib/community/authz'
import { getFeed, getMemberCount, getMembers, getModLog, getOpenReports, getPendingPosts, getPollData } from '@/lib/community/queries'
import { KIND_LABEL, MOD_ACTION_LABEL, POST_TYPES, POST_TYPE_LABEL, ROLE_LABEL, VISIBILITY_LABEL, groupHref } from '@/lib/community/constants'
import { approveMember, banMember, closeReport, liftRestriction, rejectMember, removeComment, removeMember, removePost, suspendMember, warnMember } from '@/actions/community-manage'
import { parsePage, totalPages, DEFAULT_PAGE_SIZE } from '@/lib/pagination'
import { formatDate } from '@/lib/datetime'
import { cn } from '@/lib/utils'
import { MeetingsTab } from './meetings-tab'
import { TasksTab } from './tasks-tab'
import { hasTasks } from '@/lib/collab/constants'
import { ResourcesTab } from './resources-tab'
import { LinkedCampaign } from './linked-campaign'

type SP = { tab?: string; type?: string; page?: string; mine?: string }
const pill = (on: boolean) => cn('rounded-full px-4 py-1.5 text-sm font-medium', on ? 'bg-ink text-white' : 'bg-white text-slate-700 ring-1 ring-inset ring-slate-300 hover:bg-slate-50')

/** Shared by /community/g/[slug] and /workspace/[slug]. Authorization lives in loadGroup / resolveAccess. */
export async function GroupView({ slug, internal, sp }: { slug: string; internal: boolean; sp: SP }) {
  const ctx = await loadGroup(slug, internal)
  if (!ctx) notFound()
  const { community: c, viewer, access } = ctx
  const base = groupHref(c)
  const loggedIn = !!viewer
  const memberCount = await getMemberCount(c.id)
  const member = access.isMember || !!viewer?.isAdmin
  const tab =
    sp.tab === 'members' && member ? 'members'
    : sp.tab === 'moderation' && access.canModerate ? 'moderation'
    : sp.tab === 'meetings' && member ? 'meetings'
    : sp.tab === 'tasks' && member && hasTasks(c.kind) ? 'tasks'
    : sp.tab === 'resources' ? 'resources'
    : 'discussion'
  const { page } = parsePage(sp)
  const type = POST_TYPES.find((t) => t === sp.type)

  const heroDescription = `${KIND_LABEL[c.kind]} · ${VISIBILITY_LABEL[c.visibility]} · ${memberCount} member${memberCount === 1 ? '' : 's'}${c.description ? ` · ${c.description}` : ''}`

  // Private group, not a member: show only what the listing already showed.
  if (!access.canView) {
    return (
      <SiteShell>
        <PageHero title={c.name} description={heroDescription} />
        <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
          <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
            <Lock className="mx-auto size-6 text-slate-500" aria-hidden />
            <h2 className="mt-3 text-lg font-semibold text-ink">This group is private</h2>
            <p className="mt-1 text-sm text-slate-600">Its discussions are visible to members only. Ask to join and a group leader will review your request.</p>
            <div className="mt-5 flex justify-center">
              <JoinButton communityId={c.id} loggedIn={loggedIn} status={access.status} nextPath={base} />
            </div>
          </div>
        </div>
      </SiteShell>
    )
  }

  const [feed, members, pending, reports, log] = await Promise.all([
    tab === 'discussion' ? getFeed({ viewerId: viewer?.id ?? null, page, type, communityId: c.id }) : Promise.resolve({ items: [], total: 0 }),
    tab === 'members' || c.kind === 'project' ? getMembers(c.id) : Promise.resolve([]),
    tab === 'moderation' ? getPendingPosts(c.id) : Promise.resolve([]),
    tab === 'moderation' ? getOpenReports({ communityId: c.id }) : Promise.resolve([]),
    tab === 'moderation' ? getModLog({ communityId: c.id, limit: 25 }) : Promise.resolve([]),
  ])
  const polls = await getPollData(feed.items.filter((p) => p.type === 'poll').map((p) => p.id), viewer?.id ?? null)
  const leaders = members.filter((m) => m.role === 'leader' && m.status === 'active')
  const qs = (o: Record<string, string | undefined>) => {
    const p = new URLSearchParams(Object.entries(o).filter(([, v]) => v) as [string, string][]).toString()
    return p ? `${base}?${p}` : base
  }
  const filterTypes: string[] = ['announcement', 'resource', 'idea', 'poll', 'research', 'event', ...(c.kind === 'project' ? ['project_update'] : [])]
  const pendingMembers = members.filter((m) => m.status === 'pending')

  return (
    <SiteShell>
      <PageHero title={c.name} description={heroDescription}>
        <div className="flex flex-wrap items-center gap-3">
          {!internal && <JoinButton communityId={c.id} loggedIn={loggedIn} status={access.status} nextPath={base} />}
          {internal && <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1.5 text-xs font-medium text-white"><ShieldCheck className="size-4 text-brand" /> Internal NTL space. Not visible to the public.</span>}
          {access.restricted === 'group' && <span className="rounded-full bg-amber-100 px-3 py-1.5 text-xs font-medium text-amber-800">You are restricted here. <Link href="/community/appeals" className="underline">See why or appeal</Link>.</span>}
          {access.restricted === 'archived' && <span className="rounded-full bg-slate-200 px-3 py-1.5 text-xs font-medium text-slate-800">Archived: read only</span>}
        </div>
      </PageHero>

      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
        <nav aria-label="Group sections" className="flex flex-wrap gap-2">
          <Link href={base} className={pill(tab === 'discussion' && !type)}>Discussion</Link>
          {filterTypes.map((t) => (
            <Link key={t} href={qs({ type: t })} className={pill(tab === 'discussion' && type === t)}>{POST_TYPE_LABEL[t]}s</Link>
          ))}
          {(access.isMember || viewer?.isAdmin) && <Link href={qs({ tab: 'members' })} className={pill(tab === 'members')}>Members</Link>}
          {member && <Link href={qs({ tab: 'meetings' })} className={pill(tab === 'meetings')}>Meetings</Link>}
          {member && hasTasks(c.kind) && <Link href={qs({ tab: 'tasks' })} className={pill(tab === 'tasks')}>Tasks</Link>}
          <Link href={qs({ tab: 'resources' })} className={pill(tab === 'resources')}>Resources</Link>
          {access.canModerate && <Link href={qs({ tab: 'moderation' })} className={pill(tab === 'moderation')}>Moderation</Link>}
        </nav>

        {c.kind === 'project' && leaders.length > 0 && (
          <p className="mt-5 text-sm text-slate-700">
            <span className="font-semibold text-ink">Project leaders: </span>
            {leaders.map((l, i) => (
              <span key={l.userId}>{i > 0 && ', '}<Link href={`/community/members/${l.ntlId}`} className="text-brand-muted underline">{l.name}</Link></span>
            ))}
            . Tasks, meetings and resources are in the tabs above.
          </p>
        )}

        {tab === 'discussion' && (
          <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_280px]">
            <div className="flex flex-col gap-5">
              {access.canPost || !loggedIn ? (
                <Composer groups={[{ id: c.id, name: c.name, kind: c.kind, canModerate: access.canModerate }]} fixedGroupId={c.id} loggedIn={loggedIn} verified={!!viewer?.verified} nextPath={base} />
              ) : (
                <p className="rounded-2xl border border-dashed border-slate-300 bg-white p-5 text-sm text-slate-700">{access.pending ? 'Your request to join is waiting for approval.' : access.restricted ? 'You cannot post here right now.' : 'Join this group to post.'}</p>
              )}
              {c.requirePostApproval && <p className="text-xs text-slate-600">Posts here are reviewed by moderators before they appear (verified contributors skip review).</p>}
              {feed.items.length === 0 && <p className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-600">Nothing here yet. Start the conversation.</p>}
              {feed.items.map((p) => (
                <PostCard key={p.id} post={p} poll={polls[p.id]} loggedIn={loggedIn && !viewer?.blocked} viewerId={viewer?.id ?? null} canModerate={access.canModerate} showGroup={false} />
              ))}
              <Pager page={page} totalPages={totalPages(feed.total, DEFAULT_PAGE_SIZE)} basePath={qs({ type })} />
            </div>
            <aside className="flex flex-col gap-4 text-sm">
              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <h2 className="flex items-center gap-2 text-sm font-semibold text-ink"><Users className="size-4 text-slate-500" /> About</h2>
                <p className="mt-2 whitespace-pre-wrap text-slate-700">{c.description || 'No description yet.'}</p>
                <p className="mt-3 text-xs text-slate-600">{KIND_LABEL[c.kind]} · {VISIBILITY_LABEL[c.visibility]} · created {formatDate(c.createdAt)}</p>
              </div>
              {c.kind === 'project' && c.goalId && <LinkedCampaign goalId={c.goalId} />}
              {access.role && <p className="rounded-2xl bg-brand/5 p-4 text-xs text-slate-700 ring-1 ring-inset ring-brand/15">Your role here: <strong className="text-ink">{ROLE_LABEL[access.role]}</strong>{viewer?.isAdmin && ' · NTL admin'}</p>}
            </aside>
          </div>
        )}

        {tab === 'members' && (
          <section className="mt-8 flex flex-col gap-6">
            {access.canModerate && pendingMembers.length > 0 && (
              <div className="rounded-2xl border border-amber-300 bg-white p-5 shadow-sm">
                <h2 className="text-base font-semibold text-ink">Join requests ({pendingMembers.length})</h2>
                <ul className="mt-3 flex flex-col gap-2">
                  {pendingMembers.map((m) => (
                    <li key={m.userId} className="flex flex-wrap items-center gap-3 rounded-lg border border-slate-200 p-3 text-sm">
                      <Link href={`/community/members/${m.ntlId}`} className="min-w-0 flex-1 font-medium text-ink hover:underline">{m.name} <span className="font-mono text-xs text-slate-600">{m.ntlId}</span></Link>
                      <ActionButton action={approveMember.bind(null, c.id, m.userId)} label="Approve" variant="primary" />
                      <ActionButton action={rejectMember.bind(null, c.id, m.userId)} label="Decline" />
                    </li>
                  ))}
                </ul>
              </div>
            )}
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <h2 className="text-base font-semibold text-ink">Members ({members.filter((m) => m.status !== 'pending').length})</h2>
              <ul className="mt-3 flex flex-col gap-2">
                {members.filter((m) => m.status !== 'pending').map((m) => {
                  const self = m.userId === viewer?.id
                  const actable = access.canModerate && !self && (m.role === 'member' || access.canLead)
                  return (
                    <li key={m.userId} className="flex flex-wrap items-center gap-3 rounded-lg border border-slate-200 p-3 text-sm">
                      <span className="min-w-0 flex-1">
                        <Link href={`/community/members/${m.ntlId}`} className="font-medium text-ink hover:underline">{m.name}</Link>
                        {m.verified && <BadgeCheck className="ml-1 inline size-3.5 text-brand-muted" aria-label="Verified contributor" />}
                        <span className="ml-2 font-mono text-xs text-slate-600">{m.ntlId}</span>
                        {m.status !== 'active' && <span className="ml-2 rounded-full bg-amber-100 px-2 py-0.5 text-xs text-amber-800">{m.status}{m.suspendedUntil && m.status === 'suspended' ? ` until ${formatDate(m.suspendedUntil)}` : ''}</span>}
                      </span>
                      {access.canLead && !self && m.status === 'active' ? <RoleSelect communityId={c.id} userId={m.userId} role={m.role} /> : <span className="text-xs text-slate-600">{ROLE_LABEL[m.role]}</span>}
                      {actable && m.status === 'active' && (
                        <>
                          <ActionButton action={warnMember.bind(null, c.id, m.userId)} label="Warn" promptLabel="Reason for the warning (the member will see it):" />
                          <ActionButton action={suspendMember.bind(null, c.id, m.userId, 7)} label="Suspend 7d" promptLabel="Reason for the 7-day suspension:" variant="danger" />
                          <ActionButton action={removeMember.bind(null, c.id, m.userId)} label="Remove" promptLabel="Reason for removal (optional):" variant="danger" />
                          <ActionButton action={banMember.bind(null, c.id, m.userId)} label="Ban" promptLabel="Reason for the ban:" variant="danger" />
                        </>
                      )}
                      {actable && (m.status === 'suspended' || m.status === 'banned') && <ActionButton action={liftRestriction.bind(null, c.id, m.userId)} label="Lift restriction" />}
                    </li>
                  )
                })}
                {members.length === 0 && <li className="text-sm text-slate-600">No members yet.</li>}
              </ul>
              {access.canLead && <AddMemberForm communityId={c.id} internal={internal} />}
            </div>
          </section>
        )}

        {tab === 'meetings' && <MeetingsTab community={c} viewer={viewer} access={access} />}
        {tab === 'tasks' && <TasksTab community={c} viewer={viewer} access={access} mine={sp.mine === '1'} />}
        {tab === 'resources' && <ResourcesTab community={c} access={access} />}

        {tab === 'moderation' && (
          <section className="mt-8 flex flex-col gap-8">
            <div>
              <h2 className="text-base font-semibold text-ink">Waiting for approval ({pending.length})</h2>
              <div className="mt-3 flex flex-col gap-4">
                {pending.length === 0 && <p className="text-sm text-slate-600">Nothing waiting.</p>}
                {pending.map((p) => <PostCard key={p.id} post={p} loggedIn viewerId={viewer?.id ?? null} canModerate detail showGroup={false} />)}
              </div>
            </div>
            <div>
              <h2 className="text-base font-semibold text-ink">Open reports ({reports.length})</h2>
              <ul className="mt-3 flex flex-col gap-3">
                {reports.length === 0 && <li className="text-sm text-slate-600">No open reports.</li>}
                {reports.map((r) => (
                  <li key={r.id} className="rounded-2xl border border-slate-200 bg-white p-4 text-sm shadow-sm">
                    <p className="text-xs text-slate-600">{r.reason.replace('_', ' ')} · {formatDate(r.createdAt)}{r.details ? ` · "${r.details}"` : ''}</p>
                    <p className="mt-2 line-clamp-4 whitespace-pre-wrap text-slate-800">{r.postId ? (r.postTitle ? `${r.postTitle}: ` : '') + (r.postBody ?? '') : r.commentBody}</p>
                    <div className="mt-3 flex flex-wrap items-center gap-2">
                      {r.postId && <Link href={`/community/post/${r.postId}`} className="text-xs font-medium text-brand-muted underline">Open post</Link>}
                      {r.postId && <ActionButton action={removePost.bind(null, r.postId)} label="Remove content" promptLabel="Why is this being removed? The author will see this." variant="danger" />}
                      {r.commentId && <ActionButton action={removeComment.bind(null, r.commentId)} label="Remove comment" promptLabel="Why is this being removed? The author will see this." variant="danger" />}
                      {r.targetUserId && <ActionButton action={warnMember.bind(null, c.id, r.targetUserId)} label="Warn author" promptLabel="Reason for the warning:" />}
                      <ActionButton action={closeReport.bind(null, r.id, 'dismissed')} label="Dismiss" promptLabel="Note (optional):" />
                      <ActionButton action={closeReport.bind(null, r.id, 'resolved')} label="Mark resolved" promptLabel="Note (optional):" />
                    </div>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h2 className="text-base font-semibold text-ink">Moderation log</h2>
              <ul className="mt-3 flex flex-col gap-2">
                {log.length === 0 && <li className="text-sm text-slate-600">No moderation actions yet.</li>}
                {log.map((l) => (
                  <li key={l.id} className="rounded-lg border border-slate-200 bg-white p-3 text-xs text-slate-700">
                    <span className="font-semibold text-ink">{MOD_ACTION_LABEL[l.action] ?? l.action}</span> · by {l.actorName ?? 'unknown'}{l.targetName ? ` · on ${l.targetName}` : ''} · {formatDate(l.createdAt)}
                    {l.reason && <span className="block text-slate-600">Reason: {l.reason}</span>}
                  </li>
                ))}
              </ul>
            </div>
          </section>
        )}
      </div>
    </SiteShell>
  )
}
