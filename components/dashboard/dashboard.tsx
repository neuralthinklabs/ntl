'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Award, CalendarDays, ClipboardList, Compass, HandHeart, LayoutDashboard, ListChecks, LogOut, ShieldCheck, Sparkles, Trophy, User } from 'lucide-react'
import { cn } from '@/lib/utils'
import { logout } from '@/actions/auth'
import { ROLE_LABELS } from '@/lib/roles'
import { DotGrid } from '@/components/brand/graphics'

const baseNav = [
  { label: 'Dashboard', icon: LayoutDashboard, href: '/dashboard' },
  { label: 'Profile', icon: User, href: '/profile' },
  { label: 'My problems', icon: ListChecks, href: '/problems/mine' },
  { label: 'My pledges', icon: HandHeart, href: '/contributions/mine' },
  { label: 'Events', icon: CalendarDays, href: '/events' },
  { label: 'The 12 goals', icon: Compass, href: '/ntldgs' },
  { label: 'Achievements', icon: Award, href: '/dashboard#achievements' },
  { label: 'Connected apps', icon: ShieldCheck, href: '/account/connected-apps' },
]

export type ActivityItem = { id: string; title: string; meta: string; date: string; type: string }
export type AchievementItem = { slug: string; title: string; description: string; earned: boolean }

