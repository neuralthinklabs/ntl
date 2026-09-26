'use client'

import { useState } from 'react'
import {
  Award,
  BookOpen,
  CalendarDays,
  HandHeart,
  LayoutDashboard,
  ListChecks,
  LogOut,
  Mail,
  Settings,
  ShieldCheck,
  Sparkles,
  Trophy,
  User,
} from 'lucide-react'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import { logout } from '@/actions/auth'

const nav = [
  { label: 'Dashboard', icon: LayoutDashboard, href: '/dashboard' },
  { label: 'Profile', icon: User, href: '/profile' },
  { label: 'My Problems', icon: ListChecks, href: '/problems/mine' },
  { label: 'Events', icon: CalendarDays, href: '/events' },
  { label: 'Learning', icon: BookOpen, href: '/portfolio' },
  { label: 'Contributions', icon: HandHeart, href: '/support' },
  // Points at the Achievements stat card below (id="achievements") rather
  // than routing to a page that doesn't exist yet — previously this and
  // "Settings" both silently pointed at other pages and read as broken.
  { label: 'Achievements', icon: Award, href: '/dashboard#achievements' },
  { label: 'Settings', icon: Settings, href: '/profile' },
]

const adminNav = [
  { label: 'Review Problems', icon: ShieldCheck, href: '/admin/problems' },
  { label: 'Review Contact', icon: Mail, href: '/admin/contact' },
]

export type ActivityItem = {
  id: string
  title: string
  meta: string
  date: string
  type: string
}

export function Dashboard({
  name,
  points,
  problemsSubmitted,
  eventsAttended,
  achievementsCount,
  activity,
  isAdmin = false,
}: {
  name: string
  points: number
  problemsSubmitted: number
  eventsAttended: number
  achievementsCount: number
  activity: ActivityItem[]
  isAdmin?: boolean
}) {
  const [active, setActive] = useState('Dashboard')

  const stats = [
    { label: 'Total Points', value: points.toLocaleString(), icon: Sparkles },
    { label: 'Problems Submitted', value: String(problemsSubmitted), icon: ListChecks },
    { label: 'Events Attended', value: String(eventsAttended), icon: CalendarDays },
    { label: 'Achievements', value: String(achievementsCount), icon: Trophy },
  ]

  const initials = name
    .split(' ')
    .map((p) => p[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase()

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <div className="grid gap-8 lg:grid-cols-[240px_1fr]">
        <aside className="flex flex-col gap-6">
          <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <span className="flex size-11 items-center justify-center rounded-full bg-brand text-sm font-semibold text-brand-foreground">
              {initials || 'U'}
            </span>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-ink">{name}</p>
              <p className="truncate text-xs text-slate-500">Member</p>
            </div>
          </div>

          <nav className="flex flex-col gap-1">
            {nav.map((n) => (
              <Link
                key={n.label}
                href={n.href}
                onClick={() => setActive(n.label)}
                className={cn(
                  'flex items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm font-medium transition-colors',
                  active === n.label
                    ? 'bg-brand/10 text-ink'
                    : 'text-slate-500 hover:bg-slate-50 hover:text-ink',
                )}
              >
                <n.icon
                  className={cn(
                    'size-4',
                    active === n.label ? 'text-brand-muted' : 'text-slate-400',
                  )}
                />
                {n.label}
              </Link>
            ))}
            <form action={logout}>
              <button
                type="submit"
                className="mt-2 flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm font-medium text-slate-500 transition-colors hover:bg-slate-50 hover:text-ink"
              >
                <LogOut className="size-4 text-slate-400" />
                Log out
              </button>
            </form>
          </nav>

          {isAdmin && (
            <nav className="flex flex-col gap-1 border-t border-slate-200 pt-4">
              <p className="px-3 pb-1 text-xs font-medium uppercase tracking-wide text-slate-400">
                Admin
              </p>
              {adminNav.map((n) => (
                <Link
                  key={n.label}
                  href={n.href}
                  className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm font-medium text-slate-500 transition-colors hover:bg-slate-50 hover:text-ink"
                >
                  <n.icon className="size-4 text-slate-400" />
                  {n.label}
                </Link>
              ))}
            </nav>
          )}
        </aside>

        <main>
          <div className="rounded-2xl bg-ink p-6 text-white sm:p-8">
            <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">
              Welcome back, {name}
            </h1>
            <p className="mt-1 text-sm text-white/60">
              Here is your activity at a glance.
            </p>
          </div>

          <div className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
            {stats.map((s) => (
              <div
                key={s.label}
                id={s.label === 'Achievements' ? 'achievements' : undefined}
                className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm scroll-mt-24"
              >
                <span className="inline-flex size-9 items-center justify-center rounded-lg bg-brand/10 text-brand-muted">
                  <s.icon className="size-4" />
                </span>
                <p className="mt-3 text-2xl font-semibold text-ink">
                  {s.value}
                </p>
                <p className="mt-0.5 text-xs font-medium text-slate-500">
                  {s.label}
                </p>
              </div>
            ))}
          </div>

          <div className="mt-8">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
              Recent Activity
            </h2>
            <div className="mt-4 flex flex-col gap-3">
              {activity.length === 0 && (
                <p className="rounded-2xl border border-dashed border-slate-200 bg-white p-6 text-center text-sm text-slate-500">
                  No activity yet — submit a problem or join an event to get
                  started.
                </p>
              )}
              {activity.map((a) => (
                <div
                  key={a.id}
                  className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
                >
                  <span className="inline-flex size-10 items-center justify-center rounded-xl bg-brand/10 text-brand-muted ring-1 ring-inset ring-brand/15">
                    <Sparkles className="size-5" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-ink">{a.title}</p>
                    <p className="text-xs text-slate-500">{a.meta}</p>
                  </div>
                  <span className="shrink-0 text-xs text-slate-400">
                    {a.date}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
