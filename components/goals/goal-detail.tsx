'use client'

import { useState } from 'react'
import {
  CalendarRange,
  Check,
  CircleDot,
  Circle,
  Target,
  Users,
} from 'lucide-react'
import { SectionLabel } from '@/components/site/ui'
import { cn } from '@/lib/utils'

const tabs = ['Overview', 'Updates', 'Milestones', 'Team']

export type GoalMilestone = { id: string; name: string; status: string }
export type GoalUpdate = { id: string; title: string; body: string; createdAt: string }

export function GoalDetail({
  problemSummary,
  objective,
  responsibleTeam,
  timeline,
  fundingTarget,
  milestones,
  updates,
}: {
  problemSummary: string
  objective: string
  responsibleTeam: string
  timeline: string
  fundingTarget: string
  milestones: GoalMilestone[]
  updates: GoalUpdate[]
}) {
  const [tab, setTab] = useState('Overview')

  return (
    <div>
      <div className="flex gap-1 overflow-x-auto border-b border-slate-200">
        {tabs.map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={cn(
              '-mb-px whitespace-nowrap border-b-2 px-4 py-3 text-sm font-medium transition-colors',
              tab === t
                ? 'border-brand text-ink'
                : 'border-transparent text-slate-500 hover:text-ink',
            )}
          >
            {t}
          </button>
        ))}
      </div>

      <div className="mt-8">
        {tab === 'Overview' && (
          <div className="flex flex-col gap-10">
            <div>
              <SectionLabel>The Problem</SectionLabel>
              <p className="mt-3 max-w-2xl text-sm leading-relaxed text-slate-600">
                {problemSummary || 'Details coming soon.'}
              </p>
            </div>
            <div>
              <SectionLabel>Our Objective</SectionLabel>
              <p className="mt-3 max-w-2xl text-sm leading-relaxed text-slate-600">
                {objective || 'Details coming soon.'}
              </p>
            </div>
            <div className="grid gap-4 sm:grid-cols-3">
              <InfoCard icon={Users} label="Responsible Team" value={responsibleTeam || '—'} />
              <InfoCard icon={CalendarRange} label="Timeline" value={timeline || '—'} />
              <InfoCard icon={Target} label="Funding Target" value={fundingTarget} />
            </div>
          </div>
        )}

        {tab === 'Updates' && (
          <div className="flex flex-col gap-4">
            {updates.length === 0 && (
              <p className="rounded-2xl border border-dashed border-slate-200 bg-white p-6 text-center text-sm text-slate-500">
                No updates posted yet.
              </p>
            )}
            {updates.map((u) => (
              <article key={u.id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <p className="text-xs font-medium text-slate-400">{u.createdAt}</p>
                <h3 className="mt-1 text-base font-semibold text-ink">{u.title}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-slate-500">{u.body}</p>
              </article>
            ))}
          </div>
        )}

        {tab === 'Milestones' && (
          <ol className="flex flex-col gap-2">
            {milestones.length === 0 && (
              <p className="rounded-2xl border border-dashed border-slate-200 bg-white p-6 text-center text-sm text-slate-500">
                No milestones added yet.
              </p>
            )}
            {milestones.map((m, i) => (
              <li key={m.id} className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-slate-100 text-xs font-semibold text-slate-500">
                  {i + 1}
                </span>
                <span className="flex-1 text-sm font-medium text-ink">{m.name}</span>
                <MilestoneStatus status={m.status} />
              </li>
            ))}
          </ol>
        )}

        {tab === 'Team' && (
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <span className="inline-flex size-10 items-center justify-center rounded-xl bg-brand/10 text-brand-muted ring-1 ring-inset ring-brand/15">
                <Users className="size-5" />
              </span>
              <h3 className="mt-3 text-sm font-semibold text-ink">{responsibleTeam || 'Team not yet assigned'}</h3>
              <p className="mt-0.5 text-xs text-slate-500">Responsible team</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function InfoCard({ icon: Icon, label, value }: { icon: typeof Users; label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <span className="inline-flex size-9 items-center justify-center rounded-lg bg-brand/10 text-brand-muted">
        <Icon className="size-4" />
      </span>
      <p className="mt-3 text-xs font-medium uppercase tracking-wide text-slate-400">{label}</p>
      <p className="mt-0.5 text-sm font-semibold text-ink">{value}</p>
    </div>
  )
}

function MilestoneStatus({ status }: { status: string }) {
  if (status === 'completed')
    return (
      <span className="inline-flex items-center gap-1.5 text-xs font-medium text-brand-muted">
        <Check className="size-4" /> Completed
      </span>
    )
  if (status === 'in_progress')
    return (
      <span className="inline-flex items-center gap-1.5 text-xs font-medium text-amber-600">
        <CircleDot className="size-4" /> In Progress
      </span>
    )
  return (
    <span className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-400">
      <Circle className="size-4" /> Upcoming
    </span>
  )
}
