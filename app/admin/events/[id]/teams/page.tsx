import Link from 'next/link'
import { notFound } from 'next/navigation'
import { asc, eq } from 'drizzle-orm'
import { db } from '@/db'
import { events, eventSubmissions, eventTeamMembers, eventTeams, profiles } from '@/db/schema'
import { AdminHeader, EmptyState } from '@/components/admin/admin-header'

export const metadata = { title: 'Teams and submissions' }
export const dynamic = 'force-dynamic'

export default async function TeamsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound()
  const ev = await db.query.events.findFirst({ where: eq(events.id, id) })
  if (!ev) notFound()

  const [teams, members, subs] = await Promise.all([
    db.select().from(eventTeams).where(eq(eventTeams.eventId, id)).orderBy(asc(eventTeams.createdAt)),
    db
      .select({ teamId: eventTeamMembers.teamId, name: profiles.fullName, email: profiles.email, ntlId: profiles.ntlId })
      .from(eventTeamMembers)
      .innerJoin(profiles, eq(eventTeamMembers.userId, profiles.id))
      .where(eq(eventTeamMembers.eventId, id)),
    db.select().from(eventSubmissions).where(eq(eventSubmissions.eventId, id)),
  ])
  const subBy = new Map(subs.map((s) => [s.teamId, s]))
  const link = (label: string, url: string | null) =>
    url ? (
      <a href={url} target="_blank" rel="noopener noreferrer" className="font-medium text-brand-muted underline">{label}</a>
    ) : null

  return (
    <>
      <AdminHeader title={`Teams: ${ev.title}`} description={`${teams.length} team${teams.length === 1 ? '' : 's'}, ${subs.length} submission${subs.length === 1 ? '' : 's'}.`} />
      <div className="flex flex-col gap-4">
        {teams.map((t) => {
          const mine = members.filter((m) => m.teamId === t.id)
          const s = subBy.get(t.id)
          return (
            <div key={t.id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <h3 className="text-sm font-semibold text-ink">{t.name}</h3>
                <span className="font-mono text-xs text-slate-600">code {t.inviteCode} · {mine.length} member{mine.length === 1 ? '' : 's'}</span>
              </div>
              <ul className="mt-2 text-xs text-slate-700">
                {mine.map((m) => (
                  <li key={m.ntlId}>{m.name || m.ntlId} · {m.email}</li>
                ))}
              </ul>
              {s ? (
                <div className="mt-3 rounded-lg bg-slate-50 p-3 text-sm">
                  <p className="font-medium text-ink">{s.title}</p>
                  <p className="mt-1 whitespace-pre-wrap text-slate-700">{s.description}</p>
                  <p className="mt-2 flex flex-wrap gap-4 text-xs">{link('Repository', s.repoUrl)}{link('Demo', s.demoUrl)}{link('Video', s.videoUrl)}</p>
                </div>
              ) : (
                <p className="mt-3 text-xs text-slate-600">No submission yet.</p>
              )}
            </div>
          )
        })}
        {teams.length === 0 && <EmptyState>No teams yet.</EmptyState>}
      </div>
      <p className="mt-6 text-sm"><Link href={`/admin/events/${id}`} className="font-medium text-brand-muted underline">Back to the event</Link></p>
    </>
  )
}