export function Dashboard({
  name,
  points,
  problemsSubmitted,
  eventsAttended,
  achievements = [],
  activity,
  isAdmin = false,
  role = 'member',
  ntlId = '',
  isTeam = false,
  openAssignments = 0,
}: {
  name: string
  points: number
  problemsSubmitted: number
  eventsAttended: number
  achievements?: AchievementItem[]
  activity: ActivityItem[]
  isAdmin?: boolean
  role?: string
  ntlId?: string
  isTeam?: boolean
  openAssignments?: number
}) {
  const pathname = usePathname()
  const earnedCount = achievements.filter((a) => a.earned).length

  // Volunteers, core team and admins get a personal workspace link.
  const nav = isTeam
    ? [...baseNav.slice(0, 3), { label: 'My workspace', icon: ClipboardList, href: '/team' }, ...baseNav.slice(3)]
    : baseNav

  const stats = [
    { label: 'Total points', value: points.toLocaleString(), icon: Sparkles },
    { label: 'Problems submitted', value: String(problemsSubmitted), icon: ListChecks },
    { label: 'Events attended', value: String(eventsAttended), icon: CalendarDays },
    { label: 'Achievements', value: `${earnedCount}/${achievements.length}`, icon: Trophy },
  ]

  const initials = name.split(' ').map((p) => p[0]).filter(Boolean).slice(0, 2).join('').toUpperCase()

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <div className="grid gap-8 lg:grid-cols-[240px_1fr]">
        <aside className="flex flex-col gap-6">
          <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <span className="flex size-11 items-center justify-center rounded-full bg-brand text-sm font-semibold text-brand-foreground">{initials || 'U'}</span>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-ink">{name}</p>
              <p className="truncate text-xs text-slate-600">{ROLE_LABELS[role] ?? (isAdmin ? 'Admin' : 'Member')}</p>
              {ntlId && <p className="truncate font-mono text-[11px] text-slate-600">{ntlId}</p>}
            </div>
          </div>

          <nav aria-label="Account" className="flex flex-col gap-1">
            {nav.map((n) => {
              const active = n.href === pathname
              return (
                <Link
                  key={n.label}
                  href={n.href}
                  aria-current={active ? 'page' : undefined}
                  className={cn('flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors', active ? 'bg-brand/10 text-ink' : 'text-slate-600 hover:bg-white hover:text-ink')}
                >
                  <n.icon className={cn('size-4', active ? 'text-brand-muted' : 'text-slate-500')} />
                  {n.label}
                  {n.href === '/team' && openAssignments > 0 && (
                    <span className="ml-auto rounded-full bg-brand px-2 py-0.5 text-xs font-semibold text-brand-foreground">{openAssignments}</span>
                  )}
                </Link>
              )
            })}
            <form action={logout}>
              <button type="submit" className="mt-2 flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm font-medium text-slate-600 transition-colors hover:bg-white hover:text-ink">
                <LogOut className="size-4 text-slate-500" />
                Log out
              </button>
            </form>
          </nav>

          {isAdmin && (
            <div className="border-t border-slate-200 pt-4">
              <Link href="/admin" className="flex items-center gap-3 rounded-lg bg-ink px-3 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-ink/90">
                <ShieldCheck className="size-4 text-brand" /> Admin portal
              </Link>
            </div>
          )}
        </aside>

        <div>
          <div className="relative overflow-hidden rounded-2xl bg-ink p-6 text-white sm:p-8 [&>:not([aria-hidden])]:relative">
            <div aria-hidden className="bg-hero-glow absolute inset-0" />
            <DotGrid className="absolute inset-0 text-white/10 [mask-image:linear-gradient(to_right,black,transparent_70%)]" />
            <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">Welcome back, {name}</h1>
            <p className="mt-1 text-sm text-white/70">
              {isTeam && openAssignments > 0
                ? `You have ${openAssignments} open assignment${openAssignments === 1 ? '' : 's'} in your workspace.`
                : 'Here is your activity at a glance.'}
            </p>
            {isTeam && openAssignments > 0 && (
              <Link href="/team" className="mt-4 inline-flex rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-brand-foreground hover:bg-brand/90">
                Open my workspace
              </Link>
            )}
          </div>

          <div className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
            {stats.map((s) => (
              <div key={s.label} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <span className="inline-flex size-9 items-center justify-center rounded-lg bg-brand/10 text-brand-muted">
                  <s.icon className="size-4" />
                </span>
                <p className="mt-3 text-2xl font-semibold text-ink">{s.value}</p>
                <p className="mt-0.5 text-xs font-medium text-slate-600">{s.label}</p>
              </div>
            ))}
          </div>

          <h2 className="mt-8 text-sm font-semibold uppercase tracking-wide text-slate-600">Recent activity</h2>
          <div className="mt-4 flex flex-col gap-3">
            {activity.length === 0 && (
              <p className="rounded-2xl border border-dashed border-slate-300 bg-white p-6 text-center text-sm text-slate-600">
                No activity yet. Submit a problem or join an event to get started.
              </p>
            )}
            {activity.map((a) => (
              <div key={a.id} className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                <span className="inline-flex size-10 items-center justify-center rounded-xl bg-brand/10 text-brand-muted ring-1 ring-inset ring-brand/15">
                  <Sparkles className="size-5" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-ink">{a.title}</p>
                  <p className="text-xs text-slate-600">{a.meta}</p>
                </div>
                <span className="shrink-0 text-xs text-slate-600">{a.date}</span>
              </div>
            ))}
          </div>

          {achievements.length > 0 && (
            <>
              <h2 id="achievements" className="mt-10 scroll-mt-24 text-sm font-semibold uppercase tracking-wide text-slate-600">
                Achievements
              </h2>
              <ul className="mt-4 grid gap-3 sm:grid-cols-2">
                {achievements.map((a) => (
                  <li
                    key={a.slug}
                    className={cn(
                      'flex items-start gap-3 rounded-2xl border p-4',
                      a.earned ? 'border-brand/30 bg-white shadow-sm' : 'border-dashed border-slate-300 bg-white/60',
                    )}
                  >
                    <span className={cn('inline-flex size-10 shrink-0 items-center justify-center rounded-xl', a.earned ? 'bg-brand/10 text-brand-muted' : 'bg-slate-100 text-slate-500')}>
                      <Trophy className="size-5" />
                    </span>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-ink">
                        {a.title}
                        <span className="sr-only">{a.earned ? ' (earned)' : ' (locked)'}</span>
                      </p>
                      <p className="mt-0.5 text-xs text-slate-600">{a.description}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
