import { CalendarDays, MapPin, Video } from 'lucide-react'
import { ActionButton } from './action-button'
import { MinutesForm, RsvpButtons, ScheduleMeetingForm } from './meeting-forms'
import { cancelMeeting } from '@/actions/meetings'
import { getMeetings } from '@/lib/collab/queries'
import { formatEventWhen } from '@/lib/events'
import type { Access, Community, Viewer } from '@/lib/community/authz'

type Meeting = Awaited<ReturnType<typeof getMeetings>>[number]

function Card({ m, canModerate, canInteract, past }: { m: Meeting; canModerate: boolean; canInteract: boolean; past: boolean }) {
  const cancelled = m.status === 'cancelled'
  return (
    <li className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <h3 className="text-base font-semibold text-ink">{m.title}</h3>
        {cancelled && <span className="rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-medium text-red-700">Cancelled</span>}
      </div>
      <ul className="mt-2 flex flex-col gap-1 text-sm text-slate-700">
        <li className="flex items-start gap-2"><CalendarDays className="mt-0.5 size-4 shrink-0 text-slate-500" />{formatEventWhen(m)}</li>
        {m.location && <li className="flex items-start gap-2"><MapPin className="mt-0.5 size-4 shrink-0 text-slate-500" />{m.location}</li>}
        {m.meetingUrl && m.meetingUrl.startsWith('https://') && !cancelled && (
          <li className="flex items-start gap-2"><Video className="mt-0.5 size-4 shrink-0 text-slate-500" /><a href={m.meetingUrl} target="_blank" rel="noopener noreferrer" className="font-medium text-brand-muted underline">Join the meeting</a></li>
        )}
      </ul>
      {m.description && <p className="mt-3 whitespace-pre-wrap text-sm text-slate-700">{m.description}</p>}
      {m.agenda && <div className="mt-3 rounded-lg bg-slate-50 p-3 text-sm text-slate-700"><p className="text-xs font-semibold uppercase tracking-wide text-slate-600">Agenda</p><p className="mt-1 whitespace-pre-wrap">{m.agenda}</p></div>}
      {cancelled && m.cancelReason && <p className="mt-3 text-sm text-slate-700">Reason: {m.cancelReason}</p>}
      {!cancelled && !past && (
        <div className="mt-4 flex flex-wrap items-center gap-4">
          {canInteract && <RsvpButtons meetingId={m.id} mine={m.mine} />}
          <span className="text-xs text-slate-600">{m.going} going · {m.maybe} maybe</span>
          {canModerate && <ActionButton action={cancelMeeting.bind(null, m.id)} label="Cancel meeting" promptLabel="Reason for cancelling (members who RSVPed will see it):" variant="danger" />}
        </div>
      )}
      {!cancelled && past && (canModerate || m.minutes) && (
        <div className="mt-3 border-t border-slate-200 pt-3">
          {canModerate ? <MinutesForm meetingId={m.id} initial={m.minutes ?? ''} /> : (
            <><p className="text-xs font-semibold uppercase tracking-wide text-slate-600">Minutes</p><p className="mt-1 whitespace-pre-wrap text-sm text-slate-700">{m.minutes}</p></>
          )}
        </div>
      )}
    </li>
  )
}

export async function MeetingsTab({ community, viewer, access }: { community: Community; viewer: Viewer | null; access: Access }) {
  const meetings = await getMeetings(community.id, viewer?.id ?? null)
  const now = Date.now()
  const endOf = (m: Meeting) => (m.endsAt ?? new Date(m.startsAt.getTime() + 3_600_000)).getTime()
  const upcoming = meetings.filter((m) => m.status === 'scheduled' && endOf(m) >= now).sort((a, b) => a.startsAt.getTime() - b.startsAt.getTime())
  const past = meetings.filter((m) => !(m.status === 'scheduled' && endOf(m) >= now))
  const archived = !!community.archivedAt
  return (
    <section className="mt-8 flex flex-col gap-8">
      {access.canModerate && !archived && <ScheduleMeetingForm communityId={community.id} />}
      <div>
        <h2 className="text-base font-semibold text-ink">Upcoming ({upcoming.length})</h2>
        <ul className="mt-3 flex flex-col gap-4">
          {upcoming.length === 0 && <li className="text-sm text-slate-600">No meetings scheduled.</li>}
          {upcoming.map((m) => <Card key={m.id} m={m} canModerate={access.canModerate && !archived} canInteract={access.canInteract} past={false} />)}
        </ul>
      </div>
      {past.length > 0 && (
        <div>
          <h2 className="text-base font-semibold text-ink">Past and cancelled</h2>
          <ul className="mt-3 flex flex-col gap-4">
            {past.map((m) => <Card key={m.id} m={m} canModerate={access.canModerate && !archived} canInteract={false} past />)}
          </ul>
        </div>
      )}
    </section>
  )
}
